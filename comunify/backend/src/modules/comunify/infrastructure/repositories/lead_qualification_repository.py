"""Async repository — ComunifyLeadQualificationRecordModel.

All queries filter by tenant_id (mandatory, per tenant-isolation.md).
Lead qualification records are immutable qualification snapshots — no soft delete.
"""

from __future__ import annotations

import uuid

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.comunify.infrastructure.models.lead_qualification_record_model import (
    ComunifyLeadQualificationRecordModel,
)

logger = structlog.get_logger()


class LeadQualificationRepository:
    """Tenant-scoped async repository for ComunifyLeadQualificationRecordModel.

    Immutable qualification snapshots — no soft delete, no update.
    tenant_id is injected at construction time; every method enforces isolation.
    """

    def __init__(self, session: AsyncSession, tenant_id: uuid.UUID) -> None:
        self._session = session
        self._tenant_id = tenant_id

    async def get_by_id(self, record_id: uuid.UUID) -> ComunifyLeadQualificationRecordModel | None:
        """Return lead qualification record by ID for this tenant."""
        stmt = select(ComunifyLeadQualificationRecordModel).where(
            ComunifyLeadQualificationRecordModel.id == record_id,
            ComunifyLeadQualificationRecordModel.tenant_id == self._tenant_id,
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_cohort(
        self,
        cohort_id: uuid.UUID,
        *,
        limit: int = 50,
        offset: int = 0,
    ) -> list[ComunifyLeadQualificationRecordModel]:
        """List qualification records for a cohort within this tenant, most recent first."""
        stmt = (
            select(ComunifyLeadQualificationRecordModel)
            .where(
                ComunifyLeadQualificationRecordModel.tenant_id == self._tenant_id,
                ComunifyLeadQualificationRecordModel.cohort_id == cohort_id,
            )
            .order_by(ComunifyLeadQualificationRecordModel.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def list_by_lead(
        self,
        lead_id: uuid.UUID,
        *,
        limit: int = 20,
    ) -> list[ComunifyLeadQualificationRecordModel]:
        """List all qualification records for a lead across cohorts within this tenant."""
        stmt = (
            select(ComunifyLeadQualificationRecordModel)
            .where(
                ComunifyLeadQualificationRecordModel.tenant_id == self._tenant_id,
                ComunifyLeadQualificationRecordModel.lead_id == lead_id,
            )
            .order_by(ComunifyLeadQualificationRecordModel.created_at.desc())
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def save(self, record: ComunifyLeadQualificationRecordModel) -> None:
        """Persist a new lead qualification record (immutable snapshot)."""
        self._session.add(record)
        await self._session.flush()
        logger.info(
            "lead_qualification_record_saved",
            record_id=str(record.id),
            lead_id=str(record.lead_id),
            cohort_id=str(record.cohort_id),
            tenant_id=str(self._tenant_id),
        )
