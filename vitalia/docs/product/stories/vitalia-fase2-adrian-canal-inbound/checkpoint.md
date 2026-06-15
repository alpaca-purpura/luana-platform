---
story_id: vitalia-fase2-adrian-canal-inbound
type: agentic-story
agent_owner: adrian
map_zone: agentes
map_box: adrian
module: sales_agent           # heart = trigger del runtime; cross-module connections (receivers) + inbox (feed)
capability: adrian.inbox      # EXTIENDE la cap del inbox (loop inbound la activa)
state: refined
architecture_pattern: ADR-vitalia-004
last_modified: 2026-06-05
ratified_by_chris: true
channel_scope: telegram-first   # Chris 2026-06-04 — WhatsApp/IG = follow-up (sin API hoy)
gateway_improvement: out-of-scope   # mejora del LLM gateway = item /pm-luana aparte (toca engine)
parallel_safe: true
priority: high
estimated_dev_days: 4-6
dependencies:
  hard:
    - vitalia-fase2-adrian-inbox             # superficie + modo por-conversación que este loop respeta y nutre
    - vitalia-fase2-lisa-servicios           # ★ Chris 2026-06-05: el match servicio→especialista necesita el catálogo (Offer Studio) + link servicio↔doctor. Secuenciar PRIMERO.
  soft:
    - vitalia-fase2-adrian-embudo            # persistencia conversación + tablero leads
    - vitalia-fase2-lisa-doctores            # roster clínico (bio/specialty/disponibilidad) que el match presenta
blocks_hard: []
blocks_soft:
  - vitalia-fase2-adrian-outbound            # respuestas a outbound vuelven por este mismo loop
  - vitalia-fase2-camila-reactivar           # reactivación cierra el ciclo en el inbox
reuse_map_summary: >-
  CONSUME engine core/luana-core-sales-agent (runtime LangGraph: orchestrator/chat.py + graph.py +
  smart_debounce_runner.py — read-only, NUNCA recrear) · CONSUME extensión vitalia/.../sales_agent/
  (tools + 5 personas voz + prompts + state_overlay shipped) · CONSUME core/luana-core-channels
  (format_for_channel + intent_detector) + core/luana-core-compliance (firewall PHI outbound) ·
  REUSE adapters connections whatsapp/instagram (hoy solo OUTBOUND) — agregar INBOUND receiver ·
  NEW Telegram adapter (no existe) · EXTIEND inbox: el loop nutre activity stream + respeta modo
spawned_at: 2026-06-04
next_action: "/architect vitalia vitalia-fase2-adrian-canal-inbound → spawn arch-{agentic,be,fe} → ready package (03-arch + 04-validators + 05-guidelines + 06-tickets). 01-spec v3 + 02-design-agentic v1 ratificados. NOTA architect: (1) target CERO edición engine — si hay gap escalar /pm-luana; (2) FE delta = composer instrucción-mode sobre componente shipped del inbox → decidir si requiere mockup-per-component (ADR-vitalia-003); (3) BUILD espera dep hard adrian-inbox (developing)."
phase: AGENTIC_DESIGN_RATIFIED
last_artifact: 02-design-agentic.md

# Schema v2 migration (cement 2026-05-27)
release: F3
cap_target: adrian.inbox     # extiende la cap del inbox · posible derived cap adrian.canal-inbound (architect decide)
cap_change_type: extend      # new | fix | extend | derive
parent_story: null
---

# F3 vitalia-fase2-adrian-canal-inbound — checkpoint

## Goal

Cablear el **loop autónomo de atención por canal** de Adrián: que un mensaje entrante de WhatsApp / Instagram / Telegram dispare el runtime sales_agent y produzca una respuesta, **nutriendo el inbox en vivo** — tal como funcionaba el `sales_agent` legacy, pero re-hogarado al shell-organism actual y mejorado.

Pipeline objetivo:

```
webhook canal recibe mensaje
  → persiste en conversación (crm/inbox)
  → invoca grafo sales_agent (engine, vía import) RESPETANDO el modo por-conversación que fija el inbox
     (🤖 Adrián decide · 🤝 consulta · 👤 humano = NO responde)
  → firewall PHI compliance + format_for_channel
  → responde por el adapter del canal
  → emite activity event → el inbox lo muestra glass-box
```

## Naturaleza (★ leer antes de refinar)

**NO es construir el agente.** El cerebro YA EXISTE y se reutiliza al máximo:

| Pieza que YA EXISTE | Path | Cómo se usa |
|---|---|---|
| Runtime LangGraph (cerebro) | `core/luana-core-sales-agent/.../application/orchestrator/{chat.py,graph.py}` + `agents/sales/graph.py` + `smart_debounce_runner.py` | **CONSUMIR vía import. READ-ONLY.** Tocar = `/pm-luana` promotion gate |
| Extensión de marca vitalia | `vitalia/backend/src/modules/vitalia/sales_agent/` | tools (screening, payment_link, reschedule, reengagement, retract) + 5 personas voz + prompts + state_overlay — REUSE |
| Adapters canal (OUTBOUND) | `vitalia/.../connections/{whatsapp,instagram}/adapter.py` | REUSE para enviar; **falta el INBOUND receiver** |
| Format + intent + compliance | `core/luana-core-channels/format_for_channel.py` + `intent_detector.py` · `core/luana-core-compliance` | REUSE |
| Inbox (superficie + modo) | `vitalia/.../inbox/` (story `adrian-inbox`) | el loop **respeta el modo** y **nutre** el activity stream |

