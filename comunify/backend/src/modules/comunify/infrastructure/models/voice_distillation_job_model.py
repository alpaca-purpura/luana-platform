"""SQLAlchemy 2.0 ORM model — ComunifyVoiceDistillationJobModel.

Maps to `comunify_voice_distillation_jobs` table.
Tenant-scoped. Async distillation job tracking. No deleted_at (job audit trail).
cost_usd tracked for billing + budget guard integration.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from luana_core_platform.domain.base_entity import Base
from sqlalchemy import DateTime, Float, Index, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func


class ComunifyVoiceDistillationJobModel(Base):
    """Async voice distillation job tracking.

    tenant_id NOT NULL + indexed (tenant isolation).
    No deleted_at — job audit trail (immutable record).
    status transitions: queued → running_wave_1 → running_wave_2 → running_wave_3
                        → completed | failed
    compiled_blocks: {identidad, dialecto, vocabulario, registro, asíNO, anclajes}
    """

    __tablename__ = "comunify_voice_distillation_jobs"

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False, index=True)
    # queued | running_wave_1 | running_wave_2 | running_wave_3 | completed | failed
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="queued")
    samples_count: Mapped[int] = mapped_column(Integer, nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # 0.0 - 1.0 confidence score from distillation
    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    # {identidad, dialecto, vocabulario, registro, asíNO, anclajes}
    compiled_blocks: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    error_reason: Mapped[str | None] = mapped_column(String(512), nullable=True)
    # LLM cost in USD for budget guard integration
    cost_usd: Mapped[Decimal | None] = mapped_column(Numeric(precision=8, scale=4), nullable=True)
    # set when creator ratifies compiled voice → triggers Slot 5 cache invalidation
    ratified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    # No deleted_at — job audit trail

    __table_args__ = (Index("ix_comunify_voice_jobs_tenant_status", "tenant_id", "status"),)
