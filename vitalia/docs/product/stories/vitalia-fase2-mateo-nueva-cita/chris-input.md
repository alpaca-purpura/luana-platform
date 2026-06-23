<!-- voseo-allowed: buzón conversacional interno (notas Chris voseo + Claude tuteo) — escape per spanish-text.md R25 -->
---
story_id: vitalia-fase2-mateo-nueva-cita
created_at: 2026-06-21T00:00:00Z
last_modified: 2026-06-21T00:00:00Z
notes_count: 1
refs_count: 1
conversation_count: 1
---

# chris-input.md · vitalia-fase2-mateo-nueva-cita

> D11 de la live-QA de la agenda de Mateo. Form "Nueva cita" usable.
>
> Cap target: `scheduling.mateo-agenda` · Cap change type: `extend`.

## 💭 Notas

### 2026-06-21
De la live-QA: el form de "Nueva cita" pide el ID del médico como texto (UUID a mano), el servicio como texto libre, y la hora de fin a mano. Hay que volverlo usable: dropdown de médicos, dropdown de servicios, y que la hora de fin se calcule sola desde la duración del servicio.

## 📎 Referencias

- **📖 story-ref** · vitalia-scheduling-mateo-review (D11 en `LIVE-QA-2026-06-21.md` + checkpoint)
  > origen del defecto; ahí está el repro y la lectura de producto

## 💬 Conversación

### 2026-06-21 · 🧑 chris
D10/D11/D12 con diseño. 3 stories separadas. Arrancamos por D11 (Nueva cita).

### 2026-06-21 · 🤖 claude · `/pm-vitalia` · ✓ APLICADO
Creé esta story (idea) derivada de D11. Scope: dropdown médico (`vitalia_doctors`), dropdown servicio (`clinic_map.service_label`), hora-fin autocalc. Encadeno `/po-ux` para refinar spec + mockup ahora.

### 2026-06-21 · 🤖 claude · `/po-ux` · ⚠️ DUDA
Prior-art + fuentes de datos (mejorar el form que YA existe, `CrearCitaForm.tsx`):
- **Médicos** → fuente lista: `GET /clinics/.../doctors` (`DoctorListResponse`) ya existe. Dropdown directo.
- **Servicios** → el catálogo es `lisa.servicios` (DONE), viven como offers en `products`, endpoint `/api/v1/offer/servicios`. Dropdown directo PERO **sin campo duración**.
- **Autocalc hora-fin** → necesita duración por servicio; hoy no existe. Es el crux a decidir.

Abierto: (Q1) rol/RBAC de quién agenda · (Q2) de dónde sale la duración para autocalcular el fin. Reflejo + Q1 a Chris en el turn.

### 2026-06-21 · 🧑 chris
Rol = recepción (`admin_clinic`) + médico (`doctor`). Duración: opción B (por servicio en el catálogo). "Metelo dentro ya que es necesario; revisa bien dónde es el mejor lugar en lisa.servicios que quepa."

### 2026-06-21 · 🤖 claude · `/po-ux` · ✓ APLICADO (+ 💡 PROPONE)
El campo de duración YA EXISTE en lisa.servicios: `initial_appt_duration_minutes` (dominio `offer_ext.py:54` comentado "RN-31 Mateo agenda"; UI workspace servicio grupo "Modalidad y agenda" → "Duración de la cita inicial", `ResumenView.tsx:758`, editable+autosave). No hay que agregar nada al catálogo ni tocar la UI de Lisa.
- **Único gap:** el campo está en `ServiceDetailDTO` pero NO en `ServiceListItemDTO` (dtos.py:164). El dropdown de servicios de D11 consume la lista → exponer `initial_appt_duration_minutes` en el list DTO (≈1 línea BE + catalog_service). Autollena el fin sin fetch extra.
- D11 fold sin precursora ni scope-creep en Lisa: form agenda consume campo existente + 1 línea BE.
- Edge: servicio con `duration=null` → default 30 min + editable.
- Rol allowed = {admin_clinic, doctor} (nurse mismo bracket PHI, fuera por defecto).
- Pendiente: (Q3) validación de solapamiento/disponibilidad del médico — re-pregunto.

### 2026-06-21 · 🧑 chris
Q3: VALIDA, no debería poderse (doble-book). En el form, al asignar doctor: poner fecha+hora a mano Y ver su disponibilidad; si no la tiene, asignar otro doctor. "Detengámonos un momento": investigá en internet con subagentes mejores prácticas + algoritmia para diseñar bien el flujo funcional.

