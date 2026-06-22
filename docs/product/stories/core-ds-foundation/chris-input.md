# chris-input — core-ds-foundation

> Bitácora verbatim de decisiones con Chris. Cada entry: verdict (✓ APLICADO · ⚠️ DUDA · ❌ REFUTADO · 💡 PROPONE).

## 💬 Conversación

### 2026-06-21 · arranque (origen D11 → inventory-first)

**Contexto:** /po-ux refinando el mockup de `vitalia-fase2-mateo-nueva-cita` (D11). El audit UI mostró que
el mockup mapea a componentes reales, pero que mantener "todo del shared / mínimo local" hoy NO es sostenible:
el inventario no tiene catálogo vivo y los mockups driftean por copia de `_shared.css`.

**Chris (decisión 1) · ✓ APLICADO** — "la idea es llegar a solo reutilizar y adaptar; lo local mínimo, todo del
shared … sin demasiados local que no nos dejen crecer / rompan la uniformidad. Inventario siempre al día."
→ Confirmado: la disciplina = reusar/consolidar + promover-al-2º-consumidor; el inventario necesita maquinaria.

**Chris (decisión 2 · sequencing) · ✓ APLICADO** — eligió **"Inventory-first (arreglar la maquinaria)"**:
catálogo generado + mockup-kit + drift-lint, antes de promover nada.

**Chris (decisión 3 · vehículo) · ✓ APLICADO** — eligió **"Scaffold full core-ds-foundation"**: la maquinaria
entra como Fase 0 del programa DS completo (no story dedicada ni harness-pass suelto). D11 parkea y resume después.

**/pm-luana · 💡 PROPONE (pendiente ratificación de Chris):**
- Scaffold escrito (este checkpoint). Scope = Fase 0 machinery → Fase 1 componentes (incl. deltas D11) → Fase 2 arch-test.
- Deltas D11 a promover: `SegmentedControl` (consolida `.toggle-pill`+`.segmented`), `EntityRow`/`EntityChip`,
  `PageHeader` back-slot · REUSAR Badge para avail/dur · `AvailabilityStrip` vitalia-shared (no core aún) · `ComputedField` flag.
- **Falta tu ✓:** ratificar el scope consolidado → habilita `/architect` (ready package, empezando por Fase 0).
- Handoffs que NO hago yo (anti-creep): /pm-vitalia parkea D11 + ownea AvailabilityStrip · /harness-issue captura el hallazgo de inventario.

### 2026-06-21 · ratificación de scope + visual-review gate

**Chris (decisión 4 · ratify scope) · ✓ APLICADO** — ratificó el scope consolidado **as-is** (Fase 0 machinery →
Fase 1 componentes incl. deltas D11 → Fase 2 arch-test) + el **per-component visual-review gate** (Batch 1→2→3).
→ checkpoint: `state refining→refined`, `phase=READY_FOR_ARCHITECT`, `per_component_visual_review_gate: true` +
§ Visual-review gate documentada (orden Batch 1 mockup-kit → Batch 2 layout-primitives review-only → Batch 3 deltas D11 uno-por-uno).

**Chris (decisión 5 · promote 558cd564) · ✓ APLICADO** — eligió **batchear** al cierre de sesión (no promote-now).
`558cd564` es pure platform/docs (cero `{brand}/**`) → se promueve con `make promote-to-main + sync-all` junto al
resto de commits platform/docs de esta sesión.

**/pm-luana · 💡 PROPONE (routing, anti-creep)** — el siguiente paso NO es `/po-ux` (esto es `type:
platform-engineering`, no UI story). Es **`/architect <brand>: platform`** → ready package empezando por **Fase 0**
(des-gated). /po-ux es el *estilo* de revisión (mockup-per-component), no el builder acá. Encadeno a `/architect`.

### 2026-06-22 · /architect (technical-story lane) — Fase 0 firmada + Batch 1 construido

