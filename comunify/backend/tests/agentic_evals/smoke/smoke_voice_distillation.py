"""Smoke test — voice distillation pipeline end-to-end glue.

T-voice-4 smoke acceptance: pipeline produces a CompiledVoice + bridge
compiles + (mocked) cache invalidator fires. NOT a deep correctness test
— just the pipes between modules.
"""

from __future__ import annotations

import json
import uuid
from dataclasses import dataclass, field
from typing import Any

import pytest

from src.modules.comunify.application.event_handlers.voice_ratified_handler import (
    handle_voice_ratified,
)
from src.modules.comunify.brand.voice_cloning._schemas import CompiledVoice
from src.modules.comunify.brand.voice_cloning.compiler_integration import (
    bridge_compiled_voice_to_personality_profile,
)
from src.modules.comunify.brand.voice_cloning.voice_distillation_orchestrator import (
    VoiceDistillationOrchestrator,
)
from src.modules.comunify.copilot.extractors.offer_ladder_advisor import _LLMResponse


@dataclass
class _SmokeLLM:
    async def ainvoke_text(self, *, role: str, prompt: str, timeout_sec: float) -> _LLMResponse:
        if role == "nano":
            content = {"dialecto": "es-AR voseo natural", "wave_confidence": 0.9}
        else:
            # 3 reasoning waves — alternate fixtures.
            content = {
                "vocabulario": ["tenés", "dale"],
                "registro": "cercano informal",
                "identidad": "Coach AR",
                "dialecto": "es-AR voseo natural",
                "asi_no": ["NUNCA usted"],
                "anclajes": ["coach, no médica"],
                "wave_confidence": 0.85,
            }
        return _LLMResponse(content=json.dumps(content), litellm_call_id=None)


@dataclass
class _SmokeProfileWriter:
    last_version: int = 0

    async def update_voice(self, *, tenant_id, system_instruction, compiled_voice_metadata) -> int:
        self.last_version += 1
        return self.last_version


@dataclass
class _SmokeBus:
    published: list[dict[str, Any]] = field(default_factory=list)

    async def publish(self, *, event_type, tenant_id, payload) -> None:
        self.published.append({"event_type": event_type, "tenant_id": tenant_id, "payload": payload})


@dataclass
class _SmokeCache:
    invalidated: list[dict[str, Any]] = field(default_factory=list)

    async def invalidate_brand_voice_slot(self, *, tenant_id, previous_version, new_version) -> None:
        self.invalidated.append(
            {"tenant_id": tenant_id, "previous_version": previous_version, "new_version": new_version}
        )


@pytest.mark.asyncio
async def test_smoke_end_to_end_distillation_to_cache_invalidation() -> None:
    """Smoke: distill → bridge → emit VoiceRatifiedV1 → handler invalidates cache."""
    tenant_id = uuid.uuid4()
    job_id = uuid.uuid4()

    extractor = VoiceDistillationOrchestrator(llm_service=_SmokeLLM())
    compiled = await extractor.run(
        tenant_id=tenant_id,
        job_id=job_id,
        chat_samples=[
            {"message": "Dale che, vamos.", "sender": "x", "channel": "wa"},
        ]
        * 50,
        country="AR",
    )

    assert isinstance(compiled, CompiledVoice)

    writer = _SmokeProfileWriter()
    bus = _SmokeBus()
    result = await bridge_compiled_voice_to_personality_profile(
        tenant_id=tenant_id,
        job_id=job_id,
        compiled=compiled,
        profile_writer=writer,
        event_bus=bus,
    )

    assert len(bus.published) == 1
    voice_ratified_payload = bus.published[0]["payload"]

    cache = _SmokeCache()
    ok = await handle_voice_ratified(
        payload=voice_ratified_payload,
        cache_invalidator=cache,
        previous_version=result.personality_profile_version - 1,
    )

    assert ok is True
    assert len(cache.invalidated) == 1
