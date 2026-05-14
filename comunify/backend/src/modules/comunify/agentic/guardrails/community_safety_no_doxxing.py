r"""Comunify AGENTIC guardrail — `community_safety_no_doxxing` (cross-ref cohort_members).

R23: production_code=True AGENTIC code. Opus 4.7 EXCLUSIVE.
Story 12 T-guards-3 (luana-comunify-bootstrap).

Spec sources:
  * 02-design-agentic.md § 17.5 INPUT pipeline step 5
  * 03-arch-agentic.md § 10.2 CommunitySafetyNoDoxxing
  * 06-tickets.yaml::T-guards-3 acceptance V-AE-4 + V-AE-11
  * comunify/config/brand.yaml § community_safety.doxxing_detection_enabled (true)
  * Slot 4 cement: "❌ Permitir doxxing entre miembros (compartir teléfono /
    dirección / workplace / family info de otro member sin consentimiento)."
  * D16: regex + cross-ref cohort_members table per design decision

Anti-duplication audit (Step 0 GATE per .claude/rules/anti-duplication.md):

  Cross-codebase grep results (verified 2026-05-14):

    grep -rln "community_safety_no_doxxing\|find_member_by_phone"
    → ZERO matches outside extensions.py EP-13 placeholder.

  NO mirror risk. NEW vertical-creator-economy guard. Re-uses existing
  cohort_member_repository surface (`get_by_id` only — full search by
  phone/email NOT yet implemented; design D16 cement). Member lookup
  Protocol abstracted so test injects fake without DB.

  Sibling regex catalog (`_PHONE_PATTERN` / `_EMAIL_PATTERN`) DOES exist
  at `community_moderation_service.py::_PHONE_PATTERN`/`_EMAIL_PATTERN`
  (T-be-6). Rather than mirror, this guard ALSO defines its own catalog
  here because:
    1. Different surface boundary — moderation service runs post-classify
       (after spam/nsfw score); guard runs in INPUT middleware before LLM.
    2. The guard catalog adds *cross-reference* logic (find OTHER member's
       phone/email) on top of plain regex — moderation service catalog is
       presence-only ("does content contain a phone? maybe doxxing").
    3. Lifting both to `core/luana-core-guardrails/` deferred (same
       rationale as prompt_injection_block_reuse — 3rd vertical re-eval).

  Documented for re-litigation if 3rd vertical needs same doxxing pattern.

Semantics — input layer (pre-LLM call, pipeline step 5):
  1. Extract phone numbers + emails from user_msg via regex.
  2. For each extracted contact, call MemberContactLookupProtocol to
     check if ANOTHER cohort member (NOT the author) has that contact.
  3. If match → fired=True + action='block_and_warn_author_notify_target'
     + audit_log with target_member_id + severity HIGH.
  4. If no other-member match → benign (could be author's own contact,
     or generic phone/email not in cohort) → pass-through.

Owner exemption rationale:
  Per spec § 17.5: members CAN share their OWN contact freely
  ("contactame al +54 911..."). Doxxing is specifically OTHER-member's
  PII without consent. The author_member_id parameter enables the
  cross-ref to skip self-matches.

Severity HIGH:
  Per 03-arch § 10.2 cement. Higher than spam (medium) / nsfw (medium)
  because doxxing creates immediate harm (stalking, harassment risk).
  Notification to target member ("alguien intentó compartir tus datos en
  la comunidad") is part of mitigation per spec § 17.5.

Best-effort observability (R23 + tessl__graceful-degradation):
  * Member lookup raising → graceful degradation: structlog warning +
    fired=False (false-negative for outage; downstream moderation +
    grader catches).
  * audit_log raising MUST NOT prevent block.

Cost: $0 LLM (pure regex + DB lookup). Latency: regex <1ms;
DB lookup p99 ≤200ms (cohort_members indexed on subscriber_id).
"""

from __future__ import annotations

import re
import uuid
from dataclasses import dataclass, field
from typing import Any, Literal, Protocol

import structlog

logger = structlog.get_logger(__name__)


# ── Configuration constants ───────────────────────────────────────────────


#: Spec § 17.5 chrome warning to post author — Spanish neutro tuteo.
#: Surfaces in moderation rejection notice (FE community feed).
AUTHOR_WARNING_RESPONSE: str = (
    "No podemos compartir datos personales de otros miembros sin consentimiento. "
    "Si necesitás contactar a alguien, pedile primero su autorización."
)

_AUDIT_SEVERITY: str = "high"
_AUDIT_EVENT_TYPE: str = "community_safety_no_doxxing_fired"


# ── Detection regex catalog (append-only per safety ratchet) ──────────────


