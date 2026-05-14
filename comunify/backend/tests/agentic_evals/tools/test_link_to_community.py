"""Tool tests — `link_to_community` (Comunify AGENTIC tool, R23 Opus 4.7).

TDD: RED-first per `.claude/rules/tdd-mandatory.md`.

Spec sources:
  * 06-tickets.yaml::T-tools-2 acceptance criteria
  * 03-arch-agentic.md § 4.2 (link_to_community spec — input/output shapes + 4 actions)
  * 02-design-agentic.md § community access scenarios
  * config/brand.yaml § agentic_tools
  * .claude/rules/tenant-isolation.md (tenant_id NEVER in input schema; cross-tenant blocked)
  * .claude/rules/anti-duplication.md (lift-to-shared at N=2)
  * .claude/rules/copilot-observability.md (best-effort writes — never break turn)

Covers (T-tools-2 ticket "Test includes" block + ticket Constraints § Test):
  - tenant_id NOT in input Pydantic schema (security boundary)
  - schema_version frozen v1 (Pydantic Literal[1] cementation)
  - generate_invite happy path:
      * returns signed URL containing HMAC token + expires_at
      * cohort_member persisted (status=pending_first_access, tenant-scoped)
      * audit_log row with event_type=community_access_granted_or_renewed
      * no LLM call ($0 cost)
  - resend_invite idempotency: within 5-min window, same input → same URL
                                (no new persistence, no new audit_log)
  - resend_invite outside window → NEW signed URL with refreshed expiry
  - suggest_path: Haiku LLM call → 1-3 community tier suggestions per
                  subscriber expertise; failure → deterministic fallback
  - verify_access: valid HMAC + non-expired → bool True; expired/tampered → False
  - cross-tenant: tenant_A signed token → tenant_B verify returns False
                  (per .claude/rules/tenant-isolation.md cross-tenant attempt)
  - forbidden context: `lead_qualification` ctx → ForbiddenToolContextError
  - audit_log persistence failure → tool turn NOT broken (best-effort)
  - trace_event persistence failure → tool turn NOT broken (best-effort)
  - LLM failure (suggest_path) → fallback_used=True (graceful-degradation)
  - missing HMAC secret env var → resilient (raises explicit error, not silent fail)
  - PII sanitize defense-in-depth: subscriber payload PII stripped before trace_event

These are UNIT tests — repositories + LLM + audit log + trace event repos are
in-memory fakes. Integration tests with real Postgres land in tests/integration/
(separate marker, separate ticket).
"""

from __future__ import annotations

import hashlib
import hmac
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.parse import parse_qs, urlparse

import pytest

# ─────────────────────────────────────────────────────────────────────────────
# In-memory fakes — mirror the cohort_member / audit_log / llm / trace repos
# consumed by the real tool, isolated from Postgres / observability stack.
# ─────────────────────────────────────────────────────────────────────────────

_TEST_SECRET = "test-secret-for-hmac-do-not-use-in-prod"  # noqa: S105


@pytest.fixture(autouse=True)
def _hmac_secret_env(monkeypatch: pytest.MonkeyPatch) -> None:
    """Provide COMUNIFY_INVITE_SECRET for all tests unless overridden inline."""
    monkeypatch.setenv("COMUNIFY_INVITE_SECRET", _TEST_SECRET)
    monkeypatch.setenv("COMUNIFY_INVITE_BASE_URL", "https://app.comunify.test/community")


class _FakeCohortMember:
    """In-memory stand-in for ComunifyCohortMemberModel (subset used by tool)."""

    def __init__(
        self,
        *,
        member_id: uuid.UUID,
        tenant_id: uuid.UUID,
        cohort_id: uuid.UUID,
        subscriber_id: uuid.UUID,
        status: str = "active",
        tier: str = "regular",
        enrollment_at: datetime | None = None,
        last_active_at: datetime | None = None,
        deleted_at: datetime | None = None,
    ) -> None:
        self.id = member_id
        self.tenant_id = tenant_id
        self.cohort_id = cohort_id
        self.subscriber_id = subscriber_id
        self.status = status
        self.tier = tier
        self.enrollment_at = enrollment_at or datetime.now(timezone.utc)
        self.last_active_at = last_active_at
        self.deleted_at = deleted_at


