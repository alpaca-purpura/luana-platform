"""Architecture fitness: NO eval framework lifted Story 7.

Per 03-arch.md §7.5 + §9.1 + outcome §2 OQ1 + Session 3 ratificación 2.

Story 7 lift WAIVED eval framework to Luana v0.2.0:
- `observability/eval_simulator/` subfolder — NOT lifted into luana-core-sales-agent
- `tests/agentic_evals/sales_agent/` — NOT lifted
- Story E voice fidelity grader CI gate — DEFERRED
- MAJ-EVAL grader runtime — DEFERRED
- Personas catalog — DEFERRED
- Goldens dataset infra — DEFERRED
- Story I adversarial jailbreak suite — DEFERRED

Cost-bucket separation tables (eval_simulator_*) stay in nicolify AISALESHT
until eval framework ships in v0.2.0. luana-core-sales-agent runtime
operates WITHOUT eval surfaces.

V-AG-5 validator. Defensive — blocks accidental lift attempts.
"""

from __future__ import annotations

from pathlib import Path

CORE_DIR = Path(__file__).parents[2]
SALES_AGENT_SRC = CORE_DIR / "luana-core-sales-agent" / "src" / "luana_core_sales_agent"
SALES_AGENT_TESTS = CORE_DIR / "luana-core-sales-agent" / "tests"

# Folders that MUST NOT exist inside lifted package
FORBIDDEN_SRC_PATHS = [
    SALES_AGENT_SRC / "observability" / "eval_simulator",
    SALES_AGENT_SRC / "eval_simulator",
    SALES_AGENT_SRC / "application" / "eval_simulator",
]

FORBIDDEN_TEST_PATHS = [
    SALES_AGENT_TESTS / "eval_simulator",
    SALES_AGENT_TESTS / "agentic_evals",
]


def test_no_eval_simulator_subfolder_in_src():
    """Sales agent src/ MUST NOT contain eval_simulator subfolder."""
    violations: list[str] = []
    for forbidden_path in FORBIDDEN_SRC_PATHS:
        if forbidden_path.exists():
            violations.append(str(forbidden_path.relative_to(CORE_DIR)))

    assert not violations, (
        "V-AG-5 violation: eval_simulator subfolder lifted into "
        "luana-core-sales-agent.\n"
        "Per 03-arch.md §9.1 + outcome §2 OQ1: eval framework DEFERRED to "
        "Luana v0.2.0.\n\n"
        "Forbidden paths found:\n" + "\n".join(violations)
    )


def test_no_agentic_evals_tests_in_sales_agent():
    """Sales agent tests/ MUST NOT contain agentic_evals or eval_simulator folders."""
    violations: list[str] = []
    for forbidden_path in FORBIDDEN_TEST_PATHS:
        if forbidden_path.exists():
            # Allow empty placeholder folders (no .py files)
            py_files = list(forbidden_path.rglob("*.py"))
            if py_files:
                violations.append(
                    f"{forbidden_path.relative_to(CORE_DIR)} "
                    f"({len(py_files)} .py files)",
                )

    assert not violations, (
        "V-AG-5 violation: agentic_evals or eval_simulator tests lifted into "
        "luana-core-sales-agent/tests.\n"
        "Per 03-arch.md §9.1 + outcome §2 OQ1: eval framework DEFERRED to "
        "Luana v0.2.0. Story E voice fidelity CI gate WAIVED.\n\n"
        "Forbidden test folders:\n" + "\n".join(violations)
    )


def test_no_eval_runner_files_in_src():
    """Sales agent src/ MUST NOT contain eval runner / grader / personas files."""
    forbidden_filenames = [
        "eval_runner.py",
        "maj_eval.py",
        "grader.py",
        "voice_fidelity_grader.py",
        "personas_loader.py",
        "judge_prompts.py",
    ]

    violations: list[str] = []
    if SALES_AGENT_SRC.exists():
        for filename in forbidden_filenames:
            matches = list(SALES_AGENT_SRC.rglob(filename))
            for match in matches:
                violations.append(str(match.relative_to(CORE_DIR)))

    assert not violations, (
        "V-AG-5 violation: eval framework runner files lifted.\n"
        "Per 03-arch.md §9.1 + outcome §2 OQ1: DEFERRED to Luana v0.2.0.\n\n"
        "Forbidden files:\n" + "\n".join(violations)
    )
