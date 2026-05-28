# cap: crm.crm-consent-optout
# story-origin: TBD
"""ActivityEventRepository — dual-scope async repository (T-inbox-be-2).

Inherits CompoundScopeRepositoryBase with scope_field="clinic_id" to enforce
the HIPAA-lite dual filter: tenant_id AND clinic_id on every query.

Custom methods:
- list_for_activity_stream(): last 8 events per conversation (SC-01)

Activity events are append-only projections — no update/delete methods.
PHI sanitization enforced at service layer before write (payload_sanitized field).

PHI obligations (hipaa-lite.md § Regla cardinal):
1. tenant_id + clinic_id dual filter mandatory (via CompoundScopeRepositoryBase)
2. payload_sanitized: PII already scrubbed by service before write
3. description_es: never contains raw PHI (uses 'el paciente' / offer names)

downstream-regression-na: brand-local vitalia CRM infrastructure repo
"""

from __future__ import annotations

from uuid import UUID

import structlog
from luana_core_platform.repositories.compound_scope_repository import (
    CompoundScopeRepositoryBase,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.vitalia.crm.infrastructure.persistence.models.activity_event_model import (
    ActivityEventModel,
)

logger = structlog.get_logger()

# SC-01: ActivityStream shows 8 last events
_ACTIVITY_STREAM_LIMIT = 8


class ActivityEventRepository(CompoundScopeRepositoryBase[ActivityEventModel, UUID]):
    """Async repository for vitalia_activity_events.

    Dual-scope isolation: tenant_id + clinic_id (scope_field='clinic_id').
    Every query automatically filters both axes.

    ActivityEvent is append-only — no soft-delete or update methods.
    (Corrections are new events with a correction event_kind.)
    """

    MODEL = ActivityEventModel

    def __init__(self, *, session: AsyncSession) -> None:
        """Initialize with clinic_id as the secondary scope axis.

        Args:
            session: Async SQLAlchemy session (injected by DI).
        """
        super().__init__(session=session, scope_field="clinic_id")

    async def list_for_activity_stream(
        self,
        *,
        conversation_id: UUID,
        tenant_id: UUID,
        clinic_id: UUID,
        limit: int = _ACTIVITY_STREAM_LIMIT,
    ) -> list[ActivityEventModel]:
        """List the most recent activity events for a conversation (ActivityStream UI).

        Returns at most `limit` events (default 8 per SC-01), ordered by
        occurred_at DESC (most recent first). PHI dual filter applied.

        Args:
            conversation_id: UUID of the parent conversation.
            tenant_id:       Root tenant UUID.
            clinic_id:       Clinic UUID (HIPAA-lite second scope filter).
            limit:           Maximum events to return. Default 8 (SC-01 spec).

        Returns:
            List of ActivityEventModel instances ordered by occurred_at DESC.
        """
        scope_attr = self._scope_attr()
        stmt = (
            select(ActivityEventModel)
            .where(ActivityEventModel.conversation_id == conversation_id)
            .where(ActivityEventModel.tenant_id == tenant_id)
            .where(scope_attr == clinic_id)
            .order_by(ActivityEventModel.occurred_at.desc())
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        rows = list(result.scalars().all())
        logger.debug(
            "activity_event_repo.list_for_activity_stream",
            conversation_id=str(conversation_id),
            tenant_id=str(tenant_id),
            clinic_id=str(clinic_id),
            count=len(rows),
        )
        return rows
