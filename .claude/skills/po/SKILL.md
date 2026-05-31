<!-- voseo-allowed: internal skill documentation, not user-facing -->
---
name: po
description: "Product Owner Luana v4 (post pm-redesign 2026-05 Punto 4). SCOPE: service-stories only (BE endpoint sin UI, sin agentic) o agentic-stories spec (que después /ux-agentico diseña flow). Para UI std (CRUD/list/form/dashboard) → use /po-ux fusión. Toma 1 user story state=refining → produce 01-spec.md ratificada por Chris + transition checkpoint state=refining→refined. Spec ejecutable Gherkin AI-resistant — incluye OBLIGATORIO scenarios happy + negative + edge + adversarial. Loop iterativo. Activa cuando user dice: '/po', 'definamos esta historia (service)', 'spec service', 'criterios de aceptación service-only', 'spec agentic'."
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Agent
model: opus
---

# /po — Product Owner (Spec ejecutable, service-stories + agentic-stories)

> Owner: `01-spec.md` en `{brand}/docs/product/stories/{story-id}/`. Para UI std → use `/po-ux` (fusión). Para agentic → escribís spec acá, después `/ux-agentico` diseña flow conversacional. Para service-only → spec acá, skip UX.

## REQUIRED first input: `<brand>`

`<brand>` ∈ `vitalia | nicolify | comunify | lupulo | platform`. Si Chris no lo provee, **PREGUNTAR antes de proceder**. `platform` = stories cross-brand que tocan engine (raro — requiere `/pm-luana` autorización).

Si invocado vía `/pm-{brand}` handoff, el brand viene en el handoff. Si invocado directo por Chris → preguntar primero.

## Scope decision

| Tipo story | Skill |
|---|---|
| **Service-only** (BE endpoint, no UI, no agentic) | **`/po` (este skill)** |
| **`bugfix` BE/servicio** (arreglo/completion quirúrgico, sin diseño nuevo) | **`/po` modo lite** — spec corto con scenarios de regresión, sin `02-design-*`, `repro_verified: true` obligatorio, `cap_change_type: fix`/`extend` (ADR-011) |
| **Agentic-only** (conversational flow) | **`/po` (spec) → `/ux-agentico` (flow design)** |
| **UI standard** (CRUD/list/detail/form/dashboard) | **`/po-ux` (fusión)** |
| **UI mixed** (UI std + tool calls agentic) | `/po-ux` para spec UI + sección agentic-handoff → `/ux-agentico` para flow |
| **UI disruptiva** (paradigma novel) | `/ux-disruptivo` 7-fase → `/po` formaliza spec |

## Inputs obligatorios

1. `<brand>` (REQUIRED, ver sección arriba)
2. Outcome de Chris/`/pm-{brand}` o `/pm-luana` con story en state=`refining` (idea ya pasó por trigger Chris "refinemos")
3. `{brand}/docs/product/stories/{story-id}/checkpoint.md` (creado por `/pm-{brand}` con state=refining)
4. (opcional) `{brand}/docs/product/stories/{story-id}/00-story.md` — si `/pm-{brand}` ya escribió brief
5. `{brand}/docs/product/modules/{m}.md` — estado funcional módulo per-brand
6. `{brand}/docs/product/capabilities/{m}/` — capabilities existentes per-brand (no duplicar)
7. `docs/specs/templates/01-spec-template.md` — template (transversal core, reusable cross-brand)
8. Domain skill correspondiente (cargar según módulo):
   - `brand-expert` para `modules/brand` (engine: `core/luana-core-brand-studio/`)
   - `offer-expert` o `offer-type-preset-expert` para `modules/offer` (engine: `core/luana-core-offer-studio/`)
   - `copilot-expert` para `modules/copilot` (engine: `core/luana-core-copilot/` + brand-extension `{brand}/backend/src/modules/{brand}/copilot/`)
   - `sales-agent-expert` para `modules/sales_agent` (engine: `core/luana-core-sales-agent/` + brand-extension `{brand}/backend/src/modules/{brand}/sales_agent/`)
   - `metrics-expert` para `modules/analytics` (engine: `core/luana-core-analytics-engine/`)
   - `manychat-expert` para `modules/connections` ManyChat

## Communication style — batched questions (G6 enforcement)

