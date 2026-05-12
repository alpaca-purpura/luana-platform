"""Architecture fitness: Story 4 packages have no forward module imports.

Per 03-arch.md §7.2. Story 4 packages (crm, analytics-engine, landing, connections)
MUST NOT import from:
  - luana_core_{brand,offer,copilot,sales_agent,campaigns,scheduling,
               advertising,social_media}
  - src.modules.*  (AISALESHT paths not allowed in luana-platform)

Forward-coupling would break the migration DAG sequence (Stories 5..14 blocked).

V-AG-2 extension for Story 4.
"""

from __future__ import annotations

import re
from pathlib import Path

CORE_DIR = Path(__file__).parents[2]

STORY4_PACKAGES = [
    "luana-core-crm",
    "luana-core-analytics-engine",
    "luana-core-landing",
    "luana-core-connections",
]

# Modules that will be lifted in Stories 5..14 — Story 4 must not reference them
FORWARD_MODULE_PATTERNS = [
    r"\bluana_core_brand\b",
    r"\bluana_core_offer\b",
    r"\bluana_core_copilot\b",
    r"\bluana_core_sales_agent\b",
    r"\bluana_core_campaigns\b",
    r"\bluana_core_scheduling\b",
    r"\bluana_core_advertising\b",
    r"\bluana_core_social_media\b",
]

# AISALESHT source path imports must also be absent
AISALESHT_PATTERN = re.compile(r"\bfrom src\.modules\.\b|\bimport src\.modules\.\b")
FORWARD_COMPILED = [re.compile(p) for p in FORWARD_MODULE_PATTERNS]

# Lines that contain a documented deferral comment are exempt.
# Pattern: "# Story N deferred" or "# type: ignore[import-not-found]" used for
# known forward imports that will resolve when future stories lift.
DEFERRAL_EXEMPTION = re.compile(r"#\s*Story\s+\d+\s+deferred|#\s*type:\s*ignore\[import-not-found\]")


def _get_py_files(pkg_name: str):
    pkg_dir = CORE_DIR / pkg_name / "src"
    if not pkg_dir.exists():
        return []
    # Story 6 T-16 introduced copilot_provider/ subpackages into Story 4 packages.
    # Story 7 T-16 introduced connections/api/dependencies/ composition root for
    # ChatOrchestrator wiring (intentional DI, not forward-coupling violation).
    # copilot_provider/ and composition roots are integration layers by design.
    excluded_parts = {"copilot_provider"}
    excluded_files = {
        "luana-core-connections/src/luana_core_connections/api/dependencies/__init__.py",
    }
    abs_excluded = {CORE_DIR / f for f in excluded_files}
    return [
        p for p in pkg_dir.rglob("*.py")
        if "copilot_provider" not in p.parts and p not in abs_excluded
        and not any(part in excluded_parts for part in p.parts)
    ]


def test_no_forward_module_imports():
    """Story 4 packages must not import from future-story modules."""
    violations = []

    for pkg_name in STORY4_PACKAGES:
        for path in _get_py_files(pkg_name):
            text = path.read_text(encoding="utf-8")
            for lineno, line in enumerate(text.splitlines(), 1):
                # Skip pure comments
                stripped = line.lstrip()
                if stripped.startswith("#"):
                    continue

                # Skip lines with documented deferral comments
                if DEFERRAL_EXEMPTION.search(line):
                    continue

                for compiled_pat in FORWARD_COMPILED:
                    if compiled_pat.search(line):
                        violations.append(
                            f"{pkg_name}/{path.relative_to(CORE_DIR / pkg_name / 'src')}:{lineno}: {line.strip()}"
                        )

    assert not violations, (
        "Story 4 packages must not import future-story modules. Found forward imports:\n" + "\n".join(violations)
    )


def test_no_aisalesht_src_imports():
    """Story 4 packages must not use AISALESHT 'src.modules.*' import paths."""
    violations = []

    for pkg_name in STORY4_PACKAGES:
        for path in _get_py_files(pkg_name):
            text = path.read_text(encoding="utf-8")
            for lineno, line in enumerate(text.splitlines(), 1):
                stripped = line.lstrip()
                if stripped.startswith("#"):
                    continue

                if AISALESHT_PATTERN.search(line):
                    violations.append(
                        f"{pkg_name}/{path.relative_to(CORE_DIR / pkg_name / 'src')}:{lineno}: {line.strip()}"
                    )

    assert not violations, (
        "Story 4 packages must not use 'from src.modules.' import paths. "
        "Found AISALESHT-style imports:\n" + "\n".join(violations)
    )
