"""Cron handler — Comunify workflows tick entry points.

Story 12 luana-comunify-bootstrap T-workflows-1 (R23 Opus 4.7 production
AGENTIC code).

Per 02-design-agentic.md § 8.2 + 03-arch-agentic.md § 6.5.

Anti-duplication audit (per ``.claude/rules/anti-duplication.md``):
  * Searched: ``grep -rln "register_cron_handler|cron_worker"
    /home/chris/luana-platform/core/`` → empty.
  * VERDICT: NO existing cron primitive exists in @luana/core/scheduling at
    Story 12 ratification time. The arch doc § 6.5 describes
    ``from luana_core_scheduling.workers.cron_worker import register_cron_handler``
    as planned cement that has NOT yet been built.
  * Vitalia precedent at
    ``vitalia/backend/src/modules/vitalia/copilot/workflows/cron_handler.py``
    created the same LOCAL handler module + registry. Comunify mirrors that
    discipline — single ``register_cron_handler`` decorator + module-level
    registry; lift-shared candidate when N=3rd brand needs it.
  * DECISION (NO-NEW-LAYER + YAGNI): the comunify module REUSES the same
    decorator name and registry shape so future lift-shared is trivial.
    Cross-brand the two registries (vitalia, comunify) stay isolated until
    @luana/core lifts the primitive.

Cron tick semantics:
  * External scheduler (APScheduler / cron / k8s CronJob — wired in
    T-deploy-1) computes next_scheduled_at per (tenant_id, subscriber_id)
    via the workflow state loader and invokes
    ``handle_community_engagement_drift_check`` at the appropriate time.
  * Tick handler resumes the LangGraph workflow from saved checkpoint
    (RedisSaver in production per D10; MemorySaver for tests).
  * State key composite ``f"{tenant_id}:{subscriber_id}"`` per § 6.4.

Graceful degradation per ``tessl__graceful-degradation`` Rule 5:
  * Each tick wrapped in try/except + structlog warning. Single failed tick
    does NOT crash the worker; failure logged with full context for ops
    review (dependency / error / fallback).
  * Future: integrate with shared/domain_events/outbox for queued retry on
    transient failure (per 02-design § 8.2 fallback note).
"""

from __future__ import annotations

import uuid
from collections.abc import Awaitable, Callable
from typing import Any

import structlog

logger = structlog.get_logger()


# ════════════════════════════════════════════════════════════════════════════
# Local cron handler registry (lift-shared candidate per anti-duplication.md)
# ════════════════════════════════════════════════════════════════════════════

CronHandler = Callable[..., Awaitable[Any]]

_COMUNIFY_CRON_HANDLERS: dict[str, CronHandler] = {}


def register_cron_handler(name: str) -> Callable[[CronHandler], CronHandler]:
    """Decorator to register a cron handler in comunify local registry.

    Lift-shared deferred: when ``@luana/core/scheduling.cron_worker`` lands
    as cement primitive, replace this module-level decorator with the
    shared one — handler implementations stay identical, only the import
    changes.

    Parameters
    ----------
    name:
        Handler identifier (e.g. ``"comunify.community_engagement.drift_check"``).

    Returns
    -------
    Decorator preserving the wrapped async function.
    """

    def _decorator(fn: CronHandler) -> CronHandler:
        if name in _COMUNIFY_CRON_HANDLERS:
            logger.warning(
                "cron_handler_register_duplicate",
                name=name,
                prior_handler=_COMUNIFY_CRON_HANDLERS[name].__qualname__,
                new_handler=fn.__qualname__,
            )
        _COMUNIFY_CRON_HANDLERS[name] = fn
        logger.info("cron_handler_registered", name=name, handler=fn.__qualname__)
        return fn

    return _decorator


def get_registered_cron_handlers() -> dict[str, CronHandler]:
    """Return read-only view of registered handlers (for orchestrator
    integration tests + future shared-cron lift)."""
    return dict(_COMUNIFY_CRON_HANDLERS)


