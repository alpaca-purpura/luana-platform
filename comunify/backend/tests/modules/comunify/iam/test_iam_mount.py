# cap: comunify-shell-organism
"""T-iam-be — IAM router mount test (comunify).

Verifies that the engine IAM ``/me/tenants`` router is mounted at
``/api/v1/iam/users`` in the comunify FastAPI app.

Contract:
  * GET /api/v1/iam/users/me/tenants without auth → 401/403 (never 404).
    A 404 means the router is not mounted; 401/403 means auth is enforcing.
  * The route is registered in the app's router table.

Mirrors the structure of comunify/backend/tests/modules/comunify/copilot/test_chat_mount.py
(same mount-contract pattern, adapted for the IAM surface).
"""

from __future__ import annotations

from fastapi.testclient import TestClient

from src.main import app

IAM_TENANTS_PATH = "/api/v1/iam/users/me/tenants"


def test_iam_tenants_route_is_mounted() -> None:
    """GET /api/v1/iam/users/me/tenants is registered in the comunify app."""
    mounted_paths = {getattr(route, "path", None) for route in app.router.routes}
    assert IAM_TENANTS_PATH in mounted_paths, (
        f"Expected {IAM_TENANTS_PATH} mounted; got iam paths: "
        f"{sorted(p for p in mounted_paths if p and 'iam' in str(p))}"
    )


def test_iam_tenants_without_auth_returns_401_not_404() -> None:
    """No Authorization header → engine auth rejects (401/403), never 404.

    A 404 means the route is not wired; 401/403 means it is wired but auth
    correctly enforces. This test ensures the IAM tables + router mount together
    before any tenant is seeded.
    """
    client = TestClient(app)
    response = client.get(IAM_TENANTS_PATH)
    assert response.status_code in (401, 403), (
        f"Expected 401/403 without auth (route mounted + auth enforcing), "
        f"got {response.status_code}. A 404 means the IAM router is not mounted."
    )
