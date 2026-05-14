"""SQLAlchemy 2.0 ORM model — ComunifyPlanTierConfigModel.

Maps to `comunify_plan_tier_configs` table.
CROSS-TENANT global catalog — NO tenant_id, NO deleted_at.
Managed by platform ops; read-only for tenant services.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from luana_core_platform.domain.base_entity import Base
from sqlalchemy import Boolean, DateTime, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func


class ComunifyPlanTierConfigModel(Base):
    """Global plan tier catalog.

    Cross-tenant — one row per pricing tier.
    plan_tier_slug values: free | creator_starter | creator_pro | creator_business
    features_enabled: JSONB list of enabled capability slugs.
    No tenant_id (global platform data). No deleted_at (use is_active=False to deactivate).
    """

    __tablename__ = "comunify_plan_tier_configs"

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    # No tenant_id — CROSS-TENANT global catalog
    # free | creator_starter | creator_pro | creator_business
    plan_tier_slug: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    display_name_es: Mapped[str] = mapped_column(String(128), nullable=False)
    # list of enabled capability slug strings
    features_enabled: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    price_usd_monthly: Mapped[Decimal] = mapped_column(Numeric(precision=12, scale=2), nullable=False)
    # ISO 4217 — typically USD for global catalog
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    # No deleted_at — use is_active=False to deactivate
