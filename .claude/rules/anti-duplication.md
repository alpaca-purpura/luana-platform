# Anti-Duplication

**Origen:** PR-1-pi1 2026-05-01. Builder agentic mirror `turn_envelope.py` cross-module → revert + lift shared.

## Regla cardinal

ANTES crear archivo `{brand}/backend/src/modules/{brand}/X/<subsystem>/`: grep cross-codebase (core + todas las brands activas). Match → **EXTEND vía herencia DESDE engine `core/luana-core-*/`**. NUNCA mirror cross-brand ni dentro del mismo brand.

## Inventario engine abstractions (SSoT)

Patrón canónico vive en `core/luana-core-*/` packages. Brands consumen via Python imports `luana_core_*`, NUNCA mirror.

| Pattern | Path canónico engine | Consumers |
|---|---|---|
| Observability turn envelope | `core/luana-core-observability/src/luana_core_observability/recording/turn_envelope.py::BaseObservabilityContext` | copilot · sales_agent · futuros |
| Callback handler base | `core/luana-core-observability/src/luana_core_observability/recording/base_callback_handler.py::BaseAgentCallbackHandler` | copilot · sales_agent |
| PII sanitization | `core/luana-core-observability/src/luana_core_observability/recording/sanitization.py::sanitize_payload` | todos agentes |
| FX resolver factory | `core/luana-core-observability/src/luana_core_observability/cost/fx_resolver.py::FXResolver.default()` | todos agentes con cost |
| Pricing resolver | `core/luana-core-observability/src/luana_core_observability/cost/calculator.py` + `pricing_snapshot_repository.py` | todos agentes |
| Trace event repo base | `core/luana-core-observability/src/luana_core_observability/persistence/base_trace_event_repo.py` | copilot · sales_agent |
| LLM call repo base | `core/luana-core-observability/src/luana_core_observability/persistence/base_llm_call_repo.py` | copilot · sales_agent |
| Channel format registry | `core/luana-core-channels/src/luana_core_channels/format_for_channel.py` | sales_agent · copilot |
| Intent detector | `core/luana-core-channels/src/luana_core_channels/intent_detector.py` | sales_agent · futuros |
| Tenant billing config | `core/luana-core-observability/src/luana_core_observability/persistence/tenant_billing_config_repository.py` | todos cobran |
| Extraction orchestrator | `core/luana-core-extraction/src/luana_core_extraction/base_orchestrator.py::BaseExtractionOrchestrator` | brand · offer · buyer_persona · landing |
| Locale VO | `core/luana-core-platform/src/luana_core_platform/domain/locale.py::TenantLocale` | todos UI/timezone |
| LLM router + providers | `core/luana-core-llm/src/luana_core_llm/router.py` + `providers/` | todos llaman LLMs |
| Outbox pattern | `core/luana-core-events/src/luana_core_events/outbox/` | todos emiten eventos |
| Idempotency | `core/luana-core-idempotency/src/luana_core_idempotency/` | todos tasks idempotentes |
| Billing guards | `core/luana-core-billing/src/luana_core_billing/` (BudgetGuard + RateLimiter) | sales_agent · campaigns · copilot |
| Compliance gates | `core/luana-core-compliance/src/luana_core_compliance/` (ComplianceService) | campaigns · sales_agent |
| Domain events | `core/luana-core-events/src/luana_core_events/` | todos cross-module |
| Cross-module ports | `core/luana-core-platform/src/luana_core_platform/links/ports/` | todos cross-domain |

**Shrink-only:** registro NO duplica per-módulo ni per-brand. Patrón nuevo cross-agent → lift a core package primer commit (vía `/pm-luana` promotion gate, ver `docs/promotion-protocol/README.md`).

## Workflow pre-write

WS=`$(git rev-parse --show-toplevel)` (root del workspace `luana-platform/`).

1. **Step 0 GATE** (antes `Write`/`Edit` que crea file):
   ```bash
   # Buscar en core + todas las brands
   find ${WS}/core ${WS}/{nicolify,vitalia,comunify,lupulo}/backend/src -name "Z.py" 2>/dev/null
   grep -rn "class <ClassName>" ${WS}/core/ ${WS}/{nicolify,vitalia,comunify,lupulo}/backend/src/modules/ 2>/dev/null
   ```

2. Match en `core/` → **EXTEND vía import**. Match en otro brand → ESCALATE `/pm-luana` (candidate lift to core).
3. NO match + categoría coincide tabla → STOP, lift a core package primero (promotion gate).
4. `/pm-{brand}` commit decisión a CONTRACT/PR.md con paths exactos.

## Anti-patterns prohibidos

- ❌ Mirror `modules/X/observability/recording/turn_envelope.py` cuando copilot existe — lift shared
- ❌ Mirror callback handler — heredar `BaseAgentCallbackHandler`
- ❌ Re-implementar `FXResolver(http_client_factory=...)` N módulos — `FXResolver.default()`
- ❌ Copy-paste `lambda: httpx.Client(timeout=10)` — encapsular classmethod
- ❌ Re-resolver currency del tenant local — usar `TenantLocale.currency` (locale VO) + `FXResolver.default()` (engine observability)
- ❌ Mirror PricingResolver setup — extract factory shared
- ❌ Re-implementar PII sanitization local — usar shared `sanitization`
- ❌ Mirror channel format dispatch — usar shared `format_for_channel`

## Enforcement + penalizaciones

PM PR.md "Existing systems audit" grep evidence · Builder Step 0 grep + escalate · Auditor Cat 12 mirror scan · Architect Opus pre-builder si toca `core/` o subsystem cross-brand. **Penalizaciones:** builder sin Step 0 grep → REVERT · auditor sin Cat 12 → re-audit · PM skip architect → process-learnings case study.

## Multibrand awareness

Engine SSoT `core/luana-core-*/` (26 pkgs) — modificar requiere `/pm-luana` promotion gate. Brand extensions `{brand}/backend/src/modules/{brand}/...` heredan/registran vía Extension SDK EP-1..EP-18. Cross-brand mirror ban: dos brands replican mismo patrón → lift a `core/luana-core-{pkg}/`.
