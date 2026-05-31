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

### 2026-05-31 05:18 · 🤖 claude · `/pm-vitalia` · ✓ APLICADO
**Arranco el tren autónomo `/architect → /dev-team → /auditor → merge` hasta `done`** (pedido explícito de Chris).
- Step 0 GREEN: worktree CANÓNICO vitalia · sin stories en developing/developed/reviewing (closure gate limpio) · hard deps `vitalia-fase1-empty-states` + `vitalia-fase1-routing-shell` ambas en archive (done) · WIP caps libres (0 ready/developing).
- Story `state: refined`, ratificada visual + funcional por Chris, prior-art scan hecho. Transición `refined → ready` vía `/architect` válida.
- Encadeno `Skill(architect)` inline con `vitalia vitalia-fase2-lisa-doctores`. Le pido **declarar `autonomous_mode: true`** en el dispatch-plan para que el pipeline corra solo hasta el merge (Chris ratificó el modo autónomo en este turno).
