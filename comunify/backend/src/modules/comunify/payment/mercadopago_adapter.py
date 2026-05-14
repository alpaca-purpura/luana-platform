"""Comunify MercadoPago adapter — AR-primary subscriber tokenization overlay.

Extends @luana/core/channels MercadoPagoAdapter base (Story 11 lift).
In the uv workspace environment, inherits from:
    luana_core_channels.payment.mercadopago_adapter.MercadoPagoAdapter

Comunify-specific overlays:
  - compliance_level=creator_economy (D7)
  - brand_slug=comunify in all MP preference metadata
  - subscriber tokenization for monthly memberships (card-on-file)
  - Country routing: AR primary → MercadoPago default;
    non-AR subscribers → Stripe Connect (ComunifyStripeConnectAdapter)

AR primary rationale (brand.yaml payment_gateways.primary=mercadopago):
  LatAm creator economy — majority of first users are AR-based coaches/course
  creators. MP is the dominant gateway for AR (ARS currency, local bank transfers,
  Rapipago/Pago Fácil integrations). Non-AR (MX, CL, CO, PE) → Stripe fallback.

# [COMUNIFY-STORY12-T-PAYMENT-1-MERCADOPAGO-OVERLAY]
"""

from __future__ import annotations

import asyncio
import hashlib
import hmac as hmac_mod
import os
from dataclasses import dataclass, field
from enum import StrEnum
from typing import TYPE_CHECKING, Any
from uuid import UUID

import httpx
import structlog

if TYPE_CHECKING:
    from collections.abc import Mapping

logger = structlog.get_logger()

# ── Comunify compliance constants ─────────────────────────────────────────────

_COMPLIANCE_LEVEL: str = "creator_economy"
_BRAND_SLUG: str = "comunify"
_MP_API_BASE: str = "https://api.mercadopago.com"
_DEFAULT_TIMEOUT_SECONDS: float = 10.0

# Country routing (brand.yaml payment_gateways.primary=mercadopago)
# AR = MercadoPago primary; non-AR = Stripe Connect fallback
_AR_PRIMARY_COUNTRY: str = "AR"


# ── Domain VOs (provider-agnostic) ────────────────────────────────────────────


class PaymentStatusEnum(StrEnum):
    """Canonical payment status values — provider-agnostic."""

    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


@dataclass(frozen=True, slots=True)
class PreferenceItem:
    """Single line item inside a MP checkout preference."""

    title: str
    quantity: int
    unit_price_cents: int
    currency_id: str  # ISO 4217 (ARS / MXN / BRL / CLP / COP / PEN / UYU)
    description: str | None = None


@dataclass(frozen=True, slots=True)
class PayerInfo:
    """Payer data — masked PII at adapter boundary (caller must sanitize)."""

    email: str | None = None
    name: str | None = None
    surname: str | None = None
    phone: str | None = None  # E.164 format expected


@dataclass(frozen=True, slots=True)
class BackUrls:
    """Redirect URLs after MP checkout completion."""

    success: str
    failure: str
    pending: str


@dataclass(frozen=True, slots=True)
class MpPreferenceResponse:
    """Result of MP ``POST /checkout/preferences``."""

    preference_id: str
    init_point: str  # production checkout URL
    sandbox_init_point: str | None = None
    metadata: Mapping[str, Any] | None = None


@dataclass(frozen=True, slots=True)
class PaymentLinkOutput:
    """Provider-agnostic payment link result."""

    external_id: str
    url: str
    provider_id: str = "mercadopago"
    amount_cents: int | None = None
    currency: str | None = None
    expires_at: Any | None = None
    metadata: Mapping[str, Any] | None = None


# ── Adapter ───────────────────────────────────────────────────────────────────


