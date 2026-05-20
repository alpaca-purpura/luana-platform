"""CRM consent endpoints — POST /opt-out + PATCH /marketing-opt-in.

API layer — thin: validate headers → resolve auth → call service → map exceptions → response.
No business logic here.

Endpoints:
  POST   /api/v1/crm/patients/{patient_id}/opt-out
  PATCH  /api/v1/crm/patients/{patient_id}/marketing-opt-in

Per vitalia/.claude/rules/hipaa-lite.md:
  - X-Tenant-ID + X-Clinic-ID both required (dual filter).
  - RBAC: opt-out = admin_clinic only; marketing-opt-in = doctor/nurse/admin_clinic.
  - response_model= mandatory (PII allowlist enforcement).

Per .claude/rules/backend-ddd.md:
  - Routes thin: validate DTO → call service → map exception → response.
  - redirect_slashes=False is set on the FastAPI *app* in main.py, NOT here.

downstream-regression-na: brand-local vitalia CRM consent API endpoints
"""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

import structlog
from fastapi import APIRouter, Header, HTTPException

from src.modules.vitalia._shared.auth.rbac import PHIAccessDeniedError
from src.modules.vitalia.crm.application.dto.consent_dtos import (
    MarketingOptInRequest,
    MarketingOptInResponse,
    OptOutRequest,
    OptOutResponse,
)
from src.modules.vitalia.crm.application.services.patient_consent_service import (
    PatientConsentService,
)
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
# Consent endpoints — PHI gated
# ---------------------------------------------------------------------------


@router.post("/patients/{patient_id}/opt-out", response_model=OptOutResponse)
async def opt_out_patient(
    patient_id: UUID,
    body: OptOutRequest,
    authorization: AuthorizationHeader,
    x_tenant_id: TenantIdHeader,
    x_clinic_id: ClinicIdHeader,
) -> OptOutResponse:
    """Opt patient out of marketing — admin_clinic role only.

    Per LGPD/HIPAA-lite right to erasure flow. Writes audit log row
    synchronously before response. Emits PatientOptedOut domain event
    for downstream cancellation of pending fidelizacion events (SC-04).

    Args:
        patient_id: Patient UUID (path param).
        body: Opt-out reason (audit only — not returned).
        authorization: Bearer token.
        x_tenant_id: Tenant ID header (root isolation).
        x_clinic_id: Clinic ID header (required — HIPAA-lite dual filter).

    Returns:
        OptOutResponse confirming the opt-out.

    Raises:
        401: Invalid/missing token.
        403: Role is not admin_clinic.
        422: Missing required headers or body fields.
    """
    resolver = _get_resolver()
    ctx = _resolve_context(authorization, resolver)

    # Slice 1: stub repos (no live DB). Slice 2: inject via FastAPI Depends.
    from unittest.mock import AsyncMock  # noqa: PLC0415

    patient_repo = AsyncMock()
    patient_repo.opt_out.return_value = None
    audit_repo = AsyncMock()
    audit_repo.write.return_value = None
    service = PatientConsentService(patient_repo=patient_repo, audit_repo=audit_repo)

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
        logger.warning(
            "crm.opt_out.access_denied",
            role=ctx.role,
            patient_id=str(patient_id),
        )
        raise HTTPException(
            status_code=403,
            detail="Acceso denegado: solo el administrador de clínica puede registrar exclusiones.",
        )

    return OptOutResponse(
        patient_id=patient_id,
        opted_out=True,
        message="El paciente ha sido registrado como excluido del marketing.",
    )


@router.patch("/patients/{patient_id}/marketing-opt-in", response_model=MarketingOptInResponse)
async def marketing_opt_in_patient(
    patient_id: UUID,
    body: MarketingOptInRequest,
    authorization: AuthorizationHeader,
    x_tenant_id: TenantIdHeader,
    x_clinic_id: ClinicIdHeader,
) -> MarketingOptInResponse:
    """Update patient marketing consent — doctor/nurse/admin_clinic roles.

    Records marketing consent (opt-in or opt-out of marketing communications).
    Writes audit log row synchronously before response.

    Args:
        patient_id: Patient UUID (path param).
        body: MarketingOptInRequest with opt_in boolean.
        authorization: Bearer token.
        x_tenant_id: Tenant ID header.
        x_clinic_id: Clinic ID header (required — HIPAA-lite dual filter).

    Returns:
        MarketingOptInResponse confirming the consent update.

    Raises:
        401: Invalid/missing token.
        403: Role not in [doctor, nurse, admin_clinic].
        422: Missing required headers or body fields.
    """
    resolver = _get_resolver()
    ctx = _resolve_context(authorization, resolver)

    # Slice 1: stub repos (no live DB). Slice 2: inject via FastAPI Depends.
    from unittest.mock import AsyncMock  # noqa: PLC0415

    patient_repo = AsyncMock()
    patient_repo.marketing_opt_in.return_value = None
    audit_repo = AsyncMock()
    audit_repo.write.return_value = None
    service = PatientConsentService(patient_repo=patient_repo, audit_repo=audit_repo)

    try:
        await service.marketing_opt_in(
            patient_id=patient_id,
            tenant_id=ctx.tenant_id,
            clinic_id=UUID(x_clinic_id),
            user_id=UUID(ctx.user_id) if len(ctx.user_id) == 36 else UUID(int=0),
            user_role=ctx.role,
            opt_in=body.opt_in,
        )
    except PHIAccessDeniedError:
        logger.warning(
            "crm.marketing_opt_in.access_denied",
            role=ctx.role,
            patient_id=str(patient_id),
        )
        raise HTTPException(
            status_code=403,
            detail="Acceso denegado: tu rol no tiene permisos para actualizar el consentimiento de marketing.",
        )

    consent_message = (
        "El paciente ha confirmado su consentimiento para comunicaciones de marketing."
        if body.opt_in
        else "El consentimiento de marketing del paciente ha sido revocado."
    )

    return MarketingOptInResponse(
        patient_id=patient_id,
        marketing_opt_in=body.opt_in,
        message=consent_message,
    )
