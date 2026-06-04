---
story_id: vitalia-fase2-adrian-inbox
type: ui-story
agent_owner: adrian
map_zone: agentes
map_box: adrian
module: inbox
capability: adrian.inbox
state: developing
autonomous_mode: false
phase: LIVE_VERIFY_BUGFIX
architecture_pattern: ADR-vitalia-004
adr_004_compliance: full
state_prev: developed
last_modified: '2026-06-04T01:40:00.000Z'
live_verify_env: "dev-app.vitalialat.com (canonical) — NOT localhost:3002 (no /api proxy there)"
live_verify_fixed:
  - "NuqsAdapter wrap (page crashed: NUQS-404) — real fix"
  - "crm conversations path vitalia/crm → crm (BE mounts crm at /api/v1/crm) — real fix"
  - "3-pane layout v3→flex (react-resizable-panels v4 ignored defaultSize → 6/88/6%) — real fix"
  - "?_rsc= loop: WAS localhost-only artifact (failing /api cascade) — ZERO on dev-app — resolved by correct env"
  - "/api 404: WAS localhost-only (no /api proxy on :3002) — dev-app tunnel maps /api→BE (health 200) — resolved by correct env"
live_verify_fixed_2:
  - "RBAC: list_conversations/get_conversation_detail allow _INBOX_OPERATOR_ROLES (owner+receptionist+PHI roles) — Chris ratified. Verified LIVE dev-app: dr.demo 403→200, inbox renders CLEAN empty state (no error). Commit 9103bbb7."
live_verify_fixed_3:
  - "BE un-stub: list_conversations + get_conversation_detail wired to ConversationRepository (dual filter) — were slice-1 stubs. Commit 38c1ff40."
  - "FE contract adapt: use-conversations maps BE {items,limit,offset} → FE {conversations,page,page_size} (was reading data.conversations of an {items} response → empty)."
  - "Seed: scripts/seed_inbox_conversations.sql (2 dental conversations, Sanaré). VERIFIED LIVE dev-app: inbox renders 2 real conversations (whatsapp 'limpieza' Interesado · instagram 'blanqueamiento' Calificando + pide-ayuda + media badge)."
live_verify_fixed_4:
  - "patientName resolved: use-leads path fix (vitalia/crm/leads→crm/leads) + shape adapt ({items}→{leads}) + ConversationListPanel wires useLeads→lead_id→name map→getPatientName. Commit 364f4138. VERIFIED LIVE: list shows 'Carlos Ramírez Ortega' + 'Persistencia Verificada' (was '—')."
live_verify_fixed_5:
  - "★ THREAD un-block (AC-3/AC-6): crm get_conversation_detail devolvía ConversationListItem lean → FE espera compound → detail.messages undefined → thread crasheaba ('no aparece nada'). FIX: nuevo ConversationDetailResponse (conversation+lead+messages+action_receipts+tools_state) cableado al endpoint (ConversationRepository+MessageRepository+LeadRepository decrypt). + seed_inbox_messages.sql (3+5 msgs). VERIFIED LIVE dev-app: thread renderiza Carlos Ramírez Ortega + WHATSAPP + 3-mode toggle (Decide✓/Consulta/Yo escribo) + Pausar Adrián + Dar empujón + 3 mensajes. GET /conversations/{id} 200 con payload completo (lead phone/email + messages). 0 console errors (solo favicon 500 pre-existente). Commit pendiente."
  - "AC-10 contact wiring fix: AdrianInboxView pasaba conv_id como leadId/patientId → ContactSidebar vacío. FIX: useConversationDetail (RQ dedup) → contact desde detail.lead (name/phone/email/stage). tsc clean. ⚠️ live re-verify INTERRUMPIDO por desconexión Chrome MCP (re-verificar próxima)."
live_verify_open:
  - "RE-VERIFICAR LIVE (MCP cayó): ContactSidebar muestra phone/email/name/stage de Carlos tras el wiring fix (tsc clean, lógica correcta, requiere touch+hard-reload por stale-bundle HMR)."
  - "AC-9 PENDIENTE: ComplianceService sigue NoOp en router DI (lines 266/311) pese a phi_channel_policy.py existir → wire DI real + verificar block PHI outbound."
  - "T-6 PENDIENTE (DoD #37): e2e reales sin mock de SC-1..SC-10 + axe + visual goldens + demo-script."
  - "Verificar LIVE AC-4 (mode change escribe audit) · AC-5 (composer por modo) · AC-7 (full colapsa Valeria) · AC-8 (nudge envía) ejerciendo la acción real + logs."
  - "PRE-EXISTING (not mine): crm conversation tests (test_router_conversations_list/detail.py) red on async-mock infra. Follow-up."
live_verify_fixed_6:
  - "AC-9 compliance UN-STUB: ComplianceService(PhiChannelPolicy) cableado en send/proactive/nudge DI (era _NoOpComplianceService). 13 tests PHI verdes. Commit af4f94a2."
  - "AC-6/AC-7 activity stream: ActivityStream estaba montado SOLO en InboxPageClient (root muerto), NO en AdrianInboxView (activo) → no visible. FIX: montado en InboxThread (glass-box). Verificado e2e."
  - "?lead= → ?conv= : spec RN-14/AC-3 manda ?conv={id}. Mi impl deviaba a ?lead= (caught por e2e deep-link spec). Renombrado el param nuqs lead→conv en todo el inbox (schema + 6 consumers + tests). tsc 0, 21 unit/arch verdes."