### 2026-06-21 · 🤖 claude · `/po-ux` · ✓ APLICADO (investigación) + 💡 PROPONE
3 subagentes (code-map + UX líderes + algoritmia). Síntesis durable en `00-research-availability.md`. Hallazgos:
- **Bug latente:** walk-in/teléfono hoy NO tiene protección anti-doble-booking (create_appointment no chequea, tabla sin constraint). D11 lo arregla.
- Free/busy YA consultable (`vitalia_availability_slots` + blocks); falta endpoint FE + garantía DB.
- UX (Tebra): input manual + chip disponibilidad live (Disponible/Ocupado/Fuera-horario) + reasignar a médico libre.
- Garantía = constraint Postgres EXCLUDE (btree_gist, tstzrange, partial WHERE status<>CANCELLED) → race-proof, 23P01→409.
- Recomendación: solape médico = bloqueo duro (alineado con "no debería poderse") + reasignar indoloro; override-overbooking = NO ahora (YAGNI).
- Open (Q4): fuera-de-horario = ¿warning permitido o bloqueo? Recomiendo warning.
- Scope creció: D11 ya no es "swap de inputs" — suma endpoint disponibilidad + constraint DB + chip + reasignar. Bump dev-days.

### 2026-06-21 · 🧑 chris
Q4: fuera de horario también BLOQUEA (no solo solape).

### 2026-06-21 · 🤖 claude · `/po-ux` · ✓ APLICADO (RONDA 1 escrita)
Escribí `01-spec.md` RONDA 1 (funcional, sin mockup ni Gherkin): § dónde vive + Mapa funcional (happy + árbol bifurcaciones con SC + 8 RN + 7 AC) + tabla de campos + 5 notas BE + out-of-scope + prior art. Decisiones: solape+fuera-horario+sin-horario = bloqueo; reasignar a médico libre; duración del servicio (null→30); UTC/IANA.
Open para FIRMA 1: (1) ver-disponibilidad = chip+lista vs mini-vista día (default chip+lista) · (2) buffer fuera de scope (default 0). Pendiente: `input_spec_signed`.

### 2026-06-21 · 🧑 chris
Mini-vista del día = SÍ (in scope). Buffer fuera de scope = OK. "Firmo" → FIRMA 1.

### 2026-06-21 · 🤖 claude · `/po-ux` · ✓ APLICADO (FIRMA 1 + mockup)
`input_spec_signed: true` en spec+checkpoint; mini-vista a AC-8 + § Pantallas; buffer out-of-scope. estimated_dev_days 2-3→4-5. phase: AWAIT_MOCKUP.
Mockup construido (subagente, base = `valeria-agenda/mockups` crear-cita + _shared.css): `mockups/nueva-cita.html` (782 líneas + _shared.css copiado). Drawer sobre agenda + form completo (Selects canónicos, duración del servicio, fin autocalc, chip disponibilidad, mini-vista día, reasignar) + galería 4 estados de bloqueo + validaciones + toast 409. Servido :8890, screenshot verificado. Desviaciones marcadas: theming Mateo (overrides token), mini-vista esquemática, origen segmented. Pendiente: FIRMA 2 (`mockup_final_signed`).

### 2026-06-21 · 🧑 chris
Dilema de consistencia: el drawer NO es un patrón usado antes (todo fue árbol+hojas). Click-afuera puede perder datos. Propone: ¿sub-tab "Nueva cita" al costado de Agenda (y dentro) + nuevo paciente como hoja? "usa los mejores principios de UX/UI, investiga y dame una respuesta."

### 2026-06-21 · 🤖 claude · `/po-ux` · 💡 PROPONE (investigación contenedor)
Subagente investigó contenedor de creación. Veredicto honesto:
- ✅ Drawer = mal para este sistema (cero precedente + click-afuera pierde datos = defecto). Chris tenía razón.
- ❌ Sub-tab = anti-patrón IA (verbo/acción en nav de sustantivos/secciones; NN/g naming-nav). Corrijo a Chris.
- ★ **CORRECTO = hoja full-page ("Nueva cita" leaf)** entrada desde botón "+ Nueva cita" (toolbar Agenda + click-slot) + Guardar/Cancelar + back-pill. = patrón Google Calendar "Más opciones" (escala a página); NN/g+Smashing mandan forms complejos a páginas; data-safe por construcción; cero primitiva nueva.
- ✅ **Nuevo paciente = hoja** que REUSA la superficie de alta de paciente (D10), typeahead existing-first + "+ Crear paciente" → vuelve preseleccionado. Chris tenía razón.
- Dependencia suave nueva: alta de paciente se acopla a D10 (no construida) → D11 hace alta mínima-real que D10 adopta.
- Pivot: rehago mockup (drawer→hoja). No estaba firmado, cero deuda. Pendiente: confirmar pivot + rebuild.

### 2026-06-21 · 🧑 chris
Confirma: hoja full-page (leaf).

### 2026-06-21 · 🤖 claude · `/po-ux` · ✓ APLICADO (pivot + mockup v2)
Spec actualizado: § Context contenedor=hoja full-page (ruta `/mateo/agenda/nueva-cita`, botón "+ Nueva cita", back-pill, Guardar/Cancelar); paciente=typeahead existing-first + "+ Crear paciente" (hoja, reusa D10); canal de ingreso=walk_in/telefono; AC-9/AC-10; BE-6 (alta paciente reusable) + BE-7 (reconciliar enum origin); dep suave D10. Mockup re-containerizado (subagente) drawer→leaf: shell + header N3 full-bleed + 2-col (datos | disponibilidad) + sticky action bar + galería 4 estados + hoja crear-paciente + validaciones. Servido :8890, screenshot verificado, consistente. Pendiente: FIRMA 2 (`mockup_final_signed`).

