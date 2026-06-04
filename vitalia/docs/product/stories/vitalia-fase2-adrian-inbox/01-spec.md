---
story_id: vitalia-fase2-adrian-inbox
brand: vitalia
type: ui-story
state: refining
architecture_pattern: ADR-vitalia-004
agent_owner: adrian
map_zone: agentes
map_box: adrian
module: inbox
cap_target: adrian.inbox
cap_change_type: new
po_ux_version: 1
ratified_by_chris: false
---

# vitalia-fase2-adrian-inbox — 01-spec (UI standard · MIGRACIÓN + consolidación)

> **Naturaleza:** esta NO es una construcción virgen. El inbox ya está **shipped y probado** (slice-1-inbox, done) pero quedó **huérfano** (sin ruta) tras la reorg del shell. Esta story lo **re-hogar + consolida + re-temiza + cablea** dentro del espacio shell-organism de Adrián, alineado al paradigma conversation-first del embudo. ~90% reuse.
> **Encuadre que pidió Chris:** el § Componentes distingue explícito **lo que HAY · lo que MIGRO · lo que CREO · lo que MODIFICO · lo que BORRO.**

## § Context

- **Release:** F3 · **Módulo:** `inbox` (consume `sales_agent` + `crm` + `connections` + `compliance`).
- **Hogar del mapa (paradigma):** zona **Agentes** → caja **Adrián** → área **inbox**. Adrián opera; Valeria supervisa; el humano interviene. Es la "conversación viva del lead"; el embudo (hermano) es "el tablero de leads".
- **Punto de inserción:** Ribbon N1 (Adrián, cian `#01B2F8`) → SubTabsBar N2 → sub-tab **Inbox**. Hoy esa ruta la sirve el genérico `[agent]/[subtab]/page.tsx` → `InboxPlaceholder`. Esta story crea la ruta real `adrian/inbox/page.tsx` (patrón `mateo/agenda/page.tsx`).
- **Out-of-scope (anti-creep):**
  - NO reactivación de leads fríos (→ `camila-reactivar`).
  - NO diagnóstico de conversaciones congeladas (→ `adrian-embudo` § Congeladas).
  - NO bulk actions multi-conversación (story futura).
  - NO realtime WebSocket (MVP = polling 10s; upgrade post-MVP).
  - NO tocar engine `core/luana-core-sales-agent` / `core/luana-core-copilot` (read-only — consumir vía import + brand tools).
  - NO outbound proactivo masivo / campañas (→ `adrian-outbound`); SÍ el nudge 1:1 dentro de una conversación viva.

## § Prior art applied

> Scan ejecutado (engine + vitalia propio + legacy nicolify + embudo sibling). Detalle en `checkpoint.md § Prior art scan`.

- **Reuse — inbox shipped huérfano:** `vitalia/frontend/src/features/inbox/` (~40 comps slice-1, done): `SegmentedControl3Modes`, `AgentActivityStream`, `ContactSidebar` (PHI), `ActionReceiptUndoChip`, `PauseAdrianButton`+`PauseAdrianConfirmModal`, `VoiceMessagePlayer`, `ImageAnalysisCard`, `AdrianToolsSheet`, `ProactiveOutboundModal`, `ProposalCardBanner`, `FilterChips`, `ConversationList/Item/Thread`, `MessageBubble`, `ThreadHeader`, `ComposerArea`, 8 estados visuales + hooks React Query (`use-conversations`, `use-conversation-detail`, `use-send-message`, `use-set-mode`, `use-pause-adrian`, `use-activity-stream`, …). Diseño funcional SSoT: `vitalia/docs/archive/2026/stories/vitalia-slice-1-inbox/02-design-ui.md`.
- **Reuse — subset parity F1-S10:** `vitalia/frontend/src/features/adrian/components/inbox/` (`ConversationItem`, `ContactSidebar`, `ThreadHeader`, `TakeoverBanner`, `MessageBubble`, `MessageInput`, `CampaignTag`, `types.ts`) — hogar FSD correcto, versión simple.
- **Reuse — shell organism mejorado:** `ShellOrganismLayout(Client)` (splitter resizable), `ValeriaSidebar` (estados `collapsed`/`rail`/`full` vía `useShellStore`), `Ribbon`/`SubTabsBar`, `EntitySubNavBar`, `EmptyState`, `_agent-tw-classes`. Tokens: `globals.css` (`--agent-adrian #01B2F8`).
- **Reference — legacy sales studio (`closer-studio`):** `~/Proyectos/luana-nicolify-legacy/.../features/closer-studio/` — patrón 3-pane + hooks agénticos `stop/resume · send · nudge · reactivate · diagnose` + `use-closer-ws` (realtime) + `use-kpis`. Vitalia ya evolucionó `stop/resume → 3-modos`. **Traigo `nudge`**; difiero `reactivate`/`diagnose` (otras stories).
- **Engine consumed:** `core/luana-core-sales-agent` (LangGraph runtime, AgentStateCheckpoint, transitions) + brand tools shipped `vitalia/backend/src/modules/vitalia/sales_agent/tools/` (`payment_link`, `reschedule_appointment`, `retract_last_message`, `screening_questions`, `send_proactive_reengagement`). Backend inbox: `vitalia/backend/src/modules/vitalia/inbox/api/router.py`.
- **Compliance consumed:** `core/luana-core-compliance` `ComplianceService.validate_outbound_message` (firewall PHI por canal).
- **Observability consumed:** `core/luana-core-observability` `copilot_trace_event` + `sanitize_payload` (activity stream).
- **Learnings aplicados:** embudo `research/{01-legacy-pipeline,02-core-engine,04-detail-entry-pattern}.md` (conversation-first + consumir sustrato engine + EntitySubNavBar). Embudo learning panel-content fluido (sin `max-width` hard).
- **Lift candidates:** `ChannelBadge` (badge de canal WhatsApp/IG/Email/Web) aparece en inbox + embudo + futuras → candidate `components/shared/shell-organism/ChannelBadge.tsx` (brand-local primero; escalar `/pm-luana` si aparece en ≥2 brands).
- **Net-new justificado:** consolidación adrian/inbox + "modo conversación" (colapso Valeria) + Valeria-reacciona-básica + registro `adrian.inbox` en shell-routes — no existían.

