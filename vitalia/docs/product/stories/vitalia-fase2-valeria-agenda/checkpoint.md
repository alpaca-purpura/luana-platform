---
story_id: vitalia-fase2-valeria-agenda
outcome: vitalia-mvp-ui-foundation
phase: fase-2
type: ui-story
agent_owner: valeria
module: scheduling
capability: valeria.agenda
state: idea
last_modified: 2026-05-22
ratified_by_chris: false
parallel_safe: true
priority: critical
estimated_dev_days: 5-7
dependencies:
  hard:
    - vitalia-fase1-empty-states              # toda Fase 1 done
    - vitalia-fase1-routing-shell
    - vitalia-payment-adapter-mvp             # service-blocker BE para "Cobrar saldo"
    - vitalia-fiscal-emission-pe              # service-blocker BE para emisión inline
  soft:
    - vitalia-fase2-valeria-pacientes         # links cross-tab "Ver ficha paciente" del drawer
blocks_hard: []
blocks_soft:
  - vitalia-fase2-adrian-embudo               # stage "reservado" auto-crea slot via API
  - vitalia-fase2-adrian-propuestas           # propuesta aprobada → genera slot inicial
reuse_map_summary: "REFACTOR slice-1-agenda (calendar shell + AppointmentDrawer) · REUSE scheduling+booking BE shipped · REUSE crm.patient (PHI masked) · NEW subform Cobrar saldo inline (depende payment-adapter + fiscal-emission)"
spawned_at: 2026-05-22
supersedes:
  - vitalia-slice-1-agenda                    # refactor target — capability promovida aquí
next_action: "/po-ux refinar 01-spec.md con visuales del drawer + subform Cobrar saldo (preset filters + status cells)"
---

# F2-S1 vitalia-fase2-valeria-agenda — checkpoint

## Goal

Sub-tab Agenda de Valeria activa. Calendario operativo día/semana/mes con celdas-slot por estado de pago (pagado · depósito · sin-pago · no-show) y por origen (walk-in · teléfono · proactivo Adrián). Click slot → Drawer derecho inline con datos paciente PHI-masked + turno + **subform "Cobrar saldo"** que emite comprobante fiscal sin salir del flujo. Reemplaza empty-state Fase 1 con feature real, migrando capability de `vitalia-slice-1-agenda` shipped pero NO integrado.

**Por qué crítica:** primer valor visible end-to-end del shell-organism agéntico. Valeria + Adrián cierran loop de ventas (reservas pre-pagadas) + Camila reactivación post-cita. Sin Agenda Fase 2, el shell-organism es decorativo.

## Anti-objetivos

- NO rehacer modelos BE `Appointment`/`Booking` (shipped en `core/luana-core-platform` + `vitalia/backend/src/modules/vitalia/scheduling/`)
- NO implementar booking público externo (eso es flujo cliente → otro outcome)
- NO implementar editor recurrencias avanzadas (solo recurrencia simple día-de-semana)
- NO integrar Google Calendar / iCal sync (F2-S21 config-conexiones lo expone)
- NO implementar feature waiting-list (parking story)
- NO tocar `core/luana-core-*` (read-only desde FE)

## Scope verbatim

### § 1 — Página + layout

`vitalia/frontend/src/app/[tenantId]/(shell-organism)/valeria/agenda/page.tsx`:

```tsx
// Server Component
import { ValeriaAgendaView } from '@/features/valeria/components/agenda/ValeriaAgendaView'
import { getInitialAgendaState } from '@/features/valeria/api/agenda-server'

export default async function Page({ params, searchParams }: PageProps) {
  const { tenantId } = await params
  const { view = 'semana', date } = await searchParams
  const initialData = await getInitialAgendaState({ tenantId, view, date })
  return <ValeriaAgendaView initialData={initialData} initialView={view} />
}
```

Page consume Server-side initial state via `getInitialAgendaState` (fetch `/api/scheduling/agenda/grid?...` con cookie auth + tenant-id header), hydrata cliente con React Query `initialData`.

### § 2 — `ValeriaAgendaView` (feature root, client)

`vitalia/frontend/src/features/valeria/components/agenda/ValeriaAgendaView.tsx`:

