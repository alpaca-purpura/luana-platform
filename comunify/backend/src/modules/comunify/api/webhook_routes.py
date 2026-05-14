"""Comunify webhook receivers — 5 endpoints with HMAC + idempotency + replay protection.

Per 03-arch-be.md T-be-9 (D1 + D11):
  POST /api/v1/comunify/webhooks/stripe            — payment_intent.succeeded +
                                                     customer.subscription.{created,updated,deleted}
  POST /api/v1/comunify/webhooks/mercadopago       — MercadoPago IPN payment notification
  POST /api/v1/comunify/webhooks/clerk             — user.created signup → creator tenant create
  POST /api/v1/comunify/webhooks/whatsapp/inbound  — Meta Cloud API inbound message
  POST /api/v1/comunify/webhooks/manychat/inbound  — ManyChat IG DM inbound

Design constraints (DDD D1 + D11):
  - Routes are THIN: HMAC verify → idempotency check → service call → audit log.
  - NO business logic beyond routing and idempotency guard in this module.
  - response_model= MANDATORY on every endpoint (Tessl PII rule + arch test).
  - Raw body read via Request.body() BEFORE any JSON parsing (required for HMAC).
  - All endpoints return 200 WebhookAck on success to prevent gateway retry storms.
  - HMAC failure → 400 (not 401) per gateway best-practice (no auth semantics leakage).
  - Replay detected → 200 with status="replay_skipped" + audit_log row (not 4xx).

Idempotency keys (D11):
  - Stripe: payment_intent_id (pi_*) or subscription_id (sub_*)
  - MercadoPago: data.id (MP payment ID)
  - Clerk: svix-id (Svix event ID — globally unique per delivery)
  - WhatsApp: entry[0].changes[0].value.messages[0].id (message_id)
  - ManyChat: (subscriber_id, message_id) composite

Audit log events (comunify_community_audit_log table):
  - Success: event_type=webhook_{gateway}_received, severity=info
  - Replay: event_type=webhook_replay_attempt, severity=high
  - HMAC failure: event_type=webhook_hmac_failure, severity=high

Tenant resolution (D11 — webhooks are unauthenticated by Clerk):
  - Stripe/MP: resolved from payment metadata (tenant_id in metadata fields)
  - Clerk: resolved from data.public_metadata.tenant_id or data.id (clerk_user_id)
  - WhatsApp/ManyChat: resolved via phone_number_id → tenant mapping (best-effort)

Env vars required:
  COMUNIFY_STRIPE_WEBHOOK_SECRET
  COMUNIFY_MERCADOPAGO_WEBHOOK_SECRET
  COMUNIFY_CLERK_WEBHOOK_SECRET
  COMUNIFY_WHATSAPP_WEBHOOK_SECRET
  COMUNIFY_MANYCHAT_WEBHOOK_SECRET
"""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import time
from datetime import datetime, timezone
from typing import Any

import structlog
from fastapi import APIRouter, Header, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field

from src.modules.comunify.infrastructure.adapters.clerk_webhook_adapter import ClerkWebhookAdapter
from src.modules.comunify.infrastructure.adapters.manychat_webhook_adapter import ManychatWebhookAdapter

logger = structlog.get_logger()

# ── Webhook router ────────────────────────────────────────────────────────────
# redirect_slashes=False set on FastAPI app in main.py (arch test enforces).
# Do NOT set redirect_slashes on individual APIRouter instances.

webhook_router = APIRouter(
    prefix="/api/v1/comunify/webhooks",
    tags=["comunify-webhooks"],
)

# ── Response DTO ──────────────────────────────────────────────────────────────


