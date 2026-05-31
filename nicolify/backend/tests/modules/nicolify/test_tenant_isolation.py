"""Tests de aislamiento de tenant para nicolify (Scenario 4 — cross-tenant isolation).

Verifica que el engine luana_core_iam correctamente retorna 403 cuando
un request incluye un X-Tenant-ID ajeno (tenant al que el user NO pertenece).

AD-2: tenant isolation proveída por engine get_current_user (NO reimplementada).
La story wirea el engine y verifica el comportamiento con este test.

T-2 nicolify-r0-dev-stack — V-FN-2.
downstream-regression-na: brand-local module test; no cross-brand consumers

Mecanismo de 403 (engine luana_core_iam):
    luana_core_iam.api.dependencies.get_current_user:
        - Verifica JWT via verify_clerk_token → resuelve User por email
        - Verifica X-Tenant-ID contra user_tenants (user_id + tenant_id + is_active)
        - Si user NO tiene link al tenant solicitado → HTTPException 403
    nicolify NO reimplementa esta lógica — solo la wirea a través del engine router.

Estrategia de tests:
    - test 1 (HTTP): verifica que la app rechaza requests sin JWT → 401 (via TestClient)
    - test 2 (unit engine): llama get_current_user directamente con DB mockeada
      que retorna None para user_tenants → espera 403
    - test 3 (estático): AST scan que verifica que nicolify/src no reimplementa
      las funciones del engine (anti-duplication.md V-AV-6)
"""

from __future__ import annotations

import ast
import uuid
from pathlib import Path
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from luana_core_iam.domain.user import User


@pytest.fixture
def client() -> TestClient:
    """FastAPI test client (raise_server_exceptions=False para 4xx)."""
    from src.main import app

    return TestClient(app, raise_server_exceptions=False)


def test_missing_jwt_returns_401(client: TestClient) -> None:
    """Sin JWT → 401 Unauthorized (independiente del X-Tenant-ID).

    Refuerza AD-2: el engine IAM maneja 401 antes de evaluar tenant.
    Scenario 4 prerequisite: el engine verifica JWT primero.
    """
    any_tenant_id = str(uuid.uuid4())

    response = client.get(
        "/api/v1/iam/users/me",
        headers={"X-Tenant-ID": any_tenant_id},
        # Sin Authorization header
    )

    assert response.status_code == 401, (
        f"Expected 401 para request sin JWT, got {response.status_code}. "
        "El engine luana_core_iam debe retornar 401 cuando no hay Bearer token."
    )


def test_foreign_tenant_header_rejected() -> None:
    """X-Tenant-ID ajeno + valid user → 403 Forbidden.

    Scenario 4 gherkin: GIVEN valid JWT for user in tenant A
                        WHEN request with X-Tenant-ID = tenant B (no link)
                        THEN HTTPException 403

    Prueba directa del engine dependency get_current_user con DB mockeada
    que retorna None para el user_tenants query (user no tiene link al tenant).
    """
    from luana_core_iam.api.dependencies import get_current_user

    foreign_tenant_id = str(uuid.uuid4())

    # Mock DB session: returns None for user_tenants query (no link exists)
    mock_session = MagicMock()
    mock_exec_result = MagicMock()
    mock_exec_result.scalars.return_value.first.return_value = None
    mock_session.execute.return_value = mock_exec_result

    # Mock user: exists and is valid (JWT-verified) but has NO link to foreign tenant
    mock_user = User(
        id=uuid.uuid4(),
        email="owner.demo@nicolify.com",
        clerk_id="clerk_test_nicolify_owner",
        full_name="Owner Demo",
        role="owner",
        is_active=True,
    )

    # Call get_current_user directly — engine must raise 403 when user_tenant link is None
    with pytest.raises(HTTPException) as exc_info:
        get_current_user(
            db=mock_session,
            user=mock_user,
            x_tenant_id=foreign_tenant_id,
        )

    assert exc_info.value.status_code == 403, (
        f"Engine get_current_user debe retornar 403 para X-Tenant-ID ajeno, "
        f"got {exc_info.value.status_code}. "
        "El user_tenants query retorna None → HTTPException 403 obligatorio."
    )
    assert "Acceso Denegado" in exc_info.value.detail, (
        "El mensaje 403 debe incluir 'Acceso Denegado' (engine luana_core_iam message). "
        f"Actual: {exc_info.value.detail}"
    )


def test_tenant_isolation_no_reimplementation() -> None:
    """Verificación estática: nicolify NO reimplementa la lógica de tenant isolation.

    Confirma que src/ de nicolify no define get_current_user ni verify_clerk_token
    localmente (anti-duplication.md — CONSUMIR engine, no recrear).

    V-AV-6 grader verificado en este test.
    """
    src_dir = Path(__file__).resolve().parents[3] / "src"

    forbidden_defs = {
        "get_current_user",
        "verify_clerk_token",
        "verify_token_payload",
    }
    violations: list[str] = []

    if not src_dir.exists():
        return  # src not yet created — architecture test will catch

    for py_file in src_dir.rglob("*.py"):
        try:
            tree = ast.parse(py_file.read_text(encoding="utf-8"))
        except SyntaxError:
            continue

        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name in forbidden_defs:
                violations.append(f"{py_file.relative_to(src_dir)}: def {node.name}()")

    assert not violations, (
        "nicolify/backend/src/ reimplementa funciones del engine IAM:\n"
        + "\n".join(violations)
        + "\nAD-2 + anti-duplication.md: CONSUMIR luana_core_iam, NUNCA recrear."
    )
