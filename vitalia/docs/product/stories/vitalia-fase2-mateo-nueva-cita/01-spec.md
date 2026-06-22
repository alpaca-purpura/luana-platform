---
story_id: vitalia-fase2-mateo-nueva-cita
brand: vitalia
type: ui-story
state: refining
architecture_pattern: ADR-vitalia-004
po_ux_version: 1
ronda: 1                       # funcional-primero · FIRMA 1 ✍ input_spec_signed (Chris 2026-06-21)
input_spec_signed: true
---

# 01-spec — Nueva cita usable (D11)

> RONDA 1 (funcional). Mockup + Gherkin se GENERAN tras la FIRMA 1. Origen: live-QA D11 de `vitalia-scheduling-mateo-review`.

## § Context — dónde vive

- **Zona/caja:** Agentes → **Mateo** (Operar) → área `mateo.agenda`.
- **Shell / contenedor (decidido 2026-06-21 · investigación de contenedor):** **hoja full-page (leaf)** en ruta `/{tenantId}/mateo/agenda/nueva-cita`, dentro del shell-organism. Se entra desde un **botón de acción "+ Nueva cita"** (toolbar de Agenda + click en slot vacío) — NO un drawer, NO un sub-tab de navegación (un verbo/acción no va como tab; un drawer pierde datos al click-afuera). La hoja tiene **Guardar/Cancelar explícitos + back-pill "‹ Agenda"**. Patrón Google Calendar "Más opciones" (escala a página); consistente con el modelo árbol+hojas; data-safe por construcción. Ver `00-research-availability.md` (no aplica) → la investigación de contenedor está en el chris-input + esta decisión.
- **Cap target:** `scheduling.mateo-agenda` (`extend`). Toca además el list DTO de `offer.lisa-servicios` (1 campo).
- **Rol (quién lo usa):** recepción (`admin_clinic`) + médico (`doctor`). Ambos con acceso PHI (`@require_phi_access`).
- **Naturaleza:** funcional (writes reales + reglas de negocio) → live-verify obligatoria.

## § Mapa funcional

### Happy path

1. El operador toca **"+ Nueva cita"** (toolbar de Agenda, o click en un slot vacío) → entra a la **hoja Nueva cita** (full-page, back-pill "‹ Agenda"). Si entró por un slot, fecha/hora vienen prellenadas.
2. **Paciente:** typeahead que busca **existentes primero** (devuelve `patient_id`). Si no existe → **"+ Crear paciente"** abre la **hoja de alta de paciente** (reusa la superficie canónica de D10 — crea registro real en `vitalia_patients`) y vuelve con el paciente preseleccionado. No hay mini-form descartable.
3. **Servicio:** dropdown del catálogo de servicios activos (`offer.lisa-servicios`). Al elegirlo trae su **duración** (`initial_appt_duration_minutes`).
4. **Fecha + hora de inicio:** entrada manual. La **hora de fin** se autocalcula = inicio + duración (editable; si se edita debe ser > inicio).
5. **Médico:** dropdown de médicos activos de la clínica. Al quedar definidos {médico, fecha, hora, duración} aparece un **chip de disponibilidad live**: `Disponible` · `Ocupado — se solapa con [cita]` · `Fuera de horario`. Junto al médico se muestra una **mini-vista del día** de ese médico (franja horaria con sus bloques de atención + citas ocupadas + la franja nueva propuesta resaltada) para que el operador elija una hora buena de un vistazo.
6. Si el chip NO es `Disponible` → el form ofrece **"Médicos disponibles a esta hora"** (los activos que están dentro de horario y libres para esa franja) → 1 clic reasigna y re-chequea. (O el operador cambia la hora — la mini-vista lo guía.)
7. Con chip `Disponible` → **Crear**. El backend garantiza no-solape; éxito → toast "Cita creada" + se cierra + la grilla la refleja.

### Bifurcaciones (árbol)

