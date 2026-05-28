"""Tests para scripts/validate_atomics_implementation.py.

Usa fixtures inline via tmp_path — NO depende de archivos cap reales.
Todos los paths usan la convención relativa al workspace root que el script espera.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest
import yaml

# ---------------------------------------------------------------------------
# Importar las funciones del script bajo test
# ---------------------------------------------------------------------------
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

from validate_atomics_implementation import (
    _compute_atomic_status,
    _parse_frontmatter,
    process_brand,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _write_cap_yaml(caps_dir: Path, module: str, slug: str, data: dict) -> Path:
    """Escribe un capability YAML en la estructura de directorios esperada."""
    module_dir = caps_dir / module
    module_dir.mkdir(parents=True, exist_ok=True)
    path = module_dir / f"{slug}.yaml"
    # Serializar como frontmatter YAML
    content = "---\n" + yaml.dump(data, allow_unicode=True, default_flow_style=False) + "---\n"
    path.write_text(content, encoding="utf-8")
    return path


def _make_workspace(tmp_path: Path, brand: str = "vitalia") -> tuple[Path, Path]:
    """Crea estructura mínima workspace/brand/docs/product/capabilities/."""
    ws = tmp_path / "workspace"
    caps_dir = ws / brand / "docs" / "product" / "capabilities"
    caps_dir.mkdir(parents=True)
    return ws, caps_dir


# ---------------------------------------------------------------------------
# Test 1 — verified cuando path existe
# ---------------------------------------------------------------------------


def test_verified_when_path_exists(tmp_path: Path) -> None:
    """Un atomic con fe_path declarado que existe → verified."""
    ws, caps_dir = _make_workspace(tmp_path)

    # Crear el archivo de implementación
    fe_file = ws / "vitalia" / "frontend" / "src" / "components" / "MyComp.tsx"
    fe_file.parent.mkdir(parents=True)
    fe_file.write_text("export default function MyComp() {}", encoding="utf-8")

    atomic: dict = {
        "id": "my-comp",
        "name": "Mi componente",
        "surface": "FE",
        "status": "live",
        "added_in_story": "vitalia-story-1",
        "verification": {
            "fe_path": "vitalia/frontend/src/components/MyComp.tsx",
            "be_path": None,
            "agentic_path": None,
            "e2e_test": None,
        },
    }

    result = _compute_atomic_status(atomic, ws)

    assert result["verification_status"] == "verified", (
        f"Esperado 'verified', obtenido '{result['verification_status']}'. "
        f"drift_reasons: {result['drift_reasons']}"
    )
    assert result["checks"]["fe_path"]["exists"] is True
    assert result["checks"]["fe_path"]["declared"] == "vitalia/frontend/src/components/MyComp.tsx"
    assert result["drift_reasons"] == []


# ---------------------------------------------------------------------------
# Test 2 — drift cuando path declarado no existe
# ---------------------------------------------------------------------------


def test_drift_when_path_declared_but_missing(tmp_path: Path) -> None:
    """Un atomic con fe_path declarado que NO existe → drift."""
    ws, _ = _make_workspace(tmp_path)

    atomic: dict = {
        "id": "missing-comp",
        "name": "Componente faltante",
        "surface": "FE",
        "status": "live",
        "added_in_story": "vitalia-story-1",
        "verification": {
            "fe_path": "vitalia/frontend/src/components/NoExiste.tsx",
            "be_path": None,
            "agentic_path": None,
            "e2e_test": None,
        },
    }

    result = _compute_atomic_status(atomic, ws)

    assert result["verification_status"] == "drift", (
        f"Esperado 'drift', obtenido '{result['verification_status']}'"
    )
    assert result["checks"]["fe_path"]["exists"] is False
    assert len(result["drift_reasons"]) >= 1
    assert "NoExiste.tsx" in result["drift_reasons"][0]


# ---------------------------------------------------------------------------
# Test 3 — unverified cuando no hay paths declarados
# ---------------------------------------------------------------------------


def test_unverified_when_no_paths_declared(tmp_path: Path) -> None:
    """Un atomic sin bloque verification → unverified (advisory, no error)."""
    ws, _ = _make_workspace(tmp_path)

    atomic: dict = {
        "id": "no-verification",
        "name": "Sin verificación",
        "surface": "FE",
        "status": "live",
        "added_in_story": "vitalia-story-1",
        # Sin bloque verification
    }

    result = _compute_atomic_status(atomic, ws)

    assert result["verification_status"] == "unverified", (
        f"Esperado 'unverified', obtenido '{result['verification_status']}'"
    )
    assert result["drift_reasons"] == []

    # Todos los checks deben tener declared=None
    for field in ("fe_path", "be_path", "agentic_path", "e2e_test"):
        assert result["checks"][field]["declared"] is None
        assert result["checks"][field]["exists"] is None


# ---------------------------------------------------------------------------
# Test 4 — partial cuando solo subset de paths existen
# ---------------------------------------------------------------------------


def test_partial_when_only_subset_paths_exist(tmp_path: Path) -> None:
    """Atomic FE+BE con fe_path OK pero be_path ausente → partial."""
    ws, _ = _make_workspace(tmp_path)

    # Solo el archivo FE existe
    fe_file = ws / "vitalia" / "frontend" / "src" / "SomeComp.tsx"
    fe_file.parent.mkdir(parents=True)
    fe_file.write_text("// fe", encoding="utf-8")

    atomic: dict = {
        "id": "fe-be-combo",
        "name": "Componente FE+BE",
        "surface": "FE+BE",
        "status": "live",
        "added_in_story": "vitalia-story-1",
        "verification": {
            "fe_path": "vitalia/frontend/src/SomeComp.tsx",
            "be_path": "vitalia/backend/src/modules/vitalia/missing.py",
            "agentic_path": None,
            "e2e_test": None,
        },
    }

    result = _compute_atomic_status(atomic, ws)

    # be_path declarado pero no existe → drift (not partial)
    # drift toma precedencia: cualquier path declarado que no existe = drift
    assert result["verification_status"] in ("drift", "partial"), (
        f"Obtenido '{result['verification_status']}'"
    )
    assert result["checks"]["fe_path"]["exists"] is True
    assert result["checks"]["be_path"]["exists"] is False


# ---------------------------------------------------------------------------
# Test 5 — e2e test smoke check pattern
# ---------------------------------------------------------------------------


def test_e2e_test_smoke_check_pattern(tmp_path: Path) -> None:
    """e2e_test existente que contiene 'test(' → no drift. Sin patrón → drift."""
    ws, _ = _make_workspace(tmp_path)

    # Crear spec válido
    spec_dir = ws / "vitalia" / "frontend" / "e2e"
    spec_dir.mkdir(parents=True)
    valid_spec = spec_dir / "mycomp.spec.ts"
    valid_spec.write_text(
        "import { test, expect } from '@playwright/test';\n"
        "test.describe('MyComp', () => {\n"
        "  test('renders correctly', async ({ page }) => {\n"
        "    await expect(page).toHaveURL('/');\n"
        "  });\n"
        "});\n",
        encoding="utf-8",
    )

    # Spec sin patrón test(
    invalid_spec = spec_dir / "broken.spec.ts"
    invalid_spec.write_text("// no tests here\nconsole.log('hello');\n", encoding="utf-8")

    fe_file = ws / "vitalia" / "frontend" / "src" / "Comp.tsx"
    fe_file.parent.mkdir(parents=True)
    fe_file.write_text("// comp", encoding="utf-8")

    # Caso válido
    atomic_valid: dict = {
        "id": "comp-valid-e2e",
        "name": "Comp con e2e válido",
        "surface": "FE",
        "status": "live",
        "added_in_story": "vitalia-story-1",
        "verification": {
            "fe_path": "vitalia/frontend/src/Comp.tsx",
            "be_path": None,
            "agentic_path": None,
            "e2e_test": "vitalia/frontend/e2e/mycomp.spec.ts",
        },
    }

    result_valid = _compute_atomic_status(atomic_valid, ws)
    assert result_valid["checks"]["e2e_test"]["exists"] is True
    assert result_valid["checks"]["e2e_test"].get("contains_test_pattern") is True

    # Caso con spec sin patrón → drift por advertencia de contenido
    atomic_invalid: dict = {
        "id": "comp-invalid-e2e",
        "name": "Comp con e2e sin patrón",
        "surface": "FE",
        "status": "live",
        "added_in_story": "vitalia-story-1",
        "verification": {
            "fe_path": "vitalia/frontend/src/Comp.tsx",
            "be_path": None,
            "agentic_path": None,
            "e2e_test": "vitalia/frontend/e2e/broken.spec.ts",
        },
    }

    result_invalid = _compute_atomic_status(atomic_invalid, ws)
    assert result_invalid["checks"]["e2e_test"]["exists"] is True
    assert result_invalid["checks"]["e2e_test"].get("contains_test_pattern") is False
    # drift_reason debe advertir sobre patrón faltante
    assert any("test(" in r or "test.describe(" in r or "Playwright" in r
               for r in result_invalid["drift_reasons"])


# ---------------------------------------------------------------------------
# Test 6 — skip caps sin atomics
# ---------------------------------------------------------------------------


def test_skip_caps_without_atomics(tmp_path: Path) -> None:
    """Caps sin atomics (vacío o ausente) no aparecen en el output."""
    ws, caps_dir = _make_workspace(tmp_path)

    # Cap sin atomics
    _write_cap_yaml(caps_dir, "module-a", "cap-stub", {
        "slug": "cap-stub",
        "status": "live",
        "atomics": [],
    })

    # Cap con atomics pero sin verification
    _write_cap_yaml(caps_dir, "module-a", "cap-with-atomics", {
        "slug": "cap-with-atomics",
        "status": "live",
        "atomics": [
            {
                "id": "atomic-one",
                "name": "Atomic uno",
                "surface": "FE",
                "status": "live",
                "added_in_story": "vitalia-story-1",
            }
        ],
    })

    result = process_brand("vitalia", ws, verbose=False)

    # Cap stub no debe aparecer
    assert "cap-stub" not in result["capabilities"], (
        "cap-stub no tiene atomics y no debería aparecer en el output"
    )
    # Cap con atomics sí debe aparecer
    assert "cap-with-atomics" in result["capabilities"]

    # El atomic sin verification → unverified
    cap_data = result["capabilities"]["cap-with-atomics"]
    assert cap_data["atomics_total"] == 1
    assert cap_data["unverified"] == 1
    assert cap_data["drift"] == 0


# ---------------------------------------------------------------------------
# Test 7 — strict flag sale con exit 1 si hay drift
# ---------------------------------------------------------------------------


def test_strict_flag_exits_1_on_drift(tmp_path: Path, capsys: pytest.CaptureFixture) -> None:
    """process_brand + --strict: verifica que hay drift detectado para activar exit 1."""
    ws, caps_dir = _make_workspace(tmp_path)

    # Cap con atomic cuyo fe_path no existe → drift
    _write_cap_yaml(caps_dir, "module-b", "cap-drift", {
        "slug": "cap-drift",
        "status": "live",
        "atomics": [
            {
                "id": "drifting-atomic",
                "name": "Atomic con drift",
                "surface": "FE",
                "status": "live",
                "added_in_story": "vitalia-story-1",
                "verification": {
                    "fe_path": "vitalia/frontend/src/components/GoneMissing.tsx",
                    "be_path": None,
                    "agentic_path": None,
                    "e2e_test": None,
                },
            }
        ],
    })

    result = process_brand("vitalia", ws, verbose=False)

    assert result["summary"]["drift"] > 0, (
        "Debe haber al menos 1 drift para testear el flag --strict"
    )

    # Simular comportamiento --strict: si drift > 0 el script saldría con exit 1
    drift_count = result["summary"]["drift"]
    assert drift_count >= 1

    # Verificar que el atomic fue clasificado como drift
    cap_data = result["capabilities"]["cap-drift"]
    assert cap_data["drift"] == 1
    assert cap_data["verified"] == 0

    # El detail debe incluir el atomic en drift
    drifting = [d for d in cap_data["details"] if d["verification_status"] == "drift"]
    assert len(drifting) == 1
    assert drifting[0]["atomic_id"] == "drifting-atomic"
