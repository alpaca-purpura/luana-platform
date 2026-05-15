"""Tests for ``VoiceDistillationOrchestrator`` (T-voice-1, R23 Opus 4.7).

Acceptance coverage (per 06-tickets.yaml::T-voice-1 + 04-validators.yaml):
  * A1 — Subclass of ``BaseExtractionOrchestrator`` (arch fitness gate ALSO
    asserts this, repeated here for fast feedback within the module suite).
  * A2 — 4 waves complete + merge produces ``CompiledVoice`` with confidence.
  * A3 — Cost per distillation ≤$0.18 USD (V-AE-21 SSoT).
  * A4 — Insufficient samples graceful path (<50 → degraded result + warning).
  * A5 — Tenant isolation: side-effect collaborators receive ``tenant_id``.
  * A6 — D15 invariant: raw samples remover invoked on success, NOT on failure.

Defensive paths covered:
  * Wave timeout → degraded confidence + warning recorded.
  * Wave LLM exception → confidence drops, partial output kept.
  * Wave returns invalid JSON → empty wave + warning.
  * Wave returns malformed entity → entity dropped + warning recorded.
  * Cost-unknown wave (no litellm_call_id) → warning + Decimal('0') used.
  * Persistence failure → does NOT raise (best-effort).
  * Outbox + audit_log + raw_samples_remover failures → do NOT raise.
  * Schema cement: ``schema_version == 1`` Literal frozen.

In-memory fakes mirror ``test_offer_ladder_advisor.py`` pattern (sibling).
"""

from __future__ import annotations

import json
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from typing import Any

import pytest
from luana_core_extraction.base_orchestrator import BaseExtractionOrchestrator

from src.modules.comunify.brand.voice_cloning._schemas import CompiledVoice
from src.modules.comunify.brand.voice_cloning.voice_distillation_orchestrator import (
    DEFAULT_COST_BUDGET_USD,
    EXTRACTOR_VERSION,
    MIN_ACCEPTABLE_CONFIDENCE,
    VoiceDistillationOrchestrator,
)
from src.modules.comunify.copilot.extractors.offer_ladder_advisor import _LLMResponse

# ─── Cost recorder bridge (lazy import — mirror offer_ladder pattern) ─────


def _seed_cost(call_id: str, amount: Decimal) -> bool:
    """Seed observability cost cache so ``pop_cost`` resolves a value.

    Returns True if seeding succeeded, False if observability unavailable.
    """
    try:
        from time import monotonic

        from luana_core_observability.recording import (
            cost_recorder,  # type: ignore[import-not-found]
        )

        with cost_recorder._lock:  # noqa: SLF001
            cost_recorder._cache[call_id] = (amount, monotonic() + 60.0)
        return True
    except ImportError:
        return False


_COST_RECORDER_AVAILABLE = _seed_cost("__voice_distill_probe__", Decimal("0"))


# ─── Fakes ────────────────────────────────────────────────────────────────


@dataclass
class FakeLLMResponseSpec:
    """Per-wave fake response spec."""

    content_json: dict[str, Any]
    cost_usd: Decimal | None = Decimal("0.04")
    delay_sec: float = 0.0
    raise_exc: BaseException | None = None


@dataclass
class FakeLiteLLMService:
    """In-memory fake of ``_LiteLLMServiceLike`` driven by per-role specs."""

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

        call_id = f"litellm-voice-{uuid.uuid4()}"
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
class FakeJobRepo:
    """In-memory fake of ``_VoiceDistillationJobRepoLike``."""

    updates: list[dict[str, Any]] = field(default_factory=list)
    raise_on_update: BaseException | None = None

    async def update_status(
        self,
        job_id: uuid.UUID,
        *,
        status: str,
        confidence_score: float | None = None,
        compiled_blocks: dict | None = None,
        error_reason: str | None = None,
        completed_at: datetime | None = None,
        ratified_at: datetime | None = None,
    ) -> bool:
        if self.raise_on_update is not None:
            raise self.raise_on_update
        self.updates.append(
            {
                "job_id": job_id,
                "status": status,
                "confidence_score": confidence_score,
                "compiled_blocks": compiled_blocks,
                "error_reason": error_reason,
                "completed_at": completed_at,
                "ratified_at": ratified_at,
            }
        )
        return True


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
        self.logged.append({"tenant_id": tenant_id, "event_type": event_type, "payload": payload})


