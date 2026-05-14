"""Async repository — ComunifyCommunityAuditLogModel.

All queries filter by tenant_id (mandatory, per tenant-isolation.md).
Audit log records are immutable (no soft delete, no update) — 5-year retention.
Best-effort writes: callers wrap in try/except to ensure compliance events never
break the main request path.
"""

from __future__ import annotations

import uuid
from datetime import datetime

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.comunify.infrastructure.models.community_audit_log_model import (
    ComunifyCommunityAuditLogModel,
)

logger = structlog.get_logger()


class CommunityAuditLogRepository:
    """Tenant-scoped async repository for ComunifyCommunityAuditLogModel.

    Immutable append-only records — no soft delete, no status updates.
    tenant_id is injected at construction time; every method enforces isolation.

    Best-effort pattern: callers MUST wrap save() in try/except to avoid
    audit logging failures breaking the main request path. Per § 9.8 arch.
    """

    def __init__(self, session: AsyncSession, tenant_id: uuid.UUID) -> None:
        self._session = session
        self._tenant_id = tenant_id

    async def list_by_tenant(
        self,
        *,
        event_type: str | None = None,
        severity: str | None = None,
        from_dt: datetime | None = None,
        to_dt: datetime | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[ComunifyCommunityAuditLogModel]:
        """List audit events for this tenant, most recent first.

        Supports filtering by event_type, severity, and date range.
        """
        conditions = [
            ComunifyCommunityAuditLogModel.tenant_id == self._tenant_id,
        ]
        if event_type is not None:
            conditions.append(ComunifyCommunityAuditLogModel.event_type == event_type)
        if severity is not None:
            conditions.append(ComunifyCommunityAuditLogModel.severity == severity)
        if from_dt is not None:
            conditions.append(ComunifyCommunityAuditLogModel.created_at >= from_dt)
        if to_dt is not None:
            conditions.append(ComunifyCommunityAuditLogModel.created_at <= to_dt)

        stmt = (
            select(ComunifyCommunityAuditLogModel)
            .where(*conditions)
            .order_by(ComunifyCommunityAuditLogModel.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def save(self, event: ComunifyCommunityAuditLogModel) -> None:
        """Append a new audit event (immutable, best-effort).

        Callers MUST wrap this in try/except — audit logging must never
        break the main request path per ComplianceEventService.log_event() contract.
        """
        self._session.add(event)
        await self._session.flush()
        logger.debug(
            "community_audit_event_saved",
            event_id=str(event.id),
            event_type=event.event_type,
            severity=event.severity,
            tenant_id=str(self._tenant_id),
        )
