"""Offer + Ladder API DTOs — Pydantic v2.

Per 03-arch-be.md § 7 + § 6.4.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# ── Offer preset ──────────────────────────────────────────────────────────────


class OfferPresetResponse(BaseModel):
    """GET /offers/presets/coaching_offers_v1 — Comunify preset config."""

    model_config = ConfigDict(from_attributes=True)

    preset_id: str
    label_es: str
    description_es: str
    archetype: str
    value_levels: list[str]
    sections: list[str]


# ── Offer CRUD ────────────────────────────────────────────────────────────────


class CreateOfferRequest(BaseModel):
    """POST /offers — create offer."""

    model_config = ConfigDict(from_attributes=True, extra="forbid")

    name: str = Field(..., min_length=1, max_length=200)
    value_level: str = Field(..., description="lead_magnet | tripwire | core | premium | enterprise")
    preset_id: str | None = None
    description: str | None = None


class CreateOfferResponse(BaseModel):
    """POST /offers — created offer response."""

    model_config = ConfigDict(from_attributes=True)

    offer_id: uuid.UUID
    name: str
    value_level: str
    preset_id: str | None = None
    created_at: datetime


class OfferListItem(BaseModel):
    """Single offer list item."""

    model_config = ConfigDict(from_attributes=True)

    offer_id: uuid.UUID
    name: str
    value_level: str
    preset_id: str | None = None
    created_at: datetime


class OfferListResponse(BaseModel):
    """GET /offers — offer list response."""

    model_config = ConfigDict(from_attributes=True)

    items: list[OfferListItem]
    total: int
    page: int = 1


# ── Offer ladder ──────────────────────────────────────────────────────────────


class OfferLadderResponse(BaseModel):
    """GET /comunify/ladder — current ladder state."""

    model_config = ConfigDict(from_attributes=True)

    ladder_id: uuid.UUID | None = None
    level_1_offer_id: uuid.UUID | None = None  # lead_magnet
    level_2_offer_id: uuid.UUID | None = None  # tripwire
    level_3_offer_id: uuid.UUID | None = None  # core_offer
    level_4_offer_id: uuid.UUID | None = None  # premium
    completeness_score: int = 0
    gaps: list[str] = Field(default_factory=list)


class UpdateLadderConnectionsRequest(BaseModel):
    """PATCH /comunify/ladder/connections — update ladder level assignments."""

    model_config = ConfigDict(from_attributes=True, extra="forbid")

    level_1_offer_id: uuid.UUID | None = None
    level_2_offer_id: uuid.UUID | None = None
    level_3_offer_id: uuid.UUID | None = None
    level_4_offer_id: uuid.UUID | None = None
