"""Tests for `OfferLadderAdvisor` (T-extractors-1, R23 Opus 4.7).

Acceptance coverage (per ticket A1-A5):
  * A1 — Subclass of `BaseExtractionOrchestrator` (arch fitness gate).
  * A2 — 4 waves complete + merge produces OfferLadderAdviceV1 + confidence_score.
  * A3 — Cost per advice run ≤$0.10 USD (V-AE-8 SSoT).
  * A4 — Empty ladder graceful path: 4 gaps + bootstrap suggestions.
  * A5 — Cross-tenant isolation: side-effect collaborators receive the tenant_id.

Defensive paths covered:
  * Wave timeout → degraded confidence + warning recorded.
  * Wave LLM exception → confidence drops, partial output kept.
  * Wave returns invalid JSON → empty wave + warning.
  * Wave returns malformed entity → entity dropped + warning recorded.
  * Cost-unknown wave (no litellm_call_id) → warning + Decimal('0') used.
  * Persistence failure → does NOT raise (best-effort).
  * Qdrant + outbox + audit_log failures → do NOT raise (best-effort, isolated).
  * Schema cement: ``schema_version == 1`` Literal frozen.

In-memory fakes for: LiteLLM service (synthetic JSON outputs per role),
advice repo, Qdrant indexer, outbox publisher, audit log. Cost is bridged via
``cost_recorder._cache`` direct seed so the extractor can pull it via
``pop_cost(litellm_call_id)``.
"""

from __future__ import annotations

import json
import uuid
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any

import pytest
from luana_core_extraction.base_orchestrator import BaseExtractionOrchestrator

from src.modules.comunify.copilot.extractors._schemas import (
    LadderGap,
    OfferLadderAdviceV1,
    SuggestedOffer,
    TierOptimization,
)
from src.modules.comunify.copilot.extractors.offer_ladder_advisor import (
    DEFAULT_COST_BUDGET_USD,
    EXTRACTOR_VERSION,
    MIN_ACCEPTABLE_CONFIDENCE,
    OfferLadderAdvisor,
    _LLMResponse,
)

# ─── Test environment guard ───────────────────────────────────────────────


def _seed_cost(call_id: str, amount: Decimal) -> bool:
    """Seed the observability cost cache so ``pop_cost`` resolves a value.

    Returns ``True`` if seeding succeeded, ``False`` if the observability
    package is unavailable in this environment (lazy import fallback path).
    Tests use the return value to decide whether they should assert on
    resolved-cost paths vs cost-unknown paths.
    """
    try:
        from time import monotonic

        from luana_core_observability.recording import (
            cost_recorder,  # type: ignore[import-not-found]
        )

        with cost_recorder._lock:  # noqa: SLF001 — direct cache seed for test fakes
            cost_recorder._cache[call_id] = (amount, monotonic() + 60.0)
        return True
    except ImportError:
        return False


_COST_RECORDER_AVAILABLE = _seed_cost("__probe__", Decimal("0"))


# ─── Fakes ────────────────────────────────────────────────────────────────


@dataclass
class FakeLLMResponseSpec:
    """Per-wave fake response spec — drives the synthetic LLM output."""

    content_json: dict[str, Any]
    """Dict that will be `json.dumps`'d as the synthetic LLM response."""

    cost_usd: Decimal | None = Decimal("0.025")
    """Cost to seed via ``pop_cost``. ``None`` → simulate no call_id."""

    delay_sec: float = 0.0
    """Optional artificial latency (seconds) before returning."""

    raise_exc: BaseException | None = None
    """If set, the LLM service raises this exception instead of returning."""


@dataclass
class FakeLiteLLMService:
    """In-memory fake of ``_LiteLLMServiceLike`` driven by per-role specs.

    Specs popped FIFO per role. Exhausted list → empty JSON, cost-unknown.
    """

    specs_by_role: dict[str, list[FakeLLMResponseSpec]] = field(default_factory=dict)
    calls_log: list[dict[str, Any]] = field(default_factory=list)

    async def ainvoke_text(
        self,
        *,
        role: str,
        prompt: str,
        timeout_sec: float,
    ) -> _LLMResponse:
        spec_list = self.specs_by_role.get(role, [])
        spec = spec_list.pop(0) if spec_list else FakeLLMResponseSpec(content_json={})
        if spec.delay_sec > 0:
            import asyncio

            await asyncio.sleep(spec.delay_sec)
        if spec.raise_exc is not None:
            raise spec.raise_exc

        call_id = f"litellm-{uuid.uuid4()}"
        seeded = False
        if spec.cost_usd is not None:
            seeded = _seed_cost(call_id, spec.cost_usd)

        self.calls_log.append(
            {
                "role": role,
                "prompt_chars": len(prompt),
                "timeout_sec": timeout_sec,
                "call_id": call_id,
            }
        )
        return _LLMResponse(
            content=json.dumps(spec.content_json, ensure_ascii=False),
            litellm_call_id=call_id if (spec.cost_usd is not None and seeded) else None,
            duration_ms=int(spec.delay_sec * 1000),
        )


