r"""Comunify AGENTIC guardrail — `community_safety_no_spam` (input + output layers).

R23: production_code=True AGENTIC code. Opus 4.7 EXCLUSIVE.
Story 12 T-guards-1 (luana-comunify-bootstrap).

Spec sources:
  * 02-design-agentic.md § 17.5 INPUT pipeline step 3 + OUTPUT pipeline step 7
  * 03-arch-agentic.md § 10.1 pipeline order + § 10.2 CommunitySafetyNoSpam
  * 06-tickets.yaml::T-guards-1 acceptance V-AE-2 + V-AE-11
  * 05-guidelines.md § 1.10 R23 agentic patterns + § 1.4 tenant isolation
  * comunify/config/brand.yaml § community_safety thresholds (0.85 / 0.95)
  * Slot 4 cement at
    `agentic/prompts/slot_4_community_safety_rails.j2`
    "❌ Spam comercial unrelated al nicho del creator..."

Anti-duplication audit (Step 0 GATE per .claude/rules/anti-duplication.md):

  Cross-codebase grep results (verified 2026-05-14):

    grep -rln "class CommunitySafetyNoSpam\|community_safety_no_spam" \
      /home/chris/luana-platform/comunify/backend/src /home/chris/luana-platform/core

  Returns ONLY:
    - extensions.py EP-13 placeholder registration (T-extensions-1, this
      ticket replaces by direct module here per CC-2 cement)
    - community_moderation_service.py classifier dispatch stub (T-be-6)

  No mirror risk. NEW vertical-creator-economy guard surface. The runtime
  classifier (Haiku 4.5 via LiteLLM Proxy) is injected via Protocol —
  the guardrail does NOT consume a concrete LLM service class. Real
  classifier wiring lives in sales_agent runtime (Story 13+).

  `sanitize_payload` is invoked transparently by ComplianceEventService
  (see compliance_event_service.py § 9.8). The guardrail passes raw dict
  payload — service handles sanitization. This avoids double-sanitize
  and keeps the guard module pure regex + branching logic.

Semantics — input layer (pre-LLM call, pipeline step 3):
  1. Detect spam claim via cheap regex first (promo + discount + click-bait
     domain TLDs `.tk`/`.ml`/`.ga`/`bit.ly` + "click ahora/aquí/here" + URL).
  2. On regex MISS, consult Haiku 4.5 classifier fallback ("Is this spam?
     0-1 score.") — wrapped in timeout + try/except per graceful-degradation.
  3. On EITHER positive (regex hit OR classifier score > 0.85) → return
     ``InputGuardrailResult(fired=True, action='pending_moderation')``.
     Caller (CommunityModerationService) routes post to pending_moderation
     status; community moderator dashboard surfaces for creator review.
  4. On classifier outage AND regex miss → graceful degradation: return
     ``fired=False`` (false-positive cost > false-negative cost for input;
     downstream output guard + V-AE-11 adversarial pass^5 cement catches
     paraphrased spam at end-to-end eval level).
  5. Audit log `community_safety_no_spam_fired` (severity medium) ONLY on fire.

Semantics — output layer (post-LLM, pipeline step 7, before PII detection):
  1. Detect anti-pivot to spam content via the same INPUT_PATTERNS catalog
     (LLM should never emit promotional URLs / click-bait domains — data
     exfil prevention).
  2. On regex MISS, consult Haiku classifier ("Does response contain
     promotional/spam content? 0-1 score.").
  3. On EITHER positive AND ``retry_attempted=False`` → return
     ``OutputGuardrailResult(blocked=True, action='regenerate_with_no_spam_instruction')``.
     Caller invokes LLM again with explicit "no promotional links" suffix.
  4. On EITHER positive AND ``retry_attempted=True`` → return
     ``OutputGuardrailResult(blocked=True, action='use_fallback_response',
     fallback_response=<cement safe response>)``. Caller sends fallback verbatim.
  5. Classifier outage AND regex miss → graceful pass-through (V-AE-11 cement).
  6. Audit log on block ONLY, with `layer='output'` + `retry_attempted` flag.

Cost: regex path $0; classifier fallback ≈ $0.0001 per Haiku invocation
(via LiteLLM Proxy CustomLogger bridge). Latency: regex <1ms; classifier
p99 ≤5s with hard timeout per `tessl__graceful-degradation`.
"""

from __future__ import annotations

import re
import uuid
from dataclasses import dataclass
from typing import Any, Literal, Protocol

import structlog

logger = structlog.get_logger(__name__)


# ── Configuration constants (cement — exported for tests + ratchet) ───────


#: Spec § 17.5 chrome refusal — Spanish neutro tuteo per
#: `.claude/rules/spanish-text.md`. Safe fallback string used after retry
#: exhausted at output layer. No tenant-specific interpolation needed
#: (chrome stays generic across creator brands).
FALLBACK_RESPONSE: str = (
    "No manejamos promociones de terceros desde nuestro canal. ¿Te puedo ayudar con algo de nuestra comunidad?"
)

