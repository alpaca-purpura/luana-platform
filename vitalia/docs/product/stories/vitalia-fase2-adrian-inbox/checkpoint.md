---
story_id: vitalia-fase2-adrian-inbox
type: ui-story
agent_owner: adrian
module: inbox
capability: adrian.inbox
state: idea
architecture_pattern: ADR-vitalia-004
last_modified: 2026-05-22
ratified_by_chris: false
parallel_safe: true
priority: critical
estimated_dev_days: 5-6
dependencies:
  hard:
    - vitalia-fase1-empty-states
    - vitalia-fase1-routing-shell
  soft:
    - vitalia-fase2-adrian-embudo            # link "Ver lead en Embudo" desde conv
    - vitalia-fase2-valeria-pacientes        # link "Promover a paciente" desde conv
blocks_hard: []
blocks_soft:
  - vitalia-fase2-adrian-embudo              # leads del Inbox alimentan embudo
  - vitalia-fase2-camila-voz                 # mensajes con voice-of-customer dispara triggers
reuse_map_summary: "REUSE 95% inbox+sales_agent shipped (LangGraph + tools + canales) · NEW UI 3-panel (Lista convs · Thread · ContactSidebar) · NEW 3-modos toggle (Decide solo · Consulta · Manual) · NEW Activity stream + tools registry view"
spawned_at: 2026-05-22
supersedes:
  - vitalia-slice-1-inbox                    # archived 2026 — superseded por este
next_action: "/po-ux refinar 01-spec.md con wireframes 3-panel + 3-modos toggle + activity stream"

# Schema v2 migration (cement 2026-05-27)
release: F4   # release ID · ver releases/
cap_target: adrian.inbox   # capability slug target (v2 cement 2026-05-27)
cap_change_type: new   # new | fix | extend | derive
parent_story: null   # story padre si spawned · null si independiente
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
