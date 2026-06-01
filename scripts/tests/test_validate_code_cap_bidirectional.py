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
    idx_path.write_text(json.dumps({"cap_to_files": cap_to_files}), encoding="utf-8")


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
        "scenarios": [{"id": "doctor-ve-agenda", "e2e_test": "vitalia/frontend/e2e/agenda.spec.ts"}],
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
        "scenarios": [{"id": "doctor-ve-agenda", "e2e_test": "vitalia/frontend/e2e/missing.spec.ts"}],
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
        "scenarios": [{"id": "doctor-ve-agenda", "e2e_test": "vitalia/frontend/e2e/not-a-test.spec.ts"}],
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


def test_cross_check_4_drift_no_enforcement(tmp_path: Path):
    """API entry with roles but NO enforcement mechanism in code → drift."""
    mod = _load_module()
    caps_root, be_root, _, _ = _setup(tmp_path)

    py_file = be_root / "events.py"
    _write_code(
        py_file,
        "# cap: compliance.hipaa-lite-defensive-stack\n# story-origin: TBD\ndef emit_event(): pass\n",  # no gate at all
    )
    _write_code_index(
        tmp_path,
        "vitalia",
        {"compliance.hipaa-lite-defensive-stack": ["vitalia/backend/src/events.py"]},
    )

    cap_data = {
        "slug": "hipaa-lite-defensive-stack",
        "user_visible": True,
        "nature": "feature",
        "access": {
            "entry_points": [
                {
                    "path": "/api/v1/vitalia/medical-compliance/events",
                    "requires_role": ["admin_clinic", "staff_vitalia"],
                    "entry_type": "api",
                }
            ]
        },
    }
    _write_cap(caps_root, "compliance", "hipaa-lite-defensive-stack", cap_data)

    caps = mod.load_capabilities("vitalia", tmp_path)
    result = mod.cross_check_4(caps, tmp_path, "vitalia")
    assert result["drift"] == 1
    assert result["details"][0]["status"] == "no_enforcement_found"


def test_cross_check_4_pass_require_brand_owner_access(tmp_path: Path):
    """Depends(require_brand_owner_access()) counts as ENFORCED."""
    mod = _load_module()
    caps_root, be_root, _, _ = _setup(tmp_path)

    py_file = be_root / "marca_router.py"
    _write_code(
        py_file,
        "# cap: brand_studio.lisa-marca\n# story-origin: TBD\n"
        "_brand_owner_required = Depends(require_brand_owner_access())\n"
        "def patch_identity(): pass\n",
    )
    _write_code_index(tmp_path, "vitalia", {"brand_studio.lisa-marca": ["vitalia/backend/src/marca_router.py"]})

    cap_data = {
        "slug": "lisa-marca",
        "access": {
            "entry_points": [
                {
                    "path": "/api/v1/lisa/marca/identity",
                    "requires_role": ["admin_clinic"],
                    "entry_type": "api",
                }
            ]
        },
    }
    _write_cap(caps_root, "brand_studio", "lisa-marca", cap_data)

    caps = mod.load_capabilities("vitalia", tmp_path)
    result = mod.cross_check_4(caps, tmp_path, "vitalia")
    assert result["pass"] == 1
    assert result["drift"] == 0


def test_cross_check_4_pass_assert_phi_access_helper(tmp_path: Path):
    """_assert_phi_access(role) helper counts as ENFORCED."""
    mod = _load_module()
    caps_root, be_root, _, _ = _setup(tmp_path)

    py_file = be_root / "inbox_router.py"
    _write_code(
        py_file,
        "# cap: sales_agent.inbox-handler-mode-occ\n# story-origin: TBD\n"
        "_PHI_ROLES = frozenset({'doctor', 'nurse', 'admin_clinic'})\n"
        "def _assert_phi_access(role):\n"
        "    if role not in _PHI_ROLES:\n"
        "        raise PHIAccessDeniedError(role, list(_PHI_ROLES))\n"
        "def set_mode(): _assert_phi_access(user_role)\n",
    )
    _write_code_index(
        tmp_path,
        "vitalia",
        {"sales_agent.inbox-handler-mode-occ": ["vitalia/backend/src/inbox_router.py"]},
    )

    cap_data = {
        "slug": "inbox-handler-mode-occ",
        "access": {
            "entry_points": [
                {
                    "path": "/api/v1/vitalia/inbox/conversations/{id}/mode",
                    "requires_role": ["doctor", "nurse", "admin_clinic"],
                    "entry_type": "api",
                }
            ]
        },
    }
    _write_cap(caps_root, "sales_agent", "inbox-handler-mode-occ", cap_data)

    caps = mod.load_capabilities("vitalia", tmp_path)
    result = mod.cross_check_4(caps, tmp_path, "vitalia")
    assert result["pass"] == 1
    assert result["drift"] == 0


