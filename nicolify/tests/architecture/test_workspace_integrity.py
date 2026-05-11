"""
Architecture fitness test: workspace integrity.
Validates that all uv + pnpm workspace members declared in root config files
resolve to actual directories in the monorepo.
"""

import tomllib
from pathlib import Path

# Repo root is 2 levels up from nicolify/tests/architecture/
REPO_ROOT = Path(__file__).parent.parent.parent.parent


def test_pyproject_workspace_members_resolve():
    """All uv workspace members in pyproject.toml resolve to actual directories."""
    pyproject_path = REPO_ROOT / "pyproject.toml"
    assert pyproject_path.exists(), f"pyproject.toml not found at {pyproject_path}"

    with open(pyproject_path, "rb") as f:
        data = tomllib.load(f)

    members = data.get("tool", {}).get("uv", {}).get("workspace", {}).get("members", [])
    assert len(members) > 0, "No workspace members declared in [tool.uv.workspace]"

    for member in members:
        member_path = REPO_ROOT / member
        assert member_path.is_dir(), (
            f"Workspace member '{member}' declared in pyproject.toml does not resolve to a directory at {member_path}"
        )


def test_pnpm_workspace_members_resolve():
    """All pnpm-workspace.yaml packages resolve to actual directories."""
    import re

    pnpm_ws_path = REPO_ROOT / "pnpm-workspace.yaml"
    assert pnpm_ws_path.exists(), f"pnpm-workspace.yaml not found at {pnpm_ws_path}"

    content = pnpm_ws_path.read_text()
    # Parse simple YAML list manually (avoid yaml dep in placeholder)
    packages = re.findall(r"^\s+-\s+(\S+)", content, re.MULTILINE)
    assert len(packages) > 0, "No packages declared in pnpm-workspace.yaml"

    for pkg in packages:
        pkg_path = REPO_ROOT / pkg
        assert pkg_path.is_dir(), (
            f"pnpm workspace package '{pkg}' declared in pnpm-workspace.yaml "
            f"does not resolve to a directory at {pkg_path}"
        )


def test_all_expected_subfolders_present():
    """Core + 4 brand subfolders are all present."""
    expected = ["core", "nicolify", "vitalia", "comunify", "lupulo"]
    for sub in expected:
        sub_path = REPO_ROOT / sub
        assert sub_path.is_dir(), f"Expected subfolder '{sub}' not found at {sub_path}"
        readme = sub_path / "README.md"
        assert readme.is_file() and readme.stat().st_size > 0, f"README.md missing or empty in subfolder '{sub}'"
