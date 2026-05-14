"""Comunify AGENTIC extractor — `OfferLadderAdvisor` (T-extractors-1, R23 Opus 4.7).

EXTENDS ``luana_core_extraction.base_orchestrator.BaseExtractionOrchestrator`` per
``.claude/rules/anti-duplication.md`` SSoT row (wave-based LLM extraction lift
shared, NOT mirror). Arch fitness gate ``test_extraction_orchestrator_inheritance.py``
validates the subclass invariant.

4-wave pipeline (per 03-arch-agentic § 5.1 / 02-design § 7.1):
  W1  analyze_current_offers     reasoning Sonnet  ≤30 s
  W2  detect_ladder_gaps         reasoning Sonnet  ≤30 s
  W3  generate_suggestions       nano      Haiku   ≤30 s
  W4  validate_and_merge         reasoning Sonnet  ≤25 s

Cost budget: ≤$0.10 USD per advice run (V-AE-8 + 02-design § 14.3). Latency:
p50 18 s / p99 50 s. ASYNC.

Inputs:
  * tenant_id            (R2 isolation — every persistence + Qdrant + outbox + audit)
  * current_offers       Pre-shaped list of {slug, name, price_usd, value, ...} dicts.
                         Empty list → graceful path: returns "no_offers_yet" + suggest
                         bootstrap lead_magnet.
  * creator_niche        e.g. "fitness coaching for women 35-50".
  * country              ISO 3166-1 alpha-2 (e.g. "AR", "MX", "CL"). Drives
                         price_local_hint generation in wave 3.

Side-effects (best-effort, never break extractor turn):
  * Persist advice row via optional ``advice_repo.save_advice(...)``.
  * Index structured JSON to Qdrant per-tenant collection (RAG context) via
    optional ``qdrant_indexer.index_offer_ladder_advice(...)``.
  * Emit ``OfferLadderAdviceGeneratedV1`` domain event via optional ``outbox.publish(...)``.
  * Audit_log ``offer_ladder_advice_generated`` via optional ``audit_log.log(...)``.

All side-effects wrapped in ``try/except + structlog.warning`` per R23 — failure
to persist or index MUST NOT raise extractor exceptions. Extractor turn is
"successful" iff at least one wave produced a partial output (degraded
``confidence_score`` reflects quality).

Tenant isolation (R2): ``tenant_id`` forwarded to every side-effect collaborator.
Cross-tenant boundary enforced at the repo/qdrant/outbox/audit collaborator level
(callers inject tenant-scoped instances).

PII handling:
  * Inputs do not carry user PII (offers are catalog rows, niche + country are
    creator-level metadata). Defensive guard still: payloads sanitized via
    ``sanitize_payload`` before observability writes.
  * The advice itself (suggested offers) is structured data — no PII expected.
    Observability payloads only carry summaries (counts + confidence + cost).

Anti-duplication audit (Step 0 GATE pre-write, 2026-05-14):
  * ``grep -rn "class OfferLadderAdvisor"`` cross luana-platform + AISALESHT
    backend → zero collisions. Only design/arch MDs reference the name.
  * Wave + sleep + progress mechanics consumed from ``BaseExtractionOrchestrator``
    (luana_core_extraction). NEVER re-implemented.
  * ``sanitize_payload`` consumed from ``luana_core_observability.recording.sanitization``
    with a truncate-only fallback (mirrors ``qualify_for_cohort.py`` lazy import
    pattern — observability optional at extractor wire-up boundary).
  * ``pop_cost`` consumed from ``luana_core_observability.recording.cost_recorder``
    (LiteLLM CustomLogger bridge per PI-12 S1 T-1 cement) with same lazy guard.
  * ``LLMClientProtocol`` defined inline (N=2 across comunify — agentic/tools
    has its own copy). Lift-to-shared candidate flagged for follow-up (anti-
    duplication.md threshold N=2 reached — escalate /pm in next ticket).
  * ``_LLMResponse`` mirrors the vitalia primitive (sibling extractor pattern,
    brand-isolated by design; lift only when 3rd vertical surfaces a 3rd
    consumer per shared-abstraction policy).

Spec sources:
  * 02-design-agentic.md § 7.1 (inputs / outputs / side-effects / cost / errors)
  * 03-arch-agentic.md § 5.1 (wave composition + OfferLadderAdviceV1 schema)
  * 04-validators.yaml::V-AE-8
  * 06-tickets.yaml::T-extractors-1 acceptance + decisions D1
  * 05-guidelines.md § 1.10 R23 (production_code AGENTIC → Opus 4.7)
"""

from __future__ import annotations

import asyncio
import json
import time
import uuid
from dataclasses import dataclass
from decimal import Decimal
from typing import Any, Protocol

import structlog
from luana_core_extraction.base_orchestrator import BaseExtractionOrchestrator

from src.modules.comunify.copilot.extractors._schemas import (
    ExtractionWave,
    LadderGap,
    OfferLadderAdviceV1,
    SuggestedOffer,
    TierOptimization,
)

logger = structlog.get_logger(__name__)

# ─── Configuration constants ─────────────────────────────────────────────


# Confidence weighting per wave (sums to 1.0). Wave 4 (validate_and_merge) only
# adjusts via validation_score_adjustment — it does NOT contribute base score.
_WAVE_CONFIDENCE_WEIGHTS: dict[str, float] = {
    "analyze_current_offers": 0.30,
    "detect_ladder_gaps": 0.30,
    "generate_suggestions": 0.30,
    "validate_and_merge": 0.10,
}

