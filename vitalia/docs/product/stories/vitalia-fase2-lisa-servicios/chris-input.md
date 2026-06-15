---
story_id: vitalia-fase2-lisa-servicios
created_at: 2026-05-27T18:25:23-05:00
last_modified: 2026-05-27T18:25:23-05:00
notes_count: 0
refs_count: 0
conversation_count: 1
---

# chris-input.md · vitalia-fase2-lisa-servicios

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
Story migrada al schema v2: `release=F2`, `cap_target=lisa.servicios`, `cap_change_type=new`. Legacy `outcome` + `phase` preservados durante deprecation gradual.

Cuando estés listo para refinar, llena 💭 Notas + 📎 Referencias arriba e invoca `/po-ux vitalia vitalia-fase2-lisa-servicios` (o `/po` si es service story, o `/ux-agentico` si es agentic).

### 2026-06-06 22:10 · 🤖 claude · `/pm-vitalia` · 💡 PROPONE
Re-refiné la story bajo la visión agéntica actual (pedido tuyo). Investigué LISA + ADRIÁN + sitemap + objetivo Vitalia + público (dental/estética alta-consideración) + 5 competidores (cero.ai · botclinico.cl · rendu.app · Dentalink AI · doctocliq). Recomendación completa en **`00-research.md`**. Tres hallazgos que cambian la story:

1. **La premisa actual es falsa.** El `reuse_map` dice "reuse treatments shipped" pero NO existe catálogo de servicios — el `treatments/` shipped es el *followup* de Camila (PHI). El catálogo vendible = **Offer Studio offers** (SYSTEM-MAP: `Offer` owner=lisa), que Vitalia consume CERO hoy. El `LadderSlot` que la story inventa no existe ni hace falta (el engine ya tiene `value_level`).
2. **La visión agéntica invierte el propósito del catálogo:** su consumidor #1 no es el dueño mirando una grilla linda, es **Adrián** (canal-inbound, ya `refined`, **bloqueado en esta story**: RN-16 mapea necesidad→servicio, RN-17 servicio→especialista). Es exactamente el hueco del mercado: nadie hace que el catálogo sea el cerebro que un equipo de agentes vende. La plomería del agente (`TenantKnowledgeBuilder`) **ya existe** — solo falta publicar servicios como Offers.
3. **El spec original sobre-ingeniería** un canvas drag-drop de escalera + ladder-slot workspaces + analítica por peldaño — UX que la propia story marca "Alta probabilidad confuso" y que no sirve a Camila (50-60% de tenants, quiere "setup 1 día").

**Recomiendo:** MVP lean agente-first (catálogo simple = Offers EP-2 + value_level como SELECT + link servicio↔doctor + seña/financiamiento + seed presets por vertical + escalera read-only); diferir el drag-drop authoring + analítica de conversión. Corregir `module: treatments → offer` + el reuse_map falso. Dos forks te paso aparte (alcance MVP + dónde vive el cableado agéntico). No encadené a `/po-ux` todavía — espero tu ratificación de dirección.

### 2026-06-06 22:25 · 🤖 claude · `/pm-vitalia` · ✓ APLICADO
Ratificaste: (1) **alcance = canvas completo** (drag-drop escalera + ladder-slot workspaces + analítica + Reseñas/Stats), no la versión lean; (2) **cableado = data en lisa-servicios + tool `match_service_and_specialist` en canal-inbound**. Aplicado:
- `00-research.md § 0` — banner de ratificación que OVERRIDE §5.2/§5.3 (canvas completo in-scope; solo A/B-pricing + imports-bulk + AI-pricing quedan fuera).
- `checkpoint.md` — frontmatter corregido (`module: treatments → offer`, `reuse_map` falso → Offer Studio EP-2, `next_action` → /po-ux reframe) + banner reframe + **prior-art scan** (mandatorio) + decisión Chris registrada.
- Correcciones estructurales que mantengo (no eran parte del fork): servicios = **Offer Studio offers** (no `LadderSlot`/`Treatment` engine nuevo) · el peldaño = `OfferValueLevel` del engine · CERO edit engine · descripciones en voz de marca · seña/financiamiento.

Encadeno a **`/po-ux`** para reescribir `01-spec.md` bajo este reframe (mapa funcional + Gherkin + mockups per-component con fidelidad de shell, ADR-003+004). Quedan dos detalles finos para `/architect` (no bloquean el spec): mapeo exacto columnas-canvas ↔ `OfferValueLevel`, y dónde persiste el link servicio↔doctor brand-level.

### 2026-06-06 22:45 · 🤖 claude · `/po-ux` · ⚠️ DUDA
Escribí `01-spec.md` RONDA 1 (intención) + corrí el interrogatorio gate (3 batches, 10 preguntas). **Todas las recomendaciones quedaron elegidas** → modelo del servicio cerrado:
- Servicio = **Offer Studio Offer** (consume engine EP-2, cero modelo nuevo). Catálogo **por-tenant**, scope clínica opcional. Precio **fijo o rango** ("desde $X"). **Paquetes/multi-sesión** en MVP.
- Escalera = 5 peldaños del enum engine con **labels médicos** (Gancho gratuito · Primera visita · Tratamiento principal · Premium · Plan/convenio). **Recurrente** = atributo del servicio (no peldaño). **Seña + financiamiento por servicio** en Lisa (el diferenciador que el research marcó vacío).
- Link servicio↔doctor **opcional pero recomendado** (sin doctores → agente degrada). RBAC: **admin+owner editan**, resto read-only. **Dos toggles** independientes: "Activo (agente)" + "Mostrar en landing".