**Chris (decisión 6 · approach Fase 0) · ✓ APLICADO** — firmó (single signature) el approach: mockup-kit = UN
`kit.css` brand-agnostic var()-based (base = nicolify 166-líneas) + `tokens.{brand}.css` GENERADO de globals.css
(R-FID, no copia). Catálogo = node script de index.ts. Drift-lint = eslint no-arbitrary + vitest arch-test.

**/architect · ✓ APLICADO (Batch 1 artifact)** — construido `docs/design-system/mockup-kit/` (`kit.css` +
`tokens.vitalia.css` + `preview.html` + `README.md`). 26/26 vars del kit resuelven.

**/architect · 💡 PROPONE (recon que achica el scope)** — Fase 1 está MÁS hecha de lo que decía el checkpoint:
Entity*/Picker/archetypes/layout/TogglePill/autosave YA exportan de `@luana/ui-kit/src/index.ts`; tokens-scale YA
existe (`@luana/design-tokens` 0.2.0). → Batch 2 = review-only confirmado. Fase 0 net-new real = catálogo +
mockup-kit + drift-lint (nada de "construir el lego").

**/architect · ⚠️ DUDA (flag del kit, para Chris)** — el kit hereda `.btn-primary{color:#fff}` de la base nicolify.
Con Mateo (amarillo) la acción primaria queda blanco-sobre-amarillo (bajo contraste). El canon §2.8 pide
texto-por-contraste (Mateo→oscuro). Fix = token `--agent-active-fg` en vez de `#fff` hardcodeado. Lo dejo anotado
para el ticket del kit (no lo resuelvo en el review del sustrato).

**AWAIT Chris:** revisar `preview.html` → aprobar el kit → produzco el reduced ready package (06-tickets + 04-validators) Fase 0.

### 2026-06-22 · Chris RECHAZA el mockup-kit CSS — pivote a componentes REALES

**Chris · ❌ REFUTADO (mockup-kit CSS)** — "no duplicar ni tener artefactos que son solo una foto del momento,
sino código real que sea reutilizado con clases y todo ya 'lista' para copiar y pegar por parte del agente y
ensamblar de forma coherente". Detectó que el `kit.css` re-crea (en CSS) el dropdown lista/detalle que ya existe
como componente real, y que NO renderiza los componentes que tenemos.

**/architect · ✓ APLICADO (auto-corrección)** — tiene razón. El `kit.css` es un espejo estático = duplicación =
"foto del momento" (lo que el canon §5/§6.8 quiere matar). Removí los 4 archivos. El error de mi parte: consolidé
el mirror en vez de eliminarlo. El objetivo real (que el canon ya fija) = **catalogar + renderizar los componentes
REALES de `@luana/ui-kit`**, no un look-alike CSS.

**/architect · 💡 PROPONE (Fase 0 correcta)** — dos piezas, ambas sobre lo REAL:
- **Catálogo generado del source REAL** (`@luana/ui-kit/src`): por componente → import real + props (de TS) +
  snippet de uso/composición "listo para copiar-pegar, con clases reales". Des-gated (lee source, emite md/json).
- **Showcase que renderiza los componentes REALES** (canon §5: route en app real / Storybook) — "lo que ves ES lo
  que es", cero drift. Mata los 9 `_shared.css` porque los mockups se componen de lo real (o el showcase ES el SSoT visual).
- **Falta tu decisión:** host del render vivo (route vs Storybook vs catálogo-solo-ahora · respeta el gate Fase 1).

**Chris (decisión 7 · render host) · ✓ APLICADO** — eligió **Storybook en `@luana/ui-kit`**. /architect cerró el
ready package Fase 0 reducido: `06-tickets.yaml` (T-1 catálogo · T-2 Storybook · T-3 drift-lint) + `04-validators.yaml`
(técnica). **Storybook = la superficie del per-component visual-review gate** (Batch 1→2→3 se revisan navegando
Storybook · cero CSS mirror). Catálogo = índice máquina (props viven en Storybook autodocs, no se duplican).
state=refined→ready. **AWAIT Chris:** ¿arranco /dev-team con T-2 (Storybook, lo que vas a VER) o querés revisar el
06-tickets primero?

### 2026-06-22 · T-2 batch-1 (lista/detalle) construido — Storybook UP para review