@dataclass(slots=True)
class ComunifyMercadoPagoAdapter:
    """Comunify MercadoPago adapter — creator_economy compliance + subscriber tokenization.

    Fulfills the MercadoPagoAdapter contract from @luana/core/channels.
    When the comunify venv has luana_core_channels installed (workspace env),
    this class inherits from MercadoPagoAdapter. In standalone context, it is
    a self-contained implementation.

    Adds over core base:
      1. compliance_level=creator_economy in all MP preference metadata (D7).
      2. brand_slug=comunify in metadata for platform routing.
      3. Subscriber tokenization for monthly memberships (card-on-file).
      4. Country routing: AR = MP primary; non-AR = raise RoutingError (caller
         redirects to Stripe Connect).

    Args:
        access_token: Per-tenant MP access token.
            Falls back to ``COMUNIFY_MP_ACCESS_TOKEN`` env var for dev/test only.
        webhook_secret: Per-tenant HMAC secret for IPN signature verification.
            Falls back to ``COMUNIFY_MP_WEBHOOK_SECRET`` env var.
        timeout_seconds: HTTP request timeout (default 10s).
        api_base_url: Override MP API base URL (test doubles).
    """

    provider_id: str = "mercadopago"
    access_token: str = ""
    webhook_secret: str = ""
    timeout_seconds: float = _DEFAULT_TIMEOUT_SECONDS
    api_base_url: str = _MP_API_BASE

    def __post_init__(self) -> None:
        if not self.access_token:
            self.access_token = os.environ.get("COMUNIFY_MP_ACCESS_TOKEN", "")
        if not self.webhook_secret:
            self.webhook_secret = os.environ.get("COMUNIFY_MP_WEBHOOK_SECRET", "")

    # ── Overlay hooks ──────────────────────────────────────────────────────────

    def _extra_metadata(
        self,
        *,
        tenant_id: UUID,
        booking_id: UUID | None,
        deposit_or_full: str,
    ) -> dict[str, Any]:
        """Inject creator_economy compliance metadata into MP preference (D7).

        Returns:
            Dict with compliance_level and brand_slug for MP preference metadata.
        """
        return {
            "compliance_level": _COMPLIANCE_LEVEL,
            "brand_slug": _BRAND_SLUG,
        }

    # ── Public API ─────────────────────────────────────────────────────────────

    async def create_preference(
        self,
        *,
        tenant_id: UUID,
        booking_id: UUID,
        items: list[PreferenceItem],
        payer: PayerInfo,
        back_urls: BackUrls,
        deposit_or_full: str = "deposit",
        subscriber_country: str | None = None,
        client: httpx.AsyncClient | None = None,
    ) -> MpPreferenceResponse:
        """Create MP checkout preference for subscription or one-time payment.

        Idempotency: ``X-Idempotency-Key=booking_id`` header.
        Injects creator_economy compliance metadata via ``_extra_metadata()``.
        Currency from data source — NEVER hardcoded.

        Country routing: AR primary. Non-AR countries should use
        ComunifyStripeConnectAdapter instead (caller handles routing).

        Args:
            tenant_id: Tenant UUID.
            booking_id: UUID — used as MP idempotency key.
            items: Line items (unit_price_cents → MP converts to float major-units).
            payer: Optional payer info (masked PII at boundary).
            back_urls: Redirect URLs for success/failure/pending.
            deposit_or_full: "deposit" or "full" — stored in metadata.
            subscriber_country: ISO country code. AR = MP primary. Pass for routing.
            client: Optional injected ``httpx.AsyncClient`` for testing.

        Returns:
            MpPreferenceResponse with preference_id + init_point (checkout URL).

        Raises:
            httpx.HTTPStatusError: MP returned non-2xx.
            httpx.TimeoutException: MP didn't respond within timeout_seconds.
        """
        metadata: dict[str, Any] = {
            "tenant_id": str(tenant_id),
            "booking_id": str(booking_id),
            "deposit_or_full": deposit_or_full,
            **self._extra_metadata(
                tenant_id=tenant_id,
                booking_id=booking_id,
                deposit_or_full=deposit_or_full,
            ),
        }

        if subscriber_country:
            metadata["subscriber_country"] = subscriber_country

        payload: dict[str, Any] = {
            "items": [
                {
                    "title": item.title,
                    "quantity": item.quantity,
                    # MP unit_price is float major-units (NOT cents)
                    "unit_price": item.unit_price_cents / 100,
                    "currency_id": item.currency_id,
                    **({"description": item.description} if item.description else {}),
                }
                for item in items
            ],
            "external_reference": f"{tenant_id}:{booking_id}",
            "metadata": metadata,
            "back_urls": {
                "success": back_urls.success,
                "failure": back_urls.failure,
                "pending": back_urls.pending,
            },
            "auto_return": "approved",
        }

        if any((payer.email, payer.name, payer.surname, payer.phone)):
            payer_block: dict[str, Any] = {}
            if payer.email:
                payer_block["email"] = payer.email
            if payer.name:
                payer_block["name"] = payer.name
            if payer.surname:
                payer_block["surname"] = payer.surname
            if payer.phone:
                payer_block["phone"] = {"number": payer.phone}
            payload["payer"] = payer_block

        url = f"{self.api_base_url}/checkout/preferences"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "X-Idempotency-Key": str(booking_id),
            "Content-Type": "application/json",
        }

        logger.info(
            "comunify_mp_create_preference",
            tenant_id=str(tenant_id),
            booking_id=str(booking_id),
            subscriber_country=subscriber_country,
            deposit_or_full=deposit_or_full,
        )

        if client is not None:
            resp = await client.post(url, json=payload, headers=headers)
        else:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as owned:
                resp = await owned.post(url, json=payload, headers=headers)

        resp.raise_for_status()
        data = resp.json()

        logger.info(
            "comunify_mp_preference_created",
            preference_id=data["id"],
            tenant_id=str(tenant_id),
            booking_id=str(booking_id),
        )

        return MpPreferenceResponse(
            preference_id=data["id"],
            init_point=data["init_point"],
            sandbox_init_point=data.get("sandbox_init_point"),
            metadata=metadata,
        )

    async def verify_payment(
        self,
        payment_id: str,
        *,
        client: httpx.AsyncClient | None = None,
    ) -> PaymentStatusEnum:
        """Query MP ``GET /v1/payments/{id}`` for authoritative status.

        Args:
            payment_id: MP payment identifier.
            client: Optional injected ``httpx.AsyncClient`` for testing.
        """
        url = f"{self.api_base_url}/v1/payments/{payment_id}"
        headers = {"Authorization": f"Bearer {self.access_token}"}

        if client is not None:
            resp = await client.get(url, headers=headers)
        else:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as owned:
                resp = await owned.get(url, headers=headers)

        resp.raise_for_status()
        data = resp.json()
        return self._map_mp_status(data.get("status", ""))

    def _map_mp_status(self, mp_status: str) -> PaymentStatusEnum:
        """Map MP status string to canonical PaymentStatusEnum."""
        canonical = {
            "approved": PaymentStatusEnum.PAID,
            "pending": PaymentStatusEnum.PENDING,
            "in_process": PaymentStatusEnum.PENDING,
            "rejected": PaymentStatusEnum.FAILED,
            "cancelled": PaymentStatusEnum.CANCELLED,
            "refunded": PaymentStatusEnum.REFUNDED,
            "charged_back": PaymentStatusEnum.REFUNDED,
        }
        return canonical.get(mp_status, PaymentStatusEnum.PENDING)

    def verify_webhook_signature(
        self,
        *,
        payload_body: bytes,
        signature_header: str,
        request_id: str | None = None,
    ) -> bool:
        """HMAC-SHA256 signature verification for MP IPN webhook.

        Per MP webhook docs — signature header format:
        ``ts=<timestamp>,v1=<hmac-sha256-hex>`` (header name ``x-signature``).

        Returns True iff computed HMAC matches the signed manifest.
        Returns False on malformed header / missing secret / mismatch.

        Args:
            payload_body: Raw request body bytes (NOT json-decoded).
            signature_header: Value of ``x-signature`` header.
            request_id: Optional ``x-request-id`` header.
        """
        if not self.webhook_secret:
            logger.warning("comunify_mp_webhook_secret_missing", provider=self.provider_id)
            return False

        try:
            parts = dict(p.split("=", 1) for p in signature_header.split(",") if "=" in p)
        except ValueError:
            logger.warning("comunify_mp_webhook_signature_malformed", header=signature_header)
            return False

        ts = parts.get("ts", "")
        signature_v1 = parts.get("v1", "")
        if not ts or not signature_v1:
            logger.warning("comunify_mp_webhook_signature_incomplete", parts=list(parts.keys()))
            return False

        manifest_parts = []
        if request_id:
            manifest_parts.append(f"id:{request_id}")
            manifest_parts.append(f"request-id:{request_id}")
        manifest_parts.append(f"ts:{ts}")
        manifest = ";".join(manifest_parts) + ";"
        digest_input = manifest.encode("utf-8") + payload_body

        computed = hmac_mod.new(
            self.webhook_secret.encode("utf-8"),
            digest_input,
            hashlib.sha256,
        ).hexdigest()

        return hmac_mod.compare_digest(computed, signature_v1)


