"""MessageRepository — dual-scope async repository (T-inbox-be-2).

Inherits CompoundScopeRepositoryBase with scope_field="clinic_id" to enforce
the HIPAA-lite dual filter: tenant_id AND clinic_id on every query.

Custom methods:
- list_for_conversation(): paginated message list ordered by sent_at ASC
- soft_delete():           set deleted_at (NEVER hard DELETE)

PHI obligations (hipaa-lite.md § Regla cardinal):
1. tenant_id + clinic_id dual filter mandatory (via CompoundScopeRepositoryBase)
2. transcription_text is PHI — sanitize before logs (service layer enforces)
3. Soft delete only — no hard DELETE ever

downstream-regression-na: brand-local vitalia CRM infrastructure repo
"""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

import structlog
from luana_core_platform.repositories.compound_scope_repository import (
    CompoundScopeRepositoryBase,
)
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.vitalia.crm.infrastructure.persistence.models.message_model import (
    MessageModel,
)

logger = structlog.get_logger()


class MessageRepository(CompoundScopeRepositoryBase[MessageModel, UUID]):
    """Async repository for vitalia_messages.

    Dual-scope isolation: tenant_id + clinic_id (scope_field='clinic_id').
    Every query automatically filters both axes + excludes soft-deleted rows.
    """

    MODEL = MessageModel

    def __init__(self, *, session: AsyncSession) -> None:
        """Initialize with clinic_id as the secondary scope axis.

        Args:
            session: Async SQLAlchemy session (injected by DI).
        """
        super().__init__(session=session, scope_field="clinic_id")

    async def list_for_conversation(
        self,
        *,
        conversation_id: UUID,
        tenant_id: UUID,
        clinic_id: UUID,
        limit: int = 50,
        offset: int = 0,
    ) -> list[MessageModel]:
        """List messages for a conversation, ordered chronologically (sent_at ASC).

        PHI dual filter applied: tenant_id AND clinic_id mandatory.
        Soft-deleted messages excluded automatically.

        Args:
            conversation_id: UUID of the parent conversation.
            tenant_id:       Root tenant UUID.
            clinic_id:       Clinic UUID (HIPAA-lite second scope filter).
            limit:           Page size. Default 50.
            offset:          Page offset. Default 0.

        Returns:
            List of MessageModel instances ordered by sent_at ASC.
        """
        scope_attr = self._scope_attr()
        stmt = (
            select(MessageModel)
            .where(MessageModel.conversation_id == conversation_id)
            .where(MessageModel.tenant_id == tenant_id)
            .where(scope_attr == clinic_id)
            .where(MessageModel.deleted_at.is_(None))
            .order_by(MessageModel.sent_at.asc())
            .offset(offset)
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        rows = list(result.scalars().all())
        logger.debug(
            "message_repo.list_for_conversation",
            conversation_id=str(conversation_id),
            tenant_id=str(tenant_id),
            clinic_id=str(clinic_id),
            count=len(rows),
        )
        return rows

    async def soft_delete(
        self,
        *,
        message_id: UUID,
        tenant_id: UUID,
        clinic_id: UUID,
    ) -> bool:
        """Soft-delete a message by setting deleted_at = now().

        PHI dual filter applied: only deletes row with matching
        tenant_id AND clinic_id. Never issues a hard DELETE.

        Args:
            message_id: UUID of the message to soft-delete.
            tenant_id:  Root tenant UUID.
            clinic_id:  Clinic UUID (HIPAA-lite second scope filter).

        Returns:
            True if the row was updated (rowcount == 1).
            False if not found or wrong tenant/clinic scope.
        """
        scope_attr = self._scope_attr()
        now = datetime.now(tz=timezone.utc)
        stmt = (
            update(MessageModel)
            .where(MessageModel.id == message_id)
            .where(MessageModel.tenant_id == tenant_id)
            .where(scope_attr == clinic_id)
            .where(MessageModel.deleted_at.is_(None))
            .values(deleted_at=now, updated_at=now)
        )
        result = await self._session.execute(stmt)
        success = result.rowcount == 1  # type: ignore[union-attr]
        logger.info(
            "message_repo.soft_delete",
            message_id=str(message_id),
            tenant_id=str(tenant_id),
            clinic_id=str(clinic_id),
            success=success,
        )
        return success