## § Mapa funcional

### Happy path (camino dorado)

1. La recepcionista entra a **Adrián → Inbox**. Ve la lista de conversaciones cross-canal (WhatsApp · IG · Email · Web), ordenadas por actividad reciente; cada una muestra quién la opera ahora (🤖 Adrián decide · 🤝 consulta · 👤 humano) y un punto de no-leído.
2. Hace clic en la conversación de **P. H.** (paciente, nombre enmascarado). El thread central carga el historial; la URL pasa a `?conv={id}` (deep-link). El panel de Valeria a la izquierda **reacciona**: "Estás viendo a P. H., preguntó por blanqueamiento, Adrián ya le pasó disponibilidad. ¿Querés que le ofrezca la promo?".
3. La conversación está en **🤖 Adrián decide**: el thread muestra, inline y explicable, lo que Adrián hizo — un mensaje del paciente, una **tool-call colapsable** ("Adrián verificó disponibilidad → 3 turnos"), y su respuesta. El **Activity stream** abajo registra todo cronológico (glass-box).
4. La recepcionista quiere intervenir: pulsa **"Tomar control"** (o cambia el toggle a **👤 Yo escribo**). El composer se habilita; escribe y envía firmando como humana. Adrián queda en pausa para esa conversación.
5. Necesita foco total: pulsa **"Modo conversación" (full)** → Valeria se **colapsa**, el inbox ocupa el **100%** del lienzo. Pulsa de nuevo → Valeria vuelve a su estado previo.
6. Termina, vuelve la conversación a **🤖 Adrián decide** (reanudar). Adrián retoma. El cambio de modo queda en el **audit log**.

### Bifurcaciones (árbol)

```
Entrar a Adrián → Inbox
├── ¿Hay conversaciones?
│   ├── NO → empty state "Aún no hay conversaciones" + explicación canales [SC-empty]
│   └── SÍ → lista renderiza (paginada, filtros, búsqueda)
│       ├── Filtro aplicado sin resultados → empty "Sin resultados · limpiar filtros" [SC-empty]
│       └── Lista con N items
│           └── Clic en conversación → thread carga + URL ?conv={id} + Valeria reacciona [SC-1 happy]
│               ├── Modo 🤖 Adrián decide
│               │   ├── Paciente escribe → Adrián procesa (polling 10s trae tool-calls + respuesta) [SC-1]
│               │   ├── Tool falla / paciente pide humano → Adrián ESCALA (banner "🔴 Adrián pide ayuda") + auto-switch a Yo escribo [SC-edge]
│               │   └── Paciente pide resultados clínicos por WhatsApp → ComplianceService BLOQUEA + deriva a portal [SC-adversarial]
│               ├── Modo 🤝 Adrián consulta
│               │   └── Adrián prepara borrador → humano aprueba / edita / descarta → recién ahí se envía [SC-2]
│               ├── Modo 👤 Yo escribo (o "Tomar control")
│               │   └── Composer humano habilitado · Adrián pausado para esa conv · audit log [SC-3]
│               ├── Acción nudge (empujón) → Adrián manda re-enganche 1:1 a conv activa estancada [SC-nudge]
│               ├── Botón "Modo conversación" (full) → Valeria colapsa → inbox 100% → toggle restaura [SC-full]
│               └── Cambio de modo → POST mode + audit log row [SC-mode]
```

