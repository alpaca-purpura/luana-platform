"""Architecture fitness: AISALESHT campaigns module untouched by Story 8.

V-NF-4. Cardinal invariant per §7.5.7 — Story 8 lifts campaigns to
luana-core-campaigns WITHOUT touching AISALESHT backend campaigns module.

Tests verify by filesystem existence checks only — no git-diff (CI-safe).
The AISALESHT path is the source-of-truth for the original campaigns module;
Story 8 must not modify it.
"""

from __future__ import annotations

import os
from pathlib import Path

# luana-platform root is 3 levels up from this test file
LUANA_ROOT = Path(__file__).parents[3]

# AISALESHT root (sibling to luana-platform)
_AISALESHT_ROOT = Path(os.environ.get("AISALESHT_PATH", "/home/chris/AISALESHT"))
_CAMPAIGNS_MODULE = _AISALESHT_ROOT / "backend" / "src" / "modules" / "campaigns"


def test_aisalesht_path_env_or_default() -> None:
    """V-NF-4: AISALESHT path is resolvable (env override or default /home/chris/AISALESHT)."""
    if not _AISALESHT_ROOT.exists():
        import pytest

        pytest.skip(
            f"AISALESHT not available at {_AISALESHT_ROOT}. Set AISALESHT_PATH env var to override. Skipping V-NF-4."
        )


def test_aisalesht_campaigns_directory_exists() -> None:
    """V-NF-4: AISALESHT campaigns module still exists (not deleted by Story 8)."""
    if not _AISALESHT_ROOT.exists():
        import pytest

        pytest.skip(f"AISALESHT not available at {_AISALESHT_ROOT}")

    assert _CAMPAIGNS_MODULE.exists(), (
        f"AISALESHT campaigns module missing at {_CAMPAIGNS_MODULE}.\n"
        "Story 8 must NOT delete or rename the AISALESHT source."
    )
    assert _CAMPAIGNS_MODULE.is_dir(), f"Expected directory at {_CAMPAIGNS_MODULE}, found file."


def test_luana_core_campaigns_separate_from_aisalesht() -> None:
    """V-NF-4: luana-core-campaigns in luana-platform is a separate package.

    The lift must not create a symlink or any path that resolves to the
    AISALESHT module — it must be an independent copy with its own src layout.
    """
    campaigns_pkg = LUANA_ROOT / "core" / "luana-core-campaigns"
    assert campaigns_pkg.exists(), (
        "core/luana-core-campaigns package missing in luana-platform. Story 8 T-9..T-13 must have created it."
    )

    src_dir = campaigns_pkg / "src"
    assert src_dir.exists(), (
        "core/luana-core-campaigns/src/ missing. Package must follow src-layout (src/luana_core_campaigns/)."
    )

    # Must not be a symlink into AISALESHT
    assert not campaigns_pkg.is_symlink(), "core/luana-core-campaigns is a symlink — must be an independent package."
