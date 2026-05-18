"""LeadService — non-PHI lead management.

Application layer — no RBAC restriction (Lead is not PHI).
All authenticated roles can access lead data.
"""

from __future__ import annotations

from uuid import UUID

import structlog

from src.modules.vitalia.crm.domain.lead import Lead

logger = structlog.get_logger()


class LeadService:
    """Service for non-PHI Lead operations.

    No @require_phi_access restriction — Lead data is accessible to all roles.
    Single tenant_id filter enforced at repository layer.
    """

    def __init__(self, lead_repo: object) -> None:
        """Initialize with lead repository.

        Args:
            lead_repo: LeadRepository instance (or AsyncMock in tests).
        """
        self._lead_repo = lead_repo

    async def get_by_id(
        self,
        lead_id: UUID,
        *,
        tenant_id: UUID,
    ) -> Lead | None:
        """Retrieve a lead by ID.

        Args:
            lead_id: Lead UUID.
            tenant_id: Tenant UUID — root isolation (required).

        Returns:
            Lead or None if not found.
        """
        result = await self._lead_repo.get_by_id(
            lead_id,
            tenant_id=tenant_id,
        )
        logger.info(
            "lead_service.get_by_id",
            lead_id=str(lead_id),
            tenant_id=str(tenant_id),
            found=result is not None,
        )
        return result
