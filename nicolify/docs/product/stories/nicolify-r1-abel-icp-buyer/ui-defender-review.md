<!-- voseo-allowed: audit review may cite spanish-text.md glosario verbatim per R25 (.claude/rules/spanish-text.md § Magic comment escape) -->

# UI Defender Review — Abel / ICP & buyer (nicolify-r1-abel-icp-buyer)

**Fecha:** 2026-06-04
**Story:** `nicolify-r1-abel-icp-buyer`
**Mockup de referencia:** `nicolify/docs/product/stories/nicolify-r1-abel-icp-buyer/mockups/icp-buyer.html`
**SHELL-DESIGN-CONTRACT:** `nicolify/docs/architecture/SHELL-DESIGN-CONTRACT.md` § 5.1
**Spec:** `01-spec.md` ratificada Chris 2026-06-03
**Design system:** `nicolify-design-system` SKILL.md (tokens, átomos, agentes, shell)
**Pantallas auditadas:** ff-1-empty · ff-2-modal · ff-3-seed · ff-4-borrador
**Rol:** UI Defender — fidelidad visual + adherencia de marca. NO es code gate; produce comentarios de mejora accionables para Chris.

---

## Veredicto global de fidelidad

**sí-con-notas** — El flow completo es reconociblemente el mismo del mockup ratificado. El shell, la tipografía, el color firma y la lógica de navegación están presentes. Hay desviaciones cosméticas notables (especialmente en el modal y la barra EntitySubNavBar del borrador) que reducen la cercanía al mockup G1 pero no lo rompen. Ninguna pantalla viola la arquitectura ni los guardrails del paradigma.

---

## Pantalla 1 — `ff-1-empty.png` (estado vacío · DraftFirstStarter)

### Veredicto: ✅ fiel

**Lo que funciona bien:**

- El shell N1/N2 está completo: TopBar con logo "Nicolify" + TenantSwitcher "Agencia ▾" (correctamente en la barra superior derecha), Ribbon con los 5 agentes (Abel "Estratega", Brenda "Growth", Christian "Ventas", Sara "Próximamente", Norvil "Cuenta"), la sub-tab "ICP & buyer" activa con color abel (púrpura).
- Luana panel izquierdo en modo **history** (lista de conversaciones visibles + header "Conversaciones" con botón "+"). Fiel al mockup.
- El **DraftFirstStarter** presenta exactamente el patrón de dos opciones: "Abel te arma un borrador" (CTA primario azul-púrpura, prominente) y "Empezar en blanco" (CTA secundario outline). Esto respeta RN-2 (draft-first — nunca form vacío único).
- El icono de objetivo 🎯 con fondo `--agent-abel-soft` (lavanda) está presente, fiel al mockup.
- Microcopy: "Define tu cliente ideal" (título correcto) + descripción en español neutro tuteo ("Abel puede armar uno desde una URL, archivo o texto").
- Nota inferior "Puedes tener múltiples perfiles (por segmento de mercado o tipo de cliente)" presente, correcta.

**Desviaciones detectadas:**

- 🟡 **M1 — Ribbon: etiquetas de rol cortadas.** En el mockup, los ribbon-tabs muestran dos líneas: nombre + rol abajo en `font-size: 10px color:text-muted`. En la pantalla viva, las etiquetas de rol ("Estratega·Abel", "Growth·Brenda", etc.) se ven truncadas o están integradas en una línea. La etiqueta "Próximamente" de Sara tampoco tiene submención del rol ("Jefa de Proyectos"). Impacto: orientación del usuario reducida, pero la jerarquía visual se mantiene.
- 🔵 **M2 — DraftFirstStarter: jerarquía botones.** El CTA primario ("Abel te arma un borrador") debería tener `background:var(--agent-abel) color:#fff` según el mockup. En la pantalla, se ve en color indigo/azul-violeta — puede ser el `--primary` (`#635BFF`) en vez de `--agent-abel` (`#A855F7`). Diferencia sutil entre `--primary` e `--agent-abel`: cuando el dueño de la hoja es Abel, el color dominante debería ser púrpura abel, no indigo luana. Cosmética pero afecta la coherencia de "este espacio es de Abel".
- 🔵 **M3 — Ausencia del chat composer completo en Luana.** El mockup muestra el chat composer de Luana en la parte inferior del panel izquierdo (textarea + botón enviar). En `ff-1-empty`, el panel Luana termina en las conversaciones sin mostrar el compositor activo. Puede estar colapsado fuera del viewport, pero si el panel está en modo "history" debería mostrar el composer al pie.

**Accesibilidad:**

