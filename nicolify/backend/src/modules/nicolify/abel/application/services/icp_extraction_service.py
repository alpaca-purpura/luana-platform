# cap: abel/icp-buyer  # noqa: ERA001
"""IcpExtractionService — draft-first extraction entry point (T-AG-1 · agentic).

Orchestrates the one-shot seed→draft flow the API exposes:

    POST /icp/extract  → start(tenant_id, request) → job_id (status=analizando)
    GET  /icp/extract/{job_id} → get_job(tenant_id, job_id) → status (analizando|done|failed)

Responsibilities:
- **Async job** (NF-res-extract): ``start`` launches the extraction as a background task
  and returns immediately. The FE polls ``get_job``. Timeout/error → status=failed (no
  infinite spinner). The job store is an in-memory process singleton (KISS — one-shot
  extraction, no durable queue needed).
- **Tenant isolation (RN-1 · EV-6)**: every job is keyed by ``(tenant_id, job_id)``.
  A poll with a mismatched tenant cannot see another tenant's job. Persistence writes
  carry tenant_id end-to-end.
- **Draft-first persist (RN-3 · EV-2)**: on success the ICP(s) + buyer(s) persist with
  ``status=borrador, origin=draft``. NEVER auto-listo (least-privilege).
- **Audit row (RN-10 · EV-5)**: each persisted draft writes ``propose_icp_draft`` into
  ``nicolify_growth_studio_event`` — agent=abel, hashed ids, counts, NO raw seed text.
- **Cost (best-effort)**: token usage → engine ``calculate_cost`` (consume, NEVER recreate).
  A cost-recording failure NEVER breaks the extraction (try/except + structlog warning).

Persistence is INJECTED via a ``persister`` port so the agentic tests stay hermetic
(in-memory fake), while production wires the real brand-local repos + emitter.
"""

from __future__ import annotations

import asyncio
import hashlib
import uuid
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Protocol
from uuid import UUID

import structlog

from src.modules.nicolify.abel.application.dtos.extraction_dtos import (
    IcpExtractJobResponse,
    IcpExtractRequest,
)
from src.modules.nicolify.abel.domain.buyer import Buyer, DecisionPower
from src.modules.nicolify.abel.domain.icp import Icp, IcpOrigin, IcpStatus
from src.modules.nicolify.abel.extraction.orchestrator import (
    ExtractionError,
    IcpExtractionOrchestrator,
)

if TYPE_CHECKING:
    from src.modules.nicolify.abel.extraction.orchestrator import ExtractionOutcome, LlmUsage
    from src.modules.nicolify.abel.extraction.schema import ExtractedBuyer, ExtractedIcp

logger = structlog.get_logger()

# Telemetry / audit event name for the extractor write (RN-10).
AUDIT_EVENT = "propose_icp_draft"
TELEMETRY_EVENT = "abel_icp_draft_proposed"

_VALID_DECISION_POWERS = {p.value for p in DecisionPower}


def _hash_id(value: UUID | str) -> str:
    """SHA-256 (first 16 hex) — for audit/telemetry props without exposing raw ids."""
    return hashlib.sha256(str(value).encode()).hexdigest()[:16]


# ─────────────────────────────────────────────────────────────────────────────
# Persistence port (injected — hermetic tests inject an in-memory fake)
# ─────────────────────────────────────────────────────────────────────────────


class ExtractionPersister(Protocol):
    """Persists an extracted draft (ICP + buyers) + audit row, tenant-scoped.

    Implementations MUST write ONLY in ``tenant_id`` (RN-1) with ``status=borrador,
    origin=draft`` (RN-3) and emit the ``propose_icp_draft`` audit row (RN-10).
    """

    async def persist_draft(
        self,
        tenant_id: UUID,
        icps: list[Icp],
        buyers_by_icp: dict[UUID, list[Buyer]],
    ) -> None:
        """Persist the draft ICP(s) + buyer(s) + audit row in one tenant-scoped unit."""
        ...


# ─────────────────────────────────────────────────────────────────────────────
# Job state (in-memory process singleton)
# ─────────────────────────────────────────────────────────────────────────────


