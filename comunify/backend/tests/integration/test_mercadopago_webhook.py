"""Integration tests for MercadoPago IPN webhook receiver — Story 12 T-be-9 (V-F-15).

Tests:
- test_mp_valid_ipn_with_signature_returns_200
  → Valid HMAC (bare hex format) + IPN payload → 200 received
- test_mp_valid_ipn_structured_signature_returns_200
  → Valid HMAC (structured ts=<ts>,v1=<hex> format) → 200 received
- test_mp_invalid_hmac_returns_400
  → Wrong secret → 400 with detail
- test_mp_replay_returns_200_skipped
  → Same MP payment ID twice → replay_skipped + 200
- test_mp_missing_signature_continues_with_warning
  → No X-Signature when secret is empty → 200 (permissive legacy IPN)
- test_mp_invalid_json_returns_400
  → Malformed body → 400

These tests use httpx.AsyncClient + ASGITransport (no DB required).
"""

from __future__ import annotations

import hashlib
import hmac
import json
import time
from typing import Any
from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from src.main import app
from src.modules.comunify.api.webhook_routes import _seen_event_ids

# ── Test helpers ──────────────────────────────────────────────────────────────

MP_TEST_SECRET = "test_mp_webhook_secret_abc123"


def _make_mp_signature_bare(raw_body: bytes, secret: str) -> str:
    """Build a bare hex HMAC-SHA256 signature for MercadoPago IPN."""
    return hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()


def _make_mp_signature_structured(raw_body: bytes, secret: str) -> str:
    """Build structured ts=<ts>,v1=<hex> signature for MercadoPago IPN."""
    ts = int(time.time())
    sig = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
    return f"ts={ts},v1={sig}"


def _mp_ipn_payload(payment_id: str, topic: str = "payment") -> dict[str, Any]:
    """Return a minimal MercadoPago IPN payload."""
    return {
        "type": topic,
        "action": "payment.updated",
        "data": {
            "id": payment_id,
        },
    }


# ── Fixtures ──────────────────────────────────────────────────────────────────


@pytest_asyncio.fixture
async def webhook_client(monkeypatch: pytest.MonkeyPatch):
    """Async test client with MP webhook secret patched into env."""
    monkeypatch.setenv("COMUNIFY_MERCADOPAGO_WEBHOOK_SECRET", MP_TEST_SECRET)
    _seen_event_ids.clear()
    transport = ASGITransport(app=app)  # type: ignore[arg-type]
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest_asyncio.fixture
async def webhook_client_no_secret(monkeypatch: pytest.MonkeyPatch):
    """Async test client with MP webhook secret unset (legacy IPN permissive)."""
    monkeypatch.delenv("COMUNIFY_MERCADOPAGO_WEBHOOK_SECRET", raising=False)
    _seen_event_ids.clear()
    transport = ASGITransport(app=app)  # type: ignore[arg-type]
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


# ── Tests ─────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_mp_valid_ipn_bare_signature_returns_200(
    webhook_client: AsyncClient,
) -> None:
    """Valid HMAC (bare hex) + IPN payment payload → 200 received."""
    payment_id = str(uuid4().int)[:10]
    payload = _mp_ipn_payload(payment_id)
    raw_body = json.dumps(payload).encode()
    sig = _make_mp_signature_bare(raw_body, MP_TEST_SECRET)

    response = await webhook_client.post(
        "/api/v1/comunify/webhooks/mercadopago",
        content=raw_body,
        headers={"x-signature": sig, "Content-Type": "application/json"},
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["status"] == "received"
    assert f"mp:{payment_id}" in body["event_id"]


@pytest.mark.asyncio
async def test_mp_valid_ipn_structured_signature_returns_200(
    webhook_client: AsyncClient,
) -> None:
    """Valid HMAC (structured ts=<ts>,v1=<hex>) → 200 received."""
    payment_id = str(uuid4().int)[:10]
    payload = _mp_ipn_payload(payment_id)
    raw_body = json.dumps(payload).encode()
    sig = _make_mp_signature_structured(raw_body, MP_TEST_SECRET)

    response = await webhook_client.post(
        "/api/v1/comunify/webhooks/mercadopago",
        content=raw_body,
        headers={"x-signature": sig, "Content-Type": "application/json"},
    )

    assert response.status_code == 200, response.text
    assert response.json()["status"] == "received"


@pytest.mark.asyncio
async def test_mp_invalid_hmac_returns_400(
    webhook_client: AsyncClient,
) -> None:
    """Wrong HMAC secret → 400 with signature error detail."""
    payment_id = str(uuid4().int)[:10]
    payload = _mp_ipn_payload(payment_id)
    raw_body = json.dumps(payload).encode()
    sig = _make_mp_signature_bare(raw_body, "wrong_secret_xyz")

    response = await webhook_client.post(
        "/api/v1/comunify/webhooks/mercadopago",
        content=raw_body,
        headers={"x-signature": sig, "Content-Type": "application/json"},
    )

    assert response.status_code == 400, response.text
    assert "signature" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_mp_replay_returns_200_skipped(
    webhook_client: AsyncClient,
) -> None:
    """Same MP payment ID sent twice → second call returns replay_skipped."""
    payment_id = str(uuid4().int)[:10]
    payload = _mp_ipn_payload(payment_id)
    raw_body = json.dumps(payload).encode()
    sig = _make_mp_signature_bare(raw_body, MP_TEST_SECRET)

    # First call
    r1 = await webhook_client.post(
        "/api/v1/comunify/webhooks/mercadopago",
        content=raw_body,
        headers={"x-signature": sig, "Content-Type": "application/json"},
    )
    assert r1.status_code == 200
    assert r1.json()["status"] == "received"

    # Second call — replay
    r2 = await webhook_client.post(
        "/api/v1/comunify/webhooks/mercadopago",
        content=raw_body,
        headers={"x-signature": sig, "Content-Type": "application/json"},
    )
    assert r2.status_code == 200
    assert r2.json()["status"] == "replay_skipped"


@pytest.mark.asyncio
async def test_mp_no_signature_no_secret_returns_200(
    webhook_client_no_secret: AsyncClient,
) -> None:
    """No X-Signature + no secret configured → 200 (legacy IPN permissive mode)."""
    payment_id = str(uuid4().int)[:10]
    payload = _mp_ipn_payload(payment_id)
    raw_body = json.dumps(payload).encode()

    response = await webhook_client_no_secret.post(
        "/api/v1/comunify/webhooks/mercadopago",
        content=raw_body,
        headers={"Content-Type": "application/json"},
    )

    assert response.status_code == 200, response.text
    assert response.json()["status"] == "received"


@pytest.mark.asyncio
async def test_mp_invalid_json_returns_400(
    webhook_client: AsyncClient,
) -> None:
    """Non-JSON body → 400 even with valid HMAC."""
    raw_body = b"not-json-garbage"
    sig = _make_mp_signature_bare(raw_body, MP_TEST_SECRET)

    response = await webhook_client.post(
        "/api/v1/comunify/webhooks/mercadopago",
        content=raw_body,
        headers={"x-signature": sig, "Content-Type": "application/json"},
    )

    assert response.status_code == 400, response.text
    assert "json" in response.json()["detail"].lower()
