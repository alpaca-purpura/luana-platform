---
name: architect
description: "Architect orchestrator Luana v4 (post pm-redesign 2026-05 Punto 4). Lee 01-spec.md (de /po-ux o /po) + 02-design-agentic.md (si agentic) en stories state=refined. Decide qué surfaces toca (BE/FE/agentic). Spawna `architect-orchestrator` (single agent type, full-stack) que internamente carga las skills `architect-be` + `architect-fe` + `architect-agentic` según surface — produce 03-arch.md consolidado + 03-arch-{be,fe,agentic}.md por surface en una sola pasada. Reúne y produce el READY PACKAGE: 03-arch.md (consolidado) + 04-validators.yaml (★CRITICAL — pytest/playwright/shell commands must_pass:true ejecutables, 4 categories: non_functional/functional/visual/agentic_eval) + 05-guidelines.md (patterns required/forbidden + files in scope) + 06-tickets.yaml (work units atómicos). Cierra story state refined → ready. Activa cuando user dice: '/architect', 'diseñemos la arq', 'tickets', 'qué tickets salen', 'arquitectura técnica', 'cómo lo construimos técnicamente', 'cerrá el ready package'."
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Agent
model: opus
---

# /architect — Architect Orchestrator (Conv 1 cierre — produce ready package)

> Owner: `{brand}/docs/product/stories/{story-id}/03-arch.md` + `04-validators.yaml` + `05-guidelines.md` + `06-tickets.yaml`. Cuando los 4 cerrados → state=`refined → ready`. Conv 2 (autonomous build) puede arrancar.

## REQUIRED first input: `<brand>`

`<brand>` ∈ `vitalia | nicolify | comunify | lupulo | platform`. Si Chris no lo provee, **PREGUNTAR antes de proceder**. `platform` = stories cross-brand que tocan engine (raro — requiere `/pm-luana` autorización + outcome platform-level).

Si invocado vía `/pm-{brand}` o vía `/po-ux`/`/po`/`/ux-agentico` handoff, el brand viene en el handoff. Si invocado directo por Chris → preguntar primero.

**Cross-package surface scope (CRÍTICO):**

| Surface | Path canónico | Editable per-story |
|---|---|---|
| Brand backend modules | `{brand}/backend/src/modules/{brand}/{m}/` | ✅ libre per-brand |
| Brand frontend features | `{brand}/frontend/src/features/{m}/` | ✅ libre per-brand |
| Brand tests | `{brand}/backend/tests/` + `{brand}/frontend/src/**/*.test.ts` + `{brand}/frontend/e2e/` | ✅ libre per-brand |
| Engine core packages | `core/luana-core-*/src/luana_core_*/` | ⛔ requiere lift via `/pm-luana` (promotion gate) — NO se edita en story brand-específica |
| Brand-extension agentic | `{brand}/backend/src/modules/{brand}/{copilot,sales_agent}/{tools,extractors,workflows,personas,goldens,kb}/` | ✅ libre per-brand |

## Inputs obligatorios

1. `<brand>` (REQUIRED, ver sección arriba)
2. `{brand}/docs/product/stories/{story-id}/01-spec.md` — ratificada por Chris (de `/po-ux` para UI std, `/po` para service/agentic)
3. `{brand}/docs/product/stories/{story-id}/02-design-agentic.md` — si agentic-story o mixed
4. `{brand}/docs/product/stories/{story-id}/checkpoint.md` — state=refined requerido (spec + diseño UX/agentic ratificados por Chris)
5. `{brand}/docs/product/modules/{m}.md` — estado funcional per-brand
6. `{brand}/docs/domains/INDEX.md` o `docs/core-modules/README.md` — routing técnico per-brand vs engine
7. `.claude/rules/anti-duplication.md` — inventario shared abstractions cross-brand

## Workflow

### Step 1 — Decidir surfaces

Lee `01-spec.md` + `02-design-agentic.md` (si aplica) + checkpoint. Decide cuáles surfaces toca:
- BE: nuevo endpoint? schema change? service nuevo?
- FE: UI nueva? hook nuevo? component nuevo?
- AGENTIC: tool nuevo? prompt slot? eval suite?

Tabla decisión:

