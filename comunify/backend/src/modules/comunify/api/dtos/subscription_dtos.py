"""Subscription API DTOs — Pydantic v2.

Per 03-arch-be.md § 7 + § 6.7 + Tessl pii-sanitisation.md.
Monetary fields include currency per currency-handling.md.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


# ── Subscription list + detail ────────────────────────────────────────────────


class SubscriptionListItem(BaseModel):
    """Single subscription list item."""

    model_config = ConfigDict(from_attributes=True)

    subscription_id: uuid.UUID
    subscriber_id: uuid.UUID
    offer_id: uuid.UUID
    plan_kind: str
    status: str
    dunning_state: str | None = None
    monthly_amount: Decimal | None = None
    currency: str | None = None  # per currency-handling.md
    started_at: datetime
    next_charge_at: datetime | None = None


class SubscriptionListResponse(BaseModel):
    """GET /subscriptions — paginated subscription list."""

    model_config = ConfigDict(from_attributes=True)

    items: list[SubscriptionListItem]
    total: int
    page: int = 1
    page_size: int = 20


class SubscriptionChargeItem(BaseModel):
    """Single charge history item."""

    model_config = ConfigDict(from_attributes=True)

    charge_id: uuid.UUID
    billing_period: str
    amount: Decimal
    currency: str | None = None  # per currency-handling.md
    status: str
    attempted_at: datetime
    succeeded_at: datetime | None = None
    failure_reason: str | None = None


class SubscriptionDetailResponse(BaseModel):
    """GET /subscriptions/{id} — subscription detail + payment history."""

    model_config = ConfigDict(from_attributes=True)

    subscription_id: uuid.UUID
    subscriber_id: uuid.UUID
    offer_id: uuid.UUID
    plan_kind: str
    status: str
    dunning_state: str | None = None
    started_at: datetime
    next_charge_at: datetime | None = None
    access_until: datetime | None = None
    cancellation_at: datetime | None = None
    cancellation_reason: str | None = None
    monthly_amount: Decimal | None = None
    currency: str | None = None  # per currency-handling.md
    gateway: str
    installments_total: int | None = None
    installments_completed: int = 0
    charges: list[SubscriptionChargeItem] = Field(default_factory=list)


# ── Cancel ────────────────────────────────────────────────────────────────────


class CancelSubscriptionRequest(BaseModel):
    """POST /subscriptions/{id}/cancel — cancel subscription."""

    model_config = ConfigDict(from_attributes=True, extra="forbid")

    end_of_period: bool = Field(
        default=True,
        description="True = cancel at end of billing period; False = immediate cancellation",
    )
    reason: str | None = Field(None, max_length=512)


class CancelSubscriptionResponse(BaseModel):
    """POST /subscriptions/{id}/cancel — cancel result."""

    model_config = ConfigDict(from_attributes=True)

    subscription_id: uuid.UUID
    status: str
    cancellation_at: datetime | None = None
    access_until: datetime | None = None


# ── Resend payment link ───────────────────────────────────────────────────────


class ResendPaymentLinkResponse(BaseModel):
    """POST /subscriptions/{id}/resend-payment-link — result."""

    model_config = ConfigDict(from_attributes=True)

    subscription_id: uuid.UUID
    payment_link: str
    sent_at: datetime


# ── Metrics ───────────────────────────────────────────────────────────────────


class SubscriptionMetricsResponse(BaseModel):
    """GET /subscriptions/metrics — MRR + active count + churn."""

    model_config = ConfigDict(from_attributes=True)

    mrr: Decimal = Field(default=Decimal("0"), description="Monthly Recurring Revenue")
    currency: str | None = None  # per currency-handling.md
    active_count: int = 0
    past_due_count: int = 0
    cancelled_count: int = 0
    churn_rate: float | None = None  # 0.0-1.0
    as_of: datetime