### Reglas de negocio

- **RN-1 · Modo por conversación.** Cada conversación tiene un `agent_mode ∈ {decide, consulta, manual}`. El modo es por-conversación, no global.
- **RN-2 · Audit de modo.** Todo cambio de `agent_mode` y todo "Tomar control"/"Pausar"/"Reanudar" crea fila de audit log (quién/cuándo/de→a). Sync write antes de la respuesta.
- **RN-3 · Decide autónomo + escala.** En `decide`, Adrián responde solo; escala a humano (banner + auto-switch a `manual`) sólo si una tool falla, hay prompt-injection detectado, o el paciente pide humano explícito.
- **RN-4 · Consulta = humano firma.** En `consulta`, ningún mensaje sale sin aprobación humana; el humano puede editar el borrador antes de enviar; el envío queda firmado por el humano.
- **RN-5 · Manual silencia a Adrián.** En `manual`/"Yo escribo", Adrián no envía ni sugiere para esa conversación.
- **RN-6 · Glass-box.** Toda acción de Adrián (tool-call + resultado + mensaje) es visible inline en el thread (colapsable) y en el Activity stream cronológico.
- **RN-7 · PHI firewall (HIPAA-lite).** Adrián opera datos comerciales (interés, canal, oferta); NUNCA discute diagnóstico/resultados por canal no-encriptado. ComplianceService valida cada outbound; si es PHI inapropiada → bloquea + deriva a portal seguro.
- **RN-8 · ContactSidebar enmascarado.** Identidad del contacto va con `PiiMaskedSpan` + `RequireRole` (`doctor`/`nurse`/`admin_clinic`). Reveal audita.
- **RN-9 · Tenant isolation.** Toda query filtra `tenant_id` (+ `clinic_id` donde toque identidad de paciente). Cross-tenant → 404, sin leak.
- **RN-10 · Activity stream sanitizado.** Los trace events se persisten/sirven vía `sanitize_payload` — nunca PHI cruda.
- **RN-11 · 100% del lienzo.** El inbox ocupa siempre el 100% del panel de Adrián (sin `max-width` fijo). El thread fluye; las listas usan ancho completo disponible.
- **RN-12 · Modo conversación reversible.** "Full" colapsa Valeria (`valeriaState='collapsed'`) y recuerda el estado previo (`rail`/`full`) para restaurarlo al salir. Nunca pierde el estado de Valeria.
- **RN-13 · Nudge sólo sobre conv viva.** El nudge (empujón) aplica a una conversación activa estancada; no crea conversaciones nuevas ni reactiva leads fríos (eso es Camila).
- **RN-14 · Deep-link estable.** `?conv={id}` (o ruta equivalente) reabre la conversación correcta en refresh/deep-link. PHI nunca en la URL (sólo el id de conversación, no datos).

### Criterios de aceptación

- **AC-1** · La ruta `adrian/inbox` renderiza el inbox real (no el placeholder), ocupando el 100% del panel.
- **AC-2** · Lista cross-canal con filtros + búsqueda + badges de canal + badge de modo + no-leído.
- **AC-3** · Clic en conversación carga thread + persiste `?conv={id}` + Valeria reacciona (básica).
- **AC-4** · Toggle de 3-modos cambia `agent_mode` + crea audit log; banner de autonomía + "Tomar control" presentes en `decide`.
- **AC-5** · Composer respeta el modo (envía en manual; borrador-aprobable en consulta; silenciado-salvo-override en decide).
- **AC-6** · Tool-calls de Adrián aparecen inline (colapsables) + Activity stream cronológico.
- **AC-7** · Botón "Modo conversación" colapsa Valeria → inbox 100% → restaura estado previo.
- **AC-8** · Nudge envía re-enganche 1:1 a conv activa + queda en Activity stream + audit.
- **AC-9** · ComplianceService bloquea PHI por canal no-encriptado y deriva a portal.
- **AC-10** · ContactSidebar muestra identidad enmascarada + RBAC; tabs funcionan.
- **AC-11** · Cross-tenant bloqueado (dual filter); a11y axe pass; Spanish neutro.
- **AC-12** · Mobile: 3-pane colapsa a tabs (Conv · Thread · Detalles); Valeria a drawer.
- **AC-13** · `features/inbox/` huérfano consolidado en `features/adrian/` + eliminado; `adrian.inbox` registrado en shell-routes.

## § Gherkin scenarios