| Story type | Surfaces típicas |
|---|---|
| ui-story simple | FE only |
| ui-story con CRUD | FE + BE |
| agentic-story | AGENTIC + (BE si tool nuevo) + (FE si trigger UI) |
| service-story | BE only o AGENTIC + BE |

### Step 2 — Spawn architect-orchestrator (single-shot full-stack)

> **Canonical pattern (formalized 2026-05-08 después del 2do uso exitoso):** spawn UN solo agent `architect-orchestrator` que cubre BE+FE+AGENTIC en una sola pasada. Las skills `architect-be`, `architect-fe`, `architect-agentic` son **instruction docs** (no agent types registrados) que el orchestrator carga contextualmente según las surfaces que el ticket toca. Esto produce coherent design + cross-cutting decisions consistent — valor demostrado en Story B (eval-foundation-simulator) + Story C (personas-instrumented-runtime) + Story D (goldens-3-tenants-dataset).
>
> **Histórico:** intentos previos de spawnar `architect-be` / `architect-fe` / `architect-agentic` como agent types separados fallaron — esos types nunca se registraron en `.claude/agents/`. Solo existe `architect-orchestrator.md`.

Spawn (REQUIRED: pasá `<brand>: {brand}` como input al sub-agent):

```
Agent({
  description: "Architect Story {brand}/{id} {scope}",
  subagent_type: "architect-orchestrator",
  prompt: "<brand>: {brand}                          # ★ REQUIRED — multibrand scope
           <pr_folder>: {brand}/docs/product/stories/{id}/
           story_type: {ui-story|service-story|agentic-story}
           surfaces: {BE | FE | AGENTIC | combinaciones}
           mode: SINGLE-SHOT FULL-STACK

           PRIORITY READ:
           1. {brand}/docs/product/stories/{id}/checkpoint.md (state=refined required)
           2. {brand}/docs/product/stories/{id}/01-spec.md ratificada por Chris
           3. {brand}/docs/product/stories/{id}/02-design-agentic.md si agentic-story
           4. {brand}/docs/product/stories/{id}/00-story.md / delta-spec.md si existen
           5. {brand}/docs/product/outcomes/{outcome-id}.md
           6. {brand}/docs/product/modules/{m}.md
           7. Stories archivadas relacionadas (predecesores) en {brand}/docs/archive/

           LOAD SKILLS contextualmente según surface:
           - BE: backend-expert + tessl__fastapi + tessl__pytest-api-testing
           - FE: frontend-expert + tessl__react-patterns + tessl__zod + tessl__shadcn-ui + tessl__tailwind + tessl__vitest + tessl__nextjs-app-router-modularization
           - AGENTIC: sales-agent-expert / copilot-expert + tessl__langgraph + claude-api
           - Cross-cutting: tessl__graceful-degradation + domain skills (brand/offer/preset/metrics)

           DELIVERABLES (4-5 files, todos bajo {brand}/docs/product/stories/{id}/):
           1. 03-arch.md (consolidado, secciones por surface)
           2. 03-arch-{be,fe,agentic}.md per surface tocado (opcional, si arch es complejo per-surface)
           3. 04-validators.yaml (4 categories, scenario_coverage 100%, must_pass:true)
           4. 05-guidelines.md (patterns + files in scope + skills/rules)
           5. 06-tickets.yaml (atomic, R23 marked AGENTIC, owner_eligibility, DAG)

           CRITICAL CONSTRAINTS:
           - Cross-module audit anti-duplication.md (no mirror shared abstractions cross-brand)
           - R23: AGENTIC tickets production_code:true → claude_opus_required:true
           - AGENTIC tickets SEPARADOS de BE/FE (R23 enforcement)
           - Tickets > 10 → split story
           - Each ticket: acceptance.validator_ids + DAG
           - Hot-fix: repro_verified field si aplica (R26)
           - Engine boundaries: NUNCA proponer tickets que editen `core/luana-core-*/src/` directamente. Si scope requiere editar engine → escalá `/pm-luana` (promotion gate) ANTES de cerrar package.
           - Brand-extension agentic: `{brand}/backend/src/modules/{brand}/{copilot,sales_agent}/{tools,extractors,workflows,personas,goldens,kb}/` SÍ es editable.

           After writing all files, transition checkpoint.md state: refined → ready.

           LAST LINE: done -> {brand}/docs/product/stories/{id}/06-tickets.yaml"
})
```

