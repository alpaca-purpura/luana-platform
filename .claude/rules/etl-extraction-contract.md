---
globs: "core/luana-core-analytics-engine/src/**/*.py,**/backend/src/modules/*/analytics/**/*.py"
description: Stub — invoca metrics-expert skill
---

# ETL Extraction Contract

Analytics es **ENGINE + BRAND-CONFIG** (ver CLAUDE.md tabla mapping):

| Surface | Path | Owner |
|---|---|---|
| Engine ETL contract + catalog | `core/luana-core-analytics-engine/src/luana_core_analytics_engine/domain/{extraction_contract,metric_catalog}.py` | `/pm-luana` |
| Brand opt-in (enabled_metrics, channel_groups) | `{brand}/config/brand.yaml` + `{brand}/backend/src/modules/{brand}/analytics/extensions.py` | `/pm-{brand}` |
| Auto-gen MD | `docs/etl/extraction-contract.md` (NUNCA edit manual) | generator |

**Antes ETL question:** leer `docs/etl/extraction-contract.md` PRIMERO.

**Después modificar** providers/pipeline/etl_service/scheduler/workers/catalog en engine: 5-step → implement → update contract → re-check catalog → `make extraction-contract` → arch test (corre en engine + cada brand consumer).

Detalle (best practices reliability/correctness/observability, multi-stage, anti-patterns, queries prod) en `metrics-expert` skill → `references/etl-extraction-contract.md`.

**No-skip:** todo cambio analytics dispara los 5 pasos. Sin excepciones.

## Multibrand awareness (post reorg 2026-05-15)

- Engine cambios → requieren `/pm-luana` promotion gate + revalidación en cada brand consumer activa.
- Brand-specific provider adapters viven en `{brand}/backend/src/modules/{brand}/analytics/providers/` (registrados via Extension SDK).
