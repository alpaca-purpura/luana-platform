"""Tests del gate de autenticación del engine IAM montado en nicolify.

Scenario 2 — protected-route-requires-auth:
  GET /api/v1/iam/users/me sin JWT válido → 401 Unauthorized.

Verifica AD-2: el engine IAM está correctamente montado y maneja auth.
El engine luana_core_iam provee el 401 — nicolify solo lo wirea y testea.

T-1 nicolify-r0-dev-stack — V-FN-1.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client() -> TestClient:
    """FastAPI test client para nicolify."""
    from src.main import app

    return TestClient(app, raise_server_exceptions=False)


def test_me_without_jwt_401(client: TestClient) -> None:
    """GET /api/v1/iam/users/me sin Bearer token → 401 Unauthorized.

    AD-2 engine IAM: luana_core_iam verify_clerk_token rechaza requests sin token.
    Scenario 2 gherkin: WHEN GET /api/v1/iam/users/me without JWT
    THEN response status 401.
    """
    response = client.get("/api/v1/iam/users/me")
    assert response.status_code == 401, (
        f"Esperado 401 para /me sin JWT, obtenido {response.status_code}. "
        "AD-2: el router IAM engine debe estar montado en /api/v1/iam/users."
    )


def test_me_with_invalid_jwt_rejects(client: TestClient) -> None:
    """GET /api/v1/iam/users/me con JWT inválido → no retorna 200.

    En entorno de test sin Clerk real configurado, el engine IAM puede retornar
    401 (token inválido), 403 (usuario no en DB) o 500 (CLERK_ISSUER no configurado).
    El punto clave: NUNCA retorna 200 con datos de usuario.
    """
    headers = {"Authorization": "Bearer tokeninvalido.fake.payload"}
    response = client.get("/api/v1/iam/users/me", headers=headers)
    assert response.status_code != 200, (
        f"JWT inválido NO debe retornar 200 OK (obtenido {response.status_code}). "
        "El endpoint /me es protegido — debe rechazar tokens inválidos."
    )


def test_health_is_public(client: TestClient) -> None:
    """/health es público — no requiere JWT (allowlist)."""
    response = client.get("/health")
    assert response.status_code == 200, f"Esperado 200 para /health (público), obtenido {response.status_code}."


def test_api_health_is_public(client: TestClient) -> None:
    """/api/health es público — usado por Clerk middleware public allowlist."""
    response = client.get("/api/health")
    assert response.status_code == 200, f"Esperado 200 para /api/health (público), obtenido {response.status_code}."


def test_health_payload_has_required_fields(client: TestClient) -> None:
    """/health retorna {status, brand, version} — sin secrets ni env vars."""
    response = client.get("/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload.get("status") == "ok", f"status != 'ok': {payload}"
    assert payload.get("brand") == "nicolify", f"brand != 'nicolify': {payload}"
    assert "version" in payload, f"version ausente en payload: {payload}"
    # Ensure no secrets leaked
    forbidden_keys = {"database_url", "secret", "password", "token", "key"}
    leaked = forbidden_keys & set(payload.keys())
    assert not leaked, f"Campos sensibles en /health response: {leaked}"
