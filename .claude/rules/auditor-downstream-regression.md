# Auditor Downstream Regression Scope (Multibrand)

**Origen:** PI-12 S1 Story A T-1 (2026-05-04). Auditor `auditor-backend` aprobó cost_recorder canonicalization PASS — pero NO corrió tests downstream que mockean callback_handler en `modules/{copilot,sales_agent}/observability/`. Bug `litellm.get_llm_provider("kimi/kimi-k2.6")` raises BadRequestError llegó a S1 (T-1-bis micro-ticket nuevo). Severidad: **CRÍTICA**.

**Multibrand update 2026-05-15:** post reorg, shared abstractions viven en `core/luana-core-*/src/luana_core_*/` (26 packages), no en `backend/src/shared/`. Tests viven en `core/luana-core-*/tests/` (engine consumers) Y en `{brand}/backend/tests/` (brand-specific consumers). Brands actuales: **vitalia · nicolify · comunify · lupulo** (4 activos; 6 pendientes bootstrap: saasora, inmoflow, retailly, fixia, guestly, fitflow). Workspace root: `/home/chalreme/Proyectos/luana-platform/` (variable `${WS}` en comandos).

## Regla cardinal

Cuando auditor reviewing PR toca código `core/luana-core-*/` (engine), brand extension (`{brand}/backend/src/modules/{brand}/...`), o módulo con consumers cross-brand conocidos, MUST:

1. **Engine edit detection** — verificar promotion proposal (si toca `core/luana-core-*/src/`)
2. **Cross-brand mirror scan** — detectar duplicación (si toca `{brand}/backend/src/modules/{brand}/`)
3. **Downstream test run** — ejecutar tests cross-consumer per tabla SSoT abajo

**Mecánica:** auditor lee diff `git diff --name-only HEAD~N..HEAD`. Para cada path tocado:
- Infiere `BRAND` (primera componente path si match `^[a-z]+/(backend|frontend)/`, sino "engine")
- Lookup tabla SSoT → agrega downstream tests (engine + per-brand consumers)
- Spawn gate-runner adicional con scope si no cubierto en gate-output.json original

## Tabla SSoT — surface → downstream test paths (multibrand)

> Mantener actualizada cuando agregás nueva surface engine cross-consumer o nuevo brand consumer.
>
> **Convención paths:**
> - `${WS}` = `/home/chalreme/Proyectos/luana-platform/`
> - `${BRANDS}` = `{vitalia, nicolify, comunify, lupulo}` (4 activos). Cuando aplique, expandir cada brand.
> - Engine packages: `core/luana-core-{pkg}/src/luana_core_{pkg}/` (tests en `core/luana-core-{pkg}/tests/`)
> - Brand consumers: `{brand}/backend/tests/...` per brand listada
> - Pre-multibrand legacy paths (`backend/src/shared/...`, `backend/tests/modules/...`) NO aparecen en surfaces vivas — solo en ejemplos marcados `LEGACY:` al final.

### A) Engine: `luana-core-observability`

| Surface modified (path) | Downstream test paths que MUST run | Razón |
|---|---|---|
| `core/luana-core-observability/src/luana_core_observability/recording/turn_envelope.py` | `core/luana-core-observability/tests/recording/`<br>`core/luana-core-copilot/tests/observability/`<br>`core/luana-core-sales-agent/tests/observability/`<br>`{brand}/backend/tests/modules/{brand}/copilot/observability/` ∀ brand ∈ ${BRANDS}<br>`{brand}/backend/tests/modules/{brand}/sales_agent/observability/` ∀ brand ∈ ${BRANDS} | TurnEnvelope base class — engine copilot + sales-agent extienden + brand extensions overlay |
| `core/luana-core-observability/src/luana_core_observability/recording/base_callback_handler.py` | `core/luana-core-copilot/tests/observability/test_callback_handler*.py`<br>`core/luana-core-sales-agent/tests/observability/test_callback_handler*.py`<br>`{brand}/backend/tests/modules/{brand}/{copilot,sales_agent}/observability/test_callback_handler*.py` ∀ brand | Callback base class (engine + brand overlays) |
| `core/luana-core-observability/src/luana_core_observability/cost/calculator.py` | `core/luana-core-observability/tests/cost/`<br>`core/luana-core-copilot/tests/observability/test_callback_handler_usage*.py`<br>`core/luana-core-sales-agent/tests/observability/test_callback_handler.py`<br>`{brand}/backend/tests/modules/{brand}/{copilot,sales_agent}/observability/` ∀ brand | Cost calculator consumido por todos callbacks (engine + brand) |
| `core/luana-core-observability/src/luana_core_observability/cost/pricing_resolver.py` | idem (filas calculator.py) | Pricing resolver |
| `core/luana-core-observability/src/luana_core_observability/cost/fx_resolver.py` | idem | FX resolver |
| `core/luana-core-observability/src/luana_core_observability/cost/cost_recorder.py` | `core/luana-core-copilot/tests/observability/test_callback_handler_usage_fallbacks.py`<br>`core/luana-core-sales-agent/tests/observability/test_callback_handler.py::TestOnChatModelEnd::test_persists_row_with_sales_columns`<br>`{brand}/backend/tests/modules/{brand}/{copilot,sales_agent}/observability/` ∀ brand | **CASO ORIGEN D4** — cost_recorder consumido por callback handlers engine + brand overlays |
| `core/luana-core-observability/src/luana_core_observability/persistence/base_trace_event_repo.py` | `core/luana-core-copilot/tests/observability/test_*_repo*.py`<br>`core/luana-core-sales-agent/tests/observability/test_*_repo*.py`<br>`{brand}/backend/tests/modules/{brand}/{copilot,sales_agent}/observability/test_*_repo*.py` ∀ brand | Trace event repo base |
| `core/luana-core-observability/src/luana_core_observability/persistence/base_llm_call_repo.py` | idem | LLM call repo base |
| `core/luana-core-observability/src/luana_core_observability/persistence/tenant_billing_config_repository.py` | `core/luana-core-billing/tests/`<br>`core/luana-core-copilot/tests/observability/`<br>`core/luana-core-sales-agent/tests/observability/`<br>`{brand}/backend/tests/modules/{brand}/{copilot,sales_agent}/observability/` ∀ brand | Billing config tenant |
| `core/luana-core-observability/src/luana_core_observability/channels/format_for_channel.py` | `core/luana-core-copilot/tests/`<br>`core/luana-core-sales-agent/tests/`<br>`{brand}/backend/tests/modules/{brand}/{copilot,sales_agent}/` ∀ brand | Channel format dispatcher |
| `core/luana-core-observability/src/luana_core_observability/channels/intent_detector.py` | idem | Intent detector |

