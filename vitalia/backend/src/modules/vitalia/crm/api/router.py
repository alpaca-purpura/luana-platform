# cap: crm.crm-consent-optout
# story-origin: TBD
"""Vitalia CRM API router — patients, leads, and conversations endpoints.

API layer — thin: validate headers → resolve auth → call service → map exceptions → response.
No business logic here.

Endpoints:
  GET    /api/v1/crm/patients/{patient_id}                       — PHI gated (doctor/nurse/admin_clinic)
  PATCH  /api/v1/crm/patients/{patient_id}                       — PHI write gated
  POST   /api/v1/crm/patients/{patient_id}/opt-out               — admin_clinic only (consent_endpoints.py)
  PATCH  /api/v1/crm/patients/{patient_id}/marketing-opt-in      — doctor/nurse/admin_clinic (consent_endpoints.py)
  GET    /api/v1/crm/leads                                        — all authenticated roles (T-inbox-be-5)
  GET    /api/v1/crm/leads/{lead_id}                             — all authenticated roles
  POST   /api/v1/crm/leads                                        — all authenticated roles (T-inbox-be-5)
  PATCH  /api/v1/crm/leads/{lead_id}                             — all authenticated roles (T-inbox-be-5)
  GET    /api/v1/crm/conversations                                — PHI gated (T-inbox-be-5)
  GET    /api/v1/crm/conversations/{conv_id}                     — PHI gated (T-inbox-be-5)

response_model= is MANDATORY on every endpoint (PII gate + arch fitness).
redirect_slashes=False is set on the FastAPI *app* in main.py, NOT here.
PHIAccessDeniedError → HTTP 403 (mapped in exception handler below).
"""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

import structlog
from fastapi import APIRouter, Header, HTTPException, Query

from src.modules.vitalia._shared.auth.rbac import PHIAccessDeniedError
from src.modules.vitalia.crm.api.consent_endpoints import router as consent_router
from src.modules.vitalia.crm.application.dto.lead_dto import (
    LeadCreateRequest,
    LeadListResponse,
    LeadResponse,
    LeadUpdateRequest,
)
from src.modules.vitalia.crm.application.dto.patient_dto import (
    PatientPatchRequest,
    PatientResponse,
)
from src.modules.vitalia.crm.application.services.lead_service import (
    LeadNotFoundError,
    LeadService,
)
from src.modules.vitalia.crm.application.services.patient_service import PatientService
from src.modules.vitalia.iam.application.services.clinic_resolver import (
    ClinicResolver,
    MissingAuthHeaderError,
)
from src.modules.vitalia.iam.infrastructure.clerk_jwt_decoder import (
    ClerkJwtDecoder,
    JwtDecodeError,
)
from src.modules.vitalia.inbox.application.dto.conversation_list_dto import (
    ConversationListItem,
    ConversationListResponse,
)

logger = structlog.get_logger()

router = APIRouter(tags=["crm"])

# Mount consent endpoints (T-2 — opt-out + marketing-opt-in)
router.include_router(consent_router)

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


# opt-out endpoint moved to consent_endpoints.py (T-2 — PatientConsentService)
# router.include_router(consent_router) above mounts it at the same path.

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


# ---------------------------------------------------------------------------
# Lead endpoints — T-inbox-be-5 extension (non-PHI, all authenticated roles)
# ---------------------------------------------------------------------------