# Per-wave hard cost ceiling (defensive). Sum ≤ V-AE-8 budget $0.10 USD.
_PER_WAVE_COST_CEILING_USD: dict[str, Decimal] = {
    "analyze_current_offers": Decimal("0.035"),
    "detect_ladder_gaps": Decimal("0.035"),
    "generate_suggestions": Decimal("0.015"),  # Haiku is cheap
    "validate_and_merge": Decimal("0.015"),
}

# Total advice-run cost ceiling — V-AE-8 SSoT (≤$0.10 USD per advice run per
# 02-design § 14.3 + 03-arch-agentic § 5.1). Caller can lower via constructor
# kwarg; raising requires CONTRACT bump.
DEFAULT_COST_BUDGET_USD: Decimal = Decimal("0.10")

# Minimum confidence below which the extractor flags for creator manual review.
# Mirrors vitalia ``MIN_ACCEPTABLE_CONFIDENCE`` threshold (02-design parity).
MIN_ACCEPTABLE_CONFIDENCE: float = 0.7

# Extractor schema version cement — emitted in domain event + audit log.
EXTRACTOR_VERSION: str = "offer_ladder_advisor_v1"

# Canonical 4 levels of the comunify offer ladder. Source: brand.yaml + 03-arch-be § 9.
_CANONICAL_LEVELS: tuple[str, ...] = ("lead_magnet", "tripwire", "core_offer", "premium")


# ─── Lazy observability helpers (mirror agentic/tools/qualify_for_cohort.py) ────


def _sanitize_payload(payload: dict[str, Any]) -> dict[str, Any]:
    """Sanitize payload via luana_core_observability or truncate-only fallback.

    Best-effort: when the observability package is not importable (e.g. minimal
    test environment), fall back to per-key string truncation. Mirrors the
    pattern in ``modules/comunify/agentic/tools/qualify_for_cohort.py``.
    """
    try:
        from luana_core_observability.recording.sanitization import (
            sanitize_payload as _sp,  # type: ignore[import-not-found]
        )

        return _sp(payload)  # type: ignore[no-any-return]
    except ImportError:
        _MAX_LEN = 4000
        return {k: (v[:_MAX_LEN] if isinstance(v, str) and len(v) > _MAX_LEN else v) for k, v in payload.items()}


def _pop_cost(litellm_call_id: str | None) -> Decimal | None:
    """Pull cost via the observability LiteLLM CustomLogger bridge.

    Best-effort: when the observability package is unavailable, returns None
    (cost-unknown). The caller MUST treat ``None`` as a signal that cost is
    unknown — NEVER default to 0 USD silently (would mask cost-tracking drift).
    """
    if litellm_call_id is None:
        return None
    try:
        from luana_core_observability.recording.cost_recorder import (
            pop_cost as _pc,  # type: ignore[import-not-found]
        )

        return _pc(litellm_call_id)  # type: ignore[no-any-return]
    except ImportError:
        return None


# ─── LLM response / client protocols ───────────────────────────────────────


@dataclass(frozen=True, slots=True)
class _LLMResponse:
    """LLM call result — text content + LiteLLM call_id for cost recovery.

    Mirrors ``vitalia/.../_LLMResponse``; intentionally NOT lifted to shared
    yet (N=2 today across comunify + vitalia siblings; shared abstraction
    requires the third vertical per anti-duplication.md cardinal rule).
    """

    content: str
    """Raw text content returned by the LLM (expected JSON for our prompts)."""

    litellm_call_id: str | None
    """LiteLLM call ID for ``pop_cost`` lookup. ``None`` when the proxy did
    not surface a call_id (cost considered unknown — still bounded by
    ``_PER_WAVE_COST_CEILING_USD`` budget)."""

    duration_ms: int = 0
    """Wall-clock duration for the LLM call (informational)."""


class _LiteLLMServiceLike(Protocol):
    """Minimal surface consumed from a LiteLLM-backed chat service.

    Subset of ``luana_core_llm.providers.litellm.LiteLLMService`` — only the
    methods exercised by the extractor are declared, so test fakes only need
    to implement those.
    """

    async def ainvoke_text(
        self,
        *,
        role: str,
        prompt: str,
        timeout_sec: float,
    ) -> _LLMResponse: ...


class _OfferLadderAdviceRepoLike(Protocol):
    """Optional repo for persisting the advice product as a row.

    NB: the underlying table (``comunify_offer_ladder_advice``) is NOT yet
    materialized in alembic — wired here only for future-proof DI. Caller
    passing ``None`` is fine (advice still returns to caller in-memory).
    """

    async def save_advice(self, advice: Any) -> None: ...


class _OfferLadderRepoLike(Protocol):
    """Optional handle to the (existing) OfferLadderRepository singleton.

    Currently unused inside the extractor — exposed via DI so callers can
    pass the same repo they use in OfferLadderService for downstream
    integrations (e.g. flagging the ladder as "gap_acknowledged" once the
    creator accepts a suggested offer). Today the extractor does NOT mutate
    the ladder row; consumer-side flows do.
    """

    async def get_for_tenant(self) -> Any: ...


