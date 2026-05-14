"""Async repository — ComunifySubscriptionModel.

All queries filter by tenant_id (mandatory, per tenant-isolation.md).
Soft deletes: deleted_at IS NULL on reads; cancellation = status change, not delete.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import structlog
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.comunify.infrastructure.models.subscription_model import (
    ComunifySubscriptionModel,
)

logger = structlog.get_logger()

_ACTIVE_STATUSES = ("active", "past_due", "suspended")


class SubscriptionRepository:
    """Tenant-scoped async repository for ComunifySubscriptionModel.

    tenant_id is injected at construction time; every method enforces isolation.
    """

    def __init__(self, session: AsyncSession, tenant_id: uuid.UUID) -> None:
        self._session = session
        self._tenant_id = tenant_id

    async def get_by_id(self, subscription_id: uuid.UUID) -> ComunifySubscriptionModel | None:
        """Return subscription by ID for this tenant, or None if not found / soft-deleted."""
        stmt = select(ComunifySubscriptionModel).where(
            ComunifySubscriptionModel.id == subscription_id,
            ComunifySubscriptionModel.tenant_id == self._tenant_id,
            ComunifySubscriptionModel.deleted_at.is_(None),
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_idempotency_key(self, idempotency_key: str) -> ComunifySubscriptionModel | None:
        """Return subscription by idempotency_key (unique, cross-tenant safe via key design)."""
        stmt = select(ComunifySubscriptionModel).where(
            ComunifySubscriptionModel.tenant_id == self._tenant_id,
            ComunifySubscriptionModel.idempotency_key == idempotency_key,
            ComunifySubscriptionModel.deleted_at.is_(None),
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_tenant(
        self,
        *,
        status: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[ComunifySubscriptionModel]:
        """List subscriptions for this tenant, optionally filtered by status."""
        conditions = [
            ComunifySubscriptionModel.tenant_id == self._tenant_id,
            ComunifySubscriptionModel.deleted_at.is_(None),
        ]
        if status is not None:
            conditions.append(ComunifySubscriptionModel.status == status)

        stmt = (
            select(ComunifySubscriptionModel)
            .where(*conditions)
            .order_by(ComunifySubscriptionModel.started_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def list_due_for_charge(
        self,
        *,
        at_or_before: datetime,
        limit: int = 100,
    ) -> list[ComunifySubscriptionModel]:
        """List active/past_due subscriptions due for a charge attempt."""
        stmt = (
            select(ComunifySubscriptionModel)
            .where(
                ComunifySubscriptionModel.tenant_id == self._tenant_id,
                ComunifySubscriptionModel.status.in_(("active", "past_due")),
                ComunifySubscriptionModel.next_charge_at <= at_or_before,
                ComunifySubscriptionModel.deleted_at.is_(None),
            )
            .order_by(ComunifySubscriptionModel.next_charge_at.asc())
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def save(self, subscription: ComunifySubscriptionModel) -> None:
        """Persist a new or updated subscription model."""
        self._session.add(subscription)
        await self._session.flush()
        logger.info(
            "subscription_saved",
            subscription_id=str(subscription.id),
            tenant_id=str(self._tenant_id),
            status=subscription.status,
        )

    async def update_status(
        self,
        subscription_id: uuid.UUID,
        *,
        status: str,
        dunning_state: str | None = None,
        next_charge_at: datetime | None = None,
        access_until: datetime | None = None,
    ) -> bool:
        """Update subscription status fields. Returns True if found and updated."""
        now = datetime.now(timezone.utc)
        values: dict = {"status": status, "updated_at": now}
        if dunning_state is not None:
            values["dunning_state"] = dunning_state
        if next_charge_at is not None:
            values["next_charge_at"] = next_charge_at
        if access_until is not None:
            values["access_until"] = access_until

        stmt = (
            update(ComunifySubscriptionModel)
            .where(
                ComunifySubscriptionModel.id == subscription_id,
                ComunifySubscriptionModel.tenant_id == self._tenant_id,
                ComunifySubscriptionModel.deleted_at.is_(None),
            )
            .values(**values)
        )
        result = await self._session.execute(stmt)
        await self._session.flush()
        updated = result.rowcount > 0
        if updated:
            logger.info(
                "subscription_status_updated",
                subscription_id=str(subscription_id),
                status=status,
                tenant_id=str(self._tenant_id),
            )
        return updated

    async def soft_delete(self, subscription_id: uuid.UUID) -> bool:
        """Soft-delete a subscription. Returns True if found and updated."""
        now = datetime.now(timezone.utc)
        stmt = (
            update(ComunifySubscriptionModel)
            .where(
                ComunifySubscriptionModel.id == subscription_id,
                ComunifySubscriptionModel.tenant_id == self._tenant_id,
                ComunifySubscriptionModel.deleted_at.is_(None),
            )
            .values(deleted_at=now)
        )
        result = await self._session.execute(stmt)
        await self._session.flush()
        updated = result.rowcount > 0
        if updated:
            logger.info(
                "subscription_soft_deleted",
                subscription_id=str(subscription_id),
                tenant_id=str(self._tenant_id),
            )
        return updated
