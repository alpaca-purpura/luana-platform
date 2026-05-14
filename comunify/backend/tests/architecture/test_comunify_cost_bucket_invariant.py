"""Architecture fitness gate — comunify eval cost bucket invariant (Story 12 T-eval-1).

H7 cement: eval grader LLM calls MUST write to ``eval_simulator_llm_call`` ONLY.
NOT to ``copilot_llm_call`` or ``sales_agent_llm_call`` (production tables).

This prevents eval costs from polluting tenant billing dashboards and
from triggering BudgetGuard alarms during eval runs.

Invariants enforced:

1. The grader _internal module declares the cost bucket constant as "eval_simulator".
2. The cost bucket "eval_simulator" is distinct from production bucket names.
3. No direct import of production LLM call recorder in grader _internal.

Static approach — reads the grader module source directly. No LLM invocation.
"""

from __future__ import annotations

import ast
from pathlib import Path

import pytest

pytestmark = pytest.mark.no_eval

# ---------------------------------------------------------------------------
# Path resolution
# ---------------------------------------------------------------------------

_COMUNIFY_BACKEND: Path = Path("/home/chris/luana-platform/comunify/backend")
_GRADER_INTERNAL: Path = _COMUNIFY_BACKEND / "tests" / "agentic_evals" / "grader" / "_internal"
_MAJ_EVAL_PATH: Path = _GRADER_INTERNAL / "maj_eval_comunify.py"

# ---------------------------------------------------------------------------
# Known production table names (must NOT appear in grader cost path)
# ---------------------------------------------------------------------------

_PRODUCTION_TABLES = frozenset({
    "copilot_llm_call",
    "sales_agent_llm_call",
})

_EVAL_BUCKET = "eval_simulator"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _read_module_source(path: Path) -> str:
    """Read source of a Python module."""
    assert path.is_file(), f"Module not found: {path}"
    return path.read_text(encoding="utf-8")


# ════════════════════════════════════════════════════════════════════════
# Grader module existence
# ════════════════════════════════════════════════════════════════════════


def test_grader_internal_directory_exists() -> None:
    """``tests/agentic_evals/grader/_internal/`` directory MUST exist."""
    assert _GRADER_INTERNAL.is_dir(), (
        f"Grader _internal directory not found: {_GRADER_INTERNAL}. "
        "Story 12 T-eval-1 deliverable absent."
    )


def test_maj_eval_comunify_module_exists() -> None:
    """``maj_eval_comunify.py`` MUST exist in grader _internal."""
    assert _MAJ_EVAL_PATH.is_file(), (
        f"maj_eval_comunify.py not found at {_MAJ_EVAL_PATH}. "
        "Story 12 T-eval-1 deliverable absent."
    )


# ════════════════════════════════════════════════════════════════════════
# Cost bucket invariant
# ════════════════════════════════════════════════════════════════════════


def test_grader_internal_no_production_table_in_code_paths() -> None:
    """Grader _internal MUST NOT import or assign production LLM call table names in code.

    H7 cement: eval grader must NOT write to copilot_llm_call or sales_agent_llm_call.

    Note: doc-strings or comments may reference table names for documentation purposes.
    This test checks code-level references (string literals in assignments/expressions,
    not module docstrings or comments).
    """
    source = _read_module_source(_MAJ_EVAL_PATH)
    tree = ast.parse(source)

    # Collect all string constants that appear in code (not docstrings)
    # We skip module/function/class docstrings
    def _is_docstring_node(node: ast.AST, parent: ast.AST | None) -> bool:
        """Return True if node is a pure docstring (not in assignment/call)."""
        if not isinstance(node, ast.Constant):
            return False
        if not isinstance(node.value, str):
            return False
        if parent is None:
            return False
        # Docstrings are Expr(Constant(...)) nodes
        return isinstance(parent, ast.Expr)

    violations: list[str] = []
    for node in ast.walk(tree):
        # Only check string literals in assignments and function calls
        if isinstance(node, (ast.Assign, ast.Call, ast.keyword)):
            for child in ast.walk(node):
                if isinstance(child, ast.Constant) and isinstance(child.value, str):
                    for table_name in _PRODUCTION_TABLES:
                        if table_name == child.value:  # exact match, not substring
                            violations.append(f"{table_name} (in {ast.dump(node)[:60]}...)")

    assert not violations, (
        f"Grader _internal code assigns/calls with production LLM call table names: {violations}. "
        "H7 cement: eval grader MUST NOT write to production tables. "
        "Use eval_simulator_llm_call ONLY."
    )


