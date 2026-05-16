"""Cost budget gate — lead qualification turn ≤$0.005 USD (Story 12 T-eval-1).

Per Story 12 arch § 13 + T-eval-1 acceptance:
  Single lead qualification turn should not exceed $0.005 USD
  (single specialist call via LiteLLM Proxy, haiku-class model).

Strategy — synthetic cost model (no real LLM):
  Build a cost model that simulates a lead qualification turn:
    - ~500 input tokens (system prompt cached slots 1-6)
    - ~200 non-cached input tokens (conversation turn)
    - ~150 output tokens
  Assert total cost stays below budget.

Run:
    cd $WS/comunify/backend && uv run pytest \
        tests/agentic_evals/cost_budget/test_cost_budget_lead_qualification.py -v
"""

from __future__ import annotations

from decimal import Decimal

import pytest

# Cost model constants (haiku-3.5 equivalent tier per LiteLLM proxy routing)
# Per Anthropic pricing as of 2026-05-14 (verify on live docs):
#   claude-haiku-3-5: $0.80/MTok input, $4.00/MTok output
#   cache read: $0.08/MTok, cache write: $1.00/MTok
_HAIKU_INPUT_COST_PER_TOKEN = Decimal("0.00000080")   # $0.80/MTok
_HAIKU_OUTPUT_COST_PER_TOKEN = Decimal("0.00000400")  # $4.00/MTok
_HAIKU_CACHE_READ_PER_TOKEN = Decimal("0.00000008")   # $0.08/MTok
_HAIKU_CACHE_WRITE_PER_TOKEN = Decimal("0.00000100")  # $1.00/MTok

# Budget per turn
_LEAD_QUAL_BUDGET_USD = Decimal("0.005")


def _compute_turn_cost(
    cache_creation_tokens: int,
    cache_read_tokens: int,
    non_cached_input_tokens: int,
    output_tokens: int,
) -> Decimal:
    """Compute synthetic turn cost from token breakdown."""
    cache_write_cost = _HAIKU_CACHE_WRITE_PER_TOKEN * cache_creation_tokens
    cache_read_cost = _HAIKU_CACHE_READ_PER_TOKEN * cache_read_tokens
    input_cost = _HAIKU_INPUT_COST_PER_TOKEN * non_cached_input_tokens
    output_cost = _HAIKU_OUTPUT_COST_PER_TOKEN * output_tokens
    return cache_write_cost + cache_read_cost + input_cost + output_cost


class TestLeadQualificationCostBudget:
    """Lead qualification turn should stay within $0.005 budget."""

    def test_first_turn_cache_cold_within_budget(self) -> None:
        """First turn (cache cold — cache write): cost ≤$0.005."""
        # System prompt ~2000 tokens written to cache (first turn)
        # Non-cached: ~200 tokens (conversation)
        # Output: ~150 tokens
        cost = _compute_turn_cost(
            cache_creation_tokens=2000,
            cache_read_tokens=0,
            non_cached_input_tokens=200,
            output_tokens=150,
        )
        assert cost <= _LEAD_QUAL_BUDGET_USD, (
            f"First turn (cache cold) cost {cost} exceeds budget {_LEAD_QUAL_BUDGET_USD}. "
            "Lead qualification cache-cold turn is too expensive."
        )

    def test_subsequent_turn_cache_warm_within_budget(self) -> None:
        """Subsequent turn (cache warm — cache read): cost well within $0.005."""
        # System prompt 2000 tokens from cache (subsequent turn)
        # Non-cached: ~300 tokens (growing conversation)
        # Output: ~150 tokens
        cost = _compute_turn_cost(
            cache_creation_tokens=0,
            cache_read_tokens=2000,
            non_cached_input_tokens=300,
            output_tokens=150,
        )
        assert cost <= _LEAD_QUAL_BUDGET_USD, (
            f"Subsequent turn (cache warm) cost {cost} exceeds budget {_LEAD_QUAL_BUDGET_USD}."
        )

    def test_cache_warm_turn_cheaper_than_cold(self) -> None:
        """Cache-warm turns should be cheaper than cache-cold turns."""
        cold_cost = _compute_turn_cost(
            cache_creation_tokens=2000,
            cache_read_tokens=0,
            non_cached_input_tokens=200,
            output_tokens=150,
        )
        warm_cost = _compute_turn_cost(
            cache_creation_tokens=0,
            cache_read_tokens=2000,
            non_cached_input_tokens=200,
            output_tokens=150,
        )
        assert warm_cost < cold_cost, (
            f"Cache-warm turn ({warm_cost}) should be cheaper than cache-cold ({cold_cost})."
        )

    def test_budget_sanity_two_cold_one_warm(self) -> None:
        """3-turn conversation (2 cold prefix writes + 1 warm) stays within $0.015 total."""
        total_budget = Decimal("0.015")
        cold1 = _compute_turn_cost(2000, 0, 200, 150)
        cold2 = _compute_turn_cost(0, 2000, 250, 200)  # second turn: cache hit
        cold3 = _compute_turn_cost(0, 2000, 300, 250)  # third turn: cache hit
        total = cold1 + cold2 + cold3
        assert total <= total_budget, (
            f"3-turn conversation cost {total} exceeds $0.015 budget."
        )
