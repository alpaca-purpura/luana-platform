---
globs: "**/*"
description: "Seguridad multi-sesion paralela Claude Code/opencode — worktree-based (D1-D14 cementado 2026-05-18)"
---

# Parallel Safety (OBLIGATORIO)

Chris opera 2-3 sesiones en paralelo en Linux Mint, en brands distintas o lanes dentro de brand. Cada sesion = worktree dedicado con branch `wip/*` (o `hotfix/*`, `exp/*`, `wip/core-*`).

**Detalle completo (sub-agent worktree ban v2 + sync KISS detail + bucket lock mechanism + opencode parity + topología completa + workflows merge/lift core/multi-lane + conflict resolution):** `docs/rules-detail/parallel-safety.md`. SSoT canónico: `docs/process/parallel-sessions-protocol.md` D1-D14 + `docs/architecture/luana-platform/ADR-005-worktree-policy.md`.

## Topología filesystem (D2)

| Path | Tipo | Branch | Editar código |
|---|---|---|---|
| `~/Proyectos/luana-platform/` | PRINCIPAL | `main` | ❌ NO (solo merges + read cross-brand) |
| `~/Proyectos/luana-{brand}/` | CANÓNICO long-lived | rota `wip/{brand}-{slug}` segun story | ✅ SI (1 sesion a la vez) |
| `~/Proyectos/luana-{brand}-{slug}/` | EFÍMERO brand | `wip/{brand}-{slug}[-{lane}]` | ✅ SI |
| `~/Proyectos/luana-{brand}-hotfix-{slug}/` | EFÍMERO hotfix | `hotfix/{brand}-{slug}` | ✅ SI |
| `~/Proyectos/luana-{brand}-exp-{slug}/` | EFÍMERO exp | `exp/{brand}-{slug}` | ✅ SI (NUNCA mergea) |
| `~/Proyectos/luana-core-{slug}/` | EFÍMERO core (D12) | `wip/core-{slug}` | ✅ SI (lift gate `/pm-luana`) |

`{brand}` ∈ {vitalia, nicolify, comunify, lupulo} + futuras. `core` reservado para lifts engine.

## Crear y cerrar sesion

```bash
scripts/git/new-session.sh <BRAND> <TYPE> <SLUG> [LANE]     # crear
scripts/git/cleanup-session.sh <BRAND>-<SLUG>[-LANE]         # cerrar
scripts/git/regenerate-manifest.sh                            # recovery manual
```

## Reglas M1-M14 (vigentes — M12/M13/M14 cementados v2 2026-05-18)

| # | Regla |
|---|---|
| M1 | Sesiones paralelas branches DISTINTOS — EXCEPTO mismo canónico con lock por bucket (M14). |
| M2 | SSoT (`learnings.md`, BACKLOG, MEMORY, PORTFOLIO) SOLO `/pm-{brand}` o `/pm-luana`. Builders nunca. |
| M3 | Tests/Docker/migrations SECUENCIAL por brand. Max 1 stack docker por brand vivo (D5). |
| M4 | Claim by commit: `/pm-{brand}` cambia state en checkpoint.md + commit/push inmediato pre-claim. |
| M5 | NO pull. NO force push. NO revert sin aprobacion. Push non-fast-forward → STOP. |
| M6 | Bootstrap PM pregunta story activa antes proceder. |
| M7 | Subagentes paths PRIMARIOS story + read all + extend-no-destroy archivos ajenos. |
| M8 | Tocar archivos otra sesion OK si entiendes leyendo + extend/append no replace + STOP si rompe. |
| **M9** | **REVOCADA v2 2026-05-18:** Sub-agents NO crean worktrees. Trabajan in-place sobre cwd del caller. |
| M10 | `wip/*` son autosave. Push frecuente (M11) garantiza recovery. NO stash > 30 min. |
| M11 | NUNCA pasar >30 min sin push si hay cambios significativos. |
| **M12** | **Canónico = `wip/{brand}` ESTABLE** (NO rota story-by-story). Worktree story efímero SOLO por pedido explícito user. |
| **M13** | **Scope per branch enforced** (pre-commit Section 13). `wip/{brand}` SOLO `{brand}/**`. `wip/core-*` SOLO engine. Cross-brand mixing PROHIBIDO. |
| **M14** | **N sesiones mismo cwd permitido** (canónico) con lock por bucket: code / docs / tests. Auto-acquire por skill step 0. |

