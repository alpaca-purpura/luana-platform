"""Comunify AGENTIC extractor — ``AuthorityVaultExtractor`` (T-extractors-2, R23 Opus 4.7).

EXTENDS ``luana_core_extraction.base_orchestrator.BaseExtractionOrchestrator``
per ``.claude/rules/anti-duplication.md`` SSoT row (wave-based LLM extraction
lift shared, NOT mirror). Arch fitness gate
``test_extraction_orchestrator_inheritance.py`` validates the subclass
invariant. Sibling pattern: ``OfferLadderAdvisor`` (T-extractors-1, same
ticket family, same wave engine).

4-wave pipeline (per 03-arch-agentic § 5.2 + 02-design § 7.2):
  W1  credentials_and_awards     reasoning  Sonnet  ≤30 s
  W2  case_studies               reasoning  Sonnet  ≤30 s
  W3  press_and_social_proof     nano       Haiku   ≤30 s
  W4  validate_and_merge         reasoning  Sonnet  ≤25 s

Cost budget: ≤$0.08 USD per extraction (V-AE-8 + 02-design § 14.3 +
03-arch-agentic § 5.2). Latency: p50 12 s / p99 30 s. ASYNC.

Inputs:
  * tenant_id   (R2 isolation — every persistence + Qdrant + outbox + audit)
  * source_text Free-form bio / LinkedIn paste / interview transcript / About
                section text. Empty → graceful low-signal path returns empty
                arrays + low_signal warning (no false positives).

Side-effects (best-effort, never break extractor turn):
  * Pre-fills ``authority_vault_repo`` rows with
    ``status='extracted_pending_ratification'`` (creator reviews + ratifies
    in Brand Studio before final persistence as
    ``ComunifyAuthorityVaultItemModel`` polymorphic rows).
  * Indexes structured extraction to per-tenant Qdrant collection (RAG
    context for ``nurture_via_authority_content`` tool).
  * Emits ``AuthorityVaultExtractedV1`` domain event via outbox.
  * Audit_log ``authority_vault_extracted``.

All side-effects wrapped in ``try/except + structlog.warning`` per R23 —
failure to persist or index MUST NOT raise extractor exceptions. Extractor
turn is "successful" iff at least one wave produced a partial output
(degraded ``confidence_score`` reflects quality).

Tenant isolation (R2): ``tenant_id`` forwarded to every side-effect
collaborator. Cross-tenant boundary enforced at the repo/qdrant/outbox/audit
collaborator level (callers inject tenant-scoped instances).

PII handling:
  * Source text typically carries creator-public bio content (intentionally
    self-disclosed). DEFENSE IN DEPTH: outbox/audit payloads carry ONLY
    sanitised statistics (counts + confidence + cost + duration) — never the
    raw source_text or any string slices that could surface PII.
  * Extraction outputs (Pydantic primitives) MAY carry URLs the creator
    explicitly mentioned (institution / publication links) — those are
    treated as public references, not PII.
  * ``sanitize_payload`` is applied to every observability write as the
    final guard.

Anti-duplication audit (Step 0 GATE pre-write, 2026-05-14):
  * ``grep -rn "class AuthorityVaultExtractor"`` cross luana-platform +
    AISALESHT backend → zero collisions. Only design/arch MDs +
    ``extensions.py`` (EP-7 placeholder reference) + ``brand.yaml``
    declaration. All NEW symbols.
  * ``grep -rn "class AuthorityVaultExtractedV1\\|class Credential\\|class CaseStudy"``
    → zero collisions. ``PressMentionResponse`` / ``AwardResponse`` existing
    in ``api/dtos/authority_vault_dtos.py`` are API-layer Response DTOs
    (different purpose: serialise persisted rows). Extractor primitives live
    in ``_schemas.py`` as domain-level extraction-output entities.
  * Wave + sleep + progress mechanics consumed from
    ``BaseExtractionOrchestrator``. NEVER re-implemented.
  * ``sanitize_payload`` consumed from
    ``luana_core_observability.recording.sanitization`` with truncate-only
    fallback (mirrors ``offer_ladder_advisor.py`` lazy import pattern).
  * ``pop_cost`` consumed from
    ``luana_core_observability.recording.cost_recorder`` (LiteLLM
    CustomLogger bridge per PI-12 S1 T-1 cement) with same lazy guard.
  * ``_LLMResponse`` + ``_LiteLLMServiceLike`` re-imported FROM
    ``offer_ladder_advisor`` to keep N=1 source-of-truth INSIDE the comunify
    extractors package (anti-duplication threshold N=2 across siblings
    addressed by intra-package re-export — wall-clock cheaper than a
    second mirror; lift-to-shared remains a follow-up when 3rd extractor
    surfaces per ``_schemas.py`` doc).

Spec sources:
  * 01-spec.md § 2191-2202 (authority vault subsections + scenarios)
  * 02-design-agentic.md § 7.2 (inputs / outputs / side-effects / cost / errors)
  * 03-arch-agentic.md § 5.2 (wave composition + AuthorityVaultExtractedV1 schema)
  * 04-validators.yaml::V-AE-8
  * 06-tickets.yaml::T-extractors-2 acceptance + decisions D1
  * 05-guidelines.md § 1.10 R23 (production_code AGENTIC → Opus 4.7)
"""

