# Nicolify — product SSoT

Owner: `/pm-nicolify`. Patrón hereda de Luana core (paradigm v4 — 10 estados macro). Detalle paradigma: `docs/process/pm-redesign-2026-05.md`.

## Estructura

| Path | Contenido | Owner |
|---|---|---|
| `BACKLOG.md` | Auto-gen, vista 10 estados | `make portfolio` |
| `checkpoint.md` | State global del brand | `/pm-nicolify` |
| `outcomes/` | Épicas brand-specific | `/pm-nicolify` |
| `stories/{id}/` | Work units (state idea→done) | `/pm-nicolify` + handoffs |
| `capabilities/{module}/` | Capacidades shipped | `/pm-nicolify` ratifica al merge |
| `modules/` | Per-module narrativa brand-specific | `/pm-nicolify` |

## Workflow

Idéntico a Luana paradigm v4 (3 conversaciones: Discovery+Ready / Autonomous Build / Review+Merge). Detalle en `/pm-nicolify` SKILL.md.

## Cross-references

- Cores consumidos: ver `nicolify/config/brand.yaml` y `nicolify/backend/pyproject.toml`
- Promotion candidates: `nicolify/docs/learnings/` con `promotable_candidate: yes`
- Vista master: [docs/portfolio/nicolify.md](../../../docs/portfolio/nicolify.md)