class _QdrantIndexerLike(Protocol):
    """Minimal surface for indexing structured advice into Qdrant.

    Per 02-design § 7.1 side-effect (b): "Indexes structured advice to
    creator's Qdrant per-tenant collection". Tenant-isolated by collection
    name (collection naming is the caller's concern).
    """

    async def index_offer_ladder_advice(
        self,
        *,
        tenant_id: uuid.UUID,
        advice_id: uuid.UUID,
        payload: dict[str, Any],
    ) -> None: ...


class _OutboxLike(Protocol):
    """Minimal surface for outbox-pattern event emission.

    Per 02-design § 7.1 side-effect (c): "Emits domain event
    OfferLadderAdviceGenerated". Outbox pattern
    (USE_OUTBOX_PATTERN_* default True per 2026-04-29 cutover) — NEVER use
    legacy ``EventBus.publish``.
    """

    async def publish(
        self,
        *,
        event_type: str,
        tenant_id: uuid.UUID,
        payload: dict[str, Any],
    ) -> None: ...


class _AuditLogLike(Protocol):
    """Minimal surface for community_audit_log writes.

    Per 02-design § 7.1 side-effect (d): "Audit_log offer_ladder_advice_generated".
    """

    async def log(
        self,
        *,
        tenant_id: uuid.UUID,
        event_type: str,
        payload: dict[str, Any],
    ) -> None: ...


# ─── Extractor (extends BaseExtractionOrchestrator) ────────────────────────


