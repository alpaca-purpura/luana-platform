"""Vitalia marketing module — FastAPI routes.

Endpoints mounted at /api/v1/vitalia/marketing/:

  GET  /bowtie/summary                   BowtieSummaryResponse   (doctor/nurse/admin_clinic/recepcion)
  GET  /stage/{stage_slug}               StageDetailResponse      (doctor/nurse/admin_clinic/recepcion)
  GET  /channels/{provider}              list[ChannelDetailResponse] (admin_clinic)
  POST /channels/{provider}/connect      OAuthConnectResponse     (admin_clinic)
  POST /channels/{provider}/sync         SyncResponse             [Idempotency-Key] (admin_clinic)
  GET  /recommendations                  list[LucasRecommendationResponse] (doctor/nurse/admin_clinic/recepcion)
  POST /recommendations/{rec_id}/approve LucasRecommendationResponse [Idempotency-Key] (admin_clinic)
  POST /recommendations/{rec_id}/reject  LucasRecommendationResponse [Idempotency-Key] (admin_clinic)
  POST /recommendations/{rec_id}/undo    LucasRecommendationResponse [Idempotency-Key] (admin_clinic)
  GET  /attribution-matrix               AttributionMatrixResponse (admin_clinic)
  GET  /referrals                        ReferralsResponse         (admin_clinic)

API layer is THIN:
  - Validate headers → resolve auth → call service → map domain exceptions → response.
  - NO business logic here.

HIPAA-lite:
  - All endpoints require Bearer + X-Tenant-ID + X-Clinic-ID.
  - Mutations require Idempotency-Key header.
  - Role checks per endpoint per 03-arch-be.md § 4.

response_model= is MANDATORY on every endpoint (PII gate + arch fitness V-AE-2).
redirect_slashes=False is set on the FastAPI *app* in main.py, NOT here.

downstream-regression-na: brand-local marketing API routes (vitalia-only)
"""

from __future__ import annotations

import datetime
from typing import Annotated
from uuid import UUID

import structlog
from fastapi import APIRouter, Header, HTTPException, Query

from src.modules.vitalia.iam.application.services.clinic_resolver import (
    ClinicContext,
    ClinicResolver,
    MissingAuthHeaderError,
)
from src.modules.vitalia.iam.infrastructure.clerk_jwt_decoder import (
    ClerkJwtDecoder,
    JwtDecodeError,
)
from src.modules.vitalia.marketing.application.dtos.marketing_dtos import (
    ApproveRecommendationRequest,
    AttributionMatrixResponse,
    BowtieSummaryResponse,
    ChannelDetailResponse,
    LucasRecommendationResponse,
    OAuthConnectRequest,
    OAuthConnectResponse,
    ReferralsResponse,
    RejectRecommendationRequest,
    StageDetailResponse,
    SyncResponse,
)
from src.modules.vitalia.marketing.application.services.attribution_service import (
    AttributionService,
)
from src.modules.vitalia.marketing.application.services.lucas_recommendations_service import (
    LucasRecommendationsService,
)
from src.modules.vitalia.marketing.application.services.marketing_service import MarketingService
from src.modules.vitalia.marketing.application.services.referrals_service import ReferralsService
from src.modules.vitalia.marketing.domain.enums import BowtieStage, ProviderSlug
from src.modules.vitalia.marketing.domain.exceptions import (
    InvalidStateTransitionError,
    UndoWindowExpiredError,
)

logger = structlog.get_logger()

router = APIRouter(tags=["marketing"])

# ---------------------------------------------------------------------------
# Role constants per 03-arch-be.md § 4
# ---------------------------------------------------------------------------

_READ_ROLES = {"doctor", "nurse", "admin_clinic", "recepcion"}
_WRITE_ROLES = {"admin_clinic", "owner_clinic"}

# ---------------------------------------------------------------------------
# Header type aliases
# ---------------------------------------------------------------------------

