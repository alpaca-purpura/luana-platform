"""SQLAlchemy 2.0 ORM model — ComunifySubscriptionModel.

Maps to `comunify_subscriptions` table.
Tenant-scoped + soft-delete. Recurring subscription aggregate root.
Handles both cohort_installments and monthly_membership plan kinds.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from luana_core_platform.domain.base_entity import Base
from sqlalchemy import DateTime, Index, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func


class ComunifySubscriptionModel(Base):
    """Recurring subscription aggregate root.

    Handles both plan_kind values:
    - cohort_installments: fixed N-month payment plan for cohort access
    - monthly_membership: ongoing monthly membership

    tenant_id NOT NULL + indexed (tenant isolation).
    deleted_at enables soft-delete (cancellation = status change, not delete).
    """

    __tablename__ = "comunify_subscriptions"

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False, index=True)
    subscriber_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False)
    offer_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False)
    # cohort_installments | monthly_membership
    plan_kind: Mapped[str] = mapped_column(String(32), nullable=False)
    # active | past_due | suspended | cancelled | cancelled_pending_end_of_period
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    # dunning state machine: null | retry_1 | retry_2 | retry_3 | suspended
    dunning_state: Mapped[str | None] = mapped_column(String(32), nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    next_charge_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    access_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancellation_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancellation_reason: Mapped[str | None] = mapped_column(String(512), nullable=True)
    installments_total: Mapped[int | None] = mapped_column(Integer, nullable=True)
    installments_completed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    monthly_amount: Mapped[Decimal | None] = mapped_column(Numeric(precision=14, scale=2), nullable=True)
    # ISO 4217 currency code
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    # mercadopago | stripe_connect | tokenized_recurring
    gateway: Mapped[str] = mapped_column(String(32), nullable=False)
    gateway_customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    payment_method_token: Mapped[str | None] = mapped_column(String(512), nullable=True)
    idempotency_key: Mapped[str | None] = mapped_column(String(128), nullable=True, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("ix_comunify_subs_tenant_status", "tenant_id", "status"),
        Index("ix_comunify_subs_tenant_next_charge", "tenant_id", "next_charge_at"),
        Index("ix_comunify_subs_subscriber", "subscriber_id"),
    )
