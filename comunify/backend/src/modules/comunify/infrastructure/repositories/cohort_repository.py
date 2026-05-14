"""Async repository — ComunifyCohortModel.

All queries filter by tenant_id (mandatory, per tenant-isolation.md).
Soft deletes: deleted_at IS NULL on reads; update deleted_at on delete.
Constructor receives tenant_id as a required parameter.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

import structlog
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.comunify.infrastructure.models.cohort_model import ComunifyCohortModel

if TYPE_CHECKING:
    pass

logger = structlog.get_logger()


class CohortRepository:
    """Tenant-scoped async repository for ComunifyCohortModel.

    tenant_id is injected at construction time; every method enforces isolation
    automatically — callers cannot accidentally omit the filter.
    """

    def __init__(self, session: AsyncSession, tenant_id: uuid.UUID) -> None:
        self._session = session
        self._tenant_id = tenant_id

    async def get_by_id(self, cohort_id: uuid.UUID) -> ComunifyCohortModel | None:
        """Return cohort by ID for this tenant, or None if not found / soft-deleted."""
        stmt = select(ComunifyCohortModel).where(
            ComunifyCohortModel.id == cohort_id,
            ComunifyCohortModel.tenant_id == self._tenant_id,
            ComunifyCohortModel.deleted_at.is_(None),
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> ComunifyCohortModel | None:
        """Return cohort by slug for this tenant, or None if not found / soft-deleted."""
        stmt = select(ComunifyCohortModel).where(
            ComunifyCohortModel.tenant_id == self._tenant_id,
            ComunifyCohortModel.slug == slug,
            ComunifyCohortModel.deleted_at.is_(None),
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_tenant(
        self,
        *,
        status: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[ComunifyCohortModel]:
        """List active cohorts for this tenant, optionally filtered by status."""
        conditions = [
            ComunifyCohortModel.tenant_id == self._tenant_id,
            ComunifyCohortModel.deleted_at.is_(None),
        ]
        if status is not None:
            conditions.append(ComunifyCohortModel.status == status)

        stmt = (
            select(ComunifyCohortModel)
            .where(*conditions)
            .order_by(ComunifyCohortModel.start_date.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def save(self, cohort: ComunifyCohortModel) -> None:
        """Persist a new or updated cohort model."""
        self._session.add(cohort)
        await self._session.flush()
        logger.info(
            "cohort_saved",
            cohort_id=str(cohort.id),
            tenant_id=str(self._tenant_id),
            status=cohort.status,
        )

    async def update_capacity(
        self,
        cohort_id: uuid.UUID,
        *,
        capacity_filled: int,
        capacity_waitlist: int,
    ) -> bool:
        """Update capacity counters atomically. Returns True if row was found and updated."""
        now = datetime.now(timezone.utc)
        stmt = (
            update(ComunifyCohortModel)
            .where(
                ComunifyCohortModel.id == cohort_id,
                ComunifyCohortModel.tenant_id == self._tenant_id,
                ComunifyCohortModel.deleted_at.is_(None),
            )
            .values(
                capacity_filled=capacity_filled,
                capacity_waitlist=capacity_waitlist,
                updated_at=now,
            )
        )
        result = await self._session.execute(stmt)
        await self._session.flush()
        return result.rowcount > 0

    async def soft_delete(self, cohort_id: uuid.UUID) -> bool:
        """Soft-delete a cohort. Returns True if found and updated."""
        now = datetime.now(timezone.utc)
        stmt = (
            update(ComunifyCohortModel)
            .where(
                ComunifyCohortModel.id == cohort_id,
                ComunifyCohortModel.tenant_id == self._tenant_id,
                ComunifyCohortModel.deleted_at.is_(None),
            )
            .values(deleted_at=now)
        )
        result = await self._session.execute(stmt)
        await self._session.flush()
        updated = result.rowcount > 0
        if updated:
            logger.info(
                "cohort_soft_deleted",
                cohort_id=str(cohort_id),
                tenant_id=str(self._tenant_id),
            )
        return updated