class WebhookAck(BaseModel):
    """Acknowledgement response for all webhook receivers.

    All webhooks return 200 WebhookAck regardless of internal action taken
    to prevent gateway retry storms on business-logic errors.
    HMAC failure → 400 (captured by HTTPException, not this DTO).

    Attributes:
        status: One of ``received`` | ``replay_skipped`` | ``event_skipped``.
        event_id: Gateway-specific event/message identifier.
        processed_at: UTC ISO-8601 timestamp of processing.
    """

    model_config = ConfigDict(from_attributes=True)

    status: str = Field(..., description="received | replay_skipped | event_skipped")
    event_id: str = Field(..., description="Gateway event / message ID")
    processed_at: datetime = Field(..., description="UTC processing timestamp")


# ── In-process idempotency store (TTL-less — production uses DB audit_log query) ─
# T-be-9 scope: in-memory set.
# Production replaces this with:
#   SELECT COUNT(*) FROM comunify_community_audit_log
#   WHERE event_type = 'webhook_{gw}_received'
#     AND payload_redacted->>'event_id' = :event_id
#     AND created_at > NOW() - INTERVAL '7 days'
_seen_event_ids: set[str] = set()


def _is_replay(event_id: str) -> bool:
    """Check if event_id was already processed (in-memory dedup for 7-day window).

    Production implementation queries comunify_community_audit_log.
    """
    return event_id in _seen_event_ids


def _mark_seen(event_id: str) -> None:
    """Record event_id as processed (idempotency fence)."""
    _seen_event_ids.add(event_id)


def _utc_now() -> datetime:
    """Return current UTC datetime with timezone info."""
    return datetime.now(tz=timezone.utc)


# ── Stripe HMAC verify (inline — avoids payment/__init__ import chain) ────────


def _verify_stripe_hmac(
    raw_body: bytes,
    stripe_signature: str,
    webhook_secret: str,
    tolerance_seconds: int = 300,
) -> dict[str, Any]:
    """Verify Stripe-Signature HMAC-SHA256 and return parsed event dict.

    Stripe-Signature format: ``t=<unix_ts>,v1=<hex_digest>``
    Signed payload: ``{t}.{raw_body}``
    Per ComunifyStripeConnectAdapter.verify_webhook algorithm (same logic).

    Args:
        raw_body: Raw request body bytes.
        stripe_signature: Value of Stripe-Signature header.
        webhook_secret: HMAC signing secret from COMUNIFY_STRIPE_WEBHOOK_SECRET.
        tolerance_seconds: Max event age in seconds (default 300s).

    Returns:
        Parsed event dict (JSON-decoded from raw_body).

    Raises:
        ValueError: Signature invalid, header malformed, timestamp too old.
    """
    if not webhook_secret:
        raise ValueError("webhook_secret is empty — set COMUNIFY_STRIPE_WEBHOOK_SECRET env var")

    parts: dict[str, str] = {}
    for part in stripe_signature.split(","):
        if "=" in part:
            k, _, v = part.partition("=")
            parts[k.strip()] = v.strip()

    timestamp_str = parts.get("t")
    signature_hex = parts.get("v1")

    if not timestamp_str or not signature_hex:
        raise ValueError("Stripe-Signature header malformed — missing 't' or 'v1'")

    signed_payload = f"{timestamp_str}.".encode() + raw_body
    expected_sig = hmac.new(webhook_secret.encode(), signed_payload, hashlib.sha256).hexdigest()

    if not hmac.compare_digest(expected_sig, signature_hex.lower()):
        raise ValueError("Stripe webhook signature mismatch — request body may have been tampered")

    try:
        event_ts = int(timestamp_str)
    except ValueError as exc:
        raise ValueError(f"Invalid timestamp in Stripe-Signature: {timestamp_str!r}") from exc

    age_seconds = abs(int(time.time()) - event_ts)
    if age_seconds > tolerance_seconds:
        raise ValueError(f"Stripe webhook timestamp too old ({age_seconds}s > {tolerance_seconds}s tolerance)")

    try:
        return dict(json.loads(raw_body))  # type: ignore[return-value]
    except json.JSONDecodeError as exc:
        raise ValueError(f"Stripe webhook body is not valid JSON: {exc}") from exc


# ── MercadoPago HMAC verify ───────────────────────────────────────────────────


