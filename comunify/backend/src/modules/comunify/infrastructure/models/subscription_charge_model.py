"""SQLAlchemy 2.0 ORM model — ComunifySubscriptionChargeModel.

Maps to `comunify_subscription_charges` table.
Tenant-scoped. Per-charge financial record. No deleted_at (financial record).
UNIQUE (subscription_id, billing_period, installment_n) prevents duplicate charges.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from luana_core_platform.domain.base_entity import Base
from sqlalchemy import DateTime, Index, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func


class ComunifySubscriptionChargeModel(Base):
    """Per-charge financial record.

    Immutable financial record — no deleted_at, no soft-delete.
    UNIQUE (subscription_id, billing_period, installment_n) prevents duplicate charges
    (idempotency at the financial record level).
    tenant_id NOT NULL + indexed (tenant isolation).
    """

    __tablename__ = "comunify_subscription_charges"

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False, index=True)
    subscription_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False, index=True)
    # null for monthly_membership; 1-based for cohort_installments
    installment_n: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # "YYYY-MM" billing period identifier
    billing_period: Mapped[str] = mapped_column(String(7), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(precision=14, scale=2), nullable=False)
    # ISO 4217 currency code
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    # succeeded | failed | pending | refunded
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    gateway_charge_id: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True)
    failure_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    attempted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    succeeded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    idempotency_key: Mapped[str | None] = mapped_column(String(128), nullable=True, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    # No deleted_at — financial record

    __table_args__ = (
        Index(
            "ix_comunify_charges_tenant_status_attempted",
            "tenant_id",
            "status",
            "attempted_at",
        ),
        UniqueConstraint(
            "subscription_id",
            "billing_period",
            "installment_n",
            name="uq_charge_period_installment",
        ),
    )