def test_cross_check_4_pass_inline_frozenset_gate(tmp_path: Path):
    """Inline `if role not in _NPS_SUMMARY_ROLES: raise ...403` counts as ENFORCED."""
    mod = _load_module()
    caps_root, be_root, _, _ = _setup(tmp_path)

    py_file = be_root / "nps_endpoints.py"
    _write_code(
        py_file,
        "# cap: patients.nps-tracking\n# story-origin: TBD\n"
        "_NPS_SUMMARY_ROLES = ['doctor', 'nurse', 'admin_clinic', 'marketing']\n"
        "def get_summary(user_role):\n"
        "    if user_role not in _NPS_SUMMARY_ROLES:\n"
        "        raise HTTPException(status_code=403)\n",
    )
    _write_code_index(tmp_path, "vitalia", {"patients.nps-tracking": ["vitalia/backend/src/nps_endpoints.py"]})

    cap_data = {
        "slug": "nps-tracking",
        "access": {
            "entry_points": [
                {
                    "path": "/api/v1/vitalia/fidelizacion/nps/summary",
                    "requires_role": ["doctor", "admin_clinic", "nurse"],
                    "entry_type": "api",
                }
            ]
        },
    }
    _write_cap(caps_root, "patients", "nps-tracking", cap_data)

    caps = mod.load_capabilities("vitalia", tmp_path)
    result = mod.cross_check_4(caps, tmp_path, "vitalia")
    assert result["pass"] == 1
    assert result["drift"] == 0


def test_cross_check_4_skip_null_path(tmp_path: Path):
    """entry_point with path: null is SKIPPED (not counted, not drift)."""
    mod = _load_module()
    caps_root, _, _, _ = _setup(tmp_path)

    cap_data = {
        "slug": "luana-core-adoption",
        "user_visible": False,
        "nature": "extension-point",
        "access": {
            "entry_points": [
                {
                    "path": None,
                    "requires_role": ["admin_clinic"],
                    "entry_type": "api",
                }
            ]
        },
    }
    _write_cap(caps_root, "iam", "luana-core-adoption", cap_data)

    caps = mod.load_capabilities("vitalia", tmp_path)
    result = mod.cross_check_4(caps, tmp_path, "vitalia")
    assert result["total"] == 0
    assert result["drift"] == 0
    assert result["skipped"] == 1


def test_cross_check_4_skip_extension_point(tmp_path: Path):
    """BE-only extension point (user_visible: false + nature: extension-point) is SKIPPED."""
    mod = _load_module()
    caps_root, _, _, _ = _setup(tmp_path)

    cap_data = {
        "slug": "luana-core-adoption",
        "user_visible": False,
        "nature": "extension-point",
        "access": {
            "entry_points": [
                {
                    "path": "/api/v1/some/be/route",
                    "requires_role": ["admin_clinic"],
                    "entry_type": "api",
                }
            ]
        },
    }
    _write_cap(caps_root, "iam", "luana-core-adoption", cap_data)

    caps = mod.load_capabilities("vitalia", tmp_path)
    result = mod.cross_check_4(caps, tmp_path, "vitalia")
    assert result["total"] == 0
    assert result["drift"] == 0
    assert result["skipped"] == 1


def test_cross_check_4_null_role_skips(tmp_path: Path):
    """entry_point with requires_role: null (ungated by design) is not cross-checked."""
    mod = _load_module()
    caps_root, be_root, _, _ = _setup(tmp_path)

    py_file = be_root / "nps_submit.py"
    _write_code(py_file, "# cap: patients.nps-tracking\n# story-origin: TBD\ndef submit(): pass\n")
    _write_code_index(tmp_path, "vitalia", {"patients.nps-tracking": ["vitalia/backend/src/nps_submit.py"]})

    cap_data = {
        "slug": "nps-tracking",
        "access": {
            "entry_points": [
                {
                    "path": "/api/v1/vitalia/fidelizacion/nps/submit",
                    "requires_role": None,
                    "entry_type": "api",
                }
            ]
        },
    }
    _write_cap(caps_root, "patients", "nps-tracking", cap_data)

    caps = mod.load_capabilities("vitalia", tmp_path)
    result = mod.cross_check_4(caps, tmp_path, "vitalia")
    assert result["total"] == 0
    assert result["drift"] == 0


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


# ---------------------------------------------------------------------------
# Cross-check 3 — pytest path-aware extension (T-0 backfill)
# ---------------------------------------------------------------------------