# ════════════════════════════════════════════════════════════════════════════
# CommunityEngagementWorkflow cron tick handler
# ════════════════════════════════════════════════════════════════════════════


@register_cron_handler("comunify.community_engagement.drift_check")
async def handle_community_engagement_drift_check(
    *,
    tenant_id: uuid.UUID,
    subscriber_id: uuid.UUID,
    workflow_factory: Callable[[Any], Any],
    checkpointer: Any,
    state_loader: Callable[[uuid.UUID, uuid.UUID], Awaitable[dict[str, Any] | None]] | None = None,
) -> dict[str, Any] | None:
    """Cron tick entry point — drift check 9am tenant TZ daily.

    Per 03-arch-agentic.md § 6.5: external scheduler ticks this handler at
    9am tenant local time for each subscriber whose
    ``no_activity_days >= 14``. Handler resumes the workflow from saved
    checkpoint and signals drift detection.

    Parameters
    ----------
    tenant_id:
        Tenant scope (required, isolated state key).
    subscriber_id:
        Workflow scope per-subscriber.
    workflow_factory:
        Callable returning compiled workflow given a checkpointer (typically
        ``build_community_engagement_workflow``). Production wiring binds
        the nurture tool callable via ``functools.partial`` before passing
        the factory in.
    checkpointer:
        Configured checkpointer instance (MemorySaver for tests,
        RedisSaver / AsyncPostgresSaver for production).
    state_loader:
        Optional async callable returning the state dict for a
        ``(tenant_id, subscriber_id)`` pair. If ``None``, the workflow
        resumes from its existing checkpoint without seeding extra state.

    Returns
    -------
    Final state dict from ``workflow.ainvoke(...)``, or ``None`` if
    graceful-degradation caught a transient failure.

    Per ``tessl__graceful-degradation`` Rule 5 + Rule 6:
      - Wrap full tick in try/except (transient failure → ``None`` +
        warning).
      - Log structured context for ops debugging.
      - Future: integrate with outbox for retry-with-backoff.
    """
    config = {"configurable": {"thread_id": f"{tenant_id}:{subscriber_id}"}}

    try:
        workflow = workflow_factory(checkpointer)

        # Compose tick input — workflow resumes from checkpoint, only
        # drift signal is freshly injected.
        tick_input: dict[str, Any] = {
            "tenant_id": tenant_id,
            "subscriber_id": subscriber_id,
            "current_step": "drift_detected",
        }

        if state_loader is not None:
            loaded = await state_loader(tenant_id, subscriber_id)
            if loaded:
                # Loaded state overrides tick_input EXCEPT for current_step
                # (we are explicitly signaling drift_detected this tick).
                merged: dict[str, Any] = dict(loaded)
                merged["current_step"] = "drift_detected"
                tick_input = merged

        result = await workflow.ainvoke(tick_input, config=config)
        logger.info(
            "community_engagement_tick_completed",
            tenant_id=str(tenant_id),
            subscriber_id=str(subscriber_id),
            current_step=result.get("current_step"),
            cost_accumulated_usd=result.get("cost_accumulated_usd"),
        )
        return result
    except Exception as exc:  # noqa: BLE001 — graceful-degradation per Rule 5
        logger.warning(
            "cron_handler_tick_failed",
            dependency="comunify.community_engagement.drift_check",
            tenant_id=str(tenant_id),
            subscriber_id=str(subscriber_id),
            err=str(exc),
            err_type=type(exc).__name__,
            fallback="returning_none_for_outbox_retry",
        )
        return None


# ════════════════════════════════════════════════════════════════════════════
# CohortEnrollmentWorkflow cron tick handlers (T-workflows-2)
# ════════════════════════════════════════════════════════════════════════════


