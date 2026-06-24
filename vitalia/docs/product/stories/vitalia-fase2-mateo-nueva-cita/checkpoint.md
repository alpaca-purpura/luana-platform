---
story_id: vitalia-fase2-mateo-nueva-cita
type: ui-story
agent_owner: mateo
module: scheduling
capability: mateo.agenda
state: developing
phase: LIVE_VERIFY_FIXLOOP                           # 9 tickets construidos · live-verify destapó 5 bugs de integración · fix-loop en curso
build_started: 2026-06-22                           # /pm-vitalia ready→developing + handoff /dev-team
dod_live_verified: true                             # ★ happy path core ejercido live (cita-create 201 + patient-create 201, filas reales). Falta G de Chris (full functional + 409 + toast + demo) + auditor de los 9 fixes
dod_env: "localhost:3002 (FE) + localhost:8002 (BE docker) · dr.demo@vitalialat.com · Chrome DevTools MCP"
dod_evidence:
  - action: "crear paciente inline (nombre 'Sofia', sin teléfono) desde el picker de nueva-cita (autenticado dr.demo)"
    observed: "POST /api/v1/crm/patients → 201 · vitalia_patients count 29→30 (fila real, masked)"
    backend_log: "POST /api/v1/crm/patients HTTP/1.1 201 Created"
    verified_at: 2026-06-23
  - action: "crear cita: Botox · 29-jun 09:00 · Dr.2464fad7 (chip 'Médico disponible') · paciente Sofia · Crear cita"
    observed: "POST /api/v1/scheduling/appointments → 201 · vitalia_appointments fila SCHEDULED (slot 2026-06-29T12:00Z=09:00 tz UTC-3, dur 30, origin walk_in, offer/clinic/patient set) + vitalia_appointment_clinic_map mirror 12:00→12:30 SCHEDULED (EXCLUDE anti-solape activo)"
    backend_log: "POST /api/v1/scheduling/appointments HTTP/1.1 201 Created"
    verified_at: 2026-06-23
  pending_at_G: "409 solape live (cubierto por integration test) · toast 'Cita creada' + grilla refleja (no observado, sesión expiró tras el 201) · demo-script.md · firma Chris"
live_verify_findings:                               # Chrome DevTools MCP (dr.demo · localhost:3002) 2026-06-22/23 — detalle en chris-input.md
  - "bug1 render token-isLoaded → skeleton eterno · FIXED+verificado (/offer/servicios 200, pickers pueblan)"
  - "bug2 token 60s cacheado → writes 307 · FIXED 1d63734f (free-doctors POST 200, era 307)"
  - "bug3 BE channel_first/notes columnas inexistentes → 500 · FIXED 0ff94f55 mig051 (crm GET 200, 29 pacientes)"
  - "bug4 nested <form> hydration → submit tragado · FIXED faa643f7 (form→div, hydration limpio)"
  - "bug5 inline-create no POSTeaba · FIXED faa643f7 (phone '' → null) · ★ el 'no POST' era ARTEFACTO del click Chrome-MCP (sintético no dispara onClick React) — native .click() → patient POST 201 (DB 29→30). Feature sana."
  - "VERIFICADO live (native-click): login·shell·pickers·servicios·free-doctors POST 200·chip Médico-disponible·day-strip(AC-8)·reasignar 1-clic(AC-5)·patient search-by-name(decrypt)·patient CREATE 201(real)·Crear-cita se habilita"
  - "bug6 cita-create 500 'notes_internal no existe' · FIXED 9feb302c (mig052 + test real-schema, scheduling 236/236)"
  - "bug6b RESUELTO: INSERT llena clinic_id (contexto) + offer_id (FE manda selectedServiceId). BE 86b90904 + FE 453ea164"
  - "bug8 cita-create 500 NoReferencedTableError (FK ORM mirror) · FIXED 2de80705 (fix-loop holístico + test integración real end-to-end 7/7, smoke-insert real)"
  - "bug9 cita-create 500 AppointmentDetailDTO.currency requiere str pero es None · FIXED 193f1a7b (currency str|None, currency-handling rule). El INSERT+mirror YA funcionaban; fallaba la serialización de la respuesta"
  - "✅ HAPPY PATH VERIFICADO LIVE (2026-06-23): cita-create 201 (fila vitalia_appointments SCHEDULED + mirror clinic_map 12:00→12:30) · patient-create 201 (DB 29→30). Núcleo funciona end-to-end tras 9 fixes"
  - "★ patrón: 9 bugs en cascada en el create-path, NINGUNO agarrado por unit (mockean DB/Clerk). El test holístico cazó #8 pero no #9 (no probó el response DTO del router con currency null). Recomendación durable: test integración real-DB del ROUTER (no solo service) + contract FE↔BE (HB-42)"
  - "pendiente live (G de Chris): 409 solape (cubierto por integration test) · toast + grilla refleja (sesión expiró tras el 201) · demo-script.md"
  - "infra: scripts/git-hooks/pre-commit (+1655 sin commitear) tiene MARCADORES DE CONFLICTO git → rompió sweep-guard HB-31 (contaminación cross-sesión) → reparar"
  - "e2e runner roto platform-wide (clerk.setup.ts:31 describe.configure, pre-existente) → HB pendiente"