```tsx
'use client'
// Composición:
// 1. <AgendaHeader> — view-toggle (día|semana|mes) + date-picker + filtros preset
// 2. <AgendaCalendar> — grid con cells AgendaSlot
// 3. <AppointmentDrawer> — Sheet derecho cuando slot seleccionado
//
// State management:
// - useQuery /api/scheduling/agenda/grid?tenant_id&view&date → slots[]
// - useState selectedSlotId | null → controla drawer abierto
// - useFiltersStore (zustand local feature) → preset chip filtros
// - useShellStore.activeTenantId → propaga al hook si tenant cambia
```

### § 3 — `AgendaCalendar` con celdas-slot

`vitalia/frontend/src/features/valeria/components/agenda/AgendaCalendar.tsx`:

- 3 variantes según `view`: `DayCalendar` (timeline vertical 24h por columnas-doctor) · `WeekCalendar` (grid 7d×9h-21h) · `MonthCalendar` (grid mensual con dots de carga)
- Cada `AgendaSlot` cell (molécula del Design Contract § 3.2):
  - Border-left 3px color = status del pago (`--success` pagado · `--warning` depósito · `--destructive` sin-pago · `--muted-foreground` no-show)
  - Badge tiny top-right = origen (`👤` walk-in · `📞` teléfono · `🤖` proactivo Adrián)
  - Title = paciente PHI-masked (`P. Hernández` en lugar de `Pedro Hernández` per `hipaa-lite.md` voice patterns)
  - Subtitle = servicio + hora
  - Click → setSelectedSlotId + abre drawer

### § 4 — `AppointmentDrawer` (Sheet Shadcn)

`vitalia/frontend/src/features/valeria/components/agenda/AppointmentDrawer.tsx`:

```bash
npx shadcn@latest add sheet  # Shadcn primitive obligatorio
```

Drawer estructura (top-down):

1. **Header del drawer:**
   - Avatar paciente (initials fallback)
   - Nombre PHI-masked + DNI masked (`12.***.***`)
   - Botón "Ver ficha completa" → linkea F2-S2 valeria-pacientes (cuando done)
   - Botón cerrar (X)

2. **Sección Turno:**
   - Fecha + hora + duración
   - Doctor asignado + servicio (treatment_ref)
   - Estado actual (Confirmado · Pendiente · Cancelado · No-show)
   - Acciones: Re-agendar · Cancelar · Marcar como completado · Marcar no-show

3. **Sección Pago / saldo:**
   - Status visual: 🟢 Pagado total · 🟡 Depósito parcial (X de Y) · 🔴 Sin pago · ⚫ No-show
   - Si saldo > 0 → **subform "Cobrar saldo"** (§ 5)
   - Histórico pagos previos (collapsible)

4. **Sección Notas internas:**
   - Textarea staff-facing (NO PHI clínico — solo logística)
   - "Última actividad: ..." timestamp + autor

5. **Sección Acciones avanzadas (collapsible):**
   - Enviar recordatorio WhatsApp (canal seguro · NO PHI clínico per `hipaa-lite.md`)
   - Reasignar doctor
   - Cambiar duración

### § 5 — Subform "Cobrar saldo" inline (★ corazón valor F2-S1)

`vitalia/frontend/src/features/valeria/components/agenda/CobrarSaldoSubform.tsx`:

```tsx
// Form fields (Zod schema):
// - amount: number (default = saldo pendiente)
// - method: enum (efectivo · tarjeta · transferencia · MP · otro)
// - emit_invoice: bool (default true, depende preset clinic)
// - fiscal_doc_type: enum (factura · boleta · ticket — solo si emit_invoice=true)
// - notes: string optional
//
// On submit:
// POST /api/payments/charge { appointment_id, amount, method, ... }
// → backend llama vitalia-payment-adapter-mvp (Stripe/MP/efectivo)
// → si emit_invoice: POST /api/fiscal/emit { payment_id, doc_type } → vitalia-fiscal-emission-pe
// → return { payment_id, fiscal_doc_url, status }
//
// UI feedback:
// - Loading state durante charge + emisión
// - Success toast con link a comprobante fiscal PDF
// - Error state con retry button + mensaje user-facing en español neutro
//
// HIPAA-lite:
// - amount + method NO son PHI (no incluyen diagnóstico)
// - Audit log row creado server-side (audit-log table del overlay)
```