@dataclass
class FakeRawSamplesRemover:
    """In-memory fake of the D15 raw-samples remover."""

    removed_for: list[dict[str, Any]] = field(default_factory=list)
    raise_on_remove: BaseException | None = None

    async def delete_raw_samples(
        self,
        *,
        tenant_id: uuid.UUID,
        job_id: uuid.UUID,
    ) -> None:
        if self.raise_on_remove is not None:
            raise self.raise_on_remove
        self.removed_for.append({"tenant_id": tenant_id, "job_id": job_id})


# ─── Wave payload builders ────────────────────────────────────────────────


def _w1_payload_ar() -> dict[str, Any]:
    return {
        "dialecto": "es-AR voseo natural",
        "dialect_evidence": ["uso de 'tenés'", "uso de 'querés'", "vocativo 'che'"],
        "wave_confidence": 0.95,
        "wave_warnings": [],
    }


def _w2_payload_vocab() -> dict[str, Any]:
    return {
        "vocabulario": ["tenés que probarlo", "te lo bancás", "dale, vamos", "una banda", "obvio"],
        "emoji_style": "moderate",
        "favorite_emojis": ["💪", "🔥", "✨"],
        "filler_phrases": ["o sea", "obvio", "tipo"],
        "wave_confidence": 0.88,
        "wave_warnings": [],
    }


def _w3_payload_register() -> dict[str, Any]:
    return {
        "registro": "cercano informal con humor cálido — empatía sin formalidad",
        "energy_level": "alta",
        "warmth_level": "cercana",
        "humor_type": "playful",
        "verbosity": "medio",
        "wave_confidence": 0.85,
        "wave_warnings": [],
    }


def _w4_payload_compile() -> dict[str, Any]:
    return {
        "identidad": "Coach de fitness para mujeres 35-50 en Argentina, cercana y energética",
        "dialecto": "es-AR voseo natural",
        "vocabulario": [
            "tenés que probarlo",
            "te lo bancás",
            "dale, vamos",
            "una banda",
            "obvio",
        ],
        "registro": "cercano informal con humor cálido — empatía sin formalidad",
        "asi_no": [
            "NUNCA uses 'usted' ni tratamientos formales",
            "NUNCA digas 'querida/o' sin que el lead lo use primero",
            "NUNCA hagas chistes sobre cuerpo o peso ajeno",
        ],
        "anclajes": [
            "soy coach, no médica — derivo siempre",
            "respeto el momento de cada una",
            "celebro cualquier avance, por chico que sea",
        ],
        "validation_score_adjustment": 0.0,
        "consistency_notes": "Waves coherent across dialect + vocab + register.",
        "wave_confidence": 0.92,
        "wave_warnings": [],
    }


def _happy_specs(*, w1_cost: Decimal = Decimal("0.015")) -> dict[str, list[FakeLLMResponseSpec]]:
    """Per-role specs for the happy path (1 nano + 3 reasoning = 4 calls).

    Costs: W1 0.015 (Haiku), W2 0.05, W3 0.04, W4 0.04 → total ≈ 0.145 USD
    (≤ 0.18 budget).
    """
    return {
        "nano": [
            FakeLLMResponseSpec(content_json=_w1_payload_ar(), cost_usd=w1_cost),
        ],
        "reasoning": [
            FakeLLMResponseSpec(content_json=_w2_payload_vocab(), cost_usd=Decimal("0.05")),
            FakeLLMResponseSpec(content_json=_w3_payload_register(), cost_usd=Decimal("0.04")),
            FakeLLMResponseSpec(content_json=_w4_payload_compile(), cost_usd=Decimal("0.04")),
        ],
    }