@router.get("/leads", response_model=LeadListResponse)
async def list_leads(
    authorization: AuthorizationHeader,
    x_tenant_id: TenantIdHeader,
    x_clinic_id: OptionalClinicIdHeader = None,
    status: str | None = Query(default=None),
    source: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> LeadListResponse:
    """List leads for the inbox — all authenticated roles.

    Lead is not PHI — no clinic_id dual filter required.

    Args:
        authorization: Bearer token.
        x_tenant_id: Tenant ID header.
        x_clinic_id: Optional Clinic ID (not required for non-PHI).
        status: Optional status filter.
        source: Optional source filter.
        limit: Page size (default 20, max 100).
        offset: Page offset.

    Returns:
        LeadListResponse (paginated).

    Raises:
        401: Invalid/missing token.
    """
    resolver = _get_resolver()
    ctx = _resolve_context(authorization, resolver)

    from unittest.mock import AsyncMock

    lead_repo = AsyncMock()
    lead_repo.list_by_filter.return_value = []
    service = LeadService(lead_repo=lead_repo)

    leads, total = await service.list_for_inbox(
        tenant_id=ctx.tenant_id,
        status=status,
        source=source,
        limit=limit,
        offset=offset,
    )

    items = [
        LeadResponse(
            id=lead.id,
            tenant_id=lead.tenant_id,
            name=lead.name,
            email=lead.email,
            phone=lead.phone,
            source=lead.source,
            status=lead.status,
            created_at=lead.created_at,
        )
        for lead in leads
    ]
    return LeadListResponse(items=items, total=total, limit=limit, offset=offset)


@router.post("/leads", response_model=LeadResponse, status_code=201)
async def create_lead(
    body: LeadCreateRequest,
    authorization: AuthorizationHeader,
    x_tenant_id: TenantIdHeader,
    x_clinic_id: OptionalClinicIdHeader = None,
) -> LeadResponse:
    """Create a new lead — all authenticated roles.

    Lead is not PHI — no clinic_id required.

    Args:
        body: LeadCreateRequest.
        authorization: Bearer token.
        x_tenant_id: Tenant ID header.
        x_clinic_id: Optional Clinic ID (not required for non-PHI).

    Returns:
        LeadResponse (201 Created).

    Raises:
        401: Invalid/missing token.
    """
    resolver = _get_resolver()
    ctx = _resolve_context(authorization, resolver)

    from unittest.mock import AsyncMock

    from src.modules.vitalia.crm.domain.lead import Lead

    lead_repo = AsyncMock()
    # Slice 1: return a stub lead (Slice 2 will use real repo)
    from datetime import UTC, datetime
    from uuid import uuid4

    stub_lead = Lead(
        id=uuid4(),
        tenant_id=ctx.tenant_id,
        name=body.name,
        email=body.email,
        phone=body.phone,
        source=body.source,
        status=body.status,
        notes=body.notes,
        deleted_at=None,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    lead_repo.create.return_value = stub_lead
    service = LeadService(lead_repo=lead_repo)

    lead = await service.create(
        tenant_id=ctx.tenant_id,
        name=body.name,
        email=body.email,
        phone=body.phone,
        source=body.source,
        status=body.status,
        notes=body.notes,
        marketing_opt_in=body.marketing_opt_in,
    )

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


@router.patch("/leads/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: UUID,
    body: LeadUpdateRequest,
    authorization: AuthorizationHeader,
    x_tenant_id: TenantIdHeader,
    x_clinic_id: OptionalClinicIdHeader = None,
) -> LeadResponse:
    """Update allowed lead fields — all authenticated roles.

    Lead is not PHI — no clinic_id required.

    Args:
        lead_id: Lead UUID (path param).
        body: LeadUpdateRequest (all fields optional).
        authorization: Bearer token.
        x_tenant_id: Tenant ID header.
        x_clinic_id: Optional Clinic ID.

    Returns:
        LeadResponse (200 OK).

    Raises:
        401: Invalid/missing token.
        404: Lead not found.
    """
    resolver = _get_resolver()
    ctx = _resolve_context(authorization, resolver)

    from unittest.mock import AsyncMock

    lead_repo = AsyncMock()
    lead_repo.get_by_id.return_value = None  # Slice 1: 404 always (no live DB)
    lead_repo.update.return_value = None
    service = LeadService(lead_repo=lead_repo)

    updates = {k: v for k, v in body.model_dump().items() if v is not None}

    try:
        await service.update(
            lead_id=lead_id,
            tenant_id=ctx.tenant_id,
            updates=updates,
        )
    except LeadNotFoundError:
        raise HTTPException(status_code=404, detail="Prospecto no encontrado.")

    # Slice 1: always 404 since no live DB (Slice 2 will return real data)
    raise HTTPException(status_code=404, detail="Prospecto no encontrado.")


# ---------------------------------------------------------------------------
# Conversation list + detail — T-inbox-be-5 extension (PHI gated)
# ---------------------------------------------------------------------------

_PHI_ROLES = frozenset({"doctor", "nurse", "admin_clinic"})


@router.get("/conversations", response_model=ConversationListResponse)
async def list_conversations(
    authorization: AuthorizationHeader,
    x_tenant_id: TenantIdHeader,
    x_clinic_id: ClinicIdHeader,
    status: str | None = Query(default=None),
    channel: str | None = Query(default=None),
    handler_mode: str | None = Query(default=None),
    help_needed: bool | None = Query(default=None),
    unread_media: bool | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> ConversationListResponse:
    """List inbox conversations — PHI gated.

    Dual PHI filter: tenant_id + clinic_id required.
    Returns paginated ConversationListResponse.

    Args:
        authorization: Bearer token.
        x_tenant_id: Tenant ID header.
        x_clinic_id: Clinic ID header (dual PHI filter — mandatory).
        status: Optional status filter.
        channel: Optional channel filter.
        handler_mode: Optional handler_mode filter.
        help_needed: Optional help_needed filter.
        unread_media: Optional unread_media filter.
        limit: Page size.
        offset: Page offset.

    Returns:
        ConversationListResponse (200 OK).

    Raises:
        401: Invalid/missing token.
        403: Role not permitted to access PHI conversations.
    """
    resolver = _get_resolver()
    ctx = _resolve_context(authorization, resolver)

    if ctx.role not in _PHI_ROLES:
        logger.warning(
            "crm.list_conversations.access_denied",
            role=ctx.role,
        )
        raise HTTPException(
            status_code=403,
            detail="Acceso denegado: tu rol no tiene permisos para ver conversaciones clínicas.",
        )

    # Slice 1: return empty list (Slice 2 will use real conversation repo)
    return ConversationListResponse(items=[], total=0, limit=limit, offset=offset)


@router.get("/conversations/{conv_id}", response_model=ConversationListItem)
async def get_conversation_detail(
    conv_id: UUID,
    authorization: AuthorizationHeader,
    x_tenant_id: TenantIdHeader,
    x_clinic_id: ClinicIdHeader,
) -> ConversationListItem:
    """Get conversation detail — PHI gated.

    Dual PHI filter: tenant_id + clinic_id required.

    Args:
        conv_id: Conversation UUID.
        authorization: Bearer token.
        x_tenant_id: Tenant ID header.
        x_clinic_id: Clinic ID header (dual PHI filter — mandatory).

    Returns:
        ConversationListItem (200 OK).

    Raises:
        401: Invalid/missing token.
        403: Role not permitted.
        404: Conversation not found.
    """
    resolver = _get_resolver()
    ctx = _resolve_context(authorization, resolver)

    if ctx.role not in _PHI_ROLES:
        logger.warning(
            "crm.get_conversation_detail.access_denied",
            role=ctx.role,
            conv_id=str(conv_id),
        )
        raise HTTPException(
            status_code=403,
            detail="Acceso denegado: tu rol no tiene permisos para ver esta conversación.",
        )

    # Slice 1: always 404 (no live conversation repo yet)
    raise HTTPException(status_code=404, detail="Conversación no encontrada.")
