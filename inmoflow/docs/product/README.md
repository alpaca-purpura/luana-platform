# InmoFlow — product SSoT

Owner: `/pm-inmoflow`. Patrón hereda de Luana core (paradigm v4 — 10 estados macro). Detalle paradigma: `docs/process/pm-redesign-2026-05.md`.

## Estructura

| Path | Contenido | Owner |
|---|---|---|
| `BACKLOG.md` | Auto-gen, vista 10 estados | `make portfolio` |
| `checkpoint.md` | State global del brand | `/pm-inmoflow` |
| `outcomes/` | Épicas brand-specific | `/pm-inmoflow` |
| `stories/{id}/` | Work units (state idea→done) | `/pm-inmoflow` + handoffs |
| `capabilities/{module}/` | Capacidades shipped | `/pm-inmoflow` ratifica al merge |
| `modules/` | Per-module narrativa brand-specific | `/pm-inmoflow` |

## Workflow

Idéntico a Luana paradigm v4 (3 conversaciones: Discovery+Ready / Autonomous Build / Review+Merge). Detalle en `/pm-inmoflow` SKILL.md.

## Cross-references

- Cores consumidos: ver `inmoflow/config/brand.yaml` y `inmoflow/backend/pyproject.toml`
- Promotion candidates: `inmoflow/docs/learnings/` con `promotable_candidate: yes`
- Vista master: [docs/portfolio/inmoflow.md](../../../docs/portfolio/inmoflow.md)