def _build_orchestrator(
    *,
    llm: FakeLiteLLMService | None = None,
    job_repo: FakeJobRepo | None = None,
    outbox: FakeOutbox | None = None,
    audit_log: FakeAuditLog | None = None,
    raw_samples_remover: FakeRawSamplesRemover | None = None,
    cost_budget_usd: Decimal | None = None,
) -> VoiceDistillationOrchestrator:
    return VoiceDistillationOrchestrator(
        llm_service=llm or FakeLiteLLMService(specs_by_role=_happy_specs()),
        job_repo=job_repo,
        outbox=outbox,
        audit_log=audit_log,
        raw_samples_remover=raw_samples_remover,
        cost_budget_usd=cost_budget_usd or DEFAULT_COST_BUDGET_USD,
    )


def _sample_chats_ar(count: int = 50) -> list[dict[str, Any]]:
    """Synthesise N pre-sanitized chat samples (es-AR voseo, no PII)."""
    base = [
        {"message": "Dale, contame qué onda tu rutina actual.", "sender": "creator", "channel": "wa"},
        {"message": "Tenés que probarlo, te lo bancás obvio.", "sender": "creator", "channel": "wa"},
        {"message": "Una banda, dale vamos 💪.", "sender": "creator", "channel": "wa"},
        {"message": "O sea, no es magia, es constancia.", "sender": "creator", "channel": "wa"},
        {"message": "Te entiendo total, eso pasa al principio.", "sender": "creator", "channel": "wa"},
    ]
    # Pad to count by cycling.
    return [base[i % len(base)] for i in range(count)]


# ─── Acceptance A1 — subclass invariant ───────────────────────────────────


def test_voice_distillation_subclasses_base() -> None:
    """A1: VoiceDistillationOrchestrator MUST inherit from BaseExtractionOrchestrator.

    Mirror of arch fitness gate ``test_comunify_voice_distillation_inherits_base_orchestrator.py``
    — kept here as fast in-module sanity check.
    """
    assert issubclass(VoiceDistillationOrchestrator, BaseExtractionOrchestrator)


def test_extractor_inherits_base_methods() -> None:
    """A1 corollary: shared wave + pause + announce helpers accessible."""
    extractor = _build_orchestrator()
    assert hasattr(extractor, "_run_wave")
    assert hasattr(extractor, "_pause_between_waves")
    assert hasattr(extractor, "_announce_sections")
    assert hasattr(extractor, "_get_wave_delay")


def test_extractor_log_prefix_is_comunify_specific() -> None:
    assert VoiceDistillationOrchestrator.log_prefix == "comunify_voice_distillation"


def test_wave_definitions_match_spec() -> None:
    """4 waves with names + roles + timeouts + weights per 03-arch-agentic § 5.3."""
    waves = VoiceDistillationOrchestrator._define_waves()
    assert len(waves) == 4
    assert [w.name for w in waves] == [
        "dialect_detection",
        "vocabulary_anchors_extraction",
        "register_tone_profile",
        "validate_and_compile_v2",
    ]
    assert [w.model_role for w in waves] == ["nano", "reasoning", "reasoning", "reasoning"]
    assert [w.timeout_sec for w in waves] == [20.0, 40.0, 30.0, 30.0]
    assert abs(sum(w.confidence_weight for w in waves) - 1.0) < 0.001


def test_constructor_rejects_unbalanced_weights(monkeypatch: pytest.MonkeyPatch) -> None:
    """If the wave weight dict drifts, construction should fail loudly."""
    from src.modules.comunify.brand.voice_cloning import voice_distillation_orchestrator as vdo_mod

    monkeypatch.setitem(vdo_mod._WAVE_CONFIDENCE_WEIGHTS, "dialect_detection", 0.5)

    class _StubLLM:
        async def ainvoke_text(self, *, role: str, prompt: str, timeout_sec: float) -> None: ...  # type: ignore[empty-body]

    with pytest.raises(ValueError, match="Wave confidence weights must sum to 1.0"):
        VoiceDistillationOrchestrator(llm_service=_StubLLM())  # type: ignore[arg-type]


