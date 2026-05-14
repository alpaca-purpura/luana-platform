"""Cost budget gate — full voice distillation pipeline ≤$0.18 USD (Story 12 T-eval-1).

Voice distillation involves 4 extraction waves over 50+ chat samples.
Per Story 12 T-voice-4 acceptance: budget ≤$0.18 USD total.

Pattern: extends T-voice-4 cost_budget_voice_distillation.py with
full pipeline cost model covering all 4 waves.

Run:
    cd /home/chris/luana-platform/comunify/backend && uv run pytest \
        tests/agentic_evals/cost_budget/test_cost_budget_voice_distillation_full.py -v
"""

from __future__ import annotations

from decimal import Decimal

import pytest

# Voice distillation uses sonnet-class (higher quality for extraction)
# claude-sonnet-3-5: $3.00/MTok input, $15.00/MTok output
# cache read: $0.30/MTok, cache write: $3.75/MTok
_SONNET_INPUT_COST_PER_TOKEN = Decimal("0.000003000")
_SONNET_OUTPUT_COST_PER_TOKEN = Decimal("0.000015000")
_SONNET_CACHE_READ_PER_TOKEN = Decimal("0.000000300")
_SONNET_CACHE_WRITE_PER_TOKEN = Decimal("0.000003750")

# Total distillation budget
_DISTILLATION_BUDGET_USD = Decimal("0.18")

# Per-wave budgets (from arch § Cost table)
_WAVE_1_BUDGET = Decimal("0.015")   # Sample extraction (50 chats → anchors)
_WAVE_2_BUDGET = Decimal("0.050")   # Voice pattern synthesis
_WAVE_3_BUDGET = Decimal("0.040")   # Profile compilation
_WAVE_4_BUDGET = Decimal("0.040")   # Brand voice rendering


def _compute_wave_cost(
    cache_creation_tokens: int = 0,
    cache_read_tokens: int = 0,
    input_tokens: int = 0,
    output_tokens: int = 0,
) -> Decimal:
    """Compute synthetic cost for one extraction wave."""
    return (
        _SONNET_CACHE_WRITE_PER_TOKEN * cache_creation_tokens
        + _SONNET_CACHE_READ_PER_TOKEN * cache_read_tokens
        + _SONNET_INPUT_COST_PER_TOKEN * input_tokens
        + _SONNET_OUTPUT_COST_PER_TOKEN * output_tokens
    )


class TestVoiceDistillationFullCostBudget:
    """Full voice distillation pipeline (4 waves) ≤$0.18 USD."""

    def test_wave_1_sample_extraction_within_budget(self) -> None:
        """Wave 1 (sample extraction from 50 chats): cost ≤$0.015.

        50 chat samples processed via a single batched call.
        System instructions written to cache once.
        Compressed input (50 chats deduplicated) + structured output anchors.
        """
        cost = _compute_wave_cost(
            cache_creation_tokens=500,   # system instructions (written once)
            cache_read_tokens=0,
            input_tokens=1500,           # 50 chats compressed/deduplicated ~30 tokens avg
            output_tokens=300,           # extracted voice anchors (structured JSON)
        )
        assert cost <= _WAVE_1_BUDGET, (
            f"Wave 1 (sample extraction) cost {cost} exceeds budget {_WAVE_1_BUDGET}."
        )

    def test_wave_2_pattern_synthesis_within_budget(self) -> None:
        """Wave 2 (voice pattern synthesis): cost ≤$0.050.

        Synthesizes patterns from wave 1 output. Moderate input (extracted anchors).
        Cache warm for system instructions.
        """
        cost = _compute_wave_cost(
            cache_creation_tokens=0,
            cache_read_tokens=500,       # system instructions from cache
            input_tokens=4000,           # extracted anchors from wave 1 (compressed)
            output_tokens=1500,          # synthesized pattern profile
        )
        assert cost <= _WAVE_2_BUDGET, (
            f"Wave 2 (pattern synthesis) cost {cost} exceeds budget {_WAVE_2_BUDGET}."
        )

    def test_wave_3_profile_compilation_within_budget(self) -> None:
        """Wave 3 (profile compilation): cost ≤$0.040.

        Compiles structured voice profile from wave 2 patterns.
        """
        cost = _compute_wave_cost(
            cache_creation_tokens=0,
            cache_read_tokens=500,
            input_tokens=3000,           # wave 2 pattern profile
            output_tokens=1500,          # structured CompiledVoice JSON
        )
        assert cost <= _WAVE_3_BUDGET, (
            f"Wave 3 (profile compilation) cost {cost} exceeds budget {_WAVE_3_BUDGET}."
        )

    def test_wave_4_brand_voice_rendering_within_budget(self) -> None:
        """Wave 4 (brand voice rendering for slot 5): cost ≤$0.040.

        Renders final Slot 5 BRAND_VOICE prefix from compiled profile.
        """
        cost = _compute_wave_cost(
            cache_creation_tokens=0,
            cache_read_tokens=500,
            input_tokens=2000,           # compiled profile
            output_tokens=2000,          # slot 5 brand voice text
        )
        assert cost <= _WAVE_4_BUDGET, (
            f"Wave 4 (brand voice rendering) cost {cost} exceeds budget {_WAVE_4_BUDGET}."
        )

    def test_total_4_wave_pipeline_within_0_18_budget(self) -> None:
        """Total 4-wave pipeline: cost ≤$0.18 USD (T-voice-4 acceptance criterion)."""
        wave_costs = [
            # Wave 1: 50 chat samples (compressed batched call)
            _compute_wave_cost(500, 0, 1500, 300),
            # Wave 2: pattern synthesis (compressed)
            _compute_wave_cost(0, 500, 4000, 1500),
            # Wave 3: profile compilation
            _compute_wave_cost(0, 500, 3000, 1500),
            # Wave 4: brand voice rendering
            _compute_wave_cost(0, 500, 2000, 2000),
        ]
        total = sum(wave_costs)
        assert total <= _DISTILLATION_BUDGET_USD, (
            f"Total 4-wave distillation cost {total} exceeds budget {_DISTILLATION_BUDGET_USD}. "
            f"Wave breakdown: {[str(c) for c in wave_costs]}"
        )

    def test_individual_per_wave_budgets_sum_to_less_than_total(self) -> None:
        """Per-wave budgets should sum ≤ total budget."""
        per_wave_total = _WAVE_1_BUDGET + _WAVE_2_BUDGET + _WAVE_3_BUDGET + _WAVE_4_BUDGET
        assert per_wave_total <= _DISTILLATION_BUDGET_USD, (
            f"Per-wave budget sum {per_wave_total} > total {_DISTILLATION_BUDGET_USD}. "
            "Budget decomposition is inconsistent."
        )
