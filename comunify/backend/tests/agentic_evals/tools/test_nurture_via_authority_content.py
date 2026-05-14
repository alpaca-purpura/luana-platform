"""Tool tests — `nurture_via_authority_content` (Comunify AGENTIC tool, R23 Opus 4.7).

TDD: written alongside the production tool per `.claude/rules/tdd-mandatory.md`.

Spec sources:
  * 06-tickets.yaml::T-tools-3 acceptance criteria
  * 03-arch-agentic.md § 4.3 (nurture_via_authority_content spec — input/output)
  * 02-design-agentic.md § authority vault + nurture playbook
  * config/brand.yaml § agentic_tools
  * .claude/rules/tenant-isolation.md (tenant_id NEVER in input schema; cross-tenant blocked)
  * .claude/rules/anti-duplication.md (lift-to-shared at N≥2 cardinal)
  * .claude/rules/copilot-observability.md (best-effort writes — never break turn)

Covers (T-tools-3 ticket "test cases" block + ticket Constraints § Test):
  - tenant_id NOT in input Pydantic schema (security boundary)
  - schema_version frozen v1 (Pydantic Literal[1] cementation)
  - Output model frozen (mutation raises)
  - happy: pricing_guilt intent → 3 relevant URLs returned + next_step text
  - empty vault: fallback to general items (terminal: empty result, fallback=True)
  - cross-tenant: tenant_A items NOT returned for tenant_B query
  - cached: same intent within 1h → cached response (no LLM call)
  - cache expires after 1h → fresh LLM call
  - PII sanitize: subscriber email/phone masked in trace_event
  - LLM failure → deterministic fallback engaged + fallback_used=True
  - LLM returns invalid JSON → fallback engaged
  - LLM returns IDs not in catalog → fallback engaged
  - preferred_content_type='case_study' → kind filter applied
  - intent → kind affinity heuristic correctness (deterministic path)
  - read-only: NO mutation (no `save` calls on any repo)
  - trace_event persistence failure → tool turn NOT broken (best-effort)
  - ForbiddenToolContextError lifts from shared `_exceptions.py` (no third inline copy)

These are UNIT tests — repository + LLM + trace event repo are in-memory fakes.
Integration tests with real Postgres land in tests/integration/ (separate marker).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import pytest

# ─────────────────────────────────────────────────────────────────────────────
# In-memory fakes — mirror the authority_vault / llm / trace repos consumed by
# the real tool, isolated from Postgres / observability stack.
# ─────────────────────────────────────────────────────────────────────────────


class _FakeVaultItem:
    """In-memory stand-in for ComunifyAuthorityVaultItemModel (subset used)."""

    def __init__(
        self,
        *,
        item_id: uuid.UUID,
        tenant_id: uuid.UUID,
        kind: str,
        title: str,
        content: dict[str, Any] | None = None,
        url: str | None = None,
        display_order: int = 0,
        created_at: datetime | None = None,
        deleted_at: datetime | None = None,
    ) -> None:
        self.id = item_id
        self.tenant_id = tenant_id
        self.kind = kind
        self.title = title
        self.content = content or {}
        self.url = url
        self.display_order = display_order
        self.created_at = created_at or datetime.now(timezone.utc)
        self.deleted_at = deleted_at


class _FakeVaultRepo:
    """Tenant-scoped fake — mirrors `AuthorityVaultRepository` read surface."""

    def __init__(self, tenant_id: uuid.UUID, items: list[_FakeVaultItem] | None = None) -> None:
        self._tenant_id = tenant_id
        self._items: list[_FakeVaultItem] = items or []
        self.list_all_calls = 0
        self.list_by_kind_calls: list[str] = []

    async def list_all(self) -> list[_FakeVaultItem]:
        self.list_all_calls += 1
        return [i for i in self._items if i.tenant_id == self._tenant_id and i.deleted_at is None]

    async def list_by_kind(
        self,
        kind: str,
        *,
        limit: int = 50,
        offset: int = 0,
    ) -> list[_FakeVaultItem]:
        self.list_by_kind_calls.append(kind)
        return [i for i in self._items if i.tenant_id == self._tenant_id and i.kind == kind and i.deleted_at is None][
            offset : offset + limit
        ]


class _RaisingVaultRepo:
    """Always raises — confirms repo failures route to the empty-vault fallback."""

    def __init__(self) -> None:
        self.list_all_calls = 0
        self.list_by_kind_calls: list[str] = []

    async def list_all(self) -> list[Any]:
        self.list_all_calls += 1
        raise RuntimeError("vault repo down")

    async def list_by_kind(self, kind: str, *, limit: int = 50, offset: int = 0) -> list[Any]:
        self.list_by_kind_calls.append(kind)
        raise RuntimeError("vault repo down")


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
    """Configurable LLM client for the ranking call.

    Returns Anthropic Messages API shape: choices->message->content (str JSON).
    """

    def __init__(
        self,
        *,
        canned_selected_ids: list[str] | None = None,
        canned_next_step: str = "share_case_study",
        canned_rationale: str = "Matched case studies for pricing_guilt intent.",
        canned_confidence: float = 0.85,
        raise_exc: type[BaseException] | None = None,
        invalid_response: bool = False,
        invalid_json: bool = False,
    ) -> None:
        self._selected_ids = canned_selected_ids or []
        self._next_step = canned_next_step
        self._rationale = canned_rationale
        self._confidence = canned_confidence
        self._raise_exc = raise_exc
        self._invalid_response = invalid_response
        self._invalid_json = invalid_json
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
        if self._invalid_response:
            return {"choices": []}
        if self._invalid_json:
            return {"choices": [{"message": {"role": "assistant", "content": "not-json{garbage"}}]}
        import json

        content = json.dumps(
            {
                "selected_ids": self._selected_ids,
                "next_step": self._next_step,
                "rationale": self._rationale,
                "confidence": self._confidence,
            }
        )
        return {"choices": [{"message": {"role": "assistant", "content": content}}]}


@pytest.fixture(autouse=True)
def _reset_module_cache() -> None:
    """Clear the in-process idempotency cache between tests."""
    import importlib

    mod = importlib.import_module("src.modules.comunify.agentic.tools.nurture_via_authority_content")
    mod._NURTURE_CACHE.clear()


def _make_vault_items(
    tenant_id: uuid.UUID,
    *,
    n_case_studies: int = 3,
    n_press: int = 2,
    n_awards: int = 1,
) -> list[_FakeVaultItem]:
    """Build a balanced vault for the given tenant."""
    items: list[_FakeVaultItem] = []
    base_time = datetime.now(timezone.utc) - timedelta(days=30)
    for i in range(n_case_studies):
        items.append(
            _FakeVaultItem(
                item_id=uuid.uuid4(),
                tenant_id=tenant_id,
                kind="case_studies",
                title=f"Case Study {i + 1}: From .K to .K MRR",
                content={
                    "summary": f"Creator scaled cohort pricing from .K to .K in 90 days. {i}",
                    "metric": f"{30 + i}% improvement",
                },
                url=f"https://example.com/case-{i + 1}",
                display_order=i,
                created_at=base_time + timedelta(days=i),
            )
        )
    for i in range(n_press):
        items.append(
            _FakeVaultItem(
                item_id=uuid.uuid4(),
                tenant_id=tenant_id,
                kind="press_mentions",
                title=f"Press: Featured in Industry Mag {i + 1}",
                content={"publisher": f"Mag {i}", "headline": "Industry recognition piece"},
                url=f"https://example.com/press-{i + 1}",
                display_order=i,
                created_at=base_time + timedelta(days=5 + i),
            )
        )
    for i in range(n_awards):
        items.append(
            _FakeVaultItem(
                item_id=uuid.uuid4(),
                tenant_id=tenant_id,
                kind="awards",
                title=f"Award {i + 1}: Industry Top Award",
                content={"awarding_body": "Industry Org", "year": 2025 + i},
                url=f"https://example.com/award-{i + 1}",
                display_order=i,
                created_at=base_time + timedelta(days=15 + i),
            )
        )
    return items


# ═════════════════════════════════════════════════════════════════════════════
# T1 — tenant_id NOT in input schema (security boundary, ctx-injection only)
# ═════════════════════════════════════════════════════════════════════════════


def test_tenant_id_not_in_schema() -> None:
    """tenant_id MUST be injected from ctx, NEVER in client-provided input.

    Per `.claude/rules/tenant-isolation.md` + 03-arch-agentic.md § 4.3.
    """
    from src.modules.comunify.agentic.tools.nurture_via_authority_content import (
        NurtureViaAuthorityContentInputV1,
    )

    fields = NurtureViaAuthorityContentInputV1.model_fields
    assert "tenant_id" not in fields, (
        "tenant_id MUST NOT be in NurtureViaAuthorityContentInputV1 — "
        "security boundary per tenant-isolation.md + 03-arch-agentic.md § 4.3"
    )
    assert "lead_id" in fields
    assert "intent_category" in fields
    assert "preferred_content_type" in fields


# ═════════════════════════════════════════════════════════════════════════════
# T2 — schema_version frozen v1 + Output frozen
# ═════════════════════════════════════════════════════════════════════════════


def test_schema_version_frozen_v1_and_output_immutable() -> None:
    """Pydantic schema cementation: schema_version Literal[1] + frozen models."""
    from src.modules.comunify.agentic.tools.nurture_via_authority_content import (
        NurtureViaAuthorityContentInputV1,
        NurtureViaAuthorityContentOutputV1,
    )

    inp = NurtureViaAuthorityContentInputV1(lead_id=uuid.uuid4(), intent_category="general")
    assert inp.schema_version == 1

    out = NurtureViaAuthorityContentOutputV1(content_url=["https://x.com/a"], next_step="offer_call")
    assert out.schema_version == 1

    # Output is frozen — cannot mutate after construction
    with pytest.raises(Exception):
        out.confidence = 0.9  # type: ignore[misc]


# ═════════════════════════════════════════════════════════════════════════════
# T3 — happy: pricing_guilt → 3 relevant URLs + next_step
# ═════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_happy_pricing_guilt_returns_3_urls_and_next_step() -> None:
    """pricing_guilt → tool returns 1-3 URLs + next_step + confidence > 0."""
    from src.modules.comunify.agentic.tools.nurture_via_authority_content import (
        NurtureViaAuthorityContentInputV1,
        nurture_via_authority_content,
    )

    tenant_id = uuid.uuid4()
    lead_id = uuid.uuid4()
    items = _make_vault_items(tenant_id, n_case_studies=4, n_press=2)
    vault_repo = _FakeVaultRepo(tenant_id, items)

    # LLM picks 3 case studies
    case_study_ids = [str(it.id) for it in items if it.kind == "case_studies"][:3]
    llm = _FakeLLMClient(
        canned_selected_ids=case_study_ids,
        canned_next_step="share_case_study",
        canned_confidence=0.9,
    )

    result = await nurture_via_authority_content(
        NurtureViaAuthorityContentInputV1(lead_id=lead_id, intent_category="pricing_guilt"),
        tenant_id=tenant_id,
        vault_repo=vault_repo,
        llm_client=llm,
    )

    assert result.schema_version == 1
    assert len(result.content_url) == 3
    assert all(url.startswith("https://example.com/case-") for url in result.content_url)
    assert result.next_step == "share_case_study"
    assert result.confidence == 0.9
    assert result.fallback_used is False
    assert result.cache_hit is False
    assert len(result.matched_items) == 3
    assert all(mi.kind == "case_studies" for mi in result.matched_items)

    # Exactly 1 LLM call
    assert len(llm.calls) == 1
    # Vault was queried for case_studies first (intent affinity head)
    assert vault_repo.list_by_kind_calls[0] == "case_studies"


# ═════════════════════════════════════════════════════════════════════════════
# T4 — happy: returns 1-3 (cap respected even when LLM picks more)
# ═════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_max_3_items_cap_respected_even_when_llm_picks_5() -> None:
    """LLM returning 5 IDs → tool caps at 3 (spec § 4.3 1-3 cap)."""
    from src.modules.comunify.agentic.tools.nurture_via_authority_content import (
        NurtureViaAuthorityContentInputV1,
        nurture_via_authority_content,
    )

    tenant_id = uuid.uuid4()
    items = _make_vault_items(tenant_id, n_case_studies=5)
    vault_repo = _FakeVaultRepo(tenant_id, items)
    all_ids = [str(it.id) for it in items]
    llm = _FakeLLMClient(canned_selected_ids=all_ids[:5], canned_confidence=0.8)

    result = await nurture_via_authority_content(
        NurtureViaAuthorityContentInputV1(lead_id=uuid.uuid4(), intent_category="pricing_guilt"),
        tenant_id=tenant_id,
        vault_repo=vault_repo,
        llm_client=llm,
    )

    assert len(result.matched_items) == 3
    assert len(result.content_url) == 3


# ═════════════════════════════════════════════════════════════════════════════
# T5 — empty vault: fallback to general items (terminal: empty result)
# ═════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_empty_vault_returns_fallback_empty_result_no_llm() -> None:
    """Tenant with no vault content → fallback_used=True + empty content_url + no LLM call."""
    from src.modules.comunify.agentic.tools.nurture_via_authority_content import (
        NurtureViaAuthorityContentInputV1,
        nurture_via_authority_content,
    )

    tenant_id = uuid.uuid4()
    vault_repo = _FakeVaultRepo(tenant_id, items=[])  # empty
    llm = _FakeLLMClient(canned_selected_ids=["should-not-be-called"])

    result = await nurture_via_authority_content(
        NurtureViaAuthorityContentInputV1(lead_id=uuid.uuid4(), intent_category="pricing_guilt"),
        tenant_id=tenant_id,
        vault_repo=vault_repo,
        llm_client=llm,
    )

    assert result.content_url == []
    assert result.matched_items == []
    assert result.fallback_used is True
    assert result.confidence == 0.0
    assert result.next_step == "share_case_study"  # default for pricing_guilt
    # NO LLM call (short-circuit before ranking)
    assert llm.calls == []


# ═════════════════════════════════════════════════════════════════════════════
# T6 — cross-tenant: tenant_A items NOT returned for tenant_B query
# ═════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_cross_tenant_isolation_via_repo_construction() -> None:
    """Tenant_B's repo (scoped) returns no items even when tenant_A's vault is populated.

    The repo is tenant-scoped at CONSTRUCTION — the tool never receives tenant_A's
    items because the repo filters them out. We simulate by constructing the repo
    with tenant_B but populating items belonging to tenant_A.
    """
    from src.modules.comunify.agentic.tools.nurture_via_authority_content import (
        NurtureViaAuthorityContentInputV1,
        nurture_via_authority_content,
    )

    tenant_a = uuid.uuid4()
    tenant_b = uuid.uuid4()
    tenant_a_items = _make_vault_items(tenant_a, n_case_studies=3)

    # Repo constructed for tenant_B but seeded with tenant_A's items
    vault_repo_b = _FakeVaultRepo(tenant_b, items=tenant_a_items)
    llm = _FakeLLMClient(canned_selected_ids=[])  # would not match anyway

    result = await nurture_via_authority_content(
        NurtureViaAuthorityContentInputV1(lead_id=uuid.uuid4(), intent_category="pricing_guilt"),
        tenant_id=tenant_b,
        vault_repo=vault_repo_b,
        llm_client=llm,
    )

    # tenant_B sees nothing → empty fallback (NOT tenant_A's items)
    assert result.content_url == []
    assert result.matched_items == []
    assert result.fallback_used is True
    assert llm.calls == []  # no LLM call when vault empty


# ═════════════════════════════════════════════════════════════════════════════
# T7 — cached: same intent within 1h → cached response, NO LLM call
# ═════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_idempotency_replay_within_1h_returns_cached_no_llm_call() -> None:
    """Same (lead_id, intent, preferred_type) within 1h → cached + cache_hit=True + no 2nd LLM call."""
    from src.modules.comunify.agentic.tools.nurture_via_authority_content import (
        NurtureViaAuthorityContentInputV1,
        nurture_via_authority_content,
    )

    tenant_id = uuid.uuid4()
    lead_id = uuid.uuid4()
    items = _make_vault_items(tenant_id, n_case_studies=3)
    vault_repo = _FakeVaultRepo(tenant_id, items)
    case_study_ids = [str(it.id) for it in items if it.kind == "case_studies"][:2]
    llm = _FakeLLMClient(canned_selected_ids=case_study_ids, canned_confidence=0.9)

    now_t0 = datetime(2026, 5, 14, 12, 0, 0, tzinfo=timezone.utc)
    inp = NurtureViaAuthorityContentInputV1(lead_id=lead_id, intent_category="pricing_guilt")

    # 1st call — fresh
    r1 = await nurture_via_authority_content(
        inp,
        tenant_id=tenant_id,
        vault_repo=vault_repo,
        llm_client=llm,
        _now=now_t0,
    )
    assert r1.cache_hit is False
    assert len(llm.calls) == 1
    assert len(r1.content_url) == 2

    # 2nd call — within 1h window → cached, NO new LLM call
    now_t1 = now_t0 + timedelta(minutes=30)
    r2 = await nurture_via_authority_content(
        inp,
        tenant_id=tenant_id,
        vault_repo=vault_repo,
        llm_client=llm,
        _now=now_t1,
    )
    assert r2.cache_hit is True
    assert r2.content_url == r1.content_url
    assert r2.matched_items[0].item_id == r1.matched_items[0].item_id
    assert len(llm.calls) == 1  # no new call


@pytest.mark.asyncio
async def test_idempotency_cache_expires_after_1h() -> None:
    """After 1h, cache entry is dropped → fresh LLM call required."""
    from src.modules.comunify.agentic.tools.nurture_via_authority_content import (
        NurtureViaAuthorityContentInputV1,
        nurture_via_authority_content,
    )

    tenant_id = uuid.uuid4()
    lead_id = uuid.uuid4()
    items = _make_vault_items(tenant_id, n_case_studies=2)
    vault_repo = _FakeVaultRepo(tenant_id, items)
    case_study_ids = [str(it.id) for it in items][:2]
    llm = _FakeLLMClient(canned_selected_ids=case_study_ids, canned_confidence=0.9)

    now_t0 = datetime(2026, 5, 14, 12, 0, 0, tzinfo=timezone.utc)
    inp = NurtureViaAuthorityContentInputV1(lead_id=lead_id, intent_category="general")

    await nurture_via_authority_content(inp, tenant_id=tenant_id, vault_repo=vault_repo, llm_client=llm, _now=now_t0)
    assert len(llm.calls) == 1

    # Outside window (61 min later)
    now_t2 = now_t0 + timedelta(minutes=61)
    r2 = await nurture_via_authority_content(
        inp, tenant_id=tenant_id, vault_repo=vault_repo, llm_client=llm, _now=now_t2
    )
    assert r2.cache_hit is False
    assert len(llm.calls) == 2  # fresh call


@pytest.mark.asyncio
async def test_cache_key_includes_preferred_content_type() -> None:
    """Same lead + intent but different preferred_content_type → distinct cache entries."""
    from src.modules.comunify.agentic.tools.nurture_via_authority_content import (
        NurtureViaAuthorityContentInputV1,
        nurture_via_authority_content,
    )

    tenant_id = uuid.uuid4()
    lead_id = uuid.uuid4()
    items = _make_vault_items(tenant_id, n_case_studies=2, n_press=2)
    vault_repo = _FakeVaultRepo(tenant_id, items)
    case_ids = [str(it.id) for it in items if it.kind == "case_studies"]
    press_ids = [str(it.id) for it in items if it.kind == "press_mentions"]

    llm = _FakeLLMClient(canned_selected_ids=case_ids[:1])
    inp_a = NurtureViaAuthorityContentInputV1(
        lead_id=lead_id, intent_category="general", preferred_content_type="case_study"
    )
    await nurture_via_authority_content(inp_a, tenant_id=tenant_id, vault_repo=vault_repo, llm_client=llm)

    llm._selected_ids = press_ids[:1]
    inp_b = NurtureViaAuthorityContentInputV1(
        lead_id=lead_id, intent_category="general", preferred_content_type="press_mention"
    )
    await nurture_via_authority_content(inp_b, tenant_id=tenant_id, vault_repo=vault_repo, llm_client=llm)

    # 2 distinct LLM calls — caches are separate
    assert len(llm.calls) == 2


# ═════════════════════════════════════════════════════════════════════════════
# T8 — LLM failure → deterministic fallback engaged
# ═════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_llm_exception_engages_deterministic_fallback() -> None:
    """LLM raises → tool falls back to kind-affinity + recency heuristic."""
    from src.modules.comunify.agentic.tools.nurture_via_authority_content import (
        NurtureViaAuthorityContentInputV1,
        nurture_via_authority_content,
    )

    tenant_id = uuid.uuid4()
    items = _make_vault_items(tenant_id, n_case_studies=4, n_press=2)
    vault_repo = _FakeVaultRepo(tenant_id, items)
    llm = _FakeLLMClient(raise_exc=RuntimeError)

    result = await nurture_via_authority_content(
        NurtureViaAuthorityContentInputV1(lead_id=uuid.uuid4(), intent_category="pricing_guilt"),
        tenant_id=tenant_id,
        vault_repo=vault_repo,
        llm_client=llm,
    )

    assert result.fallback_used is True
    assert 0.0 < result.confidence < 0.7  # deterministic ranks are low-confidence
    assert len(result.matched_items) > 0
    # pricing_guilt affinity head = case_studies → fallback should pick case_studies first
    assert result.matched_items[0].kind == "case_studies"
    assert result.next_step == "share_case_study"  # default for pricing_guilt


@pytest.mark.asyncio
async def test_llm_invalid_response_shape_engages_fallback() -> None:
    """LLM returns empty choices → fallback engaged."""
    from src.modules.comunify.agentic.tools.nurture_via_authority_content import (
        NurtureViaAuthorityContentInputV1,
        nurture_via_authority_content,
    )

    tenant_id = uuid.uuid4()
    items = _make_vault_items(tenant_id, n_case_studies=2)
    vault_repo = _FakeVaultRepo(tenant_id, items)
    llm = _FakeLLMClient(invalid_response=True)

    result = await nurture_via_authority_content(
        NurtureViaAuthorityContentInputV1(lead_id=uuid.uuid4(), intent_category="imposter_syndrome"),
        tenant_id=tenant_id,
        vault_repo=vault_repo,
        llm_client=llm,
    )

    assert result.fallback_used is True
    # imposter_syndrome default next_step = share_press
    assert result.next_step == "share_press"


@pytest.mark.asyncio
async def test_llm_invalid_json_content_engages_fallback() -> None:
    """LLM returns non-JSON content → fallback engaged."""
    from src.modules.comunify.agentic.tools.nurture_via_authority_content import (
        NurtureViaAuthorityContentInputV1,
        nurture_via_authority_content,
    )

    tenant_id = uuid.uuid4()
    items = _make_vault_items(tenant_id, n_case_studies=2)
    vault_repo = _FakeVaultRepo(tenant_id, items)
    llm = _FakeLLMClient(invalid_json=True)

    result = await nurture_via_authority_content(
        NurtureViaAuthorityContentInputV1(lead_id=uuid.uuid4(), intent_category="general"),
        tenant_id=tenant_id,
        vault_repo=vault_repo,
        llm_client=llm,
    )

    assert result.fallback_used is True


@pytest.mark.asyncio
async def test_llm_returns_unknown_ids_engages_fallback() -> None:
    """LLM returns selected_ids none of which match catalog → fallback engaged."""
    from src.modules.comunify.agentic.tools.nurture_via_authority_content import (
        NurtureViaAuthorityContentInputV1,
        nurture_via_authority_content,
    )

    tenant_id = uuid.uuid4()
    items = _make_vault_items(tenant_id, n_case_studies=2)
    vault_repo = _FakeVaultRepo(tenant_id, items)
    # LLM returns IDs that don't exist in the catalog (hallucination)
    llm = _FakeLLMClient(canned_selected_ids=[str(uuid.uuid4()), str(uuid.uuid4())])

    result = await nurture_via_authority_content(
        NurtureViaAuthorityContentInputV1(lead_id=uuid.uuid4(), intent_category="pricing_guilt"),
        tenant_id=tenant_id,
        vault_repo=vault_repo,
        llm_client=llm,
    )

    assert result.fallback_used is True


# ═════════════════════════════════════════════════════════════════════════════
# T9 — preferred_content_type filter applied
# ═════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_preferred_content_type_case_study_pins_kind_filter() -> None:
    """preferred_content_type='case_study' → only case_studies kind queried first."""
    from src.modules.comunify.agentic.tools.nurture_via_authority_content import (
        NurtureViaAuthorityContentInputV1,
        nurture_via_authority_content,
    )

    tenant_id = uuid.uuid4()
    items = _make_vault_items(tenant_id, n_case_studies=2, n_press=3, n_awards=1)
    vault_repo = _FakeVaultRepo(tenant_id, items)
    case_ids = [str(it.id) for it in items if it.kind == "case_studies"]
    llm = _FakeLLMClient(canned_selected_ids=case_ids[:2], canned_next_step="share_case_study")

    result = await nurture_via_authority_content(
        NurtureViaAuthorityContentInputV1(
            lead_id=uuid.uuid4(),
            intent_category="general",
            preferred_content_type="case_study",
        ),
        tenant_id=tenant_id,
        vault_repo=vault_repo,
        llm_client=llm,
    )

    # When preferred=case_study, repo is asked for case_studies kind
    assert "case_studies" in vault_repo.list_by_kind_calls
    # press_mentions / awards / credentials should NOT be in the kind queries
    assert "press_mentions" not in vault_repo.list_by_kind_calls
    assert "awards" not in vault_repo.list_by_kind_calls
    # Result kinds are all case_studies
    assert all(mi.kind == "case_studies" for mi in result.matched_items)


# ═════════════════════════════════════════════════════════════════════════════
# T10 — intent → kind affinity heuristic (deterministic path)
# ═════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_imposter_syndrome_intent_prefers_press_mentions_via_deterministic_fallback() -> None:
    """imposter_syndrome affinity head = press_mentions (per heuristic map)."""
    from src.modules.comunify.agentic.tools.nurture_via_authority_content import (
        NurtureViaAuthorityContentInputV1,
        nurture_via_authority_content,
    )

    tenant_id = uuid.uuid4()
    items = _make_vault_items(tenant_id, n_case_studies=2, n_press=2)
    vault_repo = _FakeVaultRepo(tenant_id, items)
    llm = _FakeLLMClient(raise_exc=RuntimeError)  # force deterministic fallback

    result = await nurture_via_authority_content(
        NurtureViaAuthorityContentInputV1(lead_id=uuid.uuid4(), intent_category="imposter_syndrome"),
        tenant_id=tenant_id,
        vault_repo=vault_repo,
        llm_client=llm,
    )

    assert result.fallback_used is True
    # imposter_syndrome head = press_mentions
    assert result.matched_items[0].kind == "press_mentions"
    assert result.next_step == "share_press"


# ═════════════════════════════════════════════════════════════════════════════
# T11 — read-only: NO mutation on any repo
# ═════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_tool_is_read_only_no_save_method_on_vault_repo_called() -> None:
    """Tool MUST NOT mutate vault — `save`/`soft_delete` never called.

    The fake repo intentionally does NOT define `save` so any attempt
    to mutate would AttributeError. This test asserts that's exactly what we want.
    """
    from src.modules.comunify.agentic.tools.nurture_via_authority_content import (
        NurtureViaAuthorityContentInputV1,
        nurture_via_authority_content,
    )

    tenant_id = uuid.uuid4()
    items = _make_vault_items(tenant_id, n_case_studies=2)
    vault_repo = _FakeVaultRepo(tenant_id, items)
    case_ids = [str(it.id) for it in items[:1]]
    llm = _FakeLLMClient(canned_selected_ids=case_ids)

    # Repo has no `save` method — would raise AttributeError if tool tried to mutate
    assert not hasattr(vault_repo, "save")
    assert not hasattr(vault_repo, "soft_delete")

    await nurture_via_authority_content(
        NurtureViaAuthorityContentInputV1(lead_id=uuid.uuid4(), intent_category="pricing_guilt"),
        tenant_id=tenant_id,
        vault_repo=vault_repo,
        llm_client=llm,
    )
    # If we got here, tool did not call any non-existent mutation method.


# ═════════════════════════════════════════════════════════════════════════════
# T12 — PII sanitize in trace_event
# ═════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_pii_sanitize_in_trace_event_payload() -> None:
    """Vault items with PII in content JSONB → PII redacted in trace_event payload.

    The tool's trace event payload should NEVER carry raw email/phone from vault
    item content. Defense-in-depth via `_scrub_pii` BEFORE sanitize_payload.
    """
    from src.modules.comunify.agentic.tools.nurture_via_authority_content import (
        NurtureViaAuthorityContentInputV1,
        nurture_via_authority_content,
    )

    tenant_id = uuid.uuid4()
    item_with_pii = _FakeVaultItem(
        item_id=uuid.uuid4(),
        tenant_id=tenant_id,
        kind="case_studies",
        title="Case Study with embedded email john.smith@example.com",
        content={
            "email": "leak@example.com",  # PII key
            "summary": "Contact me at alice@example.com or +1-555-123-4567",  # inline PII
            "phone": "+44 207 123 4567",
        },
        url="https://example.com/case-pii",
    )
    vault_repo = _FakeVaultRepo(tenant_id, [item_with_pii])
    llm = _FakeLLMClient(canned_selected_ids=[str(item_with_pii.id)], canned_confidence=0.8)
    trace_repo = _CapturingTraceRepo()

    await nurture_via_authority_content(
        NurtureViaAuthorityContentInputV1(lead_id=uuid.uuid4(), intent_category="pricing_guilt"),
        tenant_id=tenant_id,
        vault_repo=vault_repo,
        llm_client=llm,
        trace_event_repo=trace_repo,
        turn_id=uuid.uuid4(),
        span_id=uuid.uuid4(),
    )

    assert len(trace_repo.calls) == 1
    trace_payload = trace_repo.calls[0]["data"]
    payload_str = str(trace_payload)
    # Hard assertions: no raw PII anywhere in the trace payload
    assert "leak@example.com" not in payload_str
    assert "alice@example.com" not in payload_str
    assert "john.smith@example.com" not in payload_str
    assert "555-123-4567" not in payload_str
    assert "+44 207 123 4567" not in payload_str


# ═════════════════════════════════════════════════════════════════════════════
# T13 — Best-effort observability: trace failures don't break turn
# ═════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_trace_event_failure_does_not_break_tool_turn() -> None:
    """trace_event.add() raises → tool still returns successful result."""
    from src.modules.comunify.agentic.tools.nurture_via_authority_content import (
        NurtureViaAuthorityContentInputV1,
        nurture_via_authority_content,
    )

    tenant_id = uuid.uuid4()
    items = _make_vault_items(tenant_id, n_case_studies=2)
    vault_repo = _FakeVaultRepo(tenant_id, items)
    case_ids = [str(it.id) for it in items[:1]]
    llm = _FakeLLMClient(canned_selected_ids=case_ids, canned_confidence=0.7)
    trace_repo = _RaisingTraceRepo()

    # Should NOT raise
    result = await nurture_via_authority_content(
        NurtureViaAuthorityContentInputV1(lead_id=uuid.uuid4(), intent_category="general"),
        tenant_id=tenant_id,
        vault_repo=vault_repo,
        llm_client=llm,
        trace_event_repo=trace_repo,
        turn_id=uuid.uuid4(),
        span_id=uuid.uuid4(),
    )

    assert result.schema_version == 1
    assert len(result.content_url) == 1


# ═════════════════════════════════════════════════════════════════════════════
# T14 — ForbiddenToolContextError is the LIFTED shared class
# ═════════════════════════════════════════════════════════════════════════════


def test_forbidden_tool_context_error_lifted_from_shared_module() -> None:
    """T-tools-3 honours N=3 lift — `ForbiddenToolContextError` imports from `_exceptions`.

    Verifies that the symbol exposed by this tool is the SAME class as the
    one exposed by sibling tools (no third inline definition).
    """
    from src.modules.comunify.agentic.tools._exceptions import (
        ForbiddenToolContextError as CanonicalError,
    )
    from src.modules.comunify.agentic.tools.link_to_community import (
        ForbiddenToolContextError as LinkError,
    )
    from src.modules.comunify.agentic.tools.nurture_via_authority_content import (
        ForbiddenToolContextError as NurtureError,
    )
    from src.modules.comunify.agentic.tools.qualify_for_cohort import (
        ForbiddenToolContextError as QualifyError,
    )

    # All four references point to the SAME class object (identity check)
    assert CanonicalError is LinkError
    assert CanonicalError is NurtureError
    assert CanonicalError is QualifyError


# ═════════════════════════════════════════════════════════════════════════════
# T15 — Trace event emitted with expected event_type + structure
# ═════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_trace_event_emitted_with_expected_event_type() -> None:
    """Verify trace_event payload has the expected event_type + lead_id correlation."""
    from src.modules.comunify.agentic.tools.nurture_via_authority_content import (
        NurtureViaAuthorityContentInputV1,
        nurture_via_authority_content,
    )

    tenant_id = uuid.uuid4()
    lead_id = uuid.uuid4()
    turn_id = uuid.uuid4()
    span_id = uuid.uuid4()
    items = _make_vault_items(tenant_id, n_case_studies=2)
    vault_repo = _FakeVaultRepo(tenant_id, items)
    case_ids = [str(it.id) for it in items[:1]]
    llm = _FakeLLMClient(canned_selected_ids=case_ids, canned_confidence=0.8)
    trace_repo = _CapturingTraceRepo()

    await nurture_via_authority_content(
        NurtureViaAuthorityContentInputV1(lead_id=lead_id, intent_category="pricing_guilt"),
        tenant_id=tenant_id,
        vault_repo=vault_repo,
        llm_client=llm,
        trace_event_repo=trace_repo,
        turn_id=turn_id,
        span_id=span_id,
    )

    assert len(trace_repo.calls) == 1
    call = trace_repo.calls[0]
    assert call["event_type"] == "tool.nurture_via_authority_content"
    assert call["name"] == "nurture_via_authority_content"
    assert call["status"] == "ok"
    assert call["tenant_id"] == tenant_id
    assert call["turn_id"] == turn_id
    assert call["span_id"] == span_id
    assert call["duration_ms"] is not None
    assert call["data"]["lead_id"] == str(lead_id)
    assert call["data"]["intent_category"] == "pricing_guilt"
    assert call["data"]["fallback_used"] is False


# ═════════════════════════════════════════════════════════════════════════════
# T16 — Forbidden context guard exposed (currently no-op, but symmetry)
# ═════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_no_forbidden_contexts_currently_defined_for_this_tool() -> None:
    """nurture_via_authority_content has NO forbidden contexts per spec § 4.5.

    Calling with any context label should succeed. The guard is exposed for
    future-proofing (one-line frozenset update when a context needs forbidding).
    """
    from src.modules.comunify.agentic.tools.nurture_via_authority_content import (
        _FORBIDDEN_CONTEXTS,
        NurtureViaAuthorityContentInputV1,
        nurture_via_authority_content,
    )

    assert _FORBIDDEN_CONTEXTS == frozenset()

    tenant_id = uuid.uuid4()
    items = _make_vault_items(tenant_id, n_case_studies=1)
    vault_repo = _FakeVaultRepo(tenant_id, items)
    llm = _FakeLLMClient(canned_selected_ids=[str(items[0].id)])

    # Any context succeeds (even an exotic one)
    result = await nurture_via_authority_content(
        NurtureViaAuthorityContentInputV1(lead_id=uuid.uuid4(), intent_category="pricing_guilt"),
        tenant_id=tenant_id,
        vault_repo=vault_repo,
        llm_client=llm,
        context="exotic_unknown_context",
    )
    assert result.schema_version == 1


# ═════════════════════════════════════════════════════════════════════════════
# T17 — Cache prefix safety: system message has no PII / tenant_id / timestamps
# ═════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_llm_system_message_is_cache_friendly_invariant() -> None:
    """System message is invariant across tenants/turns — cache prefix safe.

    Per sales-agent-brand-voice.md slot architecture: system slot is the cache
    prefix candidate. It MUST NOT contain tenant_id, timestamps, or random IDs.
    """
    from src.modules.comunify.agentic.tools.nurture_via_authority_content import (
        NurtureViaAuthorityContentInputV1,
        nurture_via_authority_content,
    )

    tenant_a = uuid.uuid4()
    tenant_b = uuid.uuid4()
    items_a = _make_vault_items(tenant_a, n_case_studies=1)
    items_b = _make_vault_items(tenant_b, n_case_studies=1)

    llm = _FakeLLMClient(canned_selected_ids=[str(items_a[0].id)])
    await nurture_via_authority_content(
        NurtureViaAuthorityContentInputV1(lead_id=uuid.uuid4(), intent_category="pricing_guilt"),
        tenant_id=tenant_a,
        vault_repo=_FakeVaultRepo(tenant_a, items_a),
        llm_client=llm,
    )

    llm._selected_ids = [str(items_b[0].id)]
    await nurture_via_authority_content(
        NurtureViaAuthorityContentInputV1(lead_id=uuid.uuid4(), intent_category="pricing_guilt"),
        tenant_id=tenant_b,
        vault_repo=_FakeVaultRepo(tenant_b, items_b),
        llm_client=llm,
    )

    # Both calls have identical system prompt (cache prefix invariant)
    assert llm.calls[0]["messages"][0]["content"] == llm.calls[1]["messages"][0]["content"]
    sys_msg = llm.calls[0]["messages"][0]["content"]
    assert str(tenant_a) not in sys_msg
    assert str(tenant_b) not in sys_msg
    # No timestamps in the system message
    assert "2026" not in sys_msg


# ═════════════════════════════════════════════════════════════════════════════
# T18 — Items without URL still surface as matched_items (talking points)
# ═════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_items_without_url_surface_as_matched_items_but_not_in_content_url() -> None:
    """Vault items without URL → kept in matched_items, excluded from content_url."""
    from src.modules.comunify.agentic.tools.nurture_via_authority_content import (
        NurtureViaAuthorityContentInputV1,
        nurture_via_authority_content,
    )

    tenant_id = uuid.uuid4()
    item_with_url = _FakeVaultItem(
        item_id=uuid.uuid4(),
        tenant_id=tenant_id,
        kind="case_studies",
        title="With URL",
        url="https://example.com/with-url",
    )
    item_no_url = _FakeVaultItem(
        item_id=uuid.uuid4(),
        tenant_id=tenant_id,
        kind="case_studies",
        title="Without URL — talking point only",
        url=None,
    )
    vault_repo = _FakeVaultRepo(tenant_id, [item_with_url, item_no_url])
    llm = _FakeLLMClient(canned_selected_ids=[str(item_with_url.id), str(item_no_url.id)])

    result = await nurture_via_authority_content(
        NurtureViaAuthorityContentInputV1(lead_id=uuid.uuid4(), intent_category="pricing_guilt"),
        tenant_id=tenant_id,
        vault_repo=vault_repo,
        llm_client=llm,
    )

    # 2 matched, 1 URL surfaced
    assert len(result.matched_items) == 2
    assert len(result.content_url) == 1
    assert result.content_url[0] == "https://example.com/with-url"