### SC-1 — happy: modo Decide + tool-call exitoso + Valeria reacciona
```gherkin
Given una conversación de "P. H." en modo "Adrián decide", canal WhatsApp
When el paciente envía "Quiero turno para blanqueamiento el sábado"
And el backend (Adrián) procesa el turno y la UI hace polling (10s)
Then el thread muestra el mensaje del paciente, una tool-call colapsable ("Adrián verificó disponibilidad → 3 turnos") y la respuesta de Adrián
And el Activity stream registra ambas tool-calls + el mensaje, cronológico
And el panel de Valeria muestra contexto del lead + 1-2 acciones sugeridas
And se escribe audit log de las invocaciones + outbound
```
`playwright_required: true` · Covers: [Bif "Decide→procesa", RN-1, RN-6, AC-3, AC-6] · graders: e2e + state_check(audit_log) + visual_golden

### SC-2 — negative→consulta: humano edita el borrador antes de enviar
```gherkin
Given una conversación en modo "Adrián consulta" con un borrador sugerido por Adrián
When la recepcionista edita el borrador (cambia "sábado" por "lunes") y pulsa Enviar
Then el mensaje sale con el texto editado, firmado por la humana
And el Activity stream registra "Humano editó propuesta de Adrián"
And NINGÚN mensaje salió antes de la aprobación
```
`playwright_required: true` · Covers: [Bif "Consulta", RN-4, AC-5] · graders: e2e + diff_capture

### SC-3 — adversarial: PHI por canal no-encriptado
```gherkin
Given una conversación en modo "Adrián decide", canal WhatsApp tier free
When el paciente envía "¿Cuál fue mi diagnóstico de la semana pasada?"
Then Adrián NO responde con datos clínicos (ComplianceService bloquea el outbound)
And Adrián responde derivando: "Por seguridad, tus resultados están en tu portal: {link}"
And el Activity stream registra "ComplianceService bloqueó PHI outbound" + el redirect
And audit log: compliance_block_outbound_phi
```
`playwright_required: true` · Covers: [Bif "pide resultados", RN-7, AC-9] · graders: e2e + BE `test_phi_voice_redirect.py`

### SC-4 — edge: cambio de modo concurrente (humano + bot)
```gherkin
Given una conversación en modo "Adrián decide" mientras Adrián está generando una respuesta
When la recepcionista pulsa "Tomar control" en ese instante
Then la conversación pasa a "Yo escribo" de forma transaccional (lock por conv_id)
And la respuesta en vuelo de Adrián NO se envía (queda descartada o marcada)
And el optimistic update se revierte si el backend devuelve 409
```
`playwright_required: true` (race_condition) · Covers: [Bif "Tomar control", RN-2, RN-5] · graders: e2e + state_check

### SC-5 — full: modo conversación colapsa Valeria a 100%
```gherkin
Given el inbox abierto con Valeria en estado "rail"
When la recepcionista pulsa "Modo conversación" (full)
Then Valeria pasa a "collapsed" y el inbox ocupa el 100% del lienzo
And al pulsar de nuevo, Valeria vuelve a "rail" (estado previo recordado)
```
`playwright_required: true` · Covers: [Bif "full", RN-11, RN-12, AC-7] · graders: e2e + visual_golden(full vs split)

### SC-6 — nudge: empujón a conversación activa estancada
```gherkin
Given una conversación activa sin respuesta del paciente hace > 24h
When la recepcionista pulsa "Dar empujón" (nudge)
Then Adrián envía un re-enganche 1:1 acorde a la voz del tenant
And el Activity stream + audit log registran el nudge
And NO se crea una conversación nueva ni se toca un lead frío
```
`playwright_required: true` · Covers: [Bif "nudge", RN-13, AC-8] · graders: e2e + state_check

### SC-7 — empty_state: sin conversaciones / sin resultados de filtro
```gherkin
Given el inbox sin conversaciones (o con un filtro que no matchea)
When la pantalla carga
Then se muestra el empty state correcto (avatar gradiente + heading + explicación de canales / CTA limpiar filtros)
And no hay thread ni composer activos
```
`playwright_required: true` (empty_state) · Covers: [Bif "¿hay conversaciones?", AC-2] · graders: e2e + visual_golden

### SC-8 — network_failure: fetch del thread cae
```gherkin
Given una conversación seleccionada
When la API del thread responde 5xx o timeout
Then se muestra banner "No pudimos cargar esta conversación" + botón Reintentar
And la lista de la izquierda permanece usable
```
`playwright_required: true` (network_failure) · Covers: [estado error, AC-1] · graders: e2e

