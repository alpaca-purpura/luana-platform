"""Unit tests — OfferLadderService.

TDD RED phase: written before implementation to drive contract per 03-arch-be.md § 9.

Covers:
  - L1: get_ladder returns LadderResult with 4 optional offer slots + completeness_score
  - L2: update_connections persists level assignments + recomputes completeness_score
  - L3: detect_gaps returns list of missing level type strings
  - L4: detect_gaps returns empty list when all 4 levels are set
  - L5: completeness_score = count of non-null levels × 25

D1: OfferLadderService receives ladder_repo via DI constructor injection.
D19: OfferLadder singleton per tenant (UNIQUE tenant_id constraint).
D20: completeness_score = count non-null levels × 25 (0/25/50/75/100).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.modules.comunify.application.services.offer_ladder_service import (
    LadderConnectionsRequest,
    LadderResult,
    OfferLadderService,
)
from src.modules.comunify.infrastructure.models.offer_ladder_model import (
    ComunifyOfferLadderModel,
)

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

TENANT_ID = uuid.uuid4()


def _make_ladder(
    *,
    level_1: uuid.UUID | None = None,
    level_2: uuid.UUID | None = None,
    level_3: uuid.UUID | None = None,
    level_4: uuid.UUID | None = None,
) -> ComunifyOfferLadderModel:
    filled = sum(1 for x in [level_1, level_2, level_3, level_4] if x is not None)
    return ComunifyOfferLadderModel(
        id=uuid.uuid4(),
        tenant_id=TENANT_ID,
        level_1_offer_id=level_1,
        level_2_offer_id=level_2,
        level_3_offer_id=level_3,
        level_4_offer_id=level_4,
        gap_acknowledged=False,
        completeness_score=filled * 25,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────


@pytest.fixture
def mock_ladder_repo() -> MagicMock:
    repo = MagicMock()
    repo.get_for_tenant = AsyncMock(return_value=None)
    repo.save = AsyncMock(return_value=None)
    repo.update_connections = AsyncMock(return_value=True)
    return repo


@pytest.fixture
def service(mock_ladder_repo: MagicMock) -> OfferLadderService:
    return OfferLadderService(
        ladder_repo=mock_ladder_repo,
        tenant_id=TENANT_ID,
    )


# ─────────────────────────────────────────────────────────────────────────────
# L1 — get_ladder returns LadderResult
# ─────────────────────────────────────────────────────────────────────────────


async def test_get_ladder_returns_result_with_slots(
    service: OfferLadderService,
    mock_ladder_repo: MagicMock,
) -> None:
    """L1: get_ladder returns LadderResult with offer slots and completeness_score."""
    level_3_id = uuid.uuid4()
    ladder = _make_ladder(level_3=level_3_id)
    mock_ladder_repo.get_for_tenant = AsyncMock(return_value=ladder)

    result = await service.get_ladder()

    assert isinstance(result, LadderResult)
    assert result.level_3_offer_id == level_3_id
    assert result.completeness_score == 25


async def test_get_ladder_returns_none_when_not_created(
    service: OfferLadderService,
    mock_ladder_repo: MagicMock,
) -> None:
    """L1b: get_ladder returns None when no ladder exists yet."""
    mock_ladder_repo.get_for_tenant = AsyncMock(return_value=None)

    result = await service.get_ladder()

    assert result is None


# ─────────────────────────────────────────────────────────────────────────────
# L2 — update_connections persists + recomputes completeness
# ─────────────────────────────────────────────────────────────────────────────


async def test_update_connections_creates_new_ladder_if_none(
    service: OfferLadderService,
    mock_ladder_repo: MagicMock,
) -> None:
    """L2a: update_connections creates ladder row when none exists."""
    mock_ladder_repo.get_for_tenant = AsyncMock(return_value=None)

    req = LadderConnectionsRequest(
        level_1_offer_id=uuid.uuid4(),
        level_3_offer_id=uuid.uuid4(),
    )
    result = await service.update_connections(req)

    assert result.completeness_score == 50
    mock_ladder_repo.save.assert_called_once()


async def test_update_connections_updates_existing_ladder(
    service: OfferLadderService,
    mock_ladder_repo: MagicMock,
) -> None:
    """L2b: update_connections updates existing ladder row."""
    existing = _make_ladder(level_3=uuid.uuid4())
    mock_ladder_repo.get_for_tenant = AsyncMock(return_value=existing)

    level_1_id = uuid.uuid4()
    level_3_id = uuid.uuid4()
    req = LadderConnectionsRequest(
        level_1_offer_id=level_1_id,
        level_3_offer_id=level_3_id,
    )
    result = await service.update_connections(req)

    assert result.completeness_score == 50
    mock_ladder_repo.update_connections.assert_called_once()


# ─────────────────────────────────────────────────────────────────────────────
# L3 — detect_gaps returns missing level types
# ─────────────────────────────────────────────────────────────────────────────


async def test_detect_gaps_returns_missing_levels(
    service: OfferLadderService,
    mock_ladder_repo: MagicMock,
) -> None:
    """L3: detect_gaps returns list of missing level identifiers."""
    # Only level_3 (core) is set
    ladder = _make_ladder(level_3=uuid.uuid4())
    mock_ladder_repo.get_for_tenant = AsyncMock(return_value=ladder)

    gaps = await service.detect_gaps()

    assert "lead_magnet" in gaps  # level_1 missing
    assert "tripwire" in gaps  # level_2 missing
    assert "premium" in gaps  # level_4 missing
    assert "core_offer" not in gaps  # level_3 is set


# ─────────────────────────────────────────────────────────────────────────────
# L4 — detect_gaps empty when all levels set
# ─────────────────────────────────────────────────────────────────────────────


async def test_detect_gaps_empty_when_complete(
    service: OfferLadderService,
    mock_ladder_repo: MagicMock,
) -> None:
    """L4: detect_gaps returns empty list when all 4 levels are set."""
    ladder = _make_ladder(
        level_1=uuid.uuid4(),
        level_2=uuid.uuid4(),
        level_3=uuid.uuid4(),
        level_4=uuid.uuid4(),
    )
    mock_ladder_repo.get_for_tenant = AsyncMock(return_value=ladder)

    gaps = await service.detect_gaps()

    assert gaps == []


async def test_detect_gaps_no_ladder_returns_all_four(
    service: OfferLadderService,
    mock_ladder_repo: MagicMock,
) -> None:
    """L3b: detect_gaps with no ladder returns all 4 gap types."""
    mock_ladder_repo.get_for_tenant = AsyncMock(return_value=None)

    gaps = await service.detect_gaps()

    assert len(gaps) == 4
    assert "lead_magnet" in gaps
    assert "tripwire" in gaps
    assert "core_offer" in gaps
    assert "premium" in gaps


# ─────────────────────────────────────────────────────────────────────────────
# L5 — completeness_score = count filled × 25
# ─────────────────────────────────────────────────────────────────────────────


async def test_completeness_score_two_levels(
    service: OfferLadderService,
    mock_ladder_repo: MagicMock,
) -> None:
    """L5: completeness_score = 2 × 25 = 50 when 2 levels set."""
    ladder = _make_ladder(level_1=uuid.uuid4(), level_3=uuid.uuid4())
    mock_ladder_repo.get_for_tenant = AsyncMock(return_value=ladder)

    result = await service.get_ladder()
    assert result is not None
    assert result.completeness_score == 50


async def test_completeness_score_four_levels_is_100(
    service: OfferLadderService,
    mock_ladder_repo: MagicMock,
) -> None:
    """L5b: completeness_score = 100 when all 4 levels set."""
    ladder = _make_ladder(
        level_1=uuid.uuid4(),
        level_2=uuid.uuid4(),
        level_3=uuid.uuid4(),
        level_4=uuid.uuid4(),
    )
    mock_ladder_repo.get_for_tenant = AsyncMock(return_value=ladder)

    result = await service.get_ladder()
    assert result is not None
    assert result.completeness_score == 100
