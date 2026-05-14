"""Integration tests for WhatsApp Business API webhook receiver — Story 12 T-be-9 (V-F-15).

Tests:
- test_wa_valid_inbound_returns_200
  → Valid HMAC (sha256=<hex> format) + inbound message payload → 200 received
- test_wa_invalid_hmac_returns_400
  → Wrong HMAC secret → 400 with signature error
- test_wa_replay_returns_200_skipped
  → Same WA message_id twice → second returns replay_skipped
- test_wa_missing_signature_with_secret_warns_returns_200
  → No X-Hub-Signature-256 but secret configured → 200 (permissive, warning logged)
- test_wa_no_secret_no_signature_returns_200
  → No secret + no header → 200 (open dev mode)
- test_wa_invalid_json_returns_400
  → Malformed body → 400

These tests use httpx.AsyncClient + ASGITransport (no DB required).
"""

from __future__ import annotations

import hashlib
import hmac
import json
from typing import Any
from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from src.main import app
from src.modules.comunify.api.webhook_routes import _seen_event_ids

# ── Test helpers ──────────────────────────────────────────────────────────────

WA_TEST_SECRET = "test_whatsapp_webhook_secret_xyz789"


def _make_wa_signature(raw_body: bytes, secret: str) -> str:
    """Build an X-Hub-Signature-256 header value (sha256=<hex>)."""
    hex_digest = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
    return f"sha256={hex_digest}"


def _wa_inbound_payload(message_id: str, phone_number_id: str = "123456789") -> dict[str, Any]:
    """Return a minimal WhatsApp Business API inbound message payload."""
    return {
        "object": "whatsapp_business_account",
        "entry": [
            {
                "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
                "changes": [
                    {
                        "value": {
                            "messaging_product": "whatsapp",
                            "metadata": {
                                "display_phone_number": "+1234567890",
                                "phone_number_id": phone_number_id,
                            },
                            "messages": [
                                {
                                    "from": "521234567890",
                                    "id": message_id,
                                    "timestamp": "1685395200",
                                    "type": "text",
                                    "text": {"body": "Hola, quiero informacion"},
                                }
                            ],
                        },
                        "field": "messages",
                    }
                ],
            }
        ],
    }


# ── Fixtures ──────────────────────────────────────────────────────────────────


@pytest_asyncio.fixture
async def webhook_client(monkeypatch: pytest.MonkeyPatch) -> AsyncClient:
    """Async test client with WA webhook secret patched into env."""
    monkeypatch.setenv("COMUNIFY_WHATSAPP_WEBHOOK_SECRET", WA_TEST_SECRET)
    _seen_event_ids.clear()
    transport = ASGITransport(app=app)  # type: ignore[arg-type]
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest_asyncio.fixture
async def webhook_client_no_secret(monkeypatch: pytest.MonkeyPatch) -> AsyncClient:
    """Async test client with WA webhook secret unset (open dev mode)."""
    monkeypatch.delenv("COMUNIFY_WHATSAPP_WEBHOOK_SECRET", raising=False)
    _seen_event_ids.clear()
    transport = ASGITransport(app=app)  # type: ignore[arg-type]
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


# ── Tests ─────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_wa_valid_inbound_returns_200(
    webhook_client: AsyncClient,
) -> None:
    """Valid HMAC (sha256=<hex>) + inbound message payload → 200 received."""
    message_id = f"wamid.{uuid4().hex[:20]}"
    payload = _wa_inbound_payload(message_id)
    raw_body = json.dumps(payload).encode()
    sig = _make_wa_signature(raw_body, WA_TEST_SECRET)

    response = await webhook_client.post(
        "/api/v1/comunify/webhooks/whatsapp/inbound",
        content=raw_body,
        headers={"X-Hub-Signature-256": sig, "Content-Type": "application/json"},
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["status"] == "received"
    assert f"wa:{message_id}" in body["event_id"]
    assert "processed_at" in body


@pytest.mark.asyncio
async def test_wa_invalid_hmac_returns_400(
    webhook_client: AsyncClient,
) -> None:
    """Wrong HMAC secret → 400 with signature error detail."""
    message_id = f"wamid.{uuid4().hex[:20]}"
    payload = _wa_inbound_payload(message_id)
    raw_body = json.dumps(payload).encode()
    sig = _make_wa_signature(raw_body, "wrong_secret_completely")

    response = await webhook_client.post(
        "/api/v1/comunify/webhooks/whatsapp/inbound",
        content=raw_body,
        headers={"X-Hub-Signature-256": sig, "Content-Type": "application/json"},
    )

    assert response.status_code == 400, response.text
    assert "signature" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_wa_replay_returns_200_skipped(
    webhook_client: AsyncClient,
) -> None:
    """Same WA message_id sent twice → second call returns replay_skipped."""
    message_id = f"wamid.{uuid4().hex[:20]}"
    payload = _wa_inbound_payload(message_id)
    raw_body = json.dumps(payload).encode()
    sig = _make_wa_signature(raw_body, WA_TEST_SECRET)

    headers = {
        "X-Hub-Signature-256": sig,
        "Content-Type": "application/json",
    }

    # First call
    r1 = await webhook_client.post(
        "/api/v1/comunify/webhooks/whatsapp/inbound",
        content=raw_body,
        headers=headers,
    )
    assert r1.status_code == 200
    assert r1.json()["status"] == "received"

    # Second call — replay
    r2 = await webhook_client.post(
        "/api/v1/comunify/webhooks/whatsapp/inbound",
        content=raw_body,
        headers=headers,
    )
    assert r2.status_code == 200
    assert r2.json()["status"] == "replay_skipped"


@pytest.mark.asyncio
async def test_wa_no_signature_with_secret_returns_200(
    webhook_client: AsyncClient,
) -> None:
    """No X-Hub-Signature-256 header + secret configured → 200 (permissive, warning logged)."""
    message_id = f"wamid.{uuid4().hex[:20]}"
    payload = _wa_inbound_payload(message_id)
    raw_body = json.dumps(payload).encode()

    response = await webhook_client.post(
        "/api/v1/comunify/webhooks/whatsapp/inbound",
        content=raw_body,
        headers={"Content-Type": "application/json"},
    )

    # Permissive mode: returns 200 even without signature (warning logged)
    assert response.status_code == 200, response.text
    assert response.json()["status"] == "received"


@pytest.mark.asyncio
async def test_wa_no_signature_no_secret_returns_200(
    webhook_client_no_secret: AsyncClient,
) -> None:
    """No secret + no X-Hub-Signature-256 → 200 (open dev mode)."""
    message_id = f"wamid.{uuid4().hex[:20]}"
    payload = _wa_inbound_payload(message_id)
    raw_body = json.dumps(payload).encode()

    response = await webhook_client_no_secret.post(
        "/api/v1/comunify/webhooks/whatsapp/inbound",
        content=raw_body,
        headers={"Content-Type": "application/json"},
    )

    assert response.status_code == 200, response.text
    assert response.json()["status"] == "received"


@pytest.mark.asyncio
async def test_wa_invalid_json_returns_400(
    webhook_client: AsyncClient,
) -> None:
    """Non-JSON body → 400 even with valid HMAC."""
    raw_body = b"not-json-payload"
    sig = _make_wa_signature(raw_body, WA_TEST_SECRET)

    response = await webhook_client.post(
        "/api/v1/comunify/webhooks/whatsapp/inbound",
        content=raw_body,
        headers={"X-Hub-Signature-256": sig, "Content-Type": "application/json"},
    )

    assert response.status_code == 400, response.text
    assert "json" in response.json()["detail"].lower()
