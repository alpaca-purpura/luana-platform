"""Shared exceptions for comunify agentic tools.

Origin: T-tools-3 (Story 12 `luana-comunify-bootstrap`). Lift triggered at
N=3 detection per `.claude/rules/anti-duplication.md` cardinal rule.

History:
  * T-tools-1 (`qualify_for_cohort.py`) defined `ForbiddenToolContextError` inline (N=1, OK).
  * T-tools-2 (`link_to_community.py`) defined a second copy inline (N=2 — trigger).
    `T-tools-2-result.md` § "Forward-looking notes" + IMPL-LOG § "N=2 trigger flagged"
    flagged the deferred lift and explicitly warned: "T-tools-3 must NOT inline a third copy.
    N=3 trigger would be a process-improvement case study."
  * T-tools-3 (`nurture_via_authority_content.py`) honours the lift: imports
    from this module instead of inlining a third copy.

The canonical `ForbiddenToolContextError` lives here. Both sibling tools
re-export the symbol to preserve their public API (test imports + `tools/__init__.py`).

When the inventory reaches N≥3 across the comunify codebase (this file is the
third), the next step per anti-duplication.md is to evaluate whether the
abstraction is cross-module — at that point a LIFT to `shared/agent_observability/`
or `luana_core_*` would be warranted. For now (single-module reuse), this
sibling-module home is the right level of abstraction.

Cross-references:
  * `.claude/rules/anti-duplication.md` § "Workflow pre-write" (Step 0 GATE)
  * `T-tools-2-result.md` § "Forward-looking notes" (N=2 flagged)
  * `03-arch-agentic.md` § 4.5 (FORBIDDEN_TOOLS_BY_CONTEXT)
"""

from __future__ import annotations


class ForbiddenToolContextError(Exception):
    """Raised when a tool is invoked in a context that forbids it.

    Per `03-arch-agentic.md § 4.5 FORBIDDEN_TOOLS_BY_CONTEXT`:
      - `qualify_for_cohort` is forbidden in: `community_engagement_workflow`
        (already enrolled) + `subscriber_support` (wrong flow).
      - `link_to_community` is forbidden in: `lead_qualification`
        (subscriber not yet enrolled — wrong funnel stage).
      - `nurture_via_authority_content` has NO forbidden contexts per the
        spec, but exposes this exception type for symmetry + future-proofing.

    The error carries:
      * `tool_name` — which tool was invoked (e.g., "qualify_for_cohort")
      * `context` — the forbidden context label (e.g., "lead_qualification")
    """

    def __init__(self, context: str, *, tool_name: str | None = None) -> None:
        self.context = context
        self.tool_name = tool_name
        suffix = f" ({tool_name})" if tool_name else ""
        super().__init__(
            f"Tool{suffix} is forbidden in context '{context}' (03-arch-agentic.md § 4.5 FORBIDDEN_TOOLS_BY_CONTEXT)"
        )


__all__ = ["ForbiddenToolContextError"]
