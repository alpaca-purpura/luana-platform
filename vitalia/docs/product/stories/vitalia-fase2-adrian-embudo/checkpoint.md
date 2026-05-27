---
story_id: vitalia-fase2-adrian-embudo
outcome: vitalia-mvp-ui-foundation
phase: fase-2
type: ui-story
agent_owner: adrian
module: sales_pipeline
capability: adrian.embudo
state: idea
architecture_pattern: ADR-vitalia-004
last_modified: 2026-05-22
ratified_by_chris: false
parallel_safe: true
priority: critical
estimated_dev_days: 6-8
dependencies:
  hard:
    - vitalia-fase1-empty-states
    - vitalia-fase1-routing-shell
    - vitalia-payment-adapter-mvp           # service-blocker BE para stage "reservado" (cobra depósito)
  soft:
    - vitalia-fase2-adrian-inbox            # leads de conv alimentan embudo
    - vitalia-fase2-valeria-agenda          # stage "reservado" auto-crea slot
blocks_hard: []
blocks_soft:
  - vitalia-fase2-adrian-propuestas         # propuesta puede crearse desde lead detail
  - vitalia-fase2-camila-reactivar          # cohorte "propuesta sin firmar" lee leads embudo
reuse_map_summary: "REFACTOR slice-1-pipeline (estructura draft) · TRANSPONER nicolify closer-studio ConversationPipelineBoard (@dnd-kit/core) · NEW 6 stages dental customizable per vertical · NEW lead detail workspace N3-dyn · NEW toggle Kanban|Lista"
spawned_at: 2026-05-22
supersedes:
  - vitalia-slice-1-pipeline                # refactor target
next_action: "/po-ux refinar 01-spec.md con wireframes Kanban + Lista + lead detail tabs"
---

# F2-S4 vitalia-fase2-adrian-embudo — checkpoint

## Goal

Sub-tab Embudo de Adrián: pipeline visual del proceso comercial (lead → reservado → no decide). Toggle `Kanban | Lista CRM`. Stages default vertical dental: `interesado · calificando · considerando · listo · reservado · decidio-no`. Stages customizable per vertical (estética/psicología/psiquiatría tendrán defaults distintos en story dedicada). Drag-drop entre stages dispara backend transitions. Lead detail N3-dyn workspace con tabs (Datos · Historial conversaciones · Propuestas · Score · Time-in-stage · Tools registry — explicabilidad).

## Anti-objetivos

- NO duplicar engine sales-agent (vive en `core/luana-core-sales-agent`)
- NO implementar editor stages-customization en F2-S4 (story dedicada futura — defaults dental sirven MVP)
- NO implementar AI-suggest next-stage (out-of-scope MVP)
- NO implementar bulk-action multi-lead (story dedicada futura)
- NO implementar lead-merge / dedup automático (manual desde detail)

## Scope verbatim

### § 1 — Page + layout

`vitalia/frontend/src/app/[tenantId]/(shell-organism)/adrian/embudo/page.tsx`:

```tsx
import { AdrianEmbudoView } from '@/features/adrian/components/embudo/AdrianEmbudoView'
import { getInitialEmbudoState } from '@/features/adrian/api/embudo-server'

export default async function Page({ params, searchParams }: PageProps) {
  const { tenantId } = await params
  const { view = 'kanban' } = await searchParams
  const initialData = await getInitialEmbudoState({ tenantId, view })
  return <AdrianEmbudoView initialData={initialData} initialView={view} />
}
```

### § 2 — `AdrianEmbudoView`

`vitalia/frontend/src/features/adrian/components/embudo/AdrianEmbudoView.tsx`:

Composición:
1. `<EmbudoHeader>` — Toggle Kanban|Lista (Tabs Shadcn) + Filtros (origen · doctor · etiquetas · date-range) + "+ Nuevo lead" button + Métricas tiny (total leads · win rate · avg time-in-stage)
2. Variant `<KanbanBoard>` o `<LeadsTable>` según `view`
3. Side effects: tenant switch invalida cache (cross-tenant safety)

### § 3 — `KanbanBoard` (★ refactor slice-1-pipeline)

`vitalia/frontend/src/features/adrian/components/embudo/KanbanBoard.tsx`:

Usa `@dnd-kit/core` (TRANSPONER de Nicolify `ConversationPipelineBoard`):

