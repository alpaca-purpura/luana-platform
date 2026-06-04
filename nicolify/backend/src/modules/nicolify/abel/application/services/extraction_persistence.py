# cap: abel/icp-buyer  # noqa: ERA001
"""Production persistence + cost adapters for the draft-first extractor (T-AG-1).

Wires the abstract ports of ``IcpExtractionService`` to the real brand-local
infrastructure:

- ``SqlAlchemyExtractionPersister`` — persists the draft ICP(s) + buyer(s) via the
  existing async repos (RN-3 borrador/draft), and writes the ``propose_icp_draft``
  audit row (RN-10) via ``GrowthStudioEmitter`` (hashed ids, counts, NO raw seed).
  Each background extraction runs in its OWN ``AsyncSession`` (the request session is
  gone by the time the task runs), provided by an injected session factory.

- ``EngineCostRecorder`` — best-effort cost recording. Consumes the engine
  ``calculate_cost`` (NEVER recreate cost math · anti-duplication). Attribution lands
  in ``nicolify_growth_studio_event`` (brand-local telemetry); a failure NEVER breaks
  the extraction (try/except + structlog warning).
"""

from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

import structlog

from src.modules.nicolify.abel.application.services.icp_extraction_service import (
    AUDIT_EVENT,
    TELEMETRY_EVENT,
    _hash_id,
)
from src.modules.nicolify.abel.application.telemetry.growth_studio_emitter import (
    GrowthStudioEmitter,
)
from src.modules.nicolify.abel.infrastructure.repositories.buyer_repository import (
    SqlAlchemyBuyerRepository,
)
from src.modules.nicolify.abel.infrastructure.repositories.icp_repository import (
    SqlAlchemyIcpRepository,
)

if TYPE_CHECKING:
    from collections.abc import Callable
    from contextlib import AbstractAsyncContextManager
    from uuid import UUID

    from sqlalchemy.ext.asyncio import AsyncSession

    from src.modules.nicolify.abel.domain.buyer import Buyer
    from src.modules.nicolify.abel.domain.icp import Icp
    from src.modules.nicolify.abel.extraction.orchestrator import LlmUsage

logger = structlog.get_logger()

# Type of the session factory: a callable returning an async context manager yielding a session.
SessionFactory = "Callable[[], AbstractAsyncContextManager[AsyncSession]]"


class SqlAlchemyExtractionPersister:
    """Persists a draft (ICP + buyers) + audit row in its own AsyncSession (RN-3 + RN-10)."""

    def __init__(self, session_factory: Callable[[], AbstractAsyncContextManager[AsyncSession]]) -> None:
        """Initialize with a session factory (each persist runs in a fresh session)."""
        self._session_factory = session_factory

    async def persist_draft(
        self,
        tenant_id: UUID,
        icps: list[Icp],
        buyers_by_icp: dict[UUID, list[Buyer]],
    ) -> None:
        """Persist draft ICP(s) + buyer(s) + ``propose_icp_draft`` audit row, tenant-scoped."""
        async with self._session_factory() as session:
            icp_repo = SqlAlchemyIcpRepository(session)
            buyer_repo = SqlAlchemyBuyerRepository(session)
            emitter = GrowthStudioEmitter(session)

            buyer_count = 0
            for icp in icps:
                await icp_repo.create(tenant_id, icp)  # RN-1 tenant-scoped, RN-3 borrador/draft
                for buyer in buyers_by_icp.get(icp.id, []):
                    await buyer_repo.create(tenant_id, buyer)
                    buyer_count += 1

                # RN-10: audit row per persisted ICP — agent=abel, action, hashed ids, NO seed text.
                await emitter.emit(
                    tenant_id=tenant_id,
                    event_name=AUDIT_EVENT,
                    props={
                        "agent": "abel",
                        "action": AUDIT_EVENT,
                        "icp_id_hash": _hash_id(icp.id),
                        "buyer_count": len(buyers_by_icp.get(icp.id, [])),
                    },
                )

            # Telemetry summary (counts only · no PII · no raw seed).
            await emitter.emit(
                tenant_id=tenant_id,
                event_name=TELEMETRY_EVENT,
                props={"icp_count": len(icps), "buyer_count": buyer_count},
            )
            await session.commit()


class EngineCostRecorder:
    """Best-effort cost recording — consumes engine ``calculate_cost`` (NEVER recreate)."""

    def __init__(self, session_factory: Callable[[], AbstractAsyncContextManager[AsyncSession]]) -> None:
        """Initialize with a session factory for the telemetry write."""
        self._session_factory = session_factory

    async def record(self, tenant_id: UUID, usage: LlmUsage) -> None:
        """Compute cost via engine + emit a cost telemetry row. NEVER breaks the extraction."""
        try:
            cost_usd = self._compute_cost(usage)
            async with self._session_factory() as session:
                emitter = GrowthStudioEmitter(session)
                await emitter.emit(
                    tenant_id=tenant_id,
                    event_name="abel_icp_extraction_cost",
                    props={
                        "agent": "abel",
                        "model": usage.model or "unknown",
                        "input_tokens": usage.input_tokens,
                        "output_tokens": usage.output_tokens,
                        "cost_usd": str(cost_usd) if cost_usd is not None else None,
                    },
                )
                await session.commit()
        except Exception:  # noqa: BLE001 — best-effort: cost failure NEVER breaks the extraction
            logger.warning("abel_extraction_cost_record_failed", tenant_id=str(tenant_id))

    @staticmethod
    def _compute_cost(usage: LlmUsage, pricing: object | None = None) -> Decimal | None:
        """Compute USD cost via the engine ``calculate_cost`` (NEVER recreate cost math).

        ``pricing`` is an engine pricing snapshot (``ModelPricingSnapshotModel`` — has
        ``input_cost_per_token`` / ``output_cost_per_token`` / cache rates). When provided
        (injected by the future S2 budget-gating wiring, which owns the sync pricing
        resolver), we delegate to the engine ``calculate_cost``. When absent, we return
        None: token usage is still recorded, but the cost stays UNATTRIBUTED rather than
        fabricated — honest accounting over a guessed number.
        """
        if pricing is None or not usage.provider or not usage.model:
            return None
        from luana_core_observability.cost.calculator import calculate_cost

        return calculate_cost(
            input_tokens=usage.input_tokens,
            output_tokens=usage.output_tokens,
            cached_read_tokens=0,
            cached_write_tokens=0,
            pricing=pricing,  # type: ignore[arg-type]  # duck-typed _PricingLike protocol
        )
