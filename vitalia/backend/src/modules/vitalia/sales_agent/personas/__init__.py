# cap: sales_agent.adrian-3-tools-mvp
# atomics: TBD
# story-origin: TBD
"""Vitalia Adrián sales_agent production personas (5 archetypes).

Story T-ag-tools-2 — 5 default personality archetypes for the medical vertical.
These are PRODUCTION personality_profile configs (consumed by sales_agent compiler
v2 Slot 5 BRAND_VOICE when tenant.personality_profile_id points to a brand default).

Distinct from rubric eval personas at ``docs/specs/personas/archetype-aware/``
(Story 11 T-rubric-1 cement).

Schema per persona YAML:
  persona_id: str (unique within brand)
  vertical: Literal["dental", "estetica", "psicologia", "fertilidad", "general"]
  archetype: "warm_close"  (per brand.yaml::sales_agent.default_personality_archetype)
  dialect_default: str (es-AR | es-MX | es-CL | es-PE | es-CO neutro)
  voice_constraints: dict (tone + forbidden_phrases + allowed_phrases)
  opening: str (one-liner greeter snippet)
  common_objections: list[dict] (with handle_with hint)

Loaded at composition time by sales_agent runtime — NOT in scope this ticket
to wire into engine (that's T-ag-workflows beyond Slice 1 scope).
"""

from __future__ import annotations

from pathlib import Path
from typing import Final

_PERSONAS_DIR: Final[Path] = Path(__file__).parent

_AVAILABLE_PERSONAS: Final[tuple[str, ...]] = (
    "warm_close_default",
    "warm_close_dental",
    "warm_close_estetica",
    "warm_close_psicologia",
    "warm_close_fertilidad",
)


def persona_path(persona_id: str) -> Path:
    """Return filesystem path for a Vitalia sales_agent persona YAML.

    Args:
        persona_id: Persona slug (without .yaml extension).

    Returns:
        Absolute path to the YAML file. Existence is NOT validated here —
        caller should check.
    """
    return _PERSONAS_DIR / f"{persona_id}.yaml"


def available_personas() -> tuple[str, ...]:
    """Return the canonical 5 vitalia sales_agent personas tuple."""
    return _AVAILABLE_PERSONAS


__all__ = ["available_personas", "persona_path"]