```tsx
// 6 columns dental default:
const STAGES_DENTAL = [
  { id: 'interesado', label: 'Interesado', emoji: '👁️' },
  { id: 'calificando', label: 'Calificando', emoji: '🔍' },
  { id: 'considerando', label: 'Considerando', emoji: '🤔' },
  { id: 'listo', label: 'Listo', emoji: '✅' },
  { id: 'reservado', label: 'Reservado', emoji: '📅' },
  { id: 'decidio-no', label: 'Decidió que no', emoji: '🚫' },
]

// Per vertical (en F2-S4 hardcode dental — vertical switcher futuro):
// estética: ['interesado','consulta-evaluacion','presupuesto','aceptado','agendado','no-procede']
// psicología: ['interesado','primera-sesion','en-tratamiento','alta','interrumpio','no-inicio']
// ... (story dedicada para customizar per tenant)
```

Cada `PipelineColumn` (molécula Design Contract § 3.2):
- Header con stage label + count + total value (suma `proposed_value` leads in stage)
- Stack cards leads (cada card es `LeadCard` molécula)
- Drop zone activo durante drag

LeadCard contenido:
- Avatar paciente PHI-masked
- Nombre masked + canal origen badge
- Última actividad (timestamp relativo)
- Time-in-stage (`hace 3d` con color: verde <7d · amarillo 7-14d · rojo >14d)
- Lead score (0-100) tiny bar
- Tags (max 3 visible, +N tooltip)
- Tools-registry indicator (icon if agente invocó tools recientemente)

Drag-drop card entre columns:
- `onDragEnd` → POST `/api/embudo/leads/{lead_id}/stage` con new stage
- Optimistic UI update (move card immediately) + rollback si backend 4xx
- Audit log row creado (stage transition es business event)
- Si new_stage = `reservado` → backend dispara `vitalia-payment-adapter-mvp` payment request flow

### § 4 — `LeadsTable` (vista Lista CRM)

`vitalia/frontend/src/features/adrian/components/embudo/LeadsTable.tsx`:

Shadcn `Table` con columns: Avatar+Nombre masked · Stage badge · Canal · Score · Time-in-stage · Última actividad · Doctor asignado · Propuestas · Acciones.

Filter por stage column (multi-select), sortable columns, paginated.

Click row → router push `/{tenant}/adrian/embudo/{lead_id}` (N3-dyn workspace).

### § 5 — Lead Detail N3-dyn workspace

`vitalia/frontend/src/app/[tenantId]/(shell-organism)/adrian/embudo/[lead-id]/page.tsx`:

Tabs Shadcn:
- **Datos** — Nombre PHI-masked salvo doctor+admin role · canal origen · etiquetas · doctor asignado · score
- **Historial conversaciones** — Lista convs con link a F2-S3 inbox
- **Propuestas** — Lista propuestas (link F2-S6 propuestas) + CTA "+ Nueva propuesta"
- **Score** — Breakdown: explainable AI showing qué factores aportan al score (timing · canal · score nps origen · etc.)
- **Time-in-stage** — Timeline de transiciones stage cronological
- **Tools registry** — Lista tools que Adrián invocó para este lead (con resultado + timestamp + audit refs) — explicabilidad

### § 6 — "Nuevo lead" modal

`NewLeadModal.tsx`:

Form fields:
- Nombre + Apellido + Canal origen (WhatsApp · IG · Email · Referido · Web · Otro)
- Phone / Email (al menos uno)
- Stage inicial (default `interesado`)
- Servicio interés (autocomplete treatments)
- Notas iniciales
- Tags

Submit → POST `/api/embudo/leads` + redirect a lead detail.

### § 7 — Stage transition side-effects (★ business logic)

| From → To | Side effect backend |
|---|---|
| `* → reservado` | Dispara payment-adapter-mvp request (POST `/api/payments/deposit`) · si pago OK → crear Appointment vía Agenda API |
| `* → decidio-no` | Update `closure_reason` (request reason form modal) · cierra lead · dispara Camila reactivar trigger (post-N días) |
| `interesado → calificando` | Adrián auto-invoca tools `qualify_lead` (background async) |
| `considerando → listo` | Adrián envía propuesta vía sales-agent tool (auto) |

Todos los side-effects: audit log row + ComplianceService validate (para outbound mensajes).

### § 8 — Filtros + metrics tiny

`EmbudoFilters.tsx`:

