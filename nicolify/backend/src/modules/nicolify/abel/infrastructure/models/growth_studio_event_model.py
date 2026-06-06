# cap: abel/icp-buyer  # noqa: ERA001
"""SQLAlchemy 2.0 model for nicolify_growth_studio_event table.

Brand-local telemetry table (NOT engine copilot_trace_event).
See shell-feature-architecture.md: telemetría en nicolify_growth_studio_event (NO copilot_trace_event).

NF-sec-pii: props JSONB sin PII — montos bucketeados, ids hasheados, NO emails/phones/nombres.
account_id: nullable (algunos eventos son tenant-level sin cuenta específica).
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from luana_core_platform.domain.base_entity import Base
from sqlalchemy import DateTime, Index, String, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PgUUID  # noqa: N811
from sqlalchemy.orm import Mapped, mapped_column


class GrowthStudioEventModel(Base):
    """Telemetría brand-local nicolify — token economy + events.

    Props sin PII: montos en buckets (0-500, 500-2000, 2000+), ids hasheados,
    event_name slugs, sin emails/phones/nombres reales.
    """

    __tablename__ = "nicolify_growth_studio_event"

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    tenant_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False, index=True)  # RN-1 tenant isolation
    account_id: Mapped[UUID | None] = mapped_column(
        PgUUID(as_uuid=True), nullable=True
    )  # nullable — eventos tenant-level sin cuenta específica (ADR-nicolify-001 §8)
    user_id: Mapped[UUID | None] = mapped_column(PgUUID(as_uuid=True), nullable=True)
    event_name: Mapped[str] = mapped_column(
        String(80), nullable=False
    )  # slug: abel_icp_intake_started, abel_icp_draft_proposed, etc.
    props: Mapped[dict] = mapped_column(
        JSONB, nullable=False, default=dict, server_default=text("'{}'::jsonb")
    )  # NF-sec-pii: NO PII — montos bucketeados, ids hasheados
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("now()"))

    __table_args__ = (Index("ix_nicolify_gse_tenant", "tenant_id", "occurred_at"),)