**Chris (decisión 8 · go) · ✓ APLICADO** — "go, arrancá con T-2 storybook" + 2 requisitos: (a) revisaré cada
componente hasta que esté bien (per-component review), (b) cada componente debe tener un "cuándo es mejor usarlo".
Ambos cableados en T-2 (review_protocol + sección "Cuándo usarlo" por story + validator sb_when_to_use).

**/dev-team (builder-frontend) · ✓ APLICADO** — Storybook 10 en `core/@luana/ui-kit` (framework `@storybook/nextjs`,
espejo del setup que ya funciona en vitalia) + 4 stories del grupo lista/detalle que **importan los componentes
REALES de `../src/`** (anti-mirror verificado) + autodocs (props reales) + "Cuándo usarlo"/"Cuándo NO" por story.
Commit `55fd599e` (13 files, platform-only → promote-candidate al cierre). Gates GREEN (build-storybook EXIT=0,
2 checks PASS, vitalia tsc regresión EXIT=0) — re-verificados por mí, no solo claim del builder.

**/dev-team · 💡 PROPONE** — Storybook UP en http://localhost:6007. **AWAIT Chris:** revisar los 4
(EntityWorkspaceLayout/EntitySubNavBar/EntityPicker/EntityInfoCard) uno por uno → flags/OK. Tras tu OK, el builder
sigue con el resto del set canónico (archetypes/layout-primitives/Select/Badge/Avatar/Group/autosave/TogglePill).

### 2026-06-22 · Chris: "docs vacío" — bug real, fixeado + verificado live por mí

**Chris · ❌ REFUTADO (docs vacío)** — "abrí el storybook y me sale docs vacío, entrá vos mismo y recorrelo y
verificá si es lo que me quieres mostrar realmente". Tenía razón: yo le pedí revisar sin haber MIRADO yo.

**/dev-team · ✓ APLICADO (entré con Chrome + diagnostiqué + fixeé)** — entré a Storybook con Chrome DevTools MCP:
el **canvas de cada story renderiza bien** el componente REAL, pero la **pestaña Docs (autodocs) salía en blanco**
para TODOS (props + "Cuándo usarlo" + código = invisibles). Causa: Storybook 10 ya NO bundlea el docs addon (era
parte de addon-essentials en SB8); el `main.ts` solo registraba `addon-a11y` → `autodocs: "tag"` rendea vacío
(uncaught promise). Fix: `pnpm add -D @storybook/addon-docs` + registrarlo en `addons`. **Re-verifiqué LIVE con
Chrome** (2 screenshots): Docs ahora rendea completo en EntityInfoCard (simple) y EntityWorkspaceLayout (router) —
"Cuándo usarlo"/"Cuándo NO" + componente real + tabla de props + Copy code + las stories. Commit `9f56820a`.

**/dev-team · 💡 PROPONE (gate gap — learning)** — el validator decía GREEN porque chequeaba `build-storybook
EXIT=0` + el string en el source, NUNCA que la página Docs RENDERIZARA. `build OK ≠ render OK` (mismo patrón que
"GET 200 ≠ verificado"). Para los próximos batches el gate debe verificar el render real (headless check del Docs).
Lo aplico cuando el builder continúe el set. **AWAIT Chris:** revisá los 4 en :6007 (ahora con Docs) → flags/OK.

### 2026-06-22 · Batch 2 (page/layout lego) + gate de render REAL + "seguí con todo"

**Chris (decisión 9) · ✓ APLICADO** — "seguí con el resto del set, absolutamente todo … OJO: cuando tengamos
todo hay que actualizar el harness para que po-ux y todo lo de diseño/UI sepa que hay Storybook; el Storybook (TSX)
debe poder tomarse como HTML para armar el mockup y partir de la misma base; el architect cita qué usar." →
Harness-update CAPTURADO (checkpoint § Harness update, DEFERIDO a cuando el set esté completo, va al CIL — regla
HLP no-mid-build). Cada componente lleva "Cuándo usarlo" (ya cableado).