class _FakeCohortMemberRepo:
    """Tenant-scoped fake — mirrors `CohortMemberRepository` surface used by tool."""

    def __init__(self, tenant_id: uuid.UUID, members: list[_FakeCohortMember] | None = None) -> None:
        self._tenant_id = tenant_id
        self._members: list[_FakeCohortMember] = members or []
        self.saved: list[_FakeCohortMember] = []

    async def find_by_cohort_and_subscriber(
        self,
        cohort_id: uuid.UUID,
        subscriber_id: uuid.UUID,
    ) -> _FakeCohortMember | None:
        for m in self._members:
            if (
                m.cohort_id == cohort_id
                and m.subscriber_id == subscriber_id
                and m.tenant_id == self._tenant_id
                and m.deleted_at is None
            ):
                return m
        return None

    async def find_by_subscriber(self, subscriber_id: uuid.UUID) -> list[_FakeCohortMember]:
        """Used by suggest_path action to discover candidate cohorts."""
        return [
            m
            for m in self._members
            if m.subscriber_id == subscriber_id and m.tenant_id == self._tenant_id and m.deleted_at is None
        ]

    async def save(self, member: _FakeCohortMember) -> None:
        # upsert by id semantics — replace if exists
        for i, existing in enumerate(self._members):
            if existing.id == member.id:
                self._members[i] = member
                self.saved.append(member)
                return
        self._members.append(member)
        self.saved.append(member)


class _FakeAuditLogRepo:
    """Captures audit_log events for assertions."""

    def __init__(self, tenant_id: uuid.UUID) -> None:
        self._tenant_id = tenant_id
        self.saved: list[Any] = []

    async def save(self, event: Any) -> None:
        # tenant-scope check — tool's caller binds repo to tenant; mismatched events surface as bug
        if getattr(event, "tenant_id", None) != self._tenant_id:
            raise AssertionError("audit_log_repo_tenant_mismatch: tool wrote cross-tenant audit row")
        self.saved.append(event)


class _RaisingAuditLogRepo:
    """Always raises — confirms audit failures do NOT break tool turn."""

    async def save(self, event: Any) -> None:
        raise RuntimeError("audit log down — must NOT break turn")


class _CapturingTraceRepo:
    """Captures trace_event.add() calls for observability assertions."""

    def __init__(self) -> None:
        self.calls: list[dict[str, Any]] = []

    def add(self, **kwargs: Any) -> None:
        self.calls.append(kwargs)


class _RaisingTraceRepo:
    """Always raises — confirms trace failures do NOT break tool turn."""

    def add(self, **kwargs: Any) -> None:
        raise RuntimeError("trace repo down — must NOT break turn")


class _FakeLLMClient:
    """Configurable LLM client for suggest_path action.

    Returns Anthropic Messages API shape: choices->message->content (str JSON).
    The real client (LiteLLM / Anthropic SDK) is DI'd at caller layer.
    """

    def __init__(
        self,
        *,
        canned_tiers: list[str] | None = None,
        canned_rationale: str = "Lead seems early stage; start at level_2_tripwire.",
        canned_confidence: float = 0.8,
        raise_exc: type[BaseException] | None = None,
    ) -> None:
        self._tiers = canned_tiers or ["level_2_tripwire"]
        self._rationale = canned_rationale
        self._confidence = canned_confidence
        self._raise_exc = raise_exc
        self.calls: list[dict[str, Any]] = []

    async def acompletion(
        self,
        *,
        model: str,
        messages: list[dict[str, Any]],
        max_tokens: int = 256,
        timeout: float = 30.0,
    ) -> dict[str, Any]:
        self.calls.append({"model": model, "messages": messages, "max_tokens": max_tokens, "timeout": timeout})
        if self._raise_exc is not None:
            raise self._raise_exc("simulated llm failure")
        import json

        content = json.dumps(
            {
                "suggested_tiers": self._tiers,
                "rationale": self._rationale,
                "confidence": self._confidence,
            }
        )
        return {"choices": [{"message": {"role": "assistant", "content": content}}]}


# ─────────────────────────────────────────────────────────────────────────────
# Helpers — extract token from URL
# ─────────────────────────────────────────────────────────────────────────────


def _extract_token(url: str) -> str:
    parsed = urlparse(url)
    qs = parse_qs(parsed.query)
    tokens = qs.get("token") or []
    if not tokens:
        raise AssertionError(f"signed url missing 'token' query param: {url}")
    return tokens[0]


def _extract_expiry(url: str) -> int:
    parsed = urlparse(url)
    qs = parse_qs(parsed.query)
    exp = qs.get("exp") or []
    if not exp:
        raise AssertionError(f"signed url missing 'exp' query param: {url}")
    return int(exp[0])


# ═════════════════════════════════════════════════════════════════════════════
# T1 — tenant_id NOT in input schema (security boundary, ctx-injection only)
# ═════════════════════════════════════════════════════════════════════════════


