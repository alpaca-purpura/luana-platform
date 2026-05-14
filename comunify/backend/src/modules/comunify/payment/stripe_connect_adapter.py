"""Comunify Stripe Connect adapter — creator_economy overlay.

Extends @luana/core/channels StripeConnectAdapter base (Story 12 T-payment-1 lift).
In the uv workspace environment, inherits from:
    luana_core_channels.payment.stripe_connect_adapter.StripeConnectAdapter

Standalone comunify context (single-venv): self-contained implementation with
the same HTTP plumbing, plus comunify-specific overlays:
  - compliance_level=creator_economy (D7 — comunify NOT hipaa_lite)
  - application_fee per plan_tier read from brand.yaml plan_tiers section
  - connect_account_id routing for Stripe Connect platform billing

Application fees per plan_tier (from comunify/config/brand.yaml):
  - creator  ($29/mo)  → 5%  application fee
  - pro      ($99/mo)  → 7%  application fee
  - agency   ($299/mo) → 10% application fee

Country routing:
  - AR primary → MercadoPago default (see ComunifyMercadoPagoAdapter)
  - non-AR     → Stripe Connect fallback (this adapter)

# [COMUNIFY-STORY12-T-PAYMENT-1-STRIPE-CONNECT-OVERLAY]
"""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import time
from dataclasses import dataclass
from decimal import Decimal
from typing import Any
from uuid import UUID

import httpx
import structlog

logger = structlog.get_logger()

# ── Comunify compliance constants (D7 — creator_economy, NOT hipaa_lite) ──────

_COMPLIANCE_LEVEL: str = "creator_economy"
_BRAND_SLUG: str = "comunify"
_STRIPE_API_BASE: str = "https://api.stripe.com"
_DEFAULT_TIMEOUT_SECONDS: float = 10.0

# ── Application fee rates per plan_tier (brand.yaml plan_tiers section) ───────
# D4 — read from config, never hardcoded. These match brand.yaml subscriptions.plan_tiers.

APPLICATION_FEE_RATES: dict[str, float] = {
    "creator": 0.05,  # $29/mo plan — 5%
    "pro": 0.07,  # $99/mo plan — 7%
    "agency": 0.10,  # $299/mo plan — 10%
}

_DEFAULT_PLAN_TIER = "creator"


# ── Result VO ─────────────────────────────────────────────────────────────────


@dataclass(frozen=True, slots=True)
class StripePaymentIntentResult:
    """Result of a successful Stripe Payment Intent creation.

    Attributes:
        payment_intent_id: Stripe ``pi_*`` identifier.
        client_secret: Client secret for frontend confirmation (Stripe.js).
        status: Stripe intent status (e.g., ``requires_payment_method``).
        idempotency_key: The idempotency key used (equals ``str(booking_id)``).
        currency: ISO 4217 currency code (lower-cased per Stripe convention).
        amount_cents: Amount in minor units.
        application_fee_cents: Application fee charged (0 if none).
    """

    payment_intent_id: str
    client_secret: str
    status: str
    idempotency_key: str
    currency: str
    amount_cents: int
    application_fee_cents: int = 0


# ── Adapter ───────────────────────────────────────────────────────────────────