@dataclass
class _Job:
    """In-flight / finished extraction job (tenant-scoped)."""

    job_id: UUID
    tenant_id: UUID
    status: str = "analizando"  # analizando | done | failed
    icp_id: UUID | None = None
    task: asyncio.Task | None = field(default=None, repr=False)


class IcpExtractionService:
    """Async draft-first extraction service (one-shot, tenant-isolated)."""

    def __init__(
        self,
        orchestrator: IcpExtractionOrchestrator,
        persister: ExtractionPersister,
        cost_recorder: CostRecorder | None = None,
    ) -> None:
        """Initialize with an orchestrator (LLM), a persister (port), and optional cost recorder."""
        self._orchestrator = orchestrator
        self._persister = persister
        self._cost_recorder = cost_recorder or _NoopCostRecorder()
        # Job store keyed by (tenant_id, job_id) — RN-1 tenant isolation at the poll layer.
        self._jobs: dict[tuple[UUID, UUID], _Job] = {}

    # ── public API ──────────────────────────────────────────────────────────

    async def start(self, tenant_id: UUID, request: IcpExtractRequest) -> IcpExtractJobResponse:
        """Start the extraction as a background task; return immediately (analizando)."""
        job_id = uuid.uuid4()
        job = _Job(job_id=job_id, tenant_id=tenant_id, status="analizando")
        self._jobs[(tenant_id, job_id)] = job

        seed_text = self._seed_text(request)
        job.task = asyncio.create_task(self._run_job(tenant_id, job_id, seed_text))
        return IcpExtractJobResponse(job_id=job_id, status="analizando", icp_id=None)

    async def get_job(self, tenant_id: UUID, job_id: UUID) -> IcpExtractJobResponse | None:
        """Poll job status — RN-1: only the owning tenant can see its job (else None → 404)."""
        job = self._jobs.get((tenant_id, job_id))
        if job is None:
            return None
        return IcpExtractJobResponse(job_id=job.job_id, status=job.status, icp_id=job.icp_id)

    async def run_to_completion(self, tenant_id: UUID, request: IcpExtractRequest) -> IcpExtractJobResponse:
        """Test/eval helper: start + await the background task + return the final status.

        Production uses start + poll; tests use this to assert the terminal state
        deterministically without sleeping.
        """
        started = await self.start(tenant_id, request)
        job = self._jobs[(tenant_id, started.job_id)]
        if job.task is not None:
            await job.task
        return await self.get_job(tenant_id, started.job_id)  # type: ignore[return-value]

    # ── internals ────────────────────────────────────────────────────────────

    @staticmethod
    def _seed_text(request: IcpExtractRequest) -> str:
        """Resolve the seed text from the request (url/text/file).

        For url/file modes the upstream fetch/parse is out of T-AG-1 scope (FE/storage);
        here the payload carries the resolved text (or the URL string, which the extractor
        treats as a thin seed). file_ref without payload → empty (thin-seed path).
        """
        return request.payload or ""

    async def _run_job(self, tenant_id: UUID, job_id: UUID, seed_text: str) -> None:
        """Background task body: extract → persist draft → audit → cost. Failure → failed."""
        job = self._jobs.get((tenant_id, job_id))
        if job is None:  # defensive — never happens (we just created it)
            return
        try:
            outcome = await self._orchestrator.run(seed_text)
        except ExtractionError:
            job.status = "failed"  # NF-res-extract — no ICP persisted, hoja intact
            return
        except Exception:  # noqa: BLE001 — any unexpected error → failed (never hangs)
            logger.warning("abel_extraction_unexpected_error", tenant_id=str(tenant_id))
            job.status = "failed"
            return

        try:
            icp_id = await self._persist(tenant_id, outcome)
        except Exception:  # noqa: BLE001 — persistence error → failed (extraction is best-effort)
            logger.warning("abel_extraction_persist_failed", tenant_id=str(tenant_id))
            job.status = "failed"
            return

        # Cost recording is best-effort — it NEVER flips a successful job to failed.
        await self._cost_recorder.record(tenant_id, outcome.usage)

        job.icp_id = icp_id
        job.status = "done"

    async def _persist(self, tenant_id: UUID, outcome: ExtractionOutcome) -> UUID | None:
        """Map extracted draft → domain entities (borrador/draft) and persist (RN-3 + RN-10)."""
        icps: list[Icp] = []
        buyers_by_icp: dict[UUID, list[Buyer]] = {}

        for extracted_icp in outcome.result.icps:
            icp = self._map_icp(tenant_id, extracted_icp)
            if icp is None:
                continue
            icps.append(icp)
            buyers_by_icp[icp.id] = [
                b for b in (self._map_buyer(tenant_id, icp.id, eb) for eb in extracted_icp.buyers) if b is not None
            ]

        if not icps:
            # Thin seed with zero extractable ICP → nothing persisted; job still 'done'
            # (the FE shows the skeleton/asks). No audit row (nothing written).
            logger.info("abel_extraction_no_icp", tenant_id=str(tenant_id))
            return None

        await self._persister.persist_draft(tenant_id, icps, buyers_by_icp)
        return icps[0].id

    @staticmethod
    def _map_icp(tenant_id: UUID, extracted: ExtractedIcp) -> Icp | None:
        """Map an extracted ICP → brand-local Icp (borrador/draft). Drop if label-less."""
        label = (extracted.label or "").strip()
        if not label:
            return None
        return Icp(
            id=uuid.uuid4(),
            tenant_id=tenant_id,
            label=label[:160],
            description=extracted.description,
            vertical=extracted.vertical,
            company_size=extracted.company_size,
            geo=extracted.geo,
            business_model=extracted.business_model,
            avg_ticket=None,  # NEVER extracted as a number (anti-hallucination · SC-edge-thin-seed)
            avg_ticket_currency=None,
            sales_cycle=extracted.sales_cycle,
            main_pain=extracted.main_pain,
            sales_angle=extracted.sales_angle,
            signals=list(extracted.signals or []),
            anti_pattern=extracted.anti_pattern,
            status=IcpStatus.BORRADOR,  # RN-3 — draft-first, never auto-listo
            origin=IcpOrigin.DRAFT,  # RN-3 — extracted by Abel
        )

    @staticmethod
    def _map_buyer(tenant_id: UUID, icp_id: UUID, extracted: ExtractedBuyer) -> Buyer | None:
        """Map an extracted buyer → brand-local Buyer. Drop if name-less."""
        name = (extracted.name or "").strip()
        if not name:
            return None
        dp = extracted.decision_power if extracted.decision_power in _VALID_DECISION_POWERS else None
        return Buyer(
            id=uuid.uuid4(),
            tenant_id=tenant_id,
            icp_id=icp_id,
            name=name[:200],
            role=extracted.role,
            decision_power=DecisionPower(dp) if dp else None,
            is_primary=False,
            demographics=dict(extracted.demographics or {}),
            psychographics=dict(extracted.psychographics or {}),
            pain_points=list(extracted.pain_points or []),
            desires=list(extracted.desires or []),
            objections=list(extracted.objections or []),
            buyer_journey=dict(extracted.buyer_journey or {}),
            purchase_triggers=list(extracted.purchase_triggers or []),
            preferred_channels=list(extracted.preferred_channels or []),
        )


# ─────────────────────────────────────────────────────────────────────────────
# Cost recorder port (best-effort · consume engine calculate_cost, NEVER recreate)
# ─────────────────────────────────────────────────────────────────────────────


class CostRecorder(Protocol):
    """Records LLM cost best-effort. MUST NOT break the extraction on failure."""

    async def record(self, tenant_id: UUID, usage: LlmUsage) -> None:
        """Record token usage + computed cost for this extraction call."""
        ...


class _NoopCostRecorder:
    """Default cost recorder when none is wired (tests / minimal envs)."""

    async def record(self, tenant_id: UUID, usage: LlmUsage) -> None:
        """No-op — used when cost recording is not configured."""
        return
