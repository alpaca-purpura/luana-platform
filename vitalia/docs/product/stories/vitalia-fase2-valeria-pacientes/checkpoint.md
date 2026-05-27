---
story_id: vitalia-fase2-valeria-pacientes
outcome: vitalia-mvp-ui-foundation
phase: fase-2
type: ui-story
agent_owner: valeria
module: crm
capability: valeria.pacientes
state: idea
architecture_pattern: ADR-vitalia-004
last_modified: 2026-05-22
ratified_by_chris: false
parallel_safe: true
priority: high
estimated_dev_days: 4-5
dependencies:
  hard:
    - vitalia-fase1-empty-states
    - vitalia-fase1-routing-shell
  soft:
    - vitalia-fase2-valeria-agenda           # link "Ver historial citas" desde ficha
    - vitalia-fase2-adrian-embudo            # link "Ver origen lead" si lead_id existe
blocks_hard: []
blocks_soft:
  - vitalia-fase2-camila-voz                 # cohorte "promotores" lee patient.nps_score
  - vitalia-fase2-camila-reactivar           # cohorte "sin actividad 60d" lee patient.last_visit
reuse_map_summary: "REUSE 90% patients+crm shipped (models + repository + service) · NEW UI directorio + ficha workspace · NEW alta-rápida form + N3-dyn route [patient-id]"
spawned_at: 2026-05-22
next_action: "/po-ux refinar 01-spec.md con wireframes ficha tabs + alta rápida modal"
---

# F2-S2 vitalia-fase2-valeria-pacientes — checkpoint

## Goal

Sub-tab Pacientes de Valeria activa. Directorio paginado de pacientes con búsqueda + segmentos (Todos · Deudores · Tratamientos activos), ficha workspace N3-dyn `[patient-id]` con tabs (Datos · Historial citas · Tratamientos · Estado cuenta · Etiquetas), form alta rápida desde botón "+ Nuevo paciente". Todo PHI-masked en listados; full reveal solo en ficha bajo role check.

## Anti-objetivos

- NO implementar HC clínica completa (historia médica = otro outcome regulatorio)
- NO implementar consentimientos digitales (story dedicada futura)
- NO implementar import/export bulk pacientes (F2-S22 config-avanzado lo expone)
- NO duplicar models `Patient` (shipped en `vitalia/backend/src/modules/vitalia/crm/`)
- NO mostrar diagnóstico/medicación clínica en directorio (solo en ficha con role doctor/nurse)

## Scope verbatim

### § 1 — Page directorio

`vitalia/frontend/src/app/[tenantId]/(shell-organism)/valeria/pacientes/page.tsx`:

```tsx
import { PatientsDirectoryView } from '@/features/valeria/components/pacientes/PatientsDirectoryView'
import { getInitialPatientsList } from '@/features/valeria/api/pacientes-server'

export default async function Page({ params, searchParams }: PageProps) {
  const { tenantId } = await params
  const { segment = 'todos', q = '', page = '1' } = await searchParams
  const initialData = await getInitialPatientsList({ tenantId, segment, q, page: +page })
  return <PatientsDirectoryView initialData={initialData} initialSegment={segment} initialSearch={q} />
}
```

### § 2 — `PatientsDirectoryView`

`vitalia/frontend/src/features/valeria/components/pacientes/PatientsDirectoryView.tsx`:

Composición:
1. `<DirectoryHeader>` — SearchInput + segment-chips (Todos · Deudores · Tratamientos activos) + "+ Nuevo paciente" button
2. `<PatientsTable>` — Shadcn `Table` con columns: Avatar+Nombre PHI-masked · DNI masked · Última visita · Saldo · Etiquetas · Acciones
3. `<Pagination>` — Shadcn pagination component
4. Click row → router push `/{tenant}/valeria/pacientes/{patient_id}` (N3-dyn)

State:
- `useQuery /api/crm/patients?segment&q&page` con `keepPreviousData` for smooth UX
- nuqs URL state para `segment, q, page`

### § 3 — `PatientsTable` con masking

`vitalia/frontend/src/features/valeria/components/pacientes/PatientsTable.tsx`:

```tsx
// PHI masking per hipaa-lite.md:
// - Nombre: "P. Hernández" (inicial + apellido)
// - DNI: "12.***.***"
// - Email: "p***@gmail.com"
// - Phone: "+51 9**** ****"
//
// Server-side: API retorna SOLO masked fields para tenant-scope user roles.
// Solo role doctor/nurse en ficha individual ve full reveal.
```

