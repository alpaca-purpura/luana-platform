# cap: abel/icp-buyer  # noqa: ERA001
"""ICP Repository — ABC interface + SQLAlchemy 2.0 async implementation.

Architecture:
- IcpRepository: ABC interface (domain/infrastructure boundary)
- SqlAlchemyIcpRepository: async SQLA 2.0 implementation
- Every method takes tenant_id (RN-1 tenant isolation — raíz)
- SQLA 2.0: select(Model).where(...) — NUNCA session.query()
- Soft delete: filter deleted_at.is_(None) in all read queries
- RN-7 unique label: label_exists() case-insensitive (lower(label))

Cross-module: no imports de otros módulos brand. Solo domain + infra abel.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime, timezone
from decimal import Decimal
from typing import TYPE_CHECKING

import structlog
from sqlalchemy import func, select, update

from src.modules.nicolify.abel.domain.icp import Icp, IcpOrigin, IcpStatus
from src.modules.nicolify.abel.infrastructure.models.icp_model import IcpModel

if TYPE_CHECKING:
    from uuid import UUID

    from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger()


# ─────────────────────────────────────────────────────────────────────────────
# Abstract interface (domain boundary)
# ─────────────────────────────────────────────────────────────────────────────


class IcpRepository(ABC):
    """Abstract interface for ICP persistence.

    All methods take tenant_id (RN-1 — raíz tenant isolation).
    No method exposes data across tenant boundaries.
    """

    @abstractmethod
    async def create(self, tenant_id: UUID, icp: Icp) -> Icp:
        """Persist a new ICP and return the persisted entity."""
        ...

    @abstractmethod
    async def get_by_id(self, tenant_id: UUID, icp_id: UUID) -> Icp | None:
        """Get ICP by id, filtered by tenant_id. Returns None if not found or cross-tenant."""
        ...

    @abstractmethod
    async def list_by_tenant(self, tenant_id: UUID) -> list[Icp]:
        """List all active (non-deleted) ICPs for the tenant."""
        ...

    @abstractmethod
    async def update(self, tenant_id: UUID, icp_id: UUID, patch: dict) -> Icp | None:
        """Apply partial patch to ICP. Returns updated entity or None if not found."""
        ...

    @abstractmethod
    async def soft_delete(self, tenant_id: UUID, icp_id: UUID) -> bool:
        """Soft-delete ICP (set deleted_at). Returns True if deleted, False if not found."""
        ...

    @abstractmethod
    async def label_exists(self, tenant_id: UUID, label: str, exclude_id: UUID | None = None) -> bool:
        """Check if label exists for tenant (case-insensitive, excluding soft-deleted).

        exclude_id: skip this ICP id (for PATCH uniqueness check — same ICP allowed).
        """
        ...


# ─────────────────────────────────────────────────────────────────────────────
# SQLAlchemy 2.0 async implementation
# ─────────────────────────────────────────────────────────────────────────────


def _model_to_domain(m: IcpModel) -> Icp:
    """Map IcpModel → Icp domain entity."""
    return Icp(
        id=m.id,
        tenant_id=m.tenant_id,
        label=m.label,
        description=m.description,
        vertical=m.vertical,
        company_size=m.company_size,
        geo=m.geo,
        business_model=m.business_model,
        avg_ticket=Decimal(str(m.avg_ticket)) if m.avg_ticket is not None else None,
        avg_ticket_currency=m.avg_ticket_currency,
        sales_cycle=m.sales_cycle,
        main_pain=m.main_pain,
        sales_angle=m.sales_angle,
        signals=m.signals if m.signals is not None else [],
        anti_pattern=m.anti_pattern,
        status=IcpStatus(m.status),
        origin=IcpOrigin(m.origin),
        created_at=m.created_at,
        updated_at=m.updated_at,
        deleted_at=m.deleted_at,
    )


class SqlAlchemyIcpRepository(IcpRepository):
    """Async SQLAlchemy 2.0 implementation of IcpRepository.

    SQLA 2.0 patterns:
    - await session.execute(select(Model).where(...))
    - update() via scalar SQL for efficiency
    - NUNCA session.query() (legacy 1.x pattern forbidden)
    - All reads filter tenant_id + deleted_at.is_(None) (RN-1 + soft delete)
    """

    def __init__(self, session: AsyncSession) -> None:
        """Initialize IcpRepository with async database session."""
        self._session = session

    async def create(self, tenant_id: UUID, icp: Icp) -> Icp:
        """Persist new ICP."""
        model = IcpModel(
            id=icp.id,
            tenant_id=tenant_id,
            label=icp.label,
            description=icp.description,
            vertical=icp.vertical,
            company_size=icp.company_size,
            geo=icp.geo,
            business_model=icp.business_model,
            avg_ticket=icp.avg_ticket,
            avg_ticket_currency=icp.avg_ticket_currency,
            sales_cycle=icp.sales_cycle,
            main_pain=icp.main_pain,
            sales_angle=icp.sales_angle,
            signals=icp.signals,
            anti_pattern=icp.anti_pattern,
            status=icp.status.value,
            origin=icp.origin.value,
        )
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        logger.info("icp_created", icp_id=str(icp.id), tenant_id=str(tenant_id))
        return _model_to_domain(model)

    async def get_by_id(self, tenant_id: UUID, icp_id: UUID) -> Icp | None:
        """RN-1: returns None for cross-tenant or not found."""
        stmt = select(IcpModel).where(
            IcpModel.tenant_id == tenant_id,
            IcpModel.id == icp_id,
            IcpModel.deleted_at.is_(None),
        )
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        return _model_to_domain(model) if model else None

    async def list_by_tenant(self, tenant_id: UUID) -> list[Icp]:
        """List active ICPs for tenant."""
        stmt = select(IcpModel).where(
            IcpModel.tenant_id == tenant_id,
            IcpModel.deleted_at.is_(None),
        )
        result = await self._session.execute(stmt)
        return [_model_to_domain(m) for m in result.scalars().all()]

    async def update(self, tenant_id: UUID, icp_id: UUID, patch: dict) -> Icp | None:
        """Apply partial update. Returns None if not found/cross-tenant."""
        # Verify ownership first
        existing = await self.get_by_id(tenant_id, icp_id)
        if existing is None:
            return None

        # Add updated_at
        patch = {k: v for k, v in patch.items() if v is not None}
        patch["updated_at"] = datetime.now(timezone.utc)

        stmt = (
            update(IcpModel)
            .where(
                IcpModel.tenant_id == tenant_id,
                IcpModel.id == icp_id,
                IcpModel.deleted_at.is_(None),
            )
            .values(**patch)
        )
        await self._session.execute(stmt)
        await self._session.flush()
        return await self.get_by_id(tenant_id, icp_id)

    async def soft_delete(self, tenant_id: UUID, icp_id: UUID) -> bool:
        """Set deleted_at. Returns True if found and deleted."""
        existing = await self.get_by_id(tenant_id, icp_id)
        if existing is None:
            return False

        stmt = (
            update(IcpModel)
            .where(
                IcpModel.tenant_id == tenant_id,
                IcpModel.id == icp_id,
                IcpModel.deleted_at.is_(None),
            )
            .values(deleted_at=datetime.now(timezone.utc))
        )
        await self._session.execute(stmt)
        await self._session.flush()
        logger.info("icp_soft_deleted", icp_id=str(icp_id), tenant_id=str(tenant_id))
        return True

    async def label_exists(self, tenant_id: UUID, label: str, exclude_id: UUID | None = None) -> bool:
        """RN-7: case-insensitive label check, partial-index aware (soft-delete excluded)."""
        stmt = select(IcpModel.id).where(
            IcpModel.tenant_id == tenant_id,
            func.lower(IcpModel.label) == label.lower(),
            IcpModel.deleted_at.is_(None),
        )
        if exclude_id is not None:
            stmt = stmt.where(IcpModel.id != exclude_id)

        result = await self._session.execute(stmt)
        return result.scalar_one_or_none() is not None
