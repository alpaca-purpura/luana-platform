# cap: clinics.clinics-brand-extension
# story-origin: TBD
"""Vitalia Clinic API DTOs — Pydantic v2 request/response models.

PII rule: response_model= is MANDATORY on all routes (arch test enforces).
No PHI fields exposed. Clinic identity data (name, slug, country) is allowed.

All DTOs use ConfigDict(from_attributes=True) for SQLAlchemy model_validate.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

# cap: clinics.lisa.doctores — doctor DTOs added in T-BE-1


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


# ── Doctor DTOs (T-BE-1) ─────────────────────────────────────────────────────


class DoctorCreateRequest(BaseModel):
    """Request body for POST /api/v1/vitalia/clinics/doctors/.

    All PII fields are handled server-side (encrypted at rest via pgcrypto).
    """

    first_name: str = Field(min_length=1, max_length=128)
    last_name: str = Field(min_length=1, max_length=128)
    dni: str = Field(min_length=1, max_length=32, description="DNI / document number (PHI)")
    email: str = Field(min_length=3, max_length=254, description="Professional email (PHI)")
    phone: str | None = Field(default=None, max_length=32, description="Mobile phone (PHI)")
    specialty: str | None = Field(default=None, max_length=128)
    credential: str = Field(min_length=1, max_length=64, description="Credential number (PHI)")
    credential_country: str = Field(min_length=2, max_length=2, description="PE|AR|MX|CL")
    years_experience: int | None = Field(default=None, ge=0, le=60)
    languages: list[str] = Field(default_factory=list)


class DoctorListItemDTO(BaseModel):
    """Response item for list endpoint — PHI fields are MASKED.

    Per hipaa-lite.md: list responses must mask DNI/email/phone.
    Use masked_dni/masked_email/masked_phone fields (never raw PHI).
    """

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tenant_id: UUID
    clinic_id: UUID
    display_name: str
    specialty: str | None
    active: bool
    visible_en_landing: bool
    years_experience: int | None = None
    languages: list[str] = Field(default_factory=list)
    avatar_key: str | None = None
    # PHI masked versions (never raw dni/email/phone)
    masked_dni: str | None = None
    masked_email: str | None = None
    masked_phone: str | None = None
    created_at: datetime | None = None


class DoctorListResponse(BaseModel):
    """Paginated list response for GET /doctors/."""

    model_config = ConfigDict(from_attributes=True)

    items: list[DoctorListItemDTO]
    total: int
    page: int
    page_size: int


class DoctorDetailDTO(BaseModel):
    """Full doctor detail for admin workspace (admin_clinic role only).

    Exposes decrypted PII fields — only available to admin_clinic.
    """

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tenant_id: UUID
    clinic_id: UUID
    first_name: str
    last_name: str
    display_name: str
    dni: str
    email: str
    phone: str | None
    specialty: str | None
    credential: str
    credential_country: str
    years_experience: int | None
    languages: list[str]
    bio_inputs_notes: str | None
    bio_links: list[str]
    bio_public: "BioPublicDTO | None"
    avatar_key: str | None
    visible_en_landing: bool
    active: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None


class BioPublicDTO(BaseModel):
    """Public bio DTO — 3 editable sections."""

    model_config = ConfigDict(from_attributes=True)

    resumen: str | None = None
    formacion: str | None = None
    enfoque: str | None = None


class DoctorPatchRequest(BaseModel):
    """Request body for PATCH /doctors/{id} — partial update.

    All fields are optional (patch semantics: only send fields to update).
    """

    bio_inputs_notes: str | None = None
    bio_links: list[str] | None = None
    bio_public: BioPublicDTO | None = None
    avatar_key: str | None = None
    visible_en_landing: bool | None = None
    active: bool | None = None
    specialty: str | None = None
    years_experience: int | None = Field(default=None, ge=0, le=60)
    languages: list[str] | None = None


class PublicDoctorDTO(BaseModel):
    """Allow-listed DTO for public /api/public/clinic/{slug}/doctors endpoint.

    CHANNEL GUARD: only 7 fields permitted — NO PHI (dni/email/phone/credential).
    Constructed by public_doctor_serializer.to_public_dto() — never from ORM directly.
    Arch test test_public_doctors_allowlist.py enforces this invariant.
    """

    model_config = ConfigDict(from_attributes=True)

    display_name: str
    specialty: str | None = None
    avatar_key: str | None = None
    years_experience: int | None = None
    languages: list[str] = Field(default_factory=list)
    bio_public: BioPublicDTO | None = None
    credential_label: str | None = None
    """Optional display label like 'CMP 12345' (hides full credential number)."""


class PublicDoctorsResponse(BaseModel):
    """Response for public doctors endpoint."""

    model_config = ConfigDict(from_attributes=True)

    doctors: list[PublicDoctorDTO]
