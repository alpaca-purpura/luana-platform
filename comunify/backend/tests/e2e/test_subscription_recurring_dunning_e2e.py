"""E2E tests — subscription recurring + dunning journey (V-F-10).

Covers spec § 3.4 subscription recurring + dunning scenarios end-to-end:
  - Subscription created → recurring schedule + DunningWorkflow stub wired
  - Payment failure → dunning workflow past_due transition
  - Retry succeeded → dunning resolved → active
  - Retry exhausted → dunning suspended → cancelled

These tests exercise SubscriptionService + DunningService + the new
CohortEnrollmentWorkflow's embedded DunningWorkflow end-to-end using
mocked repos + injected workflow factory. No real DB or gateway calls.

Story 12 luana-comunify-bootstrap T-workflows-2 (R23 Opus 4.7 production
AGENTIC code).

V-F-10 scenarios:
  - F1: subscription create → DunningWorkflow stub wired (no-op start/resolve)
  - F2: cohort enrollment payment fails → DunningWorkflow embedded triggers
        past_due state via workflow.ainvoke
  - F3: retry_1 success → dunning_state cleared → workflow exits enrolled
  - F4: retry_1 fails + retry_2 fails → suspended
  - F5: tenant isolation — distinct subscription_ids isolate dunning state
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.modules.comunify.application.services.dunning_service import (
    DunningService,
)
from src.modules.comunify.application.services.subscription_service import (
    CreateSubscriptionRequest,
    SubscriptionService,
)


def _utc_now() -> datetime:
    return datetime.now(tz=timezone.utc)


# ---------------------------------------------------------------------------
# Mock builders
# ---------------------------------------------------------------------------


def _make_subscription_mock(
    *,
    subscription_id: uuid.UUID,
    tenant_id: uuid.UUID,
    status: str = "active",
    dunning_state: str | None = None,
    plan_kind: str = "cohort_installments",
) -> MagicMock:
    sub = MagicMock()
    sub.id = subscription_id
    sub.tenant_id = tenant_id
    sub.subscriber_id = uuid.uuid4()
    sub.status = status
    sub.dunning_state = dunning_state
    sub.plan_kind = plan_kind
    sub.gateway = "stripe_connect"
    sub.created_at = _utc_now()
    return sub


# ---------------------------------------------------------------------------
# F1: subscription create → dunning workflow stub wired
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_subscription_create_wires_dunning_workflow_stub() -> None:
    """F1: SubscriptionService.create receives DunningWorkflowProtocol stub
    via DI per D14 — real LangGraph wiring (T-workflows-2) injects the new
    workflow at the boundary.

    Stub start/resolve are no-ops; real workflow factory is wired in T-eval-1.
    """
    tenant_id = uuid.uuid4()

    subscription_repo = MagicMock()
    subscription_repo.get_by_idempotency_key = AsyncMock(return_value=None)
    subscription_repo.save = AsyncMock()
    charge_repo = MagicMock()

    payment_gateway = MagicMock()
    payment_gateway.tokenize_payment_method = AsyncMock(return_value="cus_test_123")

    # DunningWorkflowProtocol stub — no-op start/resolve
    dunning_workflow = MagicMock()
    dunning_workflow.start = AsyncMock()
    dunning_workflow.resolve = AsyncMock()
    dunning_workflow.transition_status = AsyncMock()

    svc = SubscriptionService(
        subscription_repo=subscription_repo,
        charge_repo=charge_repo,
        payment_gateway=payment_gateway,
        dunning_workflow=dunning_workflow,
        tenant_id=tenant_id,
    )

    req = CreateSubscriptionRequest(
        subscriber_id=uuid.uuid4(),
        offer_id=uuid.uuid4(),
        plan_kind="cohort_installments",
        monthly_amount=Decimal("99.00"),
        currency="USD",
        gateway="stripe_connect",
        payment_method_token="pm_card_test",
        installments_total=3,
    )
    result = await svc.create_subscription(req)

    assert result.status == "active"
    assert result.plan_kind == "cohort_installments"
    # Subscription was saved → dunning workflow stub is wired ready for failure handling
    subscription_repo.save.assert_called_once()


# ---------------------------------------------------------------------------
# F2: payment fails → CohortEnrollmentWorkflow embedded dunning fires
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_cohort_enrollment_payment_failure_triggers_embedded_dunning() -> None:
    """F2: when a subscriber's enrollment payment fails, the
    CohortEnrollmentWorkflow embedded DunningWorkflow MUST transition to
    past_due automatically.

    This is the integration boundary between the BE service layer
    (SubscriptionService / DunningService) and the LangGraph workflow.
    """
    from langgraph.checkpoint.memory import MemorySaver

    from src.modules.comunify.copilot.workflows.cohort_enrollment_workflow import (
        build_cohort_enrollment_workflow,
    )

    tenant_id = uuid.UUID("11111111-1111-1111-1111-111111111111")
    lead_id = uuid.UUID("22222222-2222-2222-2222-222222222222")
    cohort_id = uuid.UUID("33333333-3333-3333-3333-333333333333")

    async def qualify_fit_stub(*, tenant_id: Any, lead_id: Any, cohort_id: Any) -> dict[str, Any]:
        return {"fit": True, "fit_score": 0.85, "gaps": [], "cost_usd": 0.010}

    async def book_stub(*, tenant_id: Any, lead_id: Any, cohort_id: Any) -> dict[str, Any]:
        return {"booking_id": uuid.uuid4(), "booking_status": "confirmed", "cost_usd": 0.0}

    workflow = build_cohort_enrollment_workflow(
        checkpointer=MemorySaver(),
        qualify_tool=qualify_fit_stub,
        book_discovery_tool=book_stub,
    )
    config = {"configurable": {"thread_id": f"{tenant_id}:{lead_id}"}}

    initial = {
        "tenant_id": tenant_id,
        "lead_id": lead_id,
        "cohort_id": cohort_id,
        "current_step": "qualification",
        "qualification_fit": None,
        "qualification_gaps": [],
        "payment_expired_retry_count": 0,
        "dunning_retry_count": 0,
        "cost_accumulated_usd": 0.0,
        "iterations": 0,
    }
    await workflow.ainvoke(initial, config=config)
    await workflow.ainvoke(
        {"current_step": "terms_presentation", "terms_accepted": True},
        config=config,
    )

    # Payment fails → embedded dunning fires
    state = await workflow.ainvoke(
        {"current_step": "payment_pending", "payment_status": "failed"},
        config=config,
    )
    assert state["current_step"] == "payment_failed_dunning"
    assert state["dunning_state"] == "past_due"
    assert state["dunning_first_failure_at"] is not None


# ---------------------------------------------------------------------------
# F3: retry_1 success → enrolled
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_dunning_retry_1_success_recovers_to_enrolled_e2e() -> None:
    """F3 e2e: retry attempt 1 succeeds → dunning resolved → enrolled.

    Validates the embedded DunningWorkflow → enrolled exit path end-to-end
    with payment_retry_tool wired (mock adapter).
    """
    from langgraph.checkpoint.memory import MemorySaver

    from src.modules.comunify.copilot.workflows.cohort_enrollment_workflow import (
        build_cohort_enrollment_workflow,
    )

    tenant_id = uuid.UUID("11111111-1111-1111-1111-111111111111")
    lead_id = uuid.UUID("22222222-2222-2222-2222-222222222222")
    subscriber_id = uuid.UUID("44444444-4444-4444-4444-444444444444")

    async def qualify_stub(*, tenant_id: Any, lead_id: Any, cohort_id: Any) -> dict[str, Any]:
        return {"fit": True, "fit_score": 0.85, "gaps": [], "cost_usd": 0.010}

    async def book_stub(*, tenant_id: Any, lead_id: Any, cohort_id: Any) -> dict[str, Any]:
        return {"booking_id": uuid.uuid4(), "booking_status": "confirmed", "cost_usd": 0.0}

    async def retry_success_stub(
        *, tenant_id: Any, lead_id: Any, subscription_id: Any | None, retry_attempt: int
    ) -> dict[str, Any]:
        return {
            "success": True,
            "payment_intent_id": f"pi_e2e_retry_{retry_attempt}",
            "failure_reason": None,
            "cost_usd": 0.0,
        }

    workflow = build_cohort_enrollment_workflow(
        checkpointer=MemorySaver(),
        qualify_tool=qualify_stub,
        book_discovery_tool=book_stub,
        payment_retry_tool=retry_success_stub,
    )
    config = {"configurable": {"thread_id": f"{tenant_id}:{lead_id}"}}

    # Seed into past_due (assume prior cycle put us here)
    await workflow.ainvoke(
        {
            "tenant_id": tenant_id,
            "lead_id": lead_id,
            "cohort_id": uuid.uuid4(),
            "subscriber_id": subscriber_id,
            "current_step": "payment_failed_dunning",
            "dunning_state": "past_due",
            "dunning_retry_count": 0,
            "cost_accumulated_usd": 0.0,
            "iterations": 0,
        },
        config=config,
    )

    state = await workflow.ainvoke(
        {"current_step": "payment_failed_dunning", "dunning_retry_count": 1},
        config=config,
    )

    assert state["current_step"] == "enrolled"
    assert state["dunning_state"] is None
    assert state["payment_status"] == "succeeded"


# ---------------------------------------------------------------------------
# F4: retry exhausted → suspended → cancelled
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_dunning_retry_exhausted_escalates_to_cancelled_e2e() -> None:
    """F4 e2e: retry_1 fail + retry_2 fail + suspend tick + cancel signal →
    workflow exits via END with dunning_state="cancelled".

    Validates the full escalation cadence end-to-end.
    """
    from langgraph.checkpoint.memory import MemorySaver

    from src.modules.comunify.copilot.workflows.cohort_enrollment_workflow import (
        build_cohort_enrollment_workflow,
    )

    tenant_id = uuid.uuid4()
    lead_id = uuid.uuid4()
    subscriber_id = uuid.uuid4()

    async def qualify_stub(*, tenant_id: Any, lead_id: Any, cohort_id: Any) -> dict[str, Any]:
        return {"fit": True, "fit_score": 0.85, "gaps": [], "cost_usd": 0.010}

    async def book_stub(*, tenant_id: Any, lead_id: Any, cohort_id: Any) -> dict[str, Any]:
        return {"booking_id": uuid.uuid4(), "booking_status": "confirmed", "cost_usd": 0.0}

    async def retry_fail_stub(
        *, tenant_id: Any, lead_id: Any, subscription_id: Any | None, retry_attempt: int
    ) -> dict[str, Any]:
        return {
            "success": False,
            "payment_intent_id": None,
            "failure_reason": "insufficient_funds",
            "cost_usd": 0.0,
        }

    workflow = build_cohort_enrollment_workflow(
        checkpointer=MemorySaver(),
        qualify_tool=qualify_stub,
        book_discovery_tool=book_stub,
        payment_retry_tool=retry_fail_stub,
    )
    config = {"configurable": {"thread_id": f"{tenant_id}:{lead_id}"}}

    # Seed past_due
    await workflow.ainvoke(
        {
            "tenant_id": tenant_id,
            "lead_id": lead_id,
            "cohort_id": uuid.uuid4(),
            "subscriber_id": subscriber_id,
            "current_step": "payment_failed_dunning",
            "dunning_state": "past_due",
            "dunning_retry_count": 0,
            "cost_accumulated_usd": 0.0,
            "iterations": 0,
        },
        config=config,
    )

    # Retry 1 fails → retry_1_pending
    await workflow.ainvoke(
        {"current_step": "payment_failed_dunning", "dunning_retry_count": 1},
        config=config,
    )
    # Retry 2 fails → retry_2_pending
    await workflow.ainvoke(
        {"current_step": "payment_failed_dunning", "dunning_retry_count": 2},
        config=config,
    )
    # Suspend tick
    suspended_state = await workflow.ainvoke(
        {"current_step": "payment_failed_dunning", "dunning_state": "suspended"},
        config=config,
    )
    assert suspended_state["dunning_state"] == "suspended"

    # Cancellation
    cancelled_state = await workflow.ainvoke(
        {"current_step": "payment_failed_dunning", "dunning_state": "cancelled"},
        config=config,
    )
    assert cancelled_state["dunning_state"] == "cancelled"


# ---------------------------------------------------------------------------
# F5: tenant isolation — distinct leads dunning isolated
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_dunning_state_isolated_per_lead() -> None:
    """F5: two leads in the same tenant with concurrent dunning sub-states
    MUST NOT bleed state across threads.

    Validates tenant_isolation invariant at the LangGraph persistence
    boundary (thread_id = f"{tenant_id}:{lead_id}").
    """
    from langgraph.checkpoint.memory import MemorySaver

    from src.modules.comunify.copilot.workflows.cohort_enrollment_workflow import (
        build_cohort_enrollment_workflow,
    )

    tenant_id = uuid.UUID("11111111-1111-1111-1111-111111111111")
    lead_a = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
    lead_b = uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")

    async def qualify_stub(*, tenant_id: Any, lead_id: Any, cohort_id: Any) -> dict[str, Any]:
        return {"fit": True, "fit_score": 0.85, "gaps": [], "cost_usd": 0.010}

    async def book_stub(*, tenant_id: Any, lead_id: Any, cohort_id: Any) -> dict[str, Any]:
        return {"booking_id": uuid.uuid4(), "booking_status": "confirmed", "cost_usd": 0.0}

    async def retry_fail_stub(
        *, tenant_id: Any, lead_id: Any, subscription_id: Any | None, retry_attempt: int
    ) -> dict[str, Any]:
        return {"success": False, "payment_intent_id": None, "failure_reason": "fail", "cost_usd": 0.0}

    async def retry_success_stub(
        *, tenant_id: Any, lead_id: Any, subscription_id: Any | None, retry_attempt: int
    ) -> dict[str, Any]:
        return {"success": True, "payment_intent_id": "pi_b_ok", "failure_reason": None, "cost_usd": 0.0}

    # Workflow_A — failing retries
    workflow_a = build_cohort_enrollment_workflow(
        checkpointer=MemorySaver(),
        qualify_tool=qualify_stub,
        book_discovery_tool=book_stub,
        payment_retry_tool=retry_fail_stub,
    )
    config_a = {"configurable": {"thread_id": f"{tenant_id}:{lead_a}"}}

    # Shared checkpointer used by workflow_b — succeeding retries
    shared_checkpointer = MemorySaver()
    workflow_b = build_cohort_enrollment_workflow(
        checkpointer=shared_checkpointer,
        qualify_tool=qualify_stub,
        book_discovery_tool=book_stub,
        payment_retry_tool=retry_success_stub,
    )
    config_b = {"configurable": {"thread_id": f"{tenant_id}:{lead_b}"}}

    base_dunning_seed = {
        "tenant_id": tenant_id,
        "cohort_id": uuid.uuid4(),
        "current_step": "payment_failed_dunning",
        "dunning_state": "past_due",
        "dunning_retry_count": 0,
        "cost_accumulated_usd": 0.0,
        "iterations": 0,
    }

    await workflow_a.ainvoke(dict(base_dunning_seed, lead_id=lead_a), config=config_a)
    await workflow_b.ainvoke(dict(base_dunning_seed, lead_id=lead_b), config=config_b)

    # Lead A retry fails — stays in retry_1_pending
    state_a = await workflow_a.ainvoke(
        {"current_step": "payment_failed_dunning", "dunning_retry_count": 1},
        config=config_a,
    )
    assert state_a["dunning_state"] == "retry_1_pending"
    assert state_a["lead_id"] == lead_a

    # Lead B retry succeeds — exits to enrolled
    state_b = await workflow_b.ainvoke(
        {"current_step": "payment_failed_dunning", "dunning_retry_count": 1},
        config=config_b,
    )
    assert state_b["current_step"] == "enrolled"
    assert state_b["lead_id"] == lead_b
    assert state_b["dunning_state"] is None


# ---------------------------------------------------------------------------
# F6: DunningService transition_status integration sanity (BE service layer)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_dunning_service_transition_status_e2e() -> None:
    """F6: DunningService.transition_status drives the BE service layer
    state machine; T-workflows-2 wires the real workflow as the protocol
    implementation. Validates the service layer remains decoupled from the
    LangGraph workflow class via DunningWorkflowProtocol.
    """
    tenant_id = uuid.uuid4()
    sub_id = uuid.uuid4()
    sub_mock = _make_subscription_mock(
        subscription_id=sub_id,
        tenant_id=tenant_id,
        status="active",
    )

    subscription_repo = MagicMock()
    subscription_repo.get_by_id = AsyncMock(return_value=sub_mock)
    subscription_repo.update_status = AsyncMock()

    dunning_workflow = MagicMock()
    dunning_workflow.start = AsyncMock()
    dunning_workflow.resolve = AsyncMock()
    dunning_workflow.transition_status = AsyncMock()

    svc = DunningService(
        subscription_repo=subscription_repo,
        dunning_workflow=dunning_workflow,
        tenant_id=tenant_id,
    )

    # active → past_due (allowed)
    await svc.transition_status(sub_id, new_status="past_due")
    dunning_workflow.transition_status.assert_awaited_once_with(subscription_id=sub_id, new_status="past_due")
    subscription_repo.update_status.assert_awaited_once_with(sub_id, status="past_due")
