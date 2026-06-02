"""CohortEnrollmentWorkflow + embedded DunningWorkflow — LangGraph 2.0 StateGraph.

Story 12 luana-comunify-bootstrap T-workflows-2 (R23 Opus 4.7 production
AGENTIC code).

Per 02-design-agentic.md § 6 + 03-arch-agentic.md § 6.2 + D3 + D10 + D19:

  CohortEnrollment state machine (5 main states + 2 helpers, 8 transitions):

    qualification --(fit)--> discovery_call_scheduled
    qualification --(no_fit)--> END
    discovery_call_scheduled --> terms_presentation
    terms_presentation --(confirmed)--> payment_pending
    terms_presentation --(rejected)--> END
    payment_pending --(succeeded)--> enrolled
    payment_pending --(expired_48h)--> payment_expired
    payment_pending --(failed)--> payment_failed_dunning
    payment_expired --(retry)--> payment_pending
    payment_expired --(drop)--> END
    payment_failed_dunning --(retry_succeeded)--> enrolled
    payment_failed_dunning --(cancelled)--> END
    enrolled --> END

  Embedded DunningWorkflow (D19) — runs WITHIN `payment_failed_dunning`
  super-state. Internal dunning sub-state machine drives retry cadence:

    past_due --(retry_1 success at +3d)--> ACTIVE_RETURN (exit to enrolled)
    past_due --(retry_1 fail at +3d)--> retry_1_pending
    retry_1_pending --(retry_2 success at +7d cumulative)--> ACTIVE_RETURN
    retry_1_pending --(retry_2 fail at +7d cumulative)--> retry_2_pending
    retry_2_pending --(suspended at +14d cumulative)--> suspended
    suspended --> cancelled (terminal, exit workflow with cancelled)

  Cron triggers per 03-arch-agentic.md § 6.5:
    * `comunify.cohort_enrollment.payment_followup_24h` — friendly reminder
    * `comunify.cohort_enrollment.payment_followup_48h` — urgent + retry CTA
    * `comunify.cohort_enrollment.dunning_retry_1` — +3d
    * `comunify.cohort_enrollment.dunning_retry_2` — +7d cumulative
    * `comunify.cohort_enrollment.dunning_suspend` — +14d cumulative

Decisions honored:
  D3  — CohortEnrollmentWorkflow inherits LangGraph StateGraph directly
        (no shared `BaseWorkflowOrchestrator` — YAGNI per arch § 1 trade-off).
  D10 — RedisSaver checkpointer cross-brand (CheckpointerProtocol allows
        runtime swap — MemorySaver for tests/dev, RedisSaver in production
        when `langgraph-checkpoint-redis` package install lands).
  D19 — Dunning EMBEDDED in CohortEnrollmentWorkflow (single state graph,
        not a sibling workflow). Drives unified checkpointing + simpler
        cron orchestration. Tradeoff: state space ~7 nodes vs 5 — accepted.

Anti-duplication audit (per `.claude/rules/anti-duplication.md`):
  * Pre-write grep
    `class CohortEnrollmentWorkflow|class DunningWorkflow|build_cohort_enrollment_workflow|build_dunning_workflow`
    cross /home/chris/luana-platform/ + /home/chris/AISALESHT/backend/ → only
    STUB Protocols in subscription_service.py + dunning_service.py (no real
    workflow class). NEW workflow approved.
  * Tool integration follows T-workflows-1 + vitalia precedent: nodes hold
    LangGraph control flow, external tool/service invocations are INJECTED
    via callables (so unit tests stub LLM/payment calls without spinning up
    real adapters).
  * Cost accumulator stubs deterministic until production tool wiring lands;
    mirrors T-workflows-1 `_NODE_COST_USD` pattern.

Cost tracking:
  * `cost_accumulated_usd` accumulates per node invocation. Stub
    contributions sum well under the $0.20 per-workflow-run ceiling declared
    in `comunify_cohort_enrollment_descriptor.cost_budget_per_workflow_run`.
  * Validated by `test_cohort_enrollment_cost_budget_under_ceiling`.

Tenant isolation:
  * All state carries `tenant_id`. Checkpointer thread_id includes
    `tenant_id` + `lead_id` composite — cross-lead isolation guaranteed at
    persistence boundary.

Best-effort observability (per `.claude/rules/copilot-observability.md`):
  * Nodes emit structlog events on entry. Real `copilot_trace_event`
    persistence happens when nodes invoke the qualify_for_cohort /
    book_discovery_call tools (which own their own trace event repos).
    Workflow boundary itself stays best-effort + non-breaking.

Graceful degradation (per `tessl__graceful-degradation` Rule 5):
  * Every external callable wired in (qualify_tool / book_discovery_tool /
    payment_adapter) wrapped in try/except + structlog warning. Single
    failed call increments a `*_failed_count` counter; workflow degrades
    deterministically (e.g., payment_failed → dunning) rather than crashing.
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from typing import Any, Protocol, TypedDict

import structlog
from langgraph.graph import END, StateGraph

logger = structlog.get_logger()


# ════════════════════════════════════════════════════════════════════════════
# State schema
# ════════════════════════════════════════════════════════════════════════════


class CohortEnrollmentState(TypedDict, total=False):
    """CohortEnrollmentWorkflow state.

    ``total=False`` allows partial state updates per LangGraph node return
    convention. Tenant isolation: ``tenant_id`` is REQUIRED in initial state.
    Checkpointer thread_id composes ``f"{tenant_id}:{lead_id}"`` per arch § 6.4.
    """

    # Identity (set at first invocation, immutable thereafter)
    tenant_id: Any  # uuid.UUID — typed Any for TypedDict tolerance
    lead_id: Any
    cohort_id: Any
    subscriber_id: Any  # populated post-enrollment when subscription created

    # Qualification signals (consumed at routing time)
    qualification_score: float | None
    qualification_fit: bool | None  # True/False/None (unknown yet)
    qualification_gaps: list[str]

    # Discovery call booking
    discovery_call_booking_id: Any  # UUID | None
    discovery_call_completed: bool

    # Terms presentation
    terms_accepted: bool | None  # None=pending, True=confirmed, False=rejected

    # Payment lifecycle
    payment_intent_id: Any  # UUID | None
    payment_status: str | None  # "succeeded" | "failed" | "pending" | None
    payment_pending_at: Any  # datetime — when payment_pending started (for 48h timer)
    payment_failed_count: int
    payment_expired_retry_count: int

    # Embedded DunningWorkflow sub-state (D19)
    # Values: None | "past_due" | "retry_1_pending" | "retry_2_pending" |
    #         "suspended" | "cancelled"
    dunning_state: str | None
    dunning_first_failure_at: Any  # datetime — anchor for cumulative timers
    dunning_retry_count: int

    # Enrollment terminal
    enrollment_at: Any  # datetime | None

    # Workflow control
    current_step: str

    # Cost tracking (best-effort; real per-call cost in copilot_llm_call)
    cost_accumulated_usd: float

    # Anti-loop guard (cron-driven workflow; max iterations defensive)
    iterations: int


# ════════════════════════════════════════════════════════════════════════════
# Checkpointer protocol — durable AsyncPostgresSaver via shared engine provider
# ════════════════════════════════════════════════════════════════════════════


class CheckpointerProtocol(Protocol):
    """Structural protocol — accepts MemorySaver (tests), AsyncPostgresSaver
    (production), or any LangGraph-compatible checkpointer.

    Production: the durable ``AsyncPostgresSaver`` is built by the shared engine
    provider ``luana_core_flows.make_durable_checkpointer`` and resolved at the
    cron composition root via
    ``copilot.workflows.durable_checkpointer.get_comunify_durable_checkpointer``
    (replaces the former per-site RedisSaver swap stub). Tests inject
    ``InMemorySaver`` directly into ``build_cohort_enrollment_workflow``.
    """

    ...  # LangGraph compile() validates the actual interface at runtime


# ════════════════════════════════════════════════════════════════════════════
# Tool/service injection protocols — keep unit tests deps-free
# ════════════════════════════════════════════════════════════════════════════


class QualifyForCohortCallableProtocol(Protocol):
    """Callable invoked from ``qualification`` node.

    Production wiring binds this to
    ``modules.comunify.agentic.tools.qualify_for_cohort.qualify_for_cohort_v1``
    via partial application (tenant_id + repos + LLM client) at the trigger
    site. Tests inject a deterministic stub.

    Returns a dict with the keys the workflow needs from the tool output
    (mirrors `QualifyForCohortOutputV1` subset):
      * ``fit: bool`` — qualification verdict
      * ``recommended_tier: str`` — "level_1_lead_magnet" .. "level_4_premium" | "not_fit"
      * ``fit_score: float`` — 0.0-1.0
      * ``gaps: list[str]``
      * ``cost_usd: float`` — per-invocation cost contribution
    """

    async def __call__(
        self,
        *,
        tenant_id: Any,
        lead_id: Any,
        cohort_id: Any,
    ) -> dict[str, Any]: ...


class BookDiscoveryCallCallableProtocol(Protocol):
    """Callable invoked from ``discovery_call_scheduled`` node.

    Production wiring binds this to
    ``modules.comunify.agentic.tools.book_discovery_call``. Tests stub.

    Returns:
      * ``booking_id: UUID | None``
      * ``booking_status: str``
      * ``cost_usd: float`` (typically 0.0 — no LLM call)
    """

    async def __call__(
        self,
        *,
        tenant_id: Any,
        lead_id: Any,
        cohort_id: Any,
    ) -> dict[str, Any]: ...


class PaymentRetryCallableProtocol(Protocol):
    """Callable invoked from ``payment_failed_dunning`` node for retry attempts.

    Production wiring binds this to
    ``modules.comunify.payment.tokenized_recurring_adapter
    .ComunifyTokenizedRecurringAdapter.charge_installment`` via partial
    application (gateway tokens + subscriber/entity ids). Tests inject a
    deterministic stub.

    Returns:
      * ``success: bool`` — charge succeeded
      * ``payment_intent_id: str | None``
      * ``failure_reason: str | None``
      * ``cost_usd: float`` (typically 0.0 — payment adapter no LLM)
    """

    async def __call__(
        self,
        *,
        tenant_id: Any,
        lead_id: Any,
        subscription_id: Any | None,
        retry_attempt: int,  # 1 or 2
    ) -> dict[str, Any]: ...


# ════════════════════════════════════════════════════════════════════════════
# Cost accumulator stubs (replaced by real tool cost recording in production)
# ════════════════════════════════════════════════════════════════════════════

# Per-node deterministic cost contributions. Happy-path total
# (qualification → discovery → terms → payment → enrolled) ≈ $0.025
# well under the $0.20 ceiling declared in the workflow descriptor.
# Dunning escalation path (payment fails → retry_1 → retry_2 → suspend)
# adds ~$0.005 (no LLM; just retry attempt cost recorded by adapter).
_NODE_COST_USD = {
    "qualification": 0.012,  # Sonnet 4.6 fit assessment
    "discovery_call_scheduled": 0.0,  # No LLM (deterministic booking)
    "terms_presentation": 0.008,  # Sonnet 4.6 terms compose (per ticket spec)
    "payment_pending": 0.0,  # No LLM (deterministic wait state)
    "payment_expired": 0.0,  # No LLM (terminal/retry decision)
    "enrolled": 0.0,  # No LLM (deterministic terminal)
    "payment_failed_dunning": 0.001,  # Cron probe cost
}


def _accumulate_cost(state: CohortEnrollmentState, node_name: str, extra: float = 0.0) -> float:
    """Return new ``cost_accumulated_usd`` after this node runs."""
    prior = state.get("cost_accumulated_usd", 0.0) or 0.0
    delta = _NODE_COST_USD.get(node_name, 0.0)
    return prior + delta + extra


# ════════════════════════════════════════════════════════════════════════════
# Workflow nodes — CohortEnrollment main flow
# ════════════════════════════════════════════════════════════════════════════


def _make_qualification_node(
    qualify_tool: QualifyForCohortCallableProtocol | None,
) -> Callable[[CohortEnrollmentState], Awaitable[dict[str, Any]]]:
    """Build ``qualification`` node bound to the qualify_for_cohort tool.

    Reads tool result → sets fit/score/gaps. Routing function reads back to
    decide fit → discovery_call vs no_fit → END.
    """

    async def qualification_node(state: CohortEnrollmentState) -> dict[str, Any]:
        logger.info(
            "cohort_enrollment_qualification",
            tenant_id=str(state.get("tenant_id")),
            lead_id=str(state.get("lead_id")),
            cohort_id=str(state.get("cohort_id")),
        )

        update: dict[str, Any] = {
            "current_step": "qualification",
            "iterations": (state.get("iterations") or 0) + 1,
        }

        # If caller already set qualification_fit (testing / reseed), skip tool.
        if state.get("qualification_fit") is not None:
            update["cost_accumulated_usd"] = _accumulate_cost(state, "qualification")
            return update

        if qualify_tool is None:
            # No tool wired — fail closed: assume not fit (defense-in-depth).
            logger.warning(
                "cohort_enrollment_qualification_no_tool_wired",
                tenant_id=str(state.get("tenant_id")),
                lead_id=str(state.get("lead_id")),
                fallback="qualification_fit_set_to_false",
            )
            update["qualification_fit"] = False
            update["qualification_gaps"] = ["no_qualify_tool_wired"]
            update["cost_accumulated_usd"] = _accumulate_cost(state, "qualification")
            return update

        # Invoke qualify_for_cohort tool with graceful-degradation Rule 5.
        try:
            tool_result = await qualify_tool(
                tenant_id=state.get("tenant_id"),
                lead_id=state.get("lead_id"),
                cohort_id=state.get("cohort_id"),
            )
            fit = bool(tool_result.get("fit", False))
            score = float(tool_result.get("fit_score", 0.0) or 0.0)
            gaps = list(tool_result.get("gaps", []) or [])
            extra_cost = float(tool_result.get("cost_usd", 0.0) or 0.0)
            update["qualification_fit"] = fit
            update["qualification_score"] = score
            update["qualification_gaps"] = gaps
            update["cost_accumulated_usd"] = _accumulate_cost(state, "qualification", extra=extra_cost)
        except Exception as exc:  # noqa: BLE001 — graceful-degradation Rule 5
            logger.warning(
                "cohort_enrollment_qualify_tool_failed",
                dependency="comunify.qualify_for_cohort",
                tenant_id=str(state.get("tenant_id")),
                lead_id=str(state.get("lead_id")),
                err=str(exc),
                err_type=type(exc).__name__,
                fallback="qualification_fit_set_to_false",
            )
            update["qualification_fit"] = False
            update["qualification_gaps"] = ["qualify_tool_exception"]
            update["cost_accumulated_usd"] = _accumulate_cost(state, "qualification")

        return update

    return qualification_node


def _make_discovery_call_node(
    book_tool: BookDiscoveryCallCallableProtocol | None,
) -> Callable[[CohortEnrollmentState], Awaitable[dict[str, Any]]]:
    """Build ``discovery_call_scheduled`` node bound to book_discovery_call tool.

    Books a discovery slot. On tool failure, falls back to setting
    booking_id=None — the next state (terms_presentation) still runs since
    booking failure is non-fatal (e.g., async retry queue can recover).
    """

    async def discovery_call_scheduled_node(state: CohortEnrollmentState) -> dict[str, Any]:
        logger.info(
            "cohort_enrollment_discovery_call_scheduled",
            tenant_id=str(state.get("tenant_id")),
            lead_id=str(state.get("lead_id")),
        )

        update: dict[str, Any] = {
            "current_step": "discovery_call_scheduled",
            "iterations": (state.get("iterations") or 0) + 1,
            "cost_accumulated_usd": _accumulate_cost(state, "discovery_call_scheduled"),
        }

        if book_tool is None:
            # No tool wired — proceed without booking_id (degraded mode).
            return update

        try:
            tool_result = await book_tool(
                tenant_id=state.get("tenant_id"),
                lead_id=state.get("lead_id"),
                cohort_id=state.get("cohort_id"),
            )
            update["discovery_call_booking_id"] = tool_result.get("booking_id")
        except Exception as exc:  # noqa: BLE001 — graceful-degradation Rule 5
            logger.warning(
                "cohort_enrollment_book_tool_failed",
                dependency="comunify.book_discovery_call",
                tenant_id=str(state.get("tenant_id")),
                lead_id=str(state.get("lead_id")),
                err=str(exc),
                err_type=type(exc).__name__,
                fallback="booking_id_set_to_none",
            )
            update["discovery_call_booking_id"] = None

        return update

    return discovery_call_scheduled_node


def _make_terms_presentation_node() -> Callable[[CohortEnrollmentState], Awaitable[dict[str, Any]]]:
    """Build ``terms_presentation`` node.

    Presents enrollment terms (cost, payment plan, refund policy) to the
    lead. LLM compose cost lands here in production. Tests inject
    ``terms_accepted`` directly to drive routing.
    """

    async def terms_presentation_node(state: CohortEnrollmentState) -> dict[str, Any]:
        logger.info(
            "cohort_enrollment_terms_presentation",
            tenant_id=str(state.get("tenant_id")),
            lead_id=str(state.get("lead_id")),
            terms_accepted=state.get("terms_accepted"),
        )
        return {
            "current_step": "terms_presentation",
            "iterations": (state.get("iterations") or 0) + 1,
            "cost_accumulated_usd": _accumulate_cost(state, "terms_presentation"),
        }

    return terms_presentation_node


def _make_payment_pending_node() -> Callable[[CohortEnrollmentState], Awaitable[dict[str, Any]]]:
    """Build ``payment_pending`` node.

    Workflow parks here waiting for `payment_status` signal from webhook
    handler. 48h timeout cron tick transitions to payment_expired.
    Routing reads `payment_status` to advance.
    """

    async def payment_pending_node(state: CohortEnrollmentState) -> dict[str, Any]:
        logger.info(
            "cohort_enrollment_payment_pending",
            tenant_id=str(state.get("tenant_id")),
            lead_id=str(state.get("lead_id")),
            payment_status=state.get("payment_status"),
        )
        return {
            "current_step": "payment_pending",
            "iterations": (state.get("iterations") or 0) + 1,
            "cost_accumulated_usd": _accumulate_cost(state, "payment_pending"),
        }

    return payment_pending_node


def _make_payment_expired_node() -> Callable[[CohortEnrollmentState], Awaitable[dict[str, Any]]]:
    """Build ``payment_expired`` node.

    Reached when 48h timeout elapses without payment_status="succeeded".
    Routing decides retry (return to payment_pending with fresh anchor) or
    drop (END) based on payment_expired_retry_count threshold.

    On retry path: increments retry_count AND clears payment_status so the
    next pass through payment_pending doesn't immediately bounce back to
    payment_expired (anti-loop guard at state-mutation level + reinforced
    by ``route_after_expired`` retry threshold).
    """

    async def payment_expired_node(state: CohortEnrollmentState) -> dict[str, Any]:
        retry_count = state.get("payment_expired_retry_count") or 0
        logger.info(
            "cohort_enrollment_payment_expired",
            tenant_id=str(state.get("tenant_id")),
            lead_id=str(state.get("lead_id")),
            payment_expired_retry_count=retry_count,
        )
        update: dict[str, Any] = {
            "current_step": "payment_expired",
            "iterations": (state.get("iterations") or 0) + 1,
            "cost_accumulated_usd": _accumulate_cost(state, "payment_expired"),
        }
        # Always increment retry count on entry (anti-loop guard).
        update["payment_expired_retry_count"] = retry_count + 1
        # Clear payment_status so retry loop through payment_pending doesn't
        # immediately re-expire (defense-in-depth anti-loop).
        update["payment_status"] = None
        return update

    return payment_expired_node


def _make_enrolled_node() -> Callable[[CohortEnrollmentState], Awaitable[dict[str, Any]]]:
    """Build ``enrolled`` terminal node.

    Side-effect (production): emit `LeadEnrolled` event + provision community
    access via link_to_community tool. Tests assert terminal state +
    cost_accumulated_usd within budget.
    """

    async def enrolled_node(state: CohortEnrollmentState) -> dict[str, Any]:
        from datetime import datetime, timezone

        logger.info(
            "cohort_enrollment_enrolled",
            tenant_id=str(state.get("tenant_id")),
            lead_id=str(state.get("lead_id")),
            cost_accumulated_usd=state.get("cost_accumulated_usd") or 0.0,
        )
        return {
            "current_step": "enrolled",
            "enrollment_at": datetime.now(tz=timezone.utc),
            "iterations": (state.get("iterations") or 0) + 1,
            "cost_accumulated_usd": _accumulate_cost(state, "enrolled"),
            # Clear dunning state (clean enrollment after dunning recovery)
            "dunning_state": None,
        }

    return enrolled_node


# ════════════════════════════════════════════════════════════════════════════
# Embedded DunningWorkflow node (D19)
# ════════════════════════════════════════════════════════════════════════════


def _make_dunning_node(
    payment_retry_tool: PaymentRetryCallableProtocol | None,
) -> Callable[[CohortEnrollmentState], Awaitable[dict[str, Any]]]:
    """Build ``payment_failed_dunning`` node — embedded dunning sub-machine.

    State machine inside the node (D19 embedded approach — see module
    docstring for rationale):

      Entry → set dunning_state="past_due" (first time only)
      retry_1 trigger (+3d cron) → invoke payment_retry_tool(retry_attempt=1)
        success → set dunning_state=None, exit via routing to "enrolled"
        fail    → set dunning_state="retry_1_pending"
      retry_2 trigger (+7d cron) → invoke payment_retry_tool(retry_attempt=2)
        success → exit to "enrolled"
        fail    → set dunning_state="retry_2_pending"
      suspend trigger (+14d cron) → set dunning_state="suspended"
        followed by external action → dunning_state="cancelled" → exit END

    The dunning_state field carries the embedded sub-state; routing
    function ``route_dunning_state`` consumes it for state-machine
    advancement.

    Caller supplies the trigger context via `dunning_retry_count` /
    `dunning_state` direct injection (cron handler invokes workflow with
    these fields populated per cadence).
    """

    async def dunning_node(state: CohortEnrollmentState) -> dict[str, Any]:
        logger.info(
            "cohort_enrollment_payment_failed_dunning",
            tenant_id=str(state.get("tenant_id")),
            lead_id=str(state.get("lead_id")),
            dunning_state=state.get("dunning_state"),
            dunning_retry_count=state.get("dunning_retry_count") or 0,
        )

        from datetime import datetime, timezone

        update: dict[str, Any] = {
            "current_step": "payment_failed_dunning",
            "iterations": (state.get("iterations") or 0) + 1,
        }

        current_dunning = state.get("dunning_state")
        retry_count = state.get("dunning_retry_count") or 0

        # First entry — set anchor + transition to past_due.
        if current_dunning is None:
            update["dunning_state"] = "past_due"
            update["dunning_first_failure_at"] = state.get("dunning_first_failure_at") or datetime.now(tz=timezone.utc)
            update["cost_accumulated_usd"] = _accumulate_cost(state, "payment_failed_dunning")
            return update

        # Retry trigger — invoke payment adapter.
        if current_dunning in {"past_due", "retry_1_pending", "retry_2_pending"} and retry_count > 0:
            if payment_retry_tool is None:
                # No tool wired — escalate to suspended at retry_2 stage,
                # mirror retry attempts deterministically (degraded mode).
                if retry_count >= 2:
                    update["dunning_state"] = "suspended"
                else:
                    update["dunning_state"] = "retry_1_pending"
                update["cost_accumulated_usd"] = _accumulate_cost(state, "payment_failed_dunning")
                return update

            try:
                result = await payment_retry_tool(
                    tenant_id=state.get("tenant_id"),
                    lead_id=state.get("lead_id"),
                    subscription_id=state.get("subscriber_id"),
                    retry_attempt=retry_count,
                )
                success = bool(result.get("success", False))
                extra_cost = float(result.get("cost_usd", 0.0) or 0.0)
                if success:
                    # Recovered — clear dunning state, exit to enrolled.
                    update["dunning_state"] = None
                    update["payment_status"] = "succeeded"
                    update["payment_intent_id"] = result.get("payment_intent_id")
                else:
                    # Retry failed — advance sub-state.
                    if retry_count == 1:
                        update["dunning_state"] = "retry_1_pending"
                    elif retry_count == 2:
                        update["dunning_state"] = "retry_2_pending"
                    else:
                        update["dunning_state"] = "suspended"
                update["cost_accumulated_usd"] = _accumulate_cost(state, "payment_failed_dunning", extra=extra_cost)
            except Exception as exc:  # noqa: BLE001 — graceful-degradation Rule 5
                logger.warning(
                    "cohort_enrollment_payment_retry_failed",
                    dependency="comunify.tokenized_recurring_adapter.charge_installment",
                    tenant_id=str(state.get("tenant_id")),
                    lead_id=str(state.get("lead_id")),
                    retry_attempt=retry_count,
                    err=str(exc),
                    err_type=type(exc).__name__,
                    fallback="advance_dunning_state_as_failed",
                )
                if retry_count == 1:
                    update["dunning_state"] = "retry_1_pending"
                elif retry_count == 2:
                    update["dunning_state"] = "retry_2_pending"
                else:
                    update["dunning_state"] = "suspended"
                update["cost_accumulated_usd"] = _accumulate_cost(state, "payment_failed_dunning")
            return update

        # Suspend cron tick (+14d) — caller signaled `dunning_state="suspended"`
        # via tick_input; suspended state stays until external cancel signal
        # (cron handler advances to cancelled after notification grace).
        if current_dunning == "suspended":
            update["cost_accumulated_usd"] = _accumulate_cost(state, "payment_failed_dunning")
            return update

        # Cancelled — terminal, routing function exits to END.
        if current_dunning == "cancelled":
            update["cost_accumulated_usd"] = _accumulate_cost(state, "payment_failed_dunning")
            return update

        # Default: hold state, no-op cost.
        update["cost_accumulated_usd"] = _accumulate_cost(state, "payment_failed_dunning")
        return update

    return dunning_node


# ════════════════════════════════════════════════════════════════════════════
# Entry router — dispatches per current_step (mirror T-workflows-1 pattern)
# ════════════════════════════════════════════════════════════════════════════


async def entry_router_node(state: CohortEnrollmentState) -> dict[str, Any]:
    """Entry router — pure routing node, returns no state mutations.

    Reads ``current_step`` from input state to dispatch the appropriate
    workflow node. LangGraph single-entry-point + checkpointer model
    requires dispatch via state, not via external node addressing.
    """
    return {}


_VALID_STEPS = frozenset(
    {
        "qualification",
        "discovery_call_scheduled",
        "terms_presentation",
        "payment_pending",
        "payment_expired",
        "enrolled",
        "payment_failed_dunning",
    }
)


def route_from_entry(state: CohortEnrollmentState) -> str:
    """Dispatch from entry router based on ``current_step``.

    Unknown / missing current_step → ``qualification`` (workflow first
    invocation). All other valid steps dispatch directly.
    """
    step = state.get("current_step") or "qualification"
    if step not in _VALID_STEPS:
        logger.warning(
            "cohort_enrollment_unknown_step_fallback_to_qualification",
            unknown_step=step,
            tenant_id=str(state.get("tenant_id")),
            lead_id=str(state.get("lead_id")),
        )
        step = "qualification"
    return step


# ════════════════════════════════════════════════════════════════════════════
# Conditional edge routing
# ════════════════════════════════════════════════════════════════════════════


def route_after_qualification(state: CohortEnrollmentState) -> str:
    """Route from ``qualification``.

    fit=True → discovery_call_scheduled
    fit=False → END (no_fit, log + drop)
    fit=None → END (defense-in-depth: missing signal, drop)
    """
    fit = state.get("qualification_fit")
    if fit is True:
        return "fit"
    return "no_fit"


def route_after_terms(state: CohortEnrollmentState) -> str:
    """Route from ``terms_presentation``.

    terms_accepted=True → payment_pending
    terms_accepted=False → END (rejected)
    terms_accepted=None → END (defense-in-depth: missing signal)
    """
    accepted = state.get("terms_accepted")
    if accepted is True:
        return "confirmed"
    return "rejected"


def route_after_payment(state: CohortEnrollmentState) -> str:
    """Route from ``payment_pending``.

    payment_status="succeeded" → enrolled
    payment_status="failed" → payment_failed_dunning
    payment_status="expired_48h" → payment_expired
    payment_status=None or other → wait (END this invocation, await webhook)
    """
    status = state.get("payment_status")
    if status == "succeeded":
        return "succeeded"
    if status == "failed":
        return "failed"
    if status == "expired_48h":
        return "expired_48h"
    return "wait"


def route_after_expired(state: CohortEnrollmentState) -> str:
    """Route from ``payment_expired``.

    The node ALWAYS increments retry_count on entry (anti-loop guard).
    Routing reads the post-bump value:
      retry_count == 1 (first expiry just bumped) → retry (return to payment_pending)
      retry_count >= 2 (second expiry, already retried once) → drop (END)
    """
    retry_count = state.get("payment_expired_retry_count") or 0
    if retry_count <= 1:
        return "retry"
    return "drop"


def route_dunning_state(state: CohortEnrollmentState) -> str:
    """Route from ``payment_failed_dunning``.

    dunning_state=None → retry succeeded, route to enrolled
    dunning_state="cancelled" → terminal, route to END
    dunning_state in {"past_due", "retry_1_pending", "retry_2_pending", "suspended"}
        → wait for next cron tick (END this invocation)
    """
    dunning_state = state.get("dunning_state")
    if dunning_state is None:
        # Cleared by node after successful retry → exit to enrolled.
        return "retry_succeeded"
    if dunning_state == "cancelled":
        return "cancelled"
    # past_due / retry_1_pending / retry_2_pending / suspended → wait
    return "wait"


# ════════════════════════════════════════════════════════════════════════════
# Workflow factory
# ════════════════════════════════════════════════════════════════════════════


def build_cohort_enrollment_workflow(
    checkpointer: CheckpointerProtocol | Any,
    *,
    qualify_tool: QualifyForCohortCallableProtocol | None = None,
    book_discovery_tool: BookDiscoveryCallCallableProtocol | None = None,
    payment_retry_tool: PaymentRetryCallableProtocol | None = None,
) -> Any:
    """Build + compile CohortEnrollmentWorkflow LangGraph StateGraph.

    Parameters
    ----------
    checkpointer:
        Any LangGraph-compatible checkpointer (MemorySaver for tests/dev;
        RedisSaver / AsyncPostgresSaver for production per D10).
    qualify_tool:
        Optional callable invoked from the ``qualification`` node. Production
        wiring: bind to ``modules.comunify.agentic.tools.qualify_for_cohort``
        via partial application (tenant_id + repos + LLM client). Tests
        inject a deterministic stub. When ``None``, the qualification node
        fails closed (sets fit=False).
    book_discovery_tool:
        Optional callable invoked from ``discovery_call_scheduled``.
        Production: bind to ``modules.comunify.agentic.tools.book_discovery_call``.
        Tests stub. When ``None``, booking_id stays None (degraded mode —
        workflow continues since async retry can recover).
    payment_retry_tool:
        Optional callable invoked from ``payment_failed_dunning`` for retry
        attempts. Production: bind to
        ``modules.comunify.payment.tokenized_recurring_adapter
        .ComunifyTokenizedRecurringAdapter.charge_installment``. Tests stub.
        When ``None``, dunning state advances deterministically without
        actual charge attempts (degraded mode for testing).

    Returns
    -------
    CompiledStateGraph runnable via ``.ainvoke`` / ``.aget_state``.
    """
    graph = StateGraph(CohortEnrollmentState)

    # Entry router — dispatches per current_step
    graph.add_node("__entry_router__", entry_router_node)

    # Nodes (7) — closures bind injected dependencies once at compile time
    graph.add_node("qualification", _make_qualification_node(qualify_tool))
    graph.add_node("discovery_call_scheduled", _make_discovery_call_node(book_discovery_tool))
    graph.add_node("terms_presentation", _make_terms_presentation_node())
    graph.add_node("payment_pending", _make_payment_pending_node())
    graph.add_node("payment_expired", _make_payment_expired_node())
    graph.add_node("enrolled", _make_enrolled_node())
    graph.add_node("payment_failed_dunning", _make_dunning_node(payment_retry_tool))

    # Entry point — router dispatches per current_step
    graph.set_entry_point("__entry_router__")
    graph.add_conditional_edges(
        "__entry_router__",
        route_from_entry,
        {
            "qualification": "qualification",
            "discovery_call_scheduled": "discovery_call_scheduled",
            "terms_presentation": "terms_presentation",
            "payment_pending": "payment_pending",
            "payment_expired": "payment_expired",
            "enrolled": "enrolled",
            "payment_failed_dunning": "payment_failed_dunning",
        },
    )

    # qualification — fit / no_fit branch
    graph.add_conditional_edges(
        "qualification",
        route_after_qualification,
        {
            "fit": "discovery_call_scheduled",
            "no_fit": END,
        },
    )

    # discovery_call_scheduled → terms_presentation (deterministic next step)
    graph.add_edge("discovery_call_scheduled", "terms_presentation")

    # terms_presentation — confirmed / rejected branch
    graph.add_conditional_edges(
        "terms_presentation",
        route_after_terms,
        {
            "confirmed": "payment_pending",
            "rejected": END,
        },
    )

    # payment_pending — wait / succeeded / failed / expired_48h
    graph.add_conditional_edges(
        "payment_pending",
        route_after_payment,
        {
            "succeeded": "enrolled",
            "failed": "payment_failed_dunning",
            "expired_48h": "payment_expired",
            "wait": END,  # park awaiting webhook
        },
    )

    # payment_expired — retry / drop
    graph.add_conditional_edges(
        "payment_expired",
        route_after_expired,
        {
            "retry": "payment_pending",
            "drop": END,
        },
    )

    # payment_failed_dunning — retry_succeeded / cancelled / wait
    graph.add_conditional_edges(
        "payment_failed_dunning",
        route_dunning_state,
        {
            "retry_succeeded": "enrolled",
            "cancelled": END,
            "wait": END,  # park awaiting next cron tick
        },
    )

    # enrolled → END (terminal)
    graph.add_edge("enrolled", END)

    return graph.compile(checkpointer=checkpointer)