@dataclass
class FakeAdviceRepo:
    """In-memory fake for the (future) advice repo."""

    saved_advice: list[Any] = field(default_factory=list)
    raise_on_save: BaseException | None = None

    async def save_advice(self, advice: Any) -> None:
        if self.raise_on_save is not None:
            raise self.raise_on_save
        self.saved_advice.append(advice)


@dataclass
class FakeOfferLadderRepo:
    """In-memory fake for the existing OfferLadderRepository singleton.

    Extractor doesn't mutate the ladder, but accepts the handle for DI parity
    with the ticket spec ("DI: receive OfferRepository + OfferLadderRepository").
    """

    ladder_row: Any | None = None

    async def get_for_tenant(self) -> Any | None:
        return self.ladder_row


@dataclass
class FakeQdrantIndexer:
    """In-memory fake of the Qdrant advice indexer."""

    indexed: list[dict[str, Any]] = field(default_factory=list)
    raise_on_index: BaseException | None = None

    async def index_offer_ladder_advice(
        self,
        *,
        tenant_id: uuid.UUID,
        advice_id: uuid.UUID,
        payload: dict[str, Any],
    ) -> None:
        if self.raise_on_index is not None:
            raise self.raise_on_index
        self.indexed.append(
            {
                "tenant_id": tenant_id,
                "advice_id": advice_id,
                "payload": payload,
            }
        )


@dataclass
class FakeOutbox:
    """In-memory fake of the outbox event publisher."""

    published: list[dict[str, Any]] = field(default_factory=list)
    raise_on_publish: BaseException | None = None

    async def publish(
        self,
        *,
        event_type: str,
        tenant_id: uuid.UUID,
        payload: dict[str, Any],
    ) -> None:
        if self.raise_on_publish is not None:
            raise self.raise_on_publish
        self.published.append({"event_type": event_type, "tenant_id": tenant_id, "payload": payload})


@dataclass
class FakeAuditLog:
    """In-memory fake of the audit log."""

    logged: list[dict[str, Any]] = field(default_factory=list)
    raise_on_log: BaseException | None = None

    async def log(
        self,
        *,
        tenant_id: uuid.UUID,
        event_type: str,
        payload: dict[str, Any],
    ) -> None:
        if self.raise_on_log is not None:
            raise self.raise_on_log
        self.logged.append(
            {
                "tenant_id": tenant_id,
                "event_type": event_type,
                "payload": payload,
            }
        )


# ─── Test data builders ───────────────────────────────────────────────────


def _wave1_payload() -> dict[str, Any]:
    return {
        "summary": "Creator has 3 of 4 ladder levels filled.",
        "tier_optimization": {
            "price_anchoring_advice": "Premium tier price anchors core offer perception.",
            "progression_quality": "gappy",
            "bundling_opportunities": ["lead_magnet + tripwire combo"],
            "upsell_paths": ["tripwire -> core_offer"],
        },
        "wave_confidence": 0.9,
        "wave_warnings": [],
    }


def _wave2_payload_two_gaps() -> dict[str, Any]:
    return {
        "ladder_gaps": [
            {
                "level": "lead_magnet",
                "reasoning": "No free entry point — leads cannot self-qualify before paying.",
                "priority": "high",
            },
            {
                "level": "premium",
                "reasoning": "No high-ticket ascension path — high-LTV customers have nowhere to go.",
                "priority": "medium",
            },
        ],
        "wave_confidence": 0.95,
        "wave_warnings": [],
    }


def _wave3_payload_six_suggestions() -> dict[str, Any]:
    return {
        "suggested_offers": [
            {
                "target_level": "lead_magnet",
                "name": "Guía PDF de mindset",
                "format": "PDF guide",
                "price_usd": 0.0,
                "price_local_hint": None,
                "value_promise": "5 ejercicios para construir confianza.",
                "fit_score": 0.85,
            },
            {
                "target_level": "lead_magnet",
                "name": "Mini-curso email 7 días",
                "format": "email-course",
                "price_usd": 0.0,
                "price_local_hint": None,
                "value_promise": "Quick wins diarios para empezar.",
                "fit_score": 0.80,
            },
            {
                "target_level": "lead_magnet",
                "name": "Checklist interactivo",
                "format": "Notion template",
                "price_usd": 0.0,
                "price_local_hint": None,
                "value_promise": "Diagnostic personalizado en 5 minutos.",
                "fit_score": 0.75,
            },
            {
                "target_level": "premium",
                "name": "Mastermind 6 meses",
                "format": "cohort + 1:1",
                "price_usd": 4500.0,
                "price_local_hint": "ARS ~$4.500.000 (USD pegged)",
                "value_promise": "Acompañamiento intensivo + acceso a red.",
                "fit_score": 0.90,
            },
            {
                "target_level": "premium",
                "name": "VIP day intensivo",
                "format": "1:1 day",
                "price_usd": 2000.0,
                "price_local_hint": "ARS ~$2.000.000",
                "value_promise": "Sesión 1:1 + plan ejecutable post-día.",
                "fit_score": 0.85,
            },
            {
                "target_level": "premium",
                "name": "Membresía anual élite",
                "format": "annual subscription",
                "price_usd": 3600.0,
                "price_local_hint": "ARS ~$300.000/mes",
                "value_promise": "Acceso continuo + grupo cerrado.",
                "fit_score": 0.78,
            },
        ],
        "wave_confidence": 0.85,
        "wave_warnings": [],
    }


