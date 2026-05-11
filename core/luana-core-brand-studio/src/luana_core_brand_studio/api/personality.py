"""Brand Personality Engine API — DTOs.

Full router (10 endpoints) lifted in T-7.
PersonalityProfileDTO lives here because brand_data_adapter uses it
for ORM→dict serialization (Bug #7 fix — PI-7 S1 PR-1 2026-05-01).
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class PresetSummaryDTO(BaseModel):
    """Summary of a built-in personality preset for the selection UI."""

    key: str
    name: str
    icon: str
    description: str
    sample_message: str
    dimensions: dict


class PersonalityProfileDTO(BaseModel):
    """Full serialization of a PersonalityProfileModel."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    profile_type: str
    preset_key: str | None
    is_active: bool
    dimensions: dict
    linguistic_patterns: dict
    sample_exchanges: list[dict]
    negative_constraints: list[str]
    system_instruction: str | None
    source_metadata: dict
    anchor_count: int
    created_at: datetime
    updated_at: datetime
