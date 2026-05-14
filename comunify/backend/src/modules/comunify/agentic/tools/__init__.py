"""Comunify agentic tools package.

Tools exposed to the sales_agent/copilot LLM during conversation turns.
Each tool is an `async def` handler with Pydantic input/output schemas +
dependency-injected repos + best-effort observability.

Anti-duplication note (`.claude/rules/anti-duplication.md`):
  - Domain event types live inline in each tool today (N=1 per tool).
    Lift to `modules/comunify/domain/events.py` when N≥2.
  - LLM client protocol lives inline today (N=1). Lift to shared agentic
    abstractions when N≥2.
  - `sanitize_payload` consumed from `luana_core_observability.recording.sanitization`
    with lazy-import fallback (matches `compliance_event_service.py` pattern).
"""

from src.modules.comunify.agentic.tools.link_to_community import (
    CommunityAccessAuditedV1,
    LinkToCommunityInputV1,
    LinkToCommunityOutputV1,
    MissingHMACSecretError,
    link_to_community,
)
from src.modules.comunify.agentic.tools.qualify_for_cohort import (
    ForbiddenToolContextError,
    LeadQualifiedV1,
    QualifyForCohortInputV1,
    QualifyForCohortOutputV1,
    qualify_for_cohort,
)

__all__ = [
    # T-tools-2 — link_to_community
    "CommunityAccessAuditedV1",
    "LinkToCommunityInputV1",
    "LinkToCommunityOutputV1",
    "MissingHMACSecretError",
    "link_to_community",
    # T-tools-1 — qualify_for_cohort
    "ForbiddenToolContextError",
    "LeadQualifiedV1",
    "QualifyForCohortInputV1",
    "QualifyForCohortOutputV1",
    "qualify_for_cohort",
]
