"""Comunify voice cloning pipeline (Story 12 NEW vs Story 11 vitalia OFF).

Public surface:

* ``VoiceDistillationOrchestrator`` — 4-wave pipeline 50+ chats → CompiledVoice v2.
  Extends ``luana_core_extraction.base_orchestrator.BaseExtractionOrchestrator``.
* ``CompiledVoice`` — schema-cemented Pydantic 6-bloque output (frozen v1).
* ``samples_parser`` — WhatsApp ZIP + voice notes ingestion (T-voice-2).
* ``compiler_integration`` — bridge to PersonalityCompiler v2 (T-voice-3).

R23 production_code=true → Opus 4.7 EXCLUSIVE (06-tickets.yaml T-voice-{1..4}).
"""

from src.modules.comunify.brand.voice_cloning._schemas import (
    CompiledVoice,
    VoiceExtractionWave,
)
from src.modules.comunify.brand.voice_cloning.voice_distillation_orchestrator import (
    DEFAULT_COST_BUDGET_USD,
    EXTRACTOR_VERSION,
    MIN_ACCEPTABLE_CONFIDENCE,
    VoiceDistillationOrchestrator,
)

__all__ = [
    "DEFAULT_COST_BUDGET_USD",
    "EXTRACTOR_VERSION",
    "MIN_ACCEPTABLE_CONFIDENCE",
    "CompiledVoice",
    "VoiceDistillationOrchestrator",
    "VoiceExtractionWave",
]
