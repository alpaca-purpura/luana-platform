"""SQLAlchemy 2.0 ORM model — ComunifyOfferLadderModel.

Maps to `comunify_offer_ladders` table.
Tenant-scoped. 4-level offer ladder per tenant (1 row per tenant, UNIQUE tenant_id).
No deleted_at — singleton configuration record.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from luana_core_platform.domain.base_entity import Base
from sqlalchemy import Boolean, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func


class ComunifyOfferLadderModel(Base):
    """4-level offer ladder per tenant (singleton per tenant).

    tenant_id NOT NULL + UNIQUE — exactly one ladder row per tenant.
    No deleted_at — configuration record (use completeness_score to track gaps).

    Levels:
    - level_1: lead_magnet (free opt-in)
    - level_2: tripwire (low cost entry)
    - level_3: core offer (main revenue)
    - level_4: premium (high-ticket ascension)
    """

    __tablename__ = "comunify_offer_ladders"

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False, index=True, unique=True)
    level_1_offer_id: Mapped[UUID | None] = mapped_column(PgUUID(as_uuid=True), nullable=True)
    level_2_offer_id: Mapped[UUID | None] = mapped_column(PgUUID(as_uuid=True), nullable=True)
    level_3_offer_id: Mapped[UUID | None] = mapped_column(PgUUID(as_uuid=True), nullable=True)
    level_4_offer_id: Mapped[UUID | None] = mapped_column(PgUUID(as_uuid=True), nullable=True)
    gap_acknowledged: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    # 0-100 completeness score (number of levels filled × 25)
    completeness_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    # No deleted_at — singleton configuration record
