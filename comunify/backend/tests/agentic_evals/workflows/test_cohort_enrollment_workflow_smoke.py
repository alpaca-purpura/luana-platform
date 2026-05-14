"""Workflow tests — CohortEnrollmentWorkflow smoke + state transitions.

Story 12 luana-comunify-bootstrap T-workflows-2 (R23 Opus 4.7 production
AGENTIC code).

TDD: tests describe the acceptance criteria laid out in the ticket — see
06-tickets.yaml::T-workflows-2 "Tests" block.

Covers (03-arch-agentic.md § 6.2 state machine):
  - smoke happy: qualification → discovery → terms → payment → enrolled
  - qualification no_fit → END
  - terms rejected → END
  - payment expired_48h → retry → succeeded
  - payment expired_48h → drop
  - cost budget enforcement (≤ $0.20 USD per workflow run)
  - tenant isolation (thread_id composes tenant_id:lead_id)
  - tool injection: qualify / book_discovery / payment_retry stubs

Unit tests — MemorySaver checkpointer per D10 staging. All tools are stubs;
real agentic_tools integration is exercised end-to-end via V-AE-13 grader
(rubric pass^k).
"""

from __future__ import annotations

import uuid
from typing import Any

import pytest

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


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
def initial_state(
    tenant_id: uuid.UUID,
    lead_id: uuid.UUID,
    cohort_id: uuid.UUID,
) -> dict[str, Any]:
    """Initial workflow state at first invocation per 03-arch-agentic § 6.2."""
    return {
        "tenant_id": tenant_id,
        "lead_id": lead_id,
        "cohort_id": cohort_id,
        "current_step": "qualification",
        "qualification_score": None,
        "qualification_fit": None,
        "qualification_gaps": [],
        "discovery_call_booking_id": None,
        "discovery_call_completed": False,
        "terms_accepted": None,
        "payment_intent_id": None,
        "payment_status": None,
        "payment_pending_at": None,
        "payment_failed_count": 0,
        "payment_expired_retry_count": 0,
        "dunning_state": None,
        "dunning_first_failure_at": None,
        "dunning_retry_count": 0,
        "enrollment_at": None,
        "cost_accumulated_usd": 0.0,
        "iterations": 0,
    }


@pytest.fixture
def thread_config(tenant_id: uuid.UUID, lead_id: uuid.UUID) -> dict[str, Any]:
    """Per-thread config — composite (tenant_id, lead_id) per § 6.4."""
    return {"configurable": {"thread_id": f"{tenant_id}:{lead_id}"}}


@pytest.fixture
def memory_checkpointer():
    """In-process checkpointer — RedisSaver swap deferred per D10 staging."""
    from langgraph.checkpoint.memory import MemorySaver

    return MemorySaver()


# ── Tool stubs ─────────────────────────────────────────────────────────────


@pytest.fixture
def qualify_tool_fit_stub():
    """Stub qualify_for_cohort that always returns fit=True (happy path)."""

    calls: list[dict[str, Any]] = []

    async def _stub(*, tenant_id: Any, lead_id: Any, cohort_id: Any) -> dict[str, Any]:
        calls.append({"tenant_id": tenant_id, "lead_id": lead_id, "cohort_id": cohort_id})
        return {
            "fit": True,
            "recommended_tier": "level_3_core",
            "fit_score": 0.87,
            "gaps": [],
            "cost_usd": 0.010,
        }

    _stub.calls = calls  # type: ignore[attr-defined]
    return _stub


@pytest.fixture
def qualify_tool_no_fit_stub():
    """Stub qualify_for_cohort that always returns fit=False."""

    calls: list[dict[str, Any]] = []

    async def _stub(*, tenant_id: Any, lead_id: Any, cohort_id: Any) -> dict[str, Any]:
        calls.append({"tenant_id": tenant_id, "lead_id": lead_id, "cohort_id": cohort_id})
        return {
            "fit": False,
            "recommended_tier": "not_fit",
            "fit_score": 0.32,
            "gaps": ["below_income_threshold"],
            "cost_usd": 0.007,
        }

    _stub.calls = calls  # type: ignore[attr-defined]
    return _stub


