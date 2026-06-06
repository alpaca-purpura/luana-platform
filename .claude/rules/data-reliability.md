---
globs: "core/luana-core-analytics-engine/src/**/*.py,**/backend/src/modules/*/analytics/**/*.py,**/frontend/src/features/marketing/**/*.{ts,tsx}"
description: Stub — invoca metrics-expert skill
---

# Data Reliability Verification

4 layers (Analytics/Marketing per brand):
- 0 ETL execution — `make verify-{brand}-etl provider={n}` (TODO: targets brand-scoped pendientes — hoy aún single-brand `make verify-etl`)
- 1 Source Probe (API == DB) — `make verify-{brand}-probe-{p}` (TODO: brand-scoped)
- 2 Pipeline (DB == DTO) — `make verify-{brand}-pipeline` (TODO: brand-scoped)
- 3 UI Fidelity (API == display) — `make verify-{brand}-ui` (TODO: brand-scoped)

> **Status 2026-05-15:** los Makefile targets siguen single-brand legacy. Migrarlos a brand-scoped es trabajo abierto (story TBD). Mientras tanto, exportar `BRAND=...` env var o trabajar desde `{brand}/backend/` con venv root.

Trigger matrix + agregar provider workflow + anti-patterns en `metrics-expert` skill → `references/data-reliability.md`.

**No-skip:** modificar provider/stage-service/DTO/component sin layer correspondiente. Skip "small change" → no hay small data pipeline change.

## Multibrand awareness (post reorg 2026-05-15)

- Engine analytics (`core/luana-core-analytics-engine/`) cambios → verificación obligatoria en cada brand consumer activa.
- Brand provider adapters (`{brand}/backend/src/modules/{brand}/analytics/providers/`) → verificación scoped al brand.
- Makefile targets brand-scoped pendientes (ver TODO arriba).
