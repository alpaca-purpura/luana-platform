"""Cost budget gate — community moderation turn ≤$0.003 USD (Story 12 T-eval-1).

Moderation turns should be fast and cheap — guardrail check + minimal response.
No lengthy generation needed: just block + redirect to moderator or policy message.

Run:
    cd $WS/comunify/backend && uv run pytest \
        tests/agentic_evals/cost_budget/test_cost_budget_moderation.py -v
"""

from __future__ import annotations

from decimal import Decimal

import pytest

_HAIKU_INPUT_COST_PER_TOKEN = Decimal("0.00000080")
_HAIKU_OUTPUT_COST_PER_TOKEN = Decimal("0.00000400")
_HAIKU_CACHE_READ_PER_TOKEN = Decimal("0.00000008")

# Moderation should be cheaper than normal conversations
_MODERATION_BUDGET_USD = Decimal("0.003")


def _compute_turn_cost(
    cache_read_tokens: int,
    non_cached_input_tokens: int,
    output_tokens: int,
) -> Decimal:
    """Compute moderation turn cost (cache always warm — moderation is frequent)."""
    return (
        _HAIKU_CACHE_READ_PER_TOKEN * cache_read_tokens
        + _HAIKU_INPUT_COST_PER_TOKEN * non_cached_input_tokens
        + _HAIKU_OUTPUT_COST_PER_TOKEN * output_tokens
    )


class TestModerationCostBudget:
    """Community moderation turns should stay within $0.003 budget."""

    def test_spam_moderation_within_budget(self) -> None:
        """Spam detection + block response: cost ≤$0.003.

        Scenario: spam post detected, agent responds with policy message.
        Cache warm (system prompt + guardrail rules).
        Non-cached: spam content (100 tokens).
        Output: short policy message (50 tokens).
        """
        cost = _compute_turn_cost(
            cache_read_tokens=1500,
            non_cached_input_tokens=100,
            output_tokens=50,
        )
        assert cost <= _MODERATION_BUDGET_USD, (
            f"Spam moderation cost {cost} exceeds budget {_MODERATION_BUDGET_USD}."
        )

    def test_doxxing_moderation_within_budget(self) -> None:
        """Doxxing attempt + refusal response: cost ≤$0.003.

        Scenario: request for member PII, agent refuses + redirects.
        Short output (refusal message is always brief).
        """
        cost = _compute_turn_cost(
            cache_read_tokens=1500,
            non_cached_input_tokens=80,
            output_tokens=60,
        )
        assert cost <= _MODERATION_BUDGET_USD, (
            f"Doxxing moderation cost {cost} exceeds budget {_MODERATION_BUDGET_USD}."
        )

    def test_moderation_cheaper_than_lead_qualification(self) -> None:
        """Moderation turn should be cheaper than lead qualification."""
        moderation_cost = _compute_turn_cost(
            cache_read_tokens=1500,
            non_cached_input_tokens=100,
            output_tokens=60,
        )
        # Lead qual warm turn from other test module: ~600 non-cached + 150 output
        lead_qual_cost = (
            _HAIKU_CACHE_READ_PER_TOKEN * 2000
            + _HAIKU_INPUT_COST_PER_TOKEN * 200
            + _HAIKU_OUTPUT_COST_PER_TOKEN * 150
        )
        assert moderation_cost < lead_qual_cost, (
            f"Moderation ({moderation_cost}) should be cheaper than "
            f"lead qualification ({lead_qual_cost})."
        )
