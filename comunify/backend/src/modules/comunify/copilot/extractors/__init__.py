"""Comunify copilot extractors + KB seed loader.

Created by T-kb-1 (R23 Opus 4.7 production AGENTIC code).

Active modules:

* ``offer_ladder_advisor.py`` — T-extractors-1 (4-wave BaseExtractionOrchestrator subclass)
* ``authority_vault_extractor.py`` — T-extractors-2 (4-wave BaseExtractionOrchestrator subclass)
* ``_kb_seed_loader.py`` — T-kb-1 (Qdrant chunk loader + store wrapper for creator_economy_kb_v1)
* ``_schemas.py`` — shared Pydantic primitives for both extractors

Future tickets land here:

* T-voice-1 — VoiceDistillationOrchestrator (NEW Story 12, 4-wave, brand/voice_cloning/ — separate path)
"""