### B) Engine: `luana-core-extraction`, `luana-core-llm`

| Surface modified (path) | Downstream test paths que MUST run | Razón |
|---|---|---|
| `core/luana-core-extraction/src/luana_core_extraction/application/base_orchestrator.py` | `core/luana-core-extraction/tests/`<br>`core/luana-core-brand-studio/tests/application/test_extraction*.py`<br>`core/luana-core-offer-studio/tests/application/test_extraction*.py`<br>`core/luana-core-landing/tests/application/test_extraction*.py`<br>`{brand}/backend/tests/modules/{brand}/{brand,offer,landing,buyer_persona}/application/test_extraction*.py` ∀ brand | Wave-based extraction base (engine + brand extractors overlay) |
| `core/luana-core-llm/src/luana_core_llm/router.py` | `core/luana-core-llm/tests/`<br>`core/luana-core-copilot/tests/`<br>`core/luana-core-sales-agent/tests/`<br>`core/luana-core-brand-studio/tests/`<br>`core/luana-core-offer-studio/tests/`<br>`core/luana-core-landing/tests/`<br>`{brand}/backend/tests/modules/{brand}/` ∀ brand (all llm callers) | LLM router consumido cross-engine + cross-brand |
| `core/luana-core-llm/src/luana_core_llm/providers/litellm.py` | idem fila router.py | LiteLLM service (canonical post PI-12 S1 T-5) |
| `core/luana-core-llm/src/luana_core_llm/providers/{kimi,deepseek,openai,qwen,gemini}.py` | `core/luana-core-llm/tests/providers/`<br>`core/luana-core-copilot/tests/observability/test_callback_handler_usage*.py`<br>`core/luana-core-sales-agent/tests/observability/`<br>`{brand}/backend/tests/modules/{brand}/{copilot,sales_agent}/observability/` ∀ brand | Provider adapters |

### C) Engine: `luana-core-events`, `luana-core-idempotency`, `luana-core-billing`, `luana-core-compliance`

| Surface modified (path) | Downstream test paths que MUST run | Razón |
|---|---|---|
| `core/luana-core-events/src/luana_core_events/outbox/` | `core/luana-core-events/tests/`<br>`core/luana-core-sales-agent/tests/`<br>`core/luana-core-copilot/tests/`<br>`core/luana-core-brand-studio/tests/`<br>`{brand}/backend/tests/modules/{brand}/` ∀ brand (outbox consumers) | Outbox pattern (per anti-default-flip USE_OUTBOX_PATTERN_*) |
| `core/luana-core-idempotency/src/luana_core_idempotency/` | `core/luana-core-idempotency/tests/`<br>`core/luana-core-platform/tests/` (scheduling)<br>`core/luana-core-connections/tests/`<br>`{brand}/backend/tests/modules/{brand}/{scheduling,connections}/` ∀ brand | Idempotency keys |
| `core/luana-core-billing/src/luana_core_billing/` (BudgetGuard, RateLimiter) | `core/luana-core-billing/tests/`<br>`core/luana-core-sales-agent/tests/`<br>`core/luana-core-campaigns/tests/`<br>`core/luana-core-copilot/tests/`<br>`{brand}/backend/tests/modules/{brand}/{sales_agent,campaigns,copilot}/` ∀ brand | Billing guards (engine + brand consumers) |
| `core/luana-core-compliance/src/luana_core_compliance/` (ComplianceService) | `core/luana-core-compliance/tests/`<br>`core/luana-core-campaigns/tests/`<br>`core/luana-core-sales-agent/tests/`<br>`{brand}/backend/tests/modules/{brand}/{campaigns,sales_agent}/` ∀ brand | Compliance gates |
| `core/luana-core-events/src/luana_core_events/` (DomainEvent base) | `core/luana-core-events/tests/`<br>`core/luana-core-{m}/tests/application/` for each engine `{m}` in diff<br>`{brand}/backend/tests/modules/{brand}/{m}/application/` ∀ brand for each `{m}` in diff | Domain events cross-engine + cross-brand |

### D) Engine: `luana-core-extension-sdk`, `luana-core-platform`

| Surface modified (path) | Downstream test paths que MUST run | Razón |
|---|---|---|
| `core/luana-core-extension-sdk/src/luana_core_extension_sdk/ports/` | `core/luana-core-extension-sdk/tests/`<br>`core/luana-core-{m}/tests/` para each engine importer del port<br>`{brand}/backend/tests/modules/{brand}/` ∀ brand (extensions.py register_all consumers) | Cross-module ports (EP-1..EP-18 registry) |
| `core/luana-core-extension-sdk/src/luana_core_extension_sdk/extension_points.py` | `core/luana-core-extension-sdk/tests/test_registry*.py`<br>`{brand}/backend/tests/modules/{brand}/test_extensions.py` ∀ brand | EP registry (any new EP requires brand re-register audit) |
| `core/luana-core-platform/src/luana_core_platform/domain/locale.py::TenantLocale` | `core/luana-core-platform/tests/`<br>`core/luana-core-{m}/tests/` con timezone/locale<br>`{brand}/backend/tests/modules/{brand}/` ∀ brand con timezone/locale | Locale VO |
| `core/luana-core-platform/src/luana_core_platform/config.py` defaults flip | Per `.claude/rules/anti-default-flip-audit.md` Step 1 grep tests path viejo (cross engine + cross brand) | Default flip side-effect (PI-11 origin) |
| `core/luana-core-platform/src/luana_core_platform/enums/` | grep usage cross-codebase (engine + brand) + run all tests cross-module | Enums shared (engine + brand consumers) |

### E) Engine + brand extension: `copilot`, `sales-agent`

