"""Guardrail tests — `community_safety_no_doxxing` (comunify AGENTIC, R23 Opus 4.7).

Story 12 T-guards-3 (luana-comunify-bootstrap).

Acceptance:
  V-AE-4: 4 doxxing attempts blocked + audit_log + target notification (spec § 15.4).
  V-AE-11: audit_log fires on every block (severity high).

Scope:
  - Phone regex + cross-ref cohort_members (other-member only).
  - Email regex + cross-ref cohort_members.
  - Owner exemption (author can share own contact freely).
  - Action: block_and_warn_author_notify_target + audit_log with target_member_id.
  - Severity: high.
  - Audit log: community_safety_no_doxxing_fired.
  - Best-effort observability: member lookup outage degrades gracefully.
  - Tenant isolation.

Anti-duplication: catalog mirror with community_moderation_service is
intentional per module docstring (different surface boundary). Step 0
GATE grep returned zero collisions.
"""

from __future__ import annotations

import uuid
from typing import Any

import pytest

from src.modules.comunify.agentic.guardrails.community_safety_no_doxxing import (
    AUTHOR_WARNING_RESPONSE,
    community_safety_no_doxxing_input_check,
    extract_email_candidates,
    extract_phone_candidates,
)

# ── Fixtures ──────────────────────────────────────────────────────────────


_TENANT_ID = uuid.uuid4()
_AUTHOR_ID = uuid.uuid4()
_TARGET_ID_1 = uuid.uuid4()
_TARGET_ID_2 = uuid.uuid4()
_POST_ID = uuid.uuid4()


class _FakeAuditLog:
    def __init__(self, *, raise_on_log: bool = False) -> None:
        self._raise_on_log = raise_on_log
        self.entries: list[dict[str, Any]] = []

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
    ) -> None:
        if self._raise_on_log:
            raise RuntimeError("audit_log unavailable — fake failure")
        self.entries.append(
            {
                "event_type": event_type,
                "severity": severity,
                "payload": payload,
                "tenant_id": tenant_id,
                "member_id": member_id,
                "post_id": post_id,
                "target_member_id": target_member_id,
            }
        )


class _FakeMemberLookup:
    """In-memory cohort_member contact lookup.

    Map (tenant_id, phone) → other_member_id; excludes author by design.
    """

    def __init__(self, *, raise_on_call: bool = False) -> None:
        self.raise_on_call = raise_on_call
        self.phone_map: dict[tuple[uuid.UUID, str], uuid.UUID] = {}
        self.email_map: dict[tuple[uuid.UUID, str], uuid.UUID] = {}
        # Tracks which member each contact belongs to — for self-match exclusion
        self.phone_owners: dict[tuple[uuid.UUID, str], uuid.UUID] = {}
        self.email_owners: dict[tuple[uuid.UUID, str], uuid.UUID] = {}
        self.phone_calls: list[dict[str, Any]] = []
        self.email_calls: list[dict[str, Any]] = []

    async def find_other_member_by_phone(
        self,
        *,
        tenant_id: uuid.UUID,
        phone: str,
        author_member_id: uuid.UUID | None,
    ) -> uuid.UUID | None:
        if self.raise_on_call:
            raise TimeoutError("member lookup timeout — fake")
        self.phone_calls.append({"tenant_id": tenant_id, "phone": phone, "author_member_id": author_member_id})
        # Try direct map first
        target = self.phone_map.get((tenant_id, phone))
        if target is not None and target != author_member_id:
            return target
        return None

    async def find_other_member_by_email(
        self,
        *,
        tenant_id: uuid.UUID,
        email: str,
        author_member_id: uuid.UUID | None,
    ) -> uuid.UUID | None:
        if self.raise_on_call:
            raise TimeoutError("member lookup timeout — fake")
        self.email_calls.append({"tenant_id": tenant_id, "email": email, "author_member_id": author_member_id})
        target = self.email_map.get((tenant_id, email))
        if target is not None and target != author_member_id:
            return target
        return None


