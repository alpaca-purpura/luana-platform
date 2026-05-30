"""Architecture fitness: toda route FastAPI en nicolify debe declarar response_model=.

Escanea todos los archivos *router*.py y *route*.py bajo nicolify/backend/src/
con análisis AST de argumentos de decoradores de ruta.

Allowlist de excepción: frozenset() — vacío, shrink-only.

T-1 nicolify-r0-dev-stack — V-AV-2.
downstream-regression-na: brand-local arch fitness; no cross-brand consumers
"""

from __future__ import annotations

import ast
from pathlib import Path

WS_ROOT = Path(__file__).resolve().parents[4]
NICOLIFY_SRC = WS_ROOT / "nicolify" / "backend" / "src"

# También escanear main.py directamente
MAIN_PY = NICOLIFY_SRC / "main.py"

# HTTP method decorators que requieren response_model=
ROUTE_DECORATOR_ATTRS: frozenset[str] = frozenset(
    [
        "get",
        "post",
        "put",
        "patch",
        "delete",
        "head",
        "options",
    ]
)

KNOWN_RESPONSE_MODEL_EXEMPT: frozenset[str] = frozenset(
    []  # shrink-only allowlist — agregar con justificación en commit
)

SKIP_FILE_SUFFIXES: tuple[str, ...] = ("conftest.py", "__init__.py")


def _route_files() -> list[Path]:
    """Retorna archivos de rutas bajo nicolify/backend/src/."""
    if not NICOLIFY_SRC.exists():
        return []
    candidates: list[Path] = []
    # Include main.py
    if MAIN_PY.exists():
        candidates.append(MAIN_PY)
    # Include router/route files under modules
    for p in NICOLIFY_SRC.rglob("*.py"):
        name = p.name
        if any(name.endswith(s) for s in SKIP_FILE_SUFFIXES):
            continue
        if "router" in name or "route" in name:
            candidates.append(p)
    # Deduplicate
    return sorted(set(candidates))


def _relative(p: Path) -> str:
    return str(p.relative_to(WS_ROOT))


def _is_route_decorator(decorator: ast.expr) -> bool:
    if isinstance(decorator, ast.Call):
        func = decorator.func
        if isinstance(func, ast.Attribute):
            return func.attr in ROUTE_DECORATOR_ATTRS
    return False


def _has_response_model_kwarg(decorator: ast.Call) -> bool:
    return any(kw.arg == "response_model" for kw in decorator.keywords)


def test_all_routes_have_response_model() -> None:
    """Toda route en nicolify/backend/src debe declarar response_model=.

    Garantiza que el contrato de API esté explícito y PII no se filtre
    a través de modelos de respuesta implícitos (dict, Any).
    """
    violations: list[str] = []

    for filepath in _route_files():
        try:
            tree = ast.parse(filepath.read_text(encoding="utf-8"))
        except SyntaxError:
            continue

        for node in ast.walk(tree):
            if not isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef):
                continue
            for decorator in node.decorator_list:
                if not (_is_route_decorator(decorator) and isinstance(decorator, ast.Call)):
                    continue
                if _has_response_model_kwarg(decorator):
                    continue
                # Exempt check
                key = f"{_relative(filepath)}::{node.name}"
                if key in KNOWN_RESPONSE_MODEL_EXEMPT:
                    continue
                violations.append(f"{_relative(filepath)}::{node.name} (línea {node.lineno}) — sin response_model=")

    assert not violations, (
        "Routes sin response_model= detectadas en nicolify/backend/src/:\n"
        + "\n".join(violations)
        + "\nAgregar response_model= o justificar en KNOWN_RESPONSE_MODEL_EXEMPT "
        "(shrink-only allowlist)."
    )
