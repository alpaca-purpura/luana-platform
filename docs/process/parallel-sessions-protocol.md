# Parallel Sessions Protocol (worktree-based)

> **Status:** DRAFT progresivo — se actualiza in-place mientras decidimos temas #4-#8 (ver § Pendientes).
> Cuando esté completo y validado por Chris → status: `cemented` + ADR-005 + arranque mecanismos A-G.
>
> **Supersedes:** contenido pre-2026-05-17 (modelo single-branch `development` + ban worktrees). El ban fue revocado en ADR-004 2026-05-15. Este doc captura el modelo nuevo.
>
> **Owner:** `/pm-luana` (alias `/pm`). Aplica a todas las brands y opencode.

---

## TL;DR

1. **1 repo = N worktrees = 1 branch por worktree.** Git prohíbe la misma branch en 2 worktrees → aislamiento por diseño.
2. **Topología:** `luana-platform/` (principal en `main`, solo merges) + `luana-{brand}/` (canónico long-lived, 1 sesión a la vez) + `luana-{brand}-{slug}/` (efímeros para paralelo extra).
3. **Política de merge:** TODO va a `main`. NADA se mergea entre branches `wip/*`.
4. **Recursos compartidos no-aislables** (Docker, ports, `.venv`, lockfiles, migrations) → reglas operativas codificadas en hooks/scripts/skills, no en disciplina humana.

---

## Decisiones cementadas

### D1. Modelo conceptual

- Sesión Claude/opencode = proceso en un `cwd`. Una sesión = un worktree = una branch `wip/*`.
- `git worktree list` es el radar canónico (corrido desde cualquier worktree muestra todos).
- `.git/` objects + refs son compartidos entre worktrees (beneficio). `HEAD`/`index`/working tree son por-worktree (aislamiento).

### D2. Topología filesystem

| Path | Tipo | Branch | Editar código? | Vida |
|---|---|---|---|---|
| `~/Proyectos/luana-platform/` | Principal | `main` | ❌ NO (solo merges + lectura cross-brand) | Permanente |
| `~/Proyectos/luana-{brand}/` | Canónico long-lived | rota `wip/{brand}-*` según story activa | ✅ SÍ (1 sesión a la vez) | Semanas/meses |
| `~/Proyectos/luana-{brand}-{slug}/` | Efímero | `wip/{brand}-{slug}` único | ✅ SÍ (sesión paralela adicional de la misma brand) | Días (mientras dure la story) |

### D3. Naming convention

- Worktrees: `luana-{brand}/` canónico · `luana-{brand}-{slug}/` efímero (`{slug}` = identificador story/sesión, kebab-case, `[a-z0-9_-]+`).
- Branches WIP: `wip/{brand}-{slug}` (brand-prefixed siempre para grep y readability en `git worktree list`).
- Branches integración: `main` (única). Producción: `release/{brand}-vX.Y.Z`.

### D4. Política de merge

