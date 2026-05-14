"""Workflow tests — CohortEnrollmentWorkflow embedded DunningWorkflow (D19).

Story 12 luana-comunify-bootstrap T-workflows-2 (R23 Opus 4.7 production
AGENTIC code).

Per 03-arch-agentic.md § 6.2 embedded DunningWorkflow state machine + D19:

  Internal dunning sub-states inside `payment_failed_dunning` node:
    None → past_due (first entry, anchor set)
    past_due → retry_1_pending (retry_count=1, fail)
    past_due → None (retry_count=1, success → exit to enrolled)
    retry_1_pending → retry_2_pending (retry_count=2, fail)
    retry_1_pending → None (retry_count=2, success → exit to enrolled)
    retry_2_pending → suspended (+14d cumulative)
    suspended → cancelled → END

  Cron cadence:
    payment_status="failed" → workflow enters dunning, past_due set
    +3d cron tick → retry_1
    +7d cumulative cron tick → retry_2
    +14d cumulative cron tick → suspend
"""

from __future__ import annotations

import uuid
from typing import Any

import pytest


@pytest.fixture
def tenant_id() -> uuid.UUID:
    return uuid.UUID("11111111-1111-1111-1111-111111111111")


@pytest.fixture
def lead_id() -> uuid.UUID:
    return uuid.UUID("22222222-2222-2222-2222-222222222222")


@pytest.fixture
def cohort_id() -> uuid.UUID:
    return uuid.UUID("33333333-3333-3333-3333-333333333333")


@pytest.fixture
def subscriber_id() -> uuid.UUID:
    return uuid.UUID("44444444-4444-4444-4444-444444444444")


@pytest.fixture
def thread_config(tenant_id: uuid.UUID, lead_id: uuid.UUID) -> dict[str, Any]:
    return {"configurable": {"thread_id": f"{tenant_id}:{lead_id}"}}


@pytest.fixture
def memory_checkpointer():
    from langgraph.checkpoint.memory import MemorySaver

    return MemorySaver()


@pytest.fixture
def qualify_tool_fit_stub():
    async def _stub(*, tenant_id: Any, lead_id: Any, cohort_id: Any) -> dict[str, Any]:
        return {
            "fit": True,
            "recommended_tier": "level_3_core",
            "fit_score": 0.87,
            "gaps": [],
            "cost_usd": 0.010,
        }

    return _stub


@pytest.fixture
def book_discovery_tool_stub():
    async def _stub(*, tenant_id: Any, lead_id: Any, cohort_id: Any) -> dict[str, Any]:
        return {
            "booking_id": uuid.UUID("aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa"),
            "booking_status": "confirmed",
            "cost_usd": 0.0,
        }

    return _stub


@pytest.fixture
def payment_retry_success_stub():
    """Retry tool that always succeeds."""

    calls: list[dict[str, Any]] = []

    async def _stub(
        *,
        tenant_id: Any,
        lead_id: Any,
        subscription_id: Any | None,
        retry_attempt: int,
    ) -> dict[str, Any]:
        calls.append(
            {
                "tenant_id": tenant_id,
                "lead_id": lead_id,
                "subscription_id": subscription_id,
                "retry_attempt": retry_attempt,
            }
        )
        return {
            "success": True,
            "payment_intent_id": f"pi_retry_{retry_attempt}",
            "failure_reason": None,
            "cost_usd": 0.0,
        }

    _stub.calls = calls  # type: ignore[attr-defined]
    return _stub


@pytest.fixture
def payment_retry_failure_stub():
    """Retry tool that always fails."""

    calls: list[dict[str, Any]] = []

    async def _stub(
        *,
        tenant_id: Any,
        lead_id: Any,
        subscription_id: Any | None,
        retry_attempt: int,
    ) -> dict[str, Any]:
        calls.append(
            {
                "tenant_id": tenant_id,
                "lead_id": lead_id,
                "subscription_id": subscription_id,
                "retry_attempt": retry_attempt,
            }
        )
        return {
            "success": False,
            "payment_intent_id": None,
            "failure_reason": "insufficient_funds",
            "cost_usd": 0.0,
        }

    _stub.calls = calls  # type: ignore[attr-defined]
    return _stub


