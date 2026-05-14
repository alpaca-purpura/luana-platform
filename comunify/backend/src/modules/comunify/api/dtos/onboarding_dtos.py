"""Onboarding API DTOs — Pydantic v2.

Per 03-arch-be.md § 7 + Tessl pii-sanitisation.md:
  - All response DTOs are the PII allowlist — no raw ORM fields exposed.
  - ConfigDict(from_attributes=True) for ORM compat.
  - Email fields masked where present.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# ── Onboarding: creator profile ───────────────────────────────────────────────


class CreateCreatorProfileRequest(BaseModel):
    """POST /onboarding/creator-profile — request DTO."""

    model_config = ConfigDict(from_attributes=True, extra="forbid")

    clerk_user_id: str = Field(..., description="Clerk JWT sub claim")
    creator_handle: str = Field(..., min_length=2, max_length=80)
    display_name: str = Field(..., min_length=1, max_length=120)
    niche: str = Field(..., description="Creator niche slug from allowed catalog")
    country: str = Field(..., min_length=2, max_length=2, description="ISO 3166-1 alpha-2")
    plan_tier: str = Field(..., description="creator | pro | agency")


class CreateCreatorProfileResponse(BaseModel):
    """POST /onboarding/creator-profile — response DTO."""

    model_config = ConfigDict(from_attributes=True)

    tenant_id: uuid.UUID
    creator_handle: str
    display_name: str
    niche: str
    plan_tier: str
    is_new: bool
    created_at: datetime


# ── Onboarding: handle check ──────────────────────────────────────────────────


class CheckHandleRequest(BaseModel):
    """POST /onboarding/check-handle — request DTO."""

    model_config = ConfigDict(from_attributes=True, extra="forbid")

    creator_handle: str = Field(..., min_length=2, max_length=80)


class CheckHandleResponse(BaseModel):
    """POST /onboarding/check-handle — response DTO."""

    model_config = ConfigDict(from_attributes=True)

    creator_handle: str
    available: bool


# ── Plan tiers ────────────────────────────────────────────────────────────────


class PlanTierItem(BaseModel):
    """Single plan tier item."""

    model_config = ConfigDict(from_attributes=True)

    slug: str
    label_es: str
    price_usd_monthly: float
    features_enabled: list[str] = Field(default_factory=list)


class PlanTierListResponse(BaseModel):
    """GET /onboarding/plans — response DTO."""

    model_config = ConfigDict(from_attributes=True)

    plans: list[PlanTierItem]


# ── Subscribe ─────────────────────────────────────────────────────────────────


class SubscribeRequest(BaseModel):
    """POST /onboarding/subscribe — request DTO."""

    model_config = ConfigDict(from_attributes=True, extra="forbid")

    plan_tier: str = Field(..., description="creator | pro | agency")
    gateway: str = Field(default="stripe_connect", description="Payment gateway slug")
    success_url: str | None = Field(None, description="Redirect URL on success")
    cancel_url: str | None = Field(None, description="Redirect URL on cancel")


class SubscribeResponse(BaseModel):
    """POST /onboarding/subscribe — response DTO."""

    model_config = ConfigDict(from_attributes=True)

    checkout_session_id: str
    checkout_url: str
    plan_tier: str