Toggle "Emitir comprobante" depende `tenant.config.auto_emit_invoice` (en `vitalia/config/brand.yaml` per tenant). Si tenant PE → boleta default. Si tenant AR/MX → factura default.

### § 6 — Filtros preset (chip-row)

`vitalia/frontend/src/features/valeria/components/agenda/AgendaPresetFilters.tsx`:

Chip filters arriba del calendario (per navigation-tree `presets_filtered`):

| Chip | Filtra |
|---|---|
| 📅 Hoy | `date == today` |
| ⏰ Por confirmar mañana | `date == tomorrow AND status == pending` |
| ↩️ Re-agendar pendientes | `requires_reschedule == true` |
| 🚫 No-shows del día | `date == today AND status == no_show` |

Click chip → actualiza query params del URL + refetch grid filtered.

### § 7 — Crear cita (botón "+ Crear cita")

`vitalia/frontend/src/features/valeria/components/agenda/CrearCitaButton.tsx`:

Dropdown menu (Shadcn `DropdownMenu`) con 2 opciones:
- **Walk-in** → Drawer derecho con form pre-cargado origin=walk-in
- **Teléfono** → idem origin=telefono

Form fields: paciente (autocomplete buscando `patients` shipped) · doctor · servicio · fecha+hora · notas. Submit → POST `/api/scheduling/appointments`.

### § 8 — Mobile responsive

- `<md`: Calendar → vista día default (week+month NO en mobile, switcher disabled con tooltip)
- AppointmentDrawer → full-screen overlay (Sheet `side="bottom"` ocupando 95vh)
- Filtros preset → carousel horizontal scrollable

### § 9 — Real-time updates (post Fase 2 / out-of-scope MVP)

WebSocket subscribe a `tenant:{id}:scheduling` topic → invalidate React Query cache de `agenda/grid`. **No en MVP F2-S1** — polling cada 30s suficiente. Documentado como upgrade path en `vitalia/docs/architecture/ADR-vitalia-NNN-agenda-realtime.md` (futuro).

## Acceptance criteria

| AC | Verificación |
|---|---|
| AC-1 | Page `/{tenant}/valeria/agenda` renderiza calendario semana default con slots de DB |
| AC-2 | Toggle día / semana / mes funciona (URL `?view=X` persiste) |
| AC-3 | Cada AgendaSlot renderiza con border-status correcto + origin badge |
| AC-4 | Click slot abre `AppointmentDrawer` con datos paciente PHI-masked |
| AC-5 | Subform "Cobrar saldo" emite pago + comprobante fiscal sin recargar página |
| AC-6 | Audit log row creado para cada read drawer + cada charge ejecutado |
| AC-7 | Chips preset filtran correctamente (URL params + DB query) |
| AC-8 | "+ Crear cita" abre form pre-cargado origin |
| AC-9 | Visual goldens light + dark per view (día · semana · mes) |
| AC-10 | Visual golden drawer abierto con subform cobrar saldo |
| AC-11 | a11y axe pass en calendario + drawer + subform |
| AC-12 | Mobile: drawer full-screen + day-only view |
| AC-13 | Tenant switcher → invalida React Query + refetch agenda nuevo tenant |
| AC-14 | NO PHI en logs (sanitize_payload aplica) ni en URLs (GET params no incluyen DNI/nombre) |
| AC-15 | Cross-tenant query bloqueada (dual filter `tenant_id` + `clinic_id` per `hipaa-lite.md`) |
| AC-16 | Vitest unit + Playwright functional + a11y axe pass |

## Gherkin scenarios

### Scenario 1 — happy: cobro saldo end-to-end

**Given:**
- Tenant PE `clinica-sonrisa-pe` activo
- Usuario rol `valeria_assistant` autenticado
- Slot existente: paciente `P. Hernández`, servicio `Limpieza dental`, saldo pendiente PEN 80
- `vitalia-payment-adapter-mvp` shipped + `vitalia-fiscal-emission-pe` shipped

**When:**
1. Usuario click slot → drawer abre
2. Click "Cobrar saldo" → subform expande
3. Selecciona method=tarjeta, emit_invoice=true, doc_type=boleta
4. Click "Cobrar"

