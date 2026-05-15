"""End-to-end voice cloning fixture — Anabella AR (es-AR voseo natural).

T-voice-4 acceptance per 06-tickets.yaml + V-AE-30:
  * 50-chat sample dataset programmatically synthesised in code (NOT real).
  * Pipeline produces CompiledVoice with dialecto == 'es-AR voseo natural'.
  * Bridge compiles to system_instruction that PersonalityCompiler accepts.
  * Confidence ≥ MIN_ACCEPTABLE_CONFIDENCE (0.65).
  * Cost budget ≤$0.18 USD.

Spanish-text rule magic comment: this file cites voseo lexicon in test
fixtures — voseo-allowed (legitimate brand voice for AR tenant).
<!-- voseo-allowed: AR persona fixture — sales_agent voice expression exception -->
"""

from __future__ import annotations

import json
import uuid
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any

import pytest

from src.modules.comunify.brand.voice_cloning.compiler_integration import (
    compile_voice_to_system_instruction,
)
from src.modules.comunify.brand.voice_cloning.voice_distillation_orchestrator import (
    MIN_ACCEPTABLE_CONFIDENCE,
    VoiceDistillationOrchestrator,
)
from src.modules.comunify.copilot.extractors.offer_ladder_advisor import _LLMResponse

# ─── Fixture synthesis ────────────────────────────────────────────────────


def _anabella_50_chats() -> list[dict[str, Any]]:
    """Synthesise 50 chat samples in es-AR voseo style (no PII).

    Voseo-allowed: legitimate brand voice for AR fitness coach.
    """
    base_messages = [
        "Hola! Dale, contame qué onda con tu rutina.",
        "Tenés que probarlo esta semana, te lo bancás obvio.",
        "Una banda, dale vamos 💪",
        "Te entiendo total, eso pasa al principio. No te frustres.",
        "Mirá, lo importante es la constancia, no la perfección.",
        "Obvio, podés arrancar con 20 minutos y vas escalando.",
        "Sos una capa, te admiro. Seguí así nomás.",
        "Te paso el plan: lunes/miércoles/viernes, 30min cada día.",
        "Ya sé que cuesta. A mí también me costó al principio, eh.",
        "Dale, hoy hacé lo que puedas. Mañana arrancamos fuerte.",
    ]
    # Cycle through to 50.
    return [
        {"message": base_messages[i % len(base_messages)], "sender": "anabella", "channel": "wa"} for i in range(50)
    ]


# ─── Wave payloads (matching Anabella's voice fingerprint) ────────────────


def _w1_dialect_ar() -> dict[str, Any]:
    return {
        "dialecto": "es-AR voseo natural",
        "dialect_evidence": ["'tenés' (voseo)", "'sos una capa' (lunfardo AR)", "'dale, vamos' (apertura típica)"],
        "wave_confidence": 0.95,
        "wave_warnings": [],
    }


def _w2_vocabulary_ar() -> dict[str, Any]:
    return {
        "vocabulario": [
            "tenés que probarlo",
            "te lo bancás",
            "dale, vamos",
            "una banda",
            "obvio",
            "sos una capa",
            "te entiendo total",
            "no te frustres",
        ],
        "emoji_style": "moderate",
        "favorite_emojis": ["💪", "🔥"],
        "filler_phrases": ["o sea", "obvio", "tipo"],
        "wave_confidence": 0.90,
        "wave_warnings": [],
    }


def _w3_register_ar() -> dict[str, Any]:
    return {
        "registro": "cercano informal con humor cálido — empatía sin formalidad",
        "energy_level": "alta",
        "warmth_level": "cercana",
        "humor_type": "playful",
        "verbosity": "medio",
        "wave_confidence": 0.88,
        "wave_warnings": [],
    }


def _w4_compile_ar() -> dict[str, Any]:
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


# ─── Fake LiteLLM service ─────────────────────────────────────────────────


def _seed_cost(call_id: str, amount: Decimal) -> bool:
    try:
        from time import monotonic

        from luana_core_observability.recording import cost_recorder  # type: ignore[import-not-found]

        with cost_recorder._lock:  # noqa: SLF001
            cost_recorder._cache[call_id] = (amount, monotonic() + 60.0)
        return True
    except ImportError:
        return False


_COST_RECORDER_AVAILABLE = _seed_cost("__anabella_probe__", Decimal("0"))


@dataclass
class FakeLiteLLMService:
    specs_by_role: dict[str, list[Any]] = field(default_factory=dict)
    calls_log: list[dict[str, Any]] = field(default_factory=list)

    async def ainvoke_text(self, *, role: str, prompt: str, timeout_sec: float) -> _LLMResponse:
        spec_list = self.specs_by_role.get(role, [])
        spec = spec_list.pop(0) if spec_list else {"content_json": {}, "cost_usd": None}
        call_id = f"litellm-anabella-{uuid.uuid4()}"
        if spec.get("cost_usd") is not None:
            _seed_cost(call_id, spec["cost_usd"])
        self.calls_log.append({"role": role, "prompt_chars": len(prompt)})
        return _LLMResponse(
            content=json.dumps(spec["content_json"], ensure_ascii=False),
            litellm_call_id=call_id if spec.get("cost_usd") is not None else None,
        )


