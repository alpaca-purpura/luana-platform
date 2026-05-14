"""Async repository — ComunifyAuthorityVaultItemModel.

All queries filter by tenant_id (mandatory, per tenant-isolation.md).
Soft deletes: deleted_at IS NULL on reads; update deleted_at on delete.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import structlog
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.comunify.infrastructure.models.authority_vault_item_model import (
    ComunifyAuthorityVaultItemModel,
)

logger = structlog.get_logger()

_VALID_KINDS = ("credentials", "case_studies", "press_mentions", "awards")


class AuthorityVaultRepository:
    """Tenant-scoped async repository for ComunifyAuthorityVaultItemModel.

    Polymorphic single-table model (kind: credentials | case_studies | press_mentions | awards).
    tenant_id is injected at construction time; every method enforces isolation.
    """

    def __init__(self, session: AsyncSession, tenant_id: uuid.UUID) -> None:
        self._session = session
        self._tenant_id = tenant_id

    async def get_by_id(self, item_id: uuid.UUID) -> ComunifyAuthorityVaultItemModel | None:
        """Return authority vault item by ID for this tenant, or None if not found / soft-deleted."""
        stmt = select(ComunifyAuthorityVaultItemModel).where(
            ComunifyAuthorityVaultItemModel.id == item_id,
            ComunifyAuthorityVaultItemModel.tenant_id == self._tenant_id,
            ComunifyAuthorityVaultItemModel.deleted_at.is_(None),
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_kind(
        self,
        kind: str,
        *,
        limit: int = 50,
        offset: int = 0,
    ) -> list[ComunifyAuthorityVaultItemModel]:
        """List vault items for a specific kind within this tenant."""
        stmt = (
            select(ComunifyAuthorityVaultItemModel)
            .where(
                ComunifyAuthorityVaultItemModel.tenant_id == self._tenant_id,
                ComunifyAuthorityVaultItemModel.kind == kind,
                ComunifyAuthorityVaultItemModel.deleted_at.is_(None),
            )
            .order_by(ComunifyAuthorityVaultItemModel.display_order.asc())
            .limit(limit)
            .offset(offset)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def list_all(self) -> list[ComunifyAuthorityVaultItemModel]:
        """List all vault items across all kinds for this tenant."""
        stmt = (
            select(ComunifyAuthorityVaultItemModel)
            .where(
                ComunifyAuthorityVaultItemModel.tenant_id == self._tenant_id,
                ComunifyAuthorityVaultItemModel.deleted_at.is_(None),
            )
            .order_by(
                ComunifyAuthorityVaultItemModel.kind.asc(),
                ComunifyAuthorityVaultItemModel.display_order.asc(),
            )
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def save(self, item: ComunifyAuthorityVaultItemModel) -> None:
        """Persist a new or updated authority vault item."""
        self._session.add(item)
        await self._session.flush()
        logger.info(
            "authority_vault_item_saved",
            item_id=str(item.id),
            kind=item.kind,
            tenant_id=str(self._tenant_id),
        )

    async def soft_delete(self, item_id: uuid.UUID) -> bool:
        """Soft-delete an authority vault item. Returns True if found and updated."""
        now = datetime.now(timezone.utc)
        stmt = (
            update(ComunifyAuthorityVaultItemModel)
            .where(
                ComunifyAuthorityVaultItemModel.id == item_id,
                ComunifyAuthorityVaultItemModel.tenant_id == self._tenant_id,
                ComunifyAuthorityVaultItemModel.deleted_at.is_(None),
            )
            .values(deleted_at=now)
        )
        result = await self._session.execute(stmt)
        await self._session.flush()
        updated = result.rowcount > 0
        if updated:
            logger.info(
                "authority_vault_item_soft_deleted",
                item_id=str(item_id),
                tenant_id=str(self._tenant_id),
            )
        return updated
