# cap: abel/icp-buyer  # noqa: ERA001
"""Pydantic v2 DTOs for Buyer — request/response shapes.

PII gate: response model no expone tenant_id.
Campos JSONB: mismos slugs que engine BuyerPersona (field-contract compatible).

Pydantic v2 patterns:
- model_config = ConfigDict(from_attributes=True) en response models
- dict[str, Any] aceptado para JSONB flexibles (precedente engine BuyerPersona)
"""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from src.modules.nicolify.abel.domain.buyer import DecisionPower


class BuyerCreate(BaseModel):
    """DTO para crear Buyer (POST /abel/icp/{icp_id}/buyers).

    Solo name requerido. role, decision_power opcionales (draft-first).
    icp_id viene del path parameter (no en body).
    """

    model_config = ConfigDict(from_attributes=True)

    name: str = Field(min_length=1, max_length=200)
    role: str | None = Field(None, max_length=160)
    decision_power: DecisionPower | None = None
    demographics: dict[str, Any] = Field(default_factory=dict)
    psychographics: dict[str, Any] = Field(default_factory=dict)
    pain_points: list[dict[str, Any]] = Field(default_factory=list)
    desires: list[dict[str, Any]] = Field(default_factory=list)
    objections: list[dict[str, Any]] = Field(default_factory=list)
    buyer_journey: dict[str, Any] = Field(default_factory=dict)
    purchase_triggers: list[str] = Field(default_factory=list)
    preferred_channels: list[dict[str, Any]] = Field(default_factory=list)


class BuyerPatch(BaseModel):
    """DTO para PATCH Buyer — todos opcionales (autosave)."""

    model_config = ConfigDict(from_attributes=True)

    name: str | None = Field(None, min_length=1, max_length=200)
    role: str | None = Field(None, max_length=160)
    decision_power: DecisionPower | None = None
    demographics: dict[str, Any] | None = None
    psychographics: dict[str, Any] | None = None
    pain_points: list[dict[str, Any]] | None = None
    desires: list[dict[str, Any]] | None = None
    objections: list[dict[str, Any]] | None = None
    buyer_journey: dict[str, Any] | None = None
    purchase_triggers: list[str] | None = None
    preferred_channels: list[dict[str, Any]] | None = None


class BuyerResponse(BaseModel):
    """DTO de respuesta Buyer — PII gate: sin tenant_id."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    icp_id: UUID
    name: str
    role: str | None
    decision_power: DecisionPower | None
    is_primary: bool
    demographics: dict[str, Any]
    psychographics: dict[str, Any]
    pain_points: list[dict[str, Any]]
    desires: list[dict[str, Any]]
    objections: list[dict[str, Any]]
    buyer_journey: dict[str, Any]
    purchase_triggers: list[str]
    preferred_channels: list[dict[str, Any]]
    created_at: datetime | None
    updated_at: datetime | None