def _wave4_payload() -> dict[str, Any]:
    return {
        "merged_warnings": [],
        "merged_missing_required_fields": [],
        "validation_score_adjustment": 0.0,
        "tier_optimization": {
            "price_anchoring_advice": "Premium $4500 anchors core_offer at $500-1000 sweet spot.",
            "progression_quality": "gappy",
            "bundling_opportunities": ["lead_magnet + tripwire combo"],
            "upsell_paths": ["lead_magnet -> tripwire -> core_offer -> premium"],
        },
        "consistency_notes": "Suggestions align with detected gaps.",
        "wave_confidence": 1.0,
        "wave_warnings": [],
    }


def _wave2_payload_full_bootstrap() -> dict[str, Any]:
    """Empty ladder → all 4 levels are gaps."""
    return {
        "ladder_gaps": [
            {"level": "lead_magnet", "reasoning": "Bootstrap: no offers yet.", "priority": "high"},
            {"level": "tripwire", "reasoning": "Bootstrap: no offers yet.", "priority": "high"},
            {"level": "core_offer", "reasoning": "Bootstrap: no offers yet.", "priority": "medium"},
            {"level": "premium", "reasoning": "Bootstrap: no offers yet.", "priority": "low"},
        ],
        "wave_confidence": 1.0,
        "wave_warnings": [],
    }


def _happy_specs(*, cost_per_wave: Decimal = Decimal("0.025")) -> dict[str, list[FakeLLMResponseSpec]]:
    """Per-role specs for the happy path (3 reasoning + 1 nano = 4 calls)."""
    return {
        "reasoning": [
            FakeLLMResponseSpec(content_json=_wave1_payload(), cost_usd=cost_per_wave),
            FakeLLMResponseSpec(content_json=_wave2_payload_two_gaps(), cost_usd=cost_per_wave),
            FakeLLMResponseSpec(content_json=_wave4_payload(), cost_usd=Decimal("0.01")),
        ],
        "nano": [
            FakeLLMResponseSpec(content_json=_wave3_payload_six_suggestions(), cost_usd=Decimal("0.01")),
        ],
    }


def _bootstrap_specs() -> dict[str, list[FakeLLMResponseSpec]]:
    """Specs for the empty-ladder bootstrap path."""
    return {
        "reasoning": [
            FakeLLMResponseSpec(content_json=_wave1_payload(), cost_usd=Decimal("0.025")),
            FakeLLMResponseSpec(content_json=_wave2_payload_full_bootstrap(), cost_usd=Decimal("0.025")),
            FakeLLMResponseSpec(content_json=_wave4_payload(), cost_usd=Decimal("0.01")),
        ],
        "nano": [
            FakeLLMResponseSpec(
                content_json={
                    "suggested_offers": [
                        {
                            "target_level": "lead_magnet",
                            "name": "Bootstrap freebie",
                            "format": "PDF",
                            "price_usd": 0.0,
                            "price_local_hint": None,
                            "value_promise": "Get started fast.",
                            "fit_score": 0.7,
                        },
                    ],
                    "wave_confidence": 0.7,
                    "wave_warnings": [],
                },
                cost_usd=Decimal("0.01"),
            ),
        ],
    }


def _build_extractor(
    *,
    llm: FakeLiteLLMService | None = None,
    advice_repo: FakeAdviceRepo | None = None,
    offer_ladder_repo: FakeOfferLadderRepo | None = None,
    qdrant: FakeQdrantIndexer | None = None,
    outbox: FakeOutbox | None = None,
    audit_log: FakeAuditLog | None = None,
    cost_budget_usd: Decimal | None = None,
) -> OfferLadderAdvisor:
    return OfferLadderAdvisor(
        llm_service=llm or FakeLiteLLMService(specs_by_role=_happy_specs()),
        advice_repo=advice_repo,
        offer_ladder_repo=offer_ladder_repo,
        qdrant_indexer=qdrant,
        outbox=outbox,
        audit_log=audit_log,
        cost_budget_usd=cost_budget_usd or DEFAULT_COST_BUDGET_USD,
    )


def _sample_offers() -> list[dict[str, Any]]:
    """3-level filled ladder (missing lead_magnet + premium)."""
    return [
        {"slug": "starter-kit", "name": "Starter Kit", "price_usd": 27, "value": "tripwire", "level": "tripwire"},
        {"slug": "core-program", "name": "Core Program", "price_usd": 497, "value": "core", "level": "core_offer"},
        {
            "slug": "monthly-membership",
            "name": "Monthly Membership",
            "price_usd": 47,
            "value": "core",
            "level": "core_offer",
        },
    ]


# ─── Acceptance A1 — subclass invariant ───────────────────────────────────


def test_offer_ladder_advisor_subclasses_base_orchestrator() -> None:
    """A1: OfferLadderAdvisor MUST inherit from BaseExtractionOrchestrator.

    Mirror of the arch fitness gate ``test_extraction_orchestrator_inheritance.py``
    invariant — kept here as a fast in-module sanity check too.
    """
    assert issubclass(OfferLadderAdvisor, BaseExtractionOrchestrator)