```
Crear cita
├─ ¿hay servicios activos en el catálogo?
│   ├─ no → estado vacío: "No hay servicios. Cargalos en Mi Clínica › Servicios" (no se puede crear) [SC-empty-servicios]
│   └─ sí → sigue
├─ servicio elegido ¿tiene duración configurada?
│   ├─ no (null) → default 30 min + editable [SC-dur-default]
│   └─ sí → usa la del servicio
├─ ¿hay médicos activos en la clínica?
│   ├─ no → estado vacío: "No hay médicos activos" (no se puede crear) [SC-empty-medicos]
│   └─ sí → sigue
├─ médico elegido ¿tiene horario cargado para ese día?
│   ├─ no → chip "Sin horario cargado" → BLOQUEA + "cargá el horario de este médico primero" [SC-sin-horario]
│   └─ sí → evalúa la franja {hora, duración}:
│       ├─ fuera del horario de atención → chip "Fuera de horario" → BLOQUEA + sugiere reasignar/cambiar hora [SC-fuera-horario]
│       ├─ se solapa con otra cita activa del médico → chip "Ocupado — se solapa con [cita]" → BLOQUEA + "Médicos disponibles a esta hora" [SC-solape]
│       └─ dentro de horario y libre → chip "Disponible" → habilita Crear [SC-happy]
├─ al Crear, otro operador acaba de tomar la franja (carrera) → 409 "Ese horario acaba de ocuparse, elegí otro" [SC-race]
├─ fin ≤ inicio (override manual) → validación inline [SC-fin-invalido]
└─ paciente nuevo sin nombre/teléfono → validación inline [SC-paciente-incompleto]
```

### Reglas de negocio

- **RN-1** — No se permite solape de citas **activas** (status ≠ CANCELLED) del mismo médico. Bloqueo DURO, garantizado a nivel DB (constraint EXCLUDE). Es el invariante central.
- **RN-2** — Intervalos **half-open**: back-to-back NO es solape (10:00–10:30 y 10:30–11:00 conviven).
- **RN-3** — Una cita solo se crea si el médico está **dentro de su horario de atención** para esa franja (fuera de horario = bloqueo).
- **RN-4** — Médico **sin horario cargado** → no se puede agendar (bloqueo accionable).
- **RN-5** — La **duración** sale del servicio (`initial_appt_duration_minutes`); `null` → 30 min. Hora-fin = inicio + duración (editable, > inicio).
- **RN-6** — CANCELLED no cuenta como conflicto (su franja se libera).
- **RN-7** — Solo roles `admin_clinic` y `doctor` crean. PHI: dual filter tenant+clinic + audit log sync.
- **RN-8** — Tiempos en UTC; se muestran/ingresan en la zona horaria del tenant (IANA). DST seguro (compara instantes absolutos).

### Criterios de aceptación

- **AC-1** — El médico se elige de un dropdown de médicos activos (nunca se tipea un UUID).
- **AC-2** — El servicio se elige de un dropdown del catálogo activo (nunca texto libre).
- **AC-3** — La hora de fin se autocalcula desde inicio + duración del servicio (editable).
- **AC-4** — El form muestra disponibilidad del médico (chip) y bloquea solape y fuera-de-horario.
- **AC-5** — Cuando el médico no está disponible, el form ofrece médicos disponibles a esa hora y permite reasignar en 1 clic.
- **AC-6** — Dos creaciones concurrentes de la misma franja: una gana, la otra recibe error claro y reintenta.
- **AC-7** — Crear una cita válida la persiste y la grilla de la agenda la muestra (live-verify real).
- **AC-8** — El form muestra una mini-vista del día del médico elegido (bloques de atención + citas ocupadas + la franja nueva resaltada).
- **AC-9** — "Nueva cita" es una hoja full-page (no drawer, no sub-tab): se entra desde "+ Nueva cita", tiene back-pill + Guardar/Cancelar, no pierde datos por click-afuera.
- **AC-10** — El paciente nuevo se crea como registro real (reusa el alta de paciente), no un mini-form descartable; queda en el directorio.

## § Pantallas (campos — sin mockup todavía)

**Hoja full-page** `/{tenantId}/mateo/agenda/nueva-cita` (back-pill "‹ Agenda", FormLayout del canon). Orden funcional:

