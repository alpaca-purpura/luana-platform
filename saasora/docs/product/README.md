# SaaSora — product SSoT

Owner: `/pm-saasora`. Patrón hereda de Luana core (paradigm v4 — 10 estados macro). Detalle paradigma: `docs/process/pm-redesign-2026-05.md`.

## Estructura

| Path | Contenido | Owner |
|---|---|---|
| `BACKLOG.md` | Auto-gen, vista 10 estados | `make portfolio` |
| `checkpoint.md` | State global del brand | `/pm-saasora` |
| `outcomes/` | Épicas brand-specific | `/pm-saasora` |
| `stories/{id}/` | Work units (state idea→done) | `/pm-saasora` + handoffs |
| `capabilities/{module}/` | Capacidades shipped | `/pm-saasora` ratifica al merge |
| `modules/` | Per-module narrativa brand-specific | `/pm-saasora` |

## Workflow

Idéntico a Luana paradigm v4 (3 conversaciones: Discovery+Ready / Autonomous Build / Review+Merge). Detalle en `/pm-saasora` SKILL.md.

## Cross-references

- Cores consumidos: ver `saasora/config/brand.yaml` y `saasora/backend/pyproject.toml`
- Promotion candidates: `saasora/docs/learnings/` con `promotable_candidate: yes`
- Vista master: [docs/portfolio/saasora.md](../../../docs/portfolio/saasora.md)
