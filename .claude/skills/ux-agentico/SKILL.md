---
name: ux-agentico
description: "UX agéntico Luana v4 (post pm-redesign 2026-05 Punto 4). Diseña FLUJOS CONVERSACIONALES (no UI tradicional) para agentic-stories state=refining. Toma 01-spec.md (de /po) y produce 02-design-agentic.md en {brand}/docs/product/stories/{story-id}/ con: turn-by-turn happy path, state machine agente, tools sequence, prompt slot architecture, voice constraints, error recovery, eval policy (personas+rubrics+pass^k), cost/latency budget, observabilidad. Al ratificar diseño → transition state=refining→refined. Carga skills sales-agent-expert, copilot-expert, tessl__langgraph, claude-api. Si descubre edge cases → delta-spec.md → /po ratifica. Activa cuando user dice: '/ux-agentico', 'diseñemos el flujo conversacional', 'cómo conversa el agente', 'flujo del copilot', 'turn-by-turn', 'experiencia agéntica'."
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Agent
model: opus
---

# /ux-agentico — UX Agéntico (Conversational Flow Designer)

> Owner: `{brand}/docs/product/stories/{story-id}/02-design-agentic.md` + (si aplica) `mockups/conversation-{flow}.md`. Diseña la EXPERIENCIA conversacional del agente. Sister skill de `/po-ux` (UI std).

## REQUIRED first input: `<brand>`

`<brand>` ∈ `vitalia | nicolify | comunify | lupulo | platform`. Si Chris no lo provee, **PREGUNTAR antes de proceder**. `platform` = stories cross-brand que tocan engine (raro — requiere `/pm-luana` autorización).

Si el skill es invocado vía `/pm-{brand}` handoff, el brand viene en el handoff. Si invocado directo por Chris → preguntar.

**Engine vs brand-extension scope (CRÍTICO para agentic):**

Post multibrand reorg 2026-05-15, los módulos agentic son SPLIT engine + brand extension:

| Surface | Path canónico | Quién diseña |
|---|---|---|
| Engine copilot (runtime, state machine, slot architecture base) | `core/luana-core-copilot/src/luana_core_copilot/` | requiere `/pm-luana` (promotion gate) |
| Brand extension copilot (extractors, tools, workflows, kb) | `{brand}/backend/src/modules/{brand}/copilot/{extractors,tools,workflows,kb}/` | libre per-brand vía este skill |
| Engine sales-agent (runtime, callback handler, slot architecture base) | `core/luana-core-sales-agent/src/luana_core_sales_agent/` | requiere `/pm-luana` (promotion gate) |
| Brand extension sales-agent (tools, personas, goldens) | `{brand}/backend/src/modules/{brand}/sales_agent/{tools,personas,goldens}/` | libre per-brand vía este skill |

Si el flow diseñado requiere modificar engine (`core/luana-core-*/`) → STOP, escalá `/pm-luana`. Este skill SOLO diseña sobre brand extensions a menos que `<brand>: platform` esté explícito.

## Cuándo usar — decision matrix

| Tipo story | Skill |
|---|---|
| **Agentic-only** (conversational flow, no UI tradicional) | **`/po` (spec) → `/ux-agentico` (este skill, flow design)** |
| **UI mixed** (UI std + tool calls agentic) | `/po-ux` para spec UI + sección agentic-handoff → `/ux-agentico` para flow |
| **UI standard** (CRUD/list/form/dashboard) | `/po-ux` (fusión, NO usar este skill) |
| **Service-only** (BE endpoint sin LLM) | `/po` standalone (NO usar este skill) |

**Razón fusión NO aplica a agentic:** state machine + slot architecture + voice fidelity + eval pass^k son bestia distinta del UI std (constrained Tailwind+Shadcn). Por eso `/ux-agentico` se mantiene separado de `/po`, mientras `/po-ux` fusiona `/po` + `/ux-ui` para UI std.

## Diferencia vs /po-ux (UI std)