### 2026-06-22 · 🧑 chris
Revisá la consistencia con el storybook; es buen momento de rehacer y proponer elementos que no estén allí.

### 2026-06-22 · 🤖 claude · `/po-ux` · 💡 PROPONE (auditoría mockup vs Storybook @luana/ui-kit)
Inventarié el canon: `core/@luana/ui-kit` (82 stories · ~50 átomos + organism shell + layout + archetypes). Mapeé cada control del mockup → componente del kit. **Veredicto: ~90% se compone del canon existente** (FormPageScaffold, RichSelect, TogglePill=segmento canónico, EntityPicker, Badge, SmartDatetimePicker, Avatar, Sonner, Card, inline-editable). **5 gaps reales** (no están en el Storybook):
1. **FormActionBar (footer sticky de submit explícito)** — el canon es autosave-bias (FormPageScaffold solo tiene `autosaveIndicator`); los flujos de CREAR (Nueva cita, Crear paciente) necesitan Guardar/Cancelar sticky. Recurrente platform-wide. → canon-add (/pm-luana).
2. **Badge `success` + `warning` variants** — hoy solo default/secondary/destructive/outline; los chips de estado (Disponible verde / Fuera de horario ámbar) no tienen variante. Trivial+aditivo. → canon-add.
3. **PageHeader back-pill `‹ {root}`** — PageHeader solo tiene title/subtitle/actions; la hoja-leaf necesita el retorno "‹ Agenda" sin abusar de EntitySubNavBar (que es nav de entidad). → canon-add chico.
4. **EntityPicker `createAction` slot** — "+ Crear paciente" (pick-or-create) no existe en el picker. → canon-add medio.
5. **DayAvailabilityStrip (mini-vista del día)** — NO es gap de canon: es componente de feature scheduling (vitalia) + lift-candidate a `core/luana-core-scheduling`. Lo decide `/architect`.
- **ComputedField (Hora de fin autocalc)** = se COMPONE de inline-editable + Badge (no atom nuevo · ponytail).
- **Fix de mockup (no gap):** duración duplicada (badge read-only + campo editable) → colapsar a UN campo editable "Duración (min) · viene del servicio".
- ui-kit = CORE → adiciones al canon van por `/pm-luana` promotion gate, no dentro de esta story. Espero greenlight de Chris de qué gaps banco antes de rehacer el mockup.

### 2026-06-22 · 🧑 chris
Greenlit los 4 gaps (FormActionBar + Badge success/warning + PageHeader back-pill + EntityPicker.createAction).

### 2026-06-22 · 🤖 claude · `/po-ux` · ✓ APLICADO (mockup rehecho + proposal)
Rehíce `mockups/nueva-cita.html` (subagente, Edit quirúrgico — no rebuild): (1) duración colapsada a un campo editable [fix de la redundancia] → Médico dropdown ya visible; (2) legend "Mapeo al canon @luana/ui-kit" (10 existentes ✓ + 4 propuestos ★ + DayAvailabilityStrip ◆ feature); (3) tags `★ PROPUESTO` inline en los 4 átomos; (4) galería "Átomos propuestos al canon" con mini-demo + API de cada uno. Creé `mockups/PROPOSED-CANON-ATOMS.md` con el contrato (destino `core/@luana/ui-kit/src/` + props + story). Servido :8890, screenshot verificado, consistente con el Storybook. **Soft-dep nueva:** los 4 átomos del canon (greenlit) son precondición de build → `/architect` secuencia (proposal `/pm-luana` o precursora core-ds). Pendiente: revisión de Chris del mockup rehecho → FIRMA 2 (`mockup_final_signed`).

### 2026-06-22 · 🧑 chris
Me gusta. Pero el crear-paciente no se ve bien ni se entiende la interacción: ¿es popup? ¿un elemento que aparece y desaparece después de crear?

### 2026-06-22 · 🤖 claude · `/po-ux` · ✓ APLICADO (interacción crear-paciente = inline en el picker)
El mockup mezclaba 2 modelos (spec decía "hoja aparte" pero el átomo `EntityPicker.createAction` implicaba inline). Reflejé la tensión + recomendé inline. **Chris eligió inline en el picker** (AskUserQuestion con previews A/B). SUPERSEDES la decisión previa "hoja aparte". Razón: preserva el form de la cita a medio llenar (lo mismo que motivó elegir hoja sobre drawer) + más rápido para walk-in + crea registro real mínimo (no descartable, queda en D10). Apliqué: (1) spec — happy path step 2 + AC-10 + § Pantallas Paciente + BE-6 (alta inline mínima `POST patients`, no la superficie D10 completa) + § Decisiones (con nota SUPERSEDES); (2) mockup — reemplacé la tarjeta "Crear paciente" (parecía página aparte con back-pill) por el picker abierto con create inline expandido (search→sin resultados→+Crear→mini-form nombre+tel+email→"Crear y elegir"), sin back-pill, captions que explican "sin salir del form / registro real / se enriquece en D10 / no es popup ni hoja". Servido :8890, screenshot verificado. Pendiente: FIRMA 2 (`mockup_final_signed`).

