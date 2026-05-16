---
story_id: S-GIT-STRATEGY-HELPERS
outcome: infra-dev-multibrand
parent_sub_outcome: git-strategy-revised
state: ready
phase: ARCH_DONE
last_artifact: 06-tickets.yaml
last_modified: 2026-05-15T00:00:00Z
next_action: "/dev-team toma T-10 primero (helper scripts + bash tests), luego T-11+T-12 en paralelo, luego T-13"
ratified_by_chris: true
spawned_at: 2026-05-15T00:00:00Z
spawned_by: /pm-luana
parallel_safe: true
blocked_reason: "S-GIT-STRATEGY-CORE debe estar done antes de T-11 (CLAUDE.md/AGENTS.md update asume rules ya reescritas). T-10 puede iniciar en paralelo."
blocked_by: [S-GIT-STRATEGY-CORE]
audit_iterations: 0
estimated_hours: 6-8
tickets_count: 4
---

# S-GIT-STRATEGY-HELPERS — Helper scripts + docs runbooks + ADRs

> Sub-story de [git-strategy-revised](../../outcomes/git-strategy-revised.md). Post-core.

## Ready package (state=ready) — 5 artefactos

| Artefacto | Descripcion | Estado |
|---|---|---|
| `01-spec.md` | Service-story spec (Gherkin AI-resistant, 5 scenarios, decisions D1..D4) | DONE |
| `03-arch.md` | Surface diff completo + skeletons bash new-session + cleanup + spec tests + ADR-004 + runbook | DONE |
| `04-validators.yaml` | 18 validators ejecutables (shellcheck + markdownlint + bash unit tests + coherencia docs) | DONE |
| `05-guidelines.md` | Patterns required (R1..R10) + forbidden (F1..F8) + files in scope + quality gates | DONE |
| `06-tickets.yaml` | T-10..T-13 con owner_eligibility, decisions_applicable, acceptance criteria, dependencias | DONE |

## Tickets (estado inicial: draft)

| Ticket | Descripcion | Tipo | production_code | Estimado | Owner |
|---|---|---|---|---|---|
| T-10 | Helper scripts: new-session.sh + cleanup-session.sh + bash unit tests | tooling | true | 3h | Sonnet OK |
| T-11 | Update CLAUDE.md + AGENTS.md (Git Workflow legacy → triple-branch) | docs | false | 1.5h | Sonnet OK |
| T-12 | ADR-004 git-branching-and-environments | docs | false | 1.5h | Sonnet OK |
| T-13 | Runbook + MEMORY entry pointer-first | docs | false | 1h | Sonnet OK |

## Dependencias

```
T-10 (scripts)   → puede iniciar cuando se tome esta story
T-11 (CLAUDE.md/AGENTS.md) → idem, puede iniciar independientemente
T-12 (ADR-004)   → idem, puede iniciar independientemente
T-13 (runbook)   → blocked_by T-11 + T-12 (referencia contenido de ambos)

Toda esta story → blocked_by S-GIT-STRATEGY-CORE (state=done)
```

## Bitácora

- 2026-05-15 — /pm-luana creo folder + checkpoint.md (state=refining)
- 2026-05-15 — /po + /architect produjeron ready package completo (01-spec + 03-arch + 04-validators + 05-guidelines + 06-tickets). state=ready.
