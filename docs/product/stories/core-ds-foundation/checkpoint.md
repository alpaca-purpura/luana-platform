---
story_id: core-ds-foundation
type: platform-engineering                          # engine @luana/ui-kit + harness (catálogo/mockup-kit/lint). NO brand UI.
owner: /pm-luana
state: developing
phase: AWAIT_CHRIS_VERIFY                            # Set NO-shell COMPLETO (63 · en main fc2795b8). SHELL organism EN CURSO (incremental): increment 1 = 3 átomos de chat (MessageBubble/DelegateMarker/TypingIndicator · 9 stories · 209/209 render-smoke + Chrome color-verified).
next_action: "Chris revisa SHELL increment 1 (3 átomos chat) en Storybook :6007 · luego increment 2 = ChatPanel + sub-tree (ChatHeader/ChatMessages/ChatComposer · store decorator) · increment 3 = Ribbon/SubTabs/Supervisor · increment 4 = ShellLayout estados · 3 src bugs → /pm-luana triage"
parent_outcome: luana-core-ui-foundation           # docs/product/outcomes/luana-core-ui-foundation.md (§2026-06-07 ya la nombra)
release: null                                       # engine/infra — no entra en release de marca
cap_target: null                                    # infra del design system, no capability de producto
cap_change_type: null
parent_story: null
created: 2026-06-21
priority: HIGH
estimated_effort: Fase 0 (machinery) ~3-5 días · Fase 1 (componentes+showcase) ~2 sem · Fase 2 (arch-test) ~2-3 días

# Contrato visual ratificado (canon = contratos) + per-component visual-review gate (ratificado Chris 2026-06-21)
visual_contract: design-system-canon.md (ratified Chris 2026-06-08) + vitalia-ds-showcase/mockups/showcase.html
ratified_visual_by_chris: true                      # el showcase + canon ratificaron los CONTRATOS del DS
per_component_visual_review_gate: true              # ADD 2026-06-21: cada pieza nueva/consolidada se revisa en el mockup-kit ANTES de build (ADR-003 + R-FID). Ver § Visual-review gate. NO sustituye el canon — lo concreta pieza por pieza.

dependencies:
  hard: []                                          # Fase 0 (machinery) no depende de nada de feature
  soft:                                             # Fase 1 (build de componentes) gatea detrás del shell-lift + stories abiertas (outcome L61/L79)
    - lift-shell-organism-to-core                   # accepted; corre cuando cierren las stories abiertas
gating: |
  Fase 0 (catálogo + mockup-kit + drift-lint + tokens-lock · solo config/tokens/tooling, CERO código de feature)
  PUEDE arrancar YA (outcome L79). Fase 1 (layout-primitives + Entity*/EntityPicker + componentes nuevos
  D11 + showcase route) gatea detrás del shell-lift + stories de marca abiertas (outcome L61).

# Consumers downstream que resumen + promueven HACIA el inventario después de Fase 0
downstream_consumers:
  - vitalia-fase2-mateo-nueva-cita                  # D11 · parked refining/AWAIT_MOCKUP · origen de este scope
  - vitalia-fase2-mateo-vista-semana               # D12 · idea/scaffold · consumer de AvailabilityStrip
  - "{brand}-ds-adoption ×N"                        # Fase 3 (aparte, por marca · /pm-{brand})
---

# core-ds-foundation — Design System foundation (inventory-first)

## Qué es

El build del design system homologado en `core/@luana/ui-kit` + la **maquinaria de inventario** que
lo mantiene al día. Consolida Fase 0+1+2 (canon §4). **Contrato + ejemplos de código = SSoT en
`docs/architecture/luana-platform/design-system-canon.md`** (este checkpoint NO lo duplica — apunta).

**Origen del arranque (2026-06-21):** refinando el mockup de la story vitalia D11 (`vitalia-fase2-mateo-nueva-cita`,
/po-ux) se detectó que el inventario del DS **no es accesible ni mantenible** → causa raíz de la proliferación
de "local" + UX no uniforme cross-brand. Chris ratificó **inventory-first → full core-ds-foundation** como vehículo.

