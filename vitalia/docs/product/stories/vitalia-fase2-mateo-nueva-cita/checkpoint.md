---
story_id: vitalia-fase2-mateo-nueva-cita
type: ui-story
agent_owner: mateo
module: scheduling
capability: mateo.agenda
state: developing
phase: DEVELOPING                                   # /dev-team build · DAG 6 waves (9 tickets) · autonomous_mode:false → pausa en G
build_started: 2026-06-22                           # /pm-vitalia ready→developing + handoff /dev-team
input_spec_signed: true                             # ✍ FIRMA 1 funcional (Chris 2026-06-21)
mockup_final_signed: true                           # ✍ FIRMA 2 mockup FINAL (Chris 2026-06-22)
ratified_by_chris: true
architecture_pattern: ADR-vitalia-004
adr_004_compliance: full
arch_run_on: 2026-06-22                             # /architect cerró ready package
verification_nature: funcional
autonomous_mode: false                              # architect propone; Chris ratifica
ready_package:
  arch: 03-arch.md (+ 03-arch-be.md + 03-arch-fe.md)
  validators: 04-validators.yaml
  guidelines: 05-guidelines.md
  tickets: 06-tickets.yaml                          # 9 tickets (5 BE + 4 FE)
  dispatch: dispatch-plan.md
promotion_precursor:                                # 4 atoms del canon → @luana/ui-kit
  gate: /pm-luana
  proposal: docs/promotion-protocol/proposals/2026-06-22-ui-kit-nueva-cita-atoms.md
  atoms: [FormActionBar, "Badge success|warning", "PageHeader back-pill", "EntityPicker.createAction"]
  soft_dep: true
  state: migrated                                   # ✅ 2026-06-22 · @luana/ui-kit 0.7.0 · consumible (workspace:*) → FE desbloqueado
created: 2026-06-21T00:00:00Z
priority: high
estimated_dev_days: 4-5                             # creció: + endpoint disponibilidad + constraint DB + chip + mini-vista + reasignar
dependencies:
  hard: []
  soft: [vitalia-scheduling-mateo-review, vitalia-fase2-mateo-pacientes]   # nace de live-QA D11 · reusa alta de paciente de D10
blocks_hard: []
blocks_soft: []
release: F2
cap_target: scheduling.mateo-agenda
cap_change_type: extend                          # mejora el form de create dentro de la cap agenda
parent_story: null

# Zona/caja del mapa (paradigm-arquitectura · derivada de SYSTEM-MAP.yaml)
zone: agentes
box: mateo
functional_area: mateo.agenda
---

# vitalia-fase2-mateo-nueva-cita — idea

**Origen:** D11 de la live-QA `vitalia-scheduling-mateo-review` (2026-06-21). El form "Nueva cita" funciona pero es inusable: médico = textbox de UUID a mano, servicio = texto libre, hora-fin manual.

**Goal:** Form "Nueva cita" usable sobre la agenda de Mateo.

**Scope candidato:**
- Médico → dropdown de `vitalia_doctors` (no UUID a mano).
- Servicio → dropdown de `vitalia_appointment_clinic_map.service_label` (no texto libre).
- Hora-fin → autocalc desde hora-inicio + duración del servicio (no manual).
- El form ya existe en `features/mateo` (abre vía botón "Crear nueva cita", `haspopup=menu`) — se cambian inputs, NO se crea pantalla de cero.

**Constraints:** CONSUME scheduling + `vitalia_doctors` + `clinic_map` · Select de `@luana/ui-kit` (no `<select>` nativo) · ENFORCE-CHECKLIST · Spanish neutro LatAm · NO toca core ni otras marcas.

**Next action:** `ready` (2026-06-22). `/architect` cerró el ready package: `03-arch.md` (+ `03-arch-be.md` + `03-arch-fe.md`) · `04-validators.yaml` (100% de los 28 SC + mutation HARD en create/EXCLUDE/availability + playwright_visual_scope + dev_app_verified) · `05-guidelines.md` · `06-tickets.yaml` (9 tickets: 5 BE + 4 FE, con assignment per ticket) · `dispatch-plan.md` (autonomous_mode:false · DAG 6 waves).
**Decisiones del architect:** RN-9 (dedup paciente) **FOLD** (ticket BE-5 liviano, cierra hueco PHI · D-C). EXCLUDE constraint en `vitalia_appointment_clinic_map` brand-local (mirror cols start/end/status) → **NO toca engine** (D-A/D-E.1). DayAvailabilityStrip = componente feature scheduling, lift-candidate core NO ahora. 4 átomos del canon = **PROMOTE** vía `/pm-luana` (precursora P-0, soft-dep de los tickets FE) · contrato en `mockups/PROPOSED-CANON-ATOMS.md`. `CrearCitaForm`/`CrearCitaButton` modal MUERE (D-G · AC-9 hoja full-page).
→ **Próximo: `/dev-team` build EN CURSO** (2026-06-22). P-0 ✅ cerrado (`/pm-luana`, ui-kit 0.7.0 migrated, FE desbloqueado). `/pm-vitalia` transicionó `ready→developing` + handoff `/dev-team vitalia`. DAG 6 waves (9 tickets: 5 BE + 4 FE). `autonomous_mode:false` → dev-team pausa en **G** (`AWAIT_CHRIS_VERIFY`) para live-verify de Chris en dev-app (Rule #37) antes del auditor.
