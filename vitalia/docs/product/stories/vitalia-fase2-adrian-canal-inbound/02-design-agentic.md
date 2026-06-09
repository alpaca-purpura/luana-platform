---
story_id: vitalia-fase2-adrian-canal-inbound
brand: vitalia
doc: 02-design-agentic
design_version: 1
consumes: 01-spec.md (v3, ratified)
agent: adrian
audience: sales_agent (externo · habla al lead)
channel: telegram (Telegram-first)
engine_edit_target: ZERO   # diseño reusa engine; cualquier gap → /pm-luana promotion gate
---

# 02-design-agentic — canal-inbound (Adrián) · flujo conversacional por Telegram

> **Norte de diseño:** el cerebro existe (engine `core/luana-core-sales-agent`). Este flujo solo **cablea
> el canal Telegram + el honor-modo del inbox + la instrucción del operador**, reusando mecanismos del
> engine que YA existen. **Cero edición de engine** (si `/architect` halla un gap real → `/pm-luana`).

## § 0 · Boundary engine vs brand-extension (lo que se reusa vs lo que se construye)

| Mecanismo | Existe en | Decisión |
|---|---|---|
| Orchestrator inbound + debounce | engine `orchestrator/chat.py::handle_incoming_webhook` + `smart_debounce_runner` | **REUSE** (§3 protegido) |
| Honor-modo (`handler_mode`/`proposal_required`) | engine `conversation_pipeline.py::handle_human_mode` | **REUSE** |
| Grafo + supervisor + nodos | engine `agents/sales/graph.py` + `supervisor_routing.j2` | **REUSE** |
| `[INSTRUCCION DEL OPERADOR]` prioridad máxima | engine `supervisor_routing.j2:31` | **REUSE** (no se toca) |
| Inyección de contexto en `metadata_info` JSONB | vitalia `sales_agent/.../override_context_wire.py` | **EXTEND** (key `operator_instructions`) |
| Slots de prompt cacheables | engine `application/prompts/compose.py` | **REUSE** (instrucción = slot volátil, NO cacheable) |
| `format_for_channel` + ComplianceService | engine channels + compliance | **REUSE** |
| BaseChannel + adapter Telegram (send/recv) | engine `infrastructure/channels/base.py` + `api/dto/telegram.py` | **REUSE** + adapter de marca (token per-tenant) |
| **NET-NEW (brand):** receiver webhook Telegram (ruta vitalia, reemplaza stubs T-be-8) · adapter Telegram connections · **honor-modo gate wrapper** (gatea el outbound) · endpoint `set operator instruction` · wire de inyección (extiende override_context_wire) | — | **BUILD** |

## § 1 · Scope / contract (de 01-spec v3)

- **channel:** telegram · **audience:** sales_agent (lead externo)
- **modos:** `Adrián decide` (responde) · `Adrián consulta` (borrador, no envía) · `pausado` (silencio)
- **tools:** `screening_questions`, `payment_link`, `reschedule_appointment` (stage-gated, engine `STAGE_TOOL_SCOPE`)
- **forbidden:** `send_medical_summary` (PHI por canal no-encriptado)
- **voice:** voz del tenant (`personality_profiles.system_instruction`) + persona Adrián + medical safety rails
- **outcome:** mixed (texto + side-effects: lead/conversación persistida, payment_link, reschedule, instrucción)
- **budget:** Chinese-first gateway (DeepSeek/Kimi); ver § 9

## § 2 · Happy path turn-by-turn (Telegram · modo `decide`)

