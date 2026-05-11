"""
Architecture fitness test: ADR folder governance.
Validates that docs/architecture/ADR/README.md exists with the required
Michael Nygard template description and ADR index.
"""

from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent.parent.parent
ADR_README_PATH = REPO_ROOT / "docs" / "architecture" / "ADR" / "README.md"


def test_adr_readme_exists():
    """`docs/architecture/ADR/README.md` exists."""
    assert ADR_README_PATH.is_file(), (
        f"ADR README not found at {ADR_README_PATH}. "
        "Anti-island gate #2 requires an ADR directory with template + index."
    )


def test_adr_readme_mentions_michael_nygard_format():
    """ADR README mentions the Michael Nygard ADR template format."""
    content = ADR_README_PATH.read_text()
    has_nygard = "Michael Nygard" in content or "template" in content.lower()
    assert has_nygard, (
        "ADR README does not mention 'Michael Nygard' or 'template'. The README must explain the ADR format."
    )


def test_adr_readme_has_index():
    """ADR README contains an ADR index (índice)."""
    content = ADR_README_PATH.read_text()
    has_index = "índice" in content.lower() or "ADR index" in content or "index" in content.lower()
    assert has_index, "ADR README does not contain an index (índice). The README must list all ADRs in an index table."


def test_adr_folder_exists():
    """`docs/architecture/ADR/` directory exists."""
    adr_dir = REPO_ROOT / "docs" / "architecture" / "ADR"
    assert adr_dir.is_dir(), (
        f"ADR directory not found at {adr_dir}. The ADR directory must exist for governance to function."
    )
