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

---

## Sesión 2026-06-01 (continuación) — Waves 1+2A+2B + DoD ENDURECIDA aplicadas

> Motor: workflows JS (catalog+propose → diff → ratify Chris → commit Haiku por pathspec, SCOPE_GATE_SKIP=1). Verify-first (varias findings del catálogo resultaron sobreestimadas: globs analytics/offer ya correctos, tessl HARD-GATE era graceful-ignore, `<nextjs-portal>` siempre existe en dev).

**Commits (todos en `wip/vitalia`, pushed):**

| # | SHA | Qué |
|---|---|---|
| 1 | `2388a13a` | **Wave 1 mecánico** QW-3..QW-20: overlay caps 270/165 (D-6), containers reales `luana-dev-{brand}_{service}_dev-1`, IDs Opus 4.7→4.8, 04-tickets→06-tickets, WIP caps developed/reviewing ≤1, audit_iterations cap 4, `_OVERLAY-template`→`vitalia/CLAUDE.md`, `lib/routing/shell-routes`→`lib/shell-routes`, LITELLM fuera de flags activos, grep-bot color cyan |
| 2 | `dc6a94fa` | **Wave 2A** gates: #37 DoD en 6 templates (07-merge §6 REFUSE, checkpoint dod_*, 04-validators live_verify, T-* + Cat 12/13/14 en T-review) + #33 CONN+Prior-art en 03-arch + 5 globs de rules a paths reales |
| 3 | `32c01fcd` | **DoD keystone**: rule #37 endurecida (6 secciones) + `vitalia/frontend/e2e/fixtures/base.ts` (gate anti-burbuja, **live-verified 4 passed** localhost:3002) + `scripts/verify-no-backend-errors.sh` |
| 4 | `4663371` | **DoD propagación**: 04-validators (bloque `verification:`) + checkpoint (`demo_signoff`) + `demo-script-template.md` (nuevo) + test-design-doctrine + skills architect/dev-team/auditor/pm-vitalia+template |
| 5 | `3a9c53f2` | **Wave 2B tessl cleanup** (D-11): refs muertas `tessl__*` → docs canónicos/patrón inline en 8 agents + 9 skills + 7 templates (gates preservados) + QW-15 (Cat 13/16 verdict math) + builder containers |

**DoD ENDURECIDA = el gran entregable de la sesión** (Chris detectó "digo listo y hay burbuja de Next"). Research 6 frentes web-grounded → 6-section model: (1) `/architect` clasifica naturaleza técnica/funcional en `04-validators § verification`; (2) gates técnicos baseline + opt-in por naturaleza (Schemathesis/Hypothesis/mutmut); (3) ★ gate anti-burbuja `base.ts` (pageerror/console/hidratación/`/api/`-4xx5xx/diálogo-Next) + `verify-no-backend-errors.sh`; (4) cobertura reglas-de-negocio (gherkin-matrix MISSING bloquea); (5) ★ demo manual Chris (`demo-script.md` → `demo_signoff` APPROVED/REJECTED → `/pm` Fase F REFUSE); (6) modificación `regression_guard`. SSoT `.claude/rules/definition-of-done-live-verify.md`. MEMORY `dod-live-verify` actualizado. 3 decisiones ratificadas Chris (demo toda story user-reachable · técnica avanzada opt-in · base.ts implementado).

**Pendiente (próximos chunks):**
- **Wave 3** — staleness masiva clases A+F: process docs (`checkpoint-protocol.md` resume protocol a `{brand}/docs/...`, `contributing.md`, `git-workflow-multibrand.md`, `cicd-multibrand-runbook.md`, `parallel-sessions-protocol.md`, `pm-redesign-2026-05.md` banner SUPERSEDED) + ADRs (ADR-001 addendum monorepo, ADR-005/007/008/012/013 status+bitácoras, 00-overview topology, audit docs HISTORICAL banners D-8) + skills domain-expert path remapping + story templates cap_target/state vocab.
- **D-2** retirar `git-manager` (deprecar → `commit-push`). **D-3** deprecar `ux-disruptivo`+`ux-flow-architect`+`02-design-ui-template` (stub → `/po-ux`).
- **Bug nuevo**: `auto-chain-detect.sh` false-positive (saltó "auto-chain /pm-vitalia+/dev-team" cuando Chris solo dijo "avanzá, ratificado" — el hook misfira; ver catálogo § hooks, fallback sed lossy sin jq).
- **base.ts rollout**: hoy es opt-in (specs nuevos importan de `base.ts`). Migrar specs autenticados existentes (compose `mergeTests(base, auth)`) cuando cierre la story lisa-doctores en vuelo (NO tocar mid-flight). El legacy `auth.fixture.ts::collectConsoleErrors` ignora Hydration/500/404 — reemplazar por base.ts al migrar.
- Wave 2 quick-wins NO aplicados aún: QW-14 version field (parte de D-2 git-manager retiro).

### Estado: 5 commits aplicados. DoD endurecida cementada punta a punta. Story en vuelo `vitalia-fase2-lisa-doctores` (developing) NO tocada en toda la sesión.

