"""SQLAlchemy 2.0 ORM model — ComunifyCohortModel.

Maps to `comunify_cohorts` table (created in 001_comunify_initial_snapshot.py).
Tenant-scoped + soft-delete. Aggregate root for cohort lifecycle.
Columns mirror T-be-1 migration DDL exactly.
"""

from __future__ import annotations

from datetime import date, datetime
from uuid import UUID, uuid4

from luana_core_platform.domain.base_entity import Base
from sqlalchemy import Date, DateTime, Index, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func


class ComunifyCohortModel(Base):
    """Cohort aggregate root.

    Lifecycle: draft → enrollment_open → enrollment_closed → active → completed → archived.
    tenant_id is NOT NULL + indexed (tenant isolation).
    deleted_at enables soft-delete (hard deletes forbidden per backend-ddd.md).
    """

    __tablename__ = "comunify_cohorts"

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(80), nullable=False)
    offer_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False)
    capacity_max: Mapped[int] = mapped_column(Integer, nullable=False)
    capacity_filled: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    capacity_waitlist: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    # draft | enrollment_open | enrollment_closed | active | completed | archived
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="draft")
    enrollment_criteria: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("ix_comunify_cohorts_tenant_status", "tenant_id", "status"),
        UniqueConstraint("tenant_id", "slug", name="ix_comunify_cohorts_tenant_slug"),
    )
