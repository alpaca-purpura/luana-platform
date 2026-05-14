"""SQLAlchemy 2.0 ORM model — ComunifyCommunityPostAttachmentModel.

Maps to `comunify_community_post_attachments` table.
Tenant-scoped. Image/video asset metadata per post. No deleted_at (asset record).
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from luana_core_platform.domain.base_entity import Base
from sqlalchemy import DateTime, Float, Index, Integer, String
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func


class ComunifyCommunityPostAttachmentModel(Base):
    """Image/video asset metadata per community post.

    tenant_id NOT NULL + indexed (tenant isolation).
    No deleted_at — asset record (CDN deletion handled separately).
    """

    __tablename__ = "comunify_community_post_attachments"

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False, index=True)
    post_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False)
    url: Mapped[str] = mapped_column(nullable=False)
    # e.g. "image/jpeg", "video/mp4"
    mime_type: Mapped[str] = mapped_column(String(64), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    nsfw_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    # No deleted_at — asset record

    __table_args__ = (Index("ix_comunify_post_attachments_post_id", "post_id"),)
