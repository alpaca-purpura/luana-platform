# Lupulo — product SSoT

Owner: `/pm-lupulo`. Patrón hereda de Luana core (paradigm v4 — 10 estados macro). Detalle paradigma: `docs/process/pm-redesign-2026-05.md`.

## Estructura

| Path | Contenido | Owner |
|---|---|---|
| `BACKLOG.md` | Auto-gen, vista 10 estados | `make portfolio` |
| `checkpoint.md` | State global del brand | `/pm-lupulo` |
| `outcomes/` | Épicas brand-specific | `/pm-lupulo` |
| `stories/{id}/` | Work units (state idea→done) | `/pm-lupulo` + handoffs |
| `capabilities/{module}/` | Capacidades shipped | `/pm-lupulo` ratifica al merge |
| `modules/` | Per-module narrativa brand-specific | `/pm-lupulo` |

## Workflow

Idéntico a Luana paradigm v4 (3 conversaciones: Discovery+Ready / Autonomous Build / Review+Merge). Detalle en `/pm-lupulo` SKILL.md.

## Cross-references

- Cores consumidos: ver `lupulo/config/brand.yaml` y `lupulo/backend/pyproject.toml`
- Promotion candidates: `lupulo/docs/learnings/` con `promotable_candidate: yes`
- Vista master: [docs/portfolio/lupulo.md](../../../docs/portfolio/lupulo.md)
