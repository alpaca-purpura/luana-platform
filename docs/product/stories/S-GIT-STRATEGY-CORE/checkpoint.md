---
story_id: S-GIT-STRATEGY-CORE
outcome: infra-dev-multibrand
parent_sub_outcome: git-strategy-revised
state: done
phase: DONE
last_artifact: docs/product/outcomes/infra-dev-multibrand-CHECKPOINTS.md
last_modified: 2026-05-15T13:00:00Z
next_action: "Outcome cerrado. Capabilities promovidas. Story archivable a docs/archive/2026/ post rolling 90d."
verdict: APPROVED
audit_review: docs/product/stories/S-GIT-STRATEGY-CORE/REVIEW.md
ratified_by_chris: true
spawned_at: 2026-05-15T00:00:00Z
spawned_by: /pm-luana
parallel_safe: true
blocked_reason: null
audit_iterations: 0
foundational: true
blocks: [S-DOCKER-DEV-MULTIBRAND, S-CICD-DEPLOY, S-GIT-STRATEGY-HELPERS]
estimated_hours: 12-14
tickets_count: 9
---

# S-GIT-STRATEGY-CORE — Triple-branch + worktrees + WIP safety net (rules + workflows + hook)

> Sub-story de [git-strategy-revised](../../outcomes/git-strategy-revised.md). Foundational — bloquea las 3 stories restantes del outcome platform.
>
> Scope: reescribir 3 rules MD + crear 5 workflows YAML + refactor 1 pre-commit hook.

## Tickets (alto nivel — detalle en 06-tickets.yaml post /architect)

| Ticket | Descripción | Tipo | production_code |
|---|---|---|---|
| T-1 | Reescribir `.claude/rules/git-safety.md` (triple branch + worktrees revocación + helper scripts ref) | docs | false |
| T-2 | Reescribir `.claude/rules/parallel-safety.md` (M9 worktree Agent isolation + M10 wip branches autosave + M11 push >30min) | docs | false |
| T-3 | Update `.claude/rules/git-haiku-delegation.md` (3 destinos: main/wip/release con guardrails distintos) | docs | false |
| T-4 | Rewrite `.github/workflows/ci.yml` — full gates en main + PR | code | true |
| T-5 | Nuevo `.github/workflows/ci-wip.yml` — light gates en wip/* | code | true |
| T-6 | Nuevo `.github/workflows/cd-staging.yml` placeholder — main → staging shared (server placeholder) | code | true |
| T-7 | Nuevo `.github/workflows/cd-prod.yml` — release/* → prod brand-específico | code | true |
| T-8 | Nuevo `.github/workflows/cleanup-wip.yml` — cron weekly, borra wip/* >30d | code | true |
| T-9 | Update `scripts/git-hooks/pre-commit` — gates dinámicos por branch + magic comment `# wip-fast` | code | true |

## Bitácora

- 2026-05-15 — /pm-luana creó folder + checkpoint.md (state=refining, foundational story)
- 2026-05-15 — /po+/architect produjeron 5 artefactos canónicos v4: 01-spec.md (6 scenarios Gherkin AI-resistant) + 03-arch.md (surface INFRA unificada, 4 skeletons YAML, pseudocódigo hook) + 04-validators.yaml (7 non_functional + 9 functional validators) + 05-guidelines.md (patterns required/forbidden + files in scope) + 06-tickets.yaml (9 tickets T-1..T-9 con acceptance criteria). state=refining → ready.
- 2026-05-15 — /dev-team (Sonnet) implementó 9/9 tickets en orden T-9→T-4→T-5→T-6→T-7→T-8→T-1→T-2→T-3. TDD: 12 bash tests escritos RED antes refactor hook (T-9). 16/16 validators PASS (actionlint + shellcheck + markdownlint + permissions + pinned-actions + release-preserved + 6 functional + 3 cross-file integrity). state=ready → developing → developed.
