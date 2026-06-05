# cap: abel/icp-buyer  # noqa: ERA001
"""Buyer Repository — ABC interface + SQLAlchemy 2.0 async implementation.

Architecture:
- BuyerRepository: ABC interface
- SqlAlchemyBuyerRepository: async SQLA 2.0 implementation
- Every method takes tenant_id (RN-1)
- list_by_icp: filters both tenant_id AND icp_id
- clear_primary: demotes all primary buyers in icp_id (RN-6 one-transaction)
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import TYPE_CHECKING

import structlog
from sqlalchemy import select, update

from src.modules.nicolify.abel.domain.buyer import Buyer, DecisionPower
from src.modules.nicolify.abel.infrastructure.models.buyer_model import BuyerModel

if TYPE_CHECKING:
    from uuid import UUID

    from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger()


# ─────────────────────────────────────────────────────────────────────────────
# Abstract interface (domain boundary)
# ─────────────────────────────────────────────────────────────────────────────


class BuyerRepository(ABC):
    """Abstract interface for Buyer persistence.

    All methods take tenant_id (RN-1 — raíz tenant isolation).
    list_by_icp additionally scopes by icp_id (RN-5).
    """

    @abstractmethod
    async def create(self, tenant_id: UUID, buyer: Buyer) -> Buyer:
        """Persist a new Buyer."""
        ...

    @abstractmethod
    async def get_by_id(self, tenant_id: UUID, buyer_id: UUID) -> Buyer | None:
        """Get Buyer by id, filtered by tenant_id. Returns None if not found or cross-tenant."""
        ...

    @abstractmethod
    async def list_by_icp(self, tenant_id: UUID, icp_id: UUID) -> list[Buyer]:
        """List active buyers for an ICP (scoped tenant_id ∧ icp_id)."""
        ...

    @abstractmethod
    async def update(self, tenant_id: UUID, buyer_id: UUID, patch: dict) -> Buyer | None:
        """Apply partial patch to Buyer. Returns updated entity or None."""
        ...

    @abstractmethod
    async def soft_delete(self, tenant_id: UUID, buyer_id: UUID) -> bool:
        """Soft-delete Buyer. Returns True if deleted, False if not found."""
        ...

    @abstractmethod
    async def clear_primary(self, tenant_id: UUID, icp_id: UUID) -> None:
        """RN-6: Set is_primary=False for all buyers in icp_id (one transaction).

        Called by BuyerService.set_primary before promoting the new primary.
        """
        ...


# ─────────────────────────────────────────────────────────────────────────────
# SQLAlchemy 2.0 async implementation
# ─────────────────────────────────────────────────────────────────────────────


def _model_to_domain(m: BuyerModel) -> Buyer:
    """Map BuyerModel → Buyer domain entity."""
    return Buyer(
        id=m.id,
        tenant_id=m.tenant_id,
        icp_id=m.icp_id,
        name=m.name,
        role=m.role,
        decision_power=DecisionPower(m.decision_power) if m.decision_power else None,
        is_primary=m.is_primary,
        demographics=m.demographics or {},
        psychographics=m.psychographics or {},
        pain_points=m.pain_points or [],
        desires=m.desires or [],
        objections=m.objections or [],
        buyer_journey=m.buyer_journey or {},
        purchase_triggers=m.purchase_triggers or [],
        preferred_channels=m.preferred_channels or [],
        created_at=m.created_at,
        updated_at=m.updated_at,
        deleted_at=m.deleted_at,
    )


class SqlAlchemyBuyerRepository(BuyerRepository):
    """Async SQLAlchemy 2.0 implementation of BuyerRepository."""

    def __init__(self, session: AsyncSession) -> None:
        """Initialize BuyerRepository with database session."""
        self._session = session

    async def create(self, tenant_id: UUID, buyer: Buyer) -> Buyer:
        """Persist new Buyer."""
        model = BuyerModel(
            id=buyer.id,
            tenant_id=tenant_id,
            icp_id=buyer.icp_id,
            name=buyer.name,
            role=buyer.role,
            decision_power=buyer.decision_power.value if buyer.decision_power else None,
            is_primary=buyer.is_primary,
            demographics=buyer.demographics,
            psychographics=buyer.psychographics,
            pain_points=buyer.pain_points,
            desires=buyer.desires,
            objections=buyer.objections,
            buyer_journey=buyer.buyer_journey,
            purchase_triggers=buyer.purchase_triggers,
            preferred_channels=buyer.preferred_channels,
        )
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        logger.info(
            "buyer_created",
            buyer_id=str(buyer.id),
            icp_id=str(buyer.icp_id),
            tenant_id=str(tenant_id),
        )
        return _model_to_domain(model)

    async def get_by_id(self, tenant_id: UUID, buyer_id: UUID) -> Buyer | None:
        """RN-1: returns None for cross-tenant or not found."""
        stmt = select(BuyerModel).where(
            BuyerModel.tenant_id == tenant_id,
            BuyerModel.id == buyer_id,
            BuyerModel.deleted_at.is_(None),
        )
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        return _model_to_domain(model) if model else None

    async def list_by_icp(self, tenant_id: UUID, icp_id: UUID) -> list[Buyer]:
        """RN-5: list buyers scoped by tenant_id ∧ icp_id."""
        stmt = select(BuyerModel).where(
            BuyerModel.tenant_id == tenant_id,
            BuyerModel.icp_id == icp_id,
            BuyerModel.deleted_at.is_(None),
        )
        result = await self._session.execute(stmt)
        return [_model_to_domain(m) for m in result.scalars().all()]

    async def update(self, tenant_id: UUID, buyer_id: UUID, patch: dict) -> Buyer | None:
        """Apply partial update to Buyer."""
        existing = await self.get_by_id(tenant_id, buyer_id)
        if existing is None:
            return None

        patch = {k: v for k, v in patch.items() if v is not None}
        patch["updated_at"] = datetime.now(timezone.utc)

        stmt = (
            update(BuyerModel)
            .where(
                BuyerModel.tenant_id == tenant_id,
                BuyerModel.id == buyer_id,
                BuyerModel.deleted_at.is_(None),
            )
            .values(**patch)
        )
        await self._session.execute(stmt)
        await self._session.flush()
        return await self.get_by_id(tenant_id, buyer_id)

    async def soft_delete(self, tenant_id: UUID, buyer_id: UUID) -> bool:
        """Set deleted_at for Buyer."""
        existing = await self.get_by_id(tenant_id, buyer_id)
        if existing is None:
            return False

        stmt = (
            update(BuyerModel)
            .where(
                BuyerModel.tenant_id == tenant_id,
                BuyerModel.id == buyer_id,
                BuyerModel.deleted_at.is_(None),
            )
            .values(deleted_at=datetime.now(timezone.utc))
        )
        await self._session.execute(stmt)
        await self._session.flush()
        logger.info("buyer_soft_deleted", buyer_id=str(buyer_id), tenant_id=str(tenant_id))
        return True

    async def clear_primary(self, tenant_id: UUID, icp_id: UUID) -> None:
        """RN-6: Demote all primary buyers in icp_id to is_primary=False (one transaction)."""
        stmt = (
            update(BuyerModel)
            .where(
                BuyerModel.tenant_id == tenant_id,
                BuyerModel.icp_id == icp_id,
                BuyerModel.is_primary.is_(True),
                BuyerModel.deleted_at.is_(None),
            )
            .values(is_primary=False)
        )
        await self._session.execute(stmt)
        await self._session.flush()
        logger.info("buyer_primary_cleared", icp_id=str(icp_id), tenant_id=str(tenant_id))