### 2026-06-22 · 🧑 chris
Firmo. Generá el Gherkin, las reglas, todo bien pensado recorriendo todas las casuísticas. Pasá a /architect.

### 2026-06-22 · 🤖 claude · `/po-ux` · ✓ APLICADO (FIRMA 2 + RONDA 2 generada → refined)
`mockup_final_signed: true` + `ratified_by_chris: true` en spec+checkpoint. Generé RONDA 2: **28 scenarios Gherkin** cubriendo todas las casuísticas + las 7 sub-categorías mandatory (happy/negative/edge/adversarial + race_condition/concurrent_users/network_failure/empty_state/large_dataset/accessibility/i18n) + **§ Matriz de cobertura sin huecos** (cada Bif/RN/AC → SC → verificación REAL). Aristas que la barrida hizo aflorar y quedaron cubiertas: half-open boundary (SC-half-open-ok/block), CANCELLED libera franja (SC-cancelled-reuse), revalidación al cambiar servicio/hora (SC-revalida-cambio), reasignar sin médicos libres (SC-reasignar-vacio), fail-closed de disponibilidad (SC-disponibilidad-falla), retry idempotente por constraint (SC-create-timeout-retry), bypass server-side (SC-bypass-availability), DST (SC-i18n-tz), cross-clinic/cross-tenant PHI (SC-cross-clinic/tenant). **2 reglas nuevas propuestas:** RN-9 (dedup paciente inline por teléfono · marcada PROPUESTO, descopable a fast-follow) + RN-10 (disponibilidad = advisory, garantía dura = constraint DB). state → `refined`. Encadeno `/architect <brand>: vitalia` (Skill tool inline, pm-skill-chaining).

### 2026-06-22 · 🤖 claude · `/architect` · ✓ APLICADO (ready package cerrado → state: ready)
`architect-orchestrator` single-shot full-stack produjo los 5 artifacts (03-arch + be/fe · 04-validators · 05-guidelines · 06-tickets · dispatch-plan). **9 tickets (5 BE + 4 FE)**, assignment per ticket (builder-backend/frontend workhorse), autonomous_mode:false. Decisiones del architect: RN-9 (dedup paciente) **FOLD** en BE-5 (ticket liviano, cierra hueco PHI). EXCLUDE anti-solape en `vitalia_appointment_clinic_map` (mirror cols start/end/status desde engine appointments + doctor_id brand) → garantía DB **sin lift de engine**. 4 átomos del canon = **PROMOTE** vía `/pm-luana` (precursora P-0, soft-dep de tickets FE). DayAvailabilityStrip = feature scheduling, lift-candidate core NO ahora. Modal CrearCitaForm MUERE (hoja full-page AC-9).
**Validación mía (Step 3/8):** caché el riesgo de tabla del EXCLUDE → confirmado SÓLIDO: engine `appointments` no tiene doctor_id (concepto brand), el overlap cruza 2 tablas, el mirror a clinic_map con sync transaccional (create + cancel/complete propaga, backfill idempotente, schema-mirror-exception) + EXCLUDE atómico (TOCTOU-safe) es correcto y testeado (mutation HARD). Caveat: reschedule del engine debe sincronizar el mirror (fuera de scope create, a vigilar). Ningún contrato imaginado. Open Q del architect (§16): RN-9 FOLD + engine-boundary del EXCLUDE → ambas resueltas/validadas. Próximo: P-0 promotion (/pm-luana, 4 átomos) + /dev-team build. Pendiente: ruteo + autonomous_mode (Chris).

### 2026-06-22 · 🧑 chris
P-0 átomos primero (AskUserQuestion).