async def _invoke_cohort_enrollment_tick(
    *,
    handler_name: str,
    tenant_id: uuid.UUID,
    lead_id: uuid.UUID,
    workflow_factory: Callable[[Any], Any],
    checkpointer: Any,
    tick_input: dict[str, Any],
    state_loader: Callable[[uuid.UUID, uuid.UUID], Awaitable[dict[str, Any] | None]] | None = None,
) -> dict[str, Any] | None:
    """Shared cron tick invocation helper for CohortEnrollmentWorkflow.

    All 5 cron tick handlers for cohort enrollment share the same resume
    pattern: load state (optionally), merge tick signals, invoke workflow,
    log result. Graceful-degradation wraps the full tick.

    Per `tessl__graceful-degradation` Rule 5 + Rule 6:
      - Wrap full tick in try/except (transient failure → ``None`` + warning)
      - Log structured context for ops debugging
      - Future: integrate with outbox for retry-with-backoff
    """
    config = {"configurable": {"thread_id": f"{tenant_id}:{lead_id}"}}

    try:
        workflow = workflow_factory(checkpointer)

        # Compose effective input — workflow resumes from checkpoint, tick
        # signals are freshly injected.
        effective_input: dict[str, Any] = {
            "tenant_id": tenant_id,
            "lead_id": lead_id,
            **tick_input,
        }

        if state_loader is not None:
            loaded = await state_loader(tenant_id, lead_id)
            if loaded:
                # Loaded state overrides EXCEPT for tick_input keys (tick
                # signals always take precedence over checkpointed state).
                merged: dict[str, Any] = dict(loaded)
                merged.update(effective_input)
                effective_input = merged

        result = await workflow.ainvoke(effective_input, config=config)
        logger.info(
            "cohort_enrollment_tick_completed",
            handler=handler_name,
            tenant_id=str(tenant_id),
            lead_id=str(lead_id),
            current_step=result.get("current_step"),
            cost_accumulated_usd=result.get("cost_accumulated_usd"),
            dunning_state=result.get("dunning_state"),
        )
        return result
    except Exception as exc:  # noqa: BLE001 — graceful-degradation per Rule 5
        logger.warning(
            "cron_handler_tick_failed",
            dependency=f"comunify.cohort_enrollment.{handler_name}",
            tenant_id=str(tenant_id),
            lead_id=str(lead_id),
            err=str(exc),
            err_type=type(exc).__name__,
            fallback="returning_none_for_outbox_retry",
        )
        return None


@register_cron_handler("comunify.cohort_enrollment.payment_followup_24h")
async def handle_cohort_enrollment_payment_followup_24h(
    *,
    tenant_id: uuid.UUID,
    lead_id: uuid.UUID,
    workflow_factory: Callable[[Any], Any],
    checkpointer: Any,
    state_loader: Callable[[uuid.UUID, uuid.UUID], Awaitable[dict[str, Any] | None]] | None = None,
) -> dict[str, Any] | None:
    """Cron tick — payment_followup_24h reminder (friendly reminder).

    Per 03-arch-agentic.md § 6.5 + descriptor cron_schedule_rules: external
    scheduler ticks this handler at +24h after payment_pending entered. The
    workflow re-invokes payment_pending node which logs the followup; the
    actual outbound message compose happens in the cron handler's external
    side-effect chain (deferred to T-eval-1 wiring).
    """
    return await _invoke_cohort_enrollment_tick(
        handler_name="payment_followup_24h",
        tenant_id=tenant_id,
        lead_id=lead_id,
        workflow_factory=workflow_factory,
        checkpointer=checkpointer,
        tick_input={"current_step": "payment_pending"},
        state_loader=state_loader,
    )


@register_cron_handler("comunify.cohort_enrollment.payment_followup_48h")
async def handle_cohort_enrollment_payment_followup_48h(
    *,
    tenant_id: uuid.UUID,
    lead_id: uuid.UUID,
    workflow_factory: Callable[[Any], Any],
    checkpointer: Any,
    state_loader: Callable[[uuid.UUID, uuid.UUID], Awaitable[dict[str, Any] | None]] | None = None,
) -> dict[str, Any] | None:
    """Cron tick — payment_followup_48h reminder (urgent + retry CTA).

    Per 03-arch-agentic.md § 6.5: at +48h, the workflow signals
    payment_status="expired_48h" so the workflow routes to payment_expired
    node — which then decides retry vs drop based on retry_count.
    """
    return await _invoke_cohort_enrollment_tick(
        handler_name="payment_followup_48h",
        tenant_id=tenant_id,
        lead_id=lead_id,
        workflow_factory=workflow_factory,
        checkpointer=checkpointer,
        tick_input={
            "current_step": "payment_pending",
            "payment_status": "expired_48h",
        },
        state_loader=state_loader,
    )


