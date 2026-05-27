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

## Sync `wip/{brand}` con `main` post squash-merge

**Origen:** caso 2026-05-27. Después de squash-merge `wip/vitalia → main`, los demás canónicos (`wip/comunify`, `wip/nicolify`, `wip/lupulo`) quedaban atrasados sin procedimiento explícito de re-sync. Lockfiles + reglas + arquitectura cementations vivían SOLO en main hasta que cada brand sincronizara → riesgo de drift cross-brand silencioso.

**Regla cardinal:** después de cada squash-merge `wip/{brand_A} → main`, los demás canónicos brand activos **deben sincronizarse con main en la sesión siguiente** (no obligatorio inmediato, pero antes de arrancar trabajo nuevo en la brand).

### Decisión: qué hacer según commits propios del wip target

```bash
cd ~/Proyectos/luana-{brand_target}
git fetch origin
git log --oneline origin/main..HEAD | wc -l   # commits ahead = trabajo propio del brand
```

| Ahead | Procedimiento | Razón |
|---|---|---|
| **0** | **Reset hard a main** + push `--force-with-lease` | Sin trabajo que preservar. Limpia y rápida. |
| **≥1** | **Merge `origin/main` en wip/{brand}** + push (no force) | Preserva los commits propios + agrega merge commit que trae main. |

### Procedimiento detallado

**Caso A — 0 ahead (reset hard limpio):**

```bash
cd ~/Proyectos/luana-{brand_target}
git stash push --include-untracked -m "{brand}-pre-reset-$(date +%Y-%m-%d)"  # si hay uncommitted
git fetch origin
git diff HEAD origin/main --stat   # verificar diff antes (sanity check)
git reset --hard origin/main
git push origin wip/{brand} --force-with-lease
# git stash pop si quieres recuperar uncommitted (raro)
```

**Caso B — ≥1 ahead (merge preservando):**

```bash
cd ~/Proyectos/luana-{brand_target}
git stash push --include-untracked -m "{brand}-pre-sync-$(date +%Y-%m-%d)"   # si hay uncommitted
git fetch origin
git merge-tree $(git merge-base HEAD origin/main) HEAD origin/main | grep -c "<<<<<<< "   # conflict preview
git merge origin/main -m "chore({brand}): sync wip/{brand} con main post wip/{brand_origin} squash-merge {sha}"
# Si conflicts:
#   - Auto-gen files (BACKLOG.{md,yaml,-TLDR.md}, docs/portfolio/*) modify/delete → git rm (R3 v2 gitignored)
#   - Code conflicts → resolver caso a caso preservando lógica brand
git push origin wip/{brand}
# git stash pop si previamente se aplicó stash
```

**Pre-commit hook scope gate**: si el merge trae cambios cross-cutting (`.claude/rules/*`, `AGENTS.md`, `CLAUDE.md`, scripts compartidos) el hook bloqueará con error "SCOPE GATE BLOCKED". Override permitido para merge sync legítimo:

```bash
SCOPE_GATE_SKIP=1 git commit -m "chore({brand}): sync wip/{brand} con main ..."
```

Documentar override en commit body con razón. Override prohibido para edición LOCAL intencional de cross-cutting (eso requiere worktree dedicado `protocol`/`exp`).

### Conflictos esperados típicos

- `pnpm-lock.yaml` / `uv.lock` — workspace shared, auto-merge usualmente OK
- `.claude/rules/*` — main suele tener versiones más nuevas, aceptar main
- `comunify/docs/product/BACKLOG.{md,yaml,-TLDR.md}` — auto-gen R3 v2, `git rm`
- `docs/portfolio/{PORTFOLIO,brand,luana}.md` — auto-gen R3 v2, `git rm`
- `vitalia/.claude/rules/*` — brand overlay, resolver según overlay extiende root
- `core/luana-core-*/src/` — engine shared, CRITICAL — escalate `/pm-luana` si conflict

### Excepciones revocando "PROHIBIDO"

Este procedimiento usa EXPLICITAMENTE comandos del bloque "PROHIBIDO" arriba (`reset --hard`, `--force-with-lease`, `merge`). La autorización es:

| Comando | Por qué OK acá |
|---|---|
| `git reset --hard origin/main` | Cuando wip/{brand} tiene 0 commits propios, no destruye trabajo |
| `git push --force-with-lease` | Lease check previene sobrescribir commits no vistos por agente |
| `git merge origin/main` | Es el merge LEGITIMO main→wip, no es `git pull` (fetch + merge automático sin ratificación) |

`git pull` sigue PROHIBIDO. La diferencia es: `fetch` separado + `merge` explícito con ratificación (este procedimiento) vs `pull` automático sin verificación previa de diff/conflictos.

### Cuando NO sincronizar

- Brand bootstrap pendiente (saasora, inmoflow, retailly, fixia, guestly, fitflow): sus wip/* no existen aún, N/A
- Worktree con sesión activa en curso developing/reviewing: terminar la story primero, sync después
- Conflict en `core/luana-core-*/src/`: STOP, escalate `/pm-luana` (engine boundary)

## Commits y stage

- **Conventional Commits** obligatorio: `<type>(<scope>): <desc>`. Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`, `wip`.
- **Stage por nombre exacto:** `git add path/to/file`. NUNCA `git add .` / `-A` / `-u`.
- `git status` antes stage. NUNCA commitear `.env*`, credentials, secrets.

## PROHIBIDO (con excepciones documentadas)

- `git pull` (cualquier forma) — **PROHIBIDO sin excepcion**. Non-fast-forward push: STOP, reportar.
- `git fetch && merge` automatico sin ratificacion — **PROHIBIDO**. Merge explicito con ratificacion + preview de conflictos: permitido en sync `wip/{brand}` con main (ver § Sync wip/{brand} con main).
- `git push --force` — **PROHIBIDO sin excepcion**.
- `git push --force-with-lease` — PROHIBIDO por default. Excepcion: reset hard `wip/{brand} → origin/main` post squash-merge cuando 0 commits propios (ver § Sync wip/{brand}).
- `git revert` sin aprobacion explicita — **PROHIBIDO**.
- `git reset --hard` sin aprobacion explicita — PROHIBIDO por default. Excepcion: reset `wip/{brand} → origin/main` post squash-merge cuando 0 commits propios + diff content vacio (ver § Sync wip/{brand}).
- `git add .` / `git add -A` / `git add -u` — **PROHIBIDO sin excepcion**. Excepcion implicita: `git merge` deja archivos staged automaticamente, no requiere `add .`.
- `git commit --no-verify` — **PROHIBIDO sin excepcion**.
- `SCOPE_GATE_SKIP=1 git commit` — PROHIBIDO por default. Excepcion: merge sync legitimo `main → wip/{brand}` que trae cross-cutting updates desde main (no edicion local intencional). Documentar override en commit body con razon.
- Amend de commits ya pusheados — **PROHIBIDO sin excepcion**.

**Si push non-fast-forward falla:** STOP. Reportar a Chris. NO hacer git pull.

**Cualquier excepcion a "PROHIBIDO" requiere ratificacion explicita Chris en la sesion (o estar documentada como caso permitido en seccion especifica de este file).**

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