### 2026-06-22 · 🤖 claude · `/pm-luana` · ✓ APLICADO (P-0 cerrado · 4 átomos al canon · FE desbloqueado)
Promotion proposal `docs/promotion-protocol/proposals/2026-06-22-ui-kit-nueva-cita-atoms.md` (accepted→migrated). Build ejecutado por builder (anti-creep: pm-luana no escribe core src) en `core/@luana/ui-kit`: FormActionBar (nuevo) + Badge success/warning + PageHeader back-pill + EntityPicker.createAction · tokens success/warning agregados (light+dark) · 4 stories + 18 tests · version 0.6.0→0.7.0. **Verificación independiente:** tsc exit 0, vitest 307 passed (0 regresiones). Kit resuelve por `main: src/index.ts` (source) y vitalia consume `workspace:*` → **consumible YA sin build step**. promotion_precursor.state: migrated en checkpoint → los 4 tickets FE están desbloqueados. Próximo: `/dev-team <brand>: vitalia` (BE + FE, 9 tickets). Heads-up portfolio (closure-gate scan): 3 stories abiertas de otras sesiones — vitalia-fase2-adrian-canal-inbound (developed) · nicolify-r0-design-system-adoption (developed) · nicolify-r1-abel-icp-buyer (reviewing).
Retomé la story (refining/AWAIT_MOCKUP). Re-serví `mockups/nueva-cita.html` en :8890 + screenshot full-page. Pre-review: el mockup está fiel y completo — shell wrapper consistente (Ribbon Mateo ámbar + SubTabs Agenda/Mi día/Recordatorios + header N3 full-bleed con back-pill), hoja full-page 2-col (datos | disponibilidad), dropdown Médico (Select canónico) presente, mini-vista del día (AC-8), chip disponibilidad, galería 4 estados de bloqueo + "Médicos disponibles" (AC-5) + hoja crear-paciente (AC-10) + validaciones inline + 409 carrera (AC-6). **1 detalle a decidir antes de firmar:** la duración se muestra DOS veces — badge read-only "Duración: 30 min — viene del servicio" bajo Servicio + campo editable "Duración (min)" al lado de Fecha. Redundante. Recomiendo colapsar a UN solo control: el campo editable "Duración (min)" con helper "viene del servicio · editable". Espero decisión de Chris + revisión del mockup → FIRMA 2.

### 2026-06-22 · 🤖 claude · `builder-backend` · ✓ APLICADO (T-BE-2 · pushed)
**Migration 050 EXCLUDE anti-solape (btree_gist) — f6ba9ac5**

DDL aplicado + verificado idempotente:
- `CREATE EXTENSION IF NOT EXISTS btree_gist`
- `ADD COLUMN IF NOT EXISTS start_time/end_time/status` (mirror desde `slot_iso+duration_minutes`)
- Dedup pre-existing dev-seed conflicts (status='CANCELLED' en mirror para filas duplicadas)
- `EXCLUDE USING gist (tenant_id=, clinic_id=, doctor_id=, tstzrange(start_time,end_time,'[)') &&) WHERE status<>'CANCELLED'`
- `CREATE INDEX IF NOT EXISTS ix_acm_doctor_range`
- Schema-mirror: `start_time/end_time/status` `mapped_column` en `AppointmentClinicMapModel`

Gates: 363/363 arch + 193/193 unit + ruff 0 + format clean. Re-run upgrade = no-op.
Test file: `tests/modules/vitalia/scheduling/test_migration_050_exclude.py` (integration markers).

### 2026-06-22 · 🤖 claude · `builder-backend` · ✓ APLICADO (T-BE-1 · pushed)
**Paths modificados:**
- `vitalia/backend/src/modules/vitalia/offer/api/dtos.py` — +1 field `initial_appt_duration_minutes: int | None = None` en `ServiceListItemDTO`
- `vitalia/backend/tests/modules/vitalia/offer/test_service_list_duration.py` — NEW (3 tests TDD, `pytestmark: integration`)

**Decisiones técnicas:**
- NO `_CATALOG_VERSION` bump (brand-local DTO, no engine catalog). Confirmado por offer-expert.
- NO cambios en `catalog_service.py` — `_view()` ya populaba el campo desde `OfferExt`, solo faltaba el field en list DTO.
- NO migración (columna ya existe en `vitalia_offer_service_ext` de story anterior).
- Cap header test: `# cap: scheduling.mateo-agenda`. DTO file ya tenía `# cap: lisa.servicios`.
- Gates GREEN: 3/3 T-BE-1 tests + 167/167 offer suite + 363/363 arch fitness + ruff 0 errors + format clean.

### 2026-06-22 · 🤖 claude · `/pm-vitalia` · ✓ APLICADO (ready→developing · handoff /dev-team)
Chris: "continuar la story hasta cerrarla". Step 0 closure-gate GREEN (única OPEN ajena = `vitalia-fase2-adrian-canal-inbound` en `AWAIT_CHRIS_VERIFY`, exenta WIP-cap, otro módulo). Verifiqué: ready package completo (9 tickets + dispatch DAG 6 waves), P-0 ✅ migrated (ui-kit 0.7.0 consumible `workspace:*`, FE desbloqueado), build fresh (cero `vitalia/{backend,frontend}/src` tocado). Transicioné `ready→developing` + claim-commit del ready package. Encadeno `/dev-team vitalia` (Skill inline, pm-skill-chaining). **`autonomous_mode:false` HARD** (PHI writes + EXCLUDE constraint + engine-boundary) → el build construye los 9 tickets y **pausa en G** (`AWAIT_CHRIS_VERIFY`) para tu live-verify en dev-app antes del auditor. No se cierra autónomo: vos firmás G, yo reconcilio (R) + auditor + merge. ⚠️ Heads-up: `scripts/git-hooks/pre-commit` tiene +1655 líneas sin commitear (ajeno a esta story, no lo toco) · promoción ui-kit 0.7.0 en working-tree (commiteada al claim, falta `promote-to-main` → decisión `/pm-luana`).

