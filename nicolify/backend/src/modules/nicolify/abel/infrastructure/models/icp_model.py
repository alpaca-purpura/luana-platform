# cap: abel/icp-buyer  # noqa: ERA001
"""SQLAlchemy 2.0 model for abel_icps table.

SQLA 2.0 patterns (OBLIGATORIO):
- mapped_column() + Mapped[] type annotations (NUNCA Column())
- DateTime(timezone=True) OBLIGATORIO (no naive datetimes)
- JSONB for signals (PostgreSQL · monkeypatched to Text in tests via conftest)
- Soft delete: deleted_at Mapped[datetime | None]
- No sa.Enum (broken in SA 2.0.27) — status/origin stored as VARCHAR

Migration: 002_abel_icp_buyer.py (raw SQL IF NOT EXISTS — idempotente).
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from luana_core_platform.domain.base_entity import Base
from sqlalchemy import DateTime, Index, Numeric, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PgUUID  # noqa: N811
from sqlalchemy.orm import Mapped, mapped_column


class IcpModel(Base):
    """SQLAlchemy 2.0 model for abel_icps table.

    Tabla brand-local nicolify. Lift candidate a core post-merge (N≥2 B2B brands).
    """

    __tablename__ = "abel_icps"

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True)
    tenant_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), nullable=False, index=True
    )  # RN-1 — raíz tenant isolation
    label: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    vertical: Mapped[str | None] = mapped_column(String(120), nullable=True)
    company_size: Mapped[str | None] = mapped_column(String(120), nullable=True)
    geo: Mapped[str | None] = mapped_column(String(160), nullable=True)
    business_model: Mapped[str | None] = mapped_column(String(200), nullable=True)
    avg_ticket: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    avg_ticket_currency: Mapped[str | None] = mapped_column(String(3), nullable=True)  # RN-11 — preservar sin convertir
    sales_cycle: Mapped[str | None] = mapped_column(String(120), nullable=True)
    main_pain: Mapped[str | None] = mapped_column(Text, nullable=True)  # consumer: brenda + christian
    sales_angle: Mapped[str | None] = mapped_column(Text, nullable=True)  # consumer: brenda + christian
    signals: Mapped[list] = mapped_column(
        JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb")
    )  # consumer: christian
    anti_pattern: Mapped[str | None] = mapped_column(Text, nullable=True)  # consumer: christian
    status: Mapped[str] = mapped_column(
        String(16), nullable=False, server_default=text("'borrador'")
    )  # IcpStatus enum values: borrador | listo
    origin: Mapped[str] = mapped_column(
        String(16), nullable=False, server_default=text("'manual'")
    )  # IcpOrigin enum values: manual | draft
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("now()"))
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )  # soft delete — NUNCA hard delete

    __table_args__ = (
        Index("ix_abel_icps_tenant", "tenant_id"),
        # RN-7: unique label per tenant (case-insensitive, partial WHERE deleted_at IS NULL)
        # Note: partial unique index created in raw SQL migration (can't express in SA table_args)
    )