verify_battery_2026_06_24:                          # /dev-team VERIFY_BATTERY — correr TODA la batería del architect ANTES del auditor (Chris opt-A). Estado por gate:
  be_suite: "✅ GREEN 632/632 (scheduling+crm). Incluye real-DB EXCLUDE/half-open/cancelled-reuse + adversarial (cross-clinic/cross-tenant/rbac/phi)."
  fixed_be_test: "test_migration_050_exclude.py — estaba RED y descartado como 'flake pre-existente'. 2 bugs reales del TEST: (1) async_engine module-scoped vs loop function-scoped (pytest-asyncio) → usar conftest db_session; (2) INSERT al mirror con appointment_id huérfano → FK violation (helper _insert_map: parent vitalia_appointments primero). Ahora 18/18 GREEN real-DB."
  mutation: "⚠️ DEGRADADO advisory — scripts/mutation_gate.py invoca mutmut con --paths-to-mutate, opción ELIMINADA en mutmut 3.5.0 (config-only). Wrapper roto, no mutmut. Root cause → HB-97. Compensación: los 4 targets tienen unit+integration+real-DB."
  schemathesis: "⚠️ NO CORRIDO — binario schemathesis ausente del venv → degrada advisory (validator note)."
  e2e_smoke: "🟡 4/5. happy-path + form-render + back-pill GREEN. a11y destapó 3 violaciones reales (axe)."
  e2e_regression: "🟡 ERA HUÉRFANO (e2e/specs/regression/ no matcheaba ningún project testMatch → los 9 SC NUNCA corrieron = cobertura fantasma, HB-96). MOVIDO a e2e/regression/mateo/. Ahora 8/11: SC-crear-paciente (form not-found=dev-flake) · SC-mini-vista (nc-day-strip-container hidden=triage) · SC-a11y (engine ChatMessages) fallan."
  a11y_fixed: "2 violaciones de scope-story FIXED: aria-valid-attr-value (CanalPicker misuso de Tabs sin TabsContent → radiogroup) + button-name (ServicePicker/DoctorPicker SelectTrigger sin aria-label)."
  a11y_engine_debt: "1 violación queda: scrollable-region-focusable en core/@luana/ui-kit/.../ChatMessages.tsx (chat Valeria, TODAS las rutas). Engine/compartido → fix vía /pm-luana (no se edita desde story de marca). Fix trivial: tabIndex={0} en el log scrollable."
  e2e_dev_flake: "Bloqueante e2e: `next dev --webpack` resetea intermitente los chunks de boundary (error.js/not-found.js) → ERR_CONNECTION_RESET → 'SyntaxError: Invalid or unexpected token' → rompe el client shell (data-shell-ready nunca true). El shell es SANO (probado dsr='true' en aislamiento). El gate anti-burbuja lo caza → falsos rojos. Fix real = e2e contra prod-build (next build) o estabilizar dev. HB pendiente."
  fixed_e2e_helper: "assertShellMounted (base.ts, HB-68) chequeaba div[aria-label='Interfaz principal Vitalia'] del AppShell MUERTO (pre-migración @luana/ui-kit). Verde-fantasma latente que el runner roto (HB-98) ocultó. Reapuntado a main#main-content[data-shell-ready='true'] (señal del kit) + timeout 20s (cold-compile dev)."
  ci_parity: "⬜ NO CORRIDO (pendiente decisión — heavy)."
  next: "Decisiones Chris: (a) a11y engine fix vía /pm-luana; (b) e2e dev-flake → prod-build o aceptar retries; (c) triage SC-mini-vista hidden; (d) ci-parity. Recién con eso → G."
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