### 2026-06-22 · 🤖 claude · `builder-backend` · T-BE-5 · ✓ APLICADO
POST /api/v1/crm/patients + GET /api/v1/crm/patients?q= + find_by_phone() implementados. 35/35 unit GREEN + 361/361 CRM + 363/363 arch fitness. Commit: a2871456 (wip/vitalia).

### 2026-06-22 · 🤖 claude · `builder-backend` · T-BE-5-BUGFIX (schemafix) · ✓ APLICADO
ROOT CAUSE vivo: `vitalia_patients` no tenía columnas `channel_first` ni `notes` — patient_repository las referenciaba en INSERT + SELECT → 500 en GET /crm/patients y POST. Tests unitarios verdes porque mockean la DB.
FIX: migración 051 (idempotente IF NOT EXISTS) + 4 tests de regresión integration (RED→GREEN). 365/365 CRM suite GREEN. Idempotencia verificada (re-run alembic upgrade = no-op). Artifact: T-BE-5-schemafix-result.md.

### 2026-06-22 · 🤖 claude · `builder-backend` · T-BE-4 · ✓ APLICADO
create_appointment TOCTOU-safe + clinic_map mirror + origin reconcile. 4 cambios:
1. exceptions.py: AppointmentOverlapError (409) + OutOfWorkingHoursError (422) — domain pure, no framework
2. create_appointment_service: pre-insert OUT_OF_HOURS check (avail_svc optional); start_time/end_time/status=SCHEDULED en clinic_map mirror; IntegrityError pgcode=23P01 → AppointmentOverlapError; patient_id real (stub removido)
3. appointment_status_service: propaga new_status a clinic_map mirror (cancel libera franja EXCLUDE)
4. agenda_router + CreateAppointmentRequestDTO: origin→{walk_in,telefono}; patient_id required; legacy desde_paciente_existente removido; mapeo excepciones→HTTP
TOCTOU: DB EXCLUDE (23P01) es el único gate de solape (no pre-check-then-insert).
Tests: 229/229 unit GREEN (26 nuevos T-BE-4) + 363/363 arch fitness GREEN. Commit: 02643f1f

### 2026-06-22 · 🤖 claude · `builder-frontend` · T-FE-1 · ✓ APLICADO
Ruta nueva-cita full-page + NuevaCitaView + schema reconciliado + hooks React Query.
Implementado: ruta estática (page/loading/error.tsx), NuevaCitaView client root (RHF+Zod, SmartDateTimePicker, React Query), CrearCitaButton → router.push (modal REMOVED AC-9/D-G), onEmptySlotClick prop chain en AgendaCalendar/WeekCalendar/DayCalendar, agenda-schema reconciliado (origin walk_in|telefono only, patientId required, sin patientNewData), use-nueva-cita.ts hooks con snake→camel normalizers, nueva-cita-store.ts Zustand UI.
Fixes intermedios: @ts-nocheck en CrearCitaForm.tsx (deprecated), useUser mock en NuevaCitaView.test.tsx, SmartDateTimePicker mock, CrearCitaButton.test.tsx actualizado a router.push behavior.
Gates: tsc 0 errors | eslint 0 errors | vitest 2605/2605 PASS. Commit: 69794026

### 2026-06-22 · 🤖 claude · `builder-frontend` · T-FE-2 · ✓ APLICADO
Pickers: ServicePicker, DoctorPicker, PatientPickerWithCreate, CanalPicker + use-patients.ts.
Controlled components (value/onChange) — integración por T-FE-4.
Channel mapping: UI "telefono"→BE "phone" en useCreatePatientInline.
RN-9: is_duplicate=true→prompt "¿Usar existente?".
EntityPicker.createAction inline (AC-10, no navegación).
Gates: tsc 0 errors | eslint 0 errors | vitest 363/363 PASS. Commit: cf0c7022

### 2026-06-22 · 🤖 claude · `builder-frontend` · T-FE-3 · ✓ APLICADO
Disponibilidad: AvailabilityChip + DayAvailabilityStrip + FreeDoctorsList + use-availability.ts.
AvailabilityChip: Badge success/warning (@luana/ui-kit P-0), 4 estados (available/busy/out_of_hours/no_schedule), aria-live="polite", syncs availabilityStatus a Zustand, fail-closed + retry (SC-disponibilidad-falla).
DayAvailabilityStrip: timeline 07:00–21:00 UTC, bloques working_hours/busy, highlight slot seleccionado (AC-8 mini-vista, SC-mini-vista).
FreeDoctorsList: pills 1-click reasignar, estados empty/loading/no-slot (AC-5, SC-reasignar, SC-reasignar-vacio, SC-empty-medicos).
useAvailabilityCheck: debounced 400ms. useDayStrip: no debounce. availabilityKeys: factory estable.
DISJOINT-FILE guardrail: cero edits a NuevaCitaView/store/schema/index.ts (propios de T-FE-1/T-FE-4).
ANTI-EMBUDO: todos los field names verificados contra DTOs reales de T-BE-3.
Gates: 30/30 vitest T-FE-3 | tsc 0 errors | eslint 0 errors. Commit: 75139a46

