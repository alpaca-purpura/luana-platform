"""SQLAlchemy 2.0 ORM model — ComunifyCohortMemberModel.

Maps to `comunify_cohort_members` table.
Tenant-scoped + soft-delete. Per-subscriber enrollment within a cohort.
UNIQUE (tenant_id, cohort_id, subscriber_id) prevents double enrollments.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from luana_core_platform.domain.base_entity import Base
from sqlalchemy import DateTime, Index, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func


class ComunifyCohortMemberModel(Base):
    """Per-subscriber enrollment within a cohort.

    tenant_id NOT NULL + indexed (tenant isolation).
    UNIQUE (tenant_id, cohort_id, subscriber_id) — no double enrollments.
    deleted_at enables soft-delete.
    """

    __tablename__ = "comunify_cohort_members"

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False, index=True)
    cohort_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False)
    subscriber_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False)
    # regular | premium
    tier: Mapped[str] = mapped_column(String(32), nullable=False, default="regular")
    # active | suspended | dropped | waitlisted
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    # 0-100 engagement score
    engagement_score: Mapped[int] = mapped_column(Integer, nullable=False, default=50)
    last_active_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    enrollment_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    waitlist_position: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # decrements per approved post once member exits pre-moderation window
    pre_moderation_count: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("ix_comunify_cohort_members_tenant_cohort", "tenant_id", "cohort_id"),
        Index("ix_comunify_cohort_members_subscriber", "subscriber_id"),
        UniqueConstraint("tenant_id", "cohort_id", "subscriber_id", name="uq_cohort_member"),
    )
