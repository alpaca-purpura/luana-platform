---
globs: "core/luana-core-copilot/src/**/observability/**/*.py,core/luana-core-observability/src/**/*.py,**/backend/src/modules/*/copilot/observability/**/*.py"
description: Stub — invoca copilot-expert skill
---

# Copilot Observability

Split engine + brand-extension:

| Surface | Path | Owner |
|---|---|---|
| Engine observability shared base | `core/luana-core-observability/src/luana_core_observability/` (recording, cost, persistence base classes) | `/pm-luana` |
| Copilot engine observability | `core/luana-core-copilot/src/luana_core_copilot/observability/` (callback handler + recorders) | `/pm-luana` |
| Tablas `copilot_llm_call` + `model_pricing_snapshot` mirror | `{brand}/backend/src/modules/{brand}/copilot/persistence/models/` (per backend-ddd.md schema-mirror exception) | `/dev-team` builder-backend OK |

Detalle (recording/pricing/cost/persistence/reporting/workers, tablas `copilot_llm_call`+`model_pricing_snapshot`, retention, PII redaction, best-effort writes) en `copilot-expert` skill → `references/copilot-observability.md`.

Trigger: tocas `core/luana-core-copilot/src/**/observability/**` o `core/luana-core-observability/src/**` o `{brand}/backend/src/modules/{brand}/copilot/observability/**` o queries de costo/billing/cycle.

**No-skip:** toda escritura observability `try/except + structlog warning` (no rompe turn). PII via `sanitize_payload(...)` de `core/luana-core-observability/src/luana_core_observability/recording/sanitization.py`.

## Multibrand awareness (post reorg 2026-05-15)

- Engine cambios (`core/luana-core-{copilot,observability}/`) → impactan todas las brands. Requieren `/pm-luana` promotion gate.
- Cada brand consumer tiene su mirror de tablas observability en `{brand}/backend/src/modules/{brand}/copilot/persistence/models/` (schema-mirror exception, ver `backend-ddd.md`).
