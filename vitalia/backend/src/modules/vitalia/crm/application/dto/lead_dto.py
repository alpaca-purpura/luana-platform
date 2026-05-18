"""Lead DTOs — non-PHI, all authenticated roles can read."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


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
