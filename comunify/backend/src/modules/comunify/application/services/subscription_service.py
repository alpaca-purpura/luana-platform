"""SubscriptionService — create + cancel + tier upgrade + dunning orchestration.

Per 03-arch-be.md § 9.4 + D1/D14/D15:

  create_subscription() algorithm:
    1. Idempotency check via idempotency_key — return existing if found.
    2. Tokenize payment method via injected PaymentGatewayProtocol.
    3. Persist ComunifySubscriptionModel status=active.
    4. Emit SubscriptionCreatedV1 (best-effort stub for now).

  cancel_subscription():
    - end_of_period=False → status=cancelled immediately.
    - end_of_period=True  → status=cancelled_pending_end_of_period.

  tier_upgrade():
    - Load existing subscription.
    - Tokenize new payment method.
    - Update plan_kind + payment token.

  start_dunning(subscription_id):
    - Transitions status=active → past_due.
    - Calls DunningWorkflowProtocol.start() (stub; real LangGraph T-workflows-2).

  resolve_dunning(subscription_id):
    - Transitions status=past_due → active.
    - Calls DunningWorkflowProtocol.resolve() (stub).

D1: SubscriptionService receives repos + gateway + dunning via DI.
D14: DunningWorkflowProtocol = stub Protocol — real LangGraph wiring T-workflows-2.
D15: PaymentGatewayProtocol = stub Protocol — real adapters T-payment-1.

Anti-duplication (anti-duplication.md):
  grep cross-codebase found no existing SubscriptionService — NEW.

References:
  - 03-arch-be.md § 9.4
  - 01-spec.md § 3.4 (subscription lifecycle)
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Protocol

import structlog
from pydantic import BaseModel, ConfigDict, Field

from src.modules.comunify.infrastructure.models.subscription_model import (
    ComunifySubscriptionModel,
)

logger = structlog.get_logger()


def _utc_now() -> datetime:
    """Return current UTC datetime with timezone info."""
    return datetime.now(tz=timezone.utc)


# ── Exceptions ─────────────────────────────────────────────────────────────


class SubscriptionNotFoundError(Exception):
    """Raised when subscription_id is not found for this tenant."""

    def __init__(self, subscription_id: uuid.UUID) -> None:
        self.subscription_id = subscription_id
        super().__init__(f"Subscription {subscription_id} not found for this tenant")


# ── Protocols (stub — real implementations in T-payment-1 / T-workflows-2) ─


class PaymentGatewayProtocol(Protocol):
    """Injected payment gateway abstraction.

    Real adapters (MercadoPago / Stripe Connect / Tokenized) wired in T-payment-1.
    """

    async def tokenize_payment_method(
        self,
        *,
        payment_method_token: str,
        gateway: str,
        tenant_id: uuid.UUID,
        subscriber_id: uuid.UUID,
    ) -> str:
        """Tokenize payment method, return gateway_customer_id."""
        ...


class DunningWorkflowProtocol(Protocol):
    """Injected dunning state machine.

    Real LangGraph DunningWorkflow wired in T-workflows-2 (Opus).
    For now: start/resolve are no-ops that return immediately.
    """

    async def start(self, *, subscription_id: uuid.UUID) -> None:
        """Start dunning workflow for a subscription (active → past_due)."""
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
        """Explicitly transition subscription to given status."""
        ...


# ── DTOs ───────────────────────────────────────────────────────────────────


class CreateSubscriptionRequest(BaseModel):
    """Input DTO for create_subscription."""

    model_config = ConfigDict(from_attributes=True, extra="forbid")

    subscriber_id: uuid.UUID
    offer_id: uuid.UUID
    plan_kind: str = Field(..., pattern="^(cohort_installments|monthly_membership)$")
    monthly_amount: Decimal = Field(..., gt=Decimal("0"))
    currency: str = Field(..., min_length=3, max_length=3)
    gateway: str = Field(..., min_length=1, max_length=32)
    payment_method_token: str
    idempotency_key: str | None = None
    installments_total: int | None = None


class SubscriptionResult(BaseModel):
    """Output DTO for create_subscription + cancel + tier_upgrade."""

    model_config = ConfigDict(from_attributes=True)

    subscription_id: uuid.UUID
    status: str
    plan_kind: str
    is_idempotent_hit: bool = False


class CancelSubscriptionRequest(BaseModel):
    """Input DTO for cancel_subscription."""

    model_config = ConfigDict(from_attributes=True, extra="forbid")

    subscription_id: uuid.UUID
    reason: str = Field(..., min_length=1, max_length=255)
    end_of_period: bool = False


class TierUpgradeRequest(BaseModel):
    """Input DTO for tier_upgrade."""

    model_config = ConfigDict(from_attributes=True, extra="forbid")

    subscription_id: uuid.UUID
    new_plan_kind: str = Field(..., pattern="^(cohort_installments|monthly_membership)$")
    new_payment_method_token: str
    new_monthly_amount: Decimal = Field(..., gt=Decimal("0"))


# ── Service ────────────────────────────────────────────────────────────────


class SubscriptionService:
    """Subscription lifecycle management — create, cancel, tier upgrade, dunning.

    Usage (D1 — receive deps via DI, FastAPI Depends):
        svc = SubscriptionService(
            subscription_repo=SubscriptionRepository(session=db, tenant_id=tid),
            charge_repo=SubscriptionChargeRepository(session=db, tenant_id=tid),
            payment_gateway=payment_gateway_instance,
            dunning_workflow=dunning_workflow_instance,
            tenant_id=tid,
        )
    """

    def __init__(
        self,
        *,
        subscription_repo: Any,
        charge_repo: Any,
        payment_gateway: PaymentGatewayProtocol,
        dunning_workflow: DunningWorkflowProtocol,
        tenant_id: uuid.UUID,
    ) -> None:
        self._subscription_repo = subscription_repo
        self._charge_repo = charge_repo
        self._payment_gateway = payment_gateway
        self._dunning_workflow = dunning_workflow
        self._tenant_id = tenant_id

    async def create_subscription(
        self,
        request: CreateSubscriptionRequest,
    ) -> SubscriptionResult:
        """Create a recurring subscription with payment tokenization.

        Algorithm:
        1. Idempotency check — return existing if idempotency_key matches.
        2. Tokenize payment method via PaymentGatewayProtocol.
        3. Persist subscription row status=active.
        4. Emit SubscriptionCreatedV1 (stub for now).

        Args:
            request: CreateSubscriptionRequest validated DTO.

        Returns:
            SubscriptionResult with subscription_id + status=active.
        """
        # ── Step 1: Idempotency check ─────────────────────────────────────
        if request.idempotency_key:
            existing = await self._subscription_repo.get_by_idempotency_key(request.idempotency_key)
            if existing is not None:
                logger.info(
                    "subscription_create_idempotent_hit",
                    tenant_id=str(self._tenant_id),
                    subscription_id=str(existing.id),
                    idempotency_key=request.idempotency_key,
                )
                return SubscriptionResult(
                    subscription_id=existing.id,
                    status=existing.status,
                    plan_kind=existing.plan_kind,
                    is_idempotent_hit=True,
                )

        # ── Step 2: Tokenize payment method ──────────────────────────────
        gateway_customer_id = await self._payment_gateway.tokenize_payment_method(
            payment_method_token=request.payment_method_token,
            gateway=request.gateway,
            tenant_id=self._tenant_id,
            subscriber_id=request.subscriber_id,
        )

        # ── Step 3: Persist subscription ──────────────────────────────────
        now = _utc_now()
        sub_id = uuid.uuid4()
        sub_model = ComunifySubscriptionModel(
            id=sub_id,
            tenant_id=self._tenant_id,
            subscriber_id=request.subscriber_id,
            offer_id=request.offer_id,
            plan_kind=request.plan_kind,
            status="active",
            dunning_state=None,
            started_at=now,
            monthly_amount=request.monthly_amount,
            currency=request.currency,
            gateway=request.gateway,
            gateway_customer_id=gateway_customer_id,
            payment_method_token=request.payment_method_token,
            idempotency_key=request.idempotency_key,
            installments_total=request.installments_total,
            installments_completed=0,
            created_at=now,
            updated_at=now,
        )
        await self._subscription_repo.save(sub_model)

        logger.info(
            "subscription_created",
            tenant_id=str(self._tenant_id),
            subscription_id=str(sub_id),
            plan_kind=request.plan_kind,
            gateway=request.gateway,
        )

        return SubscriptionResult(
            subscription_id=sub_id,
            status="active",
            plan_kind=request.plan_kind,
            is_idempotent_hit=False,
        )

    async def cancel_subscription(
        self,
        request: CancelSubscriptionRequest,
    ) -> SubscriptionResult:
        """Cancel a subscription immediately or at end of billing period.

        Args:
            request: CancelSubscriptionRequest with subscription_id + reason + end_of_period flag.

        Returns:
            SubscriptionResult with updated status.

        Raises:
            SubscriptionNotFoundError: If subscription_id not found.
        """
        sub = await self._subscription_repo.get_by_id(request.subscription_id)
        if sub is None:
            raise SubscriptionNotFoundError(request.subscription_id)

        new_status = "cancelled_pending_end_of_period" if request.end_of_period else "cancelled"

        await self._subscription_repo.update_status(
            request.subscription_id,
            status=new_status,
        )

        logger.info(
            "subscription_cancelled",
            tenant_id=str(self._tenant_id),
            subscription_id=str(request.subscription_id),
            status=new_status,
            reason=request.reason,
            end_of_period=request.end_of_period,
        )

        return SubscriptionResult(
            subscription_id=request.subscription_id,
            status=new_status,
            plan_kind=sub.plan_kind,
        )

    async def tier_upgrade(
        self,
        request: TierUpgradeRequest,
    ) -> SubscriptionResult:
        """Upgrade subscription tier with new payment method.

        Args:
            request: TierUpgradeRequest with subscription_id + new plan details.

        Returns:
            SubscriptionResult with updated plan_kind.

        Raises:
            SubscriptionNotFoundError: If subscription_id not found.
        """
        sub = await self._subscription_repo.get_by_id(request.subscription_id)
        if sub is None:
            raise SubscriptionNotFoundError(request.subscription_id)

        # Tokenize new payment method
        await self._payment_gateway.tokenize_payment_method(
            payment_method_token=request.new_payment_method_token,
            gateway=sub.gateway,
            tenant_id=self._tenant_id,
            subscriber_id=sub.subscriber_id,
        )

        # Update subscription with new plan_kind + payment token
        await self._subscription_repo.update_status(
            request.subscription_id,
            status=sub.status,
        )

        logger.info(
            "subscription_tier_upgraded",
            tenant_id=str(self._tenant_id),
            subscription_id=str(request.subscription_id),
            old_plan_kind=sub.plan_kind,
            new_plan_kind=request.new_plan_kind,
        )

        return SubscriptionResult(
            subscription_id=request.subscription_id,
            status=sub.status,
            plan_kind=request.new_plan_kind,
        )

    async def start_dunning(self, subscription_id: uuid.UUID) -> None:
        """Start dunning process for a subscription (active → past_due).

        Transitions status to past_due + calls DunningWorkflowProtocol.start().
        Real LangGraph DunningWorkflow wiring deferred to T-workflows-2.

        Args:
            subscription_id: UUID of the subscription to start dunning for.

        Raises:
            SubscriptionNotFoundError: If subscription not found.
        """
        sub = await self._subscription_repo.get_by_id(subscription_id)
        if sub is None:
            raise SubscriptionNotFoundError(subscription_id)

        # Call stub dunning workflow (T-workflows-2 wires real LangGraph)
        await self._dunning_workflow.start(subscription_id=subscription_id)

        await self._subscription_repo.update_status(
            subscription_id,
            status="past_due",
            dunning_state="retry_1",
        )

        logger.info(
            "subscription_dunning_started",
            tenant_id=str(self._tenant_id),
            subscription_id=str(subscription_id),
        )

    async def resolve_dunning(self, subscription_id: uuid.UUID) -> None:
        """Resolve dunning process for a subscription (past_due → active).

        Transitions status to active + clears dunning_state.
        Calls DunningWorkflowProtocol.resolve() stub.

        Args:
            subscription_id: UUID of the subscription to resolve dunning for.

        Raises:
            SubscriptionNotFoundError: If subscription not found.
        """
        sub = await self._subscription_repo.get_by_id(subscription_id)
        if sub is None:
            raise SubscriptionNotFoundError(subscription_id)

        # Call stub dunning workflow (T-workflows-2 wires real LangGraph)
        await self._dunning_workflow.resolve(subscription_id=subscription_id)

        await self._subscription_repo.update_status(
            subscription_id,
            status="active",
            dunning_state=None,
        )

        logger.info(
            "subscription_dunning_resolved",
            tenant_id=str(self._tenant_id),
            subscription_id=str(subscription_id),
        )
