"""CommunityEngagementWorkflow — LangGraph 2.0 StateGraph.

Story 12 luana-comunify-bootstrap T-workflows-1 (R23 Opus 4.7 production
AGENTIC code).

Per 02-design-agentic.md § state machine spec + 03-arch-agentic.md § 6.1:

  6 nodes / 8 transitions:
    active --(cron tick + no_activity ≥ 14d)--> drift_detected
    drift_detected --(re_engaged signal)--> re_engaged
    drift_detected --(vulnerable disclosure)--> escalated_to_creator_manual
    drift_detected --(no response cumulative 14d)--> dropped_silent
    re_engaged --> active (loop back)
    escalated_to_creator_manual --(creator resume)--> re_engaged
    escalated_to_creator_manual --(creator drop)--> terminal_dropped
    dropped_silent --> terminal_dropped

  Composite state key (tenant_id, subscriber_id) via thread_id config.
  Checkpointer abstraction (MemorySaver default; RedisSaver swap when
  ``langgraph-checkpoint-redis`` package install lands per D10 staging).

Decisions honored:
  D3  — CommunityEngagementWorkflow inherits StateGraph directly (no shared
        base ``BaseWorkflowOrchestrator`` — YAGNI, defer until 4th vertical
        workflow appears; Vitalia has 1 + Comunify has 2 = 3 total).
  D10 — RedisSaver checkpointer cross-brand (current MemorySaver test path,
        ``CheckpointerProtocol`` allows runtime swap with zero workflow
        code changes).

Anti-duplication audit (per ``.claude/rules/anti-duplication.md``):
  * Pre-write grep ``"class CommunityEngagementWorkflow"`` /
    ``"build_community_engagement_workflow"`` cross
    /home/chris/luana-platform/ + /home/chris/AISALESHT/backend/ → empty.
  * Tool integration follows the vitalia precedent at
    ``vitalia/backend/src/modules/vitalia/copilot/workflows/
    treatment_followup_workflow.py``: nodes hold the LangGraph control
    flow, tool invocation is INJECTED via callables (so unit tests can
    stub LLM calls without spinning up the real tool — which has heavy
    repo / LLM client deps).
  * Cost accumulator stubs deterministic until production tool wiring
    lands; pattern mirrors vitalia ``_NODE_COST_USD`` registry.

Cost tracking:
  * ``cost_accumulated_usd`` accumulates per node invocation. Stub
    contributions (Sonnet ~$0.009 nurture, $0.001 cron probes) sum well
    under the $0.10 per-workflow-run ceiling declared in
    ``comunify_community_engagement_descriptor.cost_budget_per_workflow_run``.
  * Validated by ``test_community_engagement_cost_budget``.

Tenant isolation:
  * All state carries ``tenant_id``. Checkpointer thread_id includes
    ``tenant_id`` + ``subscriber_id`` composite — cross-subscriber
    isolation guaranteed at persistence boundary.

Best-effort observability:
  * Nodes emit structlog events on entry. Real ``copilot_trace_event``
    persistence happens when nodes invoke the
    ``nurture_via_authority_content`` tool (which owns its own trace
    event repo). Workflow boundary itself stays best-effort + non-
    breaking per ``copilot-observability.md``.
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


class CommunityEngagementState(TypedDict, total=False):
    """CommunityEngagementWorkflow state.

    ``total=False`` allows partial state updates per LangGraph node return
    convention (nodes return only the keys they modify).

    Tenant isolation: ``tenant_id`` is REQUIRED in initial state. Checkpointer
    thread_id composes ``f"{tenant_id}:{subscriber_id}"`` per § 6.4.
    """

    # Identity (set at first invocation, immutable thereafter)
    tenant_id: Any  # uuid.UUID — typed Any for TypedDict tolerance
    subscriber_id: Any
    cohort_id: Any

    # Activity signals (consumed at routing time)
    last_activity_at: Any  # datetime — set by upstream community signals
    drift_detected_at: Any  # datetime | None
    member_response_text: str | None
    sentiment: float | None  # 0-1 positive sentiment
    vulnerability_disclosed: bool
    creator_intervention_required: bool
    nurture_failed_count: int
    next_milestone_at: Any  # datetime | None

    # Workflow control
    current_step: str

    # Cost tracking (best-effort; real per-call cost lives in
    # copilot_llm_call when nurture_via_authority_content fires).
    cost_accumulated_usd: float

    # Anti-loop guard (cron-driven workflow; max iterations defensive only)
    iterations: int


# ════════════════════════════════════════════════════════════════════════════
# Checkpointer protocol — RedisSaver swap surface (D10)
# ════════════════════════════════════════════════════════════════════════════


class CheckpointerProtocol(Protocol):
    """Structural protocol — accepts MemorySaver, RedisSaver (future),
    AsyncPostgresSaver, or any LangGraph-compatible checkpointer.

    Production swap (D10):
        from langgraph.checkpoint.redis import RedisSaver

        checkpointer = RedisSaver.from_conn_string(settings.REDIS_URL)
        workflow = build_community_engagement_workflow(checkpointer=checkpointer)
    """

    ...  # LangGraph compile() validates the actual interface at runtime


# ════════════════════════════════════════════════════════════════════════════
# Tool injection protocol — keeps unit tests deps-free
# ════════════════════════════════════════════════════════════════════════════


class NurtureToolCallableProtocol(Protocol):
    """Callable invoked from ``drift_detected`` node to nurture the member.

    Production wiring binds this to the real
    ``modules.comunify.agentic.tools.nurture_via_authority_content``
    function via partial-application (tenant_id + repos + LLM client) at the
    cron handler call site. Tests inject a deterministic stub.

    Returns a dict with the keys the workflow needs from the tool output:
      * ``success: bool`` — at least one piece of authority content surfaced
      * ``cost_usd: float`` — per-invocation cost contribution
    """

    async def __call__(
        self,
        *,
        tenant_id: Any,
        subscriber_id: Any,
        cohort_id: Any,
        member_response_text: str | None,
    ) -> dict[str, Any]: ...


# ════════════════════════════════════════════════════════════════════════════
# Cost accumulator stubs (replaced by real tool cost recording)
# ════════════════════════════════════════════════════════════════════════════

# Per-node deterministic cost contributions. Total drift→nurture→re_engaged
# happy path ≈ $0.011 well under the $0.10 ceiling declared in the workflow
# descriptor. Real Haiku/Sonnet costs land in copilot_llm_call when tool wires.
_NODE_COST_USD = {
    "active": 0.0,
    "drift_detected": 0.001,  # classification + routing probe
    "re_engaged": 0.0,
    "escalated_to_creator_manual": 0.001,  # notification compose
    "dropped_silent": 0.0,
    "terminal_dropped": 0.0,
}


def _accumulate_cost(state: CommunityEngagementState, node_name: str) -> float:
    """Return new ``cost_accumulated_usd`` after this node runs."""
    prior = state.get("cost_accumulated_usd", 0.0) or 0.0
    delta = _NODE_COST_USD.get(node_name, 0.0)
    return prior + delta


# ════════════════════════════════════════════════════════════════════════════
# Workflow nodes
# ════════════════════════════════════════════════════════════════════════════


def _make_active_node() -> Callable[[CommunityEngagementState], Awaitable[dict[str, Any]]]:
    async def active_node(state: CommunityEngagementState) -> dict[str, Any]:
        """Entry / re-entry state. Reset transient signals; await drift event.

        Cron tick + ``no_activity_check`` advances the workflow to
        ``drift_detected`` via ``route_after_active``. This node simply
        records that the workflow is in steady state.
        """
        logger.info(
            "community_engagement_active",
            tenant_id=str(state.get("tenant_id")),
            subscriber_id=str(state.get("subscriber_id")),
        )
        return {
            "current_step": "active",
            # Clear stale signals (idempotent re-entry)
            "drift_detected_at": None,
            "member_response_text": None,
            "vulnerability_disclosed": False,
            "creator_intervention_required": False,
            "iterations": (state.get("iterations") or 0) + 1,
            "cost_accumulated_usd": _accumulate_cost(state, "active"),
        }

    return active_node


def _make_drift_detected_node(
    nurture_tool: NurtureToolCallableProtocol | None,
) -> Callable[[CommunityEngagementState], Awaitable[dict[str, Any]]]:
    """Build ``drift_detected`` node bound to the nurture tool.

    The node invokes the nurture tool (production wiring) or a stub (tests).
    On tool success the routing function reads back the inferred state
    signals (``vulnerability_disclosed``, ``creator_intervention_required``,
    ``nurture_failed_count``, ``member_response_text``).
    """

    async def drift_detected_outbound_node(
        state: CommunityEngagementState,
    ) -> dict[str, Any]:
        """Member drift detected — run nurture tool OR escalate.

        Decision rule (mirrored in route_after_drift):
          - vulnerability_disclosed → escalate (caller signal)
          - creator_intervention_required → escalate (caller signal)
          - nurture_failed_count >= 2 → dropped_silent (cumulative failure)
          - else → invoke nurture tool, persist member_response_text if any

        On nurture tool failure (timeout / exception): incremented
        nurture_failed_count, set member_response_text=None — degrades
        gracefully per ``tessl__graceful-degradation`` Rule 5.
        """
        logger.info(
            "community_engagement_drift_detected",
            tenant_id=str(state.get("tenant_id")),
            subscriber_id=str(state.get("subscriber_id")),
            nurture_failed_count=state.get("nurture_failed_count") or 0,
            vulnerability_disclosed=state.get("vulnerability_disclosed", False),
            creator_intervention_required=state.get("creator_intervention_required", False),
        )

        update: dict[str, Any] = {
            "current_step": "drift_detected",
            "iterations": (state.get("iterations") or 0) + 1,
            "cost_accumulated_usd": _accumulate_cost(state, "drift_detected"),
        }

        # If caller already set escalation signals, skip nurture (defense-in-depth).
        if (
            state.get("vulnerability_disclosed", False)
            or state.get("creator_intervention_required", False)
            or (state.get("nurture_failed_count") or 0) >= 2
        ):
            update["drift_detected_at"] = state.get("drift_detected_at") or None
            return update

        # Run nurture tool (if wired) — graceful-degradation on failure.
        if nurture_tool is not None:
            try:
                tool_result = await nurture_tool(
                    tenant_id=state.get("tenant_id"),
                    subscriber_id=state.get("subscriber_id"),
                    cohort_id=state.get("cohort_id"),
                    member_response_text=state.get("member_response_text"),
                )
                success = bool(tool_result.get("success", False))
                cost_delta = float(tool_result.get("cost_usd", 0.0) or 0.0)
                update["cost_accumulated_usd"] = (
                    (state.get("cost_accumulated_usd") or 0.0) + _NODE_COST_USD["drift_detected"] + cost_delta
                )
                if not success:
                    update["nurture_failed_count"] = (state.get("nurture_failed_count") or 0) + 1
            except Exception as exc:  # noqa: BLE001 — graceful-degradation Rule 5
                logger.warning(
                    "community_engagement_nurture_tool_failed",
                    dependency="comunify.nurture_via_authority_content",
                    tenant_id=str(state.get("tenant_id")),
                    subscriber_id=str(state.get("subscriber_id")),
                    err=str(exc),
                    err_type=type(exc).__name__,
                    fallback="incrementing_nurture_failed_count",
                )
                update["nurture_failed_count"] = (state.get("nurture_failed_count") or 0) + 1
        return update

    return drift_detected_outbound_node


def _make_re_engaged_node() -> Callable[[CommunityEngagementState], Awaitable[dict[str, Any]]]:
    async def re_engaged_node(state: CommunityEngagementState) -> dict[str, Any]:
        """Member responded positively after drift → reset signals, loop back.

        Workflow re-enters ``active`` for the next cycle. Drift timer
        starts fresh.
        """
        logger.info(
            "community_engagement_re_engaged",
            tenant_id=str(state.get("tenant_id")),
            subscriber_id=str(state.get("subscriber_id")),
        )
        return {
            "current_step": "re_engaged",
            "drift_detected_at": None,
            "nurture_failed_count": 0,
            "vulnerability_disclosed": False,
            "creator_intervention_required": False,
            "iterations": (state.get("iterations") or 0) + 1,
            "cost_accumulated_usd": _accumulate_cost(state, "re_engaged"),
        }

    return re_engaged_node


def _make_escalated_node() -> Callable[[CommunityEngagementState], Awaitable[dict[str, Any]]]:
    async def escalated_node(state: CommunityEngagementState) -> dict[str, Any]:
        """Creator manual escalation — vulnerable disclosure / intervention.

        Side-effect (deferred to T-workflows-2 follow-up wiring): notify
        creator via channel adapter + audit_log row. This node only logs;
        the cron handler / outbox queue performs the side-effects.

        The workflow STAYS in this state until the creator resolves (signal
        injected at next tick via ``creator_intervention_required`` cleared
        or ``current_step`` advanced).
        """
        logger.warning(
            "community_engagement_escalated_to_creator_manual",
            tenant_id=str(state.get("tenant_id")),
            subscriber_id=str(state.get("subscriber_id")),
            vulnerability_disclosed=state.get("vulnerability_disclosed", False),
            creator_intervention_required=state.get("creator_intervention_required", False),
        )
        return {
            "current_step": "escalated_to_creator_manual",
            "iterations": (state.get("iterations") or 0) + 1,
            "cost_accumulated_usd": _accumulate_cost(state, "escalated_to_creator_manual"),
        }

    return escalated_node


def _make_dropped_silent_node() -> Callable[[CommunityEngagementState], Awaitable[dict[str, Any]]]:
    async def dropped_silent_node(state: CommunityEngagementState) -> dict[str, Any]:
        """Member dropped after silence — tag ``community_inactive`` + terminal.

        Side-effect (deferred to follow-up wiring): tag CommunityMember
        ``status="inactive"`` via service-layer mutation.
        """
        logger.info(
            "community_engagement_dropped_silent",
            tenant_id=str(state.get("tenant_id")),
            subscriber_id=str(state.get("subscriber_id")),
            nurture_failed_count=state.get("nurture_failed_count") or 0,
        )
        return {
            "current_step": "dropped_silent",
            "iterations": (state.get("iterations") or 0) + 1,
            "cost_accumulated_usd": _accumulate_cost(state, "dropped_silent"),
        }

    return dropped_silent_node


def _make_terminal_node() -> Callable[[CommunityEngagementState], Awaitable[dict[str, Any]]]:
    async def terminal_node(state: CommunityEngagementState) -> dict[str, Any]:
        """Terminal — workflow finished. No further transitions."""
        logger.info(
            "community_engagement_terminal_dropped",
            tenant_id=str(state.get("tenant_id")),
            subscriber_id=str(state.get("subscriber_id")),
            cost_accumulated_usd=state.get("cost_accumulated_usd") or 0.0,
        )
        return {
            "current_step": "terminal_dropped",
            "iterations": (state.get("iterations") or 0) + 1,
            "cost_accumulated_usd": _accumulate_cost(state, "terminal_dropped"),
        }

    return terminal_node


# ════════════════════════════════════════════════════════════════════════════
# Entry router — dispatches per current_step (mirror vitalia pattern)
# ════════════════════════════════════════════════════════════════════════════


async def entry_router_node(state: CommunityEngagementState) -> dict[str, Any]:
    """Entry router — pure routing node, returns no state mutations.

    Reads ``current_step`` from input state to dispatch the appropriate
    workflow node. Pattern required because LangGraph's single-entry-point
    + checkpointer model dispatches via state, not via external node
    addressing.
    """
    return {}


def route_from_entry(state: CommunityEngagementState) -> str:
    """Dispatch from entry router based on ``current_step``.

    Unknown / missing current_step → ``active`` (workflow first invocation).
    """
    step = state.get("current_step") or "active"
    valid = {
        "active",
        "drift_detected",
        "re_engaged",
        "escalated_to_creator_manual",
        "dropped_silent",
        "terminal_dropped",
    }
    if step not in valid:
        logger.warning(
            "community_engagement_unknown_step_fallback_to_active",
            unknown_step=step,
            tenant_id=str(state.get("tenant_id")),
            subscriber_id=str(state.get("subscriber_id")),
        )
        step = "active"
    return step


# ════════════════════════════════════════════════════════════════════════════
# Conditional edge routing
# ════════════════════════════════════════════════════════════════════════════


def route_after_active(state: CommunityEngagementState) -> str:
    """Route from ``active`` — END (wait for next cron tick) unless caller
    already signaled drift via ``drift_detected_at``.

    The cron handler signals drift by injecting ``current_step="drift_detected"``
    on the next invocation; this routing function only fires on a same-
    invocation transition (rare — happens when re_engaged loops back and
    drift signal is already present).
    """
    if state.get("drift_detected_at") is not None:
        return "drift"
    return "wait"


def route_after_drift(state: CommunityEngagementState) -> str:
    """Route from ``drift_detected``.

    Decision order (defense-in-depth — caller signals take precedence over
    inferred state):
      1. vulnerability_disclosed → escalate
      2. creator_intervention_required → escalate
      3. nurture_failed_count >= 2 → dropped_silent
      4. member_response_text not None (re-engagement signal) → re_engaged
      5. default → wait for next tick (END this invocation)
    """
    if state.get("vulnerability_disclosed", False):
        return "vulnerable"
    if state.get("creator_intervention_required", False):
        return "vulnerable"
    if (state.get("nurture_failed_count") or 0) >= 2:
        return "no_response_14d"
    if state.get("member_response_text") is not None:
        return "re_engaged"
    return "wait"


def route_after_escalation_resolve(state: CommunityEngagementState) -> str:
    """Route from ``escalated_to_creator_manual``.

    Reads cleared flags / ``current_step`` signal:
      - creator_intervention_required cleared + member_response_text present → resume
      - explicit drop signal (``current_step="dropped_silent"``) → drop
      - default → stay paused (END this invocation, await creator action)
    """
    if state.get("current_step") == "dropped_silent":
        return "drop"
    if not state.get("creator_intervention_required", False) and not state.get("vulnerability_disclosed", False):
        # Creator resolved → loop back via re_engaged
        if state.get("member_response_text") is not None:
            return "resume"
    return "stay_paused"


# ════════════════════════════════════════════════════════════════════════════
# Workflow factory
# ════════════════════════════════════════════════════════════════════════════


def build_community_engagement_workflow(
    checkpointer: CheckpointerProtocol | Any,
    *,
    nurture_tool: NurtureToolCallableProtocol | None = None,
) -> Any:
    """Build + compile CommunityEngagementWorkflow LangGraph StateGraph.

    Parameters
    ----------
    checkpointer:
        Any LangGraph-compatible checkpointer. Pass ``MemorySaver`` for
        tests / dev, ``RedisSaver`` / ``AsyncPostgresSaver`` for production.
        Per D10: checkpointer abstraction allows runtime swap.
    nurture_tool:
        Optional callable invoked from the ``drift_detected`` node. In
        production wiring: bind this to
        ``modules.comunify.agentic.tools.nurture_via_authority_content``
        via partial application (tenant_id + repos + LLM client) at the
        cron handler call site. Tests inject a deterministic stub. When
        ``None``, the node skips invocation (degraded mode — drift
        detection still fires routing per other signals).

    Returns
    -------
    CompiledStateGraph runnable via ``.ainvoke`` / ``.aget_state``.
    """
    graph = StateGraph(CommunityEngagementState)

    # Entry router — dispatches per current_step
    graph.add_node("__entry_router__", entry_router_node)

    # Nodes (6) — closures bind injected dependencies once at compile time
    graph.add_node("active", _make_active_node())
    graph.add_node("drift_detected", _make_drift_detected_node(nurture_tool))
    graph.add_node("re_engaged", _make_re_engaged_node())
    graph.add_node("escalated_to_creator_manual", _make_escalated_node())
    graph.add_node("dropped_silent", _make_dropped_silent_node())
    graph.add_node("terminal_dropped", _make_terminal_node())

    # Entry point — router dispatches per current_step
    graph.set_entry_point("__entry_router__")
    graph.add_conditional_edges(
        "__entry_router__",
        route_from_entry,
        {
            "active": "active",
            "drift_detected": "drift_detected",
            "re_engaged": "re_engaged",
            "escalated_to_creator_manual": "escalated_to_creator_manual",
            "dropped_silent": "dropped_silent",
            "terminal_dropped": "terminal_dropped",
        },
    )

    # active — wait for cron tick OR same-invocation drift signal
    graph.add_conditional_edges(
        "active",
        route_after_active,
        {
            "drift": "drift_detected",
            "wait": END,
        },
    )

    # drift_detected — invoke tool + route per signals
    graph.add_conditional_edges(
        "drift_detected",
        route_after_drift,
        {
            "re_engaged": "re_engaged",
            "vulnerable": "escalated_to_creator_manual",
            "no_response_14d": "dropped_silent",
            "wait": END,
        },
    )

    # re_engaged — loop back to active
    graph.add_edge("re_engaged", "active")

    # escalated_to_creator_manual — wait for creator action
    graph.add_conditional_edges(
        "escalated_to_creator_manual",
        route_after_escalation_resolve,
        {
            "resume": "re_engaged",
            "drop": "terminal_dropped",
            "stay_paused": END,
        },
    )

    # dropped_silent → terminal
    graph.add_edge("dropped_silent", "terminal_dropped")

    # terminal_dropped → END
    graph.add_edge("terminal_dropped", END)

    return graph.compile(checkpointer=checkpointer)
