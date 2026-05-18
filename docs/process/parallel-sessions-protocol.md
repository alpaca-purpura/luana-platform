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

| Tipo | Branch pattern | Worktree path |
|---|---|---|
| Canónico long-lived | rota `wip/{brand}-{slug}` según story activa | `~/Proyectos/luana-{brand}/` |
| Story estándar (efímero) | `wip/{brand}-{story-id}` | `~/Proyectos/luana-{brand}-{story-id}/` |
| Story multi-lane (paralelo dentro de misma story) | `wip/{brand}-{story-id}-{lane}` | `~/Proyectos/luana-{brand}-{story-id}-{lane}/` |
| Hotfix sin story formal | `hotfix/{brand}-{slug-corto}` | `~/Proyectos/luana-{brand}-hotfix-{slug-corto}/` |
| Experimento / spike | `exp/{brand}-{slug-corto}` | `~/Proyectos/luana-{brand}-exp-{slug-corto}/` |
| Integración estable | `main` (única) | `~/Proyectos/luana-platform/` |
| Producción brand-específica | `release/{brand}-vX.Y.Z` | (CI/CD, no worktree local) |

**Reglas duras de naming:**
- `{slug}` solo `[a-z0-9-]`, lowercase. Sin `_` ni mayúsculas (filesystem-friendly + git-friendly).
- Max 40 chars el slug completo; path total objetivo <60 chars para legibilidad en `ls` y prompts.
- Si `story-id` es muy largo (>30 chars), `/po-ux` o `/po` al crear la story debe acortar a un alias estable.
- `{lane}` típicos: `be`, `fe`, `tests`, `docs` (libres pero recomendados).
- Hotfix/exp prefijos separados (no `wip/`) para diferenciar visualmente en `git branch` y limitar TTL distinto si hace falta.

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

### D7. Visibilidad cross-terminal (cómo a las 11pm sabés qué corre dónde)

| Capa | Estado | Propósito |
|---|---|---|
| **PS1 customizado bash** | Obligatorio | Cada terminal muestra worktree + branch + dirty status permanentemente. Resuelve 80% del problema visual día a día |
| **Dashboard `scripts/git/status-all.sh`** | Obligatorio (mecanismo H, ver tabla mecanismos) | `git worktree list` enriquecido: branch + dirty/clean + last commit + Docker activo per brand + story-id leído de `.session.yaml` |
| **Manifest `.session.yaml` por worktree** | Obligatorio (excepto principal `main`) | Generado auto por `new-session.sh`. Estructura: `brand`, `story_id`, `lane` (opcional), `tickets`, `created_at`, `created_by_skill`. Gitignored (por-worktree no versionable). Consumido por skills (mecanismo E) + dashboard |
| **Warp Tabs** (Chris usa Warp como terminal) | Recomendado: 1 tab Warp por worktree, con auto-naming basado en `cwd` (o slug del manifest). Reemplaza la idea genérica "Terminator/tmux config" | Configurable en Warp settings (Tab naming) |
| **Warp Workflows** (Chris OK integrarlos) | Atajos para `new-session`, `cleanup-session`, `status-all` ejecutables desde la palette de Warp. Capa por encima de los scripts bash (los scripts son la fuente de verdad portable) | Configurables como mecanismo K |

Formato PS1 propuesto (a confirmar según shell de Chris):
```
[luana-{worktree-suffix} {branch} {dirty-marker}]$
```
Ejemplo: `[luana-vitalia-copilot-tools-impl-be wip/vitalia-copilot-tools-impl-be ✗]$`

Formato dashboard:
```
WORKTREE                              BRANCH                              STATUS       LAST COMMIT      STORY                    DOCKER
luana-platform                        main                                clean        9e78002 (10m)    —                        —
luana-vitalia-copilot-tools-impl-be   wip/vitalia-copilot-tools-impl-be   3 modified   abc1234 (2h)     copilot-tools-impl       vitalia ✓ running
luana-comunify-design-cement          wip/comunify-design-cement          clean        def5678 (35m)    design-system-cement     —
```

### D9. Multi-lane (misma story, N sesiones simultáneas)