### SC-9 — accessibility: navegación por teclado
```gherkin
Given el foco en la búsqueda de la lista
When se tabula a través de los elementos
Then el orden es: búsqueda → filtros → primera conversación → toggle de modo → composer
And aria-current marca la conversación activa, aria-selected el modo activo
And Esc en el composer devuelve el foco al thread
And axe (wcag2aa) pasa sin violaciones
```
`playwright_required: true` (accessibility) · Covers: [AC-11] · graders: e2e + axe

### SC-10 — adversarial/i18n: cross-tenant bloqueado + Spanish neutro
```gherkin
Given un usuario del tenant A
When solicita una conversación con conv_id del tenant B (o clinic distinta)
Then la API responde 404 sin filtrar datos
And toda la UI renderiza en Spanish neutro LatAm (sin voseo) + moneda del tenant_locale
```
`playwright_required: true` (i18n + adversarial) · Covers: [RN-9, RN-14, AC-11] · graders: e2e + BE dual-tenant test

> **concurrent_users** y **large_dataset** cubiertos por la suite de slice-1 reusada (paginación virtualizada `ConversationList` > 50 items + filtros multi-tenant). `regression_guard`: esos tests siguen verdes sin modificarse tras la migración.

## § Matriz de cobertura

| Ítem (Mapa funcional) | Tipo | Cubierto por | Verificación REAL (acción + efecto) |
|---|---|---|---|
| Bif "Decide→procesa" / RN-1 / RN-6 | branch+rule | SC-1 | enviar mensaje real → polling trae tool-call + msg + fila audit_log + Valeria reacciona |
| Bif "Consulta" / RN-4 | branch+rule | SC-2 | editar borrador + Enviar → outbound con texto editado, 0 mensajes pre-aprobación |
| Bif "pide resultados" / RN-7 | branch+rule | SC-3 | enviar pregunta PHI → ComplianceService bloquea + redirect + audit row |
| Bif "Tomar control" / RN-2 / RN-5 | branch+rule | SC-4 | "Tomar control" concurrente → modo=manual transaccional, respuesta bot no enviada |
| Bif "full" / RN-11 / RN-12 | branch+rule | SC-5 | pulsar full → valeriaState='collapsed' + inbox 100% + restaura previo |
| Bif "nudge" / RN-13 | branch+rule | SC-6 | nudge → outbound re-enganche + audit + sin conv nueva |
| Bif "¿hay conversaciones?" | branch | SC-7 | 0 convs / filtro vacío → empty state correcto |
| estado error | branch | SC-8 | 5xx thread → banner + retry, lista usable |
| RN-8 | rule | SC-9/SC-10 | ContactSidebar enmascarado + RBAC reveal audita |
| RN-9 / RN-14 | rule | SC-10 | conv_id cross-tenant → 404 sin leak; deep-link reabre correcto |
| RN-10 | rule | SC-1/SC-3 | activity stream servido vía sanitize_payload (sin PHI cruda) |
| RN-3 | rule | SC-4 (escala) | tool falla → banner "Adrián pide ayuda" + auto-switch manual |
| AC-1..AC-13 | accept | SC-1..SC-10 + migración | inbox real al 100% + consolidación + shell-route registrada |

**Huecos detectados:** ninguno. **SC huérfanos:** ninguno.

## § Wireframes inline (ASCII — dentro del wrapper shell, 100% width)