from __future__ import annotations

import asyncio
import json
import time
import uuid
from decimal import Decimal
from typing import Any, Protocol

import structlog
from luana_core_extraction.base_orchestrator import BaseExtractionOrchestrator

from src.modules.comunify.copilot.extractors._schemas import (
    AuthorityVaultExtractedV1,
    Award,
    CaseStudy,
    Credential,
    ExtractionWave,
    PressMention,
    SocialProofSignals,
    SpeakingEngagement,
)

# Re-use LLM transport primitives from the sibling extractor to keep N=1
# source-of-truth INSIDE the comunify extractors package (anti-duplication
# threshold managed at the package level; lift-to-shared deferred per
# offer_ladder_advisor.py docstring).
from src.modules.comunify.copilot.extractors.offer_ladder_advisor import _LLMResponse

logger = structlog.get_logger(__name__)

# ─── Configuration constants ─────────────────────────────────────────────


# Confidence weighting per wave (sums to 1.0). Wave 4 only adjusts via
# ``validation_score_adjustment`` — it does NOT contribute base score.
_WAVE_CONFIDENCE_WEIGHTS: dict[str, float] = {
    "credentials_and_awards": 0.30,
    "case_studies": 0.30,
    "press_and_social_proof": 0.30,
    "validate_and_merge": 0.10,
}

# Per-wave hard cost ceiling (defensive). Sum ≤ V-AE-8 budget $0.08 USD.
_PER_WAVE_COST_CEILING_USD: dict[str, Decimal] = {
    "credentials_and_awards": Decimal("0.030"),
    "case_studies": Decimal("0.030"),
    "press_and_social_proof": Decimal("0.015"),  # Haiku
    "validate_and_merge": Decimal("0.010"),
}

# Total extraction cost ceiling — V-AE-8 SSoT (≤$0.08 USD per extraction per
# 03-arch-agentic § 5.2 + 02-design § 14.3). Caller can lower via constructor
# kwarg; raising requires CONTRACT bump.
DEFAULT_COST_BUDGET_USD: Decimal = Decimal("0.08")

# Minimum confidence below which the extractor flags for creator manual
# review. Mirrors offer_ladder_advisor parity.
MIN_ACCEPTABLE_CONFIDENCE: float = 0.7

# Extractor schema version cement — emitted in domain event + audit log.
AUTHORITY_VAULT_EXTRACTOR_VERSION: str = "authority_vault_extractor_v1"

# Canonical kinds matching ``ComunifyAuthorityVaultItemModel.kind`` column +
# ``AuthorityVaultRepository._VALID_KINDS``. ``speaking_engagements`` is
# persisted under ``press_mentions`` kind with content-level discriminator
# (per ``_schemas.SpeakingEngagement`` docstring + 03-arch-be § 7).
_PERSISTENCE_KINDS: tuple[str, ...] = ("credentials", "case_studies", "press_mentions", "awards")

# Pending ratification status — creator MUST review + accept before the row
# transitions to "active" in the authority_vault editor. Per ticket spec.
_PENDING_RATIFICATION_STATUS: str = "extracted_pending_ratification"

# Outbox event type cement — schema_version + extractor_version embedded in
# payload for downstream consumers.
_OUTBOX_EVENT_TYPE: str = "AuthorityVaultExtractedV1"

# Audit log event type cement.
_AUDIT_EVENT_TYPE: str = "authority_vault_extracted"


# ─── Lazy observability helpers (mirror offer_ladder_advisor.py) ─────────