| Surface modified (path) | Downstream test paths que MUST run | Razón |
|---|---|---|
| `core/luana-core-copilot/src/luana_core_copilot/observability/recording/` | `core/luana-core-copilot/tests/observability/`<br>`{brand}/backend/tests/modules/{brand}/copilot/observability/` ∀ brand<br>arch fitness: shared abstraction non-mirror (per anti-duplication.md) | Engine recording layer |
| `core/luana-core-sales-agent/src/luana_core_sales_agent/observability/recording/` | `core/luana-core-sales-agent/tests/observability/`<br>`{brand}/backend/tests/modules/{brand}/sales_agent/observability/` ∀ brand<br>arch fitness | idem sales-agent |
| `core/luana-core-copilot/src/luana_core_copilot/domain/module_registry.py` | `core/luana-core-copilot/tests/architecture/` arch test ModuleDescriptor entry required<br>`{brand}/backend/tests/modules/{brand}/copilot/` ∀ brand | Per SSoT guard |
| `{brand}/backend/src/modules/{brand}/copilot/{extractors,tools,workflows,kb}/` | `{brand}/backend/tests/modules/{brand}/copilot/`<br>**Cross-brand mirror scan** ∀ otro brand ∈ ${BRANDS} (ver § Cross-brand mirror detection) | Brand copilot extension overlay (EP-3, EP-4, EP-5, EP-6) |
| `{brand}/backend/src/modules/{brand}/sales_agent/{tools,personas,goldens}/` | `{brand}/backend/tests/modules/{brand}/sales_agent/`<br>`{brand}/backend/tests/agentic_evals/sales_agent/`<br>**Cross-brand mirror scan** ∀ otro brand | Brand sales_agent extension overlay |

### F) Agentic evals: simulator (engine shared) + brand goldens

| Surface modified (path) | Downstream test paths que MUST run | Razón |
|---|---|---|
| `core/luana-core-sales-agent/src/luana_core_sales_agent/observability/eval_simulator/` | `core/luana-core-sales-agent/tests/agentic_evals/simulator/test_simulator_smoke.py`<br>`core/luana-core-sales-agent/tests/agentic_evals/simulator/test_concurrency_property.py`<br>`core/luana-core-sales-agent/tests/agentic_evals/simulator/test_schema_migration_regression.py`<br>`core/luana-core-sales-agent/tests/agentic_evals/simulator/test_termination_registry.py`<br>`core/luana-core-sales-agent/tests/architecture/test_eval_simulator_observability_invariants.py`<br>`core/luana-core-sales-agent/tests/architecture/test_simulator_no_mirrors_shared.py`<br>`core/luana-core-sales-agent/tests/architecture/test_simulator_writes_eval_kind_tag.py`<br>`core/luana-core-sales-agent/tests/architecture/test_simulator_public_api_surface.py`<br>`core/luana-core-sales-agent/tests/architecture/test_termination_policy_registry_contract.py`<br>`core/luana-core-sales-agent/tests/architecture/test_schema_migrations_registry_complete.py`<br>`{brand}/backend/tests/agentic_evals/sales_agent/` ∀ brand | Eval simulator schema-mirror surface (Story B). Cost-bucket separation tables consumed por smoke + property + schema regression suite + brand goldens runners. |
| `core/luana-core-sales-agent/tests/agentic_evals/simulator/_internal/personas_loader.py` | `core/luana-core-sales-agent/tests/agentic_evals/simulator/test_personas_loader.py`<br>`core/luana-core-sales-agent/tests/agentic_evals/simulator/test_simulator_smoke.py`<br>`core/luana-core-sales-agent/tests/agentic_evals/simulator/test_customer_prompt_v2_unit.py`<br>`core/luana-core-sales-agent/tests/agentic_evals/simulator/test_customer_node_unit.py`<br>`core/luana-core-sales-agent/tests/architecture/test_personas_yaml_completeness.py` | Story C personas loader — ActorProfile via `load_actor_profile_for_tenant()` + ARCHETYPE_DIALECT_MAP. |
| `core/luana-core-sales-agent/tests/agentic_evals/simulator/_internal/customer_persona_prompt.py` | `core/luana-core-sales-agent/tests/agentic_evals/simulator/test_customer_prompt_v2_unit.py`<br>`core/luana-core-sales-agent/tests/agentic_evals/simulator/test_customer_node_unit.py`<br>`core/luana-core-sales-agent/tests/agentic_evals/simulator/test_simulator_smoke.py` | Story C Customer Prompt V2 — V1 byte-equal preservation + V2 sub-slot rotation. Cache prefix safety. |
| `core/luana-core-sales-agent/tests/agentic_evals/simulator/_internal/customer_node.py` | `core/luana-core-sales-agent/tests/agentic_evals/simulator/test_customer_node_unit.py`<br>`core/luana-core-sales-agent/tests/agentic_evals/simulator/test_simulator_smoke.py` | Story C V1/V2 dispatch + eval_metadata 3 NEW keys. Story B 6-key invariants preserved. |
| `docs/specs/personas/archetype-aware/*.yaml` (PLATFORM cross-brand) | `core/luana-core-sales-agent/tests/architecture/test_personas_yaml_completeness.py`<br>`core/luana-core-sales-agent/tests/agentic_evals/simulator/test_personas_loader.py`<br>`{brand}/backend/tests/agentic_evals/sales_agent/` ∀ brand (consumen personas catalog cross-brand) | Story C 15 archetype-aware personas YAML catalog — schema enforced by arch fitness + loader contract. Voseo magic comment line 2 enforced for AR YAMLs. |
| `{brand}/backend/tests/agentic_evals/sales_agent/goldens/**` (per brand) | `{brand}/backend/tests/agentic_evals/sales_agent/test_goldens_schema.py`<br>`{brand}/backend/tests/agentic_evals/sales_agent/test_goldens_coverage.py`<br>`{brand}/backend/tests/agentic_evals/sales_agent/test_goldens_pii_scanner.py`<br>`{brand}/backend/tests/architecture/test_goldens_schema_completeness.py`<br>`{brand}/backend/tests/architecture/test_goldens_no_mirror_simulator_schema.py`<br>`{brand}/backend/tests/architecture/test_pii_patterns_single_source.py`<br>`{brand}/backend/tests/architecture/test_goldens_no_committed_pii.py`<br>`{brand}/backend/tests/architecture/test_goldens_cost_bucket_invariant.py`<br>`{brand}/backend/tests/scripts/test_generate_golden_candidates.py`<br>`{brand}/backend/tests/scripts/test_promote_golden.py` | Story D goldens dataset infra PER brand — schema cement v1 + 15-cell coverage matrix + 5 arch fitness gates + PII defense-in-depth. |
| `scripts/_pii_patterns.py` (platform script — shared cross-brand) | `core/luana-core-platform/tests/scripts/test_seed_pii_scanner.py`<br>`core/luana-core-platform/tests/scripts/test_pre_commit_hook.py`<br>`{brand}/backend/tests/agentic_evals/sales_agent/test_goldens_pii_scanner.py` ∀ brand<br>`{brand}/backend/tests/architecture/test_pii_patterns_single_source.py` ∀ brand | Story D LIFT shared PATTERNS dict — 9 regex categories. DRY threshold 2 consumers. Pre-commit hook Sections 8+9 + arch gate single-source. |
| `scripts/generate_golden_candidates.py` (platform script) | `{brand}/backend/tests/scripts/test_generate_golden_candidates.py` ∀ brand<br>`{brand}/backend/tests/architecture/test_goldens_cost_bucket_invariant.py` (env-gated `EVAL_GOLDENS_COST_BUCKET_VERIFY=1`) ∀ brand | Story D generation orchestrator — matrix 5×3×N cells, cost preflight strict abort, per-cell isolation, deterministic seeding uuid5. |
| `scripts/promote_golden.py` (platform script) | `{brand}/backend/tests/scripts/test_promote_golden.py` ∀ brand | Story D promotion CLI — auto-derive `expected_termination_reason` + `expected_tools_invoked` + `forbidden_tools`. Idempotent YAML safe_dump. |
| `core/luana-core-sales-agent/tests/agentic_evals/grader/_internal/maj_eval.py` | `core/luana-core-sales-agent/tests/agentic_evals/grader/test_maj_eval_unit.py`<br>`core/luana-core-sales-agent/tests/agentic_evals/grader/test_maj_eval_debate.py`<br>`core/luana-core-sales-agent/tests/agentic_evals/grader/test_maj_eval_happy.py`<br>`core/luana-core-sales-agent/tests/agentic_evals/grader/test_maj_eval_adversarial.py`<br>`core/luana-core-sales-agent/tests/agentic_evals/grader/test_judge_registry.py`<br>`core/luana-core-sales-agent/tests/agentic_evals/grader/test_grader_cache.py`<br>`core/luana-core-sales-agent/tests/agentic_evals/grader/test_unconverged_fallback.py`<br>`core/luana-core-sales-agent/tests/architecture/test_grader_sandbox_markers_enforced.py`<br>`core/luana-core-sales-agent/tests/architecture/test_grader_pii_sanitize_pre_judge.py`<br>`core/luana-core-sales-agent/tests/architecture/test_grader_round_2_no_self_reasoning.py`<br>`core/luana-core-sales-agent/tests/architecture/test_grader_writes_eval_only_bucket.py`<br>`core/luana-core-sales-agent/tests/architecture/test_grader_public_api_surface.py`<br>`{brand}/backend/tests/agentic_evals/sales_agent/grader/` ∀ brand (cuando brand opta-in grader) | Story E grader runtime — MAJ-EVAL state machine. Cost-bucket invariant H7 cement. Variance threshold 0.15 → Round 2 debate → unconverged fallback. |
| `core/luana-core-sales-agent/tests/agentic_evals/grader/_internal/judge_prompts.py` | `core/luana-core-sales-agent/tests/agentic_evals/grader/test_judge_prompts.py`<br>`core/luana-core-sales-agent/tests/agentic_evals/grader/test_maj_eval_adversarial.py`<br>`core/luana-core-sales-agent/tests/agentic_evals/grader/test_judge_no_system_leak.py`<br>`core/luana-core-sales-agent/tests/architecture/test_grader_sandbox_markers_enforced.py`<br>`core/luana-core-sales-agent/tests/architecture/test_grader_round_2_no_self_reasoning.py` | Story E sandbox markers DQ2 — defense-in-depth vs prompt-injection. Slot 5 literal markers + Round 2 peer-only critique. |
| `docs/specs/rubrics/qualification-accuracy.md` (PLATFORM cross-brand) | `core/luana-core-sales-agent/tests/agentic_evals/grader/test_maj_eval_unit.py`<br>`core/luana-core-sales-agent/tests/agentic_evals/grader/test_maj_eval_debate.py`<br>`core/luana-core-sales-agent/tests/agentic_evals/grader/test_maj_eval_happy.py`<br>`core/luana-core-sales-agent/tests/agentic_evals/grader/test_maj_eval_adversarial.py`<br>`core/luana-core-sales-agent/tests/agentic_evals/grader/test_grader_cache.py` | Story E rubric MD v1. Rubric MD bump → `rubric_version` change → cache invalidation → full re-grade cascade. |

