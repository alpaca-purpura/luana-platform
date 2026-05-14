"""Async repository — ComunifyCommunityModerationEventModel.

All queries filter by tenant_id (mandatory, per tenant-isolation.md).
Moderation events are immutable audit records — no soft delete, append-only.
"""

from __future__ import annotations

import uuid

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.comunify.infrastructure.models.community_moderation_event_model import (
    ComunifyCommunityModerationEventModel,
)

logger = structlog.get_logger()


class CommunityModerationRepository:
    """Tenant-scoped async repository for ComunifyCommunityModerationEventModel.

    Immutable append-only records — no soft-delete, no update.
    tenant_id is injected at construction time; every method enforces isolation.
    """

    def __init__(self, session: AsyncSession, tenant_id: uuid.UUID) -> None:
        self._session = session
        self._tenant_id = tenant_id

    async def get_by_id(self, event_id: uuid.UUID) -> ComunifyCommunityModerationEventModel | None:
        """Return moderation event by ID for this tenant."""
        stmt = select(ComunifyCommunityModerationEventModel).where(
            ComunifyCommunityModerationEventModel.id == event_id,
            ComunifyCommunityModerationEventModel.tenant_id == self._tenant_id,
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_post(
        self,
        post_id: uuid.UUID,
        *,
        limit: int = 20,
    ) -> list[ComunifyCommunityModerationEventModel]:
        """List moderation events for a specific post, most recent first."""
        stmt = (
            select(ComunifyCommunityModerationEventModel)
            .where(
                ComunifyCommunityModerationEventModel.tenant_id == self._tenant_id,
                ComunifyCommunityModerationEventModel.post_id == post_id,
            )
            .order_by(ComunifyCommunityModerationEventModel.created_at.desc())
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def save(self, event: ComunifyCommunityModerationEventModel) -> None:
        """Append a new moderation event record (immutable, no update)."""
        self._session.add(event)
        await self._session.flush()
        logger.info(
            "moderation_event_saved",
            event_id=str(event.id),
            post_id=str(event.post_id),
            tenant_id=str(self._tenant_id),
            action=event.action,
        )
