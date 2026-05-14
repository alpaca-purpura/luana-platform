"""Guardrail tests — `community_safety_no_spam` (comunify AGENTIC, R23 Opus 4.7).

Story 12 T-guards-1 (luana-comunify-bootstrap).

Acceptance:
  V-AE-2: 10 spam vectors — 8+ caught high-precision (spec § 15.2).
  V-AE-11: audit_log fires on every block (severity medium).

Scope:
  - INPUT regex catalog: promo+discount+click-bait TLD; click-bait imperative
    + URL; affiliate/MLM/crypto/casino pivot.
  - INPUT Haiku classifier fallback (score > 0.85 → fire).
  - OUTPUT regex (anti-pivot to spam): same INPUT catalog applied to LLM response.
  - OUTPUT Haiku classifier fallback.
  - Block + retry hint + fallback string after retry exhausted.
  - Audit log: community_safety_no_spam_fired (severity medium).
  - Best-effort observability: classifier outage + audit_log failure degrade gracefully.
  - Tenant isolation.

Anti-duplication: Step 0 GATE grep returned zero collisions (module
docstring); classifier protocol injected via DI — concrete impl Story 13+.
"""

from __future__ import annotations

import uuid
from typing import Any

import pytest

from src.modules.comunify.agentic.guardrails.community_safety_no_spam import (
    FALLBACK_RESPONSE,
    community_safety_no_spam_input_check,
    community_safety_no_spam_output_check,
    fires_input_regex,
    fires_output_regex,
)

# ── Fixtures ──────────────────────────────────────────────────────────────


_TENANT_ID = uuid.uuid4()
_MEMBER_ID = uuid.uuid4()
_POST_ID = uuid.uuid4()


class _FakeAuditLog:
    """In-memory stand-in for ComplianceEventService.log_event."""

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
            }
        )


class _FakeLLMClassifier:
    """In-memory Haiku score classifier stand-in.

    Programmable per-call result via ``next_scores`` queue OR fixed
    ``default_score``. ``raise_on_call`` simulates LiteLLM Proxy timeout.
    """

    def __init__(
        self,
        *,
        default_score: float = 0.0,
        raise_on_call: bool = False,
    ) -> None:
        self.default_score = default_score
        self.raise_on_call = raise_on_call
        self.calls: list[dict[str, Any]] = []
        self.next_scores: list[float] = []

    async def aclassify_score(
        self,
        *,
        text: str,
        prompt: str,
        timeout_sec: float = 5.0,
    ) -> float:
        if self.raise_on_call:
            raise TimeoutError("classifier timeout — fake failure")
        self.calls.append({"text": text, "prompt": prompt, "timeout_sec": timeout_sec})
        if self.next_scores:
            return self.next_scores.pop(0)
        return self.default_score


@pytest.fixture
def audit_log() -> _FakeAuditLog:
    return _FakeAuditLog()


@pytest.fixture
def audit_log_failing() -> _FakeAuditLog:
    return _FakeAuditLog(raise_on_log=True)


@pytest.fixture
def classifier_negative() -> _FakeLLMClassifier:
    return _FakeLLMClassifier(default_score=0.0)


@pytest.fixture
def classifier_positive() -> _FakeLLMClassifier:
    """Classifier score 0.95 — above 0.85 threshold."""
    return _FakeLLMClassifier(default_score=0.95)


@pytest.fixture
def classifier_failing() -> _FakeLLMClassifier:
    return _FakeLLMClassifier(raise_on_call=True)


# ── Spec constants present ────────────────────────────────────────────────


def test_fallback_response_spanish_neutro_tuteo() -> None:
    """Chrome fallback is Spanish neutro tuteo per .claude/rules/spanish-text.md."""
    assert "promociones" in FALLBACK_RESPONSE.lower()
    # No voseo: verify "tenés/podés/querés" NOT present
    assert "tenés" not in FALLBACK_RESPONSE
    assert "podés" not in FALLBACK_RESPONSE


# ── V-AE-2 INPUT regex detection (10 spam vectors) ────────────────────────


