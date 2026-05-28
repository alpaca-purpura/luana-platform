# cap: clinics.clinics-brand-extension
# atomics: TBD
# story-origin: TBD
"""SQLAlchemy model for vitalia_clinic_branches table.

Uses Column() style for consistency with engine models (TenantModel, UserModel).
Table created by migration 023_vitalia_clinics.

HIPAA-lite: vitalia_clinic_branches is brand-extension table (not engine).
FK to tenants(id) links clinic to engine IAM system.
Dual filter (tenant_id + clinic_id) enforced at query level per hipaa-lite.md.
"""

from __future__ import annotations

import uuid

from luana_core_platform.domain.base_entity import Base
from sqlalchemy import Boolean, Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func


class ClinicModel(Base):
    """SQLAlchemy ORM model for vitalia_clinic_branches.

    Maps to the brand-extension table created by migration 023_vitalia_clinics.
    """

    __tablename__ = "vitalia_clinic_branches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
        comment="FK to engine tenants(id) — links clinic to IAM tenant",
    )
    name = Column(String, nullable=False)
    slug = Column(String, nullable=False, index=True)
    country = Column(String(2), nullable=False, comment="ISO 3166-1 alpha-2")
    timezone = Column(String, nullable=False, server_default="UTC")
    plan_tier = Column(String, nullable=False, server_default="starter")
    is_active = Column(Boolean, nullable=False, server_default="true")
    onboarding_completed = Column(Boolean, nullable=False, server_default="false")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
