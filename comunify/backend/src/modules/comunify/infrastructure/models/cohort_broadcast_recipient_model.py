"""SQLAlchemy 2.0 ORM model — ComunifyCohortBroadcastRecipientModel.

Maps to `comunify_cohort_broadcast_recipients` table.
Tenant-scoped. Per-recipient delivery tracking. No deleted_at (delivery audit record).
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from luana_core_platform.domain.base_entity import Base
from sqlalchemy import DateTime, Index, String
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func


class ComunifyCohortBroadcastRecipientModel(Base):
    """Per-recipient delivery tracking record.

    tenant_id NOT NULL + indexed (tenant isolation).
    No deleted_at — delivery record is immutable (audit trail).
    """

    __tablename__ = "comunify_cohort_broadcast_recipients"

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False, index=True)
    broadcast_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False)
    member_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False)
    # whatsapp | instagram_dm | sms | email
    channel: Mapped[str] = mapped_column(String(32), nullable=False)
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    opened_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    replied_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    # No deleted_at — delivery record (audit trail)

    __table_args__ = (
        Index("ix_comunify_broadcast_recipients_broadcast", "broadcast_id"),
        Index("ix_comunify_broadcast_recipients_member", "member_id"),
    )