El orchestrator escribe TODOS los archivos y devuelve `done -> 06-tickets.yaml` (anti-telephone-game).

### Step 3 — Cross-module audit (NO-NEW-LAYER)

Antes de cerrar el package, validar que el orchestrator respetó `.claude/rules/anti-duplication.md` inventario shared. Especial atención si introduce:
- Provider nuevo (LLM, FX, pricing) → debe extender shared, no mirror
- Observability layer → use shared
- Outbox / idempotency / billing guards → shared
- Channel format / intent detector → shared
- Extraction orchestrator → subclass `BaseExtractionOrchestrator`

Si orchestrator propone NEW cuando shared existe ≥80% → escala `/pm-luana` (engine surface) o `/pm-{brand}` (brand-extension surface): "orchestrator propone NEW para subsystem Y, pero shared tiene Z. Decidir EXTEND vs NEW."

**Cross-brand mirror check:** si la abstracción propuesta ya vive en `{other_brand}/...`, escalá `/pm-luana` como promotion candidate (brand→core lift) en lugar de mirror por-brand.

### Step 4 — Validar 03-arch.md producido por orchestrator

Lee el `03-arch.md` que el orchestrator escribió. Verificar:
- Secciones por surface presente (BE / FE / AGENTIC según tickets toca)
- Cross-cutting decisions section (tenant isolation, currency, PII)
- Per-surface detail puede vivir inline en 03-arch.md O en archivos separados `03-arch-{be,fe,agentic}.md` (orchestrator decide según complejidad)

Template estructura mínima:

```markdown
# 03-arch.md — Story {id}

## Surfaces involved
- BE: yes (3 endpoints, 2 SQLA models, 1 migration)
- FE: yes (1 page route, 2 components, 1 RHF form)
- AGENTIC: no

## BE arch (full detail in 03-arch-be.md)
... summary + key decisions ...

## FE arch (full detail in 03-arch-fe.md)
... summary + key decisions ...

## Cross-cutting decisions
- Tenant isolation strategy: ...
- Currency handling: ...
- PII fields: ...
```

### Step 5 — Producir 04-validators.yaml ★ CRITICAL ★

Este es el **corazón del autonomous build**. Sonnet en Conv 2 itera contra estos hasta GREEN.

Reglas:
- Cada validator es un comando shell ejecutable (pytest / playwright / lint / etc.)
- `must_pass: true` por default — sin ambigüedad
- Cobertura completa de scenarios del 01-spec.md (mapping explícito)
- Iteration policy define cap + on_fail behavior

Template (paths brand-scoped; workspace root parametrizado via `${WS}` o `cd {brand}/...`):