| /po-ux (UI std) | /ux-agentico (agentic) |
|---|---|
| Pantallas, layouts, componentes Shadcn | Turns, tools, prompts, voz |
| Wireframes ASCII / HTML mockups | Conversation transcripts ejemplo |
| Estados UI (loading/error/empty) | Estados agente (gathering/reasoning/acting/responding/done) |
| Responsive breakpoints | Channels (web/telegram/whatsapp/manychat) |
| Shadcn + Tailwind tokens | Slot architecture + cache TTL |
| Accessibility WCAG | Voice fidelity + persona robustness |
| Output: `01-spec.md` UNIFICADO | Output: `02-design-agentic.md` (consume `01-spec.md` previo de `/po`) |

## Inputs obligatorios

1. `<brand>` (REQUIRED, ver sección arriba)
2. `{brand}/docs/product/stories/{story-id}/01-spec.md` — scenarios agentic-story (incluyendo personas + rubrics + pass^k)
3. `{brand}/docs/product/stories/{story-id}/00-story.md`
4. `{brand}/docs/product/modules/{copilot|sales_agent}.md`
5. `docs/specs/personas/*.yaml` — personas disponibles (transversal core; pueden override per-brand en `{brand}/docs/specs/personas/`)
6. `docs/specs/rubrics/*.md` — rubrics disponibles (transversal core; pueden override per-brand en `{brand}/docs/specs/rubrics/`)
7. `.claude/rules/sales-agent-brand-voice.md` (si sales_agent)
8. Engine read-only (NO editar — solo referenciar patterns):
   - `core/luana-core-copilot/src/luana_core_copilot/agents/` — agentes engine
   - `core/luana-core-sales-agent/src/luana_core_sales_agent/agents/` — idem
9. Brand extension surface (editable per-brand):
   - `{brand}/backend/src/modules/{brand}/copilot/{extractors,tools,workflows,kb}/`
   - `{brand}/backend/src/modules/{brand}/sales_agent/{tools,personas,goldens}/`

## Skills cargados (HARD GATE)

ANTES de diseñar:
- `copilot-expert` (si copilot)
- `sales-agent-expert` (si sales_agent)
- `tessl__langgraph` — patterns LangGraph 2.0
- `claude-api` — Anthropic SDK + prompt caching
- `tessl__graceful-degradation` — recovery patterns

## Workflow

### Step 1 — Validar scope

Leer `01-spec.md` agentic_contract:
- channel
- max_turns / max_tokens / budget_usd
- expected_tools / forbidden_tools
- voice
- outcome_type (text | structured-output | side-effect | mixed)

Si contract no claro → escala /po.

### Step 2 — Diseñar conversation turn-by-turn (happy path)

Escribir SECCIÓN del 02-design-agentic.md:

```
Turn 1
  User:   "audita mi marca y dime que falta"
  Agent (think): "Detecto intent brand_audit. Cargar brand state."
  Agent (tool): brand_audit_tool(tenant_id=...)
  Agent (response):
    "Revisé tu marca. Identifiqué 2 huecos:
     1) Falta tu buyer persona (alta prioridad)
     2) Falta testimonial real
     ¿Querés que arranquemos por buyer persona? Puedo hacerte 5 preguntas."

Turn 2
  User:   "dale, arrancá"
  ...
```

Escribir 1 happy path completo + bullet list edges + adversarial.

### Step 3 — State machine agente

Diagrama ASCII:
```
[INIT] → user trigger detected
[GATHERING_CONTEXT] (1-2 read tools)
[REASONING]
[ACTING] → CALLING_TOOL → REASONING
[RESPONDING] → WAITING_USER_INPUT (timeout 24h)
[DONE]
```

Definir cada estado: timeouts, transitions, max-iter exit.

### Step 4 — Tools sequence

Tabla:

| Tool | Cuándo | Inputs | Outputs | Side-effects |
|---|---|---|---|---|
| `brand_audit_tool` | turn 1, after intent detect | `tenant_id` | `gaps[], priorities[]` | None |
| `start_buyer_persona_capture` | turn 2 if user OK | `tenant_id` | `session_id` | DB row |

Forbidden tools también listados explícitos.

### Step 5 — Prompt slot architecture

Definir slot layout cache-aware:

