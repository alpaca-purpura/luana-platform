"""Vitalia CRM API router — patients and leads endpoints.

API layer — thin: validate headers → resolve auth → call service → map exceptions → response.
No business logic here.

Endpoints:
  GET    /api/v1/crm/patients/{patient_id}           — PHI gated (doctor/nurse/admin_clinic)
  PATCH  /api/v1/crm/patients/{patient_id}           — PHI write gated
  POST   /api/v1/crm/patients/{patient_id}/opt-out   — admin_clinic only
  GET    /api/v1/crm/leads/{lead_id}                 — all authenticated roles

response_model= is MANDATORY on every endpoint (PII gate + arch fitness).
redirect_slashes=False is set on the FastAPI *app* in main.py, NOT here.
PHIAccessDeniedError → HTTP 403 (mapped in exception handler below).
"""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

import structlog
from fastapi import APIRouter, Header, HTTPException

from src.modules.vitalia._shared.auth.rbac import PHIAccessDeniedError
from src.modules.vitalia.crm.application.dto.lead_dto import LeadResponse
from src.modules.vitalia.crm.application.dto.patient_dto import (
    OptOutRequest,
    OptOutResponse,
    PatientPatchRequest,
    PatientResponse,
)
from src.modules.vitalia.crm.application.services.lead_service import LeadService
from src.modules.vitalia.crm.application.services.patient_service import PatientService
from src.modules.vitalia.iam.application.services.clinic_resolver import (
    ClinicResolver,
    MissingAuthHeaderError,
)
from src.modules.vitalia.iam.infrastructure.clerk_jwt_decoder import (
    ClerkJwtDecoder,
    JwtDecodeError,
)

logger = structlog.get_logger()

router = APIRouter(tags=["crm"])

# Header type aliases
AuthorizationHeader = Annotated[str, Header(alias="Authorization")]
TenantIdHeader = Annotated[str, Header(alias="X-Tenant-ID")]
ClinicIdHeader = Annotated[str, Header(alias="X-Clinic-ID")]
OptionalClinicIdHeader = Annotated[str | None, Header(alias="X-Clinic-ID")]


def _get_resolver() -> ClinicResolver:
    """Create a ClinicResolver with the default stub decoder (Slice 1)."""
    return ClinicResolver(decoder=ClerkJwtDecoder())


def _resolve_context(authorization: str, resolver: ClinicResolver) -> object:
    """Parse authorization header and resolve clinic context.

    Raises:
        HTTPException(401): If token is missing or invalid.
    """
    token = authorization.removeprefix("Bearer ").strip()
    try:
        return resolver.resolve(token)
    except MissingAuthHeaderError:
        raise HTTPException(status_code=401, detail="Token de autorización requerido.")
    except JwtDecodeError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado.")


# ---------------------------------------------------------------------------
# Patient endpoints — PHI gated
# ---------------------------------------------------------------------------


@router.get("/patients/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: UUID,
    authorization: AuthorizationHeader,
    x_tenant_id: TenantIdHeader,
    x_clinic_id: ClinicIdHeader,
) -> PatientResponse:
    """Retrieve a patient by ID — PHI access gated by RBAC.

    Allowed roles: doctor, nurse, admin_clinic.
    Marketing/receptionist/patient roles → 403.

    Args:
        patient_id: Patient UUID (path param).
        authorization: Bearer token.
        x_tenant_id: Tenant ID header.
        x_clinic_id: Clinic ID header (required — dual PHI filter).

    Returns:
        PatientResponse with allowlisted fields.

    Raises:
        401: Invalid/missing token.
        403: Role not permitted to access PHI.
        404: Patient not found.
    """
    resolver = _get_resolver()
    ctx = _resolve_context(authorization, resolver)

    # Build service with mock repos (Slice 1 — no live DB)
    # Slice 2: inject real repos via DI (FastAPI Depends)
    from unittest.mock import AsyncMock

    patient_repo = AsyncMock()
    patient_repo.get_by_id.return_value = None
    audit_repo = AsyncMock()
    service = PatientService(patient_repo=patient_repo, audit_repo=audit_repo)

    try:
        patient = await service.get_by_id(
            patient_id=patient_id,
            tenant_id=ctx.tenant_id,
            clinic_id=UUID(x_clinic_id),
            user_id=UUID(ctx.user_id) if len(ctx.user_id) == 36 else UUID(int=0),
            user_role=ctx.role,
        )
    except PHIAccessDeniedError:
        logger.warning(
            "crm.get_patient.access_denied",
            role=ctx.role,
            patient_id=str(patient_id),
        )
        raise HTTPException(
            status_code=403,
            detail="Acceso denegado: tu rol no tiene permisos para acceder a información clínica.",
        )

    if patient is None:
        raise HTTPException(status_code=404, detail="Paciente no encontrado.")

    return PatientResponse(
        id=patient.id,
        tenant_id=patient.tenant_id,
        clinic_id=patient.clinic_id,
        name=patient.name,
        email=patient.email,
        phone=patient.phone,
        marketing_opt_out_at=patient.marketing_opt_out_at,
        created_at=patient.created_at,
    )


