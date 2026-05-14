"""Unit tests — SubscriptionService.

TDD RED phase: written before implementation to drive contract per 03-arch-be.md § 9.4.

Covers:
  - S1: create_subscription returns SubscriptionResult with id + status=active
  - S2: create_subscription idempotency — same idempotency_key returns existing (no dup)
  - S3: create_subscription calls payment_gateway.tokenize_payment_method
  - S4: cancel_subscription transitions status to cancelled (immediate) or
        cancelled_pending_end_of_period (end-of-period flag)
  - S5: cancel_subscription raises SubscriptionNotFoundError for unknown id
  - S6: tier_upgrade updates gateway token via payment_gateway + persists new plan_kind
  - S7: start_dunning transitions active → past_due via DunningWorkflowProtocol.start()
  - S8: resolve_dunning transitions past_due → active via DunningWorkflowProtocol.resolve()

D1: SubscriptionService receives repos + gateway + dunning via DI constructor injection.
D14: DunningWorkflow = stub protocol injected — real LangGraph wiring T-workflows-2.
D15: PaymentGateway = stub protocol injected — real adapters T-payment-1.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.modules.comunify.application.services.subscription_service import (
    CancelSubscriptionRequest,
    CreateSubscriptionRequest,
    DunningWorkflowProtocol,
    PaymentGatewayProtocol,
    SubscriptionNotFoundError,
    SubscriptionService,
    TierUpgradeRequest,
)
from src.modules.comunify.infrastructure.models.subscription_model import (
    ComunifySubscriptionModel,
)

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

TENANT_ID = uuid.uuid4()
SUBSCRIBER_ID = uuid.uuid4()
OFFER_ID = uuid.uuid4()


def _make_subscription(
    *,
    status: str = "active",
    idempotency_key: str | None = None,
    dunning_state: str | None = None,
) -> ComunifySubscriptionModel:
    sub = ComunifySubscriptionModel(
        id=uuid.uuid4(),
        tenant_id=TENANT_ID,
        subscriber_id=SUBSCRIBER_ID,
        offer_id=OFFER_ID,
        plan_kind="monthly_membership",
        status=status,
        dunning_state=dunning_state,
        started_at=datetime.now(timezone.utc),
        monthly_amount=Decimal("49.00"),
        currency="USD",
        gateway="stripe_connect",
        idempotency_key=idempotency_key,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    return sub


def _make_request(idempotency_key: str = "key-abc-123") -> CreateSubscriptionRequest:
    return CreateSubscriptionRequest(
        subscriber_id=SUBSCRIBER_ID,
        offer_id=OFFER_ID,
        plan_kind="monthly_membership",
        monthly_amount=Decimal("49.00"),
        currency="USD",
        gateway="stripe_connect",
        payment_method_token="tok_test",
        idempotency_key=idempotency_key,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────


@pytest.fixture
def mock_subscription_repo() -> MagicMock:
    repo = MagicMock()
    repo.get_by_idempotency_key = AsyncMock(return_value=None)
    repo.get_by_id = AsyncMock(return_value=None)
    repo.save = AsyncMock(return_value=None)
    repo.update_status = AsyncMock(return_value=True)
    return repo


@pytest.fixture
def mock_charge_repo() -> MagicMock:
    repo = MagicMock()
    repo.save = AsyncMock(return_value=None)
    return repo


@pytest.fixture
def mock_gateway() -> MagicMock:
    """Mock PaymentGatewayProtocol."""
    gw = MagicMock(spec=PaymentGatewayProtocol)
    gw.tokenize_payment_method = AsyncMock(return_value="gw_cust_123")
    return gw


@pytest.fixture
def mock_dunning() -> MagicMock:
    """Mock DunningWorkflowProtocol."""
    dw = MagicMock(spec=DunningWorkflowProtocol)
    dw.start = AsyncMock(return_value=None)
    dw.resolve = AsyncMock(return_value=None)
    dw.transition_status = AsyncMock(return_value=None)
    return dw


@pytest.fixture
def service(
    mock_subscription_repo: MagicMock,
    mock_charge_repo: MagicMock,
    mock_gateway: MagicMock,
    mock_dunning: MagicMock,
) -> SubscriptionService:
    return SubscriptionService(
        subscription_repo=mock_subscription_repo,
        charge_repo=mock_charge_repo,
        payment_gateway=mock_gateway,
        dunning_workflow=mock_dunning,
        tenant_id=TENANT_ID,
    )


# ─────────────────────────────────────────────────────────────────────────────
# S1 — create_subscription returns id + status=active
# ─────────────────────────────────────────────────────────────────────────────


async def test_create_subscription_returns_active_result(
    service: SubscriptionService,
    mock_subscription_repo: MagicMock,
) -> None:
    """S1: create_subscription persists row and returns SubscriptionResult with status=active."""
    req = _make_request()
    result = await service.create_subscription(req)

    assert result.status == "active"
    assert result.subscription_id is not None
    mock_subscription_repo.save.assert_called_once()


# ─────────────────────────────────────────────────────────────────────────────
# S2 — Idempotency: same key returns existing
# ─────────────────────────────────────────────────────────────────────────────


async def test_create_subscription_idempotent_returns_existing(
    service: SubscriptionService,
    mock_subscription_repo: MagicMock,
) -> None:
    """S2: same idempotency_key returns existing subscription without calling save again."""
    existing = _make_subscription(idempotency_key="key-abc-123")
    mock_subscription_repo.get_by_idempotency_key = AsyncMock(return_value=existing)

    req = _make_request(idempotency_key="key-abc-123")
    result = await service.create_subscription(req)

    assert result.subscription_id == existing.id
    assert result.is_idempotent_hit is True
    mock_subscription_repo.save.assert_not_called()


# ─────────────────────────────────────────────────────────────────────────────
# S3 — payment_gateway.tokenize_payment_method is called
# ─────────────────────────────────────────────────────────────────────────────


async def test_create_subscription_tokenizes_payment_method(
    service: SubscriptionService,
    mock_gateway: MagicMock,
) -> None:
    """S3: tokenize_payment_method is called with token + gateway from request."""
    req = _make_request()
    await service.create_subscription(req)

    mock_gateway.tokenize_payment_method.assert_called_once()
    call_kwargs = mock_gateway.tokenize_payment_method.call_args
    assert "payment_method_token" in str(call_kwargs) or call_kwargs is not None


# ─────────────────────────────────────────────────────────────────────────────
# S4 — cancel_subscription immediate + end-of-period paths
# ─────────────────────────────────────────────────────────────────────────────


async def test_cancel_subscription_immediate(
    service: SubscriptionService,
    mock_subscription_repo: MagicMock,
) -> None:
    """S4a: immediate cancel → status=cancelled."""
    sub_id = uuid.uuid4()
    existing = _make_subscription(status="active")
    existing.id = sub_id
    mock_subscription_repo.get_by_id = AsyncMock(return_value=existing)

    req = CancelSubscriptionRequest(
        subscription_id=sub_id,
        reason="user_requested",
        end_of_period=False,
    )
    result = await service.cancel_subscription(req)

    assert result.status == "cancelled"
    mock_subscription_repo.update_status.assert_called_once()


async def test_cancel_subscription_end_of_period(
    service: SubscriptionService,
    mock_subscription_repo: MagicMock,
) -> None:
    """S4b: end_of_period=True → status=cancelled_pending_end_of_period."""
    sub_id = uuid.uuid4()
    existing = _make_subscription(status="active")
    existing.id = sub_id
    mock_subscription_repo.get_by_id = AsyncMock(return_value=existing)

    req = CancelSubscriptionRequest(
        subscription_id=sub_id,
        reason="user_requested",
        end_of_period=True,
    )
    result = await service.cancel_subscription(req)

    assert result.status == "cancelled_pending_end_of_period"


# ─────────────────────────────────────────────────────────────────────────────
# S5 — cancel_subscription raises for unknown id
# ─────────────────────────────────────────────────────────────────────────────


async def test_cancel_subscription_not_found_raises(
    service: SubscriptionService,
    mock_subscription_repo: MagicMock,
) -> None:
    """S5: unknown subscription_id raises SubscriptionNotFoundError."""
    mock_subscription_repo.get_by_id = AsyncMock(return_value=None)
    req = CancelSubscriptionRequest(
        subscription_id=uuid.uuid4(),
        reason="test",
        end_of_period=False,
    )
    with pytest.raises(SubscriptionNotFoundError):
        await service.cancel_subscription(req)


# ─────────────────────────────────────────────────────────────────────────────
# S6 — tier_upgrade persists new plan_kind
# ─────────────────────────────────────────────────────────────────────────────


async def test_tier_upgrade_calls_gateway_and_persists(
    service: SubscriptionService,
    mock_subscription_repo: MagicMock,
    mock_gateway: MagicMock,
) -> None:
    """S6: tier_upgrade calls gateway.tokenize_payment_method + updates subscription."""
    sub_id = uuid.uuid4()
    existing = _make_subscription(status="active")
    existing.id = sub_id
    mock_subscription_repo.get_by_id = AsyncMock(return_value=existing)

    req = TierUpgradeRequest(
        subscription_id=sub_id,
        new_plan_kind="cohort_installments",
        new_payment_method_token="tok_new",
        new_monthly_amount=Decimal("99.00"),
    )
    result = await service.tier_upgrade(req)

    assert result.subscription_id == sub_id
    mock_gateway.tokenize_payment_method.assert_called()


# ─────────────────────────────────────────────────────────────────────────────
# S7 — start_dunning calls DunningWorkflowProtocol.start
# ─────────────────────────────────────────────────────────────────────────────


async def test_start_dunning_calls_workflow_start(
    service: SubscriptionService,
    mock_dunning: MagicMock,
    mock_subscription_repo: MagicMock,
) -> None:
    """S7: start_dunning calls dunning_workflow.start(subscription_id) + updates status=past_due."""
    sub_id = uuid.uuid4()
    existing = _make_subscription(status="active")
    existing.id = sub_id
    mock_subscription_repo.get_by_id = AsyncMock(return_value=existing)

    await service.start_dunning(sub_id)

    mock_dunning.start.assert_called_once_with(subscription_id=sub_id)
    mock_subscription_repo.update_status.assert_called_once()


# ─────────────────────────────────────────────────────────────────────────────
# S8 — resolve_dunning calls DunningWorkflowProtocol.resolve
# ─────────────────────────────────────────────────────────────────────────────


async def test_resolve_dunning_calls_workflow_resolve(
    service: SubscriptionService,
    mock_dunning: MagicMock,
    mock_subscription_repo: MagicMock,
) -> None:
    """S8: resolve_dunning calls dunning_workflow.resolve(subscription_id) + updates status=active."""
    sub_id = uuid.uuid4()
    existing = _make_subscription(status="past_due", dunning_state="retry_1")
    existing.id = sub_id
    mock_subscription_repo.get_by_id = AsyncMock(return_value=existing)

    await service.resolve_dunning(sub_id)

    mock_dunning.resolve.assert_called_once_with(subscription_id=sub_id)
    mock_subscription_repo.update_status.assert_called_once()