@pytest.mark.parametrize(
    "user_msg",
    [
        "Mirá este descuento del 50% en promo.tk de la semana",
        "PROMO del 80% solo hoy bit.ly/spam-link",
        "Oferta del 30% en deal-cripto.ml ya disponible",
        "click ahora https://spam.example.com/oferta para ganar",
        "click aquí https://crypto-moonshot.io para inversión 10x",
        "Afiliate aquí https://mlm.example.com/join y ganá comisión",
        "Crypto gem nueva: https://moonshot.example.io con 1000x",
        "Sumate al casino https://casino.example.com con bonus",
        "MLM ya disponible https://mlm.example.com/signup",
    ],
)
def test_input_regex_fires_on_spam_vector(user_msg: str) -> None:
    """V-AE-2: regex catches spam vectors (8+ of 10 high-precision)."""
    assert fires_input_regex(user_msg) is True, f"Should fire on: {user_msg!r}"


@pytest.mark.parametrize(
    "user_msg",
    [
        "Hola, quiero saber sobre la próxima cohorte.",
        "¿Cuánto cuesta la membresía premium?",
        "Tengo dudas sobre el contenido del workshop.",
        "¿Cuándo se abre la inscripción del Q3?",
        "Necesito información del programa de mentorías.",
        "Compré el curso, ¿cuándo empezamos?",
    ],
)
def test_input_regex_passes_benign_community_queries(user_msg: str) -> None:
    """V-AE-2: no false-positives on legitimate community queries."""
    assert fires_input_regex(user_msg) is False, f"Should NOT fire on: {user_msg!r}"


# ── V-AE-2 INPUT end-to-end ───────────────────────────────────────────────


@pytest.mark.asyncio
async def test_input_check_fires_on_regex_match_skips_classifier(
    audit_log: _FakeAuditLog,
    classifier_negative: _FakeLLMClassifier,
) -> None:
    """V-AE-2: regex hit → fire + skip classifier (cost guard)."""
    result = await community_safety_no_spam_input_check(
        user_msg="Mirá descuento 50% en bit.ly/spam-link",
        tenant_id=_TENANT_ID,
        member_id=_MEMBER_ID,
        post_id=_POST_ID,
        classifier=classifier_negative,
        audit_log=audit_log,
    )
    assert result.fired is True
    assert result.action == "pending_moderation"
    assert result.detection_source == "regex"
    assert classifier_negative.calls == [], "Cost guard — regex hit short-circuits classifier."
    assert len(audit_log.entries) == 1
    entry = audit_log.entries[0]
    assert entry["event_type"] == "community_safety_no_spam_fired"
    assert entry["severity"] == "medium"
    assert entry["payload"]["layer"] == "input"
    assert entry["payload"]["detection_source"] == "regex"
    assert entry["post_id"] == _POST_ID


@pytest.mark.asyncio
async def test_input_check_fires_on_classifier_when_regex_misses(
    audit_log: _FakeAuditLog,
    classifier_positive: _FakeLLMClassifier,
) -> None:
    """V-AE-2: regex miss + classifier > 0.85 → fire."""
    user_msg = "Sumate a mi comunidad paralela para crecer juntos"
    assert fires_input_regex(user_msg) is False  # benign-looking phrasing

    result = await community_safety_no_spam_input_check(
        user_msg=user_msg,
        tenant_id=_TENANT_ID,
        classifier=classifier_positive,
        audit_log=audit_log,
    )
    assert result.fired is True
    assert result.detection_source == "classifier"
    assert result.classifier_score == 0.95
    assert len(audit_log.entries) == 1
    assert audit_log.entries[0]["payload"]["detection_source"] == "classifier"
    assert audit_log.entries[0]["payload"]["classifier_score"] == 0.95


@pytest.mark.asyncio
async def test_input_check_passes_below_threshold(
    audit_log: _FakeAuditLog,
) -> None:
    """V-AE-2: classifier 0.7 (below 0.85 threshold) → no fire."""
    classifier = _FakeLLMClassifier(default_score=0.7)
    result = await community_safety_no_spam_input_check(
        user_msg="Quiero saber sobre el contenido de la próxima cohorte",
        tenant_id=_TENANT_ID,
        classifier=classifier,
        audit_log=audit_log,
    )
    assert result.fired is False
    assert audit_log.entries == []


@pytest.mark.asyncio
async def test_input_check_degrades_on_classifier_outage(
    audit_log: _FakeAuditLog,
    classifier_failing: _FakeLLMClassifier,
) -> None:
    """V-AE-2: classifier timeout + regex miss → pass-through (graceful)."""
    result = await community_safety_no_spam_input_check(
        user_msg="Quiero información sobre la membresía premium",
        tenant_id=_TENANT_ID,
        classifier=classifier_failing,
        audit_log=audit_log,
    )
    assert result.fired is False
    assert audit_log.entries == []