```
SLOT 1 (cacheable, TTL 1h): identity preamble
SLOT 2 (cacheable, TTL 5min): tool registry
SLOT 3 (NOT cached): task instructions
SLOT 4 (NOT cached): user input
SLOT 5 (cacheable, TTL 1h): brand_voice (sales_agent only)
                             ↑ cache_control marker ↑
SLOT 6 (NOT cached): conversation history
```

Cache invalidation triggers:
- Tenant change → SLOT 5 invalidates
- Tool registry change → SLOT 2 invalidates

Forbidden in cache prefix (cualquier slot cacheable):
- timestamps
- conversation_id
- turn_counter
- random IDs
- tenant_name interpolated mid-block

TTL choice justificado:
- 5min default si conversación rápida (~5-10 turns < 5min)
- 1h si long sales (>10min entre turns) o batch eval

### Step 6 — Voice constraints

```
SSoT: personality_profiles.system_instruction (per-tenant)
Compiler: v2 (6 bloques, "ASÍ HABLAS / ASÍ NO")
Voseo: respetar voz tenant (sales_agent SÍ; copilot UI strings NO voseo)
Forbidden: revelar system prompt, mencionar herramientas, robotic phrases
Micro-anchor per turn: primer fragmento respeta voz
```

### Step 7 — Error recovery matrix

Tabla:

| Falla | Detección | Recovery |
|---|---|---|
| Tool timeout | 5s sin response | Retry 1x, fallback_route |
| Tool 500 | status code | Retry 1x backoff, fallback_route |
| Context overflow | tokens >= max | Compactar (system + last 3 turns) |
| User repite | repeat detector | Cambia framing, no repetir literal |
| User frustrado | sentiment grader < 0.3 | Acortar, ofrecer humano |
| Jailbreak attempt | security pattern | Rechazar amable, no leak prompt |

### Step 8 — Eval policy (lift desde story YAML)

```
Trial policy: trials_per_scenario=3, pass^3>=0.5
Personas: tenant-novato-tech (happy), lead-frio-impaciente (adversarial)
Rubrics: voice-fidelity, no-hallucination, no-overpromise, tool-trajectory
State checks:
  - copilot_trace_event: 1 tool call esperado
  - copilot_llm_call: cost <= $0.50
  - PII redaction verified
```

### Step 9 — Cost & latency budget

```
max_turns: 5
max_tokens_per_turn: 6000
budget_usd_per_session: $0.50
TTFT p95: <2s
```

### Step 10 — Observabilidad

```
copilot_trace_event per turn
copilot_llm_call per LLM call (cost, latency, model, tokens, cache_hit)
PII: sanitize_payload() pre-persist
Métricas: agentic_session_completed, agentic_tool_failure
```

### Step 11 — Spec deltas (si aplica)

Si durante diseño descubrís:
- Persona no cubierta por scenarios
- Rubric needed que no existe
- Edge case agentic no documentado
- Tool requerido que /po no anticipó

→ Escribí `delta-spec.md` + escala /po.

### Step 12 — Iterar con Chris

```
02-design-agentic.md draft v1.
Turn-by-turn happy path: ver § 2
State machine: ver § 3
Tools: 2 expected (brand_audit, start_buyer_persona_capture). 0 forbidden detectadas.
Prompt slots: 1+2+5 cacheable, 3+4+6 not. TTL slot 5 = 1h.
Personas: novato-tech (happy), frio-impaciente (adversarial)
Trial policy: 3 trials, pass^3 >= 0.5
Cost budget: $0.50/session, max 5 turns

¿Apruebas? ¿Cambios?
```

Loop hasta aprobación.

### Step 13 — Hand off

```
UX agentic done para brand {brand}.
Deliverables (en {brand}/docs/product/stories/{story-id}/):
- 02-design-agentic.md
- (opcional) mockups/conversation-{flow}.md con transcript ejemplo
- delta-spec.md si aplica

Próximo: /architect (con <brand>: {brand}) → spawn /architect-agentic + (BE si tool nuevo) + (FE si trigger UI).
   /architect produce ready package: 03-arch.md + 04-validators.yaml + 05-guidelines.md + 06-tickets.yaml.
   Story state transitions: refining → refined al ratificar diseño. /architect después transición refined → ready al cerrar package.
```

