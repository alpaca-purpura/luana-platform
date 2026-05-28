# cap: crm.crm-consent-optout
# story-origin: TBD
"""PatientService — RBAC-gated PHI operations.

Application layer — orchestrates repository calls with RBAC enforcement.
All methods use @require_phi_access to enforce HIPAA-lite access control.

Allowed roles for PHI access: doctor, nurse, admin_clinic.
"""

from __future__ import annotations

from uuid import UUID

import structlog

from src.modules.vitalia._shared.auth.rbac import require_phi_access
from src.modules.vitalia._shared.repositories.audit_log_repository import (
    AuditLogRepository,
)
from src.modules.vitalia.crm.domain.patient import Patient

logger = structlog.get_logger()

_PHI_ROLES = ["doctor", "nurse", "admin_clinic"]


class PatientService:
    """Service for PHI Patient operations with RBAC enforcement.

    Every public method is decorated with @require_phi_access.
    The audit_repo is passed to the decorator so it logs both
    access grants and denials.
    """

    def __init__(
        self,
        patient_repo: object,
        audit_repo: AuditLogRepository,
    ) -> None:
        """Initialize with repositories.

        Args:
            patient_repo: PatientRepository instance (or AsyncMock in tests).
            audit_repo: AuditLogRepository for mandatory HIPAA-lite audit writes.
        """
        self._patient_repo = patient_repo
        self._audit_repo = audit_repo

    async def get_by_id(
        self,
        patient_id: UUID,
        *,
        tenant_id: UUID,
        clinic_id: UUID,
        user_id: UUID,
        user_role: str,
    ) -> Patient | None:
        """Retrieve a patient by ID — PHI access gated by RBAC.

        Args:
            patient_id: Patient UUID.
            tenant_id: Tenant UUID.
            clinic_id: Clinic UUID (dual filter).
            user_id: Requesting user UUID (for audit log).
            user_role: Role string — must be in PHI_ALLOWED_ROLES.

        Returns:
            Patient or None if not found.

        Raises:
            PHIAccessDeniedError: If user_role is not allowed.
        """
        return await self._get_by_id_guarded(
            patient_id=patient_id,
            tenant_id=tenant_id,
            clinic_id=clinic_id,
            user_id=user_id,
            user_role=user_role,
        )

    @require_phi_access(roles=_PHI_ROLES, resource_type="patient")
    async def _get_by_id_guarded(
        self,
        *,
        patient_id: UUID,
        tenant_id: UUID,
        clinic_id: UUID,
        user_id: UUID,
        user_role: str,
    ) -> Patient | None:
        """Inner guarded implementation — only called after RBAC check passes."""
        result = await self._patient_repo.get_by_id(
            patient_id,
            tenant_id=tenant_id,
            clinic_id=clinic_id,
            user_id=user_id,
        )
        logger.info(
            "patient_service.get_by_id",
            patient_id=str(patient_id),
            tenant_id=str(tenant_id),
            found=result is not None,
        )
        return result

    async def update(
        self,
        patient_id: UUID,
        *,
        tenant_id: UUID,
        clinic_id: UUID,
        user_id: UUID,
        user_role: str,
        updates: dict[str, object],
    ) -> None:
        """Update patient fields — PHI write gated by RBAC.

        Args:
            patient_id: Patient UUID.
            tenant_id: Tenant UUID.
            clinic_id: Clinic UUID (dual filter).
            user_id: Requesting user UUID (for audit log).
            user_role: Role string — must be in PHI_ALLOWED_ROLES.
            updates: Field → value mapping for the update.

        Raises:
            PHIAccessDeniedError: If user_role is not allowed.
        """
        await self._update_guarded(
            patient_id=patient_id,
            tenant_id=tenant_id,
            clinic_id=clinic_id,
            user_id=user_id,
            user_role=user_role,
            updates=updates,
        )

    @require_phi_access(roles=_PHI_ROLES, resource_type="patient")
    async def _update_guarded(
        self,
        *,
        patient_id: UUID,
        tenant_id: UUID,
        clinic_id: UUID,
        user_id: UUID,
        user_role: str,
        updates: dict[str, object],
    ) -> None:
        """Inner guarded implementation — only called after RBAC check passes."""
        await self._patient_repo.update(
            patient_id,
            tenant_id=tenant_id,
            clinic_id=clinic_id,
            user_id=user_id,
            updates=updates,
        )

    async def opt_out(
        self,
        patient_id: UUID,
        *,
        tenant_id: UUID,
        clinic_id: UUID,
        user_id: UUID,
        user_role: str,
        reason: str,
    ) -> None:
        """Mark patient as opted out — gated by admin_clinic role only.

        Per LGPD/HIPAA-lite: opt-out is an administrative action.
        Only admin_clinic (not doctors/nurses) may trigger opt-out.

        Args:
            patient_id: Patient UUID.
            tenant_id: Tenant UUID.
            clinic_id: Clinic UUID.
            user_id: Requesting user UUID.
            user_role: Must be "admin_clinic".
            reason: Reason for opt-out (stored redacted in audit).

        Raises:
            PHIAccessDeniedError: If user_role is not admin_clinic.
        """
        await self._opt_out_guarded(
            patient_id=patient_id,
            tenant_id=tenant_id,
            clinic_id=clinic_id,
            user_id=user_id,
            user_role=user_role,
            reason=reason,
        )

    @require_phi_access(roles=["admin_clinic"], resource_type="patient_opt_out")
    async def _opt_out_guarded(
        self,
        *,
        patient_id: UUID,
        tenant_id: UUID,
        clinic_id: UUID,
        user_id: UUID,
        user_role: str,
        reason: str,
    ) -> None:
        """Inner guarded opt-out — only admin_clinic allowed."""
        await self._patient_repo.opt_out(
            patient_id,
            tenant_id=tenant_id,
            clinic_id=clinic_id,
            user_id=user_id,
            reason=reason,
        )
        logger.info(
            "patient_service.opt_out",
            patient_id=str(patient_id),
            tenant_id=str(tenant_id),
        )
