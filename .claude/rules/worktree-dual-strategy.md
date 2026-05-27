# Worktree Dual Strategy (refining + build paralelos)

**Origen:** conversación 2026-05-27 — Chris quiere ejecutar refinamiento+UX y arquitectura+desarrollo en paralelo sin pisarse. Mientras dev-team construye una story, /pm-{brand} debe poder refinar las próximas (con anti-duplication-refining + prior-art-scan obligatorio).

**Cement-date:** 2026-05-27. **Aplica a:** brands con outcomes multi-story (vitalia activamente, nicolify legacy, comunify en bootstrap, lupulo placeholder).

## Regla cardinal

Cuando Chris quiere paralelizar refinamiento + build dentro de la MISMA brand activa, usa **2 worktrees dedicados** con scopes distintos:

```
~/Proyectos/luana-{brand}-refine/      branch: wip/{brand}-refine
  └ Sesión Claude #1: /pm-{brand} + /po-ux + /architect (refining stories)
  └ Toca: {brand}/docs/product/stories/{id}/ NUEVAS
  └ NO toca: {brand}/{backend,frontend}/src/   (esa parte vive en worktree build)

~/Proyectos/luana-{brand}/             branch: wip/{brand}   (canónico build)
  └ Sesión Claude #2: /dev-team + /auditor (building active story)
  └ Toca: {brand}/{backend,frontend}/src/   de la story READY
  └ NO toca: {brand}/docs/product/stories/{nuevas}/   (esa parte vive en refine)
```

## Scope per worktree (hard rule)

| Worktree | Permitido editar | Prohibido editar |
|---|---|---|
| `luana-{brand}-refine` (refining lane) | `{brand}/docs/product/stories/{new-id}/` (specs/designs/arch) + `{brand}/docs/product/{outcomes,capabilities,modules}/` + `{brand}/docs/learnings/` (prior-art capture) | `{brand}/backend/src/` + `{brand}/frontend/src/` (rompe story-in-progress en worktree build) |
| `luana-{brand}` (canonical build) | `{brand}/backend/src/` + `{brand}/frontend/src/` + tests + migrations de la story READY | `{brand}/docs/product/stories/{otras-stories}/` (rompe refinamiento concurrent) |

## Setup ad-hoc

```bash
# Worktree refining lane (nuevo, además del canónico build)
cd ~/Proyectos/luana-platform
git worktree add ~/Proyectos/luana-{brand}-refine -b wip/{brand}-refine
cd ~/Proyectos/luana-{brand}-refine
cat > .session.yaml <<EOF
brand: {brand}
type: REFINE_LANE
canonical: false
purpose: "Refinamiento concurrent stories mientras canónico build develop story READY"
EOF
```

`scripts/git/new-session.sh` debería tener flag `--refine-lane` que lo automatice (TBD).

## Naming convention worktrees

| Tipo | Path | Branch | Cuándo |
|---|---|---|---|
| `~/Proyectos/luana-platform/` | PRINCIPAL | `main` | Siempre (read cross-brand + merges) |
| `~/Proyectos/luana-{brand}/` | CANÓNICO build | `wip/{brand}` | Story READY → dev-team construye |
| `~/Proyectos/luana-{brand}-refine/` | REFINE_LANE | `wip/{brand}-refine` | Refinar próximas stories en paralelo |
| `~/Proyectos/luana-{brand}-story-{id}/` | EFÍMERO build (ad-hoc) | `wip/{brand}-{id}` | Hot-fix urgente o experimento |
| `~/Proyectos/luana-protocol-{slug}/` | EFÍMERO protocol | `wip/protocol-{slug}` | Cross-cutting changes (rules/hooks/skills) |
| `~/Proyectos/luana-core-{slug}/` | EFÍMERO core lift | `wip/core-{slug}` | Promotion gate brand→core via /pm-luana |

## "No egoísmo" clause

Si la sesión refine ve un bug claro en código vivo (que pertenece al worktree build), **NO lo ignora**. Workflow:

1. Documenta en `T-{n}-impl-log.md` de la story que estás refinando, sección `## Cross-worktree observed bugs`
2. Crea archivo `{brand}/docs/observed-bugs/{date}-{slug}.md` con: file:line + symptom + suggested fix
3. Notifica a Chris en respuesta ("vi bug en X, lo dejé documentado en {path}, ¿lo arreglo aquí o lo dejo para hotfix?")
4. Chris decide:
   - **Hotfix here**: refine lane fixea + commit en mismo wip/{brand}-refine + push (override sospecha = ratificación Chris)
   - **Hotfix dedicado**: crear worktree `~/Proyectos/luana-{brand}-hotfix-{slug}/` con branch `hotfix/{brand}-{slug}` (per parallel-safety) + Chris asigna a sesión que lo trabaje
   - **Deferred**: documentado en observed-bugs/ + agregado al BACKLOG.md como story idea

Anti-egoísmo: **NUNCA** ignorar un bug visible "porque no es mi worktree" — siempre dejar rastro (mínimo file en observed-bugs/).

## Cross-worktree sync (post squash-merge)

Cuando worktree build squash-mergea su story a main:

1. Worktree refine debe **sincronizarse con main** ANTES de cerrar próxima refinement (per `.claude/rules/git-safety.md` § Sync wip/{brand} con main).
2. Si refine tiene cambios specs/designs ahead, hacer merge `origin/main` en refine (preserva refinement work + trae build work).
3. Sin sync: refine queda atrasado + spec puede contradecir código ya mergeado.

## WIP cap impact

Per `parallel-safety.md` M14: N sesiones mismo cwd permitido con lock por bucket (code/docs/tests). Worktree dual reduce contención:

- Worktree refine → lock bucket `docs` (PM/PO/architect están en bucket docs)
- Worktree build → lock bucket `code` (dev-team/auditor están en bucket code)
- Sin colisión: paralelismo natural sin esperar locks

## Anti-patterns prohibidos

- ❌ Worktree refine editando `{brand}/backend/src/` o `{brand}/frontend/src/` (viola scope discipline)
- ❌ Worktree build editando `{brand}/docs/product/stories/{id-distinto}/` (rompe refinamiento concurrent)
- ❌ Misma branch en 2 worktrees (`wip/{brand}` en build + `wip/{brand}` en refine — git bloquea por diseño)
- ❌ Bug visto en otra worktree pero ignorado sin documentar en observed-bugs/
- ❌ Refine lane sin sync con main post squash-merge → spec contradice código merged
- ❌ Hot-fix urgente desde refine lane sin Chris ratify scope override
- ❌ Worktree refine creado sin `.session.yaml` (manifest mandatory per `step-0-worktree.md`)
- ❌ Worktree build cerrando story sin sync refine (refine pierde context post-merge)

## Enforcement layers

| Layer | Mecanismo | Status |
|---|---|---|
| 1 | Pre-commit hook scope gate (`scripts/git-hooks/pre-commit` Sec 13) extend a detectar worktree type via `.session.yaml.type` + bloquea cross-scope | ⏳ hook extend |
| 2 | `scripts/git/new-session.sh` agregar flag `--refine-lane` que setup correcto | ⏳ script update |
| 3 | `/dev-team` Step 0 detecta si está en REFINE_LANE → HARD REFUSE ("dev-team no aplica en refine lane, ve a worktree canónico build") | ⏳ skill update |
| 4 | `/pm-{brand}` y `/po-ux` step 0 detectan si están en CANÓNICO build con story develop activa → advisory "considera worktree refine lane" | ⏳ skill update |
| 5 | `scripts/git/status-all.sh` dashboard incluye column `lane` (build/refine) per worktree | ⏳ script update |

## Referencias

- `.claude/rules/parallel-safety.md` D2 + M14 — base topología + locks
- `.claude/rules/step-0-worktree.md` — manifest + verification
- `.claude/rules/git-safety.md` § Sync wip/{brand} con main — post squash-merge cross-worktree sync
- `.claude/rules/anti-duplication-refining.md` — prior-art scan (consumer de refine lane)
- `docs/architecture/luana-platform/ADR-005-worktree-policy.md` — decisión worktrees