## Sincronizacion canonicos (D10)

3 triggers de sync hacia `origin/main`:

| Trigger | Aplica | Comportamiento |
|---|---|---|
| T1 SessionStart hook | PRINCIPAL + CANÓNICO | auto-FF silent si tree clean + FF puro; advisory si merge real; LOUD si dirty + core changed |
| T2 `/pm-*` step 0 | TODOS `wip/*` | misma lógica T1 al bootstrap |
| T-push PreToolUse | TODOS `wip/*` | fetch + advisory pre-push (no bloquea) |

T1/T-push NUNCA ejecutan `uv sync` ni `pnpm install`. Solo advisory cuando `core/**/pyproject.toml` o `core/**/package.json` cambiaron.

## Politica merge a main (D11)

- Default: 1 squash-merge por story al cerrar `state=done` (auditor APPROVED + CHECKPOINTS.md). `/pm-{brand}` ejecuta como parte de transicion reviewing→done.
- Hotfix bypass auditor formal — REQUIERE `repro_verified: true` + test regression RED→GREEN + smoke pass.
- Experimentos NUNCA mergean.
- Core change requiere `/pm-luana` promotion proposal `state >= accepted`.

## Step 0 enforcement skills (D13)

SSoT `.claude/rules/step-0-worktree.md`. Matrix completa enforcement: ver detail doc. Resumen:

- `/pm-{brand-X}` en worktree brand X → OK
- `/pm-{brand-X}` en brand Y o PRINCIPAL o core → **HARD REFUSE**
- `/pm-luana` en PRINCIPAL o core o cualquier brand → OK (soft warn si efímero brand)

## Inicio de conversacion

```bash
git status --short && git branch --show-current && git log --oneline -3
git worktree list
scripts/git/status-all.sh                    # dashboard cross-worktree
scripts/git/sync-from-main.sh --check        # sync KISS v2 (solo reportar)
```

## Cierre de sesion

`"eso es todo"` / `"gracias"` / `"cierra"` / `/cierra-limpio`:

1. `git status --short`
2. Cambios propios → stage por nombre exacto + Conventional Commit + push + reportar SHA
3. Archivos ajenos → reportar intactos
4. Si efimero + story cerrada → `cleanup-session.sh {brand}-{slug}`

## Prohibido

- `git pull` (cualquier forma) | `git fetch && merge` automatico | `git push --force` / `--force-with-lease`
- `git revert` o `git reset --hard` sin aprobacion
- `git add .` / `-A` / `-u` | `git commit --no-verify`
- Editar codigo en PRINCIPAL (`luana-platform/` en `main`)
- Misma branch en 2 worktrees | `make dev-{brand}` en 2 worktrees misma brand
- Builders editando SSoT
- Invocar `/pm-{brand-X}` desde worktree brand Y
- Lift core sin promotion proposal accepted
- Sub-agent crea worktree (M9 v2 ban — auditor checks vía arch fitness test)

## Conflict resolution (1-liner)

NO sobreescribir. Append-friendly OK. Replacement obvio → STOP + reportar. Conflict de scope → escalate Chris.

## Referencias

- `docs/rules-detail/parallel-safety.md` — **detalle completo** (sub-agent ban, scope per branch enforce, N sesiones lock buckets, sync KISS, opencode parity)
- `docs/process/parallel-sessions-protocol.md` — SSoT D1-D14
- `docs/architecture/luana-platform/ADR-{004,005}*.md` — triple-branch + worktree policy
- `.claude/rules/{git-safety,git-haiku-delegation,step-0-worktree}.md`
- `docs/process/warp-multibrand-handbook.md` — manual operativo Warp
- `scripts/git/{new-session,cleanup-session,check-sync,push-wip,status-all,regenerate-manifest}.sh`