live_verify_fixed_7:
  - "telemetry-404 RESUELTO (Chris opción A): creado POST /api/telemetry/growth-studio-event (telemetry_router.py · _shared/telemetry/api/ · resuelve ctx vía ClinicResolver · valida event_type snake_case ≤64 · delega a GrowthStudioEmitter fire-forget · 202) + cableado en main.py + telemetry.ts FE pasado de fetch crudo a fetchClient (auth-aware, skip sin token/tenant) + ValeriaAgendaView pasa auth ctx. BE 17 tests verdes (5 router + arch response_model + telemetry whitelist), FE tsc 0 + eslint 0 + 23 vitest verdes. VERIFIED LIVE dev-app: endpoint pasó de 404 → 422 (no-auth probe = router montado). Los 3 e2e tenant que el handoff atribuía SOLO a telemetry: los i18n/neutro (:101+) ahora VERDES (telemetry-404 eliminado de la consola)."
live_verify_fixed_8:
  - "audit-log-404 TWIN RESUELTO (Chris decisión A, post-investigación: server-side get_conversation_detail NO audita la lectura PHI → endpoint necesario, no B): creado POST /api/v1/vitalia/audit-log (audit/api/audit_log_router.py · ClinicResolver + resolve users.id UUID del Clerk sub + resource_id UUID guard + AsyncAuditWriter sync write committing) + cableado main.py + AuditedSection FE: raw fetch → fetchClient + skip si falta clinicId/resourceId. BE 4 tests + arch response_model verdes. Commit 0b752040 (pushed). VERIFIED LIVE dev-app: 404 → 422 (router montado). FOLLOW-UP (crm bajo lock embudo): mover audit server-side a get_conversation_detail."
  - "telemetry clinic-guard refinement: telemetry.ts + AuditedSection ahora SKIP si falta clinicId (endpoint clinic-scoped → sin X-Clinic-ID daba 422 al firarse desde contexto transitorio sin clinic). FE tsc 0 + eslint 0 + 24 vitest verdes."
  - "test-design SC-10 (Chris aprobó): POM AdrianInboxPage.errorBanner selector roto (thread-error-banner → conversation-thread-error, scoped a inbox-desktop por duplicado responsive) + :43 reestructurado (test.use failOnRuntimeError:false para el 404 cross-tenant DELIBERADO = prueba de aislamiento; assert status 404 + error-state visible + 0 message-bubbles). VERIFIED LIVE: tenant spec 10/10 GREEN (telemetry+audit 404s eliminados)."
e2e_suite_status_2026_06_04_pm:
  tenant: "10/10 GREEN (dev-app) — telemetry-404 + audit-log-404 + cross-tenant test-design todos resueltos."
  full_inbox: "24 passed / 5 failed (dev-app · modes+states specs). Los 5 rojos NO son de mis cambios ni de los endpoints: son fragilidad PRE-EXISTENTE del helper de los specs — `page.locator('[data-testid=\"conversation-thread\"]').first().waitFor(visible)` sobre un testid DUPLICADO (inbox-desktop + inbox-mobile responsive) → .first() resuelve al layout OCULTO → timeout 15s. MISMA causa raíz que el errorBanner que arreglé. Cubre AC-4/5/7 (decide/consulta/manual · composer-por-modo · Modo-conversación colapsa Valeria RN-12). El thread SÍ abre live (tenant :76 'deep-link open conv' PASA). El handoff decía 'modes 6 pass / ~28 green' = INEXACTO (patrón: el handoff ya erró en atribuir-todo-a-telemetry + el defer_audit embudo fabricado)."
  decision_pending_chris: "Arreglar el helper de modes/states (target del thread VISIBLE — mismo fix que errorBanner: scope a inbox-desktop o :visible) → completa la suite limpia + la verificación live de AC-4/5/7. O Chris inspecciona primero. NO encadenar a /auditor sin su prueba+sign-off (regla dura)."
  shell_split_decision_2026_06_04: "★ Chris (2026-06-04) ratificó: el inbox-FEATURE (telemetry-404 ✅ + audit-log-404 twin ✅ + SC-10 tenant 10/10 ✅, commits af035e69/0b752040/587766fc + embudo-fix 821ef027 + modes-scope d41102c3) queda CERRADO a nivel feature. Los 3 hallazgos shell/styling que bloquean AC-4/5/7 + AC-12 se SPLITean a una BUGFIX STORY de SHELL dedicada (#1 responsive Valeria-squeeze + #2 dark-mode token audit; #3 ContactSidebarToggle ya existe). Repro completo: observed-bugs/2026-06-04-shell-valeria-squeeze-plus-darkmode.md. El inbox NO es `done` overall hasta que (a) el shell-fix desbloquee + verifique AC-4/5/7 + AC-12 live, (b) Chris demo sign-off (DoD #37). NO encadenar /auditor sin eso."
  modes_deeper_finding_2026_06_04: "★ El fix NO era trivial. Cambié los 8 sitios `conversation-thread`.first().waitFor → `[inbox-desktop] [conversation-thread]`.waitFor PERO SIGUEN ROJOS. CAUSA RAÍZ CONFIRMADA via Chrome MCP (DOM live + screenshot, 2026-06-04): es un BUG DE LAYOUT DE PRODUCTO, no de test. Medición live (viewport 1280, Valeria-chat shell ABIERTO): inbox-desktop = 696px (la Valeria-chat se come ~584px). Dentro del inbox-desktop el flex-row = [list w-80=320px][thread flex-1 min-w-0 = 56px][ContactSidebar w-80=320px]. El THREAD se exprime a 56px (sliver vertical ILEGIBLE — confirmado en screenshot). En sesión Playwright fresca la Valeria-chat default es más ancha → inbox-desktop <640 → thread = 0px → Playwright lo ve HIDDEN → timeout 15s. PRE-EXISTENTE (mis cambios no tocan el layout; el live-verify previo 'thread renderiza' debió tener Valeria colapsada). DEFECTO UX REAL: con Valeria-chat + ContactSidebar abiertos el thread del inbox es inusable. FIX = PRODUCTO/ARQUITECTURA (decisión Chris): reflow del inbox por ANCHO DE CONTENEDOR (container query) no por viewport md: → colapsar ContactSidebar cuando el contenedor es angosto, o cambiar a layout tabs/mobile por container-width, o auto-colapsar Valeria para sub-tabs que necesitan ancho. AC-4/5/7 + AC-12 (responsive) tocados. NO es fix de e2e — es fix de cómo el inbox coexiste con la Valeria-sidebar siempre-presente del shell."