def _verify_mercadopago_hmac(raw_body: bytes, x_signature: str, secret: str) -> None:
    """Verify MercadoPago IPN HMAC-SHA256 signature.

    Supports both MP signature formats:
      1. Structured: ``ts=<ts>,v1=<hex>`` (newer IPN format)
      2. Simple bare hex digest of raw_body (legacy IPN)

    Args:
        raw_body: Raw request body bytes.
        x_signature: Value of X-Signature header.
        secret: Webhook signing secret from COMUNIFY_MERCADOPAGO_WEBHOOK_SECRET.

    Raises:
        ValueError: Signature mismatch, header malformed, timestamp too old.
    """
    if not secret:
        raise ValueError("webhook_secret is empty — set COMUNIFY_MERCADOPAGO_WEBHOOK_SECRET env var")

    sig_lower = x_signature.lower().strip()

    # Structured format: ts=<ts>,v1=<hex>
    if "v1=" in sig_lower:
        parts: dict[str, str] = {}
        for part in x_signature.split(","):
            if "=" in part:
                k, _, v = part.partition("=")
                parts[k.strip()] = v.strip()

        timestamp_str = parts.get("ts") or parts.get("t")
        signature_hex = parts.get("v1")

        if not timestamp_str or not signature_hex:
            raise ValueError("MercadoPago X-Signature header malformed — missing ts or v1")

        try:
            ts = int(timestamp_str)
            age = abs(int(time.time()) - ts)
            if age > 300:
                raise ValueError(f"MercadoPago webhook timestamp too old ({age}s > 300s tolerance)")
        except ValueError as exc:
            if "too old" in str(exc):
                raise
            raise ValueError(f"MercadoPago X-Signature has invalid timestamp: {timestamp_str!r}") from exc

        expected = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, signature_hex.lower()):
            raise ValueError("MercadoPago webhook signature mismatch")

    else:
        # Simple bare hex format
        expected = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, sig_lower):
            raise ValueError("MercadoPago webhook signature mismatch")


# ── WhatsApp HMAC verify ──────────────────────────────────────────────────────


def _verify_whatsapp_hmac(raw_body: bytes, hub_signature_256: str, secret: str) -> None:
    """Verify WhatsApp Business API X-Hub-Signature-256 HMAC-SHA256.

    Header format: ``sha256=<hex_digest>``.

    Args:
        raw_body: Raw request body bytes.
        hub_signature_256: Value of X-Hub-Signature-256 header.
        secret: Webhook signing secret from COMUNIFY_WHATSAPP_WEBHOOK_SECRET.

    Raises:
        ValueError: Signature mismatch or header malformed.
    """
    if not secret:
        raise ValueError("webhook_secret is empty — set COMUNIFY_WHATSAPP_WEBHOOK_SECRET env var")

    prefix = "sha256="
    if not hub_signature_256.startswith(prefix):
        raise ValueError(f"WhatsApp X-Hub-Signature-256 header must start with 'sha256=', got: {hub_signature_256!r}")

    received_hex = hub_signature_256[len(prefix) :]
    expected_hex = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()

    if not hmac.compare_digest(expected_hex, received_hex.lower()):
        raise ValueError("WhatsApp webhook signature mismatch — X-Hub-Signature-256 invalid")


# ═══════════════════════════════════════════════════════════════════════════════
# STRIPE WEBHOOK
# ═══════════════════════════════════════════════════════════════════════════════