Filters:
- Origen canal (multi-select)
- Doctor asignado (multi-select staff)
- Tags (multi-select)
- Date-range last-activity
- Lead-score range

Metrics tiny en header:
- Total leads abiertos
- Win-rate (% reservados / total cerrados ultimo 30d)
- Avg time-in-stage (por stage)
- Top stage stuck (stage con más time-in-stage avg)

### § 9 — Mobile responsive

- Kanban → horizontal scroll columns (cada column min-width 280px)
- LeadsTable → cards stack
- Lead detail → tabs accordion
- Drag-drop → long-press + select+move buttons (no swipe)

## Acceptance criteria

| AC | Verificación |
|---|---|
| AC-1 | Page renderiza Kanban default con leads en stages |
| AC-2 | Toggle Kanban|Lista actualiza URL + view persiste |
| AC-3 | Drag-drop card entre columns dispara POST stage transition |
| AC-4 | Optimistic UI con rollback si backend 4xx |
| AC-5 | Stage transition `* → reservado` dispara payment-adapter + crear cita agenda |
| AC-6 | Audit log row por stage transition + por tool invocation |
| AC-7 | LeadsTable filterable + sortable + paginated |
| AC-8 | Click row → lead detail workspace tabs funcionan |
| AC-9 | "+ Nuevo lead" modal crea lead + redirect |
| AC-10 | Visual goldens Kanban + Lista light + dark |
| AC-11 | Visual golden lead detail tabs (6 tabs) |
| AC-12 | a11y axe pass (keyboard drag alternative via select+arrow) |
| AC-13 | Mobile Kanban horizontal scroll funciona |
| AC-14 | Cross-tenant query bloqueada |
| AC-15 | PHI masked en table + cards (no full DNI/nombre/phone) |
| AC-16 | Vitest unit + Playwright functional + a11y |

## Gherkin scenarios

### Scenario 1 — happy: drag card a stage reservado dispara pago

**Given:**
- Lead `lead_X` en stage `listo`
- Tenant tiene payment-adapter-mvp configurado
- Tratamiento $200 PEN definido

**When:**
1. Adrián (humano) arrastra card de `listo` → `reservado`
2. `onDragEnd` dispara POST `/api/embudo/leads/{lead_X}/stage` { new_stage: 'reservado' }

**Then:**
- Backend: stage update + dispara payment-deposit request → link MP/Stripe generado
- Outbound mensaje WhatsApp al paciente con link pago + monto
- UI: card aparece en `reservado` column con badge "💳 Esperando pago"
- Audit log: `stage_transition` + `payment_deposit_request`
- Si paciente paga → webhook → stage update `reservado` (final) + Appointment auto-creado en Agenda Valeria (consume F2-S1)

**playwright_required:** true  
**Graders:** E2E + BE integration test + audit assert

### Scenario 2 — negative: drag durante backend 4xx → rollback

**Given:** Lead en stage `interesado`. Backend retorna 422 (validation fail: stage rules)

**When:** User arrastra card a `reservado` (skipping calificando+considerando+listo)

**Then:**
- Optimistic UI muestra card en `reservado` momentáneamente
- Backend retorna 422 `{error: 'invalid_stage_transition', allowed_next: ['calificando']}`
- UI rollback: card vuelve a `interesado`
- Toast error: "No puedes saltar al stage Reservado desde Interesado. Stage permitido: Calificando"
- Audit log: `failed_stage_transition`

**playwright_required:** true  
**Graders:** E2E + BE test rules

### Scenario 3 — edge: tenant switch durante drag

**Given:** User está mid-drag de card

**When:** TenantSwitcher dispara hard redirect

**Then:**
- Drag cancela (sin POST)
- Embudo del nuevo tenant carga
- NO leak data

**playwright_required:** true  
**Graders:** E2E

### Scenario 4 — adversarial: lead-id de otro tenant

**Given:** Usuario adversarial conoce `lead_id` de tenant B

**When:** Navega `/{tenant-A}/adrian/embudo/{lead_B_id}`

**Then:**
- Backend dual filter (`tenant_id` + `clinic_id`) bloquea
- 404 con mensaje genérico "Lead no encontrado"
- NO leak existencia ni datos
- Audit log: `cross_tenant_attempt`

**playwright_required:** false (backend test suficiente)  
**Graders:** BE `vitalia/backend/tests/modules/vitalia/sales_pipeline/test_cross_tenant_lead_block.py`

