"""Workflow tests — CommunityEngagementWorkflow smoke + state transitions.

Story 12 luana-comunify-bootstrap T-workflows-1 (R23 Opus 4.7 production
AGENTIC code).

TDD: tests describe the acceptance criteria laid out in the ticket — see
06-tickets.yaml::T-workflows-1 "Tests" block.

Covers (03-arch-agentic.md § 6.1 state machine):
  - smoke: active → drift_detected via cron → nurture tool → re_engaged
  - escalate: drift + creator_intervention_required → escalated state
  - dropped_silent: drift + nurture_failed_count ≥ 2 → dropped_silent
  - terminal: dropped_silent → terminal_dropped → END
  - tool injection: nurture stub called with correct tenant_id /
    subscriber_id signature
  - tenant isolation: thread_id composes tenant_id:subscriber_id

Unit tests — MemorySaver checkpointer per D10 staging. nurture_tool is a
stub callable: real
``modules.comunify.agentic.tools.nurture_via_authority_content`` integration
is exercised end-to-end via V-AE-13 grader (rubric pass^k).
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
def subscriber_id() -> uuid.UUID:
    return uuid.UUID("22222222-2222-2222-2222-222222222222")


@pytest.fixture
def cohort_id() -> uuid.UUID:
    return uuid.UUID("33333333-3333-3333-3333-333333333333")


@pytest.fixture
def initial_state(
    tenant_id: uuid.UUID,
    subscriber_id: uuid.UUID,
    cohort_id: uuid.UUID,
) -> dict[str, Any]:
    """Initial workflow state at first invocation per 03-arch-agentic § 6.1."""
    return {
        "tenant_id": tenant_id,
        "subscriber_id": subscriber_id,
        "cohort_id": cohort_id,
        "current_step": "active",
        "last_activity_at": None,
        "drift_detected_at": None,
        "member_response_text": None,
        "sentiment": None,
        "vulnerability_disclosed": False,
        "creator_intervention_required": False,
        "nurture_failed_count": 0,
        "next_milestone_at": None,
        "cost_accumulated_usd": 0.0,
        "iterations": 0,
    }


@pytest.fixture
def thread_config(tenant_id: uuid.UUID, subscriber_id: uuid.UUID) -> dict[str, Any]:
    """Per-thread config — composite (tenant_id, subscriber_id) per § 6.4."""
    return {"configurable": {"thread_id": f"{tenant_id}:{subscriber_id}"}}


@pytest.fixture
def memory_checkpointer():
    """In-process checkpointer — RedisSaver swap deferred per D10 staging."""
    from langgraph.checkpoint.memory import MemorySaver

    return MemorySaver()


@pytest.fixture
def nurture_tool_success_stub():
    """Stub nurture tool that always reports success — re_engagement flow."""

    calls: list[dict[str, Any]] = []

    async def _stub(
        *,
        tenant_id: Any,
        subscriber_id: Any,
        cohort_id: Any,
        member_response_text: str | None,
    ) -> dict[str, Any]:
        calls.append(
            {
                "tenant_id": tenant_id,
                "subscriber_id": subscriber_id,
                "cohort_id": cohort_id,
                "member_response_text": member_response_text,
            }
        )
        return {"success": True, "cost_usd": 0.009}

    _stub.calls = calls  # type: ignore[attr-defined]
    return _stub


@pytest.fixture
def nurture_tool_failure_stub():
    """Stub nurture tool that always reports failure — drift accumulates."""

    calls: list[dict[str, Any]] = []

    async def _stub(
        *,
        tenant_id: Any,
        subscriber_id: Any,
        cohort_id: Any,
        member_response_text: str | None,
    ) -> dict[str, Any]:
        calls.append(
            {
                "tenant_id": tenant_id,
                "subscriber_id": subscriber_id,
                "cohort_id": cohort_id,
                "member_response_text": member_response_text,
            }
        )
        return {"success": False, "cost_usd": 0.001}

    _stub.calls = calls  # type: ignore[attr-defined]
    return _stub


# ---------------------------------------------------------------------------
# Smoke — active → drift_detected → re_engaged
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_smoke_active_to_drift_to_re_engaged(
    initial_state: dict[str, Any],
    thread_config: dict[str, Any],
    memory_checkpointer: Any,
    nurture_tool_success_stub: Any,
) -> None:
    """A1 acceptance: active → drift via cron → nurture tool success → re_engaged.

    First invocation enters ``active``, parks. Cron tick injects
    ``current_step="drift_detected"`` + a member response that signals
    re-engagement → nurture tool fires (cost recorded) → router decides
    ``re_engaged`` (member_response_text not None + no escalation signals).
    """
    from src.modules.comunify.copilot.workflows.community_engagement_workflow import (
        build_community_engagement_workflow,
    )

    workflow = build_community_engagement_workflow(
        checkpointer=memory_checkpointer,
        nurture_tool=nurture_tool_success_stub,
    )

    # First invocation — workflow enters active, parks awaiting cron tick.
    state_after_active = await workflow.ainvoke(initial_state, config=thread_config)
    assert state_after_active["current_step"] == "active"
    assert state_after_active["iterations"] >= 1

    # Cron tick — inject drift_detected with positive member response.
    drift_tick_input = {
        "current_step": "drift_detected",
        "member_response_text": "¡Hola! Andaba ocupado, vuelvo al grupo.",
    }
    state_after_drift = await workflow.ainvoke(drift_tick_input, config=thread_config)

    # Nurture tool was invoked exactly once with correct context.
    assert len(nurture_tool_success_stub.calls) == 1
    call_args = nurture_tool_success_stub.calls[0]
    assert call_args["tenant_id"] == initial_state["tenant_id"]
    assert call_args["subscriber_id"] == initial_state["subscriber_id"]
    assert call_args["cohort_id"] == initial_state["cohort_id"]
    assert call_args["member_response_text"] is not None

    # member_response_text + no escalation flags → re_engaged → loops back to active
    # active node clears member_response_text + drift_detected_at as idempotent
    # reset, so final state is "active" with iterations incremented.
    assert state_after_drift["current_step"] in {"re_engaged", "active"}
    assert state_after_drift["cost_accumulated_usd"] > 0.0


@pytest.mark.asyncio
async def test_smoke_re_engaged_loops_back_to_active(
    initial_state: dict[str, Any],
    thread_config: dict[str, Any],
    memory_checkpointer: Any,
    nurture_tool_success_stub: Any,
) -> None:
    """After re_engaged, workflow loops back to active for next cycle.

    Validates: re_engaged → active edge + signals reset
    (drift_detected_at=None, nurture_failed_count=0, escalation flags False).
    """
    from src.modules.comunify.copilot.workflows.community_engagement_workflow import (
        build_community_engagement_workflow,
    )

    workflow = build_community_engagement_workflow(
        checkpointer=memory_checkpointer,
        nurture_tool=nurture_tool_success_stub,
    )

    await workflow.ainvoke(initial_state, config=thread_config)
    drift_tick_input = {
        "current_step": "drift_detected",
        "member_response_text": "Acá ando, gracias por escribir.",
    }
    final_state = await workflow.ainvoke(drift_tick_input, config=thread_config)

    # After re_engaged → active loop, both signals are cleared.
    assert final_state["nurture_failed_count"] == 0
    assert final_state["vulnerability_disclosed"] is False
    assert final_state["creator_intervention_required"] is False


# ---------------------------------------------------------------------------
# Escalation — vulnerability disclosure / creator intervention
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_drift_with_creator_intervention_routes_to_escalated(
    initial_state: dict[str, Any],
    thread_config: dict[str, Any],
    memory_checkpointer: Any,
    nurture_tool_success_stub: Any,
) -> None:
    """A2 acceptance: drift + creator_intervention_required → escalated state.

    Workflow honors caller signal for manual creator handling — skips nurture
    tool invocation (defense-in-depth) and parks in
    ``escalated_to_creator_manual``.
    """
    from src.modules.comunify.copilot.workflows.community_engagement_workflow import (
        build_community_engagement_workflow,
    )

    workflow = build_community_engagement_workflow(
        checkpointer=memory_checkpointer,
        nurture_tool=nurture_tool_success_stub,
    )

    await workflow.ainvoke(initial_state, config=thread_config)
    escalation_tick_input = {
        "current_step": "drift_detected",
        "creator_intervention_required": True,
    }
    state_after = await workflow.ainvoke(escalation_tick_input, config=thread_config)

    # Nurture tool MUST NOT have fired — escalation short-circuits invocation.
    assert len(nurture_tool_success_stub.calls) == 0
    assert state_after["current_step"] == "escalated_to_creator_manual"


@pytest.mark.asyncio
async def test_drift_with_vulnerability_disclosed_routes_to_escalated(
    initial_state: dict[str, Any],
    thread_config: dict[str, Any],
    memory_checkpointer: Any,
    nurture_tool_success_stub: Any,
) -> None:
    """Vulnerability-disclosure path: drift + vulnerability_disclosed → escalated.

    Per arch § 6.1 + creator-economy guardrails — vulnerability-disclosure
    signal forces manual creator handling, NEVER auto-responds with nurture
    content.
    """
    from src.modules.comunify.copilot.workflows.community_engagement_workflow import (
        build_community_engagement_workflow,
    )

    workflow = build_community_engagement_workflow(
        checkpointer=memory_checkpointer,
        nurture_tool=nurture_tool_success_stub,
    )

    await workflow.ainvoke(initial_state, config=thread_config)
    vulnerable_tick_input = {
        "current_step": "drift_detected",
        "vulnerability_disclosed": True,
        "member_response_text": "Estoy pasando un mal momento...",
    }
    state_after = await workflow.ainvoke(vulnerable_tick_input, config=thread_config)

    # Vulnerability triggers escalation BEFORE nurture invocation.
    assert len(nurture_tool_success_stub.calls) == 0
    assert state_after["current_step"] == "escalated_to_creator_manual"


# ---------------------------------------------------------------------------
# Dropped silent — nurture_failed_count ≥ 2
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_drift_with_repeated_nurture_failure_routes_to_dropped_silent(
    initial_state: dict[str, Any],
    thread_config: dict[str, Any],
    memory_checkpointer: Any,
    nurture_tool_failure_stub: Any,
) -> None:
    """A3 acceptance: drift + nurture_failed_count ≥ 2 → dropped_silent.

    Two consecutive drift checks with no member response → cumulative
    failures exceed threshold → workflow routes to dropped_silent terminal.
    """
    from src.modules.comunify.copilot.workflows.community_engagement_workflow import (
        build_community_engagement_workflow,
    )

    workflow = build_community_engagement_workflow(
        checkpointer=memory_checkpointer,
        nurture_tool=nurture_tool_failure_stub,
    )

    await workflow.ainvoke(initial_state, config=thread_config)

    # First drift tick — nurture fails, no member response → wait.
    first_drift = {"current_step": "drift_detected"}
    state1 = await workflow.ainvoke(first_drift, config=thread_config)
    # First failure increments count to 1, stays at drift_detected.
    assert state1["current_step"] == "drift_detected"
    assert state1["nurture_failed_count"] == 1

    # Second drift tick — nurture fails again → count reaches 2 → dropped_silent.
    second_drift = {"current_step": "drift_detected"}
    state2 = await workflow.ainvoke(second_drift, config=thread_config)

    # nurture_failed_count >= 2 routing triggers — dropped_silent → terminal
    assert state2["current_step"] in {"dropped_silent", "terminal_dropped"}


# ---------------------------------------------------------------------------
# Terminal transition — dropped_silent → terminal_dropped
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_dropped_silent_transitions_to_terminal(
    initial_state: dict[str, Any],
    thread_config: dict[str, Any],
    memory_checkpointer: Any,
    nurture_tool_failure_stub: Any,
) -> None:
    """dropped_silent → terminal_dropped → END.

    Validates: ``add_edge("dropped_silent", "terminal_dropped")``
    + ``add_edge("terminal_dropped", END)`` per § 6.1.
    """
    from src.modules.comunify.copilot.workflows.community_engagement_workflow import (
        build_community_engagement_workflow,
    )

    workflow = build_community_engagement_workflow(
        checkpointer=memory_checkpointer,
        nurture_tool=nurture_tool_failure_stub,
    )

    # Seed state with 2 prior nurture failures + drift signal → route triggers
    seeded_state = dict(initial_state)
    seeded_state["current_step"] = "drift_detected"
    seeded_state["nurture_failed_count"] = 2

    final_state = await workflow.ainvoke(seeded_state, config=thread_config)

    # Routes to dropped_silent which auto-edges to terminal_dropped.
    assert final_state["current_step"] == "terminal_dropped"


# ---------------------------------------------------------------------------
# Cost budget — ≤ $0.10 per workflow run
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_cost_budget_under_ceiling(
    initial_state: dict[str, Any],
    thread_config: dict[str, Any],
    memory_checkpointer: Any,
    nurture_tool_success_stub: Any,
) -> None:
    """A4 acceptance: total per-run cost ≤ $0.10 USD per arch § 6.6.

    Validated against ``comunify_community_engagement_descriptor
    .cost_budget_per_workflow_run``.
    """
    from src.modules.comunify.copilot.module_registry_entry import (
        comunify_community_engagement_descriptor,
    )
    from src.modules.comunify.copilot.workflows.community_engagement_workflow import (
        build_community_engagement_workflow,
    )

    budget = comunify_community_engagement_descriptor.cost_budget_per_workflow_run
    assert budget == pytest.approx(0.10), f"Expected cost_budget_per_workflow_run=0.10 USD, got {budget}"

    workflow = build_community_engagement_workflow(
        checkpointer=memory_checkpointer,
        nurture_tool=nurture_tool_success_stub,
    )

    # Drive a full happy-path cycle: active → drift+nurture → re_engaged → active.
    await workflow.ainvoke(initial_state, config=thread_config)
    final_state = await workflow.ainvoke(
        {
            "current_step": "drift_detected",
            "member_response_text": "Acá ando, perdón por el silencio.",
        },
        config=thread_config,
    )

    accumulated = final_state["cost_accumulated_usd"]
    assert accumulated <= budget, f"Total cost {accumulated:.4f} USD exceeded budget {budget:.4f} USD"
    assert accumulated > 0, "Expected non-zero accumulated cost (nodes invoked stubs)"


# ---------------------------------------------------------------------------
# Tenant isolation — thread_id composes (tenant_id, subscriber_id)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_distinct_subscriber_ids_isolate_state(
    tenant_id: uuid.UUID,
    cohort_id: uuid.UUID,
    memory_checkpointer: Any,
    nurture_tool_success_stub: Any,
) -> None:
    """Two distinct subscriber_ids same tenant_id → state is isolated per
    composite ``f"{tenant_id}:{subscriber_id}"`` thread key.

    This validates the tenant_isolation invariant at the persistence
    boundary (D10 / arch § 6.4).
    """
    from src.modules.comunify.copilot.workflows.community_engagement_workflow import (
        build_community_engagement_workflow,
    )

    workflow = build_community_engagement_workflow(
        checkpointer=memory_checkpointer,
        nurture_tool=nurture_tool_success_stub,
    )

    sub_a = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
    sub_b = uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")

    config_a = {"configurable": {"thread_id": f"{tenant_id}:{sub_a}"}}
    config_b = {"configurable": {"thread_id": f"{tenant_id}:{sub_b}"}}

    state_a_init = {
        "tenant_id": tenant_id,
        "subscriber_id": sub_a,
        "cohort_id": cohort_id,
        "current_step": "active",
        "nurture_failed_count": 0,
        "vulnerability_disclosed": False,
        "creator_intervention_required": False,
        "cost_accumulated_usd": 0.0,
        "iterations": 0,
    }
    state_b_init = dict(state_a_init)
    state_b_init["subscriber_id"] = sub_b

    await workflow.ainvoke(state_a_init, config=config_a)
    await workflow.ainvoke(state_b_init, config=config_b)

    # Drive sub_a to drift_detected with vulnerability — escalation.
    await workflow.ainvoke(
        {
            "current_step": "drift_detected",
            "vulnerability_disclosed": True,
        },
        config=config_a,
    )
    # Drive sub_b to drift_detected with re-engagement — re_engaged.
    await workflow.ainvoke(
        {
            "current_step": "drift_detected",
            "member_response_text": "Acá ando!",
        },
        config=config_b,
    )

    # Snapshot each thread's state — they MUST diverge.
    snapshot_a = await workflow.aget_state(config_a)
    snapshot_b = await workflow.aget_state(config_b)

    # sub_a parks at escalated; sub_b loops re_engaged → active.
    assert snapshot_a.values["current_step"] == "escalated_to_creator_manual"
    assert snapshot_b.values["current_step"] in {"active", "re_engaged"}
    # Cross-subscriber state isolation invariant: subscriber_id NEVER bleeds.
    assert snapshot_a.values["subscriber_id"] == sub_a
    assert snapshot_b.values["subscriber_id"] == sub_b