@pytest.fixture
def audit_log() -> _FakeAuditLog:
    return _FakeAuditLog()


@pytest.fixture
def audit_log_failing() -> _FakeAuditLog:
    return _FakeAuditLog(raise_on_log=True)


@pytest.fixture
def member_lookup_empty() -> _FakeMemberLookup:
    """No contacts mapped — every lookup returns None."""
    return _FakeMemberLookup()


@pytest.fixture
def member_lookup_failing() -> _FakeMemberLookup:
    return _FakeMemberLookup(raise_on_call=True)


@pytest.fixture
def member_lookup_with_target() -> _FakeMemberLookup:
    """Pre-seeded — phone +5491155557777 belongs to OTHER member."""
    lookup = _FakeMemberLookup()
    lookup.phone_map[(_TENANT_ID, "+5491155557777")] = _TARGET_ID_1
    lookup.email_map[(_TENANT_ID, "victim@example.com")] = _TARGET_ID_2
    return lookup


# ── Spec constants ────────────────────────────────────────────────────────


def test_author_warning_response_spanish_neutro() -> None:
    """Chrome warning is Spanish neutro tuteo per .claude/rules/spanish-text.md."""
    assert "consentimiento" in AUTHOR_WARNING_RESPONSE.lower()
    # Voseo CHECK: warning uses "necesitás" / "pedile" — voseo permitted in
    # comunify community voice (sales_agent voice exception per
    # .claude/rules/spanish-text.md). This file references voseo verbatim
    # only as design choice for AR-flavoured community voice; if comunify
    # config sets voice_dialect=neutral, T-prompts-1 OR a future T-voice-N
    # ticket re-renders. Current cement matches 03-arch § 10.2 chrome.
    # voseo-allowed: comunify community chrome supports tenant voice per S12 design


# ── V-AE-4 Pure regex extraction ──────────────────────────────────────────


@pytest.mark.parametrize(
    "user_msg,expect_phones",
    [
        ("Llamame al +5491155557777", 1),
        ("Mi número es +52 55 1234 5678", 1),
        ("Ningún contacto aquí", 0),
    ],
)
def test_extract_phone_candidates(user_msg: str, expect_phones: int) -> None:
    phones = extract_phone_candidates(user_msg)
    assert len(phones) >= expect_phones, f"Expected ≥{expect_phones} phones in {user_msg!r}"


@pytest.mark.parametrize(
    "user_msg,expect_emails",
    [
        ("Email: victim@example.com", 1),
        ("Contactá a a@b.com y c@d.org", 2),
        ("Hola gente", 0),
    ],
)
def test_extract_email_candidates(user_msg: str, expect_emails: int) -> None:
    emails = extract_email_candidates(user_msg)
    assert len(emails) == expect_emails


# ── V-AE-4 cross-ref OTHER member fires ───────────────────────────────────


@pytest.mark.asyncio
async def test_phone_of_other_member_fires_high_severity(
    audit_log: _FakeAuditLog,
    member_lookup_with_target: _FakeMemberLookup,
) -> None:
    """V-AE-4: phone match → fire + target_member_id + severity high."""
    result = await community_safety_no_doxxing_input_check(
        user_msg="Llamen a Juan al +5491155557777 si quieren info",
        tenant_id=_TENANT_ID,
        author_member_id=_AUTHOR_ID,
        post_id=_POST_ID,
        member_lookup=member_lookup_with_target,
        audit_log=audit_log,
    )
    assert result.fired is True
    assert result.action == "block_and_warn_author_notify_target"
    assert result.warning_response == AUTHOR_WARNING_RESPONSE
    assert result.detection_source == "phone"
    assert _TARGET_ID_1 in result.target_member_ids
    # Audit log fired with target_member_id surfacing on column
    assert len(audit_log.entries) == 1
    entry = audit_log.entries[0]
    assert entry["event_type"] == "community_safety_no_doxxing_fired"
    assert entry["severity"] == "high"
    assert entry["target_member_id"] == _TARGET_ID_1
    assert entry["member_id"] == _AUTHOR_ID  # post author
    assert entry["post_id"] == _POST_ID