### G) Brand business modules (analytics, offer, brand, landing, copilot domain registry)

| Surface modified (path) | Downstream test paths que MUST run | Razón |
|---|---|---|
| `{brand}/backend/src/modules/{brand}/{m}/api/` route changes (for the modifying brand) | `{brand}/backend/tests/modules/{brand}/{m}/api/`<br>`{brand}/frontend/src/features/{m}/api/` consumers if FE PR<br>**Cross-brand mirror scan** ∀ otro brand | Contract change ripple (brand-internal) |
| `{brand}/backend/src/modules/{brand}/{m}/domain/events.py` | grep `Event` class importers en `{brand}/backend/` + run their tests<br>`core/luana-core-events/tests/` si Event registered cross-brand | Cross-module event consumers (brand + engine bus) |
| `core/luana-core-analytics-engine/src/luana_core_analytics_engine/domain/extraction_contract.py` | Run `make extraction-contract` + arch test<br>`core/luana-core-analytics-engine/tests/`<br>`{brand}/backend/tests/modules/{brand}/analytics/` ∀ brand opta-in analytics | ETL contract regen (engine SSoT) |
| `core/luana-core-analytics-engine/src/luana_core_analytics_engine/domain/metric_catalog.py` | `core/luana-core-analytics-engine/tests/`<br>arch test catalog↔contract alignment<br>`{brand}/backend/tests/modules/{brand}/analytics/` ∀ brand | Catalog change (cross-brand) |
| `core/luana-core-offer-studio/src/luana_core_offer_studio/domain/{archetype,value_level,format}_catalog.py` | bump `_CATALOG_VERSION` + arch tests both stacks<br>`core/luana-core-offer-studio/tests/`<br>`{brand}/backend/tests/modules/{brand}/offer/` ∀ brand opta-in offer-studio<br>`{brand}/frontend/src/features/offer-studio/` ∀ brand (FE arch test cross-brand) | Per offer-catalogs.md (engine catalog cross-brand) |

### H) Frontend (per-brand)