Spec actualizado: § Modelo del servicio (14 campos) + § Mapa funcional resuelto (happy + árbol bifurcaciones + RN-1..14 + AC-1..8) + § Decisiones RONDA 1 + § Pendientes /architect. **KEYSTONE AC-6:** un servicio activo aparece en el conocimiento de Adrián (verificable live).

**Necesito tu ✍ FIRMA 1 (intención)** sobre el § Mapa funcional + § Modelo de `01-spec.md`. Con tu OK construyo los mockups per-component (catálogo card · escalera canvas · workspace servicio · drawer peldaño) con fidelidad de shell → ✍ FIRMA 2 → RONDA 2 (Gherkin + matriz) → refined. State sigue `refining` esperando tu firma.

### 2026-06-06 23:05 · 🤖 claude · `/po-ux` · ✓ APLICADO
**FIRMA 1 recibida** ("Ok") → `input_spec_signed: true` en checkpoint + spec. Construí el set de mockups borrador en `mockups/` (tokens espejo de `globals.css`, datos LatAm reales, Spanish neutro):
- `catalogo.html` — grid de tarjetas con todo el modelo (peldaño badge · precio fijo/rango · paquete · doctores/aviso-sin-doctores · seña/cuotas · recurrente · 2 switches Activo/Landing) + empty-state con seed presets dental/estética.
- `escalera.html` — 5 peldaños con labels médicos + drag-drop + "sin peldaño" + drawer (override + cta + conversión).
- `servicio-workspace.html` — tabs Detalle/Doctores/Plan-pago/Reseñas/Stats + badge KEYSTONE (activo → Adrián lo conoce).

Spec actualizado con § Wireframes + § Componentes (reuse Shadcn + @dnd-kit; NEW feature-local justificados). Servir: `cd mockups && python3 -m http.server 8888`.

**Necesito tu ✍ FIRMA 2** (ratificación visual de los 3 mockups). Con tu OK → RONDA 2: escribo Gherkin (4 base + sub-categorías) + matriz de cobertura → transition `refining→refined` → handoff `/architect`. State sigue `refining`.

### 2026-06-06 23:40 · 🤖 claude · `/po-ux` · ✓ APLICADO
Apliqué tus 4 comentarios y reconstruí los mockups **dentro del shell-organism**:
1. **Shell completo** — porté verbatim el wrapper de lisa-marca v2.1 (TopBar + Ribbon Lisa activo + SubTabsBar Servicios + ValeriaSidebar 50/50 + splitter 3 estados + dark). El `_shared.css` ahora es el chrome canónico + clases servicios. Ya NO es panel suelto.
2. **Sin tabs en el body** — el workspace del servicio usa **`EntitySubNavBar`** (el componente shipped que usa staff: `‹ Servicios | ✨ Diseño de sonrisa | Detalle·Doctores·Plan-pago·Reseñas·Stats`). Catálogo|Escalera pasaron a **SubSubTabsBar** (N3), no toggle.
3. **Peldaños FIJOS + autoexplicativo** — saqué el drawer de "editar peldaño" (override/cta por slot) + la ruta `ladder/[slot-id]`. La escalera son 5 columnas fijas; cada una explica qué va ahí; el **peldaño vacío muestra ejemplos por vertical + "crear aquí"** (ej. Premium vacío → "carillas, ortodoncia invisible, rehabilitación oral"). El peldaño de un servicio = su `value_level` (un solo dato); mover = cambiar de columna.
4. **Crear servicio** — nuevo `nuevo-servicio.html` (Sheet) con todos los campos + **selector de peldaño autoexplicativo** (cada opción dice qué va ahí + ejemplos, JS interactivo) + Lisa escribe la descripción en tu voz.

Spec actualizado (§ Modelo sin slot-override · § Mapa funcional escalera reframe · AC-3/4/9 · § Wireframes v2 · § Componentes con EntitySubNavBar + SubSubTabsBar reuse). 4 archivos sirven HTTP 200 en `:8899`.

**Necesito tu ✍ FIRMA 2** sobre los 4 mockups. OK → RONDA 2 (Gherkin + matriz) → `refined` → `/architect`. Cambios → los aplico. State sigue `refining`.