### Scenario 5 — keyboard-a11y: drag-drop accessible

**Given:** Foco en LeadCard

**When:**
1. Space → entra modo select
2. Arrow keys → mueve card entre columns
3. Space → confirma drop
4. Esc → cancela

**Then:**
- Screen reader anuncia "Card movida de Interesado a Calificando"
- aria-live region update
- Visual focus ring claro
- Drop trigger mismo POST que mouse drag

**playwright_required:** true  
**Graders:** E2E + axe

### Scenario 6 — visual parity con paradigm

**Given:** Embudo con 5 leads distribuidos en 4 stages

**When:** Playwright screenshot

**Then:**
- Columns ancho consistente (280px desktop)
- LeadCards visualmente claros con score bar
- Time-in-stage colors correctos (verde/amarillo/rojo)
- Dark mode mantiene contraste

**playwright_required:** true  
**Graders:** Visual goldens × 2 themes × 2 views

## Deliverables

| File | Acción |
|---|---|
| `vitalia/frontend/src/app/[tenantId]/(shell-organism)/adrian/embudo/page.tsx` | MODIFY |
| `vitalia/frontend/src/app/[tenantId]/(shell-organism)/adrian/embudo/[lead-id]/page.tsx` | NEW (N3-dyn workspace) |
| `vitalia/frontend/src/features/adrian/components/embudo/AdrianEmbudoView.tsx` | NEW |
| `vitalia/frontend/src/features/adrian/components/embudo/KanbanBoard.tsx` | NEW (@dnd-kit/core) |
| `vitalia/frontend/src/features/adrian/components/embudo/PipelineColumn.tsx` | NEW (Design Contract § 3.2) |
| `vitalia/frontend/src/features/adrian/components/embudo/LeadCard.tsx` | NEW |
| `vitalia/frontend/src/features/adrian/components/embudo/LeadsTable.tsx` | NEW |
| `vitalia/frontend/src/features/adrian/components/embudo/EmbudoHeader.tsx` | NEW |
| `vitalia/frontend/src/features/adrian/components/embudo/EmbudoFilters.tsx` | NEW |
| `vitalia/frontend/src/features/adrian/components/embudo/EmbudoMetrics.tsx` | NEW |
| `vitalia/frontend/src/features/adrian/components/embudo/NewLeadModal.tsx` | NEW |
| `vitalia/frontend/src/features/adrian/components/embudo/lead-detail/LeadWorkspace.tsx` | NEW |
| `vitalia/frontend/src/features/adrian/components/embudo/lead-detail/tabs/{Datos,Conversaciones,Propuestas,Score,TimeInStage,ToolsRegistry}Tab.tsx` | NEW (6 files) |
| `vitalia/frontend/src/features/adrian/api/embudo.ts` | NEW |
| `vitalia/frontend/src/features/adrian/api/embudo-server.ts` | NEW |
| `vitalia/frontend/src/features/adrian/types/lead.types.ts` | NEW |
| `vitalia/frontend/src/features/adrian/types/lead-schema.ts` | NEW (Zod) |
| `vitalia/backend/src/modules/vitalia/sales_pipeline/api/leads_router.py` | NEW or MODIFY |
| `vitalia/backend/src/modules/vitalia/sales_pipeline/api/stage_transition_router.py` | NEW |
| `vitalia/backend/src/modules/vitalia/sales_pipeline/application/stage_transition_service.py` | NEW (rules + side-effects) |
| `vitalia/backend/src/modules/vitalia/sales_pipeline/domain/stage_rules.py` | NEW (dental defaults) |
| `vitalia/backend/src/modules/vitalia/sales_pipeline/persistence/migrations/XXXX_lead_stage_audit.py` | NEW (idempotent) |
| `vitalia/frontend/e2e/shell-organism/adrian-embudo-drag.spec.ts` | NEW |
| `vitalia/frontend/e2e/shell-organism/adrian-embudo-keyboard.spec.ts` | NEW |
| `vitalia/frontend/e2e/shell-organism/adrian-embudo-tenant-switch.spec.ts` | NEW |
| `vitalia/frontend/e2e/__screenshots__/embudo/{view}-{light\|dark}.png` (×4) | NEW |
| `vitalia/frontend/e2e/__screenshots__/embudo/lead-detail-{tab}-{light\|dark}.png` (×12) | NEW |
| `vitalia/backend/tests/modules/vitalia/sales_pipeline/test_stage_transition_rules.py` | NEW |
| `vitalia/backend/tests/modules/vitalia/sales_pipeline/test_cross_tenant_lead_block.py` | NEW |
| `vitalia/backend/tests/modules/vitalia/sales_pipeline/test_payment_dispatch.py` | NEW |
| `vitalia/backend/tests/modules/vitalia/sales_pipeline/test_audit_log_transition.py` | NEW |

