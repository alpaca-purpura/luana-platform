"""SQLAlchemy 2.0 ORM model — ComunifyAuthorityVaultItemModel.

Maps to `comunify_authority_vault_items` table.
Tenant-scoped + soft-delete. Polymorphic kind column with JSONB content.
Kinds: credentials | case_studies | press_mentions | awards.
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


class ComunifyAuthorityVaultItemModel(Base):
    """Authority vault item — polymorphic single-table inheritance.

    kind values: credentials | case_studies | press_mentions | awards
    content: JSONB shape varies per kind (fields defined in domain layer).
    tenant_id NOT NULL + indexed (tenant isolation).
    deleted_at enables soft-delete.
    """

    __tablename__ = "comunify_authority_vault_items"

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False, index=True)
    # credentials | case_studies | press_mentions | awards
    kind: Mapped[str] = mapped_column(String(32), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    # JSONB content shape varies per kind
    content: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    url: Mapped[str | None] = mapped_column(nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (Index("ix_comunify_authority_vault_tenant_kind", "tenant_id", "kind"),)
