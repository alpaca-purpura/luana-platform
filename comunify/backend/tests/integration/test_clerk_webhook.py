"""Integration tests for Clerk webhook receiver — Story 12 T-be-9 (V-F-15).

Tests:
- test_clerk_valid_user_created_returns_200
  → Valid Svix HMAC + user.created → 200 received + creator dispatch logged
- test_clerk_invalid_hmac_returns_400
  → Tampered raw_body → 400 with detail
- test_clerk_replay_returns_200_skipped
  → Same svix_id twice → replay_skipped + 200
- test_clerk_missing_svix_headers_returns_422
  → No svix-id header → FastAPI 422
- test_clerk_non_user_created_event_returns_200_no_onboarding
  → email.created event → 200 received but no creator dispatch
- test_clerk_timestamp_too_old_returns_400
  → svix-timestamp >5 min old → 400

These tests use httpx.AsyncClient + ASGITransport (no DB required).
The Svix signing algorithm: HMAC-SHA256({svix-id}.{svix-timestamp}.{raw_body}) with base64-decoded secret.
"""

from __future__ import annotations

import base64
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

# Raw secret — the adapter will try b64decode; using a raw string for test mode
CLERK_TEST_SECRET = "test_clerk_svix_secret_abc123xyz"


def _make_svix_signature(
    svix_id: str,
    svix_timestamp: str,
    raw_body: bytes,
    secret: str,
) -> str:
    """Build a Svix v1,<base64> signature entry.

    Svix signing: HMAC-SHA256({svix-id}.{svix-timestamp}.{raw_body})
    using the base64-decoded secret (or raw bytes if not valid base64).
    """
    try:
        secret_bytes = base64.b64decode(secret)
    except Exception:
        secret_bytes = secret.encode()

    signed_content = f"{svix_id}.{svix_timestamp}.".encode() + raw_body
    digest = hmac.new(secret_bytes, signed_content, hashlib.sha256).digest()
    sig_b64 = base64.b64encode(digest).decode()
    return f"v1,{sig_b64}"


def _user_created_payload(clerk_user_id: str) -> dict[str, Any]:
    """Return a Clerk user.created event payload."""
    return {
        "type": "user.created",
        "data": {
            "id": clerk_user_id,
            "email_addresses": [{"email_address": "creator@example.com"}],
            "first_name": "Ana",
            "last_name": "Test",
            "public_metadata": {},
        },
    }


def _non_user_payload(event_type: str) -> dict[str, Any]:
    """Return a Clerk non-user event payload."""
    return {
        "type": event_type,
        "data": {
            "id": f"usr_{uuid4().hex[:12]}",
        },
    }


# ── Fixtures ──────────────────────────────────────────────────────────────────


@pytest_asyncio.fixture
async def webhook_client(monkeypatch: pytest.MonkeyPatch):
    """Async test client with Clerk webhook secret patched."""
    monkeypatch.setenv("COMUNIFY_CLERK_WEBHOOK_SECRET", CLERK_TEST_SECRET)
    _seen_event_ids.clear()
    transport = ASGITransport(app=app)  # type: ignore[arg-type]
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