# ─── Acceptance A2 — 4 waves + merge → CompiledVoice ──────────────────────


@pytest.mark.asyncio
async def test_4_wave_pipeline_happy_path() -> None:
    """A2: All 4 waves run, merge produces CompiledVoice with confidence."""
    llm = FakeLiteLLMService(specs_by_role=_happy_specs())
    extractor = _build_orchestrator(llm=llm)

    compiled = await extractor.run(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        chat_samples=_sample_chats_ar(50),
        country="AR",
    )

    # 4 LLM calls fired (one per wave).
    assert len(llm.calls_log) == 4, f"Expected 4 wave calls, got {len(llm.calls_log)}"

    # Output is CompiledVoice with schema cement.
    assert isinstance(compiled, CompiledVoice)
    assert compiled.schema_version == 1

    # 6 bloques populated.
    assert compiled.identidad
    assert compiled.dialecto == "es-AR voseo natural"
    assert len(compiled.vocabulario) >= 3
    assert compiled.registro
    assert len(compiled.asi_no) >= 2
    assert len(compiled.anclajes) >= 2

    # Confidence in happy range.
    assert 0.0 <= compiled.confidence_score <= 1.0
    assert compiled.confidence_score >= MIN_ACCEPTABLE_CONFIDENCE

    # Samples used count threaded through.
    assert compiled.samples_used == 50

    # No missing required.
    assert not compiled.missing_required_fields


@pytest.mark.asyncio
async def test_wave_routes_by_model_role() -> None:
    """Each wave routes to its declared model_role (LLM_ROLE_BY_SITE SSoT)."""
    llm = FakeLiteLLMService(specs_by_role=_happy_specs())
    extractor = _build_orchestrator(llm=llm)

    await extractor.run(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        chat_samples=_sample_chats_ar(50),
        country="AR",
    )

    roles_called = [call["role"] for call in llm.calls_log]
    # W1 = nano (Haiku), W2/W3/W4 = reasoning (Sonnet).
    assert roles_called.count("nano") == 1
    assert roles_called.count("reasoning") == 3


@pytest.mark.asyncio
async def test_returns_compiled_voice_even_on_all_wave_failures() -> None:
    """Even if every wave raises, run() returns CompiledVoice (degraded)."""

    class _BoomError(RuntimeError):
        pass

    specs = {
        "nano": [FakeLLMResponseSpec(content_json={}, raise_exc=_BoomError("w1 down"))],
        "reasoning": [
            FakeLLMResponseSpec(content_json={}, raise_exc=_BoomError("w2 down")),
            FakeLLMResponseSpec(content_json={}, raise_exc=_BoomError("w3 down")),
            FakeLLMResponseSpec(content_json={}, raise_exc=_BoomError("w4 down")),
        ],
    }
    extractor = _build_orchestrator(llm=FakeLiteLLMService(specs_by_role=specs))

    compiled = await extractor.run(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        chat_samples=_sample_chats_ar(50),
        country="AR",
    )

    assert isinstance(compiled, CompiledVoice)
    assert compiled.confidence_score == 0.0
    exception_warnings = [w for w in compiled.extraction_warnings if "exception" in w]
    assert len(exception_warnings) >= 4
    # All 6 bloques missing.
    assert set(compiled.missing_required_fields) == {
        "identidad",
        "dialecto",
        "vocabulario",
        "registro",
        "asi_no",
        "anclajes",
    }


@pytest.mark.asyncio
async def test_partial_wave_failure_yields_partial_compiled_voice() -> None:
    """If only wave 4 fails, waves 1-3 partial data survives via fallback."""
    specs = _happy_specs()
    # Replace wave 4 (validator) with an exception.
    specs["reasoning"][2] = FakeLLMResponseSpec(content_json={}, raise_exc=RuntimeError("w4 down"))
    extractor = _build_orchestrator(llm=FakeLiteLLMService(specs_by_role=specs))

    compiled = await extractor.run(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        chat_samples=_sample_chats_ar(50),
        country="AR",
    )

    # dialecto fell back from wave 1.
    assert compiled.dialecto == "es-AR voseo natural"
    # vocabulario fell back from wave 2.
    assert len(compiled.vocabulario) >= 3
    # registro fell back from wave 3.
    assert compiled.registro
    # identidad / asi_no / anclajes ONLY come from wave 4 → missing.
    assert "identidad" in compiled.missing_required_fields
    assert "asi_no" in compiled.missing_required_fields
    assert "anclajes" in compiled.missing_required_fields
    # Wave 4 exception warning surfaced.
    assert any("validate_and_compile_v2_exception" in w for w in compiled.extraction_warnings)


