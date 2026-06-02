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