e2e_tenant_remaining_red:
  - "★ HALLAZGO (el handoff sobre-atribuía a telemetry): 2 de los 3 tenant specs (:43, :76) NO eran por telemetry. Causas reales: (a) TWIN BUG audit-log — AuditedSection.tsx:93 hace raw fetch POST /api/v1/vitalia/audit-log (ruta BE inexistente) → 404 cada vez que monta ContactSidebar (panel inbox). Mismo patrón que telemetry pero superficie PHI/seguridad → observed-bugs/2026-06-04-fe-audit-log-endpoint-404.md. (b) cross-tenant conv 404 DELIBERADO (aislamiento CORRECTO) que el gate base.ts no exenta → el spec adversarial debería test.use({failOnRuntimeError:false}). (c) :43 además: el inbox NO renderiza error-state reconocible cuando el detail 404 (expect something-renders falla). (d) :76 abre conv 00000…01 de tenant B = probable state-bleed localStorage (cold-start). DECISIÓN PENDIENTE CHRIS: fix audit-log twin (¿crear endpoint o borrar fetch FE si server-side ya audita?) + test-design opt-out + error-state."
e2e_dev_app:
  env: "dev-app.vitalialat.com (Clerk real dr.demo + backend real + seed · 0 mocks en specs core)"
  status: "Specs T-6 NUNCA habían corrido (import path roto ../../→../ + no enganchados a ningún project del playwright.config). Wireados + corridos live."
  result: "~28 passed. Únicos rojos consistentes: 3 tenant specs (43/76/101) por el 404 PRE-EXISTENTE /api/telemetry/growth-studio-event (mateo/telemetry pega a endpoint inexistente → gate anti-burbuja). NO defecto del inbox. Documentado: vitalia/docs/observed-bugs/2026-06-04-fe-telemetry-growth-studio-event-404.md."
  fixes: "POM selectors (getConversationItems→data-testid, mode→segment-{value}, activityStream→agent-activity-stream); deterministic thread-open wait (reemplazó waitForLoadState networkidle race → modes 6 pass)."