def test_cross_check_3_py_with_def_test_passes(tmp_path: Path):
    """(a) .py file with 'def test_foo():' → cross_check_3 drift=0, pass=1.

    RED against old code (old code checks 'test(' / 'test.describe(' — a
    Python def-test never matches those JS substrings → drift=1 before fix).
    """
    mod = _load_module()
    caps_root, be_root, _, _ = _setup(tmp_path)

    py_test = be_root.parent / "tests" / "test_api_health.py"
    _write_code(
        py_test,
        "# cap: platform.api-health-endpoint\n"
        "import pytest\n\n"
        "def test_health_returns_200(client):\n"
        "    resp = client.get('/health')\n"
        "    assert resp.status_code == 200\n",
    )

    cap_data = {
        "slug": "api-health-endpoint",
        "scenarios": [
            {
                "id": "health-check-live",
                "e2e_test": str(py_test.relative_to(tmp_path)),
            }
        ],
    }
    _write_cap(caps_root, "platform", "api-health-endpoint", cap_data)

    caps = mod.load_capabilities("vitalia", tmp_path)
    result = mod.cross_check_3(caps, tmp_path)

    assert result["total"] == 1
    assert result["pass"] == 1, (
        "Expected pass=1 for .py file with 'def test_', got drift instead. "
        "Confirms path-aware pattern not yet implemented (RED)."
    )
    assert result["drift"] == 0


def test_cross_check_3_py_without_def_test_is_drift(tmp_path: Path):
    """(b) .py file with no 'def test' → drift=1, status 'no_test_pattern'."""
    mod = _load_module()
    caps_root, be_root, _, _ = _setup(tmp_path)

    py_file = be_root.parent / "tests" / "helper.py"
    _write_code(
        py_file,
        "# A helper module without actual test functions\ndef setup_fixtures():\n    pass\n",
    )

    cap_data = {
        "slug": "api-health-endpoint",
        "scenarios": [
            {
                "id": "health-check-live",
                "e2e_test": str(py_file.relative_to(tmp_path)),
            }
        ],
    }
    _write_cap(caps_root, "platform", "api-health-endpoint", cap_data)

    caps = mod.load_capabilities("vitalia", tmp_path)
    result = mod.cross_check_3(caps, tmp_path)

    assert result["drift"] == 1
    assert result["details"][0]["status"] == "no_test_pattern"


def test_cross_check_3_ts_with_test_still_passes(tmp_path: Path):
    """(c) Regression: .ts file with 'test(' still passes (no change to JS behaviour)."""
    mod = _load_module()
    caps_root, _, _, e2e_root = _setup(tmp_path)

    ts_spec = e2e_root / "smoke.spec.ts"
    _write_code(
        ts_spec,
        "import { test, expect } from '@playwright/test';\n"
        "test('smoke', async ({ page }) => {\n"
        "  await page.goto('/');\n"
        "  await expect(page).toHaveTitle(/Vitalia/);\n"
        "});\n",
    )

    cap_data = {
        "slug": "valeria-agenda",
        "scenarios": [
            {
                "id": "agenda-smoke",
                "e2e_test": "vitalia/frontend/e2e/smoke.spec.ts",
            }
        ],
    }
    _write_cap(caps_root, "scheduling", "valeria-agenda", cap_data)

    caps = mod.load_capabilities("vitalia", tmp_path)
    result = mod.cross_check_3(caps, tmp_path)

    assert result["pass"] == 1
    assert result["drift"] == 0, "Regression: .ts files with test( must still pass"


def test_cross_check_3_ts_without_test_is_drift(tmp_path: Path):
    """(d) Bonus regression negative: .ts without 'test(' → drift 'no_test_pattern'."""
    mod = _load_module()
    caps_root, _, _, e2e_root = _setup(tmp_path)

    ts_util = e2e_root / "utils.ts"
    _write_code(
        ts_util,
        "// Utility helpers — no test functions here\nexport const BASE_URL = 'http://localhost:3002';\n",
    )

    cap_data = {
        "slug": "valeria-agenda",
        "scenarios": [
            {
                "id": "agenda-smoke",
                "e2e_test": "vitalia/frontend/e2e/utils.ts",
            }
        ],
    }
    _write_cap(caps_root, "scheduling", "valeria-agenda", cap_data)

    caps = mod.load_capabilities("vitalia", tmp_path)
    result = mod.cross_check_3(caps, tmp_path)

    assert result["drift"] == 1
    assert result["details"][0]["status"] == "no_test_pattern"


def test_cross_check_4_ui_entry_lenient(tmp_path: Path):
    """UI entry without decorator should pass (Clerk middleware handles)."""
    mod = _load_module()
    caps_root, _, fe_root, _ = _setup(tmp_path)

    tsx_file = fe_root / "page.tsx"
    _write_code(
        tsx_file,
        "// cap: scheduling.valeria-agenda\n// story-origin: TBD\nexport default function Page() { return null; }\n",
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
