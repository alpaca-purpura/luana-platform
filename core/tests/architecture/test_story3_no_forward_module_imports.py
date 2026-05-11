"""Architecture fitness: Story 3 packages have no forward module imports.

Per 03-arch.md §7.2. Story 3 packages (iam, tenant_profile, tenant_domains,
commercial_calendar, social_proof, assets) MUST NOT import from:
  - luana_core_{crm,analytics,advertising,social_media,landing,connections,
               brand,offer,copilot,sales_agent,campaigns,scheduling}
  - src.modules.*  (AISALESHT paths not allowed in luana-platform)

Forward-coupling would break the migration DAG sequence (Stories 4..14 blocked).

V-AG-2 validator.
"""

from __future__ import annotations

import re
from pathlib import Path

CORE_DIR = Path(__file__).parents[2]

STORY3_PACKAGES = [
    "luana-core-iam",
    "luana-core-tenant-profile",
    "luana-core-tenant-domains",
    "luana-core-commercial-calendar",
    "luana-core-social-proof",
    "luana-core-assets",
]

# Modules that will be lifted in Stories 4..14 — Story 3 must not reference them
FORWARD_MODULE_PATTERNS = [
    r'\bluana_core_crm\b',
    r'\bluana_core_analytics\b',
    r'\bluana_core_advertising\b',
    r'\bluana_core_social_media\b',
    r'\bluana_core_landing\b',
    r'\bluana_core_connections\b',
    r'\bluana_core_brand\b',
    r'\bluana_core_offer\b',
    r'\bluana_core_copilot\b',
    r'\bluana_core_sales_agent\b',
    r'\bluana_core_campaigns\b',
    r'\bluana_core_scheduling\b',
]

# AISALESHT source path imports must also be absent
AISALESHT_PATTERN = re.compile(r'\bfrom src\.modules\.\b|\bimport src\.modules\.\b')
FORWARD_COMPILED = [re.compile(p) for p in FORWARD_MODULE_PATTERNS]


def _get_py_files(pkg_name: str):
    pkg_dir = CORE_DIR / pkg_name / "src"
    if not pkg_dir.exists():
        return []
    return list(pkg_dir.rglob("*.py"))


def test_no_forward_module_imports():
    """Story 3 packages must not import from future-story modules."""
    violations = []

    for pkg_name in STORY3_PACKAGES:
        for path in _get_py_files(pkg_name):
            text = path.read_text(encoding="utf-8")
            for lineno, line in enumerate(text.splitlines(), 1):
                # Skip pure comments
                stripped = line.lstrip()
                if stripped.startswith("#"):
                    continue

                for compiled_pat in FORWARD_COMPILED:
                    if compiled_pat.search(line):
                        violations.append(
                            f"{pkg_name}/{path.relative_to(CORE_DIR / pkg_name / 'src')}:{lineno}: "
                            f"{line.strip()}"
                        )

    assert not violations, (
        "Story 3 packages must not import future-story modules. "
        "Found forward imports:\n" + "\n".join(violations)
    )


def test_no_aisalesht_src_imports():
    """Story 3 packages must not use AISALESHT 'src.modules.*' import paths."""
    violations = []

    for pkg_name in STORY3_PACKAGES:
        for path in _get_py_files(pkg_name):
            text = path.read_text(encoding="utf-8")
            for lineno, line in enumerate(text.splitlines(), 1):
                stripped = line.lstrip()
                if stripped.startswith("#"):
                    continue

                if AISALESHT_PATTERN.search(line):
                    violations.append(
                        f"{pkg_name}/{path.relative_to(CORE_DIR / pkg_name / 'src')}:{lineno}: "
                        f"{line.strip()}"
                    )

    assert not violations, (
        "Story 3 packages must not use 'from src.modules.' import paths. "
        "Found AISALESHT-style imports:\n" + "\n".join(violations)
    )