def test_tenant_id_not_in_schema() -> None:
    """tenant_id MUST be injected from ctx, NEVER in client-provided input.

    Per `.claude/rules/tenant-isolation.md` + 03-arch-agentic.md § 4.2.
    """
    from src.modules.comunify.agentic.tools.link_to_community import (
        LinkToCommunityInputV1,
    )

    fields = LinkToCommunityInputV1.model_fields
    assert "tenant_id" not in fields, (
        "tenant_id MUST NOT be in LinkToCommunityInputV1 — "
        "security boundary per tenant-isolation.md + 03-arch-agentic.md § 4.2"
    )
    assert "subscriber_id" in fields
    assert "action" in fields


# ═════════════════════════════════════════════════════════════════════════════
# T2 — schema_version frozen v1
# ═════════════════════════════════════════════════════════════════════════════


def test_schema_version_frozen_v1() -> None:
    """Pydantic schema cementation: schema_version Literal[1] + frozen model.

    Bumping schema_version is a breaking change requiring review.
    """
    from src.modules.comunify.agentic.tools.link_to_community import (
        LinkToCommunityInputV1,
        LinkToCommunityOutputV1,
    )

    inp = LinkToCommunityInputV1(subscriber_id=uuid.uuid4(), action="generate_invite")
    assert inp.schema_version == 1

    out = LinkToCommunityOutputV1(
        invite_url="https://app.comunify.test/community?token=x&exp=1",
        status="pending_first_access",
        action_performed="generate_invite",
    )
    assert out.schema_version == 1

    # Output is frozen — cannot mutate after construction
    with pytest.raises(Exception):
        out.status = "expired"  # type: ignore[misc]


