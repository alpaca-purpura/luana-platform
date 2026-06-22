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
