"""SQLAlchemy 2.0 ORM model — ComunifyCohortBroadcastModel.

Maps to `comunify_cohort_broadcasts` table.
Tenant-scoped + soft-delete. Broadcast message metadata (content + audience).
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from luana_core_platform.domain.base_entity import Base
from sqlalchemy import DateTime, Index, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func


class ComunifyCohortBroadcastModel(Base):
    """Broadcast message metadata for a cohort.

    tenant_id NOT NULL + indexed (tenant isolation).
    deleted_at enables soft-delete.
    """

    __tablename__ = "comunify_cohort_broadcasts"

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False, index=True)
    cohort_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False)
    content: Mapped[str] = mapped_column(nullable=False)
    audience_filter: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sent_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    recipients_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # draft | sending | sent | failed
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="draft")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("ix_comunify_cohort_broadcasts_tenant_cohort", "tenant_id", "cohort_id"),
        Index("ix_comunify_cohort_broadcasts_tenant_status", "tenant_id", "status"),
    )