### 2026-06-07 00:30 · 🤖 claude · `/po-ux` · ✓ APLICADO
Apliqué tus 3 comentarios (investigué online para el #1):
1. **Detalle completo por pestaña (agente-first).** Investigué procesos reales de treatment-coordinators dentales/estéticos + manejo de objeciones + FAQ high-ticket + KBs de agentes IA. Hallazgo clave: faltaba el activo de venta → **agregué la pestaña ⭐ "Para Adrián" (argumentario)**. El workspace ahora tiene **6 pestañas** navegables (EntitySubNavBar): Detalle · **Para Adrián** · Doctores · Plan de pago · Prueba social · Stats. Definí TODOS los campos por pestaña en el spec (§ Workspace del servicio, ~55 campos agrupados + MVP de 24 must-have). "Para Adrián" = candidatura + contraindicaciones + condiciones de escalada (seguridad HIPAA-lite) + beneficios/dolor-de-no-tratarse/diferenciadores + FAQ (pares) + objeciones→respuestas (las 5) + palabras clave/sinónimos (para el match RN-16). El mockup `servicio-workspace.html` muestra las 6 pestañas con contenido real (cliqueables).
2. **Sin landing.** Eliminé el toggle "Mostrar en landing" de tarjetas, workspace y crear-servicio → **toggle único "Activo"**. Spec actualizado (RN-10, modelo, mapa funcional, AC). La landing queda para su propia historia.
3. **Buscador.** El catálogo ahora tiene **buscador + filtros** (especialidad · peldaño · estado), patrón `StaffDirectoryHeader` shipped.

Spec: nueva § Workspace del servicio (contenido por pestaña) + § Componentes (ParaAdrianView, FaqPairList, buscador) + AC-4/4.bis/9/10. 4 mockups HTTP 200 en `:8899`.

**Necesito tu ✍ FIRMA 2.** OK → RONDA 2 (Gherkin + matriz) → `refined` → `/architect`. Cambios → los aplico. State sigue `refining`.

### 2026-06-07 00:45 · 🤖 claude · `/po-ux` · ⚠️ DUDA
Chris cierra la sesión por contexto (51%) y tiene **más comentarios** para arrancar en sesión nueva. Escribí `HANDOFF-next-session.md` con todo el estado (decisiones cementadas + 4 mockups + abierto-para-architect + dependencias + git). State sigue `refining`, bloqueado en FIRMA 2. Reanudar con el prompt de arranque que dejé en la sesión.

### 2026-06-07 00:28 · 🤖 claude · `/po-ux` · ✓ APLICADO
Apliqué tus comentarios #1-#8 (mockups + spec). 4 mockups siguen HTTP 200 en `:8899`.
1. **Drifts corregidos** (todos): catálogo "2 switches Activo/Landing" → switch único Activo · "dos toggles" → toggle único · ruta `ladder/[slot-id]` (ya muerta) tachada · net-new con `pricing_override`/`cta_copy` (ya muertos) → 3 cobros · HANDOFF "6 pestañas" → 5 · landing en value-chain aclarada como otra historia.
2. **"seña 30%" en el catálogo** = era el % de financiamiento, mal puesto en la tarjeta (confundía, como dijiste). Lo **saqué de las tarjetas** (solo queda chip de capacidad "💳 cuotas"). La seña ahora **se crea y se explica en la ficha → Plan de pago** (ver #3).
3. **Anticipos:** Plan de pago ahora modela **3 cobros distintos** (era el hueco): **Reserva/seña** (apartar la cita, se descuenta del total) · **Anticipo para iniciar** (% o monto del total para empezar el tratamiento — implantes/ortodoncia/cirugía) · **Financiamiento** (cuotas del saldo). RN-6 reescrita, AC-2, § Modelo y `nuevo-servicio` actualizados.
4. **Stats eliminado** → 5 leaves (era config, no analítica). Quité el leaf + pane + componente `StatsView` + AC.
5. **Detalle → Resumen** (leaf, pane, componente `ResumenView`, AC-4, happy path).
6. **Vincular doctor — cómo funciona:** abre un **panel selector del roster** (`lisa-doctores`, NO crea doctores) con buscador + checkboxes; marcar = "este doctor realiza el servicio". Mockeado abierto en `servicio-workspace.html` → Doctores (botón "+ Vincular doctor" lo togglea). Si falta un doctor → link "Agrégalo en Lisa → Doctores ↗".
7. **"Ver detalle ↗"** por doctor vinculado → deep-link a su ficha exacta en **Lisa → Doctores** (`/lisa/doctores/[doctor-id]`) + botón Desvincular. AC-5 ampliado.
8. **Tag "Tratamiento principal":** lo saqué del **header del workspace** (apretaba la fila con los leaves); el peldaño vive ahora **dentro de Resumen** (en Identidad). En las **tarjetas del catálogo lo dejé** (es el organizador visual del catálogo + lo necesita la vista Escalera) — decime si también lo querés fuera de las tarjetas.

### 2026-06-07 00:28 · 🤖 claude · `/po-ux` · ⚠️ DUDA
Dos cosas antes de tu **✍ FIRMA 2**:
- **#9 (documentos → RAG):** investigué engine + best-practice. Hallazgo: el conocimiento de Adrián HOY se arma **solo de data estructurada** (FAQ/objeciones/descripción que ya diseñamos); el engine tiene el esqueleto `KnowledgeSource` per-offer + endpoint de upload pero **el indexer Qdrant es un STUB** (no indexa) → conectarlo es **engine (`/pm-luana`)**. Best-practice 2025-26 (Intercom Fin/Ada/Sierra + clinical AI): para un agente de **venta**, estructurado **>** PDF (precio y contraindicaciones en PDF = staleness + riesgo clínico/legal; PDFs clínicos traen **PHI** → HIPAA-lite). **Mi recomendación: fuera del MVP** → story aparte a **nivel tenant** ("Base de conocimiento"), **copilot-interno primero**, sales_agent solo contenido comercial después. Detalle completo en `01-spec.md § Recomendación #9`. **Necesito tu decisión: (a) acepto recomendación = fuera del MVP / (b) mínimamente en esta story / (c) otra cosa.**
- **#8 tarjetas:** ¿el badge de peldaño sale también de las tarjetas del catálogo, o solo del header del workspace (lo que ya hice)?

Con tu decisión de #9 + #8-tarjetas + tu **✍ FIRMA 2** sobre los 4 mockups → RONDA 2 (Gherkin + matriz) → `refined` → `/architect`. State sigue `refining`.

### 2026-06-07 00:47 · 🤖 claude · `/po-ux` · ✓ APLICADO
Segunda tanda — #1, #2, #4 aplicados (mockups + spec). 4 mockups 200 en `:8899`.
1. **Crear servicio = entrar al workspace VACÍO** (no más Sheet) + **arranque por documento**. Reescribí `nuevo-servicio.html`: mismo shell + `EntitySubNavBar` (5 leaves) con campos en blanco + card "🚀 Arranca rápido" (cargá folleto/lista-precios/protocolo → **"Procesar con Lisa"** → autocompleta los campos · los revisás y ajustás). **Clave (lo investigué):** esto es **extracción a campos editables** (el engine YA lo hace: copilot `document_processor`), **distinto** del RAG-runtime de mi #9. O sea tu pedido de "cargar documentos para no escribir" = feature **(A) autocompletar** → ENTRA en la story (RN-17/AC-11). El **(B) RAG** (Adrián contesta libre desde el PDF) lo recomiendo diferir (ver abajo). Routing: "+ Nuevo" crea borrador → redirige a `[offer-id]` vacío.
2. **Tooltips** (política UI): clase `.tip` (subrayado punteado + ⓘ, hover muestra detalle — como el cockpit). Aplicada a campos no obvios/pesados: peldaño · contraindicaciones · condiciones de escalada · anticipo · palabras clave. RN-18 + AC-12. En código = Shadcn `Tooltip`.
4. **Tabs del workspace = estilo de los SubSubTabs** (Catálogo/Escalera): `.entity-leaf` ahora tiene mismo color/forma (sólido lisa + blanco) que `.subsubtab-btn`. ⚠️ ojo: `EntitySubNavBar` es **componente shipped compartido** (lo usan staff/doctores) → aplicarlo de verdad es un **restyle GLOBAL del shell** (consistencia, recomiendo sí). Lo dejé anotado para `/architect` + necesito tu OK de que aplica global (abajo).

### 2026-06-07 00:47 · 🤖 claude · `/po-ux` · 💡 PROPONE
**#3 dental vs estética** — mi recomendación UX: **NO forkear la UI**. Un servicio es un servicio, misma estructura (5 leaves, mismos campos). La diferencia es **contenido/data**, derivada del **vertical del tenant** (atributo de marca/onboarding, NO campo por-servicio): seed preset · ejemplos del selector de peldaño · opciones de especialidad · sugerencias de Lisa (descripción/FAQ/objeciones) · y el énfasis natural (estética→recurrencia+antes/después+downtime; dental→paquetes+garantía+financiamiento largo). En el MVP alcanza: 2 seed presets (ya in) + ejemplos del rung-picker + especialidades filtradas; la capa fina "sugerencias vertical-aware" es agéntica (capa de Lisa). Detalle en `01-spec.md § Diferenciación por vertical`. ¿Lo ratificás?

### 2026-06-07 00:47 · 🤖 claude · `/po-ux` · ⚠️ DUDA
Pendientes para tu **✍ FIRMA 2** (refrescá los 4 mockups primero):
- **#4 (shell):** ¿confirmás que el restyle de los leaf-tabs se aplica **global** al `EntitySubNavBar` shipped (lo vería también staff/doctores · consistencia), o lo querés solo en servicios?
- **#9-B:** ¿confirmás que el **RAG runtime** (Adrián contesta libre desde PDFs) queda **diferido** a story tenant-level "Base de conocimiento"? (El **autocompletar (A)** ya entra por tu #1.)
- **#8 tarjetas** (de antes): ¿el badge de peldaño sale también de las tarjetas del catálogo, o solo del header (hecho)?
- **#3 vertical:** ¿ratificás mi recomendación (no forkear UI)?

Con esas 4 confirmaciones + tu FIRMA 2 → RONDA 2 (Gherkin + matriz) → `refined` → `/architect`. State sigue `refining`.

### 2026-06-07 01:15 · 🤖 claude · `/po-ux` · ✓ APLICADO
Round 3 — apliqué tus comentarios al mockup + tus 4 respuestas. 4 mockups 200 en `:8899`.
- **Doctores → Especialistas** (más fiel a centros estéticos/no-médicos): renombrado en leaf, picker, deep-link, sub-tab y spec. ⚠️ El roster en sí (sub-tab `Lisa → Doctores`) es de la story `lisa-doctores` → renombrarlo allá es **cross-story, lo escalo a `/pm-vitalia`** (tabla/ruta quedan, solo el label).
- **Autosave (sin botón "Guardar")**: quité "Guardar borrador" y "Guardar vínculos"; ahora indicador 💾 "se guarda solo". RN-20 + AC-13.
- **#8 (tu sí)**: saqué el badge de peldaño de las **tarjetas del catálogo** (vive en Escalera + Resumen). Mantuve el de recurrente.
- **#4 (global)**: los leaf-tabs del workspace ahora con el mismo color/forma que SubSubTabs, aplicado **global** al `EntitySubNavBar` shipped (lo verá staff/doctores · consistencia). Nota a `/architect` + `SHELL-DESIGN-CONTRACT`.

### 2026-06-07 01:15 · 🤖 claude · `/po-ux` · 💡 PROPONE
Lo que pediste revisar ("el form es muy pesado, que el sistema agéntico facilite") + "nuevo = editar" + documentos-como-RAG → te propongo un **modelo de conocimiento** (en `01-spec.md § Modelo de conocimiento`):
- **Crear = editar = mismo workspace** (ya estaba) + panel **"📚 Fuentes & conocimiento" persistente y colapsable** (no un onboarding que desaparece · visible en crear y editar). Lo ves en `nuevo-servicio.html` (abierto, vacío) y `servicio-workspace.html` (con fuentes ya cargadas).
- **Invierto el flujo:** en vez de 24 campos vacíos, la dueña **suelta material** (folleto/precios/protocolo/enlace) y Lisa hace **doble uso del mismo documento**: **(a)** autocompleta los campos (✨ marcados con su fuente, editables — ella revisa) **y (b)** lo indexa para que **Adrián consulte** preguntas libres del paciente (RAG, toggle por fuente). Los campos curados (precio, contraindicaciones) siguen siendo la SSoT de alta precisión; el RAG es el complemento de cola larga. **El precio NUNCA sale del documento** (anti-staleness). Su trabajo se encoge a **revisar/curar**, no tipear. Eso es lo agéntico.
- **Guardas de seguridad (research · RN-22):** RAG solo comercial · clínico (contraindicaciones/diagnóstico) **escala al doctor**, no responde libre · scrub PHI en ingesta.
- **Alternativa #4 (mejores ejemplos por especialidad SIN forkear UI):** usar la **especialidad del tenant como CLAVE** de (1) un catálogo de hints por **sub-vertical** en el engine (hoy hay una fila genérica `PROFESIONAL_SALUD` → expandir a odontología-cosmética/medicina-estética/oftalmología/…) y (2) **ejemplos GENERADOS por Lisa** condicionados a (especialidad + el catálogo real de esa clínica + voz de marca). Una tabla estática nunca pega tan bien como Lisa mirando el contexto real. Cero pantallas distintas por vertical. Detalle en `§ Diferenciación por vertical`.

### 2026-06-07 01:15 · 🤖 claude · `/po-ux` · ⚠️ DUDA
**Flag de scope (importante):** meter el **RAG (B)** acá —como ratificaste— agranda la story de verdad y trae **dependencia de engine-lift `/pm-luana`**: el indexer Qdrant del sales_agent **hoy es STUB** y el **tool de retrieval no existe**. El **autocompletar (A)** funciona sin el lift (la extracción ya existe); el **RAG (B)** necesita el lift para verse live. Lo dejé dimensionado para `/architect` (¿(A) acá + (B) tras lift, o todo junto?). ¿Te parece bien esa secuencia, o querés que (B) sea su propia story dependiente?

Lo demás de tus 4 respuestas: #1 (#4 global) ✓ · #2 (RAG in) ✓ aplicado con guardas · #3 (#8 cards) ✓ · #4 (vertical alternativa) propuesta arriba.

**Falta tu ✍ FIRMA 2** sobre los 4 mockups (refrescá: el de "nuevo" ahora es el workspace vacío con el panel de Fuentes; el de "editar" muestra el panel con fuentes + RAG; tabs nuevos; sin badge de peldaño en cards; Especialistas). OK → RONDA 2 (Gherkin + matriz) → `refined` → `/architect`. State sigue `refining`.

### 2026-06-07 01:19 · 🤖 claude · `/po-ux` · ✓ APLICADO
Tu pregunta "¿la especialidad dónde se genera, en configuración o aquí?" — respuesta: son **dos cosas distintas**, lo aclaré en `§ Diferenciación por vertical`:
- **Especialidad de la CLÍNICA** (qué tipo de centro) = atributo del **tenant**, se declara **en Configuración/Onboarding** (set once) + editable en **Lisa → Marca**. **NO se crea en Servicios** — servicios la **consume** (presets + ejemplos + opciones del dropdown). Si el campo no existe hoy, crearlo es **cross-story onboarding/marca** (`/pm-vitalia`).
- **Especialidad/categoría del SERVICIO** = per-servicio, **sí vive aquí**; su dropdown se alimenta de las especialidades de la clínica.
Recomendación de hogar: autoría en Onboarding, editable en Marca, consumida en Servicios. ¿Lo ratificás? (No bloquea FIRMA 2 — es un consumo read-only para `/architect`.)

### 2026-06-07 01:21 · 🤖 claude · `/po-ux` · ✓ APLICADO
**Ratificaste:** la especialidad de la clínica **se crea en Onboarding** y **se edita en Lisa → Marca**. Y pediste **anotar la historia para ampliar la marca con eso**. Hecho:
- **Creé la story (idea):** `vitalia-fase2-marca-especialidad-clinica` (checkpoint.md + chris-input.md). Scope tentativo: atributo "especialidad(es) de la clínica" a nivel tenant/brand · crear en onboarding · editar en Lisa → Marca · consumir en servicios + capa agéntica de Lisa · (posible) expandir `OFFER_LADDER_HINTS` por sub-vertical en engine. AC + relaciones anotados. Es un **capture** — **`/pm-vitalia` la formaliza** (release/priority/cap lineage + decidir si el paso de creación va dentro de `vitalia-fase2-onboarding-clinica` o de esta story).
- **En `lisa-servicios`:** marqué la decisión como RATIFICADA en `§ Diferenciación por vertical` + agregué la dependencia **soft** a la story nueva en el checkpoint (servicios la consume read-only; funciona sin ella con presets genéricos).

Nada cambia en el scope de servicios (sigue consumiendo, no creando). **Sigue pendiente tu ✍ FIRMA 2** + la secuencia del RAG (A acá / B tras lift) → RONDA 2.

### 2026-06-07 01:46 · 🤖 claude · `/po-ux` · ✓ APLICADO
Tres cosas de esta ronda:
**1. RAG: todo acá.** A (autocompletar) + B (RAG) **juntos en esta story**, no se parte. El engine-lift (`/pm-luana`: indexer Qdrant real STUB + tool de retrieval del sales_agent inexistente) pasa a ser **dependencia HARD del ready package**. Actualicé § Modelo de conocimiento + § Recomendación #9 + § Pendientes + AC-15.

**2. Auditoría de campos** (la hice yo, vista por vista) → nueva **`§ Auditoría de campos`** (tabla: campo → ¿editable aquí? → si no, dónde se edita). **Hallazgos que arreglé en los mockups:**
- 🔴 **Resumen → Identidad** (Nombre/Especialidad/Peldaño) estaban como **texto read-only sin forma de editar** → ahora **inputs/selects editables** (autosave). Peldaño también por drag en Escalera.
- 🔴 **Moneda** incrustada en el precio ("desde S/ 4,500") → la **separé**: monto editable + chip **S/** read-only con tooltip "sale de la config de tu clínica".
- 🟡 **Calculados** (≈ equivale a / ≈ por mes) → tooltip "se calcula solo".
- 🟡 **Datos del especialista** (nombre/credenciales) = read-only aquí → nota "se editan en Lisa → Especialistas" + "Ver detalle ↗".
- 🟡 **Especialidad** (opciones del dropdown) + **voz** → tooltips de origen (tipo de clínica / Lisa → Marca).
- Política cementada (**RN-23**): campo read-only → el tooltip DEBE decir dónde se edita o que se calcula. AC-16.

**3. Placeholders por tipo de clínica** (lo que faltaba explicarte) → **RN-24 + § Diferenciación**. Misma pantalla, **el texto de ayuda se orienta al tipo**. **Demo interactivo en `nuevo-servicio.html`** (botones 🦷 Odontología / 💉 Estética): cambia placeholders de nombre/descripción/qué-incluye + opciones de especialidad + ejemplos del peldaño. En prod el tipo NO es toggle: sale del atributo de clínica (Onboarding/Marca), el usuario ve directo lo de su tipo. AC-17.

**Refrescá los mockups** (sobre todo `servicio-workspace.html` → Resumen editable + Plan de pago con moneda separada; `nuevo-servicio.html` → probá el toggle de tipo). Con tu **✍ FIRMA 2** → RONDA 2 (Gherkin + matriz) → `refined` → `/architect`. State sigue `refining`.

### 2026-06-11 22:30 · 🤖 claude · `/pm-vitalia` · ✓ APLICADO
**Reanudada** (`parked → refining`, ratificado Chris "quiero retomar la historia de servicios"). Los 2 bloqueos del park del 2026-06-10 están levantados: (1) `shell-core-hardening` DONE → el contrato N3 `EntityWorkspaceLayout` + `entityIdentitySlot` ya vive en `@luana/ui-kit` 0.4.0; (2) `lisa-doctores` reanudada (`developing`) + shippeó el switcher `EntityPicker` = referencia N3 viva. Closure-gate OK: doctores está OPEN pero es módulo `clinics` (servicios = `offer`) y servicios va a refining (bucket docs) → paralelo permitido. FIRMA 1 preservada; retomamos en **FIRMA 2**.
**⚠️ Heads-up para `/po-ux` (lo dejé como gate en el checkpoint):** los 4 mockups + `§ Workspace` se escribieron contra el `EntitySubNavBar` **local viejo**. Antes de pedirte FIRMA 2 hay que re-validar el workspace contra el `EntityWorkspaceLayout`/`entityIdentitySlot` nuevos de `@luana/ui-kit` (lo que doctores acaba de adoptar). Encadeno a `/po-ux` para que retome el loop — traé los **comentarios nuevos** que tenías pendientes para FIRMA 2.

### 2026-06-11 22:40 · 🤖 claude · `/po-ux` · 💡 PROPONE
Hice la prework de re-validación N3/canon. Hallazgo: los componentes del canon (2026-06-08) **ya están shippeados** en `@luana/ui-kit` 0.4.0 — verifiqué el `index.ts`: `EntityWorkspaceLayout`, `EntitySubNavBar`, `EntityPicker`, `EntityInfoCard`, `Group`, `FloatingAutosaveIndicator`, `Select` canónico, page-primitives (`layout/`, `archetypes/`). El §4 del `design-system-canon.md` que los listaba como "por construir" quedó **stale** (se construyeron con el lift del 11-jun).
**Delta = forma, no fondo** (FIRMA 1 intacta: 5 pestañas · ~24 campos · RAG A+B · escalera 5 peldaños · link doctor opcional). Lo que se recompone en los mockups:
- Catálogo → grilla de `EntityInfoCard` (Opción B) + filtro con `Select` canónico.
- Workspace → `EntityWorkspaceLayout` + `EntitySubNavBar` full-bleed (franja tercer-ribbon, no réplica local); cuerpo en `PageContainer`/`PageContentStack`; autosave = 1 `FloatingAutosaveIndicator` (sin badge por grupo).
- ★ **Nuevo del canon: `EntityPicker` (switcher ▾)** en el header del workspace → saltar servicio→servicio sin volver al catálogo (lo que doctores acaba de adoptar en `lisa/staff`).
- Escalera → bespoke (canon no tiene primitiva ladder) pero compone page-primitives + tokens.
**Esperando de Chris:** (1) confirmar el `EntityPicker` switcher en servicios (lo recomiendo, consistencia con doctores) · (2) sus comentarios nuevos pendientes → los pliego en el mismo refresco de mockups → muestro los 4 → ✍ FIRMA 2 → RONDA 2 (Gherkin+Matriz generadas) → `refined`. State sigue `refining`.

### 2026-06-12 · 👤 Chris · 💬 (verbatim)
"confirmo el switcher y luego necesito que los servicios esten asociados al tipo de centro (clinica), mi idea no es que para cada tipo haya una nueva plantilla pero si sería bueno ya que entiendo que la cantidad de servicios no es infinita, tener en la BS los servicios disponibles y si no lo encuentra pues agregarlo, esto para evitar ponerle nombres de un servicio a otro y tratar de estandarizar. Además, la idea es que este toda la información disponible para que un paciente sepa como se hace y demás, así como los riesgos y cosas que debería pdoer cargar quien crea el servicio. Aquí te pido investigues y antes de darme el mockup me des el listado de campos que recomiendas que vayan en cada vista y el flujo con eso ya armar el mockup con lo que te apruebe"

### 2026-06-12 · 🤖 claude · `/po-ux` · 💡 PROPONE
**Switcher `EntityPicker` ✓ RATIFICADO** (entra al workspace de servicios).
**Investigué** (pedido Chris): Fresha/Booksy = menú 100% libre, SIN lista maestra → el caos de nombres es real y la idea es **diferencial** · RealSelf = estructura canónica de ficha paciente (qué es/cómo funciona/candidatos/qué esperar/riesgos/recuperación/costo/resultados) · taxonomías dental/estética finitas (≈40-60 servicios reales por vertical) → confirma "no es infinito".
**Escribí el delta como `§ Biblioteca de servicios estándar + ficha completa de paciente (PENDIENTE APROBACIÓN)` en `01-spec.md`** (doc vivo — no toqué lo firmado): biblioteca curada por tipo de clínica (entrada canónica = nombre+sinónimos+categoría+peldaño sugerido+plantilla de contenido) · flujo "+ Nuevo" v3 picker-primero (plantilla pre-llenada ✨ o "personalizado") · `canonical_service_ref` para estandarizar · campos nuevos en Resumen (grupos "El procedimiento": cómo se hace 🔴 + anestesia 🟡 · "Riesgos": riesgos 🔴 + señales de alarma 🟡) · sinónimos de Adrián pre-llenados · MVP 24→26 · RN-25/26/27 draft. Anti-dup: la biblioteca = **data del preset pack EP-2 de Offer Studio** (mecanismo existente, cero edit engine). Nota: "BS" interpretado como base-de-servicios; técnicamente vive en Offer Studio (no Brand Studio).
**Esperando de Chris (4 decisiones, gate del mockup):** (1) flujo picker-primero ¿OK? · (2) personalizado = solo-clínica + candidatura curada (no auto-publica) ¿OK? · (3) completitud SIN bloquear "Activo" (indicador "faltan: X") ¿o bloquear sin los 🔴? · (4) seed dental+estética Tier 1 generado por Lisa + curado ¿OK? → con su aprobación integro al cuerpo + refresco los 4 mockups (canon ui-kit + picker) → ✍ FIRMA 2.

### 2026-06-12 · 👤 Chris · 💬
"Confirmo todo, genera el mockup con /po-ux" → **RATIFICADO 4/4** (picker-primero · personalizado solo-clínica + candidatura curada · completitud informativa sin bloquear Activo · seed dental+estética Lisa+curado).

### 2026-06-12 00:30 · 🤖 claude · `/po-ux` · ✓ APLICADO
**1 · Delta integrado al cuerpo de `01-spec.md`** (la sección § Biblioteca queda como registro): § Modelo (+`canonical_service_ref`) · § Workspace/Resumen reagrupado (Identidad+chip estándar · Qué es · ★El procedimiento · Resultados · ★Riesgos · Operación) · MVP 24→26 · § Mapa funcional (happy path picker-primero + árbol con ramas plantilla/personalizado · seed=biblioteca) · **RN-25/26/27** · **AC-18/19** + AC-7/9 actualizados · § Componentes v3 (piezas `@luana/ui-kit` 0.4.0 + `BibliotecaPicker` NEW + `FichaCompletenessChip` NEW) · § Pendientes /architect (+modelo biblioteca EP-2 + cálculo completitud).
**2 · Mockups v3 refrescados** (agente sonnet + verificación independiente: 4×HTTP 200, markers presentes, voseo limpio, shell wrapper intacto):
- `catalogo.html` → grid `EntityInfoCard` Opción B (acento Lisa · media circular · métricas · kebab ⋮ · chips 📚Estándar/✏️Personalizado) + filtros `Select` canónico.
- `escalera.html` → ejemplos de peldaño vacío ahora "de la biblioteca".
- `servicio-workspace.html` → franja canon full-bleed `‹ Servicios` + **`EntityPicker` ▾** (dropdown con búsqueda, 6 de 14) + Resumen 6 grupos (procedimiento + riesgos con ✨) + completitud "23/26" + UNA píldora autosave (badges por-grupo removidos).
- `nuevo-servicio.html` → **modal BibliotecaPicker como estado inicial** (typeahead "fundas" → matchea "Carillas de porcelana" por sinónimo · "Usar esta plantilla" pre-llena ✨ / "Crear personalizado" → vacío) + franja canon.
**Server corriendo: `http://127.0.0.1:8899/{catalogo,escalera,servicio-workspace,nuevo-servicio}.html`.**
**Esperando de Chris: ✍ FIRMA 2** sobre los 4 mockups v3 → RONDA 2 (Gherkin + Matriz generadas) → `refined` → `/architect`. State sigue `refining`.

### 2026-06-12 · 👤 Chris · 💬
"En la escalera de valor puedes poner el peldaño gratuito arriba, los 3 siguientes abajo en columnas y el plan/convenio abajo como una fila? para 'repartir' un poco más y dare más orden"

### 2026-06-12 · 🤖 claude · `/po-ux` · ✓ APLICADO
**Layout escalera reorganizado** (edit quirúrgico `escalera.html` + `_shared.css`): Gancho gratuito = **fila full-width arriba** (head a la izquierda, cards horizontales) · Primera visita + Tratamiento principal + Premium = **3 columnas al medio** · Plan/convenio = **fila full-width abajo**. Responsive: las filas colapsan a vertical <900px. De paso el layout refleja el recorrido (entrada → núcleo de venta → permanencia). Registrado en `01-spec.md § Wireframes` (bullet escalera). Verificado HTTP 200. **Refrescá `http://127.0.0.1:8899/escalera.html`** — sigue pendiente tu ✍ FIRMA 2 sobre los 4.

### 2026-06-12 · 👤 Chris · 💬
"¿Por qué el 'nuevo' servicio es diferente a la edición, si básicamente es lo mismo? Además el botón de 'servicios' para volver hazlo con el estilo como con el staff (de la nueva construcción, del mockup de la historia de staff que se está desarrollando), como un botón más. Y el crear nuevo servicio no lo hagas como popup: hazlo dentro de la hoja, como una nueva hoja que recién se crea cuando selecciona una plantilla o crea uno nuevo."

### 2026-06-12 · 🤖 claude · `/po-ux` · ✓ APLICADO (3/3)
**1 · Nuevo = editar unificados** (era bug de fidelidad — RN-16 ya lo mandaba): el workspace de `nuevo-servicio.html` ahora es ESTRUCTURALMENTE IDÉNTICO a `servicio-workspace.html` — mismos 5 leaves + mismos 6 grupos de Resumen (verificado por extracción: 📋 Identidad · 📝 Qué es · 🔬 El procedimiento · 🌟 Resultados · ⚠️ Riesgos · 🗓️ Operación, orden exacto). Únicas diferencias: campos vacíos/✨, chip Borrador, completitud baja. El viejo card "Arranca rápido" se fusionó dentro del panel Fuentes vacío.
**2 · Root "‹ Servicios" = leaf-peer** (= construcción nueva de staff: ui-kit `EntitySubNavBar.tsx` — "the root is a peer leaf in the tablist", primera entrada con ‹, mismas clases que los leaf-tabs). Aplicado en ambos workspaces (`entity-leaf-root`).
**3 · Picker inline, NO popup:** eliminado el modal/backdrop; el picker es la PRIMERA VISTA de la hoja "Nuevo servicio" (franja en ese estado: solo ‹ Servicios + título, sin leaves — el workspace no existe aún); **el borrador recién se crea al elegir** plantilla o "Crear personalizado" → ahí aparece el workspace. "↻ Volver a elegir" regresa al picker.
Spec actualizado: RN-16 refinada + AC-9/AC-18 reescritos + § Wireframes (bullet nuevo-servicio v3.1 + nota root leaf-peer). Verificación independiente: 4× HTTP 200 · grupos idénticos ambos archivos · cero `fixed/absolute` en biblio-overlay. **Refrescá `nuevo-servicio.html` + `servicio-workspace.html`** — pendiente tu ✍ FIRMA 2.