live_verify_status: "★ INBOX FUNCIONAL live + e2e reales en dev domain. Thread/modos/take-control/nudge/compliance/contacto/activity-stream verificados. ~28 e2e green; 3 rojos = telemetry-404 pre-existente (no inbox). FALTA para done: (1) resolver/decidir telemetry-404, (2) /auditor, (3) demo sign-off Chris (DoD #37), (4) /pm-vitalia merge. Ver SELF-REVIEW-compliance.md."
ratified_by_chris: true
ratified_at: '2026-06-03T20:23:30.000Z'
po_ux_version: 1
ratified_visual_by_chris: true
ratified_visual_at: '2026-06-03T20:23:30.000Z'
ratified_visual_waiver: >-
  ADR-vitalia-003 mockup-per-component WAIVED por Chris (2026-06-03) — story de
  MIGRACIÓN: los componentes UI ya están shipped + visualmente ratificados en
  slice-1-inbox (02-design-ui-mockup.html, Chris 2026-05-17) + wrapper shell
  ratificado fase 1. Piezas NEW (ConversationModeButton/ChannelBadge/ToolCallCard/
  NudgeButton/Valeria-reacciona) son pequeñas, derivan de tokens+patrones
  existentes, descritas en 01-spec.md § Wireframes + § Estados visuales.
  Ratificación visual real diferida a live-verify dev-app (DoD #37) que es más
  fuerte que mockup (UI real corriendo). No se crea 02-design-ui.md (po-ux fusión:
  el spec es el diseño).
parallel_safe: true
priority: critical
estimated_dev_days: 5-6
dependencies:
  hard:
    - vitalia-fase1-empty-states
    - vitalia-fase1-routing-shell
  soft:
    - vitalia-fase2-adrian-embudo
    - vitalia-fase2-valeria-pacientes
blocks_hard: []
blocks_soft:
  - vitalia-fase2-adrian-embudo
  - vitalia-fase2-camila-voz
reuse_map_summary: >-
  REUSE 95% inbox+sales_agent shipped (LangGraph + tools + canales) · NEW UI
  3-panel (Lista convs · Thread · ContactSidebar) · NEW 3-modos toggle (Decide
  solo · Consulta · Manual) · NEW Activity stream + tools registry view
spawned_at: 2026-05-22T00:00:00.000Z
supersedes:
  - vitalia-slice-1-inbox
next_action: >-
  /dev-team vitalia vitalia-fase2-adrian-inbox autonomous → BE lane (T-1 un-stub
  compliance · T-2 nudge) ∥ FE lane (T-3 ruta+registro · T-4 consolidación+DELETE
  huérfano · T-5 piezas NEW) → T-6 e2e+visual+demo → /auditor (be+fe Opus) → HUMAN
  GATE Chris demo sign-off dev-app (DoD #37) → /pm-vitalia merge done + cap YAML.
  Ready package completo: 03-arch{,-be,-fe} + 04-validators + 05-guidelines +
  06-tickets + dispatch-plan. ★ Reframe arch (código real 2026-06-03): BE inbox +
  modelo + lista YA shipped → trabajo = un-stub ComplianceService + nudge endpoint;
  FE = consolidar features/inbox→features/adrian + DELETE huérfano + piezas NEW.
release: F3
cap_target: adrian.inbox
cap_change_type: fix
parent_story: null
---

# F2-S3 vitalia-fase2-adrian-inbox — checkpoint

## Goal

Sub-tab Inbox de Adrián: bandeja unificada cross-canal (WhatsApp · IG DM · Email · Web chat) donde el agente Adrián opera bajo **paradigma 3-modos** (Decide solo · Consulta · Manual). Layout 3-panel: lista conversaciones izq · thread central · ContactSidebar derecho (PHI masked) + Activity stream chronológico mostrando qué tools invocó el agente. Reemplaza vista inbox shipped en `vitalia/frontend/src/features/inbox/` migrando capability al espacio shell-organism.

## Anti-objetivos

- NO rehacer LangGraph engine (vive en `core/luana-core-sales-agent`)
- NO rehacer adapters de canal (WhatsApp/IG/Email) — vienen del módulo connections shipped
- NO implementar BroadcastChannel real-time (out-of-scope MVP; polling 10s)
- NO implementar Bulk actions multi-conv (story dedicada futura)
- NO tocar `core/luana-core-sales-agent`/`core/luana-core-copilot` (engine read-only)
- NO duplicar prompts del sales-agent (viven en core engine + brand extensions)

## Prior art scan (2026-06-03 · /pm-vitalia · OBLIGATORIO anti-duplication-refining)

> Ejecutado: engine `core/` + vitalia propio (shipped + archive) + legacy nicolify sales studio + embudo sibling. Reframe principal: **esta story es MIGRACIÓN + consolidación, NO build desde cero.**

### Hallazgos

**1 · Inbox YA shipped (slice-1-inbox, done) — código vivo huérfano.** `vitalia/frontend/src/features/inbox/` tiene ~40 componentes evolucionados: `SegmentedControl3Modes` (3-modos Adrián decide·consulta·Yo escribo), `AgentActivityStream` (glass-box), `ContactSidebar` PHI-aware (`PiiMaskedSpan`+`RequireRole`), `ActionReceiptUndoChip` (undo 5min), `PauseAdrianButton`+`PauseAdrianConfirmModal`, `VoiceMessagePlayer`, `ImageAnalysisCard`, `AdrianToolsSheet`, `ProactiveOutboundModal`, `ProposalCardBanner`, `FilterChips`, 8 estados visuales. **Su `page.tsx` se borró en la reorg shell → feature huérfano (no cableado en `app/`).** Es la fuente de comportamiento más rica. Diseño funcional SSoT: `vitalia/docs/archive/2026/stories/vitalia-slice-1-inbox/02-design-ui.md`.

**2 · Subset parity ya portado en F1-S10.** `vitalia/frontend/src/features/adrian/components/inbox/` tiene molecules "sales_studio parity" (T-5/T-6 empty-states): `ConversationItem`, `ContactSidebar`, `ThreadHeader`, `TakeoverBanner`, `MessageBubble`, `MessageInput`, `CampaignTag`, `types.ts`. Es el hogar FSD-Lite shell-organism correcto (`features/adrian/`), pero versión más simple (sin 3-modos/activity-stream/voice/tools).  ⚠️ **Riesgo duplicación:** dos sets de inbox conviven → consolidar en `features/adrian/components/inbox/` reusando la lógica evolucionada de `features/inbox/`, luego borrar el huérfano.

**3 · Legacy nicolify sales studio (`closer-studio`) = sustrato agéntico original.** `~/Proyectos/luana-nicolify-legacy/nicolify/frontend/src/features/closer-studio/` — inbox 3-pane (`InboxView`: ConvList 320 · Thread · ContactSidebar 288 toggle, `?lead={id}` URL + localStorage last-lead) + hooks agénticos `use-conversation-actions` (**stop/resume AI · send · nudge · reactivate · diagnose**) + `use-closer-ws` (websocket realtime) + `use-kpis` + `use-frozen`. El inbox shipped de vitalia ya **evolucionó** estos (binario stop/resume → 3-modos; + activity stream + PHI). Las acciones agénticas legacy (nudge/reactivate/diagnose) NO están todas en el inbox vitalia → candidatas a traer.

**4 · Runtime agéntico vive en `core/` (consumir, no recrear).** Per research embudo (`vitalia-fase2-adrian-embudo/research/02-core-engine.md`): `core/luana-core-sales-agent` (LangGraph + AgentStateCheckpoint + transitions audit + diagnose + KPIs + workers) byte-idéntico al legacy. Brand tools vitalia ya shipped en `vitalia/backend/src/modules/vitalia/sales_agent/tools/` (payment_link, reschedule_appointment, retract_last_message, screening_questions, send_proactive_reengagement). Backend inbox = `vitalia/backend/src/modules/vitalia/inbox/api/router.py`.

**5 · Consistencia con embudo sibling (★ cementado por Chris).** Embudo cementó el **paradigma adrián = conversation-first, agent-operated**: Adrián opera/mueve solo · humano supervisa (Tomar control · instrucción oculta) · **Valeria supervisora reacciona en panel izquierdo** · glass-box explicable · consume sustrato engine · **PHI firewall** (Adrián opera datos de interés, NUNCA clínicos). Detalle entry = página con URL propia (`EntitySubNavBar`, patrón C) presentada como overlay interceptado. **Inbox debe ser consistente.**

### Decisión

| Eje | Decisión prior-art | Acción |
|---|---|---|
| Inbox build | **Migración + consolidación** (reuse ~90% código shipped huérfano) | `/po-ux` enmarca como re-home + re-theme, NO build virgen |
| Hogar canónico | `features/adrian/components/inbox/` (shell-organism FSD) | consolidar lógica de `features/inbox/` ahí + borrar huérfano |
| Runtime agente | **Consumir** `core/luana-core-sales-agent` + brand tools shipped | NO tocar engine (read-only) |
| Paradigma UX | **Consistente con embudo** (Valeria reacciona · 3-modos · glass-box · PHI firewall) | wrapper shell portado verbatim (ADR-003 § wrapper fidelity) |
| Acciones agénticas | Traer nudge/reactivate/diagnose del legacy si aplican al inbox | `/po-ux` decide scope vs diferir |

## Scope verbatim

### § 1 — Page + layout 3-panel

`vitalia/frontend/src/app/[tenantId]/(shell-organism)/adrian/inbox/page.tsx`:

```tsx
import { AdrianInboxView } from '@/features/adrian/components/inbox/AdrianInboxView'
import { getInitialInboxState } from '@/features/adrian/api/inbox-server'

export default async function Page({ params, searchParams }: PageProps) {
  const { tenantId } = await params
  const { conv: convId, filter = 'todos' } = await searchParams
  const initialData = await getInitialInboxState({ tenantId, convId, filter })
  return <AdrianInboxView initialData={initialData} initialConvId={convId} initialFilter={filter} />
}
```

### § 2 — `AdrianInboxView` layout

`vitalia/frontend/src/features/adrian/components/inbox/AdrianInboxView.tsx`:

Grid 3-cols con widths ajustables (resizable handles Shadcn `ResizablePanelGroup`):

```
[ConvList 320px] [Thread 1fr] [ContactSidebar 320px]
```

Mobile (`<md`): Tabs en lugar de 3-panel (Conv · Thread · Detalles). Default Thread activo.

### § 3 — `InboxConvList` panel izquierdo

`vitalia/frontend/src/features/adrian/components/inbox/InboxConvList.tsx`:

- Header: filter chips (Todos · Sin leer · Asignadas a mí · Esperando humano · Bot activo)
- SearchInput (debounce 300ms)
- Lista conversaciones:
  - Avatar + nombre PHI-masked (`P. H.`)
  - Snippet último mensaje (truncado)
  - Channel badge (WhatsApp 🟢 · IG 📷 · Email 📧 · Web 💬)
  - Timestamp relativo (ej. "hace 5 min")
  - Unread dot
  - Mode badge (🤖 Decide · 🤝 Consulta · 👤 Manual)
- Click conv → setSelectedConvId + actualiza URL `?conv={id}`

### § 4 — `InboxThread` panel central

`vitalia/frontend/src/features/adrian/components/inbox/InboxThread.tsx`:

Composición:
1. **ThreadHeader:** ChannelBadge + ContactName masked + **Mode Toggle** (3-modos) + Acciones (Asignar · Cerrar · Etiquetar)
2. **MessagesArea:**
   - Mensaje paciente (bubble izq, fondo neutro)
   - Mensaje bot (bubble der, fondo adrián-soft, label "Adrián 🤖")
   - Mensaje humano (bubble der, fondo primary, label "{user} 👤")
   - Mensaje delegate (italic, ej. "Adrián consulta a Valeria") per Design Contract § 3.1 DelegateMarker
   - Tools invoked inline (collapsible card "Adrián usó `check_availability` · resultado: 3 slots disponibles")
3. **Composer:**
   - Textarea + send button
   - Si modo `manual` → enviar como humano
   - Si modo `consulta` → mensaje queda en draft + alerta "Adrián sugiere envío: 'X'. Aprobás?"
   - Si modo `decide` → Adrián envía solo cuando criterio se cumple (no composer humano salvo override)
   - File upload (imagen/PDF · per `hipaa-lite.md` NO PHI sensitive sin encriptado canal)

### § 5 — Mode Toggle (★ corazón paradigma Vitalia)

`vitalia/frontend/src/features/adrian/components/inbox/ModeToggle.tsx`:

3-state segmented control (Shadcn `Tabs`):

| Modo | Significado | Visual |
|---|---|---|
| 🤖 Decide solo | Agente Adrián responde autónomo. Solo escala a humano si tool falla o paciente pide humano | Badge verde "🤖 Decide" |
| 🤝 Consulta | Agente prepara respuesta + humano aprueba/edita/rechaza | Badge amarillo "🤝 Consulta" |
| 👤 Manual | Solo humano responde. Agente queda silenciado (no observa ni sugiere) | Badge gris "👤 Manual" |

Cambio modo:
- POST `/api/inbox/conversations/{id}/mode` → backend actualiza `conversation.agent_mode`
- WebSocket event `mode_changed` (out-of-scope MVP) o polling re-fetch
- Audit log row creado (cambios modo son auditable)

### § 6 — `ContactSidebar` panel derecho

`vitalia/frontend/src/features/adrian/components/inbox/ContactSidebar.tsx`:

Tabs Shadcn:
- **Datos** — Nombre PHI-masked + channel handle + lead score + etiquetas + tags
- **Actividad** — Activity stream chronological (mensajes + tool calls + system events)
- **Lead** — Stage actual (link a F2-S4 embudo) + propuestas (link a F2-S6 propuestas) + Last touch + Time-in-stage
- **Notas internas** — Textarea staff-facing

### § 7 — Activity stream (★ explicabilidad agente)

`vitalia/frontend/src/features/adrian/components/inbox/ActivityStream.tsx`:

Stream chronological de TODO lo que Adrián hizo en esta conv:

```
14:32  📨  Paciente envió mensaje "Hola, atienden los sábados?"
14:32  🤖  Adrián invocó `check_clinic_hours` → resultado: "Sábados 9-13"
14:32  🤖  Adrián respondió: "Hola! Sí, atendemos sábados de 9 a 13h..."
14:35  📨  Paciente: "Quiero turno limpieza"
14:35  🤖  Adrián invocó `check_availability(service=limpieza)` → resultado: 3 slots
14:35  🤖  Adrián invocó `propose_slots(slots=[...])` → mensaje enviado
14:38  📨  Paciente: "El sábado 11h"
14:38  🤖  Adrián invocó `book_appointment(...)` → ❌ requiere PAGO previo (policy clinic)
14:38  🤖  Adrián invocó `request_deposit(amount=30)` → link Stripe enviado
14:40  💳  Paciente pagó depósito → PaymentWebhook → conv.lead_id.stage = 'reservado'
14:40  🤖  Adrián invocó `confirm_booking(...)` → cita creada en Agenda Valeria
14:40  🤖  Adrián respondió: "Listo Pedro! Tu turno está confirmado..."
```

Datos consumidos del `copilot_trace_event` table (engine observability) + sanitize_payload aplica server-side.

### § 8 — Filtros + estado canal

`InboxFilters.tsx`:

Chips: Todos · Sin leer · Asignadas a mí · Esperando humano (modo Consulta sin respuesta humano > 2min) · Bot activo · Cerradas.

ChannelBadge component reusable cross-feature → `components/shared/shell-organism/ChannelBadge.tsx`.

### § 9 — Voice-of-customer signals (passive)

Cuando paciente menciona keywords NPS (`mal`, `excelente`, `pésimo`, `recomiendo`, etc.) → backend dispara trigger SSoT 12-triggers (per navigation-tree Camila) que F2-S11 camila-voz consume. Inbox SOLO genera evento; UI Camila lo procesa.

### § 10 — HIPAA-lite voice patterns

Per `hipaa-lite.md`:
- ❌ NO discutir diagnóstico/resultados por WhatsApp free / SMS
- Si paciente pregunta "qué resultados tengo?" → bot deriva: "Por seguridad, los resultados los puedes ver en tu portal: {link-portal-secure}"
- ComplianceService valida outbound antes envío — bloquea PHI inappropriate channel
- File upload: imagen permitida pero label warning si user adjunta (verbatim warning per `hipaa-lite.md`)

## Acceptance criteria

| AC | Verificación |
|---|---|
| AC-1 | Page `/{tenant}/adrian/inbox` renderiza 3-panel layout |
| AC-2 | ConvList paginated + filter chips + search funcionan |
| AC-3 | Click conv → thread carga + URL `?conv=X` persiste |
| AC-4 | Mode toggle cambia conversation.agent_mode + audit log |
| AC-5 | Composer envía mensaje cuando modo manual; queda en draft en modo consulta |
| AC-6 | Tool calls del agente aparecen inline en thread (collapsible cards) |
| AC-7 | Activity stream muestra trace events del agente cronological |
| AC-8 | ContactSidebar muestra PHI masked + tabs funcionan |
| AC-9 | HIPAA-lite voice patterns enforced (ComplianceService bloquea PHI por canal no encriptado) |
| AC-10 | Visual goldens 3-panel light + dark + mode-toggle states |
| AC-11 | a11y axe pass |
| AC-12 | Mobile: 3-tabs en lugar de 3-panel |
| AC-13 | Cross-tenant query bloqueada (dual filter) |
| AC-14 | Vitest unit + Playwright functional + a11y |

## Gherkin scenarios

### Scenario 1 — happy: modo Decide + tool call exitoso

**Given:**
- Conv abierta, modo Decide
- Paciente envía "Quiero turno limpieza para el sábado"
- Backend sales-agent Adrián procesa

**When:**
1. Backend invoca `check_availability(service=limpieza, date=sabado)` → 3 slots
2. Backend invoca `propose_slots(slots=[...])` → mensaje enviado
3. UI polling refetch (10s) → nuevos events

**Then:**
- Thread muestra: mensaje paciente · tool call collapsible "Adrián verificó disponibilidad: 3 slots" · mensaje bot "Tenemos disponibilidad..."
- Activity stream registra ambos tool calls + mensaje
- Audit log: tool invocations + outbound message

**playwright_required:** true  
**Graders:** E2E + audit log assert BE + visual golden

### Scenario 2 — edge: modo Consulta + humano edita propuesta

**Given:** Conv modo Consulta, agente preparó respuesta sugerida

**When:**
1. Composer muestra draft "Adrián sugiere: 'Hola Pedro, tienes turno disponible sábado...'"
2. Humano edita el draft cambiando "sábado" por "lunes"
3. Click Send

**Then:**
- Mensaje enviado con texto editado (humano firma)
- Activity stream: "Humano editó propuesta Adrián · diff aplicado"
- Audit log: `mode_consulta_intervention`

**playwright_required:** true  
**Graders:** E2E + diff capture

### Scenario 3 — adversarial: paciente pregunta resultados clínicos por WhatsApp

**Given:** Conv modo Decide, channel WhatsApp tier free

**When:** Paciente envía "Cuál fue mi diagnóstico de la semana pasada?"

**Then:**
- Agente NO responde con diagnóstico (ComplianceService bloquea)
- Agente responde: "Por seguridad, los resultados los puedes ver en tu portal: {link}"
- Activity stream registra "ComplianceService bloqueó PHI outbound" + redirect mensaje
- Audit log: `compliance_block_outbound_phi`

**playwright_required:** true  
**Graders:** E2E + BE `vitalia/backend/tests/modules/vitalia/inbox/test_phi_voice_redirect.py`

### Scenario 4 — keyboard-a11y

**Given:** Foco en SearchInput

**When:** Tab × N traversa elementos

**Then:**
- Tab order: search → filter chips → first conv → mode toggle → composer
- aria-current en conv activa
- aria-selected en mode toggle activa
- Esc en composer pierde foco (vuelve a thread)

**playwright_required:** true  
**Graders:** E2E + axe

### Scenario 5 — visual parity con paradigma

**Given:** Conv abierta modo Decide

**When:** Playwright captura screenshot

**Then:**
- 3-panel layout matchea Design Contract § 3.4 template
- Mode toggle visualmente claro (badge verde para Decide)
- Bubble colors per Design Contract tokens (--agent-adrian-soft)

**playwright_required:** true  
**Graders:** Visual goldens × 3 modes + × 2 themes

## Deliverables

| File | Acción |
|---|---|
| `vitalia/frontend/src/app/[tenantId]/(shell-organism)/adrian/inbox/page.tsx` | MODIFY |
| `vitalia/frontend/src/app/[tenantId]/(shell-organism)/adrian/inbox/[conv-id]/page.tsx` | NEW (N3-dyn workspace) |
| `vitalia/frontend/src/features/adrian/components/inbox/AdrianInboxView.tsx` | NEW |
| `vitalia/frontend/src/features/adrian/components/inbox/InboxConvList.tsx` | NEW |
| `vitalia/frontend/src/features/adrian/components/inbox/InboxThread.tsx` | NEW |
| `vitalia/frontend/src/features/adrian/components/inbox/InboxFilters.tsx` | NEW |
| `vitalia/frontend/src/features/adrian/components/inbox/ContactSidebar.tsx` | NEW |
| `vitalia/frontend/src/features/adrian/components/inbox/ActivityStream.tsx` | NEW |
| `vitalia/frontend/src/features/adrian/components/inbox/ModeToggle.tsx` | NEW (★) |
| `vitalia/frontend/src/features/adrian/components/inbox/MessageBubble.tsx` | REUSE shared (Design Contract § 3.1) |
| `vitalia/frontend/src/features/adrian/components/inbox/ToolCallCard.tsx` | NEW (collapsible) |
| `vitalia/frontend/src/components/shared/shell-organism/ChannelBadge.tsx` | NEW (cross-feature reusable) |
| `vitalia/frontend/src/features/adrian/api/inbox.ts` | NEW |
| `vitalia/frontend/src/features/adrian/api/inbox-server.ts` | NEW |
| `vitalia/frontend/src/features/adrian/types/inbox.types.ts` | NEW |
| `vitalia/frontend/src/features/adrian/types/inbox-schema.ts` | NEW (Zod) |
| `vitalia/backend/src/modules/vitalia/inbox/api/conversations_router.py` | MODIFY (add mode endpoint + filters + dual filter) |
| `vitalia/backend/src/modules/vitalia/inbox/api/activity_stream_router.py` | NEW |
| `vitalia/backend/src/modules/vitalia/inbox/application/mode_change_service.py` | NEW |
| `vitalia/frontend/e2e/shell-organism/adrian-inbox-modes.spec.ts` | NEW |
| `vitalia/frontend/e2e/shell-organism/adrian-inbox-phi-redirect.spec.ts` | NEW |
| `vitalia/frontend/e2e/__screenshots__/inbox/{layout}-{mode}-{light\|dark}.png` (×12) | NEW |
| `vitalia/backend/tests/modules/vitalia/inbox/test_mode_change.py` | NEW |
| `vitalia/backend/tests/modules/vitalia/inbox/test_phi_voice_redirect.py` | NEW |
| `vitalia/backend/tests/modules/vitalia/inbox/test_activity_stream_sanitize.py` | NEW |

## Reuse map

| Origen | Componente / pattern | Adaptación |
|---|---|---|
| Vitalia shipped — `vitalia/backend/src/modules/vitalia/inbox` | Models + repository + service base | REUSE 90% — agregar endpoints mode + activity-stream |
| Vitalia shipped — `core/luana-core-sales-agent` + brand extensions `vitalia/backend/src/modules/vitalia/sales_agent/` | LangGraph + tools + voice config | REUSE 100% engine + brand tools (NO tocar — read-only) |
| `core/luana-core-channels` | format_for_channel utility | REUSE como API consumer |
| `core/luana-core-compliance` | ComplianceService.validate_outbound | REUSE BE |
| `core/luana-core-observability` | `copilot_trace_event` + sanitize_payload | CONSUME para activity stream |
| Nicolify FE — inbox feature | 3-panel layout + table patterns | TRANSPONER (no copy-paste — adapt tokens shell-organism) |
| Shadcn primitives | `ResizablePanelGroup` · `Tabs` · `Textarea` · `Badge` · `Sheet` | npx install |
| Vitalia archived — `vitalia-slice-1-inbox` | Inbox UI primera versión (NO shell-organism) | REFACTOR: migrar lógica al espacio adrian/inbox/ + 3-modos paradigm |

## Dependencies map

### Hard
- `vitalia-fase1-empty-states` — shell con sub-tab navigable
- `vitalia-fase1-routing-shell` — App Router incluye `adrian/inbox` + N3-dyn `[conv-id]`

### Soft
- `vitalia-fase2-adrian-embudo` — link "Ver en Embudo" desde conv detail
- `vitalia-fase2-valeria-pacientes` — link "Promover a paciente" desde conv

### Esta historia desbloquea
- `vitalia-fase2-adrian-embudo` — leads del Inbox alimentan embudo
- `vitalia-fase2-camila-voz` — mensajes voice-of-customer disparan triggers
- `vitalia-fase2-adrian-propuestas` — propuesta puede crearse desde conv

## Riesgos identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Polling 10s ineficiente con muchas convs | Media | Medio | Limit page size 30 · pagination · WebSocket upgrade post-MVP |
| Mode toggle race condition (humano + bot simultaneous) | Media | Alto | Backend transaction lock por conv_id + WebSocket update |
| Activity stream PHI leak | Baja | Crítico | sanitize_payload server-side ANTES envío + test `test_activity_stream_sanitize.py` |
| ComplianceService no enforced en todos los outbound paths | Baja | Crítico | Arch fitness test enumera all outbound paths + assert ComplianceService.validate llamado |
| Resizable panels rompen layout mobile | Baja | Medio | Tabs fallback < md (no resizable) |

## Definición de "Done"

1. Todos AC verificados
2. Visual goldens × 12 (3 modes × 2 themes × 2 desktop/mobile)
3. Backend tests HIPAA-lite + mode-change + activity stream sanitize pass
4. Story commits pushed + handoff `/auditor`
5. Auditor APPROVED → merge → capability `adrian.inbox` registrada

## Próximo paso post-done

- F2-S4 adrian-embudo consume leads del Inbox
- F2-S5 adrian-outbound + F2-S6 adrian-propuestas reusan ChannelBadge + ToolCallCard
- Camila stories suben prioridad cuando Inbox dispara triggers SSoT

## Referencias

- **Design Contract:** `vitalia/docs/architecture/SHELL-DESIGN-CONTRACT.md`
- **Template:** `vitalia/docs/specs/templates/01-spec-shell-template.md`
- **Navigation tree:** `vitalia/docs/product/stories/vitalia-shell-organism/navigation-tree.md` § adrian.inbox
- **HIPAA-lite overlay:** `vitalia/.claude/rules/hipaa-lite.md`
- **Slice-1 archived:** `vitalia/docs/archive/2026/stories/vitalia-slice-1-inbox/` (read-only reference)
