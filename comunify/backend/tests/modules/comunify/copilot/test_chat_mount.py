# cap: comunify-shell-organism
"""T-agentic — thin mount of the engine copilot ``/chat`` router (comunify).

comunify is the FIRST brand to wire the Luana sidebar to the shared copilot
engine (``core/luana-core-copilot``). This ticket mounts it as-is at
``/api/v1/comunify/copilot/chat`` — pure reexport, zero engine edit.

These tests assert the MOUNT contract (not the engine internals — those live
in ``core/luana-core-copilot/tests``):

  * route is mounted at the brand prefix (200 SSE with valid auth + mocked
    orchestrator) — mirrors ``core/luana-core-copilot/tests/test_rate_limit.py``
    ``TestChatEndpointRateLimit`` override pattern.
  * unauthenticated request → 401/403 (engine auth + tenant isolation enforce).
  * RN-3: comunify copilot has NO domain ``tools/`` dir → Luana conversa +
    anuncia, no ejecuta (agentic-no-tools-registered validator).

Env defaults for the engine ``Settings()`` are provided by the sibling
``conftest.py`` (mirrors the engine copilot conftest).
"""

from __future__ import annotations

from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, patch
from uuid import uuid4

from fastapi.testclient import TestClient
from luana_core_iam.api.dependencies import get_current_user
from luana_core_platform.core.database import get_db

from src.main import app

# Resolve the comunify copilot module dir relative to this test file:
# tests/modules/comunify/copilot/ -> backend/ -> src/modules/comunify/copilot/
_BACKEND_ROOT = Path(__file__).resolve().parents[4]
_COPILOT_MODULE_DIR = _BACKEND_ROOT / "src" / "modules" / "comunify" / "copilot"

CHAT_PATH = "/api/v1/comunify/copilot/chat"


# ─────────────────────────────────────────────────────────────────────────────
# Mount presence — the engine router is wired at the brand prefix
# ─────────────────────────────────────────────────────────────────────────────


def test_chat_route_is_mounted_at_brand_prefix() -> None:
    """The engine /chat router is included under /api/v1/comunify/copilot."""
    mounted = {
        (getattr(route, "path", None), tuple(sorted(getattr(route, "methods", set()) or set())))
        for route in app.router.routes
    }
    assert (CHAT_PATH, ("POST",)) in mounted, (
        f"Expected POST {CHAT_PATH} mounted; got paths: {sorted(p for p, _ in mounted if p and 'copilot' in p)}"
    )


# ─────────────────────────────────────────────────────────────────────────────
# Happy path — valid auth + tenant + mocked orchestrator → 200 SSE
# ─────────────────────────────────────────────────────────────────────────────


def _build_authed_client(tenant_id=None) -> TestClient:
    """TestClient over the real comunify app with engine auth deps overridden.

    Mirrors core/luana-core-copilot/tests/test_rate_limit.py::_build_client.
    get_tenant_context resolves from the overridden user's ``tenant_id``.
    """
    if tenant_id is None:
        tenant_id = uuid4()
    mock_db = MagicMock()
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
        id=uuid4(),
        tenant_id=tenant_id,
    )
    return TestClient(app)


@patch("luana_core_copilot.api.chat.check_rate_limit")
@patch("luana_core_copilot.api.chat.CopilotOrchestrator")
def test_chat_returns_200_sse_with_valid_auth(mock_orch_cls, _mock_rate_limit) -> None:
    """POST with valid auth + tenant → 200 text/event-stream (mount works)."""
    mock_orch = MagicMock()
    mock_orch.stream_chat.return_value = iter([])
    mock_orch_cls.return_value = mock_orch

    client = _build_authed_client()
    try:
        response = client.post(CHAT_PATH, json={"message": "hola Luana"})
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/event-stream")


# ─────────────────────────────────────────────────────────────────────────────
# Auth boundary — no JWT / no tenant → 401/403 (engine enforces, RN-2)
# ─────────────────────────────────────────────────────────────────────────────


def test_chat_without_auth_is_rejected() -> None:
    """No Authorization header → engine auth rejects (401/403), never 200/404."""
    client = TestClient(app)  # no dependency overrides → real engine auth deps
    response = client.post(CHAT_PATH, json={"message": "hola"})
    assert response.status_code in (401, 403), f"Expected 401/403 without auth, got {response.status_code}"


# ─────────────────────────────────────────────────────────────────────────────
# RN-3 by construction — no domain tools registered for comunify copilot
# (agentic-no-tools-registered)
# ─────────────────────────────────────────────────────────────────────────────


def test_comunify_copilot_has_no_domain_tools_dir() -> None:
    """comunify/.../copilot/ has NO tools/ dir → Luana cannot execute (RN-3)."""
    tools_dir = _COPILOT_MODULE_DIR / "tools"
    assert not tools_dir.exists(), (
        f"comunify copilot must NOT register domain tools (RN-3 by construction); found: {tools_dir}"
    )