| Surface modified (path) | Downstream test paths que MUST run | Razón |
|---|---|---|
| `{brand}/frontend/src/lib/api/fetchClient.ts` | `{brand}/frontend/src/features/*/api/` tests + `{brand}/frontend/e2e/` smoke (auth-tenant)<br>**Cross-brand mirror scan** ∀ otro brand (fetchClient pattern cross-brand) | Cross-feature API client base (per-brand fetcher) |
| `{brand}/frontend/src/lib/api/` (other shared API utils) | grep importers en `{brand}/frontend/src/features/` + their feature tests | Cross-feature API helpers (per-brand) |
| `{brand}/frontend/src/lib/tokens/` design tokens | `{brand}/frontend/src/__tests__/architecture/test-page-padding.test.ts`<br>studio section pages tests (`{brand}/frontend/src/features/`) | Design tokens consumed cross-studio per-brand |
| `{brand}/frontend/src/lib/format/` (formatMoney, formatTenantDate*) | grep importers en `{brand}/frontend/` + currency/locale tests cross-feature<br>**Cross-brand mirror scan** (formatters shared abstraction candidate) | Master-data formatters consumed cross-feature per-brand |
| `{brand}/frontend/src/hooks/` (global hooks like `useTenantLocale`) | grep importers across `{brand}/frontend/src/features/` + their tests | Global hooks consumed cross-feature per-brand |
| `{brand}/frontend/src/components/shared/` | grep importers en `{brand}/frontend/src/` + their feature tests + visual smoke E2E | Shared components rendered cross-feature per-brand |
| `{brand}/frontend/src/components/ui/` (Shadcn primitives) | full `{brand}/frontend/` vitest run + `{brand}/frontend/e2e/` smoke | UI primitives ripple universally per-brand |
| `{brand}/frontend/src/features/{m}/api/` | `{brand}/frontend/src/features/{m}/` full feature tests + smoke E2E for that route | Feature API contract change (brand-internal) |
| `{brand}/frontend/src/features/{m}/types/` exported | grep cross-feature importers en `{brand}/frontend/` + their tests | Type contract ripple cross-feature per-brand |
| `{brand}/frontend/src/lib/zod-schemas/` shared schemas | grep importers en `{brand}/frontend/` + form tests cross-feature<br>**Cross-brand mirror scan** (Zod schemas shared abstraction candidate) | Shared validation schemas per-brand |
| `{brand}/frontend/src/__tests__/architecture/*.test.ts` allowlist shrink | full `{brand}/frontend/` FE arch fitness suite | Ratchet enforcement per-brand |
| `{brand}/frontend/e2e/auth.fixture.ts` o `{brand}/frontend/e2e/fixtures/*` | full smoke project `{brand}/frontend/` + relevant POMs | E2E fixture change ripples to all auth-protected specs per-brand |
| `{brand}/frontend/playwright.config.ts` | full smoke project `{brand}/frontend/` | Config change affects every spec per-brand |

### I) Brand overlay rules + extensions registry

| Surface modified (path) | Downstream test paths que MUST run | Razón |
|---|---|---|
| `{brand}/.claude/rules/*.md` | Manual review per § Brand overlay scope (verify NO contradicción con `.claude/rules/` raíz) | Brand-specific rule overlay |
| `{brand}/backend/src/modules/{brand}/extensions.py::register_all(registry)` | `{brand}/backend/tests/modules/{brand}/test_extensions.py`<br>`core/luana-core-extension-sdk/tests/test_registry_brand_smoke.py` (si existe) | EP-1..EP-18 registration per-brand. Cambio en register_all puede romper brand bootstrap. |
| `{brand}/config/brand.yaml` (enabled_sections + field_overrides + preset_pack + feature flags) | `{brand}/backend/tests/modules/{brand}/{brand,offer}/` (config consumers)<br>`{brand}/frontend/src/features/brand-studio/` tests (overrides surface) | Brand config — flips comportamiento engine per-brand |

## Workflow auditor (Step `downstream_regression_scope` — multibrand)

