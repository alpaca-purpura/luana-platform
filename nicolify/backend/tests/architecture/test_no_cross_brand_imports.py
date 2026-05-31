"""Architecture fitness: nicolify/backend/src no debe importar de otros brands.

Verifica que ningún archivo Python bajo nicolify/backend/src/ importe
desde vitalia, comunify, lupulo ni ningún otro brand.
Sí se permiten imports de luana_core_* (engine compartido).

T-1 nicolify-r0-dev-stack — V-AV-5.
downstream-regression-na: brand-local arch fitness; no cross-brand consumers
"""

from __future__ import annotations

import ast
from pathlib import Path

WS_ROOT = Path(__file__).resolve().parents[4]
NICOLIFY_SRC = WS_ROOT / "nicolify" / "backend" / "src"

# Brands that nicolify MUST NEVER import from
FORBIDDEN_BRANDS: frozenset[str] = frozenset(
    [
        "vitalia",
        "comunify",
        "lupulo",
        "saasora",
        "inmoflow",
        "retailly",
        "fixia",
        "guestly",
        "fitflow",
    ]
)


def _python_files() -> list[Path]:
    if not NICOLIFY_SRC.exists():
        return []
    return sorted(NICOLIFY_SRC.rglob("*.py"))


def _get_imports(path: Path) -> list[str]:
    """Extract all import module names from a Python file."""
    try:
        tree = ast.parse(path.read_text(encoding="utf-8"))
    except SyntaxError:
        return []
    imports: list[str] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.ImportFrom) and node.module:
            imports.append(node.module)
        elif isinstance(node, ast.Import):
            imports.extend(alias.name for alias in node.names)
    return imports


def test_no_cross_brand_imports() -> None:
    """nicolify/backend/src nunca debe importar de otros brands.

    Patrón correcto: consumir engine luana_core_* vía import.
    NUNCA: from vitalia.modules.x import y (cross-brand mirror prohibido).
    """
    violations: list[str] = []
    python_files = _python_files()

    for filepath in python_files:
        imports = _get_imports(filepath)
        for imp in imports:
            # Check if import starts with any forbidden brand name
            root_module = imp.split(".")[0]
            if root_module in FORBIDDEN_BRANDS:
                rel_path = filepath.relative_to(WS_ROOT)
                violations.append(f"{rel_path}: import prohibido 'from {imp}'")

    assert not violations, (
        "Imports cross-brand detectados en nicolify/backend/src/:\n"
        + "\n".join(violations)
        + "\nPatrón correcto: consumir engine vía 'from luana_core_* import ...' "
        "(anti-duplication.md — cross-brand mirror prohibido)."
    )


def test_no_string_cross_brand_references() -> None:
    """Ningún archivo nicolify debe referenciar paths de otros brands como strings.

    Evita que se usen paths como 'vitalia/backend/src' en imports dinámicos.
    """
    violations: list[str] = []
    python_files = _python_files()

    import re

    combined = "|".join(rf"['\"]({brand})\." for brand in FORBIDDEN_BRANDS)

    for filepath in python_files:
        content = filepath.read_text(encoding="utf-8")
        matches = re.findall(combined, content)
        if matches:
            rel_path = filepath.relative_to(WS_ROOT)
            violations.append(f"{rel_path}: referencia a brand ajeno en string: {matches}")

    # Only fail if we have code files (not test files or docs)
    code_violations = [v for v in violations if "test_" not in v.split(":")[0]]
    assert not code_violations, (
        "Referencias a brands ajenos en strings detectadas en código fuente nicolify:\n" + "\n".join(code_violations)
    )
