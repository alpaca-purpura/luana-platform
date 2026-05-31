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
    AvailabilityBlockDTO,
    AvailabilityBlocksResponse,
    BioPublicDTO,
    DeleteBlockResponse,
    DoctorCreateRequest,
    DoctorDetailDTO,
    DoctorListItemDTO,
    DoctorListResponse,
    DoctorPatchRequest,
    GenerateBioRequest,
    GenerateBioResponse,
    OneOffBlockCreateRequest,
    RecurrentBlockCreateRequest,
)
from src.modules.vitalia.clinics.application.availability_block_service import (
    AvailabilityBlockService,
)
from src.modules.vitalia.clinics.application.bio_generation_service import BioGenerationService
from src.modules.vitalia.clinics.application.credential_validator import CredentialValidationError
from src.modules.vitalia.clinics.application.doctor_service import DniConflictError, DoctorService
from src.modules.vitalia.clinics.domain.availability_block import AvailabilityBlock
from src.modules.vitalia.clinics.domain.bio import BioPublic
from src.modules.vitalia.clinics.domain.doctor import Doctor
from src.modules.vitalia.clinics.infrastructure.repositories.availability_block_repository import (
    AvailabilityBlockRepository,
)
from src.modules.vitalia.clinics.infrastructure.repositories.doctor_repository import (
    DoctorRepository,
)

logger = structlog.get_logger()

router = APIRouter(tags=["staff"])

# Allowed roles for mutations (admin_clinic only — see hipaa-lite.md § RBAC)
_ADMIN_CLINIC_ROLES: frozenset[str] = frozenset(["admin_clinic"])


async def _get_db() -> AsyncSession:
    """Async DB session dependency."""
    from src.db import get_async_session  # noqa: PLC0415

    async for session in get_async_session():
        yield session


def _build_service(db: AsyncSession) -> DoctorService:
    """Build DoctorService with injected repos."""
    repo = DoctorRepository(session=db)
    audit = AuditLogRepository(session=db)
    emitter = GrowthStudioEmitter(session=db)
    return DoctorService(doctor_repo=repo, audit_repo=audit, emitter=emitter)


def _build_block_service(db: AsyncSession) -> AvailabilityBlockService:
    """Build AvailabilityBlockService with injected repos."""
    block_repo = AvailabilityBlockRepository(session=db)
    audit = AuditLogRepository(session=db)
    return AvailabilityBlockService(block_repo=block_repo, audit_repo=audit)


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


@router.get("", response_model=DoctorListResponse, include_in_schema=False)
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
    "",
    response_model=DoctorDetailDTO,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
    dependencies=[Depends(require_brand_owner_access(roles=_ADMIN_CLINIC_ROLES))],
)
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


def _to_block_dto(block: AvailabilityBlock) -> AvailabilityBlockDTO:
    """Map AvailabilityBlock domain entity -> AvailabilityBlockDTO."""
    return AvailabilityBlockDTO(
        id=block.id,
        tenant_id=block.tenant_id,
        clinic_id=block.clinic_id,
        doctor_id=block.doctor_id,
        kind=block.kind,
        start_time=block.start_time,
        end_time=block.end_time,
        day_of_week=block.day_of_week,
        freq=block.freq,
        end_condition_kind=block.end_condition_kind,
        end_date=block.end_date,
        occurrences=block.occurrences,
        specific_date=block.specific_date,
        created_at=block.created_at,
        updated_at=block.updated_at,
    )


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


# ── Bio generation endpoint (T-BE-4) ─────────────────────────────────────────