**/dev-team (builder + yo verificando con Chrome) · ✓ APLICADO** — Batch 2 = 16 stories (layout-primitives +
4 archetypes + Group + autosave). **NO confié en el "GREEN" del builder — entré a Storybook con Chrome y cacé 2
bugs reales:** Docs en blanco (faltaba addon-docs, `9f56820a`) + ListPageScaffold "Con contenido" crasheaba
(`name=` en vez de `title=` → charAt undefined, `9127b111`). **Reescribí el render-gate**: el `_smoke` era
registration-check (index.json) + test-runner muere en SB10 → ahora `_smoke_storybook.mjs` carga cada story
headless en chromium (pageerror/React-error real). **69/69 rendean limpio.** Gate durable en 04-validators.

**/dev-team · 💡 PROPONE** — gate ya confiable → encadeno el próximo batch (átomos + overlays + nav, ~24
componentes) con el render-smoke OBLIGATORIO (el builder debe sacar 100% antes de cerrar). En paralelo podés
revisar los 20 ya hechos en Storybook :6007 (Docs ahora rendean). Quedan después: data/specialized/molecules/shell.

### 2026-06-22 · Batch 3 (átomos + overlays + nav, 24 stories) — verificado 136/136

**/dev-team (builder + yo) · ✓ APLICADO** — Batch 3: 13 átomos (button/input/textarea/label/select/checkbox/
switch/radio-group/badge/avatar/card/separator) + 8 overlays (dialog/popover/dropdown/tooltip/sheet/alert/
alert-dialog/command, todos con story ABIERTA para revisar) + 4 nav (tabs/accordion/collapsible/scroll-area).
Commit `b782905e`. **El render-gate OBLIGATORIO funcionó:** corrí yo mismo build+serve+smoke → **136/136 stories
render clean** (no solo el claim del builder) + Dialog-abierto verificado visual con Chrome. Cero bugs esta vez
(el gate confiable + el builder sabiéndolo de antemano). 44 componentes totales en Storybook (Batch 1+2+3).

**/dev-team · 💡 PROPONE** — **AWAIT Chris:** los 44 están en Storybook :6007 (Docs + Cuándo-usarlo). ¿Continúo
el batch FINAL (data/specialized/molecules: calendar/chart/table/slider/progress/sonner/currency-selector/
timezone-select/smart-datetime-picker/rich-select/form/CollapsibleSection/detail-panel/inline-editable/
loading-button/field-info/highlighted-text/brand-icons + el **shell organism** Ribbon/ShellLayout/etc. — más
complejo, quizá pase propia) o querés revisar los 44 primero?

### 2026-06-22 · Batch 4 (FINAL no-shell, 19 stories) — verificado 200/200 + chart fix + 1 src bug cazado

**/dev-team (builder sonnet + yo verificando con Chrome) · ✓ APLICADO** — escrito el batch FINAL no-shell (19
stories). **63 componentes totales en Storybook.** No confié en el GREEN del builder: corrí yo el render-smoke
(**200/200 render clean**) + spot-check con Chrome de los render-riesgosos (chart/table/calendar/sonner). El Chrome
cazó 2 cosas que el smoke NO ve (montar sin crashear ≠ rendear bien):
- **chart con barras NEGRAS** → `preview.css` no tenía `--chart-1..5` (la story está bien, usa `var(--chart-N)`
  como manda el canon). Lo arreglé en `.storybook/preview.css` (config, NO src). Re-verificado: barras cian+púrpura ✓.
- **calendar con días apretados** → **src bug Tailwind v4** (`h-[--cell-size]` sintaxis v3, rota en v4; afecta la
  app real). `forbidden_to_touch: src/**` → NO lo toqué, ticket aparte (checkpoint § Src bugs).

**/dev-team · 💡 PROPONE** — **AWAIT Chris:** revisá los 63 en Storybook :6007 (per-component). Después arranco el
**SHELL organism** como pase propio (createShellStore + decorator de store/routing — el más complejo). 3 src bugs de
`@luana/ui-kit` flaggeados (calendar v4 · timezone-select tsc · jest-dom tsconfig) → `/pm-luana` triage, ticket aparte.
¿Y los ~8 commits platform-only sin promover: `make promote-to-main + sync-all` ahora o batcheo al cierre?