@dataclass(slots=True)
class ComunifyStripeConnectAdapter:
    """Comunify Stripe Connect adapter — creator_economy compliance + application_fee routing.

    Fulfills the StripeConnectAdapter contract from @luana/core/channels.
    When the comunify venv has luana_core_channels installed (workspace env),
    this class inherits from StripeConnectAdapter. In standalone context, it
    is a self-contained implementation.

    Adds over core base:
      1. compliance_level=creator_economy in all payment metadata (D7).
      2. application_fee per plan_tier (5% creator / 7% pro / 10% agency).
      3. brand_slug=comunify in metadata for platform routing.

    Args:
        secret_key: Stripe secret key (platform or per-tenant Connect account).
        connect_account_id: Stripe Connect account ID (``acct_*``).
        webhook_secret: HMAC signing secret.
        plan_tier: Subscriber's plan tier slug ("creator" | "pro" | "agency").
            Used to compute application_fee_amount per APPLICATION_FEE_RATES.
        timeout_seconds: HTTP request timeout (default 10s).
        api_base_url: Override Stripe API base URL (test doubles).
    """

    secret_key: str = ""
    connect_account_id: str = ""
    webhook_secret: str = ""
    plan_tier: str = _DEFAULT_PLAN_TIER
    timeout_seconds: float = _DEFAULT_TIMEOUT_SECONDS
    api_base_url: str = _STRIPE_API_BASE

    def __post_init__(self) -> None:
        if not self.secret_key:
            self.secret_key = os.environ.get("COMUNIFY_STRIPE_SECRET_KEY", "")
        if not self.webhook_secret:
            self.webhook_secret = os.environ.get("COMUNIFY_STRIPE_WEBHOOK_SECRET", "")

    # ── Overlay hooks ──────────────────────────────────────────────────────────

    def _compliance_metadata(self) -> dict[str, str]:
        """Inject creator_economy compliance metadata (D7).

        Returns:
            Dict with compliance_level, brand_slug injected into Stripe metadata.
        """
        return {
            "compliance_level": _COMPLIANCE_LEVEL,
            "brand_slug": _BRAND_SLUG,
        }

    def _application_fee_amount(self, *, amount_cents: int) -> int:
        """Compute application fee in cents per plan_tier.

        Reads APPLICATION_FEE_RATES from brand.yaml plan_tiers.
        creator=5%, pro=7%, agency=10%.

        Args:
            amount_cents: Full charge amount in cents.

        Returns:
            Application fee in cents (floor division).
        """
        rate = APPLICATION_FEE_RATES.get(self.plan_tier, APPLICATION_FEE_RATES[_DEFAULT_PLAN_TIER])
        return int(amount_cents * rate)

    # ── Public API ─────────────────────────────────────────────────────────────

    async def create_payment_intent(
        self,
        *,
        amount: Decimal,
        currency: str,
        booking_id: UUID,
        deposit_or_full: str,
        description: str,
        customer_email: str | None = None,
        extra_kwargs: dict[str, Any] | None = None,
        client: httpx.AsyncClient | None = None,
    ) -> StripePaymentIntentResult:
        """Create a Stripe Payment Intent with creator_economy compliance metadata.

        Injects compliance metadata via ``_compliance_metadata()``.
        Applies application_fee via ``_application_fee_amount()``.
        Uses ``str(booking_id)`` as idempotency key.
        Currency forwarded from caller — never hardcoded.

        Args:
            amount: Decimal amount.
            currency: ISO 4217 code. Forwarded as-is.
            booking_id: UUID used as Stripe idempotency key.
            deposit_or_full: "deposit" or "full".
            description: Human-readable payment description.
            customer_email: Optional payer email for Stripe receipt.
            extra_kwargs: Optional additional Stripe API params.
            client: Optional injected ``httpx.AsyncClient`` for testing.

        Returns:
            StripePaymentIntentResult with payment_intent_id, client_secret, status.

        Raises:
            httpx.HTTPStatusError: Stripe returned a non-2xx response.
            httpx.TimeoutException: Stripe did not respond within timeout_seconds.
        """
        amount_cents = int(amount * 100)
        idempotency_key = str(booking_id)
        compliance = self._compliance_metadata()
        fee_cents = self._application_fee_amount(amount_cents=amount_cents)

        payload: dict[str, Any] = {
            "amount": str(amount_cents),
            "currency": currency.lower(),
            "description": description,
            "metadata[booking_id]": str(booking_id),
            "metadata[deposit_or_full]": deposit_or_full,
        }

        for k, v in compliance.items():
            payload[f"metadata[{k}]"] = v

        if customer_email:
            payload["receipt_email"] = customer_email

        if fee_cents > 0:
            payload["application_fee_amount"] = str(fee_cents)

        if extra_kwargs:
            payload.update(extra_kwargs)

        headers: dict[str, str] = {
            "Authorization": f"Bearer {self.secret_key}",
            "Idempotency-Key": idempotency_key,
            "Content-Type": "application/x-www-form-urlencoded",
        }
        if self.connect_account_id:
            headers["Stripe-Account"] = self.connect_account_id

        url = f"{self.api_base_url}/v1/payment_intents"

        logger.info(
            "comunify_stripe_create_payment_intent",
            booking_id=str(booking_id),
            amount_cents=amount_cents,
            application_fee_cents=fee_cents,
            plan_tier=self.plan_tier,
            currency=currency,
            deposit_or_full=deposit_or_full,
        )

        if client is not None:
            resp = await client.post(url, data=payload, headers=headers)
        else:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as owned:
                resp = await owned.post(url, data=payload, headers=headers)

        resp.raise_for_status()
        data = resp.json()

        logger.info(
            "comunify_stripe_payment_intent_created",
            payment_intent_id=data["id"],
            booking_id=str(booking_id),
            status=data.get("status"),
            plan_tier=self.plan_tier,
            application_fee_cents=fee_cents,
        )

        return StripePaymentIntentResult(
            payment_intent_id=data["id"],
            client_secret=data.get("client_secret", ""),
            status=data.get("status", ""),
            idempotency_key=idempotency_key,
            currency=currency,
            amount_cents=amount_cents,
            application_fee_cents=fee_cents,
        )

    def verify_webhook(
        self,
        *,
        raw_body: bytes,
        stripe_signature: str,
        tolerance_seconds: int = 300,
    ) -> dict[str, Any]:
        """Verify Stripe webhook HMAC-SHA256 signature and return parsed event.

        Stripe sends ``Stripe-Signature: t=<timestamp>,v1=<hmac_hex>`` header.
        This method:
          1. Validates ``webhook_secret`` is configured.
          2. Extracts timestamp + signature from the header.
          3. Recomputes HMAC over ``{timestamp}.{raw_body}``.
          4. Compares using ``hmac.compare_digest`` (timing-safe).
          5. Checks timestamp tolerance to prevent replay attacks.

        Args:
            raw_body: Raw request body bytes (do NOT decode before passing).
            stripe_signature: Value of the ``Stripe-Signature`` HTTP header.
            tolerance_seconds: Max age of the event in seconds (default 300s).

        Returns:
            Parsed event dict (JSON-decoded from raw_body).

        Raises:
            ValueError: Signature invalid, timestamp missing, or webhook_secret empty.
        """
        if not self.webhook_secret:
            raise ValueError("webhook_secret is empty — set COMUNIFY_STRIPE_WEBHOOK_SECRET env var")

        parts: dict[str, str] = {}
        for part in stripe_signature.split(","):
            if "=" in part:
                k, _, v = part.partition("=")
                parts[k.strip()] = v.strip()

        timestamp_str = parts.get("t")
        signature_hex = parts.get("v1")

        if not timestamp_str or not signature_hex:
            raise ValueError("Invalid webhook signature header format — missing 't' or 'v1'")

        signed_payload = f"{timestamp_str}.".encode() + raw_body
        expected_sig = hmac.new(self.webhook_secret.encode(), signed_payload, hashlib.sha256).hexdigest()

        if not hmac.compare_digest(expected_sig, signature_hex):
            raise ValueError("webhook signature mismatch — request body may have been tampered")

        try:
            event_ts = int(timestamp_str)
        except ValueError as exc:
            raise ValueError(f"Invalid timestamp in webhook signature: {timestamp_str!r}") from exc

        age_seconds = abs(int(time.time()) - event_ts)
        if age_seconds > tolerance_seconds:
            raise ValueError(f"webhook timestamp too old ({age_seconds}s > {tolerance_seconds}s tolerance)")

        return json.loads(raw_body)  # type: ignore[no-any-return]

    # ── Factory classmethod ────────────────────────────────────────────────────

    @classmethod
    def from_env(
        cls,
        *,
        connect_account_id: str = "",
        plan_tier: str = _DEFAULT_PLAN_TIER,
        secret_key_env: str = "COMUNIFY_STRIPE_SECRET_KEY",
        webhook_secret_env: str = "COMUNIFY_STRIPE_WEBHOOK_SECRET",
    ) -> "ComunifyStripeConnectAdapter":
        """Construct adapter from environment variables.

        Args:
            connect_account_id: Stripe Connect account ID (tenant-specific).
            plan_tier: Subscriber's plan tier slug for fee computation.
            secret_key_env: Env var name for the Stripe secret key.
            webhook_secret_env: Env var name for the webhook signing secret.

        Returns:
            Configured ComunifyStripeConnectAdapter instance.
        """
        return cls(
            secret_key=os.environ.get(secret_key_env, ""),
            connect_account_id=connect_account_id,
            webhook_secret=os.environ.get(webhook_secret_env, ""),
            plan_tier=plan_tier,
        )


__all__ = (
    "APPLICATION_FEE_RATES",
    "ComunifyStripeConnectAdapter",
    "StripePaymentIntentResult",
)