## Diagnóstico de inventario (grounded · recon 2026-06-21)

| Pieza de maquinaria | Estado hoy |
|---|---|
| Catálogo generado de componentes | ❌ no existe — `@luana/ui-kit/src/index.ts` hand-commented · skill `vitalia-design-system` hand-narrado, **cero sync** con el código |
| mockup-kit (mockups componen del shared) | ❌ no existe — **9 `_shared.css` divergentes** copy-paste (vitalia+nicolify) ya driftean |
| drift-lint (FE) | ❌ planned/unbuilt — 368 arbitrary-values en vitalia · anti-duplication FE counterpart **nunca escrito** (BE-only) |
| /showcase route | ❌ static HTML only (canon §5 lo quiere ruta viva) |

## Fases

| Fase | Objetivo | Contenido | Gating |
|---|---|---|---|
| **0 — MACHINERY** (inventory-first) | que el inventario sea **mantenible** antes de promover nada | (1) **catálogo generado** desde `ui-kit/src/index.ts` (+ átomos de marca) → md/json que leen el skill `vitalia-design-system` + cockpit + `/architect` + `/po-ux` (mata el hand-narration + el "spawneá un agente para leer index.ts"; **alimenta** el lint) · (2) **mockup-kit** = UN stylesheet/kit mockup canónico que las stories `@import` en vez de copiar `_shared.css` + back-port de los 9 `_shared.css` (fidelidad-por-construcción, R-FID) · (3) **drift-lint** = eslint `no-arbitrary-value` + arch-test FE no-div-layout / no-reinvento-de-componente-catalogado (FE counterpart de `anti-duplication`) · (4) escala de spacing tokenizada en `@luana/design-tokens` | ✅ puede arrancar YA (solo tooling/tokens) |
| **1 — COMPONENTES** | construir el lego | ~10 layout-primitives (Page/Header/Section/Toolbar/FilterBar/Empty/Error/Detail/Form/EntityWorkspaceLayout) + `EntityInfoCard`/`EntityPicker`/`EntitySubNavBar` + page-archetypes + **/showcase route viva** + los **deltas D11** (abajo) | ⛔ gatea tras shell-lift + stories abiertas |
| **2 — ENFORCEMENT** | que no driftee nunca | arch-test FE (ratchet shrink-only) + `frontend-visual-fidelity` D1 mecánico | tras Fase 1 |

## Deltas de componentes (del audit D11 · aplicar el test del 2º-consumidor)

- 🚀 **PROMOVER genérico a `@luana/ui-kit`** (Fase 1):
  - `SegmentedControl`/`ToggleGroup` — **consolida el duplicado existente** `.toggle-pill` (Día/Semana/Mes) + `.segmented` (Canal). Un solo atom.
  - `EntityRow`/`EntityChip` — un molecule que cubre patient-chip + doc-suggest rows + typeahead items (misma forma ×3).
  - `PageHeader` con **slot de back-affordance** — el patrón "hoja alcanzada desde un padre". **NO es `EntitySubNavBar`** (eso es entity-workspace; la trampa del mockup que decía "espeja EntitySubNavBar").
- ✅ **REUSAR, no crear** (lo enforça el drift-lint + catálogo): `avail-chip` + `dur-badge` → variantes semánticas de `Badge`/status-pill. Matar el local.
- 🟡 **vitalia-shared (NO core aún, NO features/mateo local):** `AvailabilityStrip`/day-timeline — nace en vitalia (D11 AC-8 + D12 vista-semana = ≥2 consumers), lift-candidate al 2º brand. **/pm-vitalia** lo owna (handoff).
- 🟡 **ADAPT + flag (1 consumer, no abstraer):** `ComputedField` (disabled Input + hint) — promotion-candidate al 2º consumer.

## Visual-review gate (per-component · Batch 1→2→3 · ratificado Chris 2026-06-21)