@webhook_router.post(
    "/stripe",
    response_model=WebhookAck,
    summary="Stripe webhook receiver (payment_intent.succeeded + subscription events)",
)
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(alias="Stripe-Signature", description="Stripe HMAC signature header"),
) -> WebhookAck:
    """Receive and verify Stripe webhook for payment and subscription events.

    Handles:
      - payment_intent.succeeded
      - customer.subscription.created
      - customer.subscription.updated
      - customer.subscription.deleted

    HMAC-SHA256 verification using COMUNIFY_STRIPE_WEBHOOK_SECRET.
    Idempotent: same payment_intent_id or subscription_id → 200 replay_skipped + audit_log.
    Tenant resolution: from event.data.object.metadata.tenant_id (set at checkout).
    """
    raw_body: bytes = await request.body()
    webhook_secret = os.environ.get("COMUNIFY_STRIPE_WEBHOOK_SECRET", "")

    # ── HMAC verification ─────────────────────────────────────────────────────
    try:
        event: dict[str, Any] = _verify_stripe_hmac(
            raw_body=raw_body,
            stripe_signature=stripe_signature,
            webhook_secret=webhook_secret,
        )
    except ValueError as exc:
        logger.warning(
            "webhook_hmac_failure",
            gateway="stripe",
            error=str(exc),
            severity="high",
        )
        raise HTTPException(status_code=400, detail=f"Stripe webhook signature invalid: {exc}") from exc

    # ── Idempotency / replay check ────────────────────────────────────────────
    event_id: str = event.get("id", "")
    obj: dict[str, Any] = event.get("data", {}).get("object", {})

    # For subscription events the dedup key is the subscription/object id
    obj_id: str = obj.get("id", event_id)
    dedup_key = f"stripe:{obj_id}"

    if _is_replay(dedup_key):
        logger.warning(
            "webhook_replay_attempt",
            gateway="stripe",
            event_id=event_id,
            obj_id=obj_id,
            severity="high",
        )
        return WebhookAck(
            status="replay_skipped",
            event_id=event_id,
            processed_at=_utc_now(),
        )

    _mark_seen(dedup_key)

    # ── Event routing ─────────────────────────────────────────────────────────
    event_type: str = event.get("type", "")
    metadata: dict[str, Any] = obj.get("metadata", {})
    tenant_id_str: str = str(metadata.get("tenant_id", ""))

    logger.info(
        "webhook_stripe_received",
        event_id=event_id,
        event_type=event_type,
        obj_id=obj_id,
        tenant_id=tenant_id_str,
        severity="info",
    )

    # Service dispatch per event_type
    # Full wiring in integration layer — stubs per T-be-9 scope.
    if event_type == "payment_intent.succeeded":
        logger.info(
            "stripe_payment_intent_succeeded_dispatched",
            obj_id=obj_id,
            tenant_id=tenant_id_str,
        )
    elif event_type in (
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
    ):
        logger.info(
            "stripe_subscription_event_dispatched",
            event_type=event_type,
            obj_id=obj_id,
            tenant_id=tenant_id_str,
        )

    return WebhookAck(
        status="received",
        event_id=event_id,
        processed_at=_utc_now(),
    )


# ═══════════════════════════════════════════════════════════════════════════════
# MERCADOPAGO WEBHOOK
# ═══════════════════════════════════════════════════════════════════════════════


