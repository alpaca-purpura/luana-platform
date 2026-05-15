"""End-to-end voice cloning fixture — Pablo MX (es-MX neutro broad).

T-voice-4 acceptance per 06-tickets.yaml + V-AE-30:
  * 50-chat sample dataset in es-MX neutro broad (no MX-specific slang).
  * Pipeline produces CompiledVoice with dialecto containing 'es-MX' or 'neutro'.
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


def _pablo_50_chats() -> list[dict[str, Any]]:
    """50 chats in es-MX neutro broad — accessible LATAM-wide, no MX slang."""
    base_messages = [
        "Hola, ¿cómo estás? Cuéntame qué necesitas hoy.",
        "Tienes que probarlo, lo vas a aprovechar muchísimo.",
        "Vamos paso a paso, sin presión.",
        "Te entiendo perfectamente, eso es normal al inicio.",
        "Mira, lo importante es ser constante, no perfecto.",
        "Puedes empezar con 20 minutos al día e ir subiendo.",
        "Eres una persona muy comprometida, eso se nota.",
        "Te paso el plan: tres días a la semana, 30 minutos.",
        "Sé que cuesta. A mí también me costó al inicio.",
        "Haz lo que puedas hoy. Mañana retomamos con energía.",
    ]
    return [{"message": base_messages[i % len(base_messages)], "sender": "pablo", "channel": "wa"} for i in range(50)]


def _w1_dialect_mx() -> dict[str, Any]:
    return {
        "dialecto": "es-MX neutro broad",
        "dialect_evidence": ["uso de 'tú' (tuteo)", "vocabulario neutro accesible", "sin MX slang específico"],
        "wave_confidence": 0.92,
        "wave_warnings": [],
    }


def _w2_vocab_mx() -> dict[str, Any]:
    return {
        "vocabulario": ["paso a paso", "ser constante", "puedes empezar", "te entiendo", "haz lo que puedas"],
        "emoji_style": "minimal",
        "favorite_emojis": [],
        "filler_phrases": ["mira", "perfecto", "bueno"],
        "wave_confidence": 0.85,
        "wave_warnings": [],
    }


def _w3_register_mx() -> dict[str, Any]:
    return {
        "registro": "amable directo neutro — cálido sin coloquialismos regionales",
        "energy_level": "media",
        "warmth_level": "amable",
        "humor_type": "none",
        "verbosity": "medio",
        "wave_confidence": 0.83,
        "wave_warnings": [],
    }


def _w4_compile_mx() -> dict[str, Any]:
    return {
        "identidad": "Coach neutro LATAM, comunicador directo y profesional",
        "dialecto": "es-MX neutro broad",
        "vocabulario": ["paso a paso", "ser constante", "puedes empezar", "te entiendo"],
        "registro": "amable directo neutro — cálido sin coloquialismos regionales",
        "asi_no": [
            "NUNCA uses voseo (sos / tenés)",
            "NUNCA uses chilenismos (po / cachai)",
            "NUNCA uses mexicanismos muy locales (chido / órale / wey)",
        ],
        "anclajes": [
            "soy coach, no terapeuta",
            "respeto el ritmo de cada persona",
            "claridad antes que coloquialismo",
        ],
        "validation_score_adjustment": 0.0,
        "wave_confidence": 0.90,
        "wave_warnings": [],
    }


def _seed_cost(call_id: str, amount: Decimal) -> bool:
    try:
        from time import monotonic

        from luana_core_observability.recording import cost_recorder  # type: ignore[import-not-found]

        with cost_recorder._lock:  # noqa: SLF001
            cost_recorder._cache[call_id] = (amount, monotonic() + 60.0)
        return True
    except ImportError:
        return False


@dataclass
class FakeLiteLLMService:
    specs_by_role: dict[str, list[Any]] = field(default_factory=dict)

    async def ainvoke_text(self, *, role: str, prompt: str, timeout_sec: float) -> _LLMResponse:
        spec_list = self.specs_by_role.get(role, [])
        spec = spec_list.pop(0) if spec_list else {"content_json": {}, "cost_usd": None}
        call_id = f"litellm-pablo-{uuid.uuid4()}"
        if spec.get("cost_usd") is not None:
            _seed_cost(call_id, spec["cost_usd"])
        return _LLMResponse(
            content=json.dumps(spec["content_json"], ensure_ascii=False),
            litellm_call_id=call_id if spec.get("cost_usd") is not None else None,
        )


def _build_pablo_specs() -> dict[str, list[dict[str, Any]]]:
    return {
        "nano": [{"content_json": _w1_dialect_mx(), "cost_usd": Decimal("0.015")}],
        "reasoning": [
            {"content_json": _w2_vocab_mx(), "cost_usd": Decimal("0.050")},
            {"content_json": _w3_register_mx(), "cost_usd": Decimal("0.040")},
            {"content_json": _w4_compile_mx(), "cost_usd": Decimal("0.040")},
        ],
    }


@pytest.mark.asyncio
async def test_pablo_mx_distillation_detects_neutro_dialect() -> None:
    """V-AE-30 fixture 3: Pablo MX → es-MX neutro broad detected."""
    llm = FakeLiteLLMService(specs_by_role=_build_pablo_specs())
    extractor = VoiceDistillationOrchestrator(llm_service=llm)

    compiled = await extractor.run(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        chat_samples=_pablo_50_chats(),
        country="MX",
    )

    assert "es-MX" in compiled.dialecto or "neutro" in compiled.dialecto.lower()
    assert compiled.confidence_score >= MIN_ACCEPTABLE_CONFIDENCE


@pytest.mark.asyncio
async def test_pablo_mx_asi_no_excludes_regional_slang() -> None:
    """The neutro fixture flags voseo + chilenismos + mexicanismos as forbidden."""
    llm = FakeLiteLLMService(specs_by_role=_build_pablo_specs())
    extractor = VoiceDistillationOrchestrator(llm_service=llm)

    compiled = await extractor.run(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        chat_samples=_pablo_50_chats(),
        country="MX",
    )

    asi_no_text = " ".join(compiled.asi_no).lower()
    assert "voseo" in asi_no_text
    assert "chilenismo" in asi_no_text or "po " in asi_no_text or "cachai" in asi_no_text


@pytest.mark.asyncio
async def test_pablo_mx_no_voseo_in_compiled_voice() -> None:
    """Crucial: Pablo MX compiled voice MUST NOT contain voseo conjugations."""
    llm = FakeLiteLLMService(specs_by_role=_build_pablo_specs())
    extractor = VoiceDistillationOrchestrator(llm_service=llm)

    compiled = await extractor.run(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        chat_samples=_pablo_50_chats(),
        country="MX",
    )

    vocab_text = " ".join(compiled.vocabulario).lower()
    # Voseo conjugation patterns must NOT survive.
    assert " sos " not in f" {vocab_text} "
    assert "tenés" not in vocab_text
    assert "podés" not in vocab_text
    assert "querés" not in vocab_text


@pytest.mark.asyncio
async def test_pablo_mx_compiles_to_system_instruction() -> None:
    llm = FakeLiteLLMService(specs_by_role=_build_pablo_specs())
    extractor = VoiceDistillationOrchestrator(llm_service=llm)

    compiled = await extractor.run(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        chat_samples=_pablo_50_chats(),
        country="MX",
    )

    system_instruction = compile_voice_to_system_instruction(compiled)
    assert "BLOQUE 1" in system_instruction
    assert "BLOQUE 5" in system_instruction
