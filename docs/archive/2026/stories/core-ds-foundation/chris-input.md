# chris-input — core-ds-foundation (ex core-ds-tokens-lock)

> Story platform · Track A · design-system homologation **build CONSOLIDADO (Fase 0+1+2)**. Owner `/pm-luana`. Contrato: `docs/architecture/luana-platform/design-system-canon.md`.

## 💬 Conversación

### 2026-06-07T21:30 · 🤖 claude · `/pm-luana` · 💡 PROPONE
Abrí la story platform `core-ds-tokens-lock` (Track A / Fase 0) desde el HANDOFF. Antes de
proponerte la escala fundé el drift en código real (vitalia/frontend/src) en vez de asumir:

- **650 arbitrary-values totales.** Desglose: font-size `text-[..]` **182** · sizing `w/h/min/max` **189**
  (mucho legítimo) · color `[#hex]` **64** · radius **32** · **spacing (p/m/gap) ~10**.
- **Hallazgo que reencuadra Fase 0:** el spacing **ya está homologado de hecho** (~10 arbitrary,
  dominados por `24px`/`1px`). La premisa del HANDOFF ("Fase 0 = escala spacing") apuntaba al eje
  que MENOS driftea. El drift real (278) vive en **font-size + color-hex + radius** — los tres **ya
  tienen tokens** (display/heading/body · paleta marca · `--radius`), solo falta el **lock**.

Por eso te paso 2 decisiones (cambian el scope de la story):
- **D1 · escala spacing:** recomiendo tokenizar la escala Tailwind 4px-base tal cual (cero migración).
- **D2 · scope del lock:** recomiendo lockear los **ejes tokenizados** (spacing+radius+font-size+color-hex
  = los 278 reales) y **allowlistear w/h sizing** (legítimo: íconos, anchos fijos) para una fase posterior.

Piloto vitalia ya ratificado en el HANDOFF. Esperando tu ratificación para refinar (→ /po contrato → /architect → /dev-team).

### 2026-06-07T21:35 · 🤖 claude · `/pm-luana` · ✓ APLICADO
Ratificaste (AskUserQuestion):
- **D2 scope lock = Ejes tokenizados** → eslint no-arbitrary prohíbe spacing+radius+font-size+color-hex
  (278 drift real); allowlist w/h/min/max sizing (189, legítimo) para fase posterior; ratchet shrink-only.
- **D1 escala = Tailwind 4px-base as-is** (4/8/12/16/20/24/32/40/48/64); migración spacing ~0.
- D3 piloto vitalia (handoff).

Bajadas a `checkpoint.md::ratified_decisions`. State `idea→refining`. Encadeno a `/po` para
producir `01-spec.md` (contrato de tokens + regla eslint + Gherkin de aceptación) → te lo paso a ratificar.

### 2026-06-07T21:45 · 🤖 claude · `/po` · ✓ APLICADO
Escrito `01-spec.md` v1 (service/contract story, verification_nature técnica). 4/4 scenarios
(happy/negative/edge/adversarial) + Mapa funcional + Matriz de cobertura.

