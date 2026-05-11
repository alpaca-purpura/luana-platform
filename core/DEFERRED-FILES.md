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

## Lift rule

All deferred files follow the lift-verbatim constraint: when they are lifted,
they must be copied with only import path rewrites (no logic changes). The
`src.modules.*` imports become `luana_core_*` imports pointing to the
corresponding lifted package.