## Reuse map

| Origen | Componente / pattern | Adaptación |
|---|---|---|
| Vitalia draft — `vitalia-slice-1-pipeline` | Pipeline shell, primer draft Kanban | REFACTOR: migrar al espacio adrian/embudo · adoptar tokens shell-organism · adoptar @dnd-kit/core |
| Nicolify FE — `closer-studio` `ConversationPipelineBoard` | Kanban con @dnd-kit/core · drop zones · optimistic UI | TRANSPONER 70% — adaptar para Lead entity (no Conversation) · stages distintos |
| Vitalia shipped — `core/luana-core-sales-agent` + brand extensions | Sales-agent invocations + tools | CONSUME via API (lead detail tab Tools Registry consume `copilot_trace_event`) |
| Vitalia shipped — `vitalia/backend/src/modules/vitalia/sales_pipeline` (if exists) ó CRM | Lead model + repository | EXTEND or NEW based on shipped state |
| Service-story `vitalia-payment-adapter-mvp` | Payment deposit gateway | CONSUME via stage transition side-effect |
| Service-story F2-S1 `vitalia-fase2-valeria-agenda` | API `/api/scheduling/appointments` | CONSUME para auto-crear Appointment al `* → reservado` |
| Shadcn primitives | `Table` · `Tabs` · `Dialog` · `Badge` | npx install |
| `@dnd-kit/core` | DnD library | NEW npm install |

## Dependencies map

### Hard
- `vitalia-fase1-empty-states` — shell con sub-tab nav
- `vitalia-fase1-routing-shell` — App Router incluye `adrian/embudo` + N3-dyn
- `vitalia-payment-adapter-mvp` — endpoint pago para stage `reservado`

### Soft
- `vitalia-fase2-adrian-inbox` — leads de conv crear leads embudo
- `vitalia-fase2-valeria-agenda` — auto-crear slot al stage `reservado`

### Esta historia desbloquea
- `vitalia-fase2-adrian-propuestas` — propuesta desde lead detail
- `vitalia-fase2-camila-reactivar` — cohorte "propuesta sin firmar"

## Riesgos identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| @dnd-kit/core React 19 compatibility | Baja | Alto | Verify Nicolify usa misma versión + smoke test antes F1-S0 |
| Stage transition race condition (2 users drag al mismo tiempo) | Media | Medio | Backend optimistic locking via `version` column |
| Side-effect cascade (reservado → payment → agenda) falla parcial | Media | Alto | Saga pattern + compensating actions + manual recovery UI |
| Drag-drop UX mobile pobre | Alta | Medio | Long-press + select+arrow keys + tests `@project=mobile` |
| Stage rules dental no fit todos clinics | Alta | Bajo | Story dedicada futura para customizar per vertical — dental sirve MVP |

## Definición de "Done"

1. AC verificados
2. Visual goldens × 16 (Kanban + Lista × 2 themes + 6 lead detail tabs × 2 themes)
3. Backend tests stage-rules + cross-tenant + payment-dispatch + audit pass
4. Story commits pushed + handoff `/auditor`
5. Auditor APPROVED → merge → capability `adrian.embudo` registrada

## Próximo paso post-done

- F2-S6 adrian-propuestas usa lead detail como contexto
- F2-S5 adrian-outbound segmenta por stage del embudo
- Capability cementa `sales_pipeline.lead.stage` ontología

## Referencias

- **Design Contract:** `vitalia/docs/architecture/SHELL-DESIGN-CONTRACT.md`
- **Template:** `vitalia/docs/specs/templates/01-spec-shell-template.md`
- **Navigation tree:** `vitalia/docs/product/stories/vitalia-shell-organism/navigation-tree.md` § adrian.embudo
- **HIPAA-lite:** `vitalia/.claude/rules/hipaa-lite.md`
- **Slice-1 refactor target:** `vitalia/docs/product/stories/vitalia-slice-1-pipeline/`