```
# Pseudocode auditor agent inserts post consume_gate_output, pre audit_categories.
# WS = /home/chalreme/Proyectos/luana-platform
# BRANDS = vitalia nicolify comunify lupulo

1. List files modified in diff: git diff HEAD~N..HEAD --name-only

2. For each path → infer BRAND + classify scope:
   - Match `^core/luana-core-([^/]+)/src/` → scope=ENGINE, pkg=$1 → Step 2a
   - Match `^([a-z]+)/(backend|frontend)/` AND $1 in BRANDS → scope=BRAND, brand=$1 → Step 2b
   - Match `^docs/specs/(personas|rubrics)/` → scope=PLATFORM-CROSS-BRAND
   - Match `^scripts/` → scope=PLATFORM-SCRIPT
   - Match `^[a-z]+/\.claude/rules/` → scope=BRAND-OVERLAY → Step 2c (§ Brand overlay scope)
   - Otherwise → scope=UNCLASSIFIED, escalate Chris (likely LEGACY path needing migration)

2a. ENGINE scope (Step `engine_edit_detection`) — MANDATORY:
    - Verify `docs/promotion-protocol/proposals/*-{pkg}-*.md` exists with `state: accepted|migrated`
    - If NO proposal → FAIL with verdict: "engine edit sin promotion proposal. Escalar `/pm-luana` ANTES merge."
    - Lookup tabla SSoT → downstream_test_targets includes engine tests + ALL ${BRANDS} consumers

2b. BRAND scope (Step `cross_brand_mirror_scan`) — MANDATORY for brand extensions
    bajo `{brand}/backend/src/modules/{brand}/{copilot,sales_agent}/`:

    BRAND_A=<brand from step 2>
    for OTHER_BRAND in $BRANDS; do
      [ "$OTHER_BRAND" = "$BRAND_A" ] && continue
      # Find files con mismo basename en otro brand
      BASENAME=$(basename <path>)
      MATCHES=$(find ${WS}/$OTHER_BRAND/backend/src -name "$BASENAME" 2>/dev/null)
      if [ -n "$MATCHES" ]; then
        # Diff conceptual: si código sustancialmente igual → MIRROR
        diff <(git show HEAD:<path>) "$MATCHES" | head -50
      fi
    done

    Si MIRROR detected → FAIL AUTOMÁTICO con verdict:
    "cross-brand mirror detected: ${BRAND_A}/... <-> ${OTHER_BRAND}/...
     Pattern debe vivir en `core/luana-core-*/`, NUNCA mirror per-brand
     (per anti-duplication.md § lift shared rule).
     Escalar `/pm-luana` promotion proposal en `docs/promotion-protocol/proposals/`."

3. Aggregate downstream_test_targets = unión sets per matched path (expanded ∀ brand).

4. Verify gate-output.json scope cubre downstream_test_targets:
   - gate-runner.command was full multibrand suite (`make test-all`)? → cubierto
   - gate-runner.command was scoped (e.g., `core/luana-core-X/tests/`)? → puede no cubrir brand consumers

5. Si NO cubre → SPAWN gate-runner adicional con scope=downstream_test_targets:

   **Backend ENGINE scope:**
   ```
   Agent({
     description: "Run engine downstream regression for T-{n}",
     subagent_type: "gate-runner",
     model: "haiku",
     prompt: "<pr_folder>: <STORY_DIR>;
              <command>: cd ${WS} && .venv/bin/pytest <space-separated engine + brand test paths> -v --tb=short;
              <iter>: <N>-downstream-engine"
   })
   ```

   **Backend BRAND scope (per-brand):**
   ```
   Agent({
     description: "Run downstream BE regression for T-{n} brand=<BRAND>",
     subagent_type: "gate-runner",
     model: "haiku",
     prompt: "<pr_folder>: <STORY_DIR>;
              <command>: cd ${WS} && .venv/bin/pytest <BRAND>/backend/tests/<scoped paths> -v --tb=short;
              <iter>: <N>-downstream-be-<BRAND>"
   })
   ```

   **Frontend BRAND scope (R3 parity, per-brand):**
   ```
   Agent({
     description: "Run downstream FE regression for T-{n} brand=<BRAND>",
     subagent_type: "gate-runner",
     model: "haiku",
     prompt: "<pr_folder>: <STORY_DIR>;
              <command>: cd ${WS}/<BRAND>/frontend && npx vitest run <space-separated downstream feature/component paths> --reporter=default;
              <iter>: <N>-downstream-fe-<BRAND>"
   })
   ```

   **E2E smoke scope (when downstream targets include `{brand}/frontend/e2e/`):**
   ```
   Agent({
     description: "Run downstream E2E smoke for T-{n} brand=<BRAND>",
     subagent_type: "gate-runner",
     model: "haiku",
     prompt: "<pr_folder>: <STORY_DIR>;
              <command>: cd ${WS}/<BRAND>/frontend && E2E_BASE_URL=http://localhost:300X npx playwright test --project=smoke <space-separated specs>;
              <iter>: <N>-downstream-e2e-<BRAND>"
   })
   ```
   (Port allocation: nicolify=3001, vitalia=3002, comunify=3003, lupulo=3004)

6. Read new gate-output.json (gate-runner renames previous → gate-output.iter-N.json automatic).

7. Si downstream tests FAIL → escalate REVIEW.md FAIL — Cat 10 (Tests/TDD) BE/FE,
   o Cat 1 (FSD-Lite cross-feature import) si FE, o Cat 12 (anti-duplication) si cross-brand mirror —
   con cita exacta tests fallaron y mapping a surface + brand modificada.

8. Si downstream tests PASS Y engine_edit_detection PASS Y cross_brand_mirror_scan PASS
   → continuar audit_categories.
```

## Cross-brand mirror detection (NEW — multibrand)

**Cuándo aplica:** PR toca `{brand_A}/backend/src/modules/{brand_A}/X/Y.py` o
`{brand_A}/frontend/src/lib/...` (componentes lib candidatos a shared abstraction).

**Algoritmo verbatim:**

```bash
WS=/home/chalreme/Proyectos/luana-platform
BRAND_A=<brand inferido en Step 2>
TARGET_PATH=<path tocado>
BASENAME=$(basename "$TARGET_PATH")

for OTHER_BRAND in vitalia nicolify comunify lupulo; do
  [ "$OTHER_BRAND" = "$BRAND_A" ] && continue
  find ${WS}/$OTHER_BRAND/backend/src -name "$BASENAME" 2>/dev/null
  find ${WS}/$OTHER_BRAND/frontend/src -name "$BASENAME" 2>/dev/null
done
```

**Resultado match → FAIL AUTOMÁTICO:**
- Cita ambos paths exactos (BRAND_A + OTHER_BRAND)
- Verdict: "cross-brand mirror detected. Pattern debe vivir en
  `core/luana-core-*/`, NUNCA mirror per-brand (per anti-duplication.md
  § lift shared rule). Escalar `/pm-luana` con promotion proposal en
  `docs/promotion-protocol/proposals/{date}-lift-{pattern}.md` (state=draft).
  PR queda BLOCKED hasta proposal accepted + migration completed."

**Falso positivo guard:** si match es solo `__init__.py` vacío o
`conftest.py` de test scaffold local → no es mirror. Diff conceptual >50%
del archivo es el threshold para flag MIRROR.

## Engine edit detection (NEW — multibrand)

**Cuándo aplica:** PR toca `core/luana-core-*/src/luana_core_*/` (cualquier file
runtime engine, NO tests).

**Verificación obligatoria:**

```bash
# Extract pkg name from path
PKG=$(echo "$TARGET_PATH" | sed -nE 's#^core/luana-core-([^/]+)/.*#\1#p')

# Look up active promotion proposal
ls docs/promotion-protocol/proposals/*${PKG}*.md 2>/dev/null

# Read state frontmatter
grep -E '^state:\s*(accepted|migrated)' docs/promotion-protocol/proposals/*${PKG}*.md
```

**Sin proposal accepted → FAIL:**
- Verdict: "engine edit sin promotion proposal. Engine `core/luana-core-${PKG}/`
  es SSoT cross-brand (consumido por todos brands listados). Cambios runtime
  requieren proposal en `docs/promotion-protocol/proposals/{date}-${PKG}-{change}.md`
  con state=accepted ANTES merge. Escalar `/pm-luana`."

**Downstream regression scope:** engine edit → tabla SSoT row engine + expandir
∀ brand ∈ ${BRANDS} para los consumer tests (este es el costo del SSoT engine).

**Exception:** hotfix engine bug crítico (per `.claude/rules/hotfix-repro-mandatory.md`)
con `repro_verified: true` + Chris ratificación explícita en checkpoint.md →
proposal puede ir post-fix (state=draft → migrated dentro mismo sprint).