**Then:**
- POST `/api/payments/charge` retorna 200 con `payment_id`
- POST `/api/fiscal/emit` retorna 200 con `boleta_url`
- Toast success "Cobro PEN 80 + boleta emitida"
- Slot border-status cambia 🟡 depósito → 🟢 pagado
- Audit log row: `{user, action: 'charge', resource: slot_id, payload_redacted: {amount, method}}`
- NO PHI en log (DNI paciente NO aparece, solo `patient_id` hash)

**playwright_required:** true  
**Graders:**
- E2E functional: `e2e/shell-organism/valeria-agenda-cobro.spec.ts`
- Visual golden drawer subform: `e2e/__screenshots__/agenda/drawer-cobrar-saldo-light.png`
- Backend test: `vitalia/backend/tests/modules/vitalia/scheduling/test_drawer_charge_flow.py`

### Scenario 2 — negative: payment-adapter caído

**Given:** `vitalia-payment-adapter-mvp` retorna 503 (Stripe API timeout)

**When:** Usuario click "Cobrar" en subform

**Then:**
- UI muestra `<ErrorAlert variant="destructive">` "No pudimos procesar el cobro. Intentalo de nuevo en unos segundos."
- Botón "Reintentar" disponible
- NO comprobante fiscal emitido (transacción NO commit)
- Sentry capture sin PHI (solo `payment_attempt_id` + `error_code`)
- Slot NO cambia status

**playwright_required:** true  
**Graders:** E2E con MSW mock 503 + visual golden error state

### Scenario 3 — edge: tenant switch durante drawer abierto

**Given:**
- Usuario tiene drawer abierto para slot tenant A
- Switchea a tenant B via TenantSwitcher

**When:** TenantSwitcher dispara hard redirect a `/{tenant-B}/valeria/agenda`

**Then:**
- Drawer cierra (no carries-over al nuevo tenant)
- Agenda re-fetchea para tenant B
- LocalStorage `x-tenant-id` actualizado
- React Query cache invalidado completamente
- NO leak de datos tenant A en UI

**playwright_required:** true  
**Graders:** E2E `e2e/shell-organism/valeria-agenda-tenant-switch.spec.ts`

### Scenario 4 — adversarial: PHI en URL bloqueado

**Given:** Usuario adversarial intenta `GET /{tenant}/valeria/agenda?patient_dni=12345678`

**When:** Request llega al endpoint

**Then:**
- Server-side filter ignora query param (whitelist explícita de filtros permitidos)
- Audit log row crea entry `suspicious_request` (sin contenido del DNI)
- Response retorna agenda completa sin filtro PHI
- NO 500 ni leak

**playwright_required:** false (backend test suficiente)  
**Graders:** `vitalia/backend/tests/modules/vitalia/scheduling/test_phi_url_protection.py`

### Scenario 5 — keyboard-a11y: navegar slots con teclado

**Given:** Foco en primer slot del día

**When:**
1. Tab → siguiente slot
2. Enter → abre drawer
3. Esc → cierra drawer
4. Shift+Tab → vuelve al slot

**Then:**
- Cada slot recibe focus visible (ring CSS `:focus-visible`)
- Drawer abre con focus en primer botón interactivo
- Esc cierra y devuelve focus al slot trigger
- aria-haspopup, aria-expanded, aria-controls correctos

**playwright_required:** true  
**Graders:** E2E + axe-core

### Scenario 6 — theme-switch + visual parity mockup

**Given:** Agenda renderizada en light mode

**When:**
1. ThemeToggle → dark
2. ThemeToggle → light

**Then:**
- CSS vars switchean correctamente
- Border-status colors mantienen contraste WCAG AA (verificable axe contrast)
- Visual goldens dark + light generados sin overflow ni texto invisible
- Mockup HTML `dual-mode-shell.html` puede tener fragmento Agenda para parity check

**playwright_required:** true  
**Graders:** Visual goldens × 2 modes + axe contrast

## Deliverables