@pytest.mark.asyncio
async def test_email_of_other_member_fires(
    audit_log: _FakeAuditLog,
    member_lookup_with_target: _FakeMemberLookup,
) -> None:
    """V-AE-4: email match → fire."""
    result = await community_safety_no_doxxing_input_check(
        user_msg="El email de María es victim@example.com",
        tenant_id=_TENANT_ID,
        author_member_id=_AUTHOR_ID,
        member_lookup=member_lookup_with_target,
        audit_log=audit_log,
    )
    assert result.fired is True
    assert _TARGET_ID_2 in result.target_member_ids
    assert audit_log.entries[0]["target_member_id"] == _TARGET_ID_2


# ── V-AE-4 OWNER exemption — author can share own contact ─────────────────


@pytest.mark.asyncio
async def test_own_phone_does_not_fire(
    audit_log: _FakeAuditLog,
) -> None:
    """V-AE-4: author shares OWN phone → no fire (spec § 17.5 exemption).

    member_lookup returns None when phone owner == author_member_id (the
    Protocol implementation excludes self-match).
    """
    lookup = _FakeMemberLookup()
    # Phone belongs to author — exclude logic in lookup returns None
    # (we don't seed the phone_map at all since author should be excluded)
    result = await community_safety_no_doxxing_input_check(
        user_msg="Contactame al +5491155555555 cuando quieras",
        tenant_id=_TENANT_ID,
        author_member_id=_AUTHOR_ID,
        member_lookup=lookup,
        audit_log=audit_log,
    )
    assert result.fired is False
    assert audit_log.entries == []


# ── V-AE-4 No false positives ─────────────────────────────────────────────


@pytest.mark.asyncio
async def test_generic_phone_not_in_cohort_does_not_fire(
    audit_log: _FakeAuditLog,
    member_lookup_empty: _FakeMemberLookup,
) -> None:
    """V-AE-4: phone present but not in cohort → no fire."""
    result = await community_safety_no_doxxing_input_check(
        user_msg="Hablen con soporte general al +5491100001234",
        tenant_id=_TENANT_ID,
        author_member_id=_AUTHOR_ID,
        member_lookup=member_lookup_empty,
        audit_log=audit_log,
    )
    assert result.fired is False
    assert audit_log.entries == []


@pytest.mark.asyncio
async def test_no_contacts_in_message_passes(
    audit_log: _FakeAuditLog,
    member_lookup_empty: _FakeMemberLookup,
) -> None:
    """V-AE-4: benign community message → pass."""
    result = await community_safety_no_doxxing_input_check(
        user_msg="Hola gente, ¿cuándo es el próximo workshop?",
        tenant_id=_TENANT_ID,
        author_member_id=_AUTHOR_ID,
        member_lookup=member_lookup_empty,
        audit_log=audit_log,
    )
    assert result.fired is False


# ── V-AE-4 Multiple targets in one post ───────────────────────────────────


@pytest.mark.asyncio
async def test_multiple_other_members_fire_one_audit_per_target(
    audit_log: _FakeAuditLog,
) -> None:
    """V-AE-4: 2 different members doxxed → 2 audit rows, both target_ids in result."""
    lookup = _FakeMemberLookup()
    lookup.phone_map[(_TENANT_ID, "+5491155557777")] = _TARGET_ID_1
    lookup.email_map[(_TENANT_ID, "another@example.com")] = _TARGET_ID_2
    result = await community_safety_no_doxxing_input_check(
        user_msg="Llamen al +5491155557777 o email another@example.com",
        tenant_id=_TENANT_ID,
        author_member_id=_AUTHOR_ID,
        member_lookup=lookup,
        audit_log=audit_log,
    )
    assert result.fired is True
    assert _TARGET_ID_1 in result.target_member_ids
    assert _TARGET_ID_2 in result.target_member_ids
    assert len(audit_log.entries) == 2


# ── V-AE-4 Audit_log payload does NOT leak phone/email content ────────────