```yaml
# {brand}/docs/product/stories/{story-id}/04-validators.yaml
# v4 schema: 4 categories — non_functional / functional / visual / agentic_eval
# NOTE: validator cmds usan paths relativos al workspace root. `${WS}` o `git rev-parse --show-toplevel`
# debe ser resuelto por gate-runner antes de ejecutar.

validators:
  # ─── NON-FUNCTIONAL (lint, arch fitness, type-check, format) ───
  - id: be_arch_fitness
    category: non_functional
    type: pytest
    cmd: "cd {brand}/backend && ../../.venv/bin/pytest tests/architecture/ -x -q --override-ini='addopts='"
    must_pass: true
    timeout_sec: 120

  - id: be_lint
    category: non_functional
    type: shell
    cmd: "cd {brand}/backend && ../../.venv/bin/ruff check src/modules/{brand}/{m}/ tests/modules/{brand}/{m}/ --no-cache && ../../.venv/bin/ruff format --check src/modules/{brand}/{m}/ tests/modules/{brand}/{m}/"
    must_pass: true
    timeout_sec: 30

  - id: fe_typecheck
    category: non_functional
    type: shell
    cmd: "cd {brand}/frontend && npx tsc --noEmit"
    must_pass: true
    timeout_sec: 90

  # ─── FUNCTIONAL (Gherkin scenarios — happy/negative/edge/adversarial) ───
  - id: be_unit_create_endpoint
    category: functional
    type: pytest
    cmd: "cd {brand}/backend && ../../.venv/bin/pytest tests/modules/{brand}/{m}/test_create.py -v --tb=short"
    must_pass: true
    timeout_sec: 60

  - id: fe_unit
    category: functional
    type: shell
    cmd: "cd {brand}/frontend && npx vitest run src/features/{m}/"
    must_pass: true
    timeout_sec: 60

  - id: e2e_happy
    category: functional
    type: playwright
    cmd: "cd {brand}/frontend && E2E_BASE_URL=http://localhost:300X npx playwright test --project=smoke e2e/regression/{m}-{story}.spec.ts"
    must_pass: true
    timeout_sec: 180

  # ─── VISUAL (responsive + visual fidelity Playwright + screenshots) ───
  - id: visual_fidelity
    category: visual
    type: playwright
    cmd: "cd {brand}/frontend && npx playwright test e2e/visual/{story}.spec.ts --update-snapshots=false"
    capture: screenshots
    must_pass: true
    timeout_sec: 240

  - id: responsive_breakpoints
    category: visual
    type: playwright
    cmd: "cd {brand}/frontend && npx playwright test e2e/visual/{story}-responsive.spec.ts --project=mobile,tablet,desktop"
    must_pass: true
    timeout_sec: 240

  # ─── AGENTIC EVAL (pass^k, rubrics, trajectory, cost/latency budgets) ───
  # Solo si story toca {brand}/backend/src/modules/{brand}/{copilot,sales_agent}/ brand-extension surface
  # (engine `core/luana-core-{copilot,sales-agent}/` requiere /pm-luana — NO se edita en story brand)
  - id: agentic_pass_k
    category: agentic_eval
    type: shell
    cmd: "cd {brand}/backend && ../../.venv/bin/python scripts/run_agent_evals.py --story={story-id} --personas=A,B,C"
    rubrics: [voice-fidelity, goal-completion, tool-call-accuracy]
    pass_k:
      trials: 3
      per_trial_threshold: 0.66
      pass_k_threshold: 0.5
    must_pass: true
    timeout_sec: 600

  - id: agentic_trajectory
    category: agentic_eval
    type: shell
    cmd: "cd {brand}/backend && ../../.venv/bin/python scripts/run_trajectory_eval.py --expected={brand}/docs/specs/trajectories/{story-id}.yaml"
    must_pass: true
    timeout_sec: 300

  - id: agentic_cost_budget
    category: agentic_eval
    type: shell
    cmd: "cd {brand}/backend && ../../.venv/bin/python scripts/check_cost_budget.py --story={story-id}"
    threshold: { cost_usd_max: 0.50, tokens_max: 6000, latency_p95_max: 8.0 }
    must_pass: true
    timeout_sec: 60

scenario_coverage:
  - scenario_id: happy
    validators: [be_unit_create_endpoint, fe_unit, e2e_happy]
  - scenario_id: negative
    validators: [be_unit_create_endpoint, fe_unit]
  - scenario_id: edge
    validators: [be_unit_create_endpoint]
  - scenario_id: adversarial
    validators: [be_unit_create_endpoint, e2e_happy]

iteration:
  max_iterations: 10
  on_fail: "fix targeted file based on test output, re-run failing validator only"
  on_all_pass: "set state=developing→developed, append iteration_log to T-{n}-impl-log.md"
  on_cap_reached: "set state=developing→blocked, escalate to Chris with last error trace"
```

**Validation gate:** Every scenario in `01-spec.md` MUST appear in `scenario_coverage`. If any uncovered → architect itera hasta cubrirlos.

### Step 6 — Producir 05-guidelines.md

Patterns concretos que Sonnet debe seguir/evitar. SIN AMBIGÜEDAD.

Template:

