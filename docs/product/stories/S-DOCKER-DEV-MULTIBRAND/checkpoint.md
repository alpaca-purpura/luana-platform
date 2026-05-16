---
story_id: S-DOCKER-DEV-MULTIBRAND
outcome: infra-dev-multibrand
parent_sub_outcome: docker-dev-multibrand
state: ready
phase: READY
last_artifact: 06-tickets.yaml
last_modified: 2026-05-15T00:00:00Z
next_action: "/dev-team toma 06-tickets.yaml y ejecuta T-1..T-10 en orden de dependencias (T-1+T-4+T-7 paralelos primero)"
ratified_by_chris: true
spawned_at: 2026-05-15T00:00:00Z
spawned_by: /pm-luana
completed_by: /architect
parallel_safe: true
blocked_reason: null
blocked_by: [S-GIT-STRATEGY-CORE]
blocking_note: "S-GIT-STRATEGY-CORE es foundational (git rules + worktrees). Esta story puede empezar en parallel pero dev-team debe tener los git rules nuevos activos para usar worktrees. Los artefactos ready están listos ya."
audit_iterations: 0
estimated_hours: 14-16
tickets_count: 10
ready_package:
  spec: "01-spec.md"
  arch: "03-arch.md"
  validators: "04-validators.yaml"
  guidelines: "05-guidelines.md"
  tickets: "06-tickets.yaml"
---

# S-DOCKER-DEV-MULTIBRAND — Docker dev local multimarca brand-autocontenida

> Sub-story de [docker-dev-multibrand](../../outcomes/docker-dev-multibrand.md). State: **ready**.
>
> 10 tickets autocontenidos. /dev-team puede tomar directamente desde T-1.

## Ready package (estado actual)

| Artefacto | Estado | Notas |
|---|---|---|
| `01-spec.md` | DONE | 7 scenarios Gherkin AI-resistant, NFRs, decisions D1-D6 |
| `03-arch.md` | DONE | Surface diff completo: 13 secciones A-N, skeletons concretos |
| `04-validators.yaml` | DONE | 19 validators: 9 non-functional + 8 functional + 2 integración |
| `05-guidelines.md` | DONE | 11 patterns required + 8 patterns forbidden + archivos en scope |
| `06-tickets.yaml` | DONE | 10 tickets, orden dependencias, acceptance criteria por ticket |

## Tickets (alto nivel)

| Ticket | Descripción | Tipo | Est. | Depende de | production_code |
|---|---|---|---|---|---|
| T-1 | Rewrite `docker-compose.dev.yml` raíz + `postgres-init` script idempotente | infra | 2h | — | true |
| T-2 | Crear `{brand}/docker-compose.dev.yml` × 4 (nicolify, vitalia, comunify, lupulo) | infra | 2h | T-1 | true |
| T-3 | Agregar `infra:` a `{brand}/config/brand.yaml` × 4 | infra | 1.5h | T-2 | true |
| T-4 | Crear Dockerfiles faltantes: vitalia/{backend,frontend} + comunify/{backend,frontend} + lupulo/{backend,frontend} | infra | 3h | — (paralelo T-1/T-7) | true |
| T-5 | Audit + ajuste `nicolify/{backend,frontend}/Dockerfile` para uv editable bind-mount | infra | 1h | T-4 | true |
| T-6 | Makefile raíz con todos los `make dev-*` targets | infra | 1.5h | T-1, T-2 | true |
| T-7 | `.env.dev.template` + `.env.prod.template` × 4 brands + `.gitignore` update | infra | 0.5h | — (paralelo T-1/T-4) | true |
| T-8 | `scripts/generate_infra_matrix.py` + `make infra-matrix` → `docs/portfolio/INFRA-MATRIX.md` | infra | 1.5h | T-3 | true |
| T-9 | Pre-commit hook Section 10 — regenera `INFRA-MATRIX.md` al editar `brand.yaml` | infra | 1h | T-8 | true |
| T-10 | Runbook + ADR-003 + `CLAUDE.md` update + `/pm-luana` SKILL.md update | docs | 1h | T-9 | false |

**Orden de ejecución óptimo:**
```
Fase 1 (paralelo): T-1 + T-4 + T-7
Fase 2 (secuencial): T-2 (depende T-1) → T-3 (depende T-2)
Fase 3 (convergencia): T-5 (depende T-4) + T-6 (depende T-1+T-2)
Fase 4: T-8 (depende T-3) → T-9 (depende T-8) → T-10 (depende T-9)
```

## Decisiones ratificadas (D1-D6)

| # | Decisión | Cementada en |
|---|---|---|
| D1 | 1 postgres shared + N databases via init script idempotente | outcome, spec, arch |
| D2 | Brand-autocontenida: `{brand}/docker-compose.dev.yml` per brand | outcome, spec, arch |
| D3 | Qdrant + Redis opt-in profiles (no all-on por default) | outcome, spec, arch |
| D4 | Hot-reload monorepo via bind mount source + anonymous volume .venv + uv editable workspace | outcome, spec, arch |
| D5 | Cloudflared tunnel opt-in profile per brand | outcome, spec, arch |
| D6 | Port allocation cementada: nicolify=8001/3001, vitalia=8002/3002, comunify=8003/3003, lupulo=8004/3004 | outcome, spec, arch |

## Bitácora

- 2026-05-15 — /pm-luana creó folder + checkpoint.md (state=refining)
- 2026-05-15 — /po + /architect producen ready package completo (01-spec + 03-arch + 04-validators + 05-guidelines + 06-tickets). State: refining → **ready**.