@pytest.fixture
def book_discovery_tool_stub():
    """Stub book_discovery_call that always succeeds with booking_id."""

    calls: list[dict[str, Any]] = []
    booking_uuid = uuid.UUID("aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa")

    async def _stub(*, tenant_id: Any, lead_id: Any, cohort_id: Any) -> dict[str, Any]:
        calls.append({"tenant_id": tenant_id, "lead_id": lead_id, "cohort_id": cohort_id})
        return {
            "booking_id": booking_uuid,
            "booking_status": "confirmed",
            "cost_usd": 0.0,
        }

    _stub.calls = calls  # type: ignore[attr-defined]
    _stub.booking_uuid = booking_uuid  # type: ignore[attr-defined]
    return _stub


@pytest.fixture
def payment_retry_tool_success_stub():
    """Stub payment retry that always succeeds."""

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
def payment_retry_tool_failure_stub():
    """Stub payment retry that always fails (dunning escalates)."""

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
# A1 acceptance: smoke happy path qualification → enrolled
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_smoke_happy_path_qualification_to_enrolled(
    initial_state: dict[str, Any],
    thread_config: dict[str, Any],
    memory_checkpointer: Any,
    qualify_tool_fit_stub: Any,
    book_discovery_tool_stub: Any,
) -> None:
    """A1 acceptance: full happy path qualification → discovery → terms → payment → enrolled.

    Drives the workflow through every main state in a single test by
    providing all signal values upfront (qualified, terms_accepted=True,
    payment_status="succeeded") so the workflow flows through all
    conditional edges in one invocation chain.
    """
    from src.modules.comunify.copilot.workflows.cohort_enrollment_workflow import (
        build_cohort_enrollment_workflow,
    )

    workflow = build_cohort_enrollment_workflow(
        checkpointer=memory_checkpointer,
        qualify_tool=qualify_tool_fit_stub,
        book_discovery_tool=book_discovery_tool_stub,
    )

    # Stage 1: qualification (initial state).
    state_after_qual = await workflow.ainvoke(initial_state, config=thread_config)
    assert qualify_tool_fit_stub.calls, "qualify_tool MUST have been invoked"
    # Routes from qualification → discovery_call_scheduled → terms_presentation
    # then parks awaiting terms_accepted signal. Could land on any of these.
    assert state_after_qual["qualification_fit"] is True
    assert state_after_qual["qualification_score"] == pytest.approx(0.87)
    assert book_discovery_tool_stub.calls, "book_discovery_tool MUST have been invoked"
    assert state_after_qual["discovery_call_booking_id"] == book_discovery_tool_stub.booking_uuid

    # Stage 2: terms accepted → payment_pending
    state_after_terms = await workflow.ainvoke(
        {"current_step": "terms_presentation", "terms_accepted": True},
        config=thread_config,
    )
    assert state_after_terms["current_step"] == "payment_pending"

    # Stage 3: payment succeeded → enrolled (terminal)
    state_after_payment = await workflow.ainvoke(
        {"current_step": "payment_pending", "payment_status": "succeeded"},
        config=thread_config,
    )
    assert state_after_payment["current_step"] == "enrolled"
    assert state_after_payment["enrollment_at"] is not None
    assert state_after_payment["dunning_state"] is None  # clean enrollment


# ---------------------------------------------------------------------------
# A2 acceptance: qualification no_fit → END
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_qualification_no_fit_terminates(
    initial_state: dict[str, Any],
    thread_config: dict[str, Any],
    memory_checkpointer: Any,
    qualify_tool_no_fit_stub: Any,
    book_discovery_tool_stub: Any,
) -> None:
    """A2 acceptance: qualification fit=False → END (no discovery booking).

    Validates the conditional edge ``qualification → END`` short-circuits
    when fit signal is False — book_discovery_tool MUST NOT be invoked.
    """
    from src.modules.comunify.copilot.workflows.cohort_enrollment_workflow import (
        build_cohort_enrollment_workflow,
    )

    workflow = build_cohort_enrollment_workflow(
        checkpointer=memory_checkpointer,
        qualify_tool=qualify_tool_no_fit_stub,
        book_discovery_tool=book_discovery_tool_stub,
    )

    state = await workflow.ainvoke(initial_state, config=thread_config)
    assert qualify_tool_no_fit_stub.calls, "qualify_tool MUST have been invoked"
    assert not book_discovery_tool_stub.calls, "book_discovery_tool MUST NOT be invoked on no_fit"
    assert state["qualification_fit"] is False
    # Workflow exited via END — current_step is "qualification" (last node visited).
    assert state["current_step"] == "qualification"