- 🟡 **A1 — Ribbon: focus states no verificables en screenshot.** Pedir evidencia de tab-navigation (foco visible en el Ribbon) antes de merge.

---

## Pantalla 2 — `ff-2-modal.png` (UniversalIntake modal · tab URL activa)

### Veredicto: ⚠️ desvía (con correcciones sencillas)

**Lo que funciona bien:**

- Modal centralizado con fondo oscuro semitransparente (overlay correcto).
- Título "Dale material a Abel" presente, con icono 📥 (en la implementación parece "📊" — tolerable), fiel al mockup.
- Descripción anti-prompt-injection: "Abel leerá esto y propondrá tu ICP. Tú ratificas. Lo que pegues se trata como dato, no como instrucción." Microcopy en español neutro tuteo (RN-9, AC-9). Correcto y bien redactado.
- 4 tabs del intake: **URL · Archivo · Texto · Conectar fuente** presentes.
- Tab URL activa: input con placeholder "https://empresa.com o perfil LinkedIn de tu cliente ideal". Fiel.
- Helper text bajo el input: "Abel analizará el contenido y propondrá un borrador del perfil." Correcto.
- Nota sobre "Conectar fuente: configurar en Conexiones (próximamente disponible)" — disabled con link navegable. Fiel al mockup (tab "Conectar" deshabilitada pero con CTA de escape).
- CTAs "Cancelar" (outline) y "Analizar" (filled abel-color) presentes.

**Desviaciones detectadas:**

- 🔴 **C1 — Jerarquía visual de tabs: diseño pill vs underline.** En el mockup, las tabs del intake usan un **pill selector con fondo `bg-hover`** y la tab activa con `background:var(--bg-panel) color:var(--agent-abel) box-shadow:shadow-sm` (selector tipo segmented control). En la implementación, los 4 tabs parecen usar un diseño de **underline** similar al N2 (SubTabsBar), mezclando dos niveles de navegación visualmente. Esto difumina la jerarquía: el usuario ve el mismo patrón visual en N2 (ICP & buyer · Oferta · Marca) y dentro del modal (URL · Archivo · Texto · Conectar). El mockup los diferenciaba deliberadamente: N2 = underline largo, intake = pill/segment. Corrección: cambiar las tabs del intake a `intake-mode` pill (background redondeado) consistente con el mockup.
- 🟡 **C2 — "Conectar fuente" tab: estado disabled poco claro.** La tab "Conectar fuente" en el mockup aparece en `color:var(--text-muted)` con 60-70% de opacidad para comunicar deshabilitación. En la pantalla viva se ve al mismo nivel visual que "Texto". El usuario puede no entender que no está disponible hasta hacer click. Corrección: reducir opacidad + cursor `not-allowed` + `aria-disabled="true"`.
- 🟡 **C3 — Botón "Analizar": color.** El CTA "Analizar" se ve en un color cercano a `--primary` (indigo `#635BFF`) en vez de `--agent-abel` (púrpura `#A855F7`). Mismo issue que M2 — en un modal que pertenece a Abel, el CTA primario debería ser abel-color. Corrección: `background:var(--agent-abel)`.
- 🔵 **C4 — Icono del header.** El mockup usa `📥` (inbox/entrada). En la pantalla parece un icono diferente. Cosmética, pero la consistencia con el mockup G1 es parte del gate ADR-nicolify-001 G1.
- 🔵 **C5 — Borde focus del input.** El mockup define `border-color:var(--agent-abel); box-shadow:0 0 0 3px var(--agent-abel-soft)` en focus. No verificable en screenshot estático — agregar a checklist manual.

**Accesibilidad:**

- 🟡 **A2 — Focus trap del modal.** El modal debe atrapar el foco (Tab/Shift+Tab cicla solo dentro) y devolver el foco al trigger al cerrar. No verificable en screenshot; pedir evidencia antes de merge (AC-3 a11y).
- 🟡 **A3 — aria-modal y role="dialog".** El modal debe tener `role="dialog"` + `aria-modal="true"` + `aria-labelledby` apuntando al h3 "Dale material a Abel". No verificable visualmente; agregar a checklist técnico.

---

## Pantalla 3 — `ff-3-seed.png` (tab Texto · semilla llenada)

### Veredicto: ✅ fiel

**Lo que funciona bien:**