# ---------------------------------------------------------------------------
# D1: payment_failed → dunning past_due (first entry sets anchor)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_payment_failed_enters_dunning_past_due(
    tenant_id: uuid.UUID,
    lead_id: uuid.UUID,
    cohort_id: uuid.UUID,
    thread_config: dict[str, Any],
    memory_checkpointer: Any,
    qualify_tool_fit_stub: Any,
    book_discovery_tool_stub: Any,
) -> None:
    """D1: payment_status=failed → workflow routes to payment_failed_dunning.

    First entry MUST set dunning_state="past_due" + anchor
    dunning_first_failure_at to current UTC time.
    """
    from src.modules.comunify.copilot.workflows.cohort_enrollment_workflow import (
        build_cohort_enrollment_workflow,
    )

    workflow = build_cohort_enrollment_workflow(
        checkpointer=memory_checkpointer,
        qualify_tool=qualify_tool_fit_stub,
        book_discovery_tool=book_discovery_tool_stub,
    )

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

    # Drive through to payment_pending
    await workflow.ainvoke(initial, config=thread_config)
    await workflow.ainvoke(
        {"current_step": "terms_presentation", "terms_accepted": True},
        config=thread_config,
    )

    # Payment fails → dunning
    state = await workflow.ainvoke(
        {"current_step": "payment_pending", "payment_status": "failed"},
        config=thread_config,
    )

    assert state["current_step"] == "payment_failed_dunning"
    assert state["dunning_state"] == "past_due"
    assert state["dunning_first_failure_at"] is not None


# ---------------------------------------------------------------------------
# D2: dunning happy path — past_due → retry_1 succeeds → enrolled
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_dunning_retry_1_success_recovers_to_enrolled(
    tenant_id: uuid.UUID,
    lead_id: uuid.UUID,
    cohort_id: uuid.UUID,
    subscriber_id: uuid.UUID,
    thread_config: dict[str, Any],
    memory_checkpointer: Any,
    qualify_tool_fit_stub: Any,
    book_discovery_tool_stub: Any,
    payment_retry_success_stub: Any,
) -> None:
    """D2 happy: past_due + retry_count=1 + success → exit dunning → enrolled.

    Seeds the workflow into payment_failed_dunning with past_due state, then
    fires the retry_1 cron tick which invokes the payment retry tool. Tool
    returns success → dunning_state cleared → workflow exits to enrolled.
    """
    from src.modules.comunify.copilot.workflows.cohort_enrollment_workflow import (
        build_cohort_enrollment_workflow,
    )

    workflow = build_cohort_enrollment_workflow(
        checkpointer=memory_checkpointer,
        qualify_tool=qualify_tool_fit_stub,
        book_discovery_tool=book_discovery_tool_stub,
        payment_retry_tool=payment_retry_success_stub,
    )

    # Seed workflow into past_due state
    seed_state = {
        "tenant_id": tenant_id,
        "lead_id": lead_id,
        "cohort_id": cohort_id,
        "subscriber_id": subscriber_id,
        "current_step": "payment_failed_dunning",
        "dunning_state": "past_due",
        "dunning_retry_count": 0,
        "cost_accumulated_usd": 0.0,
        "iterations": 0,
    }
    await workflow.ainvoke(seed_state, config=thread_config)

    # Cron retry_1 tick injects retry_count=1
    state = await workflow.ainvoke(
        {
            "current_step": "payment_failed_dunning",
            "dunning_retry_count": 1,
        },
        config=thread_config,
    )

    # Retry tool was invoked with retry_attempt=1
    assert payment_retry_success_stub.calls
    last_call = payment_retry_success_stub.calls[-1]
    assert last_call["retry_attempt"] == 1
    assert last_call["subscription_id"] == subscriber_id

    # Workflow exited to enrolled (retry succeeded → dunning_state cleared)
    assert state["current_step"] == "enrolled"
    assert state["dunning_state"] is None
    assert state["payment_status"] == "succeeded"


