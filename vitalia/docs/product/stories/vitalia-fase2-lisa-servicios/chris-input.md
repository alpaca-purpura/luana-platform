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
