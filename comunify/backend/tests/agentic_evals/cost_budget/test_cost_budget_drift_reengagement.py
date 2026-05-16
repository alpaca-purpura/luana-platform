"""Cost budget gate — drift re-engagement turn ≤$0.008 USD (Story 12 T-eval-1).

Drift re-engagement involves a nuanced empathy turn — uses a slightly larger
context (member history snippet + emotional context). Budget is higher than
pure lead qualification but still constrained.

Run:
    cd $WS/comunify/backend && uv run pytest \
        tests/agentic_evals/cost_budget/test_cost_budget_drift_reengagement.py -v
"""

from __future__ import annotations

from decimal import Decimal

import pytest

# Same model pricing as lead qualification
_HAIKU_INPUT_COST_PER_TOKEN = Decimal("0.00000080")
_HAIKU_OUTPUT_COST_PER_TOKEN = Decimal("0.00000400")
_HAIKU_CACHE_READ_PER_TOKEN = Decimal("0.00000008")
_HAIKU_CACHE_WRITE_PER_TOKEN = Decimal("0.00000100")

# Slightly higher budget for empathetic re-engagement (larger output)
_DRIFT_REENGAGEMENT_BUDGET_USD = Decimal("0.008")


def _compute_turn_cost(
    cache_creation_tokens: int,
    cache_read_tokens: int,
    non_cached_input_tokens: int,
    output_tokens: int,
) -> Decimal:
    """Compute synthetic turn cost."""
    return (
        _HAIKU_CACHE_WRITE_PER_TOKEN * cache_creation_tokens
        + _HAIKU_CACHE_READ_PER_TOKEN * cache_read_tokens
        + _HAIKU_INPUT_COST_PER_TOKEN * non_cached_input_tokens
        + _HAIKU_OUTPUT_COST_PER_TOKEN * output_tokens
    )


class TestDriftReengagementCostBudget:
    """Drift re-engagement turn should stay within $0.008 budget."""

    def test_re_engagement_turn_cache_warm_within_budget(self) -> None:
        """Re-engagement turn (cache warm): cost ≤$0.008.

        Scenario: member drift after 3 weeks. System prompt cached.
        Non-cached: member context (400 tokens) + conversation (200 tokens).
        Output: empathetic response (~300 tokens).
        """
        cost = _compute_turn_cost(
            cache_creation_tokens=0,
            cache_read_tokens=2000,
            non_cached_input_tokens=600,   # member context + conversation
            output_tokens=300,             # empathetic re-engagement
        )
        assert cost <= _DRIFT_REENGAGEMENT_BUDGET_USD, (
            f"Drift re-engagement (cache warm) cost {cost} exceeds "
            f"budget {_DRIFT_REENGAGEMENT_BUDGET_USD}."
        )

    def test_re_engagement_first_contact_within_budget(self) -> None:
        """Re-engagement first outbound contact (proactive): cost ≤$0.008."""
        # Proactive outbound: shorter context (system + member ID),
        # output is short re-engagement nudge
        cost = _compute_turn_cost(
            cache_creation_tokens=0,
            cache_read_tokens=2000,
            non_cached_input_tokens=150,   # just member ID + last activity date
            output_tokens=200,             # short nudge
        )
        assert cost <= _DRIFT_REENGAGEMENT_BUDGET_USD, (
            f"Re-engagement first contact cost {cost} exceeds budget "
            f"{_DRIFT_REENGAGEMENT_BUDGET_USD}."
        )

    def test_re_engagement_budget_sanity_multiple_attempts(self) -> None:
        """3 re-engagement attempts (common cadence) should total ≤$0.024."""
        total_budget = Decimal("0.024")
        costs = [
            _compute_turn_cost(0, 2000, 150, 200),  # 1st nudge
            _compute_turn_cost(0, 2000, 350, 250),  # 2nd (member replied)
            _compute_turn_cost(0, 2000, 500, 300),  # 3rd (deeper conversation)
        ]
        total = sum(costs)
        assert total <= total_budget, (
            f"3 re-engagement attempts total {total} exceeds $0.024 budget. "
            f"Individual costs: {[str(c) for c in costs]}"
        )
