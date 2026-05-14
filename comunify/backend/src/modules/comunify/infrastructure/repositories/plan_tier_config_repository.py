"""Async repository — ComunifyPlanTierConfigModel.

CROSS-TENANT global catalog — no tenant_id filter.

# arch-bypass: catalog table
Per 03-arch-be.md § 8.2:
  "PlanTierConfigRepository (cross-tenant catalog — NO tenant_id filter)"

This is a DELIBERATE exception to tenant-isolation.md. The plan tier catalog
is platform-wide data (free | creator_starter | creator_pro | creator_business)
shared across ALL tenants. There is NO per-tenant plan configuration.

Constructor does NOT receive tenant_id. Read-only for tenant services;
platform ops manages via migration seed data.
"""

from __future__ import annotations

import uuid

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.comunify.infrastructure.models.plan_tier_config_model import (
    ComunifyPlanTierConfigModel,
)

logger = structlog.get_logger()


class PlanTierConfigRepository:
    """Cross-tenant read-only repository for ComunifyPlanTierConfigModel.

    SPECIAL CASE: No tenant_id filter — this is a global catalog.
    Constructor has no tenant_id parameter (arch-bypass: catalog table).
    """

    def __init__(self, session: AsyncSession) -> None:
        """Note: No tenant_id parameter — cross-tenant catalog (arch-bypass: catalog table)."""
        self._session = session

    async def get_by_id(self, tier_id: uuid.UUID) -> ComunifyPlanTierConfigModel | None:
        """Return plan tier config by ID (cross-tenant, no tenant filter)."""
        stmt = select(ComunifyPlanTierConfigModel).where(
            ComunifyPlanTierConfigModel.id == tier_id,
            ComunifyPlanTierConfigModel.is_active.is_(True),
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_slug(self, plan_tier_slug: str) -> ComunifyPlanTierConfigModel | None:
        """Return plan tier by slug (e.g. 'free', 'creator_starter', 'creator_pro')."""
        stmt = select(ComunifyPlanTierConfigModel).where(
            ComunifyPlanTierConfigModel.plan_tier_slug == plan_tier_slug,
            ComunifyPlanTierConfigModel.is_active.is_(True),
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_active(self) -> list[ComunifyPlanTierConfigModel]:
        """List all active plan tier configurations, ordered by sort_order."""
        stmt = (
            select(ComunifyPlanTierConfigModel)
            .where(ComunifyPlanTierConfigModel.is_active.is_(True))
            .order_by(ComunifyPlanTierConfigModel.sort_order.asc())
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())