- **TODO va a main, NADA merge entre branches wip/*.**
- Efímero termina story → squash-merge a `main` (desde worktree principal) + cleanup del worktree con `cleanup-session.sh` (branch remota queda hasta cron purge 30d).
- Canónico termina story → squash-merge a `main` → rota a nueva `wip/{brand}-{slug-siguiente}` para próxima story.
- Para que worktree B "vea" un cambio que A mergeó a main: `git fetch origin && git merge origin/main` desde su `wip/B` (NUNCA `git pull`).
- Efímeros nacen desde `origin/main` fresco siempre (NO desde HEAD del worktree donde se lanza el script).

### D5. Recursos compartidos (lo que NO se aísla)

| Recurso | Compartido | Decisión técnica |
|---|---|---|
| `.git/` objects + refs | Sí (beneficio) | No tocar — funcionamiento normal de git worktrees |
| `.git/hooks/` | Sí | Compartido como hoy. Hooks deben usar `git rev-parse --show-toplevel` (no hardcodear paths) |
| Docker daemon + ports + postgres `:5435` | Sí (sistema operativo) | **Regla M3 + nueva:** máximo 1 stack docker por brand vivo, sin importar cuántos worktrees de esa brand haya |
| `.venv/` raíz (884 MB) | No (cada worktree tendría que tenerlo) | **Symlink** `${worktree}/.venv → ~/Proyectos/luana-platform/.venv/` creado automático por `new-session.sh` |
| `node_modules/` | No | Cada worktree corre su `pnpm install` (gitignored, ~500 MB extra por worktree, asumible) |
| Lockfiles root (`pnpm-lock.yaml`, `uv.lock`) | Físicamente por-worktree, pero merge conflict al integrar | Declarar `touches_root_lockfiles: true` en `checkpoint.md` de la story; coordinación 1-a-la-vez |
| Alembic migration grafo (por brand) | Lógicamente compartido (down_revision lineal) | 1 sesión por brand genera migration a la vez; la segunda actualiza su `wip/*` desde main antes de generar la suya |
| `.claude/` (skills/rules/settings) | Físicamente por-worktree hasta merge | OK como está. Si modificás skill, ratificá rápido a main para que todas las sesiones lo recojan |
| RAM | Sí (~1.5-2 GB por stack docker activo) | Limita stacks docker → regla "max 1 por brand" arriba |

### D6. Reglas operativas heredadas (siguen vigentes con redefinición worktree)

| Regla | Resumen | Estado |
|---|---|---|
| M2 — Owner único SSoT | Solo `/pm-luana` o `/pm-{brand}` editan `learnings.md`, `BACKLOG.md`, `MEMORY.md`, `PORTFOLIO.md`. Builders nunca | Vigente |
| M3 — Tests/Docker/migrations SECUENCIAL por brand | Una sesión por brand corre `make dev-{brand}`, `pytest --integration`, alembic generate a la vez | Vigente + endurecida (max 1 stack/brand) |
| M4 — Claim by commit | `/pm-{brand}` cambia `state` en checkpoint.md + commit/push inmediato pre-claim | Vigente |
| M5 — NO pull / NO force / NO revert sin aprobación | `git pull`, `git push --force`, `git revert` prohibidos. Push falla non-fast-forward → STOP, reportar | Vigente |
| M6 — `/pm-{brand}` bootstrap pregunta story activa | No asume default | Vigente |
| M7 — Subagentes con paths PRIMARIOS del story | Read-all OK, extend-no-destroy en archivos ajenos | Vigente |
| M8 — Tocar archivos otra sesión | Solo si entendés leyendo + extend/append no replace + STOP si rompe | Vigente |
| M11 — Push cada ≤30 min con cambios significativos | Safety net WIP | Vigente |

---

## Mecanismos a codificar (estado: pending)

| # | Mecanismo | Dónde | Estado |
|---|---|---|---|
| A | Hook `SessionStart` Claude Code que detecta cwd + clasifica worktree + verifica symlink venv + imprime estado | `~/.claude/settings.json` | pending |
| B | `new-session.sh` mejorado: nace de `origin/main` fresco + crea symlink `.venv` + copia `.env.dev.template` por brand | `scripts/git/new-session.sh` | pending |
| C | `cleanup-session.sh` mejorado: verifica tree limpio + push final + prompt "¿mergee branch a main?" + remove worktree | `scripts/git/cleanup-session.sh` | pending |
| D | Pre-commit hook checks nuevos: (i) bloquear commit directo en `main`; (ii) migration collision detection; (iii) lockfile root undeclared warning | `scripts/git-hooks/pre-commit` | pending |
| E | `/pm-{brand}` step 0 obligatorio: detect worktree mode + verify branch wip + list cross-brand modified files + list otros worktrees vivos de la misma brand | `.claude/skills/pm-{brand}/SKILL.md` (×4 + template) | pending |
| F | Wrapper `make dev-{brand}` con lock: aborta si `docker ps \| grep luana-{brand}-` ya hay containers vivos | `Makefile` o wrapper script | pending |
| G | Wrapper alembic generate con lock: warning si remote tiene otra `wip/{brand}-*` con migrations recientes | `scripts/generate_migration.py` | pending |

---

## Temas pendientes de discutir (orden actual)

- **#4 Naming + descubribilidad** — cómo a las 11pm con 3 worktrees activos sabés qué corre dónde + cómo `/pm-{brand}` lo detecta al bootstrap. (Refina D3 + alimenta mecanismos A y E.)
- **#5 Política merge / puntos de control** — ¿cuándo squash-merge a main: por story completa? por ticket? threshold de Auditor APPROVED? quién dispara el merge?
- **#6 Caso especial core (`luana-core-*`)** — cómo se compagina la promotion gate (`/pm-luana`) con worktrees efímeros + cross-worktree dependency cuando B necesita un cambio core que A acaba de mergear.
- **#7 Skills `/pm-{brand}` enforcement** — detalle del step 0 (mecanismo E) + Q&A de cómo cada skill se entera del modo worktree y reacciona.
- **#8 Opencode parity** — qué cambia (si algo) cuando una sesión es opencode en vez de Claude Code (hooks, settings, skills loading).

Una vez cubiertos #4-#8 + cementadas las decisiones derivadas → este doc se promueve a `status: cemented`, se crea ADR-005, y arrancamos implementación A-G.

---

## Inicio sesión (snapshot operativo actual, refinable)

```bash
cd ~/Proyectos/luana-{brand}/                # canónico de la brand
git status --short
git branch --show-current                    # debe ser wip/{brand}-{slug}
git worktree list                            # ver qué otros worktrees están vivos
git log --oneline -3
```

- Branch `wip/{brand}-*` limpio en worktree dedicado → proceder.
- Branch `main` → estás en principal, no editar código.
- Tree sucio con archivos AJENOS a la brand del worktree → STOP, reportar lista, no tocar.

## Cierre sesión (snapshot operativo actual, refinable)

`"eso es todo"` / `"gracias"` / `"cierra"` / `/cierra-limpio`:

1. `git status --short`
2. Cambios propios → stage por nombre exacto + conventional commit + `git push origin wip/{brand}-{slug}` + reportar SHA
3. Archivos ajenos → reportar intactos
4. Si efímero y story cerrada → `scripts/git/cleanup-session.sh {brand}-{slug}` desde principal (cuando esté mejorado, mecanismo C)

## Prohibido (actualizado)

- `git pull` (cualquier forma)
- `git fetch && merge` automático (solo `fetch + merge` deliberado para traer main a wip)
- `git push --force` / `--force-with-lease`
- `git revert` sin aprobación
- `git reset --hard` sin aprobación
- `git add .` / `-A` / `-u`
- `git commit --no-verify`
- Editar código en worktree principal (`luana-platform/` en `main`)
- Misma branch `wip/*` checkouteada en 2 worktrees (git lo bloquea por diseño)
- `make dev-{brand}` en 2 worktrees de la misma brand simultáneamente
- Builders editando SSoT (`learnings.md`, `BACKLOG.md`, `MEMORY.md`, `PORTFOLIO.md`)

## Conflict resolution (vigente)

Si encontrás archivo modificado por otra sesión (en el branch wip propio o al mergear a main):
1. **NO sobreescribir.** Leer primero.
2. Si conflict de scope → escalate Chris.
3. Si append-friendly (logs, IMPL-LOG, history) → append OK.
4. Si replacement obvio (typo, refactor) → STOP + reportar antes proceder.

---

## Referencias

- `docs/architecture/luana-platform/ADR-004-git-branching-and-environments.md` — triple-branch policy (rationale)
- `docs/architecture/luana-platform/ADR-005-worktree-policy.md` — **PENDIENTE crear cuando este doc se cemente**
- `.claude/rules/parallel-safety.md` — runtime rules sintetizadas (a sincronizar con este doc al cementar)
- `.claude/rules/git-safety.md` — triple-branch operacional
- `.claude/rules/git-haiku-delegation.md` — commit+push delegation pattern
- `scripts/git/new-session.sh` — creación worktree (mejora pendiente, mecanismo B)
- `scripts/git/cleanup-session.sh` — cierre worktree (mejora pendiente, mecanismo C)
- `docs/process/git-workflow-multibrand.md` — workflow git multi-brand (verificar consistencia al cementar)