### 2026-06-22 · SHELL organism increment 1 (3 átomos de chat) — UP para review

**/dev-team · ✓ APLICADO** — arranqué el shell por lo más barato y de-riskeante: los 3 **átomos de chat sin store**
(`MessageBubble`/`DelegateMarker`/`TypingIndicator`, 9 stories). Probé que el color-por-agente RESUELVE en contexto
shell antes de meterme con `ShellLayout` (incremental, no big-bang). Necesité 2 fixes de **config** (NO src): `@source
"../stories"` en preview.css (las clases `bg-agent-*` literales del fixture viven en stories/ → sin esto, gris/negro
como el chart) + keyframe `typing-dot` (mirror de globals.css). Verifiqué yo: render-smoke 209/209 + **Chrome de los 3
estados color** (púrpura/verde/naranja OK). Fixture reusable `stories/_shell-fixtures.tsx` (catálogo demo + switch
literal de clases).

**/dev-team · 💡 PROPONE** — **AWAIT Chris:** revisá los 3 átomos en :6007 (grupo **Shell/Chat**). Tras tu OK sigo con
increment 2 = **ChatPanel** + sub-tree (`ChatHeader`/`ChatMessages`/`ChatComposer`) — éstos SÍ necesitan un decorator
con store mock (`createShellStore` real + chat store mock zustand), por eso pasan aparte. ¿Promuevo los ~9 commits
platform-only a main ahora o batcheo al cierre?

### 2026-06-22 · Chris: "resolvé los 3 src bugs primero, cero bugs en el ui-kit" — RESUELTOS

**Chris (decisión 10) · ✓ APLICADO** — "primero revisá los 3 src bugs, no podemos tener bugs y menos en el luana ui
kit, resolvámoslo aquí, luego continuá con el increment 2". Levantó el `forbidden_to_touch: src/**` para estos bugs.

**/dev-team · ✓ APLICADO (verify-first, no confié en el checkpoint)** — corrí tsc/grep ground-truth antes de tocar:
(1) **calendar v4** `[--cell-size]`→`(--cell-size)` — y el **grep exhaustivo cazó el MISMO bug-class en 4 archivos más**
(popover/select/dropdown/chart, breakage sutil que el render-smoke no ve) → los arreglé todos (cero bare `[--var]` en
src); (2) **timezone** tsc → tsconfig lib/target ES2022; (3) **jest-dom** tsc → setup `/vitest` + `vitest.setup.ts` en
`include`. **Verificado:** tsc **0** · vitest **289/289** · render-smoke **209/209** · Chrome (calendar grilla correcta +
select sin regresión). Son fixes de correctitud (no API) → promueven con los commits DS, sin promotion proposal aparte.

**/dev-team · 💡 PROPONE** — bugs cerrados. Arranco **increment 2** (ChatPanel + sub-tree con store decorator) como
pediste. ¿Promuevo lo platform-only a main ahora o al cierre?

### 2026-06-22 · SHELL increment 2 (chat sub-tree completo) — UP para review

**/dev-team · ✓ APLICADO** — chat sub-tree entero: ChatHeader (agente/web/especialista) · ChatMessages (4-roles /
vacío) · ChatComposer (interactivo) · **ChatPanel** (composite con-conversación / vacío). 8 stories. Resolví el
decorator de stores en el fixture: shell store = el `createShellStore` REAL del kit; chat store = `createSsrSafePersistedStore`
seedeado in-memory (sin hydration → seed estable, cero localStorage — ideal para catálogo). Verifiqué: render-smoke
**217/217** + **Chrome** ChatPanel con-conversación (los 4 roles + color por agente: Valeria púrpura, Sofía verde) +
vacío (empty state). Spanish neutro.

