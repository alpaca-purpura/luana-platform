"""Pydantic schemas for comunify copilot extractors (T-extractors-1).

Spec sources:
  * 02-design-agentic.md § 7.1 — OfferLadderAdvisor input/output spec
  * 03-arch-agentic.md § 5.1 — wave composition + OfferLadderAdviceV1 schema
  * 06-tickets.yaml::T-extractors-1 acceptance criteria
  * 04-validators.yaml::V-AE-8

Schema versioning:
  ``OfferLadderAdviceV1.schema_version: Literal[1]`` cement (frozen). Subsequent
  schema migrations land in ``OfferLadderAdviceV2`` (NEW class) — never mutate
  V1 in place. Story D goldens schema-cement playbook applies cross-story.

Anti-duplication audit (Step 0 GATE pre-write, 2026-05-14):
  * grep cross codebase for ``class OfferLadderAdvisor`` / ``class OfferLadderAdviceV1`` /
    ``class LadderGap`` / ``class SuggestedOffer`` / ``class TierOptimization``
    → zero code collisions (only documented in spec/arch MDs). All NEW symbols.
  * ``ExtractionWave`` dataclass mirrors the Vitalia primitive (sibling extractor
    module, brand-isolated by design — per anti-duplication.md row "vertical
    primitives stay local; mechanics consumed from BaseExtractionOrchestrator").
  * No shared luana-core abstraction for ladder gaps / suggested offers /
    tier optimization — these are vertical-creator-economy domain primitives.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# ─── Wave configuration dataclass ──────────────────────────────────────────


@dataclass(frozen=True, slots=True)
class ExtractionWave:
    """Configuration for a single LLM extraction wave.

    Frozen so wave configurations declared at class scope are immutable.
    """

    name: str
    """Human-readable slug for trace + structlog event naming."""

    model_role: str
    """Logical role consumed by the LiteLLM-backed chat service. Never a wire
    model name (LLM_ROLE_BY_SITE SSoT). Production caller maps roles at the
    LiteLLM proxy boundary."""

    timeout_sec: float
    """Per-wave wall-clock timeout. Wave that exceeds this is treated as
    degraded (``extraction_warnings`` records the timeout, confidence
    decremented, partial output kept)."""


# ─── Ladder gap primitive ──────────────────────────────────────────────────


class LadderGap(BaseModel):
    """A missing level in the creator's offer ladder.

    The 4 canonical levels (per ``ComunifyOfferLadderModel`` + brand.yaml):
      * ``lead_magnet`` — level 1, free opt-in
      * ``tripwire`` — level 2, low cost entry
      * ``core_offer`` — level 3, main revenue
      * ``premium`` — level 4, high-ticket ascension
    """

    model_config = ConfigDict(frozen=True, extra="forbid")

    level: Literal["lead_magnet", "tripwire", "core_offer", "premium"]
    reasoning: str = Field(..., max_length=1000, description="Why this gap exists / why it matters.")
    priority: Literal["high", "medium", "low"] = "medium"


# ─── Suggested offer primitive ─────────────────────────────────────────────


class SuggestedOffer(BaseModel):
    """A candidate offer the creator could add to fill a ladder gap."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    target_level: Literal["lead_magnet", "tripwire", "core_offer", "premium"]
    name: str = Field(..., max_length=200, description="Working title for the offer (Spanish neutro).")
    format: str | None = Field(
        None, max_length=100, description="e.g. 'PDF guide', 'mini-course', 'cohort 4 weeks', 'mastermind'."
    )
    price_usd: float | None = Field(None, ge=0, le=100000, description="Suggested price in USD (None = free).")
    price_local_hint: str | None = Field(
        None, max_length=100, description="Hint for local-currency pricing if country !== US."
    )
    value_promise: str = Field(..., max_length=500, description="Outcome promised to the buyer.")
    fit_score: float = Field(0.0, ge=0.0, le=1.0, description="LLM-assigned alignment with creator niche.")


# ─── Tier optimization primitive ───────────────────────────────────────────


class TierOptimization(BaseModel):
    """Pricing / positioning optimization recommendations across the ladder."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    price_anchoring_advice: str | None = Field(
        None, max_length=500, description="How the suggested ladder anchors price perception."
    )
    progression_quality: Literal["coherent", "gappy", "compressed", "inverted", "unknown"] = "unknown"
    """Coherent = clean 10x steps; gappy = missing tiers; compressed = too-close
    prices; inverted = higher tier cheaper than lower tier; unknown = insufficient
    data."""

    bundling_opportunities: list[str] = Field(
        default_factory=list, max_length=10, description="Bundle ideas across existing + suggested offers."
    )
    upsell_paths: list[str] = Field(
        default_factory=list, max_length=10, description="Suggested upsell sequences (e.g. 'lead_magnet → tripwire')."
    )


# ─── Output schema (top-level extractor product) ───────────────────────────


class OfferLadderAdviceV1(BaseModel):
    """Structured advice on filling gaps in a creator's 4-level offer ladder.

    Schema-cemented per Story D goldens playbook. Bumping the schema → NEW
    class ``OfferLadderAdviceV2`` (NEVER mutate V1).
    """

    model_config = ConfigDict(frozen=False, extra="forbid")

    schema_version: Literal[1] = 1

    ladder_gaps: list[LadderGap] = Field(default_factory=list, description="Detected missing levels with reasoning.")
    suggested_offers: list[SuggestedOffer] = Field(
        default_factory=list, description="Concrete offer ideas — 5-10 per gap on the happy path."
    )
    tier_optimization: TierOptimization = Field(
        default_factory=lambda: TierOptimization(), description="Pricing + positioning analysis across the ladder."
    )

    confidence_score: float = Field(0.0, ge=0.0, le=1.0)
    """Aggregate confidence across the 4 waves. Each wave contributes a
    sub-score; merge wave averages and decrements per recorded warning."""

    missing_required_fields: list[str] = Field(default_factory=list)
    """Names of required fields the extractor could not populate (e.g.
    ``"ladder_gaps"`` when wave 2 failed)."""

    extraction_warnings: list[str] = Field(default_factory=list)
    """Free-form messages from waves: timeouts, parse failures, low-quality
    inputs, etc. Surfaced to creator for manual review trigger when
    ``confidence_score < 0.7``."""


__all__ = [
    "ExtractionWave",
    "LadderGap",
    "OfferLadderAdviceV1",
    "SuggestedOffer",
    "TierOptimization",
]
