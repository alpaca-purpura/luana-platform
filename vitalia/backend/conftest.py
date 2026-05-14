"""Root conftest.py for vitalia backend tests.

Adds luana_core_platform source to sys.path so ORM models can import Base
without requiring a full workspace install (cyclic deps prevent pip install).
"""

from __future__ import annotations

import sys

# luana_core_platform is a workspace package — not published to PyPI.
# Insert its src/ into sys.path so `from luana_core_platform.domain.base_entity import Base`
# resolves correctly in native-dev (non-Docker) test runs.
_CORE_PLATFORM_SRC = (
    "/home/chris/luana-platform/core/luana-core-platform/src"
)
if _CORE_PLATFORM_SRC not in sys.path:
    sys.path.insert(0, _CORE_PLATFORM_SRC)
