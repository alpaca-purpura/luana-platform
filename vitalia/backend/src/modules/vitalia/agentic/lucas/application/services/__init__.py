# cap: agentic.eval-goldens-slice-1
# atomics: TBD
# story-origin: TBD
"""Lucas agentic application services — factory helpers.

`make_orchestrator` provides a minimal no-deps wiring of
`LucasOrchestratorService` for callers (cron jobs) that do not own full
service-layer DI (e.g. the daily-sweep cron which runs outside FastAPI
request context).

The factory uses no-op async stubs for the three handler protocols so
that the cron can call `orchestrator.run_daily_analysis(...)` and receive
a real `AnalysisReport` containing whatever the LangGraph graph produces
with those stubs.  Production uses the real handlers wired with DB sessions
from within the cron DB context; this factory is intentionally minimal.

downstream-regression-na: brand-local factory; no cross-brand consumers.
"""

from __future__ import annotations

import datetime as dt
from typing import Any
from uuid import UUID

from src.modules.vitalia.agentic.lucas.application.services.lucas_orchestrator_service import (
    AnalysisReport,
    LucasOrchestratorService,
    TenantLocaleProtocol,
)

try:
    from langgraph.checkpoint.memory import MemorySaver as _MemorySaver  # type: ignore[import]
except ImportError:  # pragma: no cover
    _MemorySaver = None  # type: ignore[assignment,misc]


async def _noop_stage_handler(
    *,
    tenant_id: UUID,  # noqa: ARG001
    clinic_id: UUID,  # noqa: ARG001
    stage: Any,  # noqa: ARG001
    period: str,  # noqa: ARG001
) -> dict[str, Any]:
    """No-op stage handler — graph node returns empty dict."""
    return {}


async def _noop_attribution_handler(
    *,
    tenant_id: UUID,  # noqa: ARG001
    clinic_id: UUID,  # noqa: ARG001
    period_start: dt.date,  # noqa: ARG001
    period_end: dt.date,  # noqa: ARG001
) -> dict[str, Any]:
    """No-op attribution handler — graph node returns empty dict."""
    return {}


async def _noop_referrals_handler(
    *,
    tenant_id: UUID,  # noqa: ARG001
    clinic_id: UUID,  # noqa: ARG001
    period_start: dt.date,  # noqa: ARG001
    period_end: dt.date,  # noqa: ARG001
    limit: int,  # noqa: ARG001
) -> dict[str, Any]:
    """No-op referrals handler — graph node returns empty dict."""
    return {}


def make_orchestrator() -> LucasOrchestratorService:
    """Construct a `LucasOrchestratorService` with no-op handlers.

    Intended for callers (cron jobs) that run outside request-scoped DI.
    Uses `MemorySaver` as the LangGraph checkpointer (in-memory, sufficient
    for daily-sweep single-process runs).

    Returns:
        Fully wired `LucasOrchestratorService` ready for `run_daily_analysis`.

    Raises:
        ImportError: If `langgraph` is not installed (should not happen in
                     production — langgraph is a required dep).
    """
    if _MemorySaver is None:  # pragma: no cover
        raise ImportError("langgraph is required but not installed")
    return LucasOrchestratorService(
        stage_handler=_noop_stage_handler,
        attribution_handler=_noop_attribution_handler,
        referrals_handler=_noop_referrals_handler,
        checkpointer=_MemorySaver(),
    )


__all__ = [
    "AnalysisReport",
    "LucasOrchestratorService",
    "TenantLocaleProtocol",
    "make_orchestrator",
]
