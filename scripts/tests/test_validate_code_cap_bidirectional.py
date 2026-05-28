"""Tests for scripts/validate_code_cap_bidirectional.py (v3.2 cement 2026-05-28)."""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path

import pytest
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


# ---------------------------------------------------------------------------
# parse_cap_list / parse_atomics_list / get_header_info
# ---------------------------------------------------------------------------


def test_parse_cap_list_simple():
    mod = _load_module()
    assert mod.parse_cap_list("scheduling.valeria-agenda") == ["scheduling.valeria-agenda"]


def test_parse_cap_list_array():
    mod = _load_module()
    assert mod.parse_cap_list("[a.b, c.d]") == ["a.b", "c.d"]


def test_parse_atomics_list_simple():
    mod = _load_module()
    assert mod.parse_atomics_list("vista-calendario, drag-to-reschedule") == [
        "vista-calendario",
        "drag-to-reschedule",
    ]


def test_parse_atomics_list_tbd_empty():
    mod = _load_module()
    assert mod.parse_atomics_list("TBD") == []
    assert mod.parse_atomics_list("") == []


def test_get_header_info_python(tmp_path: Path):
    mod = _load_module()
    f = tmp_path / "x.py"
    _write_code(
        f,
        "# cap: scheduling.valeria-agenda\n"
        "# atomics: vista-calendario, drag-to-reschedule\n"
        "# story-origin: vitalia-fase2-valeria-agenda\n"
        '"""docstring"""\n',
    )
    caps, atoms = mod.get_header_info(f)
    assert caps == ["scheduling.valeria-agenda"]
    assert atoms == ["vista-calendario", "drag-to-reschedule"]


def test_get_header_info_tsx(tmp_path: Path):
    mod = _load_module()
    f = tmp_path / "x.tsx"
    _write_code(
        f,
        "// cap: shell-organism.shell-vitalia\n"
        "// atomics: shell-ribbon\n"
        "// story-origin: vitalia-fase1-ribbon-6-tabs\n"
        "'use client';\n",
    )
    caps, atoms = mod.get_header_info(f)
    assert caps == ["shell-organism.shell-vitalia"]
    assert atoms == ["shell-ribbon"]


# ---------------------------------------------------------------------------
# Cross-check 1 — Atomics verification → headers
# ---------------------------------------------------------------------------


def test_cross_check_1_pass(tmp_path: Path):
    mod = _load_module()
    caps_root, be_root, _, _ = _setup(tmp_path)

    # Code file with matching header
    py_file = be_root / "x.py"
    _write_code(
        py_file,
        "# cap: scheduling.valeria-agenda\n# atomics: TBD\n# story-origin: TBD\n",
    )

    # Cap declares this file in atomics.verification.be_path
    cap_data = {
        "slug": "valeria-agenda",
        "atomics": [
            {
                "id": "vista-calendario",
                "verification": {"be_path": "vitalia/backend/src/x.py"},
            }
        ],
    }
    _write_cap(caps_root, "scheduling", "valeria-agenda", cap_data)

    caps = mod.load_capabilities("vitalia", tmp_path)
    result = mod.cross_check_1(caps, tmp_path)
    assert result["total"] == 1
    assert result["pass"] == 1
    assert result["drift"] == 0


def test_cross_check_1_header_mismatch(tmp_path: Path):
    mod = _load_module()
    caps_root, be_root, _, _ = _setup(tmp_path)

    # Code file with WRONG cap in header
    py_file = be_root / "x.py"
    _write_code(
        py_file,
        "# cap: brand_studio.lisa-marca\n# atomics: TBD\n# story-origin: TBD\n",
    )

    cap_data = {
        "slug": "valeria-agenda",
        "atomics": [
            {
                "id": "vista-calendario",
                "verification": {"be_path": "vitalia/backend/src/x.py"},
            }
        ],
    }
    _write_cap(caps_root, "scheduling", "valeria-agenda", cap_data)

    caps = mod.load_capabilities("vitalia", tmp_path)
    result = mod.cross_check_1(caps, tmp_path)
    assert result["total"] == 1
    assert result["drift"] == 1
    assert result["details"][0]["status"] == "header_mismatch"


def test_cross_check_1_missing_file(tmp_path: Path):
    mod = _load_module()
    caps_root, _, _, _ = _setup(tmp_path)

    cap_data = {
        "slug": "valeria-agenda",
        "atomics": [
            {
                "id": "vista-calendario",
                "verification": {"be_path": "vitalia/backend/src/missing.py"},
            }
        ],
    }
    _write_cap(caps_root, "scheduling", "valeria-agenda", cap_data)

    caps = mod.load_capabilities("vitalia", tmp_path)
    result = mod.cross_check_1(caps, tmp_path)
    assert result["drift"] == 1
    assert result["details"][0]["status"] == "missing_file"