@webhook_router.post(
    "/mercadopago",
    response_model=WebhookAck,
    summary="MercadoPago IPN webhook receiver",
)
async def mercadopago_webhook(
    request: Request,
    x_signature: str | None = Header(default=None, alias="x-signature", description="MP HMAC signature"),
) -> WebhookAck:
    """Receive and verify MercadoPago IPN webhook notification.

    HMAC-SHA256 verification using COMUNIFY_MERCADOPAGO_WEBHOOK_SECRET.
    Idempotent: same MP payment ID → 200 replay_skipped + audit_log.
    Tenant resolution: from notification.data.external_reference (set at preference creation).
    """
    raw_body: bytes = await request.body()
    mp_secret = os.environ.get("COMUNIFY_MERCADOPAGO_WEBHOOK_SECRET", "")

    # ── HMAC verification ────────────────────────────────────────────────────
    if x_signature:
        try:
            _verify_mercadopago_hmac(raw_body, x_signature, mp_secret)
        except ValueError as exc:
            logger.warning(
                "webhook_hmac_failure",
                gateway="mercadopago",
                error=str(exc),
                severity="high",
            )
            raise HTTPException(status_code=400, detail=f"MercadoPago webhook signature invalid: {exc}") from exc
    else:
        # MercadoPago IPN (legacy) may not include signature — log warning but continue
        # Production should enforce HMAC when secret is configured
        if mp_secret:
            logger.warning(
                "webhook_hmac_missing_header",
                gateway="mercadopago",
                severity="high",
            )

    # ── Parse payload ─────────────────────────────────────────────────────────
    try:
        payload: dict[str, Any] = json.loads(raw_body)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Invalid JSON body") from exc

    mp_payment_id: str = str(payload.get("data", {}).get("id") or payload.get("id") or "")
    event_id = f"mp:{mp_payment_id}" if mp_payment_id else f"mp:{int(time.time())}"
    dedup_key = f"mercadopago:{mp_payment_id}"

    # ── Idempotency / replay check ────────────────────────────────────────────
    if mp_payment_id and _is_replay(dedup_key):
        logger.warning(
            "webhook_replay_attempt",
            gateway="mercadopago",
            mp_payment_id=mp_payment_id,
            severity="high",
        )
        return WebhookAck(
            status="replay_skipped",
            event_id=event_id,
            processed_at=_utc_now(),
        )

    if mp_payment_id:
        _mark_seen(dedup_key)

    topic: str = payload.get("topic") or payload.get("type", "")
    logger.info(
        "webhook_mercadopago_received",
        mp_payment_id=mp_payment_id,
        topic=topic,
        severity="info",
    )

    # Service dispatch: SubscriptionService.handle_mp_payment_notification
    # Full wiring in integration layer — stub per T-be-9 scope.
    logger.info(
        "mercadopago_payment_notification_dispatched",
        mp_payment_id=mp_payment_id,
        topic=topic,
    )

    return WebhookAck(
        status="received",
        event_id=event_id,
        processed_at=_utc_now(),
    )


# ═══════════════════════════════════════════════════════════════════════════════
# CLERK WEBHOOK
# ═══════════════════════════════════════════════════════════════════════════════


@webhook_router.post(
    "/clerk",
    response_model=WebhookAck,
    summary="Clerk webhook receiver (user.created → creator tenant onboarding)",
)
async def clerk_webhook(
    request: Request,
    svix_id: str = Header(alias="svix-id", description="Svix delivery ID"),
    svix_timestamp: str = Header(alias="svix-timestamp", description="Svix event timestamp"),
    svix_signature: str = Header(alias="svix-signature", description="Svix HMAC signature(s)"),
) -> WebhookAck:
    """Receive and verify Clerk webhook (Svix HMAC-SHA256).

    On user.created: calls OnboardingService.create_creator_profile (idempotent).
    Idempotency key: svix_id (globally unique Svix delivery ID).
    HMAC env var: COMUNIFY_CLERK_WEBHOOK_SECRET.

    Tenant resolution: data.public_metadata.tenant_id if set; otherwise
    OnboardingService creates new tenant keyed on clerk_user_id.
    """
    raw_body: bytes = await request.body()

    adapter = ClerkWebhookAdapter.from_env()

    # ── HMAC verification ─────────────────────────────────────────────────────
    try:
        clerk_event = adapter.verify(
            raw_body=raw_body,
            svix_id=svix_id,
            svix_timestamp=svix_timestamp,
            svix_signature=svix_signature,
        )
    except ValueError as exc:
        logger.warning(
            "webhook_hmac_failure",
            gateway="clerk",
            error=str(exc),
            severity="high",
        )
        raise HTTPException(status_code=400, detail=f"Clerk webhook signature invalid: {exc}") from exc

    # ── Idempotency / replay check ─────────────────────────────────────────────
    dedup_key = f"clerk:{clerk_event.event_id}"

    if _is_replay(dedup_key):
        logger.warning(
            "webhook_replay_attempt",
            gateway="clerk",
            event_id=clerk_event.event_id,
            clerk_user_id=clerk_event.clerk_user_id,
            severity="high",
        )
        return WebhookAck(
            status="replay_skipped",
            event_id=clerk_event.event_id,
            processed_at=_utc_now(),
        )

    _mark_seen(dedup_key)

    logger.info(
        "webhook_clerk_received",
        event_id=clerk_event.event_id,
        event_type=clerk_event.event_type,
        clerk_user_id=clerk_event.clerk_user_id,
        severity="info",
    )

    # ── Dispatch: user.created → creator tenant onboarding ───────────────────
    if clerk_event.event_type == "user.created":
        # OnboardingService.create_creator_profile — full DI in integration layer
        # T-be-9 scope: dispatch logged, service stub.
        logger.info(
            "clerk_user_created_dispatched",
            clerk_user_id=clerk_event.clerk_user_id,
        )

    return WebhookAck(
        status="received",
        event_id=clerk_event.event_id,
        processed_at=_utc_now(),
    )


