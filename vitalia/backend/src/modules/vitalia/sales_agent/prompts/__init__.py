"""Vitalia Adrián sales_agent prompt slots (compiler v2 layout).

Story T-ag-tools-2 — Slot 2 (medical_vertical) + Slot 4 (medical_safety_rails)
+ Slot 5 base persona (adrian_persona_base) MDs.

Slot 4 MEDICAL_SAFETY_RAILS canonical content lives at
``vitalia/backend/src/modules/vitalia/agentic/prompts/slot_4_medical_safety_rails.j2``
(Story 11 T-prompts-1 cement). The ``medical_safety_rails.md`` here is a
documentation-anchor pointer that READS the canonical j2 file. NO content
duplication — per anti-duplication.md § Regla cardinal.

Cache safety (per claude-api anchored 2026-05-18):
- NO timestamps in slot text
- NO conversation_id / turn_counter / random IDs in slot text
- NO tenant_name interpolated mid-block (use slot boundary)
- LLM-side substitution markers OK ({doctor_specialty}, {doctor_name}, {clinic_name})
"""

from __future__ import annotations

from pathlib import Path
from typing import Final

# Slot 4 canonical content path (Story 11 T-prompts-1 cement — DO NOT mirror).
_AGENTIC_SLOT_4_PATH: Final[Path] = (
    Path(__file__).resolve().parents[2] / "agentic" / "prompts" / "slot_4_medical_safety_rails.j2"
)

# Slot 2 medical vertical prompt path.
_SLOT_2_PATH: Final[Path] = Path(__file__).parent / "medical_vertical.md"

# Slot 5 brand-default persona path (tenant can override via personality_profile).
_SLOT_5_BASE_PATH: Final[Path] = Path(__file__).parent / "adrian_persona_base.md"


def load_slot_2_medical_vertical() -> str:
    """Return Slot 2 — domain context Vitalia medical vertical.

    Cacheable per-domain invariant. Loaded once at compose time, never
    interpolated with tenant-specific data (those live in Slot 5+).
    """
    return _SLOT_2_PATH.read_text(encoding="utf-8")


def load_slot_4_medical_safety_rails_canonical() -> str:
    """Return Slot 4 MEDICAL_SAFETY_RAILS canonical text.

    Single source — delegates to ``agentic/prompts/slot_4_medical_safety_rails.j2``
    (Story 11 T-prompts-1 cement). Sales_agent compiler reads via this helper to
    ensure the same byte-equal content goes into Adrián 6-slot architecture
    (Slot 4) AND into the agentic surface (Lucas, future specialists).

    Anti-duplication.md compliant — no inline policy strings duplicated here.
    """
    return _AGENTIC_SLOT_4_PATH.read_text(encoding="utf-8")


def load_slot_5_adrian_persona_base() -> str:
    """Return Slot 5 brand-default persona text for Adrián.

    Tenant-level `personality_profiles.system_instruction` overrides this base
    at compose time. This is the brand default (Aurora/Mindful/Sanaré shared
    voice scaffold) loaded when tenant has NOT yet completed the wizard.
    """
    return _SLOT_5_BASE_PATH.read_text(encoding="utf-8")


__all__ = [
    "load_slot_2_medical_vertical",
    "load_slot_4_medical_safety_rails_canonical",
    "load_slot_5_adrian_persona_base",
]
