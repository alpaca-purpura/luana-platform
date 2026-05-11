"""
Architecture fitness test: CODEOWNERS governance.
Validates that .github/CODEOWNERS exists and protects critical core paths.
"""

from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent.parent.parent
CODEOWNERS_PATH = REPO_ROOT / ".github" / "CODEOWNERS"


def test_codeowners_file_exists():
    """`.github/CODEOWNERS` exists at repo root."""
    assert CODEOWNERS_PATH.is_file(), (
        f"CODEOWNERS not found at {CODEOWNERS_PATH}. Anti-island gate #1 requires CODEOWNERS to protect core paths."
    )


def test_codeowners_protects_core_copilot():
    """CODEOWNERS has a rule for core/copilot/**."""
    content = CODEOWNERS_PATH.read_text()
    assert "core/copilot/**" in content, (
        "CODEOWNERS is missing rule for 'core/copilot/**'. All core AI module paths must be protected."
    )


def test_codeowners_protects_core_sales_agent():
    """CODEOWNERS has a rule for core/sales-agent/**."""
    content = CODEOWNERS_PATH.read_text()
    assert "core/sales-agent/**" in content, (
        "CODEOWNERS is missing rule for 'core/sales-agent/**'. All core AI module paths must be protected."
    )


def test_codeowners_protects_core_shared():
    """CODEOWNERS has a rule for core/shared/**."""
    content = CODEOWNERS_PATH.read_text()
    assert "core/shared/**" in content, (
        "CODEOWNERS is missing rule for 'core/shared/**'. All core shared abstractions must be protected."
    )


def test_codeowners_protects_adr_folder():
    """CODEOWNERS has a rule for docs/architecture/ADR/**."""
    content = CODEOWNERS_PATH.read_text()
    assert "docs/architecture/ADR/**" in content, (
        "CODEOWNERS is missing rule for 'docs/architecture/ADR/**'. "
        "ADR folder must require Chris review (anti-island gate #2)."
    )