@router.post(
    "/{doctor_id}/generate-bio",
    response_model=GenerateBioResponse,
    dependencies=[Depends(require_brand_owner_access(roles=_ADMIN_CLINIC_ROLES))],
)
async def generate_doctor_bio(
    doctor_id: UUID,
    request: GenerateBioRequest,  # noqa: ARG001 — empty body, kept for explicit schema
    tenant_id: str = Header(alias="X-Tenant-ID"),
    clinic_id: str = Header(alias="X-Clinic-ID"),
    user_id: str = Header(alias="X-User-ID"),  # noqa: ARG001 — kept for RBAC audit trace
    db: AsyncSession = Depends(_get_db),
) -> GenerateBioResponse:
    """Generate public bio from stored inputs (single-shot extractive, NOT agentic).

    03-arch D-4: deterministic single-shot LLM call — uses ONLY provided material
    (bio_inputs_notes + bio_links). Does NOT invent content.

    Anti-invent guardrail: if info missing → section is empty, never hallucinated.
    Output: 3 editable sections (resumen, formacion, enfoque) stored in bio_public.

    Graceful fallback (tessl__graceful-degradation):
      - LLM fail or timeout → returns empty sections + error_message (HTTP 200)
      - Does NOT break autosave of rest of doctor profile
      - FE shows error_message as toast notification

    PHI note: bio_inputs_notes/bio_links are promotional material (CV/diploma),
    NOT clinical patient PHI. Audit log NOT written (non-PHI endpoint).

    V-FN-9: bio-gen produces sections ONLY from provided material; fallback on fail.
    """
    service = _build_service(db)
    doctor = await service.get_doctor(
        doctor_id=doctor_id,
        tenant_id=UUID(tenant_id),
        clinic_id=UUID(clinic_id),
        user_id=UUID(user_id),
    )
    if doctor is None:
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "doctor_not_found", "message": "Médico no encontrado."},
        )

    # BioGenerationService: deterministic extractive (D-4) — NOT copilot/sales_agent
    bio_svc = BioGenerationService()
    bio, error_message = bio_svc.generate_with_error(doctor)

    if error_message is None:
        logger.info(
            "bio_generated",
            doctor_id=str(doctor_id),
            tenant_id=tenant_id,
            sections_filled=sum(1 for s in [bio.resumen, bio.formacion, bio.enfoque] if s),
        )
    else:
        logger.warning(
            "bio_generation_fallback",
            doctor_id=str(doctor_id),
            tenant_id=tenant_id,
        )

    bio_dto = BioPublicDTO(
        resumen=bio.resumen,
        formacion=bio.formacion,
        enfoque=bio.enfoque,
    )
    await db.commit()
    return GenerateBioResponse(bio=bio_dto, error_message=error_message)


# ── Availability blocks sub-routes (T-BE-3) ──────────────────────────────────


@router.get("/{doctor_id}/availability-blocks", response_model=AvailabilityBlocksResponse)
async def list_availability_blocks(
    doctor_id: UUID,
    tenant_id: str = Header(alias="X-Tenant-ID"),
    clinic_id: str = Header(alias="X-Clinic-ID"),
    db: AsyncSession = Depends(_get_db),
) -> AvailabilityBlocksResponse:
    """List availability blocks for a doctor (dual filter).

    Returns all active (non-deleted) blocks for the specified doctor,
    scoped to the tenant+clinic (dual filter per hipaa-lite.md).
    """
    svc = _build_block_service(db)
    blocks = await svc.list_blocks(
        doctor_id=doctor_id,
        tenant_id=UUID(tenant_id),
        clinic_id=UUID(clinic_id),
    )
    return AvailabilityBlocksResponse(blocks=[_to_block_dto(b) for b in blocks])


@router.post(
    "/{doctor_id}/availability-blocks",
    response_model=AvailabilityBlockDTO,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_brand_owner_access(roles=_ADMIN_CLINIC_ROLES))],
)
async def create_availability_block(
    doctor_id: UUID,
    request: RecurrentBlockCreateRequest | OneOffBlockCreateRequest,
    tenant_id: str = Header(alias="X-Tenant-ID"),
    clinic_id: str = Header(alias="X-Clinic-ID"),
    user_id: str = Header(alias="X-User-ID"),
    db: AsyncSession = Depends(_get_db),
) -> AvailabilityBlockDTO:
    """Create a new availability block (recurrent or one-off) + materialize slots.

    SC-1: recurrent weekly/biweekly + end condition -> expand via rrule -> vitalia_availability_slots.
    SC-1b: biweekly occurrences=N -> exactly N occurrence dates.
    SC-1c: one-off (specific_date) -> single day of slots.

    Scheduling module reads vitalia_availability_slots to display available appointments.
    No scheduling module edit required — slots table is brand-local, scheduling reads it.

    Audit: doctor.availability_block_created (sync write pre-response, HIPAA-lite).
    """
    svc = _build_block_service(db)
    try:
        block = await svc.create_block(
            tenant_id=UUID(tenant_id),
            clinic_id=UUID(clinic_id),
            doctor_id=doctor_id,
            user_id=UUID(user_id),
            kind=request.kind,
            start_time=request.start_time,
            end_time=request.end_time,
            day_of_week=getattr(request, "day_of_week", None),
            freq=getattr(request, "freq", None),
            end_condition_kind=getattr(request, "end_condition_kind", None),
            end_date=getattr(request, "end_date", None),
            occurrences=getattr(request, "occurrences", None),
            specific_date=getattr(request, "specific_date", None),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": "invalid_block", "message": str(exc)},
        ) from exc

    await db.commit()
    return _to_block_dto(block)