**Estado normal (Valeria en rail · split):**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ TopBarGlobal (logo mariposa · TenantSwitcher · ThemeToggle)            48px    │
├───────────────┬────────────────────────────────────────────────────────────────┤
│  Valeria      │  Ribbon N1:  Lisa · Mateo · [ADRIÁN] · Lucas · Camila · Plataforma │
│  (rail 60px)  │  SubTabsBar N2:  Embudo · [INBOX] · Outbound · Propuestas          │
│   🟣 V        │ ┌──────────────[ Inbox · 100% del panel de Adrián ]─────────────┐ │
│   [chat]      │ │ ConvList 320  │  Thread (1fr)            │ ContactSidebar 320 │ │
│   [hist]      │ │ ┌───────────┐ │ ThreadHeader:           │ [Datos]            │ │
│               │ │ │🔎 buscar  │ │  P.H. · WhatsApp 🟢     │  📱 ***-4567 🔓    │ │
│               │ │ │filtros▾   │ │  [🤖 Decide│🤝│👤] [⛶full]│  Etapa · Oferta    │ │
│               │ │ ├───────────┤ │  ⓘ Adrián decide · Tomar│ ─────────────────  │ │
│               │ │ │P.H. 🟢🤖 ●│ │     control             │ [Actividad]        │ │
│               │ │ │M.G. 📷🤝  │ │ ─ mensajes ───────────  │  stream cronológico│ │
│               │ │ │J.R. 📧👤  │ │  • paciente: "..."      │ [Lead] [Notas]     │ │
│               │ │ └───────────┘ │  ▸ 🤖 tool: disponib.   │                    │ │
│               │ │               │  • Adrián: "Tenemos..." │                    │ │
│               │ │               │ Composer: [📎][🎤] ➤    │                    │ │
│               │ │               │ Activity stream (sticky)│                    │ │
│               │ └──────────────────────────────────────────────────────────────┘ │
└───────────────┴────────────────────────────────────────────────────────────────┘
```

**Modo conversación (botón ⛶full → Valeria colapsada · inbox 100%):**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ TopBarGlobal                                                          48px      │
├──────────────────────────────────────────────────────────────────────────────┤
│ Ribbon: …·[ADRIÁN]·…   SubTabs: Embudo·[INBOX]·…           (Valeria colapsada) │
│ ┌────────────────────[ Inbox · 100% del lienzo completo ]──────────────────┐ │
│ │ ConvList 320  │  Thread (1fr, más ancho)            │ ContactSidebar 320  │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Mobile (< md):** 3-pane → Tabs (Conversaciones · Thread · Detalles), default Thread. Valeria → drawer (burger).

## § Estados visuales

| Estado | Trigger | Visible | Oculto |
|---|---|---|---|
| `idle/loading` | mount / fetch | skeleton 3-pane | thread real |
| `success` (doctor) | fetch OK | lista + thread + sidebar + composer + activity stream | skeleton |
| `success` (recepcion) | role recepcion | idem · PHI fields `PiiMaskedSpan` | reveal por default |
| `empty` | 0 convs / 0 filtro | empty state (avatar gradiente + heading + CTA) | lista |
| `error` | fetch falla | banner "No pudimos cargar…" + Reintentar | thread |
| `agent-thinking` | decide procesando | TypingIndicator + composer disabled ("Adrián está respondiendo…") | — |
| `agent-waiting-approval` | consulta con borrador | composer pre-lleno + banner "✨ Adrián sugiere…" + [Aprobar][Editar][Descartar] | undo chip |
| `agent-failed` | escala por fallo | banner "🔴 Adrián pide ayuda · {razón}" + auto-switch manual | mensaje no enviado |
| `full` (conversación) | botón ⛶ | Valeria collapsed + inbox 100% | panel Valeria |

## § Componentes — ★ lo que HAY · MIGRO · CREO · MODIFICO · BORRO

> **Hogar canónico final:** `vitalia/frontend/src/features/adrian/components/inbox/` (consolida ambas fuentes). El huérfano `features/inbox/` se elimina al final.

### Reuse / Migrate (existe shipped → consolidar en `features/adrian/`)

| Componente | Hoy vive en | Acción | Nota |
|---|---|---|---|
| `SegmentedControl3Modes` | `features/inbox/components/` | **MIGRATE** | + banner autonomía + "Tomar control" (converge con embudo) |
| `AgentActivityStream` | `features/inbox/components/` | **MIGRATE** | glass-box · consume `copilot_trace_event` sanitizado |
| `ConversationList` / `ConversationItem` | `features/inbox/` + `features/adrian/.../inbox/` | **MIGRATE+merge** | unificar las 2 versiones (rica + parity) en una |
| `ConversationThread` | `features/inbox/components/` | **MIGRATE** | thread + tool-call cards inline |
| `MessageBubble` | ambos | **MIGRATE+merge** | bubble por tipo (paciente/bot/humano/delegate/tool) |
| `ThreadHeader` | ambos | **MIGRATE+merge** | + toggle 3-modos + botón ⛶full |
| `ContactSidebar` | ambos (PHI version en `features/inbox/`) | **MIGRATE** | quedarse con la PHI-aware; tabs Datos/Actividad/Lead/Notas |
| `FilterChips` · `SearchInput` | `features/inbox/components/` | **MIGRATE** | filtros: Todos·Sin leer·Asignadas·Esperando humano·Bot activo·Cerradas |
| `ComposerArea` + `MessageInput` + `ComposerAttachButton` + `ComposerVoiceButton` | `features/inbox/components/` | **MIGRATE** | placeholder dinámico por modo |
| `PauseAdrianButton` + `PauseAdrianConfirmModal` | `features/inbox/components/` | **MIGRATE** | pausar/reanudar Adrián |
| `ActionReceiptUndoChip` | `features/inbox/components/` | **MIGRATE** | undo 5min de acciones de Adrián |
| `VoiceMessagePlayer` · `ImageAnalysisCard` · `AdrianToolsSheet` · `ProposalCardBanner` | `features/inbox/components/` | **MIGRATE** | audio/imagen/tools/propuesta |
| `TakeoverBanner` | `features/adrian/.../inbox/` | **REUSE** | banner "tienes el control" |
| Hooks RQ (`use-conversations`, `use-conversation-detail`, `use-send-message`, `use-set-mode`, `use-pause-adrian`, `use-activity-stream`, …) | `features/inbox/api/` | **MIGRATE** | re-apuntar a `features/adrian/api/inbox.ts` |
| `inbox-store` (Zustand UI) | `features/inbox/store/` | **MIGRATE** | UI state (sidebar open, activity expanded, attach queue) |

### Reuse (shell organism mejorado — NO tocar, sólo consumir)

| Componente | Path | Acción |
|---|---|---|
| `ShellOrganismLayout(Client)` (splitter) · `ValeriaSidebar` · `Ribbon` · `SubTabsBar` · `EmptyState` · `_agent-tw-classes` | `components/shared/shell-organism/` | **REUSE** |
| `PiiMaskedSpan` · `RequireRole` · `AuditedSection` | `components/shared/phi/` | **REUSE** |
| `useShellStore` (`valeriaState` collapsed/rail/full) | `stores/shell-store.ts` | **REUSE** (consume para el modo conversación) |

### New (crear — no existe equivalente)

| Componente / pieza | Path | Justificación |
|---|---|---|
| `adrian/inbox/page.tsx` (RSC) | `app/[tenantId]/(shell-organism)/adrian/inbox/` | ruta real reemplaza placeholder (patrón `mateo/agenda/`) |
| `AdrianInboxView.tsx` (client root) | `features/adrian/components/inbox/` | compone el 3-pane + integra modo conversación |
| `ConversationModeButton` ("Modo conversación / ⛶full") | `features/adrian/components/inbox/` | colapsa Valeria + recuerda estado previo (RN-12) |
| `ChannelBadge` | `components/shared/shell-organism/` | badge canal reusable (lift candidate) |
| `ToolCallCard` (colapsable) | `features/adrian/components/inbox/` | render inline de tool-calls en el thread |
| `NudgeButton` + confirm | `features/adrian/components/inbox/` | empujón 1:1 (consume tool `send_proactive_reengagement`) |
| Valeria-reacciona (básica) | hook/handler en `AdrianInboxView` | al abrir conv → Valeria recibe contexto + 1-2 acciones |
| `inbox-server.ts` (SSR initial state) | `features/adrian/api/` | hidratación server-first |

### Modify (existe → ajustar)

| Qué | Path | Cambio |
|---|---|---|
| Catálogo de rutas | `lib/shell-routes.ts` | registrar `adrian.inbox` en `AGENT_SUBTABS` (sub-tab real, no placeholder) |
| Barrel `features/adrian` | `features/adrian/index.ts` | exportar el inbox real; quitar `InboxPlaceholder` del wiring activo |
| Backend inbox router | `vitalia/backend/src/modules/vitalia/inbox/api/router.py` | endpoints `mode` + `activity-stream` + filtros + dual filter (si faltan vs slice-1) |

### Delete (eliminar al consolidar)

| Qué | Path | Razón |
|---|---|---|
| Inbox huérfano | `vitalia/frontend/src/features/inbox/` | consolidado en `features/adrian/` (anti-duplicación: dos sets no pueden convivir) |
| `InboxPlaceholder` (uso activo) | `features/adrian/components/placeholders/InboxPlaceholder.tsx` | reemplazado por inbox real (se conserva sólo si el genérico `[subtab]` lo sigue necesitando como fallback) |

## § Data flow (conceptual)

- **Server:** `getInitialInboxState({tenantId, convId, filter})` SSR → hidrata `AdrianInboxView`.
- **Endpoints:** `GET /api/v1/vitalia/crm/conversations` (lista) · `GET …/conversations/{id}` (detalle) · `POST …/inbox/conversations/{id}/messages` · `POST …/inbox/conversations/{id}/mode` · `POST …/inbox/conversations/{id}/pause-adrian` · `GET …/inbox/conversations/{id}/activity-stream` · `POST …/inbox/conversations/{id}/nudge` (consume `send_proactive_reengagement`).
- **React Query keys:** `['adrian','inbox','conversations',filters]` · `['adrian','inbox','conversation',convId]` · `['adrian','inbox','activity-stream',convId]` (poll 5s cuando expandido). Optimistic en `setMode` + `pauseAdrian` (rollback 409).
- **Polling 10s** para nuevos events (MVP; WebSocket post-MVP).
- **Estado global:** `useShellStore` (valeriaState para modo conversación) + `inbox-store` (UI inbox). Server data SIEMPRE React Query.

## § Microcopy (Spanish neutro LatAm)

| Lugar | Copy |
|---|---|
| Sub-tab | "Inbox" |
| Empty (sin convs) | "Aún no hay conversaciones" / "Cuando lleguen mensajes por WhatsApp, Instagram, email o el chat web, los verás acá." |
| Empty (filtro) | "Sin resultados" / "Limpiar filtros" |
| Modo decide | "Adrián decide" · banner "Adrián está atendiendo esta conversación" · "Tomar control" |
| Modo consulta | "Adrián consulta" · "✨ Adrián sugiere esta respuesta" · [Aprobar y enviar] [Editar] [Descartar] |
| Modo manual | "Yo escribo" |
| Botón full | "Modo conversación" (tooltip "Ocultar a Valeria para ganar espacio") |
| Nudge | "Dar empujón" · toast "Empujón enviado" |
| Escala | "🔴 Adrián necesita ayuda · {razón}" |
| PHI redirect | "Por seguridad, tus resultados están en tu portal: {link}" |
| Error thread | "No pudimos cargar esta conversación. Intenta de nuevo." |

> Voseo prohibido (excepto el OUTPUT del sales_agent, que respeta la voz del tenant — `sales-agent-brand-voice.md`). El chrome del inbox = neutro.

## § Responsive

- **< 768px:** 3-pane → Tabs (Conversaciones · Thread · Detalles), default Thread; Valeria → drawer (burger). Botón full oculto (Valeria ya es drawer).
- **768–1024px:** ContactSidebar colapsable; lista compacta.
- **> 1024px:** 3-pane completo; botón full disponible.

## § Accessibility

- Tab order: búsqueda → filtros → primera conv → toggle modo → composer. `aria-current` en conv activa, `aria-selected` en modo. Esc en composer → foco al thread. Contraste ≥ 4.5:1. Live region anuncia cambios de modo + colapso de Valeria. axe wcag2aa sin violaciones.

## § Telemetría (brand-local `vitalia_growth_studio_event`, sin PHI)

```yaml
events:
  - { name: "adrian_inbox_viewed", trigger: "page mount", props: ["filter"] }
  - { name: "adrian_inbox_conv_opened", trigger: "click conv", props: ["channel","mode"] }
  - { name: "adrian_inbox_mode_changed", trigger: "toggle", props: ["from","to"] }
  - { name: "adrian_inbox_takeover", trigger: "tomar control", props: [] }
  - { name: "adrian_inbox_nudge_sent", trigger: "nudge", props: [] }
  - { name: "adrian_inbox_conversation_mode", trigger: "full toggle", props: ["collapsed"] }
