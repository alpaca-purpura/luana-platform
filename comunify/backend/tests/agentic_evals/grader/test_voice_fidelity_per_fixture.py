"""Agentic eval — voice fidelity per fixture (Story 12 T-eval-1).

Tests that each creator tenant's voice profile is correctly represented
by the A4 assertion in the grader — specifically that voice_correct=True
yields full credit and voice_correct=False yields reduced (0.4) credit.

Validates the A4 weight=0.15 contribution to final score:
  - voice_correct=True: A4=1.0 → contribution 0.15
  - voice_correct=False: A4=0.4 → contribution 0.06 (reduced by 0.09)

Run:
    cd $WS/comunify/backend && uv run pytest \
        tests/agentic_evals/grader/test_voice_fidelity_per_fixture.py -v
"""

from __future__ import annotations

import pytest

from tests.agentic_evals.grader._internal.maj_eval_comunify import (
    THRESHOLD_DEFAULT,
    WEIGHTS,
    grade_response,
)

# Neutral response fixture (no special voice markers)
_NEUTRAL_RESPONSE = (
    "Hola, el programa está disponible. Puedes ver el detalle completo aquí. "
    "Si tienes dudas adicionales, con gusto te ayudo."
)

# Per-tenant fixtures: synthetic responses with tenant-specific voice markers

# Anabella AR (voseo coaching)
# voseo-allowed: canned response fixture for AR coaching tenant uses voseo
_ANABELLA_AR_RESPONSE = (
    "¡Hola! Qué bueno que te interesa el programa. "
    "Mirá, lo que propone Anabella es un acompañamiento personalizado. "
    "¿Querés que te cuente cómo fue la experiencia de otras chicas?"
)

# Trini CL (tuteo nutrition motivadora)
_TRINI_CL_RESPONSE = (
    "¡Hola! Me alegra que estés aquí. "
    "El programa de nutrición está diseñado para que puedas mantener "
    "hábitos sostenibles a tu propio ritmo. "
    "¿Hay algo específico en lo que quieras trabajar primero?"
)

# Pablo MX (tuteo productividad directo)
_PABLO_MX_RESPONSE = (
    "Hola, bienvenido. El programa es para personas que quieren resultados concretos. "
    "No hay magia, solo sistemas que funcionan si los aplicas. "
    "¿Cuál es el problema de productividad más urgente que enfrentas ahorita?"
)


class TestA4VoiceFidelityWeight:
    """Test A4 assertion weight contribution (0.15) per tenant fixture."""

    def test_voice_correct_gives_full_a4_credit(self) -> None:
        """voice_correct=True → A4=1.0 (full credit, contribution 0.15)."""
        score = grade_response(
            _NEUTRAL_RESPONSE,
            has_safety_keyword=False,
            tenant_voice_correct=True,
            transcript_has_sandbox_markers=True,
        )
        assert score.a4 == 1.0, f"Expected A4=1.0 with voice_correct=True. Got {score.a4}"
        # Verify contribution
        expected_contribution = WEIGHTS["A4"] * 1.0
        actual_contribution = WEIGHTS["A4"] * score.a4
        assert abs(actual_contribution - expected_contribution) < 1e-9

    def test_voice_incorrect_gives_reduced_a4_credit(self) -> None:
        """voice_correct=False → A4=0.4 (reduced credit — voice replaced by generic)."""
        score = grade_response(
            _NEUTRAL_RESPONSE,
            has_safety_keyword=False,
            tenant_voice_correct=False,
            transcript_has_sandbox_markers=True,
        )
        assert score.a4 == 0.4, f"Expected A4=0.4 with voice_correct=False. Got {score.a4}"

    def test_voice_drift_reduces_final_score(self) -> None:
        """Voice drift reduces final score by WEIGHTS['A4'] * (1.0 - 0.4) = 0.09."""
        score_correct = grade_response(
            _NEUTRAL_RESPONSE,
            has_safety_keyword=False,
            tenant_voice_correct=True,
            transcript_has_sandbox_markers=True,
        )
        score_drifted = grade_response(
            _NEUTRAL_RESPONSE,
            has_safety_keyword=False,
            tenant_voice_correct=False,
            transcript_has_sandbox_markers=True,
        )
        delta = score_correct.final - score_drifted.final
        expected_delta = WEIGHTS["A4"] * (1.0 - 0.4)  # 0.15 * 0.6 = 0.09
        assert abs(delta - expected_delta) < 1e-9, (
            f"Voice drift delta={delta:.4f} (expected {expected_delta:.4f})"
        )


class TestPerTenantVoiceFixtures:
    """Sanity tests that per-tenant canned responses pass rubric when voice_correct=True."""

    @pytest.mark.parametrize("response,tenant", [
        (_ANABELLA_AR_RESPONSE, "anabella-coaching-ar"),
        (_TRINI_CL_RESPONSE, "trini-nutrition-cl"),
        (_PABLO_MX_RESPONSE, "pablo-productividad-mx"),
    ])
    def test_tenant_response_passes_rubric_with_correct_voice(
        self, response: str, tenant: str
    ) -> None:
        """Each tenant's canned response MUST pass rubric when voice_correct=True."""
        score = grade_response(
            response,
            has_safety_keyword=False,
            tenant_voice_correct=True,
            transcript_has_sandbox_markers=True,
        )
        assert score.passes_threshold, (
            f"Tenant {tenant!r} canned response FAILED rubric "
            f"(score={score.final:.3f} < {THRESHOLD_DEFAULT}). "
            f"A1={score.a1}, A2={score.a2}, A3={score.a3}, A4={score.a4}, A5={score.a5}"
        )

    @pytest.mark.parametrize("response,tenant", [
        (_ANABELLA_AR_RESPONSE, "anabella-coaching-ar"),
        (_TRINI_CL_RESPONSE, "trini-nutrition-cl"),
        (_PABLO_MX_RESPONSE, "pablo-productividad-mx"),
    ])
    def test_tenant_voice_drift_may_fail_rubric(self, response: str, tenant: str) -> None:
        """Tenant response with voice_correct=False has reduced A4 score (may fall below threshold)."""
        score = grade_response(
            response,
            has_safety_keyword=False,
            tenant_voice_correct=False,
            transcript_has_sandbox_markers=True,
        )
        # This test documents the reduction — not a hard failure since other assertions
        # may carry the score above threshold
        assert score.a4 == 0.4, (
            f"Tenant {tenant!r} with voice drift must have A4=0.4. Got {score.a4}"
        )