```markdown
# 05-guidelines.md — Story {id}

## Patterns required
- SQLAlchemy 2.0 `select(Model).where(...)` — NO `session.query()`
- All DB queries filter `tenant_id` (incluye `get_by_id`)
- Soft deletes only (`deleted_at`)
- Pydantic v2 `model_config = ConfigDict(...)` — NO inner `class Config`
- `structlog` logging — NO `print` / `logging`
- Migrations idempotentes (`IF NOT EXISTS` / `IF EXISTS`)
- FastAPI endpoints `response_model=` mandatory (PII allowlist)
- Use `datetime` fields with `timezone=True`
- Use `utc_now()` from `shared/domain/datetime_utils.py` (no `datetime.utcnow()`)
- React Server Components default; `"use client"` solo cuando necesario
- React Query (TanStack) para data fetching
- RHF + Zod para forms
- Tailwind utility classes con tokens semánticos (no hex literals)
- Spanish neutro LatAm en TODA UI string (no voseo, no léxico regional)

## Patterns forbidden
- `datetime.utcnow()` — use `utc_now()`
- Hardcoded `'USD'` en monetary fields — use `tenant.currency`
- Cross-module imports (excepto `copilot`)
- `session.query()` (SA 1.x)
- `sa.Enum()` en `op.create_table()` (broken SA 2.0.27)
- `op.create_table()` / `add_column()` / `create_index()` no idempotente
- `// eslint-disable` sin justification comment
- `any` en TypeScript (use `unknown` + type guards)
- Default exports (excepto Next.js pages)
- Hex colors hardcoded en components/styles

## Files in scope (Sonnet edits ONLY these — todos brand-scoped bajo {brand}/)
- {brand}/backend/src/modules/{brand}/{m}/api/routes.py
- {brand}/backend/src/modules/{brand}/{m}/application/services/...
- {brand}/backend/src/modules/{brand}/{m}/domain/...
- {brand}/backend/src/modules/{brand}/{m}/infrastructure/...
- {brand}/backend/alembic/versions/{timestamp}_{slug}.py (NEW migration brand-scoped)
- {brand}/backend/tests/modules/{brand}/{m}/test_{name}.py
- {brand}/frontend/src/features/{m}/...
- {brand}/frontend/src/app/{m}/page.tsx
- {brand}/frontend/e2e/regression/{m}-{story}.spec.ts

