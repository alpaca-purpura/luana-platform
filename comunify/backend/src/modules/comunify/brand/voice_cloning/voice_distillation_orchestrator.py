"""Comunify AGENTIC voice cloning pipeline — ``VoiceDistillationOrchestrator``
(T-voice-1, R23 Opus 4.7 production code).

EXTENDS ``luana_core_extraction.base_orchestrator.BaseExtractionOrchestrator`` per
``.claude/rules/anti-duplication.md`` SSoT row (wave-based LLM extraction lift
shared, NOT mirror). Arch fitness gate
``test_comunify_voice_distillation_inherits_base_orchestrator.py`` validates
the subclass invariant.

4-wave pipeline (per 03-arch-agentic § 5.3 + 06-tickets.yaml::T-voice-1):

  W1  dialect_detection             nano       Haiku 4.5  ≤20 s
  W2  vocabulary_anchors_extraction reasoning  Sonnet 4.6 ≤40 s
  W3  register_tone_profile         reasoning  Sonnet 4.6 ≤30 s
  W4  validate_and_compile_v2       reasoning  Sonnet 4.6 ≤30 s

Cost budget: ≤$0.18 USD per 50-chat distillation (V-AE-21 + 03-arch-agentic
§ Cost-per-tool table). Latency p50 8min / p99 15min (LLM-bound). ASYNC.

Output: ``CompiledVoice`` — 6 bloques v2 (identidad / dialecto / vocabulario /
registro / asi_no / anclajes). Bridges to ``luana_core_brand_studio`` voice
compiler via ``compiler_integration.py`` (T-voice-3) — produces
``personality_profiles.system_instruction``.

Inputs:
  * tenant_id     (R2 isolation — every persistence + outbox + audit + workflow)
  * job_id        UUID of the ``comunify_voice_distillation_jobs`` row to update
  * chat_samples  Pre-sanitized list of {message, sender, channel, timestamp}
                  dicts. PII pre-stripped by ``samples_parser.py`` (T-voice-2).
                  Length ≥50 enforced upstream by ``VoiceCloningService``.
  * country       ISO 3166-1 alpha-2 — drives default-dialect prior.

Side-effects (best-effort, never raise):
  * Update ``comunify_voice_distillation_jobs`` row: status, confidence_score,
    compiled_blocks, cost_usd, completed_at, error_reason — via injected
    ``job_repo``.
  * Emit ``VoiceDistillationCompletedV1`` domain event — via injected ``outbox``.
  * Audit-log ``voice_distillation_completed`` — via injected ``audit_log``.
  * DELETE raw samples post-success (D15 privacy) — via injected
    ``raw_samples_remover``.

Tenant isolation (R2): ``tenant_id`` forwarded to every side-effect collaborator.

PII handling (D15):
  * Inputs (``chat_samples``) ARE user-content. NEVER persisted post-distill.
  * Only LLM-extracted *patterns* (vocabulario / asi_no) reach the output.
  * Observability payloads (sanitized via ``sanitize_payload``) carry counts +
    confidence + cost — never message bodies.

Anti-duplication audit (Step 0 GATE pre-write, 2026-05-14):
  * ``grep -rn "class VoiceDistillationOrchestrator"`` cross luana-platform +
    AISALESHT backend → only design/arch MDs reference the name + the
    Protocol stub in ``application/services/voice_cloning_service.py`` (which
    THIS orchestrator implements per the T-be-7 plan).
  * Wave + sleep + progress mechanics consumed from
    ``BaseExtractionOrchestrator`` (luana_core_extraction). NEVER
    re-implemented.
  * ``_LLMResponse`` + ``_LiteLLMServiceLike`` Protocols re-imported FROM
    ``offer_ladder_advisor`` (N=2 within comunify — siblings, brand-isolated
    primitive). Same lift-to-shared rule: 3rd consumer → escalate.
  * ``sanitize_payload`` consumed from luana_core_observability with
    truncate-only fallback (mirror of ``offer_ladder_advisor`` lazy import).
  * ``pop_cost`` consumed from luana_core_observability.recording.cost_recorder
    (LiteLLM CustomLogger bridge per PI-12 S1 T-1 cement).
  * No shared luana-core abstraction for voice distillation — vertical-
    creator-economy domain primitive.

Spec sources:
  * 02-design-agentic.md voice cloning flow
  * 03-arch-agentic.md § 5.3 (wave composition + CompiledVoice schema)
  * 04-validators.yaml::V-AE-9 + V-AE-21 + V-AE-30
  * 06-tickets.yaml::T-voice-1 acceptance + decisions D8 + D15
  * 05-guidelines.md § 1.10 R23 (production_code AGENTIC → Opus 4.7)
  * .claude/rules/sales-agent-brand-voice.md (Slot 5 BRAND_VOICE SSoT)
"""

from __future__ import annotations

import asyncio
import json
import time
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Protocol

import structlog
from luana_core_extraction.base_orchestrator import BaseExtractionOrchestrator

from src.modules.comunify.brand.voice_cloning._schemas import (
    CompiledVoice,
    VoiceExtractionWave,
)

# Re-use LLM transport primitive from sibling extractor (N=2 within comunify;
# brand-isolated sibling — lift-to-shared trigger N=3 per anti-duplication.md).
from src.modules.comunify.copilot.extractors.offer_ladder_advisor import _LLMResponse

logger = structlog.get_logger(__name__)

# ─── Configuration constants ─────────────────────────────────────────────


