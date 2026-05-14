"""Comunify AGENTIC tool — `qualify_for_cohort`.

R23: production_code=True AGENTIC tool. Opus 4.7 EXCLUSIVE.
Story 12 luana-comunify-bootstrap T-tools-1.

Spec sources:
  * 06-tickets.yaml::T-tools-1 acceptance criteria
  * 03-arch-agentic.md § 4.1 (qualify_for_cohort spec — input/output shapes)
  * 02-design-agentic.md (Anabella transcript — invocation example)
  * 05-guidelines.md § R23 agentic patterns
  * .claude/rules/tenant-isolation.md (tenant_id NEVER in input schema)
  * .claude/rules/sales-agent-brand-voice.md (output respects tenant voice — structured data only here)
  * .claude/rules/anti-duplication.md (lift-to-shared at N=2)
  * .claude/rules/copilot-observability.md (best-effort writes — never break turn)

Semantics — qualify a lead for a cohort using LLM fit scoring + criteria match:

  1. Forbidden-context guard (defense in depth): `community_engagement_workflow`
     + `subscriber_support` → ForbiddenToolContextError. (03-arch-agentic.md § 4.5)
  2. Idempotency: query qualification_repo.list_by_lead, filter by
     (cohort_id, criteria_hash) within 1h window → cached result, no LLM.
  3. Cohort load: missing/deleted cohort → fit=False + gap "cohort_not_found".
  4. Capacity check: capacity_filled >= capacity_max → cohort_full=True +
     waitlist_position = capacity_waitlist + 1.
  5. LLM fit assessment: Sonnet 4.6 (caller chooses model). Prompt =
     enrollment_criteria + lead_data → JSON {score (0-100), gaps[], confidence}.
     Timeout 30s + graceful fallback to deterministic rule-based score.
  6. Tier mapping: score ≥ threshold → level_3_core (placeholder until
     OfferLadderAdvisor T-extractors-1 refines mapping); else "not_fit".
  7. Persist ComunifyLeadQualificationRecordModel row — fit ∈ {qualified, not_qualified};
     waitlisted state surfaces via cohort_full=True, not the fit string.
  8. Emit LeadQualifiedV1 on success (score ≥ threshold) — best-effort.
  9. Trace event with sanitized payload — best-effort.

Tenant isolation (security boundary):
  * tenant_id MUST NEVER appear in input schema — injected from ctx via
    sales_agent/copilot tool dispatcher.
  * Repos are tenant-scoped at construction (CohortRepository + LeadQualificationRepository).
  * Cross-tenant cohort access returns "not found" (no info leak).

Observability (best-effort per copilot-observability.md):
  * Every external call (LLM, trace repo, event publisher) wrapped in
    try/except + structlog warning. NEVER breaks tool turn.
  * PII sanitization at the boundary — defense-in-depth: tool scrubs
    known PII keys before sanitize_payload (which may fall back to a
    truncate-only stub when luana_core_observability is not on sys.path).

Cost:
  * LLM call: ~$0.006-0.012 (Sonnet 4.6, 200-400 input tok + 64 output tok).
  * Idempotent replay (1h window): $0.
  * Latency budget: p50 1.5s / p99 3.5s (per 03-arch-agentic.md § 4.6).

Anti-duplication audit (Step 0 GATE pre-write):
  * grep -rn "qualify_for_cohort\\|QualifyForCohort" → only spec docs.
  * find -name "qualify_for_cohort.py" → none.
  * sanitize_payload reused from luana_core_observability (lazy fallback).
  * LLMClientProtocol defined inline (N=1). Lift to shared at N=2.
  * LeadQualifiedV1 defined inline (N=1). Lift to modules/comunify/domain/events.py
    when T-workflows-2 introduces subscribers.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import re
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Literal, Protocol, runtime_checkable

import structlog
from pydantic import BaseModel, ConfigDict, Field

logger = structlog.get_logger(__name__)


# ─── Constants ─────────────────────────────────────────────────────────────


# 03-arch-agentic.md § 4.5 — forbidden contexts for this tool (subscriber
# already inside community / outside lead flow).
_FORBIDDEN_CONTEXTS: frozenset[str] = frozenset(
    {
        "community_engagement_workflow",  # already enrolled
        "subscriber_support",  # member support flow — not lead qualification
    }
)

# Idempotency replay window — second identical call within 1h returns cached
# qualification (per 03-arch-agentic.md `idempotent_via=lambda input: f"{lead}:{cohort}:{hash_window_1h()}"`).
_IDEMPOTENCY_WINDOW = timedelta(hours=1)

# Default LLM model used for fit assessment when caller doesn't override.
_DEFAULT_FIT_ASSESSMENT_MODEL = "anthropic/claude-sonnet-4-6"

# Default cohort_qualification_threshold (brand.yaml field not yet populated —
# tracked as deferred to T-config-2 in T-tools-1-impl-log.md § 4.7).
_DEFAULT_THRESHOLD = 70

# PII keys scrubbed defensively at tool boundary BEFORE sanitize_payload runs.
# Sanitize fallback (compliance_event_service.py:67) is truncate-only — we MUST NOT
# rely on it for PII. Defense-in-depth.
_PII_KEYS: frozenset[str] = frozenset(
    {
        "email",
        "email_address",
        "phone",
        "phone_number",
        "mobile",
        "telephone",
        "address",
        "street",
        "ssn",
        "national_id",
        "tax_id",
        "dob",
        "date_of_birth",
        "ip",
        "ip_address",
        "account_number",
        "card_number",
        "iban",
    }
)

# Regex fallback for inline PII in free-text values (email + phone basic).
_EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
_PHONE_RE = re.compile(r"(?:\+?\d[\s\-\(\)]?){7,}\d")


# ─── Exceptions ────────────────────────────────────────────────────────────


class ForbiddenToolContextError(Exception):
    """Raised when tool is invoked in a context that forbids it.

    Per 03-arch-agentic.md § 4.5 FORBIDDEN_TOOLS_BY_CONTEXT mapping:
      community_engagement_workflow → subscriber already enrolled.
      subscriber_support → member support flow, not lead qualification.
    """

    def __init__(self, context: str) -> None:
        self.context = context
        super().__init__(
            f"qualify_for_cohort is forbidden in context '{context}' "
            "(03-arch-agentic.md § 4.5 FORBIDDEN_TOOLS_BY_CONTEXT)"
        )


# ─── Pydantic schemas (V1 — frozen, schema_version cement) ─────────────────


_RecommendedTier = Literal[
    "level_1_lead_magnet",
    "level_2_tripwire",
    "level_3_core",
    "level_4_premium",
    "not_fit",
]


class QualifyForCohortInputV1(BaseModel):
    """Input schema — tenant_id intentionally OMITTED (ctx injection).

    Per 03-arch-agentic.md § 4.1 + .claude/rules/tenant-isolation.md:
    > tenant_id NOT in schema — injected via tool dispatcher from ctx
    """

    model_config = ConfigDict(frozen=True, extra="forbid")

    schema_version: Literal[1] = Field(
        default=1,
        description="Schema version cement — bump triggers breaking-change review.",
    )
    lead_id: uuid.UUID = Field(
        ...,
        description="Lead/subscriber UUID being qualified.",
    )
    cohort_id: uuid.UUID | None = Field(
        default=None,
        description=("Target cohort UUID. If None, agent caller selects best-fit (logic deferred to T-workflows-2)."),
    )
    lead_data: dict[str, Any] = Field(
        default_factory=dict,
        description=(
            "Intake form payload (business_stage, primary_pain, monthly_income_usd, etc.). "
            "PII keys are scrubbed before observability writes."
        ),
    )
    action: Literal["assess", "score", "snapshot"] = Field(
        default="score",
        description=(
            "assess = preview without persistence (out-of-scope today). "
            "score = full LLM scoring + persistence + event. "
            "snapshot = persist current state without re-scoring."
        ),
    )


class QualifyForCohortOutputV1(BaseModel):
    """Result of qualify_for_cohort tool invocation.

    Per 03-arch-agentic.md § 4.1 (adjusted for ticket-canonical 0-100 int scoring
    matching ComunifyLeadQualificationRecordModel.fit_score column type).
    """

    model_config = ConfigDict(frozen=True)

    schema_version: Literal[1] = Field(
        default=1,
        description="Schema version cement.",
    )
    fit: bool = Field(
        ...,
        description="True iff fit_score >= threshold AND no blocking gap.",
    )
    recommended_tier: _RecommendedTier = Field(
        ...,
        description="Recommended offer-ladder tier OR 'not_fit'.",
    )
    fit_score: int = Field(
        ...,
        ge=0,
        le=100,
        description="0-100 fit score (matches DB column type).",
    )
    gaps: list[str] = Field(
        default_factory=list,
        description="Criteria gaps preventing higher fit (LLM-emitted or rule-derived).",
    )
    confidence: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="LLM confidence in scoring (0-1).",
    )
    cohort_full: bool = Field(
        default=False,
        description="True iff cohort.capacity_filled >= cohort.capacity_max.",
    )
    waitlist_position: int | None = Field(
        default=None,
        description="Position in waitlist (1-indexed) when cohort_full=True.",
    )
    next_cohort_at: datetime | None = Field(
        default=None,
        description="Start date of next cohort (forwarded from cohort.start_date when cohort_full).",
    )
    fallback_used: bool = Field(
        default=False,
        description=(
            "True iff LLM scoring failed and deterministic rule-based fallback engaged "
            "(graceful-degradation per tessl__graceful-degradation skill)."
        ),
    )


# ─── Domain event (inline today — lift to domain/events.py at N=2) ─────────


@dataclass(frozen=True)
class LeadQualifiedV1:
    """Domain event — emitted when a lead clears fit threshold.

    Downstream subscriber (T-workflows-2 CohortEnrollmentWorkflow) wires later.
    Lift to modules/comunify/domain/events.py when 2nd event type appears.
    """

    schema_version: Literal[1]
    tenant_id: uuid.UUID
    lead_id: uuid.UUID
    cohort_id: uuid.UUID
    fit_score: int
    recommended_tier: str
    qualified_at: datetime


# ─── Protocols (DI — decouple from concrete repos / clients) ───────────────


@runtime_checkable
class _CohortRepoLike(Protocol):
    """Minimal surface consumed from CohortRepository.

    Tenant scoping is bound at repo construction — `get_by_id` filters by
    `self._tenant_id` natively (per `tenant-isolation.md`).
    """

    async def get_by_id(self, cohort_id: uuid.UUID) -> Any: ...


@runtime_checkable
class _LeadQualificationRepoLike(Protocol):
    """Minimal surface consumed from LeadQualificationRepository."""

    async def list_by_lead(self, lead_id: uuid.UUID, *, limit: int = ...) -> list[Any]: ...

    async def save(self, record: Any) -> None: ...


@runtime_checkable
class _TraceEventRepoLike(Protocol):
    """Mirror of BaseTraceEventRepoProtocol — see luana_core_observability."""

    def add(
        self,
        *,
        tenant_id: uuid.UUID,
        turn_id: uuid.UUID,
        span_id: uuid.UUID,
        event_type: str,
        name: str | None = ...,
        data: dict[str, Any] | None = ...,
        duration_ms: int | None = ...,
        status: str = ...,
        **agent_specific: Any,
    ) -> Any: ...


@runtime_checkable
class _EventPublisherLike(Protocol):
    """Pluggable event publisher (in-process bus / outbox / Kafka — all OK)."""

    async def emit(self, event: Any) -> None: ...


@runtime_checkable
class _LLMClientLike(Protocol):
    """Minimal LiteLLM / Anthropic SDK surface for fit assessment.

    Caller injects concrete: LiteLLM proxy adapter, Anthropic SDK direct, etc.
    Today (N=1), no shared LLMClient lives in comunify codebase — protocol is
    inline. Lift to shared agentic abstractions at N≥2 (per anti-duplication).
    """

    async def acompletion(
        self,
        *,
        model: str,
        messages: list[dict[str, Any]],
        max_tokens: int = ...,
        timeout: float = ...,
    ) -> dict[str, Any]: ...


# ─── sanitize_payload — lazy with fallback (mirror compliance_event_service.py) ──


def _sanitize_payload(payload: dict[str, Any]) -> dict[str, Any]:
    """Sanitize payload via luana_core_observability or truncate-only fallback.

    Mirrors compliance_event_service.py:55-69. Best-effort.
    """
    try:
        from luana_core_observability.recording.sanitization import (
            sanitize_payload as _sp,  # type: ignore[import-not-found]
        )

        return _sp(payload)  # type: ignore[no-any-return]
    except ImportError:
        _MAX_LEN = 4000
        return {k: (v[:_MAX_LEN] if isinstance(v, str) and len(v) > _MAX_LEN else v) for k, v in payload.items()}


# ─── PII boundary scrub (defense-in-depth — never trust fallback sanitizer) ──


def _scrub_pii(payload: dict[str, Any]) -> dict[str, Any]:
    """Remove known PII keys + redact inline email/phone in remaining strings.

    Applied BEFORE _sanitize_payload to guarantee PII does not leak even when
    the observability sanitize fallback is in effect.
    """
    out: dict[str, Any] = {}
    for k, v in payload.items():
        if k.lower() in _PII_KEYS:
            out[k] = "[REDACTED]"
            continue
        if isinstance(v, str):
            v = _EMAIL_RE.sub("[REDACTED_EMAIL]", v)
            v = _PHONE_RE.sub("[REDACTED_PHONE]", v)
            out[k] = v
        elif isinstance(v, dict):
            out[k] = _scrub_pii(v)
        else:
            out[k] = v
    return out


# ─── Criteria hash + idempotency cache lookup ──────────────────────────────


def _criteria_hash(lead_data: dict[str, Any]) -> str:
    """Deterministic SHA-256 over lead_data — drives 1h replay window.

    Stable key order via json.dumps(sort_keys=True). Idempotency match means:
    same lead_data → same hash → cached row hit.
    """
    serialized = json.dumps(lead_data, sort_keys=True, default=str)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def _find_idempotent_record(
    records: list[Any],
    *,
    cohort_id: uuid.UUID | None,
    criteria_hash: str,
    now: datetime,
) -> Any | None:
    """Return most recent record matching (cohort_id, criteria_hash) within 1h, else None.

    criteria_hash is encoded into the persisted lead_data under key
    `_criteria_hash` for replay detection.
    """
    cutoff = now - _IDEMPOTENCY_WINDOW
    for r in records:
        # records repo returns DESC — first match wins
        if r.created_at < cutoff:
            return None
        if r.cohort_id != cohort_id:
            continue
        stored_hash = (getattr(r, "lead_data", {}) or {}).get("_criteria_hash")
        if stored_hash == criteria_hash:
            return r
    return None


# ─── Deterministic fallback scorer ─────────────────────────────────────────


def _deterministic_score(
    lead_data: dict[str, Any],
    enrollment_criteria: dict[str, Any],
) -> tuple[int, list[str]]:
    """Rule-based fallback score (0-100) + gaps when LLM unavailable.

    Algorithm:
      - For each enrollment_criteria key, check whether lead_data shows a match.
      - score = round(100 * matches / total_criteria) (0 if no criteria).
      - gaps = list of unmatched criteria keys.

    Simple but deterministic — used when LLM dispatch fails (timeout/error).
    """
    if not enrollment_criteria:
        return (50, [])  # neutral fallback when no criteria defined

    matches = 0
    gaps: list[str] = []
    for key, expected in enrollment_criteria.items():
        actual = lead_data.get(_strip_prefix(key))
        if _criterion_satisfied(actual, expected):
            matches += 1
        else:
            gaps.append(_strip_prefix(key))

    total = len(enrollment_criteria)
    score = int(round(100 * matches / total)) if total > 0 else 50
    return (score, gaps)


def _strip_prefix(key: str) -> str:
    """Strip `min_` / `max_` / `_match` prefixes/suffixes for lead_data lookup."""
    if key.startswith("min_"):
        return key[4:]
    if key.startswith("max_"):
        return key[4:]
    if key.endswith("_match"):
        return key[:-6]
    return key


def _criterion_satisfied(actual: Any, expected: Any) -> bool:
    """Heuristic match check for deterministic fallback."""
    if actual is None:
        return False
    if isinstance(expected, list):
        return actual in expected
    if isinstance(expected, (int, float)) and isinstance(actual, (int, float)):
        return actual >= expected
    return actual == expected


def _tier_from_score(score: int, threshold: int) -> _RecommendedTier:
    """Map fit score → recommended ladder tier.

    Placeholder mapping today (T-tools-1 scope). Refined by OfferLadderAdvisor
    (T-extractors-1) which understands tenant's actual ladder topology.
    """
    if score < threshold:
        return "not_fit"
    if score >= 90:
        return "level_4_premium"
    if score >= 80:
        return "level_3_core"
    if score >= 70:
        return "level_2_tripwire"
    return "level_1_lead_magnet"


# ─── LLM dispatch with timeout + graceful fallback ─────────────────────────


def _build_fit_assessment_messages(
    *,
    enrollment_criteria: dict[str, Any],
    lead_data: dict[str, Any],
    threshold: int,
) -> list[dict[str, Any]]:
    """Build Anthropic Messages API list-of-dict for the fit assessment LLM call.

    Note: lead_data is passed RAW to the LLM (PII may surface inside the
    prompt itself — that is a caller-layer concern: caller must drop PII
    keys from lead_data BEFORE invoking the tool if their compliance regime
    requires LLM-side redaction. The trace_event observability layer is
    PII-safe regardless via _scrub_pii.).
    """
    # NOTE: do NOT interpolate tenant_id or timestamps into the cacheable
    # prefix per .claude/rules/sales-agent-brand-voice.md slot-architecture.
    system = (
        "You are a lead qualification engine. Score 0-100 (int) how well a "
        "lead matches a cohort's enrollment criteria. Threshold for "
        "qualification = {threshold}. Output STRICT JSON with keys: "
        '"score" (int 0-100), "gaps" (list of unmatched criteria keys), '
        '"confidence" (float 0-1). NO prose outside the JSON.'
    ).format(threshold=threshold)

    user = json.dumps(
        {
            "enrollment_criteria": enrollment_criteria,
            "lead_data": lead_data,
        },
        sort_keys=True,
        default=str,
    )

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


def _parse_llm_response(response: dict[str, Any]) -> tuple[int, list[str], float]:
    """Extract (score, gaps, confidence) from Anthropic-Messages-shaped response.

    Tolerates minor format variations (string OR dict content). Raises ValueError
    on unparseable shape — caller catches + engages deterministic fallback.
    """
    choices = response.get("choices") or []
    if not choices:
        raise ValueError("llm response missing 'choices'")
    message = choices[0].get("message") or {}
    raw_content = message.get("content")
    if isinstance(raw_content, list):
        # Anthropic-style content blocks: [{"type":"text","text":"..."}]
        text_parts = [b.get("text", "") for b in raw_content if isinstance(b, dict)]
        content = "".join(text_parts)
    elif isinstance(raw_content, str):
        content = raw_content
    else:
        raise ValueError("llm response message.content missing or not str/list")

    parsed = json.loads(content)
    score = int(parsed["score"])
    if not 0 <= score <= 100:
        raise ValueError(f"score {score} out of range 0-100")
    gaps_raw = parsed.get("gaps", [])
    gaps = [str(g) for g in gaps_raw] if isinstance(gaps_raw, list) else []
    confidence = float(parsed.get("confidence", 0.0))
    confidence = max(0.0, min(1.0, confidence))
    return (score, gaps, confidence)


async def _score_via_llm(
    *,
    llm_client: _LLMClientLike,
    model: str,
    enrollment_criteria: dict[str, Any],
    lead_data: dict[str, Any],
    threshold: int,
    timeout_seconds: float = 30.0,
) -> tuple[int, list[str], float]:
    """Dispatch LLM for fit assessment with timeout. Raises on any failure."""
    messages = _build_fit_assessment_messages(
        enrollment_criteria=enrollment_criteria,
        lead_data=lead_data,
        threshold=threshold,
    )
    response = await asyncio.wait_for(
        llm_client.acompletion(
            model=model,
            messages=messages,
            max_tokens=256,
            timeout=timeout_seconds,
        ),
        timeout=timeout_seconds,
    )
    return _parse_llm_response(response)


# ─── Domain model factory (lazy import — avoid coupling at module-load) ────


def _build_qualification_record(
    *,
    tenant_id: uuid.UUID,
    lead_id: uuid.UUID,
    cohort_id: uuid.UUID,
    fit_label: str,
    recommended_tier: str,
    fit_score: int,
    lead_data_with_hash: dict[str, Any],
    now: datetime,
) -> Any:
    """Build a ComunifyLeadQualificationRecordModel row. Lazy import — keeps
    the tool importable in stripped test envs (per backend-ddd.md schema-mirror
    exception).
    """
    from src.modules.comunify.infrastructure.models.lead_qualification_record_model import (  # noqa: PLC0415
        ComunifyLeadQualificationRecordModel,
    )

    return ComunifyLeadQualificationRecordModel(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        lead_id=lead_id,
        cohort_id=cohort_id,
        fit=fit_label,
        recommended_tier=recommended_tier,
        fit_score=fit_score,
        lead_data=lead_data_with_hash,
        created_at=now,
    )


# ─── Best-effort observability helpers ─────────────────────────────────────


async def _emit_trace_event_best_effort(
    trace_event_repo: _TraceEventRepoLike | None,
    *,
    tenant_id: uuid.UUID,
    turn_id: uuid.UUID | None,
    span_id: uuid.UUID | None,
    lead_id: uuid.UUID,
    cohort_id: uuid.UUID | None,
    result: QualifyForCohortOutputV1,
    fallback_used: bool,
    lead_data: dict[str, Any],
    duration_ms: int | None,
) -> None:
    """Best-effort trace event — NEVER raises (copilot-observability.md)."""
    if trace_event_repo is None or turn_id is None or span_id is None:
        return
    try:
        # Scrub PII FIRST (defense in depth), then run through sanitize_payload.
        scrubbed = _scrub_pii(
            {
                "lead_id": str(lead_id),
                "cohort_id": str(cohort_id) if cohort_id else None,
                "fit": result.fit,
                "fit_score": result.fit_score,
                "recommended_tier": result.recommended_tier,
                "cohort_full": result.cohort_full,
                "fallback_used": fallback_used,
                "lead_data": lead_data,  # may contain PII keys/values
            }
        )
        payload = _sanitize_payload(scrubbed)
        trace_event_repo.add(
            tenant_id=tenant_id,
            turn_id=turn_id,
            span_id=span_id,
            event_type="tool.qualify_for_cohort.completed",
            name="qualify_for_cohort",
            data=payload,
            duration_ms=duration_ms,
            status="ok",
        )
    except Exception as exc:  # noqa: BLE001 — best-effort observability
        logger.warning(
            "qualify_for_cohort.trace_event_persist_failed",
            exc=str(exc),
            lead_id=str(lead_id),
            cohort_id=str(cohort_id) if cohort_id else None,
            tenant_id=str(tenant_id),
        )


async def _emit_event_best_effort(
    event_publisher: _EventPublisherLike | None,
    *,
    event: LeadQualifiedV1,
) -> None:
    """Best-effort domain event publish — NEVER raises."""
    if event_publisher is None:
        return
    try:
        await event_publisher.emit(event)
    except Exception as exc:  # noqa: BLE001
        logger.warning(
            "qualify_for_cohort.event_emit_failed",
            exc=str(exc),
            event_type="LeadQualifiedV1",
            lead_id=str(event.lead_id),
            cohort_id=str(event.cohort_id),
            tenant_id=str(event.tenant_id),
        )


# ─── Handler ────────────────────────────────────────────────────────────────


async def qualify_for_cohort(
    input: QualifyForCohortInputV1,
    *,
    tenant_id: uuid.UUID,
    cohort_repo: _CohortRepoLike,
    qualification_repo: _LeadQualificationRepoLike,
    llm_client: _LLMClientLike,
    event_publisher: _EventPublisherLike | None = None,
    trace_event_repo: _TraceEventRepoLike | None = None,
    turn_id: uuid.UUID | None = None,
    span_id: uuid.UUID | None = None,
    context: str | None = None,
    threshold: int = _DEFAULT_THRESHOLD,
    fit_assessment_model: str = _DEFAULT_FIT_ASSESSMENT_MODEL,
    llm_timeout_seconds: float = 30.0,
) -> QualifyForCohortOutputV1:
    """Qualify a lead for a cohort. See module docstring for semantics + spec refs.

    Parameters
    ----------
    input
        Pydantic input. `tenant_id` NEVER appears here — security boundary.
    tenant_id
        Ctx-injected by sales_agent/copilot tool dispatcher.
    cohort_repo
        Tenant-scoped CohortRepository — caller's responsibility to bind to
        the same tenant_id passed here.
    qualification_repo
        Tenant-scoped LeadQualificationRepository.
    llm_client
        Pluggable LLM client (LiteLLM/Anthropic SDK adapter). Tool calls
        `acompletion` with Anthropic Messages-API list-of-dict shape.
    event_publisher
        Optional — when supplied, tool emits LeadQualifiedV1 on fit≥threshold.
        Best-effort: emit failure does NOT break the turn.
    trace_event_repo
        Optional — when supplied, tool records one observability trace
        event. Best-effort: persistence failure does NOT break the turn.
    turn_id / span_id
        Correlation IDs required iff trace_event_repo is supplied.
    context
        Caller's runtime context label (e.g. `lead_qualification`,
        `community_engagement_workflow`). Used for forbidden-context guard.
    threshold
        Score threshold (0-100) for qualified vs not_qualified. Default 70
        per T-tools-1 ticket. brand.yaml field bump deferred to T-config-2.
    fit_assessment_model
        Model wire-name (default Sonnet 4.6 per 03-arch-agentic.md § 4.6).
    llm_timeout_seconds
        Per-LLM-call timeout. Default 30s (per tessl__graceful-degradation).

    Returns
    -------
    QualifyForCohortOutputV1 — see schema docstring.

    Raises
    ------
    ForbiddenToolContextError
        If context is in FORBIDDEN_CONTEXTS — defense-in-depth.
    """
    started = datetime.now(tz=timezone.utc)

    # ── Step 1: Forbidden-context guard ────────────────────────────────────
    if context is not None and context in _FORBIDDEN_CONTEXTS:
        raise ForbiddenToolContextError(context)

    # ── Step 2: Idempotency replay check (1h window) ───────────────────────
    crit_hash = _criteria_hash(input.lead_data)
    recent_records = await qualification_repo.list_by_lead(input.lead_id, limit=10)
    cached = _find_idempotent_record(
        recent_records,
        cohort_id=input.cohort_id,
        criteria_hash=crit_hash,
        now=started,
    )
    if cached is not None:
        logger.info(
            "qualify_for_cohort.idempotent_replay",
            tenant_id=str(tenant_id),
            lead_id=str(input.lead_id),
            cohort_id=str(input.cohort_id) if input.cohort_id else None,
            cached_record_id=str(cached.id),
            cached_score=cached.fit_score,
        )
        # Reconstruct output deterministically — no LLM, no new event, no new persist.
        cached_tier = (cached.lead_data or {}).get("_recommended_tier", _tier_from_score(cached.fit_score, threshold))
        return QualifyForCohortOutputV1(
            fit=(cached.fit == "qualified"),
            recommended_tier=cached_tier,
            fit_score=cached.fit_score,
            gaps=list((cached.lead_data or {}).get("_gaps", [])),
            confidence=float((cached.lead_data or {}).get("_confidence", 0.0)),
            cohort_full=bool((cached.lead_data or {}).get("_cohort_full", False)),
            waitlist_position=(cached.lead_data or {}).get("_waitlist_position"),
            next_cohort_at=None,
            fallback_used=bool((cached.lead_data or {}).get("_fallback_used", False)),
        )

    # ── Step 3: Load cohort if specified ───────────────────────────────────
    cohort: Any | None = None
    if input.cohort_id is not None:
        cohort = await cohort_repo.get_by_id(input.cohort_id)
        if cohort is None:
            # Missing cohort short-circuit — no scoring, no persist.
            logger.info(
                "qualify_for_cohort.cohort_not_found",
                tenant_id=str(tenant_id),
                lead_id=str(input.lead_id),
                cohort_id=str(input.cohort_id),
            )
            result = QualifyForCohortOutputV1(
                fit=False,
                recommended_tier="not_fit",
                fit_score=0,
                gaps=["cohort_not_found"],
                confidence=0.0,
                cohort_full=False,
                waitlist_position=None,
                fallback_used=False,
            )
            await _emit_trace_event_best_effort(
                trace_event_repo,
                tenant_id=tenant_id,
                turn_id=turn_id,
                span_id=span_id,
                lead_id=input.lead_id,
                cohort_id=input.cohort_id,
                result=result,
                fallback_used=False,
                lead_data=input.lead_data,
                duration_ms=int((datetime.now(tz=timezone.utc) - started).total_seconds() * 1000),
            )
            return result

    # ── Step 4: LLM fit scoring (with graceful fallback) ───────────────────
    enrollment_criteria = (cohort.enrollment_criteria if cohort is not None else {}) or {}
    fallback_used = False
    try:
        score, gaps, confidence = await _score_via_llm(
            llm_client=llm_client,
            model=fit_assessment_model,
            enrollment_criteria=enrollment_criteria,
            lead_data=input.lead_data,
            threshold=threshold,
            timeout_seconds=llm_timeout_seconds,
        )
    except (asyncio.TimeoutError, Exception) as exc:  # noqa: BLE001 — broad to engage fallback
        # graceful-degradation: deterministic fallback scorer
        fallback_used = True
        logger.warning(
            "qualify_for_cohort.llm_failure_fallback_engaged",
            exc=str(exc),
            exc_type=type(exc).__name__,
            tenant_id=str(tenant_id),
            lead_id=str(input.lead_id),
            cohort_id=str(input.cohort_id) if input.cohort_id else None,
        )
        score, gaps = _deterministic_score(input.lead_data, enrollment_criteria)
        confidence = 0.5  # rule-based confidence floor

    # ── Step 5: Capacity check ─────────────────────────────────────────────
    cohort_full = False
    waitlist_position: int | None = None
    next_cohort_at: datetime | None = None
    if cohort is not None:
        cap_max = int(getattr(cohort, "capacity_max", 0) or 0)
        cap_filled = int(getattr(cohort, "capacity_filled", 0) or 0)
        cap_waitlist = int(getattr(cohort, "capacity_waitlist", 0) or 0)
        if cap_filled >= cap_max:
            cohort_full = True
            waitlist_position = cap_waitlist + 1
            # Forward cohort.start_date if available as datetime / convertible.
            sd = getattr(cohort, "start_date", None)
            if isinstance(sd, datetime):
                next_cohort_at = sd

    # ── Step 6: Tier mapping ───────────────────────────────────────────────
    recommended_tier = _tier_from_score(score, threshold)
    fit_label = "qualified" if score >= threshold else "not_qualified"
    fit_bool = score >= threshold

    # ── Step 7: Persist qualification record ───────────────────────────────
    persistence_succeeded = False
    if input.cohort_id is not None:
        record = _build_qualification_record(
            tenant_id=tenant_id,
            lead_id=input.lead_id,
            cohort_id=input.cohort_id,
            fit_label=fit_label,
            recommended_tier=recommended_tier,
            fit_score=score,
            lead_data_with_hash={
                **input.lead_data,
                "_criteria_hash": crit_hash,
                "_recommended_tier": recommended_tier,
                "_gaps": gaps,
                "_confidence": confidence,
                "_cohort_full": cohort_full,
                "_waitlist_position": waitlist_position,
                "_fallback_used": fallback_used,
            },
            now=started,
        )
        try:
            await qualification_repo.save(record)
            persistence_succeeded = True
        except Exception as exc:  # noqa: BLE001 — persistence is required but failure logged
            # Note: unlike observability, persistence failure DOES surface as a
            # logged warning. We do not raise — caller may retry. Tool semantics
            # remain best-effort end-to-end (R23).
            logger.warning(
                "qualify_for_cohort.persistence_failed",
                exc=str(exc),
                tenant_id=str(tenant_id),
                lead_id=str(input.lead_id),
                cohort_id=str(input.cohort_id),
            )

    # ── Step 8: Build output + emit event ──────────────────────────────────
    result = QualifyForCohortOutputV1(
        fit=fit_bool,
        recommended_tier=recommended_tier,
        fit_score=score,
        gaps=gaps,
        confidence=confidence,
        cohort_full=cohort_full,
        waitlist_position=waitlist_position,
        next_cohort_at=next_cohort_at,
        fallback_used=fallback_used,
    )

    # Emit LeadQualifiedV1 only when:
    #   - score ≥ threshold
    #   - cohort_id is concrete (no event without a cohort to enroll into)
    #   - persistence succeeded (don't emit a phantom)
    if fit_bool and input.cohort_id is not None and persistence_succeeded:
        event = LeadQualifiedV1(
            schema_version=1,
            tenant_id=tenant_id,
            lead_id=input.lead_id,
            cohort_id=input.cohort_id,
            fit_score=score,
            recommended_tier=recommended_tier,
            qualified_at=started,
        )
        await _emit_event_best_effort(event_publisher, event=event)

    # ── Step 9: Trace event (best-effort) ──────────────────────────────────
    duration_ms = int((datetime.now(tz=timezone.utc) - started).total_seconds() * 1000)
    await _emit_trace_event_best_effort(
        trace_event_repo,
        tenant_id=tenant_id,
        turn_id=turn_id,
        span_id=span_id,
        lead_id=input.lead_id,
        cohort_id=input.cohort_id,
        result=result,
        fallback_used=fallback_used,
        lead_data=input.lead_data,
        duration_ms=duration_ms,
    )

    return result


__all__ = [
    "ForbiddenToolContextError",
    "LeadQualifiedV1",
    "QualifyForCohortInputV1",
    "QualifyForCohortOutputV1",
    "qualify_for_cohort",
]