Caso de uso: misma story, distintos esfuerzos paralelos (BE+FE+tests). Es **excepcional, no default** — la mayoría de stories viven en una sola branch sin sufijo lane.

| Decisión | Resultado |
|---|---|
| Cuándo usar | Solo cuando la misma story tiene 2+ sesiones simultáneas. Default = `wip/{brand}-{story-id}` sin lane |
| Catálogo recomendado | `be`, `fe`, `tests`, `docs` (libres pero recomendados) |
| Max lanes simultáneas por story | 3. Si llegás a 4 → escalar split de story (paradigm v4: >10 tickets = story demasiado grande) |
| Merge order | Cada lane mergea a main por separado en su orden de cierre. NO consolidación entre lanes |
| Cross-lane dependency | Ruta por main: lane BE mergea primero → lane FE hace `git fetch origin && git merge origin/main` en su wip |
| Lane "principal" de una story | NO existe. Las lanes son peers |
| Canónico puede ser una lane temporalmente | Sí (canónico vitalia en `wip/vitalia-X-be`, efímero en `wip/vitalia-X-fe`). Pero NUNCA 2 lanes en el mismo worktree |

### D8. Detección automática del modo worktree

Sistema clasifica con 2 fuentes complementarias:

**Fuente 1 — Path regex (clasificación primaria, sin I/O):**

```python
# Aplicado sobre git rev-parse --show-toplevel
cwd ends with /luana-platform/?$       → PRINCIPAL
cwd ends with /luana-{brand}/?$         → CANÓNICO brand={brand}
cwd ends with /luana-{brand}-{slug}/?$  → EFÍMERO brand={brand}, slug={slug}
otherwise                                → UNKNOWN
```

`{brand}` ∈ {`vitalia`, `nicolify`, `comunify`, `lupulo`, futuros}. Si el primer token después de `luana-` no es brand conocida → UNKNOWN.

**Fuente 2 — Manifest `.session.yaml` (datos estructurados):**

Archivo en raíz del worktree, generado auto por `new-session.sh`, gitignored:
```yaml
brand: vitalia
worktree_type: ephemeral          # principal | canonical | ephemeral
story_id: copilot-tools-impl
lane: be                           # opcional
tickets: [T-2, T-3]                # opcional, /pm-{brand} mantiene
created_at: 2026-05-17T20:00:00-05:00
created_by_skill: pm-vitalia
parent_branch: origin/main
notes: ""
```

Manifest NO incluye: estado dinámico story (vive en `{brand}/docs/product/stories/{story-id}/checkpoint.md`), archivos modificados (vive en `git status`), commit hashes (vive en `git log`). Es identidad estática del worktree.

**Coexistencia de las dos fuentes:**

| Caso | Path | Manifest | Resultado |
|---|---|---|---|
| Worktree creado con `new-session.sh` | EFÍMERO vitalia | presente, coincide | OK, contexto completo |
| Worktree principal | PRINCIPAL | ausente (no se crea ahí) | OK, contexto = PRINCIPAL |
| Canónico creado con script | CANÓNICO vitalia | presente, brand=vitalia, type=canonical | OK, contexto completo |
| Carpeta a mano sin script | EFÍMERO vitalia | ausente | UNKNOWN_EPHEMERAL → `/pm-{brand}` pide regularizar o regenerar manifest |
| Carpeta renombrada a mano | EFÍMERO comunify | presente, brand=vitalia | ERROR brand mismatch → escalate Chris |
| Nombre raro | UNKNOWN | irrelevante | UNKNOWN → escalate Chris |

