"""Arch fitness gate — ``VoiceDistillationOrchestrator`` MUST inherit from
``luana_core_extraction.base_orchestrator.BaseExtractionOrchestrator``.

Source: 06-tickets.yaml::T-voice-1 acceptance + 03-arch-agentic.md § 5.4.

Cement: anti-duplication.md SSoT row "Extraction orchestrator" — wave-based
LLM extraction lifts shared base, never mirrors. Sibling gates:
  * ``vitalia/backend/tests/architecture/test_extraction_orchestrator_inheritance.py``
  * ``nicolify/backend/tests/architecture/test_extraction_orchestrator_inheritance.py``

This gate is comunify-specific and additive — Story 12 voice cloning is a
NEW orchestrator added 2026-05-14.
"""

from __future__ import annotations

from luana_core_extraction.base_orchestrator import BaseExtractionOrchestrator

from src.modules.comunify.brand.voice_cloning.voice_distillation_orchestrator import (
    VoiceDistillationOrchestrator,
)


def test_voice_distillation_subclasses_base_extraction_orchestrator() -> None:
    """T-voice-1 acceptance A1: VoiceDistillationOrchestrator MUST inherit
    from BaseExtractionOrchestrator per anti-duplication.md row.
    """
    assert issubclass(VoiceDistillationOrchestrator, BaseExtractionOrchestrator), (
        "VoiceDistillationOrchestrator MUST inherit from "
        "luana_core_extraction.base_orchestrator.BaseExtractionOrchestrator "
        "per .claude/rules/anti-duplication.md SSoT row "
        "'Extraction orchestrator' + 03-arch-agentic.md § 5.4."
    )


def test_voice_distillation_inherits_shared_wave_helpers() -> None:
    """Subclass corollary: shared wave + pause + announce helpers accessible.

    These are provided by ``BaseExtractionOrchestrator`` — subclasses MUST
    NOT redefine them (anti-duplication invariant).
    """

    # Instantiation requires an llm_service collaborator; use a stub Protocol
    # implementer for the arch fitness check (no LLM call performed).
    class _StubLLM:
        async def ainvoke_text(self, *, role: str, prompt: str, timeout_sec: float) -> None:  # type: ignore[empty-body]
            ...

    extractor = VoiceDistillationOrchestrator(llm_service=_StubLLM())  # type: ignore[arg-type]
    assert hasattr(extractor, "_run_wave")
    assert hasattr(extractor, "_pause_between_waves")
    assert hasattr(extractor, "_announce_sections")
    assert hasattr(extractor, "_get_wave_delay")


def test_voice_distillation_log_prefix_is_comunify_specific() -> None:
    """``log_prefix`` is vertical-creator-economy specific (not generic)."""
    assert VoiceDistillationOrchestrator.log_prefix == "comunify_voice_distillation"


def test_voice_distillation_4_waves_match_spec() -> None:
    """4 waves with names + roles + timeouts per 03-arch-agentic § 5.3."""
    waves = VoiceDistillationOrchestrator._define_waves()
    assert len(waves) == 4
    assert [w.name for w in waves] == [
        "dialect_detection",
        "vocabulary_anchors_extraction",
        "register_tone_profile",
        "validate_and_compile_v2",
    ]
    # W1 nano (Haiku 4.5), W2/W3/W4 reasoning (Sonnet 4.6) — per spec.
    assert [w.model_role for w in waves] == ["nano", "reasoning", "reasoning", "reasoning"]
    # Timeouts mirror spec budget (≤20 / ≤40 / ≤30 / ≤30).
    assert [w.timeout_sec for w in waves] == [20.0, 40.0, 30.0, 30.0]


def test_voice_distillation_confidence_weights_sum_to_one() -> None:
    """Aggregate confidence weights across waves must sum to 1.0 (sanity)."""
    waves = VoiceDistillationOrchestrator._define_waves()
    total = sum(w.confidence_weight for w in waves)
    # Floating-point tolerance.
    assert abs(total - 1.0) < 0.001, f"Wave confidence weights must sum to 1.0, got {total}"
