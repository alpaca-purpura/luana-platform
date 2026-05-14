"""Cohort API DTOs — Pydantic v2.

Per 03-arch-be.md § 7 + § 6.5 + Tessl pii-sanitisation.md.
PII: raw subscriber email/phone NOT exposed — name_display masked.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


# ── Cohort CRUD ───────────────────────────────────────────────────────────────


class CreateCohortRequest(BaseModel):
    """POST /cohorts — create cohort."""

    model_config = ConfigDict(from_attributes=True, extra="forbid")

    name: str = Field(..., min_length=2, max_length=120)
    offer_id: uuid.UUID
    capacity_max: int = Field(..., ge=2, le=500)
    start_date: datetime
    end_date: datetime
    enrollment_criteria: dict = Field(default_factory=dict)


class CreateCohortResponse(BaseModel):
    """POST /cohorts — created cohort response."""

    model_config = ConfigDict(from_attributes=True)

    cohort_id: uuid.UUID
    slug: str
    status: str
    capacity_filled: int = 0
    capacity_max: int


class CohortListItem(BaseModel):
    """Single cohort list item."""

    model_config = ConfigDict(from_attributes=True)

    cohort_id: uuid.UUID
    name: str
    slug: str
    status: str
    capacity_filled: int
    capacity_max: int
    capacity_waitlist: int
    start_date: datetime
    end_date: datetime
    created_at: datetime


class CohortListResponse(BaseModel):
    """GET /cohorts — paginated cohort list."""

    model_config = ConfigDict(from_attributes=True)

    items: list[CohortListItem]
    total: int
    page: int = 1
    page_size: int = 20


class CohortDetailResponse(BaseModel):
    """GET /cohorts/{id} — cohort detail + roster summary."""

    model_config = ConfigDict(from_attributes=True)

    cohort_id: uuid.UUID
    name: str
    slug: str
    status: str
    offer_id: uuid.UUID
    capacity_filled: int
    capacity_max: int
    capacity_waitlist: int
    start_date: datetime
    end_date: datetime
    enrollment_criteria: dict
    created_at: datetime
    updated_at: datetime


# ── Roster ────────────────────────────────────────────────────────────────────


class CohortMemberResponse(BaseModel):
    """Single cohort member — PII masked per Tessl pii-sanitisation.md.

    Raw phone/email/full_last_name NOT exposed.
    name_display = 'María D.' pattern (first name + last initial).
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    # PII allowlist: display name only (no full_name, email, phone)
    name_display: str = Field(default="Miembro", description="Display name (PII masked)")
    tier: str
    status: str
    engagement_score: int
    engagement_bucket: Literal["high", "medium", "low"]
    last_active_at: datetime | None = None
    enrollment_at: datetime
    waitlist_position: int | None = None


class CohortRosterResponse(BaseModel):
    """GET /cohorts/{id}/roster — member roster."""

    model_config = ConfigDict(from_attributes=True)

    cohort_id: uuid.UUID
    members: list[CohortMemberResponse]
    total: int
    page: int = 1
    page_size: int = 50


# ── Enroll ────────────────────────────────────────────────────────────────────


class EnrollCohortRequest(BaseModel):
    """POST /cohorts/{id}/enroll — enroll subscriber."""

    model_config = ConfigDict(from_attributes=True, extra="forbid")

    subscriber_id: uuid.UUID
    tier: str = Field(default="regular", description="regular | premium")


class EnrollCohortResponse(BaseModel):
    """POST /cohorts/{id}/enroll — enrollment result."""

    model_config = ConfigDict(from_attributes=True)

    member_id: uuid.UUID
    cohort_id: uuid.UUID
    is_waitlisted: bool
    waitlist_position: int | None = None
    is_idempotent_hit: bool = False


# ── Broadcasts ────────────────────────────────────────────────────────────────


class SendBroadcastRequest(BaseModel):
    """POST /cohorts/{id}/broadcasts — send broadcast."""

    model_config = ConfigDict(from_attributes=True, extra="forbid")

    content: str = Field(..., min_length=1, max_length=1600)
    audience_filter: dict = Field(default_factory=dict, description="Optional filter criteria")


class SendBroadcastResponse(BaseModel):
    """POST /cohorts/{id}/broadcasts — broadcast result."""

    model_config = ConfigDict(from_attributes=True)

    broadcast_id: uuid.UUID
    recipients_dispatched: int
    recipients_queued: int
    status: str  # sent | partial | rate_limited


class BroadcastListItem(BaseModel):
    """Single broadcast list item."""

    model_config = ConfigDict(from_attributes=True)

    broadcast_id: uuid.UUID
    content_preview: str
    sent_count: int
    recipients_count: int
    status: str
    sent_at: datetime | None = None
    created_at: datetime


class BroadcastListResponse(BaseModel):
    """GET /cohorts/{id}/broadcasts — broadcast history."""

    model_config = ConfigDict(from_attributes=True)

    cohort_id: uuid.UUID
    items: list[BroadcastListItem]
    total: int
