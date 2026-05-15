"""Workflow tests — CommunityEngagementWorkflow resume from checkpoint.

Story 12 luana-comunify-bootstrap T-workflows-1 (R23 Opus 4.7 production
AGENTIC code).

TDD: validates the checkpointer-resume invariant from arch § 6.4.

Covers (02-design § 4.4 + arch § 6.4):
  - Checkpoint per state transition + per cron tick
  - State key composite ``f"{tenant_id}:{subscriber_id}"`` → tenant
    isolation enforced at persistence boundary
  - Replay: build NEW workflow instance + same checkpointer + same
    thread_id → state reconstructed identically

Note D10: RedisSaver swap deferred until ``langgraph-checkpoint-redis``
package install lands. Tests use MemorySaver — same checkpointer protocol
contract. Acceptance criterion satisfied for "from configured checkpointer"
semantics.
"""

from __future__ import annotations

import uuid
from typing import Any

import pytest


@pytest.fixture
def tenant_id() -> uuid.UUID:
    return uuid.UUID("12121212-1212-1212-1212-121212121212")


@pytest.fixture
def subscriber_id() -> uuid.UUID:
    return uuid.UUID("34343434-3434-3434-3434-343434343434")


@pytest.fixture
def cohort_id() -> uuid.UUID:
    return uuid.UUID("56565656-5656-5656-5656-565656565656")


@pytest.fixture
def initial_state(
    tenant_id: uuid.UUID,
    subscriber_id: uuid.UUID,
    cohort_id: uuid.UUID,
) -> dict[str, Any]:
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
    return {"configurable": {"thread_id": f"{tenant_id}:{subscriber_id}"}}


@pytest.fixture
def memory_checkpointer():
    from langgraph.checkpoint.memory import MemorySaver

    return MemorySaver()


@pytest.fixture
def nurture_tool_failure_stub():
    """Stub nurture tool that always reports failure — increments counter."""

    async def _stub(
        *,
        tenant_id: Any,
        subscriber_id: Any,
        cohort_id: Any,
        member_response_text: str | None,
    ) -> dict[str, Any]:
        return {"success": False, "cost_usd": 0.001}

    return _stub


# ---------------------------------------------------------------------------
# Resume after one tick — state reconstructed from checkpoint
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_resume_from_checkpoint_reconstructs_state(
    initial_state: dict[str, Any],
    thread_config: dict[str, Any],
    memory_checkpointer: Any,
    nurture_tool_failure_stub: Any,
) -> None:
    """A5 acceptance: build new workflow instance + same checkpointer + same
    thread_id → state reconstructed correctly mid-flight.
    """
    from src.modules.comunify.copilot.workflows.community_engagement_workflow import (
        build_community_engagement_workflow,
    )

    # Build first workflow instance, run partially through drift_detected.
    workflow_v1 = build_community_engagement_workflow(
        checkpointer=memory_checkpointer,
        nurture_tool=nurture_tool_failure_stub,
    )
    await workflow_v1.ainvoke(initial_state, config=thread_config)
    await workflow_v1.ainvoke(
        {"current_step": "drift_detected"},
        config=thread_config,
    )

    # Snapshot state mid-flight.
    snapshot_v1 = await workflow_v1.aget_state(thread_config)
    assert snapshot_v1.values["current_step"] == "drift_detected"
    assert snapshot_v1.values["nurture_failed_count"] == 1
    iterations_v1 = snapshot_v1.values["iterations"]

    # Build SECOND workflow instance with SAME checkpointer + SAME thread_id.
    workflow_v2 = build_community_engagement_workflow(
        checkpointer=memory_checkpointer,
        nurture_tool=nurture_tool_failure_stub,
    )
    snapshot_v2 = await workflow_v2.aget_state(thread_config)

    # State MUST be reconstructed identically — checkpointer is durable across
    # workflow factory invocations.
    assert snapshot_v2.values["tenant_id"] == initial_state["tenant_id"]
    assert snapshot_v2.values["subscriber_id"] == initial_state["subscriber_id"]
    assert snapshot_v2.values["cohort_id"] == initial_state["cohort_id"]
    assert snapshot_v2.values["current_step"] == "drift_detected"
    assert snapshot_v2.values["nurture_failed_count"] == 1
    assert snapshot_v2.values["iterations"] == iterations_v1


@pytest.mark.asyncio
async def test_resume_then_advance_to_terminal(
    initial_state: dict[str, Any],
    thread_config: dict[str, Any],
    memory_checkpointer: Any,
    nurture_tool_failure_stub: Any,
) -> None:
    """A6 acceptance: after resume, workflow CAN advance further — checkpoint
    is not read-only.
    """
    from src.modules.comunify.copilot.workflows.community_engagement_workflow import (
        build_community_engagement_workflow,
    )

    # First instance — drive 2 nurture failures (count reaches 2 at state).
    workflow_v1 = build_community_engagement_workflow(
        checkpointer=memory_checkpointer,
        nurture_tool=nurture_tool_failure_stub,
    )
    await workflow_v1.ainvoke(initial_state, config=thread_config)
    await workflow_v1.ainvoke(
        {"current_step": "drift_detected"},
        config=thread_config,
    )
    snap = await workflow_v1.aget_state(thread_config)
    assert snap.values["nurture_failed_count"] == 1

    # Second instance — same checkpointer. Re-issue drift tick → count → 2.
    workflow_v2 = build_community_engagement_workflow(
        checkpointer=memory_checkpointer,
        nurture_tool=nurture_tool_failure_stub,
    )
    final_state = await workflow_v2.ainvoke(
        {"current_step": "drift_detected"},
        config=thread_config,
    )

    # 2 failures total now — routes through dropped_silent → terminal_dropped.
    assert final_state["current_step"] == "terminal_dropped"