# Per-wave confidence weighting (sums to 1.0). Wave 4 (validate_and_compile_v2)
# contributes a smaller weight; the validator's role is consistency check +
# final compile, not primary signal generation.
_WAVE_CONFIDENCE_WEIGHTS: dict[str, float] = {
    "dialect_detection": 0.15,
    "vocabulary_anchors_extraction": 0.30,
    "register_tone_profile": 0.30,
    "validate_and_compile_v2": 0.25,
}

# Per-wave hard cost ceiling (defensive). Sum ≤ V-AE-21 budget $0.18 USD.
# Wave 1 cheap (Haiku); waves 2-4 reasoning (Sonnet) — but sample text fits
# within Sonnet's prompt; ceiling chosen with 10% headroom over expected.
_PER_WAVE_COST_CEILING_USD: dict[str, Decimal] = {
    "dialect_detection": Decimal("0.020"),  # Haiku — cheap
    "vocabulary_anchors_extraction": Decimal("0.060"),  # Sonnet, longest prompt
    "register_tone_profile": Decimal("0.050"),  # Sonnet
    "validate_and_compile_v2": Decimal("0.050"),  # Sonnet
}

# Total distillation cost ceiling — V-AE-21 SSoT (≤$0.18 USD per distillation
# per 03-arch-agentic § Cost-per-tool table). Caller can lower via kwarg;
# raising requires CONTRACT bump.
DEFAULT_COST_BUDGET_USD: Decimal = Decimal("0.18")

# Minimum confidence below which the extractor flags for creator manual review.
# Mirrors offer_ladder_advisor.MIN_ACCEPTABLE_CONFIDENCE threshold (consistency
# across comunify extractors).
MIN_ACCEPTABLE_CONFIDENCE: float = 0.65

# Extractor schema version cement — emitted in domain event + audit log.
EXTRACTOR_VERSION: str = "voice_distillation_orchestrator_v1"

# Minimum samples threshold (sanity check — caller MUST also enforce upstream
# in ``VoiceCloningService.kick_distillation``).
_MIN_SAMPLES_THRESHOLD: int = 50


# ─── Lazy observability helpers ───────────────────────────────────────────


def _sanitize_payload(payload: dict[str, Any]) -> dict[str, Any]:
    """Sanitize payload via luana_core_observability or truncate-only fallback.

    Best-effort: when the observability package is not importable (minimal
    test environment), fall back to per-key string truncation. Mirrors the
    pattern in ``copilot/extractors/offer_ladder_advisor._sanitize_payload``.
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

    Best-effort: when observability package is unavailable, returns None
    (cost-unknown). Caller MUST NEVER default to 0 USD silently (would mask
    cost-tracking drift) — surface as a wave warning instead.
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


def _utc_now() -> datetime:
    """Return current UTC datetime with timezone info."""
    return datetime.now(tz=timezone.utc)


# ─── Protocols (collaborator surfaces) ────────────────────────────────────


class _LiteLLMServiceLike(Protocol):
    """Minimal surface consumed from a LiteLLM-backed chat service.

    Same shape as ``offer_ladder_advisor._LiteLLMServiceLike`` — kept inline
    per sibling-pattern convention (N=2 within comunify; brand-isolated by
    design until N=3 surfaces a 3rd voice-distillation consumer).
    """

    async def ainvoke_text(
        self,
        *,
        role: str,
        prompt: str,
        timeout_sec: float,
    ) -> _LLMResponse: ...


class _VoiceDistillationJobRepoLike(Protocol):
    """Minimal surface for updating ``comunify_voice_distillation_jobs`` rows.

    Update operations only — the row is created by ``VoiceCloningService.
    kick_distillation`` (T-be-7) BEFORE the orchestrator runs.
    """

    async def update_status(
        self,
        job_id: uuid.UUID,
        *,
        status: str,
        confidence_score: float | None = None,
        compiled_blocks: dict | None = None,
        error_reason: str | None = None,
        completed_at: datetime | None = None,
        ratified_at: datetime | None = None,
    ) -> bool: ...


class _OutboxLike(Protocol):
    """Minimal surface for outbox-pattern event emission.

    Per 02-design § 5.3 side-effect: emits ``VoiceDistillationCompletedV1``
    on success / ``VoiceDistillationFailedV1`` on hard failure. Outbox pattern
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
    """Minimal surface for ``community_audit_log`` writes.

    Per 02-design § 5.3 side-effect: ``voice_distillation_completed``.
    """

    async def log(
        self,
        *,
        tenant_id: uuid.UUID,
        event_type: str,
        payload: dict[str, Any],
    ) -> None: ...


class _RawSamplesRemoverLike(Protocol):
    """Minimal surface for D15 privacy obligation: delete raw samples post-success.

    Caller wires this with a concrete remover that drops rows from
    ``comunify_voice_cloning_samples.upload_history`` raw content (keeping
    only counts) + purges any blob storage holding the original WhatsApp
    ZIP + voice notes. The orchestrator only signals "distillation done,
    safe to delete" via this protocol.
    """

    async def delete_raw_samples(
        self,
        *,
        tenant_id: uuid.UUID,
        job_id: uuid.UUID,
    ) -> None: ...


# ─── Orchestrator (extends BaseExtractionOrchestrator) ────────────────────