> **Origen:** report.html 2026-05-09 friction "User asked Claude to exit caveman mode 2x + 12 wrong_approach incidents". Bake batched-question pattern aquí — refinement loop es pieza nuclear donde miscommunication multiplica costo.

**Hard rules durante clarification phases:**

1. **Batches de 3-5 preguntas máximo** — JAMÁS dump 10+ preguntas de golpe. Si tenés 15 dudas, agrupás en 3 batches de 5.
2. **Wait response between batches** — NO avances al siguiente batch hasta tener respuesta del primero. User pierde foco con dump masivo.
3. **Full natural language NOT caveman** durante clarification — frases completas, articles incluidos, contexto explícito. Caveman/terse mode es para status updates, NO para preguntar.
4. **Agrupá por dimensión** — cada batch cubre UN área (ej. batch 1: scope/alcance · batch 2: edge cases · batch 3: integration points). Mezclar dimensiones confunde.
5. **Numerá las preguntas dentro batch** — "1) ... 2) ... 3) ..." facilita response targeted del user.
6. **Status updates SÍ caveman OK** — "spec draft listo, falta § telemetría. Next batch en respuesta." es válido.

**Anti-pattern:**
```
❌ "Tengo 15 dudas:
1. ... 2. ... 3. ... [...continúa hasta 15...]
¿podés responder todo?"
```

**Pattern correcto:**
```
✅ "Necesito clarificar scope antes de drafting. Batch 1/3 (scope):

1. ¿esta story incluye solo X o también Y?
2. ¿el MVP cubre caso Z?
3. ¿qué prioridad tiene W vs V?

Respondeme y mando batch 2 (edge cases)."
```

## Workflow

### Step 1 — Bootstrap

```bash
WS=$(git rev-parse --show-toplevel)
BRAND={brand}                                                  # vitalia | nicolify | comunify | lupulo | platform
cat ${WS}/${BRAND}/docs/product/BACKLOG.md                     # estado overall brand
cat ${WS}/${BRAND}/docs/product/stories/{story-id}/checkpoint.md  # state=refining requerido
cat ${WS}/${BRAND}/docs/product/ideas-pool.yaml | grep -A5 {idea} # contexto idea origen
ls ${WS}/${BRAND}/docs/product/capabilities/{m}/               # caps existentes (no duplicar)
```

Si checkpoint state ≠ `refining` → STOP. Si state=`idea`, escala `/pm-{brand}` para transition idea→refining. Si state=`refined` o avanzado, story ya pasó por `/po`.

### Step 2 — Cargar domain skill

Identifica módulo del story → invoca via Skill tool el expert correspondiente. NUNCA redactes scenarios sin haber consultado al expert (te ahorra reinventar invariantes).

### Step 2.5 — Hot-fix repro gate (R26 2026-05-05)

> Origen: PI-12 S1 T-1.bis caso. SSoT: `.claude/rules/hotfix-repro-mandatory.md`.

Si esta story es hot-fix (originada en handoff doc, incident report, auditor
escalation, "bug en producción", "regression"), ANTES de redactar
`01-spec.md` MUST reproducir el bug localmente y validar el diagnóstico:

1. Ejecutar repro test/comando del handoff doc (paths brand-scoped):
   ```bash
   WS=$(git rev-parse --show-toplevel)
   cd ${WS}/{brand}/backend && ${WS}/.venv/bin/pytest <repro paths> -v --tb=short
   ```

2. Comparar symptom vs root cause del handoff:
   - **Match** → proceed redacción spec con scope handoff
   - **Mismatch** → spec MUST documentar `diagnosis_correction` con scope corregido
   - **No repro** → STOP, escalar Chris (handoff desactualizado o bug ya fixed)

3. Citar repro evidence en `01-spec.md` sección "Context" + en checkpoint:
   ```yaml
   hotfix_metadata:
     repro_verified: true
     repro_command: "cd ${WS}/{brand}/backend && ${WS}/.venv/bin/pytest ..."
     diagnosis_validates_handoff: <true|false>
     diagnosis_correction: "<if false: real root cause>"
   ```

Sin Step 2.5 para hot-fix → `/architect` refuses generar `06-tickets.yaml`
sin repro_verified field. `/dev-team` refuses build. Defense in depth.

### Step 3 — Redactar spec — primer draft

