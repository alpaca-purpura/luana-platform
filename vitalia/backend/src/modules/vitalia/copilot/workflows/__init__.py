"""Vitalia copilot workflows — registered via EP-4 in extensions.py.

Story 11 T-workflow-1 (R23 Opus 4.7 production AGENTIC code).

Public surface:
  - TreatmentFollowupState — workflow state TypedDict
  - build_treatment_followup_workflow — factory
  - handle_treatment_followup_tick — cron tick entry point
  - register_cron_handler — local registry decorator (lift-shared deferred)
  - get_workflow_cost_budget_usd — descriptor accessor for cost validators

Anti-duplication audit (per .claude/rules/anti-duplication.md):
  - No existing TreatmentFollowupWorkflow class anywhere in luana-platform
    or AISALESHT — NEW class, no mirror risk.
  - Cron handler registry: NO existing primitive in @luana/core/scheduling.
    LOCAL implementation per cron_handler.py audit (lift-shared deferred).
  - module_registry_entry.WorkflowDescriptor is vitalia-local (luana-core
    ModuleDescriptor is a different concept: copilot data introspection).
"""

from src.modules.vitalia.copilot.workflows.cron_handler import (
    get_registered_cron_handlers,
    handle_treatment_followup_tick,
    register_cron_handler,
)
from src.modules.vitalia.copilot.workflows.module_registry_entry_helpers import (
    get_workflow_cost_budget_usd,
    get_workflow_observability_tags,
    get_workflow_trigger_event,
)
from src.modules.vitalia.copilot.workflows.treatment_followup_workflow import (
    CheckpointerProtocol,
    TreatmentFollowupState,
    build_treatment_followup_workflow,
)

__all__ = [
    "CheckpointerProtocol",
    "TreatmentFollowupState",
    "build_treatment_followup_workflow",
    "get_registered_cron_handlers",
    "get_workflow_cost_budget_usd",
    "get_workflow_observability_tags",
    "get_workflow_trigger_event",
    "handle_treatment_followup_tick",
    "register_cron_handler",
]