@register_cron_handler("comunify.cohort_enrollment.dunning_retry_1")
async def handle_cohort_enrollment_dunning_retry_1(
    *,
    tenant_id: uuid.UUID,
    lead_id: uuid.UUID,
    workflow_factory: Callable[[Any], Any],
    checkpointer: Any,
    state_loader: Callable[[uuid.UUID, uuid.UUID], Awaitable[dict[str, Any] | None]] | None = None,
) -> dict[str, Any] | None:
    """Cron tick — dunning_retry_1 (+3d from first failure, D19 cadence).

    Per 03-arch-agentic.md § 6.5 + 6.2 embedded DunningWorkflow: at +3d, the
    workflow re-invokes payment_failed_dunning node with retry_count=1 — the
    node invokes the payment_retry_tool. On success: dunning_state cleared,
    workflow exits to enrolled. On failure: dunning_state="retry_1_pending".
    """
    return await _invoke_cohort_enrollment_tick(
        handler_name="dunning_retry_1",
        tenant_id=tenant_id,
        lead_id=lead_id,
        workflow_factory=workflow_factory,
        checkpointer=checkpointer,
        tick_input={
            "current_step": "payment_failed_dunning",
            "dunning_retry_count": 1,
        },
        state_loader=state_loader,
    )


@register_cron_handler("comunify.cohort_enrollment.dunning_retry_2")
async def handle_cohort_enrollment_dunning_retry_2(
    *,
    tenant_id: uuid.UUID,
    lead_id: uuid.UUID,
    workflow_factory: Callable[[Any], Any],
    checkpointer: Any,
    state_loader: Callable[[uuid.UUID, uuid.UUID], Awaitable[dict[str, Any] | None]] | None = None,
) -> dict[str, Any] | None:
    """Cron tick — dunning_retry_2 (+7d cumulative from first failure).

    Same pattern as retry_1 but retry_count=2. On success: exit to enrolled.
    On failure: dunning_state="retry_2_pending" (next stop = +14d suspend).
    """
    return await _invoke_cohort_enrollment_tick(
        handler_name="dunning_retry_2",
        tenant_id=tenant_id,
        lead_id=lead_id,
        workflow_factory=workflow_factory,
        checkpointer=checkpointer,
        tick_input={
            "current_step": "payment_failed_dunning",
            "dunning_retry_count": 2,
        },
        state_loader=state_loader,
    )


@register_cron_handler("comunify.cohort_enrollment.dunning_suspend")
async def handle_cohort_enrollment_dunning_suspend(
    *,
    tenant_id: uuid.UUID,
    lead_id: uuid.UUID,
    workflow_factory: Callable[[Any], Any],
    checkpointer: Any,
    state_loader: Callable[[uuid.UUID, uuid.UUID], Awaitable[dict[str, Any] | None]] | None = None,
) -> dict[str, Any] | None:
    """Cron tick — dunning_suspend (+14d cumulative from first failure).

    Per 03-arch-agentic.md § 6.5: at +14d, dunning_state transitions to
    "suspended" — subscriber notified (deferred to channel adapter); after
    notification grace, subsequent tick can advance to "cancelled" → END.
    """
    return await _invoke_cohort_enrollment_tick(
        handler_name="dunning_suspend",
        tenant_id=tenant_id,
        lead_id=lead_id,
        workflow_factory=workflow_factory,
        checkpointer=checkpointer,
        tick_input={
            "current_step": "payment_failed_dunning",
            "dunning_state": "suspended",
        },
        state_loader=state_loader,
    )
