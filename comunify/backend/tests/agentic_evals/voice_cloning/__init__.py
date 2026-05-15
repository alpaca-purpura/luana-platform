"""Comunify voice cloning agentic eval suite (T-voice-1..4).

Covers:
  * test_voice_distillation_orchestrator_smoke.py — T-voice-1 smoke + edges
  * test_voice_samples_pii_sanitized.py — T-voice-2 PII sanitization
  * test_voice_compiler_integration.py — T-voice-3 bridge to PersonalityCompiler
  * test_voice_distillation_{anabella_ar,trini_cl,pablo_mx,low_confidence}.py
    — T-voice-4 end-to-end 3 fixtures + low confidence path
"""
