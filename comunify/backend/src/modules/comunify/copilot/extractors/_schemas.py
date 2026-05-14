"""Pydantic schemas for comunify copilot extractors (T-extractors-1 + T-extractors-2).

Spec sources:
  * 02-design-agentic.md § 7.1 — OfferLadderAdvisor input/output spec
  * 02-design-agentic.md § 7.2 — AuthorityVaultExtractor input/output spec
  * 03-arch-agentic.md § 5.1 — wave composition + OfferLadderAdviceV1 schema
  * 03-arch-agentic.md § 5.2 — wave composition + AuthorityVaultExtractedV1 schema
  * 06-tickets.yaml::T-extractors-1 + T-extractors-2 acceptance criteria
  * 04-validators.yaml::V-AE-8

Schema versioning:
  ``OfferLadderAdviceV1.schema_version: Literal[1]`` and
  ``AuthorityVaultExtractedV1.schema_version: Literal[1]`` cement (frozen).
  Subsequent schema migrations land in NEW ``...V2`` classes — never mutate V1
  in place. Story D goldens schema-cement playbook applies cross-story.

Anti-duplication audit (Step 0 GATE pre-write, 2026-05-14):
  * grep cross codebase for ``class OfferLadderAdvisor`` / ``class OfferLadderAdviceV1`` /
    ``class LadderGap`` / ``class SuggestedOffer`` / ``class TierOptimization``
    → zero code collisions (only documented in spec/arch MDs). All NEW symbols.
  * grep cross codebase for ``class AuthorityVaultExtractor`` /
    ``class AuthorityVaultExtractedV1`` / ``class Credential`` / ``class CaseStudy`` /
    ``class PressMention`` / ``class SocialProofSignals`` / ``class Award``
    → zero code collisions. ``PressMentionResponse`` / ``AwardResponse`` existing
    in ``api/dtos/authority_vault_dtos.py`` are API-layer Response DTOs (different
    purpose: serialise persisted rows). Extractor primitives live in this file
    as domain-level extraction-output entities (not persisted as-is — caller
    bridges to ``ComunifyAuthorityVaultItemModel`` rows via
    ``_merge_and_save``).
  * ``ExtractionWave`` dataclass mirrors the Vitalia primitive (sibling extractor
    module, brand-isolated by design — per anti-duplication.md row "vertical
    primitives stay local; mechanics consumed from BaseExtractionOrchestrator").
  * No shared luana-core abstraction for ladder gaps / suggested offers /
    tier optimization / authority signals — these are vertical-creator-economy
    domain primitives.
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


# ─── Authority Vault primitives (T-extractors-2) ──────────────────────────


class Credential(BaseModel):
    """A credential / accreditation / certification the creator holds.

    Per 02-design § 7.2 + 03-arch-agentic § 5.2 — pre-fills the credentials
    sub-section of authority_vault editor. Creator reviews + ratifies before
    persistence as ``ComunifyAuthorityVaultItemModel(kind="credentials")``.
    """

    model_config = ConfigDict(frozen=True, extra="forbid")

    title: str = Field(..., min_length=1, max_length=200, description="Credential name / title.")
    issuer: str | None = Field(
        None, max_length=200, description="Issuing institution / organisation (e.g. 'INADI', 'Yale', 'Coursera')."
    )
    year: int | None = Field(None, ge=1900, le=2100, description="Year credential was issued.")
    url: str | None = Field(
        None, max_length=2000, description="Optional verification URL (LinkedIn / institution / credential page)."
    )
    confidence: float = Field(0.0, ge=0.0, le=1.0, description="LLM confidence this is a real credential vs noise.")


class CaseStudy(BaseModel):
    """A client / student outcome story extracted from creator's source text.

    Pre-fills case_studies sub-section. Creator reviews + ratifies.
    """

    model_config = ConfigDict(frozen=True, extra="forbid")

    title: str = Field(..., min_length=1, max_length=200, description="Working title for the case study.")
    client_archetype: str | None = Field(
        None, max_length=200, description="Anonymised client description (e.g. 'coach 35yo Buenos Aires')."
    )
    outcome: str = Field(..., max_length=1000, description="Transformation / measurable result delivered.")
    timeframe: str | None = Field(
        None, max_length=100, description="How long the transformation took (e.g. '3 meses', '90 días')."
    )
    url: str | None = Field(
        None, max_length=2000, description="Optional URL to case study landing page / video testimonial."
    )
    confidence: float = Field(0.0, ge=0.0, le=1.0, description="LLM confidence this is a real case study.")


class PressMention(BaseModel):
    """A press / media mention of the creator.

    Pre-fills press_mentions sub-section.
    """

    model_config = ConfigDict(frozen=True, extra="forbid")

    title: str = Field(..., min_length=1, max_length=300, description="Article / interview title.")
    outlet: str | None = Field(
        None, max_length=200, description="Publication / media outlet (e.g. 'La Nación', 'Forbes', 'TechCrunch')."
    )
    year: int | None = Field(None, ge=1900, le=2100, description="Year of publication.")
    url: str | None = Field(
        None, max_length=2000, description="Optional URL to article. Validation status set by URL validator service."
    )
    confidence: float = Field(0.0, ge=0.0, le=1.0)


class SpeakingEngagement(BaseModel):
    """A speaking engagement / podcast appearance / conference talk.

    Subset of press_mentions but tagged with format for downstream filtering.
    Persisted under press_mentions kind with content-level discriminator.
    """

    model_config = ConfigDict(frozen=True, extra="forbid")

    title: str = Field(..., min_length=1, max_length=300, description="Talk / podcast episode / panel title.")
    venue: str | None = Field(
        None,
        max_length=200,
        description="Conference / podcast / event name (e.g. 'TEDx Buenos Aires', 'The Tim Ferriss Show').",
    )
    year: int | None = Field(None, ge=1900, le=2100)
    url: str | None = Field(None, max_length=2000)
    format: Literal["keynote", "podcast", "panel", "webinar", "conference_talk", "other"] = "other"
    confidence: float = Field(0.0, ge=0.0, le=1.0)


class Award(BaseModel):
    """An award / recognition / industry honour.

    Pre-fills awards sub-section.
    """

    model_config = ConfigDict(frozen=True, extra="forbid")

    title: str = Field(..., min_length=1, max_length=200, description="Award name (e.g. 'Premio Konex Platino').")
    issuer: str | None = Field(None, max_length=200, description="Awarding body.")
    year: int | None = Field(None, ge=1900, le=2100)
    url: str | None = Field(None, max_length=2000)
    confidence: float = Field(0.0, ge=0.0, le=1.0)


class SocialProofSignals(BaseModel):
    """Aggregate social-proof statistics extracted from the source text.

    These are NOT persisted as ``ComunifyAuthorityVaultItemModel`` rows —
    they surface in Brand Studio as headline metrics on the authority vault
    page. Creator reviews + ratifies before display.
    """

    model_config = ConfigDict(frozen=True, extra="forbid")

    students_trained_count: int | None = Field(None, ge=0, description="E.g. '+2.500 alumnos formados' → 2500.")
    clients_served_count: int | None = Field(None, ge=0)
    years_of_experience: int | None = Field(None, ge=0, le=100)
    instagram_followers: int | None = Field(None, ge=0, description="Optional follower-count signal.")
    youtube_subscribers: int | None = Field(None, ge=0)
    tiktok_followers: int | None = Field(None, ge=0)
    other_signals: list[str] = Field(
        default_factory=list,
        max_length=20,
        description="Free-form signals (e.g. 'Bestselling author', '15 años de práctica clínica').",
    )


class AuthorityVaultExtractedV1(BaseModel):
    """Aggregate output of the AuthorityVaultExtractor.

    Schema-cemented (Story D goldens playbook). Bumping requires NEW
    ``AuthorityVaultExtractedV2`` class — NEVER mutate V1.

    Per 02-design § 7.2: pre-fills the authority_vault editor in Brand Studio.
    Creator reviews + ratifies — extractor does NOT persist directly to
    ``comunify_authority_vault_items`` without ratification (Brand Studio
    workflow owns the persistence boundary). Extractor MAY write
    ``status='extracted_pending_ratification'`` rows when wired via
    ``authority_vault_repo`` collaborator (per 06-tickets.yaml::T-extractors-2
    constraint).
    """

    model_config = ConfigDict(frozen=False, extra="forbid")

    schema_version: Literal[1] = 1

    credentials: list[Credential] = Field(default_factory=list)
    case_studies: list[CaseStudy] = Field(default_factory=list)
    press_mentions: list[PressMention] = Field(default_factory=list)
    speaking_engagements: list[SpeakingEngagement] = Field(default_factory=list)
    awards: list[Award] = Field(default_factory=list)
    social_proof: SocialProofSignals = Field(
        default_factory=lambda: SocialProofSignals(),
        description="Aggregate social-proof signals. Empty defaults when no signals extracted.",
    )

    confidence_score: float = Field(0.0, ge=0.0, le=1.0)
    """Aggregate confidence across the 4 waves. Below ``MIN_ACCEPTABLE_CONFIDENCE``
    surfaces creator notification "Pegá más contenido (LinkedIn About + sitio
    web + 1-2 entrevistas si tenés)" per 02-design § 7.2 error mode (a)."""

    missing_required_fields: list[str] = Field(default_factory=list)
    """Fields the extractor could not populate (e.g. ``credentials`` when wave
    1 failed). Useful for downstream UI hint."""

    extraction_warnings: list[str] = Field(default_factory=list)
    """Free-form warnings from waves: timeouts, parse failures, low-signal
    inputs, etc. Surfaces to creator for manual review trigger."""


__all__ = [
    "AuthorityVaultExtractedV1",
    "Award",
    "CaseStudy",
    "Credential",
    "ExtractionWave",
    "LadderGap",
    "OfferLadderAdviceV1",
    "PressMention",
    "SocialProofSignals",
    "SpeakingEngagement",
    "SuggestedOffer",
    "TierOptimization",
]
