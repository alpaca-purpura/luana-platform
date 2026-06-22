---
story_id: vitalia-fase2-mateo-nueva-cita
type: ui-story
agent_owner: mateo
module: scheduling
capability: mateo.agenda
state: refining
phase: AWAIT_MOCKUP                                 # RONDA 1 firmada; falta mockup FINAL (FIRMA 2)
input_spec_signed: true                             # ✍ FIRMA 1 funcional (Chris 2026-06-21)
mockup_final_signed: false
architecture_pattern: ADR-vitalia-004
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

**Next action:** RONDA 1 firmada (`input_spec_signed`). Construir el mockup HTML del form dentro del shell real (canon + tokens globals.css) → iterar con Chris → FIRMA 2 (`mockup_final_signed`) → genera Gherkin+matriz → `refined` → `/architect`.
