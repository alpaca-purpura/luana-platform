"""Unit tests — CohortBroadcastService.

TDD RED phase: written before implementation exists.
Tests drive the contract per 03-arch-be.md § 9.2 + 01-spec.md § 3.5.

Covers:
  - B1: send_broadcast happy path (rate limit not hit → broadcast created + recipients tracked)
  - B2: send_broadcast rate limit pre-flight (WhatsApp 1000/day default → BroadcastRateLimitError)
  - B3: send_broadcast partial delivery (250 msg/day tier=basic, 245 sent → partial queue)
  - B4: send_broadcast cohort not found → CohortNotFoundError
  - B5: dispatch_to_recipients saves one recipient per member

D1: CohortBroadcastService receives repos via DI.
D2: WhatsApp tier limit sourced from PlanTierConfig (default 1000/day if not found).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.modules.comunify.application.services.cohort_broadcast_service import (
    BroadcastRateLimitError,
    CohortBroadcastService,
    SendBroadcastRequest,
    SendBroadcastResult,
)
from src.modules.comunify.application.services.cohort_service import CohortNotFoundError

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────


def _utc_now() -> datetime:
    return datetime.now(tz=timezone.utc)


def _make_cohort_model(
    *,
    cohort_id: uuid.UUID | None = None,
    tenant_id: uuid.UUID | None = None,
    status: str = "active",
) -> MagicMock:
    model = MagicMock()
    model.id = cohort_id or uuid.uuid4()
    model.tenant_id = tenant_id or uuid.uuid4()
    model.status = status
    model.name = "Cohorte Business"
    model.capacity_max = 20
    return model


def _make_member_model(
    *,
    member_id: uuid.UUID | None = None,
    tenant_id: uuid.UUID | None = None,
) -> MagicMock:
    model = MagicMock()
    model.id = member_id or uuid.uuid4()
    model.tenant_id = tenant_id or uuid.uuid4()
    model.subscriber_id = uuid.uuid4()
    model.status = "active"
    return model


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────


@pytest.fixture
def tenant_id() -> uuid.UUID:
    return uuid.uuid4()


@pytest.fixture
def mock_cohort_repo() -> MagicMock:
    repo = MagicMock()
    repo.get_by_id = AsyncMock(return_value=None)
    return repo


@pytest.fixture
def mock_member_repo() -> MagicMock:
    repo = MagicMock()
    repo.list_by_cohort = AsyncMock(return_value=[])
    repo.count_active_by_cohort = AsyncMock(return_value=0)
    return repo


@pytest.fixture
def mock_broadcast_repo() -> MagicMock:
    repo = MagicMock()
    repo.save = AsyncMock(return_value=None)
    repo.get_by_id = AsyncMock(return_value=None)
    repo.count_sent_today = AsyncMock(return_value=0)
    return repo


@pytest.fixture
def mock_plan_tier_repo() -> MagicMock:
    """Mock PlanTierConfigRepository — returns default tier with 1000 msg/day."""
    repo = MagicMock()
    tier = MagicMock()
    tier.whatsapp_daily_limit = 1000
    repo.get_by_slug = AsyncMock(return_value=tier)
    return repo


@pytest.fixture
def mock_session() -> MagicMock:
    session = MagicMock()
    session.add = MagicMock()
    session.flush = AsyncMock()
    return session


@pytest.fixture
def broadcast_service(
    tenant_id: uuid.UUID,
    mock_cohort_repo: MagicMock,
    mock_member_repo: MagicMock,
    mock_broadcast_repo: MagicMock,
    mock_plan_tier_repo: MagicMock,
    mock_session: MagicMock,
) -> CohortBroadcastService:
    """CohortBroadcastService with all dependencies mocked."""
    return CohortBroadcastService(
        session=mock_session,
        cohort_repo=mock_cohort_repo,
        member_repo=mock_member_repo,
        broadcast_repo=mock_broadcast_repo,
        plan_tier_repo=mock_plan_tier_repo,
        tenant_id=tenant_id,
        plan_tier_slug="creator",
    )


@pytest.fixture
def valid_send_request(tenant_id: uuid.UUID) -> SendBroadcastRequest:
    return SendBroadcastRequest(
        cohort_id=uuid.uuid4(),
        content="Hola cohorte, recordatorio sesión 6 mañana 19h.",
        audience_filter={},
        channel="whatsapp",
    )


# ─────────────────────────────────────────────────────────────────────────────
# B1 — Happy path (rate limit not exceeded)
# ─────────────────────────────────────────────────────────────────────────────


async def test_send_broadcast_happy_path(
    broadcast_service: CohortBroadcastService,
    valid_send_request: SendBroadcastRequest,
    mock_cohort_repo: MagicMock,
    mock_member_repo: MagicMock,
    mock_broadcast_repo: MagicMock,
    tenant_id: uuid.UUID,
) -> None:
    """B1: rate limit not hit, cohort has members → broadcast saved, result returned."""
    cohort = _make_cohort_model(
        cohort_id=valid_send_request.cohort_id,
        tenant_id=tenant_id,
    )
    members = [_make_member_model(tenant_id=tenant_id) for _ in range(5)]
    mock_cohort_repo.get_by_id = AsyncMock(return_value=cohort)
    mock_member_repo.list_by_cohort = AsyncMock(return_value=members)
    mock_broadcast_repo.count_sent_today = AsyncMock(return_value=0)

    result = await broadcast_service.send_broadcast(valid_send_request)

    assert isinstance(result, SendBroadcastResult)
    assert result.broadcast_id is not None
    assert result.recipients_dispatched == 5
    assert result.is_rate_limited is False
    # Broadcast model persisted
    mock_broadcast_repo.save.assert_awaited()


# ─────────────────────────────────────────────────────────────────────────────
# B2 — Rate limit fully exceeded → BroadcastRateLimitError
# ─────────────────────────────────────────────────────────────────────────────


async def test_send_broadcast_rate_limit_exceeded_raises_error(
    broadcast_service: CohortBroadcastService,
    valid_send_request: SendBroadcastRequest,
    mock_cohort_repo: MagicMock,
    mock_member_repo: MagicMock,
    mock_broadcast_repo: MagicMock,
    tenant_id: uuid.UUID,
) -> None:
    """B2: daily limit fully used (1000/1000 sent) → BroadcastRateLimitError raised."""
    cohort = _make_cohort_model(
        cohort_id=valid_send_request.cohort_id,
        tenant_id=tenant_id,
    )
    members = [_make_member_model(tenant_id=tenant_id) for _ in range(5)]
    mock_cohort_repo.get_by_id = AsyncMock(return_value=cohort)
    mock_member_repo.list_by_cohort = AsyncMock(return_value=members)
    # Already sent 1000 today (= daily limit)
    mock_broadcast_repo.count_sent_today = AsyncMock(return_value=1000)

    with pytest.raises(BroadcastRateLimitError) as exc_info:
        await broadcast_service.send_broadcast(valid_send_request)

    assert exc_info.value.daily_limit == 1000
    assert exc_info.value.already_sent == 1000


# ─────────────────────────────────────────────────────────────────────────────
# B3 — Partial delivery (tier=basic 250/day, 245 already sent, 14 members)
# ─────────────────────────────────────────────────────────────────────────────


async def test_send_broadcast_partial_delivery_when_near_limit(
    tenant_id: uuid.UUID,
    mock_cohort_repo: MagicMock,
    mock_member_repo: MagicMock,
    mock_broadcast_repo: MagicMock,
    mock_session: MagicMock,
    valid_send_request: SendBroadcastRequest,
) -> None:
    """B3: 245/250 sent today + 14 members → sends 5 now, queues 9 (spec § 3.5.B)."""
    # Tier with 250/day WhatsApp limit
    plan_tier_repo = MagicMock()
    tier = MagicMock()
    tier.whatsapp_daily_limit = 250
    plan_tier_repo.get_by_slug = AsyncMock(return_value=tier)

    service = CohortBroadcastService(
        session=mock_session,
        cohort_repo=mock_cohort_repo,
        member_repo=mock_member_repo,
        broadcast_repo=mock_broadcast_repo,
        plan_tier_repo=plan_tier_repo,
        tenant_id=tenant_id,
        plan_tier_slug="creator",  # resolved to 250 via mock
    )

    cohort = _make_cohort_model(
        cohort_id=valid_send_request.cohort_id,
        tenant_id=tenant_id,
    )
    members = [_make_member_model(tenant_id=tenant_id) for _ in range(14)]
    mock_cohort_repo.get_by_id = AsyncMock(return_value=cohort)
    mock_member_repo.list_by_cohort = AsyncMock(return_value=members)
    mock_broadcast_repo.count_sent_today = AsyncMock(return_value=245)  # near limit

    result = await service.send_broadcast(valid_send_request)

    # Only 5 dispatched now (250 - 245 = 5 remaining)
    assert result.recipients_dispatched == 5
    # 9 queued for next day
    assert result.recipients_queued == 9
    assert result.is_rate_limited is True


# ─────────────────────────────────────────────────────────────────────────────
# B4 — Cohort not found
# ─────────────────────────────────────────────────────────────────────────────


async def test_send_broadcast_cohort_not_found(
    broadcast_service: CohortBroadcastService,
    valid_send_request: SendBroadcastRequest,
    mock_cohort_repo: MagicMock,
) -> None:
    """B4: cohort does not exist → CohortNotFoundError raised."""
    mock_cohort_repo.get_by_id = AsyncMock(return_value=None)

    with pytest.raises(CohortNotFoundError):
        await broadcast_service.send_broadcast(valid_send_request)


# ─────────────────────────────────────────────────────────────────────────────
# B5 — Default WhatsApp tier limit fallback (1000/day)
# ─────────────────────────────────────────────────────────────────────────────


async def test_default_whatsapp_tier_limit_is_1000(
    tenant_id: uuid.UUID,
    mock_cohort_repo: MagicMock,
    mock_member_repo: MagicMock,
    mock_broadcast_repo: MagicMock,
    mock_session: MagicMock,
    valid_send_request: SendBroadcastRequest,
) -> None:
    """B5: when PlanTierConfig not found → default 1000 msg/day limit applied."""
    # plan_tier_repo returns None (no config found)
    plan_tier_repo = MagicMock()
    plan_tier_repo.get_by_slug = AsyncMock(return_value=None)

    service = CohortBroadcastService(
        session=mock_session,
        cohort_repo=mock_cohort_repo,
        member_repo=mock_member_repo,
        broadcast_repo=mock_broadcast_repo,
        plan_tier_repo=plan_tier_repo,
        tenant_id=tenant_id,
        plan_tier_slug="creator",
    )

    cohort = _make_cohort_model(
        cohort_id=valid_send_request.cohort_id,
        tenant_id=tenant_id,
    )
    members = [_make_member_model(tenant_id=tenant_id) for _ in range(3)]
    mock_cohort_repo.get_by_id = AsyncMock(return_value=cohort)
    mock_member_repo.list_by_cohort = AsyncMock(return_value=members)
    # Already sent 999 today — 1 slot remaining; 3 members → partial
    mock_broadcast_repo.count_sent_today = AsyncMock(return_value=999)

    result = await service.send_broadcast(valid_send_request)

    # Default limit 1000, 999 sent → 1 slot remaining; 3 members → 1 now, 2 queued
    assert result.recipients_dispatched == 1
    assert result.recipients_queued == 2
    assert result.is_rate_limited is True


# ─────────────────────────────────────────────────────────────────────────────
# B6 — No members in cohort → empty broadcast
# ─────────────────────────────────────────────────────────────────────────────


async def test_send_broadcast_empty_cohort(
    broadcast_service: CohortBroadcastService,
    valid_send_request: SendBroadcastRequest,
    mock_cohort_repo: MagicMock,
    mock_member_repo: MagicMock,
    mock_broadcast_repo: MagicMock,
    tenant_id: uuid.UUID,
) -> None:
    """B6: cohort exists but has no active members → broadcast saved with 0 recipients."""
    cohort = _make_cohort_model(
        cohort_id=valid_send_request.cohort_id,
        tenant_id=tenant_id,
    )
    mock_cohort_repo.get_by_id = AsyncMock(return_value=cohort)
    mock_member_repo.list_by_cohort = AsyncMock(return_value=[])
    mock_broadcast_repo.count_sent_today = AsyncMock(return_value=0)

    result = await broadcast_service.send_broadcast(valid_send_request)

    assert result.recipients_dispatched == 0
    assert result.recipients_queued == 0
    assert result.is_rate_limited is False
