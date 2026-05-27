---
story_id: vitalia-fase2-lisa-doctores
outcome: vitalia-mvp-ui-foundation
phase: fase-2
type: ui-story
agent_owner: lisa
module: staff
capability: lisa.doctores
state: idea
architecture_pattern: ADR-vitalia-004
last_modified: 2026-05-22
ratified_by_chris: false
parallel_safe: true
priority: high
estimated_dev_days: 3-4
dependencies:
  hard:
    - vitalia-fase1-empty-states
    - vitalia-fase1-routing-shell
  soft:
    - vitalia-fase2-lisa-marca               # voice brand alimenta bio default
blocks_hard: []
blocks_soft:
  - vitalia-fase2-valeria-agenda             # doctor selector en form crear cita
  - vitalia-fase2-lisa-servicios             # doctor-treatment assignment
reuse_map_summary: "REUSE patients+staff models shipped · NEW UI CRUD perfiles + N3-dyn workspace [doctor-id] · NEW personal-branding bio + horarios + KPIs · doctors-as-faces preview"
spawned_at: 2026-05-22
next_action: "/po-ux refinar 01-spec.md con wireframes directorio + workspace doctor tabs"
---

# F2-S8 vitalia-fase2-lisa-doctores — checkpoke

## Goal

Sub-tab Doctores de Lisa: directorio + CRUD perfiles doctor + N3-dyn workspace per doctor con tabs (Bio · Horarios · Servicios · KPIs). Personal-branding salud-overlay (foto · especialidad · credenciales · años experiencia · idiomas · bio · reseñas público-visibles).

## Anti-objetivos

- NO implementar editor avanzado de horarios recurrentes (solo template básico day-of-week · F2-S20 config-cuenta puede extender)
- NO implementar peer-review entre doctors (out-of-scope)
- NO duplicar `Doctor` model shipped en `vitalia/backend/src/modules/vitalia/staff/`
- NO tocar engine

## Scope verbatim

### § 1 — Page directorio

`vitalia/frontend/src/app/[tenantId]/(shell-organism)/lisa/doctores/page.tsx`:

`<DoctorsDirectoryView>` con grid de cards doctor (no table — visual emphasis personal-branding):

- Avatar grande + nombre + especialidad badge
- Bio truncada (3 líneas)
- Stats tiny (años exp · pacientes atendidos · rating NPS)
- "Ver perfil" button → N3-dyn workspace

Header: "+ Nuevo doctor" + search + filter especialidad.

### § 2 — N3-dyn workspace `[doctor-id]`

`vitalia/frontend/src/app/[tenantId]/(shell-organism)/lisa/doctores/[doctor-id]/page.tsx`:

Tabs:
- **Bio** — Avatar upload S3 · nombre · especialidad · credenciales · años exp · idiomas · bio textarea · reseñas público-visibles toggle
- **Horarios** — Template semanal (day-of-week × time-slots) + excepciones (vacaciones · días libres) · backend genera availability_slots para Agenda Valeria
- **Servicios** — Multi-select treatments doctor puede ofrecer (consume F2-S9 catalog) · default pricing override per doctor opcional
- **KPIs** — Stats: total pacientes · sessions/mes · NPS · revenue generado · time-in-stage avg (read-only · consume analytics)

### § 3 — "+ Nuevo doctor" modal

Form fields: Nombre + Apellido + DNI · Email + Phone · Especialidad · Credencial colegio médico (obligatorio salud) · Foto upload optional · Active toggle.

Submit → POST `/api/staff/doctors` → audit log + redirect a workspace.

### § 4 — Doctors-as-faces public preview

Backend expone endpoint `/api/public/clinic/{tenant}/doctors` (read-only · PHI masked) que landing pública consume. Permite/excluye doctors via toggle "Visible en landing" per doctor.

### § 5 — Trust signals validation

Backend valida credencial colegio médico format country-specific:
- PE: CMP (Colegio Médico Perú) format `12345`
- AR: matrícula nacional + provincial
- MX: cédula profesional
- CL: registro nacional médicos

`vitalia/backend/src/modules/vitalia/staff/application/credential_validator.py`.

## Acceptance criteria

| AC | Verificación |
|---|---|
| AC-1 | Directorio renderiza cards doctor |
| AC-2 | Filter especialidad + search funcionan |
| AC-3 | "+ Nuevo doctor" crea perfil + redirect workspace |
| AC-4 | Workspace tabs (Bio · Horarios · Servicios · KPIs) funcionan |
| AC-5 | Horarios template genera availability_slots backend |
| AC-6 | Credencial colegio médico valida country-specific |
| AC-7 | Visible-en-landing toggle controla preview público |
| AC-8 | Avatar upload S3 + preview |
| AC-9 | Visual goldens × 8 (directorio + 4 tabs × 2 themes) |
| AC-10 | a11y axe pass |
| AC-11 | Cross-tenant query bloqueada |
| AC-12 | RBAC: solo role `admin_clinic` puede editar doctors (otros read-only) |
| AC-13 | Vitest + Playwright + a11y pass |

## Gherkin scenarios

### Scenario 1 — happy: crear doctor + horarios

**Given:** User admin_clinic en Lisa→Doctores

**When:**
1. "+ Nuevo doctor" → modal → fields obligatorios + CMP 12345 PE
2. Submit
3. Workspace abre tab Bio
4. Tab Horarios → marca lunes-viernes 9-13 + 15-19
5. Save

**Then:**
- Doctor creado · audit log
- Horarios persisten · backend genera availability_slots para próximos 90d
- Agenda Valeria reconoce nuevo doctor en form "crear cita"

