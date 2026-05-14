"""Async repository — ComunifyOfferLadderModel.

All queries filter by tenant_id (mandatory, per tenant-isolation.md).
OfferLadder is a singleton per tenant (unique tenant_id constraint).
No soft delete — ladder is upserted.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import structlog
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.comunify.infrastructure.models.offer_ladder_model import (
    ComunifyOfferLadderModel,
)

logger = structlog.get_logger()


class OfferLadderRepository:
    """Tenant-scoped async repository for ComunifyOfferLadderModel.

    Singleton per tenant (UNIQUE constraint on tenant_id).
    tenant_id is injected at construction time; every method enforces isolation.
    """

    def __init__(self, session: AsyncSession, tenant_id: uuid.UUID) -> None:
        self._session = session
        self._tenant_id = tenant_id

    async def get_for_tenant(self) -> ComunifyOfferLadderModel | None:
        """Return the offer ladder for this tenant (singleton), or None if not yet created."""
        stmt = select(ComunifyOfferLadderModel).where(
            ComunifyOfferLadderModel.tenant_id == self._tenant_id,
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def save(self, ladder: ComunifyOfferLadderModel) -> None:
        """Persist the offer ladder (create or update)."""
        self._session.add(ladder)
        await self._session.flush()
        logger.info(
            "offer_ladder_saved",
            ladder_id=str(ladder.id),
            tenant_id=str(self._tenant_id),
            completeness_score=ladder.completeness_score,
        )

    async def update_connections(
        self,
        *,
        level_1_offer_id: uuid.UUID | None = None,
        level_2_offer_id: uuid.UUID | None = None,
        level_3_offer_id: uuid.UUID | None = None,
        level_4_offer_id: uuid.UUID | None = None,
    ) -> bool:
        """Update offer level connections for this tenant's ladder. Returns True if updated."""
        now = datetime.now(timezone.utc)
        stmt = (
            update(ComunifyOfferLadderModel)
            .where(
                ComunifyOfferLadderModel.tenant_id == self._tenant_id,
            )
            .values(
                level_1_offer_id=level_1_offer_id,
                level_2_offer_id=level_2_offer_id,
                level_3_offer_id=level_3_offer_id,
                level_4_offer_id=level_4_offer_id,
                updated_at=now,
            )
        )
        result = await self._session.execute(stmt)
        await self._session.flush()
        return result.rowcount > 0