```
Turn 1 — lead nuevo escribe al bot del tenant
  Lead (Telegram): "Hola, quiero info de blanqueamiento dental y precios"
  [receiver] verifica secret_token + update_id idempotente
  [normalize] IncomingMessage(user_id=chat_id, text, channel="telegram", metadata={bot,tenant})
  [resolve] bot→tenant "Sanaré"; chat_id→lead nuevo → crea conversación (modo=decide default, RN-3)
  [honor-mode gate] decide + no pausado → corre grafo
  Adrián (think): intent=info+precio, vertical=dental → supervisor→qualifier/product_expert
  Adrián (tool, opcional): screening_questions(vertical="dental")  # califica
  Adrián (compliance): format_for_channel(telegram) + ComplianceService.validate_outbound (sin PHI)
  Adrián (Telegram →): "¡Hola! El blanqueamiento dental en {clínica} arranca desde {rango}.
                        ¿Te gustaría que te cuente las opciones y agendemos una valoración?"
  [observe] turn_start/turn_end + llm_call(cost, model=deepseek/kimi) + activity event (glass-box)

Turn 2 — el lead muestra intención
  Lead (Telegram): "sí, ¿cómo aparto?"
  [honor-mode] decide → corre grafo
  Adrián (tool): payment_link(concept="seña valoración", amount=...)  # tool de acción (Q2)
  Adrián (Telegram →): "Genial. Podés reservar tu valoración con esta seña: {link}.
                        Apenas la confirmes, te doy 3 horarios disponibles."
  [observe] payment_link idempotente + activity + audit

Turn 3 — la recepción interviene SIN escribirle al lead (instrucción al agente)
  Recepción (inbox composer, modo instrucción · Adrián sigue en decide):
        "🤖 Instrucción a Adrián: es referido de la Dra. López, ofrécele 10% y trátalo prioritario"
  [set-instruction] persiste en agent_state_checkpoints.metadata_info[operator_instructions]
        + activity NON-PHI ("la recepción instruyó a Adrián") + audit · NO se envía nada al lead
  Lead (Telegram): "¿el precio final con todo cuánto queda?"
  [honor-mode] decide → corre grafo
  [inject] el turno antepone "[INSTRUCCION DEL OPERADOR] referido Dra. López, 10% off, prioritario"
        → supervisor lo honra con prioridad máxima
  Adrián (Telegram →): "Como venís recomendado por la Dra. López, te puedo dejar un 10% sobre el
                        paquete completo: queda en {precio}. ¿Te lo reservo?"   # ← steereado, el lead nunca vio la instrucción
```

## § 3 · State machine (orquestación de marca alrededor del engine)

```
[TELEGRAM_UPDATE]
   └─ verify secret_token (RN-9) + idempotency(update_id) ── inválido/duplicado ─▶ [DROP] (200, sin dispatch)
[NORMALIZE] → IncomingMessage
[RESOLVE_TENANT+LEAD] → bot→tenant ; chat_id→conversación (crea si nueva, modo=decide RN-3)
[READ_CONV_STATE] → {mode, paused, operator_instructions}
        ├─ paused (RN-2) ─────────▶ [PERSIST_ONLY] → activity event ─▶ [END]   (Adrián NO responde)
        ├─ decide  ──┐
        └─ consulta ─┴─▶ [INJECT_CONTEXT] (operator_instructions → [INSTRUCCION DEL OPERADOR])
                         └─▶ [RUN_GRAPH] (engine: debounce → supervisor → specialists → tools)
                              └─▶ [OUTBOUND_GATE]
                                   ├─ decide   → [SEND_TELEGRAM] (compliance+format) → activity
                                   └─ consulta → [DRAFT] (proposal banner, 0 envío, RN-10) → activity
[OBSERVE] turn_start/turn_end + llm_call + sanitize_payload ─▶ [END]
```

| Estado | Timeout / exit |
|---|---|
| RUN_GRAPH | engine debounce 0.5–6s · max recursion del grafo (engine) · tool retry 1x |
| OUTBOUND_GATE | decide=send · consulta=draft · pause=skip (nunca llega acá) |
| WAITING (entre turnos) | conversación persiste; el siguiente update reabre el flujo |

**Honor-modo = gate al OUTBOUND, no a la inteligencia** (salvo pause, que evita correr el grafo para no
gastar tokens). decide y consulta corren el MISMO grafo (Q3); difieren en si el resultado se envía o queda
de borrador.