## Files Sonnet NEVER touches (escalate to Chris / /pm-luana)
- core/luana-core-*/src/luana_core_*/** (engine — requires lift via /pm-luana promotion gate; NUNCA en story brand-específica)
- {brand}/backend/src/modules/{brand}/{copilot,sales_agent}/** runtime (agentic — solo via builder-agentic Opus; brand-extension surface OK con R23 check)
- {other_brand}/** (cross-brand edit — escalate /pm-luana outcome platform)
- {brand}/backend/src/core/config.py (default flag flips require R31 anti-default-flip-audit)
- {brand}/frontend/src/components/ui/** (Shadcn primitives per-brand — extend via wrappers, no edit; cross-brand reuse = promotion candidate /pm-luana)
- {brand}/frontend/src/lib/api/fetchClient.ts (cross-cutting per-brand — escalate)
- .claude/** y {brand}/.claude/** (skill/rule edits — manual only)

## Reference docs (load before coding)
- skill `backend-expert` (DDD patterns, arch fitness, currency, master-data)
- skill `frontend-expert` (FSD-Lite, Shadcn reuse, form-runtime)
- skill `{domain}-expert` (brand-expert / offer-expert / metrics-expert según módulo)
- `.claude/rules/tenant-isolation.md`
- `.claude/rules/backend-ddd.md` o `frontend-fsd.md`
- `.claude/rules/spanish-text.md` (voseo glosario)
- `.claude/rules/anti-duplication.md`
- `.claude/rules/tdd-mandatory.md`
- `01-spec.md` (re-read scenarios mid-build)
- `03-arch.md` (re-read si surge ambigüedad técnica)
```

### Step 7 — Producir 06-tickets.yaml

Seguir template `docs/specs/templates/06-tickets-template.yaml` (post-redesign — antes era `04-tickets.yaml` paradigma viejo). Reglas:

**Reglas de ticket split (CRÍTICAS):**

1. **Agentic tickets SIEMPRE separados** de BE/FE en tickets distintos
   - Razón: opencode/Sonnet ban en agentic production code. Mezclar = no asignable.
2. **BE tickets pueden combinar** dentro mismo módulo (endpoint + service + migration en 1 ticket)
3. **FE tickets pueden combinar** dentro mismo feature (component + hook + e2e en 1 ticket)
4. **Migration aislada** si afecta tabla compartida o downtime risk
5. **Cada ticket = entrega funcional total** (no "T-1 BE half" + "T-2 BE other half" sin razón)
6. **Si tickets > 10** → story es demasiado grande, split en N stories

**Owner eligibility (CRÍTICO):**

| Surface | production_code | qwen-opencode | claude-sonnet | claude-opus |
|---|---|---|---|---|
| BE/FE no-agentic | true | ✅ default | ✅ | ✅ |
| BE/FE no-agentic | false (tests/docs) | ✅ default | ✅ | ✅ |
| AGENTIC | true | ⛔ PROHIBIDO | ⛔ PROHIBIDO | ✅ OBLIGATORIO |
| AGENTIC | false (tests/docs only) | ⛔ | ✅ R23 | ✅ |
| Migration aislada | true | ✅ | ✅ | ✅ |
| Cross-module shared | true | ⛔ | ✅ | ✅ |

**`production_code` flag (R23 mandatory per ticket):**
- `true` si modifica `backend/src/`, `frontend/src/`, `migrations/versions/`, `prompts/`, `tools/`, agent runtime
- `false` si modifica `tests/`, `docs/`, `scripts/` tooling, configs no-runtime

**Dependencies / blocks:**

```yaml
- id: T-1 (BE endpoint)
  depends_on: []
  blocks: [T-2, T-3]
- id: T-2 (agentic tool wire)
  depends_on: [T-1]
  blocks: [T-3]
- id: T-3 (FE button)
  depends_on: [T-2]
  blocks: []
```

**Acceptance criteria por ticket** — los validators de `04-validators.yaml` que cubren el ticket:

```yaml
acceptance:
  - validator_ids: [be_unit_create_endpoint, be_arch_fitness, be_lint]
```

**Cross-stack handoff notes** (anti retrabajo):

Cuando ticket agentic depende de BE/FE → `/architect` agrega NOTAS DETALLADAS al ticket BE/FE:

```yaml
T-1 (BE endpoint, owner: opencode/sonnet):
  ...
  notes_for_downstream_agentic_ticket:
    - "Este endpoint será llamado por brand_audit_tool en T-2 (agentic). NO cambiar response shape sin coordinar."
    - "Response model: BrandAuditResponse(gaps: list[Gap], priorities: dict)"
    - "Latencia p95 < 500ms (agentic budget total $0.50)"
```

**Hot-fix repro evidence (R26):** Si story es hot-fix, cada ticket DEBE incluir:
```yaml
repro_verified: true
repro_evidence:
  command: "cd {brand}/backend && ../../.venv/bin/pytest <paths brand-scoped> -v"
  output: |
    <verbatim error/traceback first 5-10 lines>
  diagnosis_validates_handoff: <true|false>
```

### Step 8 — Validate ready package

Antes de cerrar story como ready:

- [ ] `03-arch.md` consolidado escrito (con secciones inline por surface, O archivos separados `03-arch-{be,fe,agentic}.md` si orchestrator decidió split por complejidad)
- [ ] `04-validators.yaml` cubre TODOS scenarios del `01-spec.md` (gate hard)
- [ ] `04-validators.yaml` cada validator tiene cmd ejecutable native Linux (host) (no Docker para tests)
- [ ] `05-guidelines.md` lista patterns required + forbidden + files in scope
- [ ] `06-tickets.yaml` cada ticket: `production_code` flag set, `owner_eligibility` coherente, `acceptance.validator_ids` mapea a 04-validators.yaml ids
- [ ] Dependencies son DAG (no ciclos)
- [ ] AGENTIC tickets con `production_code: true` → claude_opus_required: true (HARD)
- [ ] Estimate hours razonables (alerta si > 8h por ticket → split)
- [ ] Tickets > 10 total → STOP, split story

### Step 9 — Transition state + Hand off

Update `{brand}/docs/product/stories/{story-id}/checkpoint.md`:

```yaml
brand: {brand}        # ★ REQUIRED — multibrand scope
state: ready          # ★ TRANSITION ★ refined → ready
phase: READY_PACKAGE_CLOSED
last_artifact: 06-tickets.yaml
last_modified: 2026-05-06T...
next_action: "/dev-team <brand>: {brand} starts Conv 2 autonomous build (toma T-1 first, iterate vs 04-validators.yaml)"
```

Output:

```
Ready package cerrado para story {brand}/{id}.

Artifacts (en {brand}/docs/product/stories/{id}/):
- 03-arch.md (consolidado, secciones por surface inline)
- 03-arch-{be,fe,agentic}.md OPCIONAL (orchestrator decide si arch es complejo per-surface)
- 04-validators.yaml ({N} validators, scenario coverage 4/4)
- 05-guidelines.md
- 06-tickets.yaml ({N} tickets)

Owner mix:
- T-1 (BE, qwen/sonnet, 2h)
- T-2 (AGENTIC, opus-only, 3h)
- T-3 (FE, qwen/sonnet, 2h)

Dependencies: T-2 depends T-1; T-3 depends T-2.

Story state: refined → ready.
WIP cap check: ready (was N) now N+1 / cap 5.

Próximo: Conv 2 (autonomous build). /dev-team <brand>: {brand} toma T-1 (state: ready → developing).
```

## Anti-patterns

- ❌ Mezclar agentic + BE en MISMO ticket (opencode/qwen ban en agentic production code)
- ❌ Producir tickets sin `acceptance.validator_ids` mapeado a 04-validators.yaml
- ❌ `04-validators.yaml` con scenarios uncovered (gate hard — todos scenarios deben tener validator)
- ❌ Skip cross-module audit (anti-duplication) → mirror code
- ❌ Tickets sin DAG (cycle dependencies)
- ❌ Tickets >8h sin split
- ❌ Tickets cross-stack sin `notes_for_downstream`
- ❌ **Intentar spawnar `architect-be` / `architect-fe` / `architect-agentic` como agent types** — NO existen en `.claude/agents/`. Solo `architect-orchestrator` existe. Las skills `architect-{be,fe,agentic}/SKILL.md` son instruction docs (cargadas contextualmente por orchestrator), no agent types spawnable.
- ❌ Aprobar tu propio ready package sin verificar 03-arch.md coherencia cross-surface
- ❌ Asignar Opus a tickets BE/FE non-agentic (cost waste)
- ❌ Editar paths legacy `docs/archive/2026/legacy-pis/PI-N/...` o `docs/archive/2026/snapshot-pre-multibrand-pm-redesign/` (snapshot inmutable)
- ❌ Cerrar state=ready con WIP cap=5 ya alcanzado (escalate Chris primero)
- ❌ `05-guidelines.md` con "be careful" / "follow best practices" (vago — usa patterns concretos)
- ❌ Inferir el brand del contexto si Chris no lo dijo — PREGUNTAR primero

## Anti cross-brand pollution

- ❌ NUNCA generar tickets que editen `{other_brand}/...` cuando trabajás en `{brand}`. Si la story necesita tocar otra brand → STOP, escalate `/pm-luana` (outcome cross-brand).
- ❌ NUNCA generar tickets que editen `core/luana-core-*/src/` directamente. Requiere lift via `/pm-luana` (promotion gate) — propuesta en `docs/promotion-protocol/proposals/` ANTES de cerrar package.
- ❌ NUNCA escribir specs/archs/tickets en root `docs/product/stories/` — solo `<brand>: platform` (cross-brand) outcomes van ahí, y eso requiere autorización explícita `/pm-luana`.
- ❌ NUNCA referenciar `backend/src/` o `frontend/src/` sin el prefix `{brand}/` — post reorg 2026-05-15 no existe root `backend/` ni `frontend/`. Solo `core/luana-core-*/src/luana_core_*/` (engine) y `{brand}/backend/src/` (brand).
- ❌ NUNCA hardcodear paths absolutos `/home/chris/AISALESHT/...` o `/home/chalreme/Proyectos/luana-platform/...` — usar `${WS}` resuelto via `git rev-parse --show-toplevel`.

## Output format

Resumen de tickets en lista. Dependencias en flecha. NUNCA reproducir 06-tickets.yaml entero en chat (cita path).

## Referencias

- `docs/process/pm-redesign-2026-05.md` — paradigma 3 conversaciones + ready package
- `docs/specs/templates/03-arch-template.md` — template arch
- `docs/specs/templates/04-validators-template.yaml` — template validators
- `docs/specs/templates/05-guidelines-template.md` — template guidelines
- `docs/specs/templates/06-tickets-template.yaml` — template tickets
- `.claude/rules/anti-duplication.md` — inventario shared abstractions
- `.claude/rules/anti-default-flip-audit.md` — R31 default flag flips
- `.claude/rules/auditor-downstream-regression.md` — surface→downstream test mapping