---

## Sesión 2026-06-01 (continuación 2) — Wave 3 + D-2/D-3 + bugs aplicados

> Motor: workflow JS `harness-wave3-retire-bugs` (run `wf_dceae010-5be`, 31 editores sonnet verify-first + 1 síntesis opus, lotes DISJUNTOS, sin commit). Catalog+propose → diff → ratify Chris → commit Haiku por pathspec (`SCOPE_GATE_SKIP=1`). Verificación independiente del orchestrator antes de presentar (frontmatter línea-1, bash -n + 3 casos funcionales del hook, make -n, **lift offer/analytics confirmado real en `core/luana-core-*`**).

**Commits (todos en `wip/vitalia`, pushed, origin 0/0):**

| # | SHA | Qué |
|---|---|---|
| 1 | `96aa9559` | **Wave 3 docs** (23 files): 6 process docs (paths multibrand `{brand}/docs/product/stories/` + triple-branch hub-first ADR-009 + GA deferred + sin `git pull`) · ADR-001 PROPOSED→ACCEPTED+addendum monorepo · ADR-005/007/008/012/013 status+bitácoras · 00-overview topology real (26 luana-core-* + @luana) · 6 audit docs banners HISTORICAL/SUPERSEDED/ARCHIVED (D-8) · story templates `state`/`cap_target`/`cap_change_type` · 02-design-ui DEPRECATED |
| 2 | `ab647839` | **Wave 3 skills + D-2/D-3** (10 files): 7 domain-expert skills remapeadas a paths multibrand+engine · **D-2** git-manager RETIRADO (stub→`/commit-push`, `disable-model-invocation`+`user-invocable:false`, `version` removido) · **D-3** ux-disruptivo + ux-flow-architect DEPRECADOS (stub→`/po-ux`) · copilot-expert seed KB corregido al pack real |
| 3 | `1a0dc598` | **Bugs** (2 files): auto-chain-detect.sh (intent-gate: verbo imperativo o ≥2 slash-commands + **cláusula anti-stale** "aplica solo al turno actual" + warning jq ausente) · Makefile install-hooks worktree-safe (`git rev-parse --git-path hooks` + instala pre-push) |

**Catalog overestimates confirmados contra FS** (lo que NO era real — Chris pidió capturarlo):
- `parallel-sessions-protocol`: mecanismos NO estaban "todos pending" — A,B,D,E,F,H,I,J,L,M,N implementados; solo G+K pendientes.
- `pm-redesign`: solo 1 `/architect`=Sonnet era incorrecto (los otros describen al builder).
- `copilot-expert`: `references/copilot-*.md` SÍ existen; `luana-dev-luana_postgres_dev-1` es correcto.
- `metrics-expert`: `visionarias_redis` ya no estaba. `ADR-001`: links ya marcados `(pending)`.
- **Lift offer/analytics SÍ ocurrió**: catálogos `*_catalog.py` en `core/luana-core-offer-studio/`, `metric_catalog.py`/`extraction_contract.py` en `core/luana-core-analytics-engine/` (ya NO en brand backend) → paths de offer/metrics-expert correctos.

**Follow-ups abiertos (NO aplicados — necesitan criterio Chris):**
- `offer-type-preset-expert` cita `test_offer_type_preset_catalog_completeness.py` (no existe; el real cargado es `core/luana-core-offer-studio/tests/test_catalogs_dag_smoke.py`). Staleness pre-existente preservada por el agente. El "187 arch tests" sugiere que ese test quizá nunca se lifteó. Decidir: apuntar a dag_smoke o nombre real.
- ADR-013 quedó coherente pero el pointer MEMORY `luana-empleados-ia-vision` aún dice "NO ADR/spec aún" — actualizar (archivo del orchestrator).

**Pendiente (próximos chunks):**
- **base.ts rollout** a specs autenticados existentes (`mergeTests(base, auth)` + reemplazar `auth.fixture.ts::collectConsoleErrors`) — SOLO cuando cierre la story `vitalia-fase2-lisa-doctores` (NO tocar mid-flight).
- **Wave 4 resto** — ADR-002/003/004/010/011 (minor: addenda, ports cockpit, M14, story-tracking) + PARADIGM.md §7 + decisiones D-1/D-4/D-5/D-7/D-9 (varias ya ratificadas/deferred).
- **Wave 5 CC-2026** (oportunidades, no defectos): `when_to_use` (reducir listing budget), `context: fork`, `isolation: worktree` (builders write-capable), `background: true` (gate-runner/grep-bot), `memory: project`, plugin packaging.
- **Deliverable final**: diseñar el PROCESO de gestión del ciclo de vida de harnesses (solo-operador, report+fix on-the-fly ordenado).
- Refinar historia B (`empleados-ia-auto-extension`).

### Estado: 8 commits aplicados en total esta línea de trabajo (5 previos + 3 esta sesión). Wave 3 + D-2/D-3 + 2 bugs CERRADOS. Story en vuelo `vitalia-fase2-lisa-doctores` (developing) NO tocada.