AuthorizationHeader = Annotated[str, Header(alias="Authorization")]
TenantIdHeader = Annotated[str, Header(alias="X-Tenant-ID")]
ClinicIdHeader = Annotated[str, Header(alias="X-Clinic-ID")]
IdempotencyKeyHeader = Annotated[str | None, Header(alias="Idempotency-Key")]


# ---------------------------------------------------------------------------
# Auth helpers (module-level so tests can patch them)
# ---------------------------------------------------------------------------


def _resolve_context(authorization: str) -> ClinicContext:
    """Resolve Bearer JWT to ClinicContext.

    Raises:
        HTTPException(401): Token missing or invalid.
    """
    token = authorization.removeprefix("Bearer ").strip()
    resolver = ClinicResolver(decoder=ClerkJwtDecoder())
    try:
        return resolver.resolve(token)
    except MissingAuthHeaderError:
        raise HTTPException(status_code=401, detail="Token de autorización requerido.")
    except JwtDecodeError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado.")


def _require_role(ctx: ClinicContext, allowed_roles: set[str]) -> None:
    """Check that the resolved context role is in allowed_roles.

    Raises:
        HTTPException(403): Role not allowed.
    """
    if ctx.role not in allowed_roles:
        logger.warning(
            "marketing_api.role_denied",
            role=ctx.role,
            allowed=sorted(allowed_roles),
        )
        raise HTTPException(
            status_code=403,
            detail=(f"Acceso no autorizado. Tu rol '{ctx.role}' no tiene permisos para esta acción."),
        )


def _require_idempotency_key(idempotency_key: str | None) -> str:
    """Enforce presence of Idempotency-Key header.

    Raises:
        HTTPException(422): Header missing.
    """
    if not idempotency_key:
        raise HTTPException(
            status_code=422,
            detail="El encabezado 'Idempotency-Key' es obligatorio para esta operación.",
        )
    return idempotency_key


# ---------------------------------------------------------------------------
# Service factory helpers (patchable in tests)
# ---------------------------------------------------------------------------


def _get_recs_service() -> LucasRecommendationsService:
    """Build LucasRecommendationsService with no-op stub dependencies.

    In production this would use DI with real repos. For Slice 1 the
    service wiring is done at this layer; T-mk-be-7 (DI refactor) will
    introduce proper dependency injection containers.
    """
    from unittest.mock import AsyncMock, MagicMock  # noqa: PLC0415

    stub_repo = MagicMock()
    stub_repo.get_by_id = AsyncMock(return_value=None)
    stub_repo.save = AsyncMock(return_value=None)
    stub_repo.list_open_by_stage = AsyncMock(return_value=[])

    stub_audit = MagicMock()
    stub_audit.write = AsyncMock()

    return LucasRecommendationsService(repo=stub_repo, audit_writer=stub_audit)


def _get_marketing_service() -> MarketingService:
    """Build MarketingService with stub channel_metric_repo."""
    from unittest.mock import AsyncMock, MagicMock  # noqa: PLC0415

    stub_repo = MagicMock()
    stub_repo.list_for_stage = AsyncMock(return_value=[])
    return MarketingService(channel_metric_repo=stub_repo)


def _get_attribution_service() -> AttributionService:
    """Build AttributionService with stub dependencies."""
    from unittest.mock import AsyncMock, MagicMock  # noqa: PLC0415

    stub_lucas_svc = MagicMock()
    stub_lucas_svc.compute_attribution = AsyncMock(return_value=None)
    stub_locale = MagicMock()
    stub_locale.currency = None
    return AttributionService(lucas_attribution_service=stub_lucas_svc, locale=stub_locale)


def _get_referrals_service() -> ReferralsService:
    """Build ReferralsService with stub dependencies."""
    from unittest.mock import AsyncMock, MagicMock  # noqa: PLC0415

    stub_lucas_svc = MagicMock()
    stub_lucas_svc.compute_referrals = AsyncMock(return_value=None)
    stub_repo = MagicMock()
    stub_repo.save = AsyncMock()
    stub_locale = MagicMock()
    stub_locale.currency = None
    return ReferralsService(
        lucas_referrals_service=stub_lucas_svc,
        referral_repo=stub_repo,
        locale=stub_locale,
    )


