---
story_id: vitalia-fase2-lisa-doctores
type: ui-story
agent_owner: lisa
map_zone: agentes
map_box: lisa
module: clinics
capability: lisa.doctores
state: reviewing
defer_audit: true
defer_audit_ratified_by: chris
defer_audit_ratified_at: '2026-05-31'
defer_audit_reason: >-
  Live-verify (2026-05-31) confirmó la feature funcionando + capa API verified-real
  por el auditor, PERO el browser-E2E no alcanza done sin un fix de PRODUCCIÓN del
  shell (dual-mount / Triple-main pattern → duplicación DOM + violaciones a11y axe +
  focus-return). Ese fix es transversal (5 agentes × 3 modos) → historia /architect
  dedicada (ver vitalia/docs/observed-bugs/2026-05-31-shell-dual-mount-duplicate-testids.md).
  Harness scoping aplicado (commit b3730693, 2→24 verdes) + fake-green del builder
  revertido. Auditoría diferida hasta el fix de producción del dual-mount + estabilización
  de harness. Detalle: T-HARNESS-result.md.
architecture_pattern: ADR-vitalia-004
last_modified: '2026-05-31'
ready_package_by: /architect (Opus 4.8)
ready_package_at: '2026-05-31'
autonomous_mode: true
e2e_live_run: pending_stack  # specs written (3bce844c); live verify needs stack up + zustand fix + ADR-008 dev_app deploy
adr_004_compliance: full
ready_artifacts:
  - 03-arch.md
  - 03-arch-be.md
  - 03-arch-fe.md
  - 04-validators.yaml
  - 05-guidelines.md
  - 06-tickets.yaml
  - dispatch-plan.md
prior_art_scan_done: true
ratified_by_chris: true
ratified_visual_by_chris: true
parallel_safe: true
priority: high
estimated_dev_days: 3-4
dependencies:
  hard:
    - vitalia-fase1-empty-states
    - vitalia-fase1-routing-shell
  soft:
    - vitalia-fase2-lisa-marca
blocks_hard: []
blocks_soft:
  - vitalia-fase2-valeria-agenda
  - vitalia-fase2-lisa-servicios
reuse_map_summary: >-
  REUSE patients+staff models shipped · NEW UI CRUD perfiles + N3-dyn workspace
  [doctor-id] · NEW personal-branding bio + horarios + KPIs · doctors-as-faces
  preview
spawned_at: 2026-05-22T00:00:00.000Z
next_action: /dev-team vitalia vitalia-fase2-lisa-doctores → build T-BE-1 (DAG root) → autonomous through APPROVED → /pm-vitalia merge
release: F2
cap_target: lisa.doctores
cap_change_type: new
parent_story: null
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

## Prior art scan (2026-05-30 · `/pm-vitalia`)

> Ejecutado per `.claude/rules/anti-duplication-refining.md`. Corrige asunciones del scope original.

### Correcciones al scope original (el checkpoint asumía paths que no existen)

| Asunción original | Realidad en código | Acción para `/po-ux` + `/architect` |
|---|---|---|
| `module: staff` · Doctor model en `vitalia/backend/src/modules/vitalia/staff/` | **NO existe `staff/`**. Doctor vive como `VitaliaDoctorExtensionModel` en `infrastructure/models/doctor_extension_model.py` + `DoctorExtensionRepository` (`# cap: booking.prepaid-booking-advisory-locks`). El módulo de negocio salud es **`clinics`**. | Corregido `module: clinics`. El backend de perfiles doctor **extiende `clinics` + doctor-extension existente**, NO crea `staff/`. |
| "Horarios → genera `availability_slots` para Agenda Valeria" (parecía build nuevo) | **`scheduling/` ya tiene** `agenda_slot` (domain), `create_appointment_service`, `agenda_grid_service`, `agenda_router`, appointment repos. + engine `luana-core-scheduling` + `luana-core-commercial-calendar`. | Horarios del doctor **cablea hacia `scheduling/` + engine existente** (CONSUME, no recrea). Tab Horarios → escribe availability que `scheduling` ya consume. |
| Reuse "patients PHI masking utils" genérico | `booking/prepaid-booking-advisory-locks.yaml` (deprecated) define `advisory_locks` + slots por doctor + consent modal ya shipped. | KPIs tab + slots disponibles reusan endpoints `bookings/available-slots` existentes. |

### Engine a consumir (NO recrear)
- `luana-core-scheduling` — availability/slots base.
- `luana-core-commercial-calendar` — calendario comercial.

### Capability decision (ratificada Chris 2026-05-30)
- `cap_target: lisa.doctores` · `cap_change_type: new` (mapa: zona **Agentes → Lisa**).
- Caps relacionadas **deprecated** que esta story sucede:
  - `clinics/clinics-brand-extension.yaml` (`replaced_by_story: vitalia-fase2-lisa-doctores`).
  - `booking/prepaid-booking-advisory-locks.yaml` (slots/locks — se consume, no se recrea).
- En Fase F.3: crear `capabilities/staff/` NO — la cap vive bajo agente Lisa. Doc el linaje (clinics-brand-extension → sucedida por lisa.doctores) en el change_log de la cap nueva.

### Decisión: net-new UI + extend backend
- **NEW**: UI `features/lisa/components/doctores/` + rutas `lisa/doctores/` + `lisa/doctores/[doctor-id]` (hoy `features/lisa/` solo tiene `marca` + `placeholders`).
- **EXTEND**: backend doctor profiles sobre `clinics` + `doctor_extension` + CONSUME `scheduling`/engine para horarios.

## Referencias

- **Design Contract:** `vitalia/docs/architecture/SHELL-DESIGN-CONTRACT.md`
- **Navigation tree:** § lisa.doctores
- **HIPAA-lite:** `vitalia/.claude/rules/hipaa-lite.md`
- **Prior art:** `clinics/` module · `scheduling/` module · `infrastructure/models/doctor_extension_model.py` · engine `luana-core-scheduling`

## Ready package (`/architect` Opus 4.8 · 2026-05-31)

`refined → ready`. 7 artefactos. `adr_004_compliance: full`. 11 tickets, DAG sin ciclos, `autonomous_mode: true`.

**4 decisiones arquitectónicas resueltas (03-arch § Architecture Decisions):**
- **D-1** `EntitySubNavBar` (N3-dynamic) = componente nuevo sibling de `SubSubTabsBar` (no lo modifica). Addendum ADR-004 § 3.1.1 → owner `/pm-vitalia` F.3.
- **D-2** ⚠️ `commercial-calendar` NO expande recurrencia (es calendario marketing). Proyección = brand-local `dateutil.rrule`. La business rule `availability-projection-via-engine` parte de premisa errónea → corregir wording al merge.
- **D-3** ⚠️ presigned upload NO existe en `luana-core-assets` (solo proxy `upload_asset`). Se consume proxy upload; presign diferido a `/pm-luana` lift futuro.
- **D-4** bio-gen = servicio determinista BE (`clinics/application`), NO agentic → R23 NO aplica → Sonnet.
- **D-5** NEW tabla `vitalia_doctors` (no existía perfil; `vitalia_doctor_extensions` solo guarda extensiones).
- **D-6** NO split (11 tickets DAG cohesivo).

**Chris manual action (T-BE-7):** generar R2 S3 creds + bucket + CORS + rotar `cfat_`. Code/tests proceden mockeados.

**Open questions for PM:** ver `03-arch.md § 16` (5 ítems — addendum ADR, corrección business rule, presign lift, open_ended horizon, R2 creds).

**Next:** `/dev-team vitalia vitalia-fase2-lisa-doctores` → T-BE-1.
