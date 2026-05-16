---
globs: "core/luana-core-analytics-engine/src/**/*.py,**/backend/src/modules/*/analytics/**/*.py,**/frontend/src/features/growth-studio/**/*.{ts,tsx}"
description: Stub — invoca metrics-expert skill
---

# Analytics Metrics Architecture

Analytics es **ENGINE + BRAND-CONFIG** (CLAUDE.md tabla mapping):

| Surface | Path | Owner |
|---|---|---|
| Engine SSoT constants + registry | `core/luana-core-analytics-engine/src/luana_core_analytics_engine/stage_services/constants.py` + `channel_registry.py` | `/pm-luana` |
| Brand opt-in (enabled_metrics, channel_groups) | `{brand}/config/brand.yaml` + `{brand}/backend/src/modules/{brand}/analytics/extensions.py` | `/pm-{brand}` |
| Growth Studio FE per brand | `{brand}/frontend/src/features/growth-studio/` | `/pm-{brand}` |

Stage services SSoT data — MetricsService NO computa stage metrics.

Tiers progressive loading: 0 summary, 1 overview (cache), 2 group-detail (cache), 3 stage (DB).

Detalle (service architecture, agregar channel/group, prohibido) en `metrics-expert` skill → `references/analytics-metrics.md`.

**No-skip:**
- ❌ `_GROUP_MAP` fuera `constants.py` (en engine package)
- ❌ `get_*_metrics()` en MetricsService (usar stage services)
- ❌ DB queries en `overview_stage.py`/`group_detail.py`
- ❌ Hardcodear channel slugs (usar `ChannelRegistry` de engine)
- ❌ Brand-specific channel registry mirror — registrar via Extension SDK EP-N en `{brand}/backend/.../extensions.py`

## Multibrand awareness (post reorg 2026-05-15)

- Engine cambios (`core/luana-core-analytics-engine/`) → impactan a todas las brands consumer. Requieren `/pm-luana` promotion gate.
- Brand opt-in: cada brand activa subset de metrics/channels via `{brand}/config/brand.yaml`.