Al fundar el scope descubrí un matiz que **corrige** mi propio handoff: radius/font/**color** son
**valores per-brand sobre nombres compartidos** (vitalia `--radius:.625rem` vs comunify `.75rem`;
agentes distintos por marca). Por eso Fase 0 **NO fusiona paletas** — solo **spacing** (idéntico
cross-brand) se consolida; el lock de color/radius/font **fuerza clases nombradas** que resuelven
per-brand. Prohibir hex crudo ⇒ token nombrado, NO unificar el valor. Spec scopeado así (RN-5).

3 dudas para ratificar abajo (Q1 cap_target · Q2 mecanismo de escape · Q3 cero-merge-de-paletas).

### 2026-06-07T22:15 · 🤖 claude · `/pm-luana` · 💡 PROPONE
Ampliaste el alcance: no solo lock de tokens, sino (1) plantillas obligatorias por átomo, (2) las
mismas plantillas en `/po-ux` (mockup = lo construido), (3) inventario "best of best" de TODO lo
desarrollado, mostrado antes del OK, para homologar. Esto excede Fase 0 → es el **programa completo
capas 1-4**.

Antes de redactar nada nuevo barrí los 3 frontends + `@luana/ui-kit` con 5 catalogadores read-only
y extraje el mejor de cada arquetipo. Resultado en
`docs/architecture/luana-platform/design-system-inventory-best-of-best.md` (SSoT del programa).

Ganadores: **átomos** = `@luana/ui-kit` es canónico pero desincronizado (liftear input/textarea/badge
de vitalia, dropdown/tooltip de nicolify; exportar checkbox/switch/card/popover que las marcas
reinventan). **N3 lista/detalle** = nicolify `EntityWorkspaceLayout` (SSR-safe, store-free, props
mínimas). **Info-agrupada+autosave** = contenedor nicolify `Group` + autosave vitalia (600ms+coalesce)
+ indicador flotante vitalia. **Cajas de entidad** = anatomía de 8 slots, base vitalia `StaffCard`.
**Scaffolding de página** = solo 2/10 existen (EmptyState+Skeleton); faltan PageHeader/Section/Toolbar/
ErrorState/Pagination/archetypes (~208 divs de padding a mano).

Mecanismo de plantilla obligatoria + atado de `/po-ux`: un showcase/Storybook de `@luana/ui-kit` +
mockup-kit derivado de los mismos tokens + page archetypes (rellenar slots, no maquetar) + lint/arch-test
que prohíbe maquetar a mano. Reestructura en 5 stories (Fase 0 lock ya abierta + atoms-sync +
layout-primitives + poux-kit + adopción comprehensiva por marca).

4 ratificaciones pedidas en el doc (§ "Qué necesito que ratifiques"): picks canónicos · alcance
comprehensivo · orden vs las 4 stories abiertas · slots de EntityInfoCard. Esperando tu review.

### 2026-06-07T22:50 · 🤖 claude · `/pm-luana` · 💡 PROPONE
Revisé también los **mockups** (auditoría completa, doc § ADDENDUM). Respuesta a "¿parten de lo
mismo en esencia?": **parcialmente, y NO por construcción.** Los de servicios+cuenta portan el shell
fiel pero vía `_shared.css` **copiado a mano** de `globals.css` → ya driftó (`--agent-mateo` 56° vs
real 53°). Los de doctores+embudo (8) están **aislados** (sin shell, HEX hardcoded). Fidelidad por
disciplina, no por construcción.

Hallazgo: el requisito que pediste (mockup dentro del shell + tokens espejo) **YA EXISTE** como
`ADR-vitalia-003`, pero (a) vitalia-only, (b) fidelidad por copia (driftea), (c) los tokens reales ya
están **duplicados** (`globals.css`: dos `--radius` 0.625 vs 0.5 + sistema `--vitalia-*` legacy en
paralelo al Shadcn). La "fuente única" no es única.

Cementé 3 requisitos al programa: **R-FID** (ratificar = HTML fiel por construcción, ideal = ruta de
la app real que renderiza el componente real, no un dibujo) · **R-SHELL** (`/po-ux` siempre dentro del
shell-organism — lift de ADR-003 a platform) · **R-1SRC** (consolidar la duplicación de tokens antes
de declarar fuente única).

Te chaineo a `/pm-vitalia` con TODA la info (como pediste) para que: produzca el **showcase HTML fiel
por construcción** que vas a ratificar, arregle la fidelidad del mockup-kit, coordine el lift a platform,
y arme la story de adopción vitalia. Nada se construye hasta tu OK sobre el showcase.

### 2026-06-08T · 🤖 claude · `/pm-luana` · ✓ APLICADO
Showcase RATIFICADO (8 rondas /po-ux). Cementé el **canon** (`design-system-canon.md`, contratos +
ejemplos de código) + bindeé HARD en rule + /po-ux + /dev-team + /architect + HB-60. Luego me pediste:
*"junta fase 0+1+2 en una sola, no agrandar, pon todo lo aprendido, y cuando la armes pon lo necesario
— no quiero volver a armar lo ya armado."*

**Hecho:** renombré esta story `core-ds-tokens-lock → core-ds-foundation` y la reescribí como el build
ÚNICO (Fase 0+1+2). El `checkpoint.md` ahora tiene:
- **§ scope** (3 fases) · **§ build_inventory** (lo que se construye) ·
- **§ already_done** = lo que **NO se re-arma**: bindings de proceso (canon+rule+skills+HB-60, ya hechos hoy)
  + 40+ átomos de `@luana/ui-kit` incluido **`select.tsx` (ya Shadcn canónico)**, `tooltip` (Provider/Arrow),
  `AutosaveBadge`, `detail-panel`, `skeleton` = **consumir** · EntityWorkspaceLayout/EntitySubNavBar/
  use-autosave/FloatingAutosaveIndicator/EntityInfoCard/Group = **lifts** (generalizar lo existente), no from-scratch.
- **§ ratified_decisions** D1-D11 (Fase 0 + canon del showcase).

Repointé las refs (canon §4, inventario, HB-60) a la story única. Fase 3 (adopción por marca) queda aparte.

**Para tu conversación nueva:** `/architect brand: platform core-ds-foundation` → lee el canon + este
checkpoint → ready package. NO re-arma lo de `§ already_done`. El `01-spec.md` de esta carpeta es el viejo
(Fase-0 tokens); el architect lo expande o /po lo rehace al scope consolidado.

### 2026-06-08T · 🤖 claude · `/pm-luana` · ✓ APLICADO
Dejé el **handoff** `HANDOFF-next-session.md` (en esta carpeta): esencia + 3 SSoT a leer en orden +
§ NO-rehacer + § construir + flujo completo a DONE (/architect→/dev-team→/auditor→merge) + guardrails +
el **prompt para pegar** en la conversación nueva (al final del handoff). Todo en disco (uncommitted) →
la sesión nueva lo ve. Apuntá a `/pm-luana` con ese prompt y corre el build del core hasta done.

### 2026-06-08T · 🤖 claude · `/pm-luana` · ✓ APLICADO
Bootstrap de `core-ds-foundation` (state=refining, brand=platform, track A). Leí los 3 SSoT
(HANDOFF + checkpoint + design-system-canon.md). **Verifiqué en disco § already_done** (anti-rehacer):
`@luana/ui-kit` ya tiene select.tsx/tooltip.tsx/AutosaveBadge.tsx/detail-panel.tsx · lift bases existen
(vitalia use-autosave + FloatingAutosaveIndicator · nicolify EntityWorkspaceLayout + EntitySubNavBar) ·
`@luana/design-tokens` hoy solo z-index → confirma que falta la escala completa (trabajo real). Nada stale.
**Step 0 gate:** las 3 stories abiertas (adrian-embudo/lisa-doctores/abel-icp) son jurisdicción de marca
+ explícitamente out-of-scope per HANDOFF — track A es independiente, no las toco. WIP-cap libre (módulo
`core/@luana/*` distinto). **Encadeno a `/architect brand: platform core-ds-foundation`** para producir el
ready package (03-arch+04-validators+05-guidelines+06-tickets) consumiendo el canon. El architect propondrá
`autonomous_mode` para tu ratificación antes de correr a done.

### 2026-06-08T · 🤖 claude · `/architect` · ✓ APLICADO
Ready package cerrado (`refining → ready`). 5 artifacts: 03-arch.md + 03-arch-fe.md + 04-validators.yaml +
05-guidelines.md + 06-tickets.yaml (9 tickets ≤10) + dispatch-plan.md. **FE-only platform** (sin BE/agentic).
DAG: T-1 tokens+R-1SRC → T-2 lint+ratchet+arch-tests · T-1 → T-3 layout-primitives → {T-4 EntityWorkspace+SubNav lift,
T-5 EntityInfoCard lift, T-6 EntityPicker net-new, T-7 autosave+Group lift} → T-8 archetypes · {T-2,T-8} → T-9 /showcase live-verify.
Todos builder-frontend/Sonnet (sin Opus — no agentic). **NO-NEW-LAYER audit:** useAutosave = EXTEND (`@luana/hooks`, no hook
paralelo) + no-hardcoded-hex = EXTEND test existente + EntitySubNavBar/EmptyState = lift-to-core resuelve mirror cross-brand
(sancionado). EntityPicker query-lib-agnostic (`searchFn` prop, sin dep react-query en ui-kit). Live-verify R-FID = /showcase
en localhost:3002 (Chrome MCP, consola 0 errores). **autonomous_mode: true PROPUESTO** (low-risk técnico).

### 2026-06-08T · 🤖 claude · `/pm-luana` · ⚠️ DUDA
**GATE — requiere tu ratificación antes de arrancar /dev-team** (architect propone, vos ratificás):
1. **autonomous_mode** — ¿corro el build a DONE sin pausas (G saltada, live-verify automatable) o pauso en cada gate?
2. **Open Questions técnicas (03-arch §16, todas con recomendación del architect):** Q1 EntityPicker windowing =
`@tanstack/react-virtual` (dep workspace existente) en vez del `react-virtuoso` ilustrativo del canon · Q2 crear package
net-new `@luana/eslint-config` (vs regla custom local en vitalia) · Q3 R-1SRC = aliasar `--vitalia-*` → tokens Shadcn
(no-breaking, 85 consumers) en vez de borrar/migrar. Architect recomienda: react-virtual + sí-package + aliasing.
Te lo presento por AskUserQuestion.

### 2026-06-08T · 🧑 Chris · ratificación (vía AskUserQuestion)
1. **autonomous_mode: true** — correr el build a DONE sin pausas.
2. **Open Questions: las 3 ratificadas** — Q1 @tanstack/react-virtual · Q2 crear @luana/eslint-config · Q3 R-1SRC aliasing.

### 2026-06-08T · 🤖 claude · `/pm-luana` · ✓ APLICADO
Registré en checkpoint: `autonomous_mode: true` RATIFICADO + `open_questions_resolved` (Q1/Q2/Q3) + next_action.
**Encadeno a `/dev-team` (brand: platform, autonomous_mode: true)** para construir los 9 tickets TDD →
developed (live-verify /showcase localhost:3002) → auto-handoff /auditor → /pm-luana merge. Te aviso al cierre
de DONE o si algo se traba (cap iter 10/ticket · audit 3 rounds · walltime ~4h).

### 2026-06-08T · 🤖 claude · `builder-frontend` · ✓ APLICADO
**T-1 (tokens scale + R-1SRC) — tests-passing.** Commit `2b7932e4`, pushed `wip/vitalia`. 11 files.
- **TOKENS** `@luana/design-tokens`: `spacing.ts` (Tailwind 4px scale AS-IS, identical cross-brand VALUE — D1/RN-4)
  + `radius.ts`/`typography.ts`/`color-names.ts` (shared NAME contract only, NO values — RN-5, paletas nunca fusionadas).
  frozen-const idiom (= z-index.ts) + barrel index.ts + package.json exports/test script. Canon header en cada .ts.
- **R-1SRC** (Q3 aliasing, additive/non-breaking): `globals.css` → un solo base `--radius` (Shadcn .625rem kept;
  legacy .5rem borrado); `--vitalia-*` brand-core color vars → **aliases** de tokens Shadcn (cian→primary,
  purpura→accent, amarillo→agent-mateo, azul-marino→agent-camila) → ~85 consumers siguen renderizando.
  verde-lima literal (sin equiv Shadcn). `--vitalia-*` NO borrados (Fase 3).
- **TDD RED-first**: F-1 design-tokens scale (12/12) + F-2 vitalia single-token-source arch fitness (6/6). GREEN.
  tsc EXIT=0 (design-tokens + vitalia frontend) · eslint EXIT=0. T-1-gating ratchets (page_padding 3 + no-vt-classes 1) GREEN.
- 3 arch test FILES rojos pre-existentes (embudo/inbox `hsl(` literals + stale inbox allowlist) — `git status` vacío
  en esos paths → NO regresión T-1; mi diff toca design-tokens + globals.css (exento color-test) + 2 tests.
- Live-verify R-FID (/showcase localhost:3002 Chrome MCP) NO aplica a T-1 (tokens+CSS, sin surface ejercible) — gate vive en T-9.
- Resultado: `T-1-result.md`. **Awaiting orchestrator → gate-runner → auditor-frontend (verdict independiente).**

### 2026-06-08T · 🤖 claude · `builder-frontend` · ✓ APLICADO
**T-2 (enforcement: no-arbitrary lock + ratchet arch-tests + vitalia pilot) — tests-passing.**
- **NEW pkg `core/@luana/eslint-config`** (flat-config ESLint 9): rule `no-arbitrary-value` LOCKS `{spacing,radius,font-size,color-hex}` arbitraries; actionable token suggestion (D2/AC-2); sizing allowlist `w/h/min-w/max-w/min-h/max-h/size/basis` (RN-1/AC-3); named escape `// ds-lock-allow:` (RN-6/SC-4); tokenized `var()/hsl()/oklch()/color-mix()` bypass. RuleTester 25 cases GREEN.
- **Vitalia pilot (D3)**: `eslint.config.mjs` wires `@luana/ds/no-arbitrary-value: error` on `src/**` + `off` on `DS_LOCK_BASELINE` (48 pre-existing files → NF-2 build not broken). `package.json` += `@luana/design-tokens` + `@luana/eslint-config` (workspace:*). Probe confirmed lock fires (4 errors w/ suggestions).
- **arch-tests (TDD, shrink-only seeds MEASURED)**: F-3 lock 16/16 · F-4 ratchet 8/8 (font 82 · radius 7 · spacing 4 · hex 0) · A-1 native-select 3/3 (8/4 files) · A-2 div-layout 3/3 (301/121 files) · A-3 EXTENDED `test_no_hardcoded_colors` (NO fork). 32 passed total + RuleTester 25.
- **F-5/AC-5/RN-3**: nicolify + comunify UNCHANGED (grep CLEAN — no `@luana/eslint-config` import; opt-in per brand).
- **G5 gate**: tsc EXIT=0 · eslint EXIT=0 · all validators GREEN BEFORE commit.
- Live-verify R-FID N/A a T-2 (tooling, sin surface ejercible — gate vive en T-9).
- Resultado: `T-2-result.md`. **Awaiting orchestrator → gate-runner → auditor-frontend (verdict independiente).**

### 2026-06-08T · 🤖 claude · `/dev-team` · ✓ APLICADO
T-3 layout-primitives PUSHED (`feec72e8`). 13 page-primitives en `core/@luana/ui-kit/src/layout/`
(PageContainer/ContentStack/Header/Section · Toolbar/FilterBar · EmptyState/ErrorState ·
List/FormPageSkeleton · Pagination · Detail/FormLayout) componiendo átomos existentes + tokens.
F-6 vitest 7/7 GREEN, src/layout tsc-clean. **Nota harness:** el subagent `builder-frontend`
reventó por contexto ×4 en este paquete grande (leía `pnpm-lock.yaml` 20k líneas ≈250k tokens) →
lo construí yo directo (orchestrator-direct). Candidato a harness-backlog: builder-frontend debe
saltar lockfiles/node_modules. T-1/T-2 (paquetes chicos) sí corrieron por subagent.

### 2026-06-08T · 🤖 claude · `/dev-team` · ✓ APLICADO
T-9 /showcase route PUSHED (`62577e4f`) + **live-verify GREEN** (Playwright anti-burbuja smoke,
3 passed/13.9s): `/showcase` renderiza los componentes REALES de @luana/ui-kit (5 secciones del canon
visibles por data-testid) con **0 console-error + 0 pageerror + sin overlay de Next**. NO "GET 200".
8/8 component tickets + T-9 = los 9 listos.

**★ La live-verify cazó 3 defectos de build que los unit-tests (mockeados) NO veían — los fijé (Carril R):**
1. **DECOUPLE de engine (notable):** @luana/ui-kit era **INCONSUMIBLE en vitalia** — 4 átomos
   (dialog/sheet/alert-dialog/detail-panel) importaban `@luana/hooks/use-copilot-offset` →
   `@/features/copilot/*` (no existe en NINGUNA marca; el barrel-only export los arrastra a todos).
   Reescribí `use-copilot-offset` para leer un CSS var opcional `--copilot-offset` (default 0) —
   **cero regresión** (ninguna marca consume el barrel de ui-kit todavía; adopción = Fase 3). Es la
   consumibilidad fundacional del DS — sólo la live-verify lo detectó.
2. **CSS roto:** Tailwind v4 auto-escanea y levantó el literal `text-[hsl(var(--agent-*))]` de un
   COMENTARIO en test_no_hardcoded_colors.test.ts (+ 2 fixture pages) → clase arbitraria inválida `*`
   rompía globals.css en TODAS las rutas. Reemplacé `*` por token concreto. Latente pre-existente,
   expuesto por el recompile de T-1.
3. **Infra:** skew de versión @tanstack/react-virtual host/container + node_modules anonymous-volume de
   Docker — reconciliado al lockfile.

Story `developing → developed` + `dod_evidence` registrado. Autonomous → auto-handoff /auditor.

### 2026-06-08T · 🤖 claude · `/auditor` · ✓ APLICADO
**VERDICT: APPROVED** (CHECKPOINTS.md C1-C5 todos ✅). Verificación independiente:
- Gates GREEN: @luana/design-tokens tsc 0 · @luana/eslint-config RuleTester pass · @luana/hooks 36/36 ·
  @luana/ui-kit 133/133 · vitalia arch-ratchets 6 tests · eslint/tsc showcase clean.
- **Live-verify GREEN** (Playwright anti-burbuja smoke :3002, 3 passed): /showcase renderiza los componentes
  REALES de @luana/ui-kit, 0 console-error, 0 pageerror, sin overlay de Next.
- **Copilot decouple verificado zero-regression:** 0 archivos de marca importan el barrel de @luana/ui-kit
  (sólo el showcase) → el decouple no rompe ninguna marca. Barrel ya no exporta use-copilot-offset (subpath).
- NO-NEW-LAYER OK (lifts via import, mirror resuelto a core). Sin pollution cross-brand de feature.

**1 finding fijado (Carril R):** el no-div-layout ratchet salió RED — el showcase T-9 metió 17 `<div>` de layout
crudos (318/301), violando el "eat your own dog food" del canon. Lo refactoricé para componer de las primitivas
(`PageContentStack`/`PageSection`/`space-y`) → 300/301 GREEN + live-verify re-confirmada (commit `79925085`).
**1 observación + 3 HB capturados** (reflex auditor): builder-frontend revienta leyendo pnpm-lock (HB-62) ·
docker host/container store skew rompe live-verify (HB-63) · hook cross-brand-stagea .fallowrc.jsonc (HB-64).

Story `developed → reviewing` · APPROVED → auto-handoff /pm-luana merge (semver minor @luana/* + changelog + archive).

### 2026-06-08T · 🤖 claude · `/pm-luana` · ✓ APLICADO
**MERGED → done.** Cerré el merge de la story platform `core-ds-foundation` (el Design System core).
- **07-merge.md** (5 secciones): matriz de cobertura · live-verify run (Playwright smoke 3 passed) · packages updated · notas de contrato · how-to-verify reproducible.
- **Semver MINOR + CHANGELOG** ×4: @luana/design-tokens 0.1.0→0.2.0 (escala completa) · @luana/ui-kit 0.2.0→0.3.0 (layout-primitives + Entity* + EntityPicker + archetypes + autosave/Group + copilot-decouple) · @luana/hooks 0.3.0→0.4.0 (useAutosave coalesce + use-copilot-offset decouple) · @luana/eslint-config 0.1.0 (net-new). El lock se enciende por marca en Fase 3 (opt-in), NO en este merge.
- **Archivada** a `docs/archive/2026/stories/core-ds-foundation/` (R2, mismo commit).
- **checkpoint state → done.**
- **NO squash a main** (como pediste — staging deploy MANUAL; la story cierra `done` en wip/vitalia; la integración a main es decisión tuya aparte).

✅ **Flujo completo a DONE: /pm-luana → /architect → /dev-team (9 tickets) → /auditor APPROVED → /pm-luana merge.** El Design System core está construido + consumible cross-brand (live-verified en /showcase). Próximo: Fase 3 `{brand}-ds-adoption` (adopción comprehensiva por marca + encender el lock) = stories aparte.
