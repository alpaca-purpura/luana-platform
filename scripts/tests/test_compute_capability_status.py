"""Tests for scripts/compute_capability_status.py.

Uses inline YAML fixtures via tmp_path — does NOT depend on real cap files.
All paths use the workspace-root-relative convention the script expects.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest
import yaml

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_FRONTMATTER_TEMPLATE = """\
---
{yaml_content}
---

# Capability placeholder
"""


def _write_cap(caps_dir: Path, module: str, slug: str, data: dict) -> Path:
    """Write a capability YAML file under caps_dir/{module}/{slug}.yaml."""
    module_dir = caps_dir / module
    module_dir.mkdir(parents=True, exist_ok=True)
    path = module_dir / f"{slug}.yaml"
    yaml_content = yaml.dump(data, allow_unicode=True, default_flow_style=False)
    path.write_text(_FRONTMATTER_TEMPLATE.format(yaml_content=yaml_content), encoding="utf-8")
    return path


def _run_script(workspace_root: Path, brand: str) -> dict:
    """Import and run compute_capability_status.process_brand directly."""
    import importlib.util
    import sys

    scripts_dir = Path(__file__).parent.parent
    spec = importlib.util.spec_from_file_location(
        "compute_capability_status",
        scripts_dir / "compute_capability_status.py",
    )
    mod = importlib.util.module_from_spec(spec)  # type: ignore[arg-type]
    spec.loader.exec_module(mod)  # type: ignore[union-attr]

    return mod.process_brand(brand, workspace_root, verbose=False)


def _setup_brand_caps(tmp_path: Path, brand: str) -> Path:
    """Create brand caps dir structure and return the caps root."""
    caps_dir = tmp_path / brand / "docs" / "product" / "capabilities"
    caps_dir.mkdir(parents=True, exist_ok=True)
    return caps_dir


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


def test_stub_cap_when_atomics_empty(tmp_path: Path) -> None:
    """A cap with atomics: [] must compute as 'stub' regardless of declared status."""
    brand = "testbrand"
    caps_dir = _setup_brand_caps(tmp_path, brand)
    _write_cap(
        caps_dir,
        "booking",
        "booking-widget",
        {
            "capability_id": "testbrand-booking-widget",
            "module": "booking",
            "slug": "booking-widget",
            "status": "live",
            "atomics": [],
        },
    )

    result = _run_script(tmp_path, brand)
    cap = result["capabilities"]["booking-widget"]

    assert cap["computed_status"] == "stub"
    assert cap["atomics_total"] == 0
    assert result["summary"]["stub"] == 1


def test_verified_live_when_all_atomics_live_and_verification_paths_exist(tmp_path: Path) -> None:
    """Cap with all-live atomics + verification paths that exist → verified-live."""
    brand = "testbrand"
    caps_dir = _setup_brand_caps(tmp_path, brand)

    # Create a real file that verification.fe_path will reference (relative to workspace root)
    fe_file = tmp_path / "testbrand" / "frontend" / "src" / "components" / "Widget.tsx"
    fe_file.parent.mkdir(parents=True, exist_ok=True)
    fe_file.write_text("export const Widget = () => null;\n", encoding="utf-8")
    fe_path_rel = "testbrand/frontend/src/components/Widget.tsx"

    _write_cap(
        caps_dir,
        "booking",
        "verified-cap",
        {
            "capability_id": "testbrand-verified-cap",
            "module": "booking",
            "slug": "verified-cap",
            "status": "live",
            "atomics": [
                {
                    "id": "widget-render",
                    "name": "Renderizado del widget",
                    "surface": "FE",
                    "added_in_story": "story-001",
                    "added_date": "2026-05-01",
                    "status": "live",
                    "verification": {
                        "fe_path": fe_path_rel,
                        "be_path": None,
                        "agentic_path": None,
                        "e2e_test": None,
                    },
                }
            ],
        },
    )

    result = _run_script(tmp_path, brand)
    cap = result["capabilities"]["verified-cap"]

    assert cap["computed_status"] == "verified-live", (
        f"Expected verified-live but got {cap['computed_status']}. "
        f"drift_reasons: {cap['drift_reasons']}"
    )
    assert cap["atomics_total"] == 1
    assert cap["atomics_live"] == 1
    assert cap["verification_total"] == 1
    assert cap["verification_pass"] == 1
    assert cap["drift_reasons"] == []
    assert result["summary"]["verified-live"] == 1


def test_declared_live_when_atomics_live_but_no_verification(tmp_path: Path) -> None:
    """Cap with live atomics but no verification block → declared-live."""
    brand = "testbrand"
    caps_dir = _setup_brand_caps(tmp_path, brand)

    _write_cap(
        caps_dir,
        "shell",
        "shell-vitalia",
        {
            "capability_id": "testbrand-shell-vitalia",
            "module": "shell",
            "slug": "shell-vitalia",
            "status": "live",
            "atomics": [
                {
                    "id": "layout-5050",
                    "name": "Layout 50/50",
                    "surface": "FE",
                    "added_in_story": "story-s4",
                    "added_date": "2026-05-23",
                    "status": "live",
                    # No 'verification' key
                },
                {
                    "id": "ribbon",
                    "name": "Ribbon 6 tabs",
                    "surface": "FE",
                    "added_in_story": "story-s7",
                    "added_date": "2026-05-25",
                    "status": "live",
                },
            ],
        },
    )

    result = _run_script(tmp_path, brand)
    cap = result["capabilities"]["shell-vitalia"]

    assert cap["computed_status"] == "declared-live"
    assert cap["atomics_total"] == 2
    assert cap["atomics_live"] == 2
    assert cap["verification_total"] == 0
    assert cap["verification_pass"] == 0
    assert result["summary"]["declared-live"] == 1


def test_drift_when_atomics_wip_but_declared_live(tmp_path: Path) -> None:
    """Cap declared=live but ALL atomics wip → drift."""
    brand = "testbrand"
    caps_dir = _setup_brand_caps(tmp_path, brand)

    _write_cap(
        caps_dir,
        "copilot",
        "copilot-draft",
        {
            "capability_id": "testbrand-copilot-draft",
            "module": "copilot",
            "slug": "copilot-draft",
            "status": "live",
            "atomics": [
                {
                    "id": "chat-window",
                    "name": "Ventana de chat",
                    "surface": "FE",
                    "added_in_story": "story-c1",
                    "added_date": "2026-05-01",
                    "status": "wip",
                },
                {
                    "id": "backend-handler",
                    "name": "Manejador backend",
                    "surface": "BE",
                    "added_in_story": "story-c1",
                    "added_date": "2026-05-01",
                    "status": "wip",
                },
            ],
        },
    )

    result = _run_script(tmp_path, brand)
    cap = result["capabilities"]["copilot-draft"]

    assert cap["computed_status"] == "drift"
    assert cap["atomics_wip"] == 2
    assert len(cap["drift_reasons"]) >= 1
    assert result["summary"]["drift"] == 1


def test_deprecated_passthrough(tmp_path: Path) -> None:
    """Cap declared=deprecated is always computed as 'deprecated'."""
    brand = "testbrand"
    caps_dir = _setup_brand_caps(tmp_path, brand)

    _write_cap(
        caps_dir,
        "legacy",
        "old-feature",
        {
            "capability_id": "testbrand-old-feature",
            "module": "legacy",
            "slug": "old-feature",
            "status": "deprecated",
            "atomics": [
                {
                    "id": "old-widget",
                    "name": "Widget antiguo",
                    "surface": "FE",
                    "added_in_story": "story-old",
                    "added_date": "2025-01-01",
                    "status": "deprecated",
                }
            ],
        },
    )

    result = _run_script(tmp_path, brand)
    cap = result["capabilities"]["old-feature"]

    assert cap["computed_status"] == "deprecated"
    assert result["summary"]["deprecated"] == 1


def test_atomics_per_surface_counter(tmp_path: Path) -> None:
    """atomics_per_surface groups atomics correctly by surface enum."""
    brand = "testbrand"
    caps_dir = _setup_brand_caps(tmp_path, brand)

    _write_cap(
        caps_dir,
        "sales",
        "multi-surface-cap",
        {
            "capability_id": "testbrand-multi-surface-cap",
            "module": "sales",
            "slug": "multi-surface-cap",
            "status": "live",
            "atomics": [
                {
                    "id": "fe-1",
                    "name": "Componente FE 1",
                    "surface": "FE",
                    "added_in_story": "s1",
                    "added_date": "2026-05-01",
                    "status": "live",
                },
                {
                    "id": "fe-2",
                    "name": "Componente FE 2",
                    "surface": "FE",
                    "added_in_story": "s1",
                    "added_date": "2026-05-01",
                    "status": "live",
                },
                {
                    "id": "be-1",
                    "name": "Endpoint BE",
                    "surface": "BE",
                    "added_in_story": "s1",
                    "added_date": "2026-05-01",
                    "status": "live",
                },
                {
                    "id": "agentic-1",
                    "name": "Tool agéntico",
                    "surface": "AGENTIC",
                    "added_in_story": "s2",
                    "added_date": "2026-05-02",
                    "status": "live",
                },
                {
                    "id": "bad-surface",
                    "name": "Surface desconocida",
                    "surface": "UNKNOWN_SURFACE",
                    "added_in_story": "s3",
                    "added_date": "2026-05-03",
                    "status": "live",
                },
            ],
        },
    )

    result = _run_script(tmp_path, brand)
    cap = result["capabilities"]["multi-surface-cap"]

    per_surface = cap["atomics_per_surface"]
    assert per_surface["FE"] == 2
    assert per_surface["BE"] == 1
    assert per_surface["AGENTIC"] == 1
    assert per_surface["invalid"] == 1
    assert cap["atomics_total"] == 5


def test_partial_when_mixed_live_and_wip(tmp_path: Path) -> None:
    """Cap declared=live with mix of live + wip atomics → partial."""
    brand = "testbrand"
    caps_dir = _setup_brand_caps(tmp_path, brand)

    _write_cap(
        caps_dir,
        "crm",
        "partial-cap",
        {
            "capability_id": "testbrand-partial-cap",
            "module": "crm",
            "slug": "partial-cap",
            "status": "live",
            "atomics": [
                {
                    "id": "done-part",
                    "name": "Parte completada",
                    "surface": "FE",
                    "added_in_story": "s1",
                    "added_date": "2026-05-01",
                    "status": "live",
                },
                {
                    "id": "wip-part",
                    "name": "Parte en progreso",
                    "surface": "BE",
                    "added_in_story": "s2",
                    "added_date": "2026-05-10",
                    "status": "wip",
                },
            ],
        },
    )

    result = _run_script(tmp_path, brand)
    cap = result["capabilities"]["partial-cap"]

    assert cap["computed_status"] == "partial"
    assert cap["atomics_live"] == 1
    assert cap["atomics_wip"] == 1
    assert result["summary"]["partial"] == 1