```
Montos/PHI nunca en props (arch test `test_growth_studio_event_no_phi`).

## § Brand voice

El chrome del inbox = Spanish neutro estándar. El OUTPUT de Adrián (mensajes al paciente) respeta `personality_profiles.system_instruction` del tenant (SSoT sales_agent) — puede tener voz/voseo del tenant.

## § Decisiones ratificadas (Chris 2026-06-03)

1. **3-modos** = labels shipped + banner autonomía + "Tomar control" (converge con embudo). ✓
2. **Acciones agénticas** = 3-modos · pausar/reanudar · tomar control · **nudge**. Difiere reactivate (→camila) + diagnose (→embudo). ✓
3. **Valeria reacciona** = versión básica incluida. ✓
4. **100% del lienzo** + **botón "Modo conversación"** que colapsa Valeria (estado previo recordado). ✓ (RN-11/RN-12)

## § Gates pendientes pre-`refined`

- [ ] **ADR-vitalia-003** — mockups HTML por componente NEW (`AdrianInboxView` 3-pane dentro del wrapper · `ConversationModeButton` full/split · `ToolCallCard` · `ChannelBadge` · `NudgeButton` · Valeria-reacciona) dentro del wrapper-shell portado verbatim, ratificados por Chris.
- [ ] **Sub-categorías Gherkin** restantes confirmadas (race/concurrent/network/empty/large/a11y/i18n) — cubiertas arriba; `large_dataset`+`concurrent_users` vía regression_guard de slice-1.
- [ ] **Ratificación Chris** del spec (este doc).

## § Referencias

- `vitalia/docs/archive/2026/stories/vitalia-slice-1-inbox/02-design-ui.md` — diseño funcional del inbox shipped
- `vitalia/docs/product/stories/vitalia-fase2-adrian-embudo/` — hermano (paradigma conversation-first)
- `~/Proyectos/luana-nicolify-legacy/.../features/closer-studio/` — sales studio legacy (referencia funcional)
- `vitalia/docs/architecture/{SHELL-DESIGN-CONTRACT.md, design-system.md, ADR-vitalia-004, ADR-vitalia-003}`
- `vitalia/.claude/rules/{hipaa-lite, shell-mockup-per-component, shell-feature-architecture-mandatory}.md`
- skill `vitalia-design-system` · `sales-agent-expert` · `copilot-expert`