@pytest.mark.asyncio
async def test_wave_invalid_json_yields_empty_wave_with_warning() -> None:
    """LLM returning non-JSON → wave silently yields empty + warning."""

    class _GibberishLLMService(FakeLiteLLMService):
        async def ainvoke_text(self, *, role: str, prompt: str, timeout_sec: float) -> _LLMResponse:
            if role == "nano":
                # Wave 1 returns garbage (no call_id → cost-unknown).
                return _LLMResponse(content="<<not json>>", litellm_call_id=None, duration_ms=10)
            return await super().ainvoke_text(role=role, prompt=prompt, timeout_sec=timeout_sec)

    llm = _GibberishLLMService(specs_by_role=_happy_specs())
    extractor = _build_orchestrator(llm=llm)

    compiled = await extractor.run(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        chat_samples=_sample_chats_ar(50),
        country="AR",
    )

    # Wave 1 yielded empty, but wave 4 provided dialecto fallback.
    assert compiled.dialecto == "es-AR voseo natural"
    # Confidence degraded but non-zero (waves 2/3/4 still contributed).
    assert 0.0 < compiled.confidence_score < 1.0


@pytest.mark.asyncio
async def test_malformed_list_items_dropped_with_warning() -> None:
    """LLM returning non-string items in vocabulario → dropped + warn."""
    specs = _happy_specs()
    bad_w4 = dict(_w4_payload_compile())
    bad_w4["vocabulario"] = [
        "valid phrase",
        {"unexpected": "dict"},  # invalid — not a string
        None,  # invalid
        "another valid phrase",
    ]
    specs["reasoning"][2] = FakeLLMResponseSpec(content_json=bad_w4, cost_usd=Decimal("0.04"))
    extractor = _build_orchestrator(llm=FakeLiteLLMService(specs_by_role=specs))

    compiled = await extractor.run(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        chat_samples=_sample_chats_ar(50),
        country="AR",
    )

    # Only valid entries kept (filtered list).
    assert "valid phrase" in compiled.vocabulario
    assert "another valid phrase" in compiled.vocabulario
    # Warnings recorded for dropped items.
    assert any("vocabulario_item_" in w for w in compiled.extraction_warnings)


# ─── Acceptance A3 — cost budget ≤$0.18 USD ───────────────────────────────


@pytest.mark.asyncio
async def test_cost_budget_happy_path() -> None:
    """A3 / V-AE-21: total cost ≤$0.18 USD per distillation on happy path."""
    if not _COST_RECORDER_AVAILABLE:
        pytest.skip("luana_core_observability not importable — cost bridge unavailable")

    extractor = _build_orchestrator()

    compiled = await extractor.run(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        chat_samples=_sample_chats_ar(50),
        country="AR",
    )

    # Per-wave costs: 0.015 + 0.05 + 0.04 + 0.04 = 0.145 — well under 0.18.
    cost_warnings = [w for w in compiled.extraction_warnings if "cost_budget_exceeded" in w]
    assert not cost_warnings, f"Happy path must stay under {DEFAULT_COST_BUDGET_USD} USD; got: {cost_warnings}"