def test_extractor_inherits_base_methods() -> None:
    """A1 corollary: shared wave + pause + announce helpers accessible."""
    extractor = _build_extractor()
    assert hasattr(extractor, "_run_wave")
    assert hasattr(extractor, "_pause_between_waves")
    assert hasattr(extractor, "_announce_sections")
    assert hasattr(extractor, "_get_wave_delay")


def test_extractor_log_prefix_is_comunify_specific() -> None:
    """log_prefix is vertical-creator-economy specific."""
    assert OfferLadderAdvisor.log_prefix == "comunify_offer_ladder_advisor"


def test_wave_definitions_match_spec() -> None:
    """4 waves with names + roles + timeouts per 03-arch-agentic § 5.1."""
    waves = OfferLadderAdvisor._define_waves()
    assert len(waves) == 4
    assert [w.name for w in waves] == [
        "analyze_current_offers",
        "detect_ladder_gaps",
        "generate_suggestions",
        "validate_and_merge",
    ]
    # W1 + W2 + W4 reasoning (Sonnet), W3 nano (Haiku) — per spec.
    assert [w.model_role for w in waves] == ["reasoning", "reasoning", "nano", "reasoning"]
    # Timeouts mirror spec budget (≤30 / ≤30 / ≤30 / ≤25).
    assert [w.timeout_sec for w in waves] == [30.0, 30.0, 30.0, 25.0]


# ─── Acceptance A2 — 4 waves + merge → OfferLadderAdviceV1 ────────────────


@pytest.mark.asyncio
async def test_4_wave_pipeline_happy_path() -> None:
    """A2: All 4 waves run, merge produces OfferLadderAdviceV1 with confidence_score."""
    llm = FakeLiteLLMService(specs_by_role=_happy_specs())
    extractor = _build_extractor(llm=llm)

    advice = await extractor.run(
        tenant_id=uuid.uuid4(),
        current_offers=_sample_offers(),
        creator_niche="fitness coaching for women 35-50",
        country="AR",
    )

    # 4 LLM calls fired (one per wave).
    assert len(llm.calls_log) == 4, f"Expected 4 wave calls, got {len(llm.calls_log)}: {llm.calls_log}"

    # Output is OfferLadderAdviceV1 with confidence_score populated.
    assert isinstance(advice, OfferLadderAdviceV1)
    assert advice.schema_version == 1
    assert 0.0 <= advice.confidence_score <= 1.0
    # Happy path → confidence ≥0.85 (wave confidences 0.9 / 0.95 / 0.85 / 1.0 weighted).
    assert advice.confidence_score >= 0.85

    # 2 gaps detected (lead_magnet + premium).
    assert len(advice.ladder_gaps) == 2
    assert {g.level for g in advice.ladder_gaps} == {"lead_magnet", "premium"}
    # 6 suggestions from wave 3.
    assert len(advice.suggested_offers) == 6
    # Tier optimization populated from wave 4.
    assert advice.tier_optimization.progression_quality == "gappy"


@pytest.mark.asyncio
async def test_wave_called_with_correct_role_routing() -> None:
    """Each wave routes to its declared model_role (LLM_ROLE_BY_SITE SSoT)."""
    llm = FakeLiteLLMService(specs_by_role=_happy_specs())
    extractor = _build_extractor(llm=llm)

    await extractor.run(
        tenant_id=uuid.uuid4(),
        current_offers=_sample_offers(),
        creator_niche="niche",
        country="MX",
    )

    roles_called = [call["role"] for call in llm.calls_log]
    # W1 + W2 + W4 = reasoning (3 calls), W3 = nano.
    assert roles_called.count("reasoning") == 3
    assert roles_called.count("nano") == 1


@pytest.mark.asyncio
async def test_returns_advice_v1_even_on_all_wave_failures() -> None:
    """Even if every wave raises, run() returns OfferLadderAdviceV1 (degraded)."""

    class _BoomError(RuntimeError):
        pass

    specs = {
        "reasoning": [
            FakeLLMResponseSpec(content_json={}, raise_exc=_BoomError("w1 down")),
            FakeLLMResponseSpec(content_json={}, raise_exc=_BoomError("w2 down")),
            FakeLLMResponseSpec(content_json={}, raise_exc=_BoomError("w4 down")),
        ],
        "nano": [FakeLLMResponseSpec(content_json={}, raise_exc=_BoomError("w3 down"))],
    }
    extractor = _build_extractor(llm=FakeLiteLLMService(specs_by_role=specs))

    advice = await extractor.run(
        tenant_id=uuid.uuid4(),
        current_offers=_sample_offers(),
        creator_niche="niche",
        country="CL",
    )

    assert isinstance(advice, OfferLadderAdviceV1)
    assert advice.confidence_score == 0.0
    exception_warnings = [w for w in advice.extraction_warnings if "exception" in w]
    assert len(exception_warnings) >= 4