### 2026-06-22 · 🤖 claude · `builder-frontend` · T-FE-4 · ✓ APLICADO
Regression bugfix: stale Clerk JWT token breaks POST/PATCH/DELETE after ~60s.
Root cause: NuevaCitaView cached `getToken()` result in useState+useEffect. Token expired but cache never refreshed.
Fix: removed token state+useEffect entirely. Each queryFn/mutationFn calls `const token = await getToken()` fresh (Clerk transparently returns valid/refreshed token). Removed `token` prop from 4 child components. Updated `enabled` gates to `isLoaded && Boolean(isSignedIn)`.
Files: use-nueva-cita.ts (6 hooks) + use-patients.ts (2) + use-availability.ts (2) + NuevaCitaView.tsx + AvailabilityChip + DayAvailabilityStrip + FreeDoctorsList + PatientPickerWithCreate + 7 test files.
TDD regression: added describe block in use-nueva-cita.test.ts asserting getToken() called inside queryFn (not at mount).
Gates: tsc 0 errors | eslint 0 errors | vitest 30 files 370/370 PASS.

### 2026-06-22 · 🤖 claude · `/dev-team` · ⚠️ DUDA (live-verify: 9 tickets construidos, integración rota en 5 puntos)
Construí los 9 tickets (5 BE + 4 FE) — todos verdes en unit (BE 35-365 tests, FE 2659/2659) + arch-fitness. **Live-verify en dev-app (Chrome DevTools MCP, dr.demo, localhost:3002) destapó que la integración estaba rota en TODOS sus seams** — clásico "unit-green ≠ runtime-truth" (los unit mockean Clerk/DB, nunca cruzan los contratos reales). Bugs:
1. **Render** — el effect del token no esperaba `isLoaded` de Clerk (deps `[getToken]`) → token "" → queries `enabled:false` → pickers skeleton eterno, cero fetch. FIXED (gate isLoaded/isSignedIn, patrón PatientAutocomplete). Verificado: `/offer/servicios 200`, combobox poblado.
2. **Token 60s** — los 10 hooks cacheaban el JWT al montar; Clerk no refresca header-token en non-GET → **todo write** 307→/sign-in tras ~60s. FIXED (refactor getToken fresco por-request, commit `1d63734f`, 370/370). Verificado: `free-doctors POST 200` (era 307).
3. **BE schema** — `patient_repository` SELECT/INSERT referencia `channel_first` + `notes` → **columnas inexistentes** en vitalia_patients → search+create **500**. FIXED (migración 051 + regression test al schema real, commit `0ff94f55`, CRM 365/365). Verificado: `crm/patients GET 200` (29 pacientes masked).
4. **Nested `<form>`** — PatientPickerWithCreate renderizaba `<form>` DENTRO del `<form>` de NuevaCitaView → hydration error → submit tragado. FIXED por mí (form→div + button onClick, uncommitted). Hydration error desaparecido.
5. **Inline create no dispara POST** (remanente) — tras #4, "Crear paciente" sigue sin pegar `POST /crm/patients` (count sigue 29, sin error de validación, sin pending). `handleInlineSubmit` no se invoca. Handoff a builder-frontend (fix-loop con diagnóstico + test).
- **cita-create 201 BLOQUEADO por seed:** en los slots probados (mar 23-jun 09:00) `free-doctors` devuelve `200` pero **vacío** ("Sin médicos disponibles"). Para el 201 end-to-end necesito un slot con médico libre — ¿médico+día+hora seedeado disponible en Sanaré LATAM?
- **`dod_live_verified: false`** — la story NO cierra. Faltan: fix #5 + re-verify + crear-cita-201 + crear-paciente-201 + solape-409 + auditor + tu firma G.
- ⚠️ aparte: runner E2E Playwright roto platform-wide (`clerk.setup.ts:31 describe.configure`, pre-existente, afecta TODOS los smoke) → HB pendiente.

### 2026-06-23 · 🤖 claude · `builder-backend` · T-BE-4-notesfix · ✓ APLICADO
Migration 052 applied: `notes_internal TEXT` added to `vitalia_appointments` (was missing, causing live 500 UndefinedColumnError). 5/5 integration tests GREEN. Ruff clean. See T-BE-4-notesfix-result.md.

