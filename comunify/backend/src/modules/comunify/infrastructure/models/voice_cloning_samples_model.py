"""SQLAlchemy 2.0 ORM model — ComunifyVoiceCloningSamplesModel.

Maps to `comunify_voice_cloning_samples` table.
Tenant-scoped. Aggregate upload state (1 row per tenant, UNIQUE tenant_id).
raw_samples_deleted_at tracks privacy deletion of raw upload files.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from luana_core_platform.domain.base_entity import Base
from sqlalchemy import DateTime, Integer
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func


class ComunifyVoiceCloningSamplesModel(Base):
    """Voice cloning aggregate upload state (singleton per tenant).

    tenant_id NOT NULL + UNIQUE — exactly one sample set per tenant.
    upload_history: list of {filename, type, count, uploaded_at} objects (JSONB).
    statistics_post_distill: {dialect, vocabulary_anchors, confidence} after distillation.
    raw_samples_deleted_at: set when raw files purged (privacy obligation).
    No deleted_at — singleton configuration record.
    """

    __tablename__ = "comunify_voice_cloning_samples"

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False, index=True, unique=True)
    chats_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    voice_notes_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # [{filename, type, count, uploaded_at}]
    upload_history: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    # {dialect, vocabulary_anchors, confidence} — populated after distillation completes
    statistics_post_distill: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    # set when raw upload files purged for privacy
    raw_samples_deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_distillation_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    # No deleted_at — singleton configuration record