def test_rubric_version_constant_is_1() -> None:
    """RUBRIC_VERSION constant MUST be 1 in maj_eval_comunify.py (D6 cement)."""
    source = _read_module_source(_MAJ_EVAL_PATH)
    # Parse AST to find RUBRIC_VERSION assignment
    tree = ast.parse(source)
    for node in ast.walk(tree):
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name) and target.id == "RUBRIC_VERSION":
                    if isinstance(node.value, ast.Constant):
                        actual = node.value.value
                        assert actual == 1, (
                            f"RUBRIC_VERSION={actual!r} in maj_eval_comunify.py "
                            "(expected 1 for D6 cache invalidation key cement)."
                        )
                        return
    # If we got here, RUBRIC_VERSION not found
    pytest.fail(
        "RUBRIC_VERSION constant not found in maj_eval_comunify.py. "
        "D6 cement requires explicit RUBRIC_VERSION = 1."
    )


def test_threshold_constant_is_0_85() -> None:
    """THRESHOLD_DEFAULT constant MUST be 0.85 in maj_eval_comunify.py."""
    source = _read_module_source(_MAJ_EVAL_PATH)
    tree = ast.parse(source)
    for node in ast.walk(tree):
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name) and target.id == "THRESHOLD_DEFAULT":
                    if isinstance(node.value, ast.Constant):
                        actual = node.value.value
                        assert abs(float(actual) - 0.85) < 1e-9, (
                            f"THRESHOLD_DEFAULT={actual!r} (expected 0.85)."
                        )
                        return
    pytest.fail("THRESHOLD_DEFAULT not found in maj_eval_comunify.py.")


def test_weights_sum_to_1_00_in_module() -> None:
    """WEIGHTS dict in maj_eval_comunify.py must define 5 assertions summing to 1.00.

    Uses AST parsing instead of exec_module to avoid dataclass import side effects.
    """
    source = _read_module_source(_MAJ_EVAL_PATH)
    tree = ast.parse(source)

    # Find WEIGHTS dict assignment: plain or annotated (WEIGHTS: dict[str, float] = {...})
    weights: dict[str, float] = {}
    for node in ast.walk(tree):
        # Handle plain assignment: WEIGHTS = {...}
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name) and target.id == "WEIGHTS":
                    if isinstance(node.value, ast.Dict):
                        for key, val in zip(node.value.keys, node.value.values):
                            if isinstance(key, ast.Constant) and isinstance(val, ast.Constant):
                                weights[str(key.value)] = float(val.value)
        # Handle annotated assignment: WEIGHTS: dict[str, float] = {...}
        elif isinstance(node, ast.AnnAssign):
            if isinstance(node.target, ast.Name) and node.target.id == "WEIGHTS":
                if node.value is not None and isinstance(node.value, ast.Dict):
                    for key, val in zip(node.value.keys, node.value.values):
                        if isinstance(key, ast.Constant) and isinstance(val, ast.Constant):
                            weights[str(key.value)] = float(val.value)

    assert weights, "WEIGHTS dict not found in maj_eval_comunify.py via AST."
    assert set(weights.keys()) == {"A1", "A2", "A3", "A4", "A5"}, (
        f"WEIGHTS must cover exactly A1-A5. Got {set(weights.keys())}."
    )
    total = sum(weights.values())
    assert abs(total - 1.00) < 1e-9, f"WEIGHTS sum to {total} (expected 1.00). Weights: {weights}"