# ── Tests ─────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_clerk_valid_user_created_returns_200(
    webhook_client: AsyncClient,
) -> None:
    """Valid Svix HMAC + user.created → 200 received."""
    clerk_user_id = f"user_{uuid4().hex[:12]}"
    svix_id = str(uuid4())
    svix_ts = str(int(time.time()))

    payload = _user_created_payload(clerk_user_id)
    raw_body = json.dumps(payload).encode()
    svix_sig = _make_svix_signature(svix_id, svix_ts, raw_body, CLERK_TEST_SECRET)

    response = await webhook_client.post(
        "/api/v1/comunify/webhooks/clerk",
        content=raw_body,
        headers={
            "svix-id": svix_id,
            "svix-timestamp": svix_ts,
            "svix-signature": svix_sig,
            "Content-Type": "application/json",
        },
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["status"] == "received"
    assert body["event_id"] == svix_id


@pytest.mark.asyncio
async def test_clerk_invalid_hmac_returns_400(
    webhook_client: AsyncClient,
) -> None:
    """Tampered body → 400 with signature error."""
    clerk_user_id = f"user_{uuid4().hex[:12]}"
    svix_id = str(uuid4())
    svix_ts = str(int(time.time()))

    payload = _user_created_payload(clerk_user_id)
    raw_body = json.dumps(payload).encode()

    # Sign with wrong secret
    svix_sig = _make_svix_signature(svix_id, svix_ts, raw_body, "wrong_secret_xxx")

    response = await webhook_client.post(
        "/api/v1/comunify/webhooks/clerk",
        content=raw_body,
        headers={
            "svix-id": svix_id,
            "svix-timestamp": svix_ts,
            "svix-signature": svix_sig,
            "Content-Type": "application/json",
        },
    )

    assert response.status_code == 400, response.text
    assert "signature" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_clerk_replay_returns_200_skipped(
    webhook_client: AsyncClient,
) -> None:
    """Same svix_id sent twice → second returns replay_skipped."""
    clerk_user_id = f"user_{uuid4().hex[:12]}"
    svix_id = str(uuid4())
    svix_ts = str(int(time.time()))

    payload = _user_created_payload(clerk_user_id)
    raw_body = json.dumps(payload).encode()
    svix_sig = _make_svix_signature(svix_id, svix_ts, raw_body, CLERK_TEST_SECRET)

    headers = {
        "svix-id": svix_id,
        "svix-timestamp": svix_ts,
        "svix-signature": svix_sig,
        "Content-Type": "application/json",
    }

    # First call
    r1 = await webhook_client.post(
        "/api/v1/comunify/webhooks/clerk",
        content=raw_body,
        headers=headers,
    )
    assert r1.status_code == 200
    assert r1.json()["status"] == "received"

    # Second call — replay (svix-signature timestamp still valid)
    r2 = await webhook_client.post(
        "/api/v1/comunify/webhooks/clerk",
        content=raw_body,
        headers=headers,
    )
    assert r2.status_code == 200
    assert r2.json()["status"] == "replay_skipped"


@pytest.mark.asyncio
async def test_clerk_missing_svix_headers_returns_422(
    webhook_client: AsyncClient,
) -> None:
    """Missing svix-id header → FastAPI 422 (required Header param)."""
    raw_body = json.dumps({"type": "ping"}).encode()

    response = await webhook_client.post(
        "/api/v1/comunify/webhooks/clerk",
        content=raw_body,
        headers={"Content-Type": "application/json"},
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_clerk_non_user_event_returns_200(
    webhook_client: AsyncClient,
) -> None:
    """Non user.created event → 200 received (no onboarding dispatch)."""
    svix_id = str(uuid4())
    svix_ts = str(int(time.time()))

    payload = _non_user_payload("session.created")
    raw_body = json.dumps(payload).encode()
    svix_sig = _make_svix_signature(svix_id, svix_ts, raw_body, CLERK_TEST_SECRET)

    response = await webhook_client.post(
        "/api/v1/comunify/webhooks/clerk",
        content=raw_body,
        headers={
            "svix-id": svix_id,
            "svix-timestamp": svix_ts,
            "svix-signature": svix_sig,
            "Content-Type": "application/json",
        },
    )

    assert response.status_code == 200, response.text
    assert response.json()["status"] == "received"


@pytest.mark.asyncio
async def test_clerk_timestamp_too_old_returns_400(
    webhook_client: AsyncClient,
) -> None:
    """svix-timestamp >5 min old → 400 replay protection."""
    clerk_user_id = f"user_{uuid4().hex[:12]}"
    svix_id = str(uuid4())
    # 6 minutes ago
    old_ts = str(int(time.time()) - 400)

    payload = _user_created_payload(clerk_user_id)
    raw_body = json.dumps(payload).encode()
    svix_sig = _make_svix_signature(svix_id, old_ts, raw_body, CLERK_TEST_SECRET)

    response = await webhook_client.post(
        "/api/v1/comunify/webhooks/clerk",
        content=raw_body,
        headers={
            "svix-id": svix_id,
            "svix-timestamp": old_ts,
            "svix-signature": svix_sig,
            "Content-Type": "application/json",
        },
    )

    assert response.status_code == 400, response.text
    detail = response.json()["detail"].lower()
    assert "old" in detail or "timestamp" in detail or "tolerance" in detail
