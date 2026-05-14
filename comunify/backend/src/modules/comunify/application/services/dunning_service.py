"""DunningService — LangGraph DunningWorkflow state machine instantiation.

Per 03-arch-be.md § 9.4 + D14:

  State machine: active → past_due → suspended → cancelled

  State transitions allowed:
    active     → past_due       (first charge failure)
    past_due   → active         (payment resolved)
    past_due   → suspended      (2nd/3rd retry exhausted)
    suspended  → cancelled      (+14d cumulative from first failure)
    active     → cancelled      (manual / user-requested)
    past_due   → cancelled      (manual)
    suspended  → active         (payment resolved from suspension)

  WORKFLOW INSTANTIATION ONLY:
    Real LangGraph DunningWorkflow graph wiring deferred to T-workflows-2 (Opus).
    DunningWorkflowProtocol is a stub Protocol — callers inject their own impl.

D1: DunningService receives subscription_repo + dunning_workflow via DI.
D14: DunningWorkflow Protocol stub — T-workflows-2 provides real LangGraph graph.

Anti-duplication (anti-duplication.md):
  grep cross-codebase found no existing DunningService — NEW.

References:
  - 03-arch-be.md § 9.4
  - 01-spec.md § 3.4 dunning state transitions
"""

from __future__ import annotations

import uuid
from typing import Any, Protocol

import structlog

logger = structlog.get_logger()

# ── Allowed state transitions table ────────────────────────────────────────

_ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    "active": {"past_due", "cancelled"},
    "past_due": {"active", "suspended", "cancelled"},
    "suspended": {"active", "cancelled"},
    "cancelled": set(),  # terminal
    "cancelled_pending_end_of_period": {"cancelled"},  # only forward
}


# ── Exceptions ─────────────────────────────────────────────────────────────


class SubscriptionNotFoundError(Exception):
    """Raised when subscription_id is not found for this tenant."""

    def __init__(self, subscription_id: uuid.UUID) -> None:
        self.subscription_id = subscription_id
        super().__init__(f"Subscription {subscription_id} not found for this tenant")


class DunningTransitionError(Exception):
    """Raised when a requested status transition is not allowed by the state machine."""

    def __init__(
        self,
        subscription_id: uuid.UUID,
        current_status: str,
        requested_status: str,
    ) -> None:
        self.subscription_id = subscription_id
        self.current_status = current_status
        self.requested_status = requested_status
        super().__init__(
            f"Invalid dunning transition for subscription {subscription_id}: {current_status!r} → {requested_status!r}"
        )


# ── Protocol (stub — real LangGraph in T-workflows-2) ─────────────────────


class DunningWorkflowProtocol(Protocol):
    """Injected dunning state machine protocol.

    Real LangGraph DunningWorkflow wired in T-workflows-2 (Opus).
    Stub implementation: start/resolve/transition_status are no-ops.
    """

    async def start(self, *, subscription_id: uuid.UUID) -> None:
        """Instantiate and start dunning workflow (active → past_due)."""
        ...

    async def resolve(self, *, subscription_id: uuid.UUID) -> None:
        """Resolve dunning workflow (past_due → active)."""
        ...

    async def transition_status(
        self,
        *,
        subscription_id: uuid.UUID,
        new_status: str,
    ) -> None:
        """Transition subscription to explicit new_status via workflow."""
        ...


# ── Service ────────────────────────────────────────────────────────────────


class DunningService:
    """Dunning state machine service — transitions subscriptions through failure recovery.

    Instantiates DunningWorkflow (Protocol stub) and orchestrates state transitions.
    Real LangGraph graph wiring deferred to T-workflows-2 (Opus).

    Usage (D1 — receive deps via DI):
        svc = DunningService(
            subscription_repo=SubscriptionRepository(session=db, tenant_id=tid),
            dunning_workflow=dunning_workflow_instance,
            tenant_id=tid,
        )
    """

    def __init__(
        self,
        *,
        subscription_repo: Any,
        dunning_workflow: DunningWorkflowProtocol,
        tenant_id: uuid.UUID,
    ) -> None:
        self._subscription_repo = subscription_repo
        self._dunning_workflow = dunning_workflow
        self._tenant_id = tenant_id

    async def start_dunning(self, subscription_id: uuid.UUID) -> None:
        """Start dunning for a subscription — transitions active → past_due.

        Calls DunningWorkflowProtocol.start() (stub; real LangGraph T-workflows-2).

        Args:
            subscription_id: UUID of the subscription to start dunning for.

        Raises:
            SubscriptionNotFoundError: If subscription not found.
        """
        sub = await self._subscription_repo.get_by_id(subscription_id)
        if sub is None:
            raise SubscriptionNotFoundError(subscription_id)

        # Call stub workflow (T-workflows-2 wires real LangGraph)
        await self._dunning_workflow.start(subscription_id=subscription_id)

        await self._subscription_repo.update_status(
            subscription_id,
            status="past_due",
            dunning_state="retry_1",
        )

        logger.info(
            "dunning_started",
            tenant_id=str(self._tenant_id),
            subscription_id=str(subscription_id),
        )

    async def resolve_dunning(self, subscription_id: uuid.UUID) -> None:
        """Resolve dunning for a subscription — transitions past_due → active.

        Calls DunningWorkflowProtocol.resolve() (stub).
        Clears dunning_state on resolution.

        Args:
            subscription_id: UUID of the subscription to resolve.

        Raises:
            SubscriptionNotFoundError: If subscription not found.
        """
        sub = await self._subscription_repo.get_by_id(subscription_id)
        if sub is None:
            raise SubscriptionNotFoundError(subscription_id)

        # Call stub workflow
        await self._dunning_workflow.resolve(subscription_id=subscription_id)

        await self._subscription_repo.update_status(
            subscription_id,
            status="active",
            dunning_state=None,
        )

        logger.info(
            "dunning_resolved",
            tenant_id=str(self._tenant_id),
            subscription_id=str(subscription_id),
        )

    async def transition_status(
        self,
        subscription_id: uuid.UUID,
        *,
        new_status: str,
    ) -> None:
        """Explicitly transition subscription to a new_status via state machine guard.

        Validates transition is allowed before applying.
        Delegates to DunningWorkflowProtocol.transition_status() stub.

        Args:
            subscription_id: UUID of the subscription to transition.
            new_status: Target status string.

        Raises:
            SubscriptionNotFoundError: If subscription not found.
            DunningTransitionError: If transition is not allowed from current status.
        """
        sub = await self._subscription_repo.get_by_id(subscription_id)
        if sub is None:
            raise SubscriptionNotFoundError(subscription_id)

        current_status = sub.status
        allowed = _ALLOWED_TRANSITIONS.get(current_status, set())

        if new_status not in allowed:
            raise DunningTransitionError(
                subscription_id=subscription_id,
                current_status=current_status,
                requested_status=new_status,
            )

        # Call stub workflow
        await self._dunning_workflow.transition_status(
            subscription_id=subscription_id,
            new_status=new_status,
        )

        await self._subscription_repo.update_status(
            subscription_id,
            status=new_status,
        )

        logger.info(
            "dunning_status_transitioned",
            tenant_id=str(self._tenant_id),
            subscription_id=str(subscription_id),
            from_status=current_status,
            to_status=new_status,
        )