#: Hard timeout for the Haiku classifier fallback call per
#: `tessl__graceful-degradation` rule 1 default 5s.
_CLASSIFIER_TIMEOUT_SEC: float = 5.0

#: Spam threshold — mirrors comunify/config/brand.yaml §
#: community_safety.spam_score_threshold (0.85). Score > threshold fires.
_SPAM_THRESHOLD: float = 0.85

_AUDIT_SEVERITY: str = "medium"
_AUDIT_EVENT_TYPE: str = "community_safety_no_spam_fired"


# ── Detection regex catalog (append-only per safety ratchet) ──────────────


#: Promotional discount + click-bait TLD or shortener — per 03-arch § 10.2
#: cement: `(descuento|promo).*(\d+)%.*(\.tk|\.ml|\.ga|bit.ly)`.
#: Append-only: more TLD aliases (`.cf`/`.gq`/`shorturl.at`) extend
#: coverage without invalidating cement.
_INPUT_PROMO_TLD_RE: re.Pattern[str] = re.compile(
    r"\b(?:descuento|promo|oferta|deal|sale)\b"
    r".{0,80}?"
    r"\d+\s*%"
    r".{0,80}?"
    r"\b(?:\.tk|\.ml|\.ga|\.cf|\.gq|bit\.ly|shorturl\.at|tinyurl\.com|t\.co)\b",
    re.IGNORECASE | re.DOTALL,
)

#: Click-bait imperative + URL — per 03-arch § 10.2 cement:
#: `click\s+(ahora|aquí|here)\s+.*(https?:\/\/[^\s]+)`.
_INPUT_CLICKBAIT_RE: re.Pattern[str] = re.compile(
    r"\bclick\s+(?:ahora|aqu[ií]|here|now)\b"
    r".{0,80}?"
    r"https?://[^\s]+",
    re.IGNORECASE | re.DOTALL,
)

#: External promotional cross-platform pivot — common spam vector. Catches
#: "comprá en mi otra plataforma" / "afiliate aquí" + URL patterns.
_INPUT_AFFILIATE_RE: re.Pattern[str] = re.compile(
    r"\b(?:afili[aá]te|afili[aá]ndome|comisi[oó]n|MLM|crypto\s+(?:gem|moonshot)|casino)\b"
    r".{0,160}?"
    r"https?://[^\s]+",
    re.IGNORECASE | re.DOTALL,
)

_INPUT_PATTERNS: tuple[re.Pattern[str], ...] = (
    _INPUT_PROMO_TLD_RE,
    _INPUT_CLICKBAIT_RE,
    _INPUT_AFFILIATE_RE,
)


# ── Protocols (structural typing — decouple from concrete impls) ──────────


class _LLMClassifierLike(Protocol):
    """Minimal surface for the Haiku 4.5 score classifier.

    Narrow surface — the guardrail only needs `aclassify_score` (float
    0-1), not bool nor text generation. Concrete impl lives in
    sales_agent runtime (LiteLLM Proxy adapter — popping cost via
    CustomLogger bridge per PI-12 S1 T-1 cement).
    """

    async def aclassify_score(
        self,
        *,
        text: str,
        prompt: str,
        timeout_sec: float = _CLASSIFIER_TIMEOUT_SEC,
    ) -> float: ...


class _AuditLogLike(Protocol):
    """Minimal surface for ComplianceEventService.log_event.

    Mirrors comunify/application/services/compliance_event_service.py
    surface — sibling guardrails (T-guards-2/3/4) share this Protocol.
    """

    async def log_event(
        self,
        event_type: str,
        severity: str,
        payload: dict[str, Any],
        tenant_id: uuid.UUID,
        member_id: uuid.UUID | None = None,
        post_id: uuid.UUID | None = None,
        target_member_id: uuid.UUID | None = None,
        actor_id: uuid.UUID | None = None,
        actor_type: str | None = None,
    ) -> None: ...


# ── Result types (frozen — caller cannot mutate verdict) ──────────────────


@dataclass(frozen=True, slots=True, kw_only=True)
class InputGuardrailResult:
    """Outcome of an input-layer guardrail check.

    When ``fired=True``, ``action='pending_moderation'`` instructs the
    orchestrator to route the post to ComunifyCommunityPostModel.status =
    pending_moderation (creator dashboard surfaces for manual review).
    """

    fired: bool
    action: Literal["pending_moderation"] | None = None
    detection_source: Literal["regex", "classifier"] | None = None
    classifier_score: float | None = None


