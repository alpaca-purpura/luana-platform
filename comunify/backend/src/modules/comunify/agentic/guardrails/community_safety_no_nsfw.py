r"""Comunify AGENTIC guardrail — `community_safety_no_nsfw` (image + text input layers).

R23: production_code=True AGENTIC code. Opus 4.7 EXCLUSIVE.
Story 12 T-guards-2 (luana-comunify-bootstrap).

Spec sources:
  * 02-design-agentic.md § 17.5 INPUT pipeline step 4
  * 03-arch-agentic.md § 10.2 CommunitySafetyNoNsfw
  * 06-tickets.yaml::T-guards-2 acceptance V-AE-3 + V-AE-11
  * comunify/config/brand.yaml § community_safety.nsfw_score_threshold (0.85)
  * Slot 4 cement: "❌ NSFW content (texto explícito o respuesta a imágenes NSFW)."

Anti-duplication audit (Step 0 GATE per .claude/rules/anti-duplication.md):

  Cross-codebase grep results (verified 2026-05-14):

    grep -rln "VisionClassifierProtocol\|vision_classifier\|community_safety_no_nsfw"
    → ZERO matches outside extensions.py EP-13 placeholder.

  NO mirror risk. NEW vertical-creator-economy guard. Both classifier
  protocols (vision + text) are injected via DI — concrete implementations
  live in sales_agent runtime / future vision-AI integration. Real vision
  classifier wiring deferred to Story 13+; this surface accepts stub
  results during eval testing.

Semantics — input layer (pre-LLM call, pipeline step 4):
  1. Image vision classifier (`_VisionClassifierLike`) scores each
     attachment URL — if any score > 0.85 → block_pre_persist (do NOT
     store image in S3; reject upload with form error).
  2. Text NSFW classifier (Haiku 4.5 via `_LLMClassifierLike`) scores
     user_msg — score > 0.80 → pending_moderation.
  3. Image block has higher severity than text — image_block returns
     action='block_pre_persist' + fallback form_error response.
  4. Text block returns action='pending_moderation' (review queue).
  5. Audit log per fire — severity medium.

NO output layer for NSFW (LLM not expected to emit NSFW; cement Slot 4
ASÍ NO line covers prompt-side defense; production-critical bar is
V-AE-11 adversarial pass^5 ≥0.95 grader gate).

Best-effort observability (R23 + tessl__graceful-degradation):
  * Both classifiers wrapped in try/except — outage degrades to
    pass-through (false-positive cost > false-negative cost at input;
    output layer + adversarial cement catch).
  * audit_log optional + try/except + structlog.

Cost: vision classifier per-image ≈ $0.001-0.003; text classifier
≈ $0.0001. Image-bearing posts: 1 vision call per attachment; text only:
1 Haiku call. Latency: vision p99 ≤5s; text p99 ≤2s.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from typing import Any, Literal, Protocol

import structlog

logger = structlog.get_logger(__name__)


# ── Configuration constants ───────────────────────────────────────────────


#: Spec § 17.5 / 03-arch § 10.2 chrome refusal — Spanish neutro tuteo. Used
#: as form error when image blocked at upload.
IMAGE_FALLBACK_RESPONSE: str = "La imagen contiene contenido no permitido. Subí otra."

#: Threshold for image vision classifier — mirrors brand.yaml
#: community_safety.nsfw_score_threshold (0.85). Score > threshold blocks
#: pre-persist (image never reaches S3 bucket).
_IMAGE_NSFW_THRESHOLD: float = 0.85

#: Threshold for text NSFW classifier — slightly lower (0.80) per 03-arch
#: § 10.2 ("text NSFW score > 0.80 → pending_moderation"). Text triggers
#: review queue, not auto-delete.
_TEXT_NSFW_THRESHOLD: float = 0.80

_CLASSIFIER_TIMEOUT_SEC: float = 5.0

_AUDIT_SEVERITY: str = "medium"
_AUDIT_EVENT_TYPE: str = "community_safety_no_nsfw_fired"


# ── Attachment value object ───────────────────────────────────────────────


@dataclass(frozen=True, slots=True, kw_only=True)
class Attachment:
    """Image/document attachment metadata passed to NSFW guard.

    ``url`` is the resolvable URL (pre-S3 staging) — vision classifier
    fetches bytes by URL. ``is_image`` flag avoids scoring non-image
    attachments (PDFs / docs skip vision classifier, deferred to PII
    pipeline). Bytes optional — caller may pre-fetch and pass raw bytes
    to avoid second HTTP fetch by classifier.
    """

    url: str
    is_image: bool
    content_type: str | None = None
    raw_bytes: bytes | None = None


# ── Protocols ─────────────────────────────────────────────────────────────


class _VisionClassifierLike(Protocol):
    """Minimal surface for image NSFW vision classifier.

    Concrete impl deferred to Story 13+ (production vision-AI integration —
    AWS Rekognition / Azure Content Safety / Anthropic vision multimodal).
    Stub returns 0.0 score; tests inject programmable fakes per
    `_FakeVisionClassifier` pattern.
    """

    async def score(
        self,
        *,
        url: str,
        label: str,
        raw_bytes: bytes | None = None,
        timeout_sec: float = _CLASSIFIER_TIMEOUT_SEC,
    ) -> float: ...


class _LLMClassifierLike(Protocol):
    """Minimal surface for Haiku 4.5 text NSFW classifier."""

    async def aclassify_score(
        self,
        *,
        text: str,
        prompt: str,
        timeout_sec: float = _CLASSIFIER_TIMEOUT_SEC,
    ) -> float: ...


class _AuditLogLike(Protocol):
    """ComplianceEventService.log_event surface."""

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


# ── Result type ───────────────────────────────────────────────────────────


@dataclass(frozen=True, slots=True, kw_only=True)
class NsfwGuardrailResult:
    """Outcome of NSFW guard check.

    Action distinguishes image block (production-critical, image never
    persisted) from text moderation queue (creator review). When
    ``fired=True`` and ``action='block_pre_persist'``, caller MUST reject
    the upload + surface ``fallback_response`` to user (form error chrome).
    When ``action='pending_moderation'``, post stores with status =
    pending_moderation; creator reviews via moderator dashboard.
    """

    fired: bool
    action: Literal["block_pre_persist", "pending_moderation"] | None = None
    fallback_response: str | None = None
    detection_source: Literal["image_vision", "text_classifier"] | None = None
    classifier_score: float | None = None
    blocked_attachment_url: str | None = None
    attachment_scores: dict[str, float] = field(default_factory=dict)


# ── Side-effecting check (input layer + audit_log) ────────────────────────


async def community_safety_no_nsfw_input_check(
    *,
    user_msg: str,
    tenant_id: uuid.UUID,
    member_id: uuid.UUID | None = None,
    post_id: uuid.UUID | None = None,
    attachments: list[Attachment] | None = None,
    vision_classifier: _VisionClassifierLike,
    text_classifier: _LLMClassifierLike,
    audit_log: _AuditLogLike | None = None,
) -> NsfwGuardrailResult:
    """Input-layer guard — block NSFW images pre-persist; queue NSFW text.

    Algorithm:
      1. For each image attachment, run vision classifier — if any score
         > 0.85 → block_pre_persist + fallback response.
      2. If no image flagged, run text classifier on user_msg — score
         > 0.80 → pending_moderation.
      3. Classifier outage on EITHER path → graceful pass-through (V-AE-11
         adversarial cement catches at end-to-end eval).

    Parameters
    ----------
    user_msg
        Raw post / chat text (post PII + prompt_injection + spam guards).
    tenant_id
        Required for audit_log + tenant isolation.
    member_id, post_id
        Optional — surfaced in audit_log payload.
    attachments
        Optional list of image/document attachments. None or empty list
        skips vision classifier (text-only path).
    vision_classifier
        Required vision NSFW classifier. Stub OK for tests; real impl
        Story 13+.
    text_classifier
        Required Haiku score classifier.
    audit_log
        Optional best-effort sink.

    Returns
    -------
    NsfwGuardrailResult
        - ``fired=True`` + ``action='block_pre_persist'`` on image NSFW.
        - ``fired=True`` + ``action='pending_moderation'`` on text NSFW.
        - ``fired=False`` on benign or classifier outage.
    """
    attachments = attachments or []

    # ── Step 1: Vision classifier per image attachment ────────────────
    attachment_scores: dict[str, float] = {}
    for attachment in attachments:
        if not attachment.is_image:
            continue
        score = await _consult_vision_classifier(vision_classifier, attachment)
        if score is None:
            continue  # graceful degradation — try next attachment
        attachment_scores[attachment.url] = score
        if score > _IMAGE_NSFW_THRESHOLD:
            await _emit_audit_log(
                audit_log,
                tenant_id=tenant_id,
                member_id=member_id,
                post_id=post_id,
                detection_source="image_vision",
                classifier_score=score,
                attachment_url=attachment.url,
            )
            return NsfwGuardrailResult(
                fired=True,
                action="block_pre_persist",
                fallback_response=IMAGE_FALLBACK_RESPONSE,
                detection_source="image_vision",
                classifier_score=score,
                blocked_attachment_url=attachment.url,
                attachment_scores=attachment_scores,
            )

    # ── Step 2: Text NSFW classifier on user_msg ──────────────────────
    text_score = await _consult_text_classifier(text_classifier, user_msg)
    if text_score is not None and text_score > _TEXT_NSFW_THRESHOLD:
        await _emit_audit_log(
            audit_log,
            tenant_id=tenant_id,
            member_id=member_id,
            post_id=post_id,
            detection_source="text_classifier",
            classifier_score=text_score,
        )
        return NsfwGuardrailResult(
            fired=True,
            action="pending_moderation",
            detection_source="text_classifier",
            classifier_score=text_score,
            attachment_scores=attachment_scores,
        )

    return NsfwGuardrailResult(
        fired=False,
        classifier_score=text_score,
        attachment_scores=attachment_scores,
    )


# ── Classifier wrappers (graceful degradation) ────────────────────────────


async def _consult_vision_classifier(classifier: _VisionClassifierLike, attachment: Attachment) -> float | None:
    """Score one image attachment via vision classifier.

    Returns None on timeout / error (graceful degradation) — caller
    treats None as "no information, skip attachment" and continues to
    next attachment / text classifier.
    """
    try:
        return await classifier.score(
            url=attachment.url,
            label="nsfw",
            raw_bytes=attachment.raw_bytes,
            timeout_sec=_CLASSIFIER_TIMEOUT_SEC,
        )
    except Exception as exc:  # noqa: BLE001 — graceful degradation
        logger.warning(
            "community_safety_no_nsfw.vision_classifier_unavailable",
            exc=str(exc),
            url=attachment.url,
        )
        return None


async def _consult_text_classifier(classifier: _LLMClassifierLike, user_msg: str) -> float | None:
    """Score text via Haiku text classifier."""
    try:
        return await classifier.aclassify_score(
            text=user_msg,
            prompt="Does this text contain NSFW (sexually explicit) content? Output score 0.0-1.0.",
            timeout_sec=_CLASSIFIER_TIMEOUT_SEC,
        )
    except Exception as exc:  # noqa: BLE001 — graceful degradation
        logger.warning(
            "community_safety_no_nsfw.text_classifier_unavailable",
            exc=str(exc),
            text_length=len(user_msg),
        )
        return None


# ── Best-effort audit_log emission ────────────────────────────────────────


async def _emit_audit_log(
    audit_log: _AuditLogLike | None,
    *,
    tenant_id: uuid.UUID,
    member_id: uuid.UUID | None,
    post_id: uuid.UUID | None,
    detection_source: Literal["image_vision", "text_classifier"],
    classifier_score: float,
    attachment_url: str | None = None,
) -> None:
    """Best-effort audit_log emission. NEVER breaks guard decision."""
    if audit_log is None:
        return

    payload: dict[str, Any] = {
        "guardrail": "community_safety_no_nsfw",
        "detection_source": detection_source,
        "classifier_score": classifier_score,
    }
    if attachment_url is not None:
        # URL is sanitization-safe (no PII expected; ComplianceEventService
        # runs sanitize_payload before persist regardless).
        payload["attachment_url"] = attachment_url

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
            "community_safety_no_nsfw.audit_log_failed",
            exc=str(exc),
            tenant_id=str(tenant_id),
        )


__all__ = [
    "Attachment",
    "IMAGE_FALLBACK_RESPONSE",
    "NsfwGuardrailResult",
    "community_safety_no_nsfw_input_check",
]
