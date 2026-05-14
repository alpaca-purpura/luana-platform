"""Comunify agentic tools package.

Tools exposed to the sales_agent/copilot LLM during conversation turns.
Each tool is an `async def` handler with Pydantic input/output schemas +
dependency-injected repos + best-effort observability.

Anti-duplication note (`.claude/rules/anti-duplication.md`):
  - `ForbiddenToolContextError` LIFTED to `_exceptions.py` at N=3 trigger
    (T-tools-3 forward-implementing the deferred lift flagged in
    `T-tools-2-result.md` § "Forward-looking notes"). Sibling tools re-export
    via `from ._exceptions import ForbiddenToolContextError`.
  - Domain event types live inline in each tool today (N=1 per tool).
    Lift to `modules/comunify/domain/events.py` when N≥2.
  - LLM client protocol lives inline today (N=3 — _LLMClientLike in
    qualify_for_cohort.py + link_to_community.py + nurture_via_authority_content.py).
    Next ticket touching tools should LIFT to shared agentic abstractions.
  - `sanitize_payload` consumed from `luana_core_observability.recording.sanitization`
    with lazy-import fallback (matches `compliance_event_service.py` pattern).
  - PII boundary scrub (`_PII_KEYS` + `_EMAIL_RE` + `_PHONE_RE` + `_scrub_pii`)
    duplicated across 3 tool files (N=3). Lift to shared
    `agentic/tools/_pii_scrub.py` flagged for next refactor ticket.
"""

from src.modules.comunify.agentic.tools._exceptions import ForbiddenToolContextError
from src.modules.comunify.agentic.tools.link_to_community import (
    CommunityAccessAuditedV1,
    LinkToCommunityInputV1,
    LinkToCommunityOutputV1,
    MissingHMACSecretError,
    link_to_community,
)
from src.modules.comunify.agentic.tools.nurture_via_authority_content import (
    NurtureMatchedItemV1,
    NurtureViaAuthorityContentInputV1,
    NurtureViaAuthorityContentOutputV1,
    nurture_via_authority_content,
)
from src.modules.comunify.agentic.tools.qualify_for_cohort import (
    LeadQualifiedV1,
    QualifyForCohortInputV1,
    QualifyForCohortOutputV1,
    qualify_for_cohort,
)

__all__ = [
    # Shared exceptions (lifted)
    "ForbiddenToolContextError",
    # T-tools-1 — qualify_for_cohort
    "LeadQualifiedV1",
    "QualifyForCohortInputV1",
    "QualifyForCohortOutputV1",
    "qualify_for_cohort",
    # T-tools-2 — link_to_community
    "CommunityAccessAuditedV1",
    "LinkToCommunityInputV1",
    "LinkToCommunityOutputV1",
    "MissingHMACSecretError",
    "link_to_community",
    # T-tools-3 — nurture_via_authority_content
    "NurtureMatchedItemV1",
    "NurtureViaAuthorityContentInputV1",
    "NurtureViaAuthorityContentOutputV1",
    "nurture_via_authority_content",
]
