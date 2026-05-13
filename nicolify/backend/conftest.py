"""Root conftest.py — T-15 Cat 2 exclusions.

AISALESHT-side script tests are excluded from pytest collection in
luana-platform/nicolify/backend/. These tests resolve REPO_ROOT to
/home/chris/AISALESHT/ which is absent in luana-platform.

They belong to AISALESHT tooling and should only run from
/home/chris/AISALESHT/backend/. Story 14 will physically relocate these files.

Per T-15 spec: Strategy A — exclude via pytest_ignore_collect hook.
See: docs/product/stories/luana-nicolify-migration/T-15-impl-log.md
"""

from __future__ import annotations

from pathlib import Path

# T-15 Cat 2 — AISALESHT-side scripts excluded from luana-platform collection.
# These tests resolve REPO_ROOT to /home/chris/AISALESHT/ (not present in nicolify).
# The 7 files below cover 109 tests that fail with FileNotFoundError or ImportError
# when pytest runs from luana-platform/nicolify/backend/.
_AISALESHT_ONLY_TESTS = frozenset(
    [
        "tests/scripts/test_generate_backlog.py",
        "tests/scripts/test_reconcile_capabilities.py",
        "tests/scripts/test_validate_session_close.py",
        "tests/scripts/test_pre_commit_hook.py",
        "tests/scripts/test_skill_sales_agent_audit.py",
        "tests/scripts/test_extract_baseline_metrics.py",
        "tests/scripts/test_emit_process_metric.py",
    ]
)

_BACKEND_ROOT = Path(__file__).resolve().parent


def pytest_ignore_collect(collection_path: Path, config) -> bool | None:  # noqa: ANN001
    """Exclude AISALESHT-side tests from collection in luana-platform.

    These test files reference /home/chris/AISALESHT/ paths that do not exist
    in luana-platform/nicolify/backend/. They must only run from AISALESHT.
    Story 14 will physically relocate them to the correct home.
    """
    try:
        relative = collection_path.relative_to(_BACKEND_ROOT)
    except ValueError:
        return None  # Not under our backend root — let pytest decide
    relative_str = str(relative)
    if relative_str in _AISALESHT_ONLY_TESTS:
        return True  # Ignore this path
    return None