Columns con `data-testid` para Playwright. Row click → router push (preserva scroll + state via React Query cache).

### § 4 — Ficha workspace N3-dyn

`vitalia/frontend/src/app/[tenantId]/(shell-organism)/valeria/pacientes/[patient-id]/page.tsx`:

Tabs Shadcn:
- **Datos** — Form CRUD con full reveal (role-gated · audit log row al ver)
- **Historial citas** — Lista chronological con link a slot agenda (cuando F2-S1 done)
- **Tratamientos** — Lista treatments activos + pasados (consume `vitalia/backend/.../treatments/`)
- **Estado cuenta** — Saldo + histórico pagos + alerts deuda
- **Etiquetas** — Tags pickable (promoter · VIP · debt · dormant · etc.)

```tsx
// PHI access decorator pattern aplica server-side:
// @require_phi_access(roles=["doctor","nurse","admin_clinic","valeria_assistant"])
// Si role no autorizado → 403 + UI muestra "No tienes permiso para ver datos clínicos"
```

### § 5 — Alta rápida modal

`vitalia/frontend/src/features/valeria/components/pacientes/NuevoPacienteModal.tsx`:

Shadcn `Dialog` (no Sheet — form corto). Fields:
- Nombre + Apellido (obligatorios)
- DNI / Documento (obligatorio)
- Teléfono + Email (al menos uno requerido)
- Fecha nacimiento (date picker)
- Notas iniciales (textarea)
- Etiqueta inicial (multi-select)

On submit: POST `/api/crm/patients` → audit log row → redirect a ficha nueva.

### § 6 — Segmentos dinámicos

Backend `vitalia/backend/src/modules/vitalia/crm/application/patient_segments_service.py`:

| Segment slug | Query lógica |
|---|---|
| `todos` | All `tenant_id` + `clinic_id` (dual filter) |
| `deudores` | `account_balance > 0` |
| `tratamientos_activos` | `EXISTS(Treatment WHERE patient_id AND status='in_progress')` |

NUNCA hardcoded en FE — backend retorna `available_segments[]` con counts.

### § 7 — Búsqueda

Server-side full-text search con `ILIKE` sobre fields normalized (name + dni + phone + email). Trigram index en Postgres (`pg_trgm`). PHI sigue masked en results.

Backend endpoint: `GET /api/crm/patients?q={query}&segment={slug}&page={n}`. Rate-limited (per-user 30 rps).

### § 8 — Mobile responsive

- Table → card stack (cada row colapsa a card)
- Ficha tabs → accordion vertical
- Modal alta rápida → full-screen sheet

## Acceptance criteria

| AC | Verificación |
|---|---|
| AC-1 | Page `/{tenant}/valeria/pacientes` renderiza directorio paginado |
| AC-2 | SearchInput filtra resultados con debounce 300ms |
| AC-3 | Segment chips actualizan URL + refetch correctamente |
| AC-4 | Cada row muestra PHI masked correctamente (no full DNI/nombre/email/phone) |
| AC-5 | Click row → ficha workspace N3-dyn carga datos full reveal con role check |
| AC-6 | Audit log row creado al ver ficha (entry `phi_read`) |
| AC-7 | Tabs de ficha persisten estado via URL `?tab=tratamientos` |
| AC-8 | "+ Nuevo paciente" abre modal + submit crea paciente + redirect |
| AC-9 | Visual goldens directorio + ficha tabs (5 variantes) light + dark |
| AC-10 | a11y axe pass en table + modal + tabs |
| AC-11 | Mobile: table → cards + tabs → accordion |
| AC-12 | NO PHI en URLs (DNI/nombre nunca query params) |
| AC-13 | Cross-tenant query bloqueada |
| AC-14 | Role no-autorizado al ver tab "Datos" full reveal → 403 con mensaje accesible |
| AC-15 | Vitest unit + Playwright functional + a11y axe pass |

## Gherkin scenarios

### Scenario 1 — happy: buscar paciente + abrir ficha

**Given:**
- Usuario rol `doctor`, tenant activo, 50 pacientes en DB
- Search input vacío

**When:**
1. Usuario tipea "Hernández" en SearchInput
2. Espera debounce 300ms
3. Click row "P. Hernández"

