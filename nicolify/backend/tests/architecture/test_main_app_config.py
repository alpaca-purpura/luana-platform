"""Architecture fitness: main.py configuración obligatoria.

Verifica que la app FastAPI de Nicolify cumpla con:
  1. redirect_slashes=False (obligatorio per backend-ddd.md — 307 POST mata body en Next.js)
  2. /health y /api/health con response_model=HealthResponse explícito
  3. IAM router montado en prefix /api/v1/iam/users (AD-2 anti-duplication)

T-1 nicolify-r0-dev-stack — V-AV-1.
downstream-regression-na: brand-local arch fitness; no cross-brand consumers
"""

from __future__ import annotations

import ast
from pathlib import Path

WS_ROOT = Path(__file__).resolve().parents[4]
MAIN_PY = WS_ROOT / "nicolify" / "backend" / "src" / "main.py"


def _parse_main() -> ast.Module:
    return ast.parse(MAIN_PY.read_text(encoding="utf-8"))


def test_main_py_exists() -> None:
    """main.py debe existir."""
    assert MAIN_PY.exists(), f"nicolify/backend/src/main.py no encontrado en {MAIN_PY}"


def test_redirect_slashes_false() -> None:
    """FastAPI(redirect_slashes=False) debe estar presente.

    Default redirect_slashes=True genera 307 POST en Next.js que descarta el body.
    """
    tree = _parse_main()
    found = False
    for node in ast.walk(tree):
        # Look for FastAPI(..., redirect_slashes=False)
        if isinstance(node, ast.Call):
            func = node.func
            func_name = getattr(func, "id", None) or getattr(func, "attr", None)
            if func_name == "FastAPI":
                for kw in node.keywords:
                    if kw.arg == "redirect_slashes" and isinstance(kw.value, ast.Constant) and kw.value.value is False:
                        found = True
    assert found, (
        "FastAPI(redirect_slashes=False) no encontrado en main.py. "
        "Obligatorio per backend-ddd.md (POST 307 Next.js drops body)."
    )


def test_health_route_has_response_model() -> None:
    """/health debe declarar response_model= explícito."""
    tree = _parse_main()
    health_funcs: list[str] = []
    health_with_model: list[str] = []

    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef):
            for decorator in node.decorator_list:
                if isinstance(decorator, ast.Call):
                    func = decorator.func
                    if isinstance(func, ast.Attribute) and func.attr == "get":
                        # Check path argument
                        args = decorator.args
                        path = None
                        if args and isinstance(args[0], ast.Constant):
                            path = args[0].value
                        # Check keyword path=
                        for kw in decorator.keywords:
                            if kw.arg == "path" and isinstance(kw.value, ast.Constant):
                                path = kw.value.value

                        if path in ("/health", "/api/health"):
                            health_funcs.append(f"{path}::{node.name}")
                            for kw in decorator.keywords:
                                if kw.arg == "response_model":
                                    health_with_model.append(f"{path}::{node.name}")

    assert health_funcs, "/health y/o /api/health no encontrados en main.py"
    missing = set(health_funcs) - set(health_with_model)
    assert not missing, (
        f"Las siguientes rutas health NO tienen response_model=: {missing}. "
        "Obligatorio per anti-duplication AD-2 + PII gate."
    )


def test_api_health_route_has_response_model() -> None:
    """/api/health debe declarar response_model= explícito (igual que /health)."""
    tree = _parse_main()
    api_health_found = False
    api_health_has_model = False

    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef):
            for decorator in node.decorator_list:
                if isinstance(decorator, ast.Call):
                    func = decorator.func
                    if isinstance(func, ast.Attribute) and func.attr == "get":
                        args = decorator.args
                        path = None
                        if args and isinstance(args[0], ast.Constant):
                            path = args[0].value
                        if path == "/api/health":
                            api_health_found = True
                            for kw in decorator.keywords:
                                if kw.arg == "response_model":
                                    api_health_has_model = True

    assert api_health_found, "/api/health no encontrado en main.py — requerido por Scenario 1 (stack-up-green)"
    assert api_health_has_model, "/api/health sin response_model= — requerido para PII gate + arch fitness"


def test_iam_router_mounted() -> None:
    """IAM router del engine debe estar montado (AD-2 anti-duplication — CERO /me local)."""
    source = MAIN_PY.read_text(encoding="utf-8")
    assert "luana_core_iam" in source, (
        "luana_core_iam no importado en main.py. "
        "AD-2: el router IAM engine DEBE montarse verbatim (NO crear /me local)."
    )
    assert "include_router" in source, "app.include_router() no encontrado en main.py"
    assert "/api/v1/iam/users" in source, (
        "Prefix /api/v1/iam/users no encontrado — IAM router debe montarse en ese prefix (paridad vitalia)."
    )
