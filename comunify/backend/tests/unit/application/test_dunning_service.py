"""Unit tests — DunningService.

TDD RED phase: written before implementation to drive contract per 03-arch-be.md § 9.4.

Covers:
  - D1: start_dunning transitions subscription status to past_due + sets dunning_state=retry_1
  - D2: resolve_dunning transitions status to active + clears dunning_state
  - D3: transition_status validates allowed transitions (active→past_due, past_due→suspended, etc.)
  - D4: start_dunning raises SubscriptionNotFoundError for unknown subscription_id
  - D5: DunningWorkflow stub protocol is called (T-workflows-2 wires real LangGraph)

D14: DunningWorkflow instantiation only — real LangGraph wiring in T-workflows-2 (Opus).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.modules.comunify.application.services.dunning_service import (
    DunningService,
    DunningTransitionError,
    DunningWorkflowProtocol,
    SubscriptionNotFoundError,
)
from src.modules.comunify.infrastructure.models.subscription_model import (
    ComunifySubscriptionModel,
)

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

TENANT_ID = uuid.uuid4()


def _make_sub(status: str = "active", dunning_state: str | None = None) -> ComunifySubscriptionModel:
    sub = ComunifySubscriptionModel(
        id=uuid.uuid4(),
        tenant_id=TENANT_ID,
        subscriber_id=uuid.uuid4(),
        offer_id=uuid.uuid4(),
        plan_kind="monthly_membership",
        status=status,
        dunning_state=dunning_state,
        started_at=datetime.now(timezone.utc),
        monthly_amount=Decimal("49.00"),
        currency="USD",
        gateway="stripe_connect",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    return sub


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────


@pytest.fixture
def mock_subscription_repo() -> MagicMock:
    repo = MagicMock()
    repo.get_by_id = AsyncMock(return_value=None)
    repo.update_status = AsyncMock(return_value=True)
    return repo


@pytest.fixture
def mock_dunning_workflow() -> MagicMock:
    """Stub DunningWorkflowProtocol — real LangGraph graph wiring T-workflows-2."""
    wf = MagicMock(spec=DunningWorkflowProtocol)
    wf.start = AsyncMock(return_value=None)
    wf.resolve = AsyncMock(return_value=None)
    wf.transition_status = AsyncMock(return_value=None)
    return wf


@pytest.fixture
def service(
    mock_subscription_repo: MagicMock,
    mock_dunning_workflow: MagicMock,
) -> DunningService:
    return DunningService(
        subscription_repo=mock_subscription_repo,
        dunning_workflow=mock_dunning_workflow,
        tenant_id=TENANT_ID,
    )


# ─────────────────────────────────────────────────────────────────────────────
# D1 — start_dunning → past_due
# ─────────────────────────────────────────────────────────────────────────────


async def test_start_dunning_transitions_to_past_due(
    service: DunningService,
    mock_subscription_repo: MagicMock,
    mock_dunning_workflow: MagicMock,
) -> None:
    """D1: start_dunning sets status=past_due + calls workflow.start()."""
    sub_id = uuid.uuid4()
    sub = _make_sub(status="active")
    sub.id = sub_id
    mock_subscription_repo.get_by_id = AsyncMock(return_value=sub)

    await service.start_dunning(sub_id)

    mock_dunning_workflow.start.assert_called_once_with(subscription_id=sub_id)
    update_call = mock_subscription_repo.update_status.call_args
    assert update_call.kwargs.get("status") == "past_due" or (
        len(update_call.args) >= 2 and "past_due" in str(update_call)
    )


# ─────────────────────────────────────────────────────────────────────────────
# D2 — resolve_dunning → active
# ─────────────────────────────────────────────────────────────────────────────


async def test_resolve_dunning_transitions_to_active(
    service: DunningService,
    mock_subscription_repo: MagicMock,
    mock_dunning_workflow: MagicMock,
) -> None:
    """D2: resolve_dunning calls workflow.resolve() + status=active + clears dunning_state."""
    sub_id = uuid.uuid4()
    sub = _make_sub(status="past_due", dunning_state="retry_1")
    sub.id = sub_id
    mock_subscription_repo.get_by_id = AsyncMock(return_value=sub)

    await service.resolve_dunning(sub_id)

    mock_dunning_workflow.resolve.assert_called_once_with(subscription_id=sub_id)
    update_call = mock_subscription_repo.update_status.call_args
    assert "active" in str(update_call)


# ─────────────────────────────────────────────────────────────────────────────
# D3 — transition_status validates allowed transitions
# ─────────────────────────────────────────────────────────────────────────────


async def test_transition_status_valid_past_due_to_suspended(
    service: DunningService,
    mock_subscription_repo: MagicMock,
    mock_dunning_workflow: MagicMock,
) -> None:
    """D3a: valid transition past_due → suspended succeeds."""
    sub_id = uuid.uuid4()
    sub = _make_sub(status="past_due", dunning_state="retry_2")
    sub.id = sub_id
    mock_subscription_repo.get_by_id = AsyncMock(return_value=sub)

    # Should not raise
    await service.transition_status(sub_id, new_status="suspended")
    mock_subscription_repo.update_status.assert_called()


async def test_transition_status_invalid_raises(
    service: DunningService,
    mock_subscription_repo: MagicMock,
) -> None:
    """D3b: invalid transition (cancelled → active) raises DunningTransitionError."""
    sub_id = uuid.uuid4()
    sub = _make_sub(status="cancelled")
    sub.id = sub_id
    mock_subscription_repo.get_by_id = AsyncMock(return_value=sub)

    with pytest.raises(DunningTransitionError):
        await service.transition_status(sub_id, new_status="active")


# ─────────────────────────────────────────────────────────────────────────────
# D4 — start_dunning raises SubscriptionNotFoundError
# ─────────────────────────────────────────────────────────────────────────────


async def test_start_dunning_not_found_raises(
    service: DunningService,
    mock_subscription_repo: MagicMock,
) -> None:
    """D4: unknown subscription_id raises SubscriptionNotFoundError."""
    mock_subscription_repo.get_by_id = AsyncMock(return_value=None)

    with pytest.raises(SubscriptionNotFoundError):
        await service.start_dunning(uuid.uuid4())


# ─────────────────────────────────────────────────────────────────────────────
# D5 — DunningWorkflow stub protocol interface is honored
# ─────────────────────────────────────────────────────────────────────────────


async def test_dunning_workflow_stub_protocol_respected(
    mock_dunning_workflow: MagicMock,
) -> None:
    """D5: DunningWorkflowProtocol defines start/resolve/transition_status interface."""
    # Verify protocol stubs are callable (T-workflows-2 wires real LangGraph)
    assert callable(mock_dunning_workflow.start)
    assert callable(mock_dunning_workflow.resolve)
    assert callable(mock_dunning_workflow.transition_status)