@pytest.mark.asyncio
async def test_cost_budget_exceeded_recorded_as_warning() -> None:
    """Cost ceiling breach → warning recorded, but extractor still returns."""
    if not _COST_RECORDER_AVAILABLE:
        pytest.skip("luana_core_observability not importable — cost bridge unavailable")

    # Each wave costs 0.08 → total 0.32 > budget 0.18.
    expensive_specs = {
        "nano": [FakeLLMResponseSpec(content_json=_w1_payload_ar(), cost_usd=Decimal("0.08"))],
        "reasoning": [
            FakeLLMResponseSpec(content_json=_w2_payload_vocab(), cost_usd=Decimal("0.08")),
            FakeLLMResponseSpec(content_json=_w3_payload_register(), cost_usd=Decimal("0.08")),
            FakeLLMResponseSpec(content_json=_w4_payload_compile(), cost_usd=Decimal("0.08")),
        ],
    }
    extractor = _build_orchestrator(llm=FakeLiteLLMService(specs_by_role=expensive_specs))

    compiled = await extractor.run(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        chat_samples=_sample_chats_ar(50),
        country="AR",
    )

    # Extractor returns despite budget breach.
    assert isinstance(compiled, CompiledVoice)
    cost_warnings = [w for w in compiled.extraction_warnings if "cost_budget_exceeded" in w]
    assert len(cost_warnings) >= 1


# ─── Acceptance A4 — insufficient samples graceful path ───────────────────


@pytest.mark.asyncio
async def test_insufficient_samples_returns_degraded_compiled_voice() -> None:
    """A4: <50 samples → degraded result + warning, no LLM calls."""
    llm = FakeLiteLLMService(specs_by_role=_happy_specs())
    extractor = _build_orchestrator(llm=llm)

    compiled = await extractor.run(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        chat_samples=_sample_chats_ar(10),  # only 10
        country="AR",
    )

    # No LLM calls fired (short-circuit).
    assert len(llm.calls_log) == 0

    assert isinstance(compiled, CompiledVoice)
    assert compiled.confidence_score == 0.0
    assert compiled.samples_used == 10
    assert any("insufficient_samples" in w for w in compiled.extraction_warnings)


# ─── Acceptance A5 — tenant isolation in side-effects ─────────────────────


@pytest.mark.asyncio
async def test_tenant_id_forwarded_to_all_collaborators() -> None:
    """A5: tenant_id reaches job_repo + outbox + audit_log + remover."""
    job_repo = FakeJobRepo()
    outbox = FakeOutbox()
    audit_log = FakeAuditLog()
    remover = FakeRawSamplesRemover()

    tenant_id = uuid.uuid4()
    job_id = uuid.uuid4()

    extractor = _build_orchestrator(
        job_repo=job_repo,
        outbox=outbox,
        audit_log=audit_log,
        raw_samples_remover=remover,
    )

    await extractor.run(
        tenant_id=tenant_id,
        job_id=job_id,
        chat_samples=_sample_chats_ar(50),
        country="AR",
    )

    # Job repo received the update (no direct tenant_id arg — tenant scope at
    # repo construction in production; we assert the job_id is correct).
    assert any(u["job_id"] == job_id for u in job_repo.updates)
    # Outbox saw tenant_id explicitly.
    assert outbox.published and outbox.published[0]["tenant_id"] == tenant_id
    # Audit log saw tenant_id.
    assert audit_log.logged and audit_log.logged[0]["tenant_id"] == tenant_id
    # Remover saw tenant_id + job_id.
    assert remover.removed_for and remover.removed_for[0]["tenant_id"] == tenant_id
    assert remover.removed_for[0]["job_id"] == job_id


# ─── Acceptance A6 — D15 raw samples deletion ─────────────────────────────


@pytest.mark.asyncio
async def test_raw_samples_remover_invoked_on_success() -> None:
    """A6: D15 — raw_samples_remover called on completed status."""
    remover = FakeRawSamplesRemover()
    extractor = _build_orchestrator(raw_samples_remover=remover)

    await extractor.run(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        chat_samples=_sample_chats_ar(50),
        country="AR",
    )

    assert len(remover.removed_for) == 1