**Then:**
- Lista filtra a pacientes con apellido Hernández (masked)
- URL = `/{tenant}/valeria/pacientes?q=Hern%C3%A1ndez`
- Click row → router push `/{tenant}/valeria/pacientes/{patient_id}?tab=datos`
- Ficha abre tab Datos con full reveal (DNI completo, email, phone)
- Audit log row creado: `{user, action: 'phi_read', resource: patient_id, timestamp}`

**playwright_required:** true  
**Graders:** E2E + audit log assertion BE

### Scenario 2 — negative: role no-autorizado intenta ver ficha

**Given:** Usuario rol `marketing_assistant` (NO PHI access)

**When:** Intenta navegar manual a `/{tenant}/valeria/pacientes/{patient_id}`

**Then:**
- Backend retorna 403
- UI muestra `<EmptyState>` "No tienes permiso para ver datos clínicos. Contacta al admin."
- Audit log row `unauthorized_phi_attempt` creado (sin contenido PHI)
- NO leak parcial de datos

**playwright_required:** true  
**Graders:** E2E con role swap + axe

### Scenario 3 — edge: segment con 0 resultados

**Given:** Tenant nuevo sin pacientes con saldo

**When:** Click chip "Deudores"

**Then:**
- Table renderiza `<EmptyState>` (Design Contract § 3.2) con icon + mensaje + CTA "Ver todos los pacientes"
- URL = `?segment=deudores`
- NO 500 ni error

**playwright_required:** true  
**Graders:** E2E + visual golden empty state

### Scenario 4 — adversarial: SQL injection en search

**Given:** Adversarial user

**When:** SearchInput recibe `' OR 1=1 --`

**Then:**
- Backend usa parameterized queries (SQLAlchemy 2.0 + parameterized) — NO injection posible
- Search returns 0 results (string literal no match)
- NO 500
- Sentry capture (suspicious pattern) sin PHI

**playwright_required:** false (backend test suficiente)  
**Graders:** `vitalia/backend/tests/modules/vitalia/crm/test_search_sql_injection.py`

### Scenario 5 — keyboard-a11y

**Given:** Foco en SearchInput

**When:**
1. Tab → primer segment chip
2. Tab → tabla (first row)
3. Enter → abre ficha
4. Tab dentro de ficha → cycles tabs
5. Esc → vuelve al directorio (back button equivalent)

**Then:**
- Cada elemento focus visible
- aria-current en row activo
- aria-selected en tab activo
- Screen reader anuncia tabs cambio

**playwright_required:** true  
**Graders:** E2E + axe

## Deliverables

| File | Acción |
|---|---|
| `vitalia/frontend/src/app/[tenantId]/(shell-organism)/valeria/pacientes/page.tsx` | MODIFY (era empty-state) |
| `vitalia/frontend/src/app/[tenantId]/(shell-organism)/valeria/pacientes/[patient-id]/page.tsx` | NEW (N3-dyn workspace) |
| `vitalia/frontend/src/features/valeria/components/pacientes/PatientsDirectoryView.tsx` | NEW |
| `vitalia/frontend/src/features/valeria/components/pacientes/PatientsTable.tsx` | NEW |
| `vitalia/frontend/src/features/valeria/components/pacientes/NuevoPacienteModal.tsx` | NEW |
| `vitalia/frontend/src/features/valeria/components/pacientes/PatientWorkspace.tsx` | NEW (ficha root) |
| `vitalia/frontend/src/features/valeria/components/pacientes/tabs/PatientDataTab.tsx` | NEW |
| `vitalia/frontend/src/features/valeria/components/pacientes/tabs/PatientAppointmentsTab.tsx` | NEW |
| `vitalia/frontend/src/features/valeria/components/pacientes/tabs/PatientTreatmentsTab.tsx` | NEW |
| `vitalia/frontend/src/features/valeria/components/pacientes/tabs/PatientAccountTab.tsx` | NEW |
| `vitalia/frontend/src/features/valeria/components/pacientes/tabs/PatientTagsTab.tsx` | NEW |
| `vitalia/frontend/src/features/valeria/api/pacientes.ts` | NEW (React Query hooks) |
| `vitalia/frontend/src/features/valeria/api/pacientes-server.ts` | NEW (SSR initial) |
| `vitalia/frontend/src/features/valeria/types/patient.types.ts` | NEW |
| `vitalia/frontend/src/features/valeria/types/patient-schema.ts` | NEW (Zod) |
| `vitalia/backend/src/modules/vitalia/crm/api/patients_router.py` | MODIFY (add segments + search + dual filter + audit log) |
| `vitalia/backend/src/modules/vitalia/crm/application/patient_segments_service.py` | NEW |
| `vitalia/backend/src/modules/vitalia/crm/persistence/migrations/XXXX_patient_indexes.py` | NEW (pg_trgm idx) |
| `vitalia/frontend/e2e/shell-organism/valeria-pacientes-search.spec.ts` | NEW |
| `vitalia/frontend/e2e/shell-organism/valeria-pacientes-rbac.spec.ts` | NEW |
| `vitalia/frontend/e2e/__screenshots__/pacientes/{view}-{light\|dark}.png` (×8) | NEW |
| `vitalia/backend/tests/modules/vitalia/crm/test_phi_masking.py` | NEW |
| `vitalia/backend/tests/modules/vitalia/crm/test_search_sql_injection.py` | NEW |
| `vitalia/backend/tests/modules/vitalia/crm/test_audit_log_phi_read.py` | NEW |