## Brand overlay scope (NEW — multibrand)

**Cuándo aplica:** PR toca `{brand}/.claude/rules/*.md` (brand-specific rule overlay)
o `{brand}/.claude/skills/*.md` (brand-specific skill overlay, raro).

**Verificación obligatoria:**

1. **No-contradicción con root:** read root `.claude/rules/<same-basename>.md` (si existe).
   Brand overlay debe EXTEND (override de defaults específicos brand) NUNCA SOBREESCRIBIR
   completamente regla raíz. Si overlay anula una hard rule raíz → FAIL.

2. **Referencias absolutas consistentes:** todos los paths citados deben prefix con
   `{brand}/` (no paths sueltos que parezcan engine pero apunten brand-local).

3. **Cross-brand pattern detection:** si overlay describe un patrón aplicable a >1 brand
   (ej. "todos los brands deben hacer X") → flag CHANGES_REQUESTED con verdict:
   "patrón overlay aplicable cross-brand. Propose lift a `.claude/rules/` raíz vía
   `/pm-luana` (no per-brand duplicación de reglas)."

**Default verdict:** overlay self-contained brand-specific con override claro → APPROVED.

## Pre-commit freshness gate (origen C1 R21 2026-05-05 — multibrand 2026-05-15)

Hook `scripts/git-hooks/pre-commit` Section 4 detecta automáticamente nuevos archivos
(status `A` o `R`) en cualquiera de estos paths multibrand:

| Regex path | Scope | Owner |
|---|---|---|
| `^core/luana-core-[^/]+/src/luana_core_[^/]+/.+\.py$` | Engine canonical (post reorg) | Promotion proposal + tabla SSoT row |
| `^[a-z]+/backend/src/shared/.+\.py$` | Per-brand shared (rare; lift candidato) | Tabla SSoT row + cross-brand mirror check |
| `^backend/src/shared/.+\.py$` | LEGACY pre-multibrand — hook bloquea + dirige a `core/luana-core-*/` | Block & redirect |

Condición trigger: path no listado en este file (substring match exact path OR parent dir)
AND sin magic comment `# downstream-regression-na: <reason>` en primeras 20 líneas.

→ Hook BLOQUEA commit con hint accionable. Devs eligen entre:
- (A) agregar row a tabla SSoT (sección apropiada A-I) con `downstream_test_targets`
- (B) marcar `# downstream-regression-na: <reason>` si surface es self-contained
  (no cross-consumers — auditor escruta razón post-merge)
- (C) si LEGACY path `backend/src/shared/...` → migrar a `core/luana-core-*/src/...`
  ANTES commit (post reorg legacy paths están deprecated)

Tests cubren escenarios en `core/luana-core-platform/tests/scripts/test_pre_commit_hook.py`
(post reorg path).

Ratchet: tabla shrink-only excepto cuando agregás surface nueva. Renombre
de path → update row mismo commit (no hook detecta rename consistente
salvo nuevo basename). Lift de brand → engine = remove brand row + add engine
row + add ∀ brand consumer rows downstream.

## Anti-patterns prohibidos (multibrand)

- ❌ Auditor APPROVED PR `core/luana-core-observability/` modify sin run downstream tests `core/luana-core-copilot/tests/observability/` + `core/luana-core-sales-agent/tests/observability/` + `{brand}/backend/tests/modules/{brand}/{copilot,sales_agent}/observability/` ∀ brand
- ❌ Auditor APPROVED PR `core/luana-core-llm/` modify sin run consumers cross-engine + cross-brand (todos modules llaman LLM)
- ❌ Auditor APPROVED PR enum `core/luana-core-platform/src/luana_core_platform/enums/` modify sin grep importers cross engine+brand + run sus tests
- ❌ Auditor APPROVED PR `core/luana-core-platform/src/luana_core_platform/config.py` flag flip sin Step 1 grep + run AMBOS valores per anti-default-flip-audit.md
- ❌ Auditor APPROVED PR `core/luana-core-*/src/` modify **sin verificar promotion proposal accepted/migrated** (§ Engine edit detection)
- ❌ Auditor APPROVED PR `{brand_A}/backend/src/modules/{brand_A}/...` con código que **mirrorea `{brand_B}/backend/src/modules/{brand_B}/...`** (§ Cross-brand mirror detection) — debe lift to `core/luana-core-*/`
- ❌ Auditor APPROVED PR `{brand}/backend/src/modules/{brand}/{copilot,sales_agent}/` (brand extension) **sin correr cross-brand scan** ∀ otro brand ∈ ${BRANDS}
- ❌ Skip engine edit detection cuando PR toca `core/luana-core-*/` "porque parece trivial" — todo cambio engine es cross-brand por definición
- ❌ Skip downstream lookup porque "module change parece self-contained" — si toca engine o brand extension shared, downstream puede ser invisible
- ❌ Auditor APPROVED PR `{brand}/.claude/rules/X.md` que contradice regla raíz `.claude/rules/X.md` (overlay debe extend, no sobreescribir)
- ❌ Auditor APPROVED PR `{brand}/.claude/rules/X.md` con patrón cross-brand sin proponer lift to root (§ Brand overlay scope)

## Enforcement layers

| Layer | Mecanismo | Owner |
|---|---|---|
| 1 Auditor agent | Step `downstream_regression_scope` MANDATORY post `consume_gate_output` | `auditor-{backend,agentic}` |
| 2 /auditor SKILL | Step 2 prompt sub-auditor referencia este file | `/auditor` skill |
| 3 Reviews | T-{n}-review.md sección "Downstream regression" obligatoria con tests targets + gate-output result | sub-auditor |
| 4 Self-audit | Si CASO ORIGEN D4 reproduce — auditor verdict FAIL automático | sub-auditor |

## Penalizaciones

- Auditor missing downstream regression cuando surface lo requiere → process-learnings.md case study + re-audit
- Cambio shared/ sin update SSoT tabla este file → process-learnings.md case study (catch en commit hook futuro)

## Mantenimiento tabla (multibrand)

Cuando agregás:
- Nueva surface en `core/luana-core-X/src/luana_core_X/` cross-consumer → MUST add row en sección apropiada (A-I) con downstream_test_targets incluyendo engine tests + `{brand}/...` ∀ brand consumer
- Nuevo módulo importer engine de surface listada → MUST add path a downstream_test_targets row existente
- Nueva brand activa (bootstrap saasora/inmoflow/etc.) → MUST expand `{brand}` template ∀ row applicable (sed-friendly: `{brand}` → `<new-brand>`)
- Cambia downstream test path (rename) → update row mismo commit
- Lift brand → engine (promotion proposal merged) → remove brand row + add engine row + add ∀ brand consumer rows