# ---------------------------------------------------------------------------
# D3: dunning escalate retry_1 → retry_2 → suspended → cancelled
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_dunning_escalates_to_suspended_then_cancelled(
    tenant_id: uuid.UUID,
    lead_id: uuid.UUID,
    cohort_id: uuid.UUID,
    subscriber_id: uuid.UUID,
    thread_config: dict[str, Any],
    memory_checkpointer: Any,
    qualify_tool_fit_stub: Any,
    book_discovery_tool_stub: Any,
    payment_retry_failure_stub: Any,
) -> None:
    """D3 escalate: retry_1 fail → retry_1_pending; retry_2 fail → retry_2_pending;
    +14d → suspended; cancellation → END.

    Walks through the full dunning escalation cadence with the retry tool
    failing each attempt. Final state lands on cancelled and workflow exits END.
    """
    from src.modules.comunify.copilot.workflows.cohort_enrollment_workflow import (
        build_cohort_enrollment_workflow,
    )

    workflow = build_cohort_enrollment_workflow(
        checkpointer=memory_checkpointer,
        qualify_tool=qualify_tool_fit_stub,
        book_discovery_tool=book_discovery_tool_stub,
        payment_retry_tool=payment_retry_failure_stub,
    )

    # Seed into past_due
    seed_state = {
        "tenant_id": tenant_id,
        "lead_id": lead_id,
        "cohort_id": cohort_id,
        "subscriber_id": subscriber_id,
        "current_step": "payment_failed_dunning",
        "dunning_state": "past_due",
        "dunning_retry_count": 0,
        "cost_accumulated_usd": 0.0,
        "iterations": 0,
    }
    await workflow.ainvoke(seed_state, config=thread_config)

    # Retry 1 (+3d cron tick) — fails
    state_1 = await workflow.ainvoke(
        {
            "current_step": "payment_failed_dunning",
            "dunning_retry_count": 1,
        },
        config=thread_config,
    )
    assert state_1["dunning_state"] == "retry_1_pending"
    assert state_1["current_step"] == "payment_failed_dunning"

    # Retry 2 (+7d cron tick) — fails
    state_2 = await workflow.ainvoke(
        {
            "current_step": "payment_failed_dunning",
            "dunning_retry_count": 2,
        },
        config=thread_config,
    )
    assert state_2["dunning_state"] == "retry_2_pending"

    # Suspend (+14d cron tick) — caller signals suspended explicitly
    state_3 = await workflow.ainvoke(
        {
            "current_step": "payment_failed_dunning",
            "dunning_state": "suspended",
        },
        config=thread_config,
    )
    assert state_3["dunning_state"] == "suspended"

    # Cancellation signal (terminal)
    state_4 = await workflow.ainvoke(
        {
            "current_step": "payment_failed_dunning",
            "dunning_state": "cancelled",
        },
        config=thread_config,
    )
    assert state_4["dunning_state"] == "cancelled"
    # Workflow routed to END via "cancelled" branch

    # Both retry attempts MUST have been invoked
    assert len(payment_retry_failure_stub.calls) == 2
    assert payment_retry_failure_stub.calls[0]["retry_attempt"] == 1
    assert payment_retry_failure_stub.calls[1]["retry_attempt"] == 2


# ---------------------------------------------------------------------------
# D4: retry_2 success after retry_1 failure → enrolled
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_dunning_retry_2_succeeds_after_retry_1_failed(
    tenant_id: uuid.UUID,
    lead_id: uuid.UUID,
    cohort_id: uuid.UUID,
    subscriber_id: uuid.UUID,
    thread_config: dict[str, Any],
    memory_checkpointer: Any,
    qualify_tool_fit_stub: Any,
    book_discovery_tool_stub: Any,
) -> None:
    """D4: retry_1 fails → retry_2 succeeds → exit to enrolled.

    Validates that a mid-cycle recovery (failure at +3d, success at +7d)
    correctly clears dunning_state and advances to enrolled.
    """
    from src.modules.comunify.copilot.workflows.cohort_enrollment_workflow import (
        build_cohort_enrollment_workflow,
    )

    # Custom retry tool: fails on retry_1, succeeds on retry_2
    call_log: list[int] = []

    async def mixed_retry_stub(
        *,
        tenant_id: Any,
        lead_id: Any,
        subscription_id: Any | None,
        retry_attempt: int,
    ) -> dict[str, Any]:
        call_log.append(retry_attempt)
        return {
            "success": retry_attempt == 2,
            "payment_intent_id": "pi_retry_2_success" if retry_attempt == 2 else None,
            "failure_reason": None if retry_attempt == 2 else "insufficient_funds",
            "cost_usd": 0.0,
        }

    workflow = build_cohort_enrollment_workflow(
        checkpointer=memory_checkpointer,
        qualify_tool=qualify_tool_fit_stub,
        book_discovery_tool=book_discovery_tool_stub,
        payment_retry_tool=mixed_retry_stub,
    )

    # Seed past_due
    await workflow.ainvoke(
        {
            "tenant_id": tenant_id,
            "lead_id": lead_id,
            "cohort_id": cohort_id,
            "subscriber_id": subscriber_id,
            "current_step": "payment_failed_dunning",
            "dunning_state": "past_due",
            "dunning_retry_count": 0,
            "cost_accumulated_usd": 0.0,
            "iterations": 0,
        },
        config=thread_config,
    )

    # Retry 1 fails
    await workflow.ainvoke(
        {"current_step": "payment_failed_dunning", "dunning_retry_count": 1},
        config=thread_config,
    )

    # Retry 2 succeeds → workflow exits to enrolled
    state = await workflow.ainvoke(
        {"current_step": "payment_failed_dunning", "dunning_retry_count": 2},
        config=thread_config,
    )

    assert call_log == [1, 2]
    assert state["current_step"] == "enrolled"
    assert state["dunning_state"] is None
    assert state["payment_status"] == "succeeded"
    assert state["payment_intent_id"] == "pi_retry_2_success"