**/dev-team · 💡 PROPONE** — **AWAIT Chris:** revisá el chat sub-tree en :6007 (grupo **Shell/Chat**). Tras tu OK,
increment 3 = **Ribbon/RibbonTab/SubTabsBar/SubSubTabsBar + Supervisor (Sidebar/CollapsedStrip/History) + TopBarShell/
StatusDot/TogglePill** (nav + chrome · menos store, más routing). El más complejo (`ShellLayout` con store+routing
decorator integrado) lo dejo de último (increment 4). ¿Promuevo lo platform-only a main ahora o al cierre?

### 2026-06-22 · Chris: "seguí con inc-3 y luego reviso todo yo" — inc-3 DONE

**Chris (decisión 11) · ✓ APLICADO** — "seguí con el increment 3 y luego hago el review yo mismo de todo".

**/dev-team · ✓ APLICADO** — inc-3 = 9 stories (Ribbon · SubTabsBar · SubSubTabsBar · SupervisorCollapsedStrip ·
SupervisorHistory · TopBarShell · StatusDot · TogglePill · PlaceholderCard). SupervisorSidebar + AppPanelSlot van en
inc-4 (ensamblaje, se ejercen vía ShellLayout). **El render-smoke cazó un bug real:** `react-docgen-typescript` estampa
`displayName`/`__docgenInfo` enumerables en los objetos exportados del fixture → SubTabsBar (que hace Object.entries)
crasheaba. Lo diagnostiqué con un probe en Chrome + lo arreglé (Record limpio desde el array de slugs). Verifiqué con
Chrome los 4 de riesgo (Ribbon color+activo · SubTabsBar · SubSubTabsBar · SupervisorHistory). render-smoke 235/235.

**/dev-team · 💡 PROPONE** — **AWAIT Chris (tu review completo):** revisá TODO en :6007 — grupos **Shell/Chat** (inc-1+2)
+ **Shell/** (Ribbon/SubTabsBar/SubSubTabsBar/SupervisorCollapsedStrip/SupervisorHistory/TopBarShell/StatusDot/
TogglePill/PlaceholderCard, inc-3). Tras tu OK armo inc-4 = **ShellLayout** completo (el composite con todo integrado) +
SupervisorSidebar (3 estados) + AppPanelSlot. ¿Promuevo lo platform-only a main ahora o al cierre?

### 2026-06-22 · SHELL increment 4 (ShellLayout + SupervisorSidebar + AppPanelSlot) — SET COMPLETO, UP para review

**Chris (decisión 12 · go inc-4) · ✓ APLICADO** — "Arrancá inc-4 ya" (sin esperar su review de 1+2+3).

**/dev-team · ✓ APLICADO** — cerré el shell con el ensamblaje final (autoreado por mí, integración intrincada). 3 stories,
12 estados: `ShellLayout` (Valeria-chat default · Lisa color+N3 · Diego color · cerrado tira-avatar · chat+historial) ·
`SupervisorSidebar` (A-tira / B-chat / C-historial / drawer-móvil) · `AppPanelSlot` (Valeria sin-N3 / Lisa con-N3 /
skeleton). **El render-gate cazó un bug real** (8/247 rojas): exportar el clean-subtabs como objeto desde el fixture lo
hacía estampar por react-docgen (mismo trap de inc-3) → lo convertí a función `buildCleanSubtabs()` (resultado a const
local no-exportado). Cosmético: `splitGroupId` propio por story (el ancho del split bleedeaba entre stories). **No confié
en el smoke — Chrome screenshot de cada estado** confirmó contenido real (composite entero · color por agente · N3 ·
tira-avatar · estado-C 3-columnas · drawer móvil 414px · AppPanelSlot N1+N2+N3). render-smoke **247/247** · tsc **0**.

**/dev-team · 💡 PROPONE** — **AWAIT Chris (review COMPLETO):** el set Storybook está **100%** en :6007 (todos los Shell/* +
los 63 no-shell). **Precondición del harness-update cumplida.** Tras tu OK: (1) capturo el harness-update al CIL vía
`/harness-issue` (po-ux/ux-agentico/architect parten de Storybook) · (2) T-1 catálogo + T-3 drift-lint · (3) promuevo lo
platform-only a main. ¿Promuevo ahora o al cierre? ¿Arranco T-1/T-3 o esperás tu review primero?
