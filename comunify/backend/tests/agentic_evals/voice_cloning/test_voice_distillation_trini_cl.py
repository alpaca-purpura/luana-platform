"""End-to-end voice cloning fixture — Trini CL (es-CL tuteo chileno).

T-voice-4 acceptance per 06-tickets.yaml + V-AE-30:
  * 50-chat sample dataset in es-CL tuteo chileno style.
  * Pipeline produces CompiledVoice with dialecto containing 'es-CL'.
  * No voseo leakage (Chilean Spanish uses tuteo, NOT voseo).
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


def _trini_50_chats() -> list[dict[str, Any]]:
    """50 chat samples in es-CL tuteo chileno (no voseo, no PII)."""
    base_messages = [
        "Hola po! ¿Cómo estay? Cuéntame qué pasa.",
        "Cachai, es importante que tomes este paso.",
        "Te tengo harta paciencia, no te apurís.",
        "Mira po, lo que necesitas es enfocarte en una sola cosa.",
        "Bacán que estés acá. Vamos a sacarlo adelante juntas.",
        "Échale para adelante, fíjate qué resultados saca.",
        "Cuídate harto, ¿ya? Y me cuentas mañana cómo te fue.",
        "Filete, ya tienes una primera meta concreta.",
        "No te complikes po, partamos con esto y vemos.",
        "¿Ya viste el material? Si tienes dudas me preguntái no más.",
    ]
    return [{"message": base_messages[i % len(base_messages)], "sender": "trini", "channel": "wa"} for i in range(50)]


def _w1_dialect_cl() -> dict[str, Any]:
    return {
        "dialecto": "es-CL tuteo chileno",
        "dialect_evidence": ["'po' (modal chileno)", "'cachai' (modismo CL)", "'bacán' (chilenismo)"],
        "wave_confidence": 0.93,
        "wave_warnings": [],
    }


def _w2_vocab_cl() -> dict[str, Any]:
    return {
        "vocabulario": ["cachai", "bacán", "filete", "cuídate harto", "no te complikes po"],
        "emoji_style": "minimal",
        "favorite_emojis": ["💛"],
        "filler_phrases": ["po", "cachai", "no más"],
        "wave_confidence": 0.88,
        "wave_warnings": [],
    }


def _w3_register_cl() -> dict[str, Any]:
    return {
        "registro": "cercano informal coloquial chileno — calidez con simpleza",
        "energy_level": "media",
        "warmth_level": "amable",
        "humor_type": "playful",
        "verbosity": "corto",
        "wave_confidence": 0.85,
        "wave_warnings": [],
    }


def _w4_compile_cl() -> dict[str, Any]:
    return {
        "identidad": "Coach chilena cercana, comunicadora directa con cariño",
        "dialecto": "es-CL tuteo chileno",
        "vocabulario": ["cachai", "bacán", "filete", "cuídate harto"],
        "registro": "cercano informal coloquial chileno — calidez con simpleza",
        "asi_no": [
            "NUNCA uses 'usted' formal",
            "NUNCA copies voseo argentino (sos / tenés)",
            "NUNCA hables como si fueras de otro país",
        ],
        "anclajes": [
            "soy coach, no terapeuta — derivo cuando corresponde",
            "respeto el ritmo de cada persona",
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
        call_id = f"litellm-trini-{uuid.uuid4()}"
        if spec.get("cost_usd") is not None:
            _seed_cost(call_id, spec["cost_usd"])
        return _LLMResponse(
            content=json.dumps(spec["content_json"], ensure_ascii=False),
            litellm_call_id=call_id if spec.get("cost_usd") is not None else None,
        )


def _build_trini_specs() -> dict[str, list[dict[str, Any]]]:
    return {
        "nano": [{"content_json": _w1_dialect_cl(), "cost_usd": Decimal("0.015")}],
        "reasoning": [
            {"content_json": _w2_vocab_cl(), "cost_usd": Decimal("0.050")},
            {"content_json": _w3_register_cl(), "cost_usd": Decimal("0.040")},
            {"content_json": _w4_compile_cl(), "cost_usd": Decimal("0.040")},
        ],
    }


@pytest.mark.asyncio
async def test_trini_cl_distillation_detects_tuteo_chileno() -> None:
    """V-AE-30 fixture 2: Trini CL → es-CL tuteo chileno detected."""
    llm = FakeLiteLLMService(specs_by_role=_build_trini_specs())
    extractor = VoiceDistillationOrchestrator(llm_service=llm)

    compiled = await extractor.run(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        chat_samples=_trini_50_chats(),
        country="CL",
    )

    assert "es-CL" in compiled.dialecto
    assert "tuteo" in compiled.dialecto.lower()
    assert compiled.confidence_score >= MIN_ACCEPTABLE_CONFIDENCE


@pytest.mark.asyncio
async def test_trini_cl_no_voseo_leakage_in_asi_no() -> None:
    """Chilean fixture explicitly flags voseo as forbidden — asi_no contains it."""
    llm = FakeLiteLLMService(specs_by_role=_build_trini_specs())
    extractor = VoiceDistillationOrchestrator(llm_service=llm)

    compiled = await extractor.run(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        chat_samples=_trini_50_chats(),
        country="CL",
    )

    asi_no_text = " ".join(compiled.asi_no).lower()
    assert "voseo" in asi_no_text or "sos" in asi_no_text


@pytest.mark.asyncio
async def test_trini_cl_chilenismos_in_vocabulario() -> None:
    """Chilean-specific phrases survive to the compiled vocabulary."""
    llm = FakeLiteLLMService(specs_by_role=_build_trini_specs())
    extractor = VoiceDistillationOrchestrator(llm_service=llm)

    compiled = await extractor.run(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        chat_samples=_trini_50_chats(),
        country="CL",
    )

    chilenismos = ["cachai", "bacán", "filete"]
    vocab_text = " ".join(compiled.vocabulario).lower()
    assert any(c in vocab_text for c in chilenismos)


@pytest.mark.asyncio
async def test_trini_cl_compiles_to_system_instruction() -> None:
    llm = FakeLiteLLMService(specs_by_role=_build_trini_specs())
    extractor = VoiceDistillationOrchestrator(llm_service=llm)

    compiled = await extractor.run(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        chat_samples=_trini_50_chats(),
        country="CL",
    )

    system_instruction = compile_voice_to_system_instruction(compiled)
    assert "BLOQUE 1" in system_instruction
    assert "BLOQUE 5" in system_instruction
