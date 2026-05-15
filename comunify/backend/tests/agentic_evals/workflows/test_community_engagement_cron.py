"""Workflow tests — CommunityEngagementWorkflow cron tick handler.

Story 12 luana-comunify-bootstrap T-workflows-1 (R23 Opus 4.7 production
AGENTIC code).

TDD: validates the cron tick + state-loader contract from arch § 6.5.

Covers:
  - Cron handler registered in local registry under
    ``"comunify.community_engagement.drift_check"``
  - Tick fires the workflow with composite ``thread_id`` config
  - Optional ``state_loader`` callable seeds initial state correctly
  - Graceful degradation: workflow raise → tick handler returns ``None`` +
    logs warning (does NOT crash the worker per
    ``tessl__graceful-degradation`` Rule 5)
  - Module descriptor → cron rule (drift_check / 14d / 9am tenant TZ) is
    introspectable (consumed by T-deploy-1 scheduler config)
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
    return uuid.UUID("77777777-7777-7777-7777-777777777777")


@pytest.fixture
def subscriber_id() -> uuid.UUID:
    return uuid.UUID("88888888-8888-8888-8888-888888888888")


@pytest.fixture
def cohort_id() -> uuid.UUID:
    return uuid.UUID("99999999-9999-9999-9999-999999999999")


@pytest.fixture
def memory_checkpointer():
    from langgraph.checkpoint.memory import MemorySaver

    return MemorySaver()


@pytest.fixture
def nurture_tool_success_stub():
    """Stub nurture tool that always reports success."""

    async def _stub(
        *,
        tenant_id: Any,
        subscriber_id: Any,
        cohort_id: Any,
        member_response_text: str | None,
    ) -> dict[str, Any]:
        return {"success": True, "cost_usd": 0.009}

    return _stub


@pytest.fixture
def workflow_factory(nurture_tool_success_stub):
    """Factory binding the nurture tool stub to the workflow.

    Production wiring mirrors this shape — closure over the tool callable
    so the cron handler receives a single ``factory(checkpointer)`` callable.
    """
    from src.modules.comunify.copilot.workflows.community_engagement_workflow import (
        build_community_engagement_workflow,
    )

    def _factory(checkpointer: Any) -> Any:
        return build_community_engagement_workflow(
            checkpointer=checkpointer,
            nurture_tool=nurture_tool_success_stub,
        )

    return _factory


# ---------------------------------------------------------------------------
# Cron handler registration
# ---------------------------------------------------------------------------


def test_cron_handler_registered() -> None:
    """The drift_check handler MUST register in the local registry on import.

    Future lift-shared: when @luana/core/scheduling lands, this same
    registration discovery surface is what the shared cron worker reads.
    """
    # Import triggers @register_cron_handler decorator side-effect.
    from src.modules.comunify.copilot.workflows.cron_handler import (
        get_registered_cron_handlers,
        handle_community_engagement_drift_check,
    )

    handlers = get_registered_cron_handlers()
    assert "comunify.community_engagement.drift_check" in handlers, (
        f"Expected comunify.community_engagement.drift_check in registry, got {list(handlers.keys())}"
    )
    # Identity invariant — registry returns the actual decorated handler.
    assert handlers["comunify.community_engagement.drift_check"] is handle_community_engagement_drift_check


# ---------------------------------------------------------------------------
# Module descriptor → cron rule contract
# ---------------------------------------------------------------------------


def test_module_descriptor_publishes_drift_check_cron_rule() -> None:
    """Descriptor's ``cron_schedule_rules`` exposes the drift_check schedule
    that T-deploy-1 wires into the external scheduler.

    Validates: milestone='drift_check', offset_days=14, hour_local=9 per
    03-arch-agentic § 6.6.
    """
    from src.modules.comunify.copilot.module_registry_entry import (
        comunify_community_engagement_descriptor,
    )

    descriptor = comunify_community_engagement_descriptor
    assert descriptor.workflow_slug == "comunify.community_engagement"
    assert descriptor.workflow_class == "CommunityEngagementWorkflow"
    assert descriptor.eligible_tenants_filter == {"brand_slug": "comunify"}

    rules = descriptor.cron_schedule_rules
    assert len(rules) == 1
    drift_rule = rules[0]
    assert drift_rule.milestone == "drift_check"
    assert drift_rule.offset_days_since_last_activity == 14
    assert drift_rule.hour_local == 9
    # State persister target: D10 RedisSaver.
    assert descriptor.state_persister == "redis_saver"
    # Cost budget invariant.
    assert descriptor.cost_budget_per_workflow_run == pytest.approx(0.10)


# ---------------------------------------------------------------------------
# Tick handler — happy path
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_tick_handler_invokes_workflow_with_correct_thread_config(
    tenant_id: uuid.UUID,
    subscriber_id: uuid.UUID,
    cohort_id: uuid.UUID,
    memory_checkpointer: Any,
    workflow_factory,
) -> None:
    """Tick handler composes ``thread_id`` from (tenant_id, subscriber_id) +
    invokes workflow correctly.

    Validates: the workflow advances to drift_detected and returns a final
    state dict with the workflow's snapshot.
    """
    from src.modules.comunify.copilot.workflows.cron_handler import (
        handle_community_engagement_drift_check,
    )

    async def state_loader(t_id: uuid.UUID, s_id: uuid.UUID) -> dict[str, Any]:
        assert t_id == tenant_id
        assert s_id == subscriber_id
        return {
            "tenant_id": t_id,
            "subscriber_id": s_id,
            "cohort_id": cohort_id,
            "current_step": "active",
            "vulnerability_disclosed": False,
            "creator_intervention_required": False,
            "nurture_failed_count": 0,
            "cost_accumulated_usd": 0.0,
            "iterations": 0,
            "member_response_text": "Volví al grupo, gracias.",
        }

    result = await handle_community_engagement_drift_check(
        tenant_id=tenant_id,
        subscriber_id=subscriber_id,
        workflow_factory=workflow_factory,
        checkpointer=memory_checkpointer,
        state_loader=state_loader,
    )

    assert result is not None, "Tick handler should return final state dict"
    # Workflow processed the drift tick → re_engaged → active loop OR re_engaged.
    assert result["current_step"] in {"active", "re_engaged"}
    assert result["tenant_id"] == tenant_id
    assert result["subscriber_id"] == subscriber_id


@pytest.mark.asyncio
async def test_tick_handler_without_state_loader_resumes_from_checkpoint(
    tenant_id: uuid.UUID,
    subscriber_id: uuid.UUID,
    cohort_id: uuid.UUID,
    memory_checkpointer: Any,
    workflow_factory,
) -> None:
    """When ``state_loader is None``, handler resumes from existing checkpoint
    (the workflow's persistence layer carries prior state).

    Validates: first invocation seeds state via direct workflow.ainvoke;
    cron tick handler then advances without state_loader.
    """
    from src.modules.comunify.copilot.workflows.cron_handler import (
        handle_community_engagement_drift_check,
    )

    # Seed checkpoint via direct workflow invocation.
    initial_state = {
        "tenant_id": tenant_id,
        "subscriber_id": subscriber_id,
        "cohort_id": cohort_id,
        "current_step": "active",
        "vulnerability_disclosed": False,
        "creator_intervention_required": False,
        "nurture_failed_count": 0,
        "cost_accumulated_usd": 0.0,
        "iterations": 0,
        "member_response_text": None,
    }
    config = {"configurable": {"thread_id": f"{tenant_id}:{subscriber_id}"}}
    workflow_initial = workflow_factory(memory_checkpointer)
    await workflow_initial.ainvoke(initial_state, config=config)

    # Cron tick — no state_loader. Handler resumes from checkpoint.
    result = await handle_community_engagement_drift_check(
        tenant_id=tenant_id,
        subscriber_id=subscriber_id,
        workflow_factory=workflow_factory,
        checkpointer=memory_checkpointer,
        state_loader=None,
    )

    assert result is not None
    # No member_response_text + no escalation → nurture tool fires success.
    # Tool stub returns success=True so nurture_failed_count stays 0.
    # Then router decides "wait" (member_response_text not set yet) → END.
    assert result["current_step"] == "drift_detected"


# ---------------------------------------------------------------------------
# Tick handler — graceful degradation
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_tick_handler_returns_none_on_workflow_failure(
    tenant_id: uuid.UUID,
    subscriber_id: uuid.UUID,
    memory_checkpointer: Any,
) -> None:
    """Per ``tessl__graceful-degradation`` Rule 5: workflow raise → handler
    returns ``None`` + logs warning. Worker MUST NOT crash on a single
    failed tick.
    """
    from src.modules.comunify.copilot.workflows.cron_handler import (
        handle_community_engagement_drift_check,
    )

    def _broken_factory(_checkpointer: Any) -> Any:
        raise RuntimeError("simulated workflow build failure")

    result = await handle_community_engagement_drift_check(
        tenant_id=tenant_id,
        subscriber_id=subscriber_id,
        workflow_factory=_broken_factory,
        checkpointer=memory_checkpointer,
        state_loader=None,
    )

    assert result is None, (
        "Graceful-degradation contract: workflow failure → tick handler returns None for outbox retry"
    )


@pytest.mark.asyncio
async def test_tick_handler_returns_none_when_state_loader_raises(
    tenant_id: uuid.UUID,
    subscriber_id: uuid.UUID,
    memory_checkpointer: Any,
    workflow_factory,
) -> None:
    """State loader transient failure → same graceful-degradation contract."""
    from src.modules.comunify.copilot.workflows.cron_handler import (
        handle_community_engagement_drift_check,
    )

    async def _broken_state_loader(_t_id: uuid.UUID, _s_id: uuid.UUID) -> dict[str, Any]:
        raise ConnectionError("simulated DB unavailable")

    result = await handle_community_engagement_drift_check(
        tenant_id=tenant_id,
        subscriber_id=subscriber_id,
        workflow_factory=workflow_factory,
        checkpointer=memory_checkpointer,
        state_loader=_broken_state_loader,
    )

    assert result is None
