"""Comunify FastAPI router — all REST endpoints (excl. webhooks T-be-9).

Per 03-arch-be.md § 6 + 05-guidelines § 1.1 (DDD — API thin):
  - Router is THIN: validate DTO → call service → map domain exception → HTTPException.
  - NO business logic in this module.
  - redirect_slashes=False is set on the FastAPI *app* (main.py) — NOT on APIRouter.
  - response_model= is MANDATORY on every endpoint (PII gate + arch test).
  - tenant_id is sourced from X-Tenant-ID header (authoritative — NOT from body).
  - Clerk JWT auth via Annotated dependency (X-Clerk-User-ID header).

Endpoints (per 03-arch-be.md § 6, excl. webhooks T-be-9):
  Onboarding (4):     POST creator-profile, POST check-handle, GET plans, POST subscribe
  Voice Cloning (5):  POST samples, GET samples/status, POST distill, GET distillation/{id}, POST ratify
  Authority Vault (6): GET vault, POST credentials, POST case-studies, POST press-mentions,
                       POST awards, POST validate-url
  Offer + Ladder (5): GET presets/coaching_offers_v1, POST offers, GET offers, GET ladder, PATCH ladder/connections
  Cohort (7):         POST cohorts, GET cohorts, GET cohorts/{id}, GET cohorts/{id}/roster,
                      POST cohorts/{id}/enroll, POST cohorts/{id}/broadcasts, GET cohorts/{id}/broadcasts
  Community (4):      GET feed, POST posts, GET moderation/inbox, POST moderation/{post_id}/action
  Subscription (5):   GET subscriptions, GET subscriptions/{id}, POST subscriptions/{id}/cancel,
                      POST subscriptions/{id}/resend-payment-link, GET subscriptions/metrics
  Compliance (1):     GET community-audit/events

Total: 37 endpoints (webhooks excluded — T-be-9).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Annotated

import structlog
from fastapi import APIRouter, Header, HTTPException, Query
from fastapi.responses import StreamingResponse  # noqa: F401 — reserved for audio streaming T-be-10

from src.modules.comunify.api.dtos.authority_vault_dtos import (
    AddAwardRequest,
    AddCaseStudyRequest,
    AddCredentialRequest,
    AddPressMentionRequest,
    AuthorityVaultResponse,
    AwardResponse,
    CaseStudyResponse,
    CredentialResponse,
    PressMentionResponse,
    ValidateUrlRequest,
    ValidateUrlResponse,
    VaultItemResponse,  # noqa: F401 — used in vault item detail response T-be-10
)

from src.modules.comunify.api.dtos.cohort_dtos import (
    BroadcastListResponse,
    CohortDetailResponse,
    CohortListResponse,
    CohortRosterResponse,
    CreateCohortRequest,
    CreateCohortResponse,
    EnrollCohortRequest,
    EnrollCohortResponse,
    SendBroadcastRequest,
    SendBroadcastResponse,
)
from src.modules.comunify.api.dtos.community_dtos import (
    CommunityFeedResponse,
    CreatePostRequest,
    CreatePostResponse,
    ModerationActionRequest,
    ModerationActionResponse,
    ModerationInboxResponse,
)
from src.modules.comunify.api.dtos.compliance_dtos import AuditEventListResponse
from src.modules.comunify.api.dtos.offer_ladder_dtos import (
    CreateOfferRequest,
    CreateOfferResponse,
    OfferLadderResponse,
    OfferListResponse,
    OfferPresetResponse,
    UpdateLadderConnectionsRequest,
)
from src.modules.comunify.api.dtos.onboarding_dtos import (
    CheckHandleRequest,
    CheckHandleResponse,
    CreateCreatorProfileRequest,
    CreateCreatorProfileResponse,
    PlanTierItem,
    PlanTierListResponse,
    SubscribeRequest,
    SubscribeResponse,
)
from src.modules.comunify.api.dtos.subscription_dtos import (
    CancelSubscriptionRequest,
    CancelSubscriptionResponse,
    ResendPaymentLinkResponse,
    SubscriptionDetailResponse,
    SubscriptionListResponse,
    SubscriptionMetricsResponse,
)
from src.modules.comunify.api.dtos.voice_cloning_dtos import (
    DistillJobResponse,
    DistillJobStatusResponse,
    DistillRequest,
    RatifyRequest,
    RatifyResponse,
    SamplesStatusResponse,
    UploadSamplesRequest,
    UploadSamplesResponse,
)
from src.modules.comunify.application.services.cohort_service import (
    CohortEnrollmentRaceError,  # noqa: F401 — used when stubs wired in T-be-10
    CohortNotFoundError,  # noqa: F401 — used when stubs wired in T-be-10
)
from src.modules.comunify.application.services.voice_cloning_service import (
    DistillationJobNotFoundError,  # noqa: F401 — used when stubs wired in T-be-10
    DistillationNotCompletedError,  # noqa: F401 — used when stubs wired in T-be-10
    InsufficientSamplesError,  # noqa: F401 — used when stubs wired in T-be-10
)
from src.modules.comunify.application.services.onboarding_service import (
    DuplicateHandleError,  # noqa: F401 — used when stubs wired in T-be-10
    InvalidNicheError,  # noqa: F401 — used when stubs wired in T-be-10
    InvalidPlanTierError,  # noqa: F401 — used when stubs wired in T-be-10
)
from src.modules.comunify.application.services.authority_vault_service import (
    AuthorityVaultItemNotFoundError,  # noqa: F401 — used when stubs wired in T-be-10
)

logger = structlog.get_logger()

# ── Type aliases for Annotated headers ────────────────────────────────────────

TenantIdHeader = Annotated[str, Header(alias="X-Tenant-ID", description="Active tenant UUID")]
ClerkUserIdHeader = Annotated[
    str | None,
    Header(alias="X-Clerk-User-ID", description="Clerk JWT sub claim (optional for public endpoints)"),
]


# ── Router ────────────────────────────────────────────────────────────────────

# redirect_slashes=False is set on FastAPI app in main.py (arch test enforces).
# Do NOT set redirect_slashes on individual APIRouter instances.
router = APIRouter(
    prefix="/api/v1/comunify",
    tags=["comunify"],
)

# Offer routes use a separate sub-router with /offers prefix per spec § 7.1
offer_router = APIRouter(
    prefix="/api/v1",
    tags=["comunify-offers"],
)


def _parse_tenant_id(tenant_id_str: str) -> uuid.UUID:
    """Parse tenant_id string to UUID — raise 422 on invalid format."""
    try:
        return uuid.UUID(tenant_id_str)
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid X-Tenant-ID format: {tenant_id_str}",
        ) from exc


def _utc_now() -> datetime:
    return datetime.now(tz=timezone.utc)


# ══════════════════════════════════════════════════════════════════════════════
# ONBOARDING (§ 6.1)
# ══════════════════════════════════════════════════════════════════════════════


@router.post(
    "/onboarding/creator-profile",
    response_model=CreateCreatorProfileResponse,
    status_code=201,
    summary="Create creator profile + tenant (idempotent)",
)
async def create_creator_profile(
    request: CreateCreatorProfileRequest,
    x_tenant_id: TenantIdHeader,
    x_clerk_user_id: ClerkUserIdHeader = None,
) -> CreateCreatorProfileResponse:
    """Create creator tenant + initialize BrandConfig defaults.

    Idempotent: same clerk_user_id within 1s TTL returns existing tenant.
    X-Tenant-ID header is the authoritative tenant context.

    Raises:
        422 — invalid niche or plan_tier
        409 — creator_handle already taken
    """
    tenant_id = _parse_tenant_id(x_tenant_id)

    logger.info(
        "onboarding_creator_profile_request",
        tenant_id=str(tenant_id),
        creator_handle=request.creator_handle,
        niche=request.niche,
    )

    # Validate catalog values — raise 422 if invalid
    from src.modules.comunify.application.services.onboarding_service import (
        ALLOWED_NICHES,
        ALLOWED_PLAN_TIERS,
    )

    if request.niche not in ALLOWED_NICHES:
        raise HTTPException(
            status_code=422,
            detail=f"niche '{request.niche}' is not in the allowed catalog",
        )
    if request.plan_tier not in ALLOWED_PLAN_TIERS:
        raise HTTPException(
            status_code=422,
            detail=f"plan_tier '{request.plan_tier}' is not valid",
        )

    # Stub: full DI wiring in integration layer (T-be-8 scope = routes + DTOs)
    now = _utc_now()
    return CreateCreatorProfileResponse(
        tenant_id=tenant_id,
        creator_handle=request.creator_handle,
        display_name=request.display_name,
        niche=request.niche,
        plan_tier=request.plan_tier,
        is_new=True,
        created_at=now,
    )


@router.post(
    "/onboarding/check-handle",
    response_model=CheckHandleResponse,
    summary="Check creator_handle uniqueness (async validation)",
)
async def check_handle(
    request: CheckHandleRequest,
    x_tenant_id: TenantIdHeader,
) -> CheckHandleResponse:
    """Async validation of creator_handle uniqueness.

    Returns available=True if handle is not taken.
    Auth: Clerk JWT optional (public pre-signup preview).
    """
    _parse_tenant_id(x_tenant_id)

    logger.info("onboarding_check_handle", creator_handle=request.creator_handle)

    # Stub: returns available=True (full uniqueness check wired in integration)
    return CheckHandleResponse(
        creator_handle=request.creator_handle,
        available=True,
    )


@router.get(
    "/onboarding/plans",
    response_model=PlanTierListResponse,
    summary="List available plan tiers",
)
async def list_plans(
    x_tenant_id: TenantIdHeader,
) -> PlanTierListResponse:
    """List comunify plan tiers from plan_tier_configs catalog.

    Cross-tenant: plan tier catalog has no tenant_id filter (global catalog).
    Auth: Clerk JWT optional (publicly accessible for pre-signup preview).
    """
    _parse_tenant_id(x_tenant_id)

    plans = [
        PlanTierItem(
            slug="creator",
            label_es="Creator",
            price_usd_monthly=29.0,
            features_enabled=[
                "brand_studio",
                "offer_studio_coaching",
                "voice_cloning",
                "community_1_cohort",
                "whatsapp_1000_day",
            ],
        ),
        PlanTierItem(
            slug="pro",
            label_es="Pro",
            price_usd_monthly=99.0,
            features_enabled=[
                "brand_studio",
                "offer_studio_coaching",
                "voice_cloning",
                "community_5_cohorts",
                "whatsapp_5000_day",
                "authority_vault",
                "analytics_growth",
            ],
        ),
        PlanTierItem(
            slug="agency",
            label_es="Agency",
            price_usd_monthly=299.0,
            features_enabled=[
                "brand_studio",
                "offer_studio_coaching",
                "voice_cloning",
                "community_unlimited_cohorts",
                "whatsapp_unlimited",
                "authority_vault",
                "analytics_growth",
                "multi_tenant_management",
            ],
        ),
    ]
    return PlanTierListResponse(plans=plans)


@router.post(
    "/onboarding/subscribe",
    response_model=SubscribeResponse,
    status_code=201,
    summary="Initiate subscription checkout (Stripe/MercadoPago)",
)
async def subscribe(
    request: SubscribeRequest,
    x_tenant_id: TenantIdHeader,
    x_clerk_user_id: ClerkUserIdHeader = None,
) -> SubscribeResponse:
    """Create Stripe Checkout session for plan subscription.

    Returns checkout_url for redirect. gateway defaults to stripe_connect.
    Full payment adapter wired in T-payment-1.
    """
    tenant_id = _parse_tenant_id(x_tenant_id)

    logger.info(
        "onboarding_subscribe_request",
        tenant_id=str(tenant_id),
        plan_tier=request.plan_tier,
        gateway=request.gateway,
    )

    # Stub: payment adapter wired in T-payment-1
    return SubscribeResponse(
        checkout_session_id=f"cs_stub_{str(tenant_id)[:8]}",
        checkout_url="https://checkout.stripe.com/stub",
        plan_tier=request.plan_tier,
    )


# ══════════════════════════════════════════════════════════════════════════════
# VOICE CLONING (§ 6.2)
# ══════════════════════════════════════════════════════════════════════════════


@router.post(
    "/voice-cloning/samples",
    response_model=UploadSamplesResponse,
    status_code=201,
    summary="Upload voice cloning samples (chats + voice notes)",
)
async def upload_voice_samples(
    request: UploadSamplesRequest,
    x_tenant_id: TenantIdHeader,
    x_clerk_user_id: ClerkUserIdHeader = None,
) -> UploadSamplesResponse:
    """Upload voice cloning sample batches and update counters.

    Returns current totals and readiness flag for distillation.
    Full VoiceCloningService DI wired in integration layer.
    """
    tenant_id = _parse_tenant_id(x_tenant_id)

    logger.info(
        "voice_cloning_samples_upload",
        tenant_id=str(tenant_id),
        chats_count=request.chats_count,
        voice_notes_count=request.voice_notes_count,
    )

    # Stub: VoiceCloningService.upload_samples called in integration layer
    total_chats = request.chats_count
    total_voice = request.voice_notes_count
    return UploadSamplesResponse(
        total_chats_count=total_chats,
        total_voice_notes_count=total_voice,
        threshold=50,
        ready_for_distillation=(total_chats >= 50),
    )


@router.get(
    "/voice-cloning/samples/status",
    response_model=SamplesStatusResponse,
    summary="Get voice cloning samples status + dialect detection",
)
async def get_voice_samples_status(
    x_tenant_id: TenantIdHeader,
    x_clerk_user_id: ClerkUserIdHeader = None,
) -> SamplesStatusResponse:
    """Get current samples counter + readiness for distillation."""
    tenant_id = _parse_tenant_id(x_tenant_id)

    logger.info("voice_cloning_samples_status", tenant_id=str(tenant_id))

    return SamplesStatusResponse(
        total_chats_count=0,
        total_voice_notes_count=0,
        threshold=50,
        ready_for_distillation=False,
        last_distillation_at=None,
    )


@router.post(
    "/voice-cloning/distill",
    response_model=DistillJobResponse,
    status_code=202,
    summary="Kick async voice distillation job",
)
async def kick_distillation(
    request: DistillRequest,
    x_tenant_id: TenantIdHeader,
    x_clerk_user_id: ClerkUserIdHeader = None,
) -> DistillJobResponse:
    """Kick async distillation job for this tenant.

    Requires samples_count >= 50. Returns job_id for polling.

    Raises:
        422 — insufficient samples (< 50)
    """
    tenant_id = _parse_tenant_id(x_tenant_id)

    logger.info("voice_cloning_distill_kick", tenant_id=str(tenant_id))

    job_id = uuid.uuid4()
    return DistillJobResponse(
        job_id=job_id,
        status="queued",
        samples_count=0,
    )


@router.get(
    "/voice-cloning/distillation/{job_id}",
    response_model=DistillJobStatusResponse,
    summary="Poll voice distillation job status",
)
async def get_distillation_status(
    job_id: uuid.UUID,
    x_tenant_id: TenantIdHeader,
    x_clerk_user_id: ClerkUserIdHeader = None,
) -> DistillJobStatusResponse:
    """Poll distillation job status.

    Raises:
        404 — job not found for this tenant
    """
    tenant_id = _parse_tenant_id(x_tenant_id)

    logger.info(
        "voice_cloning_distillation_status",
        tenant_id=str(tenant_id),
        job_id=str(job_id),
    )

    return DistillJobStatusResponse(
        job_id=job_id,
        status="queued",
        samples_count=0,
    )


@router.post(
    "/voice-cloning/ratify",
    response_model=RatifyResponse,
    summary="Ratify completed distillation — triggers Slot 5 cache invalidation",
)
async def ratify_voice(
    request: RatifyRequest,
    x_tenant_id: TenantIdHeader,
    x_clerk_user_id: ClerkUserIdHeader = None,
) -> RatifyResponse:
    """Ratify a completed distillation job.

    Emits VoiceProfileRatified event → Slot 5 cache invalidation (T-voice-3).

    Raises:
        404 — job not found
        422 — job not yet completed
    """
    tenant_id = _parse_tenant_id(x_tenant_id)

    logger.info(
        "voice_cloning_ratify",
        tenant_id=str(tenant_id),
        job_id=str(request.job_id),
    )

    now = _utc_now()
    return RatifyResponse(
        job_id=request.job_id,
        ratified_at=now,
        slot_5_invalidation_queued=True,
    )


# ══════════════════════════════════════════════════════════════════════════════
# AUTHORITY VAULT (§ 6.3)
# ══════════════════════════════════════════════════════════════════════════════


@router.get(
    "/authority-vault",
    response_model=AuthorityVaultResponse,
    summary="Get all authority vault subsections for tenant",
)
async def get_authority_vault(
    x_tenant_id: TenantIdHeader,
    x_clerk_user_id: ClerkUserIdHeader = None,
) -> AuthorityVaultResponse:
    """Return all authority vault items grouped by kind for this tenant."""
    tenant_id = _parse_tenant_id(x_tenant_id)

    logger.info("authority_vault_get", tenant_id=str(tenant_id))

    return AuthorityVaultResponse(
        credentials=[],
        case_studies=[],
        press_mentions=[],
        awards=[],
    )


@router.post(
    "/authority-vault/credentials",
    response_model=CredentialResponse,
    status_code=201,
    summary="Add credential to authority vault",
)
async def add_credential(
    request: AddCredentialRequest,
    x_tenant_id: TenantIdHeader,
    x_clerk_user_id: ClerkUserIdHeader = None,
) -> CredentialResponse:
    """Add a credential item to the authority vault.

    URL validation is async best-effort (timeout 5s per tessl__graceful-degradation).
    """
    tenant_id = _parse_tenant_id(x_tenant_id)

    logger.info(
        "authority_vault_add_credential",
        tenant_id=str(tenant_id),
        title=request.title,
    )

    now = _utc_now()
    return CredentialResponse(
        id=uuid.uuid4(),
        kind="credentials",
        title=request.title,
        url_status="unvalidated" if request.url else None,
        created_at=now,
    )


@router.post(
    "/authority-vault/case-studies",
    response_model=CaseStudyResponse,
    status_code=201,
    summary="Add case study to authority vault",
)
async def add_case_study(
    request: AddCaseStudyRequest,
    x_tenant_id: TenantIdHeader,
    x_clerk_user_id: ClerkUserIdHeader = None,
) -> CaseStudyResponse:
    """Add a case study to the authority vault."""
    tenant_id = _parse_tenant_id(x_tenant_id)

    logger.info(
        "authority_vault_add_case_study",
        tenant_id=str(tenant_id),
        title=request.title,
    )

    now = _utc_now()
    return CaseStudyResponse(
        id=uuid.uuid4(),
        kind="case_studies",
        title=request.title,
        url_status="unvalidated" if request.url else None,
        created_at=now,
    )


@router.post(
    "/authority-vault/press-mentions",
    response_model=PressMentionResponse,
    status_code=201,
    summary="Add press mention to authority vault",
)
async def add_press_mention(
    request: AddPressMentionRequest,
    x_tenant_id: TenantIdHeader,
    x_clerk_user_id: ClerkUserIdHeader = None,
) -> PressMentionResponse:
    """Add a press mention to the authority vault."""
    tenant_id = _parse_tenant_id(x_tenant_id)

    logger.info(
        "authority_vault_add_press_mention",
        tenant_id=str(tenant_id),
        title=request.title,
    )

    now = _utc_now()
    return PressMentionResponse(
        id=uuid.uuid4(),
        kind="press_mentions",
        title=request.title,
        url_status="unvalidated" if request.url else None,
        created_at=now,
    )


@router.post(
    "/authority-vault/awards",
    response_model=AwardResponse,
    status_code=201,
    summary="Add award to authority vault",
)
async def add_award(
    request: AddAwardRequest,
    x_tenant_id: TenantIdHeader,
    x_clerk_user_id: ClerkUserIdHeader = None,
) -> AwardResponse:
    """Add an award to the authority vault."""
    tenant_id = _parse_tenant_id(x_tenant_id)

    logger.info(
        "authority_vault_add_award",
        tenant_id=str(tenant_id),
        title=request.title,
    )

    now = _utc_now()
    return AwardResponse(
        id=uuid.uuid4(),
        kind="awards",
        title=request.title,
        url_status="unvalidated" if request.url else None,
        created_at=now,
    )


@router.post(
    "/authority-vault/validate-url",
    response_model=ValidateUrlResponse,
    summary="Async URL reachability check",
)
async def validate_url(
    request: ValidateUrlRequest,
    x_tenant_id: TenantIdHeader,
    x_clerk_user_id: ClerkUserIdHeader = None,
) -> ValidateUrlResponse:
    """Check URL reachability via HTTP HEAD with 5s timeout.

    Per tessl__graceful-degradation: timeout + fallback.
    Returns status=validated|unreachable|timeout.
    """
    tenant_id = _parse_tenant_id(x_tenant_id)

    logger.info(
        "authority_vault_validate_url",
        tenant_id=str(tenant_id),
        url=request.url,
    )

    # Stub: real httpx HEAD request in integration layer
    return ValidateUrlResponse(
        url=request.url,
        reachable=True,
        status="validated",
    )


# ══════════════════════════════════════════════════════════════════════════════
# OFFER + LADDER (§ 6.4) — uses offer_router prefix /api/v1
# ══════════════════════════════════════════════════════════════════════════════


@offer_router.get(
    "/offers/presets/coaching_offers_v1",
    response_model=OfferPresetResponse,
    summary="Get Comunify coaching offers preset config",
)
async def get_offer_preset(
    x_tenant_id: TenantIdHeader,
    x_clerk_user_id: ClerkUserIdHeader = None,
) -> OfferPresetResponse:
    """Return the Comunify coaching offers preset configuration.

    Per 03-arch-be.md § 6.4 — reuses @luana/core/offer-studio preset catalog.
    """
    _parse_tenant_id(x_tenant_id)

    return OfferPresetResponse(
        preset_id="coaching_offers_v1",
        label_es="Ofertas de Coaching y Consultoría",
        description_es="Preset optimizado para coaches, mentores y consultores LATAM",
        archetype="PROGRAMA",
        value_levels=["lead_magnet", "tripwire", "core", "premium"],
        sections=["IDENTITY", "STRATEGY", "PROMISE", "VALUE_STACK", "PRICING", "CLOSING"],
    )


@offer_router.post(
    "/offers",
    response_model=CreateOfferResponse,
    status_code=201,
    summary="Create offer (reuses @luana/core/offer-studio)",
)
async def create_offer(
    request: CreateOfferRequest,
    x_tenant_id: TenantIdHeader,
    x_clerk_user_id: ClerkUserIdHeader = None,
) -> CreateOfferResponse:
    """Create a new offer for this tenant.

    Per 03-arch-be.md § 6.4 — reuses @luana/core/offer-studio create_offer.
    """
    tenant_id = _parse_tenant_id(x_tenant_id)

    logger.info(
        "offer_create",
        tenant_id=str(tenant_id),
        name=request.name,
        value_level=request.value_level,
    )

    now = _utc_now()
    return CreateOfferResponse(
        offer_id=uuid.uuid4(),
        name=request.name,
        value_level=request.value_level,
        preset_id=request.preset_id,
        created_at=now,
    )


@offer_router.get(
    "/offers",
    response_model=OfferListResponse,
    summary="List offers for tenant",
)
async def list_offers(
    x_tenant_id: TenantIdHeader,
    status: Annotated[str | None, Query(description="Filter by status")] = None,
    value_level: Annotated[str | None, Query(description="Filter by value level")] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    x_clerk_user_id: ClerkUserIdHeader = None,
) -> OfferListResponse:
    """List offers for this tenant with optional filters."""
    tenant_id = _parse_tenant_id(x_tenant_id)

    logger.info("offer_list", tenant_id=str(tenant_id), status=status, value_level=value_level)

    return OfferListResponse(items=[], total=0, page=page)


@router.get(
    "/ladder",
    response_model=OfferLadderResponse,
    summary="Get current offer ladder state for tenant",
)
async def get_ladder(
    x_tenant_id: TenantIdHeader,
    x_clerk_user_id: ClerkUserIdHeader = None,
) -> OfferLadderResponse:
    """Return current 4-level offer ladder for this tenant.

    Returns empty ladder (all levels None) if not yet configured.
    """
    tenant_id = _parse_tenant_id(x_tenant_id)

    logger.info("ladder_get", tenant_id=str(tenant_id))

    return OfferLadderResponse(
        ladder_id=None,
        completeness_score=0,
        gaps=["lead_magnet", "tripwire", "core_offer", "premium"],
    )


@router.patch(
    "/ladder/connections",
    response_model=OfferLadderResponse,
    summary="Update offer ladder level connections (drag-drop)",
)
async def update_ladder_connections(
    request: UpdateLadderConnectionsRequest,
    x_tenant_id: TenantIdHeader,
    x_clerk_user_id: ClerkUserIdHeader = None,
) -> OfferLadderResponse:
    """Update ladder level → offer_id assignments.

    Per OfferLadderService.update_connections — creates if absent, updates if exists.
    """
    tenant_id = _parse_tenant_id(x_tenant_id)

    logger.info(
        "ladder_update_connections",
        tenant_id=str(tenant_id),
        level_1=str(request.level_1_offer_id) if request.level_1_offer_id else None,
        level_2=str(request.level_2_offer_id) if request.level_2_offer_id else None,
        level_3=str(request.level_3_offer_id) if request.level_3_offer_id else None,
        level_4=str(request.level_4_offer_id) if request.level_4_offer_id else None,
    )

    # Compute gaps
    levels = [
        request.level_1_offer_id,
        request.level_2_offer_id,
        request.level_3_offer_id,
        request.level_4_offer_id,
    ]
    level_labels = ["lead_magnet", "tripwire", "core_offer", "premium"]
    gaps = [label for label, lvl in zip(level_labels, levels) if lvl is None]
    filled = sum(1 for lvl in levels if lvl is not None)
    completeness = filled * 25

    return OfferLadderResponse(
        ladder_id=uuid.uuid4(),
        level_1_offer_id=request.level_1_offer_id,
        level_2_offer_id=request.level_2_offer_id,
        level_3_offer_id=request.level_3_offer_id,
        level_4_offer_id=request.level_4_offer_id,
        completeness_score=completeness,
        gaps=gaps,
    )


# ══════════════════════════════════════════════════════════════════════════════
# COHORT (§ 6.5)
# ══════════════════════════════════════════════════════════════════════════════


@router.post(
    "/cohorts",
    response_model=CreateCohortResponse,
    status_code=201,
    summary="Create cohort with offer linkage",
)
async def create_cohort(
    request: CreateCohortRequest,
    x_tenant_id: TenantIdHeader,
    x_clerk_user_id: ClerkUserIdHeader = None,
) -> CreateCohortResponse:
    """Create a new cohort for this tenant.

    Derives slug from name. Status starts as draft.
    """
    tenant_id = _parse_tenant_id(x_tenant_id)

    logger.info(
        "cohort_create",
        tenant_id=str(tenant_id),
        name=request.name,
        capacity_max=request.capacity_max,
    )

    # Derive slug from name
    import re

    slug = re.sub(r"[^a-z0-9\-]", "", request.name.lower().replace(" ", "-"))
    slug = re.sub(r"-+", "-", slug).strip("-")[:80]

    return CreateCohortResponse(
        cohort_id=uuid.uuid4(),
        slug=slug,
        status="draft",
        capacity_filled=0,
        capacity_max=request.capacity_max,
    )


@router.get(
    "/cohorts",
    response_model=CohortListResponse,
    summary="List cohorts (paginated)",
)
async def list_cohorts(
    x_tenant_id: TenantIdHeader,
    status: Annotated[str | None, Query(description="Filter by status")] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    x_clerk_user_id: ClerkUserIdHeader = None,
) -> CohortListResponse:
    """List cohorts for this tenant with optional status filter."""
    tenant_id = _parse_tenant_id(x_tenant_id)

    logger.info("cohort_list", tenant_id=str(tenant_id), status=status, page=page)

    return CohortListResponse(items=[], total=0, page=page)


@router.get(
    "/cohorts/{cohort_id}",
    response_model=CohortDetailResponse,
    summary="Get cohort detail + roster summary",
)
async def get_cohort(
    cohort_id: uuid.UUID,
    x_tenant_id: TenantIdHeader,
    x_clerk_user_id: ClerkUserIdHeader = None,
) -> CohortDetailResponse:
    """Get cohort detail for this tenant.

    Raises:
        404 — cohort not found for this tenant
    """
    tenant_id = _parse_tenant_id(x_tenant_id)

    logger.info("cohort_get", tenant_id=str(tenant_id), cohort_id=str(cohort_id))

    # Stub: full CohortRepository.get_by_id in integration layer
    now = _utc_now()
    return CohortDetailResponse(
        cohort_id=cohort_id,
        name="Cohorte Q2",
        slug="cohorte-q2",
        status="draft",
        offer_id=uuid.uuid4(),
        capacity_filled=0,
        capacity_max=20,
        capacity_waitlist=0,
        start_date=now,
        end_date=now,
        enrollment_criteria={},
        created_at=now,
        updated_at=now,
    )


@router.get(
    "/cohorts/{cohort_id}/roster",
    response_model=CohortRosterResponse,
    summary="Get cohort roster — members with engagement + last_active",
)
async def get_cohort_roster(
    cohort_id: uuid.UUID,
    x_tenant_id: TenantIdHeader,
    tier: Annotated[str | None, Query()] = None,
    engagement_bucket: Annotated[str | None, Query()] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    x_clerk_user_id: ClerkUserIdHeader = None,
) -> CohortRosterResponse:
    """Get cohort roster filtered by tier and/or engagement bucket.

    PII masked: name_display = 'FirstName L.' pattern.
    """
    tenant_id = _parse_tenant_id(x_tenant_id)

    logger.info(
        "cohort_roster_get",
        tenant_id=str(tenant_id),
        cohort_id=str(cohort_id),
        tier=tier,
        engagement_bucket=engagement_bucket,
    )

    return CohortRosterResponse(
        cohort_id=cohort_id,
        members=[],
        total=0,
        page=page,
    )


@router.post(
    "/cohorts/{cohort_id}/enroll",
    response_model=EnrollCohortResponse,
    status_code=201,
    summary="Enroll subscriber in cohort (advisory lock + capacity check)",
)
async def enroll_cohort(
    cohort_id: uuid.UUID,
    request: EnrollCohortRequest,
    x_tenant_id: TenantIdHeader,
    x_clerk_user_id: ClerkUserIdHeader = None,
) -> EnrollCohortResponse:
    """Enroll subscriber in cohort with advisory lock.

    Raises:
        404 — cohort not found
        409 — concurrent enrollment race (retry advised)
    """
    tenant_id = _parse_tenant_id(x_tenant_id)

    logger.info(
        "cohort_enroll",
        tenant_id=str(tenant_id),
        cohort_id=str(cohort_id),
        subscriber_id=str(request.subscriber_id),
    )

    return EnrollCohortResponse(
        member_id=uuid.uuid4(),
        cohort_id=cohort_id,
        is_waitlisted=False,
        waitlist_position=None,
        is_idempotent_hit=False,
    )


@router.post(
    "/cohorts/{cohort_id}/broadcasts",
    response_model=SendBroadcastResponse,
    status_code=201,
    summary="Send WhatsApp broadcast to cohort (rate-limit pre-flight)",
)
async def send_cohort_broadcast(
    cohort_id: uuid.UUID,
    request: SendBroadcastRequest,
    x_tenant_id: TenantIdHeader,
    x_clerk_user_id: ClerkUserIdHeader = None,
) -> SendBroadcastResponse:
    """Send WhatsApp broadcast to cohort members.

    Rate-limit pre-flight: checks plan tier WhatsApp daily limit before dispatch.

    Raises:
        404 — cohort not found
        429 — WhatsApp daily rate limit reached
    """
    tenant_id = _parse_tenant_id(x_tenant_id)

    logger.info(
        "cohort_broadcast_send",
        tenant_id=str(tenant_id),
        cohort_id=str(cohort_id),
    )

    return SendBroadcastResponse(
        broadcast_id=uuid.uuid4(),
        recipients_dispatched=0,
        recipients_queued=0,
        status="sent",
    )


@router.get(
    "/cohorts/{cohort_id}/broadcasts",
    response_model=BroadcastListResponse,
    summary="List broadcasts for cohort",
)
async def list_cohort_broadcasts(
    cohort_id: uuid.UUID,
    x_tenant_id: TenantIdHeader,
    x_clerk_user_id: ClerkUserIdHeader = None,
) -> BroadcastListResponse:
    """List broadcast history for a cohort with delivery analytics."""
    tenant_id = _parse_tenant_id(x_tenant_id)

    logger.info(
        "cohort_broadcasts_list",
        tenant_id=str(tenant_id),
        cohort_id=str(cohort_id),
    )

    return BroadcastListResponse(cohort_id=cohort_id, items=[], total=0)


# ══════════════════════════════════════════════════════════════════════════════
# COMMUNITY (§ 6.6)
# ══════════════════════════════════════════════════════════════════════════════


@router.get(
    "/community/feed",
    response_model=CommunityFeedResponse,
    summary="Get cross-cohort community feed",
)
async def get_community_feed(
    x_tenant_id: TenantIdHeader,
    cohort_id: Annotated[uuid.UUID | None, Query(description="Filter to cohort")] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    x_clerk_user_id: ClerkUserIdHeader = None,
) -> CommunityFeedResponse:
    """Get community feed for this tenant (all cohorts or filtered to one)."""
    tenant_id = _parse_tenant_id(x_tenant_id)

    logger.info("community_feed_get", tenant_id=str(tenant_id), page=page)

    return CommunityFeedResponse(posts=[], total=0, page=page)


@router.post(
    "/community/posts",
    response_model=CreatePostResponse,
    status_code=201,
    summary="Create community post (triggers moderation classifier)",
)
async def create_community_post(
    request: CreatePostRequest,
    x_tenant_id: TenantIdHeader,
    x_clerk_user_id: ClerkUserIdHeader = None,
) -> CreatePostResponse:
    """Create a community post.

    Per pre-moderation policy (spec § 14.4):
    - New members (pre_moderation_count > 0) → pending_moderation
    - High-engagement (score >= 80) → bypass pre-moderation
    - Dispatcher routes to classifier otherwise
    """
    tenant_id = _parse_tenant_id(x_tenant_id)

    logger.info(
        "community_post_create",
        tenant_id=str(tenant_id),
        author_member_id=str(request.author_member_id),
    )

    now = _utc_now()
    return CreatePostResponse(
        post_id=uuid.uuid4(),
        status="pending_moderation",
        author_member_id=request.author_member_id,
        moderation_pending=True,
        created_at=now,
    )


@router.get(
    "/community/moderation/inbox",
    response_model=ModerationInboxResponse,
    summary="Get moderation inbox — pending posts for creator review",
)
async def get_moderation_inbox(
    x_tenant_id: TenantIdHeader,
    page: Annotated[int, Query(ge=1)] = 1,
    x_clerk_user_id: ClerkUserIdHeader = None,
) -> ModerationInboxResponse:
    """Get pending posts awaiting creator review (creator auth required)."""
    tenant_id = _parse_tenant_id(x_tenant_id)

    logger.info("moderation_inbox_get", tenant_id=str(tenant_id), page=page)

    return ModerationInboxResponse(posts=[], total=0, page=page)


@router.post(
    "/community/moderation/{post_id}/action",
    response_model=ModerationActionResponse,
    summary="Creator moderation action: approve | reject | delete_and_ban",
)
async def moderate_post(
    post_id: uuid.UUID,
    request: ModerationActionRequest,
    x_tenant_id: TenantIdHeader,
    x_clerk_user_id: ClerkUserIdHeader = None,
) -> ModerationActionResponse:
    """Creator takes moderation action on a pending post.

    Actions: approve | reject | delete_and_ban.
    Persists CommunityModerationEvent row (best-effort via ComplianceEventService).

    Raises:
        404 — post not found for this tenant
    """
    tenant_id = _parse_tenant_id(x_tenant_id)

    logger.info(
        "moderation_action",
        tenant_id=str(tenant_id),
        post_id=str(post_id),
        action=request.action,
    )

    # Map action to new status
    action_status_map = {
        "approve": "auto_approved",
        "reject": "rejected_spam",
        "delete_and_ban": "rejected_nsfw",
    }
    new_status = action_status_map.get(request.action, "rejected_spam")

    now = _utc_now()
    return ModerationActionResponse(
        post_id=post_id,
        action_taken=request.action,
        new_status=new_status,
        actor_id=request.actor_id,
        acted_at=now,
    )


# ══════════════════════════════════════════════════════════════════════════════
# SUBSCRIPTION (§ 6.7)
# ══════════════════════════════════════════════════════════════════════════════


@router.get(
    "/subscriptions/metrics",
    response_model=SubscriptionMetricsResponse,
    summary="Get subscription metrics: MRR + active count + churn",
)
async def get_subscription_metrics(
    x_tenant_id: TenantIdHeader,
    x_clerk_user_id: ClerkUserIdHeader = None,
) -> SubscriptionMetricsResponse:
    """Get MRR + active subscription count + churn rate for this tenant.

    Note: placed before /subscriptions/{id} to avoid routing conflict.
    """
    from decimal import Decimal

    tenant_id = _parse_tenant_id(x_tenant_id)

    logger.info("subscription_metrics_get", tenant_id=str(tenant_id))

    return SubscriptionMetricsResponse(
        mrr=Decimal("0"),
        currency=None,
        active_count=0,
        past_due_count=0,
        cancelled_count=0,
        churn_rate=None,
        as_of=_utc_now(),
    )


@router.get(
    "/subscriptions",
    response_model=SubscriptionListResponse,
    summary="List subscriptions (active + past_due + cancelled)",
)
async def list_subscriptions(
    x_tenant_id: TenantIdHeader,
    status: Annotated[str | None, Query(description="Filter by status")] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    x_clerk_user_id: ClerkUserIdHeader = None,
) -> SubscriptionListResponse:
    """List subscriptions for this tenant."""
    tenant_id = _parse_tenant_id(x_tenant_id)

    logger.info("subscription_list", tenant_id=str(tenant_id), status=status, page=page)

    return SubscriptionListResponse(items=[], total=0, page=page)


@router.get(
    "/subscriptions/{subscription_id}",
    response_model=SubscriptionDetailResponse,
    summary="Get subscription detail + payment history",
)
async def get_subscription(
    subscription_id: uuid.UUID,
    x_tenant_id: TenantIdHeader,
    x_clerk_user_id: ClerkUserIdHeader = None,
) -> SubscriptionDetailResponse:
    """Get subscription detail including charge history.

    Raises:
        404 — subscription not found for this tenant
    """
    from decimal import Decimal

    tenant_id = _parse_tenant_id(x_tenant_id)

    logger.info(
        "subscription_get",
        tenant_id=str(tenant_id),
        subscription_id=str(subscription_id),
    )

    now = _utc_now()
    return SubscriptionDetailResponse(
        subscription_id=subscription_id,
        subscriber_id=uuid.uuid4(),
        offer_id=uuid.uuid4(),
        plan_kind="monthly_membership",
        status="active",
        started_at=now,
        monthly_amount=Decimal("99.00"),
        currency=None,
        gateway="stripe_connect",
        charges=[],
    )


@router.post(
    "/subscriptions/{subscription_id}/cancel",
    response_model=CancelSubscriptionResponse,
    summary="Cancel subscription (subscriber-initiated)",
)
async def cancel_subscription(
    subscription_id: uuid.UUID,
    request: CancelSubscriptionRequest,
    x_tenant_id: TenantIdHeader,
    x_clerk_user_id: ClerkUserIdHeader = None,
) -> CancelSubscriptionResponse:
    """Cancel subscription.

    end_of_period=True (default) → cancels at end of billing period.
    end_of_period=False → immediate cancellation.

    Raises:
        404 — subscription not found
    """
    tenant_id = _parse_tenant_id(x_tenant_id)

    logger.info(
        "subscription_cancel",
        tenant_id=str(tenant_id),
        subscription_id=str(subscription_id),
        end_of_period=request.end_of_period,
    )

    status = "cancelled_pending_end_of_period" if request.end_of_period else "cancelled"
    return CancelSubscriptionResponse(
        subscription_id=subscription_id,
        status=status,
        cancellation_at=_utc_now() if not request.end_of_period else None,
        access_until=_utc_now() if request.end_of_period else None,
    )


@router.post(
    "/subscriptions/{subscription_id}/resend-payment-link",
    response_model=ResendPaymentLinkResponse,
    summary="Re-send payment link to past_due subscriber",
)
async def resend_payment_link(
    subscription_id: uuid.UUID,
    x_tenant_id: TenantIdHeader,
    x_clerk_user_id: ClerkUserIdHeader = None,
) -> ResendPaymentLinkResponse:
    """Re-send payment link for past_due subscription.

    Raises:
        404 — subscription not found
        422 — subscription not in past_due state
    """
    tenant_id = _parse_tenant_id(x_tenant_id)

    logger.info(
        "subscription_resend_payment_link",
        tenant_id=str(tenant_id),
        subscription_id=str(subscription_id),
    )

    return ResendPaymentLinkResponse(
        subscription_id=subscription_id,
        payment_link="https://checkout.stripe.com/stub_resend",
        sent_at=_utc_now(),
    )


# ══════════════════════════════════════════════════════════════════════════════
# COMPLIANCE (§ 6.8)
# ══════════════════════════════════════════════════════════════════════════════


@router.get(
    "/community-audit/events",
    response_model=AuditEventListResponse,
    summary="Get paginated compliance audit log",
)
async def get_audit_events(
    x_tenant_id: TenantIdHeader,
    event_type: Annotated[str | None, Query(description="Filter by event type")] = None,
    severity: Annotated[str | None, Query(description="Filter by severity")] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 50,
    x_clerk_user_id: ClerkUserIdHeader = None,
) -> AuditEventListResponse:
    """Get paginated compliance audit log with optional filters.

    Audit log is immutable — no write endpoints.
    5-year retention via background purge job (T-workers-1).
    """
    tenant_id = _parse_tenant_id(x_tenant_id)

    logger.info(
        "audit_events_get",
        tenant_id=str(tenant_id),
        event_type=event_type,
        severity=severity,
        page=page,
    )

    filters: dict = {}
    if event_type:
        filters["event_type"] = event_type
    if severity:
        filters["severity"] = severity

    return AuditEventListResponse(
        events=[],
        total=0,
        page=page,
        page_size=page_size,
        filters_applied=filters,
    )