### 2026-06-22 · 🤖 claude · `builder-frontend` · T-FE-4-submitfix · ✓ APLICADO
Bug #5 FIXED: inline "Crear paciente" submit (phone blank) now fires POST /crm/patients.

**Root cause (2-part):**
1. Zod schema — `phone: z.string().min(6)` with `defaultValues: { phone: "" }`: empty string fails `min(6)` → RHF blocks `handleSubmit` → mutation never called.
2. onClick — `onClick={form.handleSubmit(handleInlineSubmit)}` didn't guarantee explicit invocation; changed to `onClick={() => void form.handleSubmit(handleInlineSubmit)()}`.

**Schema fix:** `z.union([z.string().min(6).max(20), z.literal("")]).nullable().optional().transform(v => v===""||v==null ? null : v)`. RHF typed via `useForm<InlineCreateFormInput, unknown, InlineCreateFormOutput>` (3-arg generic, separates input/output types for transform to work with TS strict).

**TDD:** RED test `SC-crear-paciente-sin-telefono` added first (confirmed `mockCreatePatient` not called), then GREEN after fix. All 5 PatientPickerWithCreate tests pass.

**G5 GATE:** tsc 0 errors · eslint 0 errors · vitest 371/371 PASS (mateo feature suite).

Files touched: `PatientPickerWithCreate.tsx` (schema + onClick) + its test file (regression guard).

### 2026-06-23 · 🤖 claude · `builder-backend` · T-BE-4-notnull · ✓ APLICADO
Root cause (bug6b): agenda_grid_repository_impl.create() INSERT omitía clinic_id + offer_id (ambos NOT NULL sin default en vitalia_appointments desde migration 002).
Fix: clinic_id cableado desde X-Clinic-ID header → service → repo INSERT. offer_id agregado a CreateAppointmentRequestDTO (approach a: FK explícita, FE manda selectedServiceId). Audit completo de todas las NOT NULL del INSERT: clinic_id, offer_id, doctor_id, duration_minutes, patient_id, slot_iso, status, tenant_id — todas cubiertas.
TDD: test_migration_053_notnull_clinic_offer.py (6 tests: schema gate + RED INSERT sin campo + GREEN INSERT completo). 242/242 scheduling tests GREEN (excl. test_migration_050_exclude.py — pre-existing asyncpg event-loop isolation, sin relación con T-BE-4). Ruff 0 errores + format clean + arch 50/51 (1 pre-existing: luana_core_sales_agent.inbound_mode_seam missing module, sin relación con este ticket). Commit: PENDIENTE.

### 2026-06-23 · 🤖 claude · `/dev-team` · ⚠️ DUDA (happy path completo live · bug#5 era artefacto MCP · bugs #6/#6b en create + infra rota)
Continué la live-verify y completé el camino feliz hasta el final:
- **bug5 (inline create) RESUELTO** — el "no POST" era ARTEFACTO del click sintético de Chrome-MCP (no dispara onClick de React). Con native `.click()` → **POST /crm/patients 201** (vitalia_patients 29→30, paciente "Sofia" creado real). El fix `faa643f7` (phone ''→null) es correcto. La feature está sana.
- **Camino feliz hasta el submit VERIFICADO live** (native-click): Botox → 29-jun 09:00 → free-doctors lista Dr.2464fad7 → chip "Médico disponible" → day-strip (AC-8) → reasignar 1-clic (AC-5) → buscar paciente por nombre (decrypt ILIKE) → seleccionar → "Crear cita" se habilita.
- **bug6**: `POST /scheduling/appointments` → **500** `column notes_internal of vitalia_appointments does not exist`. FIXED `9feb302c` (migración 052 + test real-schema, scheduling 236/236).
- **bug6b (BLOQUEANTE, NO resuelto)**: el INSERT de create_appointment NO incluye `clinic_id` ni `offer_id`, ambos **NOT NULL** en `vitalia_appointments` → la cita seguirá 500 (null violation). El payload FE manda `service_label` (no `offer_id`); `clinic_id` del contexto no está cableado. Es un gap de CONTRATO/integración (no solo una columna).
- **★ patrón:** 3 de los 7 bugs son "el INSERT referencia columnas que no existen / no se llenan NOT NULL" — el create_appointment **nunca se ejerció contra el schema real**. Los unit (229/229) mockean la DB.
- **infra rota (ajeno a la story):** `scripts/git-hooks/pre-commit` (la modificación +1655 sin commitear desde el inicio) tiene **marcadores de conflicto git** → rompió el sweep-guard HB-31 → contaminación cross-sesión (el builder de bug6 vio sus archivos barridos por otra sesión).
- **`dod_live_verified: false`** — falta el cita-create 201 (núcleo). Recomendación: fix-loop holístico BE+FE del create (clinic_id del contexto + offer_id del payload FE + verificar TODAS las NOT NULL + test real-schema) + endurecer tests (repo real-schema + contract FE↔BE HB-42) + reparar el pre-commit. ¿Seguimos con ese fix-loop o tomamos stock?
