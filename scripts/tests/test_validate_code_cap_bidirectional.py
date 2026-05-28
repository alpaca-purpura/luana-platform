"""Tests for scripts/validate_code_cap_bidirectional.py (cement 2026-05-28).

Atomics killed 2026-05-28 — cross_check_1 (atomics→headers) and cross_check_2
(headers→atomics) were removed. Only cross_check_3 (scenarios e2e_test paths)
and cross_check_4 (access roles ↔ decorators) remain.
"""

from __future__ import annotations

import importlib.util
from pathlib import Path

import yaml


def _load_module():
    scripts_dir = Path(__file__).parent.parent
    spec = importlib.util.spec_from_file_location(
        "validate_code_cap_bidirectional",
        scripts_dir / "validate_code_cap_bidirectional.py",
    )
    mod = importlib.util.module_from_spec(spec)  # type: ignore[arg-type]
    spec.loader.exec_module(mod)  # type: ignore[union-attr]
    return mod


# ---------------------------------------------------------------------------
# Helper writers
# ---------------------------------------------------------------------------

_CAP_TEMPLATE = """\
---
{yaml_content}
---

# Body
"""


def _write_cap(caps_root: Path, module: str, slug: str, data: dict) -> Path:
    module_dir = caps_root / module
    module_dir.mkdir(parents=True, exist_ok=True)
    path = module_dir / f"{slug}.yaml"
    yaml_text = yaml.dump(data, allow_unicode=True, default_flow_style=False)
    path.write_text(_CAP_TEMPLATE.format(yaml_content=yaml_text), encoding="utf-8")
    return path