| Campo | Origen del dato | Tipo control (mockup definirá) | Requerido | Validación |
|---|---|---|---|---|
| Canal de ingreso | enum walk_in / telefono | segmented | sí | uno de 2 |
| Paciente | typeahead `GET patients` **existing-first** → `patient_id`; **"+ Crear paciente"** → hoja de alta (reusa D10, crea registro real) → vuelve preseleccionado | typeahead + acción crear | sí | patient_id uuid |
| **Servicio** | `GET /offer/servicios` (activos) | **dropdown** (Select canónico) | sí | del catálogo |
| Duración | `servicio.initial_appt_duration_minutes` (null→30) | número min (prellenado, editable) | sí | ≥ 1 |
| **Fecha + hora inicio** | manual | datetime | sí | fecha/hora válida |
| **Hora fin** | autocalc inicio+duración | datetime read-only (editable override) | sí | > inicio |
| **Médico** | `GET /clinics/.../doctors` (activos) | **dropdown** (Select canónico) | sí | del roster |
| Disponibilidad | endpoint nuevo (médico+franja) | chip live (no editable) | — | Disponible para habilitar Crear |
| Mini-vista día del médico | endpoint disponibilidad (bloques + citas del día) | franja horaria read-only (libre/ocupado + slot nuevo resaltado) | — | — |
| Médicos disponibles | endpoint nuevo (franja → médicos libres) | lista accionable (aparece si bloqueado) | — | — |
| Notas internas | input | textarea | no | ≤ 500 |

### Notas técnicas (el architect las concreta)
- **BE-1** Exponer `initial_appt_duration_minutes` en `ServiceListItemDTO` (hoy solo en detail).
- **BE-2** Endpoint disponibilidad: dado (doctor_id, fecha, hora, duración) → `{status: available|busy|out_of_hours|no_schedule, conflict?}`; y "médicos libres en franja". Reusa `vitalia_availability_slots` + bloques + citas activas.
- **BE-3** Constraint `EXCLUDE USING gist` (btree_gist, tstzrange, partial `WHERE status<>CANCELLED`) en `vitalia_appointments` → garantía anti-solape. Migración idempotente.
- **BE-4** `create_appointment`: validar dentro-de-horario antes de insert; capturar `23P01` → 409. (Arregla el bug latente: walk-in/teléfono hoy no protege.)
- **BE-5** Dropdown médicos: endpoint ya existe.
- **BE-6** Alta de paciente reusable (typeahead existing-first + crear): crea registro real en `vitalia_patients`. Reusa/siembra la superficie de D10 (`mateo-pacientes`). Dependencia suave con D10.
- **BE-7** Reconciliar el enum `origin`: hoy `walk_in/telefono/existing_patient` acopla origen con existencia del paciente. Con typeahead+crear, la existencia es ortogonal → `origin` queda como **canal** (`walk_in/telefono`). El architect concreta la migración del schema (FE `agenda-schema.ts` + BE).

## § Decisiones (FIRMA 1 · Chris 2026-06-21)
- ✅ **Mini-vista del día del médico = IN scope** (franja con bloques + ocupado + slot nuevo resaltado). AC-8.
- ✅ **Buffer entre citas = fuera de scope** (default 0, sin UI).
- ✅ **Contenedor = hoja full-page (leaf)** vía botón "+ Nueva cita" (NO drawer, NO sub-tab). AC-9. Investigación de contenedor ratificada Chris 2026-06-21.
- ✅ **Nuevo paciente = hoja que reusa el alta de paciente** (registro real, no descartable). AC-10. Dep suave D10.

## § Out-of-scope (anti-creep)
- Overbooking intencional con override (toggle futuro si la clínica lo pide).
- Multi-recurso (sala/equipo) — vitalia no modela salas hoy.
- Modo "cualquier médico disponible" (pooled) — se elige médico explícito.
- Citas recurrentes / series.
- Cobro en la creación (el pago vive en el flujo "cobrar saldo" del detalle).

## Prior art applied
- **Engine/infra consumido:** `vitalia_availability_slots` + `availability_block_service` + `availability_projection_service` (clinics) para free/busy; `vitalia_doctors` + `GET /clinics/.../doctors` para médicos; `offer.lisa-servicios` (`initial_appt_duration_minutes`, dominio comentado "RN-31 Mateo agenda") para duración; `CrearCitaForm.tsx` + `agenda-schema.ts` (se extiende, no se reescribe).
- **Patrón UX:** Tebra (input manual + chip disponibilidad + reasignar), Jane/Acuity (política de conflicto), Cal.com (reassign). Ver `00-research-availability.md`.
- **Algoritmia/DB:** half-open overlap + Postgres `EXCLUDE`/btree_gist + 23P01→409 (PostgreSQL docs, Cybertec). Ver `00-research-availability.md`.
- **Net-new justificado:** endpoint de disponibilidad para el form + constraint DB (no existían; el bug de doble-booking estaba abierto).
- **Lift candidate:** el cómputo free/busy + la condición de solape podrían lift a `core/luana-core-scheduling` si otra marca agenda con disponibilidad → escalar `/pm-luana` en `/architect` (no ahora).