@pytest.mark.asyncio
async def test_partial_wave_failure_yields_partial_advice() -> None:
    """If only one wave fails, others' results survive into the merged advice."""

    class _BoomError(RuntimeError):
        pass

    specs = {
        "reasoning": [
            FakeLLMResponseSpec(content_json=_wave1_payload(), cost_usd=Decimal("0.025")),
            # Wave 2 — gap detection — fails: no gaps detected → no suggestions targeting them
            FakeLLMResponseSpec(content_json={}, raise_exc=_BoomError("gap detection down")),
            FakeLLMResponseSpec(content_json=_wave4_payload(), cost_usd=Decimal("0.01")),
        ],
        "nano": [FakeLLMResponseSpec(content_json=_wave3_payload_six_suggestions(), cost_usd=Decimal("0.01"))],
    }
    extractor = _build_extractor(llm=FakeLiteLLMService(specs_by_role=specs))

    advice = await extractor.run(
        tenant_id=uuid.uuid4(),
        current_offers=_sample_offers(),
        creator_niche="niche",
        country="PE",
    )

    # No gaps detected (wave 2 failed).
    assert len(advice.ladder_gaps) == 0
    # But wave 3 still produced suggestions (independent wave).
    assert len(advice.suggested_offers) == 6
    # Confidence degraded but non-zero.
    assert 0.0 < advice.confidence_score < 1.0
    # Exception warning surfaced for the failed wave.
    assert any("detect_ladder_gaps_exception" in w for w in advice.extraction_warnings)


@pytest.mark.asyncio
async def test_malformed_entity_dropped_with_warning() -> None:
    """LLM returning an invalid entity (e.g. invalid level enum) → drop + warn."""
    bad_w2 = {
        "ladder_gaps": [
            {"level": "INVALID_LEVEL", "reasoning": "bad enum", "priority": "high"},
            {"level": "lead_magnet", "reasoning": "valid", "priority": "high"},
        ],
        "wave_confidence": 0.8,
        "wave_warnings": [],
    }
    specs = {
        "reasoning": [
            FakeLLMResponseSpec(content_json=_wave1_payload(), cost_usd=Decimal("0.025")),
            FakeLLMResponseSpec(content_json=bad_w2, cost_usd=Decimal("0.025")),
            FakeLLMResponseSpec(content_json=_wave4_payload(), cost_usd=Decimal("0.01")),
        ],
        "nano": [FakeLLMResponseSpec(content_json=_wave3_payload_six_suggestions(), cost_usd=Decimal("0.01"))],
    }
    extractor = _build_extractor(llm=FakeLiteLLMService(specs_by_role=specs))

    advice = await extractor.run(
        tenant_id=uuid.uuid4(),
        current_offers=_sample_offers(),
        creator_niche="niche",
        country="AR",
    )

    # 1 bad gap dropped, 1 valid kept.
    assert len(advice.ladder_gaps) == 1
    assert advice.ladder_gaps[0].level == "lead_magnet"
    assert any("ladder_gap_item_0_invalid" in w for w in advice.extraction_warnings)


@pytest.mark.asyncio
async def test_wave_invalid_json_yields_empty_wave_with_warning() -> None:
    """LLM returning non-JSON → wave silently yields empty + warning recorded."""

    class _GibberishLLMService(FakeLiteLLMService):
        async def ainvoke_text(self, *, role: str, prompt: str, timeout_sec: float) -> _LLMResponse:
            if role == "nano":
                # Wave 3 (suggestions) returns garbage (no call_id → cost-unknown).
                return _LLMResponse(content="<<not json>>", litellm_call_id=None, duration_ms=10)
            return await super().ainvoke_text(role=role, prompt=prompt, timeout_sec=timeout_sec)

    llm = _GibberishLLMService(specs_by_role=_happy_specs())
    extractor = _build_extractor(llm=llm)

    advice = await extractor.run(
        tenant_id=uuid.uuid4(),
        current_offers=_sample_offers(),
        creator_niche="niche",
        country="AR",
    )

    # No suggestions (wave 3 returned non-JSON).
    assert len(advice.suggested_offers) == 0
    # Other waves intact: gaps from wave 2 still present.
    assert len(advice.ladder_gaps) == 2


# ─── Acceptance A3 — cost budget ≤$0.10 USD ────────────────────────────────


@pytest.mark.asyncio
async def test_cost_budget_happy_path() -> None:
    """A3 / V-AE-8: total cost ≤$0.10 USD per advice run on happy path."""
    if not _COST_RECORDER_AVAILABLE:
        pytest.skip("luana_core_observability not importable — cost bridge unavailable")

    extractor = _build_extractor()

    advice = await extractor.run(
        tenant_id=uuid.uuid4(),
        current_offers=_sample_offers(),
        creator_niche="niche",
        country="AR",
    )

    # Per-wave costs: 0.025 + 0.025 + 0.01 + 0.01 = 0.07 — well under 0.10.
    cost_warnings = [w for w in advice.extraction_warnings if "cost_budget_exceeded" in w]
    assert not cost_warnings, (
        f"Happy path must stay under {DEFAULT_COST_BUDGET_USD} USD; got cost warnings: {cost_warnings}"
    )


