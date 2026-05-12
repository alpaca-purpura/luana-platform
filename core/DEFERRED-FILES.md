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

## Story 5 deferrals (2026-05-11)

Story 5 (`luana-brand-offer-studios`) lifted 2 packages (brand-studio +
offer-studio). The following files are deferred to later stories per 03-arch.md §9.6.

### Defer to Story 6 (copilot lift)

`copilot_provider/` subfolders import `src.modules.copilot.domain.{ports, workflow}`
— deferred when their consumer (`luana-core-copilot`) lifts.

| Source (AISALESHT) | Target package | Reason |
|---|---|---|
| `backend/src/modules/brand/copilot_provider/*` (8 files) | `luana-core-brand-studio` | Imports `src.modules.copilot.domain.{ports, workflow}` |
| `backend/src/modules/offer/copilot_provider/*` (5 files) | `luana-core-offer-studio` | Imports `src.modules.copilot.domain.{ports, workflow}` |
| `backend/src/modules/offer/api/offer_ai.py` | `luana-core-offer-studio` | Imports `src.modules.copilot.application.services.offer_psychology_service` |
| `backend/tests/modules/brand/test_brand_context_injector.py` | `luana-core-brand-studio` | Imports copilot ports |
| `backend/tests/modules/brand/test_buyer_persona_fields_dropped_regression.py` | `luana-core-brand-studio` | Imports copilot |
| `backend/tests/modules/brand/test_worker_emits_summary_and_pills.py` | `luana-core-brand-studio` | Imports copilot |
| `backend/tests/modules/offer/test_offer_data_access_provider.py` | `luana-core-offer-studio` | Tests `copilot_provider/provider.py` |

### Defer to Story 8 (campaigns / advertising lift)

`counts.py` + `campaigns.py` import `src.modules.advertising.*` — deferred to
Story 8 (campaigns/advertising lift).

| Source (AISALESHT) | Target package | Reason |
|---|---|---|
| `backend/src/modules/offer/api/counts.py` | `luana-core-offer-studio` | Imports `src.modules.advertising.application.services.offer_campaigns_read_adapter` |
| `backend/src/modules/offer/api/campaigns.py` | `luana-core-offer-studio` | Idem |

Note: `test_offer_ai_endpoint.py` was lifted but contains `@pytest.mark.skip`
decorators referencing the deferred `offer_ai.py` routes. Similar pattern for
`test_counts_api.py` + `test_campaigns_api.py` (module-level `pytest.skip` at
import time, deferred Story 8).

### Reserved (design decisions, NOT existing AISALESHT code)

These are NEW abstractions/data per outcome §7 ADR-001 and outcome §11 voice
cloning roadmap — they do NOT exist in AISALESHT today and will be introduced
in future stories.

| Reserved item | Future story | Notes |
|---|---|---|
| `BrandVoicePort` Protocol | Story 7 (sales_agent / copilot lift) | Consumer-side intro; impl in core-brand-studio wired then. Story 5 forbids new abstractions (§7.3) — verbatim placement of existing `PersonalityCompiler` only |
| `voice_cloning` BrandConfig flag | Stories 11-13 (per-brand vertical bootstrap) | Per-brand value at vertical bootstrap; BrandConfig schema itself in Story 8/9 |
| Voice cloning pipeline (LLM-distillation from chat samples) | Stories 11-13 | NEW code, does NOT exist in AISALESHT today |

## Story 6 deferrals (2026-05-11) + unlifts

### UNLIFTED Story 6 (previously deferred Stories 2-5 — 30 files)

T-16 (commit `ca3cd18`) lifted these `copilot_provider/` subfolders + cross-coupling
tests + `offer_ai.py` from their host packages now that `luana_core_copilot.domain.ports`
exists. All discoverable via `nicolify.copilot_providers` entry-points (T-20 wiring
across 8 pyproject.toml files).

| Source (AISALESHT) | Target package | Count |
|---|---|---|
| `backend/src/modules/commercial_calendar/copilot_provider/*` (Story 3 defer) | `luana-core-commercial-calendar` | 2 |
| `backend/src/modules/social_proof/copilot_provider/*` (Story 3 defer) | `luana-core-social-proof` | 2 |
| `backend/src/modules/crm/copilot_provider/*` (Story 4 defer) | `luana-core-crm` | 2 |
| `backend/src/modules/analytics/copilot_provider/*` (Story 4 defer) | `luana-core-analytics-engine` | 2 |
| `backend/src/modules/landing/copilot_provider/*` (Story 4 defer) | `luana-core-landing` | 2 |
| `backend/src/modules/connections/copilot_provider/*` (Story 4 defer) | `luana-core-connections` | 2 |
| `backend/src/modules/brand/copilot_provider/*` (Story 5 defer) | `luana-core-brand-studio` | 8 |
| `backend/src/modules/offer/copilot_provider/*` (Story 5 defer) | `luana-core-offer-studio` | 5 |
| `backend/src/modules/offer/api/offer_ai.py` (Story 5 defer) | `luana-core-offer-studio` | 1 |
| Cross-coupling tests (Story 5 defer — 3 brand + 1 offer) | various | 4 |