def _write_code(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def _setup(tmp_path: Path, brand: str = "vitalia") -> tuple[Path, Path, Path, Path]:
    """Returns (caps_root, be_root, fe_root, e2e_root)."""
    caps_root = tmp_path / brand / "docs" / "product" / "capabilities"
    be_root = tmp_path / brand / "backend" / "src"
    fe_root = tmp_path / brand / "frontend" / "src"
    e2e_root = tmp_path / brand / "frontend" / "e2e"
    caps_root.mkdir(parents=True, exist_ok=True)
    be_root.mkdir(parents=True, exist_ok=True)
    fe_root.mkdir(parents=True, exist_ok=True)
    e2e_root.mkdir(parents=True, exist_ok=True)
    return caps_root, be_root, fe_root, e2e_root


def _write_code_index(tmp_path: Path, brand: str, cap_to_files: dict[str, list[str]]) -> None:
    """Write a minimal _code-index.json so cross_check_4 can resolve files."""
    import json

    idx_path = tmp_path / brand / "docs" / "product" / "capabilities" / "_code-index.json"
    idx_path.parent.mkdir(parents=True, exist_ok=True)
    idx_path.write_text(
        json.dumps({"cap_to_files": cap_to_files}), encoding="utf-8"
    )


# ---------------------------------------------------------------------------
# load_capabilities
# ---------------------------------------------------------------------------


def test_load_capabilities(tmp_path: Path):
    mod = _load_module()
    caps_root, _, _, _ = _setup(tmp_path)
    _write_cap(caps_root, "scheduling", "valeria-agenda", {"slug": "valeria-agenda"})
    caps = mod.load_capabilities("vitalia", tmp_path)
    assert "scheduling.valeria-agenda" in caps


# ---------------------------------------------------------------------------
# Cross-check 3 — Scenarios e2e_test path existence
# ---------------------------------------------------------------------------


def test_cross_check_3_pass(tmp_path: Path):
    mod = _load_module()
    caps_root, _, _, e2e_root = _setup(tmp_path)

    spec = e2e_root / "agenda.spec.ts"
    _write_code(spec, "import { test } from '@playwright/test';\ntest('foo', async () => {});\n")

    cap_data = {
        "slug": "valeria-agenda",
        "scenarios": [
            {"id": "doctor-ve-agenda", "e2e_test": "vitalia/frontend/e2e/agenda.spec.ts"}
        ],
    }
    _write_cap(caps_root, "scheduling", "valeria-agenda", cap_data)

    caps = mod.load_capabilities("vitalia", tmp_path)
    result = mod.cross_check_3(caps, tmp_path)
    assert result["total"] == 1
    assert result["pass"] == 1
    assert result["drift"] == 0


def test_cross_check_3_missing_file(tmp_path: Path):
    mod = _load_module()
    caps_root, _, _, _ = _setup(tmp_path)

    cap_data = {
        "slug": "valeria-agenda",
        "scenarios": [
            {"id": "doctor-ve-agenda", "e2e_test": "vitalia/frontend/e2e/missing.spec.ts"}
        ],
    }
    _write_cap(caps_root, "scheduling", "valeria-agenda", cap_data)

    caps = mod.load_capabilities("vitalia", tmp_path)
    result = mod.cross_check_3(caps, tmp_path)
    assert result["drift"] == 1
    assert result["details"][0]["status"] == "missing_file"


def test_cross_check_3_no_test_pattern(tmp_path: Path):
    """File exists but has no `test(` or `test.describe(`."""
    mod = _load_module()
    caps_root, _, _, e2e_root = _setup(tmp_path)

    spec = e2e_root / "not-a-test.spec.ts"
    _write_code(spec, "// Just some utility code\nexport const x = 1;\n")

    cap_data = {
        "slug": "valeria-agenda",
        "scenarios": [
            {"id": "doctor-ve-agenda", "e2e_test": "vitalia/frontend/e2e/not-a-test.spec.ts"}
        ],
    }
    _write_cap(caps_root, "scheduling", "valeria-agenda", cap_data)

    caps = mod.load_capabilities("vitalia", tmp_path)
    result = mod.cross_check_3(caps, tmp_path)
    assert result["drift"] == 1
    assert result["details"][0]["status"] == "no_test_pattern"


def test_cross_check_3_null_e2e_skips(tmp_path: Path):
    """Scenarios with e2e_test: null should not be counted."""
    mod = _load_module()
    caps_root, _, _, _ = _setup(tmp_path)

    cap_data = {
        "slug": "valeria-agenda",
        "scenarios": [
            {"id": "x", "e2e_test": None},
            {"id": "y", "e2e_test": None},
        ],
    }
    _write_cap(caps_root, "scheduling", "valeria-agenda", cap_data)

    caps = mod.load_capabilities("vitalia", tmp_path)
    result = mod.cross_check_3(caps, tmp_path)
    assert result["total"] == 0


# ---------------------------------------------------------------------------
# Cross-check 4 — Access roles ↔ decorators
# ---------------------------------------------------------------------------


def test_cross_check_4_pass_roles_match(tmp_path: Path):
    mod = _load_module()
    caps_root, be_root, _, _ = _setup(tmp_path)

    py_file = be_root / "api.py"
    _write_code(
        py_file,
        "# cap: scheduling.valeria-agenda\n# story-origin: TBD\n"
        "@require_phi_access(roles=['doctor', 'admin_clinic'])\n"
        "def get_agenda(): pass\n",
    )
    _write_code_index(tmp_path, "vitalia", {"scheduling.valeria-agenda": ["vitalia/backend/src/api.py"]})

    cap_data = {
        "slug": "valeria-agenda",
        "access": {
            "entry_points": [
                {
                    "path": "/api/v1/agenda",
                    "requires_role": ["doctor", "admin_clinic"],
                    "entry_type": "api",
                }
            ]
        },
    }
    _write_cap(caps_root, "scheduling", "valeria-agenda", cap_data)

    caps = mod.load_capabilities("vitalia", tmp_path)
    result = mod.cross_check_4(caps, tmp_path, "vitalia")
    assert result["pass"] == 1


def test_cross_check_4_drift_role_mismatch(tmp_path: Path):
    mod = _load_module()
    caps_root, be_root, _, _ = _setup(tmp_path)

    py_file = be_root / "api.py"
    _write_code(
        py_file,
        "# cap: scheduling.valeria-agenda\n# story-origin: TBD\n"
        "@require_phi_access(roles=['nurse'])\n"  # Different role!
        "def get_agenda(): pass\n",
    )
    _write_code_index(tmp_path, "vitalia", {"scheduling.valeria-agenda": ["vitalia/backend/src/api.py"]})

    cap_data = {
        "slug": "valeria-agenda",
        "access": {
            "entry_points": [
                {
                    "path": "/api/v1/agenda",
                    "requires_role": ["doctor", "admin_clinic"],
                    "entry_type": "api",
                }
            ]
        },
    }
    _write_cap(caps_root, "scheduling", "valeria-agenda", cap_data)

    caps = mod.load_capabilities("vitalia", tmp_path)
    result = mod.cross_check_4(caps, tmp_path, "vitalia")
    assert result["drift"] == 1
    assert result["details"][0]["status"] == "role_mismatch"


def test_cross_check_4_ui_entry_lenient(tmp_path: Path):
    """UI entry without decorator should pass (Clerk middleware handles)."""
    mod = _load_module()
    caps_root, _, fe_root, _ = _setup(tmp_path)

    tsx_file = fe_root / "page.tsx"
    _write_code(
        tsx_file,
        "// cap: scheduling.valeria-agenda\n// story-origin: TBD\n"
        "export default function Page() { return null; }\n",
    )
    _write_code_index(tmp_path, "vitalia", {"scheduling.valeria-agenda": ["vitalia/frontend/src/page.tsx"]})

    cap_data = {
        "slug": "valeria-agenda",
        "access": {
            "entry_points": [
                {
                    "path": "/valeria/agenda",
                    "requires_role": ["doctor"],
                    "entry_type": "ui",
                }
            ]
        },
    }
    _write_cap(caps_root, "scheduling", "valeria-agenda", cap_data)

    caps = mod.load_capabilities("vitalia", tmp_path)
    result = mod.cross_check_4(caps, tmp_path, "vitalia")
    assert result["pass"] == 1
