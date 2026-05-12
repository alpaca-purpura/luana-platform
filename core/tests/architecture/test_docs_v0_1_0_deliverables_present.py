"""Story 9 arch fitness: 5 docs deliverables for v0.1.0 are present and well-formed.

V-D-1: CHANGELOG.md with cross-Story summary.
V-D-2: docs/migration-from-nicolify.md with §1..§6.
V-D-3: docs/extension-points.md header bumped to production-grade alpha.
V-D-4: docs/RELEASES.md with v0.1.0 procedure + rollback + token setup + SemVer F1-F6.
V-D-5: SemVer F1-F6 rules enumerated.
V-F-release-5: CHANGELOG.md has '## [0.1.0]' + ≥26 package entries.
V-F-release-6: migration guide has 6 sections.
V-F-release-7: docs/api/ directories populated.
"""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]


def test_changelog_has_v0_1_0_section() -> None:
    """V-F-release-5 + V-D-1: CHANGELOG.md exists with ## [0.1.0] section."""
    changelog = ROOT / "CHANGELOG.md"
    assert changelog.exists(), "CHANGELOG.md not found at monorepo root"
    content = changelog.read_text()
    assert re.search(r"^## \[0\.1\.0\]", content, re.MULTILINE), (
        "CHANGELOG.md missing '## [0.1.0]' section header"
    )


def test_changelog_has_cross_story_summary() -> None:
    """V-D-1: CHANGELOG.md contains all 9 Stories cross-summary markers."""
    content = (ROOT / "CHANGELOG.md").read_text()
    story_markers = [
        "Foundations",
        "Shared lift",
        "IAM",
        "CRM",
        "Brand",
        "Copilot Engine",
        "Sales Agent Engine",
        "Campaigns",
        "Release Engineering",
    ]
    missing = [m for m in story_markers if not re.search(m, content, re.IGNORECASE)]
    assert not missing, f"CHANGELOG.md missing story sections: {missing}"


def test_changelog_has_package_entries() -> None:
    """V-F-release-5: CHANGELOG.md has ≥26 package mention entries."""
    content = (ROOT / "CHANGELOG.md").read_text()
    count = len(re.findall(
        r"^- (?:\*\*)?(?:luana-core-[a-z-]+|@luana/)",
        content, re.MULTILINE
    ))
    assert count >= 26, f"CHANGELOG.md has only {count} package entries (expected ≥26)"


def test_migration_guide_has_6_sections() -> None:
    """V-F-release-6 + V-D-2: docs/migration-from-nicolify.md has §1..§6 sections."""
    guide = ROOT / "docs/migration-from-nicolify.md"
    assert guide.exists(), "docs/migration-from-nicolify.md not found"
    content = guide.read_text()
    sections = re.findall(r"^## §([1-6])", content, re.MULTILINE)
    unique_sections = sorted(set(int(s) for s in sections))
    assert unique_sections == [1, 2, 3, 4, 5, 6], (
        f"migration guide missing sections: found §{unique_sections}, expected §1-6"
    )


def test_migration_guide_has_substantive_content() -> None:
    """V-D-2: docs/migration-from-nicolify.md has ≥50 lines of content."""
    guide = ROOT / "docs/migration-from-nicolify.md"
    lines = guide.read_text().splitlines()
    assert len(lines) >= 50, f"migration guide too short: {len(lines)} lines (expected ≥50)"


def test_api_docs_directories_populated() -> None:
    """V-F-release-7: docs/api/python/ + docs/api/typescript/ exist with ≥20 Python packages."""
    py_dir = ROOT / "docs/api/python"
    ts_dir = ROOT / "docs/api/typescript"
    assert py_dir.is_dir(), "docs/api/python/ directory missing — run scripts/generate_api_docs.sh"
    assert ts_dir.is_dir(), "docs/api/typescript/ directory missing — run scripts/generate_api_docs.sh"
    py_pkgs = [p for p in py_dir.iterdir() if p.is_dir()]
    assert len(py_pkgs) >= 20, (
        f"docs/api/python/ has only {len(py_pkgs)} package dirs (expected ≥20)"
    )


def test_extension_points_header_bumped() -> None:
    """V-D-3: docs/extension-points.md header says 'v0.1.0 (production-grade alpha)'."""
    ext_points = ROOT / "docs/extension-points.md"
    assert ext_points.exists(), "docs/extension-points.md not found"
    content = ext_points.read_text()
    assert "v0.1.0 (production-grade alpha)" in content, (
        "docs/extension-points.md header not updated to 'v0.1.0 (production-grade alpha)'"
    )


def test_releases_md_has_v0_1_0_procedure() -> None:
    """V-D-4: docs/RELEASES.md has v0.1.0 procedure + rollback + token setup + SemVer."""
    releases_md = ROOT / "docs/RELEASES.md"
    assert releases_md.exists(), "docs/RELEASES.md not found"
    content = releases_md.read_text()
    assert re.search(r"v0\.1\.0", content), "docs/RELEASES.md has no v0.1.0 reference"
    assert re.search(r"(?i)rollback", content), "docs/RELEASES.md has no rollback procedure"
    assert re.search(
        r"(?i)(GITHUB_TOKEN|GH_PACKAGES_TOKEN)", content
    ), "docs/RELEASES.md missing token setup documentation"
    assert re.search(
        r"(?i)(F1.*F6|SemVer.*F[1-6])", content
    ), "docs/RELEASES.md missing SemVer F1-F6 rules"


def test_semver_rules_f1_to_f6_documented() -> None:
    """V-D-5: F1-F6 SemVer rules enumerated with major/minor/patch semantics."""
    releases_md = (ROOT / "docs/RELEASES.md").read_text()
    missing = []
    for rule in ["F1", "F2", "F3", "F4", "F5", "F6"]:
        if not re.search(rf"{rule}.*(major|minor|patch|MAJOR|MINOR|PATCH)", releases_md):
            missing.append(rule)
    assert not missing, f"docs/RELEASES.md missing SemVer rules: {missing}"


def test_halt_criterion_v_x_1_documented() -> None:
    """V-X-1: GH Packages auth halt criterion documented in docs/RELEASES.md."""
    content = (ROOT / "docs/RELEASES.md").read_text()
    assert re.search(
        r"(?i)(GITHUB_TOKEN.*write:packages|halt criterion|HALT|escalate)",
        content
    ), "docs/RELEASES.md missing GH Packages auth halt criterion (V-X-1)"
