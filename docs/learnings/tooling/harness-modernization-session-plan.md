# Plan de sesión — Homologación técnica + modernización del harness (2026-06-01)

> SSoT vivo de esta línea de trabajo (sobrevive a context-rot / resúmenes). Solo-operador (Chris). Origen: sesión 2026-06-01 desde worktree `luana-vitalia` (`wip/vitalia`).

## Directivas vigentes de Chris (NO violar)

1. **Trabajar todo acá** (worktree vitalia / `wip/vitalia`). Commit por pathspec; cross-cutting (`.claude/`, `tools/`, `docs/`, `core/`) con `SCOPE_GATE_SKIP=1` + razón en el body. No entreverar con la story en vuelo `vitalia-fase2-lisa-doctores` (developing).
2. **Workflows JS de Claude = motor de trabajo** (auditorías, edits por lote, research). Optimizar calidad/precio + evitar saturar contexto + evitar rehacer por context-rot.
3. **Handoff por sesión:** al cerrar cada chunk → entregar el **prompt EXACTO** para arrancar una conversación nueva con contexto fresco. Iterar así hasta terminar.
4. **Catalog + propose:** NADA se edita en el harness sin ratificación explícita de Chris.
5. **Solo-operador:** no hay otros programadores; el proceso debe ser operable por una persona.

## Encuadre (ratificado)

- **Modernización del harness** (skills/agents/rules/hooks/cockpit) y **historia B** = **hermanos separados** (cómo construimos vs qué construimos). Enlazados: el harness habilita a B.

## Secuencia macro (ratificada)

```
B (motor agentico, core)  →  Vitalia (instanciar+validar)  →  A (homologación, gate de replicación)  →  nicolify/comunify (replicar)
```
La **modernización del harness** es enabler transversal que corre primero/al margen (esta línea de trabajo).

## Frente actual: modernización del harness

1. [done] Research CC junio-2026 → `docs/learnings/tooling/claude-code-2026-capabilities.md`
2. [done] Schemas verificados contra docs oficiales (skills/agents/hooks) — embebidos en el workflow
3. [running] **Workflow `harness-audit-2026`** (run `wf_1f1d1973-ac4`) → catálogo ratificable
4. [pending] Chris ratifica el catálogo → qué se aplica
5. [pending] Aplicar cambios por lotes vía workflow (con prompt de sesión fresca por lote)
6. [pending] **Diseñar el PROCESO de gestión del ciclo de vida de harnesses** (solo-operador, report+fix on-the-fly ordenado) ← pedido Chris 2026-06-01
7. [pending] Refinar la historia B con el plan completo

## Entregables abiertos

- [ ] Catálogo de auditoría → `docs/learnings/tooling/harness-audit-2026-06-01.md`
- [ ] Proceso de ciclo de vida de harnesses (deliverable final)
- [ ] Prompt(s) de próxima sesión (contexto fresco) por cada chunk
- [ ] Refinamiento de B (`empleados-ia-auto-extension`)

## Artefactos ya creados esta sesión

- `docs/product/outcomes/tech-baseline-homologation-platform.md` (homologación A, secuencia revisada)
- `docs/learnings/tooling/claude-code-2026-capabilities.md` (baseline CC junio-2026)
- este archivo (plan de sesión)
- appends a `docs/product/stories/empleados-ia-auto-extension/chris-input.md`

## Progreso aplicado en esta sesión (2026-06-01)

### Silent-killers (ratificados Chris, aplicados)
- QW-2: `contract-guard.js` worktree-agnostic (CLAUDE_PROJECT_DIR + regex `/luana-*/`) — hook revivido en worktrees ≠ luana-platform (verificado: dispara en vitalia).
- QW-1: `handoff` + `worktree-protocol` SKILL.md — comentario `voseo-allowed` movido debajo del frontmatter (línea 1 = `---`).
- QW-13: `grep-bot` → "Luana Grep Bot".

### Voseo descope (pedido Chris — "solo UI, no harness")
- `scripts/git-hooks/pre-commit` §1: markdown FUERA del scan + exclusión de `.claude/`, `docs/`, `scripts/`, `tools/`, tests. El voseo solo se enforce en código de producto `.py`/`.ts`/`.tsx` user-facing. Output agéntico → arch tests en `core/`.
- `.claude/rules/spanish-text.md`: alcance reescrito (UI/agentic only) + magic comment marcado obsoleto para internos.
- `.claude/skills/po/SKILL.md`: comentario línea 1 eliminado (último offender de registro).
- Pendiente Wave 3 (opcional): limpiar ~73 comentarios `voseo-allowed` heredados en docs/skills (ruido inofensivo).

### Clase B (tessl) — severidad corregida → D-11 (decisión Chris pendiente)

### Pendiente inmediato
- Ratificación D-1..D-11.
- Commit por pathspec de los fixes (sin commitear aún).
- Prompt de sesión fresca para Wave 1 workflow.
- Proceso de ciclo de vida de harnesses (deliverable final).

## D-1..D-11 — RATIFICADAS por Chris (2026-06-01, "todas como recomendaste")

| # | Resolución ratificada |
|---|---|
| D-1 | `model: opus` en skills → **mantener**, verificar campo contra doc en Wave 2 (no remover: campo desconocido se ignora) |
| D-2 | `git-manager` → **RETIRAR** (deprecar: `disable-model-invocation:true`+`user-invocable:false` + banner → `commit-push`) |
| D-3 | `ux-disruptivo` + `ux-flow-architect` + `02-design-ui-template.md` → **DEPRECAR los 3** (stub → `/po-ux`) |
| D-4 | GitHub Actions → **seguir DEFERRED** + banners en docs que asumen GA activo |
| D-5 | scripts faltantes → **HÍBRIDO**: crear los del DoD live-verify (`dev-app-up.sh`,`cloudflared-setup.sh`,`e2e-preflight.sh`) si faltan; resto `⏳ PENDING` honesto |
| D-6 | cap líneas CLAUDE.md → **bumpear caps a 270/165** ahora + trim oportunista Wave 3 |
| D-7 | migración paradigm ADR-010 (config/infra→cajas) → **DIFERIR** (pista B/Vitalia, NO harness) |
| D-8 | audit docs históricos post nicolify-reset → **banners HISTORICAL in-place** (Wave 3) |
| D-9 | dirs faltantes (observed-bugs, allowlist 6 brands) → **on-demand** |
| D-10 | self-fix policy → **v4.2 canónico** (self_fix≤5, audit≤4), tachar v4.1 en todos lados |
| D-11 | tessl `tessl__*` refs → **reemplazar por guía inline / `tessl-context`** (salvo que Chris decida instalar plugin/MCP Tessl) |

### Nuevo bug detectado esta sesión (agregar a Wave 1/2)
- `make install-hooks` ROTO en worktrees: asume `.git` directorio (`mkdir .git/hooks` falla). Fix: usar `git rev-parse --git-path hooks` para el dir común. Workaround usado hoy: `cp scripts/git-hooks/pre-commit "$(git rev-parse --git-path hooks)/"`.

### Estado: silent-killers + voseo descope = COMMITEADOS (17bf3c62). Hook nuevo instalado en dir común (todos los worktrees).
