# Comunify — product SSoT

Owner: `/pm-comunify`. Patrón hereda de Luana core (paradigm v4 — 10 estados macro). Detalle paradigma: `docs/process/pm-redesign-2026-05.md`.

## Estructura

| Path | Contenido | Owner |
|---|---|---|
| `BACKLOG.md` | Auto-gen, vista 10 estados | `make portfolio` |
| `checkpoint.md` | State global del brand | `/pm-comunify` |
| `outcomes/` | Épicas brand-specific | `/pm-comunify` |
| `stories/{id}/` | Work units (state idea→done) | `/pm-comunify` + handoffs |
| `capabilities/{module}/` | Capacidades shipped | `/pm-comunify` ratifica al merge |
| `modules/` | Per-module narrativa brand-specific | `/pm-comunify` |

## Workflow

Idéntico a Luana paradigm v4 (3 conversaciones: Discovery+Ready / Autonomous Build / Review+Merge). Detalle en `/pm-comunify` SKILL.md.

## Cross-references

- Cores consumidos: ver `comunify/config/brand.yaml` y `comunify/backend/pyproject.toml`
- Promotion candidates: `comunify/docs/learnings/` con `promotable_candidate: yes`
- Vista master: [docs/portfolio/comunify.md](../../../docs/portfolio/comunify.md)