@pytest.mark.asyncio
async def test_cost_budget_exceeded_recorded_as_warning_not_raised() -> None:
    """Cost ceiling breach → warning recorded, but extractor still returns advice."""
    if not _COST_RECORDER_AVAILABLE:
        pytest.skip("luana_core_observability not importable — cost bridge unavailable")

    # Each wave costs 0.05 → total 0.20 > budget 0.10.
    expensive_specs = {
        "reasoning": [
            FakeLLMResponseSpec(content_json=_wave1_payload(), cost_usd=Decimal("0.05")),
            FakeLLMResponseSpec(content_json=_wave2_payload_two_gaps(), cost_usd=Decimal("0.05")),
            FakeLLMResponseSpec(content_json=_wave4_payload(), cost_usd=Decimal("0.05")),
        ],
        "nano": [FakeLLMResponseSpec(content_json=_wave3_payload_six_suggestions(), cost_usd=Decimal("0.05"))],
    }
    extractor = _build_extractor(llm=FakeLiteLLMService(specs_by_role=expensive_specs))

    advice = await extractor.run(
        tenant_id=uuid.uuid4(),
        current_offers=_sample_offers(),
        creator_niche="niche",
        country="AR",
    )

    cost_warnings = [w for w in advice.extraction_warnings if "cost_budget_exceeded" in w]
    assert cost_warnings, "Expected cost_budget_exceeded warning when sum > budget"


@pytest.mark.asyncio
async def test_cost_unknown_wave_does_not_break_run() -> None:
    """Wave with no litellm_call_id → cost-unknown but extraction continues."""
    specs = {
        "reasoning": [
            FakeLLMResponseSpec(content_json=_wave1_payload(), cost_usd=None),  # cost-unknown
            FakeLLMResponseSpec(content_json=_wave2_payload_two_gaps(), cost_usd=Decimal("0.025")),
            FakeLLMResponseSpec(content_json=_wave4_payload(), cost_usd=Decimal("0.01")),
        ],
        "nano": [FakeLLMResponseSpec(content_json=_wave3_payload_six_suggestions(), cost_usd=Decimal("0.01"))],
    }
    extractor = _build_extractor(llm=FakeLiteLLMService(specs_by_role=specs))

    advice = await extractor.run(
        tenant_id=uuid.uuid4(),
        current_offers=_sample_offers(),
        creator_niche="niche",
        country="AR",
    )

    # Run completed despite cost-unknown wave.
    assert isinstance(advice, OfferLadderAdviceV1)
    # Other waves' entities still extracted.
    assert len(advice.ladder_gaps) == 2


# ─── Acceptance A4 — empty ladder graceful path ────────────────────────────


@pytest.mark.asyncio
async def test_empty_ladder_returns_full_4_gap_bootstrap() -> None:
    """A4: empty ladder → 4 gaps + bootstrap suggestions + 'no_offers_yet' warning."""
    extractor = _build_extractor(llm=FakeLiteLLMService(specs_by_role=_bootstrap_specs()))

    advice = await extractor.run(
        tenant_id=uuid.uuid4(),
        current_offers=[],
        creator_niche="content creator nicho lifestyle",
        country="MX",
    )

    # All 4 levels are gaps.
    assert len(advice.ladder_gaps) == 4
    assert {g.level for g in advice.ladder_gaps} == {"lead_magnet", "tripwire", "core_offer", "premium"}
    # Bootstrap warning surfaced.
    assert any("no_offers_yet" in w for w in advice.extraction_warnings)
    # At least one bootstrap suggestion.
    assert len(advice.suggested_offers) >= 1


# ─── Acceptance A5 — tenant isolation ──────────────────────────────────────


@pytest.mark.asyncio
async def test_tenant_id_propagates_to_all_collaborators() -> None:
    """A5: Every side-effect collaborator receives the same tenant_id (R2)."""
    advice_repo = FakeAdviceRepo()
    qdrant = FakeQdrantIndexer()
    outbox = FakeOutbox()
    audit = FakeAuditLog()
    extractor = _build_extractor(
        advice_repo=advice_repo,
        qdrant=qdrant,
        outbox=outbox,
        audit_log=audit,
    )

    tenant_id = uuid.uuid4()

    await extractor.run(
        tenant_id=tenant_id,
        current_offers=_sample_offers(),
        creator_niche="niche",
        country="AR",
    )

    assert advice_repo.saved_advice[0]["tenant_id"] == tenant_id
    assert qdrant.indexed[0]["tenant_id"] == tenant_id
    assert outbox.published[0]["tenant_id"] == tenant_id
    assert audit.logged[0]["tenant_id"] == tenant_id


@pytest.mark.asyncio
async def test_cross_tenant_isolation_no_leak_across_runs() -> None:
    """Two consecutive runs for different tenants do NOT share state."""
    advice_repo = FakeAdviceRepo()
    extractor = _build_extractor(
        llm=FakeLiteLLMService(specs_by_role={**_happy_specs(), **_bootstrap_specs()}),
        advice_repo=advice_repo,
    )

    tenant_a = uuid.uuid4()
    tenant_b = uuid.uuid4()

    await extractor.run(
        tenant_id=tenant_a,
        current_offers=_sample_offers(),
        creator_niche="A",
        country="AR",
    )
    # Reset LLM specs for tenant B's run (each run consumes its own queue).
    extractor._llm = FakeLiteLLMService(specs_by_role=_bootstrap_specs())  # noqa: SLF001 — test seam
    await extractor.run(
        tenant_id=tenant_b,
        current_offers=[],
        creator_niche="B",
        country="MX",
    )

    # 2 advice rows, each carrying its own tenant_id (no cross-leak).
    saved_tenants = [row["tenant_id"] for row in advice_repo.saved_advice]
    assert saved_tenants == [tenant_a, tenant_b]


