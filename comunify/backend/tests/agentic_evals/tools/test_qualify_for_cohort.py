"""Tool tests — `qualify_for_cohort` (Comunify AGENTIC tool, R23 Opus 4.7).

TDD: RED-first per `.claude/rules/tdd-mandatory.md`.

Spec sources:
  * 06-tickets.yaml::T-tools-1 acceptance criteria
  * 03-arch-agentic.md § 4.1 (qualify_for_cohort spec)
  * 02-design-agentic.md (Anabella transcript — qualify_for_cohort invocation example)
  * 05-guidelines.md § R23 agentic patterns
  * .claude/rules/tenant-isolation.md (tenant_id NEVER in input schema)
  * .claude/rules/sales-agent-brand-voice.md (output is structured data only — tenant voice not asserted)

Covers (T-tools-1 ticket "Test includes" block):
  - tenant_id NOT in input Pydantic schema (security boundary, ctx-injection)
  - happy path: qualified subscriber → record persisted + event emitted
  - rejected: score < threshold → record persisted with `fit="not_qualified"` + no event
  - idempotent: same (cohort_id, lead_id, criteria_hash) within 1h → cached result (no LLM)
  - forbidden context: `community_engagement_workflow` ctx → raises ForbiddenToolContextError
  - forbidden context: `subscriber_support` ctx → same error
  - PII sanitize: subscriber.email + phone masked in trace_event payload
  - capacity full → cohort_full=True + waitlist_position populated
  - cohort not found → fit=False + recommended_tier=not_fit + gap "cohort_not_found"
  - LLM failure → fallback_used=True (graceful-degradation per tessl__graceful-degradation skill)
  - trace_event persistence failure → tool turn NOT broken (best-effort)
  - event_publisher failure → tool turn NOT broken (best-effort)
  - schema_version frozen v1 (Pydantic Literal[1])

These are UNIT tests — repositories + LLM client + event publisher + trace
event repo are all in-memory fakes. Integration tests with real Postgres
land in tests/integration/ (separate test marker, separate ticket).
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, timezone
from typing import Any

import pytest

# ─────────────────────────────────────────────────────────────────────────────
# In-memory fakes
# ─────────────────────────────────────────────────────────────────────────────


class _FakeCohort:
    """In-memory stand-in for ComunifyCohortModel (minimal surface)."""

    def __init__(
        self,
        *,
        cohort_id: uuid.UUID,
        tenant_id: uuid.UUID,
        capacity_max: int = 50,
        capacity_filled: int = 0,
        capacity_waitlist: int = 0,
        enrollment_criteria: dict[str, Any] | None = None,
        start_date: date | None = None,
        deleted_at: datetime | None = None,
    ) -> None:
        self.id = cohort_id
        self.tenant_id = tenant_id
        self.capacity_max = capacity_max
        self.capacity_filled = capacity_filled
        self.capacity_waitlist = capacity_waitlist
        self.enrollment_criteria = enrollment_criteria or {
            "min_business_stage": "validating",
            "min_monthly_income_usd": 500,
            "primary_pain_match": ["pricing_guilt", "imposter_syndrome"],
        }
        self.start_date = start_date or date(2026, 6, 1)
        self.deleted_at = deleted_at


class _FakeCohortRepo:
    """Tenant-scoped fake — mirrors `CohortRepository.get_by_id` surface."""

    def __init__(self, tenant_id: uuid.UUID, cohorts: list[_FakeCohort]) -> None:
        self._tenant_id = tenant_id
        self._rows = cohorts

    async def get_by_id(self, cohort_id: uuid.UUID) -> _FakeCohort | None:
        for c in self._rows:
            if c.id == cohort_id and c.tenant_id == self._tenant_id and c.deleted_at is None:
                return c
        return None


class _FakeQualificationRecord:
    """In-memory stand-in for ComunifyLeadQualificationRecordModel."""

    def __init__(
        self,
        *,
        record_id: uuid.UUID,
        tenant_id: uuid.UUID,
        lead_id: uuid.UUID,
        cohort_id: uuid.UUID,
        fit: str,
        recommended_tier: str,
        fit_score: int,
        lead_data: dict[str, Any],
        created_at: datetime | None = None,
    ) -> None:
        self.id = record_id
        self.tenant_id = tenant_id
        self.lead_id = lead_id
        self.cohort_id = cohort_id
        self.fit = fit
        self.recommended_tier = recommended_tier
        self.fit_score = fit_score
        self.lead_data = lead_data
        self.created_at = created_at or datetime.now(timezone.utc)


class _FakeQualificationRepo:
    """Tenant-scoped fake — mirrors LeadQualificationRepository surface."""

    def __init__(
        self,
        tenant_id: uuid.UUID,
        records: list[_FakeQualificationRecord] | None = None,
    ) -> None:
        self._tenant_id = tenant_id
        self.records: list[_FakeQualificationRecord] = records or []

    async def list_by_lead(
        self,
        lead_id: uuid.UUID,
        *,
        limit: int = 20,
    ) -> list[_FakeQualificationRecord]:
        rows = [r for r in self.records if r.lead_id == lead_id and r.tenant_id == self._tenant_id]
        # ORDER BY created_at DESC
        rows.sort(key=lambda r: r.created_at, reverse=True)
        return rows[:limit]

    async def save(self, record: Any) -> None:
        # Accept either a fake or a real model — duck-type id + fields
        self.records.append(record)


class _CapturingEventPublisher:
    """Captures emitted events for assertions."""

    def __init__(self) -> None:
        self.events: list[Any] = []

    async def emit(self, event: Any) -> None:
        self.events.append(event)


class _RaisingEventPublisher:
    """Always raises — used to confirm event publisher failures do NOT break tool turn."""

    async def emit(self, event: Any) -> None:
        raise RuntimeError("event bus down — must NOT break turn")


class _CapturingTraceRepo:
    """Captures trace_event.add() calls for observability assertions."""

    def __init__(self) -> None:
        self.calls: list[dict[str, Any]] = []

    def add(self, **kwargs: Any) -> None:
        self.calls.append(kwargs)


class _RaisingTraceRepo:
    """Always raises — used to confirm observability failures do NOT break tool turn."""

    def add(self, **kwargs: Any) -> None:
        raise RuntimeError("trace repo down — must NOT break turn")


class _FakeLLMClient:
    """Configurable LLM client — returns canned JSON or raises configured exception.

    The real client (LiteLLM/Anthropic SDK) is DI'd at caller layer.
    """

    def __init__(
        self,
        *,
        canned_score: int = 85,
        canned_gaps: list[str] | None = None,
        canned_confidence: float = 0.9,
        raise_exc: type[BaseException] | None = None,
        track_calls: bool = True,
    ) -> None:
        self._canned_score = canned_score
        self._canned_gaps = canned_gaps or []
        self._canned_confidence = canned_confidence
        self._raise_exc = raise_exc
        self.calls: list[dict[str, Any]] = [] if track_calls else []
        self._track = track_calls

    async def acompletion(
        self,
        *,
        model: str,
        messages: list[dict[str, Any]],
        max_tokens: int = 256,
        timeout: float = 30.0,
    ) -> dict[str, Any]:
        if self._track:
            self.calls.append({"model": model, "messages": messages, "max_tokens": max_tokens, "timeout": timeout})
        if self._raise_exc is not None:
            raise self._raise_exc("simulated llm failure")
        # Return Anthropic Messages API shape: choices->message->content stub
        import json

        content = json.dumps(
            {
                "score": self._canned_score,
                "gaps": self._canned_gaps,
                "confidence": self._canned_confidence,
            }
        )
        return {
            "choices": [
                {
                    "message": {
                        "role": "assistant",
                        "content": content,
                    }
                }
            ],
        }


# ─────────────────────────────────────────────────────────────────────────────
# T1 — tenant_id NOT in input schema (security boundary; sync test, no fixtures)
# ─────────────────────────────────────────────────────────────────────────────


def test_tenant_id_not_in_schema() -> None:
    """Security boundary per `.claude/rules/tenant-isolation.md`.

    tenant_id MUST NEVER appear in the client-provided Pydantic input —
    injected via tool dispatcher from ctx (sales_agent / copilot tool runtime).
    """
    from src.modules.comunify.agentic.tools.qualify_for_cohort import (
        QualifyForCohortInputV1,
    )

    fields = QualifyForCohortInputV1.model_fields
    assert "tenant_id" not in fields, (
        "tenant_id MUST NOT be in QualifyForCohortInputV1 — "
        "security boundary per tenant-isolation.md + 03-arch-agentic.md § 4.1"
    )
    assert "lead_id" in fields
    assert "cohort_id" in fields  # optional — agent may pick best-fit


# ─────────────────────────────────────────────────────────────────────────────
# T2 — schema_version frozen v1
# ─────────────────────────────────────────────────────────────────────────────


def test_schema_version_frozen_v1() -> None:
    """Schema cementation per dev-team T-D pattern (frozen + Literal[1])."""
    from src.modules.comunify.agentic.tools.qualify_for_cohort import (
        QualifyForCohortInputV1,
        QualifyForCohortOutputV1,
    )

    # Both schemas are frozen dataclasses (extra="forbid" on input, frozen on both)
    inp = QualifyForCohortInputV1(lead_id=uuid.uuid4(), action="score")
    assert inp.schema_version == 1

    out = QualifyForCohortOutputV1(
        fit=True,
        recommended_tier="level_3_core",
        fit_score=80,
        confidence=0.9,
    )
    assert out.schema_version == 1

    # Frozen — cannot assign to existing field
    with pytest.raises(Exception):
        out.fit_score = 50  # type: ignore[misc]


# ─────────────────────────────────────────────────────────────────────────────
# T3 — happy path: qualified → record persisted + event emitted
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_happy_path_qualified() -> None:
    """Score ≥ threshold → record persisted (fit=qualified) + LeadQualifiedV1 emitted."""
    from src.modules.comunify.agentic.tools.qualify_for_cohort import (
        LeadQualifiedV1,
        QualifyForCohortInputV1,
        qualify_for_cohort,
    )

    tenant_id = uuid.uuid4()
    lead_id = uuid.uuid4()
    cohort_id = uuid.uuid4()

    cohort_repo = _FakeCohortRepo(
        tenant_id,
        [_FakeCohort(cohort_id=cohort_id, tenant_id=tenant_id, capacity_max=50, capacity_filled=10)],
    )
    qualification_repo = _FakeQualificationRepo(tenant_id)
    llm_client = _FakeLLMClient(canned_score=88, canned_gaps=[], canned_confidence=0.95)
    event_publisher = _CapturingEventPublisher()

    result = await qualify_for_cohort(
        QualifyForCohortInputV1(
            lead_id=lead_id,
            cohort_id=cohort_id,
            lead_data={"business_stage": "validating", "primary_pain": "pricing_guilt"},
            action="score",
        ),
        tenant_id=tenant_id,
        cohort_repo=cohort_repo,
        qualification_repo=qualification_repo,
        llm_client=llm_client,
        event_publisher=event_publisher,
        threshold=70,
    )

    # Output
    assert result.fit is True
    assert result.fit_score == 88
    assert result.recommended_tier != "not_fit"
    assert result.cohort_full is False
    assert result.fallback_used is False

    # Persistence
    assert len(qualification_repo.records) == 1
    persisted = qualification_repo.records[0]
    assert persisted.tenant_id == tenant_id
    assert persisted.lead_id == lead_id
    assert persisted.cohort_id == cohort_id
    assert persisted.fit == "qualified"
    assert persisted.fit_score == 88

    # Event emitted
    assert len(event_publisher.events) == 1
    event = event_publisher.events[0]
    assert isinstance(event, LeadQualifiedV1)
    assert event.tenant_id == tenant_id
    assert event.lead_id == lead_id
    assert event.cohort_id == cohort_id
    assert event.fit_score == 88


# ─────────────────────────────────────────────────────────────────────────────
# T4 — rejected: score < threshold → fit=not_qualified, no event
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_rejected_below_threshold() -> None:
    """Score < threshold → record persisted with fit=not_qualified + NO event emitted."""
    from src.modules.comunify.agentic.tools.qualify_for_cohort import (
        QualifyForCohortInputV1,
        qualify_for_cohort,
    )

    tenant_id = uuid.uuid4()
    lead_id = uuid.uuid4()
    cohort_id = uuid.uuid4()

    cohort_repo = _FakeCohortRepo(
        tenant_id,
        [_FakeCohort(cohort_id=cohort_id, tenant_id=tenant_id)],
    )
    qualification_repo = _FakeQualificationRepo(tenant_id)
    llm_client = _FakeLLMClient(
        canned_score=40, canned_gaps=["business_stage_too_early", "no_revenue_yet"], canned_confidence=0.85
    )
    event_publisher = _CapturingEventPublisher()

    result = await qualify_for_cohort(
        QualifyForCohortInputV1(lead_id=lead_id, cohort_id=cohort_id, action="score"),
        tenant_id=tenant_id,
        cohort_repo=cohort_repo,
        qualification_repo=qualification_repo,
        llm_client=llm_client,
        event_publisher=event_publisher,
        threshold=70,
    )

    assert result.fit is False
    assert result.fit_score == 40
    assert result.recommended_tier == "not_fit"
    assert "business_stage_too_early" in result.gaps

    assert len(qualification_repo.records) == 1
    assert qualification_repo.records[0].fit == "not_qualified"

    # No event emitted on rejection
    assert event_publisher.events == []


# ─────────────────────────────────────────────────────────────────────────────
# T5 — idempotent replay: same (cohort_id, lead_id, criteria_hash) within 1h
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_idempotent_replay_within_window() -> None:
    """Same (cohort_id, lead_id, criteria_hash) within 1h → cached, no LLM call."""
    from src.modules.comunify.agentic.tools.qualify_for_cohort import (
        QualifyForCohortInputV1,
        qualify_for_cohort,
    )

    tenant_id = uuid.uuid4()
    lead_id = uuid.uuid4()
    cohort_id = uuid.uuid4()

    cohort_repo = _FakeCohortRepo(tenant_id, [_FakeCohort(cohort_id=cohort_id, tenant_id=tenant_id)])
    qualification_repo = _FakeQualificationRepo(tenant_id)
    llm_client = _FakeLLMClient(canned_score=80)
    event_publisher = _CapturingEventPublisher()

    lead_data = {"business_stage": "validating", "primary_pain": "pricing_guilt"}

    # First call — LLM dispatched
    first = await qualify_for_cohort(
        QualifyForCohortInputV1(lead_id=lead_id, cohort_id=cohort_id, lead_data=lead_data),
        tenant_id=tenant_id,
        cohort_repo=cohort_repo,
        qualification_repo=qualification_repo,
        llm_client=llm_client,
        event_publisher=event_publisher,
        threshold=70,
    )
    assert len(llm_client.calls) == 1
    assert first.fit is True

    # Second call with SAME (cohort_id, lead_id, criteria_hash) — cached
    second = await qualify_for_cohort(
        QualifyForCohortInputV1(lead_id=lead_id, cohort_id=cohort_id, lead_data=lead_data),
        tenant_id=tenant_id,
        cohort_repo=cohort_repo,
        qualification_repo=qualification_repo,
        llm_client=llm_client,
        event_publisher=event_publisher,
        threshold=70,
    )

    # No additional LLM call
    assert len(llm_client.calls) == 1
    # Cached deterministic result — same score
    assert second.fit_score == first.fit_score
    assert second.recommended_tier == first.recommended_tier
    # No additional persistence + no duplicate event
    assert len(qualification_repo.records) == 1
    assert len(event_publisher.events) == 1


# ─────────────────────────────────────────────────────────────────────────────
# T6 — forbidden context: community_engagement_workflow
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_forbidden_context_community_engagement() -> None:
    """ctx=community_engagement_workflow → ForbiddenToolContextError (already enrolled)."""
    from src.modules.comunify.agentic.tools.qualify_for_cohort import (
        ForbiddenToolContextError,
        QualifyForCohortInputV1,
        qualify_for_cohort,
    )

    tenant_id = uuid.uuid4()
    cohort_repo = _FakeCohortRepo(tenant_id, [])
    qualification_repo = _FakeQualificationRepo(tenant_id)
    llm_client = _FakeLLMClient()

    with pytest.raises(ForbiddenToolContextError) as exc_info:
        await qualify_for_cohort(
            QualifyForCohortInputV1(lead_id=uuid.uuid4()),
            tenant_id=tenant_id,
            cohort_repo=cohort_repo,
            qualification_repo=qualification_repo,
            llm_client=llm_client,
            context="community_engagement_workflow",
        )
    assert "community_engagement_workflow" in str(exc_info.value)


# ─────────────────────────────────────────────────────────────────────────────
# T7 — forbidden context: subscriber_support
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_forbidden_context_subscriber_support() -> None:
    """ctx=subscriber_support → ForbiddenToolContextError."""
    from src.modules.comunify.agentic.tools.qualify_for_cohort import (
        ForbiddenToolContextError,
        QualifyForCohortInputV1,
        qualify_for_cohort,
    )

    tenant_id = uuid.uuid4()
    cohort_repo = _FakeCohortRepo(tenant_id, [])
    qualification_repo = _FakeQualificationRepo(tenant_id)
    llm_client = _FakeLLMClient()

    with pytest.raises(ForbiddenToolContextError):
        await qualify_for_cohort(
            QualifyForCohortInputV1(lead_id=uuid.uuid4()),
            tenant_id=tenant_id,
            cohort_repo=cohort_repo,
            qualification_repo=qualification_repo,
            llm_client=llm_client,
            context="subscriber_support",
        )


# ─────────────────────────────────────────────────────────────────────────────
# T8 — PII sanitized in trace_event payload
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_pii_sanitized_in_trace_event() -> None:
    """Trace event payload runs through sanitize_payload (PII redacted)."""
    from src.modules.comunify.agentic.tools.qualify_for_cohort import (
        QualifyForCohortInputV1,
        qualify_for_cohort,
    )

    tenant_id = uuid.uuid4()
    lead_id = uuid.uuid4()
    cohort_id = uuid.uuid4()

    cohort_repo = _FakeCohortRepo(tenant_id, [_FakeCohort(cohort_id=cohort_id, tenant_id=tenant_id)])
    qualification_repo = _FakeQualificationRepo(tenant_id)
    llm_client = _FakeLLMClient(canned_score=75)
    trace_repo = _CapturingTraceRepo()
    turn_id = uuid.uuid4()
    span_id = uuid.uuid4()

    lead_data_with_pii = {
        "business_stage": "validating",
        "email": "ana@example.com",
        "phone": "+54 11 5555-0000",
    }

    await qualify_for_cohort(
        QualifyForCohortInputV1(lead_id=lead_id, cohort_id=cohort_id, lead_data=lead_data_with_pii),
        tenant_id=tenant_id,
        cohort_repo=cohort_repo,
        qualification_repo=qualification_repo,
        llm_client=llm_client,
        trace_event_repo=trace_repo,
        turn_id=turn_id,
        span_id=span_id,
        threshold=70,
    )

    # Trace event was emitted
    assert len(trace_repo.calls) >= 1
    call = trace_repo.calls[0]
    payload = call.get("data") or {}

    # Lead_data PII fields, if surfaced, must have been processed by sanitize_payload.
    # We assert that raw PII strings DO NOT appear verbatim in the trace payload.
    # `sanitize_payload` from luana_core_observability redacts emails/phones;
    # if the fallback (compliance_event_service.py:67) is in effect, lead_data
    # is truncated but raw PII may still appear — so the tool itself MUST scrub
    # email/phone keys at the boundary (defense-in-depth — never trust the
    # sanitize fallback in PII scope).
    payload_str = str(payload)
    assert "ana@example.com" not in payload_str
    assert "+54 11 5555-0000" not in payload_str


# ─────────────────────────────────────────────────────────────────────────────
# T9 — capacity full: cohort_full=True + waitlist_position
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_capacity_full_returns_waitlist_position() -> None:
    """capacity_filled >= capacity_max → cohort_full=True + waitlist_position populated."""
    from src.modules.comunify.agentic.tools.qualify_for_cohort import (
        QualifyForCohortInputV1,
        qualify_for_cohort,
    )

    tenant_id = uuid.uuid4()
    cohort_id = uuid.uuid4()

    cohort_repo = _FakeCohortRepo(
        tenant_id,
        [
            _FakeCohort(
                cohort_id=cohort_id,
                tenant_id=tenant_id,
                capacity_max=20,
                capacity_filled=20,
                capacity_waitlist=3,
            )
        ],
    )
    qualification_repo = _FakeQualificationRepo(tenant_id)
    llm_client = _FakeLLMClient(canned_score=85)

    result = await qualify_for_cohort(
        QualifyForCohortInputV1(lead_id=uuid.uuid4(), cohort_id=cohort_id),
        tenant_id=tenant_id,
        cohort_repo=cohort_repo,
        qualification_repo=qualification_repo,
        llm_client=llm_client,
        threshold=70,
    )

    assert result.cohort_full is True
    assert result.waitlist_position == 4  # capacity_waitlist (3) + 1
    # Fit still computed — caller may show qualified-but-waitlisted UI
    assert result.fit is True
    assert result.fit_score == 85


# ─────────────────────────────────────────────────────────────────────────────
# T10 — cohort_id not found: fit=False + gap "cohort_not_found"
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_cohort_not_found_returns_not_fit() -> None:
    """cohort_id provided but does not resolve → fit=False + recommended=not_fit + gap."""
    from src.modules.comunify.agentic.tools.qualify_for_cohort import (
        QualifyForCohortInputV1,
        qualify_for_cohort,
    )

    tenant_id = uuid.uuid4()
    missing_cohort_id = uuid.uuid4()

    cohort_repo = _FakeCohortRepo(tenant_id, [])  # empty
    qualification_repo = _FakeQualificationRepo(tenant_id)
    llm_client = _FakeLLMClient()
    event_publisher = _CapturingEventPublisher()

    result = await qualify_for_cohort(
        QualifyForCohortInputV1(lead_id=uuid.uuid4(), cohort_id=missing_cohort_id),
        tenant_id=tenant_id,
        cohort_repo=cohort_repo,
        qualification_repo=qualification_repo,
        llm_client=llm_client,
        event_publisher=event_publisher,
    )

    assert result.fit is False
    assert result.recommended_tier == "not_fit"
    assert "cohort_not_found" in result.gaps
    # No persistence — nothing to record when cohort missing
    assert qualification_repo.records == []
    assert event_publisher.events == []
    # No LLM dispatched — short-circuit before scoring
    assert llm_client.calls == []


# ─────────────────────────────────────────────────────────────────────────────
# T11 — LLM failure → graceful fallback (deterministic score from criteria match)
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_llm_failure_falls_back_to_deterministic() -> None:
    """LLM raises (timeout/error) → output.fallback_used=True + deterministic score.

    Per tessl__graceful-degradation skill: timeout + fallback for every external call.
    """
    from src.modules.comunify.agentic.tools.qualify_for_cohort import (
        QualifyForCohortInputV1,
        qualify_for_cohort,
    )

    tenant_id = uuid.uuid4()
    cohort_id = uuid.uuid4()

    cohort_repo = _FakeCohortRepo(
        tenant_id,
        [
            _FakeCohort(
                cohort_id=cohort_id,
                tenant_id=tenant_id,
                enrollment_criteria={
                    "min_business_stage": "validating",
                    "primary_pain_match": ["pricing_guilt", "imposter_syndrome"],
                },
            )
        ],
    )
    qualification_repo = _FakeQualificationRepo(tenant_id)

    # LLM unavailable — raises TimeoutError
    import asyncio

    llm_client = _FakeLLMClient(raise_exc=asyncio.TimeoutError)

    result = await qualify_for_cohort(
        QualifyForCohortInputV1(
            lead_id=uuid.uuid4(),
            cohort_id=cohort_id,
            lead_data={
                "business_stage": "validating",
                "primary_pain": "pricing_guilt",
            },
        ),
        tenant_id=tenant_id,
        cohort_repo=cohort_repo,
        qualification_repo=qualification_repo,
        llm_client=llm_client,
        threshold=70,
    )

    # Tool did NOT raise — graceful degradation engaged
    assert result.fallback_used is True
    # Deterministic score in valid range
    assert 0 <= result.fit_score <= 100
    # Record still persisted (snapshot of state, marked with fallback hint via lead_data echo)
    assert len(qualification_repo.records) == 1


# ─────────────────────────────────────────────────────────────────────────────
# T12 — trace_event repo failure does NOT break tool turn (best-effort)
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_trace_event_failure_does_not_break_turn() -> None:
    """trace_event_repo.add() raises → tool still returns normal output (best-effort observability)."""
    from src.modules.comunify.agentic.tools.qualify_for_cohort import (
        QualifyForCohortInputV1,
        qualify_for_cohort,
    )

    tenant_id = uuid.uuid4()
    cohort_id = uuid.uuid4()

    cohort_repo = _FakeCohortRepo(tenant_id, [_FakeCohort(cohort_id=cohort_id, tenant_id=tenant_id)])
    qualification_repo = _FakeQualificationRepo(tenant_id)
    llm_client = _FakeLLMClient(canned_score=80)

    # trace_event_repo that always raises
    raising_trace_repo = _RaisingTraceRepo()

    # Tool MUST NOT raise — best-effort observability
    result = await qualify_for_cohort(
        QualifyForCohortInputV1(lead_id=uuid.uuid4(), cohort_id=cohort_id),
        tenant_id=tenant_id,
        cohort_repo=cohort_repo,
        qualification_repo=qualification_repo,
        llm_client=llm_client,
        trace_event_repo=raising_trace_repo,
        turn_id=uuid.uuid4(),
        span_id=uuid.uuid4(),
        threshold=70,
    )
    assert result.fit is True
    # Persistence still completed
    assert len(qualification_repo.records) == 1


# ─────────────────────────────────────────────────────────────────────────────
# T13 — event_publisher failure does NOT break tool turn (best-effort)
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_event_publisher_failure_does_not_break_turn() -> None:
    """event_publisher.emit() raises → tool still returns normal output (best-effort emit)."""
    from src.modules.comunify.agentic.tools.qualify_for_cohort import (
        QualifyForCohortInputV1,
        qualify_for_cohort,
    )

    tenant_id = uuid.uuid4()
    cohort_id = uuid.uuid4()

    cohort_repo = _FakeCohortRepo(tenant_id, [_FakeCohort(cohort_id=cohort_id, tenant_id=tenant_id)])
    qualification_repo = _FakeQualificationRepo(tenant_id)
    llm_client = _FakeLLMClient(canned_score=80)
    raising_publisher = _RaisingEventPublisher()

    # Tool MUST NOT raise — best-effort emit
    result = await qualify_for_cohort(
        QualifyForCohortInputV1(lead_id=uuid.uuid4(), cohort_id=cohort_id),
        tenant_id=tenant_id,
        cohort_repo=cohort_repo,
        qualification_repo=qualification_repo,
        llm_client=llm_client,
        event_publisher=raising_publisher,
        threshold=70,
    )
    assert result.fit is True
    # Persistence still completed
    assert len(qualification_repo.records) == 1
