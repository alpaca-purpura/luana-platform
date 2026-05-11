"""
Architecture fitness test: PR template governance.
Validates that .github/PULL_REQUEST_TEMPLATE.md exists with all required sections.
"""

from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent.parent.parent
PR_TEMPLATE_PATH = REPO_ROOT / ".github" / "PULL_REQUEST_TEMPLATE.md"

REQUIRED_SECTIONS = [
    "## Qué cambia",
    "## Por qué",
    "## Módulos tocados",
    "## ADR ref",
    "## Outcome / story ref",
]


def test_pr_template_exists():
    """`.github/PULL_REQUEST_TEMPLATE.md` exists at repo root."""
    assert PR_TEMPLATE_PATH.is_file(), (
        f"PR template not found at {PR_TEMPLATE_PATH}. "
        "Anti-island gate #3 requires a PR template with required sections."
    )


def test_pr_template_has_que_cambia():
    """PR template has '## Qué cambia' section."""
    content = PR_TEMPLATE_PATH.read_text()
    assert "## Qué cambia" in content, (
        "PR template is missing '## Qué cambia' section. "
        "This section is required per anti-island gate #3."
    )


def test_pr_template_has_por_que():
    """PR template has '## Por qué' section."""
    content = PR_TEMPLATE_PATH.read_text()
    assert "## Por qué" in content, (
        "PR template is missing '## Por qué' section."
    )


def test_pr_template_has_modulos_tocados():
    """PR template has '## Módulos tocados' section."""
    content = PR_TEMPLATE_PATH.read_text()
    assert "## Módulos tocados" in content, (
        "PR template is missing '## Módulos tocados' section."
    )


def test_pr_template_has_adr_ref():
    """PR template has '## ADR ref' section."""
    content = PR_TEMPLATE_PATH.read_text()
    assert "## ADR ref" in content, (
        "PR template is missing '## ADR ref' section. "
        "This is required to enforce ADR-before-PR for core/** changes."
    )


def test_pr_template_has_outcome_story_ref():
    """PR template has '## Outcome / story ref' section."""
    content = PR_TEMPLATE_PATH.read_text()
    assert "## Outcome / story ref" in content, (
        "PR template is missing '## Outcome / story ref' section. "
        "This is required to maintain /pm SSoT discipline."
    )