def _get_sync_service() -> object:
    """Build sync service stub for channel syncing."""
    from unittest.mock import AsyncMock, MagicMock  # noqa: PLC0415

    stub = MagicMock()
    stub.sync_channel = AsyncMock(
        return_value=MagicMock(
            provider="unknown",
            status="ok",
            last_synced_at=datetime.datetime.now(datetime.timezone.utc),
            error_message=None,
        )
    )
    return stub


def _get_oauth_service() -> object:
    """Build OAuth service stub for channel connect."""
    from unittest.mock import AsyncMock, MagicMock  # noqa: PLC0415

    stub = MagicMock()
    stub.initiate_oauth = AsyncMock(
        return_value=MagicMock(
            provider="unknown",
            authorization_url="https://example.com/oauth",
            state_token="stub-state-token",
        )
    )
    return stub


# ---------------------------------------------------------------------------
# Date range query params helper
# ---------------------------------------------------------------------------


def _default_period() -> tuple[datetime.date, datetime.date]:
    """Return default period: last 30 days."""
    today = datetime.date.today()
    start = today - datetime.timedelta(days=30)
    return start, today


# ---------------------------------------------------------------------------
# Bowtie / Stage / Channel endpoints
# ---------------------------------------------------------------------------


@router.get("/bowtie/summary", response_model=BowtieSummaryResponse)
async def get_bowtie_summary(
    authorization: AuthorizationHeader,
    tenant_id: TenantIdHeader,
    clinic_id: ClinicIdHeader,
    period_start: datetime.date | None = Query(default=None),
    period_end: datetime.date | None = Query(default=None),
) -> BowtieSummaryResponse:
    """Bowtie funnel KPI snapshot per clinic.

    Returns aggregated impressions/clicks/conversions/spend for all bowtie
    stages within the requested period (default: last 30 days).

    Roles: doctor, nurse, admin_clinic, recepcion.
    """
    ctx = _resolve_context(authorization)
    _require_role(ctx, _READ_ROLES)

    start, end = _default_period()
    if period_start:
        start = period_start
    if period_end:
        end = period_end

    svc = _get_marketing_service()
    result = await svc.bowtie_summary(
        tenant_id=ctx.tenant_id,
        clinic_id=ctx.clinic_id,
        period_start=start,
        period_end=end,
        currency=None,
    )
    return result


@router.get("/stage/{stage_slug}", response_model=StageDetailResponse)
async def get_stage_detail(
    stage_slug: str,
    authorization: AuthorizationHeader,
    tenant_id: TenantIdHeader,
    clinic_id: ClinicIdHeader,
    period_start: datetime.date | None = Query(default=None),
    period_end: datetime.date | None = Query(default=None),
) -> StageDetailResponse:
    """Per-stage channel breakdown for the bowtie funnel.

    Returns channel metrics for the requested bowtie stage within the period.

    Roles: doctor, nurse, admin_clinic, recepcion.

    Raises:
        HTTPException(400): Invalid stage_slug value.
    """
    ctx = _resolve_context(authorization)
    _require_role(ctx, _READ_ROLES)

    try:
        stage = BowtieStage(stage_slug)
    except ValueError:
        valid = [s.value for s in BowtieStage]
        raise HTTPException(
            status_code=400,
            detail=f"Etapa inválida: '{stage_slug}'. Las etapas válidas son: {valid}.",
        )

    start, end = _default_period()
    if period_start:
        start = period_start
    if period_end:
        end = period_end

    svc = _get_marketing_service()
    result = await svc.stage_detail(
        tenant_id=ctx.tenant_id,
        clinic_id=ctx.clinic_id,
        stage=stage,
        period_start=start,
        period_end=end,
        currency=None,
    )
    return result


