"""SQLAlchemy 2.0 ORM model — ComunifyCommunityPostModel.

Maps to `comunify_community_posts` table.
Tenant-scoped + soft-delete. Community post aggregate.
cohort_id=NULL means community-wide post.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from luana_core_platform.domain.base_entity import Base
from sqlalchemy import Boolean, DateTime, Float, Index, Integer
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func


class ComunifyCommunityPostModel(Base):
    """Community post aggregate.

    tenant_id NOT NULL + indexed (tenant isolation).
    cohort_id=NULL means community-wide post (not scoped to a cohort).
    deleted_at enables soft-delete.
    Moderation scores stored as NUMERIC(5,4) in the DB but Float in Python.
    """

    __tablename__ = "comunify_community_posts"

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False, index=True)
    author_member_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False)
    # null = community-wide post
    cohort_id: Mapped[UUID | None] = mapped_column(PgUUID(as_uuid=True), nullable=True)
    content: Mapped[str] = mapped_column(nullable=False)
    # pending_moderation | approved | rejected | removed_by_creator
    status: Mapped[str] = mapped_column(nullable=False, default="pending_moderation")
    spam_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    nsfw_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    doxxing_detected: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    moderation_result: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    likes_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    replies_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index(
            "ix_comunify_posts_tenant_status_created",
            "tenant_id",
            "status",
            "created_at",
        ),
        Index("ix_comunify_posts_tenant_author", "tenant_id", "author_member_id"),
    )