# ── V-AE-2 OUTPUT layer (anti-pivot to spam) ──────────────────────────────


@pytest.mark.asyncio
async def test_output_check_blocks_on_regex_emits_regenerate_hint(
    audit_log: _FakeAuditLog,
    classifier_negative: _FakeLLMClassifier,
) -> None:
    """V-AE-2: LLM emits promo URL → blocked, action=regenerate."""
    llm_response = "click aquí https://spam-promo.com para ganar 50%"
    result = await community_safety_no_spam_output_check(
        llm_response=llm_response,
        tenant_id=_TENANT_ID,
        member_id=_MEMBER_ID,
        classifier=classifier_negative,
        audit_log=audit_log,
        retry_attempted=False,
    )
    assert result.blocked is True
    assert result.action == "regenerate_with_no_spam_instruction"
    assert result.fallback_response is None
    assert len(audit_log.entries) == 1
    assert audit_log.entries[0]["payload"]["layer"] == "output"
    assert audit_log.entries[0]["payload"]["retry_attempted"] is False


@pytest.mark.asyncio
async def test_output_check_returns_fallback_after_retry_exhausted(
    audit_log: _FakeAuditLog,
    classifier_negative: _FakeLLMClassifier,
) -> None:
    """V-AE-2: retry_attempted=True → action='use_fallback_response'."""
    result = await community_safety_no_spam_output_check(
        llm_response="Afiliate aquí https://mlm.example.com para ganar",
        tenant_id=_TENANT_ID,
        classifier=classifier_negative,
        audit_log=audit_log,
        retry_attempted=True,
    )
    assert result.blocked is True
    assert result.action == "use_fallback_response"
    assert result.fallback_response == FALLBACK_RESPONSE
    assert audit_log.entries[0]["payload"]["retry_attempted"] is True


@pytest.mark.asyncio
async def test_output_check_passes_benign_response(
    audit_log: _FakeAuditLog,
    classifier_negative: _FakeLLMClassifier,
) -> None:
    """V-AE-2: benign LLM response → not blocked."""
    result = await community_safety_no_spam_output_check(
        llm_response="La próxima cohorte abre el 15 de octubre. Te aviso por DM cuando esté.",
        tenant_id=_TENANT_ID,
        classifier=classifier_negative,
        audit_log=audit_log,
    )
    assert result.blocked is False
    assert result.action is None
    assert audit_log.entries == []


@pytest.mark.asyncio
async def test_output_regex_catches_pivot_to_spam() -> None:
    """V-AE-2 OUTPUT layer cement — same INPUT catalog applied to LLM response."""
    assert fires_output_regex("click ahora https://promo.example.com") is True
    assert fires_output_regex("Tu cohorte empieza el lunes.") is False


# ── Best-effort observability (R23) ───────────────────────────────────────


@pytest.mark.asyncio
async def test_input_check_fires_even_if_audit_log_raises(
    audit_log_failing: _FakeAuditLog,
    classifier_negative: _FakeLLMClassifier,
) -> None:
    """V-AE-2: audit_log failure MUST NOT prevent fire decision."""
    result = await community_safety_no_spam_input_check(
        user_msg="click ahora https://spam.example.com",
        tenant_id=_TENANT_ID,
        classifier=classifier_negative,
        audit_log=audit_log_failing,
    )
    assert result.fired is True
    assert result.action == "pending_moderation"


@pytest.mark.asyncio
async def test_input_check_works_without_audit_log(
    classifier_positive: _FakeLLMClassifier,
) -> None:
    """V-AE-2: audit_log None → guard works (graceful when not provisioned)."""
    result = await community_safety_no_spam_input_check(
        user_msg="Sumate a mi gym paralelo y crecé conmigo",
        tenant_id=_TENANT_ID,
        classifier=classifier_positive,
        audit_log=None,
    )
    assert result.fired is True


# ── Cross-tenant isolation ────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_audit_log_carries_tenant_id(
    audit_log: _FakeAuditLog,
    classifier_negative: _FakeLLMClassifier,
) -> None:
    """Tenant isolation invariant — audit row carries calling tenant_id."""
    other_tenant = uuid.uuid4()
    await community_safety_no_spam_input_check(
        user_msg="click ahora https://spam.example.com",
        tenant_id=other_tenant,
        classifier=classifier_negative,
        audit_log=audit_log,
    )
    assert audit_log.entries[0]["tenant_id"] == other_tenant
