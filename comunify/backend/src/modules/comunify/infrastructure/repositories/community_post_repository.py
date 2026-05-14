"""Async repository — ComunifyCommunityPostModel.

All queries filter by tenant_id (mandatory, per tenant-isolation.md).
Soft deletes: deleted_at IS NULL on reads; update deleted_at on delete.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import structlog
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.comunify.infrastructure.models.community_post_model import (
    ComunifyCommunityPostModel,
)

logger = structlog.get_logger()

# Statuses visible to subscribers (not pending moderation or rejected)
_VISIBLE_STATUSES = ("approved", "auto_approved")


class CommunityPostRepository:
    """Tenant-scoped async repository for ComunifyCommunityPostModel.

    tenant_id is injected at construction time; every method enforces isolation.
    """

    def __init__(self, session: AsyncSession, tenant_id: uuid.UUID) -> None:
        self._session = session
        self._tenant_id = tenant_id

    async def get_by_id(self, post_id: uuid.UUID) -> ComunifyCommunityPostModel | None:
        """Return post by ID for this tenant, or None if not found / soft-deleted."""
        stmt = select(ComunifyCommunityPostModel).where(
            ComunifyCommunityPostModel.id == post_id,
            ComunifyCommunityPostModel.tenant_id == self._tenant_id,
            ComunifyCommunityPostModel.deleted_at.is_(None),
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_feed(
        self,
        *,
        cohort_id: uuid.UUID | None = None,
        status: str | None = None,
        limit: int = 30,
        offset: int = 0,
    ) -> list[ComunifyCommunityPostModel]:
        """List community posts for feed (optionally scoped to a cohort).

        By default returns only visible posts (approved/auto_approved).
        Pass status='pending_moderation' to get moderation inbox.
        """
        conditions = [
            ComunifyCommunityPostModel.tenant_id == self._tenant_id,
            ComunifyCommunityPostModel.deleted_at.is_(None),
        ]
        if cohort_id is not None:
            conditions.append(ComunifyCommunityPostModel.cohort_id == cohort_id)
        if status is not None:
            conditions.append(ComunifyCommunityPostModel.status == status)
        else:
            conditions.append(ComunifyCommunityPostModel.status.in_(_VISIBLE_STATUSES))

        stmt = (
            select(ComunifyCommunityPostModel)
            .where(*conditions)
            .order_by(ComunifyCommunityPostModel.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def list_pending_moderation(
        self,
        *,
        limit: int = 50,
        offset: int = 0,
    ) -> list[ComunifyCommunityPostModel]:
        """List posts pending moderation for creator review inbox."""
        stmt = (
            select(ComunifyCommunityPostModel)
            .where(
                ComunifyCommunityPostModel.tenant_id == self._tenant_id,
                ComunifyCommunityPostModel.status == "pending_moderation",
                ComunifyCommunityPostModel.deleted_at.is_(None),
            )
            .order_by(ComunifyCommunityPostModel.created_at.asc())
            .limit(limit)
            .offset(offset)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def save(self, post: ComunifyCommunityPostModel) -> None:
        """Persist a new or updated post model."""
        self._session.add(post)
        await self._session.flush()
        logger.info(
            "community_post_saved",
            post_id=str(post.id),
            tenant_id=str(self._tenant_id),
            status=post.status,
        )

    async def update_status(
        self,
        post_id: uuid.UUID,
        *,
        status: str,
        moderation_result: dict | None = None,
    ) -> bool:
        """Update post status (and optional moderation result). Returns True if updated."""
        now = datetime.now(timezone.utc)
        values: dict = {"status": status, "updated_at": now}
        if moderation_result is not None:
            values["moderation_result"] = moderation_result

        stmt = (
            update(ComunifyCommunityPostModel)
            .where(
                ComunifyCommunityPostModel.id == post_id,
                ComunifyCommunityPostModel.tenant_id == self._tenant_id,
                ComunifyCommunityPostModel.deleted_at.is_(None),
            )
            .values(**values)
        )
        result = await self._session.execute(stmt)
        await self._session.flush()
        return result.rowcount > 0

    async def soft_delete(self, post_id: uuid.UUID) -> bool:
        """Soft-delete a post. Returns True if found and updated."""
        now = datetime.now(timezone.utc)
        stmt = (
            update(ComunifyCommunityPostModel)
            .where(
                ComunifyCommunityPostModel.id == post_id,
                ComunifyCommunityPostModel.tenant_id == self._tenant_id,
                ComunifyCommunityPostModel.deleted_at.is_(None),
            )
            .values(deleted_at=now)
        )
        result = await self._session.execute(stmt)
        await self._session.flush()
        updated = result.rowcount > 0
        if updated:
            logger.info(
                "community_post_soft_deleted",
                post_id=str(post_id),
                tenant_id=str(self._tenant_id),
            )
        return updated
