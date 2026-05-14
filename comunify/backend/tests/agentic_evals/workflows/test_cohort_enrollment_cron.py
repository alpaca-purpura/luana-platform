"""Workflow tests — CohortEnrollmentWorkflow cron handler integration.

Story 12 luana-comunify-bootstrap T-workflows-2 (R23 Opus 4.7 production
AGENTIC code).

Per 03-arch-agentic.md § 6.5 + 6.6:
  * `comunify.cohort_enrollment.payment_followup_24h` — +24h reminder tick
  * `comunify.cohort_enrollment.payment_followup_48h` — +48h urgent + retry CTA
  * `comunify.cohort_enrollment.dunning_retry_1` — +3d retry tick
  * `comunify.cohort_enrollment.dunning_retry_2` — +7d cumulative retry tick
  * `comunify.cohort_enrollment.dunning_suspend` — +14d cumulative suspend tick

Validates cron handler registration + descriptor cron rule contract +
happy-path tick + graceful-degradation paths.
"""

from __future__ import annotations

import functools
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
def memory_checkpointer():
    from langgraph.checkpoint.memory import MemorySaver

    return MemorySaver()


@pytest.fixture
def workflow_factory(qualify_tool_fit_stub: Any, book_discovery_tool_stub: Any, payment_retry_success_stub: Any):
    """Returns a workflow factory pre-bound to test stubs."""
    from src.modules.comunify.copilot.workflows.cohort_enrollment_workflow import (
        build_cohort_enrollment_workflow,
    )

    return functools.partial(
        build_cohort_enrollment_workflow,
        qualify_tool=qualify_tool_fit_stub,
        book_discovery_tool=book_discovery_tool_stub,
        payment_retry_tool=payment_retry_success_stub,
    )


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
    async def _stub(*, tenant_id: Any, lead_id: Any, subscription_id: Any | None, retry_attempt: int) -> dict[str, Any]:
        return {
            "success": True,
            "payment_intent_id": f"pi_retry_{retry_attempt}",
            "failure_reason": None,
            "cost_usd": 0.0,
        }

    return _stub


# ---------------------------------------------------------------------------
# Cron handler registration
# ---------------------------------------------------------------------------


def test_all_cron_handlers_registered_for_cohort_enrollment() -> None:
    """All 5 cohort enrollment cron handlers MUST register in the comunify
    local registry per 03-arch-agentic.md § 6.5.
    """
    # Import to trigger decorator-time registration.
    from src.modules.comunify.copilot.workflows.cron_handler import (
        get_registered_cron_handlers,
    )

    handlers = get_registered_cron_handlers()
    expected = {
        "comunify.cohort_enrollment.payment_followup_24h",
        "comunify.cohort_enrollment.payment_followup_48h",
        "comunify.cohort_enrollment.dunning_retry_1",
        "comunify.cohort_enrollment.dunning_retry_2",
        "comunify.cohort_enrollment.dunning_suspend",
    }
    missing = expected - set(handlers.keys())
    assert not missing, f"Missing cron handlers: {missing}"


# ---------------------------------------------------------------------------
# Descriptor cron rule contract
# ---------------------------------------------------------------------------


def test_module_descriptor_publishes_cohort_enrollment_cron_rules() -> None:
    """Comunify cohort enrollment descriptor MUST publish all 5 cron rules
    that match the registered handler names per arch § 6.6.
    """
    from src.modules.comunify.copilot.module_registry_entry import (
        comunify_cohort_enrollment_descriptor,
    )

    rules = comunify_cohort_enrollment_descriptor.cron_schedule_rules
    rule_milestones = {r.milestone for r in rules}
    expected = {
        "payment_followup_24h",
        "payment_followup_48h",
        "dunning_retry_1",
        "dunning_retry_2",
        "dunning_suspend",
    }
    assert rule_milestones == expected

    # Cost budget MUST be 0.20 per arch § 6.6
    assert comunify_cohort_enrollment_descriptor.cost_budget_per_workflow_run == pytest.approx(0.20)

    # Eligible niches MUST cover all 4 creator economy niches
    assert set(comunify_cohort_enrollment_descriptor.eligible_niches) == {
        "business_coaching",
        "health_creator",
        "course_creator",
        "content_creator",
    }


# ---------------------------------------------------------------------------
# Happy path cron tick — payment_followup_24h
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_payment_followup_24h_tick_advances_workflow(
    tenant_id: uuid.UUID,
    lead_id: uuid.UUID,
    cohort_id: uuid.UUID,
    memory_checkpointer: Any,
    workflow_factory: Any,
) -> None:
    """payment_followup_24h cron tick MUST invoke workflow with payment_pending
    state. Validates thread_id composition + workflow_factory injection.
    """
    from src.modules.comunify.copilot.workflows.cron_handler import (
        handle_cohort_enrollment_payment_followup_24h,
    )

    async def state_loader(t: uuid.UUID, l_id: uuid.UUID) -> dict[str, Any]:
        return {
            "tenant_id": t,
            "lead_id": l_id,
            "cohort_id": cohort_id,
            "current_step": "payment_pending",
            "qualification_fit": True,
            "terms_accepted": True,
            "payment_status": None,
            "payment_expired_retry_count": 0,
            "dunning_retry_count": 0,
            "cost_accumulated_usd": 0.0,
            "iterations": 0,
        }

    result = await handle_cohort_enrollment_payment_followup_24h(
        tenant_id=tenant_id,
        lead_id=lead_id,
        workflow_factory=workflow_factory,
        checkpointer=memory_checkpointer,
        state_loader=state_loader,
    )

    assert result is not None
    assert result.get("current_step") == "payment_pending"