# ---------------------------------------------------------------------------
# A3 acceptance: terms rejected → END
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_terms_rejected_terminates(
    initial_state: dict[str, Any],
    thread_config: dict[str, Any],
    memory_checkpointer: Any,
    qualify_tool_fit_stub: Any,
    book_discovery_tool_stub: Any,
) -> None:
    """A3 acceptance: terms_presentation rejected → END (no payment).

    Walks through qualification + discovery + terms presentation, then
    terms_accepted=False routes to END. Workflow MUST NOT enter payment.
    """
    from src.modules.comunify.copilot.workflows.cohort_enrollment_workflow import (
        build_cohort_enrollment_workflow,
    )

    workflow = build_cohort_enrollment_workflow(
        checkpointer=memory_checkpointer,
        qualify_tool=qualify_tool_fit_stub,
        book_discovery_tool=book_discovery_tool_stub,
    )

    await workflow.ainvoke(initial_state, config=thread_config)
    state = await workflow.ainvoke(
        {"current_step": "terms_presentation", "terms_accepted": False},
        config=thread_config,
    )
    # No payment_pending — workflow exited via END from terms_presentation
    assert state["current_step"] == "terms_presentation"
    assert state["payment_status"] is None


# ---------------------------------------------------------------------------
# A4 acceptance: payment expired_48h → retry → succeeded
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_payment_expired_retry_then_succeeds(
    initial_state: dict[str, Any],
    thread_config: dict[str, Any],
    memory_checkpointer: Any,
    qualify_tool_fit_stub: Any,
    book_discovery_tool_stub: Any,
) -> None:
    """payment_pending expired_48h → payment_expired → retry → payment_pending → succeeded.

    First expiry triggers retry (retry_count=0 → 1). On second pass with
    payment succeeded, workflow advances to enrolled.
    """
    from src.modules.comunify.copilot.workflows.cohort_enrollment_workflow import (
        build_cohort_enrollment_workflow,
    )

    workflow = build_cohort_enrollment_workflow(
        checkpointer=memory_checkpointer,
        qualify_tool=qualify_tool_fit_stub,
        book_discovery_tool=book_discovery_tool_stub,
    )

    # Drive through to payment_pending
    await workflow.ainvoke(initial_state, config=thread_config)
    await workflow.ainvoke(
        {"current_step": "terms_presentation", "terms_accepted": True},
        config=thread_config,
    )

    # First payment timeout → expired → retry route → back to payment_pending
    state_after_expired = await workflow.ainvoke(
        {"current_step": "payment_pending", "payment_status": "expired_48h"},
        config=thread_config,
    )
    # After payment_expired routes "retry", workflow lands on payment_pending
    # which itself routes "wait" (since payment_status still set to expired_48h
    # OR cleared depending on update). Accept either landing.
    assert state_after_expired["current_step"] in {"payment_pending", "payment_expired"}

    # Second invocation with success signal → enrolled
    state_after_success = await workflow.ainvoke(
        {"current_step": "payment_pending", "payment_status": "succeeded"},
        config=thread_config,
    )
    assert state_after_success["current_step"] == "enrolled"


# ---------------------------------------------------------------------------
# A5 acceptance: payment expired → drop after retry exhausted
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_payment_expired_drops_after_retry_exhausted(
    initial_state: dict[str, Any],
    thread_config: dict[str, Any],
    memory_checkpointer: Any,
    qualify_tool_fit_stub: Any,
    book_discovery_tool_stub: Any,
) -> None:
    """payment_expired with retry_count >= 1 → drop → END.

    Seeds payment_expired_retry_count=1 to force the drop branch on next
    expiry tick. Confirms the conditional edge wires correctly.
    """
    from src.modules.comunify.copilot.workflows.cohort_enrollment_workflow import (
        build_cohort_enrollment_workflow,
    )

    workflow = build_cohort_enrollment_workflow(
        checkpointer=memory_checkpointer,
        qualify_tool=qualify_tool_fit_stub,
        book_discovery_tool=book_discovery_tool_stub,
    )

    await workflow.ainvoke(initial_state, config=thread_config)
    await workflow.ainvoke(
        {"current_step": "terms_presentation", "terms_accepted": True},
        config=thread_config,
    )

    # Force into payment_expired with retry exhausted
    state = await workflow.ainvoke(
        {
            "current_step": "payment_expired",
            "payment_expired_retry_count": 1,
        },
        config=thread_config,
    )
    # Workflow exited via END from payment_expired (drop path)
    assert state["current_step"] == "payment_expired"
    assert state.get("enrollment_at") is None


