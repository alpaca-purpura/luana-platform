"""Vitalia Clinic API DTOs — Pydantic v2 request/response models.

PII rule: response_model= is MANDATORY on all routes (arch test enforces).
No PHI fields exposed. Clinic identity data (name, slug, country) is allowed.

All DTOs use ConfigDict(from_attributes=True) for SQLAlchemy model_validate.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ClinicCreateRequest(BaseModel):
    """Request body for POST /api/v1/vitalia/clinics/."""

    name: str = Field(min_length=1, max_length=200, description="Clinic name")
    slug: str = Field(min_length=2, max_length=100, description="URL-safe slug (unique per tenant)")
    country: str = Field(min_length=2, max_length=2, description="ISO 3166-1 alpha-2")
    timezone: str = Field(default="UTC", description="IANA timezone string")
    plan_tier: str = Field(default="starter", description="starter | growth | scale")


class ClinicResponse(BaseModel):
    """Response body for Clinic endpoints.

    PII allowlist: id, tenant_id, name, slug, country, timezone, plan_tier,
    is_active, onboarding_completed, created_at — no PHI fields.
    """

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tenant_id: UUID
    name: str
    slug: str
    country: str
    timezone: str
    plan_tier: str
    is_active: bool
    onboarding_completed: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ClinicListResponse(BaseModel):
    """Response body for GET /api/v1/vitalia/clinics/ list endpoint."""

    model_config = ConfigDict(from_attributes=True)

    clinics: list[ClinicResponse]
    total: int
