"""Async repository — ComunifyVoiceCloningSamplesModel.

All queries filter by tenant_id (mandatory, per tenant-isolation.md).
Voice samples tracking is a singleton per tenant (unique tenant_id constraint).
No soft delete — record is upserted when new samples are uploaded.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import structlog
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.comunify.infrastructure.models.voice_cloning_samples_model import (
    ComunifyVoiceCloningSamplesModel,
)

logger = structlog.get_logger()


class VoiceCloningSamplesRepository:
    """Tenant-scoped async repository for ComunifyVoiceCloningSamplesModel.

    Singleton per tenant (UNIQUE constraint on tenant_id).
    tenant_id is injected at construction time; every method enforces isolation.
    """

    def __init__(self, session: AsyncSession, tenant_id: uuid.UUID) -> None:
        self._session = session
        self._tenant_id = tenant_id

    async def get_for_tenant(self) -> ComunifyVoiceCloningSamplesModel | None:
        """Return voice cloning samples record for this tenant, or None if not started."""
        stmt = select(ComunifyVoiceCloningSamplesModel).where(
            ComunifyVoiceCloningSamplesModel.tenant_id == self._tenant_id,
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def save(self, samples: ComunifyVoiceCloningSamplesModel) -> None:
        """Persist the voice cloning samples record."""
        self._session.add(samples)
        await self._session.flush()
        logger.info(
            "voice_cloning_samples_saved",
            samples_id=str(samples.id),
            tenant_id=str(self._tenant_id),
            chats_count=samples.chats_count,
        )

    async def increment_counts(
        self,
        *,
        chats_delta: int = 0,
        voice_notes_delta: int = 0,
        upload_history_entry: dict | None = None,
    ) -> bool:
        """Increment chat/voice note counts atomically. Returns True if updated."""
        now = datetime.now(timezone.utc)

        # Load current record to apply increment (optimistic for singleton)
        existing = await self.get_for_tenant()
        if existing is None:
            return False

        new_chats = existing.chats_count + chats_delta
        new_voice = existing.voice_notes_count + voice_notes_delta
        new_history = list(existing.upload_history or [])
        if upload_history_entry is not None:
            new_history.append(upload_history_entry)

        stmt = (
            update(ComunifyVoiceCloningSamplesModel)
            .where(
                ComunifyVoiceCloningSamplesModel.tenant_id == self._tenant_id,
            )
            .values(
                chats_count=new_chats,
                voice_notes_count=new_voice,
                upload_history=new_history,
                updated_at=now,
            )
        )
        result = await self._session.execute(stmt)
        await self._session.flush()
        return result.rowcount > 0

    async def mark_raw_samples_deleted(self) -> bool:
        """Mark raw samples as purged post-distillation (D15 data minimization). Returns True if updated."""
        now = datetime.now(timezone.utc)
        stmt = (
            update(ComunifyVoiceCloningSamplesModel)
            .where(
                ComunifyVoiceCloningSamplesModel.tenant_id == self._tenant_id,
            )
            .values(
                raw_samples_deleted_at=now,
                updated_at=now,
            )
        )
        result = await self._session.execute(stmt)
        await self._session.flush()
        return result.rowcount > 0