### Scenario 2 — negative: credencial inválida

**Given:** Form nuevo doctor con CMP `abc` (no número)

**When:** Submit

**Then:**
- Validator backend rejecta 422 "Credencial CMP debe ser numérico"
- UI muestra error inline + foco en field
- NO persiste

### Scenario 3 — edge: doctor desactivado

**Given:** Doctor existente con citas futuras agendadas

**When:** Toggle "Activo" → off

**Then:**
- Backend: doctor.active = false
- Slots futuros del doctor: backend NO cancela (preserva data) pero excluye en form crear-cita
- Alert UI "Doctor desactivado. {N} citas futuras siguen vigentes. Re-asignar manualmente?"

### Scenario 4 — adversarial: cross-tenant doctor view

**Given:** Adversarial intenta ver doctor de tenant B

**When:** Navega `/{tenant-A}/lisa/doctores/{doctor_B_id}`

**Then:**
- Backend dual filter bloquea
- 404 genérico
- Audit log `cross_tenant_attempt`

### Scenario 5 — keyboard-a11y tabs workspace

**Given:** Foco en primer tab Bio

**When:** Arrow → cycle tabs

**Then:** aria-selected actualiza · screen reader anuncia · Tab fields ordenados lógicamente

## Deliverables

| File | Acción |
|---|---|
| `vitalia/frontend/src/app/[tenantId]/(shell-organism)/lisa/doctores/page.tsx` | MODIFY |
| `vitalia/frontend/src/app/[tenantId]/(shell-organism)/lisa/doctores/[doctor-id]/page.tsx` | NEW (N3-dyn) |
| `vitalia/frontend/src/features/lisa/components/doctores/DoctorsDirectoryView.tsx` | NEW |
| `vitalia/frontend/src/features/lisa/components/doctores/DoctorCard.tsx` | NEW |
| `vitalia/frontend/src/features/lisa/components/doctores/NuevoDoctorModal.tsx` | NEW |
| `vitalia/frontend/src/features/lisa/components/doctores/DoctorWorkspace.tsx` | NEW |
| `vitalia/frontend/src/features/lisa/components/doctores/tabs/{Bio,Horarios,Servicios,Kpis}Tab.tsx` | NEW (4 files) |
| `vitalia/frontend/src/features/lisa/api/doctores.ts` | NEW |
| `vitalia/frontend/src/features/lisa/types/doctor.types.ts` | NEW |
| `vitalia/frontend/src/features/lisa/types/doctor-schema.ts` | NEW (Zod) |
| `vitalia/backend/src/modules/vitalia/staff/api/doctors_router.py` | NEW or MODIFY |
| `vitalia/backend/src/modules/vitalia/staff/application/credential_validator.py` | NEW |
| `vitalia/backend/src/modules/vitalia/staff/application/horarios_to_slots_service.py` | NEW |
| `vitalia/backend/src/modules/vitalia/staff/persistence/migrations/XXXX_doctor_horarios.py` | NEW |
| `vitalia/frontend/e2e/shell-organism/lisa-doctores-crud.spec.ts` | NEW |
| `vitalia/frontend/e2e/__screenshots__/doctores/{view}-{light\|dark}.png` (×8) | NEW |
| `vitalia/backend/tests/modules/vitalia/staff/test_credential_validator.py` | NEW |
| `vitalia/backend/tests/modules/vitalia/staff/test_horarios_to_slots.py` | NEW |
| `vitalia/backend/tests/modules/vitalia/staff/test_doctor_cross_tenant.py` | NEW |

## Reuse map

| Origen | Componente / pattern | Adaptación |
|---|---|---|
| Vitalia shipped — `vitalia/backend/src/modules/vitalia/staff/` | Doctor/StaffMember model | REUSE + extend |
| Vitalia shipped — `patients` PHI masking utils | Email/Phone/DNI masking | REUSE |
| Shadcn primitives | `Card` · `Dialog` · `Tabs` · `Form` · `Checkbox` · `Select` · `Upload` | npx install |
| Vitalia archived — patients FE pattern | CRUD directory layout | TRANSPONER |

## Dependencies map

### Hard
- `vitalia-fase1-empty-states` + `vitalia-fase1-routing-shell`

### Soft
- `vitalia-fase2-lisa-marca` — voice brand alimenta bio default

### Esta historia desbloquea
- `vitalia-fase2-valeria-agenda` — form crear-cita usa doctors disponibles
- `vitalia-fase2-lisa-servicios` — doctor-treatment assignment matrix
- `vitalia-fase2-valeria-pacientes` — paciente assignment doctor

## Riesgos identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Credencial validators country-specific incompletos | Media | Bajo | Tabla extendible cuando bootstrap nueva region |
| Doctor desactivado rompe citas futuras | Media | Medio | Soft-deactivate + alert + manual re-assign flow |
| Horarios template no maneja casos complejos | Alta | Bajo | MVP: weekly template básico · story future para shift management |

## Definición de "Done"

1. AC verificados
2. Visual goldens × 8
3. Backend tests credential + horarios + cross-tenant pass
4. Story pushed + handoff `/auditor`
5. Auditor APPROVED → merge → capability `lisa.doctores` registrada

## Próximo paso post-done

- F2-S1 valeria-agenda consume doctors disponibles
- F2-S9 lisa-servicios mapea treatments → doctors

## Referencias

- **Design Contract:** `vitalia/docs/architecture/SHELL-DESIGN-CONTRACT.md`
- **Navigation tree:** § lisa.doctores
- **HIPAA-lite:** `vitalia/.claude/rules/hipaa-lite.md`