| File | Acción |
|---|---|
| `vitalia/frontend/src/app/[tenantId]/(shell-organism)/valeria/agenda/page.tsx` | MODIFY (era empty-state F1-S10) |
| `vitalia/frontend/src/features/valeria/components/agenda/ValeriaAgendaView.tsx` | NEW |
| `vitalia/frontend/src/features/valeria/components/agenda/AgendaCalendar.tsx` | NEW |
| `vitalia/frontend/src/features/valeria/components/agenda/AgendaSlot.tsx` | NEW (Design Contract § 3.2 molécula) |
| `vitalia/frontend/src/features/valeria/components/agenda/AppointmentDrawer.tsx` | NEW |
| `vitalia/frontend/src/features/valeria/components/agenda/CobrarSaldoSubform.tsx` | NEW (★ subform inline) |
| `vitalia/frontend/src/features/valeria/components/agenda/AgendaPresetFilters.tsx` | NEW |
| `vitalia/frontend/src/features/valeria/components/agenda/CrearCitaButton.tsx` | NEW |
| `vitalia/frontend/src/features/valeria/api/agenda.ts` | NEW (React Query hooks) |
| `vitalia/frontend/src/features/valeria/api/agenda-server.ts` | NEW (SSR initial state) |
| `vitalia/frontend/src/features/valeria/hooks/useAgendaFilters.ts` | NEW |
| `vitalia/frontend/src/features/valeria/store/agenda-store.ts` | NEW (zustand local feature) |
| `vitalia/frontend/src/features/valeria/types/agenda.types.ts` | NEW (Slot, Appointment, Payment) |
| `vitalia/frontend/src/features/valeria/types/agenda-schema.ts` | NEW (Zod schemas) |
| `vitalia/backend/src/modules/vitalia/scheduling/api/agenda_grid_router.py` | MODIFY (add filters whitelist + dual filter + audit log) |
| `vitalia/backend/src/modules/vitalia/scheduling/application/agenda_grid_service.py` | MODIFY (handle new filters) |
| `vitalia/backend/src/modules/vitalia/payments/api/charge_router.py` | NEW (consume payment-adapter-mvp) |
| `vitalia/backend/src/modules/vitalia/fiscal/api/emit_router.py` | NEW (consume fiscal-emission-pe) |
| `vitalia/backend/src/modules/vitalia/scheduling/persistence/migrations/XXXX_agenda_drawer_audit.py` | NEW (idempotent IF NOT EXISTS) |
| `vitalia/frontend/e2e/shell-organism/valeria-agenda-cobro.spec.ts` | NEW |
| `vitalia/frontend/e2e/shell-organism/valeria-agenda-tenant-switch.spec.ts` | NEW |
| `vitalia/frontend/e2e/shell-organism/valeria-agenda-keyboard.spec.ts` | NEW |
| `vitalia/frontend/e2e/__screenshots__/agenda/{view}-{light\|dark}.png` (×6) | NEW visual goldens |
| `vitalia/frontend/e2e/__screenshots__/agenda/drawer-cobrar-saldo-{light\|dark}.png` (×2) | NEW |
| `vitalia/backend/tests/modules/vitalia/scheduling/test_drawer_charge_flow.py` | NEW |
| `vitalia/backend/tests/modules/vitalia/scheduling/test_phi_url_protection.py` | NEW |
| `vitalia/backend/tests/modules/vitalia/scheduling/test_audit_log_drawer.py` | NEW |

## Reuse map

| Origen | Componente / pattern | Adaptación Vitalia |
|---|---|---|
| Vitalia shipped — `slice-1-agenda` (refactor target) | Calendar shell + AppointmentDrawer original draft | Migrar lógica + adaptar tokens shell-organism + agregar subform Cobrar saldo + integrar con nuevo route group |
| Vitalia shipped — `core/luana-core-platform.scheduling` | Models `Appointment`, `Booking`, queries grid | REUSE 100% BE — solo agregar endpoint `/agenda/grid` con filtros + dual filter HIPAA |
| Vitalia shipped — `vitalia/backend/src/modules/vitalia/crm/patient` | `Patient` model + PHI masking utils | REUSE BE — FE consume via API con `patient_id` hash |
| Service-story `vitalia-payment-adapter-mvp` | Charge gateway (Stripe/MP/efectivo) | CONSUME via POST `/api/payments/charge` |
| Service-story `vitalia-fiscal-emission-pe` | Boleta/factura emission PE-AR-MX | CONSUME via POST `/api/fiscal/emit` |
| Shadcn primitives | `Sheet` · `DropdownMenu` · `Toast` · `Alert` · `Tabs` | npx install + style con Vitalia tokens |
| Nicolify FE — `closer-studio` Sheet pattern | Right-drawer Sheet animation + focus management | TRANSPONER pattern al `AppointmentDrawer` |