Tabla SSoT vive aquí. NO duplicar en agent files. NO duplicar per-brand
(brand template `{brand}` se expande sintácticamente, no físicamente).

## Ejemplos

### Ejemplo CORRECTO (auditor caso D4 reproducido — multibrand):

```
git diff HEAD~1..HEAD --name-only
→ core/luana-core-observability/src/luana_core_observability/cost/cost_recorder.py

Step 2: scope=ENGINE, pkg=observability
Step 2a (engine_edit_detection):
  ls docs/promotion-protocol/proposals/*observability*.md
  → 2026-05-10-observability-cost-canonical.md (state: accepted) ✓ PASS

Lookup tabla SSoT § A (luana-core-observability):
  cost_recorder.py →
    core/luana-core-copilot/tests/observability/test_callback_handler_usage_fallbacks.py
    core/luana-core-sales-agent/tests/observability/test_callback_handler.py::TestOnChatModelEnd::test_persists_row_with_sales_columns
    vitalia/backend/tests/modules/vitalia/{copilot,sales_agent}/observability/
    nicolify/backend/tests/modules/nicolify/{copilot,sales_agent}/observability/
    comunify/backend/tests/modules/comunify/{copilot,sales_agent}/observability/
    lupulo/backend/tests/modules/lupulo/{copilot,sales_agent}/observability/

Spawn gate-runner downstream (engine):
  command: cd /home/chalreme/Proyectos/luana-platform && .venv/bin/pytest \
    core/luana-core-copilot/tests/observability/test_callback_handler_usage_fallbacks.py \
    core/luana-core-sales-agent/tests/observability/test_callback_handler.py \
    -v --tb=short

Spawn gate-runner downstream (per brand, in parallel):
  vitalia: cd /home/chalreme/Proyectos/luana-platform && .venv/bin/pytest \
    vitalia/backend/tests/modules/vitalia/copilot/observability/ \
    vitalia/backend/tests/modules/vitalia/sales_agent/observability/ -v --tb=short
  [idem para nicolify, comunify, lupulo]

Resultado engine: 2 fail con `cost_usd > 0` AssertionError → bug `kimi/kimi-k2.6 → BadRequestError`.

Verdict: REVIEW.md FAIL Cat 10 (Tests/TDD) — "T-1 cost_recorder canonicalization
introduces regression cross-brand: litellm.get_llm_provider() doesn't recognize
'kimi' as provider (custom yaml alias). Add fallback in
`core/luana-core-observability/src/luana_core_observability/cost/cost_recorder.py`:
if get_llm_provider() raises, set provider = model.split('/')[0].lower() if '/' in
model else 'unknown'. Re-run downstream tests engine + all 4 brands."
```

### Ejemplo CORRECTO (cross-brand mirror detection — multibrand NEW):

```
git diff HEAD~1..HEAD --name-only
→ nicolify/backend/src/modules/nicolify/sales_agent/tools/scheduler_tool.py

Step 2: scope=BRAND, brand=nicolify
Step 2b (cross_brand_mirror_scan):
  BASENAME=scheduler_tool.py
  for OTHER in vitalia comunify lupulo; do
    find /home/chalreme/Proyectos/luana-platform/$OTHER/backend/src -name "$BASENAME"
  done
  → vitalia/backend/src/modules/vitalia/sales_agent/tools/scheduler_tool.py EXISTS
  → diff conceptual: 80% código compartido (scheduling logic) + 20% brand-specific (booking policy)

Verdict: FAIL AUTOMÁTICO — "cross-brand mirror detected:
  nicolify/backend/src/modules/nicolify/sales_agent/tools/scheduler_tool.py
  <-> vitalia/backend/src/modules/vitalia/sales_agent/tools/scheduler_tool.py
  Pattern compartido debe vivir en core/luana-core-scheduling/src/ (engine) con
  BookingPolicyDef per-brand via EP-X. Escalar /pm-luana con promotion proposal
  en docs/promotion-protocol/proposals/2026-MM-DD-lift-scheduler-tool.md
  (state=draft). PR BLOCKED hasta proposal accepted + migration completed."
```

### Ejemplo INCORRECTO (lo que pasó D4 — pre-multibrand legacy):

```
git diff HEAD~1..HEAD --name-only
→ LEGACY: backend/src/shared/agent_observability/cost/cost_recorder.py

Auditor scope: LEGACY: tests/shared/agent_observability/ → 100% pass
Auditor APPROVED.

Bug downstream silencioso. Llegó a S1. T-1-bis nuevo micro-ticket creado.
80min hunt + 500k tokens.

[Post multibrand 2026-05-15: este path LEGACY ya no existe — engine vive en
core/luana-core-observability/. Hook pre-commit Section 4 bloquearía el commit
si alguien intentara crear file legacy bajo backend/src/shared/.]
```

## Referencia cruzada

- `.claude/rules/anti-duplication.md` — inventario shared abstractions engine (§ lift shared rule — base del cross-brand mirror detection)
- `.claude/rules/anti-default-flip-audit.md` — Step 1 grep tests path viejo (ortogonal pero análogo: detect ripple)
- `docs/promotion-protocol/README.md` — workflow brand→core lift gate (consumido por § Engine edit detection)
- `docs/portfolio/PORTFOLIO.md` — vista master 11 universos (referencia ${BRANDS} catalog)
- `docs/architecture/luana-platform/ADR-001-multibrand-carve-out.md` — rationale topología engine + brand
- `.claude/agents/auditor-backend.md` — Step `downstream_regression_scope` (integrado 2026-05-05, multibrand-aware 2026-05-15)
- `.claude/agents/auditor-agentic.md` — Step idem (integrado 2026-05-05)
- `.claude/agents/auditor-frontend.md` — Step idem FE-side (integrado 2026-05-05, B1 parity)
- `docs/process/process-improvement-handoff-2026-05-05.md` — R3 (D4 origen)
- `docs/process/learnings.md` 2026-05-05 entry — closure ciclo R1-R9 + B1 FE parity
- `docs/process/pm-redesign-2026-05.md` — paradigm v4 + filosofía pointer-first cross-brand
</content>
</invoke>