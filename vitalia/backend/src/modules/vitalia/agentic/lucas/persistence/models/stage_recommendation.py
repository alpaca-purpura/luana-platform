# cap: agentic.lucas-recommendation-tool
# story-origin: TBD
"""SQLAlchemy 2.0 ORM model — LucasStageRecommendationModel.

Maps to ``vitalia_lucas_recommendations`` table (created in
009_vitalia_lucas_recommendations.py). Provides the SA 2.0 ORM surface
for the LucasStageRecommendationService + LucasStageRecommendationRepository.

Dual filter ``tenant_id`` + ``clinic_id`` mandatory on all queries.
Soft-delete only (set deleted_at, never hard-delete).

Column shapes mirror the migration DDL exactly.
Status lifecycle: 'open' → 'approved' | 'rejected' | 'expired' | 'undone'.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from luana_core_platform.domain.base_entity import Base
from sqlalchemy import DateTime, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column


class LucasStageRecommendationModel(Base):
    """ORM mapping for ``vitalia_lucas_recommendations``.

    Queries MUST filter both tenant_id AND clinic_id per HIPAA-lite
    dual filter rule (vitalia/.claude/rules/hipaa-lite.md § Tenant isolation).
    """

    __tablename__ = "vitalia_lucas_recommendations"

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False)
    clinic_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False)
    stage: Mapped[str] = mapped_column(String(32), nullable=False)
    recommendation_kind: Mapped[str] = mapped_column(String(64), nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    rationale_json: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    priority: Mapped[int] = mapped_column(Integer, nullable=False, default=50)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="open")
    approved_by_user_id: Mapped[UUID | None] = mapped_column(PgUUID(as_uuid=True), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    undo_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index(
            "ix_vitalia_lucas_recommendations_stage_status",
            "tenant_id",
            "clinic_id",
            "stage",
            "status",
            "priority",
        ),
        Index(
            "ix_vitalia_lucas_recommendations_expires",
            "tenant_id",
            "clinic_id",
            "expires_at",
        ),
    )

    def __repr__(self) -> str:
        """Return debug-friendly representation."""
        return f"<LucasStageRecommendationModel id={self.id} stage={self.stage} status={self.status}>"
