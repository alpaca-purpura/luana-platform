"""Async repository — ComunifyVoiceDistillationJobModel.

All queries filter by tenant_id (mandatory, per tenant-isolation.md).
Distillation jobs are append-only (new job per distillation run); status updates allowed.
No soft delete — jobs are immutable records of distillation attempts.
"""

from __future__ import annotations

import uuid
from datetime import datetime

import structlog
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.comunify.infrastructure.models.voice_distillation_job_model import (
    ComunifyVoiceDistillationJobModel,
)

logger = structlog.get_logger()


class VoiceDistillationJobRepository:
    """Tenant-scoped async repository for ComunifyVoiceDistillationJobModel.

    tenant_id is injected at construction time; every method enforces isolation.
    """

    def __init__(self, session: AsyncSession, tenant_id: uuid.UUID) -> None:
        self._session = session
        self._tenant_id = tenant_id

    async def get_by_id(self, job_id: uuid.UUID) -> ComunifyVoiceDistillationJobModel | None:
        """Return distillation job by ID for this tenant."""
        stmt = select(ComunifyVoiceDistillationJobModel).where(
            ComunifyVoiceDistillationJobModel.id == job_id,
            ComunifyVoiceDistillationJobModel.tenant_id == self._tenant_id,
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_latest_for_tenant(self) -> ComunifyVoiceDistillationJobModel | None:
        """Return the most recent distillation job for this tenant."""
        stmt = (
            select(ComunifyVoiceDistillationJobModel)
            .where(
                ComunifyVoiceDistillationJobModel.tenant_id == self._tenant_id,
            )
            .order_by(ComunifyVoiceDistillationJobModel.created_at.desc())
            .limit(1)
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_tenant(
        self,
        *,
        limit: int = 10,
    ) -> list[ComunifyVoiceDistillationJobModel]:
        """List distillation jobs for this tenant, most recent first."""
        stmt = (
            select(ComunifyVoiceDistillationJobModel)
            .where(
                ComunifyVoiceDistillationJobModel.tenant_id == self._tenant_id,
            )
            .order_by(ComunifyVoiceDistillationJobModel.created_at.desc())
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def save(self, job: ComunifyVoiceDistillationJobModel) -> None:
        """Persist a new distillation job."""
        self._session.add(job)
        await self._session.flush()
        logger.info(
            "voice_distillation_job_saved",
            job_id=str(job.id),
            tenant_id=str(self._tenant_id),
            status=job.status,
        )

    async def update_status(
        self,
        job_id: uuid.UUID,
        *,
        status: str,
        confidence_score: float | None = None,
        compiled_blocks: dict | None = None,
        error_reason: str | None = None,
        completed_at: datetime | None = None,
        ratified_at: datetime | None = None,
    ) -> bool:
        """Update job status and optional result fields. Returns True if updated."""
        values: dict = {"status": status}
        if confidence_score is not None:
            values["confidence_score"] = confidence_score
        if compiled_blocks is not None:
            values["compiled_blocks"] = compiled_blocks
        if error_reason is not None:
            values["error_reason"] = error_reason
        if completed_at is not None:
            values["completed_at"] = completed_at
        if ratified_at is not None:
            values["ratified_at"] = ratified_at

        stmt = (
            update(ComunifyVoiceDistillationJobModel)
            .where(
                ComunifyVoiceDistillationJobModel.id == job_id,
                ComunifyVoiceDistillationJobModel.tenant_id == self._tenant_id,
            )
            .values(**values)
        )
        result = await self._session.execute(stmt)
        await self._session.flush()
        updated = result.rowcount > 0
        if updated:
            logger.info(
                "voice_distillation_job_status_updated",
                job_id=str(job_id),
                status=status,
                tenant_id=str(self._tenant_id),
            )
        return updated