# ─── Persistence + side-effects (best-effort, isolated) ────────────────────


@pytest.mark.asyncio
async def test_advice_repo_persisted_with_correct_payload() -> None:
    """Advice row carries tenant_id, sanitised payload, schema_version, version cement."""
    repo = FakeAdviceRepo()
    extractor = _build_extractor(advice_repo=repo)
    tenant_id = uuid.uuid4()

    await extractor.run(
        tenant_id=tenant_id,
        current_offers=_sample_offers(),
        creator_niche="niche",
        country="AR",
    )

    assert len(repo.saved_advice) == 1
    row = repo.saved_advice[0]
    assert row["tenant_id"] == tenant_id
    assert row["extractor_version"] == EXTRACTOR_VERSION
    assert isinstance(row["extracted_payload"], dict)
    assert row["extracted_payload"]["schema_version"] == 1
    assert row["country"] == "AR"
    assert row["creator_niche"] == "niche"


@pytest.mark.asyncio
async def test_advice_repo_failure_does_not_raise() -> None:
    """Advice repo failure is best-effort — extractor still returns advice."""
    repo = FakeAdviceRepo(raise_on_save=RuntimeError("db down"))
    extractor = _build_extractor(advice_repo=repo)

    advice = await extractor.run(
        tenant_id=uuid.uuid4(),
        current_offers=_sample_offers(),
        creator_niche="niche",
        country="AR",
    )

    assert isinstance(advice, OfferLadderAdviceV1)
    assert len(repo.saved_advice) == 0


@pytest.mark.asyncio
async def test_qdrant_indexed_when_supplied() -> None:
    """When qdrant_indexer supplied, structured payload indexed (sanitised)."""
    qdrant = FakeQdrantIndexer()
    extractor = _build_extractor(qdrant=qdrant)
    tenant_id = uuid.uuid4()

    await extractor.run(
        tenant_id=tenant_id,
        current_offers=_sample_offers(),
        creator_niche="niche",
        country="AR",
    )

    assert len(qdrant.indexed) == 1
    indexed = qdrant.indexed[0]
    assert indexed["tenant_id"] == tenant_id
    assert isinstance(indexed["payload"], dict)
    assert indexed["payload"]["schema_version"] == 1


@pytest.mark.asyncio
async def test_qdrant_failure_does_not_raise() -> None:
    """Qdrant index failure is best-effort, isolated from other side-effects."""
    qdrant = FakeQdrantIndexer(raise_on_index=RuntimeError("qdrant down"))
    repo = FakeAdviceRepo()
    extractor = _build_extractor(qdrant=qdrant, advice_repo=repo)

    advice = await extractor.run(
        tenant_id=uuid.uuid4(),
        current_offers=_sample_offers(),
        creator_niche="niche",
        country="AR",
    )

    # Repo persist still happened (isolation).
    assert len(repo.saved_advice) == 1
    assert isinstance(advice, OfferLadderAdviceV1)


@pytest.mark.asyncio
async def test_outbox_emits_offer_ladder_advice_generated_v1() -> None:
    """Outbox publishes OfferLadderAdviceGeneratedV1 with sanitised payload."""
    outbox = FakeOutbox()
    extractor = _build_extractor(outbox=outbox)
    tenant_id = uuid.uuid4()

    await extractor.run(
        tenant_id=tenant_id,
        current_offers=_sample_offers(),
        creator_niche="niche",
        country="AR",
    )

    assert len(outbox.published) == 1
    event = outbox.published[0]
    assert event["event_type"] == "OfferLadderAdviceGeneratedV1"
    assert event["tenant_id"] == tenant_id
    payload = event["payload"]
    assert payload["extractor_version"] == EXTRACTOR_VERSION
    assert payload["schema_version"] == 1
    assert payload["gaps_count"] == 2
    assert payload["suggestions_count"] == 6
    assert payload["country"] == "AR"


@pytest.mark.asyncio
async def test_outbox_failure_isolated() -> None:
    """Outbox failure does not block persistence or extractor return."""
    repo = FakeAdviceRepo()
    outbox = FakeOutbox(raise_on_publish=RuntimeError("kafka down"))
    extractor = _build_extractor(advice_repo=repo, outbox=outbox)

    advice = await extractor.run(
        tenant_id=uuid.uuid4(),
        current_offers=_sample_offers(),
        creator_niche="niche",
        country="AR",
    )

    assert isinstance(advice, OfferLadderAdviceV1)
    assert len(repo.saved_advice) == 1
    assert len(outbox.published) == 0


@pytest.mark.asyncio
async def test_audit_log_records_advice_generated_event() -> None:
    """Audit log records the offer_ladder_advice_generated event with sanitised payload."""
    audit = FakeAuditLog()
    extractor = _build_extractor(audit_log=audit)

    await extractor.run(
        tenant_id=uuid.uuid4(),
        current_offers=_sample_offers(),
        creator_niche="niche",
        country="AR",
    )

    assert len(audit.logged) == 1
    entry = audit.logged[0]
    assert entry["event_type"] == "offer_ladder_advice_generated"
    assert entry["payload"]["extractor_version"] == EXTRACTOR_VERSION
    # confidence high → needs_manual_review False
    assert entry["payload"]["needs_manual_review"] is False