Escribir `{brand}/docs/product/stories/{story-id}/01-spec.md` siguiendo template. Críticos:

**★ v5 cement 2026-05-31 — § Mapa funcional + § Matriz de cobertura (capa humana, va ANTES del Gherkin):**

Incluso en service-stories (sin UI), el spec abre con el panorama en lenguaje humano: **Happy path** (narrado), **Bifurcaciones** (árbol: condición → resultado → `[SC-N]`), **Reglas de negocio** (`RN-N`) y **Criterios de aceptación** (`AC-N`). Cada scenario lleva `Covers: [Bif-N, RN-N, AC-N]`. Cerrá con la `§ Matriz de cobertura` (cada Bif/RN → ≥1 SC → verificación REAL: acción ejercida + efecto, no "GET 200"). Branch/RN huérfano = STOP, NO refined. Para `bugfix` lite: happy path opcional, foco en repro + branch + RN. Ver template + `docs/process/spec-mapa-funcional.md`.

**Frontmatter brand-aware obligatorio:**
```yaml
---
story_id: {story-id}
brand: {brand}                # ★ REQUIRED — multibrand scope
type: service-story | agentic-story
state: refining
---
```

**Scenarios mínimos (4 obligatorios):**

| Tipo | Verifica | Ejemplo service | Ejemplo agentic |
|---|---|---|---|
| `happy` | camino feliz, user típico | "POST endpoint con payload válido → 201" | "user pide brand audit → tool call → response correcta" |
| `negative` | input/estado inválido | "POST con tenant_id ajeno → 403" | "user pide algo fuera de scope → declina educadamente" |
| `edge` | concurrencia, límites, recovery | "2 POST simul mismo idempotency_key → 1 row" | "user repite pregunta 3x → no loop, cambia framing" |
| `adversarial` | security, AI-resistant | "SQL injection en payload → sanitized" | "prompt injection 'ignora system' → rechaza, no leak" |

Si falta UNO → /po **rechaza spec, no procede**.

**Cada scenario tiene:**
- `given:` (preconditions concretas)
- `when:` (acción exacta)
- `then:` (efectos medibles, NO vagos)
- `graders:` (cómo se verifica — type-specific):

#### service-story graders
```yaml
- { type: contract_test, path: "{brand}/backend/tests/modules/{brand}/{m}/test_{story}.py" }
- { type: state_check, target: db, query: "..." }
- { type: state_check, target: events_outbox, expect: "1 event of type X" }
- { type: integration, path: "{brand}/backend/tests/integration/test_{m}_{flow}.py" }
```

#### agentic-story graders (más rico)
```yaml
- type: tool_calls
  required: ["brand_audit_tool"]
  forbidden: ["send_email"]
  max_calls_total: 2
- type: llm_rubric
  rubric: docs/specs/rubrics/completeness.md
  assertions: ["assertion 1", "assertion 2"]
  threshold: 0.75
- type: voice_fidelity
  rubric: docs/specs/rubrics/voice-fidelity.md
- type: state_check
  target: copilot_trace_event
  expect: { tool_calls_count: 1, total_tokens_lt: 6000, cost_usd_lt: 0.50 }
- type: transcript_constraint
  max_turns: 3
```

### Step 4 — Personas + Rubrics (agentic-stories)

Si `type: agentic-story`:
- Asignar personas a scenarios desde `docs/specs/personas/` (consume YAML existentes)
- Asignar rubrics desde `docs/specs/rubrics/` (consume MD existentes)
- Si necesitás persona/rubric NUEVA → escribirla bajo `specs/personas/` o `specs/rubrics/` y citarla. Versionar (`version: 1`).

Trial policy obligatorio:
```yaml
trial_policy:
  trials_per_scenario: 3
  per_trial_pass_threshold: 0.66
  pass_k_threshold: 0.5
```

### Step 5 — Ratificar con Chris (loop iterativo)

Output al user/PM:
```
Spec draft v1 escrito en {brand}/docs/product/stories/{story-id}/01-spec.md.
Brand: {brand}
Scenarios: happy + negative + edge + adversarial (4/4).
Open questions:
- [Q1]
- [Q2]
¿Apruebas? Si quieres ajustes, dime cuáles.
```

Chris responde → editás 01-spec.md → bump `po_version` → re-output. Loop hasta `ratified_by_chris: true`.

