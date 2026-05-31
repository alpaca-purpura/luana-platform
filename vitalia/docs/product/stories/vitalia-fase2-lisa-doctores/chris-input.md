---
story_id: vitalia-fase2-lisa-doctores
created_at: 2026-05-27T18:25:23-05:00
last_modified: 2026-05-27T18:25:23-05:00
notes_count: 0
refs_count: 0
conversation_count: 1
---

<!-- voseo-allowed: proceso conversacional interno Claude↔Chris — no es string user-facing; `chris-input-protocol.md` R30 requiere output verbatim por skill incluyendo voz del turno previo -->

# chris-input.md · vitalia-fase2-lisa-doctores

> **Qué es este archivo:** acá Chris escribe notas + referencias + Claude responde con verdicts. Es la cocina de la story (la conversación) — separada del spec/design/arch (los outputs ratificados).
>
> **3 secciones secuenciales** (mantener el orden + emojis para que parser + cockpit funcionen):
> - 💭 Notas — Chris escribe en lenguaje natural antes/durante refinement
> - 📎 Referencias — links, imágenes, story-refs, learning-refs, doc-refs
> - 💬 Conversación — turn-by-turn cronológico Chris ↔ Claude con verdicts
>
> Doc canónico: `docs/process/chris-input-protocol.md`.

## 💭 Notas

> Chris: escribe acá tus notas en lenguaje natural. Cualquier cosa que te ayude a pensar la story.
>
> Cada entry abre con `### YYYY-MM-DD HH:MM` (timestamp).

### 2026-05-27 18:25
Sin notas todavía · Chris escribe aquí.

## 📎 Referencias

> Chris: pega links, sube imágenes (drag-drop o botón adjuntar), cita texto de buyer personas, referencia otras stories (`F2-S1`) o learnings (`2026-MM-DD-slug`).
>
> Tipos válidos: 🔗 link · 🖼 img · 💬 text · 📖 story-ref · 📚 learning-ref · 📄 doc.
>
> Formato: `- **(emoji) (tipo)** · (valor)` + opcional `  > (comentario)` en siguiente línea.

(sin referencias todavía)

## 💬 Conversación

> Append-only · turn-by-turn cronológico.
> Chris responde a Claude editando + agregando un entry nuevo.
> Claude appendea verdict al cierre de cada turn de su skill.
>
> Verdict labels: ✓ APLICADO · ⚠️ DUDA · ❌ REFUTADO · 💡 PROPONE.

### 2026-05-31 · builder-frontend (T-FE-3)

**Scope:** T-FE-3 — Horarios calendar: DoctorHorariosView + AvailabilityCalendar + BloquePopover + useAvailabilityBlocks

**Build result:**
- ✓ APLICADO: `AvailabilityCalendar.tsx` — custom week grid (day×hour, CSS Grid) + @dnd-kit drag-to-create + week nav (‹/›) + 24h toggle + block rendering with `data-testid`
- ✓ APLICADO: `BloquePopover.tsx` — recurrence form (semanal/quincenal + end_date/N iteraciones/Solo esta semana) + delete flow with SC-3b warning dialog
- ✓ APLICADO: `DoctorHorariosView.tsx` — "use client" root with autosave hint
- ✓ APLICADO: `horarios/page.tsx` — Server Component importing from barrel (arch test compliant)
- ✓ APLICADO: 4 new hooks in `staff.ts` (useAvailabilityBlocks, useCreateBlock, useUpdateBlock, useDeleteBlock)
- ✓ APLICADO: `AvailabilityCalendarPage.ts` Playwright POM
- ✓ APLICADO: 26 new tests (11 schema + 15 component), all GREEN
- ✓ APLICADO: @dnd-kit/core + @dnd-kit/utilities installed

**Quality gates:**
- TSC: 0 errors · ESLint: 0 errors · Vitest: 2411/2411 PASS · Architecture: 162/162 PASS

**Commit:** `29625988` on `wip/vitalia` · pushed to origin

**Pending (Chris action):**
- Live verification via `chrome-devtools-verify` requires T-BE-3 stack running at localhost:3002 (`make dev-vitalia`). NOT done (dev stack not running in this session).
- T-E2E ticket for full Playwright specs SC-1..SC-11 remains open.

### 2026-05-27 18:25 · 🤖 claude · `scripts/migrate_to_release_schema.py` · ✓ APLICADO
Story migrada al schema v2: `release=F2`, `cap_target=lisa.doctores`, `cap_change_type=new`. Legacy `outcome` + `phase` preservados durante deprecation gradual.

Cuando estés listo para refinar, llena 💭 Notas + 📎 Referencias arriba e invoca `/po-ux vitalia vitalia-fase2-lisa-doctores` (o `/po` si es service story, o `/ux-agentico` si es agentic).

### 2026-05-30 17:30 · 🤖 claude · `/pm-vitalia` · ✓ APLICADO
Prior-art scan ejecutado. Corregí 2 incoherencias del scope original en `checkpoint.md`:
- `module: staff` → `module: clinics` (el módulo `staff/` NO existe; Doctor vive en `clinics/` + `infrastructure/models/doctor_extension_model.py`).
- Horarios → NO recrear slots: `scheduling/` (agenda_slot, create_appointment, agenda_grid) + engine `luana-core-scheduling`/`luana-core-commercial-calendar` ya existen → se **consumen**.
- Cap reconciliation ratificada por vos: `lisa.doctores` **new** (zona Agentes→Lisa); sucede a `clinics-brand-extension` (deprecated) + consume `prepaid-booking-advisory-locks`.
Sección `## Prior art scan` agregada al checkpoint. Encadeno a `/po-ux` para producir `01-spec.md` (directorio doctores + workspace N3-dyn [doctor-id] con tabs Bio/Horarios/Servicios/KPIs).

### 2026-05-30 17:45 · 🤖 claude · `/po-ux` · ✓ APLICADO
Escrito `01-spec.md` v1 (draft). Decisiones de scope ratificadas por vos en batch 1:
- **Horarios: recurrencia avanzada** → el spec CONSUME `luana-core-commercial-calendar` para reglas recurrentes (no recrea). La UI es `HorariosRecurrenceEditor`; la resolución es backend.
- **Tab KPIs DIFERIDO** → la story entrega 3 tabs (Bio/Horarios/Servicios), no 4. Out-of-scope documentado.
- **Landing público: solo toggle + endpoint** read-only PHI-masked. La UI de landing va a `vitalia-fase2-lisa-landing-public`.
- **Full HIPAA-lite**: pgcrypto at-rest + audit + RBAC admin_clinic + masking + channel guards.
Scenarios: 4 base (happy/negative/edge/adversarial) + 7 sub-categorías (race/concurrent/network/empty/large/a11y/i18n) = 11. Wireframes ASCII (directorio cards + workspace tabs). Componentes: ~7 NEW en `features/lisa/components/doctores/` (justificados, hoy solo hay marca+placeholders).
**⚠️ Estimación subió 3-4d → 5-6d** por recurrencia avanzada + full HIPAA. Si /architect ve que la recurrencia infla, candidato a split de ticket.
Pendiente tu ratificación para cerrar refining→refined. Revisá `01-spec.md` (sobre todo SC-1 happy + § HIPAA-lite + § Estimación).

### 2026-05-30 18:20 · 🤖 claude · `/po-ux` · ✓ APLICADO
Aplicados tus 3 inputs + generados los entregables para tu lectura previa a aprobar:

