"""SQLAlchemy 2.0 ORM model — ComunifyLeadQualificationRecordModel.

Maps to `comunify_lead_qualification_records` table.
Tenant-scoped. Qualify-for-cohort snapshot. No deleted_at (snapshot record).
lead_data JSONB preserves intake form state at qualification time.
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


class ComunifyLeadQualificationRecordModel(Base):
    """Lead qualification snapshot for cohort admission.

    Immutable snapshot — no deleted_at. Records qualify decision at a point in time.
    fit_score drives recommended_tier and agent follow-up strategy.
    lead_data JSONB is the intake form payload at qualification time (PII risk — redact before exposure).
    tenant_id NOT NULL + indexed (tenant isolation).
    """

    __tablename__ = "comunify_lead_qualification_records"

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False, index=True)
    lead_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False)
    cohort_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False)
    # qualified | waitlisted | not_qualified
    fit: Mapped[str] = mapped_column(String(32), nullable=False)
    # regular | premium
    recommended_tier: Mapped[str] = mapped_column(String(32), nullable=False, default="regular")
    # 0-100 fit score from qualification criteria evaluation
    fit_score: Mapped[int] = mapped_column(Integer, nullable=False)
    # intake form data at qualification time (PII — redact before exposure)
    lead_data: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    # No deleted_at — snapshot record (immutable)

    __table_args__ = (
        Index("ix_comunify_lead_qual_tenant_cohort", "tenant_id", "cohort_id"),
        Index("ix_comunify_lead_qual_lead_id", "lead_id"),
    )