## Dependencies map

### Hard (bloquean implementación)
- `vitalia-fase1-empty-states` — necesita shell con sub-tab Agenda navigable + routing
- `vitalia-fase1-routing-shell` — App Router pages + AGENT_SUBTABS whitelist incluye `valeria/agenda`
- `vitalia-payment-adapter-mvp` — endpoint `/api/payments/charge` debe estar shipped
- `vitalia-fiscal-emission-pe` — endpoint `/api/fiscal/emit` debe estar shipped

### Soft (mejor pero no bloquea)
- `vitalia-fase2-valeria-pacientes` — link cross-tab "Ver ficha" del drawer; si no done, link disabled con tooltip "Próximamente"

### Esta historia desbloquea
- `vitalia-fase2-adrian-embudo` — stage "reservado" del Kanban Adrián auto-crea slot agenda via API
- `vitalia-fase2-adrian-propuestas` — propuesta aprobada → slot inicial creado automático
- `vitalia-fase2-camila-voz` — slot `status=completed` dispara NPS trigger del SSoT 12-triggers

## Riesgos identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Drawer + form complexity introduce flakiness E2E | Media | Medio | Playwright `animations: 'disabled'` + esperas explícitas en goldens |
| Payment-adapter no shipped a tiempo | Media | Alto | Story-blocker explícito — `/dev-team` REFUSE pickup si service-blocker no developed |
| HIPAA-lite dual filter no enforced en endpoint nuevo | Baja | Crítico | Backend test `test_phi_dual_filter.py` arch fitness ya existe per `hipaa-lite.md` |
| Mobile drawer UX pobre | Media | Medio | Visual golden mobile + Playwright `@project=mobile` desde día 1 |
| Audit log row no creado en algunos paths | Media | Crítico | Test específico `test_audit_log_drawer.py` cubre todos los entry points |

## Definición de "Done"

1. Todos los AC del § Acceptance verificados via Playwright + Vitest
2. Visual goldens generados + ratificados Chris (12+ snapshots: 3 views × 2 themes + drawer + subform + mobile)
3. Backend tests HIPAA-lite (PHI no leaked + dual filter + audit log) pass
4. Story commits pushed wip/vitalia
5. T-{n}-result.md escrito con SHAs + log decisiones
6. Handoff `/auditor` emitido automáticamente

Auditor APPROVED → `/pm-vitalia merge` → state `done` → capability `valeria.agenda` promovida.

## Próximo paso post-done

- F2-S2 `vitalia-fase2-valeria-pacientes` activa el link "Ver ficha completa" del drawer
- F2-S4 `vitalia-fase2-adrian-embudo` consume API agenda para auto-crear slot al reservar lead
- Capability `valeria.agenda` registrada en `vitalia/docs/product/capabilities/scheduling/valeria-agenda.yaml`

## Referencias

- **Design Contract:** `vitalia/docs/architecture/SHELL-DESIGN-CONTRACT.md` § 3 (átomos/moléculas) · § 7 (routing) · § 8 (a11y) · § 9 (testing)
- **Template:** `vitalia/docs/specs/templates/01-spec-shell-template.md`
- **Mockup HTML:** `vitalia/docs/product/stories/vitalia-shell-organism/mockups/dual-mode-shell.html`
- **Navigation tree:** `vitalia/docs/product/stories/vitalia-shell-organism/navigation-tree.md` § valeria.agenda
- **HIPAA-lite overlay:** `vitalia/.claude/rules/hipaa-lite.md`
- **Service stories:** `vitalia/docs/product/stories/vitalia-payment-adapter-mvp/` · `vitalia/docs/product/stories/vitalia-fiscal-emission-pe/`
- **Slice-1 refactor target:** `vitalia/docs/product/stories/vitalia-slice-1-agenda/`