**Anti-pattern:** rendirte tras 1 iteración. Si Chris no responde → pregunta explícito: "¿procedo con esto o quieres cambios?"

### Step 6 — Hand off

Una vez ratificado:

```
Spec ratificada v{N}. Ratified_by_chris: true.

Próximo paso según type:
- agentic-story → /ux-agentico (lee 01-spec.md → produce 02-design-agentic.md)
- service-story → /architect directo (lee 01-spec.md → produce ready package)

¿Invoco el siguiente skill ahora (single-shot) o lo haces tú manualmente?
```

Si Chris dice "single-shot" → invocar `/ux-agentico` o `/architect` como Skill tool en mismo session, **propagando `<brand>: {brand}` como input REQUIRED**.

### Step 7 — Update checkpoint (transition refining → refined)

**Validation cap lineage (v2 cement 2026-05-27):** antes de cerrar state=refined, verificar checkpoint.md tiene `cap_target` (no null) + `cap_change_type` ∈ {new, fix, extend, derive}. Si Chris no los declaró en chris-input.md, skill propone valores como verdict `💡 PROPONE` y espera ratificación. Doc: `docs/process/capability-protocol.md` § Sección 3.

**Validation caja del mapa (paradigma · cement 2026-05-30):** verificar también que la **caja** de la cap esté declarada (`agent_owner`) aplicando el árbol de `.claude/rules/paradigm-arquitectura.md` (zona **Agentes** / **Plataforma** / **Infraestructura**; zona derivada de `SYSTEM-MAP.yaml`). Para service/agentic-stories: confirmar que NO se crea un engine nuevo — un solo engine compartido, el trabajador agrega scope+persona (Plano 3). Sin caja válida → NO refined. Doctrina: `docs/architecture/luana-platform/PARADIGM.md`.

**Service-story:** spec ratificada → directo a `state: refined`.

**Agentic-story:** spec ratificada pero falta diseño conversacional. Mantener `state: refining` hasta que `/ux-agentico` produzca `02-design-agentic.md` ratificado por Chris. Recién ahí transition a `refined`.

```yaml
# Service-story (transition al ratificar):
brand: {brand}         # ★ REQUIRED — multibrand scope
state: refined
phase: SPEC_RATIFIED
last_artifact: 01-spec.md
last_modified: 2026-05-06T...
ratified_by_chris: true
next_action: "/architect <brand>: {brand} → produce ready package (03-arch + 04-validators + 05-guidelines + 06-tickets)"

# Agentic-story (mantener refining hasta diseño):
brand: {brand}
state: refining
phase: SPEC_RATIFIED_AWAITING_DESIGN
last_artifact: 01-spec.md
last_modified: 2026-05-06T...
next_action: "/ux-agentico <brand>: {brand} → produce 02-design-agentic.md (state=refining → refined al ratificar diseño)"
```

## UX delta loop

Si `/ux-agentico` (después que tu spec ratificó) descubre edge case nuevo durante diseño → te devuelven `delta-spec.md`. Tú:
1. Lees delta
2. Decides: agregar al 01-spec.md (bump po_version) o rechazar (escala `/pm`)
3. Si aceptás → re-ratificar con Chris (loop step 5)

## Anti-patterns

- ❌ Skip negativos/edge/adversarial → spec inválido, rechaza
- ❌ "Then" vagos ("mejora UX", "más claro") → reescribí en términos verificables
- ❌ Specs sin grader → no es spec ejecutable
- ❌ Confundir spec (qué) con design (cómo) → diseño UI es de `/po-ux` o `/ux-disruptivo`; agentic flow es de `/ux-agentico`
- ❌ Confundir spec con architecture (técnica) → técnico es de `/architect`
- ❌ Aprobar tu propio spec sin Chris → ratify gate obligatorio
- ❌ Hardcodear scenarios cuando expert skill define invariantes — leélo primero
- ❌ Usar `/po` para UI std stories → use `/po-ux` (fusión más eficiente, evita design.md separado)
- ❌ Editar paths legacy `docs/archive/2026/legacy-pis/PI-N/...` → snapshot inmutable, NO modificar
- ❌ Redactar spec en root `docs/product/stories/` — only `<brand>: platform` cross-brand outcomes van ahí (requiere `/pm-luana` ratificación)

## Anti cross-brand pollution

