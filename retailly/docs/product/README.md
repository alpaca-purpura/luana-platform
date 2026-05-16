# Retailly — product SSoT

Owner: `/pm-retailly`. Patrón hereda de Luana core (paradigm v4 — 10 estados macro). Detalle paradigma: `docs/process/pm-redesign-2026-05.md`.

## Estructura

| Path | Contenido | Owner |
|---|---|---|
| `BACKLOG.md` | Auto-gen, vista 10 estados | `make portfolio` |
| `checkpoint.md` | State global del brand | `/pm-retailly` |
| `outcomes/` | Épicas brand-specific | `/pm-retailly` |
| `stories/{id}/` | Work units (state idea→done) | `/pm-retailly` + handoffs |
| `capabilities/{module}/` | Capacidades shipped | `/pm-retailly` ratifica al merge |
| `modules/` | Per-module narrativa brand-specific | `/pm-retailly` |

## Workflow

Idéntico a Luana paradigm v4 (3 conversaciones: Discovery+Ready / Autonomous Build / Review+Merge). Detalle en `/pm-retailly` SKILL.md.

## Cross-references

- Cores consumidos: ver `retailly/config/brand.yaml` y `retailly/backend/pyproject.toml`
- Promotion candidates: `retailly/docs/learnings/` con `promotable_candidate: yes`
- Vista master: [docs/portfolio/retailly.md](../../../docs/portfolio/retailly.md)