@router.patch("/patients/{patient_id}", response_model=PatientResponse)
async def patch_patient(
    patient_id: UUID,
    body: PatientPatchRequest,
    authorization: AuthorizationHeader,
    x_tenant_id: TenantIdHeader,
    x_clinic_id: ClinicIdHeader,
) -> PatientResponse:
    """Update allowed patient fields — PHI write gated by RBAC.

    Allowed roles: doctor, nurse, admin_clinic.

    Args:
        patient_id: Patient UUID (path param).
        body: Fields to update.
        authorization: Bearer token.
        x_tenant_id: Tenant ID header.
        x_clinic_id: Clinic ID header.

    Returns:
        Updated PatientResponse.

    Raises:
        401: Invalid/missing token.
        403: Role not permitted to write PHI.
        404: Patient not found.
    """
    resolver = _get_resolver()
    ctx = _resolve_context(authorization, resolver)

    from unittest.mock import AsyncMock

    patient_repo = AsyncMock()
    patient_repo.update.return_value = None
    patient_repo.get_by_id.return_value = None
    audit_repo = AsyncMock()
    service = PatientService(patient_repo=patient_repo, audit_repo=audit_repo)

    updates = {k: v for k, v in body.model_dump().items() if v is not None}

    try:
        await service.update(
            patient_id=patient_id,
            tenant_id=ctx.tenant_id,
            clinic_id=UUID(x_clinic_id),
            user_id=UUID(ctx.user_id) if len(ctx.user_id) == 36 else UUID(int=0),
            user_role=ctx.role,
            updates=updates,
        )
    except PHIAccessDeniedError:
        logger.warning(
            "crm.patch_patient.access_denied",
            role=ctx.role,
            patient_id=str(patient_id),
        )
        raise HTTPException(
            status_code=403,
            detail="Acceso denegado: tu rol no tiene permisos para modificar información clínica.",
        )

    # Return updated patient (None in Slice 1 — no live DB)
    raise HTTPException(status_code=404, detail="Paciente no encontrado.")


@router.post("/patients/{patient_id}/opt-out", response_model=OptOutResponse)
async def opt_out_patient(
    patient_id: UUID,
    body: OptOutRequest,
    authorization: AuthorizationHeader,
    x_tenant_id: TenantIdHeader,
    x_clinic_id: ClinicIdHeader,
) -> OptOutResponse:
    """Opt patient out of marketing — admin_clinic role only.

    Per LGPD/HIPAA-lite right to erasure flow.

    Args:
        patient_id: Patient UUID (path param).
        body: Opt-out reason.
        authorization: Bearer token.
        x_tenant_id: Tenant ID header.
        x_clinic_id: Clinic ID header.

    Returns:
        OptOutResponse confirming the opt-out.

    Raises:
        401: Invalid/missing token.
        403: Role is not admin_clinic.
    """
    resolver = _get_resolver()
    ctx = _resolve_context(authorization, resolver)

    from unittest.mock import AsyncMock

    patient_repo = AsyncMock()
    patient_repo.opt_out.return_value = None
    audit_repo = AsyncMock()
    service = PatientService(patient_repo=patient_repo, audit_repo=audit_repo)

    try:
        await service.opt_out(
            patient_id=patient_id,
            tenant_id=ctx.tenant_id,
            clinic_id=UUID(x_clinic_id),
            user_id=UUID(ctx.user_id) if len(ctx.user_id) == 36 else UUID(int=0),
            user_role=ctx.role,
            reason=body.reason,
        )
    except PHIAccessDeniedError:
        raise HTTPException(
            status_code=403,
            detail="Acceso denegado: solo el administrador de clínica puede registrar exclusiones.",
        )

    return OptOutResponse(
        patient_id=patient_id,
        opted_out=True,
        message="El paciente ha sido marcado como excluido del marketing.",
    )


# ---------------------------------------------------------------------------
# Lead endpoints — non-PHI, all authenticated roles
# ---------------------------------------------------------------------------


@router.get("/leads/{lead_id}", response_model=LeadResponse)
async def get_lead(
    lead_id: UUID,
    authorization: AuthorizationHeader,
    x_tenant_id: TenantIdHeader,
    x_clinic_id: OptionalClinicIdHeader = None,
) -> LeadResponse:
    """Retrieve a lead by ID — accessible to all authenticated roles.

    Lead is not PHI — no clinic_id dual filter required.
    X-Clinic-ID header is optional for this endpoint.

    Args:
        lead_id: Lead UUID (path param).
        authorization: Bearer token.
        x_tenant_id: Tenant ID header.
        x_clinic_id: Optional Clinic ID (not required for non-PHI).

    Returns:
        LeadResponse.

    Raises:
        401: Invalid/missing token.
        404: Lead not found.
    """
    resolver = _get_resolver()
    ctx = _resolve_context(authorization, resolver)

    from unittest.mock import AsyncMock

    lead_repo = AsyncMock()
    lead_repo.get_by_id.return_value = None
    service = LeadService(lead_repo=lead_repo)

    lead = await service.get_by_id(
        lead_id=lead_id,
        tenant_id=ctx.tenant_id,
    )

    if lead is None:
        raise HTTPException(status_code=404, detail="Prospecto no encontrado.")

    return LeadResponse(
        id=lead.id,
        tenant_id=lead.tenant_id,
        name=lead.name,
        email=lead.email,
        phone=lead.phone,
        source=lead.source,
        status=lead.status,
        created_at=lead.created_at,
    )