Total: **30 files unlifted** in T-16. Validates D-T1 frozen registry contracts (V-AG-3
snapshot) — these 8 packages' providers consume `ToolRegistry` / `WorkflowRegistry` /
`ExtractorRegistry` / `ModuleRegistry` / `SuggestionRegistry` public APIs unchanged.

### NEW Story 6 deferrals

#### Defer to Story 7 (sales_agent lift)

Per T-17 R26 deferral (`docs/product/stories/luana-copilot-engine/T-17-impl-log.md`):
the architect spec for T-17 ("MessageModel stub cleanup") was premise-mismatched —
`MessageModel` lives in **sales_agent territory** (per `.claude/skills/sales-agent-expert`
§3 forbidden-touch list), NOT copilot. Story 7 sales_agent lift will:
1. Create `luana_core_sales_agent.persistence.models.message_model`
2. Replace MessageModel stubs in offer-studio + copilot + crm + connections conftest.py
   with real `luana_core_sales_agent` imports

| Source (AISALESHT) | Target package | Reason |
|---|---|---|
| `backend/src/modules/sales_agent/infrastructure/models/message_model.py` | `luana-core-sales-agent` | Native sales_agent SQLA model — Story 7 lift |
| MessageModel stubs in 4 conftest.py files | (consumer modules) | Replaced by real import post Story 7 |
| `connections/api/dependencies/__init__.py` real `ChatOrchestrator` wiring | `luana-core-connections` | Requires `luana_core_sales_agent.MessageHandlerPort` impl |
| `_event_types()` lazy import in `application/tools/offer_section_tools.py` | `luana-core-copilot` | Type-ignored until `luana_core_scheduling` lifts |

#### Defer to Story 8 (scheduling lift — campaigns-extension-sdk batch)

| Source (AISALESHT) | Target package | Reason |
|---|---|---|
| AppointmentModel stubs in 4 conftest.py files | (consumer modules) | Scheduling module lifts in Story 8 |
| ProductModel / `_ProductStub` stubs in 4 conftest.py files | (consumer modules) | Catalog/product module lifts in Story 8 |

#### Defer to Story 10 (nicolify shell migration)

Streamlit admin pages stay in AISALESHT until nicolify shell migrates as the
SaaS host application:

| Source (AISALESHT) | Target | Notes |
|---|---|---|
| `backend/src/admin/pages/trazas.py` | nicolify shell (Story 10) | Copilot trace event admin |
| `backend/src/admin/pages/copilot-routing.py` | nicolify shell (Story 10) | F8 routing log viewer |
| `backend/src/admin/pages/costo-copilot.py` | nicolify shell (Story 10) | Cost dashboard |
| `backend/src/admin/pages/copilot-limits.py` | nicolify shell (Story 10) | Per-tenant limits admin |
| `backend/src/admin/pages/copilot-quality.py` | nicolify shell (Story 10) | F9 weekly judge report |
| `backend/src/admin/pages/marketing-kb.py` | nicolify shell (Story 10) | F10 KB curation UI |
| `backend/src/admin/pages/brand-summaries.py` | nicolify shell (Story 10) | F3 lighthouse viewer |
| `backend/src/admin/app.py` + `modules/` + `pages/__init__.py` | nicolify shell (Story 10) | Streamlit registry shell |

### Reserved (NEW abstractions, NOT existing AISALESHT code)

| Reserved item | Future story | Notes |
|---|---|---|
| EP-1..EP-5 Extension SDK formalization | Story 8 | Story 6 freezes registries per D-T1; Story 8 wraps as formal SDK without changing internals |
| BrandVoicePort introduction | Story 7 (D-T3) | Story 6 does NOT introduce; Story 7 architect handles consumer-side wiring |

### Pre-existing Story 5 territory (V-F-x-2 conftest collision workspace constraint)

Documented for completeness — not Story 6's responsibility:

- Some Story 5 conftest.py fixtures collide across brand-studio + offer-studio
  workspace test collection. Pre-existing constraint flagged Story 5; Story 6
  inherits without action.

## Lift rule

All deferred files follow the lift-verbatim constraint: when they are lifted,
they must be copied with only import path rewrites (no logic changes). The
`src.modules.*` imports become `luana_core_*` imports pointing to the
corresponding lifted package.