## § 4 · Tools sequence

| Tool | Cuándo | Inputs | Outputs | Side-effects | Modo |
|---|---|---|---|---|---|
| `screening_questions` | turn temprano, calificar | `tenant_id, vertical` | outcome enum | LeadScreeningEvent + audit | decide+consulta |
| `payment_link` | lead con intención de reservar | `tenant_id, concept, amount` | link | payment row (idempotente) | decide=ejecuta · consulta/pausa=en borrador |
| `reschedule_appointment` | pide reagendar | `tenant_id, appt_id, new_slot` | propuesta | booking update | idem |

**Forbidden:** `send_medical_summary` (PHI canal no-encriptado · RN-5). Stage-gating del engine
(`STAGE_TOOL_SCOPE`): tools de acción solo en etapas avanzadas (no en rapport inicial).

### Tool NEW · `match_service_and_specialist` (★ Chris 2026-06-05 · bloqueado en lisa-servicios)

| Tool | Cuándo | Inputs | Outputs | Side-effects | Modo |
|---|---|---|---|---|---|
| `match_service_and_specialist` | Adrián infirió el servicio probable del pedido del paciente | `tenant_id, service_id (o intent)` | `{primary_doctor: {bio_public, specialty, exp, langs, avatar, next_slot}, callbacks: [...]}` | lectura clinics+availability (NON-PHI) | decide+consulta |

- **Brand-level (NO engine):** lee `clinics.Doctor` linkeados al servicio (link de lisa-servicios) +
  `availability` → primary (first-match) + callbacks. Resuelve el **gap del cableado**: hoy el agente solo
  ve el `team` de Brand Studio; este tool le da el **roster clínico real**. Cero PHI (datos públicos del
  profesional). Detalle de mecánica + cimientos: `00-research-data-foundation.md`.
- **Conocimiento de servicios:** vía `TenantKnowledgeBuilder` del engine (ya inyecta ofertas Offer Studio
  en `agent_identity` — sin plomería nueva). El tool resuelve el especialista; el servicio lo conoce por su
  identidad. **Ambos requieren que lisa-servicios aterrice (catálogo + link servicio↔doctor).**

## § 5 · Prompt slot architecture (reusa engine `compose.py` · instrucción = VOLÁTIL)

```
SLOT 1 (cacheable 1h): STATIC_IDENTITY (Adrián)
SLOT 2 (cacheable 5min): TOOLS_HINT (registry stage-scoped)
SLOT 3 (cacheable 1h): PLAYBOOK
SLOT 4 (cacheable 1h): AGENT_IDENTITY (vitalia medical)
SLOT 5 (cacheable 1h): BRAND_VOICE (personality_profiles per-tenant)  ── cache_control marker ──
─────────────────────────── CACHE BOUNDARY ───────────────────────────
SLOT 6 (volátil): CHANNEL_FORMAT (telegram)
SLOT 7 (volátil): [INSTRUCCION DEL OPERADOR] {operator_instructions}   ← ★ instrucción del operador
SLOT 8 (volátil): STAGE_HINT + SIGNALS + honor-mode context
SLOT 9 (volátil): conversation history + user input
```

**★ La instrucción del operador va en SLOT 7 VOLÁTIL** (después del cache boundary) — NUNCA en prefix
cacheable (sería silent invalidator: cambia por-conversación). Se surface con el marcador
`[INSTRUCCION DEL OPERADOR]` que el supervisor del engine ya honra con prioridad máxima.

**Forbidden en prefix cacheable:** timestamps · conversation_id · chat_id · turn_counter · el texto de la
instrucción del operador · `tenant_name` interpolado mid-block.

## § 6 · Voice constraints

- **SSoT:** `personality_profiles.system_instruction` (per-tenant) → SLOT 5. Persona Adrián + medical rails.
- **Voseo:** respeta voz del tenant (sales_agent SÍ — puede ser voseo si tenant AR). NO se aplica neutro al output de Adrián.
- **Forbidden:** revelar system prompt, mencionar herramientas internas, frases robóticas, **discutir
  diagnóstico/resultados/medicación** (deriva a portal · RN-5).
