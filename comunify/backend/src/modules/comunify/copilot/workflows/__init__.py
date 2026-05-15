"""Comunify copilot workflows package.

Story 12 luana-comunify-bootstrap T-workflows-1 / T-workflows-2.

Per 03-arch-agentic.md § 6:
  * ``community_engagement_workflow`` — drift detection + re-engagement
    via cron tick (T-workflows-1, this ticket).
  * ``cohort_enrollment_workflow`` — qualification → enrolled with
    embedded dunning sub-workflow (T-workflows-2, blocked_by T-payment-1).

Anti-duplication audit (per ``.claude/rules/anti-duplication.md``):
  * Mirrors vitalia precedent at
    ``vitalia/backend/src/modules/vitalia/copilot/workflows/`` as a sibling
    brand-isolated implementation per D3 (2 workflows in comunify, 1 in
    vitalia — defer shared ``BaseWorkflowOrchestrator`` until Story 14+
    introduces a 4th workflow).
  * LangGraph 2.0 StateGraph from ``langgraph.graph`` — already vendored at
    workspace level via the comunify-backend ``langgraph`` runtime
    dependency.
"""

from __future__ import annotations