class VoiceDistillationOrchestrator(BaseExtractionOrchestrator):
    """4-wave LLM pipeline for distilling 50+ chat samples into ``CompiledVoice`` v2.

    Subclass concerns (per ``BaseExtractionOrchestrator`` contract):
      * ``run(...)`` — entry point.
      * ``_define_waves()`` — wave configuration.
      * ``_merge_and_save(...)`` — domain entity persistence + D15 deletion.

    Wave scheduling + progress emission consumed from base.

    Conforms structurally to ``VoiceDistillationWorkflowProtocol`` declared in
    ``application/services/voice_cloning_service.py`` — though the real entry
    point is ``run(...)``, not ``enqueue(...)``. T-voice-2 wires the ARQ worker
    that bridges the Protocol's ``enqueue`` → this orchestrator's ``run``.
    """

    log_prefix = "comunify_voice_distillation"
    default_wave_delay_seconds: float = 0.0  # LLM-bound; no inter-wave throttle.

    def __init__(
        self,
        *,
        llm_service: _LiteLLMServiceLike,
        job_repo: _VoiceDistillationJobRepoLike | None = None,
        outbox: _OutboxLike | None = None,
        audit_log: _AuditLogLike | None = None,
        raw_samples_remover: _RawSamplesRemoverLike | None = None,
        cost_budget_usd: Decimal = DEFAULT_COST_BUDGET_USD,
    ) -> None:
        """Initialise orchestrator with required + optional collaborators.

        Required:
          ``llm_service``.
        Optional (best-effort side-effects when supplied; ``None`` is fine):
          ``job_repo``, ``outbox``, ``audit_log``, ``raw_samples_remover``.

        ``cost_budget_usd`` defaults to V-AE-21 SSoT (0.18 USD). Lower via
        kwarg for cost-sensitive tenants; raising requires CONTRACT bump.

        D1 (DI): all collaborators injected via constructor. No global state.
        """
        self._llm = llm_service
        self._job_repo = job_repo
        self._outbox = outbox
        self._audit_log = audit_log
        self._raw_samples_remover = raw_samples_remover
        self._cost_budget_usd = cost_budget_usd
        self._waves = self._define_waves()

        # Sanity: confidence weights sum to 1.0 across declared waves.
        # Tolerance for float rounding; the test gate uses pytest.approx.
        total_weight = sum(_WAVE_CONFIDENCE_WEIGHTS[w.name] for w in self._waves)
        if not (0.999 <= total_weight <= 1.001):
            raise ValueError(
                f"Wave confidence weights must sum to 1.0 (got {total_weight}). "
                "Update _WAVE_CONFIDENCE_WEIGHTS or wave list."
            )

    # ----------------------------------------------------------------------
    # Wave definition (subclass concern)
    # ----------------------------------------------------------------------

    @staticmethod
    def _define_waves() -> list[VoiceExtractionWave]:
        """Return the 4 waves that compose the voice distillation run."""
        return [
            VoiceExtractionWave(
                name="dialect_detection",
                model_role="nano",  # Haiku 4.5 — cheap classification
                prompt_key="dialect_detection",
                timeout_sec=20.0,
                confidence_weight=_WAVE_CONFIDENCE_WEIGHTS["dialect_detection"],
            ),
            VoiceExtractionWave(
                name="vocabulary_anchors_extraction",
                model_role="reasoning",  # Sonnet 4.6 — pattern extraction
                prompt_key="vocabulary_anchors",
                timeout_sec=40.0,
                confidence_weight=_WAVE_CONFIDENCE_WEIGHTS["vocabulary_anchors_extraction"],
            ),
            VoiceExtractionWave(
                name="register_tone_profile",
                model_role="reasoning",  # Sonnet 4.6 — qualitative profile
                prompt_key="register_tone",
                timeout_sec=30.0,
                confidence_weight=_WAVE_CONFIDENCE_WEIGHTS["register_tone_profile"],
            ),
            VoiceExtractionWave(
                name="validate_and_compile_v2",
                model_role="reasoning",  # Sonnet 4.6 — validator + compile
                prompt_key="validate_compile_v2",
                timeout_sec=30.0,
                confidence_weight=_WAVE_CONFIDENCE_WEIGHTS["validate_and_compile_v2"],
            ),
        ]

    # ----------------------------------------------------------------------
    # Public entry point
    # ----------------------------------------------------------------------

    async def run(
        self,
        *,
        tenant_id: uuid.UUID,
        job_id: uuid.UUID,
        chat_samples: list[dict[str, Any]],
        country: str,
    ) -> CompiledVoice:
        """Run the 4-wave voice distillation pipeline.

        Parameters
        ----------
        tenant_id
            Required. Filters every persistence + outbox + audit + raw-samples
            removal (R2).
        job_id
            UUID of the existing ``comunify_voice_distillation_jobs`` row
            (created by ``VoiceCloningService.kick_distillation``). Used to
            update status + compiled_blocks + cost on completion.
        chat_samples
            Pre-sanitized list of chat dicts (post-PII strip via T-voice-2).
            Empty / < 50 → graceful degraded path: returns CompiledVoice with
            confidence_score=0 + warning. (Upstream caller MUST also enforce.)
        country
            ISO 3166-1 alpha-2 (e.g. "AR", "MX", "CL"). Drives default-dialect
            prior in wave 1 prompt.

        Returns
        -------
        CompiledVoice
            Always returns a non-None instance. ``confidence_score`` reflects
            distillation quality. ``extraction_warnings`` carries per-wave
            warnings.
        """
        run_started = time.monotonic()
        samples_count = len(chat_samples)

        logger.info(
            f"{self.log_prefix}_starting",
            tenant_id=str(tenant_id),
            job_id=str(job_id),
            samples_count=samples_count,
            country=country,
        )

        # ── Early-degraded path: insufficient samples ─────────────────────
        if samples_count < _MIN_SAMPLES_THRESHOLD:
            warning = f"insufficient_samples:{samples_count}<{_MIN_SAMPLES_THRESHOLD}"
            logger.warning(
                f"{self.log_prefix}_insufficient_samples",
                tenant_id=str(tenant_id),
                job_id=str(job_id),
                samples_count=samples_count,
            )
            degraded = CompiledVoice(
                samples_used=samples_count,
                confidence_score=0.0,
                missing_required_fields=["identidad", "dialecto", "vocabulario", "registro", "asi_no", "anclajes"],
                extraction_warnings=[warning],
            )
            # Best-effort persist degraded result + emit failure event.
            await self._merge_and_save(
                compiled=degraded,
                tenant_id=tenant_id,
                job_id=job_id,
                wave_costs_usd={},
                duration_ms=int((time.monotonic() - run_started) * 1000),
                country=country,
                final_status="failed",
                error_reason=warning,
            )
            return degraded

        # ── Pre-build prompt inputs ───────────────────────────────────────
        # Serialise the chat samples once for re-use across wave prompts. JSON
        # is robust to non-ASCII (voseo / acentos) when ensure_ascii=False.
        samples_json = json.dumps(chat_samples, default=str, ensure_ascii=False)

        wave_outputs: dict[str, dict[str, Any]] = {}
        wave_costs_usd: dict[str, Decimal] = {}
        wave_warnings: list[str] = []
        wave_confidences: dict[str, float] = {}

        # ── Wave 1: dialect_detection (Haiku — cheap classifier) ──────────
        wave_1 = self._waves[0]
        wave_1_result = await self._run_one_wave(
            wave_1,
            prompt_inputs={
                "chat_samples_json": samples_json,
                "country": country,
                "samples_count": str(samples_count),
            },
        )
        self._absorb_wave_result(
            wave_1,
            wave_1_result,
            wave_outputs=wave_outputs,
            wave_costs_usd=wave_costs_usd,
            wave_confidences=wave_confidences,
            wave_warnings=wave_warnings,
        )

        # ── Wave 2: vocabulary_anchors_extraction (Sonnet) ────────────────
        wave_2 = self._waves[1]
        wave_2_result = await self._run_one_wave(
            wave_2,
            prompt_inputs={
                "chat_samples_json": samples_json,
                "wave_1_output_json": json.dumps(wave_outputs.get("dialect_detection", {}), ensure_ascii=False),
                "country": country,
            },
        )
        self._absorb_wave_result(
            wave_2,
            wave_2_result,
            wave_outputs=wave_outputs,
            wave_costs_usd=wave_costs_usd,
            wave_confidences=wave_confidences,
            wave_warnings=wave_warnings,
        )

        # ── Wave 3: register_tone_profile (Sonnet) ────────────────────────
        wave_3 = self._waves[2]
        wave_3_result = await self._run_one_wave(
            wave_3,
            prompt_inputs={
                "chat_samples_json": samples_json,
                "wave_1_output_json": json.dumps(wave_outputs.get("dialect_detection", {}), ensure_ascii=False),
                "wave_2_output_json": json.dumps(
                    wave_outputs.get("vocabulary_anchors_extraction", {}),
                    ensure_ascii=False,
                ),
            },
        )
        self._absorb_wave_result(
            wave_3,
            wave_3_result,
            wave_outputs=wave_outputs,
            wave_costs_usd=wave_costs_usd,
            wave_confidences=wave_confidences,
            wave_warnings=wave_warnings,
        )

        # ── Wave 4: validate_and_compile_v2 (Sonnet validator) ────────────
        wave_4 = self._waves[3]
        wave_4_result = await self._run_one_wave(
            wave_4,
            prompt_inputs={
                "wave_1_output_json": json.dumps(wave_outputs.get("dialect_detection", {}), ensure_ascii=False),
                "wave_2_output_json": json.dumps(
                    wave_outputs.get("vocabulary_anchors_extraction", {}),
                    ensure_ascii=False,
                ),
                "wave_3_output_json": json.dumps(
                    wave_outputs.get("register_tone_profile", {}),
                    ensure_ascii=False,
                ),
                "country": country,
            },
        )
        self._absorb_wave_result(
            wave_4,
            wave_4_result,
            wave_outputs=wave_outputs,
            wave_costs_usd=wave_costs_usd,
            wave_confidences=wave_confidences,
            wave_warnings=wave_warnings,
        )

        # ── Cost budget enforcement (V-AE-21 SSoT) ────────────────────────
        total_cost = sum(wave_costs_usd.values(), Decimal("0"))
        if total_cost > self._cost_budget_usd:
            logger.warning(
                f"{self.log_prefix}_cost_budget_exceeded",
                total_cost_usd=str(total_cost),
                budget_usd=str(self._cost_budget_usd),
                tenant_id=str(tenant_id),
            )
            wave_warnings.append(f"cost_budget_exceeded:total={total_cost}_USD>{self._cost_budget_usd}")

        # ── Merge wave outputs into CompiledVoice ─────────────────────────
        compiled = self._merge_outputs(
            wave_outputs=wave_outputs,
            wave_confidences=wave_confidences,
            wave_warnings=wave_warnings,
            samples_used=samples_count,
        )

        duration_ms = int((time.monotonic() - run_started) * 1000)

        # Determine final status: low-confidence + missing required → failed.
        final_status, error_reason = self._classify_final_status(compiled)

        # ── Best-effort persistence + side-effects (each isolated) ────────
        await self._merge_and_save(
            compiled=compiled,
            tenant_id=tenant_id,
            job_id=job_id,
            wave_costs_usd=wave_costs_usd,
            duration_ms=duration_ms,
            country=country,
            final_status=final_status,
            error_reason=error_reason,
        )

        logger.info(
            f"{self.log_prefix}_complete",
            tenant_id=str(tenant_id),
            job_id=str(job_id),
            confidence_score=compiled.confidence_score,
            total_cost_usd=str(total_cost),
            duration_ms=duration_ms,
            samples_used=samples_count,
            dialecto=compiled.dialecto,  # short string, no PII
            vocab_anchors_count=len(compiled.vocabulario),
            asi_no_count=len(compiled.asi_no),
            warnings_count=len(compiled.extraction_warnings),
            final_status=final_status,
        )

        return compiled

    # ----------------------------------------------------------------------
    # Wave execution helpers
    # ----------------------------------------------------------------------

    async def _run_one_wave(
        self,
        wave: VoiceExtractionWave,
        *,
        prompt_inputs: dict[str, str],
    ) -> dict[str, Any]:
        """Execute a single distillation wave + parse + capture cost.

        Returns dict with ``parsed`` (dict from JSON), ``cost_usd`` (Decimal),
        and ``error`` (None or exception summary). Caller absorbs via
        ``_absorb_wave_result``.
        """
        prompt = _build_wave_prompt(wave.prompt_key, prompt_inputs)

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
            return {
                "parsed": {},
                "cost_usd": Decimal("0"),
                "error": f"timeout_after_{wave.timeout_sec}s",
                "_caught_type": type(exc).__name__,
            }
        except Exception as exc:  # noqa: BLE001 — defensive, wave failure is partial-result
            logger.warning(
                f"{self.log_prefix}_wave_failed",
                wave=wave.name,
                error_type=type(exc).__name__,
                error_msg=str(exc)[:200],
            )
            return {
                "parsed": {},
                "cost_usd": Decimal("0"),
                "error": f"exception:{type(exc).__name__}",
                "_caught_type": type(exc).__name__,
            }

        wave_duration_ms = int((time.monotonic() - wave_started) * 1000)

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
        wave: VoiceExtractionWave,
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

        extra_warnings = result["parsed"].get("wave_warnings", []) or []
        if isinstance(extra_warnings, list):
            wave_warnings.extend(str(w) for w in extra_warnings)

        if result.get("error"):
            wave_warnings.append(f"{wave.name}_{result['error']}")

    @staticmethod
    def _resolve_wave_cost(response: _LLMResponse, *, wave_name: str) -> Decimal | None:
        """Pull cost via LiteLLM CustomLogger bridge.

        Per PI-12 S1 T-1 cement: ``pop_cost(litellm_call_id)`` returns
        ``Decimal | None``. ``None`` means cost-unknown (do NOT default to 0
        — masks cost-tracking drift); surface as wave warning downstream.
        """
        if response.litellm_call_id is None:
            logger.warning(
                "comunify_voice_distillation.wave_cost_unknown_no_call_id",
                wave=wave_name,
            )
            return None
        cost = _pop_cost(response.litellm_call_id)
        if cost is None:
            logger.warning(
                "comunify_voice_distillation.wave_cost_unknown",
                wave=wave_name,
                call_id=response.litellm_call_id,
            )
        return cost

    @staticmethod
    def _parse_wave_json(content: str, *, wave_name: str) -> dict[str, Any]:
        """Parse wave LLM output as JSON, tolerantly stripping markdown fences."""
        text = content.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            if len(lines) >= 2:
                text = "\n".join(lines[1:-1] if lines[-1].startswith("```") else lines[1:])
        try:
            parsed = json.loads(text)
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError as exc:
            logger.warning(
                "comunify_voice_distillation.wave_json_parse_failed",
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
        samples_used: int,
    ) -> CompiledVoice:
        """Merge 4-wave outputs into final ``CompiledVoice`` instance.

        Defensive: any malformed entry from the LLM is silently dropped +
        warning recorded.

        Field origins per wave (per 03-arch-agentic § 5.3):
          * dialecto                 ← wave 1 (dialect_detection)
          * vocabulario              ← wave 2 (vocabulary_anchors_extraction)
          * registro                 ← wave 3 (register_tone_profile)
          * identidad / asi_no /     ← wave 4 (validate_and_compile_v2 — also
            anclajes                   refines wave 1-3 fields)
        """
        warnings = list(wave_warnings)
        missing_required: list[str] = []

        # Field extraction with type guards.
        w1 = wave_outputs.get("dialect_detection", {})
        w2 = wave_outputs.get("vocabulary_anchors_extraction", {})
        w3 = wave_outputs.get("register_tone_profile", {})
        w4 = wave_outputs.get("validate_and_compile_v2", {})

        # dialecto — wave 4 final has priority over wave 1 raw.
        dialecto = VoiceDistillationOrchestrator._safe_str(w4.get("dialecto"), max_chars=200) or (
            VoiceDistillationOrchestrator._safe_str(w1.get("dialecto"), max_chars=200) or ""
        )
        if not dialecto:
            missing_required.append("dialecto")

        # vocabulario — wave 4 refined, fall back to wave 2 raw.
        vocab_raw = w4.get("vocabulario") or w2.get("vocabulario") or []
        vocabulario = VoiceDistillationOrchestrator._safe_str_list(
            vocab_raw,
            max_items=200,
            max_chars=500,
            warnings=warnings,
            name="vocabulario",
        )
        if not vocabulario:
            missing_required.append("vocabulario")

        # registro — wave 4 refined, fall back to wave 3.
        registro = VoiceDistillationOrchestrator._safe_str(w4.get("registro"), max_chars=1000) or (
            VoiceDistillationOrchestrator._safe_str(w3.get("registro"), max_chars=1000) or ""
        )
        if not registro:
            missing_required.append("registro")

        # identidad / asi_no / anclajes — wave 4 only.
        identidad = VoiceDistillationOrchestrator._safe_str(w4.get("identidad"), max_chars=2000) or ""
        if not identidad:
            missing_required.append("identidad")

        asi_no = VoiceDistillationOrchestrator._safe_str_list(
            w4.get("asi_no") or [], max_items=50, max_chars=500, warnings=warnings, name="asi_no"
        )
        if not asi_no:
            missing_required.append("asi_no")

        anclajes = VoiceDistillationOrchestrator._safe_str_list(
            w4.get("anclajes") or [], max_items=20, max_chars=500, warnings=warnings, name="anclajes"
        )
        if not anclajes:
            missing_required.append("anclajes")

        # Aggregate confidence: weighted sum bounded [0, 1].
        base_confidence = sum(
            wave_confidences.get(name, 0.0) * weight for name, weight in _WAVE_CONFIDENCE_WEIGHTS.items()
        )
        # Validator adjustment bounded [-0.3, 0.0] per prompt contract.
        validator_adj = float(w4.get("validation_score_adjustment", 0.0) or 0.0)
        validator_adj = max(-0.3, min(0.0, validator_adj))
        confidence = max(0.0, min(1.0, base_confidence + validator_adj))

        return CompiledVoice(
            identidad=identidad,
            dialecto=dialecto,
            vocabulario=vocabulario,
            registro=registro,
            asi_no=asi_no,
            anclajes=anclajes,
            confidence_score=round(confidence, 3),
            samples_used=samples_used,
            missing_required_fields=missing_required,
            extraction_warnings=warnings,
        )

    @staticmethod
    def _safe_str(value: Any, *, max_chars: int) -> str | None:
        """Coerce arbitrary LLM-output value to a bounded string or None."""
        if value is None:
            return None
        if not isinstance(value, str):
            try:
                value = str(value)
            except Exception:  # noqa: BLE001
                return None
        value = value.strip()
        if not value:
            return None
        return value[:max_chars]

    @staticmethod
    def _safe_str_list(
        raw: Any,
        *,
        max_items: int,
        max_chars: int,
        warnings: list[str],
        name: str,
    ) -> list[str]:
        """Coerce arbitrary LLM-output list-of-strings, dropping invalid entries."""
        if not isinstance(raw, list):
            warnings.append(f"{name}_unexpected_type_{type(raw).__name__}")
            return []
        result: list[str] = []
        for idx, item in enumerate(raw[:max_items]):
            coerced = VoiceDistillationOrchestrator._safe_str(item, max_chars=max_chars)
            if coerced is None:
                warnings.append(f"{name}_item_{idx}_invalid")
                continue
            result.append(coerced)
        return result

    @staticmethod
    def _classify_final_status(compiled: CompiledVoice) -> tuple[str, str | None]:
        """Decide DB status string + optional error_reason.

        Returns:
          ("completed", None) — happy path, above MIN_ACCEPTABLE_CONFIDENCE.
          ("completed_low_confidence", "low_confidence:...") — completed but
            below threshold (caller surfaces creator notification).
          ("failed", "missing_required:...") — fundamental fields absent.
        """
        if compiled.missing_required_fields and len(compiled.missing_required_fields) >= 4:
            return "failed", f"missing_required:{','.join(compiled.missing_required_fields)}"
        if compiled.confidence_score < MIN_ACCEPTABLE_CONFIDENCE:
            return (
                "completed_low_confidence",
                f"low_confidence:{compiled.confidence_score:.3f}<{MIN_ACCEPTABLE_CONFIDENCE}",
            )
        return "completed", None

    # ----------------------------------------------------------------------
    # Persistence + side-effects (subclass concern, best-effort)
    # ----------------------------------------------------------------------

    async def _merge_and_save(
        self,
        *,
        compiled: CompiledVoice,
        tenant_id: uuid.UUID,
        job_id: uuid.UUID,
        wave_costs_usd: dict[str, Decimal],
        duration_ms: int,
        country: str,
        final_status: str,
        error_reason: str | None,
    ) -> None:
        """Run side-effects (all best-effort, never raise).

        Order matters:
          1. Update job row (status, confidence_score, compiled_blocks, cost,
             error_reason, completed_at).
          2. Emit outbox event (VoiceDistillationCompletedV1 on success,
             VoiceDistillationFailedV1 on hard failure).
          3. Audit log (voice_distillation_completed).
          4. DELETE raw samples (D15 privacy — only on success).

        Any single side-effect failing MUST NOT raise to the caller.
        """
        total_cost = sum(wave_costs_usd.values(), Decimal("0"))
        completed_at = _utc_now()

        # 1. Job row update.
        if self._job_repo is not None:
            try:
                await self._job_repo.update_status(
                    job_id,
                    status=final_status,
                    confidence_score=compiled.confidence_score,
                    compiled_blocks=compiled.model_dump(mode="json"),
                    error_reason=error_reason,
                    completed_at=completed_at,
                )
            except Exception as exc:  # noqa: BLE001
                logger.warning(
                    f"{self.log_prefix}_persist_job_failed",
                    error_type=type(exc).__name__,
                    error_msg=str(exc)[:200],
                    tenant_id=str(tenant_id),
                    job_id=str(job_id),
                )

        # 2. Outbox domain event.
        if self._outbox is not None:
            try:
                event_type = (
                    "VoiceDistillationCompletedV1"
                    if final_status in {"completed", "completed_low_confidence"}
                    else "VoiceDistillationFailedV1"
                )
                event_payload = _sanitize_payload(
                    {
                        "job_id": str(job_id),
                        "extractor_version": EXTRACTOR_VERSION,
                        "schema_version": compiled.schema_version,
                        "confidence_score": compiled.confidence_score,
                        "samples_used": compiled.samples_used,
                        "dialecto": compiled.dialecto,  # short string, no PII
                        "vocab_anchors_count": len(compiled.vocabulario),
                        "asi_no_count": len(compiled.asi_no),
                        "anclajes_count": len(compiled.anclajes),
                        "warnings_count": len(compiled.extraction_warnings),
                        "missing_required_count": len(compiled.missing_required_fields),
                        "duration_ms": duration_ms,
                        "total_cost_usd": str(total_cost),
                        "country": country,
                        "final_status": final_status,
                        "error_reason": error_reason,
                    }
                )
                await self._outbox.publish(
                    event_type=event_type,
                    tenant_id=tenant_id,
                    payload=event_payload,
                )
            except Exception as exc:  # noqa: BLE001
                logger.warning(
                    f"{self.log_prefix}_outbox_publish_failed",
                    error_type=type(exc).__name__,
                    error_msg=str(exc)[:200],
                    tenant_id=str(tenant_id),
                    job_id=str(job_id),
                )

        # 3. Audit log.
        if self._audit_log is not None:
            try:
                audit_payload = _sanitize_payload(
                    {
                        "job_id": str(job_id),
                        "extractor_version": EXTRACTOR_VERSION,
                        "confidence_score": compiled.confidence_score,
                        "samples_used": compiled.samples_used,
                        "final_status": final_status,
                        "needs_manual_review": compiled.confidence_score < MIN_ACCEPTABLE_CONFIDENCE,
                        "warnings": list(compiled.extraction_warnings),
                    }
                )
                await self._audit_log.log(
                    tenant_id=tenant_id,
                    event_type="voice_distillation_completed",
                    payload=audit_payload,
                )
            except Exception as exc:  # noqa: BLE001
                logger.warning(
                    f"{self.log_prefix}_audit_log_failed",
                    error_type=type(exc).__name__,
                    error_msg=str(exc)[:200],
                    tenant_id=str(tenant_id),
                    job_id=str(job_id),
                )

        # 4. Raw samples deletion (D15 — only on successful completion).
        if self._raw_samples_remover is not None and final_status in {"completed", "completed_low_confidence"}:
            try:
                await self._raw_samples_remover.delete_raw_samples(
                    tenant_id=tenant_id,
                    job_id=job_id,
                )
            except Exception as exc:  # noqa: BLE001
                logger.warning(
                    f"{self.log_prefix}_raw_samples_delete_failed",
                    error_type=type(exc).__name__,
                    error_msg=str(exc)[:200],
                    tenant_id=str(tenant_id),
                    job_id=str(job_id),
                )