@dataclass(frozen=True, slots=True, kw_only=True)
class OutputGuardrailResult:
    """Outcome of an output-layer guardrail check.

    When ``blocked=True``:
      * ``action='regenerate_with_no_spam_instruction'`` — first failure;
        caller retries with explicit "no promotional links" suffix.
      * ``action='use_fallback_response'`` — retry exhausted; caller sends
        ``fallback_response`` verbatim.
    """

    blocked: bool
    action: (
        Literal[
            "regenerate_with_no_spam_instruction",
            "use_fallback_response",
        ]
        | None
    ) = None
    fallback_response: str | None = None
    detection_source: Literal["regex", "classifier"] | None = None
    classifier_score: float | None = None


# ── Pure helpers (unit-testable, no I/O) ──────────────────────────────────


def fires_input_regex(user_msg: str) -> bool:
    """Return True iff ``user_msg`` matches any cement INPUT spam pattern.

    Pure regex — no LLM, no DB. Append-only catalog of `_INPUT_PATTERNS`
    per safety ratchet.
    """
    return any(pattern.search(user_msg) for pattern in _INPUT_PATTERNS)


def fires_output_regex(llm_response: str) -> bool:
    """Return True iff ``llm_response`` matches any spam pattern.

    Anti-pivot defense — the agent must NEVER emit promotional URLs /
    click-bait domains / affiliate pitches. Same catalog as input layer.
    """
    return any(pattern.search(llm_response) for pattern in _INPUT_PATTERNS)


# ── Classifier consultation wrappers (graceful degradation) ───────────────


async def _consult_classifier_input(classifier: _LLMClassifierLike, user_msg: str) -> float | None:
    """Call the Haiku score classifier for INPUT layer.

    Returns:
      - float ≥ 0 iff classifier produced a score.
      - None iff classifier raises / times out (graceful degradation).

    Per `tessl__graceful-degradation` rule 2: every timeout needs a
    fallback. Here the fallback is "structlog warning + return None" so
    the caller can decide degradation policy.
    """
    try:
        return await classifier.aclassify_score(
            text=user_msg,
            prompt="Is this content spam (promotional cross-platform, "
            "click-bait, affiliate pitch)? Output a score 0.0-1.0.",
            timeout_sec=_CLASSIFIER_TIMEOUT_SEC,
        )
    except Exception as exc:  # noqa: BLE001 — graceful degradation
        logger.warning(
            "community_safety_no_spam.input_classifier_unavailable",
            exc=str(exc),
            text_length=len(user_msg),
        )
        return None


async def _consult_classifier_output(classifier: _LLMClassifierLike, llm_response: str) -> float | None:
    """Call the Haiku score classifier for OUTPUT layer."""
    try:
        return await classifier.aclassify_score(
            text=llm_response,
            prompt="Does this response contain promotional or spam content "
            "(external URLs, click-bait, cross-platform pivot)? Score 0.0-1.0.",
            timeout_sec=_CLASSIFIER_TIMEOUT_SEC,
        )
    except Exception as exc:  # noqa: BLE001 — graceful degradation
        logger.warning(
            "community_safety_no_spam.output_classifier_unavailable",
            exc=str(exc),
            text_length=len(llm_response),
        )
        return None


# ── Side-effecting checks (input + output layers + audit_log) ─────────────


async def community_safety_no_spam_input_check(
    *,
    user_msg: str,
    tenant_id: uuid.UUID,
    member_id: uuid.UUID | None = None,
    post_id: uuid.UUID | None = None,
    classifier: _LLMClassifierLike,
    audit_log: _AuditLogLike | None = None,
) -> InputGuardrailResult:
    """Input-layer guard — fire on spam claim, audit, return directive.

    Per 02-design § 17.5 INPUT pipeline step 3 (after PII + prompt_injection_block,
    before community_safety_no_nsfw + no_doxxing).

    Algorithm (cost-optimised — cheap regex first):
      1. Regex match → fire immediately, skip classifier (cost guard).
      2. Regex miss → consult Haiku score classifier.
      3. Classifier score > 0.85 → fire.
      4. Classifier score ≤ 0.85 OR None (outage) → pass-through.

    Parameters
    ----------
    user_msg
        Raw post / chat content (post PII sanitization + prompt_injection_block).
    tenant_id
        Required for audit_log + tenant isolation.
    member_id
        Optional — cohort member author of post; None for unauthenticated lead.
    post_id
        Optional — community post UUID if checking a post.
    classifier
        Required Haiku 4.5 score classifier (sales_agent runtime wires).
    audit_log
        Optional best-effort sink.

    Returns
    -------
    InputGuardrailResult
        - ``fired=True`` + ``action='pending_moderation'`` on positive.
        - ``fired=False`` on benign or classifier outage.
    """
    if fires_input_regex(user_msg):
        await _emit_audit_log(
            audit_log,
            tenant_id=tenant_id,
            member_id=member_id,
            post_id=post_id,
            layer="input",
            detection_source="regex",
            input_length=len(user_msg),
        )
        return InputGuardrailResult(
            fired=True,
            action="pending_moderation",
            detection_source="regex",
        )

    score = await _consult_classifier_input(classifier, user_msg)
    if score is not None and score > _SPAM_THRESHOLD:
        await _emit_audit_log(
            audit_log,
            tenant_id=tenant_id,
            member_id=member_id,
            post_id=post_id,
            layer="input",
            detection_source="classifier",
            input_length=len(user_msg),
            classifier_score=score,
        )
        return InputGuardrailResult(
            fired=True,
            action="pending_moderation",
            detection_source="classifier",
            classifier_score=score,
        )

    return InputGuardrailResult(fired=False, classifier_score=score)


