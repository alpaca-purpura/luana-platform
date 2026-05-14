"""OfferLadderService — 4-level offer ladder CRUD + gap detection + completeness.

Per 03-arch-be.md § 9 + D1/D19/D20:

  get_ladder() → LadderResult | None (None when no ladder exists yet)
  update_connections(request) → LadderResult (creates row if absent, updates if exists)
  detect_gaps() → list[str]  (returns level type labels for missing levels)

  Level type labels:
    level_1 → 'lead_magnet'
    level_2 → 'tripwire'
    level_3 → 'core_offer'
    level_4 → 'premium'

  Completeness score = count of non-null levels × 25 (0/25/50/75/100).

D1: OfferLadderService receives ladder_repo via DI constructor injection.
D19: OfferLadder singleton per tenant (UNIQUE tenant_id constraint).
D20: completeness_score = non-null levels × 25.

Anti-duplication (anti-duplication.md):
  grep cross-codebase found no existing OfferLadderService — NEW.

References:
  - 03-arch-be.md § 9
  - 01-spec.md § 3.3 (offer ladder wizard)
  - comunify/config/brand.yaml § ladder.levels
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

import structlog
from pydantic import BaseModel, ConfigDict

from src.modules.comunify.infrastructure.models.offer_ladder_model import (
    ComunifyOfferLadderModel,
)

logger = structlog.get_logger()

# Level type labels (for gap detection)
_LEVEL_LABELS: dict[str, str] = {
    "level_1_offer_id": "lead_magnet",
    "level_2_offer_id": "tripwire",
    "level_3_offer_id": "core_offer",
    "level_4_offer_id": "premium",
}


def _utc_now() -> datetime:
    """Return current UTC datetime with timezone info."""
    return datetime.now(tz=timezone.utc)


def _compute_completeness(
    level_1: uuid.UUID | None,
    level_2: uuid.UUID | None,
    level_3: uuid.UUID | None,
    level_4: uuid.UUID | None,
) -> int:
    """Compute completeness score — count non-null levels × 25."""
    filled = sum(1 for x in [level_1, level_2, level_3, level_4] if x is not None)
    return filled * 25


# ── DTOs ───────────────────────────────────────────────────────────────────


class LadderResult(BaseModel):
    """Output DTO for get_ladder + update_connections.

    Returns current state of the 4-level offer ladder for this tenant.
    """

    model_config = ConfigDict(from_attributes=True)

    ladder_id: uuid.UUID
    tenant_id: uuid.UUID
    level_1_offer_id: uuid.UUID | None = None  # lead_magnet
    level_2_offer_id: uuid.UUID | None = None  # tripwire
    level_3_offer_id: uuid.UUID | None = None  # core_offer
    level_4_offer_id: uuid.UUID | None = None  # premium
    completeness_score: int = 0
    gap_acknowledged: bool = False


class LadderConnectionsRequest(BaseModel):
    """Input DTO for update_connections — drag-drop level assignments.

    All level slots are optional — None means 'unset this level'.
    """

    model_config = ConfigDict(from_attributes=True, extra="forbid")

    level_1_offer_id: uuid.UUID | None = None
    level_2_offer_id: uuid.UUID | None = None
    level_3_offer_id: uuid.UUID | None = None
    level_4_offer_id: uuid.UUID | None = None


# ── Service ────────────────────────────────────────────────────────────────


class OfferLadderService:
    """4-level offer ladder CRUD + gap detection + completeness scoring.

    Usage (D1 — receive deps via DI):
        svc = OfferLadderService(
            ladder_repo=OfferLadderRepository(session=db, tenant_id=tid),
            tenant_id=tid,
        )
    """

    def __init__(
        self,
        *,
        ladder_repo: Any,
        tenant_id: uuid.UUID,
    ) -> None:
        self._ladder_repo = ladder_repo
        self._tenant_id = tenant_id

    async def get_ladder(self) -> LadderResult | None:
        """Return the current offer ladder for this tenant, or None if not yet created.

        Returns:
            LadderResult with level slots + completeness_score, or None.
        """
        row = await self._ladder_repo.get_for_tenant()
        if row is None:
            return None

        return LadderResult(
            ladder_id=row.id,
            tenant_id=row.tenant_id,
            level_1_offer_id=row.level_1_offer_id,
            level_2_offer_id=row.level_2_offer_id,
            level_3_offer_id=row.level_3_offer_id,
            level_4_offer_id=row.level_4_offer_id,
            completeness_score=row.completeness_score,
            gap_acknowledged=row.gap_acknowledged,
        )

    async def update_connections(
        self,
        request: LadderConnectionsRequest,
    ) -> LadderResult:
        """Update level connections for this tenant's offer ladder.

        Creates a new ladder row if none exists; updates existing otherwise.
        Recomputes completeness_score after update.

        Args:
            request: LadderConnectionsRequest with new level assignments.

        Returns:
            LadderResult with updated level connections + completeness_score.
        """
        now = _utc_now()
        completeness = _compute_completeness(
            request.level_1_offer_id,
            request.level_2_offer_id,
            request.level_3_offer_id,
            request.level_4_offer_id,
        )

        existing = await self._ladder_repo.get_for_tenant()

        if existing is None:
            # Create new singleton ladder row
            ladder_id = uuid.uuid4()
            new_row = ComunifyOfferLadderModel(
                id=ladder_id,
                tenant_id=self._tenant_id,
                level_1_offer_id=request.level_1_offer_id,
                level_2_offer_id=request.level_2_offer_id,
                level_3_offer_id=request.level_3_offer_id,
                level_4_offer_id=request.level_4_offer_id,
                gap_acknowledged=False,
                completeness_score=completeness,
                created_at=now,
                updated_at=now,
            )
            await self._ladder_repo.save(new_row)

            logger.info(
                "offer_ladder_created",
                tenant_id=str(self._tenant_id),
                ladder_id=str(ladder_id),
                completeness_score=completeness,
            )

            return LadderResult(
                ladder_id=ladder_id,
                tenant_id=self._tenant_id,
                level_1_offer_id=request.level_1_offer_id,
                level_2_offer_id=request.level_2_offer_id,
                level_3_offer_id=request.level_3_offer_id,
                level_4_offer_id=request.level_4_offer_id,
                completeness_score=completeness,
                gap_acknowledged=False,
            )
        else:
            # Update existing ladder row
            await self._ladder_repo.update_connections(
                level_1_offer_id=request.level_1_offer_id,
                level_2_offer_id=request.level_2_offer_id,
                level_3_offer_id=request.level_3_offer_id,
                level_4_offer_id=request.level_4_offer_id,
            )

            logger.info(
                "offer_ladder_connections_updated",
                tenant_id=str(self._tenant_id),
                ladder_id=str(existing.id),
                completeness_score=completeness,
            )

            return LadderResult(
                ladder_id=existing.id,
                tenant_id=self._tenant_id,
                level_1_offer_id=request.level_1_offer_id,
                level_2_offer_id=request.level_2_offer_id,
                level_3_offer_id=request.level_3_offer_id,
                level_4_offer_id=request.level_4_offer_id,
                completeness_score=completeness,
                gap_acknowledged=existing.gap_acknowledged,
            )

    async def detect_gaps(self) -> list[str]:
        """Detect missing levels in the offer ladder.

        Returns list of level type labels for missing (null) levels.
        Empty list when all 4 levels are set.
        Full 4-item list when no ladder exists or all levels are null.

        Returns:
            List of strings: subset of ['lead_magnet', 'tripwire', 'core_offer', 'premium'].
        """
        row = await self._ladder_repo.get_for_tenant()

        if row is None:
            # No ladder yet — all levels are gaps
            return ["lead_magnet", "tripwire", "core_offer", "premium"]

        gaps: list[str] = []
        if row.level_1_offer_id is None:
            gaps.append("lead_magnet")
        if row.level_2_offer_id is None:
            gaps.append("tripwire")
        if row.level_3_offer_id is None:
            gaps.append("core_offer")
        if row.level_4_offer_id is None:
            gaps.append("premium")

        if gaps:
            logger.info(
                "offer_ladder_gaps_detected",
                tenant_id=str(self._tenant_id),
                gaps=gaps,
                completeness_score=row.completeness_score,
            )

        return gaps