# ─── Wave prompts (inline, cache-prefix invariant) ────────────────────────
#
# Kept inline per same convention as ``offer_ladder_advisor._WAVE_PROMPTS``.
# Markers ``<<KEY>>`` keep the cache prefix byte-identical across calls until
# the marker boundary; caller substitutes via ``str.replace`` (not
# ``str.format`` — JSON braces are literal).
#
# D15 privacy: prompts instruct the LLM to extract PATTERNS, never echo raw
# message content. The cache prefix DOES NOT contain {tenant_id} or any
# per-tenant interpolation — only the literal task framing.
#
_WAVE_PROMPTS: dict[str, str] = {
    "dialect_detection": (
        "You are a Spanish-language dialect detector for Latin America. Given "
        "a JSON array of chat messages from a single creator, identify the "
        "creator's primary Spanish dialect (es-AR voseo, es-CL tuteo chileno, "
        "es-MX neutro broad, es-PE neutro, es-CO neutro, es-EC neutro, or other). "
        "Return JSON only, no markdown fences.\n\n"
        "Schema:\n"
        "{\n"
        '  "dialecto": "<dialect descriptor, e.g. \'es-AR voseo natural\'>",\n'
        '  "dialect_evidence": ["<short evidence phrase>", ...],\n'
        '  "wave_confidence": <0.0..1.0>,\n'
        '  "wave_warnings": ["<string>", ...]\n'
        "}\n\n"
        "Inputs (after this marker, do NOT echo verbatim):\n"
        "<<COUNTRY>>: <<COUNTRY_VALUE>>\n"
        "<<SAMPLES_COUNT>>: <<SAMPLES_COUNT_VALUE>>\n"
        "<<CHAT_SAMPLES_JSON>>: <<CHAT_SAMPLES_JSON_VALUE>>\n"
    ),
    "vocabulary_anchors": (
        "You are a vocabulary-pattern extractor for a brand-voice cloning "
        "pipeline. Given a JSON array of chat messages from a creator + the "
        "detected dialect, extract the creator's signature vocabulary — "
        "frequent phrases, filler words, emoji style, signature openers/"
        "closers. PATTERN-only, NEVER echo raw PII (no names, no phones, no "
        "emails, no DNI / RUT / CURP / RFC). Return JSON only, no markdown "
        "fences.\n\n"
        "Schema:\n"
        "{\n"
        '  "vocabulario": ["<phrase or filler>", ...],\n'
        "  \"emoji_style\": \"<'none' | 'minimal' | 'moderate' | 'frequent' | 'maximal'>\",\n"
        '  "favorite_emojis": ["<emoji>", ...],\n'
        '  "filler_phrases": ["<phrase>", ...],\n'
        '  "wave_confidence": <0.0..1.0>,\n'
        '  "wave_warnings": ["<string>", ...]\n'
        "}\n\n"
        "Inputs (after this marker, do NOT echo verbatim):\n"
        "<<COUNTRY>>: <<COUNTRY_VALUE>>\n"
        "<<WAVE_1_OUTPUT_JSON>>: <<WAVE_1_OUTPUT_JSON_VALUE>>\n"
        "<<CHAT_SAMPLES_JSON>>: <<CHAT_SAMPLES_JSON_VALUE>>\n"
    ),
    "register_tone": (
        "You are a register + tone profiler for a brand-voice cloning pipeline. "
        "Given chat samples + detected dialect + vocabulary anchors, profile "
        "the creator's register (formal / informal / mixed), warmth level, "
        "humor style, expressiveness, and verbosity. Return JSON only, no "
        "markdown fences.\n\n"
        "Schema:\n"
        "{\n"
        '  "registro": "<single-sentence tone descriptor, e.g. \'cercano informal con humor cálido\'>",\n'
        "  \"energy_level\": \"<'muy_baja' | 'baja' | 'media' | 'alta' | 'electrica'>\",\n"
        "  \"warmth_level\": \"<'distante' | 'cordial' | 'amable' | 'cercana' | 'intima'>\",\n"
        "  \"humor_type\": \"<'none' | 'dry' | 'playful' | 'sarcastic' | 'absurd'>\",\n"
        "  \"verbosity\": \"<'telegrafico' | 'corto' | 'medio' | 'elaborado' | 'maximalista'>\",\n"
        '  "wave_confidence": <0.0..1.0>,\n'
        '  "wave_warnings": ["<string>", ...]\n'
        "}\n\n"
        "Inputs (after this marker, do NOT echo verbatim):\n"
        "<<WAVE_1_OUTPUT_JSON>>: <<WAVE_1_OUTPUT_JSON_VALUE>>\n"
        "<<WAVE_2_OUTPUT_JSON>>: <<WAVE_2_OUTPUT_JSON_VALUE>>\n"
        "<<CHAT_SAMPLES_JSON>>: <<CHAT_SAMPLES_JSON_VALUE>>\n"
    ),
    "validate_compile_v2": (
        "You are the validator + final compiler for a 4-wave brand-voice "
        "distillation pipeline. Given wave 1 (dialect), wave 2 (vocabulary), "
        "wave 3 (register/tone) outputs, compile the final 6-bloque "
        "CompiledVoice v2 schema. Cross-check consistency. Surface NUNCA "
        "rules (negative constraints) the creator should respect, and "
        "identity anchors. Return JSON only, no markdown fences.\n\n"
        "Schema:\n"
        "{\n"
        '  "identidad": "<role + identity anchor sentence>",\n'
        '  "dialecto": "<refined dialect descriptor>",\n'
        '  "vocabulario": ["<refined vocabulary anchor>", ...],\n'
        '  "registro": "<refined tone descriptor>",\n'
        '  "asi_no": ["<NUNCA rule>", ...],\n'
        '  "anclajes": ["<immutable identity anchor>", ...],\n'
        '  "validation_score_adjustment": <-0.3..0.0>,\n'
        '  "consistency_notes": "<string>",\n'
        '  "wave_confidence": <0.0..1.0>,\n'
        '  "wave_warnings": ["<string>", ...]\n'
        "}\n\n"
        "Inputs (after this marker, do NOT echo verbatim):\n"
        "<<COUNTRY>>: <<COUNTRY_VALUE>>\n"
        "<<WAVE_1_OUTPUT_JSON>>: <<WAVE_1_OUTPUT_JSON_VALUE>>\n"
        "<<WAVE_2_OUTPUT_JSON>>: <<WAVE_2_OUTPUT_JSON_VALUE>>\n"
        "<<WAVE_3_OUTPUT_JSON>>: <<WAVE_3_OUTPUT_JSON_VALUE>>\n"
    ),
}


def _build_wave_prompt(prompt_key: str, inputs: dict[str, str]) -> str:
    """Substitute prompt placeholders.

    Uses ``str.replace`` (not ``str.format``) — JSON braces in the schema
    examples are literal. Markers ``<<KEY>>_VALUE`` keep the cache prefix
    byte-identical across calls until the marker boundary.

    Raises:
        KeyError if prompt_key is unknown — programmer error, fail loud.
    """
    template = _WAVE_PROMPTS[prompt_key]
    out = template
    for key, value in inputs.items():
        marker = f"<<{key.upper()}_VALUE>>"
        out = out.replace(marker, value)
    return out


__all__ = [
    "DEFAULT_COST_BUDGET_USD",
    "EXTRACTOR_VERSION",
    "MIN_ACCEPTABLE_CONFIDENCE",
    "VoiceDistillationOrchestrator",
]