async def community_safety_no_spam_output_check(
    *,
    llm_response: str,
    tenant_id: uuid.UUID,
    member_id: uuid.UUID | None = None,
    classifier: _LLMClassifierLike,
    audit_log: _AuditLogLike | None = None,
    retry_attempted: bool = False,
) -> OutputGuardrailResult:
    """Output-layer guard — block spam, retry hint, or fallback.

    Per 02-design § 17.5 OUTPUT pipeline step 7 (post-LLM, before PII detection).

    Algorithm: regex → classifier → block decision with retry semantics.
    """
    if fires_output_regex(llm_response):
        await _emit_audit_log(
            audit_log,
            tenant_id=tenant_id,
            member_id=member_id,
            layer="output",
            detection_source="regex",
            response_length=len(llm_response),
            retry_attempted=retry_attempted,
        )
        return _build_output_block_result(
            retry_attempted=retry_attempted,
            detection_source="regex",
        )

    score = await _consult_classifier_output(classifier, llm_response)
    if score is not None and score > _SPAM_THRESHOLD:
        await _emit_audit_log(
            audit_log,
            tenant_id=tenant_id,
            member_id=member_id,
            layer="output",
            detection_source="classifier",
            response_length=len(llm_response),
            retry_attempted=retry_attempted,
            classifier_score=score,
        )
        return _build_output_block_result(
            retry_attempted=retry_attempted,
            detection_source="classifier",
            classifier_score=score,
        )

    return OutputGuardrailResult(blocked=False, classifier_score=score)


def _build_output_block_result(
    *,
    retry_attempted: bool,
    detection_source: Literal["regex", "classifier"],
    classifier_score: float | None = None,
) -> OutputGuardrailResult:
    """Compose the OutputGuardrailResult for a block decision."""
    if retry_attempted:
        return OutputGuardrailResult(
            blocked=True,
            action="use_fallback_response",
            fallback_response=FALLBACK_RESPONSE,
            detection_source=detection_source,
            classifier_score=classifier_score,
        )
    return OutputGuardrailResult(
        blocked=True,
        action="regenerate_with_no_spam_instruction",
        fallback_response=None,
        detection_source=detection_source,
        classifier_score=classifier_score,
    )


# ── Best-effort audit_log emission (R23 + graceful-degradation) ───────────


async def _emit_audit_log(
    audit_log: _AuditLogLike | None,
    *,
    tenant_id: uuid.UUID,
    member_id: uuid.UUID | None = None,
    post_id: uuid.UUID | None = None,
    layer: Literal["input", "output"],
    detection_source: Literal["regex", "classifier"],
    input_length: int | None = None,
    response_length: int | None = None,
    retry_attempted: bool | None = None,
    classifier_score: float | None = None,
) -> None:
    """Best-effort audit_log emission. NEVER breaks guard decision."""
    if audit_log is None:
        return

    payload: dict[str, Any] = {
        "guardrail": "community_safety_no_spam",
        "layer": layer,
        "detection_source": detection_source,
    }
    if input_length is not None:
        payload["input_length"] = input_length
    if response_length is not None:
        payload["response_length"] = response_length
    if retry_attempted is not None:
        payload["retry_attempted"] = retry_attempted
    if classifier_score is not None:
        payload["classifier_score"] = classifier_score

    try:
        await audit_log.log_event(
            event_type=_AUDIT_EVENT_TYPE,
            severity=_AUDIT_SEVERITY,
            payload=payload,
            tenant_id=tenant_id,
            member_id=member_id,
            post_id=post_id,
        )
    except Exception as exc:  # noqa: BLE001 — best-effort observability
        logger.warning(
            "community_safety_no_spam.audit_log_failed",
            exc=str(exc),
            tenant_id=str(tenant_id),
            layer=layer,
        )


__all__ = [
    "FALLBACK_RESPONSE",
    "InputGuardrailResult",
    "OutputGuardrailResult",
    "community_safety_no_spam_input_check",
    "community_safety_no_spam_output_check",
    "fires_input_regex",
    "fires_output_regex",
]
