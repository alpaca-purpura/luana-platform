"""Async repository — ComunifyCohortMemberModel.

All queries filter by tenant_id (mandatory, per tenant-isolation.md).
Soft deletes: deleted_at IS NULL on reads; update deleted_at on delete.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import structlog
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.comunify.infrastructure.models.cohort_member_model import (
    ComunifyCohortMemberModel,
)

logger = structlog.get_logger()


class CohortMemberRepository:
    """Tenant-scoped async repository for ComunifyCohortMemberModel.

    tenant_id is injected at construction time; every method enforces isolation.
    """

    def __init__(self, session: AsyncSession, tenant_id: uuid.UUID) -> None:
        self._session = session
        self._tenant_id = tenant_id

    async def get_by_id(self, member_id: uuid.UUID) -> ComunifyCohortMemberModel | None:
        """Return cohort member by ID for this tenant, or None if not found / soft-deleted."""
        stmt = select(ComunifyCohortMemberModel).where(
            ComunifyCohortMemberModel.id == member_id,
            ComunifyCohortMemberModel.tenant_id == self._tenant_id,
            ComunifyCohortMemberModel.deleted_at.is_(None),
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def find_by_cohort_and_subscriber(
        self,
        cohort_id: uuid.UUID,
        subscriber_id: uuid.UUID,
    ) -> ComunifyCohortMemberModel | None:
        """Return existing enrollment for (cohort_id, subscriber_id) within this tenant."""
        stmt = select(ComunifyCohortMemberModel).where(
            ComunifyCohortMemberModel.tenant_id == self._tenant_id,
            ComunifyCohortMemberModel.cohort_id == cohort_id,
            ComunifyCohortMemberModel.subscriber_id == subscriber_id,
            ComunifyCohortMemberModel.deleted_at.is_(None),
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_cohort(
        self,
        cohort_id: uuid.UUID,
        *,
        tier: str | None = None,
        status: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[ComunifyCohortMemberModel]:
        """List active members for a cohort within this tenant."""
        conditions = [
            ComunifyCohortMemberModel.tenant_id == self._tenant_id,
            ComunifyCohortMemberModel.cohort_id == cohort_id,
            ComunifyCohortMemberModel.deleted_at.is_(None),
        ]
        if tier is not None:
            conditions.append(ComunifyCohortMemberModel.tier == tier)
        if status is not None:
            conditions.append(ComunifyCohortMemberModel.status == status)

        stmt = (
            select(ComunifyCohortMemberModel)
            .where(*conditions)
            .order_by(ComunifyCohortMemberModel.enrollment_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def count_active_by_cohort(self, cohort_id: uuid.UUID) -> int:
        """Count active (non-waitlisted, non-dropped) members for a cohort."""
        from sqlalchemy import func

        stmt = (
            select(func.count())
            .select_from(ComunifyCohortMemberModel)
            .where(
                ComunifyCohortMemberModel.tenant_id == self._tenant_id,
                ComunifyCohortMemberModel.cohort_id == cohort_id,
                ComunifyCohortMemberModel.status == "active",
                ComunifyCohortMemberModel.deleted_at.is_(None),
            )
        )
        result = await self._session.execute(stmt)
        return result.scalar_one()

    async def save(self, member: ComunifyCohortMemberModel) -> None:
        """Persist a new or updated cohort member model."""
        self._session.add(member)
        await self._session.flush()
        logger.info(
            "cohort_member_saved",
            member_id=str(member.id),
            cohort_id=str(member.cohort_id),
            tenant_id=str(self._tenant_id),
        )

    async def soft_delete(self, member_id: uuid.UUID) -> bool:
        """Soft-delete a cohort member. Returns True if found and updated."""
        now = datetime.now(timezone.utc)
        stmt = (
            update(ComunifyCohortMemberModel)
            .where(
                ComunifyCohortMemberModel.id == member_id,
                ComunifyCohortMemberModel.tenant_id == self._tenant_id,
                ComunifyCohortMemberModel.deleted_at.is_(None),
            )
            .values(deleted_at=now)
        )
        result = await self._session.execute(stmt)
        await self._session.flush()
        updated = result.rowcount > 0
        if updated:
            logger.info(
                "cohort_member_soft_deleted",
                member_id=str(member_id),
                tenant_id=str(self._tenant_id),
            )
        return updated