- Tab "Texto" activa correctamente, mostrando un `textarea` con placeholder "Describe tu cliente ideal".
- La semilla de ejemplo es representativa y real: "Agencias de marketing de resultados en LatAm (MX, CO, PE), 15-40 personas. Dolor: dependen de referidos y no tienen prospección outbound sistemática; quieren retainers de 6-12 meses. Decisor: fundador o director comercial." — excelente microcopy de ejemplo, neutro, en tuteo.
- Helper text: "Cuanto más detalle, mejor el borrador que te va a proponer Abel." En tuteo. Correcto.
- Focus ring visible en el textarea (borde azul/abel), input focusado claramente.
- La nota de "Conectar fuente: configurar en Conexiones (próximamente disponible)" se mantiene consistente con la pantalla anterior.
- CTAs "Cancelar" y "Analizar" correctamente posicionados.

**Desviaciones detectadas:**

- 🔵 **S1 — Mismo issue C1 (tab jerarquía pills vs underline)** — aplica también en esta pantalla.
- 🔵 **S2 — Mismo issue C3 (color botón "Analizar")** — aplica también en esta pantalla.
- 🔵 **S3 — Placeholder del textarea: voseo residual.** El mockup usa "Pegá lo que tengas: descripción de tu negocio, a quién le vendés, casos de éxito…" (con voseo, era el mockup pre-spec). La implementación muestra "Describe tu cliente ideal" (tuteo correcto). La implementación ganó en este punto — no es una desviación negativa.

**Aspectos positivos adicionales:**

- El textarea está claramente dimensionado con espacio suficiente (al menos 4-5 líneas visibles), fiel al mockup.
- El overflow del texto largo se maneja bien visualmente (sin corte abrupto).

---

## Pantalla 4 — `ff-4-borrador.png` (ICP borrador detail · ProposalBanner + EntitySubNavBar + datos form)

### Veredicto: ⚠️ desvía (issues importantes en EntitySubNavBar y ProposalBanner)

**Lo que funciona bien:**

- La **EntitySubNavBar (barra N3)** está presente como barra superior del área app — esto es el hallazgo más importante y positivo: el patrón de navegación list→detail está implementado en la posición correcta del stack (Ribbon→SubTabs→EntitySubNavBar→contenido), NO como card flotante dentro del contenido.
- Leaves visibles en la barra: `‹ ICPs · Agencias de marketi... · Datos del ICP · Fundador / CEO · Director Come...` — los buyers como leaves del ICP están implementados, fiel al patrón SHELL-DESIGN-CONTRACT § 5.1.
- **ProposalBanner** presente ("✨ Abel propuso este borrador — Revisa los datos y confirma cuan... **Descartar · Ratificar**"). La bifurcación draft-first (RN-3: Abel propone, dueño ratifica) está implementada con el banner prominente. El patrón "Abel propuso → ratificar/descartar" es reconocible.
- Los **datos del ICP** se renderizan en grupos: "Identidad" (Nombre del ICP + Descripción), "Firmográficos" (Vertical/industria = "Marketing de resultados" · Tamaño = "15-40 personas" · Geografía · Modelo de negocio), "Firmográficos 🔗 Brenda, Norvil" chip visible.
- El autosave-style form (sin botón "Guardar" global) parece respetado — los campos son inline editables.
- Tipografía League Spartan se aprecia en el contenido.

**Desviaciones detectadas (las más críticas de las 4 pantallas):**

- 🔴 **B1 — EntitySubNavBar: anatomía incompleta.** El mockup define la anatomía exacta: `[‹ ICPs] | [icon 🎯] [nombre ICP] | [📋 Datos del ICP active] [buyer-av Fundador ★] [buyer-av DirectorComercial] [+ buyer]`. En la implementación:
  - El ícono de la entidad (ej. `🎯` o avatar del ICP) antes del nombre no es visible — la identidad visual del ICP dentro de la barra es solo texto ("Agencias de marketi..."), sin el icono identificador.
  - El separador visual entre el back-link y la identidad del ICP (una línea vertical `border-left:1px solid var(--border)` en el mockup, `entitynav-entity` con `padding-left`) no se aprecia claramente.
  - El leaf "Datos del ICP" debería mostrar `📋` como prefijo. En la pantalla solo muestra "Datos del ICP" sin el emoji diferenciador. Impacto: el leaf de la entidad madre se distingue menos de los leaves de buyers.
  - Leaves de buyers: en el mockup tienen `leaf-av` (avatar circular de colores) + nombre + `★` para el primario. En la pantalla los leaves "Fundador / CEO" y "Director Come..." no muestran avatar circular de color ni el ★ del primario. Esto reduce significativamente la escaneabilidad (el usuario no puede identificar visualmente el buyer primario de un vistazo).

