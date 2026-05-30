"""Conftest for CRM API router tests — KEK stub + DB session stub.

T-2: adds fixtures so all CRM API unit tests can run without:
  - VITALIA_PHI_KEK env var set (KEKClient patched)
  - Live Postgres connection (get_async_session patched)

Pattern mirrors vitalia/backend/tests/modules/vitalia/inbox/api/conftest.py.

downstream-regression-na: brand-local vitalia CRM API test helpers
"""

from __future__ import annotations

from collections.abc import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.vitalia._shared.encryption.kek_client import KEKClient


async def _stub_async_session() -> AsyncGenerator[AsyncSession, None]:
    """Stub get_async_session — returns AsyncMock to avoid live DB in unit tests."""
    mock_session = AsyncMock(spec=AsyncSession)
    # list_by_filter, get_by_id return empty results by default
    mock_result = MagicMock()
    mock_result.fetchone.return_value = None
    mock_result.fetchall.return_value = []
    mock_session.execute = AsyncMock(return_value=mock_result)
    yield mock_session


@pytest.fixture(autouse=True)
def _patch_kek_and_session(monkeypatch: pytest.MonkeyPatch) -> None:
    """Auto-patch KEKClient.from_env + get_async_session for all CRM API unit tests.

    - KEKClient.from_env: returns a mock KEK with a fake 64-char hex key.
    - get_async_session: returns an AsyncMock session (avoids live DB).
    """
    # Patch KEKClient.from_env at class level (works regardless of import path)
    mock_kek = MagicMock(spec=KEKClient)
    mock_kek.get_key.return_value = "a" * 64
    monkeypatch.setattr(KEKClient, "from_env", classmethod(lambda cls, *a, **kw: mock_kek))

    # Patch get_async_session to avoid real DB connection

    # We need to patch the dependency in the router and consent_endpoints modules
    # The FastAPI dependency_overrides approach requires access to the app object,
    # so we patch the function globally in the db module instead.
    monkeypatch.setattr(
        "src.db.get_async_session",
        _stub_async_session,
    )
