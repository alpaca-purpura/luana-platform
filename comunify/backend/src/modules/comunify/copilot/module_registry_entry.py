"""Comunify copilot module registry entry — workflow descriptors.

Story 12 luana-comunify-bootstrap T-workflows-1 (R23 Opus 4.7 production
AGENTIC code).

Per 02-design-agentic.md § 8.1 + 03-arch-agentic.md § 6.6.

Anti-duplication audit (per `.claude/rules/anti-duplication.md`):
  - `luana_core_copilot.domain.module_registry.ModuleDescriptor` exists but is
    a COPILOT DATA INTROSPECTION descriptor (model_class + read_fn for tenant
    data queries), NOT a workflow registry. The arch doc § 6.6 uses a
    different schema (workflow_slug + cron_schedule_rules + cost_budget).
  - The vitalia precedent at
    `vitalia/backend/src/modules/vitalia/copilot/module_registry_entry.py`
    declares a vitalia-LOCAL ``WorkflowDescriptor`` dataclass capturing the
    workflow registration metadata per § 6.5. The same shape is reused here
    for comunify (2nd brand consumer).
  - Runtime EP-4 wiring (`registry.copilot_workflow_register(WorkflowDef)`)
    already happened in T-extensions-1 with empty steps tuple — that
    placeholder remains the canonical extension-point registration; this
    file documents the descriptor shape per design intent + drives cron
    handler scheduling derivation + cost-budget enforcement.
  - LIFT-shared candidate: when @luana/core grows a real workflow registry
    (3rd vertical workflow appears — per D3 staging YAGNI), the descriptor
    dataclass + ``CronRule`` lift to shared.

Decisions honored:
  D3  — CommunityEngagementWorkflow + CohortEnrollmentWorkflow inherit from
        StateGraph directly (no shared base BaseWorkflowOrchestrator).
        Descriptor here documents identity + cron rules + observability
        tags + cost budget.
  D10 — RedisSaver checkpointer cross-brand (``state_persister="redis_saver"``
        documented; runtime swap via the workflow build function — pass any
        compatible checkpointer, MemorySaver for tests/dev, RedisSaver when
        ``langgraph-checkpoint-redis`` package install lands).

T-workflows-2 EXTENDS this file with ``comunify_cohort_enrollment_descriptor``
following the same shape — keeping anti-duplication discipline (single
``WorkflowDescriptor`` dataclass; one instance per workflow).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

# ════════════════════════════════════════════════════════════════════════════
# Cron rule schema (lift-shared candidate when @luana/core scheduling lands)
# ════════════════════════════════════════════════════════════════════════════


@dataclass(frozen=True, slots=True)
class CronRule:
    """Cron tick scheduling rule per workflow milestone.

    Future: lift to ``@luana/core/scheduling`` when shared cron primitive
    lands (per cron_handler.py anti-duplication audit + vitalia precedent).

    Attributes
    ----------
    milestone:
        Identifier of the milestone this rule targets (e.g.
        ``"drift_check"``, ``"payment_followup_24h"``). Free-form string
        scoped per workflow.
    offset_days_since_last_activity:
        Days from the last subscriber activity at which the milestone
        becomes eligible to fire. ``None`` means the milestone is event-
        triggered rather than time-triggered.
    hour_local:
        Hour-of-day (tenant local TZ, 0-23) at which the cron worker should
        fire the tick. ``9`` means 9am tenant TZ per arch § 6.6.
    """

    milestone: str
    offset_days_since_last_activity: int | None
    hour_local: int


# ════════════════════════════════════════════════════════════════════════════
# Workflow descriptor (comunify-local — lift-shared candidate)
# ════════════════════════════════════════════════════════════════════════════


@dataclass(frozen=True, slots=True)
class WorkflowDescriptor:
    """Comunify workflow registration metadata per arch doc § 6.6.

    Consumed by:
      - cron_handler.py for scheduling derivation
      - extensions.py future re-registration with ``WorkflowDef.steps``
        populated (currently empty placeholder per T-extensions-1)
      - observability tagging (copilot_trace_event metadata)
      - cost-budget enforcement (validator V-AE-10 + arch invariants)

    Attributes mirror vitalia precedent ``WorkflowDescriptor`` exactly to
    keep lift-shared trivial when a 3rd vertical workflow appears.
    """

    workflow_slug: str
    workflow_class: str
    version: str
    eligible_tenants_filter: dict[str, str]
    eligible_niches: tuple[str, ...]
    trigger_event: str
    cron_schedule_rules: tuple[CronRule, ...]
    state_persister: Literal["memory_saver", "redis_saver", "postgres_saver"]
    observability_tags: tuple[str, ...]
    cost_budget_per_workflow_run: float  # USD ceiling per complete cycle


# ════════════════════════════════════════════════════════════════════════════
# Comunify CommunityEngagementWorkflow descriptor instance
# ════════════════════════════════════════════════════════════════════════════


comunify_community_engagement_descriptor = WorkflowDescriptor(
    workflow_slug="comunify.community_engagement",
    workflow_class="CommunityEngagementWorkflow",
    version="v1",
    eligible_tenants_filter={"brand_slug": "comunify"},
    eligible_niches=(
        "business_coaching",
        "health_creator",
        "course_creator",
        "content_creator",
    ),
    trigger_event="MemberDriftDetected",
    cron_schedule_rules=(
        CronRule(
            milestone="drift_check",
            offset_days_since_last_activity=14,
            hour_local=9,
        ),
    ),
    state_persister="redis_saver",  # D10 target; MemorySaver until package install
    observability_tags=(
        "workflow=community_engagement",
        "vertical=creator_economy",
    ),
    cost_budget_per_workflow_run=0.10,  # USD ceiling per workflow run (per arch § 6.6)
)


# ════════════════════════════════════════════════════════════════════════════
# Comunify CohortEnrollmentWorkflow descriptor instance (T-workflows-2)
# ════════════════════════════════════════════════════════════════════════════


comunify_cohort_enrollment_descriptor = WorkflowDescriptor(
    workflow_slug="comunify.cohort_enrollment",
    workflow_class="CohortEnrollmentWorkflow",
    version="v1",
    eligible_tenants_filter={"brand_slug": "comunify"},
    eligible_niches=(
        "business_coaching",
        "health_creator",
        "course_creator",
        "content_creator",
    ),
    trigger_event="LeadQualified",
    cron_schedule_rules=(
        # Payment reminder cadence
        CronRule(
            milestone="payment_followup_24h",
            offset_days_since_last_activity=1,  # +24h since payment_pending entered
            hour_local=10,
        ),
        CronRule(
            milestone="payment_followup_48h",
            offset_days_since_last_activity=2,  # +48h since payment_pending entered
            hour_local=10,
        ),
        # Embedded DunningWorkflow retry cadence (D19)
        CronRule(
            milestone="dunning_retry_1",
            offset_days_since_last_activity=3,  # +3d from first failure
            hour_local=10,
        ),
        CronRule(
            milestone="dunning_retry_2",
            offset_days_since_last_activity=7,  # +7d cumulative
            hour_local=10,
        ),
        CronRule(
            milestone="dunning_suspend",
            offset_days_since_last_activity=14,  # +14d cumulative
            hour_local=10,
        ),
    ),
    state_persister="redis_saver",  # D10 target; MemorySaver until package install
    observability_tags=(
        "workflow=cohort_enrollment",
        "vertical=creator_economy",
    ),
    cost_budget_per_workflow_run=0.20,  # USD ceiling per arch § 6.6 (cohort + embedded dunning combined)
)
