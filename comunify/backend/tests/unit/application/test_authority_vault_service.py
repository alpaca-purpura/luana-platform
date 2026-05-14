"""Unit tests — AuthorityVaultService.

TDD RED phase: written before implementation to drive contract per 03-arch-be.md § 9.6.

Covers:
  - A1: add_item persists vault item with correct kind + title + content
  - A2: add_item with URL starts async URL validation (best-effort HEAD request)
  - A3: add_item URL validation failure → item saved with status='unvalidated' (no raise)
  - A4: list_all returns grouped subsections (credentials / testimonials / press / awards)
  - A5: delete_item soft-deletes the vault item
  - A6: delete_item raises AuthorityVaultItemNotFoundError for unknown id

D1: AuthorityVaultService receives authority_vault_repo + url_validator via DI.
D19: URL validation async best-effort — timeout 5s, fallback status='unvalidated'.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.modules.comunify.application.services.authority_vault_service import (
    AddVaultItemRequest,
    AuthorityVaultItemNotFoundError,
    AuthorityVaultService,
    UrlValidatorProtocol,
    VaultItemResponse,
)
from src.modules.comunify.infrastructure.models.authority_vault_item_model import (
    ComunifyAuthorityVaultItemModel,
)

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

TENANT_ID = uuid.uuid4()


def _make_item(kind: str = "credentials", url: str | None = None) -> ComunifyAuthorityVaultItemModel:
    return ComunifyAuthorityVaultItemModel(
        id=uuid.uuid4(),
        tenant_id=TENANT_ID,
        kind=kind,
        title="Test item",
        content={"body": "example content"},
        url=url,
        display_order=0,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────


@pytest.fixture
def mock_vault_repo() -> MagicMock:
    repo = MagicMock()
    repo.save = AsyncMock(return_value=None)
    repo.get_by_id = AsyncMock(return_value=None)
    repo.list_all = AsyncMock(return_value=[])
    repo.list_by_kind = AsyncMock(return_value=[])
    repo.soft_delete = AsyncMock(return_value=True)
    return repo


@pytest.fixture
def mock_url_validator() -> MagicMock:
    """Mock UrlValidatorProtocol — async HTTP HEAD best-effort."""
    validator = MagicMock(spec=UrlValidatorProtocol)
    validator.check_reachable = AsyncMock(return_value=True)
    return validator


@pytest.fixture
def service(
    mock_vault_repo: MagicMock,
    mock_url_validator: MagicMock,
) -> AuthorityVaultService:
    return AuthorityVaultService(
        vault_repo=mock_vault_repo,
        url_validator=mock_url_validator,
        tenant_id=TENANT_ID,
    )


# ─────────────────────────────────────────────────────────────────────────────
# A1 — add_item persists correct kind + content
# ─────────────────────────────────────────────────────────────────────────────


async def test_add_item_persists_with_correct_kind(
    service: AuthorityVaultService,
    mock_vault_repo: MagicMock,
) -> None:
    """A1: add_item calls vault_repo.save() with correct kind + title."""
    req = AddVaultItemRequest(
        kind="credentials",
        title="Certified Coach ICF",
        content={"institution": "ICF", "year": 2023},
    )
    result = await service.add_item(req)

    mock_vault_repo.save.assert_called_once()
    saved_model: ComunifyAuthorityVaultItemModel = mock_vault_repo.save.call_args[0][0]
    assert saved_model.kind == "credentials"
    assert saved_model.title == "Certified Coach ICF"
    assert isinstance(result, VaultItemResponse)


# ─────────────────────────────────────────────────────────────────────────────
# A2 — add_item with URL starts async URL validation
# ─────────────────────────────────────────────────────────────────────────────


async def test_add_item_with_url_calls_validator(
    service: AuthorityVaultService,
    mock_vault_repo: MagicMock,
    mock_url_validator: MagicMock,
) -> None:
    """A2: add_item with non-null URL calls url_validator.check_reachable()."""
    req = AddVaultItemRequest(
        kind="press_mentions",
        title="Forbes article",
        content={"publication": "Forbes", "headline": "Coach of the year"},
        url="https://forbes.com/coach-article",
    )
    await service.add_item(req)

    mock_url_validator.check_reachable.assert_called_once_with("https://forbes.com/coach-article")


# ─────────────────────────────────────────────────────────────────────────────
# A3 — URL validation failure → item saved as unvalidated (best-effort)
# ─────────────────────────────────────────────────────────────────────────────


async def test_add_item_url_validation_failure_does_not_raise(
    service: AuthorityVaultService,
    mock_vault_repo: MagicMock,
    mock_url_validator: MagicMock,
) -> None:
    """A3: URL validator raising exception does not propagate — item saved with url_status=unvalidated."""
    mock_url_validator.check_reachable = AsyncMock(side_effect=Exception("timeout"))

    req = AddVaultItemRequest(
        kind="press_mentions",
        title="CNN article",
        content={"publication": "CNN"},
        url="https://cnn.com/article",
    )
    # Must NOT raise
    result = await service.add_item(req)

    mock_vault_repo.save.assert_called_once()
    assert result.url_status == "unvalidated"


# ─────────────────────────────────────────────────────────────────────────────
# A4 — list_all returns items (multiple kinds)
# ─────────────────────────────────────────────────────────────────────────────


async def test_list_all_returns_all_items(
    service: AuthorityVaultService,
    mock_vault_repo: MagicMock,
) -> None:
    """A4: list_all returns all vault items across all kinds."""
    items = [
        _make_item("credentials"),
        _make_item("awards"),
        _make_item("press_mentions"),
    ]
    mock_vault_repo.list_all = AsyncMock(return_value=items)

    results = await service.list_all()

    assert len(results) == 3
    kinds = {r.kind for r in results}
    assert "credentials" in kinds
    assert "awards" in kinds


# ─────────────────────────────────────────────────────────────────────────────
# A5 — delete_item soft-deletes
# ─────────────────────────────────────────────────────────────────────────────


async def test_delete_item_calls_soft_delete(
    service: AuthorityVaultService,
    mock_vault_repo: MagicMock,
) -> None:
    """A5: delete_item calls vault_repo.soft_delete()."""
    item_id = uuid.uuid4()
    existing = _make_item()
    existing.id = item_id
    mock_vault_repo.get_by_id = AsyncMock(return_value=existing)

    await service.delete_item(item_id)

    mock_vault_repo.soft_delete.assert_called_once_with(item_id)


# ─────────────────────────────────────────────────────────────────────────────
# A6 — delete_item raises AuthorityVaultItemNotFoundError for unknown id
# ─────────────────────────────────────────────────────────────────────────────


async def test_delete_item_not_found_raises(
    service: AuthorityVaultService,
    mock_vault_repo: MagicMock,
) -> None:
    """A6: delete_item raises AuthorityVaultItemNotFoundError when item not found."""
    mock_vault_repo.get_by_id = AsyncMock(return_value=None)

    with pytest.raises(AuthorityVaultItemNotFoundError):
        await service.delete_item(uuid.uuid4())