def test_cross_check_1_shared_marker_allows(tmp_path: Path):
    """Files with header `# cap: __shared__` should pass cross-check 1."""
    mod = _load_module()
    caps_root, be_root, _, _ = _setup(tmp_path)

    py_file = be_root / "shared.py"
    _write_code(
        py_file,
        "# cap: __shared__\n# atomics: TBD\n# story-origin: TBD\n",
    )

    cap_data = {
        "slug": "valeria-agenda",
        "atomics": [
            {
                "id": "vista-calendario",
                "verification": {"be_path": "vitalia/backend/src/shared.py"},
            }
        ],
    }
    _write_cap(caps_root, "scheduling", "valeria-agenda", cap_data)

    caps = mod.load_capabilities("vitalia", tmp_path)
    result = mod.cross_check_1(caps, tmp_path)
    assert result["pass"] == 1


# ---------------------------------------------------------------------------
# Cross-check 2 — Headers → atomics referenced
# ---------------------------------------------------------------------------


def test_cross_check_2_pass(tmp_path: Path):
    mod = _load_module()
    caps_root, be_root, _, _ = _setup(tmp_path)

    py_file = be_root / "x.py"
    _write_code(
        py_file,
        "# cap: scheduling.valeria-agenda\n"
        "# atomics: vista-calendario\n"
        "# story-origin: TBD\n",
    )

    cap_data = {
        "slug": "valeria-agenda",
        "atomics": [{"id": "vista-calendario"}],
    }
    _write_cap(caps_root, "scheduling", "valeria-agenda", cap_data)

    caps = mod.load_capabilities("vitalia", tmp_path)
    result = mod.cross_check_2(caps, tmp_path, "vitalia")
    assert result["total"] == 1
    assert result["pass"] == 1


def test_cross_check_2_orphan_atomic_id(tmp_path: Path):
    mod = _load_module()
    caps_root, be_root, _, _ = _setup(tmp_path)

    py_file = be_root / "x.py"
    _write_code(
        py_file,
        "# cap: scheduling.valeria-agenda\n"
        "# atomics: nonexistent-atomic\n"
        "# story-origin: TBD\n",
    )

    cap_data = {
        "slug": "valeria-agenda",
        "atomics": [{"id": "vista-calendario"}],
    }
    _write_cap(caps_root, "scheduling", "valeria-agenda", cap_data)

    caps = mod.load_capabilities("vitalia", tmp_path)
    result = mod.cross_check_2(caps, tmp_path, "vitalia")
    assert result["drift"] == 1
    assert result["details"][0]["orphan_atomic_id"] == "nonexistent-atomic"


# ---------------------------------------------------------------------------
# Cross-check 3 — Scenarios e2e_test path existence
# ---------------------------------------------------------------------------


def test_cross_check_3_pass(tmp_path: Path):
    mod = _load_module()
    caps_root, _, _, e2e_root = _setup(tmp_path)

    # Write a valid Playwright spec
    spec = e2e_root / "agenda.spec.ts"
    _write_code(spec, "import { test } from '@playwright/test';\ntest('foo', async () => {});\n")

    cap_data = {
        "slug": "valeria-agenda",
        "scenarios": [
            {
                "id": "doctor-ve-agenda",
                "e2e_test": f"vitalia/frontend/e2e/agenda.spec.ts",
            }
        ],
    }
    _write_cap(caps_root, "scheduling", "valeria-agenda", cap_data)

    caps = mod.load_capabilities("vitalia", tmp_path)
    result = mod.cross_check_3(caps, tmp_path)
    assert result["total"] == 1
    assert result["pass"] == 1


def test_cross_check_3_missing_file(tmp_path: Path):
    mod = _load_module()
    caps_root, _, _, _ = _setup(tmp_path)

    cap_data = {
        "slug": "valeria-agenda",
        "scenarios": [
            {
                "id": "doctor-ve-agenda",
                "e2e_test": "vitalia/frontend/e2e/missing.spec.ts",
            }
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
            {
                "id": "doctor-ve-agenda",
                "e2e_test": "vitalia/frontend/e2e/not-a-test.spec.ts",
            }
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
        "# cap: scheduling.valeria-agenda\n# atomics: TBD\n# story-origin: TBD\n"
        "@require_phi_access(roles=['doctor', 'admin_clinic'])\n"
        "def get_agenda(): pass\n",
    )

    cap_data = {
        "slug": "valeria-agenda",
        "atomics": [
            {
                "id": "vista-calendario",
                "verification": {"be_path": "vitalia/backend/src/api.py"},
            }
        ],
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
        "# cap: scheduling.valeria-agenda\n# atomics: TBD\n# story-origin: TBD\n"
        "@require_phi_access(roles=['nurse'])\n"  # Different role!
        "def get_agenda(): pass\n",
    )

    cap_data = {
        "slug": "valeria-agenda",
        "atomics": [
            {
                "id": "vista-calendario",
                "verification": {"be_path": "vitalia/backend/src/api.py"},
            }
        ],
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
        "// cap: scheduling.valeria-agenda\n// atomics: TBD\n// story-origin: TBD\n"
        "export default function Page() { return null; }\n",
    )

    cap_data = {
        "slug": "valeria-agenda",
        "atomics": [
            {
                "id": "vista-calendario",
                "verification": {"fe_path": "vitalia/frontend/src/page.tsx"},
            }
        ],
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