- 🔴 **B2 — ProposalBanner: visibilidad reducida.** En el mockup, el ProposalBanner es una franja ancha con `border-left:4px solid var(--agent-abel)`, fondo `--agent-abel-soft` (lavanda), padding generoso y los dos CTAs bien separados. El mensaje clave es "Abel leyó tuagencia.com y propuso este ICP + sus buyers. Revisá y ajustá lo que quieras; cuando estés conforme, ratificá." En la pantalla, el banner existe pero aparece **comprimido** y el texto se corta ("Revisa los datos y confirma cuan..."). Los CTAs "Descartar" y "Ratificar" están presentes pero comprimidos. La prominencia del mensaje de Abel como autor del borrador se pierde. Corrección: aumentar padding del banner, truncar el texto de forma más elegante (ej. `text-overflow:ellipsis` o limitar a 2 líneas con el mensaje completo visible sin corte a mitad de frase).

- 🟡 **B3 — Chips "¿para qué sirve?" (AC-5).** El spec (AC-5) y el mockup son muy explícitos: cada grupo de campos lleva su chip de consumidor agente (ej. `🏹 Christian` en Firmográficos, `💰 Brenda` en Dolor & ángulo). En la pantalla, se ve "🔗 Brenda, Norvil" en la sección Firmográficos, lo cual parece ser el chip presente. Sin embargo:
  - El formato del chip en la pantalla se ve como texto plano en un badge genérico, mientras que el mockup los muestra como chips coloreados (`wf-christian: background:var(--agent-christian-soft) color:var(--agent-christian)`). El chip de Brenda debería ser verde-soft, el de Christian azul-soft.
  - Solo se aprecian chips en "Firmográficos". No es posible verificar si "Dolor & ángulo", "Señales / triggers" y "Anti-patrón" también los tienen (están fuera del viewport). Verificar que todos los grupos tengan su chip.

- 🟡 **B4 — Completeness / estado del ICP.** El spec eliminó la barra de completitud (decisión Chris 2026-06-03: "Sin barra de completitud visible"). En la pantalla, la sección visible del form no muestra barra de progreso — correcto. Sin embargo, no se ve un indicador de estado "Borrador / Listo" claro en el área de datos (el mockup mostraba un chip `chip-borrador` con "◐ Borrador" + botón "Marcar listo" en el `detail-head`). En la pantalla este header de estado parece ausente o fuera del viewport. Pedir verificación de que el chip de estado y el botón "Marcar listo" existan en la vista de datos.

- 🔵 **B5 — Nombre del ICP cortado.** "Agencias de marketi..." en la barra N3 (EntitySubNavBar) — el nombre se trunca a la mitad de la primera palabra. El mockup trunca con `text-overflow:ellipsis` pero muestra suficientes caracteres para identificar la entidad. Corrección: aumentar el max-width del nombre o usar `white-space:nowrap; overflow:hidden; text-overflow:ellipsis` con min-width razonable.

- 🔵 **B6 — Moneda no visible en campos firmográficos.** El "Ticket promedio" debería mostrar la moneda del locale del tenant (RN-11, SC-i18n). No se aprecia en la pantalla. Verificar que el campo existe y muestra la moneda correcta (no "USD" hardcodeado).

**Accesibilidad:**

- 🟡 **A4 — EntitySubNavBar: role="tablist" + roving tabindex.** El spec y el SHELL-DESIGN-CONTRACT § 5.1 son explícitos: `role="tablist"` + roving tabindex + flechas Left/Right/Home/End. No verificable en screenshot — pedir evidencia de keyboard navigation antes de merge (SC-a11y).
- 🟡 **A5 — ProposalBanner: botones con labels accesibles.** "Descartar" y "Ratificar" son botones de acción de peso. Verificar que tienen `type="button"` y no `<div>` ni `<a>`.

---

## Lista consolidada de mejoras

### 🔴 Alta (afecta usabilidad o fidelidad al patrón canónico)

| ID | Pantalla | Descripción | Fix sugerido |
|---|---|---|---|
| C1 | ff-2, ff-3 | Tabs del intake en underline (igual que SubTabsBar N2) vs pill/segmented del mockup | Usar `intake-mode` pill selector (fondo redondeado, activo con sombra) en vez de underline |
| B1 | ff-4 | EntitySubNavBar: falta icono de entidad, sin avatar-color en buyer leaves, sin ★ del primario | Agregar `entitynav-entity-icon` + `leaf-av` coloreados + `leaf-star` para is_primary=true |
| B2 | ff-4 | ProposalBanner comprimido + texto cortado a mitad de frase | Aumentar padding, limitar a 2 líneas con mensaje completo + CTAs visibles |

### 🟡 Media (desvía del mockup pero no rompe el uso)