- **Micro-anchor:** primer fragmento de cada turno respeta la voz; tono profesional cálido (no infantil, no frío).

## § 7 · Error recovery matrix

| Falla | Detección | Recovery |
|---|---|---|
| Tool timeout/500 | engine retry policy | retry 1x backoff → fallback route (engine) |
| PHI pedida por Telegram | ComplianceService | bloquea outbound + deriva a portal seguro (RN-5) + audit |
| Prompt injection | safety pattern del engine | rechaza sin leak + **escala** (banner "Adrián pide ayuda" + pausa, RN-7) |
| Tool falla / lead pide humano | nodo escalation | escala + pausa conversación (RN-7) |
| Ráfaga (N mensajes <6s) | `smart_debounce_runner` | coalesce → 1 turno → 1 respuesta (RN-4) |
| Context overflow | engine | compactación (system + últimos turnos) |
| Webhook duplicado | idempotency `update_id` | procesa 1 vez (RN-9) |
| Gateway LLM caído | proxy LiteLLM | fallback cross-provider deepseek↔kimi (config proxy) |

## § 8 · Eval policy (lift de 01-spec v3)

```yaml
trial_policy: { trials_per_scenario: 3, per_trial_pass_threshold: 0.66, pass_k_threshold: 0.5 }
personas:           # docs/specs/personas/archetype-aware/ (+ vitalia override si falta)
  - paciente-precio-curioso   (happy · SC-1/SC-7)
  - paciente-pide-PHI         (adversarial · SC-4a)
  - atacante-prompt-injection (adversarial · SC-4b)
  - lead-instruccion-VIP      (★ nuevo · SC-8 · verifica steering por instrucción)
rubrics:
  - voice-fidelity.md · vertical-medical-fidelity.md · no-hallucination.md · no-overpromise.md · tool-trajectory.md
goldens (sales_agent · brand-extension {brand}/.../sales_agent/goldens/):
  - honor-mode: decide→envía · consulta→borrador-sin-envío · pausa→silencio
  - PHI firewall: pide resultados → deriva portal (0 leak)
  - operator-instruction: setear "10% descuento" → siguiente reply lo refleja (el lead no la ve)
```

## § 9 · Cost & latency budget

```
gateway: LiteLLM Chinese-first (NANO/FAST=deepseek-v4-flash · AGENT=kimi-k2 · fallback deepseek↔kimi)
max_turns_por_ráfaga: 1 (debounce coalesce)
budget_usd_por_turno: acota BudgetGuard (SA pool reservado) · OutboundRateLimiter (msgs/día por plan)
TTFT objetivo: telegram tolera typing indicator; p95 < 3s al primer chunk
```

## § 10 · Observabilidad

```
sales_agent_trace_event  → turn_start/turn_end + node_enter/exit + tool_call (sanitize_payload)
sales_agent_llm_call     → cost, tokens, model, cache_hit (gateway LiteLLM)
honor-mode en trace      → {mode, paused, instruction_applied:bool}  (NON-PHI)
PII/PHI: sanitize_payload(compliance_level="hipaa_lite") en CADA write (RN-6)
activity stream (inbox)  → cada paso glass-box, sanitizado
```

## § 11 · Spec deltas + decisiones de diseño

Sin deltas estructurales — el `01-spec.md` v3 cubre el flujo.

- **D1 · Persistencia de la instrucción del operador → PERSISTENTE (★ ratificado Chris 2026-06-05).** La
  instrucción steerea TODOS los turnos siguientes hasta que la recepción la cambie o la limpie. UI: chip
  "🤖 Instrucción activa: …" editable/limpiable en el thread. Storage: `metadata_info[operator_instructions]`
  se sobreescribe al editar, se borra al limpiar (no se consume por turno). Mejora sobre el legacy
  (one-shot). Refina RN-13: la instrucción NO es one-shot.