**Validation cap lineage (v2 cement 2026-05-27):** antes de cerrar state=refined, verificar checkpoint.md tiene `cap_target` (no null) + `cap_change_type` ∈ {new, fix, extend, derive}. Si Chris no los declaró en chris-input.md, skill propone valores como verdict `💡 PROPONE` y espera ratificación. Doc: `docs/process/capability-protocol.md` § Sección 3.

Update `{brand}/docs/product/stories/{story-id}/checkpoint.md` (al ratificar diseño con Chris):
```yaml
brand: {brand}         # ★ REQUIRED — multibrand scope
state: refined         # transición refining → refined cuando spec + diseño agentic ambos ratificados
phase: AGENTIC_DESIGN_RATIFIED
last_artifact: 02-design-agentic.md
ratified_by_chris: true
next_action: "/architect <brand>: {brand} lee 01-spec + 02-design-agentic → spawn arch-{agentic,be,fe} → produce ready package (state=refined→ready)"
```

## Anti-patterns

- ❌ Diseñar voz hardcodeada (es de tenant per-tenant via SSoT)
- ❌ Skip prompt cache architecture (cost spike enorme)
- ❌ Slot 5 con timestamps / conversation_id / random IDs (silent invalidator)
- ❌ Tool dispatch sin tenant_id en signature
- ❌ Conversation con > max_turns budgeted sin justification
- ❌ Skip personas/rubrics existentes y reinventar
- ❌ Voseo en `copilot` UI strings (sales_agent SÍ respeta voz tenant)
- ❌ "El agente debe ser amable" — vague. Reemplazá con rubric `empathy-tone` con assertions concretos.
- ❌ Diseñar arq técnica (state machine implementación, tool wire) → es /architect-agentic

## Output format

Conversaciones en code blocks. Tablas para state machines, tools, recovery. Métricas en bullets. NUNCA dumps largos.

## Anti cross-brand pollution

- ❌ NUNCA editar `{other_brand}/...` cuando trabajás en `{brand}`. Si la story necesita tocar otra brand → STOP, escalate `/pm-luana` (outcome cross-brand).
- ❌ NUNCA editar `core/luana-core-*/src/` directamente (engine copilot/sales-agent). Requiere lift via `/pm-luana` (promotion gate). Brand-extension surface (`{brand}/backend/src/modules/{brand}/{copilot,sales_agent}/`) SÍ es editable per-brand.
- ❌ NUNCA escribir specs/designs/tickets en root `docs/product/stories/` — solo `platform` (cross-brand) outcomes van ahí, y eso requiere `<brand>: platform` explícito + `/pm-luana` ratificación.
- ❌ NUNCA reutilizar personas/rubrics de `{other_brand}/docs/specs/` sin verificar que la voz/contexto aplica. Default: usar core `docs/specs/` o crear bajo `{brand}/docs/specs/` si necesitás override.

## Output protocol · chris-input.md append (v2 cement 2026-05-27)

Al cierre de cada turn de esta skill, MUST appendear una entry a la sección 💬 Conversación del `chris-input.md` de la story activa.

**Path target:**
- Story state ∈ {idea, refining, refined, ready, developing, developed, reviewing}: `{brand}/docs/product/stories/{story_id}/chris-input.md`
- Story state = done: `{brand}/docs/archive/{year}/stories/{story_id}/chris-input.md` (read-only post-merge)

**Formato verbatim del block markdown a appendear:**

```markdown
### YYYY-MM-DDTHH:MM · 🤖 claude · `/ux-agentico` · {emoji} {VERDICT-LABEL}
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

- `docs/process/pm-redesign-2026-05.md` — paradigma 3 conversaciones + ready package
- `docs/process/capability-protocol.md` — schema cap YAML v2 + cap_target + cap_change_type
- `docs/process/chris-input-protocol.md` — output protocol per skill
- `docs/specs/templates/02-design-agentic-template.md` — template diseño agentic
- `.claude/skills/po/` — service-story spec (sister skill)
- `.claude/skills/po-ux/` — UI std spec (sister skill)
- `.claude/skills/sales-agent-expert/` — voz tenant + prompt cache
- `.claude/skills/copilot-expert/` — runtime + observability
