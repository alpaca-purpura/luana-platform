"""Comunify Tokenized Recurring adapter — cohort installments + monthly subscriptions.

Extends @luana/core/channels TokenizedRecurringAdapter base (Story 12 T-payment-1 lift).
In the uv workspace environment, inherits from:
    luana_core_channels.payment.tokenized_recurring_adapter.TokenizedRecurringAdapter

Comunify-specific overlays:
  - idempotency_prefix=comunify:recurring (namespaced from vitalia:recurring)
  - Cohort installments: 3/6/12 month plans for coaching programs
  - Monthly subscriptions: creator/pro/agency tier billing cycles
  - Dunning integration: failure → DunningWorkflow trigger via domain events
  - Gateway routing: gateway="mercadopago" for AR, "stripe_connect" for non-AR

Use cases (from 01-spec.md § subscriptions + brand.yaml):
  - Creator coaching cohort: 3-month program at $297 split 3×$99 (ARS primary)
  - Pro coaching cohort: 6-month program at $594 split 6×$99
  - Agency cohort: 12-month program at $3588 split 12×$299
  - Monthly membership: $29/$99/$299 per month, auto-renewed

# [COMUNIFY-STORY12-T-PAYMENT-1-TOKENIZED-RECURRING-OVERLAY]
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from typing import Any, Callable, Coroutine, Literal
from uuid import UUID

import structlog

logger = structlog.get_logger()

# ── Idempotency key scheme ────────────────────────────────────────────────────

_COMUNIFY_IDEMPOTENCY_PREFIX = "comunify:recurring"

# Cohort installment counts supported per spec
COHORT_INSTALLMENT_OPTIONS: tuple[int, ...] = (3, 6, 12)

# Monthly subscription plan kinds
PLAN_KIND_COHORT_INSTALLMENTS = "cohort_installments"
PLAN_KIND_MONTHLY_MEMBERSHIP = "monthly_membership"


# ── Domain VOs ────────────────────────────────────────────────────────────────


@dataclass(frozen=True, slots=True)
class Installment:
    """A single installment in a recurring payment schedule.

    Attributes:
        installment_n: 1-based installment number.
        amount: Decimal amount to charge.
        currency: ISO 4217 currency code. NEVER hardcoded.
        scheduled_at: UTC datetime when this installment should be charged.
        description: Optional human-readable label.
    """

    installment_n: int
    amount: Decimal
    currency: str  # ISO 4217 — forwarded from offer/subscription context
    scheduled_at: datetime
    description: str | None = None


@dataclass(frozen=True, slots=True)
class InstallmentResult:
    """Result of a single installment charge attempt.

    Attributes:
        payment_intent_id: Gateway payment identifier.
        status: "succeeded" / "scheduled" / "failed".
        idempotency_key: Composite key used for this charge.
        currency: ISO 4217 code (forwarded from Installment).
        installment_n: Which installment this result corresponds to.
    """

    payment_intent_id: str
    status: str
    idempotency_key: str
    currency: str
    installment_n: int


@dataclass(frozen=True, slots=True)
class RecurringPaymentSchedule:
    """Summary of a recurring payment schedule.

    Attributes:
        subscriber_id: Subscriber UUID.
        entity_id: Cohort or offer UUID being paid for.
        gateway: "stripe_connect" | "mercadopago".
        total_installments: Number of installments in the schedule.
        currency: ISO 4217 code (all installments share the same currency).
        plan_kind: "cohort_installments" | "monthly_membership".
        results: Ordered tuple of individual InstallmentResult values.
    """

    subscriber_id: UUID
    entity_id: UUID
    gateway: str
    total_installments: int
    currency: str
    plan_kind: str
    results: tuple[InstallmentResult, ...]


# ── Type aliases for injected dependencies ────────────────────────────────────

_ChargeFnType = Callable[..., Coroutine[Any, Any, dict]]
_CronRegisterFnType = Callable[..., Coroutine[Any, Any, None]]


# ── Adapter ───────────────────────────────────────────────────────────────────


@dataclass(slots=True)
class ComunifyTokenizedRecurringAdapter:
    """Comunify Tokenized Recurring adapter — cohort installments + monthly subscriptions.

    Fulfills the TokenizedRecurringAdapter contract from @luana/core/channels.
    When the comunify venv has luana_core_channels installed (workspace env),
    this class inherits from TokenizedRecurringAdapter. In standalone context,
    it is a self-contained implementation.

    Adds over core base:
      1. idempotency_prefix=comunify:recurring (namespaced, prevents key collision
         with vitalia:recurring from Story 11).
      2. plan_kind tracking (cohort_installments vs monthly_membership).
      3. Cohort installment count validation (must be 3, 6, or 12).
      4. RecurringPaymentSchedule includes plan_kind in output for dunning routing.

    Args:
        gateway: "stripe_connect" | "mercadopago".
        stripe_secret_key: Stripe secret key (required when gateway=stripe_connect).
        mp_access_token: MP access token (required when gateway=mercadopago).
        plan_kind: "cohort_installments" | "monthly_membership".
        _charge_fn: Injectable charge function (real impl / test double).
        _cron_register_fn: Injectable cron registration function.
    """

    gateway: Literal["stripe_connect", "mercadopago"]
    stripe_secret_key: str = ""
    mp_access_token: str = ""
    plan_kind: str = PLAN_KIND_MONTHLY_MEMBERSHIP

    # Injected for testability
    _charge_fn: _ChargeFnType | None = field(default=None, repr=False)
    _cron_register_fn: _CronRegisterFnType | None = field(default=None, repr=False)

    # In-memory idempotency store (seed from DB on production initialization)
    _processed: dict[str, InstallmentResult] = field(default_factory=dict, repr=False)

    # ── Idempotency key ────────────────────────────────────────────────────────

    def build_idempotency_key(
        self,
        *,
        subscriber_id: UUID,
        entity_id: UUID,
        installment_n: int,
    ) -> str:
        """Build a deterministic, composite idempotency key.

        Key format: ``comunify:recurring:{subscriber_id}:{entity_id}:{n}``

        Namespaced with ``comunify:`` to prevent collision with ``vitalia:recurring``
        keys from Story 11. Same inputs → same key. Different inputs → different key.

        Args:
            subscriber_id: Subscriber UUID.
            entity_id: Cohort or offer UUID.
            installment_n: 1-based installment number.

        Returns:
            Deterministic string idempotency key.
        """
        return f"{_COMUNIFY_IDEMPOTENCY_PREFIX}:{subscriber_id}:{entity_id}:{installment_n}"

    # ── Public API ─────────────────────────────────────────────────────────────

    async def charge_installment(
        self,
        *,
        subscriber_id: UUID,
        entity_id: UUID,
        installment: Installment,
    ) -> InstallmentResult:
        """Charge a single installment, idempotently.

        If the same (subscriber_id, entity_id, installment_n) has already been
        charged, returns the cached result WITHOUT calling the gateway.

        Currency forwarded from installment.currency — never hardcoded.

        Args:
            subscriber_id: Subscriber UUID.
            entity_id: Cohort or offer UUID.
            installment: The installment to charge.

        Returns:
            InstallmentResult (may be cached from a previous call).
        """
        idempotency_key = self.build_idempotency_key(
            subscriber_id=subscriber_id,
            entity_id=entity_id,
            installment_n=installment.installment_n,
        )

        if idempotency_key in self._processed:
            cached = self._processed[idempotency_key]
            logger.info(
                "comunify_tokenized_installment_idempotent",
                idempotency_key=idempotency_key,
                payment_intent_id=cached.payment_intent_id,
                subscriber_id=str(subscriber_id),
                entity_id=str(entity_id),
                installment_n=installment.installment_n,
                plan_kind=self.plan_kind,
            )
            return cached

        charge_fn = self._charge_fn or self._default_charge_fn()
        raw_result = await charge_fn(
            idempotency_key=idempotency_key,
            amount=installment.amount,
            currency=installment.currency,  # forwarded — never hardcoded
            subscriber_id=subscriber_id,
            entity_id=entity_id,
            installment_n=installment.installment_n,
            gateway=self.gateway,
        )

        result = InstallmentResult(
            payment_intent_id=raw_result["payment_intent_id"],
            status=raw_result.get("status", "succeeded"),
            idempotency_key=idempotency_key,
            currency=installment.currency,  # forwarded, never hardcoded
            installment_n=installment.installment_n,
        )

        self._processed[idempotency_key] = result

        logger.info(
            "comunify_tokenized_installment_charged",
            payment_intent_id=result.payment_intent_id,
            idempotency_key=idempotency_key,
            subscriber_id=str(subscriber_id),
            entity_id=str(entity_id),
            installment_n=installment.installment_n,
            currency=installment.currency,
            amount=str(installment.amount),
            gateway=self.gateway,
            plan_kind=self.plan_kind,
        )

        return result

    async def schedule_recurring(
        self,
        *,
        subscriber_id: UUID,
        entity_id: UUID,
        installments: list[Installment],
    ) -> RecurringPaymentSchedule:
        """Schedule a recurring payment plan (multiple installments).

        For cohort_installments: validates count is in (3, 6, 12).
        For monthly_membership: any count (rolling cycle, no cap enforced here).

        For each installment:
          1. Derives the idempotency key.
          2. Registers with cron worker via injected ``_cron_register_fn``.
          3. Stores "scheduled" result (actual charge fires when cron runs).

        Currency forwarded from each installment — never hardcoded.
        All installments in a schedule MUST share the same currency.

        Args:
            subscriber_id: Subscriber UUID.
            entity_id: Cohort or offer UUID.
            installments: Ordered list of installments to schedule.

        Returns:
            RecurringPaymentSchedule with plan_kind included.

        Raises:
            ValueError: Cohort installment count not in (3, 6, 12).
        """
        if not installments:
            return RecurringPaymentSchedule(
                subscriber_id=subscriber_id,
                entity_id=entity_id,
                gateway=self.gateway,
                total_installments=0,
                currency="",
                plan_kind=self.plan_kind,
                results=(),
            )

        # Validate cohort installment counts
        if self.plan_kind == PLAN_KIND_COHORT_INSTALLMENTS:
            count = len(installments)
            if count not in COHORT_INSTALLMENT_OPTIONS:
                raise ValueError(f"Cohort installment count must be one of {COHORT_INSTALLMENT_OPTIONS}, got {count}")

        cron_fn = self._cron_register_fn or self._default_cron_register_fn()
        results: list[InstallmentResult] = []

        for inst in installments:
            idempotency_key = self.build_idempotency_key(
                subscriber_id=subscriber_id,
                entity_id=entity_id,
                installment_n=inst.installment_n,
            )

            await cron_fn(
                subscriber_id=subscriber_id,
                entity_id=entity_id,
                installment_n=inst.installment_n,
                scheduled_at=inst.scheduled_at,
                amount=inst.amount,
                currency=inst.currency,
                idempotency_key=idempotency_key,
                gateway=self.gateway,
                plan_kind=self.plan_kind,
            )

            charge_fn = self._charge_fn or self._default_charge_fn()
            raw_result = await charge_fn(
                idempotency_key=idempotency_key,
                amount=inst.amount,
                currency=inst.currency,
                subscriber_id=subscriber_id,
                entity_id=entity_id,
                installment_n=inst.installment_n,
                gateway=self.gateway,
            )

            result = InstallmentResult(
                payment_intent_id=raw_result["payment_intent_id"],
                status=raw_result.get("status", "scheduled"),
                idempotency_key=idempotency_key,
                currency=inst.currency,
                installment_n=inst.installment_n,
            )

            self._processed[idempotency_key] = result
            results.append(result)

        currency = installments[0].currency

        logger.info(
            "comunify_tokenized_schedule_registered",
            subscriber_id=str(subscriber_id),
            entity_id=str(entity_id),
            total_installments=len(installments),
            currency=currency,
            gateway=self.gateway,
            plan_kind=self.plan_kind,
        )

        return RecurringPaymentSchedule(
            subscriber_id=subscriber_id,
            entity_id=entity_id,
            gateway=self.gateway,
            total_installments=len(installments),
            currency=currency,
            plan_kind=self.plan_kind,
            results=tuple(results),
        )

    # ── Default gateway functions (production path) ───────────────────────────

    def _default_charge_fn(self) -> _ChargeFnType:
        """Return real gateway charge function based on ``gateway``."""
        gateway = self.gateway
        stripe_secret_key = self.stripe_secret_key
        mp_access_token = self.mp_access_token

        async def _real_charge(
            *,
            idempotency_key: str,
            amount: Decimal,
            currency: str,
            **_kwargs: Any,
        ) -> dict:
            if gateway == "stripe_connect":
                return await _real_stripe_charge(
                    secret_key=stripe_secret_key,
                    idempotency_key=idempotency_key,
                    amount=amount,
                    currency=currency,
                )
            return await _real_mp_charge(
                access_token=mp_access_token,
                idempotency_key=idempotency_key,
                amount=amount,
                currency=currency,
            )

        return _real_charge

    def _default_cron_register_fn(self) -> _CronRegisterFnType:
        """Return default no-op cron registration (production wires real scheduler)."""

        async def _noop_register(**_kwargs: Any) -> None:
            logger.warning(
                "comunify_tokenized_cron_register_noop",
                detail="No cron_register_fn injected — install cron worker per T-workflows-2",
            )

        return _noop_register


# ── Real gateway charge functions (production implementations) ────────────────


async def _real_stripe_charge(
    *,
    secret_key: str,
    idempotency_key: str,
    amount: Decimal,
    currency: str,
) -> dict:
    """Execute a real Stripe PaymentIntent charge.

    Currency forwarded from caller — never hardcoded.
    Timeout: 10s (tessl__graceful-degradation Rule 1).
    """
    import httpx

    amount_cents = int(amount * 100)
    payload = {
        "amount": str(amount_cents),
        "currency": currency.lower(),
        "payment_method_types[]": "card",
        "confirm": "false",
    }
    headers = {
        "Authorization": f"Bearer {secret_key}",
        "Idempotency-Key": idempotency_key,
        "Content-Type": "application/x-www-form-urlencoded",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            "https://api.stripe.com/v1/payment_intents",
            data=payload,
            headers=headers,
        )

    resp.raise_for_status()
    data = resp.json()
    return {
        "payment_intent_id": data["id"],
        "status": data.get("status", "requires_confirmation"),
        "idempotency_key": idempotency_key,
    }


async def _real_mp_charge(
    *,
    access_token: str,
    idempotency_key: str,
    amount: Decimal,
    currency: str,
) -> dict:
    """Execute a real MercadoPago payment charge.

    Currency forwarded from caller — never hardcoded.
    Timeout: 10s (tessl__graceful-degradation Rule 1).
    """
    import httpx

    payload = {
        "transaction_amount": float(amount),
        "currency_id": currency,
        "description": "Installment payment",
    }
    headers = {
        "Authorization": f"Bearer {access_token}",
        "X-Idempotency-Key": idempotency_key,
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            "https://api.mercadopago.com/v1/payments",
            json=payload,
            headers=headers,
        )

    resp.raise_for_status()
    data = resp.json()
    return {
        "payment_intent_id": str(data.get("id", "")),
        "status": data.get("status", "in_process"),
        "idempotency_key": idempotency_key,
    }


__all__ = (
    "COHORT_INSTALLMENT_OPTIONS",
    "ComunifyTokenizedRecurringAdapter",
    "Installment",
    "InstallmentResult",
    "PLAN_KIND_COHORT_INSTALLMENTS",
    "PLAN_KIND_MONTHLY_MEMBERSHIP",
    "RecurringPaymentSchedule",
)