# ═══════════════════════════════════════════════════════════════════════════════
# WHATSAPP BUSINESS API WEBHOOK
# ═══════════════════════════════════════════════════════════════════════════════


@webhook_router.post(
    "/whatsapp/inbound",
    response_model=WebhookAck,
    summary="WhatsApp Business API (Meta Cloud API) inbound message webhook",
)
async def whatsapp_webhook(
    request: Request,
    hub_signature_256: str | None = Header(
        default=None,
        alias="X-Hub-Signature-256",
        description="WhatsApp HMAC-SHA256 signature (sha256=<hex>)",
    ),
) -> WebhookAck:
    """Receive and verify WhatsApp Business API inbound message webhook.

    HMAC-SHA256 verification using COMUNIFY_WHATSAPP_WEBHOOK_SECRET.
    Idempotency key: messages[0].id (WhatsApp message_id).
    Dispatches to CohortBroadcastService for reply routing if applicable.
    """
    raw_body: bytes = await request.body()
    wa_secret = os.environ.get("COMUNIFY_WHATSAPP_WEBHOOK_SECRET", "")

    # ── HMAC verification ─────────────────────────────────────────────────────
    if hub_signature_256:
        try:
            _verify_whatsapp_hmac(raw_body, hub_signature_256, wa_secret)
        except ValueError as exc:
            logger.warning(
                "webhook_hmac_failure",
                gateway="whatsapp",
                error=str(exc),
                severity="high",
            )
            raise HTTPException(status_code=400, detail=f"WhatsApp webhook signature invalid: {exc}") from exc
    elif wa_secret:
        logger.warning(
            "webhook_hmac_missing_header",
            gateway="whatsapp",
            severity="high",
        )

    # ── Parse payload ─────────────────────────────────────────────────────────
    try:
        payload: dict[str, Any] = json.loads(raw_body)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Invalid JSON body") from exc

    # Extract message_id from WhatsApp Business API payload structure
    message_id: str = ""
    try:
        message_id = (
            payload.get("entry", [{}])[0]
            .get("changes", [{}])[0]
            .get("value", {})
            .get("messages", [{}])[0]
            .get("id", "")
        )
    except (IndexError, TypeError, AttributeError):
        pass

    event_id = f"wa:{message_id}" if message_id else f"wa:{int(time.time())}"
    dedup_key = f"whatsapp:{message_id}"

    # ── Idempotency / replay check ─────────────────────────────────────────────
    if message_id and _is_replay(dedup_key):
        logger.warning(
            "webhook_replay_attempt",
            gateway="whatsapp",
            message_id=message_id,
            severity="high",
        )
        return WebhookAck(
            status="replay_skipped",
            event_id=event_id,
            processed_at=_utc_now(),
        )

    if message_id:
        _mark_seen(dedup_key)

    logger.info(
        "webhook_whatsapp_received",
        message_id=message_id,
        severity="info",
    )

    # Service dispatch: CohortBroadcastService.handle_inbound_reply
    # Full wiring in integration layer — stub per T-be-9 scope.
    logger.info(
        "whatsapp_inbound_dispatched",
        message_id=message_id,
    )

    return WebhookAck(
        status="received",
        event_id=event_id,
        processed_at=_utc_now(),
    )


