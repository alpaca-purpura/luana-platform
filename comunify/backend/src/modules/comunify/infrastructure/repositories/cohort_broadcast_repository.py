"""Async repository — ComunifyCohortBroadcastModel.

All queries filter by tenant_id (mandatory, per tenant-isolation.md).
Soft deletes: deleted_at IS NULL on reads; update deleted_at on delete.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import structlog
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.comunify.infrastructure.models.cohort_broadcast_model import (
    ComunifyCohortBroadcastModel,
)

logger = structlog.get_logger()


class CohortBroadcastRepository:
    """Tenant-scoped async repository for ComunifyCohortBroadcastModel.

    tenant_id is injected at construction time; every method enforces isolation.
    """

    def __init__(self, session: AsyncSession, tenant_id: uuid.UUID) -> None:
        self._session = session
        self._tenant_id = tenant_id

    async def get_by_id(self, broadcast_id: uuid.UUID) -> ComunifyCohortBroadcastModel | None:
        """Return broadcast by ID for this tenant, or None if not found / soft-deleted."""
        stmt = select(ComunifyCohortBroadcastModel).where(
            ComunifyCohortBroadcastModel.id == broadcast_id,
            ComunifyCohortBroadcastModel.tenant_id == self._tenant_id,
            ComunifyCohortBroadcastModel.deleted_at.is_(None),
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_cohort(
        self,
        cohort_id: uuid.UUID,
        *,
        limit: int = 20,
        offset: int = 0,
    ) -> list[ComunifyCohortBroadcastModel]:
        """List broadcasts for a cohort within this tenant, most recent first."""
        stmt = (
            select(ComunifyCohortBroadcastModel)
            .where(
                ComunifyCohortBroadcastModel.tenant_id == self._tenant_id,
                ComunifyCohortBroadcastModel.cohort_id == cohort_id,
                ComunifyCohortBroadcastModel.deleted_at.is_(None),
            )
            .order_by(ComunifyCohortBroadcastModel.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def save(self, broadcast: ComunifyCohortBroadcastModel) -> None:
        """Persist a new or updated broadcast model."""
        self._session.add(broadcast)
        await self._session.flush()
        logger.info(
            "cohort_broadcast_saved",
            broadcast_id=str(broadcast.id),
            tenant_id=str(self._tenant_id),
        )

    async def soft_delete(self, broadcast_id: uuid.UUID) -> bool:
        """Soft-delete a broadcast. Returns True if found and updated."""
        now = datetime.now(timezone.utc)
        stmt = (
            update(ComunifyCohortBroadcastModel)
            .where(
                ComunifyCohortBroadcastModel.id == broadcast_id,
                ComunifyCohortBroadcastModel.tenant_id == self._tenant_id,
                ComunifyCohortBroadcastModel.deleted_at.is_(None),
            )
            .values(deleted_at=now)
        )
        result = await self._session.execute(stmt)
        await self._session.flush()
        updated = result.rowcount > 0
        if updated:
            logger.info(
                "cohort_broadcast_soft_deleted",
                broadcast_id=str(broadcast_id),
                tenant_id=str(self._tenant_id),
            )
        return updated
