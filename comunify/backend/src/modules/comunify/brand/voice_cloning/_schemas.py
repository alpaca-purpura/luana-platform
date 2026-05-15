"""Pydantic + dataclass schemas for comunify voice cloning pipeline (T-voice-1..4).

Spec sources:
  * 02-design-agentic.md voice cloning flow (3 fixtures detail)
  * 03-arch-agentic.md § 5.3 — VoiceDistillationOrchestrator + CompiledVoice
  * 06-tickets.yaml::T-voice-1 acceptance + decisions D8 + D15
  * 04-validators.yaml::V-AE-9 (voice cloning happy path) + V-AE-21 (cost ceiling)
  * V-AE-29 (compiler integration bridge) + V-AE-30 (3-fixture distillation)
  * V-AE-28 (PII sanitization in samples) + V-F-17 + V-F-12

Schema versioning:
  ``CompiledVoice.schema_version: Literal[1]`` cemented frozen. Future
  schema migrations land in NEW ``CompiledVoiceV2`` classes — never mutate
  V1. Story D goldens schema-cement playbook applies cross-story.

D15 (privacy) invariant: only ``samples_used`` *count* persisted in V1 —
raw chat content NEVER enters this schema. Vocabulary + asi_no surface
*patterns* extracted by the LLM waves, not verbatim PII.

Anti-duplication audit (Step 0 GATE pre-write, 2026-05-14):
  * grep cross codebase for ``class CompiledVoice`` / ``class VoiceExtractionWave``
    → zero collisions (only documented in spec/arch MDs).
  * ``ExtractionWave`` in ``copilot.extractors._schemas`` has a different
    shape (name + model_role + timeout_sec) for offer ladder / authority
    vault. Voice cloning's ``VoiceExtractionWave`` adds ``prompt_key``
    (mapping into the inline _WAVE_PROMPTS dict) and ``confidence_weight``
    — vertical-voice-specific. NOT lifted to shared (N=1, sibling pattern,
    domain-specific). If a 3rd voice-distillation consumer surfaces,
    reconsider lift to luana_core_extraction.voice_distillation.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# ─── Wave configuration dataclass (voice-cloning specific) ────────────────


@dataclass(frozen=True, slots=True)
class VoiceExtractionWave:
    """Configuration for a single voice-cloning extraction wave.

    Frozen so wave configurations declared at class scope are immutable.

    Differs from ``copilot.extractors._schemas.ExtractionWave`` by adding
    ``prompt_key`` (selector into the inline prompts dict) and
    ``confidence_weight`` (per-wave contribution to aggregate confidence
    score; sums to 1.0 across the 4 waves).
    """

    name: str
    """Human-readable slug for trace + structlog event naming."""

    model_role: str
    """Logical role consumed by the LiteLLM-backed chat service. Never a wire
    model name (LLM_ROLE_BY_SITE SSoT). Production caller maps roles at the
    LiteLLM proxy boundary."""

    prompt_key: str
    """Key into the orchestrator's inline ``_WAVE_PROMPTS`` dict — selects
    the wave-specific prompt template. Kept inline (not Jinja2 files) per
    same pattern as ``offer_ladder_advisor._WAVE_PROMPTS`` for cache-prefix
    invariance + locality of reasoning."""

    timeout_sec: float
    """Per-wave wall-clock timeout. Wave that exceeds this is treated as
    degraded (``extraction_warnings`` records the timeout, confidence
    decremented, partial output kept)."""

    confidence_weight: float
    """Per-wave weight in aggregate confidence_score. Sum across 4 waves
    must equal 1.0 (asserted at orchestrator construction)."""


# ─── Compiled voice output schema (6 bloques v2) ──────────────────────────


class CompiledVoice(BaseModel):
    """Output schema — 6 bloques compiled v2 voice.

    Schema-cemented per Story D goldens playbook. Bumping the schema → NEW
    class ``CompiledVoiceV2`` (NEVER mutate V1).

    Per 03-arch-agentic.md § 5.3:
      * ``identidad`` — role + tone descriptor anchor (Bloque 1)
      * ``dialecto`` — e.g. "es-AR voseo natural" | "es-CL tuteo chileno"
        | "es-MX neutro broad" (Bloque 2)
      * ``vocabulario`` — list of frequent phrases extracted from samples
        (Bloque 3 — surface-level fingerprint)
      * ``registro`` — tone + formality descriptor (Bloque 4)
      * ``asi_no`` — list of negative constraints (Bloque 5 NUNCA rules)
      * ``anclajes`` — list of brand voice anchors (Bloque 6 immutable
        identity)

    D15 privacy: ``samples_used`` is a *count* — never holds raw chat text.
    ``vocabulario`` + ``asi_no`` are LLM-extracted *patterns*, not verbatim
    user-content. Caller's ``_merge_and_save`` MUST delete raw samples
    post-success.
    """

    model_config = ConfigDict(frozen=False, extra="forbid")

    schema_version: Literal[1] = 1

    identidad: str = Field(
        "",
        max_length=2000,
        description="Bloque 1 — role + identity anchor (e.g. 'Coach de fitness AR para mujeres 35-50').",
    )
    dialecto: str = Field(
        "",
        max_length=200,
        description="Bloque 2 — dialect descriptor (e.g. 'es-AR voseo natural').",
    )
    vocabulario: list[str] = Field(
        default_factory=list,
        max_length=200,
        description=(
            "Bloque 3 — list of vocabulary anchors (frequent phrases / "
            "fillers / signature words). Pattern-extracted, NEVER verbatim PII."
        ),
    )
    registro: str = Field(
        "",
        max_length=1000,
        description="Bloque 4 — tone + formality descriptor (e.g. 'cercano informal con humor cálido').",
    )
    asi_no: list[str] = Field(
        default_factory=list,
        max_length=50,
        description=(
            "Bloque 5 — list of NUNCA / negative constraints (e.g. 'NUNCA digas \"querida/o\"', "
            "'NUNCA uses emojis afectivos sin que el lead los use primero')."
        ),
    )
    anclajes: list[str] = Field(
        default_factory=list,
        max_length=20,
        description="Bloque 6 — brand voice immutable identity anchors.",
    )

    confidence_score: float = Field(0.0, ge=0.0, le=1.0)
    """Aggregate confidence across the 4 waves. Each wave contributes a
    weighted sub-score; merge wave averages and decrements per recorded
    warning. <0.65 surfaces creator notification (low confidence → manual
    upload more chats)."""

    samples_used: int = Field(0, ge=0)
    """Count of source chat samples consumed. D15 — *count only*, never
    raw content. Persisted in ``comunify_voice_distillation_jobs.samples_count``."""

    missing_required_fields: list[str] = Field(default_factory=list)
    """Bloques (identidad/dialecto/vocabulario/registro/asi_no/anclajes)
    the extractor could not populate. Useful for downstream UI hint."""

    extraction_warnings: list[str] = Field(default_factory=list)
    """Free-form warnings from waves: timeouts, parse failures, low-signal
    inputs, cost-budget-exceeded, etc. Surfaces to creator for manual
    review trigger when ``confidence_score < MIN_ACCEPTABLE_CONFIDENCE``."""


__all__ = ["CompiledVoice", "VoiceExtractionWave"]