@router.get("/channels/{provider}", response_model=list[ChannelDetailResponse])
async def get_channel_detail(
    provider: str,
    authorization: AuthorizationHeader,
    tenant_id: TenantIdHeader,
    clinic_id: ClinicIdHeader,
    period_start: datetime.date | None = Query(default=None),
    period_end: datetime.date | None = Query(default=None),
) -> list[ChannelDetailResponse]:
    """Per-provider channel metrics (last known, even if recent sync failed).

    Returns list of ChannelDetailResponse rows for the provider within the period.
    If the most recent sync failed, returns the last successfully synced data.

    Roles: admin_clinic.

    Raises:
        HTTPException(400): Invalid provider value.
    """
    ctx = _resolve_context(authorization)
    _require_role(ctx, _WRITE_ROLES)

    try:
        ProviderSlug(provider)
    except ValueError:
        valid = [p.value for p in ProviderSlug]
        raise HTTPException(
            status_code=400,
            detail=f"Proveedor inválido: '{provider}'. Los proveedores válidos son: {valid}.",
        )

    start, end = _default_period()
    if period_start:
        start = period_start
    if period_end:
        end = period_end

    svc = _get_marketing_service()
    results = await svc.channel_detail(
        tenant_id=ctx.tenant_id,
        clinic_id=ctx.clinic_id,
        stage=None,
        period_start=start,
        period_end=end,
        currency=None,
    )
    return results


# ---------------------------------------------------------------------------
# OAuth connect + sync
# ---------------------------------------------------------------------------


@router.post("/channels/{provider}/connect", response_model=OAuthConnectResponse)
async def connect_channel(
    provider: str,
    request: OAuthConnectRequest,
    authorization: AuthorizationHeader,
    tenant_id: TenantIdHeader,
    clinic_id: ClinicIdHeader,
) -> OAuthConnectResponse:
    """Initiate OAuth flow for an ad channel provider.

    Returns authorization URL + state token to redirect the browser.

    Roles: admin_clinic.
    """
    ctx = _resolve_context(authorization)
    _require_role(ctx, _WRITE_ROLES)

    try:
        ProviderSlug(provider)
    except ValueError:
        valid = [p.value for p in ProviderSlug]
        raise HTTPException(
            status_code=400,
            detail=f"Proveedor inválido: '{provider}'. Los proveedores válidos son: {valid}.",
        )

    svc = _get_oauth_service()
    result = await svc.initiate_oauth(
        tenant_id=ctx.tenant_id,
        clinic_id=ctx.clinic_id,
        provider=provider,
        redirect_uri=request.redirect_uri,
    )

    return OAuthConnectResponse(
        provider=result.provider if hasattr(result, "provider") else provider,
        authorization_url=result.authorization_url,
        state_token=result.state_token,
    )


@router.post("/channels/{provider}/sync", response_model=SyncResponse)
async def sync_channel(
    provider: str,
    authorization: AuthorizationHeader,
    tenant_id: TenantIdHeader,
    clinic_id: ClinicIdHeader,
    idempotency_key: IdempotencyKeyHeader = None,
) -> SyncResponse:
    """Manually trigger OAuth sync for a channel provider.

    Idempotency-Key header is REQUIRED to prevent duplicate syncs.

    Roles: admin_clinic.
    """
    ctx = _resolve_context(authorization)
    _require_role(ctx, _WRITE_ROLES)
    _require_idempotency_key(idempotency_key)

    try:
        ProviderSlug(provider)
    except ValueError:
        valid = [p.value for p in ProviderSlug]
        raise HTTPException(
            status_code=400,
            detail=f"Proveedor inválido: '{provider}'. Los proveedores válidos son: {valid}.",
        )

    svc = _get_sync_service()
    result = await svc.sync_channel(
        tenant_id=ctx.tenant_id,
        clinic_id=ctx.clinic_id,
        provider=provider,
        idempotency_key=idempotency_key,
    )

    return SyncResponse(
        provider=result.provider if hasattr(result, "provider") else provider,
        status=result.status,
        last_synced_at=result.last_synced_at,
        error_message=result.error_message,
    )