## Reuse map

| Origen | Componente / pattern | Adaptación |
|---|---|---|
| Vitalia shipped — `vitalia/backend/src/modules/vitalia/crm/patient` | `Patient` model + repository + service | REUSE 100% BE — solo extend endpoints |
| Vitalia shipped — PHI masking utils | `mask_dni()`, `mask_phone()`, `mask_email()` (per `hipaa-lite.md`) | REUSE 100% |
| Vitalia shipped — `treatments` module | Treatment models per patient | REUSE como API consumer (FE) |
| `core/luana-core-platform.scheduling` | Appointments por patient | REUSE como API consumer |
| Nicolify FE — Inbox table pattern | Paginated table + row-click → drawer | TRANSPONER pattern (drawer → router push N3-dyn) |
| Shadcn primitives | `Table` · `Dialog` · `Tabs` · `Badge` · `Input` | npx install + style Vitalia |
| Postgres pg_trgm | Trigram index para fuzzy search | NEW migration con `CREATE INDEX IF NOT EXISTS ... USING gin (... gin_trgm_ops)` |

## Dependencies map

### Hard
- `vitalia-fase1-empty-states` — shell con sub-tab nav
- `vitalia-fase1-routing-shell` — App Router incluye `valeria/pacientes` + N3-dyn

### Soft
- `vitalia-fase2-valeria-agenda` — tab "Historial citas" linkea a slot agenda
- `vitalia-fase2-adrian-embudo` — tab "Datos" muestra "Origen: Lead {id}" si patient creado desde Inbox

### Esta historia desbloquea
- `vitalia-fase2-camila-voz` — cohorte promotores lee `patient.nps_score`
- `vitalia-fase2-camila-reactivar` — cohorte dormant lee `patient.last_visit`

## Riesgos identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| PHI leak en URL query params | Baja | Crítico | Backend whitelist filtros + audit `suspicious_request` |
| Search trigram lento para >10k pacientes | Media | Medio | pg_trgm gin index + benchmark CI |
| Role check bypass en ficha tabs | Baja | Crítico | Backend decorator `@require_phi_access` + test arch fitness |
| Modal alta rápida valida DNI duplicado tarde | Media | Bajo | Zod validation + server-side unique constraint |

## Definición de "Done"

1. Todos AC del § Acceptance verificados
2. Visual goldens generados + ratificados (directorio + ficha tabs × 2 themes)
3. Backend tests HIPAA-lite pass (PHI masking + audit log + cross-tenant + SQL injection)
4. Story commits pushed + handoff `/auditor`
5. Auditor APPROVED → merge → capability `valeria.pacientes` registrada

## Próximo paso post-done

- F2-S1 valeria-agenda habilita link "Ver ficha" del drawer
- F2-S4 adrian-embudo crea pacientes auto-cuando lead convierte
- Camila stories consumen segments para cohortes dinámicas

## Referencias

- **Design Contract:** `vitalia/docs/architecture/SHELL-DESIGN-CONTRACT.md`
- **Template:** `vitalia/docs/specs/templates/01-spec-shell-template.md`
- **Navigation tree:** `vitalia/docs/product/stories/vitalia-shell-organism/navigation-tree.md` § valeria.pacientes
- **HIPAA-lite overlay:** `vitalia/.claude/rules/hipaa-lite.md`