class OfferLadderAdvisor(BaseExtractionOrchestrator):
    """Wave-based extraction of offer ladder gap analysis + suggestions.

    Subclass concerns (per ``BaseExtractionOrchestrator`` contract):
      * ``run(...)`` — entry point.
      * ``_define_waves()`` — wave configuration.
      * ``_merge_and_save(...)`` — domain entity persistence.

    Wave scheduling + progress emission consumed from base.
    """

    log_prefix = "comunify_offer_ladder_advisor"
    default_wave_delay_seconds: float = 0.0  # LLM-bound; no inter-wave throttle needed.

    def __init__(
        self,
        *,
        llm_service: _LiteLLMServiceLike,
        advice_repo: _OfferLadderAdviceRepoLike | None = None,
        offer_ladder_repo: _OfferLadderRepoLike | None = None,
        qdrant_indexer: _QdrantIndexerLike | None = None,
        outbox: _OutboxLike | None = None,
        audit_log: _AuditLogLike | None = None,
        cost_budget_usd: Decimal = DEFAULT_COST_BUDGET_USD,
    ) -> None:
        """Initialise extractor with required + optional collaborators.

        Required:
          ``llm_service``.
        Optional (best-effort side-effects when supplied; ``None`` is fine):
          ``advice_repo``, ``offer_ladder_repo``, ``qdrant_indexer``,
          ``outbox``, ``audit_log``.

        ``cost_budget_usd`` defaults to V-AE-8 SSoT (0.10 USD). Lower via
        kwarg for cost-sensitive tenants; raising requires CONTRACT bump.

        D1 (DI): all collaborators injected via constructor. No global state.
        """
        self._llm = llm_service
        self._advice_repo = advice_repo
        self._offer_ladder_repo = offer_ladder_repo
        self._qdrant = qdrant_indexer
        self._outbox = outbox
        self._audit_log = audit_log
        self._cost_budget_usd = cost_budget_usd
        self._waves = self._define_waves()

    # ----------------------------------------------------------------------
    # Wave definition (subclass concern)
    # ----------------------------------------------------------------------

    @staticmethod
    def _define_waves() -> list[ExtractionWave]:
        """Return the 4 waves that compose the offer-ladder advice run."""
        return [
            ExtractionWave(
                name="analyze_current_offers",
                model_role="reasoning",  # Sonnet 4.6 via LiteLLM router
                timeout_sec=30.0,
            ),
            ExtractionWave(
                name="detect_ladder_gaps",
                model_role="reasoning",  # Sonnet 4.6
                timeout_sec=30.0,
            ),
            ExtractionWave(
                name="generate_suggestions",
                model_role="nano",  # Haiku 4.5 — cheap brainstorm
                timeout_sec=30.0,
            ),
            ExtractionWave(
                name="validate_and_merge",
                model_role="reasoning",  # Sonnet 4.6 validator
                timeout_sec=25.0,
            ),
        ]

    # ----------------------------------------------------------------------
    # Public entry point
    # ----------------------------------------------------------------------

    async def run(
        self,
        *,
        tenant_id: uuid.UUID,
        current_offers: list[dict[str, Any]],
        creator_niche: str,
        country: str,
    ) -> OfferLadderAdviceV1:
        """Run the 4-wave advice pipeline.

        Parameters
        ----------
        tenant_id
            Required. Filters every persistence + Qdrant + outbox + audit (R2).
        current_offers
            Pre-shaped list of offer dicts. Each entry SHOULD carry at least
            ``slug``, ``name``, ``price_usd``, ``value`` keys. Extractor is
            tolerant to extra keys + missing keys. Empty list → graceful
            "no_offers_yet" path: extractor returns full 4-gap analysis with
            bootstrap suggestions.
        creator_niche
            Free-form description of the creator's niche / audience.
        country
            ISO 3166-1 alpha-2 (e.g. "AR", "MX", "CL"). Drives
            ``price_local_hint`` generation in wave 3.

        Returns
        -------
        OfferLadderAdviceV1
            Always returns a non-None instance. ``confidence_score`` reflects
            extraction quality. ``extraction_warnings`` carries per-wave
            warnings (timeouts, parse failures, etc.).
        """
        run_started = time.monotonic()
        logger.info(
            f"{self.log_prefix}_starting",
            tenant_id=str(tenant_id),
            offers_count=len(current_offers),
            creator_niche_chars=len(creator_niche),
            country=country,
        )

        # Early-exit graceful path: empty ladder → bootstrap analysis (still
        # run all 4 waves but with a "no offers yet" hint baked into prompts).
        empty_ladder = not current_offers

        wave_outputs: dict[str, dict[str, Any]] = {}
        wave_costs_usd: dict[str, Decimal] = {}
        wave_warnings: list[str] = []
        wave_confidences: dict[str, float] = {}

        # ── Wave 1: analyze_current_offers ────────────────────────────────
        wave_1 = self._waves[0]
        wave_1_result = await self._run_one_wave(
            wave_1,
            prompt_inputs={
                "current_offers_json": json.dumps(current_offers, default=str, ensure_ascii=False),
                "creator_niche": creator_niche,
                "country": country,
                "empty_ladder": str(empty_ladder).lower(),
            },
            on_exception=_WaveError,
        )
        self._absorb_wave_result(
            wave_1,
            wave_1_result,
            wave_outputs=wave_outputs,
            wave_costs_usd=wave_costs_usd,
            wave_confidences=wave_confidences,
            wave_warnings=wave_warnings,
        )

        # ── Wave 2: detect_ladder_gaps (depends on Wave 1) ────────────────
        wave_2 = self._waves[1]
        wave_2_result = await self._run_one_wave(
            wave_2,
            prompt_inputs={
                "wave_1_output_json": json.dumps(wave_outputs.get("analyze_current_offers", {}), ensure_ascii=False),
                "current_offers_json": json.dumps(current_offers, default=str, ensure_ascii=False),
                "canonical_levels_json": json.dumps(list(_CANONICAL_LEVELS)),
            },
            on_exception=_WaveError,
        )
        self._absorb_wave_result(
            wave_2,
            wave_2_result,
            wave_outputs=wave_outputs,
            wave_costs_usd=wave_costs_usd,
            wave_confidences=wave_confidences,
            wave_warnings=wave_warnings,
        )

        # ── Wave 3: generate_suggestions (Haiku, depends on Waves 1+2) ────
        wave_3 = self._waves[2]
        wave_3_result = await self._run_one_wave(
            wave_3,
            prompt_inputs={
                "wave_2_output_json": json.dumps(wave_outputs.get("detect_ladder_gaps", {}), ensure_ascii=False),
                "creator_niche": creator_niche,
                "country": country,
            },
            on_exception=_WaveError,
        )
        self._absorb_wave_result(
            wave_3,
            wave_3_result,
            wave_outputs=wave_outputs,
            wave_costs_usd=wave_costs_usd,
            wave_confidences=wave_confidences,
            wave_warnings=wave_warnings,
        )

        # ── Wave 4: validate_and_merge (Sonnet validator) ─────────────────
        wave_4 = self._waves[3]
        wave_4_result = await self._run_one_wave(
            wave_4,
            prompt_inputs={
                "wave_1_output_json": json.dumps(wave_outputs.get("analyze_current_offers", {}), ensure_ascii=False),
                "wave_2_output_json": json.dumps(wave_outputs.get("detect_ladder_gaps", {}), ensure_ascii=False),
                "wave_3_output_json": json.dumps(wave_outputs.get("generate_suggestions", {}), ensure_ascii=False),
            },
            on_exception=_WaveError,
        )
        self._absorb_wave_result(
            wave_4,
            wave_4_result,
            wave_outputs=wave_outputs,
            wave_costs_usd=wave_costs_usd,
            wave_confidences=wave_confidences,
            wave_warnings=wave_warnings,
        )

        # ── Cost budget enforcement (V-AE-8 SSoT) ─────────────────────────
        total_cost = sum(wave_costs_usd.values(), Decimal("0"))
        if total_cost > self._cost_budget_usd:
            logger.warning(
                f"{self.log_prefix}_cost_budget_exceeded",
                total_cost_usd=str(total_cost),
                budget_usd=str(self._cost_budget_usd),
                tenant_id=str(tenant_id),
            )
            wave_warnings.append(f"cost_budget_exceeded:total={total_cost}_USD>{self._cost_budget_usd}")

        # ── Empty-ladder hint warning (advisory, not an error) ────────────
        if empty_ladder:
            wave_warnings.append("no_offers_yet:suggest_level_1_first")

        # ── Merge wave outputs into OfferLadderAdviceV1 ───────────────────
        advice = self._merge_outputs(
            wave_outputs=wave_outputs,
            wave_confidences=wave_confidences,
            wave_warnings=wave_warnings,
        )

        duration_ms = int((time.monotonic() - run_started) * 1000)

        # ── Best-effort persistence + side-effects (each isolated) ────────
        advice_id = uuid.uuid4()
        await self._merge_and_save(
            advice=advice,
            tenant_id=tenant_id,
            advice_id=advice_id,
            wave_costs_usd=wave_costs_usd,
            duration_ms=duration_ms,
            creator_niche=creator_niche,
            country=country,
        )

        logger.info(
            f"{self.log_prefix}_complete",
            tenant_id=str(tenant_id),
            advice_id=str(advice_id),
            confidence_score=advice.confidence_score,
            total_cost_usd=str(total_cost),
            duration_ms=duration_ms,
            gaps_count=len(advice.ladder_gaps),
            suggestions_count=len(advice.suggested_offers),
            warnings_count=len(advice.extraction_warnings),
        )

        return advice

    # ----------------------------------------------------------------------
    # Wave execution helpers
    # ----------------------------------------------------------------------

    async def _run_one_wave(
        self,
        wave: ExtractionWave,
        *,
        prompt_inputs: dict[str, str],
        on_exception: type[BaseException],
    ) -> dict[str, Any]:
        """Execute a single extraction wave + parse + capture cost.

        Returns dict with ``parsed`` (dict from JSON), ``cost_usd`` (Decimal),
        and ``error`` (None or exception summary). Caller absorbs the result
        into the aggregated state via ``_absorb_wave_result``.
        """
        prompt = _build_wave_prompt(wave.name, prompt_inputs)

        wave_started = time.monotonic()
        try:
            response = await asyncio.wait_for(
                self._llm.ainvoke_text(
                    role=wave.model_role,
                    prompt=prompt,
                    timeout_sec=wave.timeout_sec,
                ),
                timeout=wave.timeout_sec + 2.0,  # asyncio guard around LLM-internal timeout
            )
        except TimeoutError as exc:
            logger.warning(
                f"{self.log_prefix}_wave_timeout",
                wave=wave.name,
                timeout_sec=wave.timeout_sec,
            )
            return {"parsed": {}, "cost_usd": Decimal("0"), "error": f"timeout_after_{wave.timeout_sec}s"} | {
                "_caught_type": type(exc).__name__,
            }
        except Exception as exc:  # noqa: BLE001 — defensive, wave failure is partial-result
            logger.warning(
                f"{self.log_prefix}_wave_failed",
                wave=wave.name,
                error_type=type(exc).__name__,
                error_msg=str(exc)[:200],
            )
            return {"parsed": {}, "cost_usd": Decimal("0"), "error": f"exception:{type(exc).__name__}"} | {
                "_caught_type": type(exc).__name__,
            }

        wave_duration_ms = int((time.monotonic() - wave_started) * 1000)

        # Capture cost via LiteLLM CustomLogger bridge (PI-12 S1 T-1 cement).
        cost_usd = self._resolve_wave_cost(response, wave_name=wave.name)
        parsed = self._parse_wave_json(response.content, wave_name=wave.name)

        logger.info(
            f"{self.log_prefix}_wave_complete",
            wave=wave.name,
            duration_ms=wave_duration_ms,
            cost_usd=str(cost_usd) if cost_usd is not None else None,
            wave_confidence=parsed.get("wave_confidence"),
        )

        return {"parsed": parsed, "cost_usd": cost_usd or Decimal("0"), "error": None}

    @staticmethod
    def _absorb_wave_result(
        wave: ExtractionWave,
        result: dict[str, Any],
        *,
        wave_outputs: dict[str, dict[str, Any]],
        wave_costs_usd: dict[str, Decimal],
        wave_confidences: dict[str, float],
        wave_warnings: list[str],
    ) -> None:
        """Fold a single wave result into the aggregated state dictionaries."""
        wave_outputs[wave.name] = result["parsed"]
        wave_costs_usd[wave.name] = result["cost_usd"]
        wave_confidences[wave.name] = float(result["parsed"].get("wave_confidence", 0.0))

        # Per-wave warnings from the LLM payload itself.
        extra_warnings = result["parsed"].get("wave_warnings", []) or []
        if isinstance(extra_warnings, list):
            wave_warnings.extend(str(w) for w in extra_warnings)

        # Pipeline-level error (timeout / exception during wave).
        if result.get("error"):
            wave_warnings.append(f"{wave.name}_{result['error']}")

    @staticmethod
    def _resolve_wave_cost(response: _LLMResponse, *, wave_name: str) -> Decimal | None:
        """Pull cost via LiteLLM CustomLogger bridge.

        Per PI-12 S1 T-1 cement: ``pop_cost(litellm_call_id)`` returns
        ``Decimal | None``. ``None`` means cost-unknown (do NOT default to 0
        — masks cost-tracking drift); we surface a warning + record it as
        a wave warning downstream.
        """
        if response.litellm_call_id is None:
            logger.warning(
                "comunify_offer_ladder_advisor.wave_cost_unknown_no_call_id",
                wave=wave_name,
            )
            return None
        cost = _pop_cost(response.litellm_call_id)
        if cost is None:
            logger.warning(
                "comunify_offer_ladder_advisor.wave_cost_unknown",
                wave=wave_name,
                call_id=response.litellm_call_id,
            )
        return cost

    @staticmethod
    def _parse_wave_json(content: str, *, wave_name: str) -> dict[str, Any]:
        """Parse wave LLM output as JSON.

        Tolerant: tries to strip Markdown code fences if model wrapped output
        despite prompt instructions. On final failure, returns empty dict +
        logs warning (caller treats as zero-confidence wave).
        """
        text = content.strip()
        if text.startswith("```"):
            # Strip fenced code block (defensive — prompt forbids markdown but
            # LLMs occasionally ignore).
            lines = text.split("\n")
            if len(lines) >= 2:
                text = "\n".join(lines[1:-1] if lines[-1].startswith("```") else lines[1:])
        try:
            parsed = json.loads(text)
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError as exc:
            logger.warning(
                "comunify_offer_ladder_advisor.wave_json_parse_failed",
                wave=wave_name,
                error=str(exc)[:200],
                content_preview=text[:200],
            )
        return {}

    # ----------------------------------------------------------------------
    # Merge logic (subclass concern)
    # ----------------------------------------------------------------------

    @staticmethod
    def _merge_outputs(
        *,
        wave_outputs: dict[str, dict[str, Any]],
        wave_confidences: dict[str, float],
        wave_warnings: list[str],
    ) -> OfferLadderAdviceV1:
        """Merge 4-wave outputs into final OfferLadderAdviceV1 instance.

        Primitives constructed defensively: any malformed entry from the LLM
        is silently dropped + warning recorded.
        """
        warnings = list(wave_warnings)

        # Gaps live in wave 2 output; suggestions in wave 3; tier optimization
        # finalized by wave 4 (or fallback to wave 1/2 raw if wave 4 failed).
        gaps_raw = wave_outputs.get("detect_ladder_gaps", {}).get("ladder_gaps", [])
        gaps = OfferLadderAdvisor._parse_list(
            gaps_raw,
            LadderGap,
            warnings,
            entity_name="ladder_gap",
        )

        suggestions_raw = wave_outputs.get("generate_suggestions", {}).get("suggested_offers", [])
        suggestions = OfferLadderAdvisor._parse_list(
            suggestions_raw,
            SuggestedOffer,
            warnings,
            entity_name="suggested_offer",
        )

        # Tier optimization: prefer wave 4 (validator's final view), then wave 1.
        tier_raw = wave_outputs.get("validate_and_merge", {}).get("tier_optimization") or wave_outputs.get(
            "analyze_current_offers", {}
        ).get("tier_optimization")
        tier_opt = OfferLadderAdvisor._parse_optional(
            tier_raw,
            TierOptimization,
            warnings,
            entity_name="tier_optimization",
        )

        # Aggregate confidence: weighted sum + validator adjustment.
        base_confidence = sum(
            wave_confidences.get(name, 0.0) * weight for name, weight in _WAVE_CONFIDENCE_WEIGHTS.items()
        )
        validator_adj = float(wave_outputs.get("validate_and_merge", {}).get("validation_score_adjustment", 0.0) or 0.0)
        # Validator adjustment is bounded [-0.3, 0.0] per prompt contract.
        validator_adj = max(-0.3, min(0.0, validator_adj))
        confidence = max(0.0, min(1.0, base_confidence + validator_adj))

        missing_required = list(
            wave_outputs.get("validate_and_merge", {}).get("merged_missing_required_fields", []) or []
        )

        return OfferLadderAdviceV1(
            ladder_gaps=gaps,
            suggested_offers=suggestions,
            tier_optimization=tier_opt or TierOptimization(),
            confidence_score=round(confidence, 3),
            missing_required_fields=missing_required,
            extraction_warnings=warnings,
        )

    @staticmethod
    def _parse_list(
        raw: list[Any],
        cls: type,
        warnings: list[str],
        *,
        entity_name: str,
    ) -> list[Any]:
        """Defensively construct a list of Pydantic instances.

        Drops malformed entries silently; appends a warning per drop.
        """
        result: list[Any] = []
        if not isinstance(raw, list):
            warnings.append(f"{entity_name}_unexpected_type_{type(raw).__name__}")
            return result
        for idx, item in enumerate(raw):
            if not isinstance(item, dict):
                warnings.append(f"{entity_name}_item_{idx}_not_dict")
                continue
            try:
                result.append(cls(**item))
            except Exception as exc:  # noqa: BLE001 — Pydantic ValidationError + edge cases
                warnings.append(f"{entity_name}_item_{idx}_invalid:{type(exc).__name__}")
        return result

    @staticmethod
    def _parse_optional(
        raw: Any,
        cls: type,
        warnings: list[str],
        *,
        entity_name: str,
    ) -> Any:
        """Defensively construct an Optional Pydantic instance."""
        if raw is None:
            return None
        if not isinstance(raw, dict):
            warnings.append(f"{entity_name}_unexpected_type_{type(raw).__name__}")
            return None
        try:
            return cls(**raw)
        except Exception as exc:  # noqa: BLE001
            warnings.append(f"{entity_name}_invalid:{type(exc).__name__}")
            return None

    # ----------------------------------------------------------------------
    # Persistence + side-effects (subclass concern, best-effort)
    # ----------------------------------------------------------------------

    async def _merge_and_save(
        self,
        *,
        advice: OfferLadderAdviceV1,
        tenant_id: uuid.UUID,
        advice_id: uuid.UUID,
        wave_costs_usd: dict[str, Decimal],
        duration_ms: int,
        creator_niche: str,
        country: str,
    ) -> None:
        """Run side-effects (all best-effort, never raise).

        Order matters:
          1. Persist advice row (when ``advice_repo`` supplied).
          2. Index Qdrant (RAG visibility) — best-effort, isolated try/except.
          3. Outbox event emission — best-effort, isolated try/except.
          4. Audit log — best-effort, isolated try/except.

        Any single side-effect failing MUST NOT raise to the caller.
        """
        total_cost = sum(wave_costs_usd.values(), Decimal("0"))

        # 1. Advice repo persistence.
        if self._advice_repo is not None:
            try:
                row = {
                    "id": advice_id,
                    "tenant_id": tenant_id,
                    "extractor_version": EXTRACTOR_VERSION,
                    "confidence_score": Decimal(str(advice.confidence_score)),
                    "extracted_payload": advice.model_dump(mode="json"),
                    "creator_niche": creator_niche,
                    "country": country,
                    "total_cost_usd": total_cost,
                    "duration_ms": duration_ms,
                }
                await self._advice_repo.save_advice(row)
            except Exception as exc:  # noqa: BLE001 — best-effort persistence
                logger.warning(
                    f"{self.log_prefix}_persist_advice_failed",
                    error_type=type(exc).__name__,
                    error_msg=str(exc)[:200],
                    tenant_id=str(tenant_id),
                    advice_id=str(advice_id),
                )

        # 2. Qdrant indexing (RAG).
        if self._qdrant is not None:
            try:
                # PII sanitisation before write (defensive — advice itself is
                # structured suggestions, no PII expected, but defense-in-depth).
                payload = _sanitize_payload(advice.model_dump(mode="json"))
                await self._qdrant.index_offer_ladder_advice(
                    tenant_id=tenant_id,
                    advice_id=advice_id,
                    payload=payload,
                )
            except Exception as exc:  # noqa: BLE001 — best-effort RAG index
                logger.warning(
                    f"{self.log_prefix}_qdrant_index_failed",
                    error_type=type(exc).__name__,
                    error_msg=str(exc)[:200],
                    tenant_id=str(tenant_id),
                    advice_id=str(advice_id),
                )

        # 3. Outbox domain event.
        if self._outbox is not None:
            try:
                event_payload = _sanitize_payload(
                    {
                        "advice_id": str(advice_id),
                        "extractor_version": EXTRACTOR_VERSION,
                        "schema_version": advice.schema_version,
                        "confidence_score": advice.confidence_score,
                        "gaps_count": len(advice.ladder_gaps),
                        "suggestions_count": len(advice.suggested_offers),
                        "warnings_count": len(advice.extraction_warnings),
                        "missing_required_count": len(advice.missing_required_fields),
                        "duration_ms": duration_ms,
                        "total_cost_usd": str(total_cost),
                        "country": country,
                    }
                )
                await self._outbox.publish(
                    event_type="OfferLadderAdviceGeneratedV1",
                    tenant_id=tenant_id,
                    payload=event_payload,
                )
            except Exception as exc:  # noqa: BLE001 — best-effort event emit
                logger.warning(
                    f"{self.log_prefix}_outbox_publish_failed",
                    error_type=type(exc).__name__,
                    error_msg=str(exc)[:200],
                    tenant_id=str(tenant_id),
                    advice_id=str(advice_id),
                )

        # 4. Audit log (offer_ladder_advice_generated).
        if self._audit_log is not None:
            try:
                audit_payload = _sanitize_payload(
                    {
                        "advice_id": str(advice_id),
                        "extractor_version": EXTRACTOR_VERSION,
                        "confidence_score": advice.confidence_score,
                        "warnings": list(advice.extraction_warnings),
                        "needs_manual_review": advice.confidence_score < MIN_ACCEPTABLE_CONFIDENCE,
                        "gaps_count": len(advice.ladder_gaps),
                        "suggestions_count": len(advice.suggested_offers),
                    }
                )
                await self._audit_log.log(
                    tenant_id=tenant_id,
                    event_type="offer_ladder_advice_generated",
                    payload=audit_payload,
                )
            except Exception as exc:  # noqa: BLE001 — best-effort audit
                logger.warning(
                    f"{self.log_prefix}_audit_log_failed",
                    error_type=type(exc).__name__,
                    error_msg=str(exc)[:200],
                    tenant_id=str(tenant_id),
                    advice_id=str(advice_id),
                )


