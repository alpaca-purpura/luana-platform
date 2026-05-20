"""PatientRepository — PHI entity repository with dual filter enforcement.

Infrastructure layer — extends PhiRepositoryBase (HIPAA-lite dual filter).

Every method MUST:
  1. Call self.validate_dual_filter(tenant_id=..., clinic_id=...) first.
  2. Apply BOTH tenant_id AND clinic_id in the SQL WHERE clause.
  3. Exclude soft-deleted rows (deleted_at IS NULL).
  4. Write an audit log entry via self._audit_repo (sync — never fire-forget).

Architecture fitness gate: vitalia/backend/tests/architecture/test_phi_dual_filter.py
"""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.vitalia._shared.repositories.audit_log_repository import (
    AuditLogEntry,
    AuditLogRepository,
)
from src.modules.vitalia._shared.repositories.phi_repository import PhiRepositoryBase
from src.modules.vitalia.crm.domain.patient import Patient

logger = structlog.get_logger()


def _utc_now() -> datetime:
    """Return current UTC time (timezone-aware)."""
    return datetime.now(tz=timezone.utc)


class PatientRepository(PhiRepositoryBase):
    """Repository for Patient PHI entities.

    Enforces dual filter (tenant_id + clinic_id) per HIPAA-lite rule.
    Writes audit log on every PHI read/write operation.

    NOTE: Slice 1 — no ORM model defined yet; uses raw SQL via text().
    Slice 2 migration: replace text() with proper SQLAlchemy Mapped model
    once migration T-infra-5 creates the vitalia_patients table.
    """

    def __init__(
        self,
        session: AsyncSession,
        audit_repo: AuditLogRepository,
    ) -> None:
        """Initialize with a DB session and audit repository.

        Args:
            session: SQLAlchemy async session.
            audit_repo: AuditLogRepository for mandatory PHI audit writes.
        """
        self._session = session
        self._audit_repo = audit_repo

    async def get_by_id(
        self,
        entity_id: UUID,
        *,
        tenant_id: UUID,
        clinic_id: UUID,
        user_id: UUID | None = None,
    ) -> Patient | None:
        """Retrieve a Patient by ID with dual filter.

        Args:
            entity_id: Patient UUID to retrieve.
            tenant_id: Tenant UUID — root isolation (required).
            clinic_id: Clinic UUID — HIPAA-lite dual filter (required).
            user_id: Optional user UUID for audit log. If None, skips audit.

        Returns:
            Patient domain entity or None if not found.

        Raises:
            ValueError: If tenant_id is None.
            MissingClinicFilterError: If clinic_id is None.
        """
        self.validate_dual_filter(tenant_id=tenant_id, clinic_id=clinic_id)

        stmt = text(
            """
            SELECT id, tenant_id, clinic_id, name, date_of_birth,
                   dni, phone, email, address,
                   marketing_opt_out_at,
                   marketing_opt_in, opt_out, opt_out_reason, opt_out_at,
                   deleted_at, created_at, updated_at
            FROM vitalia_patients
            WHERE tenant_id = :tenant_id
              AND clinic_id = :clinic_id
              AND id = :entity_id
              AND deleted_at IS NULL
            LIMIT 1
            """
        )
        result = await self._session.execute(
            stmt,
            {
                "tenant_id": str(tenant_id),
                "clinic_id": str(clinic_id),
                "entity_id": str(entity_id),
            },
        )
        row = result.fetchone()

        if user_id is not None:
            audit_entry = AuditLogEntry(
                tenant_id=tenant_id,
                clinic_id=clinic_id,
                user_id=user_id,
                action="read_patient",
                resource_type="patient",
                resource_id=entity_id,
            )
            await self._audit_repo.write(audit_entry)

        if row is None:
            return None

        return Patient(
            id=UUID(str(row.id)),
            tenant_id=UUID(str(row.tenant_id)),
            clinic_id=UUID(str(row.clinic_id)),
            name=row.name,
            date_of_birth=row.date_of_birth,
            dni=row.dni,
            phone=row.phone,
            email=row.email,
            address=row.address,
            marketing_opt_out_at=row.marketing_opt_out_at,
            marketing_opt_in=bool(row.marketing_opt_in) if row.marketing_opt_in is not None else False,
            opt_out=bool(row.opt_out) if row.opt_out is not None else False,
            opt_out_reason=row.opt_out_reason,
            opt_out_at=row.opt_out_at,
            deleted_at=row.deleted_at,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )

    async def list_by_filter(
        self,
        *,
        tenant_id: UUID,
        clinic_id: UUID,
        **filters: object,
    ) -> list[Patient]:
        """List Patients matching the given filters.

        Args:
            tenant_id: Tenant UUID — root isolation (required).
            clinic_id: Clinic UUID — HIPAA-lite dual filter (required).
            **filters: Additional filter criteria (name_contains, status, etc.).

        Returns:
            List of matching Patient entities.

        Raises:
            ValueError: If tenant_id is None.
            MissingClinicFilterError: If clinic_id is None.
        """
        self.validate_dual_filter(tenant_id=tenant_id, clinic_id=clinic_id)

        stmt = text(
            """
            SELECT id, tenant_id, clinic_id, name, date_of_birth,
                   dni, phone, email, address,
                   marketing_opt_out_at,
                   marketing_opt_in, opt_out, opt_out_reason, opt_out_at,
                   deleted_at, created_at, updated_at
            FROM vitalia_patients
            WHERE tenant_id = :tenant_id
              AND clinic_id = :clinic_id
              AND deleted_at IS NULL
            ORDER BY created_at DESC
            """
        )
        result = await self._session.execute(
            stmt,
            {
                "tenant_id": str(tenant_id),
                "clinic_id": str(clinic_id),
            },
        )
        rows = result.fetchall()

        return [
            Patient(
                id=UUID(str(row.id)),
                tenant_id=UUID(str(row.tenant_id)),
                clinic_id=UUID(str(row.clinic_id)),
                name=row.name,
                date_of_birth=row.date_of_birth,
                dni=row.dni,
                phone=row.phone,
                email=row.email,
                address=row.address,
                marketing_opt_out_at=row.marketing_opt_out_at,
                marketing_opt_in=bool(row.marketing_opt_in) if row.marketing_opt_in is not None else False,
                opt_out=bool(row.opt_out) if row.opt_out is not None else False,
                opt_out_reason=row.opt_out_reason,
                opt_out_at=row.opt_out_at,
                deleted_at=row.deleted_at,
                created_at=row.created_at,
                updated_at=row.updated_at,
            )
            for row in rows
        ]

    async def update(
        self,
        entity_id: UUID,
        *,
        tenant_id: UUID,
        clinic_id: UUID,
        user_id: UUID,
        updates: dict[str, object],
    ) -> None:
        """Update patient fields (soft, no hard delete).

        Args:
            entity_id: Patient UUID to update.
            tenant_id: Tenant UUID.
            clinic_id: Clinic UUID.
            user_id: User performing the update (for audit log).
            updates: Dict of field → value pairs to set.
        """
        self.validate_dual_filter(tenant_id=tenant_id, clinic_id=clinic_id)

        if not updates:
            return

        # Build SET clause dynamically
        set_clauses = ", ".join(f"{k} = :{k}" for k in updates)
        params: dict[str, object] = {
            **updates,
            "tenant_id": str(tenant_id),
            "clinic_id": str(clinic_id),
            "entity_id": str(entity_id),
            "updated_at": _utc_now(),
        }

        stmt = text(
            f"""
            UPDATE vitalia_patients
            SET {set_clauses}, updated_at = :updated_at
            WHERE tenant_id = :tenant_id
              AND clinic_id = :clinic_id
              AND id = :entity_id
              AND deleted_at IS NULL
            """
        )
        await self._session.execute(stmt, params)

        audit_entry = AuditLogEntry(
            tenant_id=tenant_id,
            clinic_id=clinic_id,
            user_id=user_id,
            action="update_patient",
            resource_type="patient",
            resource_id=entity_id,
        )
        await self._audit_repo.write(audit_entry)

    async def opt_out(
        self,
        entity_id: UUID,
        *,
        tenant_id: UUID,
        clinic_id: UUID,
        user_id: UUID,
        reason: str,
    ) -> None:
        """Mark patient as opted out from marketing (LGPD/HIPAA right to erasure flow).

        Updates opt_out=True, opt_out_reason, opt_out_at, marketing_opt_in=False
        per migration 023 columns (T-1 Slice 1 fidelizacion).

        Args:
            entity_id: Patient UUID.
            tenant_id: Tenant UUID.
            clinic_id: Clinic UUID.
            user_id: User requesting the opt-out (for audit log).
            reason: Reason for opt-out (stored redacted in audit log payload).
        """
        self.validate_dual_filter(tenant_id=tenant_id, clinic_id=clinic_id)

        now = _utc_now()
        stmt = text(
            """
            UPDATE vitalia_patients
            SET opt_out = TRUE,
                opt_out_at = :opt_out_at,
                opt_out_reason = :opt_out_reason,
                marketing_opt_in = FALSE,
                updated_at = :updated_at
            WHERE tenant_id = :tenant_id
              AND clinic_id = :clinic_id
              AND id = :entity_id
              AND deleted_at IS NULL
            """
        )
        await self._session.execute(
            stmt,
            {
                "opt_out_at": now,
                "opt_out_reason": reason,
                "updated_at": now,
                "tenant_id": str(tenant_id),
                "clinic_id": str(clinic_id),
                "entity_id": str(entity_id),
            },
        )

        audit_entry = AuditLogEntry(
            tenant_id=tenant_id,
            clinic_id=clinic_id,
            user_id=user_id,
            action="patient_opted_out",
            resource_type="patient",
            resource_id=entity_id,
            payload_redacted=b"<reason_redacted>",
        )
        await self._audit_repo.write(audit_entry)

        logger.info(
            "patient_opted_out",
            patient_id=str(entity_id),
            tenant_id=str(tenant_id),
            clinic_id=str(clinic_id),
        )

    async def marketing_opt_in(
        self,
        entity_id: UUID,
        *,
        tenant_id: UUID,
        clinic_id: UUID,
        user_id: UUID,
        opt_in: bool,
    ) -> None:
        """Update patient marketing consent flag (migration 023 column).

        Sets marketing_opt_in to the given value.
        Does NOT modify opt_out — consent is a separate flag from erasure.

        Args:
            entity_id: Patient UUID.
            tenant_id: Tenant UUID.
            clinic_id: Clinic UUID.
            user_id: User updating the consent (for audit log).
            opt_in: New consent value (True = consented, False = refused).
        """
        self.validate_dual_filter(tenant_id=tenant_id, clinic_id=clinic_id)

        now = _utc_now()
        stmt = text(
            """
            UPDATE vitalia_patients
            SET marketing_opt_in = :opt_in,
                updated_at = :updated_at
            WHERE tenant_id = :tenant_id
              AND clinic_id = :clinic_id
              AND id = :entity_id
              AND deleted_at IS NULL
            """
        )
        await self._session.execute(
            stmt,
            {
                "opt_in": opt_in,
                "updated_at": now,
                "tenant_id": str(tenant_id),
                "clinic_id": str(clinic_id),
                "entity_id": str(entity_id),
            },
        )

        audit_entry = AuditLogEntry(
            tenant_id=tenant_id,
            clinic_id=clinic_id,
            user_id=user_id,
            action="patient_marketing_opt_in",
            resource_type="patient",
            resource_id=entity_id,
        )
        await self._audit_repo.write(audit_entry)

        logger.info(
            "patient_marketing_consent_updated",
            patient_id=str(entity_id),
            tenant_id=str(tenant_id),
            clinic_id=str(clinic_id),
            opt_in=opt_in,
        )
