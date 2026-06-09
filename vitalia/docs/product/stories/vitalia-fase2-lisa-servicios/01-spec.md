---
story_id: vitalia-fase2-lisa-servicios
brand: vitalia
type: ui-story
state: refining
architecture_pattern: ADR-vitalia-004
po_ux_version: 2
round: 1
input_spec_signed: true
mockup_final_signed: false
---

# 01-spec · vitalia-fase2-lisa-servicios — Catálogo de servicios de Lisa (agente-first)

> **RONDA 1 (intención) — draft.** Este doc se escribe en 2 rondas / 2 firmas (`docs/process/spec-mapa-funcional.md`).
> RONDA 1 = § Context/Dónde vive + § Mapa funcional + pantallas-borrador + dudas → Chris firma "esto es lo que quiero".
> RONDA 2 = § Gherkin + § Matriz de cobertura + mockup FINAL → transition refining→refined.
> Reframe agéntico + recomendación PM + decisiones Chris: **`00-research.md`** (SSoT).

---

## § Context

- **Release:** F2. **Módulo:** `offer` (consume Offer Studio engine · NO `treatments` — eso es el followup de Camila).
- **Capability:** `lisa.servicios` (`cap_change_type: new`).
- **User journey:** la dueña/admin de la clínica entra a **Lisa → Servicios** para declarar QUÉ ofrece la clínica. Es la fuente de verdad del catálogo que después **Adrián vende** (canal-inbound match + Propuestas), **Mateo agenda** (duración), **Lucas promociona** y la **landing pública** muestra (la landing es **su propia historia** `lisa-landing-public` — fuera de scope acá).
- **Por qué importa (visión agéntica):** el catálogo no es una grilla bonita para el dueño — es el **cerebro compartido** que el equipo de agentes vende. Diferenciador H1 (agente que conoce el catálogo + cotiza + maneja objeciones). Hueco de mercado: ningún competidor (cero.ai · botclinico · rendu · Dentalink · doctocliq) conecta catálogo → conversación de venta de forma self-serve con un equipo de agentes.

### Dónde vive (zona/caja → shell → ruta)

