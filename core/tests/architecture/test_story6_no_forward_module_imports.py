"""Architecture fitness: Story 6 luana-core-copilot has no forward module imports.

Per 03-arch.md §7.2. luana-core-copilot MUST NOT import from:
  - luana_core_sales_agent (Story 7)
  - luana_core_campaigns (Story 8)
  - luana_core_{advertising,scheduling,social_media} (Stories 8-10)
  - src.modules.*  (AISALESHT paths not allowed in luana-platform)

Forward-coupling would break the migration DAG sequence (Stories 7..14 blocked).

V-AG-2 validator.
"""

from __future__ import annotations

import re
from pathlib import Path

CORE_DIR = Path(__file__).parents[2]

STORY6_PACKAGES = [
    ("luana-core-copilot", "luana_core_copilot"),
]

# Modules that will be lifted in Stories 7..14 — Story 6 must not reference them
FORWARD_MODULE_PATTERNS = [
    r"\bluana_core_sales_agent\b",
    r"\bluana_core_campaigns\b",
    r"\bluana_core_advertising\b",
    r"\bluana_core_scheduling\b",
    r"\bluana_core_social_media\b",
]

# AISALESHT source path imports must also be absent
AISALESHT_PATTERN = re.compile(r"\bfrom src\.modules\.\b|\bimport src\.modules\.\b")
FORWARD_COMPILED = [re.compile(p) for p in FORWARD_MODULE_PATTERNS]

# Lines that contain a documented deferral comment are exempt.
# Pattern: "# Story N deferred" or "# type: ignore[import-not-found]" used for
# known forward imports that will resolve when future stories lift.
DEFERRAL_EXEMPTION = re.compile(r"#\s*Story\s+\d+\s+deferred|#\s*type:\s*ignore\[import-not-found\]")


def _get_py_files(pkg_dir_name: str, pkg_module_name: str):
    pkg_dir = CORE_DIR / pkg_dir_name / "src" / pkg_module_name
    if not pkg_dir.exists():
        return []
    return list(pkg_dir.rglob("*.py"))


def test_no_forward_module_imports():
    """luana-core-copilot must not import from future-story modules."""
    violations = []

    for pkg_dir_name, pkg_module_name in STORY6_PACKAGES:
        for path in _get_py_files(pkg_dir_name, pkg_module_name):
            text = path.read_text(encoding="utf-8")
            for lineno, line in enumerate(text.splitlines(), 1):
                stripped = line.lstrip()
                if stripped.startswith("#"):
                    continue

                if DEFERRAL_EXEMPTION.search(line):
                    continue

                for compiled_pat in FORWARD_COMPILED:
                    if compiled_pat.search(line):
                        violations.append(
                            f"{pkg_dir_name}/"
                            f"{path.relative_to(CORE_DIR / pkg_dir_name / 'src' / pkg_module_name)}:"
                            f"{lineno}: {line.strip()}",
                        )

    assert not violations, (
        "luana-core-copilot must not import future-story modules. Found forward imports:\n" + "\n".join(violations)
    )


def test_no_aisalesht_src_imports():
    """luana-core-copilot must not use AISALESHT 'src.modules.*' import paths."""
    violations = []

    for pkg_dir_name, pkg_module_name in STORY6_PACKAGES:
        for path in _get_py_files(pkg_dir_name, pkg_module_name):
            text = path.read_text(encoding="utf-8")
            for lineno, line in enumerate(text.splitlines(), 1):
                stripped = line.lstrip()
                if stripped.startswith("#"):
                    continue

                if AISALESHT_PATTERN.search(line):
                    violations.append(
                        f"{pkg_dir_name}/"
                        f"{path.relative_to(CORE_DIR / pkg_dir_name / 'src' / pkg_module_name)}:"
                        f"{lineno}: {line.strip()}",
                    )

    assert not violations, (
        "luana-core-copilot must not use 'from src.modules.' import paths. "
        "Found AISALESHT-style imports:\n" + "\n".join(violations)
    )