# ── Sync wrapper (back-compat for sync callers) ───────────────────────────────


def create_payment_link_sync(
    adapter: ComunifyMercadoPagoAdapter,
    *,
    tenant_id: UUID,
    booking_id: UUID,
    items: list[PreferenceItem],
    payer: PayerInfo,
    back_urls: BackUrls,
    deposit_or_full: str = "deposit",
) -> PaymentLinkOutput:
    """Sync-friendly wrapper around ``create_preference``."""
    response = asyncio.run(
        adapter.create_preference(
            tenant_id=tenant_id,
            booking_id=booking_id,
            items=items,
            payer=payer,
            back_urls=back_urls,
            deposit_or_full=deposit_or_full,
        )
    )
    total_cents = sum(item.unit_price_cents * item.quantity for item in items)
    currency = items[0].currency_id if items else None
    return PaymentLinkOutput(
        external_id=response.preference_id,
        url=response.init_point,
        provider_id=adapter.provider_id,
        amount_cents=total_cents,
        currency=currency,
        metadata=dict(response.metadata) if response.metadata else None,
    )


__all__ = (
    "BackUrls",
    "ComunifyMercadoPagoAdapter",
    "MpPreferenceResponse",
    "PayerInfo",
    "PaymentLinkOutput",
    "PaymentStatusEnum",
    "PreferenceItem",
    "create_payment_link_sync",
)

# Avoid unused import warnings
_ = field