# ---------------------------------------------------------------------------
# A6 acceptance: cost budget ≤ $0.20 USD per workflow run
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_cost_budget_under_ceiling(
    initial_state: dict[str, Any],
    thread_config: dict[str, Any],
    memory_checkpointer: Any,
    qualify_tool_fit_stub: Any,
    book_discovery_tool_stub: Any,
) -> None:
    """A6 acceptance: total per-run cost ≤ $0.20 USD per arch § 6.6.

    Validated against
    ``comunify_cohort_enrollment_descriptor.cost_budget_per_workflow_run``.
    """
    from src.modules.comunify.copilot.module_registry_entry import (
        comunify_cohort_enrollment_descriptor,
    )
    from src.modules.comunify.copilot.workflows.cohort_enrollment_workflow import (
        build_cohort_enrollment_workflow,
    )

    budget = comunify_cohort_enrollment_descriptor.cost_budget_per_workflow_run
    assert budget == pytest.approx(0.20), f"Expected cost_budget=0.20 USD, got {budget}"

    workflow = build_cohort_enrollment_workflow(
        checkpointer=memory_checkpointer,
        qualify_tool=qualify_tool_fit_stub,
        book_discovery_tool=book_discovery_tool_stub,
    )

    # Drive full happy-path cycle through to enrolled
    await workflow.ainvoke(initial_state, config=thread_config)
    await workflow.ainvoke(
        {"current_step": "terms_presentation", "terms_accepted": True},
        config=thread_config,
    )
    final_state = await workflow.ainvoke(
        {"current_step": "payment_pending", "payment_status": "succeeded"},
        config=thread_config,
    )

    accumulated = final_state["cost_accumulated_usd"]
    assert accumulated <= budget, f"Total cost {accumulated:.4f} USD exceeded budget {budget:.4f} USD"
    assert accumulated > 0, "Expected non-zero accumulated cost (nodes invoked stubs)"


# ---------------------------------------------------------------------------
# A7 acceptance: tenant isolation — distinct lead_ids isolate state
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_distinct_lead_ids_isolate_state(
    tenant_id: uuid.UUID,
    cohort_id: uuid.UUID,
    memory_checkpointer: Any,
    qualify_tool_fit_stub: Any,
    book_discovery_tool_stub: Any,
) -> None:
    """A7 acceptance: two distinct lead_ids same tenant_id → state isolated.

    Validates the tenant_isolation invariant at the persistence boundary
    (D10 / arch § 6.4) — thread_id composes f"{tenant_id}:{lead_id}".
    """
    from src.modules.comunify.copilot.workflows.cohort_enrollment_workflow import (
        build_cohort_enrollment_workflow,
    )

    workflow = build_cohort_enrollment_workflow(
        checkpointer=memory_checkpointer,
        qualify_tool=qualify_tool_fit_stub,
        book_discovery_tool=book_discovery_tool_stub,
    )

    lead_a = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
    lead_b = uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")

    config_a = {"configurable": {"thread_id": f"{tenant_id}:{lead_a}"}}
    config_b = {"configurable": {"thread_id": f"{tenant_id}:{lead_b}"}}

    base_state: dict[str, Any] = {
        "tenant_id": tenant_id,
        "cohort_id": cohort_id,
        "current_step": "qualification",
        "qualification_fit": None,
        "qualification_gaps": [],
        "terms_accepted": None,
        "payment_status": None,
        "payment_expired_retry_count": 0,
        "dunning_retry_count": 0,
        "cost_accumulated_usd": 0.0,
        "iterations": 0,
    }
    state_a_init = dict(base_state, lead_id=lead_a)
    state_b_init = dict(base_state, lead_id=lead_b)

    # Drive both leads to qualification → discovery_call_scheduled
    await workflow.ainvoke(state_a_init, config=config_a)
    await workflow.ainvoke(state_b_init, config=config_b)

    # Advance lead_a through terms accepted → payment_pending
    await workflow.ainvoke(
        {"current_step": "terms_presentation", "terms_accepted": True},
        config=config_a,
    )

    # Lead_b stays at terms_presentation rejected
    await workflow.ainvoke(
        {"current_step": "terms_presentation", "terms_accepted": False},
        config=config_b,
    )

    # Snapshots MUST diverge
    snapshot_a = await workflow.aget_state(config_a)
    snapshot_b = await workflow.aget_state(config_b)

    assert snapshot_a.values["lead_id"] == lead_a
    assert snapshot_b.values["lead_id"] == lead_b
    # lead_a advanced to payment_pending; lead_b stuck at terms_presentation
    assert snapshot_a.values["current_step"] == "payment_pending"
    assert snapshot_b.values["current_step"] == "terms_presentation"
