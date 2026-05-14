"""Cost budget gate — voice distillation ≤$0.18 USD/50 chats.

T-voice-4 acceptance + V-AE-21 SSoT (03-arch-agentic § Cost-per-tool table).

Strategy:
  * Build 4-wave fake LLM with cost spec per wave.
  * Run distillation.
  * Assert no ``cost_budget_exceeded`` warning surfaced for the happy-path
    cost profile (0.015 + 0.05 + 0.04 + 0.04 = 0.145 USD).
  * Assert the warning DOES surface when a single wave breaks the per-wave
    or the aggregate budget.

Skips when observability cost bridge unavailable.
"""

from __future__ import annotations

import json
import uuid
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any

import pytest

from src.modules.comunify.brand.voice_cloning.voice_distillation_orchestrator import (
    DEFAULT_COST_BUDGET_USD,
    VoiceDistillationOrchestrator,
)
from src.modules.comunify.copilot.extractors.offer_ladder_advisor import _LLMResponse


def _seed_cost(call_id: str, amount: Decimal) -> bool:
    try:
        from time import monotonic

        from luana_core_observability.recording import cost_recorder  # type: ignore[import-not-found]

        with cost_recorder._lock:  # noqa: SLF001
            cost_recorder._cache[call_id] = (amount, monotonic() + 60.0)
        return True
    except ImportError:
        return False


_COST_RECORDER_AVAILABLE = _seed_cost("__cost_budget_probe__", Decimal("0"))


@dataclass
class _CostLLM:
    cost_per_role: dict[str, Decimal] = field(default_factory=dict)
    calls: int = 0

    async def ainvoke_text(self, *, role: str, prompt: str, timeout_sec: float) -> _LLMResponse:
        self.calls += 1
        # Build a generic content payload so wave_confidence is OK.
        if role == "nano":
            content = {"dialecto": "es-AR voseo natural", "wave_confidence": 0.85}
        elif self.calls == 2:
            content = {"vocabulario": ["dale", "vamos"], "registro": "cercano", "wave_confidence": 0.8}
        elif self.calls == 3:
            content = {"registro": "cercano informal", "wave_confidence": 0.8}
        else:
            content = {
                "identidad": "Coach AR",
                "dialecto": "es-AR voseo natural",
                "vocabulario": ["dale"],
                "registro": "cercano",
                "asi_no": ["NUNCA usted"],
                "anclajes": ["coach"],
                "wave_confidence": 0.85,
            }
        call_id = f"litellm-cost-{uuid.uuid4()}"
        if role in self.cost_per_role:
            _seed_cost(call_id, self.cost_per_role[role])
        return _LLMResponse(
            content=json.dumps(content),
            litellm_call_id=call_id if role in self.cost_per_role else None,
        )


def _50_chats() -> list[dict[str, Any]]:
    return [{"message": f"msg {i}", "sender": "x", "channel": "wa"} for i in range(50)]


@pytest.mark.asyncio
async def test_cost_budget_happy_path_under_018_usd() -> None:
    """V-AE-21: 0.015 + 3 × 0.045 ≈ 0.15 USD ≤ 0.18 budget."""
    if not _COST_RECORDER_AVAILABLE:
        pytest.skip("luana_core_observability cost bridge unavailable")

    # Note: only one cost per role can be seeded at a time; this test uses a
    # uniform cost across reasoning waves. The orchestrator sums all 4.
    extractor = VoiceDistillationOrchestrator(
        llm_service=_CostLLM(
            cost_per_role={
                "nano": Decimal("0.015"),
                "reasoning": Decimal("0.045"),  # × 3 reasoning waves
            }
        ),
    )

    compiled = await extractor.run(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        chat_samples=_50_chats(),
        country="AR",
    )

    cost_warnings = [w for w in compiled.extraction_warnings if "cost_budget_exceeded" in w]
    assert not cost_warnings


@pytest.mark.asyncio
async def test_cost_budget_default_constant_matches_spec() -> None:
    """V-AE-21 SSoT cement: DEFAULT_COST_BUDGET_USD == 0.18 (03-arch-agentic § Cost table)."""
    assert DEFAULT_COST_BUDGET_USD == Decimal("0.18")


@pytest.mark.asyncio
async def test_cost_budget_exceeded_surfaces_warning() -> None:
    """V-AE-21 negative path: aggregate cost > 0.18 → warning emitted."""
    if not _COST_RECORDER_AVAILABLE:
        pytest.skip("observability cost bridge unavailable")

    # Each reasoning wave 0.10 → 3 × 0.10 + 0.015 = 0.315 > 0.18.
    extractor = VoiceDistillationOrchestrator(
        llm_service=_CostLLM(
            cost_per_role={
                "nano": Decimal("0.015"),
                "reasoning": Decimal("0.10"),
            }
        ),
    )

    compiled = await extractor.run(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        chat_samples=_50_chats(),
        country="AR",
    )

    cost_warnings = [w for w in compiled.extraction_warnings if "cost_budget_exceeded" in w]
    assert len(cost_warnings) >= 1


@pytest.mark.asyncio
async def test_cost_budget_lower_kwarg_overrides_default() -> None:
    """Caller can lower budget per-tenant (raise requires CONTRACT bump)."""
    if not _COST_RECORDER_AVAILABLE:
        pytest.skip("observability cost bridge unavailable")

    # 4 × 0.04 = 0.16 — would normally pass under default 0.18.
    # But we lower to 0.10 → must fail.
    extractor = VoiceDistillationOrchestrator(
        llm_service=_CostLLM(
            cost_per_role={
                "nano": Decimal("0.04"),
                "reasoning": Decimal("0.04"),
            }
        ),
        cost_budget_usd=Decimal("0.10"),
    )

    compiled = await extractor.run(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        chat_samples=_50_chats(),
        country="AR",
    )

    cost_warnings = [w for w in compiled.extraction_warnings if "cost_budget_exceeded" in w]
    assert len(cost_warnings) >= 1