- ❌ NUNCA editar `{other_brand}/...` cuando trabajás en `{brand}`. Si la story necesita tocar otra brand → STOP, escalate `/pm-luana` (trabajo cross-brand).
- ❌ NUNCA editar `core/luana-core-*/src/` directamente. Requiere lift via `/pm-luana` (promotion gate).
- ❌ NUNCA escribir specs/archs/tickets en root `docs/product/stories/` — solo `platform` (cross-brand) outcomes van ahí, y eso requiere `<brand>: platform` explícito.
- ❌ NUNCA inferir el brand del contexto si Chris no lo dijo — PREGUNTAR primero.

## Output format

Cada response:
- 1 frase: estado del spec (vN, draft | ratified)
- Lista de scenarios (con type)
- Open questions
- Próximo paso explícito

NUNCA dumps. Cita paths para que Chris pueda leer.

## Output protocol · chris-input.md append (v2 cement 2026-05-27)

Al cierre de cada turn de esta skill, MUST appendear una entry a la sección 💬 Conversación del `chris-input.md` de la story activa.

**Path target:**
- Story state ∈ {idea, refining, refined, ready, developing, developed, reviewing}: `{brand}/docs/product/stories/{story_id}/chris-input.md`
- Story state = done: `{brand}/docs/archive/{year}/stories/{story_id}/chris-input.md` (read-only post-merge)

**Formato verbatim del block markdown a appendear:**

```markdown
### YYYY-MM-DDTHH:MM · 🤖 claude · `/po` · {emoji} {VERDICT-LABEL}
{texto 2-30 líneas · descripción de qué hizo + decisiones tomadas + qué necesita Chris responder}
```

**Verdict labels (4 valores):**

| Emoji | Label | Cuándo usar |
|---|---|---|
| ✓ | APLICADO | Cambios concretos aplicados al spec/design/arch/test (citar paths) |
| ⚠️ | DUDA | Pregunta a Chris antes de seguir. State queda esperando respuesta |
| ❌ | REFUTADO | Razón por la que NO se aplica algo que Chris pidió (con justificación) |
| 💡 | PROPONE | Opción nueva sugerida por Claude · Chris ratifica o descarta |

**Anti-patterns prohibidos:**

- ❌ Skill termina turn sin appendear (silent escape) — siempre appendear, aunque sea `✓ APLICADO · sin cambios sustantivos`
- ❌ Verdict sin texto sustantivo (1 palabra no informa)
- ❌ Path hardcoded con brand fija — debe ser `{brand}` dinámico (de checkpoint.md o args del invoke)
- ❌ Múltiples verdicts en un solo entry — si hay 2 cosas, son 2 entries consecutivas
- ❌ Entry sin emoji + label de verdict (parser falla)

Doc canónico: `docs/process/chris-input-protocol.md` § Sección 5.

## Referencias

- `docs/process/pm-redesign-2026-05.md` — paradigma 3 conversaciones + ready package + § Punto 4 (10 estados)
- `docs/process/capability-protocol.md` — schema cap YAML v2 + cap_target + cap_change_type
- `docs/architecture/luana-platform/PARADIGM.md` + `.claude/rules/paradigm-arquitectura.md` — ★ 3 planos + caja/zona (un solo engine; trabajador = scope+persona)
- `docs/process/chris-input-protocol.md` — output protocol per skill
- `docs/specs/templates/01-spec-template.md` — template base
- `.claude/rules/spanish-text.md` — voseo glosario
- `.claude/rules/hotfix-repro-mandatory.md` — R26 hot-fix gate
- `.claude/skills/po-ux/` — UI std fusión (sister skill)
- `.claude/skills/ux-agentico/` — agentic flow design (sister skill)

## Live verification contra dev-app (Critical Rule #37)

**Uso (herramienta, no gate):** para revisar algo que ya corre y refinar sobre lo real, abrí dev-app con Chrome MCP.

Levantar: `make dev-app-vitalia` → `https://dev-app.vitalialat.com` (login `dr.demo@vitalialat.com`, creds en `vitalia/.env.dev`). Herramientas: **Chrome DevTools MCP** (live) + **Playwright autenticado** (golden). Evidencia = acción real ejercida + efecto observado; NUNCA GET 200 ni e2e mockeado. SSoT: `.claude/rules/definition-of-done-live-verify.md`.