**1. Assets + Cloudflare R2** — `luana-core-assets` ya existe con `StorageService` S3-compatible que **soporta R2 vía boto3 + presigned POST** (upload directo browser→R2). Vitalia sería el primer consumidor. Spec actualizado: avatar consume assets+R2 (§ Storage). ⚠️ El token `cfat_…` que pasaste es CF API token (sirve para wrangler/crear bucket), pero el runtime boto3 necesita **R2 S3 Access Keys** (se generan aparte en R2→Manage API Tokens). El provisioning real (bucket+CORS+creds en .env) va a ticket de build, NO en refining. **Rotá el cfat tras usarlo** (se pegó en chat plano).

**2. Horarios = bloques mutables** (no template fijo). Reescrito: cada bloque es recurrente (con **fecha-fin O N-iteraciones** O abierto) o puntual; **eliminables en cualquier momento**; eliminar reproyecta solo el futuro y preserva citas confirmadas. Scenarios nuevos: SC-1 (fecha-fin), SC-1b (N-iter), SC-1c (puntual), SC-1d (eliminar bloque), SC-3b (eliminar bloque con cita confirmada → warning).

**3. Endpoint público profundizado** (§ Endpoint público): allow-list de campos (display_name, specialty, avatar_url, años, idiomas, bio_public, credential_label opcional); PHI/PII NUNCA; channel guard por arch test. Solo doctores visible+active. UI de landing queda en lisa-landing-public.

**Entregables para que leas ANTES de aprobar:**
- `01-spec.md` → § Gherkin scenarios (la lista de funcionalidades, formato Given/When/Then = lo que irá al cap) + **§ Business rules** (15 reglas con severidad/enforcement/audit) + § Endpoint público + § Storage.
- `mockups/doctores.html` → mockup visual (directorio cards + workspace 3 tabs + bloques de horarios). Preview: `cd vitalia/docs/product/stories/vitalia-fase2-lisa-doctores/mockups && python3 -m http.server 8888` → http://localhost:8888/doctores.html

**⚠️ Estimación ahora 7-9d** (bloques mutables + full HIPAA + assets/R2 first-consumer). Propongo que /architect lo **divida en 3 tickets** (CRUD+bio+servicios / horarios-bloques+scheduling / assets+R2+avatar+público).

Quedo esperando tu lectura. No ratifiqué nada (state sigue `refining`).

### 2026-05-30 18:55 · 🤖 claude · `/po-ux` · ✓ APLICADO
Aplicadas tus correcciones de ARQ/UX (gracias, eran de fondo):
- **No tabs internos** (verifiqué la política en `ADR-vitalia-004` + el precedente `lisa/marca/{presencia,voz-y-tono,identidad}` que son rutas, no tabs). Perfil/Horarios/Servicios ahora son **rutas-hoja** reales.
- **Layout angosto + Valeria al costado**: spec marca que TODO va full-width de columna angosta, legible en poco espacio. Cards apiladas 1-col, calendario compacto.
- **Nav de entidad dinámica (tu propuesta)**: fila contextual de ribbon `‹ Lista de doctores / {Nombre} · Perfil · Horarios · Servicios` (N3-dynamic) para no romper árbol→hoja. La marqué como **cross-cutting** (aplica a todo workspace de entidad, no solo doctores) → necesita addendum a `ADR-vitalia-004` + componente `shell-organism/EntityBreadcrumbBar`. Escalado en § Handoff ARQ; NO se construye el shell genérico dentro de esta sola story.
- **Horarios = calendario tipo Google Calendar**: vista semana, arrastrar para crear bloque, popover repetir (semanal/quincenal + fecha-fin/N-iter o "solo esta semana"), navegación ‹ › entre semanas (cada semana puede ser distinta). Scenarios SC-1/1b/1c/1d actualizados a esa interacción.

**Mockup reescrito** (`mockups/doctores.html`, refrescá el navegador) ahora muestra el shell real: Valeria chat a la derecha, columna angosta, fila contextual, y el calendario compacto. Clic en un doctor → aparece la fila `‹ Lista de doctores / Dra. Ana` + Perfil/Horarios/Servicios.

**Pendiente que pediste** ("recordar esto siempre como UX"): al aprobar, propongo cementar 2 cosas → (1) regla UX "full-width columna angosta + Valeria coexiste", (2) patrón nav N3-dynamic. Vía memory + addendum ADR-vitalia-004 + SHELL-DESIGN-CONTRACT. Lo dejo listado en § Handoff ARQ.

¿Revisás el mockup actualizado + el spec? Si OK → cierro refining→refined y encadeno /architect (que decide el split de tickets + el tema del componente shell genérico).

### 2026-05-30 19:30 · 🤖 claude · `/po-ux` · ⚠️ DUDA
Chris pidió que el mockup use el shell-organism REAL (no mi aproximación genérica). Investigué y encontré mi error de fondo + el camino correcto, PERO el contexto de esta sesión está saturado (arrastra el bug inicial de ~200 lecturas duplicadas) y el harness empezó a truncar/cancelar lecturas → no puedo portar los canónicos de 1400+ líneas de forma confiable ahora.

**Hallazgos (para retomar en sesión limpia):**
- Regla SSoT: `vitalia/.claude/rules/shell-mockup-per-component.md` (ADR-vitalia-003). **Mi mockup violó el anti-pattern "reinventar el wrapper"** — hay que **portar VERBATIM** topbar+ribbon+sub-tabs+splitter+chat-Valeria desde los canónicos.
- Canónicos a portar: `vitalia/docs/archive/2026/stories/vitalia-shell-organism/mockups/dual-mode-shell.html` (wrapper integral) + `.../vitalia-fase1-valeria-chat-skeleton/mockups/valeria-chat-sample.html` (chat) + `.../vitalia-fase1-valeria-rail-history/mockups/valeria-rail.html`.
- **Precedente directo de calendario:** `.../vitalia-fase2-valeria-agenda/mockups/agenda-week.html` (vista semana DENTRO del shell real) → base ideal para la hoja Horarios.
- **Tokens reales (NO los que usé):** primario cian #01B2F8 · accent púrpura #7B2D91 · **agent-lisa #00D084 (VERDE, no teal)** · agent-valeria #7B2D91 · agent-camila #180D95 · agent-mateo #FEE209 · gradient mariposa. `_shared.css` del story-folder debe espejar `vitalia/frontend/src/app/globals.css`.
- Componentes shell reales: `components/shared/shell-organism/{ApexShellV2,RibbonV2,TopBarV2,ValeriaSidebar,SubTabsBar,SubSubTabsBar,RibbonTab,SubTab,ContentArea}.tsx` + `ribbonConfig.ts`.
- Splitter 3 estados a simular: `chat-collapsed / chat-narrow / 50-50`.

**PLAN sesión limpia (post /clear):**
1. `cp agenda-week.html → mockups/doctores.html` (hereda wrapper real + calendario) y crear `_shared.css` espejo de globals.css.
2. Reemplazar SOLO el `.panel-content`: vista Lista de doctores (cards apiladas) + fila contextual N3-dyn `‹ Lista de doctores / {Nombre} · Perfil·Horarios·Servicios` + hojas Perfil/Horarios(calendario)/Servicios. Wrapper intacto.
3. Ratificar visual con Chris (`ratified_visual_by_chris: true` — gate del protocolo, sin esto /architect REFUSE).
4. Recién ahí: cerrar refining→refined + encadenar /architect.

**Pendiente cementación UX (lo que Chris pidió "recordar siempre"):** tras ratificar, actualizar `.claude/skills/po-ux/SKILL.md` para que SIEMPRE: (a) cargue `shell-mockup-per-component.md` como gate HARD, (b) porte wrapper verbatim (nunca reinvente), (c) recuerde layout angosto + Valeria al costado, (d) patrón nav N3-dynamic. + memory entry + addendum ADR-vitalia-004.

