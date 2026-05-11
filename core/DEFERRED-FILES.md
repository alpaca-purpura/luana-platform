# Deferred Files — Story 2 + Story 3 Audit Trail

Files from `AISALESHT/backend/src/shared/` that were intentionally NOT lifted
in Story 2 (`luana-shared-lift`) because they import from `src.modules.{copilot,
sales_agent}`. They will lift when their consumer modules lift in later stories.

## Deferred to Story 6 (copilot lift)

| Source (AISALESHT) | Reason |
|---|---|
| `backend/src/shared/workers/copilot_quality_eval.py` | Imports `src.modules.copilot.*` |
| `backend/src/shared/workers/copilot_rag_eval.py` | Imports `src.modules.copilot.*` |
| `backend/tests/shared/workers/test_copilot_quality_eval.py` | Tests above worker |
| `backend/tests/shared/workers/test_copilot_rag_eval.py` | Tests above worker |

## Deferred to Story 7 (sales_agent lift)

| Source (AISALESHT) | Reason |
|---|---|
| `backend/src/shared/workers/sales_agent_quality_eval.py` | Imports `src.modules.sales_agent.*` |
| `backend/src/shared/application/personality_event_handlers.py` | Imports `src.modules.sales_agent.*` |
| `backend/tests/shared/workers/test_sales_agent_quality_eval.py` | Tests above worker |
| `backend/tests/shared/application/test_personality_event_handlers.py` | Tests above handler |

## Deferred arch tests

Three arch fitness tests from `AISALESHT/backend/tests/architecture/` are
deferred to `core/tests/architecture/_deferred/` for the same reason:

| File | Reason |
|---|---|
| `_deferred/test_extraction_orchestrator_inheritance.py` | Scans `src/modules/*/application/` — no equivalent in luana-platform yet |
| `_deferred/test_llm_routing_ssot.py` | Imports `src.core.config.Settings` from AISALESHT layout |
| `_deferred/test_channels_router_invariants.py` | Imports `src.modules.campaigns.*` |

These will be migrated to active arch tests when their respective packages lift.

## Story 3 deferrals

Story 3 (`luana-iam-tenancy-content`) lifted 6 packages. Two subfolders depend on
`src.modules.copilot.domain.ports` — deferred to Story 6 (copilot lift).

| Source (AISALESHT) | Target package | Reason |
|---|---|---|
| `backend/src/modules/commercial_calendar/copilot_provider/__init__.py` | `luana-core-commercial-calendar` | Imports `src.modules.copilot.domain.ports` |
| `backend/src/modules/commercial_calendar/copilot_provider/provider.py` | `luana-core-commercial-calendar` | Imports `src.modules.copilot.domain.ports` |
| `backend/src/modules/social_proof/copilot_provider/__init__.py` | `luana-core-social-proof` | Imports `src.modules.copilot.domain.ports` |
| `backend/src/modules/social_proof/copilot_provider/provider.py` | `luana-core-social-proof` | Imports `src.modules.copilot.domain.ports` |

These will lift in Story 6 alongside `luana-core-copilot`.

## Story 4 deferrals

Story 4 (`luana-crm-analytics-landing-connections`) lifted 4 packages. Nine files
are deferred to later stories.

### Deferred to Story 6 (copilot lift)

These subfolders import `src.modules.copilot.domain.ports` — deferred when their
consumer (`luana-core-copilot`) lifts.

| Source (AISALESHT) | Target package | Reason |
|---|---|---|
| `backend/src/modules/crm/copilot_provider/__init__.py` | `luana-core-crm` | Imports `src.modules.copilot.domain.ports` |
| `backend/src/modules/crm/copilot_provider/provider.py` | `luana-core-crm` | Imports `src.modules.copilot.domain.ports` |
| `backend/src/modules/analytics/copilot_provider/__init__.py` | `luana-core-analytics-engine` | Imports `src.modules.copilot.domain.ports` |
| `backend/src/modules/analytics/copilot_provider/provider.py` | `luana-core-analytics-engine` | Imports `src.modules.copilot.domain.ports` |
| `backend/src/modules/landing/copilot_provider/__init__.py` | `luana-core-landing` | Imports `src.modules.copilot.domain.ports` |
| `backend/src/modules/landing/copilot_provider/provider.py` | `luana-core-landing` | Imports `src.modules.copilot.domain.ports` |
| `backend/src/modules/connections/copilot_provider/__init__.py` | `luana-core-connections` | Imports `src.modules.copilot.domain.ports` |
| `backend/src/modules/connections/copilot_provider/provider.py` | `luana-core-connections` | Imports `src.modules.copilot.domain.ports` |

### Deferred to Story 7 (ChatOrchestrator composition root)

The connections `api/dependencies/__init__.py` wires `ChatOrchestrator` as the
concrete `MessageHandlerPort` implementation — not available until `luana-core-copilot`
and `luana-core-sales-agent` both lift.

| Source (AISALESHT) | Target package | Reason |
|---|---|---|
| `backend/src/modules/connections/api/dependencies/__init__.py` (real wiring) | `luana-core-connections` | Requires `ChatOrchestrator` from Story 7 (sales_agent lift) |

Note: A `NotImplementedError` stub is in place at the same path in `luana-core-connections`
to keep the package import-compatible until Story 7 completes.

### Deferred to Story 8 (campaigns lift — forward coupling)

Two CRM files and their test forward-couple to `src.modules.campaigns.*` which
lifts in Story 8.

| Source (AISALESHT) | Target package | Reason |
|---|---|---|
| `backend/src/modules/crm/application/services/contact_query_service.py` | `luana-core-crm` | Imports `src.modules.campaigns.*` |
| `backend/src/modules/crm/api/contacts.py` | `luana-core-crm` | Imports `contact_query_service` (forward couple) |
| `backend/tests/modules/crm/test_contacts_api.py` | `luana-core-crm` | Tests above API endpoint |

## Lift rule

All deferred files follow the lift-verbatim constraint: when they are lifted,
they must be copied with only import path rewrites (no logic changes). The
`src.modules.*` imports become `luana_core_*` imports pointing to the
corresponding lifted package.