**Consumidores:**
- Mecanismo A (SessionStart hook) — corre detección al abrir Claude/opencode
- Mecanismo E (`/pm-{brand}` step 0) — corre detección al invocar skill
- Mecanismo H (dashboard) — enriquece output con manifest
- Mecanismo F (wrapper docker) — sabe qué brand activar
- Mecanismo K (Warp Workflows) — usa misma lógica para naming auto de tabs

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
| B | `new-session.sh` mejorado: nace de `origin/main` fresco + crea symlink `.venv` + copia `.env.dev.template` por brand + genera `.session.yaml` manifest | `scripts/git/new-session.v2.sh` (propuesta lista 2026-05-17, awaiting Chris validation antes de promover a `new-session.sh`) | **v2 implementada — falta promotion** |
| C | `cleanup-session.sh` mejorado: verifica tree limpio + push final + prompt "¿mergee branch a main?" + remove worktree | `scripts/git/cleanup-session.sh` | pending |
| D | Pre-commit hook checks nuevos: (i) bloquear commit directo en `main`; (ii) migration collision detection; (iii) lockfile root undeclared warning | `scripts/git-hooks/pre-commit` | pending |
| E | `/pm-{brand}` step 0 obligatorio: detect worktree mode + verify branch wip + list cross-brand modified files + list otros worktrees vivos de la misma brand | `.claude/skills/pm-{brand}/SKILL.md` (×4 + template) | pending |
| F | Wrapper `make dev-{brand}` con lock: aborta si `docker ps \| grep luana-{brand}-` ya hay containers vivos | `Makefile` o wrapper script | pending |
| G | Wrapper alembic generate con lock: warning si remote tiene otra `wip/{brand}-*` con migrations recientes | `scripts/generate_migration.py` | pending |
| H | Dashboard `scripts/git/status-all.sh`: enriquece `git worktree list` con dirty status + last commit + story-id (manifest) + Docker activo per brand | `scripts/git/status-all.sh` | pending |
| I | PS1 customizado bash: `[luana-{suffix} {branch} {dirty}]$` integrado al `~/.bashrc` (o starship/oh-my-bash si Chris usa) | `~/.bashrc` o equivalente | pending |
| J | `.session.yaml` manifest auto-generado por `new-session.sh` (parte de mecanismo B) + consumido por mecanismos E, H | dentro de B | pending |
| K | **Warp Workflows** envolviendo B, C, H como atajos ejecutables desde palette Warp (alternativa visual a tipear el script bash). Scripts bash siguen siendo SSoT portable | Warp settings (yaml export per workflow) | pending (opcional, depende de B/C/H) |

---

## Temas pendientes de discutir (orden actual)

- **#4 Naming + descubribilidad** — cómo a las 11pm con 3 worktrees activos sabés qué corre dónde + cómo `/pm-{brand}` lo detecta al bootstrap. (Refina D3 + alimenta mecanismos A y E.)
- **#5 Política merge / puntos de control + sincronización canónicos** — ¿cuándo squash-merge a main (por story? por ticket? threshold Auditor APPROVED? quién dispara)? **Y nueva pieza crítica (Chris 2026-05-17):** sincronización automática/semi-automática de los canónicos cuando otra sesión mergea a main, especialmente cambios al core. Los canónicos son long-lived → no pueden quedarse atrasados días. Opciones: sync al SessionStart (hook A), sync periódico, sync gatillado por evento, sync a demanda con prompt. **Prioridad alta dentro de tema #5.**
- **#6 Caso especial core (`luana-core-*`)** — cómo se compagina la promotion gate (`/pm-luana`) con worktrees efímeros + cross-worktree dependency cuando B necesita un cambio core que A acaba de mergear.
- **#7 Skills `/pm-{brand}` enforcement** — detalle del step 0 (mecanismo E) + Q&A de cómo cada skill se entera del modo worktree y reacciona.
- **#8 Opencode parity** — qué cambia (si algo) cuando una sesión es opencode en vez de Claude Code (hooks, settings, skills loading).

Una vez cubiertos #4-#8 + cementadas las decisiones derivadas → este doc se promueve a `status: cemented`, se crea ADR-005, y arrancamos implementación A-K.

### Entregables finales del proceso (post-cement)

| Entregable | Para | Status |
|---|---|---|
| Este doc en `status: cemented` | Owner /pm-luana | pending |
| ADR-005 worktree policy | Decisión arquitectónica | pending |
| `.claude/rules/parallel-safety.md` sincronizado con este doc | Runtime rule cargada en CLAUDE.md | pending |
| **Manual operativo Warp** (`docs/process/warp-multibrand-handbook.md` o equivalente) | Chris — cómo usar Warp día a día con el proceso completo: tabs, workflows, atajos, troubleshooting | **pending (Chris-explícito 2026-05-17)** |
| Mecanismos A-K implementados | Sistema | pending |

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
