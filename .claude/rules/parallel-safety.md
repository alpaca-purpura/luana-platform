---
globs: "**/*"
description: "Seguridad multi-sesion paralela Claude Code — triple-branch + worktrees requeridos (post 2026-05-15)"
---

# Parallel Safety (OBLIGATORIO)

Chris opera 2-3 sesiones Claude Code en paralelo en WSL2. Cada sesion usa su propio worktree fisico dedicado
con branch `wip/*` dedicado. No hay "mismo workdir+branch" — ese patron es legacy y fue el origen de colisiones.

## Triple-branch en paralelo

Cada sesion paralela:

1. Crea su worktree dedicado: `git worktree add ../luana-{slug} wip/{slug}-{desc}`
2. Trabaja y commitea frecuentemente en su branch `wip/{slug}-{desc}`
3. Pushea a origin su wip/* branch (autosave + ci-wip.yml light gates)
4. Hace squash-merge a `main` cuando el trabajo esta listo

Ver `.claude/rules/git-safety.md` para la triple-branch policy completa.

## Worktrees requeridos por sesion

El patron obligatorio para sesiones paralelas es worktree + branch wip/* dedicado:

```bash
# Cada sesion nueva: worktree aislado fisicamente
git worktree add ../luana-{slug} wip/{slug}-{desc}

# Git bloquea automaticamente que dos worktrees tengan el mismo branch.
# La colision de WIP es imposible por diseno del sistema de archivos.
```

Por que funciona: git impide que dos worktrees compartan un branch activo. Si la sesion B intenta
checkout del mismo branch que la sesion A tiene abierto, git retorna error. Sin disciplina humana requerida.

El ban historico de worktrees (2024-2026) fue revocado en 2026-05-15 (D2 S-GIT-STRATEGY-CORE).
El problema original era worktrees sin branch dedicado — no la tecnologia en si.

## NO PULL

**`git pull` PROHIBIDO sin excepcion.** No al inicio, no antes de commit, no al cierre.

Con triple-branch + worktrees, cada sesion tiene su espacio aislado. `git pull` no es necesario
para sincronizacion y puede sobreescribir WIP de otra sesion.

Push falla non-fast-forward → STOP, reportar Chris. NO hacer git pull.

## NO FORCE PUSH

`git push --force` / `--force-with-lease` PROHIBIDO. Reescribe historia compartida.

## NO REVERT sin aprobacion

`git revert` puede sobreescribir trabajo paralelo. Solo con aprobacion explicita de Chris.

## Reglas M1-M11

| # | Regla |
|---|---|
| M1 | Sesiones paralelas usan branches `wip/*` DISTINTOS. Dos sesiones NO comparten branch activo (git lo bloquea). |
| M2 | `docs/process/learnings.md` + `docs/product/BACKLOG.md` (auto-gen) + `MEMORY.md` SOLO `/pm`. Builders nunca. |
| M3 | Tests/CI/Docker SECUENCIAL. Una sesion a la vez `/test-all`/`/dev-up`/`make ci-parity`. Container/port collision invisible hasta crash. |
| M4 | Claim by commit: `/pm` cambia `state: developing` en checkpoint.md + commit/push inmediato al branch wip/*. |
| M5 | NO pull. NO force push. NO revert sin aprobacion. Push falla → STOP. |
| M6 | Bootstrap PM pregunta `en que outcome/story?` antes proceder. |
| M7 | Subagentes paths PRIMARIOS story + read all + "extend, no destroy" ajenos. PM prefija story-id completo en prompts. |
| M8 | Tocar archivos otra sesion OK si: (a) entiendes leyendo, (b) extend/append no replace, (c) rompe → STOP escalate Chris. |
| M9 | Agent tool sub-agents dentro de sesion pueden usar worktree isolation efimero para tareas de build aisladas. Cleanup del worktree efimero es responsabilidad del agente que lo crea. |
| M10 | branches `wip/*` son autosave. Push frecuente (M11) garantiza recovery ante crash de sesion. NO guardar WIP solo en stash por mas de 30 minutos. |
| M11 | NUNCA pasar >30 minutos sin push si hay cambios significativos en worktree activo. El push activa `ci-wip.yml` (light gates) como checkpoint de calidad. |

Detalle: `docs/process/parallel-sessions-protocol.md`.

## Inicio de conversacion (branch check)

```bash
git status --short && git branch --show-current && git log --oneline -3
```

- Branch `wip/*` limpio en worktree dedicado → proceder.
- Branch `main` limpio → OK para squash-merges o commits directos de docs.
- Branch desconocido (legacy `development`, otros) → crear worktree `wip/*` nuevo.
- Tree sucio archivos propios → commit a `wip/*` branch o stash si es context-switch corto.
- Tree sucio archivos AJENOS (otra sesion) → NO tocar esos archivos. Reportar lista.

## Scope commits

Stage por nombre exacto solo archivos de esta sesion. PROHIBIDO `git add .` / `-A` / `-u`.
Status muestra archivos ajenos → dejarlos intactos y reportar. Pre-commit hooks native — `--no-verify` PROHIBIDO.

## Cierre de sesion

Cuando user dice "eso es todo" / "gracias" / "cierra":

1. `git status --short`
2. Cambios propios → stage por nombre + conventional commit + push a `wip/*` branch + reportar hash
3. Archivos ajenos → reportar intactos
4. Stashes → reportar
5. WIP roto → `git stash push -m "WIP: {slug}"` + reportar

## Prohibido

- `git pull` (cualquier forma)
- `git fetch && merge`
- `git push --force` / `--force-with-lease`
- `git revert` sin aprobacion
- `git reset --hard` sin aprobacion
- `git add .` / `-A` / `-u`
- `git commit --no-verify`
- Dos sesiones en el mismo branch activo (git bloquea, pero nunca intentarlo)
- Cierre sin commit/reporte de estado
- Push `origin main` sin squash-merge consciente
- Builders editando `learnings.md` / `BACKLOG.md` / `MEMORY.md`
- Tests/Docker dos sesiones simultaneas (M3)
- Worktree sin branch `wip/*` dedicado (patron incorrecto — git no bloquea colision en ese caso)