#: Phone pattern — international LATAM variants (E.164 plus loose national):
#:   +54 9 11 1234-5678 (AR), +52 55 1234 5678 (MX), +56 9 1234 5678 (CL),
#:   +57 1 234 5678 (CO), +51 9 1234 5678 (PE).
#: Range bounded to 7-14 digits (filters out timestamps / IDs accidentally
#: matching). Same catalog approach as community_moderation_service —
#: separate copy here per anti-duplication audit rationale above.
_PHONE_PATTERN: re.Pattern[str] = re.compile(
    r"(?:\+?(?:549?|52|56|57|51|55)\s?)?(?:\d[\s\-.]?){7,14}\d",
)

#: Email pattern — RFC 5321 simplified (good enough for community posts).
_EMAIL_PATTERN: re.Pattern[str] = re.compile(
    r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}",
)


# ── Protocols ─────────────────────────────────────────────────────────────


class _MemberContactLookupLike(Protocol):
    """Lookup OTHER cohort members by contact (phone / email).

    Concrete implementation lives in sales_agent runtime — wraps
    CohortMemberRepository + subscriber lookup. Returns the member_id of
    the OTHER member whose contact matches, or None if no match (or only
    self-match excluded).

    The author_member_id parameter MUST be passed so self-matches are
    excluded — members can share their OWN contact freely per spec § 17.5.
    """

    async def find_other_member_by_phone(
        self,
        *,
        tenant_id: uuid.UUID,
        phone: str,
        author_member_id: uuid.UUID | None,
    ) -> uuid.UUID | None:
        """Return target member_id if phone belongs to another cohort
        member (not the author), else None.
        """
        ...  # pragma: no cover

    async def find_other_member_by_email(
        self,
        *,
        tenant_id: uuid.UUID,
        email: str,
        author_member_id: uuid.UUID | None,
    ) -> uuid.UUID | None:
        """Return target member_id if email belongs to another cohort
        member (not the author), else None.
        """
        ...  # pragma: no cover


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
class DoxxingGuardrailResult:
    """Outcome of doxxing guard check.

    On fire:
      * ``action='block_and_warn_author_notify_target'`` — caller must:
          1. Block the post (status = rejected_doxxing).
          2. Surface ``warning_response`` to author (FE chrome).
          3. Notify target member privately ("someone tried to share
             your data") via comunify/api notification channel.
      * ``target_member_ids`` — list of member_ids whose contacts were
        detected (one or more — author may have included multiple
        other-member contacts in single post).

    On pass:
      * fired=False, all other fields default.
    """

    fired: bool
    action: Literal["block_and_warn_author_notify_target"] | None = None
    warning_response: str | None = None
    target_member_ids: list[uuid.UUID] = field(default_factory=list)
    detection_source: Literal["phone", "email"] | None = None


# ── Pure helpers (unit-testable, no I/O) ──────────────────────────────────


def extract_phone_candidates(user_msg: str) -> list[str]:
    """Extract candidate phone numbers from text.

    Returns raw matches (regex hits). Caller normalises before DB lookup.
    Used by tests + the side-effecting check.
    """
    return _PHONE_PATTERN.findall(user_msg)


def extract_email_candidates(user_msg: str) -> list[str]:
    """Extract candidate email addresses from text."""
    return _EMAIL_PATTERN.findall(user_msg)


# ── Side-effecting check (input layer + audit_log) ────────────────────────


async def community_safety_no_doxxing_input_check(
    *,
    user_msg: str,
    tenant_id: uuid.UUID,
    author_member_id: uuid.UUID | None,
    post_id: uuid.UUID | None = None,
    member_lookup: _MemberContactLookupLike,
    audit_log: _AuditLogLike | None = None,
) -> DoxxingGuardrailResult:
    """Input-layer guard — block doxxing attempts cross-member.

    Per 02-design § 17.5 + 03-arch § 10.2.

    Algorithm:
      1. Extract phone numbers from user_msg.
      2. For each phone, call member_lookup.find_other_member_by_phone
         (excludes author by design — author can share own phone freely).
      3. If any match → fired=True with target_member_ids populated.
      4. Repeat for emails.
      5. Audit log on fire (severity high).

    Parameters
    ----------
    user_msg
        Raw post text (post PII sanitization — though regex catches
        pre-sanitized as well; sanitization may pass through low-confidence
        contacts).
    tenant_id
        Required for audit_log + tenant isolation.
    author_member_id
        Required for self-match exclusion. ``None`` means the author is
        not a cohort member (lead chat — every phone/email is by
        definition "other member"); guard treats None author as "no
        self-exclusion" (every match fires).
    post_id
        Optional — surfaced in audit_log payload.
    member_lookup
        Required. Real impl wraps CohortMemberRepository + subscribers.
    audit_log
        Optional best-effort sink.

    Returns
    -------
    DoxxingGuardrailResult
        fired=True with target_member_ids + warning_response on doxxing
        attempt; fired=False otherwise.

    Notes
    -----
    Member lookup outage → graceful degradation: structlog warning +
    treat as no-match (false-negative). Downstream moderation + V-AE-11
    adversarial cement catches.
    """
    target_ids: list[uuid.UUID] = []
    detection_source: Literal["phone", "email"] | None = None

    # ── Step 1: Phone-based cross-ref ─────────────────────────────────
    phones = extract_phone_candidates(user_msg)
    for phone in phones:
        target = await _lookup_other_member_by_phone(
            member_lookup,
            tenant_id=tenant_id,
            phone=phone,
            author_member_id=author_member_id,
        )
        if target is not None and target not in target_ids:
            target_ids.append(target)
            if detection_source is None:
                detection_source = "phone"

    # ── Step 2: Email-based cross-ref ─────────────────────────────────
    emails = extract_email_candidates(user_msg)
    for email in emails:
        target = await _lookup_other_member_by_email(
            member_lookup,
            tenant_id=tenant_id,
            email=email,
            author_member_id=author_member_id,
        )
        if target is not None and target not in target_ids:
            target_ids.append(target)
            if detection_source is None:
                detection_source = "email"

    if not target_ids:
        return DoxxingGuardrailResult(fired=False)

    # ── Audit_log per fire ────────────────────────────────────────────
    # Emit one audit_log entry per target (so analyst can triangulate
    # which members were targeted). target_member_id surfaces in audit
    # row column — supports future "who was doxxed and when" queries.
    for target in target_ids:
        await _emit_audit_log(
            audit_log,
            tenant_id=tenant_id,
            author_member_id=author_member_id,
            target_member_id=target,
            post_id=post_id,
            detection_source=detection_source or "phone",
            phones_found=len(phones),
            emails_found=len(emails),
        )

    return DoxxingGuardrailResult(
        fired=True,
        action="block_and_warn_author_notify_target",
        warning_response=AUTHOR_WARNING_RESPONSE,
        target_member_ids=target_ids,
        detection_source=detection_source,
    )


