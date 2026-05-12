"""Architecture fitness: Story 7 luana-core-sales-agent has no forward module imports.

Per 03-arch.md §7.2. luana-core-sales-agent MUST NOT have top-level imports
from forward stories:
  - luana_core_campaigns (Story 8)
  - luana_core_advertising (Story 8)
  - luana_core_social_media (Story 9)

Allowed exception for `luana_core_scheduling`: per 03-arch.md §9.2, sales
agent has deferred-import pattern for scheduling tools — only TYPE_CHECKING
or function-local imports are permitted (NOT top-level). Story 8 will lift
scheduling concrete provider runtime.

AISALESHT source paths (`from src.modules.*`, `import src.modules.*`) must
be absent entirely.

V-AG-2 validator (Story 7 parity of Story 6 V-AG-2).
"""

from __future__ import annotations

import ast
import re
from pathlib import Path

CORE_DIR = Path(__file__).parents[2]

STORY7_PACKAGES = [
    ("luana-core-sales-agent", "luana_core_sales_agent"),
]

# Forward modules — NOT lifted yet (no top-level imports allowed at all)
TOP_LEVEL_FORBIDDEN_PATTERNS = [
    r"\bluana_core_campaigns\b",
    r"\bluana_core_advertising\b",
    r"\bluana_core_social_media\b",
]

# luana_core_scheduling — only TYPE_CHECKING / function-local imports allowed
SCHEDULING_PATTERN = r"\bluana_core_scheduling\b"

# AISALESHT source path imports must also be absent
AISALESHT_PATTERN = re.compile(r"\bfrom src\.modules\.\b|\bimport src\.modules\.\b")
TOP_LEVEL_COMPILED = [re.compile(p) for p in TOP_LEVEL_FORBIDDEN_PATTERNS]
SCHEDULING_COMPILED = re.compile(SCHEDULING_PATTERN)

# Lines that contain a documented deferral comment are exempt for forward modules
DEFERRAL_EXEMPTION = re.compile(
    r"#\s*Story\s+\d+\s+deferred|#\s*type:\s*ignore\[import-not-found\]",
)


def _get_py_files(pkg_dir_name: str, pkg_module_name: str):
    pkg_dir = CORE_DIR / pkg_dir_name / "src" / pkg_module_name
    if not pkg_dir.exists():
        return []
    return list(pkg_dir.rglob("*.py"))


def test_no_forward_module_imports():
    """luana-core-sales-agent must not import campaigns/advertising/social_media (top-level)."""
    violations = []

    for pkg_dir_name, pkg_module_name in STORY7_PACKAGES:
        for path in _get_py_files(pkg_dir_name, pkg_module_name):
            text = path.read_text(encoding="utf-8")
            for lineno, line in enumerate(text.splitlines(), 1):
                stripped = line.lstrip()
                if stripped.startswith("#"):
                    continue

                if DEFERRAL_EXEMPTION.search(line):
                    continue

                for compiled_pat in TOP_LEVEL_COMPILED:
                    if compiled_pat.search(line):
                        violations.append(
                            f"{pkg_dir_name}/"
                            f"{path.relative_to(CORE_DIR / pkg_dir_name / 'src' / pkg_module_name)}:"
                            f"{lineno}: {line.strip()}",
                        )

    assert not violations, (
        "luana-core-sales-agent must not import campaigns/advertising/social_media. "
        "Found forward imports:\n" + "\n".join(violations)
    )


def test_scheduling_only_in_function_or_type_checking_blocks():
    """luana_core_scheduling imports allowed only via TYPE_CHECKING or function-local.

    AST-walks each py file: if a `luana_core_scheduling` import appears at module-level
    (top-level Import / ImportFrom node) AND NOT inside an `if TYPE_CHECKING:` block,
    flag violation. Function-local (nested inside FunctionDef / AsyncFunctionDef) is OK.
    """
    violations: list[str] = []

    for pkg_dir_name, pkg_module_name in STORY7_PACKAGES:
        for path in _get_py_files(pkg_dir_name, pkg_module_name):
            text = path.read_text(encoding="utf-8")
            if not SCHEDULING_COMPILED.search(text):
                continue  # no mention at all — fine

            try:
                tree = ast.parse(text)
            except SyntaxError:
                continue

            # Walk top-level nodes — flag Import/ImportFrom mentioning scheduling
            # unless inside `if TYPE_CHECKING:` block.
            for node in tree.body:
                if isinstance(node, (ast.Import, ast.ImportFrom)):
                    module_text = ""
                    if isinstance(node, ast.ImportFrom):
                        module_text = node.module or ""
                    else:
                        module_text = ",".join(alias.name for alias in node.names)
                    if "luana_core_scheduling" in module_text:
                        violations.append(
                            f"{pkg_dir_name}/"
                            f"{path.relative_to(CORE_DIR / pkg_dir_name / 'src' / pkg_module_name)}:"
                            f"{node.lineno}: top-level import of luana_core_scheduling "
                            "(must be TYPE_CHECKING / function-local — Story 8 lift pending)",
                        )

    assert not violations, (
        "luana-core-sales-agent must defer luana_core_scheduling imports "
        "(per 03-arch.md §9.2 — Story 8 lifts concrete provider runtime).\n"
        "Top-level imports flagged:\n" + "\n".join(violations)
    )


def test_no_aisalesht_src_imports():
    """luana-core-sales-agent must not use AISALESHT 'src.modules.*' import paths."""
    violations = []

    for pkg_dir_name, pkg_module_name in STORY7_PACKAGES:
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
        "luana-core-sales-agent must not use 'from src.modules.' import paths. "
        "Found AISALESHT-style imports:\n" + "\n".join(violations)
    )