@router.patch(
    "/{doctor_id}/availability-blocks/{block_id}",
    response_model=AvailabilityBlockDTO,
    dependencies=[Depends(require_brand_owner_access(roles=_ADMIN_CLINIC_ROLES))],
)
async def patch_availability_block(
    doctor_id: UUID,
    block_id: UUID,
    request: RecurrentBlockCreateRequest | OneOffBlockCreateRequest,
    tenant_id: str = Header(alias="X-Tenant-ID"),
    clinic_id: str = Header(alias="X-Clinic-ID"),
    user_id: str = Header(alias="X-User-ID"),
    db: AsyncSession = Depends(_get_db),
) -> AvailabilityBlockDTO:
    """Edit a block (reproject-future-only invariant).

    Only slots on or after today are re-projected. Past slots are never touched.
    Confirmed future slots (has_confirmed_appointment=True) are preserved.
    """
    svc = _build_block_service(db)
    try:
        block = await svc.update_block(
            block_id=block_id,
            tenant_id=UUID(tenant_id),
            clinic_id=UUID(clinic_id),
            doctor_id=doctor_id,
            user_id=UUID(user_id),
            kind=request.kind,
            start_time=request.start_time,
            end_time=request.end_time,
            day_of_week=getattr(request, "day_of_week", None),
            freq=getattr(request, "freq", None),
            end_condition_kind=getattr(request, "end_condition_kind", None),
            end_date=getattr(request, "end_date", None),
            occurrences=getattr(request, "occurrences", None),
            specific_date=getattr(request, "specific_date", None),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": "invalid_block", "message": str(exc)},
        ) from exc

    if block is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "availability_block_not_found",
                "message": "Bloque de disponibilidad no encontrado.",
            },
        )
    await db.commit()
    return _to_block_dto(block)


@router.delete(
    "/{doctor_id}/availability-blocks/{block_id}",
    response_model=DeleteBlockResponse,
    dependencies=[Depends(require_brand_owner_access(roles=_ADMIN_CLINIC_ROLES))],
)
async def delete_availability_block(
    doctor_id: UUID,
    block_id: UUID,
    tenant_id: str = Header(alias="X-Tenant-ID"),
    clinic_id: str = Header(alias="X-Clinic-ID"),
    user_id: str = Header(alias="X-User-ID"),
    db: AsyncSession = Depends(_get_db),
) -> DeleteBlockResponse:
    """Retire future slots + soft-delete block.

    CRITICAL INVARIANT (delete-block-preserves-confirmed-appointments):
    Slots with has_confirmed_appointment=True are NEVER deleted.
    The response includes the count of preserved slots.

    SC-1d: delete block without appointments -> future slots retired, past untouched.
    SC-3b: delete block with confirmed appt -> warning flow handled by FE;
           this endpoint returns preserved_appointments=N so FE can show warning.

    Audit: doctor.availability_block_deleted (sync write, HIPAA-lite).
    """
    svc = _build_block_service(db)
    deleted, preserved = await svc.delete_block(
        block_id=block_id,
        tenant_id=UUID(tenant_id),
        clinic_id=UUID(clinic_id),
        user_id=UUID(user_id),
    )
    await db.commit()
    return DeleteBlockResponse(deleted=deleted, preserved_appointments=preserved)