Cada pieza **nueva o consolidada** del shared se revisa VISUALMENTE en el mockup-kit **ANTES** de construirla
en `@luana/ui-kit` (ADR-003 mockup-per-component + R-FID). El canon ratificó los *contratos*; este gate ratifica
cada *render concreto*. Las piezas se etiquetan **EXISTS / MODIFY / CREATE / REUSE / ADAPT** para que la revisión
sea "mirar + tocar", no "aprobar un rebuild". **Cardinal:** MODIFICAR lo existente, NO reinventar · crear SOLO lo
que falta · cero abstracción especulativa (nada de interface/factory/config para 1 uso).

Orden — un artefacto reviewable por batch:

- **BATCH 1 — mockup-kit (el sustrato; primero).** `[MODIFY/consolidar]` unificar los **9 `_shared.css`** divergentes
  en UN mockup-kit canónico (mejor como base + dedup), espejo de `vitalia/frontend/src/app/globals.css`, **derivado
  de la fuente única de tokens** (`@luana/design-tokens`, no copia → no driftea). Chris lo aprueba **una vez** → es el
  lienzo del resto. Cero tokens/clases inventadas.
- **BATCH 2 — layout-primitives (MAYORÍA EXISTE → review-only, casi cero build).** PageContainer · PageHeader ·
  PageSection · PageContentStack · Toolbar · FilterBar · EmptyState · ErrorState · Pagination · DetailLayout ·
  FormLayout · skeletons · page-archetypes · EntityWorkspaceLayout · EntitySubNavBar · EntityInfoCard · EntityPicker ·
  Select · Badge · Avatar. Se revisan **todos juntos** en la `/showcase` viva (o render del mockup-kit) — una pantalla,
  confirmar. Polish cosmético solo si Chris lo flagea. **NO se reconstruyen.** Único `[MODIFY]`: **`PageHeader` → slot
  de back-affordance** (D11 "hoja alcanzada desde un padre"; **NO es `EntitySubNavBar`**; add de prop, no componente nuevo).
- **BATCH 3 — deltas D11 (lo nuevo · review UNO POR UNO con su mockup ANTES de construir):**
  - `SegmentedControl`/`ToggleGroup` `[CREATE/consolidar]` — reemplaza `.toggle-pill` (Día/Semana/Mes) + `.segmented` (Canal). Crear una, matar dos.
  - `EntityRow`/`EntityChip` `[CREATE/consolidar]` — cubre patient-chip + doc-suggest rows + typeahead items. **Antes de crear: chequear si es extraíble del item-render de `EntityPicker`** (no duplicar).
  - avail-chip + dur-badge `[REUSE · cero create]` — variantes semánticas de `Badge`/status-pill. Literal usar `Badge`.
  - `AvailabilityStrip`/day-timeline `[CREATE · vitalia-shared, NO core aún]` — genuinamente nuevo, UN molecule. Nace en vitalia (≥2 consumers D11+D12), **`/pm-vitalia` owna**, lift-candidate después.
  - `ComputedField` `[ADAPT · sin abstracción]` — disabled Input + hint inline. Extraer a componente recién al 2º uso.

## ★ Harness update — DEFERIDO (aplicar cuando TODO el set esté en Storybook · pedido Chris 2026-06-22 "OJO")

Cuando Storybook cubra **absolutamente todos** los componentes, actualizar el harness para que el flujo de
diseño funcional/UX/discovery sepa que Storybook EXISTE y parta SIEMPRE de la misma base:

- **`/po-ux` + `/ux-agentico` + quien toque diseño/UI**: el SSoT visual = Storybook. Para armar un mockup, NO
  se inventa CSS ni se copia `_shared.css` — se **parte del HTML renderizado de las stories** (vía
  `build-storybook` → `storybook-static/` · cada story es DOM real). El componente es TSX pero po-ux lo consume
  **como HTML** para componer el mockup → misma base que el build.
