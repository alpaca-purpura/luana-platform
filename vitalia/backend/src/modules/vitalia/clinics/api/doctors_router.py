# cap: clinics.lisa.doctores
"""Doctors API router — FastAPI thin layer.

Routes (all under prefix /api/v1/vitalia/clinics/doctors):
  GET  /                         — list doctors (masked, paginated)
  POST /                         — create doctor (validate credential, 409 if DNI dup)
  GET  /{id}                     — get doctor detail (admin_clinic only)
  PATCH /{id}                    — patch doctor (bio/active/visible/avatar_key)

Architecture rules (03-arch-be.md § 4 + ADR-vitalia-004):
  - response_model= MANDATORY on all routes (arch test enforces)
  - X-Tenant-ID + X-User-ID + X-User-Role headers required
  - No business logic in router — delegate to DoctorService
  - Map domain exceptions: DniConflictError → 409, CredentialValidationError → 422
  - PHI never in URL params (hipaa-lite.md § Anti-patterns)
  - redirect_slashes=False enforced at app level in main.py
  - RBAC: admin_clinic role required for mutations (require_brand_owner_access)
"""

from __future__ import annotations

from uuid import UUID

import structlog
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.vitalia._shared.auth.rbac import require_brand_owner_access
from src.modules.vitalia._shared.phi_masking import mask_dni, mask_email, mask_phone
from src.modules.vitalia._shared.repositories.audit_log_repository import AuditLogRepository
from src.modules.vitalia._shared.telemetry.growth_studio_emitter import GrowthStudioEmitter
from src.modules.vitalia.clinics.api.dtos import (
    BioPublicDTO,
    DoctorCreateRequest,
    DoctorDetailDTO,
    DoctorListItemDTO,
    DoctorListResponse,
    DoctorPatchRequest,
)
from src.modules.vitalia.clinics.application.credential_validator import CredentialValidationError
from src.modules.vitalia.clinics.application.doctor_service import DniConflictError, DoctorService
from src.modules.vitalia.clinics.domain.bio import BioPublic
from src.modules.vitalia.clinics.domain.doctor import Doctor
from src.modules.vitalia.clinics.infrastructure.repositories.doctor_repository import (
    DoctorRepository,
)

logger = structlog.get_logger()

router = APIRouter(tags=["staff"])

# Allowed roles for mutations (admin_clinic only — see hipaa-lite.md § RBAC)
_ADMIN_CLINIC_ROLES: frozenset[str] = frozenset(["admin_clinic"])


async def _get_db() -> AsyncSession:
    """Async DB session dependency."""
    from luana_core_platform.core.database import get_db  # noqa: PLC0415

    async for session in get_db():
        yield session


def _build_service(db: AsyncSession) -> DoctorService:
    """Build DoctorService with injected repos."""
    repo = DoctorRepository(session=db)
    audit = AuditLogRepository(session=db)
    emitter = GrowthStudioEmitter(session=db)
    return DoctorService(doctor_repo=repo, audit_repo=audit, emitter=emitter)


def _to_detail_dto(doctor: Doctor) -> DoctorDetailDTO:
    """Map Doctor domain entity → DoctorDetailDTO."""
    bio_dto = None
    if doctor.bio_public is not None:
        bio_dto = BioPublicDTO(
            resumen=doctor.bio_public.resumen,
            formacion=doctor.bio_public.formacion,
            enfoque=doctor.bio_public.enfoque,
        )
    return DoctorDetailDTO(
        id=doctor.id,
        tenant_id=doctor.tenant_id,
        clinic_id=doctor.clinic_id,
        first_name=doctor.first_name,
        last_name=doctor.last_name,
        display_name=doctor.display_name,
        dni=doctor.dni,
        email=doctor.email,
        phone=doctor.phone,
        specialty=doctor.specialty,
        credential=doctor.credential,
        credential_country=doctor.credential_country,
        years_experience=doctor.years_experience,
        languages=doctor.languages,
        bio_inputs_notes=doctor.bio_inputs_notes,
        bio_links=doctor.bio_links,
        bio_public=bio_dto,
        avatar_key=doctor.avatar_key,
        visible_en_landing=doctor.visible_en_landing,
        active=doctor.active,
        created_at=doctor.created_at,
        updated_at=doctor.updated_at,
    )


def _to_list_item(doctor: Doctor) -> DoctorListItemDTO:
    """Map Doctor domain entity → DoctorListItemDTO (PHI masked)."""
    return DoctorListItemDTO(
        id=doctor.id,
        tenant_id=doctor.tenant_id,
        clinic_id=doctor.clinic_id,
        display_name=doctor.display_name,
        specialty=doctor.specialty,
        active=doctor.active,
        visible_en_landing=doctor.visible_en_landing,
        years_experience=doctor.years_experience,
        languages=doctor.languages,
        avatar_key=doctor.avatar_key,
        masked_dni=mask_dni(doctor.dni) if doctor.dni else None,
        masked_email=mask_email(doctor.email) if doctor.email else None,
        masked_phone=mask_phone(doctor.phone) if doctor.phone else None,
        created_at=doctor.created_at,
    )


