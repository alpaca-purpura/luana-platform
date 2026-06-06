# cap: abel/icp-buyer  # noqa: ERA001
"""Structured-output schema for the ICP extraction LLM call.

The LLM is instructed (icp_extraction.j2) to emit exactly ONE JSON object matching
``ExtractionResult``. We parse + validate the raw model output against these Pydantic
models before mapping to ``Icp``/``Buyer`` domain entities.

JSONB slugs (demographics/psychographics/pain_points/desires/objections/
buyer_journey/purchase_triggers/preferred_channels) mirror the engine ``BuyerPersona``
field-contract (consume-by-reference · 05-guidelines §Engine consumption) so the
extracted shape lands cleanly into the brand-local ``Buyer``.

Thin-seed invariant (SC-edge-thin-seed): every firmographic field is OPTIONAL and
defaults to None / empty. The prompt forbids inventing figures — when the seed has no
evidence, the model leaves the field empty, it does NOT hallucinate a number.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class ExtractedBuyer(BaseModel):
    """One extracted stakeholder (maps to brand-local ``Buyer``).

    Only ``name`` is meaningfully required (a buyer with no name is dropped at mapping).
    All else is optional — a thin seed yields a skeleton buyer with empty JSONB.
    """

    name: str = Field(default="", max_length=200)
    role: str | None = Field(default=None, max_length=160)
    decision_power: str | None = None  # validated against DecisionPower enum at mapping
    demographics: dict[str, Any] = Field(default_factory=dict)
    psychographics: dict[str, Any] = Field(default_factory=dict)
    pain_points: list[dict[str, Any]] = Field(default_factory=list)
    desires: list[dict[str, Any]] = Field(default_factory=list)
    objections: list[dict[str, Any]] = Field(default_factory=list)
    buyer_journey: dict[str, Any] = Field(default_factory=dict)
    purchase_triggers: list[str] = Field(default_factory=list)
    preferred_channels: list[dict[str, Any]] = Field(default_factory=list)


class ExtractedIcp(BaseModel):
    """One extracted ICP (maps to brand-local ``Icp``).

    ``label`` is the only field that must be present (a label-less ICP is dropped).
    Firmographics (vertical/company_size/geo/avg_ticket/…) are OPTIONAL — the prompt
    forbids fabricating them, so a thin seed leaves them empty (SC-edge-thin-seed).
    """

    label: str = Field(default="", max_length=160)
    description: str | None = None
    vertical: str | None = Field(default=None, max_length=120)
    company_size: str | None = Field(default=None, max_length=120)
    geo: str | None = Field(default=None, max_length=160)
    business_model: str | None = Field(default=None, max_length=200)
    # avg_ticket intentionally NOT extracted as a number: figures are high-hallucination
    # risk. If the seed states an explicit ticket the model may put it in description.
    sales_cycle: str | None = Field(default=None, max_length=120)
    main_pain: str | None = None  # consumer: brenda + christian
    sales_angle: str | None = None  # consumer: brenda + christian
    signals: list[str] = Field(default_factory=list)  # consumer: christian
    anti_pattern: str | None = None  # consumer: christian
    buyers: list[ExtractedBuyer] = Field(default_factory=list)


class ExtractionResult(BaseModel):
    """Top-level structured output: 1-2 ICPs, each with 1-2 buyers.

    ``needs_more_info`` + ``asks`` carry the thin-seed signal: when the seed lacked
    enough evidence, the model sets ``needs_more_info=True`` and lists what it needs
    (e.g. ["vertical", "main_pain"]) instead of fabricating data.
    """

    icps: list[ExtractedIcp] = Field(default_factory=list)
    needs_more_info: bool = False
    asks: list[str] = Field(default_factory=list)
