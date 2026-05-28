# cap: crm.crm-consent-optout
# atomics: TBD
# story-origin: TBD
"""Patient DTOs — PII allowlist enforced via response_model= on all routes.

Only fields listed in PatientResponse are returned to clients.
PHI fields (diagnosis, treatment_plan, etc.) are excluded unless explicitly
added in a future PHI-gated DTO variant with stricter auth.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class PatientResponse(BaseModel):
    """Patient response — PII allowlisted fields only.

    PHI fields beyond these are NOT exposed via this DTO.
    Richer clinical data requires a separate MedicalRecordResponse
    under PHI-gated endpoints.
    """

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tenant_id: UUID
    clinic_id: UUID
    name: str
    email: str | None = None
    phone: str | None = None
    marketing_opt_out_at: datetime | None = None
    created_at: datetime


class PatientPatchRequest(BaseModel):
    """Request model for PATCH /patients/{id}."""

    model_config = ConfigDict(from_attributes=True)

    phone: str | None = None
    email: str | None = None
    address: str | None = None


class OptOutRequest(BaseModel):
    """Request model for POST /patients/{id}/opt-out."""

    model_config = ConfigDict(from_attributes=True)

    reason: str


class OptOutResponse(BaseModel):
    """Response model for POST /patients/{id}/opt-out."""

    model_config = ConfigDict(from_attributes=True)

    patient_id: UUID
    opted_out: bool
    message: str