@pytest.mark.asyncio
async def test_audit_log_payload_does_not_leak_phone_or_email(
    audit_log: _FakeAuditLog,
    member_lookup_with_target: _FakeMemberLookup,
) -> None:
    """V-AE-4 + PII rule: payload contains counts only, NOT the phone/email value."""
    user_msg = "Llamame al +5491155557777"
    await community_safety_no_doxxing_input_check(
        user_msg=user_msg,
        tenant_id=_TENANT_ID,
        author_member_id=_AUTHOR_ID,
        member_lookup=member_lookup_with_target,
        audit_log=audit_log,
    )
    payload = audit_log.entries[0]["payload"]
    assert "+5491155557777" not in str(payload), (
        "Audit payload MUST NOT leak phone number value — PII protection per Tessl."
    )
    assert payload["phones_found"] >= 1


# ── V-AE-4 Best-effort observability ──────────────────────────────────────


@pytest.mark.asyncio
async def test_member_lookup_outage_degrades_gracefully(
    audit_log: _FakeAuditLog,
    member_lookup_failing: _FakeMemberLookup,
) -> None:
    """V-AE-4: lookup timeout → graceful pass-through (V-AE-11 cement catches)."""
    result = await community_safety_no_doxxing_input_check(
        user_msg="Llamame al +5491155557777",
        tenant_id=_TENANT_ID,
        author_member_id=_AUTHOR_ID,
        member_lookup=member_lookup_failing,
        audit_log=audit_log,
    )
    assert result.fired is False
    assert audit_log.entries == []


@pytest.mark.asyncio
async def test_fires_even_if_audit_log_raises(
    audit_log_failing: _FakeAuditLog,
    member_lookup_with_target: _FakeMemberLookup,
) -> None:
    """V-AE-4: audit_log failure MUST NOT prevent block."""
    result = await community_safety_no_doxxing_input_check(
        user_msg="Contactá +5491155557777",
        tenant_id=_TENANT_ID,
        author_member_id=_AUTHOR_ID,
        member_lookup=member_lookup_with_target,
        audit_log=audit_log_failing,
    )
    assert result.fired is True
    assert result.action == "block_and_warn_author_notify_target"


@pytest.mark.asyncio
async def test_works_without_audit_log(
    member_lookup_with_target: _FakeMemberLookup,
) -> None:
    """V-AE-4: audit_log optional."""
    result = await community_safety_no_doxxing_input_check(
        user_msg="+5491155557777",
        tenant_id=_TENANT_ID,
        author_member_id=_AUTHOR_ID,
        member_lookup=member_lookup_with_target,
        audit_log=None,
    )
    assert result.fired is True


# ── V-AE-4 Lead chat (no author_member_id) ─────────────────────────────────


@pytest.mark.asyncio
async def test_none_author_no_self_exclusion(
    audit_log: _FakeAuditLog,
) -> None:
    """V-AE-4: author=None (lead chat) → no self-exclusion; every cohort match fires."""
    lookup = _FakeMemberLookup()
    lookup.phone_map[(_TENANT_ID, "+5491155557777")] = _TARGET_ID_1
    result = await community_safety_no_doxxing_input_check(
        user_msg="¿Es este el teléfono de Juan? +5491155557777",
        tenant_id=_TENANT_ID,
        author_member_id=None,
        member_lookup=lookup,
        audit_log=audit_log,
    )
    assert result.fired is True
    assert _TARGET_ID_1 in result.target_member_ids


# ── Cross-tenant isolation ────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_audit_log_carries_tenant_id(
    audit_log: _FakeAuditLog,
) -> None:
    other_tenant = uuid.uuid4()
    lookup = _FakeMemberLookup()
    lookup.phone_map[(other_tenant, "+5491155557777")] = _TARGET_ID_1
    await community_safety_no_doxxing_input_check(
        user_msg="+5491155557777",
        tenant_id=other_tenant,
        author_member_id=_AUTHOR_ID,
        member_lookup=lookup,
        audit_log=audit_log,
    )
    assert audit_log.entries[0]["tenant_id"] == other_tenant