# ---------------------------------------------------------------------------
# Happy path cron tick — dunning_retry_1
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_dunning_retry_1_tick_invokes_retry_tool(
    tenant_id: uuid.UUID,
    lead_id: uuid.UUID,
    cohort_id: uuid.UUID,
    memory_checkpointer: Any,
    workflow_factory: Any,
) -> None:
    """dunning_retry_1 cron tick MUST invoke workflow with dunning_retry_count=1
    so the dunning node fires the payment_retry_tool. Validates the cron
    handler correctly seeds tick_input.
    """
    from src.modules.comunify.copilot.workflows.cron_handler import (
        handle_cohort_enrollment_dunning_retry_1,
    )

    subscriber_id = uuid.UUID("44444444-4444-4444-4444-444444444444")

    async def state_loader(t: uuid.UUID, l_id: uuid.UUID) -> dict[str, Any]:
        return {
            "tenant_id": t,
            "lead_id": l_id,
            "cohort_id": cohort_id,
            "subscriber_id": subscriber_id,
            "current_step": "payment_failed_dunning",
            "dunning_state": "past_due",
            "dunning_retry_count": 0,
            "cost_accumulated_usd": 0.0,
            "iterations": 0,
        }

    result = await handle_cohort_enrollment_dunning_retry_1(
        tenant_id=tenant_id,
        lead_id=lead_id,
        workflow_factory=workflow_factory,
        checkpointer=memory_checkpointer,
        state_loader=state_loader,
    )

    # Retry success stub means recovery → enrolled
    assert result is not None
    assert result.get("current_step") == "enrolled"
    assert result.get("dunning_state") is None


# ---------------------------------------------------------------------------
# Graceful degradation — workflow factory raises
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_payment_followup_24h_returns_none_on_workflow_failure(
    tenant_id: uuid.UUID,
    lead_id: uuid.UUID,
    memory_checkpointer: Any,
) -> None:
    """Cron handler MUST return None (not raise) on workflow factory failure.

    Per tessl__graceful-degradation Rule 5 — transient failure does NOT crash
    the cron worker, log + return None for outbox retry.
    """
    from src.modules.comunify.copilot.workflows.cron_handler import (
        handle_cohort_enrollment_payment_followup_24h,
    )

    def exploding_factory(_checkpointer: Any) -> Any:
        raise RuntimeError("workflow factory simulated failure")

    result = await handle_cohort_enrollment_payment_followup_24h(
        tenant_id=tenant_id,
        lead_id=lead_id,
        workflow_factory=exploding_factory,
        checkpointer=memory_checkpointer,
        state_loader=None,
    )

    assert result is None


# ---------------------------------------------------------------------------
# Graceful degradation — state_loader raises
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_dunning_retry_2_returns_none_when_state_loader_raises(
    tenant_id: uuid.UUID,
    lead_id: uuid.UUID,
    memory_checkpointer: Any,
    workflow_factory: Any,
) -> None:
    """Cron handler MUST return None (not raise) when state_loader fails.

    Per tessl__graceful-degradation Rule 5.
    """
    from src.modules.comunify.copilot.workflows.cron_handler import (
        handle_cohort_enrollment_dunning_retry_2,
    )

    async def exploding_loader(t: uuid.UUID, l_id: uuid.UUID) -> dict[str, Any]:
        raise ConnectionError("redis simulated failure")

    result = await handle_cohort_enrollment_dunning_retry_2(
        tenant_id=tenant_id,
        lead_id=lead_id,
        workflow_factory=workflow_factory,
        checkpointer=memory_checkpointer,
        state_loader=exploding_loader,
    )

    assert result is None


# ---------------------------------------------------------------------------
# Suspend tick correctly transitions state
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_dunning_suspend_tick_sets_suspended_state(
    tenant_id: uuid.UUID,
    lead_id: uuid.UUID,
    cohort_id: uuid.UUID,
    memory_checkpointer: Any,
    workflow_factory: Any,
) -> None:
    """dunning_suspend cron tick MUST signal suspended state to the workflow."""
    from src.modules.comunify.copilot.workflows.cron_handler import (
        handle_cohort_enrollment_dunning_suspend,
    )

    async def state_loader(t: uuid.UUID, l_id: uuid.UUID) -> dict[str, Any]:
        return {
            "tenant_id": t,
            "lead_id": l_id,
            "cohort_id": cohort_id,
            "current_step": "payment_failed_dunning",
            "dunning_state": "retry_2_pending",
            "dunning_retry_count": 2,
            "cost_accumulated_usd": 0.0,
            "iterations": 0,
        }

    result = await handle_cohort_enrollment_dunning_suspend(
        tenant_id=tenant_id,
        lead_id=lead_id,
        workflow_factory=workflow_factory,
        checkpointer=memory_checkpointer,
        state_loader=state_loader,
    )

    assert result is not None
    assert result.get("dunning_state") == "suspended"