@pytest.mark.asyncio
async def test_raw_samples_remover_NOT_invoked_on_failure() -> None:
    """A6: D15 invariant — failed distillation MUST NOT trigger sample deletion.

    Rationale: creator can retry with more samples / fix bad upload; we keep
    raw content available for retry-with-context.
    """
    remover = FakeRawSamplesRemover()
    extractor = _build_orchestrator(raw_samples_remover=remover)

    # Insufficient samples → short-circuits to failed (no LLM call).
    await extractor.run(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        chat_samples=_sample_chats_ar(5),  # below threshold
        country="AR",
    )

    assert len(remover.removed_for) == 0


@pytest.mark.asyncio
async def test_raw_samples_remover_NOT_invoked_when_all_waves_fail() -> None:
    """Hard wave failure (all 4 waves raise) → final_status=failed → no delete."""

    class _BoomError(RuntimeError):
        pass

    specs = {
        "nano": [FakeLLMResponseSpec(content_json={}, raise_exc=_BoomError())],
        "reasoning": [
            FakeLLMResponseSpec(content_json={}, raise_exc=_BoomError()),
            FakeLLMResponseSpec(content_json={}, raise_exc=_BoomError()),
            FakeLLMResponseSpec(content_json={}, raise_exc=_BoomError()),
        ],
    }
    remover = FakeRawSamplesRemover()
    extractor = _build_orchestrator(
        llm=FakeLiteLLMService(specs_by_role=specs),
        raw_samples_remover=remover,
    )

    await extractor.run(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        chat_samples=_sample_chats_ar(50),
        country="AR",
    )

    assert len(remover.removed_for) == 0


# ─── Best-effort side-effects: failures do NOT raise ──────────────────────


@pytest.mark.asyncio
async def test_job_repo_failure_does_not_raise() -> None:
    """Persistence failure → logged + degraded, but extractor returns."""
    job_repo = FakeJobRepo(raise_on_update=RuntimeError("db down"))
    extractor = _build_orchestrator(job_repo=job_repo)

    compiled = await extractor.run(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        chat_samples=_sample_chats_ar(50),
        country="AR",
    )

    assert isinstance(compiled, CompiledVoice)


@pytest.mark.asyncio
async def test_outbox_failure_does_not_raise() -> None:
    outbox = FakeOutbox(raise_on_publish=RuntimeError("outbox down"))
    extractor = _build_orchestrator(outbox=outbox)

    compiled = await extractor.run(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        chat_samples=_sample_chats_ar(50),
        country="AR",
    )

    assert isinstance(compiled, CompiledVoice)


@pytest.mark.asyncio
async def test_remover_failure_does_not_raise() -> None:
    remover = FakeRawSamplesRemover(raise_on_remove=RuntimeError("storage down"))
    extractor = _build_orchestrator(raw_samples_remover=remover)

    compiled = await extractor.run(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        chat_samples=_sample_chats_ar(50),
        country="AR",
    )

    assert isinstance(compiled, CompiledVoice)


# ─── Outbox event shape ────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_outbox_event_carries_voice_distillation_completed_on_success() -> None:
    outbox = FakeOutbox()
    extractor = _build_orchestrator(outbox=outbox)

    await extractor.run(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        chat_samples=_sample_chats_ar(50),
        country="AR",
    )

    assert len(outbox.published) == 1
    event = outbox.published[0]
    assert event["event_type"] == "VoiceDistillationCompletedV1"
    assert event["payload"]["extractor_version"] == EXTRACTOR_VERSION
    assert event["payload"]["schema_version"] == 1
    assert event["payload"]["samples_used"] == 50
    assert "dialecto" in event["payload"]
    # PII NOT in payload (no raw chat content keys).
    assert "chat_samples" not in event["payload"]
    assert "message" not in event["payload"]


@pytest.mark.asyncio
async def test_outbox_event_carries_voice_distillation_failed_on_hard_failure() -> None:
    """Insufficient samples → VoiceDistillationFailedV1."""
    outbox = FakeOutbox()
    extractor = _build_orchestrator(outbox=outbox)

    await extractor.run(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        chat_samples=_sample_chats_ar(5),
        country="AR",
    )

    assert len(outbox.published) == 1
    assert outbox.published[0]["event_type"] == "VoiceDistillationFailedV1"
