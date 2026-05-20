"""Vitalia Adrián sales_agent state overlay (TypedDict extension).

Story T-ag-tools-2 — R23 production_code=true.

Per 03-arch-agentic.md § 2.2 + 02-design-agentic.md § 2.2:
Adrián consumes engine ``core/luana-core-sales-agent/`` LangGraph DIRECTLY.
NO parallel graph in vitalia (§3 NO se toca per sales-agent-expert).

This module defines the brand-specific state extension keys that vitalia
adds onto the engine state schema via the engine's
``register_state_extension()`` API (consumed, NOT modified — engine read-only).

Keys added:
- ``clinic_id`` — MANDATORY for Vitalia turns (HIPAA-lite dual filter)
- ``vertical`` — domain-routing hint (dental/estetica/psicologia/fertilidad/otro)
- ``screening_outcome`` — populated post screening_questions tool call
- ``medical_disclaimer_shown`` — track whether disclaimer footer was emitted
- ``phi_blocked_messages`` — list of compliance blocks for audit trail
- ``compliance_level`` — always "hipaa_lite" for vitalia tenants

Reducer for ``phi_blocked_messages`` uses ``operator.add`` so parallel branches
(if engine supervisor fans out via Send) accumulate audit entries safely.

Anti-duplication audit (Step 0 GATE pre-write):
- No engine sales_agent state class to subclass — engine state is a TypedDict
  that brands extend via composition, NOT inheritance (LangGraph 2.0 pattern).
- This module declares ONLY the brand-specific keys; engine state remains
  the source of truth for all base keys (messages, tenant_id, etc.).
- ``operator.add`` is stdlib, NOT a custom reducer. No reducer mirror.

downstream-regression-na: brand-local state schema declaration only — no
engine modification, no cross-brand consumers.
"""

from __future__ import annotations

import operator
from typing import Annotated, Any, Literal, TypedDict
from uuid import UUID

# Vitalia clinical verticals (cardinal SSoT — matches screening_questions_by_vertical.yaml).
VitaliaVertical = Literal["dental", "estetica", "psicologia", "fertilidad", "otro"]

# Compliance level enum (hipaa-lite only for vitalia).
VitaliaComplianceLevel = Literal["hipaa_lite"]


class VitaliaSalesAgentStateExtension(TypedDict, total=False):
    """Brand-specific state keys for vitalia Adrián sales_agent.

    Composed onto the engine sales_agent state schema via
    ``engine.register_state_extension(VitaliaSalesAgentStateExtension)``.

    All fields are ``total=False`` (optional) to allow gradual population
    during the conversation lifecycle. The engine merges these keys into
    the canonical state dict at orchestrator init.

    Per .claude/rules/tenant-isolation.md + hipaa-lite.md cardinal:
    ``clinic_id`` MUST be populated by the inbound webhook adapter BEFORE
    the first LLM call. Engine state schema is the source for ``tenant_id``
    and ``lead_id``; vitalia adds ``clinic_id`` as the dual-filter second
    component for PHI queries.
    """

    # HIPAA-lite dual filter (cardinal)
    clinic_id: UUID

    # Domain routing hint
    vertical: VitaliaVertical

    # Screening outcome (populated post screening_questions tool call)
    # Shape: {"event_id": UUID, "outcome": str, "reasoning": str|None, "questions_asked": list[str]}
    screening_outcome: dict[str, Any] | None

    # Disclaimer footer tracker
    medical_disclaimer_shown: bool

    # PHI block audit accumulator — parallel-safe via operator.add reducer
    phi_blocked_messages: Annotated[list[dict[str, Any]], operator.add]

    # Compliance level (constant per brand — always "hipaa_lite")
    compliance_level: VitaliaComplianceLevel


__all__ = [
    "VitaliaComplianceLevel",
    "VitaliaSalesAgentStateExtension",
    "VitaliaVertical",
]