# ---------------------------------------------------------------------------
# Recommendations endpoints
# ---------------------------------------------------------------------------


@router.get("/recommendations", response_model=list[LucasRecommendationResponse])
async def list_recommendations(
    authorization: AuthorizationHeader,
    tenant_id: TenantIdHeader,
    clinic_id: ClinicIdHeader,
    stage: str | None = Query(default=None),
    limit: int = Query(default=3, ge=1, le=10),
) -> list[LucasRecommendationResponse]:
    """List open Lucas marketing recommendations for a clinic.

    Optionally filtered by bowtie stage. Returns top-N by priority.

    Roles: doctor, nurse, admin_clinic, recepcion.
    """
    ctx = _resolve_context(authorization)
    _require_role(ctx, _READ_ROLES)

    bowtie_stage: BowtieStage | None = None
    if stage:
        try:
            bowtie_stage = BowtieStage(stage)
        except ValueError:
            valid = [s.value for s in BowtieStage]
            raise HTTPException(
                status_code=400,
                detail=f"Etapa inválida: '{stage}'. Las etapas válidas son: {valid}.",
            )

    svc = _get_recs_service()
    if bowtie_stage:
        models = await svc.list_open_by_stage(
            tenant_id=ctx.tenant_id,
            clinic_id=ctx.clinic_id,
            stage=bowtie_stage,
            limit=limit,
        )
    else:
        # No stage filter — list all stages (attract + convert + retain)
        all_models = []
        for s in BowtieStage:
            stage_models = await svc.list_open_by_stage(
                tenant_id=ctx.tenant_id,
                clinic_id=ctx.clinic_id,
                stage=s,
                limit=limit,
            )
            all_models.extend(stage_models)
        models = all_models

    return [LucasRecommendationResponse.model_validate(m) for m in models]


@router.post(
    "/recommendations/{rec_id}/approve",
    response_model=LucasRecommendationResponse,
)
async def approve_recommendation(
    rec_id: UUID,
    request: ApproveRecommendationRequest,
    authorization: AuthorizationHeader,
    tenant_id: TenantIdHeader,
    clinic_id: ClinicIdHeader,
    idempotency_key: IdempotencyKeyHeader = None,
) -> LucasRecommendationResponse:
    """Approve a Lucas marketing recommendation (OPEN → APPROVED).

    Sets undo_until = now + 5 minutes.
    Idempotency-Key header REQUIRED to prevent double-approval.

    Roles: admin_clinic.

    Raises:
        HTTPException(409): Recommendation already approved or rejected.
        HTTPException(410): Recommendation expired.
        HTTPException(422): Idempotency-Key header missing.
    """
    ctx = _resolve_context(authorization)
    _require_role(ctx, _WRITE_ROLES)
    _require_idempotency_key(idempotency_key)

    svc = _get_recs_service()
    try:
        model = await svc.approve(
            tenant_id=ctx.tenant_id,
            clinic_id=ctx.clinic_id,
            recommendation_id=rec_id,
            user_id=request.user_id,
        )
    except InvalidStateTransitionError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    return LucasRecommendationResponse.model_validate(model)


@router.post(
    "/recommendations/{rec_id}/reject",
    response_model=LucasRecommendationResponse,
)
async def reject_recommendation(
    rec_id: UUID,
    request: RejectRecommendationRequest,
    authorization: AuthorizationHeader,
    tenant_id: TenantIdHeader,
    clinic_id: ClinicIdHeader,
    idempotency_key: IdempotencyKeyHeader = None,
) -> LucasRecommendationResponse:
    """Reject a Lucas marketing recommendation (OPEN → REJECTED).

    Idempotency-Key header REQUIRED.

    Roles: admin_clinic.

    Raises:
        HTTPException(409): Recommendation already approved or rejected.
        HTTPException(422): Idempotency-Key header missing.
    """
    ctx = _resolve_context(authorization)
    _require_role(ctx, _WRITE_ROLES)
    _require_idempotency_key(idempotency_key)

    svc = _get_recs_service()
    try:
        model = await svc.reject(
            tenant_id=ctx.tenant_id,
            clinic_id=ctx.clinic_id,
            recommendation_id=rec_id,
            user_id=request.user_id,
            reason=request.reason,
        )
    except InvalidStateTransitionError as e:
        raise HTTPException(status_code=409, detail=str(e))

    return LucasRecommendationResponse.model_validate(model)


