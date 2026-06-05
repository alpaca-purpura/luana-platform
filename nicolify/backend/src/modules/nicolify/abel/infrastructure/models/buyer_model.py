# cap: abel/icp-buyer  # noqa: ERA001
"""SQLAlchemy 2.0 model for abel_buyers table.

Brand-local async replica de BuyerPersona engine.
Adds icp_id FK que el engine no tiene (account-level grouping B2B).

JSONB fields: mismos slugs que engine BuyerPersona (field-contract compatible).
Extensión B2B: preferred_channels (LinkedIn, email, WhatsApp, phone).

RN-6: is_primary ≤1 true per icp_id — enforced en BuyerService.set_primary.
No DB-level unique partial index for is_primary (optional — service is the gate).
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from luana_core_platform.domain.base_entity import Base
from sqlalchemy import Boolean, DateTime, Index, String, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PgUUID  # noqa: N811
from sqlalchemy.orm import Mapped, mapped_column


class BuyerModel(Base):
    """SQLAlchemy 2.0 model for abel_buyers table."""

    __tablename__ = "abel_buyers"

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True)
    tenant_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), nullable=False, index=True
    )  # RN-1 — raíz tenant isolation
    icp_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False, index=True)  # RN-5 FK → abel_icps.id
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[str | None] = mapped_column(String(160), nullable=True)
    decision_power: Mapped[str | None] = mapped_column(String(32), nullable=True)  # DecisionPower enum values
    is_primary: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=text("false")
    )  # RN-6 — ≤1 true per icp_id (enforced in BuyerService.set_primary)
    # JSONB fields — mismos slugs que engine BuyerPersona (consume-by-reference)
    demographics: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict, server_default=text("'{}'::jsonb"))
    psychographics: Mapped[dict] = mapped_column(
        JSONB, nullable=False, default=dict, server_default=text("'{}'::jsonb")
    )
    pain_points: Mapped[list] = mapped_column(JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb"))
    desires: Mapped[list] = mapped_column(JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb"))
    objections: Mapped[list] = mapped_column(JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb"))
    buyer_journey: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict, server_default=text("'{}'::jsonb"))
    purchase_triggers: Mapped[list] = mapped_column(
        JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb")
    )
    preferred_channels: Mapped[list] = mapped_column(
        JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb")
    )  # B2B extension: {channel, frequency, tone}
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("now()"))
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )  # soft delete — NUNCA hard delete

    __table_args__ = (Index("ix_abel_buyers_tenant_icp", "tenant_id", "icp_id"),)
