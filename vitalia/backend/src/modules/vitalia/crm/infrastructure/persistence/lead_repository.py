# cap: crm.crm-consent-optout
# story-origin: TBD
"""LeadRepository — non-PHI entity repository with single tenant_id filter.

Infrastructure layer — Lead is NOT PHI per arch spec § T-infra-9.
Single tenant_id filter only (no clinic_id dual filter required).

Architecture fitness gate: test_lead_repository_is_not_phi_repository
"""

from __future__ import annotations

from uuid import UUID

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.vitalia.crm.domain.lead import Lead

logger = structlog.get_logger()


class LeadRepository:
    """Repository for Lead non-PHI entities.

    Applies single tenant_id filter only.
    Does NOT inherit PhiRepositoryBase (Lead is not PHI).
    Marketing and receptionist roles can access leads.
    """

    def __init__(self, session: AsyncSession) -> None:
        """Initialize with a DB session.

        Args:
            session: SQLAlchemy async session.
        """
        self._session = session

    async def get_by_id(
        self,
        entity_id: UUID,
        *,
        tenant_id: UUID,
    ) -> Lead | None:
        """Retrieve a Lead by ID with single tenant_id filter.

        Args:
            entity_id: Lead UUID to retrieve.
            tenant_id: Tenant UUID — root isolation (required).

        Returns:
            Lead domain entity or None if not found.

        Raises:
            ValueError: If tenant_id is None.
        """
        if tenant_id is None:
            raise ValueError(
                "LeadRepository.get_by_id requires tenant_id — never bypass root tenant isolation (tenant-isolation.md)"
            )

        stmt = text(
            """
            SELECT id, tenant_id, name, email, phone, source,
                   status, notes, deleted_at, created_at, updated_at
            FROM vitalia_leads
            WHERE tenant_id = :tenant_id
              AND id = :entity_id
              AND deleted_at IS NULL
            LIMIT 1
            """
        )
        result = await self._session.execute(
            stmt,
            {
                "tenant_id": str(tenant_id),
                "entity_id": str(entity_id),
            },
        )
        row = result.fetchone()

        if row is None:
            return None

        return Lead(
            id=UUID(str(row.id)),
            tenant_id=UUID(str(row.tenant_id)),
            name=row.name,
            email=row.email,
            phone=row.phone,
            source=row.source,
            status=row.status,
            notes=row.notes,
            deleted_at=row.deleted_at,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )

    async def list_by_filter(
        self,
        *,
        tenant_id: UUID,
        **filters: object,
    ) -> list[Lead]:
        """List Leads matching the given filters.

        Args:
            tenant_id: Tenant UUID — root isolation (required).
            **filters: Additional filter criteria.

        Returns:
            List of matching Lead entities.

        Raises:
            ValueError: If tenant_id is None.
        """
        if tenant_id is None:
            raise ValueError("LeadRepository.list_by_filter requires tenant_id")

        stmt = text(
            """
            SELECT id, tenant_id, name, email, phone, source,
                   status, notes, deleted_at, created_at, updated_at
            FROM vitalia_leads
            WHERE tenant_id = :tenant_id
              AND deleted_at IS NULL
            ORDER BY created_at DESC
            """
        )
        result = await self._session.execute(stmt, {"tenant_id": str(tenant_id)})
        rows = result.fetchall()

        return [
            Lead(
                id=UUID(str(row.id)),
                tenant_id=UUID(str(row.tenant_id)),
                name=row.name,
                email=row.email,
                phone=row.phone,
                source=row.source,
                status=row.status,
                notes=row.notes,
                deleted_at=row.deleted_at,
                created_at=row.created_at,
                updated_at=row.updated_at,
            )
            for row in rows
        ]