- **`/architect`**: al cerrar el spec, cita **qué componente/story usar + cómo** (link a la story) → el ready
  package nombra el lego exacto. "Lo que ves en Storybook = lo que se programa".
- **Mecanismo a definir** (parte del harness update): cómo exactamente po-ux toma el HTML de una story
  (storybook-static export · iframe `viewMode=story` · addon que exporte HTML). Resolver al aplicar.
- **Reemplaza/reencuadra**: `shell-mockup-per-component.md` (vitalia+nicolify · hoy = `_shared.css` espejo CSS) +
  `frontend-visual-fidelity.md` D1 + skills po-ux/ux-agentico/architect. Es un cambio cross-harness → va al CIL
  (`/harness-issue` → harness-backlog) y se ejecuta en lote, NUNCA mid-build (regla HLP).
- **Precondición HARD:** set Storybook COMPLETO (este es el gate para arrancar el harness update).

## Src bugs encontrados durante T-2 (anotar, NO fixear — `forbidden_to_touch: src/**` · ticket aparte · `/pm-luana` triage)

El visual-review gate manda: bug de componente → anotar + ticket aparte, jamás editar `src/` desde una story.

1. **`src/calendar.tsx` — roto bajo Tailwind v4** (SEV alta · afecta también la app real, no solo Storybook). Usa la sintaxis v3 de arbitrary-var `h-[--cell-size] w-[--cell-size]` (líneas 48,53,57,83,126,168) — en v4 eso emite `width: --cell-size` (inválido, sin wrap `var()`) → las celdas colapsan a ancho-de-contenido → días apretados ("14151617181920"). Fix v4: `h-(--cell-size)` / `w-(--cell-size)` (o `[var(--cell-size)]`). `smart-datetime-picker` lo consume → mismo síntoma. (Lo cazó la screenshot con Chrome; el render-smoke NO lo ve — monta sin crashear.)
2. **`src/timezone-select.tsx` — tsc** `Intl.supportedValuesOf` sin tipar en `lib.dom.d.ts` (requiere `lib: ["ES2022"]`) + `any` implícito en el `.map`. Pre-existente. (build-storybook/runtime OK; solo `tsc --noEmit` del package se queja.)
3. **`src/__tests__/**` + `tests/**` — tsc** matchers de `@testing-library/jest-dom` no registrados en tsconfig (`types`/setup). Pre-existente.

Polish menor (story-level, decisión de Chris en review): los stories de `calendar`/`smart-datetime-picker` rendean los labels de mes/semana en inglés (no se pasó `locale={es}`).

## Handoffs requeridos (anti-creep — `/pm-luana` NO los ejecuta)

- **/pm-vitalia** — parkear D11 (anotar soft-dep nueva → core-ds-foundation en `vitalia/.../vitalia-fase2-mateo-nueva-cita/checkpoint.md`) · ownear `AvailabilityStrip` vitalia-shared + `{brand}-ds-adoption`.
- **/architect** (`<brand>: platform`) — ready package de core-ds-foundation tras ratificación de scope de Chris.
- **/harness-issue** — capturar el hallazgo "inventario sin catálogo vivo + mockups driftean por copia" al CIL (no se toca `docs/process/harness-backlog.md` directo — lo tiene otra sesión).

## Bitácora

