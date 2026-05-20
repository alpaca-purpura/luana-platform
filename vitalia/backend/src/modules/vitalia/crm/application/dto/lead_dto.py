"""Lead DTOs — non-PHI, all authenticated roles can read.

Extended by T-inbox-be-5: LeadListResponse, LeadCreateRequest, LeadUpdateRequest.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class LeadResponse(BaseModel):
    """Lead response model — non-PHI fields only."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tenant_id: UUID
    name: str
    email: str | None = None
    phone: str | None = None
    source: str | None = None
    status: str
    created_at: datetime


class LeadListResponse(BaseModel):
    """Paginated list of leads — non-PHI."""

    model_config = ConfigDict(from_attributes=True)

    items: list[LeadResponse]
    total: int
    limit: int
    offset: int


class LeadCreateRequest(BaseModel):
    """Request body for POST /crm/leads."""

    model_config = ConfigDict(from_attributes=True)

    name: str = Field(max_length=200)
    email: str | None = Field(None, max_length=254)
    phone: str | None = Field(None, max_length=32)
    source: str | None = Field(None, max_length=64)
    status: str = Field(default="new", max_length=32)
    notes: str | None = Field(None, max_length=2000)
    marketing_opt_in: bool = False


class LeadUpdateRequest(BaseModel):
    """Request body for PATCH /crm/leads/{lead_id} — all fields optional."""

    model_config = ConfigDict(from_attributes=True)

    name: str | None = Field(None, max_length=200)
    email: str | None = Field(None, max_length=254)
    phone: str | None = Field(None, max_length=32)
    source: str | None = Field(None, max_length=64)
    status: str | None = Field(None, max_length=32)
    notes: str | None = Field(None, max_length=2000)
    marketing_opt_in: bool | None = None