**Antecedente:** el loop fue **shipped en slice-1** (caps `sales_agent/inbox-handler-mode-occ` + `adrian-3-tools-mvp`, hoy `status: deprecated` / `slice-1-superseded`: *"Adrián atiende consultas en Instagram y WhatsApp"*). Se deprecó en la reorg del shell → quedó huérfano. Esta story lo **re-hogar + cablea + mejora**, NO lo inventa.

## Filosofía (Chris, 2026-06-04)

Reutilizar al máximo lo que ya existe, **mejorarlo**, y seguir haciendo de este sistema algo genial. Cero duplicación del engine. La historia está **conectada con las capabilities del inbox** → es modificadora → **lleva en su alcance las pruebas de regresión del inbox** (que nada de lo shipped del inbox se rompa al enchufar el loop).

## Anti-objetivos

- ❌ NO recrear el agente / grafo LangGraph — vive en `core/luana-core-sales-agent` (engine, `/pm-luana` para tocarlo)
- ❌ NO duplicar tools/personas/prompts — reusar la extensión `vitalia/.../sales_agent/` shipped
- ❌ NO reconstruir la UI del inbox — es `vitalia-fase2-adrian-inbox` (esta story la CONSUME + nutre)
- ❌ NO campañas/outbound masivo — eso es `adrian-outbound`
- ❌ NO reactivación de fríos — eso es `camila-reactivar`
- ❌ NO romper ninguna cap shipped del inbox (de ahí el regression scope obligatorio)

## Scope (preliminar — refina /po + /ux-agentico)

### § Inbound receivers (NEW — connections) · ★ TELEGRAM-FIRST (Chris 2026-06-04)
- **Telegram adapter NUEVO** (inbound + outbound — no existe en connections). **ÚNICO canal en scope.**
  Webhook receiver Telegram (setWebhook + recepción updates) → normalizar a `IncomingMessage`.
