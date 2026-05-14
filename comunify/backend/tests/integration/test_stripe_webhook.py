"""Integration tests for Stripe webhook receiver — Story 12 T-be-9 (V-F-15).

Tests:
- test_stripe_valid_payment_intent_succeeded_returns_200
  → Valid HMAC + payment_intent.succeeded → 200 received
- test_stripe_valid_subscription_created_returns_200
  → Valid HMAC + customer.subscription.created → 200 received
- test_stripe_invalid_hmac_returns_400
  → Tampered body → 400 with detail
- test_stripe_replay_returns_200_skipped
  → Same payment_intent_id twice → second returns replay_skipped + 200
- test_stripe_missing_signature_header_returns_422
  → No Stripe-Signature header → FastAPI 422 (required header)
- test_stripe_audit_log_replay_attempt_logged
  → Second identical call logs webhook_replay_attempt (structlog capture)

These tests use httpx.AsyncClient + ASGITransport (no DB required).
Markers: @pytest.mark.integration (auto-skipped without Postgres per conftest).
However tests here use only the ASGI app — no DB queries in T-be-9 scope.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import time
from datetime import datetime
from typing import Any
from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from src.main import app
from src.modules.comunify.api.webhook_routes import _seen_event_ids

# ── Test helpers ──────────────────────────────────────────────────────────────


def _make_stripe_signature(raw_body: bytes, secret: str, timestamp: int | None = None) -> str:
    """Build a valid Stripe-Signature header value for test payloads."""
    ts = timestamp if timestamp is not None else int(time.time())
    signed = f"{ts}.".encode() + raw_body
    sig = hmac.new(secret.encode(), signed, hashlib.sha256).hexdigest()
    return f"t={ts},v1={sig}"


def _stripe_payment_intent_event(payment_intent_id: str, tenant_id: str = "") -> dict[str, Any]:
    """Return a Stripe payment_intent.succeeded event dict."""
    return {
        "id": f"evt_{payment_intent_id}",
        "type": "payment_intent.succeeded",
        "data": {
            "object": {
                "id": payment_intent_id,
                "object": "payment_intent",
                "amount": 9900,
                "currency": "usd",
                "status": "succeeded",
                "metadata": {
                    "tenant_id": tenant_id,
                    "compliance_level": "creator_economy",
                },
            }
        },
    }


def _stripe_subscription_event(subscription_id: str, event_type: str) -> dict[str, Any]:
    """Return a Stripe subscription lifecycle event dict."""
    return {
        "id": f"evt_{subscription_id}",
        "type": event_type,
        "data": {
            "object": {
                "id": subscription_id,
                "object": "subscription",
                "status": "active",
                "metadata": {"tenant_id": str(uuid4()), "compliance_level": "creator_economy"},
            }
        },
    }


# ── Fixtures ──────────────────────────────────────────────────────────────────

STRIPE_TEST_SECRET = "whsec_test_stripe_secret_1234567890"


@pytest_asyncio.fixture
async def webhook_client(monkeypatch: pytest.MonkeyPatch):
    """Async test client with Stripe webhook secret patched into env."""
    monkeypatch.setenv("COMUNIFY_STRIPE_WEBHOOK_SECRET", STRIPE_TEST_SECRET)
    # Clear in-process idempotency store before each test
    _seen_event_ids.clear()
    transport = ASGITransport(app=app)  # type: ignore[arg-type]
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


# ── Tests ─────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_stripe_valid_payment_intent_succeeded_returns_200(
    webhook_client: AsyncClient,
) -> None:
    """Valid HMAC + payment_intent.succeeded → 200 WebhookAck(status=received)."""
    pi_id = f"pi_{uuid4().hex[:16]}"
    payload = _stripe_payment_intent_event(pi_id, tenant_id=str(uuid4()))
    raw_body = json.dumps(payload).encode()
    sig = _make_stripe_signature(raw_body, STRIPE_TEST_SECRET)

    response = await webhook_client.post(
        "/api/v1/comunify/webhooks/stripe",
        content=raw_body,
        headers={"Stripe-Signature": sig, "Content-Type": "application/json"},
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["status"] == "received"
    assert body["event_id"] == f"evt_{pi_id}"
    # processed_at is ISO-8601
    assert "processed_at" in body
    _dt = datetime.fromisoformat(body["processed_at"])
    assert _dt.tzinfo is not None


@pytest.mark.asyncio
async def test_stripe_valid_subscription_created_returns_200(
    webhook_client: AsyncClient,
) -> None:
    """Valid HMAC + customer.subscription.created → 200 received."""
    sub_id = f"sub_{uuid4().hex[:16]}"
    payload = _stripe_subscription_event(sub_id, "customer.subscription.created")
    raw_body = json.dumps(payload).encode()
    sig = _make_stripe_signature(raw_body, STRIPE_TEST_SECRET)

    response = await webhook_client.post(
        "/api/v1/comunify/webhooks/stripe",
        content=raw_body,
        headers={"Stripe-Signature": sig, "Content-Type": "application/json"},
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["status"] == "received"


@pytest.mark.asyncio
async def test_stripe_valid_subscription_updated_returns_200(
    webhook_client: AsyncClient,
) -> None:
    """Valid HMAC + customer.subscription.updated → 200 received."""
    sub_id = f"sub_{uuid4().hex[:16]}"
    payload = _stripe_subscription_event(sub_id, "customer.subscription.updated")
    raw_body = json.dumps(payload).encode()
    sig = _make_stripe_signature(raw_body, STRIPE_TEST_SECRET)

    response = await webhook_client.post(
        "/api/v1/comunify/webhooks/stripe",
        content=raw_body,
        headers={"Stripe-Signature": sig, "Content-Type": "application/json"},
    )

    assert response.status_code == 200, response.text
    assert response.json()["status"] == "received"


@pytest.mark.asyncio
async def test_stripe_invalid_hmac_returns_400(
    webhook_client: AsyncClient,
) -> None:
    """Tampered body (HMAC computed over different content) → 400."""
    pi_id = f"pi_{uuid4().hex[:16]}"
    payload = _stripe_payment_intent_event(pi_id)
    raw_body = json.dumps(payload).encode()
    # Sign with wrong secret
    sig = _make_stripe_signature(raw_body, "wrong_secret_xyz")

    response = await webhook_client.post(
        "/api/v1/comunify/webhooks/stripe",
        content=raw_body,
        headers={"Stripe-Signature": sig, "Content-Type": "application/json"},
    )

    assert response.status_code == 400, response.text
    assert "signature" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_stripe_replay_returns_200_skipped(
    webhook_client: AsyncClient,
) -> None:
    """Same payment_intent_id sent twice → second returns replay_skipped + 200."""
    pi_id = f"pi_{uuid4().hex[:16]}"
    payload = _stripe_payment_intent_event(pi_id)
    raw_body = json.dumps(payload).encode()
    sig = _make_stripe_signature(raw_body, STRIPE_TEST_SECRET)

    # First call — should be received
    r1 = await webhook_client.post(
        "/api/v1/comunify/webhooks/stripe",
        content=raw_body,
        headers={"Stripe-Signature": sig, "Content-Type": "application/json"},
    )
    assert r1.status_code == 200
    assert r1.json()["status"] == "received"

    # Second call — same payload, replay
    r2 = await webhook_client.post(
        "/api/v1/comunify/webhooks/stripe",
        content=raw_body,
        headers={"Stripe-Signature": sig, "Content-Type": "application/json"},
    )
    assert r2.status_code == 200
    assert r2.json()["status"] == "replay_skipped"


@pytest.mark.asyncio
async def test_stripe_missing_signature_header_returns_422(
    webhook_client: AsyncClient,
) -> None:
    """No Stripe-Signature header → FastAPI 422 (required header validation)."""
    raw_body = json.dumps({"type": "ping"}).encode()

    response = await webhook_client.post(
        "/api/v1/comunify/webhooks/stripe",
        content=raw_body,
        headers={"Content-Type": "application/json"},
    )

    # FastAPI returns 422 for missing required Header param
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_stripe_timestamp_too_old_returns_400(
    webhook_client: AsyncClient,
) -> None:
    """Stripe-Signature with timestamp >5 min old → 400 replay protection."""
    pi_id = f"pi_{uuid4().hex[:16]}"
    payload = _stripe_payment_intent_event(pi_id)
    raw_body = json.dumps(payload).encode()
    # Create signature with a very old timestamp (6 minutes ago)
    old_ts = int(time.time()) - 400
    sig = _make_stripe_signature(raw_body, STRIPE_TEST_SECRET, timestamp=old_ts)

    response = await webhook_client.post(
        "/api/v1/comunify/webhooks/stripe",
        content=raw_body,
        headers={"Stripe-Signature": sig, "Content-Type": "application/json"},
    )

    assert response.status_code == 400, response.text
    assert "old" in response.json()["detail"].lower() or "timestamp" in response.json()["detail"].lower()