# ---------------------------------------------------------------------------
# D5: graceful-degradation — payment_retry tool exception → state advances
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_dunning_handles_retry_tool_exception_gracefully(
    tenant_id: uuid.UUID,
    lead_id: uuid.UUID,
    cohort_id: uuid.UUID,
    subscriber_id: uuid.UUID,
    thread_config: dict[str, Any],
    memory_checkpointer: Any,
    qualify_tool_fit_stub: Any,
    book_discovery_tool_stub: Any,
) -> None:
    """D5 graceful-degradation Rule 5: retry tool raises → state degrades
    to retry_1_pending without crashing the workflow.

    Validates the try/except wrapper around payment_retry_tool invocation.
    """
    from src.modules.comunify.copilot.workflows.cohort_enrollment_workflow import (
        build_cohort_enrollment_workflow,
    )

    async def exploding_retry_stub(
        *, tenant_id: Any, lead_id: Any, subscription_id: Any | None, retry_attempt: int
    ) -> dict[str, Any]:
        raise RuntimeError("payment gateway timeout simulated")

    workflow = build_cohort_enrollment_workflow(
        checkpointer=memory_checkpointer,
        qualify_tool=qualify_tool_fit_stub,
        book_discovery_tool=book_discovery_tool_stub,
        payment_retry_tool=exploding_retry_stub,
    )

    # Seed into past_due
    await workflow.ainvoke(
        {
            "tenant_id": tenant_id,
            "lead_id": lead_id,
            "cohort_id": cohort_id,
            "subscriber_id": subscriber_id,
            "current_step": "payment_failed_dunning",
            "dunning_state": "past_due",
            "dunning_retry_count": 0,
            "cost_accumulated_usd": 0.0,
            "iterations": 0,
        },
        config=thread_config,
    )

    # Retry 1 raises — workflow MUST NOT crash; state advances to retry_1_pending
    state = await workflow.ainvoke(
        {"current_step": "payment_failed_dunning", "dunning_retry_count": 1},
        config=thread_config,
    )

    assert state["dunning_state"] == "retry_1_pending"
    assert state["current_step"] == "payment_failed_dunning"


# ---------------------------------------------------------------------------
# D6: no payment_retry_tool wired → degraded mode advances state deterministically
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_dunning_without_retry_tool_degrades_deterministically(
    tenant_id: uuid.UUID,
    lead_id: uuid.UUID,
    cohort_id: uuid.UUID,
    subscriber_id: uuid.UUID,
    thread_config: dict[str, Any],
    memory_checkpointer: Any,
    qualify_tool_fit_stub: Any,
    book_discovery_tool_stub: Any,
) -> None:
    """D6: no payment_retry_tool wired → workflow advances dunning_state
    deterministically (retry_1_pending → retry_2_pending → suspended).

    Validates the None-tool branch in the dunning node.
    """
    from src.modules.comunify.copilot.workflows.cohort_enrollment_workflow import (
        build_cohort_enrollment_workflow,
    )

    workflow = build_cohort_enrollment_workflow(
        checkpointer=memory_checkpointer,
        qualify_tool=qualify_tool_fit_stub,
        book_discovery_tool=book_discovery_tool_stub,
        # payment_retry_tool=None  (intentional)
    )

    # Seed past_due
    await workflow.ainvoke(
        {
            "tenant_id": tenant_id,
            "lead_id": lead_id,
            "cohort_id": cohort_id,
            "subscriber_id": subscriber_id,
            "current_step": "payment_failed_dunning",
            "dunning_state": "past_due",
            "dunning_retry_count": 0,
            "cost_accumulated_usd": 0.0,
            "iterations": 0,
        },
        config=thread_config,
    )

    state_1 = await workflow.ainvoke(
        {"current_step": "payment_failed_dunning", "dunning_retry_count": 1},
        config=thread_config,
    )
    assert state_1["dunning_state"] == "retry_1_pending"

    state_2 = await workflow.ainvoke(
        {"current_step": "payment_failed_dunning", "dunning_retry_count": 2},
        config=thread_config,
    )
    assert state_2["dunning_state"] == "suspended"
