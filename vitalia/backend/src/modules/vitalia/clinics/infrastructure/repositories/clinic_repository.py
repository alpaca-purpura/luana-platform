# cap: clinics.clinics-brand-extension
# story-origin: TBD
"""Vitalia Clinic repository — concrete implementation with HIPAA dual filter.

Every method takes (tenant_id, ...) as first filter AND clinic_id as second
filter where applicable. This enforces the hipaa-lite.md invariant:
  ".where(Model.tenant_id == tenant_id, Model.clinic_id == clinic_id)"

All queries exclude soft-deleted rows (deleted_at IS NULL).
Uses SQLA 2.0 select() idiom — no session.query().
"""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.vitalia.clinics.domain.clinic import Clinic
from src.modules.vitalia.clinics.infrastructure.models.clinic_model import ClinicModel


class ClinicRepository:
    """Async repository for Clinic entities.

    Enforces:
      - tenant_id filter on EVERY query (hipaa-lite.md § Tenant isolation refuerzo)
      - deleted_at IS NULL (soft-delete only)
      - SQLA 2.0 select() idiom
    """

    def __init__(self, db: AsyncSession) -> None:
        """Initialize ClinicRepository with async session."""
        self.db = db

    async def get_by_id(self, tenant_id: UUID, clinic_id: UUID) -> Clinic | None:
        """Retrieve clinic by (tenant_id, clinic_id) — HIPAA dual filter mandatory.

        Args:
            tenant_id: Tenant context (outer filter).
            clinic_id: Clinic primary key (inner filter).

        Returns:
            Clinic entity or None if not found / soft-deleted.
        """
        result = await self.db.execute(
            select(ClinicModel)
            .where(ClinicModel.tenant_id == tenant_id)
            .where(ClinicModel.id == clinic_id)
            .where(ClinicModel.deleted_at.is_(None))
        )
        model = result.scalars().first()
        return Clinic.model_validate(model) if model else None

    async def get_by_slug(self, tenant_id: UUID, slug: str) -> Clinic | None:
        """Retrieve clinic by (tenant_id, slug).

        Args:
            tenant_id: Tenant context filter.
            slug: URL-safe clinic slug.

        Returns:
            Clinic entity or None.
        """
        result = await self.db.execute(
            select(ClinicModel)
            .where(ClinicModel.tenant_id == tenant_id)
            .where(ClinicModel.slug == slug)
            .where(ClinicModel.deleted_at.is_(None))
        )
        model = result.scalars().first()
        return Clinic.model_validate(model) if model else None

    async def list_by_tenant(self, tenant_id: UUID, *, active_only: bool = True) -> list[Clinic]:
        """List all clinics for a tenant.

        Args:
            tenant_id: Tenant context filter.
            active_only: If True, only return is_active=True clinics.

        Returns:
            List of Clinic entities ordered by created_at DESC.
        """
        stmt = (
            select(ClinicModel)
            .where(ClinicModel.tenant_id == tenant_id)
            .where(ClinicModel.deleted_at.is_(None))
            .order_by(ClinicModel.created_at.desc())
        )
        if active_only:
            stmt = stmt.where(ClinicModel.is_active.is_(True))

        result = await self.db.execute(stmt)
        models = result.scalars().all()
        return [Clinic.model_validate(m) for m in models]

    async def create(self, clinic: Clinic) -> Clinic:
        """Persist a new Clinic entity.

        Args:
            clinic: Clinic domain entity to persist.

        Returns:
            Persisted Clinic with DB-generated timestamps.
        """
        model = ClinicModel(
            id=clinic.id,
            tenant_id=clinic.tenant_id,
            name=clinic.name,
            slug=clinic.slug,
            country=clinic.country,
            timezone=clinic.timezone,
            plan_tier=clinic.plan_tier,
            is_active=clinic.is_active,
            onboarding_completed=clinic.onboarding_completed,
        )
        self.db.add(model)
        await self.db.commit()
        await self.db.refresh(model)
        return Clinic.model_validate(model)

    async def soft_delete(self, tenant_id: UUID, clinic_id: UUID) -> bool:
        """Soft-delete a clinic by setting deleted_at = NOW().

        Args:
            tenant_id: Tenant context filter.
            clinic_id: Clinic to soft-delete.

        Returns:
            True if deleted, False if not found or already deleted.
        """
        from sqlalchemy import func, update  # noqa: PLC0415

        result = await self.db.execute(
            update(ClinicModel)
            .where(ClinicModel.tenant_id == tenant_id)
            .where(ClinicModel.id == clinic_id)
            .where(ClinicModel.deleted_at.is_(None))
            .values(deleted_at=func.now())
        )
        await self.db.commit()
        return (result.rowcount or 0) > 0