- **Zona:** Agentes · **Caja:** Lisa (`agent_owner: lisa`) · **Área:** `lisa.servicios` (SYSTEM-MAP `agents.lisa.functional_areas.servicios`).
- **Shell:** shell-organism (ADR-vitalia-004 + `SHELL-DESIGN-CONTRACT.md`): TopBar global + Ribbon 5 especialistas + SubTabsBar + ValeriaSidebar (50/50 split). El contenido vive en el `panel-content`.
- **Rutas:**
  - `/{tenantId}/(shell-organism)/lisa/servicios` — toggle **Catálogo | Escalera** (persiste `?view=catalogo|escalera`).
  - `/{tenantId}/(shell-organism)/lisa/servicios/[offer-id]` — workspace N3-dyn de un servicio (5 leaves `EntitySubNavBar`).
  - **Crear (★ Chris #1 2026-06-07):** NO hay ruta/Sheet aparte. "+ Nuevo servicio" **crea un borrador** (Offer draft) y **redirige al MISMO workspace `[offer-id]`** pero **vacío** para llenarlo (idéntico a editar uno existente). El workspace vacío ofrece **arranque por documento** (cargar material → "Procesar con Lisa" → autocompleta los campos · extracción editable, NO RAG).
  - (★ eliminada · Chris #3 2026-06-06) ~~`…/servicios/ladder/[slot-id]`~~ — peldaños FIJOS, sin workspace de peldaño.
- **Mockup de partida (referencia):** `vitalia/docs/archive/2026/stories/vitalia-fase1-empty-states/mockups/lisa-servicios-placeholder.html` (ya tiene el toggle Catálogo|Escalera + tokens del shell).

### Out-of-scope explícito (anti-creep)
- A/B testing de pricing · imports bulk (CSV) · AI suggested-pricing (anti-objetivos ratificados).
- El **tool agéntico** `match_service_and_specialist` (vive en `canal-inbound`, decisión Chris 2026-06-06). Esta story SOLO entrega la **data**: Offers publicadas + link servicio↔doctor.
- Edición del engine `core/luana-core-offer-studio` (consume vía EP-2; cambio de engine → `/pm-luana`).
- **Documento → conocimiento (A autocompletar + B RAG)** ahora **EN scope** (Chris #1 + #2 · RN-17/RN-21/RN-22 · § Modelo de conocimiento). **Sigue fuera:** que el agente **responda libre lo clínico** (contraindicaciones/diagnóstico) — eso **escala al doctor**, nunca RAG; y el **precio nunca sale del documento**. Una **Base de conocimiento cross-servicio a nivel tenant** (más allá del per-servicio) queda para su propia story.

## Prior art applied

- **Engine consumed:** `core/luana-core-offer-studio` — `Offer` + `OfferValueLevel` (5 peldaños: Gancho Gratuito·Primera Compra·Oferta Principal·Maximización·Corporativo) + `ServiceDetails` (duración, sesiones) + `value_level_catalog.py` + `offer_ladder_hints.py` (filas `PROFESIONAL_SALUD` con ejemplos médicos). Registrado vía **Extension SDK EP-2 preset pack** (`vitalia/backend/.../offer/extensions.py` — hoy stub vacío → materializar). CERO edit engine.
- **Engine consumed:** `core/luana-core-sales-agent` — `TenantKnowledgeBuilder.build_identity()` ya inyecta las Offers publicadas en la identidad del agente → Adrián lee el catálogo **sin plomería nueva** (desbloquea canal-inbound RN-16).
- **Reused from vitalia:** `lisa-marca` (done) — voz de marca (slot 5 BRAND_VOICE) genera las descripciones de cada servicio. `lisa-doctores` (developing) — tabla `vitalia_doctors` + roster para el link servicio↔doctor.
- **Reused from vitalia:** componentes shell shipped (TopBar, Ribbon, SubTabsBar, ValeriaSidebar) + `@dnd-kit/core` (ya usado en `adrian-embudo`).
- **Net-new justificado:** link servicio↔doctor brand-level (engine no lo tiene) · **3 cobros por servicio** (reserva/seña + anticipo + financiamiento) brand-level — el hueco que ningún competidor llena. (★ ya NO hay `pricing_override`/`cta_copy` por peldaño — peldaños fijos, Chris #3 2026-06-06.)
- **Lift candidate:** si comunify/otra brand necesita el mismo "canvas escalera sobre Offer Studio" → escalar `/pm-luana` (promotion a `core/luana-core-ui` futuro). Por ahora brand-local.
- **NO es PHI:** el catálogo de servicios es información comercial pública, NO datos de paciente → aplica tenant-isolation raíz, NO el full HIPAA-lite (dual-filter clinic se evalúa por multi-clínica, no por PHI — ver interrogatorio Q2).

---

## § Modelo del servicio (resuelto RONDA 1 · nivel humano — `/architect` concreta el schema)

Un **servicio = una Offer de Offer Studio** (engine, vía EP-2). Campos (offer engine + proyección brand-level):

| Campo | Origen | Notas |
|---|---|---|
| nombre | engine `Offer.public_name` | — |
| qué incluye / descripción | engine + **voz de marca** (lisa-marca) | Lisa la sugiere; editable |
| especialidad / categoría | brand-level | dental, estética, etc. |
| **duración** | engine `ServiceDetails.session_duration_minutes` | Mateo agenda con esto |
| **precio fijo o rango** ("desde $X") | engine pricing + brand flag `price_is_range` | moneda = `tenant_locale` |
| **multi-sesión / paquete** | engine `ServiceDetails.total_sessions_count` | "diseño de sonrisa" = paquete; ortodoncia/botox = N sesiones |
| **peldaño (value_level)** | engine `OfferValueLevel` | 5 rungs canónicos, labels médicos |
| **recurrente** (flag + frecuencia) | brand-level `is_recurring` + `recurrence_interval` | atributo, NO peldaño; Camila lo usa para recall |
| **doctores** (N) | brand-level link servicio↔doctor → `vitalia_doctors` | opcional; cimiento canal-inbound RN-17 |
| **reserva de cita / seña** (monto fijo o %) | brand-level | monto chico para **apartar el turno** (reserva prepagada Vitalia · anti-no-show); **se descuenta del total** |
| **anticipo para iniciar** (% o monto del total) | brand-level | pago inicial **del tratamiento**, aparte de la reserva (clave en implantes/ortodoncia/cirugía); lo consume Adrián/Propuestas |
| **financiamiento en cuotas** (admite + N cuotas + MSI) | brand-level | el **saldo** en cuotas; ≈monto/mes calculado; lo consume Adrián/Propuestas |
| **scope clínica** (opcional) | brand-level | a qué clínicas se ofrece (null = todas) |
| **activo** (toggle único) | brand-level | Adrián lo conoce + vende. (★ toggle "landing" ELIMINADO de esta story — Chris #2 2026-06-06; la landing es otra historia) |

> **★ Cambio Chris 2026-06-06 (post-mockup):** los peldaños de la escalera son **FIJOS** (5 columnas canónicas). El peldaño de un servicio = su `value_level` (un solo dato). **NO** existe `pricing_override` ni `cta_copy` por slot, ni un workspace de peldaño — eso agregaba complejidad sin valor. Mover un servicio entre peldaños solo cambia su `value_level`.
>
> El engine NO se toca. Lo brand-level vive en la tabla de offers de vitalia (extensión) + el link servicio↔doctor. `/architect` decide la forma exacta (columnas brand vs tabla aparte) + el preset pack EP-2.

## § Workspace del servicio — contenido por pestaña (★ Chris #1 · agente-first · research 2026-06-06)

> Objetivo: que **Adrián tenga TODO lo que necesita para ofrecer y cerrar el servicio**. Fundado en research de treatment-coordinators dentales/estéticos + manejo de objeciones + FAQ de pacientes high-ticket + KBs de agentes IA clínicos (fuentes en `00-research.md` / research log). Marca: **🔴 must-have** (el agente no vende bien sin esto) · 🟡 nice-to-have. El workspace usa **`EntitySubNavBar`** (patrón staff) — **5 leaves** (★ Chris 2026-06-07 #4: se quitó **Stats** — esto es configuración, no analítica), cada uno es una hoja con secciones (cards), sin Shadcn tabs.

### Pestaña 1 · **Resumen** — "qué es y qué se lleva el paciente" (★ Chris #5: renombrada de "Detalle")
- 🔴 nombre · 🔴 categoría/especialidad · 🔴 **peldaño** (`value_level`) — ★ Chris #8: el badge del peldaño vive **aquí** (en Identidad de Resumen), **no** en el header del workspace (ocupaba mucho espacio) · descripción corta (lenguaje paciente, **voz de marca**) · 🟡 descripción larga
- 🔴 **qué incluye** (lista) · 🟡 qué NO incluye (exclusiones) · 🟡 variantes/niveles (básico/premium, materiales) · 🟡 garantía
- 🔴 duración: sesión única **o** paquete (N sesiones + min c/u) · 🟡 tiempo total del tratamiento
- 🔴 resultado esperado · 🔴 duración del resultado (vida útil) · 🟡 tiempo a ver resultados · 🟡 sesiones requeridas · 🟡 expectativas realistas (qué NO esperar)
- 🟡 preparación previa · 🟡 cuidados posteriores · 🟡 tiempo de recuperación/downtime
- flag **recurrente** (+ frecuencia) · **operación mini**: 🔴 duración de la cita · 🔴 tipo de cita inicial (valoración vs tratamiento directo)

### Pestaña 2 · **Para Adrián** (Argumentario) ⭐ — "el brief de venta del agente" (TAB NUEVO)
> El research es contundente: ~95% del cierre vive aquí (candidatura + consecuencia de no tratarse + objeciones + match), no en la ficha técnica. Es el diferencial.
- **Candidatura & seguridad:** 🔴 candidato ideal · 🔴 **contraindicaciones / quién NO es candidato** · 🔴 preguntas de calificación (descubrimiento) · 🔴 requiere evaluación previa (sí/no) · 🔴 **condiciones de escalada a humano** (dolor/diagnóstico/medicación → no lo maneja el agente · HIPAA-lite) · 🟡 requisitos previos · 🟡 restricciones (edad/embarazo)
- **Argumentario:** 🔴 beneficios emocionales (vender el resultado) · 🔴 dolor de no tratarse (urgencia) · 🔴 diferenciadores (por qué esta clínica) · 🟡 comparativa con alternativas · 🟡 ganchos promocionales vigentes
- 🔴 **FAQ** — pares pregunta→respuesta editables (¿duele? ¿cuánto dura? ¿cuántas sesiones? ¿se ve natural? ¿soy candidato?)
- 🔴 **Objeciones→respuestas** — pares para las 5 universales (precio · miedo · tiempo · "lo voy a pensar" · confianza)
- **Para el match (RN-16):** 🔴 **palabras clave/sinónimos** (cómo el paciente lo nombra: "carillas", "fundas", "arreglarme los dientes") · 🟡 intenciones disparadoras · 🟡 problemas que resuelve · 🟡 lenguaje a evitar (jerga que asusta)

### Pestaña 3 · **Especialistas** (★ Chris round 3 · renombrada de "Doctores" — más fiel a centros estéticos/no-médicos · #6/#7 · cómo funciona el vínculo)
> **★ Nota cross-story:** "Especialistas" es el **label canónico user-facing**. La **sub-tab roster `Lisa → Doctores`** y la story `lisa-doctores` deberían adoptar el mismo label para consistencia → **cross-story, escalar `/pm-vitalia`** (la tabla `vitalia_doctors` y la ruta pueden quedar igual en código; solo cambia el label).
- 🔴 **especialistas habilitados** (link servicio↔especialista · cimiento canal-inbound RN-17). Lista de los vinculados (avatar + nombre + especialidad).
- 🔴 **Vincular especialista** = NO crea uno: abre un **selector del roster de la clínica** (los que ya existen en el roster · buscador + checkboxes); marcar = "este especialista realiza este servicio". El roster es la SSoT (`vitalia_doctors` de `lisa-doctores`); si falta → link "Agrégalo en Lisa → Especialistas ↗".
- 🔴 **"Ver detalle ↗"** por especialista vinculado → **deep-link a su ficha exacta en el roster de Lisa** (ruta code `/{tenantId}/lisa/doctores/[id]`, label "Especialistas"). Botón **Desvincular** (no borra al especialista del roster).
- 🟡 credenciales relevantes que el agente puede citar · 🟡 sedes donde se ofrece

### Pestaña 4 · **Plan de pago** (★ Chris #2/#3 · son **3 cobros distintos**, no mezclar)
> Tres conceptos separados porque significan cosas distintas y el research marcó que confundirlos es el error #1. Cada uno es opcional por servicio.
- **1 · Precio del tratamiento:** 🔴 precio o rango + moneda (`tenant_locale`) · 🔴 **precio publicable** (¿el agente lo dice en chat o agenda valoración?).
- **2 · Reserva de la cita (la "seña"):** 🔴 monto chico para **apartar el turno** (reserva prepagada Vitalia · reduce inasistencias) — monto **fijo o %** · **se descuenta del total** · flag pide/no-pide. (Esto es lo que en el catálogo se veía como "seña X%" y confundía → ahora se crea y se explica **aquí**.)
- **3 · Anticipo para iniciar (★ Chris #3 · faltaba):** 🔴 pago inicial **sobre el costo del tratamiento** que el paciente da para **empezar** (aparte de la reserva) — **% o monto del total** · flag ofrece/no · ≈equivalente calculado. Clave en implantes, ortodoncia y cirugía.
- **4 · Financiamiento del saldo:** 🔴 ofrece cuotas (sí/no) · N cuotas · interés/MSI · **≈ por mes** calculado · 🟡 socio financiero · 🟡 medios de pago.

### Pestaña 5 · **Prueba social** (renombra "Reseñas")
- 🔴 fotos antes/después (con consentimiento) · 🟡 testimonios del tratamiento · 🟡 casos destacados · 🟡 prueba de volumen ("+300 sonrisas")

> ★ Chris #4 (2026-06-07): la pestaña **Stats** se eliminó — esta superficie es **configuración** del catálogo, no analítica. Las métricas del servicio (leads · % cierre Adrián · sesiones/mes · revenue · LTV) viven donde corresponde el reporting, **no** en la ficha de configuración (futura story de analítica/Stats, si se decide).

> **MVP del registro (24 campos 🔴 mínimos para que Adrián venda):** nombre · categoría · descripción corta · qué incluye · candidato ideal · contraindicaciones · preguntas de calificación · requiere evaluación · condiciones de escalada · beneficios emocionales · dolor de no tratarse · diferenciadores · FAQ · objeciones→respuestas · resultado esperado · duración del resultado · precio/rango · precio publicable · reserva (seña) · financiamiento (cuotas) · fotos antes/después · doctores habilitados · duración de cita · palabras clave/sinónimos. (El **anticipo para iniciar** es must-have **en los servicios que lo usan** — implantes/ortodoncia/cirugía.)
>
> **Decisión de implementación (a confirmar /architect):** `FAQ` + `objeciones→respuestas` = listas de pares editables (alimentan limpio el KB del agente), NO texto libre. `contraindicaciones` + `condiciones_escalada` son campos de **seguridad** (HIPAA-lite), no solo venta.

## § Mapa funcional (RONDA 1 · resuelto)

> Capa humana que Chris valida. El Gherkin (RONDA 2) lo formaliza. Profundidad alta (story keystone).

### Happy path (camino dorado)

1. La dueña entra a **Lisa → Servicios**. Catálogo vacío → **empty-state con seed presets por vertical** (dental / estética) adoptables con un clic; con datos → **vista Catálogo** (grid de tarjetas) con **buscador + filtros** (patrón staff).
2. Crea un servicio (**+ Nuevo servicio**) → **entra al mismo workspace que un servicio existente, pero vacío** (NO un form/Sheet aparte · ★ Chris #1). Dos formas de llenarlo, intercambiables:
   - **(a) Arranque por documento:** carga material del servicio (folleto · lista de precios · protocolo · ficha) → **"Procesar con Lisa"** → los campos se **autocompletan** (extracción) → la dueña **revisa y ajusta**. Reduce el tipeo. (Es extracción a campos editables, NO RAG runtime — ver § Recomendación #9.)
   - **(b) A mano:** llena las pestañas. Lisa redacta la descripción en **voz de marca**; el peldaño se elige con el selector autoexplicativo. Campos: nombre · qué incluye · especialidad · **duración** · **precio fijo o rango** + moneda · **paquete/multi-sesión** · **doctores** (opcional) · **reserva/seña + anticipo + cuotas** · **peldaño** · flags **recurrente** / **activo**.
3. **Activa** el servicio (toggle único "Activo" → Adrián lo conoce + vende).
4. Vista **Escalera de valor**: servicios distribuidos en los 5 peldaños con **labels médicos** (Gancho gratuito · Primera visita · Tratamiento principal · Premium · Plan/convenio). **Arrastra** una tarjeta a otro peldaño; ajusta `pricing_override` + `cta_copy` del peldaño en un drawer.
5. **Workspace del servicio** (`[offer-id]`, patrón staff `EntitySubNavBar`): 5 leaves Resumen · **Para Adrián** · Especialistas · Plan de pago · Prueba social (contenido en § Workspace del servicio).
6. **Resultado:** servicio activo → conocimiento de **Adrián** (lo cita + argumentario; con doctores → match especialista), **Propuestas** (line-item + financiamiento), **Mateo** (duración).

### Bifurcaciones (árbol — Chris valida COMPLETITUD)

```
Entrar a Lisa → Servicios
├─ catálogo vacío
│   ├─ adopta seed preset vertical (dental/estética) ───────────────── [SC happy-seed]
│   └─ crea servicio → workspace VACÍO (mismo que editar · #1)
│       ├─ lo llena a mano ───────────────────────────────────────────  [SC happy-create]
│       └─ carga documento → "Procesar con Lisa" → autocompleta campos ─ [SC happy-doc-autocomplete] ★
└─ catálogo con datos
    ├─ vista Catálogo (grid)
    │   ├─ crear/editar servicio
    │   │   ├─ precio fijo ───────────────────────────────────────────  [SC happy-create]
    │   │   ├─ precio rango "desde $X" ───────────────────────────────  [SC edge-rango]
    │   │   ├─ paquete / multi-sesión ────────────────────────────────  [SC edge-paquete]
    │   │   └─ servicio recurrente (flag + frecuencia) ───────────────  [SC edge-recurrente]
    │   ├─ buscar por nombre + filtro especialidad/activo ────────────  [SC happy-search]
    │   ├─ editar (admin/owner) vs read-only (doctor/staff) ──────────  [SC adversarial-rbac]
    │   ├─ eliminar servicio (soft-delete) ───────────────────────────  [SC edge-delete]
    │   └─ toggle único "Activo" (agente lo conoce) ──────────────────  [SC happy-activar]
    └─ vista Escalera (5 peldaños FIJOS · autoexplicativa)
        ├─ peldaño con servicios → muestra las tarjetas + "crear aquí" ─  [SC happy-rung-filled]
        ├─ peldaño VACÍO → muestra qué va ahí + ejemplos por vertical ──  [SC happy-rung-empty-guidance] ★
        ├─ drag servicio de peldaño A → B (cambia value_level) ────────  [SC edge-move-rung]
        └─ keyboard-only mover peldaño (a11y) ────────────────────────  [SC a11y-keyboard]

Cross-cutting:
├─ servicio activo SIN doctores → UI avisa + agente degrada (responde, no matchea) ── [SC edge-sin-doctor]
├─ servicio activo CON doctores → entra al conocimiento de Adrián ─────────────────── [SC happy-agente]  ★ KEYSTONE
└─ query cross-tenant bloqueada ──────────────────────────────────────────────────── [SC adversarial-tenant]
```

### Reglas de negocio (RN — resueltas)

- **RN-1** · Un servicio = una **Offer** de Offer Studio (consume engine EP-2; NO modelo `Treatment`/`LadderSlot` nuevo).
- **RN-2** · El peldaño = `OfferValueLevel` del engine (5 rungs canónicos) con **labels médicos** de display. NO se inventan peldaños.
- **RN-3** · Precio nunca hardcoded; moneda `tenant_locale`; soporta **fijo o rango** ("desde $X").
- **RN-4** · Soporta **paquete/multi-sesión** (`total_sessions_count`).
- **RN-5** · **Recurrente** = atributo del servicio (flag + frecuencia), aplicable en cualquier peldaño; NO es un peldaño.
- **RN-6** · El servicio tiene **3 cobros distintos e independientes** (config en Lisa · cada uno opcional): **(a) reserva/seña** para apartar la cita (se descuenta del total) · **(b) anticipo** para iniciar el tratamiento (% o monto del total, aparte de la reserva) · **(c) financiamiento** del saldo en cuotas. Adrián/Propuestas los consumen. NO confundir reserva con anticipo.
- **RN-7** · Edición (crear/precio/activar) = **`admin_clinic` + `owner`**; `doctor` + `nurse` + `staff` = read-only.
- **RN-8** · La descripción default se genera en **voz de marca** (lisa-marca); editable.
- **RN-9** · Link servicio↔doctor **opcional** (N doctores); sin doctores la UI avisa + el agente degrada. Con doctores → match canal-inbound RN-17.
- **RN-10** · **Un toggle "Activo"** (el agente lo conoce + vende). El toggle "landing" se eliminó de esta story (la landing pública es `lisa-landing-public`, otra historia).
- **RN-15** · El catálogo tiene **buscador + filtros** (mismo patrón que staff: buscar por nombre + filtro especialidad + filtro activo).
- **RN-11** · Precio del servicio ≥ 0 (Zod + backend). Los peldaños son FIJOS — el peldaño es el `value_level` del servicio, sin precio propio ni override.
- **RN-12** · Catálogo **por-tenant**, scope clínica **opcional** por servicio (null = todas). Tenant-isolation siempre.
- **RN-13** · El catálogo **NO es PHI** (info comercial) → tenant-isolation raíz, sin dual-filter PHI.
- **RN-14** · Spanish neutro LatAm en toda la UI.
- **RN-16 (★ Chris #1)** · **Crear servicio = abrir el workspace vacío** (mismo componente que editar), NO un form/Sheet separado. El "+ Nuevo servicio" crea un **borrador** y aterriza en `[offer-id]`.
- **RN-17 (★ Chris #1 + #9-B)** · **Documento → doble uso:** la dueña carga material (PDF/DOCX/imagen/enlace) y al procesarlo Lisa **(a) autocompleta los campos por extracción** (one-shot, editable, revisado) **y (b) lo indexa como conocimiento consultable por Adrián** (RAG, con el scope/safety de RN-22). Reusa la entidad engine `KnowledgeSource` (per-offer) + el extractor copilot. La dueña controla por fuente si "Adrián la consulta" (RAG on/off).
- **RN-18 (★ Chris #2 · política UI)** · Todo campo **no obvio o pesado** lleva **tooltip** explicativo (subrayado punteado + ⓘ, detalle al hover — como en el cockpit). No aplica a campos triviales (nombre, etc.).
- **RN-19 (★ Chris #3 · vertical)** · La **estructura** del catálogo es **idéntica** para clínica dental vs estética (un servicio es un servicio). La diferenciación es por **contenido/data**, derivado de la **especialidad del tenant** (ver § Diferenciación por vertical para el mecanismo). NO se forkea la UI por vertical.
- **RN-20 (★ Chris · política UX autoguardado)** · **Nunca hay botón "Guardar".** Todo cambio **autoguarda** (on-change, debounce). La UI muestra un indicador "💾 guardado" + "última edición". Vincular especialista, togglear activo, editar un campo → se persisten solos. (Excepción semántica: "Activar" es un toggle de estado, no un guardar; "Descartar borrador" elimina.)
- **RN-21 (★ Chris · modelo de conocimiento)** · Crear y editar son **el mismo workspace**. Lleva un panel **"Fuentes & conocimiento"** **persistente y colapsable** (no un paso de onboarding que desaparece): la dueña carga material UNA vez y Lisa **(a)** autocompleta los campos (extracción · editable · marcado con ✨ + fuente) y **(b)** lo deja como **conocimiento consultable por Adrián** (RAG). Reduce el llenado manual — el sistema agéntico hace el trabajo pesado. Ver § Modelo de conocimiento.
- **RN-22 (★ Chris #9-B · RAG en scope · safety)** · El conocimiento que Adrián consulta por RAG se limita a **contenido comercial**; **NO** responde libre sobre lo clínico (contraindicaciones/diagnóstico/medicación → **escala al doctor**). El **precio** SIEMPRE sale del **campo estructurado**, nunca del documento (anti-staleness). Ingesta con **scrub PHI** (HIPAA-lite). Los campos curados (precio, contraindicaciones, candidatura) son la capa de alta precisión; el RAG es el complemento para preguntas libres de cola larga.
- **RN-23 (★ Chris round 3 · política de edición)** · **Todo campo se edita en su vista** (autosave). Excepciones, ambas señalizadas: **(a) dato de otra superficie** → read-only aquí + **tooltip que dice dónde se edita** (ej. moneda → config · datos del especialista → Lisa → Especialistas · opciones de especialidad → tipo de clínica · voz → Lisa → Marca); **(b) calculado** → read-only + tooltip "se calcula solo". Sin tooltip de origen un campo read-only es un bug de UX. (Auditoría completa en § Auditoría de campos.)
- **RN-24 (★ Chris round 3 · placeholders por tipo)** · Los **placeholders, ejemplos y sugerencias** de las vistas se **orientan al tipo de clínica** (dental → "Ej: Diseño de sonrisa" · estética → "Ej: Botox preventivo"; opciones de especialidad, ejemplos del rung-picker, redacción de Lisa). El tipo viene del atributo de clínica (Onboarding/Marca · story `vitalia-fase2-marca-especialidad-clinica`). NO cambia la estructura (RN-19), solo el contenido de ayuda.

### Criterios de aceptación (AC — feature-done)

- **AC-1** · Toggle Catálogo|Escalera persiste en URL (`?view=`).
- **AC-2** · CRUD de servicios con los campos del § Modelo (fijo/rango, paquete, recurrente, **reserva/seña + anticipo + financiamiento (3 cobros distintos)**, doctores, peldaño, toggle único Activo).
- **AC-3** · Escalera: 5 peldaños FIJOS; servicios ubicados por su `value_level`; drag mueve de peldaño; **peldaño vacío muestra qué va ahí + ejemplos por vertical + "crear aquí"** (autoexplicativo). SIN workspace de peldaño ni override.
- **AC-4** · Workspace de servicio = patrón **staff** (`EntitySubNavBar`, NO Shadcn tabs): **5 leaves** Resumen · **Para Adrián** · Especialistas · Plan de pago · Prueba social (★ sin Stats); back vuelve a Servicios. El badge del peldaño vive en **Resumen**, no en el header. Contenido por leaf = § Workspace del servicio.
- **AC-4.bis** · Leaf **"Para Adrián"** entrega el argumentario must-have: candidatura + contraindicaciones + condiciones de escalada + FAQ (pares) + objeciones→respuestas (5) + diferenciadores + palabras clave/sinónimos.
- **AC-9** · Crear servicio = **"+ Nuevo servicio" abre el workspace VACÍO** (mismo `EntitySubNavBar` que editar, NO un Sheet) con borrador autoguardado + **selector de peldaño autoexplicativo** + Lisa redacta la descripción en voz de marca.
- **AC-11** · **Documento → autocompletar:** en el workspace (sobre todo vacío) la dueña carga un documento + **"Procesar con Lisa"** → los campos se **pre-llenan** y quedan **editables** (los revisa antes de guardar). El documento se usa para extracción, **no** se indexa a RAG runtime.
- **AC-12** · **Tooltips** en los campos no obvios/pesados (peldaño, contraindicaciones, escalada, anticipo, reserva, palabras clave): subrayado punteado + detalle al hover.
- **AC-13** · **Autoguardado** en todo el workspace (sin botón "Guardar"): editar un campo, vincular especialista, togglear activo → persisten solos (debounce) + indicador "💾 guardado". "Descartar borrador" elimina; "Activar" es toggle de estado.
- **AC-14** · **Panel "Fuentes & conocimiento" persistente + colapsable** (crear y editar): cargar material → "Procesar con Lisa" → **(a)** campos pre-llenados marcados ✨+fuente (editables) **y (b)** fuentes indexadas para RAG con toggle "Adrián consulta" por fuente + estado (extraído/indexado).
- **AC-15** · **RAG con guardas (RN-22):** verificable que Adrián responde de fuentes **comerciales**; lo clínico **escala al doctor**; el **precio** sale del campo, no del documento; ingesta con scrub PHI. **A + B en esta story** (engine-lift = dependencia hard · § Modelo de conocimiento).
- **AC-16** · **Política de edición (RN-23):** cada campo se edita en su vista; los read-only (moneda, datos del especialista, opciones de especialidad, voz, calculados) muestran **tooltip que dice dónde se editan / que se calculan**. (Auditoría: § Auditoría de campos.)
- **AC-17** · **Placeholders por tipo de clínica (RN-24):** los placeholders/ejemplos/opciones se orientan al tipo (dental/estética) sin cambiar la estructura; el tipo viene del atributo de clínica.
- **AC-10** · Catálogo con **buscador + filtros** (nombre + especialidad + activo), patrón staff.
- **AC-5** · Link servicio↔especialista: **Vincular especialista** abre un selector del **roster** (`lisa-doctores`, NO crea especialistas) con buscador + checkboxes; el link **autoguarda** al marcar (sin botón Guardar · RN-20) y es consultable (cimiento canal-inbound RN-17). Cada especialista vinculado tiene **"Ver detalle ↗"** que deep-linkea a su ficha en **Lisa → Especialistas** + **Desvincular** (no borra al especialista del roster).
- **AC-6** · **KEYSTONE:** un servicio activo aparece en el conocimiento del agente (verificable live: `TenantKnowledgeBuilder` lo inyecta / Adrián lo cita).
- **AC-7** · Seed presets dental/estética adoptables desde el empty-state.
- **AC-8** · RBAC (admin/owner editan, resto read-only) + cross-tenant bloqueado + a11y (keyboard drag + axe).

---

## § Wireframes (mockups · v2 dentro del shell · cambios Chris 2026-06-06)

`mockups/` — **shell-organism completo verbatim** (TopBar + Ribbon Lisa + SubTabsBar + ValeriaSidebar 50/50, portado de lisa-marca v2.1 + `EntitySubNavBar` shipped). `_shared.css` = chrome canónico + clases servicios. Tokens HSL de `globals.css`, datos LatAm reales, Spanish neutro.

- `catalogo.html` — sub-tab Servicios → N3 SubSubTabsBar **[Catálogo · Escalera]** · grid de tarjetas (icono · peldaño badge · duración · precio fijo/rango · doctores o aviso "sin doctores" · chip de capacidad **💳 cuotas** · recurrente · **switch único Activo**) + empty-state con seed presets. ★ Chris #2: se quitaron los chips "seña X%" de las tarjetas (confundían) — la seña se crea y explica en la ficha → Plan de pago.
- `escalera.html` — **5 peldaños FIJOS** (labels médicos sobre `OfferValueLevel`) **autoexplicativos**: cada peldaño dice qué va ahí; el **vacío muestra ejemplos por vertical + "crear aquí"**. Drag mueve de peldaño. SIN drawer de override.
- `servicio-workspace.html` — `[offer-id]` con **`EntitySubNavBar` (patrón staff · NO tabs)**: back ‹ Servicios + entidad (sin badge de peldaño en el header, #8) + **5 leaves** Resumen / Para Adrián / Especialistas / Plan de pago / Prueba social (★ sin Stats) + strip KEYSTONE (activo → Adrián lo conoce). **Plan de pago** = los 3 cobros (reserva + anticipo + cuotas, #2/#3). **Especialistas** = vincular-desde-roster + "Ver detalle ↗" al doctor en Lisa (#6/#7).
- `nuevo-servicio.html` — **crear = workspace VACÍO** (★ Chris #1 · ya NO es un Sheet): mismo shell + `EntitySubNavBar` (5 leaves) con campos en blanco + **card "Arranca rápido"** (cargar documento → "Procesar con Lisa" → autocompleta · extracción editable) + selector de peldaño autoexplicativo + Lisa redacta descripción. Otros leaves se completan al guardar.

> ★ Cambios de shell (FIRMA-2 + round 3): **#4 (RATIFICADO global por Chris)** los leaf-tabs del workspace (`.entity-leaf`) tienen **el mismo color y forma que los SubSubTabs** → se aplica **global** al `EntitySubNavBar` shipped (staff/doctores también) para consistencia en todo el shell. Nota a `/architect` + `SHELL-DESIGN-CONTRACT`. **#2** campos no obvios → **tooltip** (`.tip` · Shadcn `Tooltip` en código). **Round 3:** panel **"Fuentes & conocimiento"** persistente+colapsable (`<details>`/Shadcn) visible en crear+editar · **autosave** (sin botón Guardar · indicador 💾) · `Doctores`→**`Especialistas`** · tarjetas sin badge de peldaño.

```bash
cd vitalia/docs/product/stories/vitalia-fase2-lisa-servicios/mockups && python3 -m http.server 8899
# http://127.0.0.1:8899/catalogo.html · /escalera.html · /servicio-workspace.html · /nuevo-servicio.html
```

## § Componentes (reuse > new · verificar en `vitalia-design-system`)

| Componente | Path (verificar) | reuse/new |
|---|---|---|
| Shell chrome (TopBar · Ribbon · SubTabsBar · ValeriaSidebar) | `components/shared/shell-organism/` | reuse (shipped) |
| **SubSubTabsBar** (Catálogo · Escalera, N3-static) | `components/shared/shell-organism/SubSubTabsBar.tsx` | reuse (shipped) |
| **EntitySubNavBar** (workspace servicio, patrón staff · NO tabs) | `components/shared/shell-organism/EntitySubNavBar.tsx` | reuse (shipped · = lisa-doctores) |
| Card · Badge · Switch · Select · Avatar | `components/ui/{card,badge,switch,select,avatar}.tsx` | reuse |
| **Input + Search icon (buscador) + Select (filtros)** — patrón `StaffDirectoryHeader` | `components/ui/{input,select}.tsx` | reuse |
| ~~Sheet (crear servicio)~~ — ★ #1: crear ya NO usa Sheet; reusa `ServiceWorkspace` en modo vacío | — | eliminado |
| DnD (mover servicio de peldaño) | `@dnd-kit/core` (ya en `adrian-embudo`) | reuse |
| `ServiciosDirectoryHeader` (título + buscador + filtros + Nuevo) · `ServiceCard` (★ sin badge de peldaño · #8) · `EscaleraView` (5 rungs fijos) · `RungColumn` (con guía de vacío) · `ServiceWorkspace` (crear + editar = mismo · #1) + leaves (`ResumenView` · **`ParaAdrianView`** · `EspecialistasView` · `PlanPagoView` · `PruebaSocialView`) · **`EspecialistaLinkPicker`** (selector del roster `lisa-doctores` · #6) · **`KnowledgeSourcesPanel`** (★ panel "Fuentes & conocimiento" persistente+colapsable · dropzone + "Procesar con Lisa" + lista de fuentes con estado extraído/indexado + toggle "Adrián consulta" · #1+#9B) · `SeedPresetCard` · `RungPicker` (peldaño autoexplicativo) · `FaqPairList` + `ObjecionPairList` | `features/lisa/components/servicios/` | NEW (feature-local) |
| **`FieldTooltip`** (#2 · subrayado punteado + hover) — átomo reutilizable | `components/shared/` o `components/ui/tooltip.tsx` (Shadcn) | reuse Shadcn `Tooltip` |

> ★ Eliminados del scope (Chris 2026-06-06): `LadderSlotWorkspace`, ruta `ladder/[slot-id]`, `pricing_override`/`cta_copy` por slot, Shadcn `Tabs` en el workspace. El workspace usa `EntitySubNavBar` (consistencia con staff).
> ★ Eliminados (Chris 2026-06-07 FIRMA-2): `StatsView` (leaf Stats · #4 — esto es configuración, no analítica) · chips "seña X%" en `ServiceCard` (#2 · confundían). `PlanPagoView` modela **3 cobros separados** (reserva + anticipo + cuotas).

## § Decisiones RONDA 1 (cerradas — interrogatorio gate)

Batch 1: todo servicio = Offer · catálogo por-tenant + scope clínica opcional · precio fijo+rango · paquetes en MVP.
Batch 2: labels médicos sobre el enum engine · recurrente = atributo (no peldaño) · seña/financiamiento por servicio en Lisa.
Batch 3: link doctor opcional pero recomendado · RBAC admin+owner editan / resto read-only · **toggle único Activo** (landing eliminada de esta story, Chris #2 2026-06-06).

## § Pendientes para /architect (no bloquean RONDA 1)
- Forma exacta del schema brand-level (columnas en tabla offers vitalia vs tabla aparte) + el preset pack EP-2 (`offer/extensions.py`).
- Dónde persiste el link servicio↔doctor (FK brand-level → `vitalia_doctors`).
- Mapeo fino label médico ↔ `OfferValueLevel` + qué ejemplos `PROFESIONAL_SALUD` del engine se muestran como hints.
- Contenido de los seed presets dental/estética (escalera ejemplo por vertical).
- **(#1+#9B · ENGINE-LIFT · dependencia HARD · TODO junto)** Modelo de conocimiento `KnowledgeSource` per-offer en esta story: **(a)** extractor→autocompletar (reusar copilot `document_processor`) **(b)** indexer Qdrant real (hoy **STUB** → lift `/pm-luana`) **(c)** tool de retrieval del **sales_agent** (hoy **no existe** → lift `/pm-luana`) **(d)** guardas RN-22 (scope comercial · precio del campo · clínico→escala · scrub PHI). Chris: A+B juntos. El lift (b)(c) es **dependencia hard del ready package**. Archivo subido = Asset (PHI handling).
- **(#4 · RATIFICADO global)** `EntitySubNavBar` restyle a estilo SubSubTab se aplica **global** al shell shipped (staff/doctores incluidos · consistencia) → actualizar `SHELL-DESIGN-CONTRACT` + arch-test del componente.
- **(autosave)** Patrón autoguardado del workspace (debounce on-change · sin botón Guardar · RN-20) reusando el patrón shipped de otras sub-tabs (ADR-vitalia-004 §5 autosave 600ms).
- **(#3)** **Especialidad de la clínica** (tenant-level): confirmar si existe el campo en brand/onboarding; si no, su autoría es **cross-story onboarding/marca** (`/pm-vitalia`). Servicios lo **consume** read-only (presets + hints + opciones del dropdown per-servicio). Distinto del campo per-servicio `especialidad/categoría`, que sí vive aquí.
- **(#2)** Átomo `FieldTooltip` (Shadcn `Tooltip`) + convención de cuáles campos lo llevan.

## § Auditoría de campos — editable / dónde se edita (★ Chris round 3 · "dale una auditoría")

> Recorrí cada vista campo por campo. Regla establecida (**RN-23**): **todo campo se edita en su vista**, salvo que sea **(a) dato de otra superficie** (entonces es read-only aquí + **tooltip dice dónde se edita**) o **(b) calculado** (read-only + tooltip "se calcula solo"). Marqué los hallazgos y los **arreglé en los mockups**.

| Vista | Campo | ¿Editable aquí? | Si no — dónde se edita / nota |
|---|---|---|---|
| **Resumen** | Nombre · Especialidad · **Peldaño** · Descripción · Qué incluye/no · Variantes · Garantía · Duración/sesiones · Resultado · Preparación · Cuidados · Cita inicial · Recurrente | ✅ editable aquí | **★ FIX:** estaban como texto read-only en Identidad → ahora **inputs/selects editables** (autosave). Peldaño también se mueve por drag en **Escalera**. |
| **Resumen** | Especialidad / categoría (opciones del dropdown) | ✅ eliges aquí | **★ tooltip:** las **opciones** salen del **tipo de clínica** (Onboarding · editable en Lisa → Marca). |
| **Resumen** | Tono/voz de la descripción | la descripción ✅; el **tono** no | **★ tooltip:** el estilo lo toma de **Lisa → Marca** (voz de marca). |
| **Para Adrián** | Candidato · contraindicaciones · escalada · preguntas · beneficios · dolor · diferenciadores · ganchos · FAQ (pares) · objeciones (pares) · palabras clave · problemas · lenguaje a evitar | ✅ editable aquí | (FAQ/objeciones = listas de pares editables; alimentan el KB del agente). |
| **Especialistas** | Vínculo servicio↔especialista (marcar/desmarcar) | ✅ aquí (autosave) | — |
| **Especialistas** | Nombre · especialidad · **credenciales** del especialista | ❌ read-only aquí | **★ nota + "Ver detalle ↗":** se editan en **Lisa → Especialistas** (roster `lisa-doctores`). |
| **Plan de pago** | Precio (monto) · Modo · "Adrián dice el precio" · Reserva (monto/tipo/pide) · Anticipo (% o monto/ofrece) · Cuotas · Interés · Medios · Socio financiero | ✅ editable aquí | — |
| **Plan de pago** | **Moneda (S/)** | ❌ read-only aquí | **★ FIX:** la separé del monto + **tooltip:** sale de la **config de tu clínica** (tenant_locale · Configuración → Cuenta/Localización). |
| **Plan de pago** | **≈ equivale a** (anticipo) · **≈ por mes** (cuotas) | ❌ calculado | **★ tooltip "se calcula solo"** (del % + precio + reserva). |
| **Prueba social** | Fotos antes/después · testimonios · casos | ✅ editable aquí | (el consentimiento de las fotos lo gobierna Compliance — fuera de scope). |
| **Fuentes & conocimiento** | Documentos cargados · toggle "Adrián consulta" | ✅ aquí | estado extraído/indexado = del sistema (read-only). |
| **Catálogo (tarjetas)** | toggle Activo | ✅ inline | el resto de la tarjeta = resumen read-only (se edita entrando al servicio). |

**Hallazgos arreglados en los mockups esta ronda:** (1) Identidad de Resumen era read-only → editable. (2) Moneda incrustada en el precio → separada + read-only con tooltip de origen. (3) Campos calculados sin señal → tooltip "se calcula solo". (4) Datos del especialista → nota explícita "se editan en Lisa → Especialistas". (5) Especialidad/voz → tooltip de origen.

## § Modelo de conocimiento del servicio (★ Chris round 3 · "el form es muy pesado, que el sistema agéntico facilite")

> Problema que planteó Chris: un servicio tiene ~55 campos posibles (24 must-have). Llenarlos a mano = pesado, anti-agéntico. La idea de un equipo de agentes es **facilitar el trabajo**, no dar un formulario gigante.

**Mi propuesta — invertir el flujo: de "llená el formulario" a "dale material, Lisa lo arma, vos revisás".**

1. **Panel "Fuentes & conocimiento" — persistente y colapsable** (NO un paso de onboarding que desaparece · vive arriba del workspace, visible en crear y editar). La dueña arrastra el material del servicio **una vez**: folleto · lista de precios · protocolo · ficha técnica · enlace web · (a futuro) una conversación.
2. **Lisa procesa → doble uso del mismo documento:**
   - **(a) Autocompleta los campos** (extracción): los campos de las 5 pestañas se **pre-llenan** y quedan **editables**, marcados con **✨ + de qué fuente salió** (la dueña revisa lo marcado, no escribe de cero).
   - **(b) Queda como conocimiento de Adrián** (RAG): para preguntas libres del paciente que los campos estructurados no cubren. Toggle por fuente: "Adrián la consulta" on/off.
3. **Los campos estructurados se quedan** — son la capa **curada y de alta precisión** que Adrián usa para lo crítico (precio, contraindicaciones, candidatura). El RAG es el **complemento** para la cola larga. **El precio nunca sale del RAG** (sale del campo, anti-staleness).
4. **El trabajo de la dueña se encoge a revisar + curar**, no tipear. Autoguardado siempre (RN-20).

```
  [ 📚 Fuentes & conocimiento ]  ← persistente, colapsable
        │  arrastra folleto / precios / protocolo / enlace
        ▼  "Procesar con Lisa"
   ┌────────────┬─────────────────────────────┐
   ▼ (a) extrae                          (b) indexa ▼
  campos pre-llenados (✨ editable)      RAG de Adrián (comercial · scope+safety RN-22)
   │  la dueña REVISA                      │  preguntas libres del paciente
   ▼                                       ▼
  capa curada (precio/contra/candidatura = SSoT)   complemento cola larga
```

**Por qué esto sí es agéntico:** la dueña no enfrenta 24 campos vacíos; suelta un folleto y corrige lo que Lisa armó. Es el diferenciador (ningún competidor conecta material → catálogo vendible + agente que consulta).

**⚠️ Esto agranda la story (Chris lo ratificó · "historia más grande pero necesaria"). ★ Chris round 3: TODO ACÁ — A (autocompletar) + B (RAG) en esta misma story, junto, no se parte.** Suma: ingesta `KnowledgeSource` (extraer **+** indexar) + un **tool de retrieval del sales_agent** que HOY **no existe** + el indexer Qdrant que HOY es **STUB**. → **Dependencia HARD de lift de engine (`/pm-luana`)** dentro del alcance de esta story: el indexer real + el retrieval tool del sales_agent son engine y deben landear para que B se vea live. `/architect` la dimensiona como parte del ready package (no como story aparte).

## § Diferenciación por vertical — dental vs estética (★ Chris #3 · mi recomendación UX)

> Pregunta: ¿cómo tratamos una clínica **dental** vs una **estética**? ¿cambia algo en los servicios?

> **★ ¿Dónde se declara la especialidad? (Chris round 3) — son DOS cosas distintas:**
> - **Especialidad de la CLÍNICA** (qué tipo de centro es: dental cosmético · medicina estética · multi-especialidad) = **atributo del tenant**. **NO se crea aquí.** **★ RATIFICADO Chris 2026-06-07: se crea en el Onboarding (set once) y se edita en Lisa → Marca.** **Servicios lo CONSUME** (read-only) para presets + ejemplos del rung-picker + opciones del dropdown. → capturado como story propia **`vitalia-fase2-marca-especialidad-clinica`** (idea · pendiente `/pm-vitalia`); servicios solo lo lee (dependencia soft).
> - **Especialidad/categoría del SERVICIO** (este servicio es odontología, ese otro estética) = **per-servicio · sí vive aquí** (campo del § Modelo). El dropdown se **alimenta** de las especialidades declaradas de la clínica (un centro multi-especialidad tiene servicios de varias).

**Mi recomendación: NO forkear la UI. Un servicio es un servicio — la estructura es la misma. Lo que cambia es el CONTENIDO, derivado del vertical del tenant.** El vertical (dental / estética / dermatología / …) es un **atributo del tenant** (se fija en marca/onboarding — "tipo de clínica"), NO un campo por-servicio ni una UI distinta. Razón: forkear la UI por vertical multiplica superficie + mantenimiento sin valor; los competidores que vimos no lo hacen. La adaptación vive en los **datos y las sugerencias**, donde sí aporta:

| Qué adapta el vertical | Cómo |
|---|---|
| **Seed presets** (ya en scope) | dental: evaluación→limpieza→diseño/implante→carillas→mantenimiento · estética: valoración→peeling→botox/fillers→paquete→mantenimiento trimestral |
| **Ejemplos del selector de peldaño** | el rung-picker muestra ejemplos del vertical (dental: "diseño de sonrisa, implante" · estética: "botox, peeling") |
| **Opciones de especialidad** | el dropdown se filtra al vertical del tenant |
| **Sugerencias de Lisa** (descripción · FAQ · objeciones) | redactadas con sabor del vertical + voz de marca |
| **Énfasis natural** (no campos distintos, mismos campos con peso distinto) | estética → recurrencia (botox c/4-6m) + antes/después + downtime · dental → paquetes/garantía + financiamiento largo (implantes) |

**Qué NO hago:** campos exclusivos por vertical, pantallas separadas, lógica condicional de UI por tipo de clínica. Mismos 5 leaves, mismos campos.

**★ Alternativa mejor que pediste (#4 · ejemplos más acertados a la especialidad, sin forkear):** en vez de un switch grueso dental/estética, usar la **especialidad/sub-vertical declarada del tenant como CLAVE** de dos cosas:

1. **Catálogo de hints por sub-vertical (engine):** hoy el engine tiene UNA fila genérica `PROFESIONAL_SALUD` en `OFFER_LADDER_HINTS`. **Propongo expandirla a filas por sub-vertical** (odontología-cosmética · medicina-estética · oftalmología · dermatología · …) → el selector de peldaño y los seed presets muestran ejemplos del sub-vertical exacto, no genéricos. (Refinar el engine → `/pm-luana`.)
2. **Ejemplos GENERADOS por Lisa, condicionados a la clínica (más agéntico y más preciso que cualquier tabla):** los ejemplos y sugerencias (qué va en cada peldaño, descripción, FAQ, objeciones) los **genera Lisa** a partir de **(especialidad + el catálogo real que ya tiene la clínica + voz de marca)**. Una tabla estática nunca le pega tan bien como un modelo que mira el contexto real del centro. Los seed presets estáticos son solo el **cold-start** (clínica sin nada); apenas hay especialidad + 2-3 servicios, Lisa adapta los ejemplos a ESA clínica.

→ **Resultado:** ejemplos cada vez más acertados a la especialidad, **sin** una UI distinta por vertical. Capa 1 (hints por sub-vertical) = engine. Capa 2 (Lisa genera) = capa agéntica de Lisa. En el **MVP** de esta UI alcanza con: especialidad declarada + seed presets dental/estética + rung-picker que ya lee la especialidad; las capas finas se profundizan en engine + Lisa.

**★ Cómo se ve cuando hay un "tipo de clínica" (Chris round 3 · placeholders · RN-24):** la **misma pantalla** muestra **placeholders/ejemplos orientados al tipo**. Demo interactivo en **`nuevo-servicio.html`** (botones `🦷 Odontología | 💉 Estética`): al cambiar el tipo cambian los placeholders del nombre ("Ej: Diseño de sonrisa" ↔ "Ej: Botox preventivo"), de la descripción, de "qué incluye", las **opciones del dropdown de especialidad**, y los **ejemplos del selector de peldaño** ("diseño de sonrisa, implante" ↔ "botox, rellenos, peeling"). En producción el tipo NO es un toggle: sale del **atributo de clínica** (Onboarding/Marca) y el usuario ve directamente lo de su tipo. Cero pantallas distintas — solo el texto de ayuda se adapta.

## § Recomendación #9 — documentos → RAG para Adrián (research · esperando tu decisión)

> Chris pidió: averiguar + recomendar si debería poder **"Cargar" documentos** en algún lugar para que entren al **RAG** y Adrián responda consultas libres.

> **★ RESUELTO en parte por Chris #1 (2026-06-07):** hay **dos features de "documento" distintas** — hay que separarlas:
> - **(A) Documento → AUTOCOMPLETAR campos** (lo que pediste en #1): subir material → extraer → **pre-llenar los campos editables** del servicio. Es **one-shot**, la dueña revisa, NO se indexa. **El engine YA lo hace** (copilot `document_processor`: parse → LLM extraction → merge a campos). **Bajo riesgo · ENTRA en esta story** (RN-17/AC-11). `/architect` confirma el wiring para offers de vitalia.
> - **(B) Documento → RAG runtime** (la consulta libre de Adrián sobre el PDF): el agente responde leyendo el documento en vivo. **Esto es lo que recomiendo DIFERIR** (abajo). Indexer Qdrant del engine = STUB; precio/contraindicaciones en PDF = staleness + riesgo; PHI → HIPAA-lite.
>
> O sea: **sí a cargar documentos** (para autocompletar · A) en esta story; **no todavía** a que el agente conteste libremente desde ellos (B).

**Qué encontré (estado del engine, 2026-06-07):**
- El conocimiento de Adrián HOY se arma **solo de data estructurada** (`TenantKnowledgeBuilder`: offers + marca + personalidad + FAQ/objeciones). NO hay pipeline de ingesta documento→chunk→embedding vivo.
- El engine **ya tiene el esqueleto**: Offer Studio tiene una entidad `KnowledgeSource` + endpoint `/{offer_id}/knowledge/upload` (PDF/DOCX/URL) **por offer** — pero el indexer Qdrant real es un **STUB** (no indexa). O sea: el gancho existe, el motor no está conectado. Conectarlo = trabajo de **engine (`/pm-luana`)**, no de esta UI-story.
- Qdrant para sales_agent existe a nivel infra, pero **ningún tool del agente lo consulta** todavía.

**Qué dice el best-practice (2025-26 · Intercom Fin · Ada · Sierra · clinical AI):**
- Para un agente de **venta**, los **campos estructurados curados** (FAQ pares, objeciones, contraindicaciones) son **mejor** que volcar PDFs: más precisión, cero chunking roto, sin drift.
- Los **2 datos más peligrosos** en PDF acá: **precio** (se pone stale apenas cambia una promo) y **contraindicaciones** (riesgo clínico/legal si el agente responde mal).
- Los PDFs clínicos (consentimientos, protocolos) **traen PHI casi seguro** → ingestarlos sin un scrub de PHI viola HIPAA-lite.
- El patrón bueno cuando se ofrece: **base de conocimiento a nivel tenant** (no adjunto por-servicio), **copilot-interno primero**, con freshness + scoping de qué agente la ve.

**Mi recomendación (vos decidís):**
1. **NO** meter "subir documentos → RAG" en el **MVP** de este catálogo. Los campos estructurados que ya diseñamos (Para Adrián: FAQ, objeciones, contraindicaciones, palabras clave) **son** el substrate de RAG, mejor y más seguro.
2. Hacerlo como **story aparte, a nivel tenant** ("Base de conocimiento de la clínica"), **copilot-interno primero** (protocolos/SOP con scrub PHI), y recién después exponer al sales_agent **solo contenido comercial** (folletos, post-cuidado sin PHI) con freshness + escalada en preguntas clínicas.
3. Requiere **lift de engine** (`/pm-luana`): conectar el indexer real (hoy STUB) + un tool de retrieval para el agente.

**★ DECIDIDO (Chris round 3, 2026-06-07): A + B TODO EN ESTA STORY (junto, no se parte).** Mi recomendación de diferir queda **superada** — pero **conservo las guardas** no-negociables (RN-22): RAG solo comercial · precio siempre del campo (no del PDF) · clínico escala al doctor · scrub PHI en ingesta. El **cómo** (modelo dual documento→extrae+indexa) está en **§ Modelo de conocimiento**. La **dependencia de engine-lift** (`/pm-luana`: indexer Qdrant real hoy STUB + tool de retrieval del sales_agent hoy inexistente) es **parte del alcance** → `/architect` la dimensiona en el ready package.

## Próximo paso
**✍ FIRMA 1 (intención)** sobre este § Mapa funcional + § Modelo → luego mockups per-component (catálogo card · escalera canvas · workspace servicio · drawer peldaño) con fidelidad de shell (ADR-003) → **✍ FIRMA 2** → RONDA 2 (Gherkin + matriz de cobertura) → transition refining→refined.
