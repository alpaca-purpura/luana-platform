"""SQLAlchemy 2.0 ORM model — ComunifyCommunityAuditLogModel.

Maps to `comunify_community_audit_log` table.
Tenant-scoped. Compliance + security event log. IMMUTABLE — NO deleted_at.
5-year retention. PII sanitized in payload_redacted.
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


class ComunifyCommunityAuditLogModel(Base):
    """Community compliance audit log — IMMUTABLE.

    Append-only event log for security and compliance. Records moderation decisions,
    spam/NSFW/doxxing blocks, cross-tenant access attempts, and actor actions.
    No deleted_at — 5-year retention enforced via separate purge job.

    event_type examples: spam_blocked | nsfw_blocked | doxxing_blocked |
                         cross_tenant_attempt | post_removed | member_suspended

    tenant_id NOT NULL + indexed (tenant isolation).
    """

    __tablename__ = "comunify_community_audit_log"

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    # info | medium | high
    severity: Mapped[str] = mapped_column(String(16), nullable=False)
    member_id: Mapped[UUID | None] = mapped_column(PgUUID(as_uuid=True), nullable=True)
    post_id: Mapped[UUID | None] = mapped_column(PgUUID(as_uuid=True), nullable=True)
    # doxxing victim (when applicable)
    target_member_id: Mapped[UUID | None] = mapped_column(PgUUID(as_uuid=True), nullable=True)
    # PII-sanitized payload
    payload_redacted: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    actor_id: Mapped[UUID | None] = mapped_column(PgUUID(as_uuid=True), nullable=True)
    # creator | sales_agent | moderator | system
    actor_type: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True, server_default=func.now()
    )
    # NO deleted_at — audit log is immutable, 5-year retention via separate purge job

    __table_args__ = (
        Index(
            "ix_comunify_audit_tenant_event_created",
            "tenant_id",
            "event_type",
            "created_at",
        ),
        Index(
            "ix_comunify_audit_tenant_severity_created",
            "tenant_id",
            "severity",
            "created_at",
        ),
    )
