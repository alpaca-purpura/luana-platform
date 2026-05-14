"""CohortBroadcastService — rate-limit pre-flight + dispatch + recipient tracking.

Per 03-arch-be.md § 9.2 + 01-spec.md § 3.5.B:
  1. Load cohort — raise CohortNotFoundError if missing.
  2. Load active members for the cohort.
  3. WhatsApp tier limit pre-flight:
     a. Resolve daily limit from PlanTierConfig (default 1000/day if config not found).
     b. Count messages already sent today (count_sent_today from broadcast_repo).
     c. remaining = daily_limit - already_sent.
     d. If remaining <= 0 → raise BroadcastRateLimitError.
     e. If remaining < len(members) → partial delivery (dispatch `remaining`, queue rest).
     f. If remaining >= len(members) → full delivery.
  4. Create CohortBroadcastModel with status='sent' (or 'sending' for partial).
  5. Save broadcast + recipient records (one per dispatched member).
  6. Return SendBroadcastResult with recipients_dispatched + recipients_queued.

D1: Receives repos via DI — no direct session construction.
D2: WhatsApp tier limit = plan_tier_config.whatsapp_daily_limit.
    Default 1000/day when PlanTierConfig not found (graceful degradation).

Note on dispatch mechanism:
  In production, actual WhatsApp dispatch is handled by the agentic sales_agent
  workflow (CommunityEngagementWorkflow). This service handles:
    - Rate limit enforcement (prevents API quota exhaustion)
    - Broadcast record creation (audit trail)
    - Recipient tracking scaffold (delivery_at populated by agentic callback)

Anti-duplication (anti-duplication.md):
  grep found NO existing CohortBroadcastService. Pattern is Comunify-specific.

References:
  - 03-arch-be.md § 9.2
  - 01-spec.md § 3.5.A + § 3.5.B
  - T-be-3-impl-log.md (broadcast_repo interface)
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

import structlog
from pydantic import BaseModel, ConfigDict, Field

from src.modules.comunify.application.services.cohort_service import CohortNotFoundError
from src.modules.comunify.infrastructure.models.cohort_broadcast_model import (
    ComunifyCohortBroadcastModel,
)
from src.modules.comunify.infrastructure.models.cohort_broadcast_recipient_model import (
    ComunifyCohortBroadcastRecipientModel,
)

logger = structlog.get_logger()

# Default WhatsApp tier limit when PlanTierConfig is not configured.
# Spec § 3.5.B: "1000/day default". Graceful degradation: allow delivery, log warning.
_DEFAULT_WHATSAPP_DAILY_LIMIT = 1000


def _utc_now() -> datetime:
    """Return current UTC datetime with timezone info."""
    return datetime.now(tz=timezone.utc)


# ── Exceptions ────────────────────────────────────────────────────────────────


class BroadcastRateLimitError(Exception):
    """Raised when WhatsApp daily message limit is fully exhausted.

    daily_limit: configured maximum messages per day for this plan tier.
    already_sent: number of messages dispatched today.

    Callers (API layer) translate this to HTTP 429 Too Many Requests.
    """

    def __init__(self, *, daily_limit: int, already_sent: int) -> None:
        self.daily_limit = daily_limit
        self.already_sent = already_sent
        super().__init__(
            f"WhatsApp daily limit reached: {already_sent}/{daily_limit} messages sent today. "
            f"Broadcast will be available tomorrow."
        )


# ── DTOs ──────────────────────────────────────────────────────────────────────


class SendBroadcastRequest(BaseModel):
    """Input DTO for cohort broadcast dispatch.

    Pydantic v2 — ConfigDict(from_attributes=True).
    """

    model_config = ConfigDict(from_attributes=True, extra="forbid")

    cohort_id: uuid.UUID
    content: str = Field(..., min_length=1, max_length=4096)
    audience_filter: dict = Field(default_factory=dict)
    channel: str = "whatsapp"  # "whatsapp" | "instagram_dm" | "email"


class SendBroadcastResult(BaseModel):
    """Output DTO for send_broadcast.

    is_rate_limited=True when not all members could be dispatched due to quota.
    recipients_queued: members whose dispatch is deferred to next day.
    """

    model_config = ConfigDict(from_attributes=True)

    broadcast_id: uuid.UUID
    cohort_id: uuid.UUID
    recipients_dispatched: int
    recipients_queued: int = 0
    is_rate_limited: bool = False
    daily_limit: int = _DEFAULT_WHATSAPP_DAILY_LIMIT
    already_sent_today: int = 0


# ── Service ───────────────────────────────────────────────────────────────────


class CohortBroadcastService:
    """Cohort broadcast — WhatsApp rate-limit pre-flight + dispatch + delivery tracking.

    Usage (D1 — receive deps via DI, FastAPI Depends):
        svc = CohortBroadcastService(
            session=db,
            cohort_repo=CohortRepository(session=db, tenant_id=tid),
            member_repo=CohortMemberRepository(session=db, tenant_id=tid),
            broadcast_repo=CohortBroadcastRepository(session=db, tenant_id=tid),
            plan_tier_repo=PlanTierConfigRepository(session=db),
            tenant_id=tid,
            plan_tier_slug=tenant_plan_tier,
        )
    """

    def __init__(
        self,
        *,
        session: Any,
        cohort_repo: Any,
        member_repo: Any,
        broadcast_repo: Any,
        plan_tier_repo: Any,
        tenant_id: uuid.UUID,
        plan_tier_slug: str,
    ) -> None:
        self._session = session
        self._cohort_repo = cohort_repo
        self._member_repo = member_repo
        self._broadcast_repo = broadcast_repo
        self._plan_tier_repo = plan_tier_repo
        self._tenant_id = tenant_id
        self._plan_tier_slug = plan_tier_slug

    async def _resolve_whatsapp_daily_limit(self) -> int:
        """Resolve WhatsApp daily message limit for this tenant's plan tier.

        Graceful degradation: returns _DEFAULT_WHATSAPP_DAILY_LIMIT (1000) when:
        - PlanTierConfig not found for this slug.
        - Config found but whatsapp_daily_limit attribute absent.
        """
        try:
            tier_config = await self._plan_tier_repo.get_by_slug(self._plan_tier_slug)
            if tier_config is None:
                logger.warning(
                    "broadcast_plan_tier_config_not_found_using_default",
                    plan_tier_slug=self._plan_tier_slug,
                    default_limit=_DEFAULT_WHATSAPP_DAILY_LIMIT,
                )
                return _DEFAULT_WHATSAPP_DAILY_LIMIT

            limit = getattr(tier_config, "whatsapp_daily_limit", None)
            if limit is None:
                logger.warning(
                    "broadcast_plan_tier_no_whatsapp_limit_using_default",
                    plan_tier_slug=self._plan_tier_slug,
                    default_limit=_DEFAULT_WHATSAPP_DAILY_LIMIT,
                )
                return _DEFAULT_WHATSAPP_DAILY_LIMIT

            return int(limit)
        except Exception:  # noqa: BLE001 — graceful degradation
            logger.warning(
                "broadcast_plan_tier_resolve_error_using_default",
                plan_tier_slug=self._plan_tier_slug,
                default_limit=_DEFAULT_WHATSAPP_DAILY_LIMIT,
                exc_info=True,
            )
            return _DEFAULT_WHATSAPP_DAILY_LIMIT

    async def send_broadcast(self, request: SendBroadcastRequest) -> SendBroadcastResult:
        """Dispatch broadcast to cohort members with WhatsApp rate-limit pre-flight.

        Algorithm:
        1. Load cohort — raise CohortNotFoundError if missing.
        2. Resolve daily WhatsApp limit from PlanTierConfig (default 1000).
        3. Count messages already sent today.
        4. If remaining == 0 → raise BroadcastRateLimitError (fully exhausted).
        5. Load active members.
        6. Determine dispatch_count = min(remaining, len(members)).
        7. Create broadcast record + recipient records for dispatched members.
        8. Return SendBroadcastResult with breakdown.

        Args:
            request: SendBroadcastRequest validated DTO.

        Returns:
            SendBroadcastResult with recipients_dispatched, recipients_queued, is_rate_limited.

        Raises:
            CohortNotFoundError: If cohort does not exist for this tenant.
            BroadcastRateLimitError: If daily WhatsApp limit is fully exhausted.
        """
        # ── Step 1: Load cohort ───────────────────────────────────────────────
        cohort = await self._cohort_repo.get_by_id(request.cohort_id)
        if cohort is None:
            raise CohortNotFoundError(request.cohort_id)

        # ── Step 2+3: Rate limit pre-flight ──────────────────────────────────
        daily_limit = await self._resolve_whatsapp_daily_limit()
        already_sent = await self._broadcast_repo.count_sent_today(
            tenant_id=self._tenant_id,
        )
        remaining = daily_limit - already_sent

        if remaining <= 0:
            logger.warning(
                "broadcast_rate_limit_fully_exhausted",
                tenant_id=str(self._tenant_id),
                cohort_id=str(request.cohort_id),
                daily_limit=daily_limit,
                already_sent=already_sent,
            )
            raise BroadcastRateLimitError(daily_limit=daily_limit, already_sent=already_sent)

        # ── Step 4: Load active members ───────────────────────────────────────
        members = await self._member_repo.list_by_cohort(
            request.cohort_id,
            status="active",
        )
        member_count = len(members)

        # ── Step 5: Determine dispatch vs queue split ─────────────────────────
        dispatch_count = min(remaining, member_count)
        queue_count = member_count - dispatch_count
        is_rate_limited = queue_count > 0

        if is_rate_limited:
            logger.info(
                "broadcast_partial_delivery",
                tenant_id=str(self._tenant_id),
                cohort_id=str(request.cohort_id),
                member_count=member_count,
                dispatch_count=dispatch_count,
                queue_count=queue_count,
                daily_limit=daily_limit,
                already_sent=already_sent,
            )

        # ── Step 6: Persist broadcast record ─────────────────────────────────
        now = _utc_now()
        broadcast_id = uuid.uuid4()
        broadcast_status = "sent" if not is_rate_limited else "partial"

        broadcast_model = ComunifyCohortBroadcastModel(
            id=broadcast_id,
            tenant_id=self._tenant_id,
            cohort_id=request.cohort_id,
            content=request.content,
            audience_filter=request.audience_filter,
            sent_at=now,
            sent_count=dispatch_count,
            recipients_count=member_count,
            status=broadcast_status,
            created_at=now,
            updated_at=now,
        )
        await self._broadcast_repo.save(broadcast_model)

        # ── Step 7: Persist recipient records (dispatched only) ───────────────
        dispatched_members = members[:dispatch_count]
        for member in dispatched_members:
            recipient_model = ComunifyCohortBroadcastRecipientModel(
                id=uuid.uuid4(),
                tenant_id=self._tenant_id,
                broadcast_id=broadcast_id,
                member_id=member.id,
                channel=request.channel,
                created_at=now,
            )
            self._session.add(recipient_model)

        if dispatched_members:
            await self._session.flush()

        logger.info(
            "broadcast_dispatched",
            tenant_id=str(self._tenant_id),
            broadcast_id=str(broadcast_id),
            cohort_id=str(request.cohort_id),
            recipients_dispatched=dispatch_count,
            recipients_queued=queue_count,
            status=broadcast_status,
        )

        return SendBroadcastResult(
            broadcast_id=broadcast_id,
            cohort_id=request.cohort_id,
            recipients_dispatched=dispatch_count,
            recipients_queued=queue_count,
            is_rate_limited=is_rate_limited,
            daily_limit=daily_limit,
            already_sent_today=already_sent,
        )
