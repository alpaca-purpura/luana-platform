"""Workflow tests — CohortEnrollmentWorkflow resume from checkpoint.

Story 12 luana-comunify-bootstrap T-workflows-2 (R23 Opus 4.7 production
AGENTIC code).

Per 03-arch-agentic.md § 6.4 RedisSaver checkpointer (D10) — workflow MUST
survive process restart by reconstructing state from checkpoint. MemorySaver
emulates the persistence boundary for unit tests; RedisSaver swap is
transparent (CheckpointerProtocol structural).

Covers:
  - Resume reconstructs full state across separate workflow instances
  - Resume mid-dunning sub-state preserves dunning_state + retry_count
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


# ---------------------------------------------------------------------------
# R1: resume reconstructs state across separate workflow instances
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_resume_from_checkpoint_reconstructs_state(
    tenant_id: uuid.UUID,
    lead_id: uuid.UUID,
    cohort_id: uuid.UUID,
    thread_config: dict[str, Any],
    memory_checkpointer: Any,
    qualify_tool_fit_stub: Any,
    book_discovery_tool_stub: Any,
) -> None:
    """R1: a NEW workflow instance bound to the SAME checkpointer + thread_id
    sees the prior workflow's state on `aget_state`.

    This is the LangGraph-native resume contract — RedisSaver swap (D10) is
    transparent because CheckpointerProtocol is structural.
    """
    from src.modules.comunify.copilot.workflows.cohort_enrollment_workflow import (
        build_cohort_enrollment_workflow,
    )

    # Build first workflow instance
    workflow_v1 = build_cohort_enrollment_workflow(
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
        "terms_accepted": None,
        "payment_status": None,
        "payment_expired_retry_count": 0,
        "dunning_retry_count": 0,
        "cost_accumulated_usd": 0.0,
        "iterations": 0,
    }

    # Drive workflow_v1 to terms_presentation
    await workflow_v1.ainvoke(initial, config=thread_config)
    snapshot_v1 = await workflow_v1.aget_state(thread_config)
    assert snapshot_v1.values["qualification_fit"] is True

    # Build a DIFFERENT workflow instance bound to the SAME checkpointer
    workflow_v2 = build_cohort_enrollment_workflow(
        checkpointer=memory_checkpointer,
        qualify_tool=qualify_tool_fit_stub,
        book_discovery_tool=book_discovery_tool_stub,
    )

    # workflow_v2 sees workflow_v1's persisted state via the shared checkpointer
    snapshot_v2 = await workflow_v2.aget_state(thread_config)
    assert snapshot_v2.values["qualification_fit"] is True
    assert snapshot_v2.values["lead_id"] == lead_id


# ---------------------------------------------------------------------------
# R2: resume mid-dunning preserves embedded sub-state
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_resume_mid_dunning_preserves_substate(
    tenant_id: uuid.UUID,
    lead_id: uuid.UUID,
    cohort_id: uuid.UUID,
    subscriber_id: uuid.UUID,
    thread_config: dict[str, Any],
    memory_checkpointer: Any,
    qualify_tool_fit_stub: Any,
    book_discovery_tool_stub: Any,
) -> None:
    """R2: dunning_state ("retry_1_pending") + dunning_retry_count survives
    across workflow instance recreation.

    Validates embedded DunningWorkflow state persistence — critical because
    the cron retry cadence (3d/7d/14d) spans multiple worker reboots.
    """
    from src.modules.comunify.copilot.workflows.cohort_enrollment_workflow import (
        build_cohort_enrollment_workflow,
    )

    # Failing retry stub for first attempt
    async def fail_retry_stub(
        *, tenant_id: Any, lead_id: Any, subscription_id: Any | None, retry_attempt: int
    ) -> dict[str, Any]:
        return {
            "success": False,
            "payment_intent_id": None,
            "failure_reason": "insufficient_funds",
            "cost_usd": 0.0,
        }

    workflow_v1 = build_cohort_enrollment_workflow(
        checkpointer=memory_checkpointer,
        qualify_tool=qualify_tool_fit_stub,
        book_discovery_tool=book_discovery_tool_stub,
        payment_retry_tool=fail_retry_stub,
    )

    # Seed workflow_v1 to retry_1_pending state via dunning escalation
    seed = {
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
    await workflow_v1.ainvoke(seed, config=thread_config)
    await workflow_v1.ainvoke(
        {"current_step": "payment_failed_dunning", "dunning_retry_count": 1},
        config=thread_config,
    )

    snapshot_v1 = await workflow_v1.aget_state(thread_config)
    assert snapshot_v1.values["dunning_state"] == "retry_1_pending"

    # New workflow instance reads the SAME checkpoint
    async def success_retry_stub(
        *, tenant_id: Any, lead_id: Any, subscription_id: Any | None, retry_attempt: int
    ) -> dict[str, Any]:
        return {
            "success": True,
            "payment_intent_id": "pi_recovered",
            "failure_reason": None,
            "cost_usd": 0.0,
        }

    workflow_v2 = build_cohort_enrollment_workflow(
        checkpointer=memory_checkpointer,
        qualify_tool=qualify_tool_fit_stub,
        book_discovery_tool=book_discovery_tool_stub,
        payment_retry_tool=success_retry_stub,
    )

    # Resume from retry_1_pending — retry_2 succeeds → enrolled
    state = await workflow_v2.ainvoke(
        {"current_step": "payment_failed_dunning", "dunning_retry_count": 2},
        config=thread_config,
    )

    assert state["current_step"] == "enrolled"
    assert state["dunning_state"] is None
    assert state["payment_status"] == "succeeded"
    assert state["payment_intent_id"] == "pi_recovered"