| ID | Pantalla | Descripción | Fix sugerido |
|---|---|---|---|
| M1 | ff-1 | Ribbon: roles de agentes truncados o no visibles claramente | Ajustar ribbon-tab-role visibility + asegurar display en 2 líneas (nombre + rol) |
| M2 | ff-1, C3 | CTA primario en color --primary (indigo) en vez de --agent-abel (púrpura) cuando el dueño es Abel | Usar `background:var(--agent-abel)` en CTAs primarios de hojas de Abel |
| C2 | ff-2 | Tab "Conectar fuente" no comunica claramente su estado disabled | `opacity:0.5` + `cursor:not-allowed` + `aria-disabled="true"` |
| B3 | ff-4 | Chips "¿para qué sirve?" sin colores de agente (todos genéricos) | Chips `wf-christian` (azul-soft), `wf-brenda` (verde-soft), `wf-nav` (gris) según el agente consumidor |
| B4 | ff-4 | Estado "Borrador" y botón "Marcar listo" en detail-head posiblemente ausente | Verificar que chip-borrador + btn "Marcar listo" existen en la vista de datos |
| A1-A5 | todas | Focus states y keyboard navigation no verificables en screenshot | Agregar a checklist DoD antes de merge: tab-trap modal, roving tabindex EntitySubNavBar, focus-visible en Ribbon |

### 🔵 Baja / cosmética

| ID | Pantalla | Descripción | Fix sugerido |
|---|---|---|---|
| M3 | ff-1 | Chat composer de Luana no visible en panel history | Verificar que el panel muestra composer en la parte inferior |
| C4 | ff-2 | Icono del header del modal difiere del mockup (📥) | Usar `📥` si el mockup G1 lo ratificó |
| S1/S2 | ff-3 | Mismo que C1/C3 | Ver C1, C3 |
| B5 | ff-4 | Nombre del ICP truncado abruptamente en EntitySubNavBar | `text-overflow:ellipsis` con min-width suficiente para ser identificable |
| B6 | ff-4 | Moneda del ticket no visible | Verificar `formatMoney(amount, locale.currency)` en campo ticket promedio |

---

## Notas de scope

Las siguientes pantallas del mockup **NO son scope de esta story** (no auditadas como faltantes, sino out-of-scope):

- Vista "Arranque" (DraftFirstStarter con grid 2 cards) — no hay screenshot pero la lógica está presente en ff-1 en forma simplificada de 2 botones. La versión de 2 cards con mayor superficie (mockup "1 · Arranque") sería la versión richer — worth validar si eso es lo que se implementó o si es la versión simplificada. Si es la simplificada, anotarlo como desvío menor.
- Vista "Lista ICP" (master/grid de cards) — no hay screenshot de la lista. El flujo saltó directamente al borrador.
- Estado "Listo" (chip verde, botón "Ya está listo" deshabilitado) — not shown, not required in scope.
- Pantallas de buyers individuales (leaf buyer detail con `renderBuyer`) — not shown. Verificar como parte del SC-happy-buyer.
- "Abel está leyendo…" overlay (analizando) — no hay screenshot. Debe existir según AC-1 / SC-happy.

---

## Veredicto final por pantalla

| Pantalla | Veredicto | Issues principales |
|---|---|---|
| ff-1-empty (DraftFirstStarter) | ✅ fiel | M1 (roles ribbon), M2 (color CTA), M3 (composer) — todos cosméticos |
| ff-2-modal (intake URL tab) | ⚠️ desvía | C1 🔴 (tabs pill vs underline), C2 (disabled tab), C3 (color Analizar) |
| ff-3-seed (intake Texto tab) | ✅ fiel | S1/S2 cosmética (inheritan C1/C3); microcopy mejor que mockup |
| ff-4-borrador (borrador detail) | ⚠️ desvía | B1 🔴 (EntitySubNavBar incompleta), B2 🔴 (banner comprimido), B3/B4 medios |

**Fidelidad general:** sí-con-notas. Las 3 issues rojas son mejoras concretas y realizables por el builder sin nuevo diseño. El patrón arquitectónico (EntitySubNavBar como barra N3 en posición correcta, draft-first con banner, leaves = buyers) está implementado y reconocible.

> **Nota para Chris:** este review es para tu sign-off. Las issues 🔴 recomiendo resolverlas antes de que el auditor técnico (T-FE-review) cierre la story. Las 🟡 son mejoras deseables. Las 🔵 son cosméticas post-merge. La story está en buen estado de fidelidad para su primera implementación live de un patrón nuevo (EntitySubNavBar con leaves dinámicos).