- **2026-06-21 — /pm-luana: scaffold.** Story creada (no existía). Disparada por el audit UI de D11 (/po-ux) + ratificación de Chris "inventory-first → full core-ds-foundation". Scope = Fase 0 machinery (catálogo + mockup-kit + drift-lint + tokens-lock) primero + Fase 1 componentes (incl. deltas D11) + Fase 2 arch-test. Contrato durable = `design-system-canon.md`. state=refining, phase=AWAIT_CHRIS_RATIFY_SCOPE.
- **2026-06-22 — /dev-team (verify loop): Batch 2 (16 stories) + Docs-addon fix + render-gate real + 1 crash fixeado.** Construido el page/layout lego (layout-primitives + archetypes + Group + autosave). **Bugs reales cazados entrando yo a Storybook con Chrome (no confiando en el "GREEN" del builder):** (1) pestaña Docs en blanco para TODOS → faltaba `@storybook/addon-docs` (SB10 ya no lo bundlea) · fix `9f56820a`; (2) `archetypes-listpagescaffold--con-contenido` CRASHEABA (`title.charAt` con title undefined — la story pasaba `name=` en vez de `title=` a EntityInfoCard) · fix `9127b111`. **El gate no los cazaba:** `build-storybook EXIT=0` + el `_smoke` viejo (solo index.json/registration) daban verde; `@storybook/test-runner` muere en SB10 (channel error). Reescribí `_smoke_storybook.mjs` como **render-smoke headless real** (chromium carga cada story, falla en pageerror/React-render-error; sin el falso-positivo del template oculto de SB). **69/69 stories rendean limpio.** Gate durable en 04-validators (`sb_render_smoke`). Learning (verificación real ≠ build verde, extiende verification-real-not-200) → capturar al cierre. **Pendiente:** ~30 componentes restantes (átomos/overlays/data/specialized/shell) en próximos batches, ya con el render-gate confiable.
- **2026-06-22 — /architect: Fase 0 ready package cerrado (approach corregido · componentes REALES).** Chris eligió **Storybook en `@luana/ui-kit`** como host de render vivo. Package reducido (technical-story): `06-tickets.yaml` (T-1 catálogo generado del source real · T-2 Storybook render-real centerpiece · T-3 drift-lint no-arbitrary + arch-test no-reinvento) + `04-validators.yaml` (verification_nature: técnica · verificación-por-efecto). **Storybook = la superficie del per-component visual-review gate** (Batch 1 base · Batch 2 review-only navegando Storybook · Batch 3 deltas como stories nuevas antes de merge) — reemplaza el preview.html CSS muerto. Catálogo = índice máquina (no duplica props · viven en Storybook autodocs). tokens-scale = verify-only (ya existe). **state=refined→ready.** **Próximo:** /dev-team build (T-2 centerpiece).
- **2026-06-22 — /architect: mockup-kit CSS = approach EQUIVOCADO (revertido).** Construí un `kit.css` brand-agnostic var()-based (consolidando los 9 `_shared.css`) + `tokens.vitalia.css` + `preview.html`. **Chris lo rechazó (correcto):** es un **espejo CSS estático** que re-implementa (`.ecard`/`.epicker`/`.entitynav`) componentes que YA EXISTEN como código real (`EntityInfoCard`/`EntityPicker`/`EntityWorkspaceLayout` en `@luana/ui-kit`) → duplicación + "foto del momento" que driftea. NO renderiza los componentes reales. Es exactamente el "el HTML miente" que el canon §5/§6.8 quiere MATAR, no consolidar. **Archivos removidos.** El error: traté "9 _shared.css → 1" como el objetivo, cuando el objetivo real es **eliminar el espejo y renderizar/catalogar los componentes REALES**. Recon válido que sobrevive: los componentes Fase 1 (Entity*/Picker/archetypes/layout/TogglePill/autosave) + tokens-scale (`@luana/design-tokens` 0.2.0) YA EXISTEN → Fase 0 real = catálogo de lo REAL + render vivo de lo REAL (no un mirror). **AWAIT Chris:** elegir el host de render vivo (showcase route vs Storybook vs catálogo-solo-ahora) → produzco el ready package Fase 0 correcto.
- **2026-06-22 — /dev-team: Batch 4 (FINAL no-shell · 19 stories data/specialized/molecules) + chart-token fix.** Cerrado el set NO-shell: skeleton(base) · progress · slider · loading-button · field-info · highlighted-text · brand-icons · sonner · table · chart · calendar · currency-selector · timezone-select · smart-datetime-picker · rich-select · form · CollapsibleSection · detail-panel · inline-editable. **63 componentes totales en Storybook** (44 + 19). builder-frontend (sonnet) escribió las stories; **YO verifiqué con render-smoke + Chrome (no confié en el GREEN del builder): 200/200 stories render clean**. Spot-check Chrome cazó lo que el smoke NO ve (monta sin crashear ≠ rendea bien): **(a) chart con barras TODAS NEGRAS** → preview.css no definía `--chart-1..5` (la story es correcta, usa `var(--chart-N)` per canon; preview.css estaba incompleto) → agregué la paleta de chart a `.storybook/preview.css` (config, NO src) → re-verificado: barras cian+púrpura ✓; **(b) calendar con días apretados** → src bug Tailwind-v4 (`h-[--cell-size]` v3 → roto en v4 · afecta la app · ticket aparte, ver § Src bugs). table/sonner/currency/timezone/detail-panel = limpios y fieles. Commit pathspec (19 stories + preview.css). **Pendiente: SHELL organism (pase propio, el más complejo) + per-component review de Chris + harness-update (deferido al set 100%, ahora con shell falta).**
- **2026-06-22 — /dev-team: SHELL organism increment 1 (3 átomos de chat · pure-props · de-risk del color).** Arranqué el shell por los **átomos sin store/routing** (no big-bang): `MessageBubble` (bot/user/conversación) · `DelegateMarker` (handoff Valeria→especialista, modo Mantener/Multiplicar) · `TypingIndicator` (escribiendo / acción concreta / color por agente). 9 stories nuevas. Las escribí yo directo (3 archivos chicos, contexto ya cargado — spawnar builder+verificar+fixear era más caro). **Fixture compartido** `stories/_shell-fixtures.tsx` (catálogo demo brand-agnostic + `getDemoAgentClasses` **switch literal** — reusable por los próximos increments). **2 fixes de config (NO src) que el shell necesitaba:** (1) `@source "../stories"` en `.storybook/preview.css` — el JIT solo escaneaba `../src`; las clases `bg-agent-*` literales del fixture viven en `stories/` → sin esto salían gris/negro (mismo trap que el chart-negro); (2) keyframe `typing-dot` mirroreado verbatim de vitalia globals.css (el kit solo shippea el markup). **Verificación REAL (no confié en el smoke):** render-smoke `209/209 clean` + **Chrome screenshot de los 3 estados color-críticos** → Valeria púrpura · Lisa verde · Diego naranja resuelven (soft bg + nombre + dots + avatar pill + burbuja user agent-color). El smoke NO ve color (monta sin crashear) — el Chrome confirmó que el `@source` fix funciona. Commit pathspec (5 archivos kit + 2 docs · platform-only → promote-candidate). **AWAIT Chris:** revisá los 3 en :6007. Después increment 2 = ChatPanel + sub-tree (necesita decorator de store mock — más complejo).
- **2026-06-21 — /pm-luana: scope ratificado + visual-review gate registrado.** Chris ratificó el scope consolidado **as-is** + el **per-component visual-review gate** (Batch 1→2→3, ADR-003 + R-FID — cada pieza nueva/consolidada se ve en el mockup-kit antes de build; ver § Visual-review gate). Reconcilia el viejo "no hay nuevo mockup gate": el canon ratificó los contratos, este gate los concreta pieza por pieza. **state=refining→refined, phase=READY_FOR_ARCHITECT.** Decisión de promote: `558cd564` (scaffold, pure platform/docs, cero `{brand}/**`) se **batchea** al cierre de sesión (`make promote-to-main + sync-all`) junto con los commits platform/docs de esta sesión. **Próximo:** `/architect <brand>: platform` → ready package empezando por **Fase 0** (des-gated). Spec-equivalente = `design-system-canon.md` + `design-system-inventory-best-of-best.md` + este checkpoint (esta story NO tiene 01-spec.md, es platform-engineering). Fase 1 sigue gated tras shell-lift + stories abiertas; cada ticket de componente Fase 1 lleva el visual-review gate.
