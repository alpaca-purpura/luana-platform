---
globs: "**/*"
description: "Git workflow triple-branch policy + safety rules (post multibrand reorg 2026-05-15)"
---

# Git Safety — Triple-Branch Policy

**Origen:** post multibrand reorg 2026-05-15 (outcome git-strategy-revised, story S-GIT-STRATEGY-CORE).
Replaces legacy single-branch policy.

## Triple-branch policy

| Branch | Rol | CI/CD | Quien la usa |
|---|---|---|---|
| `wip/{slug}` | Autosave iterativo. Commits WIP frecuentes. | `ci-wip.yml` (light gates: lint + tests targeted, <5 min) | Cada sesion Claude/developer en su propio worktree |
| `main` | Integracion + staging. Estado siempre deployable. | `ci.yml` (full gates) + `cd-staging.yml` (auto-deploy staging) | Squash-merge desde wip/* cuando listo |
| `release/{brand}-vX.Y.Z` | Produccion brand-especifica. Inmutable post-push. | `cd-prod.yml` (parse brand+version + dorny/paths-filter + deploy per brand) | Desde main validado post-staging |

Ejemplo flujo completo:

```bash
# 1. Nueva sesion paralela (cada sesion su worktree + branch wip/*)
git worktree add ../luana-docker wip/docker-compose-multibrand

# 2. Trabajar + commitear frecuentemente en wip/*
cd ../luana-docker
git add scripts/docker-compose.dev.yml
git commit -m "wip(docker): base compose multibrand services"
git push origin wip/docker-compose-multibrand

# 3. Integrar a main via squash-merge (desde workdir principal)
cd /home/chalreme/Proyectos/luana-platform
git checkout main
git merge --squash wip/docker-compose-multibrand
git commit -m "feat(docker): compose multibrand servicios base"
git push origin main

# 4. Produccion: branch release/* desde main validado
git checkout -b release/vitalia-v0.3.0
git push origin release/vitalia-v0.3.0
```

## Worktrees per sesion paralela

Cada sesion Claude Code o developer usa su propio worktree fisico dedicado:

```bash
# Patron canonico (obligatorio para sesiones paralelas)
git worktree add ../luana-{slug} wip/{slug}-{short-desc}

# Ejemplos
git worktree add ../luana-docker wip/docker-compose-multibrand
git worktree add ../luana-cicd  wip/cicd-workflows

# Limpiar worktree despues de merge a main
git worktree remove ../luana-docker
git branch -d wip/docker-compose-multibrand
```

Git bloquea automaticamente que dos worktrees tengan el mismo branch — colision de WIP imposible por diseno.
El ban historico de worktrees fue revocado en 2026-05-15 (D2 S-GIT-STRATEGY-CORE).

## WIP safety net (3 mecanismos en orden de frecuencia)

| Mecanismo | Cuando | Frecuencia |
|---|---|---|
| Squash-merge a `main` | WIP listo para staging | ~80% del tiempo |
| Push a `wip/*` (autosave) | WIP en progreso, commit frecuente | ~15% del tiempo |
| `git stash` | Context-switch corto (<30 min) en MISMO worktree | ~5% del tiempo |

**M11:** nunca pasar >30 minutos sin push si hay cambios significativos en el worktree activo.

## Commits y stage

- **Conventional Commits** obligatorio: `<type>(<scope>): <desc>`. Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`, `wip`.
- **Stage por nombre exacto:** `git add path/to/file`. NUNCA `git add .` / `-A` / `-u`.
- `git status` antes stage. NUNCA commitear `.env*`, credentials, secrets.

## PROHIBIDO sin excepcion

- `git pull` (cualquier forma) — PROHIBIDO. Non-fast-forward push: STOP, reportar.
- `git fetch && merge` — PROHIBIDO (equivalente semantico a pull).
- `git push --force` / `--force-with-lease` — PROHIBIDO.
- `git revert` sin aprobacion explicita — PROHIBIDO.
- `git reset --hard` sin aprobacion explicita — PROHIBIDO.
- `git add .` / `git add -A` / `git add -u` — PROHIBIDO.
- `git commit --no-verify` — PROHIBIDO.
- Amend de commits ya pusheados — PROHIBIDO.

**Si push non-fast-forward falla:** STOP. Reportar a Chris. NO hacer git pull.

## Haiku delegation (commit+push multi-file)

Orchestrator (Opus) con >2 archivos para commit → delegar a sub-agent Haiku via Agent tool.
Ver `.claude/rules/git-haiku-delegation.md` (guardrails verbatim, 3 destinos: main/wip/release).

## Inicio de conversacion (branch check)

```bash
git status --short && git branch --show-current && git log --oneline -3
```

- Branch `main` limpio → proceder normal.
- Branch `wip/*` limpio → proceder en worktree dedicado.
- Branch `release/*` → solo commits de hotfix urgentes.
- Branch desconocido (legacy, otros) → switch a `main` o crear worktree `wip/*`.
- Tree sucio archivos propios → commit o stash primero.
- Tree sucio archivos ajenos → NO tocar. Reportar lista.

## CI/CD workflows (referencia)

| Workflow | Trigger | Accion |
|---|---|---|
| `.github/workflows/ci.yml` | push:main + pull_request:main | Full gates (lint + test + arch-fitness + coverage) |
| `.github/workflows/ci-wip.yml` | push:wip/** | Light gates (lint targeted + tests targeted, <5 min) |
| `.github/workflows/cd-staging.yml` | push:main | Auto-deploy staging (placeholder si STAGING_HOST no configurado) |
| `.github/workflows/cd-prod.yml` | push:release/** | Deploy brand prod (parse brand+version + dorny/paths-filter) |
| `.github/workflows/cleanup-wip.yml` | cron semanal / workflow_dispatch | Listar/eliminar wip/* branches >30d sin commits |
| `.github/workflows/release.yml` | push:tags:v*.*.* | Publish luana-core-* a GH Packages (NO modificar) |