def _sanitize_payload(payload: dict[str, Any]) -> dict[str, Any]:
    """Sanitize payload via luana_core_observability or truncate-only fallback.

    Best-effort: when the observability package is not importable (e.g.
    minimal test environment), fall back to per-key string truncation.
    Mirrors the pattern in ``offer_ladder_advisor.py``.
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

    Best-effort: when the observability package is unavailable, returns
    ``None`` (cost-unknown). Caller MUST treat ``None`` as a signal that cost
    is unknown — NEVER default to 0 USD silently (would mask cost-tracking
    drift).
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


# ─── Collaborator protocols ───────────────────────────────────────────────


class _LiteLLMServiceLike(Protocol):
    """Minimal surface consumed from a LiteLLM-backed chat service.

    Subset of ``luana_core_llm.providers.litellm.LiteLLMService`` — only
    methods exercised by the extractor are declared.
    """

    async def ainvoke_text(
        self,
        *,
        role: str,
        prompt: str,
        timeout_sec: float,
    ) -> _LLMResponse: ...


class _AuthorityVaultRepoLike(Protocol):
    """Optional repo for persisting pre-filled pending-ratification rows.

    Per ticket spec:
        "_merge_and_save() writes pre-filled rows to authority_vault_items
        with status='extracted_pending_ratification'"

    NB: the underlying table (``comunify_authority_vault_items``) is the
    polymorphic single-table model
    (``ComunifyAuthorityVaultItemModel``). The actual ``status`` column is
    NOT yet materialised in alembic — repo wraps the contract today and
    will translate to ``content.status`` JSONB key (or a new column) per
    Brand Studio ratification flow (T-be-* future ticket). For
    T-extractors-2, the extractor's contract surface is the repo Protocol
    — alembic schema parity is a downstream concern.
    """

    async def save_pending_ratification(
        self,
        *,
        tenant_id: uuid.UUID,
        rows: list[dict[str, Any]],
    ) -> None: ...


class _QdrantIndexerLike(Protocol):
    """Minimal surface for indexing structured extraction into Qdrant."""

    async def index_authority_vault_extracted(
        self,
        *,
        tenant_id: uuid.UUID,
        extraction_id: uuid.UUID,
        payload: dict[str, Any],
    ) -> None: ...


class _OutboxLike(Protocol):
    """Minimal surface for outbox-pattern event emission.

    Outbox pattern (USE_OUTBOX_PATTERN_* default True per 2026-04-29
    cutover) — NEVER use legacy ``EventBus.publish``.
    """

    async def publish(
        self,
        *,
        event_type: str,
        tenant_id: uuid.UUID,
        payload: dict[str, Any],
    ) -> None: ...


class _AuditLogLike(Protocol):
    """Minimal surface for community_audit_log writes."""

    async def log(
        self,
        *,
        tenant_id: uuid.UUID,
        event_type: str,
        payload: dict[str, Any],
    ) -> None: ...


# ─── Extractor (extends BaseExtractionOrchestrator) ──────────────────────


class AuthorityVaultExtractor(BaseExtractionOrchestrator):
    """Wave-based extraction of authority signals (credentials / awards /
    case studies / press / speaking engagements / social proof) from a
    creator's free-form source text.

    Subclass concerns (per ``BaseExtractionOrchestrator`` contract):
      * ``run(...)`` — entry point.
      * ``_define_waves()`` — wave configuration.
      * ``_merge_and_save(...)`` — domain entity persistence.
    """

    log_prefix = "comunify_authority_vault_extractor"
    default_wave_delay_seconds: float = 0.0  # LLM-bound; no inter-wave throttle.

    def __init__(
        self,
        *,
        llm_service: _LiteLLMServiceLike,
        authority_vault_repo: _AuthorityVaultRepoLike | None = None,
        qdrant_indexer: _QdrantIndexerLike | None = None,
        outbox: _OutboxLike | None = None,
        audit_log: _AuditLogLike | None = None,
        cost_budget_usd: Decimal = DEFAULT_COST_BUDGET_USD,
    ) -> None:
        """Initialise extractor with required + optional collaborators.

        Required:
          ``llm_service``.
        Optional (best-effort side-effects when supplied; ``None`` is fine):
          ``authority_vault_repo``, ``qdrant_indexer``, ``outbox``,
          ``audit_log``.

        ``cost_budget_usd`` defaults to V-AE-8 SSoT (0.08 USD). Lower via
        kwarg for cost-sensitive tenants; raising requires CONTRACT bump.

        D1 (DI): all collaborators injected via constructor. No global state.
        """
        self._llm = llm_service
        self._authority_vault_repo = authority_vault_repo
        self._qdrant = qdrant_indexer
        self._outbox = outbox
        self._audit_log = audit_log
        self._cost_budget_usd = cost_budget_usd
        self._waves = self._define_waves()

    # ------------------------------------------------------------------
    # Wave definition (subclass concern)
    # ------------------------------------------------------------------

    @staticmethod
    def _define_waves() -> list[ExtractionWave]:
        """Return the 4 waves that compose the authority vault extraction."""
        return [
            ExtractionWave(
                name="credentials_and_awards",
                model_role="reasoning",  # Sonnet 4.6
                timeout_sec=30.0,
            ),
            ExtractionWave(
                name="case_studies",
                model_role="reasoning",  # Sonnet 4.6
                timeout_sec=30.0,
            ),
            ExtractionWave(
                name="press_and_social_proof",
                model_role="nano",  # Haiku 4.5 — cheaper for press scanning
                timeout_sec=30.0,
            ),
            ExtractionWave(
                name="validate_and_merge",
                model_role="reasoning",  # Sonnet 4.6 validator
                timeout_sec=25.0,
            ),
        ]

    # ------------------------------------------------------------------
    # Public entry point
    # ------------------------------------------------------------------

    async def run(
        self,
        *,
        tenant_id: uuid.UUID,
        source_text: str,
    ) -> AuthorityVaultExtractedV1:
        """Run the 4-wave authority vault extraction pipeline.

        Parameters
        ----------
        tenant_id
            Required. Filters every persistence + Qdrant + outbox + audit
            (R2 tenant-isolation invariant).
        source_text
            Free-form creator bio / LinkedIn paste / interview transcript /
            About-section text. Empty / whitespace-only → graceful path:
            all waves still run but with explicit "empty_source_text" hint;
            extractor returns empty arrays + low_signal warning (no false
            positives).

        Returns
        -------
        AuthorityVaultExtractedV1
            Always returns a non-None instance. ``confidence_score`` reflects
            extraction quality. ``extraction_warnings`` carries per-wave
            warnings (timeouts, parse failures, low-signal hints, etc.).
        """
        run_started = time.monotonic()
        empty_source = not source_text or not source_text.strip()
        logger.info(
            f"{self.log_prefix}_starting",
            tenant_id=str(tenant_id),
            source_text_chars=len(source_text or ""),
            empty_source=empty_source,
        )

        wave_outputs: dict[str, dict[str, Any]] = {}
        wave_costs_usd: dict[str, Decimal] = {}
        wave_warnings: list[str] = []
        wave_confidences: dict[str, float] = {}

        # ── Wave 1: credentials_and_awards ───────────────────────────────
        wave_1 = self._waves[0]
        wave_1_result = await self._run_one_wave(
            wave_1,
            prompt_inputs={
                "source_text": source_text or "",
                "empty_source_hint": str(empty_source).lower(),
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

        # ── Wave 2: case_studies ─────────────────────────────────────────
        wave_2 = self._waves[1]
        wave_2_result = await self._run_one_wave(
            wave_2,
            prompt_inputs={
                "source_text": source_text or "",
                "wave_1_output_json": json.dumps(wave_outputs.get("credentials_and_awards", {}), ensure_ascii=False),
                "empty_source_hint": str(empty_source).lower(),
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

        # ── Wave 3: press_and_social_proof (Haiku) ───────────────────────
        wave_3 = self._waves[2]
        wave_3_result = await self._run_one_wave(
            wave_3,
            prompt_inputs={
                "source_text": source_text or "",
                "wave_1_output_json": json.dumps(wave_outputs.get("credentials_and_awards", {}), ensure_ascii=False),
                "empty_source_hint": str(empty_source).lower(),
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

        # ── Wave 4: validate_and_merge ───────────────────────────────────
        wave_4 = self._waves[3]
        wave_4_result = await self._run_one_wave(
            wave_4,
            prompt_inputs={
                "wave_1_output_json": json.dumps(wave_outputs.get("credentials_and_awards", {}), ensure_ascii=False),
                "wave_2_output_json": json.dumps(wave_outputs.get("case_studies", {}), ensure_ascii=False),
                "wave_3_output_json": json.dumps(wave_outputs.get("press_and_social_proof", {}), ensure_ascii=False),
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

        # ── Cost budget enforcement (V-AE-8 SSoT) ────────────────────────
        total_cost = sum(wave_costs_usd.values(), Decimal("0"))
        if total_cost > self._cost_budget_usd:
            logger.warning(
                f"{self.log_prefix}_cost_budget_exceeded",
                total_cost_usd=str(total_cost),
                budget_usd=str(self._cost_budget_usd),
                tenant_id=str(tenant_id),
            )
            wave_warnings.append(f"cost_budget_exceeded:total={total_cost}_USD>{self._cost_budget_usd}")

        # ── Empty-source hint warning (advisory, not an error) ───────────
        if empty_source:
            wave_warnings.append("empty_source_text:no_signal_to_extract")

        # ── Merge wave outputs into AuthorityVaultExtractedV1 ────────────
        extracted = self._merge_outputs(
            wave_outputs=wave_outputs,
            wave_confidences=wave_confidences,
            wave_warnings=wave_warnings,
        )

        duration_ms = int((time.monotonic() - run_started) * 1000)

        # ── Best-effort persistence + side-effects (each isolated) ───────
        extraction_id = uuid.uuid4()
        await self._merge_and_save(
            extracted=extracted,
            tenant_id=tenant_id,
            extraction_id=extraction_id,
            wave_costs_usd=wave_costs_usd,
            duration_ms=duration_ms,
            source_text_chars=len(source_text or ""),
        )

        logger.info(
            f"{self.log_prefix}_complete",
            tenant_id=str(tenant_id),
            extraction_id=str(extraction_id),
            confidence_score=extracted.confidence_score,
            total_cost_usd=str(total_cost),
            duration_ms=duration_ms,
            credentials_count=len(extracted.credentials),
            case_studies_count=len(extracted.case_studies),
            press_mentions_count=len(extracted.press_mentions),
            awards_count=len(extracted.awards),
            warnings_count=len(extracted.extraction_warnings),
        )

        return extracted

    # ------------------------------------------------------------------
    # Wave execution helpers
    # ------------------------------------------------------------------

    async def _run_one_wave(
        self,
        wave: ExtractionWave,
        *,
        prompt_inputs: dict[str, str],
    ) -> dict[str, Any]:
        """Execute a single extraction wave + parse + capture cost."""
        prompt = _build_wave_prompt(wave.name, prompt_inputs)

        wave_started = time.monotonic()
        try:
            response = await asyncio.wait_for(
                self._llm.ainvoke_text(
                    role=wave.model_role,
                    prompt=prompt,
                    timeout_sec=wave.timeout_sec,
                ),
                timeout=wave.timeout_sec + 2.0,
            )
        except TimeoutError:
            logger.warning(
                f"{self.log_prefix}_wave_timeout",
                wave=wave.name,
                timeout_sec=wave.timeout_sec,
            )
            return {"parsed": {}, "cost_usd": Decimal("0"), "error": f"timeout_after_{wave.timeout_sec}s"}
        except Exception as exc:  # noqa: BLE001 — defensive
            logger.warning(
                f"{self.log_prefix}_wave_failed",
                wave=wave.name,
                error_type=type(exc).__name__,
                error_msg=str(exc)[:200],
            )
            return {"parsed": {}, "cost_usd": Decimal("0"), "error": f"exception:{type(exc).__name__}"}

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

        extra_warnings = result["parsed"].get("wave_warnings", []) or []
        if isinstance(extra_warnings, list):
            wave_warnings.extend(str(w) for w in extra_warnings)

        if result.get("error"):
            wave_warnings.append(f"{wave.name}_{result['error']}")

    @staticmethod
    def _resolve_wave_cost(response: _LLMResponse, *, wave_name: str) -> Decimal | None:
        """Pull cost via LiteLLM CustomLogger bridge."""
        if response.litellm_call_id is None:
            logger.warning(
                "comunify_authority_vault_extractor.wave_cost_unknown_no_call_id",
                wave=wave_name,
            )
            return None
        cost = _pop_cost(response.litellm_call_id)
        if cost is None:
            logger.warning(
                "comunify_authority_vault_extractor.wave_cost_unknown",
                wave=wave_name,
                call_id=response.litellm_call_id,
            )
        return cost

    @staticmethod
    def _parse_wave_json(content: str, *, wave_name: str) -> dict[str, Any]:
        """Parse wave LLM output as JSON. Tolerant to markdown fences."""
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
                "comunify_authority_vault_extractor.wave_json_parse_failed",
                wave=wave_name,
                error=str(exc)[:200],
                content_preview=text[:200],
            )
        return {}

    # ------------------------------------------------------------------
    # Merge logic (subclass concern)
    # ------------------------------------------------------------------

    @staticmethod
    def _merge_outputs(
        *,
        wave_outputs: dict[str, dict[str, Any]],
        wave_confidences: dict[str, float],
        wave_warnings: list[str],
    ) -> AuthorityVaultExtractedV1:
        """Merge 4-wave outputs into final ``AuthorityVaultExtractedV1``.

        Primitives constructed defensively: any malformed entry from the LLM
        is silently dropped + warning recorded.
        """
        warnings = list(wave_warnings)

        credentials_raw = wave_outputs.get("credentials_and_awards", {}).get("credentials", [])
        credentials = AuthorityVaultExtractor._parse_list(
            credentials_raw, Credential, warnings, entity_name="credential"
        )

        awards_raw = wave_outputs.get("credentials_and_awards", {}).get("awards", [])
        awards = AuthorityVaultExtractor._parse_list(awards_raw, Award, warnings, entity_name="award")

        case_studies_raw = wave_outputs.get("case_studies", {}).get("case_studies", [])
        case_studies = AuthorityVaultExtractor._parse_list(
            case_studies_raw, CaseStudy, warnings, entity_name="case_study"
        )

        press_raw = wave_outputs.get("press_and_social_proof", {}).get("press_mentions", [])
        press_mentions = AuthorityVaultExtractor._parse_list(
            press_raw, PressMention, warnings, entity_name="press_mention"
        )

        speaking_raw = wave_outputs.get("press_and_social_proof", {}).get("speaking_engagements", [])
        speaking_engagements = AuthorityVaultExtractor._parse_list(
            speaking_raw, SpeakingEngagement, warnings, entity_name="speaking_engagement"
        )

        social_proof_raw = wave_outputs.get("press_and_social_proof", {}).get("social_proof")
        social_proof = (
            AuthorityVaultExtractor._parse_optional(
                social_proof_raw, SocialProofSignals, warnings, entity_name="social_proof"
            )
            or SocialProofSignals()
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

        return AuthorityVaultExtractedV1(
            credentials=credentials,
            case_studies=case_studies,
            press_mentions=press_mentions,
            speaking_engagements=speaking_engagements,
            awards=awards,
            social_proof=social_proof,
            confidence_score=round(confidence, 3),
            missing_required_fields=missing_required,
            extraction_warnings=warnings,
        )

    @staticmethod
    def _parse_list(
        raw: Any,
        cls: type,
        warnings: list[str],
        *,
        entity_name: str,
    ) -> list[Any]:
        """Defensively construct a list of Pydantic instances."""
        result: list[Any] = []
        if not isinstance(raw, list):
            if raw is not None:
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

    # ------------------------------------------------------------------
    # Persistence + side-effects (subclass concern, best-effort)
    # ------------------------------------------------------------------

    async def _merge_and_save(
        self,
        *,
        extracted: AuthorityVaultExtractedV1,
        tenant_id: uuid.UUID,
        extraction_id: uuid.UUID,
        wave_costs_usd: dict[str, Decimal],
        duration_ms: int,
        source_text_chars: int,
    ) -> None:
        """Run side-effects (all best-effort, never raise).

        Order:
          1. Persist pre-filled pending-ratification rows (when repo supplied).
          2. Index Qdrant (RAG visibility).
          3. Outbox event emission.
          4. Audit log.

        Any single side-effect failing MUST NOT raise to the caller.
        """
        total_cost = sum(wave_costs_usd.values(), Decimal("0"))

        # 1. Pending-ratification rows: one per extracted entity, polymorphic
        # kind per ``ComunifyAuthorityVaultItemModel``.
        if self._authority_vault_repo is not None:
            try:
                rows = self._build_pending_rows(
                    extracted=extracted,
                    tenant_id=tenant_id,
                    extraction_id=extraction_id,
                )
                await self._authority_vault_repo.save_pending_ratification(
                    tenant_id=tenant_id,
                    rows=rows,
                )
            except Exception as exc:  # noqa: BLE001
                logger.warning(
                    f"{self.log_prefix}_persist_pending_rows_failed",
                    error_type=type(exc).__name__,
                    error_msg=str(exc)[:200],
                    tenant_id=str(tenant_id),
                    extraction_id=str(extraction_id),
                )

        # 2. Qdrant indexing (RAG for nurture_via_authority_content tool).
        if self._qdrant is not None:
            try:
                payload = _sanitize_payload(extracted.model_dump(mode="json"))
                await self._qdrant.index_authority_vault_extracted(
                    tenant_id=tenant_id,
                    extraction_id=extraction_id,
                    payload=payload,
                )
            except Exception as exc:  # noqa: BLE001
                logger.warning(
                    f"{self.log_prefix}_qdrant_index_failed",
                    error_type=type(exc).__name__,
                    error_msg=str(exc)[:200],
                    tenant_id=str(tenant_id),
                    extraction_id=str(extraction_id),
                )

        # 3. Outbox domain event. Payload carries ONLY sanitised structured
        # counts/metrics — NEVER the raw source_text (defense-in-depth vs
        # PII leak even though source is typically creator-public).
        if self._outbox is not None:
            try:
                event_payload = _sanitize_payload(
                    {
                        "extraction_id": str(extraction_id),
                        "extractor_version": AUTHORITY_VAULT_EXTRACTOR_VERSION,
                        "schema_version": extracted.schema_version,
                        "confidence_score": extracted.confidence_score,
                        "credentials_count": len(extracted.credentials),
                        "case_studies_count": len(extracted.case_studies),
                        "press_mentions_count": len(extracted.press_mentions),
                        "speaking_engagements_count": len(extracted.speaking_engagements),
                        "awards_count": len(extracted.awards),
                        "warnings_count": len(extracted.extraction_warnings),
                        "missing_required_count": len(extracted.missing_required_fields),
                        "duration_ms": duration_ms,
                        "total_cost_usd": str(total_cost),
                        "source_text_chars": source_text_chars,
                    }
                )
                await self._outbox.publish(
                    event_type=_OUTBOX_EVENT_TYPE,
                    tenant_id=tenant_id,
                    payload=event_payload,
                )
            except Exception as exc:  # noqa: BLE001
                logger.warning(
                    f"{self.log_prefix}_outbox_publish_failed",
                    error_type=type(exc).__name__,
                    error_msg=str(exc)[:200],
                    tenant_id=str(tenant_id),
                    extraction_id=str(extraction_id),
                )

        # 4. Audit log (authority_vault_extracted).
        if self._audit_log is not None:
            try:
                audit_payload = _sanitize_payload(
                    {
                        "extraction_id": str(extraction_id),
                        "extractor_version": AUTHORITY_VAULT_EXTRACTOR_VERSION,
                        "confidence_score": extracted.confidence_score,
                        "warnings": list(extracted.extraction_warnings),
                        "needs_manual_review": extracted.confidence_score < MIN_ACCEPTABLE_CONFIDENCE,
                        "credentials_count": len(extracted.credentials),
                        "case_studies_count": len(extracted.case_studies),
                        "press_mentions_count": len(extracted.press_mentions),
                        "awards_count": len(extracted.awards),
                        "source_text_chars": source_text_chars,
                    }
                )
                await self._audit_log.log(
                    tenant_id=tenant_id,
                    event_type=_AUDIT_EVENT_TYPE,
                    payload=audit_payload,
                )
            except Exception as exc:  # noqa: BLE001
                logger.warning(
                    f"{self.log_prefix}_audit_log_failed",
                    error_type=type(exc).__name__,
                    error_msg=str(exc)[:200],
                    tenant_id=str(tenant_id),
                    extraction_id=str(extraction_id),
                )

    # ------------------------------------------------------------------
    # Row construction (polymorphic kind mapping)
    # ------------------------------------------------------------------

    @staticmethod
    def _build_pending_rows(
        *,
        extracted: AuthorityVaultExtractedV1,
        tenant_id: uuid.UUID,
        extraction_id: uuid.UUID,
    ) -> list[dict[str, Any]]:
        """Convert extracted Pydantic primitives → pending-ratification rows.

        Each row matches ``ComunifyAuthorityVaultItemModel`` shape:
          tenant_id, kind, title, content (JSONB), url, status.

        Speaking engagements are persisted under ``press_mentions`` kind
        with a ``content.subkind = "speaking_engagement"`` discriminator
        — keeps the polymorphic table schema stable while preserving
        distinction at the UI level (per ``_schemas.SpeakingEngagement``
        docstring).
        """
        rows: list[dict[str, Any]] = []

        # Credentials → kind="credentials"
        for cred in extracted.credentials:
            content = cred.model_dump(mode="json")
            content["subkind"] = "credential"
            rows.append(
                {
                    "tenant_id": tenant_id,
                    "extraction_id": str(extraction_id),
                    "kind": "credentials",
                    "title": cred.title,
                    "content": content,
                    "url": cred.url,
                    "status": _PENDING_RATIFICATION_STATUS,
                }
            )

        # Case studies → kind="case_studies"
        for case in extracted.case_studies:
            content = case.model_dump(mode="json")
            content["subkind"] = "case_study"
            rows.append(
                {
                    "tenant_id": tenant_id,
                    "extraction_id": str(extraction_id),
                    "kind": "case_studies",
                    "title": case.title,
                    "content": content,
                    "url": case.url,
                    "status": _PENDING_RATIFICATION_STATUS,
                }
            )

        # Press mentions → kind="press_mentions"
        for press in extracted.press_mentions:
            content = press.model_dump(mode="json")
            content["subkind"] = "press_mention"
            rows.append(
                {
                    "tenant_id": tenant_id,
                    "extraction_id": str(extraction_id),
                    "kind": "press_mentions",
                    "title": press.title,
                    "content": content,
                    "url": press.url,
                    "status": _PENDING_RATIFICATION_STATUS,
                }
            )

        # Speaking engagements → also press_mentions kind (polymorphic
        # discriminator on content.subkind, per docstring).
        for speak in extracted.speaking_engagements:
            content = speak.model_dump(mode="json")
            content["subkind"] = "speaking_engagement"
            rows.append(
                {
                    "tenant_id": tenant_id,
                    "extraction_id": str(extraction_id),
                    "kind": "press_mentions",
                    "title": speak.title,
                    "content": content,
                    "url": speak.url,
                    "status": _PENDING_RATIFICATION_STATUS,
                }
            )

        # Awards → kind="awards"
        for award in extracted.awards:
            content = award.model_dump(mode="json")
            content["subkind"] = "award"
            rows.append(
                {
                    "tenant_id": tenant_id,
                    "extraction_id": str(extraction_id),
                    "kind": "awards",
                    "title": award.title,
                    "content": content,
                    "url": award.url,
                    "status": _PENDING_RATIFICATION_STATUS,
                }
            )

        return rows


# ─── Prompt builder ───────────────────────────────────────────────────────


# Per-wave prompts kept inline as cache-prefix-invariant string constants.
# Variable inputs sit AFTER literal markers (``<<...>>``) — caller substitutes
# via ``str.replace`` so Anthropic prompt caching can hit on stable prefixes
# across calls (slot 1-6 cache prefix invariance per
# ``.claude/rules/sales-agent-brand-voice.md`` SSoT).
_WAVE_PROMPTS: dict[str, str] = {
    "credentials_and_awards": (
        "You are an authority signal extractor for a creator-economy SaaS. "
        "Parse the creator's bio / LinkedIn / interview text + extract real "
        "credentials (titles, certifications, academic degrees, professional "
        "memberships) + industry awards. Return JSON only, no markdown fences.\n\n"
        "Be conservative: do NOT invent. If a credential is implied but not "
        "explicit, set ``confidence < 0.5`` and surface a ``wave_warnings`` "
        "entry. Empty source → return empty arrays + ``low_signal_input`` "
        "warning + ``wave_confidence=0.0``.\n\n"
        "Schema:\n"
        "{\n"
        '  "credentials": [\n'
        "    {\n"
        '      "title": "<string>",\n'
        '      "issuer": "<string|null>",\n'
        '      "year": <int|null>,\n'
        '      "url": "<string|null>",\n'
        '      "confidence": <0.0..1.0>\n'
        "    },\n"
        "    ...\n"
        "  ],\n"
        '  "awards": [\n'
        "    {\n"
        '      "title": "<string>",\n'
        '      "issuer": "<string|null>",\n'
        '      "year": <int|null>,\n'
        '      "url": "<string|null>",\n'
        '      "confidence": <0.0..1.0>\n'
        "    },\n"
        "    ...\n"
        "  ],\n"
        '  "wave_confidence": <0.0..1.0>,\n'
        '  "wave_warnings": ["<string>", ...]\n'
        "}\n\n"
        "Inputs (after this marker, do NOT echo):\n"
        "<<EMPTY_SOURCE_HINT>>: <<EMPTY_SOURCE_HINT_VALUE>>\n"
        "<<SOURCE_TEXT>>: <<SOURCE_TEXT_VALUE>>\n"
    ),
    "case_studies": (
        "You are a case-study extractor for a creator-economy SaaS. Parse the "
        "creator's source text + identify concrete client / student outcome "
        "stories: who they helped (anonymised archetype), what transformation, "
        "how long. Return JSON only, no markdown fences.\n\n"
        "Be conservative: drop vague generalities ('I help people grow'). "
        "Keep only outcomes with at least an implied measurable change. Empty "
        "source → return empty arrays + ``low_signal_input`` warning.\n\n"
        "Schema:\n"
        "{\n"
        '  "case_studies": [\n'
        "    {\n"
        '      "title": "<working title>",\n'
        '      "client_archetype": "<anonymised description|null>",\n'
        '      "outcome": "<measurable transformation, ≤1000 chars>",\n'
        '      "timeframe": "<duration string|null>",\n'
        '      "url": "<string|null>",\n'
        '      "confidence": <0.0..1.0>\n'
        "    },\n"
        "    ...\n"
        "  ],\n"
        '  "wave_confidence": <0.0..1.0>,\n'
        '  "wave_warnings": ["<string>", ...]\n'
        "}\n\n"
        "Inputs (after this marker, do NOT echo):\n"
        "<<EMPTY_SOURCE_HINT>>: <<EMPTY_SOURCE_HINT_VALUE>>\n"
        "<<WAVE_1_OUTPUT_JSON>>: <<WAVE_1_OUTPUT_JSON_VALUE>>\n"
        "<<SOURCE_TEXT>>: <<SOURCE_TEXT_VALUE>>\n"
    ),
    "press_and_social_proof": (
        "You are a press + social-proof extractor. Parse the creator's source "
        "text + extract: (a) press mentions (articles, interviews — name + "
        "outlet + year + URL), (b) speaking engagements (podcasts, conferences, "
        "panels, webinars), (c) social-proof aggregate statistics (students "
        "trained count, clients served count, years of experience, follower "
        "counts if mentioned). Return JSON only, no markdown fences.\n\n"
        "Be conservative. Empty source → return empty arrays + null counters "
        "+ ``low_signal_input`` warning.\n\n"
        "Schema:\n"
        "{\n"
        '  "press_mentions": [\n'
        "    {\n"
        '      "title": "<string>",\n'
        '      "outlet": "<string|null>",\n'
        '      "year": <int|null>,\n'
        '      "url": "<string|null>",\n'
        '      "confidence": <0.0..1.0>\n'
        "    },\n"
        "    ...\n"
        "  ],\n"
        '  "speaking_engagements": [\n'
        "    {\n"
        '      "title": "<string>",\n'
        '      "venue": "<string|null>",\n'
        '      "year": <int|null>,\n'
        '      "url": "<string|null>",\n'
        '      "format": "keynote|podcast|panel|webinar|conference_talk|other",\n'
        '      "confidence": <0.0..1.0>\n'
        "    },\n"
        "    ...\n"
        "  ],\n"
        '  "social_proof": {\n'
        '    "students_trained_count": <int|null>,\n'
        '    "clients_served_count": <int|null>,\n'
        '    "years_of_experience": <int|null>,\n'
        '    "instagram_followers": <int|null>,\n'
        '    "youtube_subscribers": <int|null>,\n'
        '    "tiktok_followers": <int|null>,\n'
        '    "other_signals": ["<string>", ...]\n'
        "  },\n"
        '  "wave_confidence": <0.0..1.0>,\n'
        '  "wave_warnings": ["<string>", ...]\n'
        "}\n\n"
        "Inputs (after this marker, do NOT echo):\n"
        "<<EMPTY_SOURCE_HINT>>: <<EMPTY_SOURCE_HINT_VALUE>>\n"
        "<<WAVE_1_OUTPUT_JSON>>: <<WAVE_1_OUTPUT_JSON_VALUE>>\n"
        "<<SOURCE_TEXT>>: <<SOURCE_TEXT_VALUE>>\n"
    ),
    "validate_and_merge": (
        "You are the validator + merger for an authority-vault extraction run. "
        "Cross-check wave 1 / 2 / 3 outputs for internal consistency "
        "(credentials cohere with case-study domain, press mentions match "
        "claimed experience, social proof reasonable given years_of_experience). "
        "Return JSON only, no markdown fences.\n\n"
        "Schema:\n"
        "{\n"
        '  "merged_warnings": ["<string>", ...],\n'
        '  "merged_missing_required_fields": ["<field>", ...],\n'
        '  "validation_score_adjustment": <-0.3..0.0>,\n'
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
    """Substitute prompt placeholders via ``str.replace`` (NOT format).

    JSON braces in the schema examples are literal. Markers ``<<KEY>>`` keep
    the cache prefix byte-identical across calls until the marker boundary.
    """
    template = _WAVE_PROMPTS[wave_name]
    out = template
    for key, value in inputs.items():
        marker = f"<<{key.upper()}_VALUE>>"
        out = out.replace(marker, value)
    return out


__all__ = [
    "AUTHORITY_VAULT_EXTRACTOR_VERSION",
    "DEFAULT_COST_BUDGET_USD",
    "MIN_ACCEPTABLE_CONFIDENCE",
    "AuthorityVaultExtractor",
    "_LLMResponse",
]