async def _lookup_other_member_by_phone(
    member_lookup: _MemberContactLookupLike,
    *,
    tenant_id: uuid.UUID,
    phone: str,
    author_member_id: uuid.UUID | None,
) -> uuid.UUID | None:
    """Wrap member_lookup.find_other_member_by_phone with try/except."""
    try:
        return await member_lookup.find_other_member_by_phone(
            tenant_id=tenant_id,
            phone=phone,
            author_member_id=author_member_id,
        )
    except Exception as exc:  # noqa: BLE001 — graceful degradation
        logger.warning(
            "community_safety_no_doxxing.member_lookup_phone_failed",
            exc=str(exc),
            tenant_id=str(tenant_id),
        )
        return None


async def _lookup_other_member_by_email(
    member_lookup: _MemberContactLookupLike,
    *,
    tenant_id: uuid.UUID,
    email: str,
    author_member_id: uuid.UUID | None,
) -> uuid.UUID | None:
    """Wrap member_lookup.find_other_member_by_email with try/except."""
    try:
        return await member_lookup.find_other_member_by_email(
            tenant_id=tenant_id,
            email=email,
            author_member_id=author_member_id,
        )
    except Exception as exc:  # noqa: BLE001 — graceful degradation
        logger.warning(
            "community_safety_no_doxxing.member_lookup_email_failed",
            exc=str(exc),
            tenant_id=str(tenant_id),
        )
        return None


# ── Best-effort audit_log emission ────────────────────────────────────────


async def _emit_audit_log(
    audit_log: _AuditLogLike | None,
    *,
    tenant_id: uuid.UUID,
    author_member_id: uuid.UUID | None,
    target_member_id: uuid.UUID,
    post_id: uuid.UUID | None,
    detection_source: Literal["phone", "email"],
    phones_found: int,
    emails_found: int,
) -> None:
    """Best-effort audit_log emission. NEVER breaks guard decision.

    Note: the actual phone / email *value* is NEVER logged — only counts.
    PII protection per Tessl pii-sanitisation + tenant isolation
    invariant. Target member_id surfaces in the audit row column for
    "who was doxxed" queries.
    """
    if audit_log is None:
        return

    try:
        await audit_log.log_event(
            event_type=_AUDIT_EVENT_TYPE,
            severity=_AUDIT_SEVERITY,
            payload={
                "guardrail": "community_safety_no_doxxing",
                "detection_source": detection_source,
                "phones_found": phones_found,
                "emails_found": emails_found,
            },
            tenant_id=tenant_id,
            member_id=author_member_id,  # post author
            post_id=post_id,
            target_member_id=target_member_id,  # the doxxed member
        )
    except Exception as exc:  # noqa: BLE001 — best-effort observability
        logger.warning(
            "community_safety_no_doxxing.audit_log_failed",
            exc=str(exc),
            tenant_id=str(tenant_id),
            target_member_id=str(target_member_id),
        )


__all__ = [
    "AUTHOR_WARNING_RESPONSE",
    "DoxxingGuardrailResult",
    "community_safety_no_doxxing_input_check",
    "extract_email_candidates",
    "extract_phone_candidates",
]