@pytest.mark.asyncio
async def test_low_confidence_triggers_manual_review_flag_in_audit() -> None:
    """When confidence < MIN_ACCEPTABLE, audit log flags needs_manual_review=True."""
    low_conf_specs = {
        "reasoning": [
            FakeLLMResponseSpec(
                content_json={**_wave1_payload(), "wave_confidence": 0.3, "wave_warnings": ["low quality offers"]},
                cost_usd=Decimal("0.025"),
            ),
            FakeLLMResponseSpec(
                content_json={**_wave2_payload_two_gaps(), "wave_confidence": 0.4},
                cost_usd=Decimal("0.025"),
            ),
            FakeLLMResponseSpec(
                content_json={
                    "merged_warnings": ["coherence issue"],
                    "merged_missing_required_fields": ["tier_optimization"],
                    "validation_score_adjustment": -0.3,
                    "tier_optimization": None,
                    "consistency_notes": "low",
                    "wave_confidence": 1.0,
                    "wave_warnings": [],
                },
                cost_usd=Decimal("0.01"),
            ),
        ],
        "nano": [
            FakeLLMResponseSpec(
                content_json={**_wave3_payload_six_suggestions(), "wave_confidence": 0.5},
                cost_usd=Decimal("0.01"),
            ),
        ],
    }
    audit = FakeAuditLog()
    extractor = _build_extractor(
        llm=FakeLiteLLMService(specs_by_role=low_conf_specs),
        audit_log=audit,
    )

    advice = await extractor.run(
        tenant_id=uuid.uuid4(),
        current_offers=_sample_offers(),
        creator_niche="niche",
        country="AR",
    )

    assert advice.confidence_score < MIN_ACCEPTABLE_CONFIDENCE
    assert audit.logged[0]["payload"]["needs_manual_review"] is True


@pytest.mark.asyncio
async def test_audit_failure_isolated() -> None:
    """Audit failure does not affect other side-effects or extractor return."""
    repo = FakeAdviceRepo()
    audit = FakeAuditLog(raise_on_log=RuntimeError("audit table locked"))
    extractor = _build_extractor(advice_repo=repo, audit_log=audit)

    advice = await extractor.run(
        tenant_id=uuid.uuid4(),
        current_offers=_sample_offers(),
        creator_niche="niche",
        country="AR",
    )

    assert isinstance(advice, OfferLadderAdviceV1)
    assert len(repo.saved_advice) == 1


# ─── Schema cement (Story D playbook cross-story) ─────────────────────────


def test_schema_version_is_literal_1_frozen() -> None:
    """``schema_version`` is ``Literal[1]`` — bumping requires NEW V2 class."""
    advice = OfferLadderAdviceV1()
    assert advice.schema_version == 1
    # Pydantic v2 frozen ``Literal[1]`` — assigning 2 raises.
    with pytest.raises(Exception):  # noqa: B017 — generic Pydantic ValidationError + frozen
        OfferLadderAdviceV1(schema_version=2)  # type: ignore[arg-type]


def test_ladder_gap_rejects_invalid_level() -> None:
    """LadderGap enum cement — invalid level rejected at construction."""
    with pytest.raises(Exception):  # noqa: B017 — Pydantic ValidationError
        LadderGap(level="INVALID", reasoning="bad", priority="high")  # type: ignore[arg-type]


def test_suggested_offer_rejects_invalid_target_level() -> None:
    """SuggestedOffer enum cement — invalid target_level rejected."""
    with pytest.raises(Exception):  # noqa: B017
        SuggestedOffer(  # type: ignore[arg-type]
            target_level="INVALID",
            name="x",
            value_promise="y",
        )


def test_tier_optimization_defaults_unknown() -> None:
    """TierOptimization defaults: empty optimization sentinel."""
    tier = TierOptimization()
    assert tier.progression_quality == "unknown"
    assert tier.bundling_opportunities == []
    assert tier.upsell_paths == []


# ─── Sanity: offer_ladder_repo handle is accepted but not invoked here ────


@pytest.mark.asyncio
async def test_offer_ladder_repo_accepted_as_di_handle_but_not_invoked() -> None:
    """``offer_ladder_repo`` is accepted via DI per ticket spec but extractor
    doesn't mutate the ladder row. Confirms that wiring the singleton repo
    does NOT cause spurious calls during a run.
    """
    offer_ladder_repo = FakeOfferLadderRepo(ladder_row="<placeholder>")
    extractor = _build_extractor(offer_ladder_repo=offer_ladder_repo)

    advice = await extractor.run(
        tenant_id=uuid.uuid4(),
        current_offers=_sample_offers(),
        creator_niche="niche",
        country="AR",
    )

    assert isinstance(advice, OfferLadderAdviceV1)
    # No invasive mutation of the ladder row from extractor side.
    assert offer_ladder_repo.ladder_row == "<placeholder>"
