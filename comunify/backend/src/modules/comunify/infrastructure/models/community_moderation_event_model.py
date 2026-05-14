"""SQLAlchemy 2.0 ORM model — ComunifyCommunityModerationEventModel.

Maps to `comunify_community_moderation_events` table.
Tenant-scoped. Classifier history per post. No deleted_at (audit trail, immutable).
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from luana_core_platform.domain.base_entity import Base
from sqlalchemy import DateTime, Index, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func


class ComunifyCommunityModerationEventModel(Base):
    """Moderation classifier event history per post.

    Append-only audit trail of each moderation decision for a post.
    tenant_id NOT NULL + indexed (tenant isolation).
    No deleted_at — immutable audit trail.
    """

    __tablename__ = "comunify_community_moderation_events"

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False, index=True)
    post_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False)
    classifier_version: Mapped[str] = mapped_column(String(32), nullable=False)
    # {spam_score, nsfw_score, doxxing_detected, confidence}
    scores: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    # approve | reject | flag_review | remove
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    actor_id: Mapped[UUID | None] = mapped_column(PgUUID(as_uuid=True), nullable=True)
    # creator | sales_agent | moderator | system
    actor_type: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    # No deleted_at — immutable audit trail

    __table_args__ = (Index("ix_comunify_moderation_events_post_id", "post_id"),)
