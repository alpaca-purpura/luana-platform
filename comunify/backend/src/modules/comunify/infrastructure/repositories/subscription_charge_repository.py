"""Async repository — ComunifySubscriptionChargeModel.

All queries filter by tenant_id (mandatory, per tenant-isolation.md).
Charge records are immutable (no soft-delete, status updates only).
"""

from __future__ import annotations

import uuid
from datetime import datetime

import structlog
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.comunify.infrastructure.models.subscription_charge_model import (
    ComunifySubscriptionChargeModel,
)

logger = structlog.get_logger()


class SubscriptionChargeRepository:
    """Tenant-scoped async repository for ComunifySubscriptionChargeModel.

    tenant_id is injected at construction time; every method enforces isolation.
    Charges are billing records — no soft delete (hard immutability, only status updates).
    """

    def __init__(self, session: AsyncSession, tenant_id: uuid.UUID) -> None:
        self._session = session
        self._tenant_id = tenant_id

    async def get_by_id(self, charge_id: uuid.UUID) -> ComunifySubscriptionChargeModel | None:
        """Return charge by ID for this tenant."""
        stmt = select(ComunifySubscriptionChargeModel).where(
            ComunifySubscriptionChargeModel.id == charge_id,
            ComunifySubscriptionChargeModel.tenant_id == self._tenant_id,
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_idempotency_key(self, idempotency_key: str) -> ComunifySubscriptionChargeModel | None:
        """Return charge by idempotency_key to prevent duplicate charges."""
        stmt = select(ComunifySubscriptionChargeModel).where(
            ComunifySubscriptionChargeModel.tenant_id == self._tenant_id,
            ComunifySubscriptionChargeModel.idempotency_key == idempotency_key,
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_subscription(
        self,
        subscription_id: uuid.UUID,
        *,
        limit: int = 24,
        offset: int = 0,
    ) -> list[ComunifySubscriptionChargeModel]:
        """List charge history for a subscription, most recent first."""
        stmt = (
            select(ComunifySubscriptionChargeModel)
            .where(
                ComunifySubscriptionChargeModel.tenant_id == self._tenant_id,
                ComunifySubscriptionChargeModel.subscription_id == subscription_id,
            )
            .order_by(ComunifySubscriptionChargeModel.attempted_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def save(self, charge: ComunifySubscriptionChargeModel) -> None:
        """Persist a new charge record."""
        self._session.add(charge)
        await self._session.flush()
        logger.info(
            "subscription_charge_saved",
            charge_id=str(charge.id),
            subscription_id=str(charge.subscription_id),
            tenant_id=str(self._tenant_id),
            status=charge.status,
        )

    async def update_status(
        self,
        charge_id: uuid.UUID,
        *,
        status: str,
        gateway_charge_id: str | None = None,
        failure_reason: str | None = None,
        succeeded_at: datetime | None = None,
    ) -> bool:
        """Update charge status after gateway response. Returns True if found and updated."""
        values: dict = {"status": status}
        if gateway_charge_id is not None:
            values["gateway_charge_id"] = gateway_charge_id
        if failure_reason is not None:
            values["failure_reason"] = failure_reason
        if succeeded_at is not None:
            values["succeeded_at"] = succeeded_at

        stmt = (
            update(ComunifySubscriptionChargeModel)
            .where(
                ComunifySubscriptionChargeModel.id == charge_id,
                ComunifySubscriptionChargeModel.tenant_id == self._tenant_id,
            )
            .values(**values)
        )
        result = await self._session.execute(stmt)
        await self._session.flush()
        updated = result.rowcount > 0
        if updated:
            logger.info(
                "subscription_charge_status_updated",
                charge_id=str(charge_id),
                status=status,
                tenant_id=str(self._tenant_id),
            )
        return updated
