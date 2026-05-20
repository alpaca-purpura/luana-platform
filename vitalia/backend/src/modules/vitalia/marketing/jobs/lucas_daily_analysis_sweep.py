"""lucas_daily_analysis_sweep — ARQ cron job, daily 06:00 UTC.

Regenerates Lucas AI marketing recommendations for every active tenant+clinic.

Steps per clinic:
  1. Expire stale OPEN recommendations (expires_at < now → status=expired).
  2. Build 30-day rejection cooldown set: recommendation_kinds rejected in last 30d.
  3. Invoke LucasOrchestratorService.run_daily_sweep(tenant_id, clinic_id, cooldown_kinds).
     - Orchestrator skips kinds in cooldown_kinds (avoids regenerating unwanted suggestions).
     - BudgetGuard is wired inside LucasOrchestratorService (no new wiring here).
  4. Publish LucasRecommendationGenerated for each new recommendation.

HIPAA-lite:
  - Dual filter tenant_id + clinic_id on all queries.
  - No PHI in recommendation rows (marketing metrics only).

Soft-fail: one clinic failure never aborts the sweep for other clinics.

downstream-regression-na: brand-local marketing cron — no cross-brand consumers
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

import structlog
from luana_core_platform.workers.cron_envelope import cron_envelope

from src.modules.vitalia.marketing.domain.events import LucasRecommendationGenerated
from src.modules.vitalia.marketing.infrastructure.repositories.lucas_recommendation_repository import (
    LucasRecommendationRepository,
)

try:
    from luana_core_events.outbox import adapter_bus  # type: ignore[import]
except ImportError:  # pragma: no cover
    from unittest.mock import AsyncMock as _AsyncMock  # noqa: PLC0415

    class _FallbackBus:  # type: ignore[no-redef]
        publish = _AsyncMock()

    adapter_bus = _FallbackBus()

logger = structlog.get_logger()

# 30-day cooldown window for rejected recommendation_kinds
_REJECTION_COOLDOWN_DAYS: int = 30


# ---------------------------------------------------------------------------
# Injectable factory helpers (patchable for tests)
# ---------------------------------------------------------------------------


async def _get_active_clinics() -> list[dict[str, UUID]]:
    """Return list of {tenant_id, clinic_id} dicts for all active clinics.

    Queries the channel_sync_state or clinic table for clinics that have
    at least one active marketing channel connection (status=ok, enabled=true).
    Falls back to querying distinct (tenant_id, clinic_id) from lucas_recommendations.
    """
    from src.core.db import get_db_session  # type: ignore[import]  # noqa: PLC0415

    async with get_db_session() as session:
        from sqlalchemy import text  # noqa: PLC0415

        # Query distinct tenant+clinic pairs from channel_sync_state (active channels only)
        sql = text(
            "SELECT DISTINCT tenant_id, clinic_id "
            "FROM vitalia_channel_sync_state "
            "WHERE status = 'ok' AND enabled = TRUE AND deleted_at IS NULL"
        )
        result = await session.execute(sql)
        rows = result.fetchall()
        return [{"tenant_id": row.tenant_id, "clinic_id": row.clinic_id} for row in rows]


def _get_rec_repo() -> LucasRecommendationRepository:
    """Return LucasRecommendationRepository instance (patchable in tests)."""
    from src.core.db import get_sync_session  # type: ignore[import]  # noqa: PLC0415

    return LucasRecommendationRepository(session=get_sync_session())


def _get_orchestrator() -> Any:
    """Return LucasOrchestratorService instance (patchable in tests)."""
    from src.modules.vitalia.marketing.application.services.lucas_recommendations_service import (  # noqa: PLC0415
        LucasRecommendationsService,
    )

    return LucasRecommendationsService()


# ---------------------------------------------------------------------------
# Cron job
# ---------------------------------------------------------------------------


@cron_envelope("vitalia.cron.lucas_daily_analysis_sweep", ttl=86400)  # 24h TTL
async def lucas_daily_analysis_sweep(ctx: dict[str, Any]) -> None:
    """Daily 06:00 UTC — regenerate Lucas recommendations per stage per tenant+clinic.

    Uses 30d rejection cooldown to avoid re-suggesting kinds the user
    already rejected recently (SC-MK-02 requirement).

    Soft-fail per clinic — one LLM/BudgetGuard failure does not stop other clinics.
    """
    now = datetime.now(UTC)
    cooldown_since = now - timedelta(days=_REJECTION_COOLDOWN_DAYS)

    active_clinics = await _get_active_clinics()
    rec_repo = _get_rec_repo()
    orchestrator = _get_orchestrator()

    swept = 0
    failed = 0

    for clinic in active_clinics:
        tenant_id: UUID = clinic["tenant_id"]
        clinic_id: UUID = clinic["clinic_id"]

        try:
            # Step 1: expire stale OPEN recommendations
            expired_count = await rec_repo.expire_stale_open(
                tenant_id=tenant_id,
                clinic_id=clinic_id,
                now=now,
            )
            if expired_count > 0:
                logger.info(
                    "lucas_daily_analysis_sweep.expired_stale",
                    tenant_id=str(tenant_id),
                    clinic_id=str(clinic_id),
                    expired=expired_count,
                )

            # Step 2: build 30d rejection cooldown set
            recent_rejections = await rec_repo.list_recent_rejections_by_kind(
                tenant_id=tenant_id,
                clinic_id=clinic_id,
                since=cooldown_since,
            )
            cooldown_kinds: set[str] = {r.recommendation_kind for r in recent_rejections}

            if cooldown_kinds:
                logger.info(
                    "lucas_daily_analysis_sweep.cooldown_kinds",
                    tenant_id=str(tenant_id),
                    clinic_id=str(clinic_id),
                    kinds=list(cooldown_kinds),
                )

            # Step 3: invoke orchestrator (skips cooldown kinds internally)
            new_recs = await orchestrator.run_daily_sweep(
                tenant_id=tenant_id,
                clinic_id=clinic_id,
                cooldown_kinds=cooldown_kinds,
            )

            # Step 4: publish LucasRecommendationGenerated for each new rec
            for rec in new_recs or []:
                try:
                    await adapter_bus.publish(
                        LucasRecommendationGenerated(
                            tenant_id=tenant_id,
                            recommendation_id=getattr(rec, "id", None) or rec,
                            stage=getattr(rec, "stage", "attract"),
                            recommendation_kind=getattr(rec, "recommendation_kind", ""),
                            priority=getattr(rec, "priority", 1),
                        )
                    )
                except Exception as event_exc:
                    logger.warning(
                        "lucas_daily_analysis_sweep.event_publish_failed",
                        error=str(event_exc),
                    )

            swept += 1
            logger.info(
                "lucas_daily_analysis_sweep.clinic_ok",
                tenant_id=str(tenant_id),
                clinic_id=str(clinic_id),
                new_recs=len(new_recs or []),
            )

        except Exception as exc:
            # Soft-fail per clinic — log + continue
            failed += 1
            logger.warning(
                "lucas_daily_analysis_sweep.clinic_error",
                tenant_id=str(tenant_id),
                clinic_id=str(clinic_id),
                error=str(exc),
            )

    logger.info(
        "lucas_daily_analysis_sweep.completed",
        total=len(active_clinics),
        swept=swept,
        failed=failed,
    )