- ⏳ **Follow-up (FUERA de scope hasta tener API):** Webhook receiver WhatsApp Cloud API · Webhook
  receiver Instagram Messaging. Quedan como story posterior cuando Chris tenga la API real
  (no se construyen stubs no-verificables — Critical Rule #37).
- Normalización a un mensaje canónico → persiste conversación (reusar crm/inbox repos).

### § Trigger del runtime (sales_agent extension)
- Al persistir inbound, disparar el grafo (`orchestrator/chat.py`) con debounce (`smart_debounce_runner` — ráfagas).
- **Honrar el modo por-conversación** del inbox: 🤖 decide → responde · 🤝 consulta → propone sin enviar · 👤 humano / pausado → NO responde.
- Outbound vía adapter del canal tras firewall PHI + format_for_channel.

### § Feed del inbox (EXTEND inbox)
- Cada paso (mensaje, tool-call, respuesta) emite activity event que el inbox renderiza glass-box.
- Sin cambios de UI nuevos; integración con el activity stream shipped.

### § Regression scope (★ obligatorio — Chris)
- Suite de regresión de las caps del inbox: modos (set-mode + OCC), pause Adrián + undo 5min, send humano, nudge, proactive-outbound, activity stream, PHI channel policy.
- Gate: los tests del inbox shipped pasan SIN modificarse (regression_guard). Si cambian → revisión explícita.

## Dependencies map

### Hard
- `vitalia-fase2-adrian-inbox` — la superficie + el modo por-conversación que este loop respeta y nutre. **Debe aterrizar primero.**

### Soft
- `vitalia-fase2-adrian-embudo` — persistencia de conversación + tablero de leads.

### Esta historia desbloquea
- `adrian-outbound` (respuestas a campañas vuelven por este loop) · `camila-reactivar` (cierre del ciclo en el inbox).

## Prior art scan

> Ejecutado 2026-06-04 (`/pm-vitalia`). Detalle de paths en § Naturaleza arriba.

- **Engine cubre 100% del cerebro** → CONSUMIR import. `core/luana-core-sales-agent` runtime LangGraph + `core/luana-core-channels` + `core/luana-core-compliance`.
- **Extensión de marca shipped** → REUSE `vitalia/.../sales_agent/` (tools + personas + prompts).
- **Adapters connections** → REUSE outbound whatsapp/instagram; falta inbound receiver.
- **Telegram** → net-new adapter (no existe en vitalia ni se usa en engine channels más allá de base genérica).
- **Caps slice-1 deprecated** → re-home candidate (verificar código huérfano recuperable antes de fijar new vs extend).
- **Decisión:** `extend` (conecta/modifica inbox + reusa engine). Posible `derived cap` `adrian.canal-inbound` — lo decide `/architect`.

## ✅ Verificación pre-refinement — HECHA (2026-06-04, `00-research.md`)

- **Cerebro en engine** (`core/luana-core-sales-agent`: orchestrator/chat.py + smart_debounce + graph + handle_telegram_webhook) → CONSUMIR import, read-only.
- **Extensión `vitalia/.../sales_agent/` in-tree + registrada EP-3** (tools/personas/state_overlay/observability/lead_screening) → REUSE.
- **Loop NUNCA cableado** (`webhook_routes.py` = stubs "T-be-8 scope"; cero imports del orchestrator en vitalia) → falta **enchufar**, no rescatar borrado.
- → **`extend` confirmado.** Detalle: `00-research.md`.

## Decisiones Chris (2026-06-04, ratificadas vía /pm-vitalia)

1. **Telegram-first** — WhatsApp/IG = follow-up cuando haya API (no stubs no-verificables).
2. **Mejora del LLM gateway = item `/pm-luana` aparte** — esta story CONSUME el gateway tal cual (ya funciona); mejorarlo toca engine (promotion gate). Proposal SSoT `docs/promotion-protocol/proposals/2026-06-04-llm-gateway-chinese-first.md`.
3. **Refinar ya en paralelo** — spec/flujo avanzan (bucket docs); el BUILD espera a que dep hard `adrian-inbox` cierre.

## Decisión Chris 2026-06-05 — secuenciar servicios primero + match in-scope

Origen: Chris preguntó cómo Adrián entiende la necesidad del paciente + presenta al especialista disponible (match first + callbacks) si no hay servicios creados ni doctores cableados al agente. Investigación (`00-research-data-foundation.md` abajo). **Decisiones:**

1. **Secuenciar servicios PRIMERO** (no por capas). canal-inbound nace con el match completo. → dep hard NEW: `lisa-servicios` debe aterrizar antes del BUILD de canal-inbound.
2. **Servicios = Offer Studio (escalera de valor)** — ofertas con LadderSlot (lead-magnet/core/profit-maximizer), no catálogo plano. Es lo que `lisa-servicios` ya diseñó + lo que el `TenantKnowledgeBuilder` del engine ya lee.
3. **El match servicio→especialista pasa a IN-SCOPE de canal-inbound** (antes "layered/follow-up"). Mecánica: § Match servicio→especialista del spec + § en el design (tool brand-level `match_service_and_specialist`, NO toca engine).

**Cadena de bloqueo del match:** `lisa-servicios` (catálogo Offer Studio + link servicio↔doctor) → cablear doctores clínicos al conocimiento de Adrián (tool brand-level, NO el `team` de Brand Studio que ve hoy) → canal-inbound consume el match. **Gap a asignar hogar:** el "wire doctores+servicios → Adrián" (¿en lisa-servicios? ¿slice agentic propio? ¿dentro de canal-inbound?) — pendiente `/architect`/Chris.

## Próximo paso

`/po` refina `01-spec.md` (agentic-story) → `/ux-agentico` diseña el flujo turn-by-turn inbound + state machine + honor-modo + eval policy. ANTES: correr la verificación pendiente.

## Referencias

- **Engine:** `core/luana-core-sales-agent/` (runtime · read-only)
- **Extensión marca:** `vitalia/backend/src/modules/vitalia/sales_agent/`
- **Inbox sibling:** `vitalia/docs/product/stories/vitalia-fase2-adrian-inbox/` (superficie + modo)
- **Caps shipped (deprecated):** `vitalia/docs/product/capabilities/sales_agent/{inbox-handler-mode-occ,adrian-3-tools-mvp}.yaml`
- **Slice-1 archived:** `vitalia/docs/archive/2026/stories/vitalia-slice-1-inbox/`
- **Rules:** `.claude/rules/anti-duplication.md` · `.claude/rules/anti-duplication-refining.md` · `.claude/rules/definition-of-done-live-verify.md` (regression scope) · `vitalia/.claude/rules/hipaa-lite.md` (firewall PHI por canal)

## Scope-add ratificado Chris 2026-06-11 (origen: delta doctores D3-B — /po-ux)

**Adrián consume el perfil del doctor para la venta.** Hoy NADA del doctor llega al sales_agent (verificado por grep — el "la consume el agente de ventas" del spec doctores era aspiracional). Esta story, como dueña del runtime Adrián, suma:
1. **Contexto de venta:** bio_public (Resumen/Formación/Enfoque) + especialidad + servicios del doctor asignado/preguntado entran al contexto del agente (slot/KB — architect decide mecanismo).
2. **Acción "compartir perfil del doctor":** cuando el lead pregunta por el doctor o se le informa quién lo atenderá, Adrián envía el **link de la página pública mobile-first del doctor** (página = scope de `vitalia-fase2-lisa-doctores` § D3-D — corrección Chris 2026-06-11; esta story consume la URL).
3. Solo doctores con "Visible en landing" ON son compartibles/citables.

El architect de esta story debe declarar el contrato con la página del doctor (URL pattern `/d/{clinica}/{doctor}` — D3-D doctores) + el slot de contexto. Registrado también en `vitalia-fase2-lisa-doctores/01-spec.md § Derivadas del delta`.