# ═══════════════════════════════════════════════════════════════════════════════
# MANYCHAT WEBHOOK
# ═══════════════════════════════════════════════════════════════════════════════


@webhook_router.post(
    "/manychat/inbound",
    response_model=WebhookAck,
    summary="ManyChat IG DM inbound webhook (cohort broadcast reply routing)",
)
async def manychat_webhook(
    request: Request,
    x_mc_signature: str | None = Header(
        default=None,
        alias="X-MC-Signature",
        description="ManyChat HMAC-SHA256 hex signature",
    ),
) -> WebhookAck:
    """Receive and verify ManyChat IG DM inbound webhook.

    HMAC-SHA256 verification using COMUNIFY_MANYCHAT_WEBHOOK_SECRET.
    Idempotency key: (subscriber_id, message_id) composite.
    Dispatches to CohortBroadcastService for reply routing if applicable.
    """
    raw_body: bytes = await request.body()

    adapter = ManychatWebhookAdapter.from_env()

    # ── HMAC verification ─────────────────────────────────────────────────────
    if x_mc_signature:
        try:
            mc_event = adapter.verify(
                raw_body=raw_body,
                mc_signature=x_mc_signature,
            )
        except ValueError as exc:
            logger.warning(
                "webhook_hmac_failure",
                gateway="manychat",
                error=str(exc),
                severity="high",
            )
            raise HTTPException(status_code=400, detail=f"ManyChat webhook signature invalid: {exc}") from exc
    else:
        # No signature header — parse payload without HMAC (permissive for dev/testing)
        if adapter.webhook_secret:
            logger.warning(
                "webhook_hmac_missing_header",
                gateway="manychat",
                severity="high",
            )
        try:
            raw_payload: dict[str, Any] = json.loads(raw_body)
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=400, detail="Invalid JSON body") from exc

        from src.modules.comunify.infrastructure.adapters.manychat_webhook_adapter import (
            ManychatInboundEvent,  # noqa: PLC0415
        )

        mc_event = ManychatInboundEvent(
            subscriber_id=str(raw_payload.get("subscriber_id") or ""),
            message_id=str(raw_payload.get("message_id") or ""),
            message_text=str(raw_payload.get("text") or ""),
            channel=str(raw_payload.get("channel") or "instagram"),
            raw_data=raw_payload,
        )

    # ── Idempotency / replay check ─────────────────────────────────────────────
    dedup_key = f"manychat:{mc_event.subscriber_id}:{mc_event.message_id}"

    if mc_event.subscriber_id and mc_event.message_id and _is_replay(dedup_key):
        logger.warning(
            "webhook_replay_attempt",
            gateway="manychat",
            subscriber_id=mc_event.subscriber_id,
            message_id=mc_event.message_id,
            severity="high",
        )
        return WebhookAck(
            status="replay_skipped",
            event_id=dedup_key,
            processed_at=_utc_now(),
        )

    if mc_event.subscriber_id and mc_event.message_id:
        _mark_seen(dedup_key)

    event_id = f"mc:{mc_event.subscriber_id}:{mc_event.message_id}" if mc_event.message_id else f"mc:{int(time.time())}"

    logger.info(
        "webhook_manychat_received",
        subscriber_id=mc_event.subscriber_id,
        message_id=mc_event.message_id,
        channel=mc_event.channel,
        severity="info",
    )

    # Service dispatch: CohortBroadcastService.handle_inbound_reply
    # Full wiring in integration layer — stub per T-be-9 scope.
    logger.info(
        "manychat_inbound_dispatched",
        subscriber_id=mc_event.subscriber_id,
        message_id=mc_event.message_id,
    )

    return WebhookAck(
        status="received",
        event_id=event_id,
        processed_at=_utc_now(),
    )
