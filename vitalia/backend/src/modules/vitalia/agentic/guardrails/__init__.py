"""Vitalia agentic guardrails — registered via EP-13 in extensions.py.

Skeleton package created Story 11 T-extensions-1. Guardrail implementations land in:
  T-guards-1 → medical_safety_no_diagnosis
  T-guards-2 → medical_safety_no_prescription
  T-guards-3 → medical_disclaimer_required + prompt_injection_block_reuse  ← LANDED
"""

from src.modules.vitalia.agentic.guardrails.medical_disclaimer_required import (
    DISCLAIMER_TEXT,
    MEDICAL_TRIGGER_PATTERNS,
    apply_medical_disclaimer,
    medical_disclaimer_required_check,
    response_already_has_disclaimer,
    response_mentions_medical_topic,
)
from src.modules.vitalia.agentic.guardrails.prompt_injection_block_reuse import (
    REFUSAL_RESPONSE,
    SANDBOX_MARKER_BEGIN,
    SANDBOX_MARKER_END,
    PromptInjectionResult,
    detect_prompt_injection,
    prompt_injection_block_check,
)

__all__ = [
    # medical_disclaimer_required (T-guards-3)
    "DISCLAIMER_TEXT",
    "MEDICAL_TRIGGER_PATTERNS",
    "apply_medical_disclaimer",
    "medical_disclaimer_required_check",
    "response_already_has_disclaimer",
    "response_mentions_medical_topic",
    # prompt_injection_block_reuse (T-guards-3)
    "PromptInjectionResult",
    "REFUSAL_RESPONSE",
    "SANDBOX_MARKER_BEGIN",
    "SANDBOX_MARKER_END",
    "detect_prompt_injection",
    "prompt_injection_block_check",
]
