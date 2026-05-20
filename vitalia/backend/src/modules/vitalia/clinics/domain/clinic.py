"""Vitalia Clinic domain entity — pure Python, zero framework imports.

DDD Inside-Out: domain layer is the innermost ring.
No sqlalchemy, no fastapi, no luana_core_iam imports.

A Clinic is the physical/legal healthcare entity (medical practice, dental
office, wellness center). Each Clinic maps to a tenant_id in the engine
IAM system. The dual-filter invariant (tenant_id + clinic_id) is enforced
at the repository and API layers.

HIPAA-lite: clinic data is PHI-adjacent (links to patient records).
Clinic identity fields (name, slug, country) are identity OK — not PHI.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class Clinic(BaseModel):
    """Vitalia Clinic domain entity.

    A Clinic is the brand-specific extension that links a Luana tenant (from
    the engine IAM system) to a physical healthcare entity with location,
    plan tier, and onboarding status.

    Attributes:
        id: Unique identifier (UUID).
        tenant_id: FK to engine 'tenants' table — links clinic to IAM tenant.
        name: Human-readable clinic name (e.g. "Clínica Aurora Dental").
        slug: URL-safe identifier (unique per tenant, e.g. "aurora-dental-ar").
        country: ISO 3166-1 alpha-2 country code (AR, MX, CO, CL, PE, BR).
        timezone: IANA TZ string (e.g. "America/Argentina/Buenos_Aires").
        plan_tier: Subscription plan (starter, growth, scale).
        is_active: Whether clinic is currently active on the platform.
        onboarding_completed: Whether clinic has completed the onboarding wizard.
        created_at: UTC creation timestamp.
        updated_at: UTC last-update timestamp. None if never updated.
        deleted_at: UTC soft-delete timestamp. None if not deleted.
    """

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tenant_id: UUID
    name: str
    slug: str
    country: str = Field(max_length=2, description="ISO 3166-1 alpha-2")
    timezone: str = Field(default="UTC", description="IANA timezone string")
    plan_tier: str = Field(default="starter", description="starter | growth | scale")
    is_active: bool = True
    onboarding_completed: bool = False
    created_at: datetime | None = None
    updated_at: datetime | None = None
    deleted_at: datetime | None = None