@router.post(
    "/recommendations/{rec_id}/undo",
    response_model=LucasRecommendationResponse,
)
async def undo_recommendation(
    rec_id: UUID,
    authorization: AuthorizationHeader,
    tenant_id: TenantIdHeader,
    clinic_id: ClinicIdHeader,
    idempotency_key: IdempotencyKeyHeader = None,
) -> LucasRecommendationResponse:
    """Undo a recent recommendation approval (APPROVED → OPEN).

    Only allowed within the 5-minute undo window after approval.
    Idempotency-Key header REQUIRED.

    Roles: admin_clinic.

    Raises:
        HTTPException(409): Recommendation not in APPROVED status.
        HTTPException(410): Undo window has expired.
        HTTPException(422): Idempotency-Key header missing.
    """
    ctx = _resolve_context(authorization)
    _require_role(ctx, _WRITE_ROLES)
    _require_idempotency_key(idempotency_key)

    svc = _get_recs_service()
    try:
        model = await svc.undo(
            tenant_id=ctx.tenant_id,
            clinic_id=ctx.clinic_id,
            recommendation_id=rec_id,
        )
    except UndoWindowExpiredError as e:
        raise HTTPException(status_code=410, detail=str(e))
    except InvalidStateTransitionError as e:
        raise HTTPException(status_code=409, detail=str(e))

    return LucasRecommendationResponse.model_validate(model)


# ---------------------------------------------------------------------------
# Attribution matrix
# ---------------------------------------------------------------------------


@router.get("/attribution-matrix", response_model=AttributionMatrixResponse)
async def get_attribution_matrix(
    authorization: AuthorizationHeader,
    tenant_id: TenantIdHeader,
    clinic_id: ClinicIdHeader,
    period_start: datetime.date | None = Query(default=None),
    period_end: datetime.date | None = Query(default=None),
) -> AttributionMatrixResponse:
    """Attribution matrix — revenue by ad channel for a period.

    Roles: admin_clinic.
    """
    ctx = _resolve_context(authorization)
    _require_role(ctx, _WRITE_ROLES)

    start, end = _default_period()
    if period_start:
        start = period_start
    if period_end:
        end = period_end

    svc = _get_attribution_service()
    result = await svc.get_attribution_matrix(
        tenant_id=ctx.tenant_id,
        clinic_id=ctx.clinic_id,
        period_start=start,
        period_end=end,
    )
    return result


# ---------------------------------------------------------------------------
# Referrals leaderboard
# ---------------------------------------------------------------------------


@router.get("/referrals", response_model=ReferralsResponse)
async def get_referrals(
    authorization: AuthorizationHeader,
    tenant_id: TenantIdHeader,
    clinic_id: ClinicIdHeader,
    period_start: datetime.date | None = Query(default=None),
    period_end: datetime.date | None = Query(default=None),
) -> ReferralsResponse:
    """Patient referrals leaderboard snapshot.

    HIPAA: top_referrers uses referrer_id (UUID hash) — no patient names.

    Roles: admin_clinic.
    """
    ctx = _resolve_context(authorization)
    _require_role(ctx, _WRITE_ROLES)

    start, end = _default_period()
    if period_start:
        start = period_start
    if period_end:
        end = period_end

    svc = _get_referrals_service()
    result = await svc.get_referrals(
        tenant_id=ctx.tenant_id,
        clinic_id=ctx.clinic_id,
        period_start=start,
        period_end=end,
    )
    return result