# ─── Wave error sentinel + prompt builder ──────────────────────────────────


class _WaveError(RuntimeError):
    """Internal sentinel; never raised to callers (waves catch + warn)."""


# Per-wave prompts are kept inline as cache-prefix-invariant string constants.
# Variable inputs sit AFTER literal markers (``<<...>>``) — caller substitutes
# via ``str.replace`` so Anthropic prompt caching can hit on stable prefixes
# across calls. Real prompt content (Jinja2 templates with safety rails) lives
# in T-prompts-1 / T-extractors-1-iteration-2 if we want to externalise; today
# we keep them inline to respect ticket scope (2 files only).
_WAVE_PROMPTS: dict[str, str] = {
    "analyze_current_offers": (
        "You are an offer-portfolio analyst for a creator-economy SaaS. Analyze the creator's "
        "current offers + niche + country. Return JSON only, no markdown fences.\n\n"
        "Schema:\n"
        "{\n"
        '  "summary": "<one-sentence portfolio summary>",\n'
        '  "tier_optimization": {\n'
        '    "price_anchoring_advice": "<string|null>",\n'
        '    "progression_quality": "coherent|gappy|compressed|inverted|unknown",\n'
        '    "bundling_opportunities": ["<idea>", ...],\n'
        '    "upsell_paths": ["lead_magnet -> tripwire", ...]\n'
        "  },\n"
        '  "wave_confidence": <0.0..1.0>,\n'
        '  "wave_warnings": ["<string>", ...]\n'
        "}\n\n"
        "Inputs (after this marker, do NOT echo):\n"
        "<<CREATOR_NICHE>>: <<CREATOR_NICHE_VALUE>>\n"
        "<<COUNTRY>>: <<COUNTRY_VALUE>>\n"
        "<<EMPTY_LADDER_HINT>>: <<EMPTY_LADDER_VALUE>>\n"
        "<<CURRENT_OFFERS_JSON>>: <<CURRENT_OFFERS_JSON_VALUE>>\n"
    ),
    "detect_ladder_gaps": (
        "You are a ladder-gap detector for a 4-level offer ladder (lead_magnet / tripwire / "
        "core_offer / premium). Given an analysis + the current offers, identify which canonical "
        "levels are MISSING and explain WHY each gap matters. Return JSON only, no markdown fences.\n\n"
        "Schema:\n"
        "{\n"
        '  "ladder_gaps": [\n'
        "    {\n"
        '      "level": "lead_magnet|tripwire|core_offer|premium",\n'
        '      "reasoning": "<string>",\n'
        '      "priority": "high|medium|low"\n'
        "    },\n"
        "    ...\n"
        "  ],\n"
        '  "wave_confidence": <0.0..1.0>,\n'
        '  "wave_warnings": ["<string>", ...]\n'
        "}\n\n"
        "Canonical levels: <<CANONICAL_LEVELS_JSON_VALUE>>\n"
        "Inputs (after this marker, do NOT echo):\n"
        "<<WAVE_1_OUTPUT_JSON>>: <<WAVE_1_OUTPUT_JSON_VALUE>>\n"
        "<<CURRENT_OFFERS_JSON>>: <<CURRENT_OFFERS_JSON_VALUE>>\n"
    ),
    "generate_suggestions": (
        "You are a creator-economy offer brainstorm assistant. Given detected gaps + the creator's "
        "niche + country, produce 1-3 candidate offers per gap. Return JSON only, no markdown fences.\n\n"
        "Schema:\n"
        "{\n"
        '  "suggested_offers": [\n'
        "    {\n"
        '      "target_level": "lead_magnet|tripwire|core_offer|premium",\n'
        '      "name": "<es-LATAM neutro working title>",\n'
        '      "format": "<string|null>",\n'
        '      "price_usd": <number|null>,\n'
        '      "price_local_hint": "<string|null>",\n'
        '      "value_promise": "<single-sentence outcome>",\n'
        '      "fit_score": <0.0..1.0>\n'
        "    },\n"
        "    ...\n"
        "  ],\n"
        '  "wave_confidence": <0.0..1.0>,\n'
        '  "wave_warnings": ["<string>", ...]\n'
        "}\n\n"
        "Inputs (after this marker, do NOT echo):\n"
        "<<CREATOR_NICHE>>: <<CREATOR_NICHE_VALUE>>\n"
        "<<COUNTRY>>: <<COUNTRY_VALUE>>\n"
        "<<WAVE_2_OUTPUT_JSON>>: <<WAVE_2_OUTPUT_JSON_VALUE>>\n"
    ),
    "validate_and_merge": (
        "You are the validator + merger for an offer-ladder advice run. Cross-check wave 1 / 2 / 3 "
        "outputs for consistency (gaps line up with absent levels, suggestions target detected gaps, "
        "tier optimization is coherent). Return JSON only, no markdown fences.\n\n"
        "Schema:\n"
        "{\n"
        '  "merged_warnings": ["<string>", ...],\n'
        '  "merged_missing_required_fields": ["<field>", ...],\n'
        '  "validation_score_adjustment": <-0.3..0.0>,\n'
        '  "tier_optimization": { ... same schema as wave 1 ... } | null,\n'
        '  "consistency_notes": "<string>",\n'
        '  "wave_confidence": <0.0..1.0>,\n'
        '  "wave_warnings": ["<string>", ...]\n'
        "}\n\n"
        "Inputs (after this marker, do NOT echo):\n"
        "<<WAVE_1_OUTPUT_JSON>>: <<WAVE_1_OUTPUT_JSON_VALUE>>\n"
        "<<WAVE_2_OUTPUT_JSON>>: <<WAVE_2_OUTPUT_JSON_VALUE>>\n"
        "<<WAVE_3_OUTPUT_JSON>>: <<WAVE_3_OUTPUT_JSON_VALUE>>\n"
    ),
}


def _build_wave_prompt(wave_name: str, inputs: dict[str, str]) -> str:
    """Substitute prompt placeholders.

    Uses ``str.replace`` (not ``str.format``) — JSON braces in the schema
    examples are literal. Markers ``<<KEY>>`` keep the cache prefix
    byte-identical across calls until the marker boundary.
    """
    template = _WAVE_PROMPTS[wave_name]
    out = template
    for key, value in inputs.items():
        marker = f"<<{key.upper()}_VALUE>>"
        out = out.replace(marker, value)
    return out


__all__ = [
    "DEFAULT_COST_BUDGET_USD",
    "EXTRACTOR_VERSION",
    "MIN_ACCEPTABLE_CONFIDENCE",
    "OfferLadderAdvisor",
    "_LLMResponse",
]