# ═════════════════════════════════════════════════════════════════════════════
# T3 — generate_invite happy path
# ═════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_generate_invite_happy_path() -> None:
    """generate_invite returns signed URL + persists member + audit_log + no LLM."""
    from src.modules.comunify.agentic.tools.link_to_community import (
        CommunityAccessAuditedV1,
        LinkToCommunityInputV1,
        link_to_community,
    )

    tenant_id = uuid.uuid4()
    cohort_id = uuid.uuid4()
    subscriber_id = uuid.uuid4()

    # subscriber already enrolled (real flow: CohortEnrollmentWorkflow created the row)
    existing_member = _FakeCohortMember(
        member_id=uuid.uuid4(),
        tenant_id=tenant_id,
        cohort_id=cohort_id,
        subscriber_id=subscriber_id,
        status="active",
    )
    member_repo = _FakeCohortMemberRepo(tenant_id, [existing_member])
    audit_repo = _FakeAuditLogRepo(tenant_id)
    llm_client = _FakeLLMClient()

    result = await link_to_community(
        LinkToCommunityInputV1(
            subscriber_id=subscriber_id,
            cohort_id=cohort_id,
            action="generate_invite",
        ),
        tenant_id=tenant_id,
        member_repo=member_repo,
        audit_repo=audit_repo,
        llm_client=llm_client,
    )

    # Output shape
    assert result.schema_version == 1
    assert result.action_performed == "generate_invite"
    assert result.status == "pending_first_access"
    assert result.invite_url.startswith("https://app.comunify.test/community")
    assert result.expires_at is not None
    assert result.expires_at > datetime.now(timezone.utc)
    assert result.fallback_used is False

    # URL carries a valid HMAC token
    token = _extract_token(result.invite_url)
    exp = _extract_expiry(result.invite_url)
    expected = hmac.new(
        key=_TEST_SECRET.encode("utf-8"),
        msg=f"{tenant_id}:{subscriber_id}:{exp}".encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()
    assert token == expected, "HMAC token does not match canonical computation"

    # Audit log persisted
    assert len(audit_repo.saved) == 1
    ev = audit_repo.saved[0]
    assert isinstance(ev, CommunityAccessAuditedV1)
    assert ev.tenant_id == tenant_id
    assert ev.subscriber_id == subscriber_id
    assert ev.cohort_id == cohort_id
    assert ev.action == "generate_invite"
    assert ev.event_type == "community_access_granted_or_renewed"

    # No LLM call for generate_invite ($0 cost per 03-arch-agentic § 4.6)
    assert llm_client.calls == []


# ═════════════════════════════════════════════════════════════════════════════
# T4 — resend_invite idempotency within 5-min window
# ═════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_resend_invite_idempotent_within_5min() -> None:
    """Two resend_invite calls within 5 min → same URL, single audit_log row."""
    from src.modules.comunify.agentic.tools.link_to_community import (
        LinkToCommunityInputV1,
        link_to_community,
    )

    tenant_id = uuid.uuid4()
    cohort_id = uuid.uuid4()
    subscriber_id = uuid.uuid4()
    existing = _FakeCohortMember(
        member_id=uuid.uuid4(),
        tenant_id=tenant_id,
        cohort_id=cohort_id,
        subscriber_id=subscriber_id,
    )
    member_repo = _FakeCohortMemberRepo(tenant_id, [existing])
    audit_repo = _FakeAuditLogRepo(tenant_id)
    llm_client = _FakeLLMClient()

    inp = LinkToCommunityInputV1(subscriber_id=subscriber_id, cohort_id=cohort_id, action="resend_invite")

    first = await link_to_community(
        inp, tenant_id=tenant_id, member_repo=member_repo, audit_repo=audit_repo, llm_client=llm_client
    )
    second = await link_to_community(
        inp, tenant_id=tenant_id, member_repo=member_repo, audit_repo=audit_repo, llm_client=llm_client
    )

    # Same canonical URL — second call short-circuits via idempotency cache
    assert first.invite_url == second.invite_url
    assert first.expires_at == second.expires_at
    # Exactly ONE audit row (idempotency replay does NOT re-audit)
    assert len(audit_repo.saved) == 1


@pytest.mark.asyncio
async def test_resend_invite_outside_window_new_url() -> None:
    """Two resend_invite calls separated by >5 min → fresh URL + 2nd audit row."""
    from src.modules.comunify.agentic.tools.link_to_community import (
        _IDEMPOTENCY_WINDOW,
        LinkToCommunityInputV1,
        link_to_community,
    )

    tenant_id = uuid.uuid4()
    cohort_id = uuid.uuid4()
    subscriber_id = uuid.uuid4()
    member_repo = _FakeCohortMemberRepo(
        tenant_id,
        [
            _FakeCohortMember(
                member_id=uuid.uuid4(),
                tenant_id=tenant_id,
                cohort_id=cohort_id,
                subscriber_id=subscriber_id,
            )
        ],
    )
    audit_repo = _FakeAuditLogRepo(tenant_id)
    llm_client = _FakeLLMClient()

    inp = LinkToCommunityInputV1(subscriber_id=subscriber_id, cohort_id=cohort_id, action="resend_invite")

    base = datetime.now(timezone.utc)
    first = await link_to_community(
        inp,
        tenant_id=tenant_id,
        member_repo=member_repo,
        audit_repo=audit_repo,
        llm_client=llm_client,
        _now=base,
    )
    # 6 minutes later — outside 5-min idempotency window
    later = base + _IDEMPOTENCY_WINDOW + timedelta(minutes=1)
    second = await link_to_community(
        inp,
        tenant_id=tenant_id,
        member_repo=member_repo,
        audit_repo=audit_repo,
        llm_client=llm_client,
        _now=later,
    )

    assert first.invite_url != second.invite_url
    assert second.expires_at > first.expires_at
    assert len(audit_repo.saved) == 2


# ═════════════════════════════════════════════════════════════════════════════
# T5 — suggest_path Haiku call + fallback
# ═════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_suggest_path_haiku_returns_tiers() -> None:
    """suggest_path issues one Haiku call → 1-3 suggested community tiers."""
    from src.modules.comunify.agentic.tools.link_to_community import (
        LinkToCommunityInputV1,
        link_to_community,
    )

    tenant_id = uuid.uuid4()
    subscriber_id = uuid.uuid4()
    member_repo = _FakeCohortMemberRepo(tenant_id, [])
    audit_repo = _FakeAuditLogRepo(tenant_id)
    llm_client = _FakeLLMClient(
        canned_tiers=["level_1_lead_magnet", "level_2_tripwire"],
        canned_rationale="Early stage creator — start lead magnet, graduate to tripwire.",
        canned_confidence=0.82,
    )

    result = await link_to_community(
        LinkToCommunityInputV1(
            subscriber_id=subscriber_id,
            action="suggest_path",
            subscriber_profile={"business_stage": "validating", "primary_niche": "wellness"},
        ),
        tenant_id=tenant_id,
        member_repo=member_repo,
        audit_repo=audit_repo,
        llm_client=llm_client,
    )

    assert result.action_performed == "suggest_path"
    assert result.suggested_tiers == ["level_1_lead_magnet", "level_2_tripwire"]
    assert 1 <= len(result.suggested_tiers) <= 3
    assert result.confidence == pytest.approx(0.82)
    assert result.fallback_used is False
    assert len(llm_client.calls) == 1
    # suggest_path is non-mutating — no audit_log (only generate/resend/verify-accessed)
    assert audit_repo.saved == []


@pytest.mark.asyncio
async def test_suggest_path_llm_failure_engages_fallback() -> None:
    """LLM failure → deterministic fallback (heuristic on profile)."""
    from src.modules.comunify.agentic.tools.link_to_community import (
        LinkToCommunityInputV1,
        link_to_community,
    )

    tenant_id = uuid.uuid4()
    member_repo = _FakeCohortMemberRepo(tenant_id, [])
    audit_repo = _FakeAuditLogRepo(tenant_id)
    llm_client = _FakeLLMClient(raise_exc=RuntimeError)

    result = await link_to_community(
        LinkToCommunityInputV1(
            subscriber_id=uuid.uuid4(),
            action="suggest_path",
            subscriber_profile={"business_stage": "scaling"},
        ),
        tenant_id=tenant_id,
        member_repo=member_repo,
        audit_repo=audit_repo,
        llm_client=llm_client,
    )

    assert result.fallback_used is True
    assert len(result.suggested_tiers) >= 1
    assert result.confidence <= 0.5  # rule-based floor


# ═════════════════════════════════════════════════════════════════════════════
# T6 — verify_access happy + tampering + expiry
# ═════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_verify_access_valid_returns_true() -> None:
    """Round-trip: generate → verify → access_granted=True."""
    from src.modules.comunify.agentic.tools.link_to_community import (
        LinkToCommunityInputV1,
        link_to_community,
    )

    tenant_id = uuid.uuid4()
    cohort_id = uuid.uuid4()
    subscriber_id = uuid.uuid4()
    existing = _FakeCohortMember(
        member_id=uuid.uuid4(),
        tenant_id=tenant_id,
        cohort_id=cohort_id,
        subscriber_id=subscriber_id,
    )
    member_repo = _FakeCohortMemberRepo(tenant_id, [existing])
    audit_repo = _FakeAuditLogRepo(tenant_id)
    llm_client = _FakeLLMClient()

    # Step 1 — generate invite
    gen = await link_to_community(
        LinkToCommunityInputV1(subscriber_id=subscriber_id, cohort_id=cohort_id, action="generate_invite"),
        tenant_id=tenant_id,
        member_repo=member_repo,
        audit_repo=audit_repo,
        llm_client=llm_client,
    )

    token = _extract_token(gen.invite_url)
    exp = _extract_expiry(gen.invite_url)

    # Step 2 — verify
    ver = await link_to_community(
        LinkToCommunityInputV1(
            subscriber_id=subscriber_id,
            cohort_id=cohort_id,
            action="verify_access",
            token=token,
            token_expiry=exp,
        ),
        tenant_id=tenant_id,
        member_repo=member_repo,
        audit_repo=audit_repo,
        llm_client=llm_client,
    )

    assert ver.action_performed == "verify_access"
    assert ver.access_granted is True


@pytest.mark.asyncio
async def test_verify_access_tampered_token_returns_false() -> None:
    """Tampered HMAC → access_granted=False (cryptographic verification)."""
    from src.modules.comunify.agentic.tools.link_to_community import (
        LinkToCommunityInputV1,
        link_to_community,
    )

    tenant_id = uuid.uuid4()
    cohort_id = uuid.uuid4()
    subscriber_id = uuid.uuid4()
    member_repo = _FakeCohortMemberRepo(
        tenant_id,
        [
            _FakeCohortMember(
                member_id=uuid.uuid4(),
                tenant_id=tenant_id,
                cohort_id=cohort_id,
                subscriber_id=subscriber_id,
            )
        ],
    )
    audit_repo = _FakeAuditLogRepo(tenant_id)
    llm_client = _FakeLLMClient()

    future = int((datetime.now(timezone.utc) + timedelta(days=7)).timestamp())

    result = await link_to_community(
        LinkToCommunityInputV1(
            subscriber_id=subscriber_id,
            cohort_id=cohort_id,
            action="verify_access",
            token="deadbeef" * 8,  # bogus
            token_expiry=future,
        ),
        tenant_id=tenant_id,
        member_repo=member_repo,
        audit_repo=audit_repo,
        llm_client=llm_client,
    )

    assert result.access_granted is False


@pytest.mark.asyncio
async def test_verify_access_expired_returns_false() -> None:
    """token_expiry in the past → access_granted=False even with valid HMAC."""
    from src.modules.comunify.agentic.tools.link_to_community import (
        LinkToCommunityInputV1,
        link_to_community,
    )

    tenant_id = uuid.uuid4()
    cohort_id = uuid.uuid4()
    subscriber_id = uuid.uuid4()
    member_repo = _FakeCohortMemberRepo(
        tenant_id,
        [
            _FakeCohortMember(
                member_id=uuid.uuid4(),
                tenant_id=tenant_id,
                cohort_id=cohort_id,
                subscriber_id=subscriber_id,
            )
        ],
    )
    audit_repo = _FakeAuditLogRepo(tenant_id)
    llm_client = _FakeLLMClient()

    past_exp = int((datetime.now(timezone.utc) - timedelta(days=1)).timestamp())
    # Generate a valid signature for an expired window
    valid_sig = hmac.new(
        key=_TEST_SECRET.encode("utf-8"),
        msg=f"{tenant_id}:{subscriber_id}:{past_exp}".encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()

    result = await link_to_community(
        LinkToCommunityInputV1(
            subscriber_id=subscriber_id,
            cohort_id=cohort_id,
            action="verify_access",
            token=valid_sig,
            token_expiry=past_exp,
        ),
        tenant_id=tenant_id,
        member_repo=member_repo,
        audit_repo=audit_repo,
        llm_client=llm_client,
    )

    assert result.access_granted is False


# ═════════════════════════════════════════════════════════════════════════════
# T7 — cross-tenant: tenant_A token cannot be verified by tenant_B
# ═════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_cross_tenant_verify_rejected() -> None:
    """Token signed for tenant_A → verify under tenant_B returns False.

    Per `.claude/rules/tenant-isolation.md` cross-tenant attempt invariant —
    HMAC payload binds tenant_id, so the signature is intrinsically tenant-bound.
    """
    from src.modules.comunify.agentic.tools.link_to_community import (
        LinkToCommunityInputV1,
        link_to_community,
    )

    tenant_a = uuid.uuid4()
    tenant_b = uuid.uuid4()
    subscriber_id = uuid.uuid4()
    future = int((datetime.now(timezone.utc) + timedelta(days=7)).timestamp())

    # Token signed by tenant_a key (same secret, but tenant_a in HMAC msg)
    token_a = hmac.new(
        key=_TEST_SECRET.encode("utf-8"),
        msg=f"{tenant_a}:{subscriber_id}:{future}".encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()

    # tenant_b verifies — its repo doesn't know the subscriber, and the HMAC
    # canonical form uses tenant_b, so verification must fail.
    member_repo_b = _FakeCohortMemberRepo(tenant_b, [])
    audit_repo_b = _FakeAuditLogRepo(tenant_b)
    llm_client = _FakeLLMClient()

    result = await link_to_community(
        LinkToCommunityInputV1(
            subscriber_id=subscriber_id,
            cohort_id=uuid.uuid4(),
            action="verify_access",
            token=token_a,
            token_expiry=future,
        ),
        tenant_id=tenant_b,  # verification context binds to tenant_b
        member_repo=member_repo_b,
        audit_repo=audit_repo_b,
        llm_client=llm_client,
    )

    assert result.access_granted is False


# ═════════════════════════════════════════════════════════════════════════════
# T8 — forbidden context guard
# ═════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_forbidden_context_raises() -> None:
    """`lead_qualification` ctx → ForbiddenToolContextError (defense-in-depth).

    Per 03-arch-agentic.md § 4.5 FORBIDDEN_TOOLS_BY_CONTEXT — `lead_qualification`
    means the subject is not yet enrolled, link_to_community must not fire.
    """
    from src.modules.comunify.agentic.tools.link_to_community import (
        ForbiddenToolContextError,
        LinkToCommunityInputV1,
        link_to_community,
    )

    tenant_id = uuid.uuid4()
    member_repo = _FakeCohortMemberRepo(tenant_id, [])
    audit_repo = _FakeAuditLogRepo(tenant_id)
    llm_client = _FakeLLMClient()

    with pytest.raises(ForbiddenToolContextError):
        await link_to_community(
            LinkToCommunityInputV1(subscriber_id=uuid.uuid4(), action="generate_invite"),
            tenant_id=tenant_id,
            member_repo=member_repo,
            audit_repo=audit_repo,
            llm_client=llm_client,
            context="lead_qualification",
        )


# ═════════════════════════════════════════════════════════════════════════════
# T9 — best-effort observability — audit + trace failures NEVER break turn
# ═════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_audit_log_failure_does_not_break_turn() -> None:
    """audit_repo.save raises → tool returns valid result + structlog warning."""
    from src.modules.comunify.agentic.tools.link_to_community import (
        LinkToCommunityInputV1,
        link_to_community,
    )

    tenant_id = uuid.uuid4()
    cohort_id = uuid.uuid4()
    subscriber_id = uuid.uuid4()
    member_repo = _FakeCohortMemberRepo(
        tenant_id,
        [
            _FakeCohortMember(
                member_id=uuid.uuid4(),
                tenant_id=tenant_id,
                cohort_id=cohort_id,
                subscriber_id=subscriber_id,
            )
        ],
    )
    audit_repo = _RaisingAuditLogRepo()
    llm_client = _FakeLLMClient()

    # Should NOT raise
    result = await link_to_community(
        LinkToCommunityInputV1(subscriber_id=subscriber_id, cohort_id=cohort_id, action="generate_invite"),
        tenant_id=tenant_id,
        member_repo=member_repo,
        audit_repo=audit_repo,  # type: ignore[arg-type]
        llm_client=llm_client,
    )

    assert result.invite_url.startswith("https://app.comunify.test/community")


@pytest.mark.asyncio
async def test_trace_event_failure_does_not_break_turn() -> None:
    """trace_event_repo.add raises → tool returns valid result + structlog warning."""
    from src.modules.comunify.agentic.tools.link_to_community import (
        LinkToCommunityInputV1,
        link_to_community,
    )

    tenant_id = uuid.uuid4()
    cohort_id = uuid.uuid4()
    subscriber_id = uuid.uuid4()
    member_repo = _FakeCohortMemberRepo(
        tenant_id,
        [
            _FakeCohortMember(
                member_id=uuid.uuid4(),
                tenant_id=tenant_id,
                cohort_id=cohort_id,
                subscriber_id=subscriber_id,
            )
        ],
    )
    audit_repo = _FakeAuditLogRepo(tenant_id)
    trace_repo = _RaisingTraceRepo()
    llm_client = _FakeLLMClient()

    # Should NOT raise
    result = await link_to_community(
        LinkToCommunityInputV1(subscriber_id=subscriber_id, cohort_id=cohort_id, action="generate_invite"),
        tenant_id=tenant_id,
        member_repo=member_repo,
        audit_repo=audit_repo,
        llm_client=llm_client,
        trace_event_repo=trace_repo,  # type: ignore[arg-type]
        turn_id=uuid.uuid4(),
        span_id=uuid.uuid4(),
    )

    assert result.invite_url.startswith("https://app.comunify.test/community")


# ═════════════════════════════════════════════════════════════════════════════
# T10 — PII sanitize defense-in-depth on trace_event payload
# ═════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_pii_scrubbed_in_trace_payload() -> None:
    """Email/phone in subscriber_profile must be redacted in observability trace."""
    from src.modules.comunify.agentic.tools.link_to_community import (
        LinkToCommunityInputV1,
        link_to_community,
    )

    tenant_id = uuid.uuid4()
    member_repo = _FakeCohortMemberRepo(tenant_id, [])
    audit_repo = _FakeAuditLogRepo(tenant_id)
    trace_repo = _CapturingTraceRepo()
    llm_client = _FakeLLMClient(canned_tiers=["level_2_tripwire"])

    profile = {
        "email": "ana@example.com",
        "phone": "+1 555 123 4567",
        "bio": "Reach me at otra@example.com or call +52 55 9999 8888",
        "business_stage": "validating",
    }

    await link_to_community(
        LinkToCommunityInputV1(
            subscriber_id=uuid.uuid4(),
            action="suggest_path",
            subscriber_profile=profile,
        ),
        tenant_id=tenant_id,
        member_repo=member_repo,
        audit_repo=audit_repo,
        llm_client=llm_client,
        trace_event_repo=trace_repo,
        turn_id=uuid.uuid4(),
        span_id=uuid.uuid4(),
    )

    assert len(trace_repo.calls) == 1
    payload = trace_repo.calls[0].get("data") or {}
    flat = str(payload)
    assert "ana@example.com" not in flat
    assert "otra@example.com" not in flat
    assert "555 123 4567" not in flat
    assert "55 9999 8888" not in flat


# ═════════════════════════════════════════════════════════════════════════════
# T11 — missing HMAC secret raises explicit error (no silent fail)
# ═════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_missing_hmac_secret_raises(monkeypatch: pytest.MonkeyPatch) -> None:
    """COMUNIFY_INVITE_SECRET unset → explicit RuntimeError (NOT silent empty token)."""
    from src.modules.comunify.agentic.tools.link_to_community import (
        LinkToCommunityInputV1,
        MissingHMACSecretError,
        link_to_community,
    )

    monkeypatch.delenv("COMUNIFY_INVITE_SECRET", raising=False)

    tenant_id = uuid.uuid4()
    member_repo = _FakeCohortMemberRepo(
        tenant_id,
        [
            _FakeCohortMember(
                member_id=uuid.uuid4(),
                tenant_id=tenant_id,
                cohort_id=uuid.uuid4(),
                subscriber_id=uuid.uuid4(),
            )
        ],
    )
    audit_repo = _FakeAuditLogRepo(tenant_id)
    llm_client = _FakeLLMClient()

    with pytest.raises(MissingHMACSecretError):
        await link_to_community(
            LinkToCommunityInputV1(subscriber_id=uuid.uuid4(), action="generate_invite"),
            tenant_id=tenant_id,
            member_repo=member_repo,
            audit_repo=audit_repo,
            llm_client=llm_client,
        )


# ═════════════════════════════════════════════════════════════════════════════
# T12 — generate_invite with subscriber not enrolled → still issues invite
#       (pending_first_access lifecycle) — but persists cohort_member row
# ═════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_generate_invite_creates_pending_member_when_not_enrolled() -> None:
    """If subscriber not yet in cohort, generate_invite creates `pending_first_access` member."""
    from src.modules.comunify.agentic.tools.link_to_community import (
        LinkToCommunityInputV1,
        link_to_community,
    )

    tenant_id = uuid.uuid4()
    cohort_id = uuid.uuid4()
    subscriber_id = uuid.uuid4()
    member_repo = _FakeCohortMemberRepo(tenant_id, [])  # empty — no enrollment yet
    audit_repo = _FakeAuditLogRepo(tenant_id)
    llm_client = _FakeLLMClient()

    result = await link_to_community(
        LinkToCommunityInputV1(
            subscriber_id=subscriber_id,
            cohort_id=cohort_id,
            action="generate_invite",
        ),
        tenant_id=tenant_id,
        member_repo=member_repo,
        audit_repo=audit_repo,
        llm_client=llm_client,
    )

    assert result.status == "pending_first_access"
    assert len(member_repo.saved) == 1
    saved = member_repo.saved[0]
    assert saved.tenant_id == tenant_id
    assert saved.cohort_id == cohort_id
    assert saved.subscriber_id == subscriber_id
    # status mapped to "pending_first_access" inside cohort_member.status
    # (cohort_member uses canonical statuses — pending_first_access maps to a
    # placeholder; for now we assert saved row exists + tenant-scoped).


# ═════════════════════════════════════════════════════════════════════════════
# T13 — suggest_path requires either profile or existing membership
# ═════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_suggest_path_with_existing_member_uses_engagement_signal() -> None:
    """When subscriber has an existing membership, suggest_path includes signal in prompt."""
    from src.modules.comunify.agentic.tools.link_to_community import (
        LinkToCommunityInputV1,
        link_to_community,
    )

    tenant_id = uuid.uuid4()
    subscriber_id = uuid.uuid4()
    existing = _FakeCohortMember(
        member_id=uuid.uuid4(),
        tenant_id=tenant_id,
        cohort_id=uuid.uuid4(),
        subscriber_id=subscriber_id,
        tier="regular",
    )
    member_repo = _FakeCohortMemberRepo(tenant_id, [existing])
    audit_repo = _FakeAuditLogRepo(tenant_id)
    llm_client = _FakeLLMClient(canned_tiers=["level_3_core"])

    result = await link_to_community(
        LinkToCommunityInputV1(
            subscriber_id=subscriber_id,
            action="suggest_path",
        ),
        tenant_id=tenant_id,
        member_repo=member_repo,
        audit_repo=audit_repo,
        llm_client=llm_client,
    )

    assert result.suggested_tiers == ["level_3_core"]
    # The LLM call should have received a message that includes existing tier
    assert len(llm_client.calls) == 1
    user_msg = next((m for m in llm_client.calls[0]["messages"] if m["role"] == "user"), None)
    assert user_msg is not None
    # The user payload should reference the existing membership tier somewhere
    assert "regular" in user_msg["content"] or "existing_membership" in user_msg["content"]


# ═════════════════════════════════════════════════════════════════════════════
# T14 — verify_access when (cohort_id, subscriber) row is dropped/suspended
#       returns False even with valid HMAC (defense-in-depth status check)
# ═════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_verify_access_dropped_member_returns_false() -> None:
    """Valid HMAC + valid expiry + member.status=dropped → access_granted=False."""
    from src.modules.comunify.agentic.tools.link_to_community import (
        LinkToCommunityInputV1,
        link_to_community,
    )

    tenant_id = uuid.uuid4()
    cohort_id = uuid.uuid4()
    subscriber_id = uuid.uuid4()
    member_repo = _FakeCohortMemberRepo(
        tenant_id,
        [
            _FakeCohortMember(
                member_id=uuid.uuid4(),
                tenant_id=tenant_id,
                cohort_id=cohort_id,
                subscriber_id=subscriber_id,
                status="dropped",
            )
        ],
    )
    audit_repo = _FakeAuditLogRepo(tenant_id)
    llm_client = _FakeLLMClient()

    future = int((datetime.now(timezone.utc) + timedelta(days=7)).timestamp())
    valid_sig = hmac.new(
        key=_TEST_SECRET.encode("utf-8"),
        msg=f"{tenant_id}:{subscriber_id}:{future}".encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()

    result = await link_to_community(
        LinkToCommunityInputV1(
            subscriber_id=subscriber_id,
            cohort_id=cohort_id,
            action="verify_access",
            token=valid_sig,
            token_expiry=future,
        ),
        tenant_id=tenant_id,
        member_repo=member_repo,
        audit_repo=audit_repo,
        llm_client=llm_client,
    )

    assert result.access_granted is False
