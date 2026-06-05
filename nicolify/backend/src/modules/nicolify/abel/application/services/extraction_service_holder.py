# cap: abel/icp-buyer  # noqa: ERA001
"""Process-singleton holder for IcpExtractionService (T-AG-1).

The extraction job store is in-memory (KISS — one-shot extraction, no durable queue).
It MUST survive across requests so the FE can POST /icp/extract then poll GET
/icp/extract/{job_id} on later requests. A per-request DI service would lose the job
store between the POST and the poll. Hence: ONE service instance per process, lazily built.

Wires the production adapters:
- orchestrator: real engine LiteLLM router (or stub when RUN_LLM_EXTRACT unset in tests),
- persister: SqlAlchemyExtractionPersister over the app's async session factory,
- cost_recorder: EngineCostRecorder (best-effort, consumes engine calculate_cost).
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import TYPE_CHECKING

from src.modules.nicolify.abel.application.services.extraction_persistence import (
    EngineCostRecorder,
    SqlAlchemyExtractionPersister,
)
from src.modules.nicolify.abel.application.services.icp_extraction_service import (
    IcpExtractionService,
)
from src.modules.nicolify.abel.extraction.orchestrator import IcpExtractionOrchestrator

if TYPE_CHECKING:
    from collections.abc import AsyncIterator

    from sqlalchemy.ext.asyncio import AsyncSession

_service: IcpExtractionService | None = None


@asynccontextmanager
async def _app_session() -> AsyncIterator[AsyncSession]:
    """Fresh AsyncSession for a background extraction task (own lifecycle)."""
    from src.db import _AsyncSessionLocal

    async with _AsyncSessionLocal() as session:
        yield session


def get_extraction_service() -> IcpExtractionService:
    """Return the process-singleton IcpExtractionService (lazy build)."""
    global _service  # noqa: PLW0603 — intentional process singleton (job store survival)
    if _service is None:
        _service = IcpExtractionService(
            orchestrator=IcpExtractionOrchestrator(),
            persister=SqlAlchemyExtractionPersister(_app_session),
            cost_recorder=EngineCostRecorder(_app_session),
        )
    return _service


def set_extraction_service(service: IcpExtractionService | None) -> None:
    """Override the singleton (tests inject a hermetic service; pass None to reset)."""
    global _service  # noqa: PLW0603
    _service = service
