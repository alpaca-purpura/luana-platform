"""Story 9 arch fitness: AISALESHT business code untouched (V-NF-1 best-effort guard).

V-NF-1: AISALESHT backend/ + frontend/ zero UNCOMMITTED changes (working tree clean).
Best-effort: test skips gracefully if AISALESHT_PATH env var is not set or directory not accessible.

Note: This guard checks the WORKING TREE (uncommitted changes) in AISALESHT, not the
main..development diff. Story 9 (luana-v0-1-0-publish) is release engineering — it must
NOT touch AISALESHT backend/ or frontend/ source code. The working tree check confirms
Story 9 builder didn't stage/modify AISALESHT business code.
"""

import os
import subprocess

import pytest

AISALESHT_PATH = os.environ.get("AISALESHT_PATH", "/home/chris/AISALESHT")


@pytest.mark.skipif(
    not os.path.isdir(AISALESHT_PATH),
    reason=f"AISALESHT_PATH={AISALESHT_PATH!r} not set or not accessible — best-effort guard only",
)
def test_aisalesht_business_code_no_uncommitted_changes() -> None:
    """V-NF-1: AISALESHT backend/ + frontend/ have no uncommitted changes (Story 9 guard)."""
    result = subprocess.run(
        ["git", "status", "--porcelain", "--", "backend/", "frontend/"],
        cwd=AISALESHT_PATH,
        capture_output=True,
        text=True,
        check=False,
    )
    uncommitted = [line for line in result.stdout.strip().split("\n") if line.strip()]
    assert not uncommitted, (
        f"AISALESHT business code has uncommitted changes (V-NF-1 violation — Story 9 must not "
        f"modify AISALESHT backend/ or frontend/):\n{chr(10).join(uncommitted)}"
    )
