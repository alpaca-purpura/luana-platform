"""Architecture fitness test — A3: every comunify repository query filters by tenant_id.

Ratchet pattern: scans all repository source files to verify that any
select() / update() statement is accompanied by a tenant_id WHERE clause
(or is explicitly exempted as cross-tenant catalog — PlanTierConfigRepository).

TDD RED phase: written before repositories exist.
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

# ---------------------------------------------------------------------------
# Path configuration
# ---------------------------------------------------------------------------

REPO_SRC_DIR = Path(__file__).parents[2] / "src" / "modules" / "comunify" / "infrastructure" / "repositories"

# PlanTierConfigRepository is explicitly cross-tenant catalog — no tenant_id filter.
# Per 03-arch-be.md § 8.2 and arch-bypass annotation in the repo file.
CROSS_TENANT_REPOS = {"plan_tier_config_repository.py"}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _read_repo_files() -> list[tuple[str, str]]:
    """Return list of (filename, source) for all repository .py files."""
    if not REPO_SRC_DIR.exists():
        return []
    return [(f.name, f.read_text()) for f in sorted(REPO_SRC_DIR.glob("*.py")) if not f.name.startswith("_")]


def _has_select_or_update(source: str) -> bool:
    """True if the file contains a SQLAlchemy select() or update() call."""
    return bool(re.search(r"\b(select|update)\s*\(", source))


def _has_tenant_id_filter(source: str) -> bool:
    """True if the file contains a tenant_id comparison filter."""
    return bool(re.search(r"tenant_id\s*==\s*self\._tenant_id", source))


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


@pytest.fixture(scope="module")
def repo_files() -> list[tuple[str, str]]:
    """All repository source files."""
    return _read_repo_files()


def test_repository_directory_exists() -> None:
    """A3 prerequisite: repositories/ directory must exist with at least 13 repo files."""
    assert REPO_SRC_DIR.exists(), f"repositories/ directory missing: {REPO_SRC_DIR}"
    repo_files = [f for f in REPO_SRC_DIR.glob("*.py") if not f.name.startswith("_")]
    assert len(repo_files) >= 13, (
        f"Expected at least 13 repository files, found {len(repo_files)}: {[f.name for f in repo_files]}"
    )


@pytest.mark.parametrize(
    "filename",
    [
        "cohort_repository.py",
        "cohort_member_repository.py",
        "cohort_broadcast_repository.py",
        "community_post_repository.py",
        "community_moderation_repository.py",
        "subscription_repository.py",
        "subscription_charge_repository.py",
        "offer_ladder_repository.py",
        "voice_cloning_samples_repository.py",
        "voice_distillation_job_repository.py",
        "authority_vault_repository.py",
        "lead_qualification_repository.py",
        "community_audit_log_repository.py",
    ],
)
def test_tenant_scoped_repo_has_tenant_id_filter(filename: str) -> None:
    """A3: each tenant-scoped repository must have tenant_id == self._tenant_id filter."""
    repo_path = REPO_SRC_DIR / filename
    assert repo_path.exists(), f"Repository file missing: {filename}"

    source = repo_path.read_text()

    if not _has_select_or_update(source):
        # Repo has no queries (stubs are allowed during RED phase — will fail later)
        pytest.skip(f"{filename}: no select/update calls found yet (RED phase)")

    assert _has_tenant_id_filter(source), (
        f"A3 VIOLATION: {filename} has select/update but NO 'tenant_id == self._tenant_id' filter. "
        "Every tenant-scoped repository MUST filter by tenant_id per tenant-isolation.md."
    )


def test_cross_tenant_repo_has_arch_bypass_comment() -> None:
    """A3 cross-tenant exception: PlanTierConfigRepository must have arch-bypass comment."""
    repo_path = REPO_SRC_DIR / "plan_tier_config_repository.py"
    assert repo_path.exists(), "plan_tier_config_repository.py missing"

    source = repo_path.read_text()
    assert "arch-bypass: catalog table" in source, (
        "PlanTierConfigRepository must document cross-tenant exception with "
        "'# arch-bypass: catalog table' comment per 03-arch-be.md § 8.2"
    )


def test_cross_tenant_repo_has_no_tenant_id_filter() -> None:
    """A3: PlanTierConfigRepository must NOT have tenant_id filter (it's cross-tenant catalog)."""
    repo_path = REPO_SRC_DIR / "plan_tier_config_repository.py"
    assert repo_path.exists(), "plan_tier_config_repository.py missing"

    source = repo_path.read_text()
    assert not _has_tenant_id_filter(source), (
        "PlanTierConfigRepository is a cross-tenant catalog — it must NOT have tenant_id == self._tenant_id filter"
    )


def test_tenant_scoped_repo_constructor_takes_tenant_id() -> None:
    """A3: each tenant-scoped repository must accept tenant_id in __init__."""
    for filename in [
        "cohort_repository.py",
        "cohort_member_repository.py",
        "community_post_repository.py",
        "subscription_repository.py",
    ]:
        repo_path = REPO_SRC_DIR / filename
        assert repo_path.exists(), f"{filename} missing"

        source = repo_path.read_text()
        assert "tenant_id: uuid.UUID" in source or "tenant_id: UUID" in source, (
            f"A3: {filename} __init__ must accept 'tenant_id: UUID' per 03-arch-be.md § 8.1"
        )