@router.get("/", response_model=DoctorListResponse)
async def list_doctors(
    tenant_id: str = Header(alias="X-Tenant-ID"),
    clinic_id: str = Header(alias="X-Clinic-ID"),
    specialty: str | None = Query(default=None),
    active: bool | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=24, ge=1, le=100),
    db: AsyncSession = Depends(_get_db),
) -> DoctorListResponse:
    """List all doctors for a clinic — paginated, PHI masked.

    SC-6: list scoped to tenant+clinic (dual filter).
    SC-9: large dataset — server-side pagination.
    """
    service = _build_service(db)
    doctors, total = await service.list_doctors(
        tenant_id=UUID(tenant_id),
        clinic_id=UUID(clinic_id),
        specialty=specialty,
        active=active,
        page=page,
        page_size=page_size,
    )
    items = [_to_list_item(d) for d in doctors]
    return DoctorListResponse(items=items, total=total, page=page, page_size=page_size)


@router.post(
    "/",
    response_model=DoctorDetailDTO,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_brand_owner_access(roles=_ADMIN_CLINIC_ROLES))],
)
async def create_doctor(
    request: DoctorCreateRequest,
    tenant_id: str = Header(alias="X-Tenant-ID"),
    clinic_id: str = Header(alias="X-Clinic-ID"),
    user_id: str = Header(alias="X-User-ID"),
    db: AsyncSession = Depends(_get_db),
) -> DoctorDetailDTO:
    """Create a new doctor in the clinic staff directory.

    SC-2: invalid credential → 422 with Spanish neutro error message.
    SC-5: duplicate DNI → 409 Conflict.
    """
    service = _build_service(db)
    try:
        doctor = await service.create_doctor(
            tenant_id=UUID(tenant_id),
            clinic_id=UUID(clinic_id),
            user_id=UUID(user_id),
            first_name=request.first_name,
            last_name=request.last_name,
            dni=request.dni,
            email=request.email,
            phone=request.phone,
            specialty=request.specialty,
            credential=request.credential,
            credential_country=request.credential_country,
            years_experience=request.years_experience,
            languages=request.languages,
        )
    except CredentialValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": "credential_invalid", "field": exc.field, "message": exc.message},
        ) from exc
    except DniConflictError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": "dni_conflict", "message": exc.message},
        ) from exc

    await db.commit()
    return _to_detail_dto(doctor)


@router.get("/{doctor_id}", response_model=DoctorDetailDTO)
async def get_doctor(
    doctor_id: UUID,
    tenant_id: str = Header(alias="X-Tenant-ID"),
    clinic_id: str = Header(alias="X-Clinic-ID"),
    user_id: str = Header(alias="X-User-ID"),
    db: AsyncSession = Depends(_get_db),
) -> DoctorDetailDTO:
    """Get doctor detail (admin_clinic role required).

    SC-4: cross-tenant access → 404 generic (audit written internally).
    """
    service = _build_service(db)
    doctor = await service.get_doctor(
        doctor_id=doctor_id,
        tenant_id=UUID(tenant_id),
        clinic_id=UUID(clinic_id),
        user_id=UUID(user_id),
    )
    if doctor is None:
        await db.commit()  # flush audit log entry
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "doctor_not_found", "message": "Médico no encontrado."},
        )
    await db.commit()
    return _to_detail_dto(doctor)


@router.patch(
    "/{doctor_id}",
    response_model=DoctorDetailDTO,
    dependencies=[Depends(require_brand_owner_access(roles=_ADMIN_CLINIC_ROLES))],
)
async def patch_doctor(
    doctor_id: UUID,
    request: DoctorPatchRequest,
    tenant_id: str = Header(alias="X-Tenant-ID"),
    clinic_id: str = Header(alias="X-Clinic-ID"),
    user_id: str = Header(alias="X-User-ID"),
    db: AsyncSession = Depends(_get_db),
) -> DoctorDetailDTO:
    """Patch doctor mutable fields (bio, active, visible, avatar_key).

    Autosave-friendly: accepts partial payload.
    Audit: doctor.updated or doctor.deactivated.
    """
    # Map DTO bio to domain BioPublic if provided
    bio_public: BioPublic | None = None
    if request.bio_public is not None:
        bio_public = BioPublic(
            resumen=request.bio_public.resumen,
            formacion=request.bio_public.formacion,
            enfoque=request.bio_public.enfoque,
        )

    service = _build_service(db)
    doctor = await service.update_doctor(
        doctor_id=doctor_id,
        tenant_id=UUID(tenant_id),
        clinic_id=UUID(clinic_id),
        user_id=UUID(user_id),
        bio_inputs_notes=request.bio_inputs_notes,
        bio_links=request.bio_links,
        bio_public=bio_public,
        avatar_key=request.avatar_key,
        visible_en_landing=request.visible_en_landing,
        active=request.active,
        specialty=request.specialty,
        years_experience=request.years_experience,
        languages=request.languages,
    )
    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "doctor_not_found", "message": "Médico no encontrado."},
        )
    await db.commit()
    return _to_detail_dto(doctor)