def _build_anabella_specs() -> dict[str, list[dict[str, Any]]]:
    return {
        "nano": [{"content_json": _w1_dialect_ar(), "cost_usd": Decimal("0.015")}],
        "reasoning": [
            {"content_json": _w2_vocabulary_ar(), "cost_usd": Decimal("0.050")},
            {"content_json": _w3_register_ar(), "cost_usd": Decimal("0.040")},
            {"content_json": _w4_compile_ar(), "cost_usd": Decimal("0.040")},
        ],
    }


# ─── Tests ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_anabella_ar_distillation_detects_voseo_dialect() -> None:
    """V-AE-30 fixture 1: Anabella AR → es-AR voseo natural detected."""
    llm = FakeLiteLLMService(specs_by_role=_build_anabella_specs())
    extractor = VoiceDistillationOrchestrator(llm_service=llm)

    compiled = await extractor.run(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        chat_samples=_anabella_50_chats(),
        country="AR",
    )

    assert compiled.dialecto == "es-AR voseo natural"
    assert compiled.confidence_score >= MIN_ACCEPTABLE_CONFIDENCE
    assert len(compiled.vocabulario) >= 3
    # Voseo lexicon survived the pipeline (vocabulario has voseo phrases).
    voseo_phrases = ["tenés", "bancás", "dale"]
    vocab_text = " ".join(compiled.vocabulario).lower()
    assert any(p in vocab_text for p in voseo_phrases)


@pytest.mark.asyncio
async def test_anabella_ar_4_wave_calls_fired() -> None:
    llm = FakeLiteLLMService(specs_by_role=_build_anabella_specs())
    extractor = VoiceDistillationOrchestrator(llm_service=llm)

    await extractor.run(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        chat_samples=_anabella_50_chats(),
        country="AR",
    )

    assert len(llm.calls_log) == 4
    roles = [c["role"] for c in llm.calls_log]
    assert roles.count("nano") == 1
    assert roles.count("reasoning") == 3


@pytest.mark.asyncio
async def test_anabella_ar_cost_within_budget() -> None:
    """V-AE-21 fixture: total cost ≤$0.18 USD for 50 chats."""
    if not _COST_RECORDER_AVAILABLE:
        pytest.skip("observability cost bridge unavailable")

    llm = FakeLiteLLMService(specs_by_role=_build_anabella_specs())
    extractor = VoiceDistillationOrchestrator(llm_service=llm)

    compiled = await extractor.run(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        chat_samples=_anabella_50_chats(),
        country="AR",
    )

    # 0.015 + 0.050 + 0.040 + 0.040 = 0.145 ≤ 0.18.
    cost_warnings = [w for w in compiled.extraction_warnings if "cost_budget_exceeded" in w]
    assert not cost_warnings


@pytest.mark.asyncio
async def test_anabella_ar_compiles_to_system_instruction_via_bridge() -> None:
    """V-AE-29: bridge produces a non-empty 5-block system_instruction."""
    llm = FakeLiteLLMService(specs_by_role=_build_anabella_specs())
    extractor = VoiceDistillationOrchestrator(llm_service=llm)

    compiled = await extractor.run(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        chat_samples=_anabella_50_chats(),
        country="AR",
    )

    system_instruction = compile_voice_to_system_instruction(compiled)
    assert "BLOQUE 1" in system_instruction
    assert "BLOQUE 5" in system_instruction
    # Identity anchor from the LLM output threaded through.
    assert "Coach" in system_instruction or "fitness" in system_instruction.lower()


@pytest.mark.asyncio
async def test_anabella_ar_no_pii_in_compiled_voice() -> None:
    """Sanity guard — compiled voice contains NO PII patterns (the fixtures
    didn't seed any, but defense in depth)."""
    llm = FakeLiteLLMService(specs_by_role=_build_anabella_specs())
    extractor = VoiceDistillationOrchestrator(llm_service=llm)

    compiled = await extractor.run(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        chat_samples=_anabella_50_chats(),
        country="AR",
    )

    all_text = " ".join(
        [compiled.identidad, compiled.dialecto, compiled.registro]
        + compiled.vocabulario
        + compiled.asi_no
        + compiled.anclajes
    )
    # No email / phone / DNI patterns.
    assert "@" not in all_text
    assert "+54" not in all_text
    assert "DNI" not in all_text.upper()  # the fixtures kept DNI out
