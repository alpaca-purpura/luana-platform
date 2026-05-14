"""Integration tests for ManyChat IG DM webhook receiver — Story 12 T-be-9 (V-F-15).

Tests:
- test_mc_valid_inbound_returns_200
  → Valid HMAC (bare hex) + ManyChat inbound payload → 200 received
- test_mc_invalid_hmac_returns_400
  → Wrong HMAC secret → 400 with signature error
- test_mc_replay_returns_200_skipped
  → Same (subscriber_id, message_id) pair twice → second returns replay_skipped
- test_mc_no_signature_no_secret_returns_200
  → No secret + no header → 200 (open dev mode, no-signature path)
- test_mc_invalid_json_returns_400
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

MC_TEST_SECRET = "test_manychat_webhook_secret_abc456"


def _make_mc_signature(raw_body: bytes, secret: str) -> str:
    """Build a ManyChat X-MC-Signature header value (bare HMAC-SHA256 hex)."""
    return hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()


def _mc_inbound_payload(subscriber_id: str, message_id: str) -> dict[str, Any]:
    """Return a minimal ManyChat IG DM inbound payload."""
    return {
        "subscriber_id": subscriber_id,
        "message_id": message_id,
        "text": "Me interesa tu programa",
        "channel": "instagram",
        "page_id": "123456789",
        "timestamp": int(time.time()),  # fresh timestamp — adapter enforces ±5 min window
    }


# ── Fixtures ──────────────────────────────────────────────────────────────────


@pytest_asyncio.fixture
async def webhook_client(monkeypatch: pytest.MonkeyPatch) -> AsyncClient:
    """Async test client with ManyChat webhook secret patched into env."""
    monkeypatch.setenv("COMUNIFY_MANYCHAT_WEBHOOK_SECRET", MC_TEST_SECRET)
    _seen_event_ids.clear()
    transport = ASGITransport(app=app)  # type: ignore[arg-type]
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest_asyncio.fixture
async def webhook_client_no_secret(monkeypatch: pytest.MonkeyPatch) -> AsyncClient:
    """Async test client with ManyChat webhook secret unset (open dev mode)."""
    monkeypatch.delenv("COMUNIFY_MANYCHAT_WEBHOOK_SECRET", raising=False)
    _seen_event_ids.clear()
    transport = ASGITransport(app=app)  # type: ignore[arg-type]
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


# ── Tests ─────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_mc_valid_inbound_returns_200(
    webhook_client: AsyncClient,
) -> None:
    """Valid HMAC (bare hex) + inbound payload → 200 received with event_id."""
    subscriber_id = f"sub_{uuid4().hex[:12]}"
    message_id = f"msg_{uuid4().hex[:12]}"
    payload = _mc_inbound_payload(subscriber_id, message_id)
    raw_body = json.dumps(payload).encode()
    sig = _make_mc_signature(raw_body, MC_TEST_SECRET)

    response = await webhook_client.post(
        "/api/v1/comunify/webhooks/manychat/inbound",
        content=raw_body,
        headers={"X-MC-Signature": sig, "Content-Type": "application/json"},
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["status"] == "received"
    assert subscriber_id in body["event_id"] or message_id in body["event_id"]
    assert "processed_at" in body


@pytest.mark.asyncio
async def test_mc_invalid_hmac_returns_400(
    webhook_client: AsyncClient,
) -> None:
    """Wrong HMAC secret → 400 with signature error detail."""
    subscriber_id = f"sub_{uuid4().hex[:12]}"
    message_id = f"msg_{uuid4().hex[:12]}"
    payload = _mc_inbound_payload(subscriber_id, message_id)
    raw_body = json.dumps(payload).encode()
    sig = _make_mc_signature(raw_body, "wrong_secret_completely")

    response = await webhook_client.post(
        "/api/v1/comunify/webhooks/manychat/inbound",
        content=raw_body,
        headers={"X-MC-Signature": sig, "Content-Type": "application/json"},
    )

    assert response.status_code == 400, response.text
    assert "signature" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_mc_replay_returns_200_skipped(
    webhook_client: AsyncClient,
) -> None:
    """Same (subscriber_id, message_id) sent twice → second returns replay_skipped."""
    subscriber_id = f"sub_{uuid4().hex[:12]}"
    message_id = f"msg_{uuid4().hex[:12]}"
    payload = _mc_inbound_payload(subscriber_id, message_id)
    raw_body = json.dumps(payload).encode()
    sig = _make_mc_signature(raw_body, MC_TEST_SECRET)

    headers = {
        "X-MC-Signature": sig,
        "Content-Type": "application/json",
    }

    # First call
    r1 = await webhook_client.post(
        "/api/v1/comunify/webhooks/manychat/inbound",
        content=raw_body,
        headers=headers,
    )
    assert r1.status_code == 200
    assert r1.json()["status"] == "received"

    # Second call — replay
    r2 = await webhook_client.post(
        "/api/v1/comunify/webhooks/manychat/inbound",
        content=raw_body,
        headers=headers,
    )
    assert r2.status_code == 200
    assert r2.json()["status"] == "replay_skipped"


@pytest.mark.asyncio
async def test_mc_no_signature_no_secret_returns_200(
    webhook_client_no_secret: AsyncClient,
) -> None:
    """No secret + no X-MC-Signature → 200 (open dev mode, no-signature path)."""
    subscriber_id = f"sub_{uuid4().hex[:12]}"
    message_id = f"msg_{uuid4().hex[:12]}"
    payload = _mc_inbound_payload(subscriber_id, message_id)
    raw_body = json.dumps(payload).encode()

    response = await webhook_client_no_secret.post(
        "/api/v1/comunify/webhooks/manychat/inbound",
        content=raw_body,
        headers={"Content-Type": "application/json"},
    )

    assert response.status_code == 200, response.text
    assert response.json()["status"] == "received"


@pytest.mark.asyncio
async def test_mc_invalid_json_returns_400(
    webhook_client_no_secret: AsyncClient,
) -> None:
    """Non-JSON body without signature + no secret → 400."""
    raw_body = b"not-json-manychat"

    response = await webhook_client_no_secret.post(
        "/api/v1/comunify/webhooks/manychat/inbound",
        content=raw_body,
        headers={"Content-Type": "application/json"},
    )

    assert response.status_code == 400, response.text
    assert "json" in response.json()["detail"].lower()
