"""Comunify agentic tools package.

Tools exposed to the sales_agent/copilot LLM during conversation turns.
Each tool is an `async def` handler with Pydantic input/output schemas +
dependency-injected repos + best-effort observability.

Anti-duplication note (`.claude/rules/anti-duplication.md`):
  - `ForbiddenToolContextError` LIFTED to `_exceptions.py` at N=3 trigger
    (T-tools-3 forward-implementing the deferred lift flagged in
    `T-tools-2-result.md` § "Forward-looking notes"). Sibling tools re-export
    via `from ._exceptions import ForbiddenToolContextError`.
  - Domain event types live inline in each tool today (N=1-3 per tool).
    book_discovery_call defines 3 events inline (Booked / Rescheduled /
    Cancelled). LIFT to `modules/comunify/domain/events.py` flagged for
    the next ticket that introduces an event SUBSCRIBER (T-workflows-1/2
    will consume DiscoveryCallBookedV1 + LeadQualifiedV1).
  - LLM client protocol lives inline today (N=3 — _LLMClientLike in
    qualify_for_cohort.py + link_to_community.py + nurture_via_authority_content.py).
    book_discovery_call does NOT define _LLMClientLike (it's a $0 LLM tool —
    deterministic SQL only). LIFT to shared agentic abstractions for the
    LLM-using tools flagged for next refactor ticket.
  - `sanitize_payload` consumed from `luana_core_observability.recording.sanitization`
    with lazy-import fallback (matches `compliance_event_service.py` pattern).
  - PII boundary scrub (`_PII_KEYS` + `_EMAIL_RE` + `_PHONE_RE` + `_scrub_pii`)
    duplicated across 4 tool files (N=4 post T-tools-4). LIFT to shared
    `agentic/tools/_pii_scrub.py` is overdue — assigned to next refactor
    ticket (out of scope for T-tools-4 to avoid 4-sibling diff blast radius).
  - `_slot_lock_key` (advisory-lock key derivation) lives inline in
    book_discovery_call (N=1 in comunify; vitalia has its own at
    `vitalia/infrastructure/advisory_locks.py` — N=2 cross-vertical). LIFT
    to shared agentic infra when a THIRD vertical introduces advisory locks
    (Story 13+) per `.claude/rules/anti-duplication.md` cardinal.
  - `_SchedulerQueryLike` Protocol mirrors Story 11 vitalia
    `appointment_reschedule_with_doctor._SchedulerQueryLike`. Same shape,
    different namespace (vertical-creator-economy vs vertical-medical).
    LIFT to shared at 3rd vertical surface.
"""

from src.modules.comunify.agentic.tools._exceptions import ForbiddenToolContextError
from src.modules.comunify.agentic.tools.book_discovery_call import (
    BookDiscoveryCallInputV1,
    BookDiscoveryCallOutputV1,
    DiscoveryCallBookedV1,
    DiscoveryCallCancelledV1,
    DiscoveryCallRescheduledV1,
    book_discovery_call,
)
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
    # T-tools-4 — book_discovery_call
    "BookDiscoveryCallInputV1",
    "BookDiscoveryCallOutputV1",
    "DiscoveryCallBookedV1",
    "DiscoveryCallCancelledV1",
    "DiscoveryCallRescheduledV1",
    "book_discovery_call",
]