State sigue `refining`. NO ratificado.

### 2026-05-30 20:10 · 🤖 claude · `/po-ux` · ✓ APLICADO
Rehecho el mockup con el **shell-organism REAL** (mi error anterior fue reinventar el wrapper — la rule `shell-mockup-per-component.md` lo prohíbe explícito). El contexto NO estaba tan saturado como temí: `agenda-week.html` (439 líneas, limpio) tenía todo.

**Qué hice bien ahora (port verbatim, no reinvención):**
- `cp _shared.css` canónico de valeria-agenda → story-folder (tokens HSL reales: Lisa **#00d084 verde**, Valeria #7b2d91, primario cian, etc. — NO los inventados).
- Wrapper portado verbatim: `.shell-topbar` + `.shell-ribbon` (5 especialistas + Plataforma, Lisa activo) + `.shell-subtabs`.
- Calendario de Horarios reusa `.week-grid`/`.week-cell`/`.agenda-slot` reales (mismo sistema que la Agenda de Valeria) → coherencia visual garantizada.
- Chat de Valeria al costado con markup/tokens del `valeria-chat-sample.html` canónico (avatar + dot status verde + mode pill + composer).
- Fila N3-dyn contextual `‹ Lista de doctores / {Nombre} · Perfil·Horarios·Servicios` con color Lisa.
- Toggle 🌓 dark/light (tokens `.dark` del _shared.css).

Sirviendo en **http://127.0.0.1:8888/doctores.html** (refrescá fuerte: Ctrl+Shift+R). Ahora SÍ se ve el shell de Vitalia.

**Pendiente tras tu OK visual:** actualizar `.claude/skills/po-ux/SKILL.md` para que JAMÁS vuelva a pasar (cargar shell-mockup-per-component como gate HARD + portar wrapper verbatim + tokens reales + layout angosto+Valeria + nav N3-dyn). Esa es la parte "para que nunca más lo olvides".

### 2026-05-30 20:55 · 🤖 claude · `/po-ux` · ✓ APLICADO
Corregido de raíz. Mis 2 errores graves: (1) reinventé el shell en vez de portar el canónico; (2) lo puse al revés (Valeria a la derecha — va a la IZQUIERDA). La 55.png que mostraste ERA mi mockup malo. Sí existía el base que recordabas: **`dual-mode-shell.html`** (1439 líneas, SSoT visual del shell).

**Qué hice ahora (lo correcto desde el principio):**
- `cp dual-mode-shell.html → doctores.html` **verbatim** (shell real intacto: TopBar con TenantSwitcher dropdown + LogoMark gradient mariposa · split 50/50 · **Valeria IZQUIERDA** con rail/history/chat + atajos C/R/F/N · Ribbon con avatares + labels de TAREA "Mi Clínica·Atraer·Vender·Operar·Mantener·Configurar" + tint agent-color · sub-tabs · theme toggle).
- Solo cambié 3 cosas: estado inicial → `lisa/doctores`; el body de `lisa/doctores` → contenido real (antes era empty-state); agregué la navegación N3-dyn.
- **Lista de doctores** (cards en el panel App derecho) → clic abre el **workspace** con la fila contextual `‹ Lista de doctores / {Nombre} · Perfil·Horarios·Servicios` (Lisa verde #00D084).
- **Horarios** = calendario semanal de bloques (recurrente B1 verde + puntual P ámbar) coherente con la grilla de la Agenda.

Refrescá fuerte (Ctrl+Shift+R) **http://127.0.0.1:8888/doctores.html**. Ahora es el shell de Vitalia de verdad: Valeria a la izquierda, ribbon de tareas, Lisa→Mi Clínica→Doctores activo.

Si esto ya coincide con dev-app → me decís "está bien" y (1) cierro refining→refined + /architect, (2) actualizo el skill po-ux para que nunca más reinvente el shell.

### 2026-05-30 19:55 · 🤖 claude · `/po-ux` · ✓ APLICADO
Alineé el detalle de doctor con el patrón N3 de **Mi Clínica / Marca** (`SubSubTabsBar`, ADR-vitalia-004 § 3.1.1). El detalle ya NO usa el toggle-pill verde lleno (eso parecía "tab interno"). Ahora es una **tira N3 idéntica a Marca**: una sola fila con border-inferior y pills `padding 6px 12px · rounded 6px`, activo = fondo sutil `bg-hover` + texto primario (NO verde lleno), inactivo = texto secundario con hover sutil — exactamente el estilo de Identidad/Voz y tono/Presencia. Los cuatro son **botones**:

`[‹ Lista de doctores]  |  ⌀ Dra. Ana Paredes  |  [👤 Perfil] [🗓️ Horarios] [🩺 Servicios]`

- "Volver" = **botón** pill (ya no link verde suelto).
- Perfil/Horarios/Servicios = **botones** pill idénticos a los sub-sub-tabs de Marca.
- Nombre del doctor = breadcrumb de contexto (la pieza dinámica del N3), entre separadores finos verticales.
- Experiencia uniforme árbol→hoja en TODA la app: la hoja no tiene tabs internos; el 3er nivel se navega con la tira N3 (igual que Marca).

Verificado HTTP 200 + avatares 200. Refrescá fuerte **http://127.0.0.1:8888/doctores.html** → **Lisa → Doctores → "›" en un doctor**.

Si ya coincide con el patrón de Marca → me decís "está bien" y cierro `refining → refined` + chain `/architect`, y después actualizo el skill `/po-ux` (gate HARD shell + N3) para que no se repita.

### 2026-05-30 20:35 · 🤖 claude · `/po-ux` · ✓ APLICADO
Verifiqué la estructura REAL de Marca en el código (no pude autenticar la prod con Playwright — el storageState es localhost y la prod es Clerk-gated, pero el SSoT es el código, no el screenshot). La estructura de Marca es:

```
lisa/marca/page.tsx            → redirect() a /identidad (hoja default)
lisa/marca/identidad/page.tsx  ← cada hoja = su propia URL
lisa/marca/voz-y-tono/page.tsx
lisa/marca/presencia/page.tsx
```
`SubSubTabsBar` lee el segmento [3] de la URL → la URL ES el estado (cero state cliente). Eso es justo lo que pediste: **cada hoja su propia URL**.

**Actualicé el mockup para replicarlo (verificado con Playwright real, clickeando, no solo HTTP 200):**
- `…/lisa/doctores` → directorio
- `…/lisa/doctores/{id}/perfil` · `/horarios` · `/servicios` → **cada hoja cambia la barra de direcciones** (hash-routing en el mockup; en prod serán rutas reales `[doctor-id]/perfil/page.tsx`, etc., con `[doctor-id]/page.tsx → redirect a /perfil` igual que `marca/page.tsx`).
- **Deep-link** directo a `…/doctores/luis/horarios` abre esa hoja ✅
- **back/forward** del navegador respeta cada hoja ✅
- La barra N3 usa el estilo visual del `SubSubTabsBar` (pills sutiles, activo `bg-hover`, no verde lleno). La única diferencia con Marca: el nombre del doctor como breadcrumb (la pieza dinámica del N3 que vos propusiste).

Estructura de rutas que irá al `03-arch.md` (espejo de Marca):
```
lisa/doctores/page.tsx                         (directorio)
lisa/doctores/[doctor-id]/page.tsx             → redirect a /perfil
lisa/doctores/[doctor-id]/perfil/page.tsx
lisa/doctores/[doctor-id]/horarios/page.tsx
lisa/doctores/[doctor-id]/servicios/page.tsx
```

Screenshots Playwright en `vitalia/frontend/_shots/mk-{1..5}-*.png`. Refrescá **http://127.0.0.1:8888/doctores.html** → entrá a un doctor y mirá cómo cambia la URL por hoja.

Si ahora SÍ coincide con la experiencia de Marca → "está bien" y cierro `refining → refined` + `/architect` + actualizo el skill `/po-ux`.

### 2026-05-30 21:10 · 🤖 claude · `/po-ux` · ✓ APLICADO
Apliqué tus 5 comentarios al mockup (verificado con Playwright, no solo HTTP 200):

**1. N3 SIEMPRE visible + coherente con Identidad.** La tira de tercer nivel ahora aparece **desde que entro a Doctores**: `[👨‍⚕️ Doctores]` (activo) + "Selecciona un doctor" + `Perfil/Horarios/Servicios` **deshabilitados** (opacidad .45, no clickeables). Al entrar a un doctor, el chip muestra su nombre+avatar y se **habilitan** las 3 hojas. Mismo patrón visual que Marca/Identidad (pills `bg-hover` activo). "Doctores" hace de raíz/volver.

**2. Autosave (sin botón Guardar).** Quité los botones "Guardar perfil" y "Guardar servicios" — violaban la doctrina (`form-runtime-array.md`: botón "Guardar" rompe autosave + ADR-004 §3.5 autosave debounce 600ms). Cada hoja ahora muestra el hint "✓ Los cambios se guardan automáticamente". Todo campo es autoguardable.

**3. Bio para promoción (mi recomendación, simple, sin sobreingeniería).** En Perfil agregué un bloque "Bio para promoción": un textarea **"Datos del doctor (insumo)"** donde el admin pega formación/certificaciones/logros + botón **"✨ Generar bio con Lisa"** → redacta una bio breve **usando solo esos datos (no inventa)** → cae en **"Bio pública (editable)"**. Esa bio la consume el agente de ventas para promocionar al doctor. Patrón = mismo "generar/consolidar" que ya hay en la marca. Nada de scoring ni multi-paso.

**4. Horarios 24h, formato 24h, sin comentarios.** La grilla ahora va en **formato 24h** (`07:00`…`21:00` base) con **check "Mostrar 24 horas"** (00:00–23:00) por si atienden 24h. Saqué los comentarios `<!-- -->`/`//` del mockup (van al spec, no acá).

**5. Servicios = pendiente (depende de otra historia).** La hoja Servicios ahora es un estado **"pendiente"**: explica que elegirá del catálogo de **Mi Clínica → Servicios** (con precio propio opcional) y que depende de esa historia, que se crea **al final de esta**. Badge "⏳ Planned · depende de Servicios".

Screenshots: `vitalia/frontend/_shots/v2-{1..5}-*.png`. Refrescá **http://127.0.0.1:8888/doctores.html**.

**Dudas para vos (⚠️):**
- (3) ¿La bio la genera **Lisa** (estratega de marca) o preferís que sea un botón neutro "Generar bio"? Lo puse con Lisa por coherencia agéntica, decime si cambio el wording.
- (5) Al cerrar esta historia creo la historia **"Mi Clínica · Servicios"** y dejo el link de dependencia. ¿Confirmás ese nombre?

Si todo OK → cierro `refining → refined` + `/architect` + actualizo `/po-ux`.

### 2026-05-30 22:00 · 🤖 claude · `/po-ux` · ✓ APLICADO
Apliqué tus comentarios nuevos (verificado con Playwright real, 1 passed):

1. **Rename Doctores → Staff.** Subtab línea 2 = "👨‍⚕️ Staff", slug de ruta `lisa/staff` (URL: `…/lisa/staff/{id}/{perfil|horarios|servicios}`), raíz del N3 = "Staff", título del directorio = "Staff". (Las personas siguen siendo "doctor" en datos/labels de ítem — el contenedor es Staff.)

2. **Barra N3 pegada arriba (sticky, como Identidad en dev-app) + componente UX reusable.** La tira N3 ahora es `position:sticky; top` pegada al borde superior del contenido, ocupa **todo el ancho** (rompe el padding con margin negativo) y queda fija al hacer scroll. La dejé parametrizada (`pill()` + `root/leaf/nameChip/sep`) para promoverla a **componente UX** (`SubSubTabsBar` dinámico con entidad) y reusarla en toda la app de aquí en adelante. Lo anoto en el spec como candidato a átomo/molécula del design system.

3. **Bio para promoción = "repo de insumos" (tu pedido).** Ahora junta 3 fuentes: **(a)** notas/texto pegado, **(b)** **archivos** (diploma/CV/certificados) con **dropzone**, **(c)** **links** (Doctoralia/LinkedIn/publicaciones). Botón **"✨ Generar bio"** → produce una bio **en secciones claras** (Resumen · Formación y credenciales · Enfoque de atención), cada una **editable** (`contenteditable`). Usa solo el material aportado, no inventa.
   - **Componente shadcn recomendado para adjuntar:** **shadcn Dropzone** (`diragb/shadcn-dropzone`, sobre `react-dropzone`) — es el estándar shadcn para file-upload con drag&drop, lista de archivos con nombre/tamaño/remove y soporte multi-archivo. Alternativa oficial: el bloque "File Upload Dropzone" de shadcn blocks. Lo dejo fijado en el spec como el componente a usar (hay que instalarlo, hoy `components/ui/` no tiene dropzone).

4. **Hojas full-width responsive inteligente.** Quité todos los `max-width:560px`. Los campos del perfil usan `grid auto-fit minmax(220px,1fr)` (se acomodan a 1/2/3 columnas según ancho), el bloque bio y los insumos usan `auto-fit minmax(280px,1fr)`, y Servicios ocupa el ancho completo. Aprovecha todo el espacio a cualquier tamaño del splitter.

Screenshots: `vitalia/frontend/_shots/v3-{1..3}-*.png` (v3-3 = scrolleado, muestra la N3 pegada arriba). Server: **http://127.0.0.1:8888/doctores.html** (entrá a un integrante).

**Fuentes (componente adjuntar):** shadcn-dropzone (github.com/diragb/shadcn-dropzone) · shadcn blocks File Upload Dropzone.

**Sigue pendiente tu respuesta a:** (a) ¿bio la genera "Lisa" o botón neutro "Generar bio"? — lo dejé como **"✨ Generar bio"** neutro en esta iteración; (b) ¿confirmás el nombre de la historia futura "Mi Clínica · Servicios"?

### 2026-05-30 23:50 · 🤖 claude · `/po-ux` · ✓ APLICADO
Apliqué tus 3 puntos nuevos (verificado por grep del mockup + URL real en Playwright):

1. **Rename Doctores → Staff.** Subtab línea 2 = "👨‍⚕️ Staff"; slug de ruta `lisa/staff` (URL Playwright confirmada: `…/lisa/staff/ana/perfil`); raíz del N3 = "Staff"; título directorio = "Staff"; placeholder "Selecciona un integrante". El ítem-persona sigue siendo "doctor" en datos; el contenedor pasa a ser Staff.

2. **Barra N3 pegada arriba (sticky) + componente UX reusable.** Ahora es `position:sticky` al borde superior del contenido, ocupa **todo el ancho** (rompe el padding con margin negativo) y queda fija al scrollear — igual que la barra N3 de Identidad en dev-app. La parametricé (`pill()` + root/leaf/nameChip) para promoverla a **componente UX** (`SubSubTabsBar` con entidad dinámica) y reusarla en toda la app. Anotado en el spec como átomo/molécula del design system.

3. **Bio = "repo de insumos".** Junta 3 fuentes: (a) notas/texto pegado, (b) **archivos** con dropzone (diploma/CV/certificados), (c) **links** (Doctoralia/LinkedIn/publicaciones). Botón **"✨ Generar bio"** → produce bio **en secciones claras editables** (Resumen · Formación y credenciales · Enfoque de atención, cada una `contenteditable`). Usa solo el material aportado, no inventa.
   - **Componente shadcn recomendado (research):** **shadcn Dropzone** (`diragb/shadcn-dropzone`, sobre `react-dropzone`) — estándar shadcn para file-upload drag&drop con lista nombre/tamaño/remove + multi-archivo. Alternativa oficial: bloque "File Upload Dropzone" de shadcn blocks. Hay que instalarlo (hoy `components/ui/` no lo tiene). Fijado en el spec como componente a usar.

**Bonus iteración previa:** hojas **full-width responsive** (`auto-fit minmax`, cero `max-width:560px`), **autosave sin botón Guardar**, **horarios 24h** con check, **Servicios pendiente**.

Server: **http://127.0.0.1:8888/doctores.html** → entrá a un integrante. (Honestidad: el visor de imágenes me falló al renderizar el PNG fullPage de ~6500px este turno; las capturas quedaron en `vitalia/frontend/_shots/`. Estructura confirmada por grep + URL real del Playwright, no por "200".)

Pendiente tu confirmación: (a) "✨ Generar bio" neutro o "Generar bio con Lisa"; (b) nombre historia futura "Mi Clínica · Servicios". Con eso cierro `refining → refined` + `/architect` + actualizo `/po-ux`.

### 2026-05-31 00:05 · 🤖 claude · `/po-ux` · ✓ APLICADO
Screenshots renderizados y revisados (ahora sí pude verlas). Cerré los últimos detalles del rename:
- Título del directorio y CTA estaban en "Doctores"/"Nuevo doctor" → corregidos a **"Staff" / "+ Nuevo integrante" / "Buscar integrante…"**. Cero "Doctores" visible restante (solo un comentario interno).
- Verifiqué los 5 cambios en pantalla: (1) subtab **Staff** + N3 con raíz Staff + "Selecciona un integrante" + leaves deshabilitados en el directorio; (2) N3 **pegada arriba** y full-width al entrar a un integrante; (3) **Bio repo** completo (notas + dropzone "Arrastrá o hacé clic", PDF de ejemplo con tamaño+✕, links con chip, bio generada en 3 secciones editables); (4) **full-width** confirmado también en viewport angosto (1040px, simula splitter de chat ancho) — los campos colapsan a 1 columna con `auto-fit`; (5) autosave hint, sin botón Guardar.

Screenshots: `vitalia/frontend/_shots/final-{1,2,3}.png` + `final-4-narrow-perfil.png` (responsive angosto). Quedan tus 2 confirmaciones (wording "Generar bio" + nombre historia Servicios) para cerrar `refined` + `/architect`.

### 2026-05-31 00:20 · 🤖 claude · `/po-ux` · ✓ APLICADO
**Refinamiento cerrado — Chris dio por refinado.** Sincronicé el `01-spec.md` con todos los acuerdos del mockup antes de cerrar (si no, /architect construiría lo viejo):
- Frontmatter: `state: refined`, `po_ux_version: 2`, `ratified_by_chris: true`, `ratified_visual_by_chris: true`, `architecture_pattern: ADR-vitalia-004`.
- Rename **Doctores → Staff** en todo el spec (rutas `lisa/staff/[doctor-id]/{perfil,horarios,servicios}`, microcopy, componentes `StaffDirectoryView`/`StaffCard`/`NuevoIntegranteModal`/`StaffWorkspaceShell`).
- Cementados en spec: N3-dyn sticky full-width siempre visible (→ componente UX `SubSubTabsBar`), **autosave sin botón Guardar** (regla nueva `autosave-no-save-button`), **Bio = repo de insumos** (texto+dropzone+links → ✨ Generar bio en secciones, reglas `bio-generated-from-inputs-no-invent` + `bio-attachments-via-assets-r2`), **horarios 24h**, **Servicios pendiente**. Componente adjuntos: **shadcn Dropzone** (a instalar).
- Business rules ahora 18 (15 + 3 nuevas). Scenarios 15. Wireframes + microcopy + componentes actualizados.

checkpoint `refining → refined`. Encadeno `/architect vitalia vitalia-fase2-lisa-doctores` para producir el ready package (03-arch + 04-validators + 05-guidelines + 06-tickets + dispatch-plan), con candidato a split en 3 tickets (CRUD+bio / horarios-calendario+scheduling / assets+R2+público) + decisiones ARQ escaladas (SubSubTabsBar genérico, layout angosto como regla UX, provisioning R2).

Pendiente menor (no bloquea /architect, lo confirmás cuando quieras): wording "✨ Generar bio" quedó **neutro**; nombre historia futura quedó **"Mi Clínica · Servicios"**.

### 2026-05-31 06:30 · 🤖 claude · `builder-backend` · ✓ APLICADO
**T-BE-1 — Doctor domain + migration 036 + DoctorRepository + CRUD endpoints + main.py wiring**

Implementado y testeado. Deliverables completados:
- `clinics/domain/{doctor.py, bio.py, availability_block.py, credential_country.py}` — pure Python DDD, zero framework imports
- `clinics/infrastructure/models/doctor_model.py` — SQLA 2.0 Mapped[], BYTEA PII cols, dni_hash unique constraint
- `clinics/infrastructure/repositories/doctor_repository.py` — hereda `CompoundScopeRepositoryBase(scope_field="clinic_id")` (engine base post-lift 2026-05-20), pgcrypto encrypt/decrypt
- `clinics/application/ports/doctor_repo_port.py` — ABC port
- `clinics/application/doctor_service.py` — audit sync pre-response, DniConflictError, telemetry fire-forget
- `clinics/application/credential_validator.py` — PE/AR/MX/CL, Spanish neutro
- `clinics/api/doctors_router.py` — GET list (masked), POST (409/422), GET {id} (cross-tenant audit), PATCH; response_model= mandatory
- `clinics/api/dtos.py` EXTENDED — DoctorListItemDTO (masked PHI), DoctorDetailDTO, PublicDoctorDTO (channel guard 7 fields)
- `alembic/versions/036_f2_s8_vitalia_lisa_staff.py` — 3 tables idempotent (IF NOT EXISTS); down_revision=035
- `main.py` — `include_router(doctors_router, prefix=/api/v1/vitalia/clinics/doctors)`
- Tests: test_credential_validator.py (17), test_doctor_domain.py (14), test_doctor_repository.py (5), test_doctor_cross_tenant.py (2), test_doctor_dni_race.py (1), test_doctors_api.py (6)
- `tests/architecture/test_public_doctors_allowlist.py` — 4 channel guard gates (3 pass, 1 skip T-BE-5 scope)
- Growth studio events registered: lisa_staff_doctor_created/updated/deactivated/viewed

**Gates GREEN:** 78 tests passed (1 skipped T-BE-5 scope) · 0 ruff lint errors · ruff format OK · 319 arch tests pass (pre-existing treatment_plans.notes failure excluded — NOT introduced by this ticket) · `test_compound_scope_repository_used` PASS (uses engine CompoundScopeRepositoryBase, not brand-local)

**HIPAA-lite compliance:** dual filter (tenant_id+clinic_id) via CompoundScopeRepositoryBase · pgcrypto BYTEA for dni/email/phone/credential · HMAC-SHA256 dni_hash unique constraint · audit sync writes (doctor.created/updated/deactivated/cross_tenant_attempt) · PHI masking in list responses · PublicDoctorDTO channel guard (7 allow-listed fields, no PHI) · Spanish neutro error messages

### 2026-05-31 — 🤖 claude · `builder-backend` · ✓ APLICADO
**T-BE-2 — AvailabilityBlock models + AvailabilityProjectionService (dateutil.rrule) + AvailabilityBlockRepository**

Implementado TDD (RED→GREEN). Deliverables:
- `clinics/infrastructure/models/{availability_block_model.py, availability_slot_model.py}` — SQLA 2.0, mapean a tablas de migration 036 (sin migración nueva)
- `clinics/infrastructure/repositories/availability_block_repository.py` — hereda `CompoundScopeRepositoryBase(scope_field="clinic_id")`, soft deletes, SC-1d/SC-3b preserva citas confirmadas en delete
- `clinics/application/ports/availability_repo_port.py` — ABC con 6 métodos abstractos
- `clinics/application/availability_projection_service.py` — `dateutil.rrule` (v2.9.0): weekly interval=1, biweekly interval=2, end_date→until, occurrences→count, open_ended→90d horizon; `classify_future_slots_for_deletion` separa free vs confirmed
- `test_availability_projection.py` (12 tests) + `test_availability_block_mutable.py` (17 tests) — TDD RED primero

Gates: 96/96 tests pass (clinics suite) · 319 arch tests pass · ruff 0 errors · format OK
Commit: 2f88b316 · Branch: wip/vitalia
Pre-existing (no scope T-BE-2): `treatment_plans.notes` TEXT vs BYTEA (desde T-BE-1).

### 2026-05-31 — 🤖 claude · `builder-backend` · ✓ APLICADO
**T-BE-3 — Availability blocks endpoints (GET/POST/PATCH/DELETE) + slot materialization + audit**

Implementado TDD (RED→GREEN). Deliverables:
- `clinics/api/dtos.py` EXTENDED — `RecurrentBlockCreateRequest`, `OneOffBlockCreateRequest` (discriminated by kind), `AvailabilityBlockDTO`, `AvailabilityBlocksResponse`, `DeleteBlockResponse`
- `clinics/application/availability_block_service.py` — NEW; orchestrates `AvailabilityProjectionService` (dateutil.rrule) + `AvailabilityBlockRepository` + audit SYNC writes; `delete_block` returns `(True, preserved_count)` (CRITICAL invariant: confirmed slots NEVER deleted)
- `clinics/api/doctors_router.py` EXTENDED — 4 availability-blocks sub-routes: GET list, POST create (materialization→slots→audit), PATCH edit (reproject-future-only), DELETE retire (preserves confirmed, returns `{deleted, preserved_appointments}`)
- `tests/modules/vitalia/clinics/test_availability_blocks_api.py` — 30 tests (TDD RED first): response_model= gates, DTO existence, RBAC dependencies, service unit tests (list/create/update/delete/preserve), biweekly occurrences, one-off materialization, delete-preserves-confirmed (CRITICAL SC-3b)

Gates GREEN: 126/126 clinics tests pass · 333/333 arch tests pass (excluding pre-existing CRM debt `treatment_plans.notes TEXT vs BYTEA` — NOT introduced by this ticket) · 0 ruff lint errors · ruff format OK

HIPAA-lite: dual filter (tenant_id+clinic_id) on all routes · RBAC `admin_clinic` on all mutations (POST/PATCH/DELETE) · audit sync write pre-response (`doctor.availability_block_created`, `doctor.availability_block_deleted`) · `response_model=` mandatory on all 4 routes

Forbidden-touch respected: `core/luana-core-*/src/**` and `scheduling/**` NOT touched. Slots materialize to brand-local `vitalia_availability_slots` table — scheduling reads without modification.

### 2026-05-31 — 🤖 claude · `builder-backend` · ✓ APLICADO
**T-BE-4 — BioGenerationService (extractive, NOT agentic) + generate-bio endpoint**

Implementado TDD (RED→GREEN). Deliverables:
- `clinics/application/bio_generation_service.py` — NEW; deterministic single-shot extractive service (D-4: NOT agentic, R23 N/A, Sonnet-eligible); `BioGenerationService.generate()` + `generate_with_error()`; `BIO_GENERATION_FALLBACK_MESSAGE` (Spanish neutro, no voseo); `LLMServiceProtocol` (Protocol-based DI for testability); anti-invent guardrail in system_prompt ("Usa únicamente la información del material provisto"); graceful fallback on any LLM exception → `(BioPublic(), BIO_GENERATION_FALLBACK_MESSAGE)` never raises; consumes `luana_core_llm.factory.LLMFactory` (shared engine, NOT edited)
- `clinics/api/dtos.py` EXTENDED — `GenerateBioRequest` + `GenerateBioResponse{bio: BioPublicDTO, error_message: str | None}`
- `clinics/api/doctors_router.py` EXTENDED — `POST /{doctor_id}/generate-bio` with `response_model=GenerateBioResponse`; RBAC admin_clinic; returns HTTP 200 on success AND on LLM failure (error_message non-None on failure)
- `tests/modules/vitalia/clinics/test_bio_generation_service.py` — 12 tests TDD RED-first; covers V-FN-9: no-invent guardrail, fallback on LLM fail, Spanish neutro, malformed JSON, partial sections, endpoint route registration, endpoint 200 success + 200 fallback

Gates GREEN: 138 clinics tests pass · 0 ruff errors · ruff format OK · arch fitness (pre-existing treatment_plans.notes debt excluded per ticket instructions)
V-FN-9 (validator): 12/12 PASS

### 2026-05-31 05:18 · 🤖 claude · `/pm-vitalia` · ✓ APLICADO
**Arranco el tren autónomo `/architect → /dev-team → /auditor → merge` hasta `done`** (pedido explícito de Chris).
- Step 0 GREEN: worktree CANÓNICO vitalia · sin stories en developing/developed/reviewing (closure gate limpio) · hard deps `vitalia-fase1-empty-states` + `vitalia-fase1-routing-shell` ambas en archive (done) · WIP caps libres (0 ready/developing).
- Story `state: refined`, ratificada visual + funcional por Chris, prior-art scan hecho. Transición `refined → ready` vía `/architect` válida.
- Encadeno `Skill(architect)` inline con `vitalia vitalia-fase2-lisa-doctores`. Le pido **declarar `autonomous_mode: true`** en el dispatch-plan para que el pipeline corra solo hasta el merge (Chris ratificó el modo autónomo en este turno).

### 2026-05-31 — 🤖 claude · `builder-backend` · ✓ APLICADO
**T-BE-5 — Public doctors endpoint (allow-list channel guard) + masking + new arch test**

Implementado TDD (RED→GREEN). Deliverables completados:

- `clinics/application/public_doctor_serializer.py` — NEW; `to_public_dto(doctor, *, credential_label=None) -> PublicDoctorDTO`; explicit allow-list of 7 fields: `display_name, specialty, avatar_key, years_experience, languages, bio_public, credential_label`; NEVER accesses `doctor.dni/.email/.phone/.credential`; allow-list is the security boundary (adding PHI to Doctor model does NOT leak it)
- `clinics/api/public_doctors_router.py` — NEW; `GET /{tenant_slug}/doctors`; no auth (intentionally public); `response_model=PublicDoctorsResponse`; resolves clinic by slug via `ClinicRepository.get_by_slug_public()` (no tenant_id required for public lookup); fetches visible+active doctors via `DoctorRepository.list_public()`; channel guard via `to_public_dto()`
- `clinics/infrastructure/repositories/clinic_repository.py` EXTENDED — added `get_by_slug_public(slug)` method (active+non-deleted lookup without tenant_id, for public endpoint only)
- `main.py` — `include_router(public_doctors_router, prefix=/api/public/clinic, tags=["public"])`; route: `GET /api/public/clinic/{tenant_slug}/doctors`
- `tests/architecture/test_public_doctors_allowlist.py` — SKIP resolved; was `pytest.skip("T-BE-5 scope")`, now PASSES: `test_public_doctor_serializer_exists` GREEN (was previously skipped)
- `tests/modules/vitalia/clinics/test_public_doctors_endpoint.py` — NEW 29 tests TDD RED-first; covers V-FN-11 + V-ARCH-7: serializer import/return type/7-exact-fields/all-7-allowed-fields/no-PHI-leak (dni/email/phone/credential), router contract (GET route/response_model/PublicDoctorsResponse/no-auth), filtering (visible+active not in DTO/tenant_id not leaked/clinic_id not leaked), main.py registration

Gates GREEN:
- `vitalia/backend/tests/modules/vitalia/clinics/` — 172 passed · 0 failed · 1 warning (pre-existing core config deprecation)
- `vitalia/backend/tests/architecture/test_public_doctors_allowlist.py` — 5 passed (was 4+1 skip; skip resolved)
- ruff check: 0 errors
- ruff format: 0 reformats needed

HIPAA-lite compliance: channel guard via explicit allow-list (not deny-list) · `visible_en_landing AND active` double filter at SQL level · PHI fields (dni/email/phone/credential) never serialized · no X-Tenant-ID required (public endpoint) · `response_model=` mandatory (arch test V-ARCH-7)

Pre-existing excluded: `treatment_plans.notes TEXT vs BYTEA` (from migration 021, NOT introduced by this ticket — per task spec "ignore pre-existing treatment_plans.notes CRM debt")

V-FN-11: PASS · V-ARCH-7: PASS (arch test skip resolved, now 5/5)

### 2026-05-31 — 🤖 claude · `builder-backend` · ✓ APLICADO
**T-BE-6 — Assets proxy upload router (consume luana-core-assets, copy nicolify wiring)**

Implementado TDD (RED→GREEN). Deliverables:
- `clinics/api/assets_proxy_router.py` — NEW; `POST /upload` multipart; consumes `AssetsService.upload_asset` (proxy — D-3: presign NOT implemented in engine); RBAC `admin_clinic`; `response_model=AssetUploadResponse`; engine imports deferred to handler body (PLC0415 pattern per doctors_router); kind ∈ {avatar, credential_doc} validated; content-type allow-list: image/* for avatar; PDF/JPG/PNG/DOCX for credential_doc; 10MB max enforced brand-side before forwarding; returns `{key, url}`
- `clinics/api/dtos.py` EXTENDED — `AssetUploadResponse {key: str, url: str}`
- `main.py` — `include_router(assets_proxy_router, prefix=/api/v1/vitalia/assets, tags=["assets"])`
- `tests/modules/vitalia/clinics/test_assets_upload.py` — NEW 10 tests TDD RED-first: structural (importable/POST-registered/response_model/DTO fields) + functional (valid avatar/10MB-enforce/avatar-wrong-type/credential-pdf-valid/credential-text-rejected/invalid-kind); mocking via `monkeypatch` minimal env vars + `patch(AssetsService)` + `patch(SessionLocal)` — NO live R2 needed (T-BE-7 Chris manual)

Gates GREEN:
- 10/10 test_assets_upload.py PASS
- 177/177 clinics full suite PASS
- 334 arch fitness tests PASS (1 deselected = pre-existing `treatment_plans.notes TEXT vs BYTEA` — NOT introduced by this ticket)
- ruff check: 0 errors
- ruff format: 0 reformats needed

V-FN-10: PASS

---

## T-FE-2 · builder-frontend · 2026-05-31 · TESTS PASSING

**Commit:** 25cb9563 (wip/vitalia)
**Files:** 23 files changed, 2857 insertions

**Deliverables shipped:**
- `EntitySubNavBar.tsx` — N3-dynamic WAI-ARIA tablist (NEW sibling of SubSubTabsBar per D-1)
- `dropzone.tsx` — Shadcn-style native dropzone (no react-dropzone dep)
- `[doctor-id]/` routes — layout + page (redirect→perfil) + perfil + horarios + servicios
- `StaffWorkspaceShell.tsx` — layout wrapper with RQ doctor query
- `DoctorPerfilView.tsx` — autosave form (RHF+Zod, 600ms debounce, no Guardar button)
- `BioRepoInputs.tsx` — notes + dropzone + link chips (autosaved)
- `GeneratedBioSections.tsx` — "✨ Generar bio" → 3 contenteditable sections (autosaved)
- `DoctorServiciosView.tsx` — placeholder ("Servicios — pendiente")
- `AvatarUploader.tsx` — proxy upload (D-3)
- `use-autosave.ts` + tests — debounce 600ms hook
- API hooks: useDoctor, usePatchDoctor, useGenerateBio, useAvatarUpload
- `DoctorWorkspacePage.ts` — Playwright POM

**Gates:**
- tsc: 0 errors · eslint: 0 errors · vitest 817/817 PASS · arch 162/162 PASS

**Advisory:** bidirectional validator HARD_FAIL drift=3 (new cap: headers need cap YAML update at merge F.3 — normal, not a blocker for wip/*)

**Live verification:** Dev stack not running. Manual steps in T-FE-2-impl-log.md. Escalate to Chris staging gate before auditor.

**Next:** T-FE-3 (horarios calendar) → T-E2E → auditor-frontend

---

### Turn T-E2E · builder-frontend · 2026-05-31

**⚠️ DUDA — T-E2E: spec suite completa escrita, live run PENDIENTE por stack DOWN**

**Deliverable:** Suite E2E completa para SC-1..SC-11 (41 tests descubiertos por playwright --list).

**Files escritos:**
- `e2e/fixtures/vitalia-fase2-lisa-doctores.fixture.ts` — Clerk auth + mocks (Tenant A/B seeds, 503, empty, large dataset)
- `e2e/pages/StaffDirectoryPage.ts` — POM nuevo (directorio + modal + states)
- 5 specs en `e2e/regression/vitalia-fase2-lisa-doctores/`: crear-happy, week-nav-oneoff, credencial-invalida, network-failure, i18n-credencial
- 5 specs en `e2e/shell-organism/`: cross-tenant-adversarial, deactivate, delete-block-preserve, empty (+ axe), large-dataset (+ visual goldens)
- `playwright.config.ts` — testMatch extended con `shell-organism/staff-.*`
- `06-tickets.yaml` T-E2E state: `specs-written`

**Gates estáticos PASS:**
- `tsc --noEmit`: 0 errors
- `eslint e2e/...`: 0 errors
- `playwright --list`: 41 tests descubiertos y parseados sin errores

**Duda central:** Stack vitalia DOWN (BE:8002 + FE:3002 retorna 500 por bug pre-existente zustand/workspace). NO se puede correr live. NO se generaron baselines de visual goldens. Verificación real (writes + state_check DB) pendiente.

**Doctrina respetada (test-design-doctrine.md § verificación REAL):**
- Happy-path writes (SC-1, SC-1b, SC-1c, SC-1d) son NOT mocked para el backend → van a hit BE:8002 cuando el stack sube.
- state_check DB queries documentadas en cada spec grader comment.
- SC-7 (503) usa page.route legítimamente (test del comportamiento de la UI ante error, no happy-path falso).
- NO se generó ningún green falso.

**Comando para correr cuando stack suba:**
```bash
cd vitalia/frontend
E2E_BASE_URL=http://localhost:3002 npx playwright test regression/vitalia-fase2-lisa-doctores/ shell-organism/staff-*.spec.ts --project=smoke
```

**Próximo:** auditor-frontend (independiente) verifica spec coverage + real-verification design + visual goldens plan.

### 2026-05-31 14:30 · 🤖 claude · `/dev-team` · ⚠️ DUDA
**Build de los 11 tickets COMPLETO + verificación REAL contra el stack vivo encontró y arregló 2 bugs P0** que los 2400+ tests unitarios NO detectaron (ADR-vitalia-008 / verificación-real probando su valor):

1. **Migración 036 crash de boot** (commit b6aa8c35): `down_revision="035"` pero el id real es `"035_vitalia"` → `KeyError: '035'` → alembic upgrade head fallaba → backend en crash-loop. Corregido a `036_vitalia`/`035_vitalia`.
2. **DB session dependency rota** (commit e3db65a4): los 3 routers de clinics hacían `async for session in get_db()` sobre el `get_db` SÍNCRONO del engine → `TypeError: async for requires __aiter__, got generator` → todo endpoint `/clinics/doctors` daba 500. Corregido a `src.db.get_async_session` (patrón que usan scheduling/marketing/payments). `router.py` del módulo clinics tenía el MISMO bug pre-existente (clinics CRUD nunca funcionó live) — arreglado acá porque la feature doctores vive dentro.

Tras los fixes: backend bootea + endpoints responden limpio (422/404 validación, ya NO 500). 105 tests clinics verdes.

**Bloqueadores que NO puedo cruzar autónomo (necesito vos):**
- **FE env break (pre-existente, no es código nuestro):** FE :3002 da 500 — `zustand` no resuelve desde `core/@luana/hooks` (hoisting pnpm roto por la promotion cf19d1f5). Bloquea render FE + E2E live. Fix: `pnpm install` en root + restart FE. Documentado en `vitalia/docs/observed-bugs/`.
- **ADR-vitalia-008 `dev_app_verified`:** el gate `reviewing→done` exige ejercer la acción contra dev-app desplegado (deploy a staging MANUAL). No lo puedo hacer autónomo.
- **R2 (T-BE-7):** credenciales S3 de Cloudflare = acción manual tuya (avatar live).

**Decisión que necesito:** ¿(a) arreglo el FE env (`pnpm install`) + corro E2E live + auditor ahora, o (b) lo dejás para vos y yo cierro el reporte acá? El build está completo y el backend verificado-real; falta FE-render + audit formal + tu deploy a dev-app.

### 2026-05-31 15:05 · 🤖 claude · `/dev-team` · ✓ APLICADO
**FE env arreglado (docker) + verificación REAL del write path completa.** Seguí tu indicación: app en docker compose, Playwright nativo.
- **FE env fix:** `zustand` no resolvía desde `@luana/hooks` → `pnpm install --filter @luana/hooks` DENTRO del contenedor FE (volumen) + restart. FE :3002 ahora renderiza (/sign-in → 200, sin error de módulo).
- **Total: 5 clases de bug REALES encontradas y arregladas por verificación live** (todas invisibles a los 2400+ tests unitarios que mockean DB/DI):
  1. Migración 036 `down_revision` mal (`035` vs `035_vitalia`) → crash de boot (b6aa8c35)
  2. DB session dep: 3 routers usaban `get_db` síncrono con `async for` → 500 (e3db65a4)
  3. Routing sin trailing-slash (`/clinics/doctors` daba 422) (4cffaa1e)
  4. Falta `NuqsAdapter` → staff page crasheaba client-side (4cffaa1e)
  5. pgcrypto `:phone` ambiguo en CASE → create-doctor 500 (0d56d831)
- **Create-doctor verificado REAL:** POST→**201** · fila en `vitalia_doctors` · `dni_encrypted`=**bytea (cifrado at-rest)** · `dni_hash` SHA-256 · **audit log `doctor.created`**. (Test data limpiada.)

Esto es exactamente lo que ADR-008/Rule#37/verificación-real existe para atrapar: sin esto, la feature shippeaba "LIVE" y 500'eaba en cada alta de doctor (caso lisa-marca). Ahora lanzo el auditor formal (BE+FE) en paralelo.

### 2026-05-31 · 🤖 claude · `builder-backend` (AUDITOR_AUTO_FIX_LOOP) · ✓ APLICADO

**BE audit iteration 2 — todos los BLOCKINGs resueltos + bundled fixes.**

Se corrigieron en orden estricto TDD (RED tests → GREEN implementation → LIVE verify):

**Fix 1 — [BLOCKING] RBAC bypass en assets upload:**
- Escribí 4 tests RED primero (marketing→403, sales→403, empty→403, admin_clinic→200).
- Removí `require_brand_owner_access(user_role)` imperativo del body (no-op).
- Agregué `dependencies=[Depends(require_brand_owner_access(roles=_ADMIN_CLINIC_ROLES))]` al decorator `@router.post("/upload", ...)` (mismo patrón que `doctors_router`).
- **LIVE:** `X-User-Role: marketing` → HTTP 403 ✓, `admin_clinic` → HTTP 200 ✓.

**Fix 2 — [BLOCKING] camelCase wire contract + phone PATCH + list fields:**
- Agregué `alias_generator=to_camel, populate_by_name=True` a todos los response DTOs (DoctorDetailDTO, DoctorListItemDTO, DoctorListResponse, AvailabilityBlockDTO).
- Agregué `response_model_by_alias=True` a los 9 route decorators en doctors_router.
- Request DTOs (Create/Patch/Block) aceptan ahora camelCase del FE + snake_case de tests (vía `populate_by_name=True`).
- `DoctorPatchRequest`: agregué `phone: str | None = None` (faltaba → drops silenciosos) + `extra="forbid"` (unknown keys → 422 explícito).
- `DoctorListItemDTO`: agregué `first_name`, `last_name` (FE StaffCard los necesita) + `patients_count: int | None = None`, `nps_score: float | None = None` (nullable hasta que appointments/analytics se cableen).
- `doctor_service.update_doctor()` + `doctor_repository.update()`: phone se propaga + se re-encripta vía pgcrypto en UPDATE.
- **LIVE:** POST con camelCase → response camelCase ✓. PATCH `{"phone":"+51987654321","yearsExperience":7}` → `phone_encrypted IS NOT NULL` en DB ✓. PATCH con `{"unknownField":"x"}` → 422 ✓.

**Fix 3 — [WARN] Slot mutations omiten clinic_id:**
- Agregué `VitaliaAvailabilitySlotModel.clinic_id == clinic_id` al WHERE de los dos UPDATE de slots (en `update_block` y `delete_block`).
- Defense-in-depth HIPAA dual-filter ahora consistente a nivel slot.

**Fix 4 — [Carril A] Dead code eliminado:**
- Eliminé `_slot_model_from_dict()` (zero call sites) + import `Any` sin uso.

**DEFERRED:** DDD `_kek` coupling (WARN Carril B) — refactor de puerto sin cobertura de test. Behaviour-neutral. Documentado en review para próxima story.

**Gate final: 181/181 tests, ruff 0 errors, arch 320/320, LIVE verified.**
