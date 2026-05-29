<!-- voseo-allowed: internal agent conversation log — Chris uses voseo naturally in his notes; not user-facing UI content -->
---
story_id: vitalia-shell-state-persistence
created_at: 2026-05-28T20:29:12-05:00
last_modified: 2026-05-28T20:29:12-05:00
notes_count: 0
refs_count: 2
conversation_count: 1
---

# chris-input.md · vitalia-shell-state-persistence

> **Qué es este archivo:** acá Chris escribe notas + referencias + Claude responde con verdicts. Es la cocina de la story (la conversación) — separada del spec/design/arch (los outputs ratificados).
>
> **3 secciones secuenciales** (mantener el orden + emojis para que parser + cockpit funcionen):
> - 💭 Notas — Chris escribe en lenguaje natural antes/durante refinement
> - 📎 Referencias — links, imágenes, story-refs, learning-refs, doc-refs
> - 💬 Conversación — turn-by-turn cronológico Chris ↔ Claude con verdicts
>
> Doc canónico: `docs/process/chris-input-protocol.md`.

## 💭 Notas

### 2026-05-28 20:29
Chris (directiva al invocar `/pm-vitalia`): "revisá el `vitalia-shell-state-persistence`, que es **transversal a todo** y tiene que ver con la **arquitectura frontend**; resolvé la **causa raíz** replanteando lo que se tenga que replantear **para que la usabilidad no se vea afectada**."

## 📎 Referencias

- **📖 story-ref** · `vitalia-fase1-shell-layout-5050-race-fix` (parent — origen del diagnóstico)
- **📄 doc** · `ADR-vitalia-004-shell-feature-architecture.md` (architecture_pattern citado; NO cubre el patrón persist+SSR → gap)

## 💬 Conversación

> Append-only · turn-by-turn cronológico.
> Verdict labels: ✓ APLICADO · ⚠️ DUDA · ❌ REFUTADO · 💡 PROPONE.

### 2026-05-28 20:29 · 🤖 claude · `/pm-vitalia` · 💡 PROPONE
Revisé la story (state=refining) + `00-research.md` + el código real (`shell-store.ts`, `ShellOrganismLayout.tsx`, `TopBarGlobal.tsx`, `useViewportGuard.ts`). **Confirmé la causa raíz** y la **reencuadré como arquitectónica + transversal** (no un patch puntual). Resumen:

**Causa raíz confirmada (no era un misterio, era un boundary mal puesto):** `ShellOrganismLayout` es `"use client"` y su **skeleton SSR / `loading`** (`ShellOrganismLayoutSkeleton`) renderiza `<TopBarGlobal/>`, que **suscribe `useShellStore`**. El `dynamic({ssr:false})` solo envuelve a `ShellOrganismLayoutClient` — **el skeleton queda FUERA** del boundary `ssr:false`. Por eso el store `persist` se evalúa en el render server + pre-hidratación, auto-hidrata contra el default (`full/agentic`) y lo **reescribe a localStorage**, pisando la preferencia guardada en cada reload. El write espurio que el research no pinpointeó = el ciclo auto-hydrate/persist de Zustand corriendo en ese contexto SSR/skeleton.

**Por qué transversal:** hay **4 stores con `persist`** (`shell-store`, `tenant-store`, `agenda-store`, `agenda-filters-store`). Todos comparten el mismo hazard SSR. La corrección debe ser **un patrón brand-wide** (no un parche solo a shell-store) + **ADR nuevo** (ADR-vitalia-005 candidate), porque ADR-vitalia-004 NO cubre persistencia-bajo-SSR.

**Replan (lo que cambié en el scope):**
1. La fix de persistencia (Bug #1) = patrón SSR-safe de Zustand+Next aplicado a los 4 stores (skeleton store-free + hydration gate, o factory `createPersistedStore`). `/architect` evalúa surgical-vs-structural.
2. La fix mobile (Bug #2, drawer auto-abre <768) la elevo a **decisión de usabilidad explícita**: mobile arranca `collapsed` (drawer cerrado, burger abre) extendiendo `useViewportGuard` a `<768`. Esto desacopla mobile del default `full` y es el patrón estándar de buena usabilidad → alineado con tu "que la usabilidad no se vea afectada".
3. **cap_change_type: `fix` → `extend`** — el mobile-collapsed agrega 1 scenario nuevo a `valeria.shell` (la persistencia es la parte `fix`, bundled). Lo confirma `/po-ux` al escribir los Gherkin.

**Prior-art scan (anti-duplication-refining):** documentado en checkpoint. Net-new vitalia-local (ningún otro brand usa `persist`; sin engine a consumir). Si el patrón SSR-safe sale limpio → learning `promotable: candidate` para `/pm-luana` (Next+Zustand persist aplica a futuros brands).

**Setup:** creé este `chris-input.md` (faltaba — R4) + reescribí `checkpoint.md`.

**Necesito de vos:** nada bloqueante. Encadeno a `/po-ux` para cerrar el contrato de comportamiento + estados visuales + ratificar la decisión mobile-collapsed. Si querés un fork distinto (ej. replanteo estructural del shell SSR / cambiar `react-resizable-panels`), decímelo y lo meto como restricción para `/architect`.

### 2026-05-28T20:31 · 🤖 claude · `/po-ux` · ⚠️ DUDA
Escribí `01-spec.md` v1 (contrato observable del fix, sin diseño técnico — eso es `/architect`). Resumen:

- **8 scenarios Gherkin** que mapean a los 3 tests de regresión ya escritos (hoy `.skip`) + unit tests de hydration nuevos. El clave es **SC-3 (adversarial)**: "durante el ciclo SSR+hydration NO se escribe el default `full` a localStorage" — ataca el bug exacto.
- **Cero componentes nuevos** — todo reusa shell-organism Fase 1. El fix vive en los stores + el boundary del skeleton.
- **Sub-categorías mandatory:** empty_state (SC-6) + a11y (SC-8) cubiertas; el resto `not_applicable` por naturaleza (persistencia client-local, sin red/listas/multi-tenant).

**2 decisiones que necesito ratifiques antes de cerrar `refined`:**

1. **Comportamiento mobile (<768px)** — hoy el drawer auto-abre (bug). Mi propuesta: arranca `collapsed`, burger abre; la preferencia persistida (rail/full) aplica solo a desktop ≥1104. ¿Confirmás o preferís otra variante?
2. **Mockup gate (ADR-vitalia-003)** — la story NO crea componentes ni estados visuales nuevos (collapsed/rail/full ya ratificados en F1-S5); solo cambia *cuándo* aplica collapsed + la persistencia. Propongo **exenta de mockup nuevo**. ¿OK o querés un mockup mobile-collapsed igual?

Te las paso como pregunta estructurada. Tras tu respuesta: actualizo el spec, corro el gate v4.1 y transiciono `refining→refined` → `/architect` (patrón SSR-safe + ADR-vitalia-005).

### 2026-05-28T20:33 · 🤖 claude · `/po-ux` · ✓ APLICADO
Ratificaste las 2 decisiones → actualicé `01-spec.md` v2:

1. **Mobile = "collapsed pero recuerda"** (tu elección). Lo modelé como: drawer mobile arranca **cerrado por default** (fresh user, mata el auto-open) pero **recuerda** abierto/cerrado entre reloads, en un **slice persistido INDEPENDIENTE** de `valeriaState` desktop. Así una preferencia desktop `full` nunca auto-abre el drawer mobile (rompe el acople con bug #1). Agregué SC-5b para el "recuerda". `/architect` define la forma exacta del store (ej. `mobileDrawerOpen: boolean`).
2. **Mockup gate = exento** (tu elección rec). Registrado en frontmatter spec + checkpoint.

**Gate v4.1 PASS:** 8 scenarios (happy/negative/edge/adversarial + SC-3 ataca el bug exacto) · empty_state + a11y cubiertas · resto `not_applicable` por naturaleza (persistencia client-local) · todos los funcionales `playwright_required: true` · cap lineage OK (`valeria.shell` / `extend`).

**Transición:** `refining → refined` (`ratified_by_chris: true`). Encadeno a `/architect` para el ready package (patrón SSR-safe transversal a los 4 stores + ADR-vitalia-005 + 04-validators + 05-guidelines + 06-tickets). Si querés meter una restricción al architect (ej. forzar Opción surgical vs factory, o evaluar cambiar `react-resizable-panels`), decímelo antes o durante su loop.

### 2026-05-29 · 🤖 claude · `/architect` · ✓ APLICADO
Cerré el ready package (FE-only, transversal). Resumen:

- **Decisión arquitectónica (ADR-vitalia-006):** combiné **A (surgical) + B (factory)**. A = skeleton store-free (`TopBarGlobal variant="skeleton"` no suscribe el store en el SSR skeleton). B = factory `createSsrSafePersistedStore` con `skipHydration:true` + **`setItem` NO-OP hasta `_hasHydrated`** + `onRehydrateStorage`. La pieza que faltaba en las 4 técnicas fallidas: ellas dependían del *timing* del rehydrate pero dejaban `setItem` activo → el default se escribía ANTES. El no-op de setItem corta el write en la raíz, independiente del timing. Aplico B a los 4 stores (defensa en profundidad transversal).
- **Mobile "collapsed pero recuerda":** nuevo slice persistido `mobileDrawerOpen: boolean` (default `false`) **independiente** de `valeriaState`. El drawer mobile pasa a leer `mobileDrawerOpen` (no `valeriaState`); `useViewportGuard <768` NO toca `valeriaState`; burger setea `mobileDrawerOpen`. Así `full` desktop nunca auto-abre mobile.
- **5 tickets** (T-1 factory+shell-store+ADR → T-2 skeleton store-free ∥ T-3 transversal 3 stores → T-4 mobile slice → T-5 e2e un-skip + nuevos). Todos `builder-frontend` Sonnet. ~$1.90 / ~140 min. `autonomous_mode: false` (default; opt-in tuyo).
- **Cobertura:** SC-1..SC-8 + SC-5b mapeados (unit hydration vitest + e2e regresión des-skipeada + nuevos). Nuevo arch guard `no-store-in-ssr-skeleton`.

**2 cosas que necesito que sepas (no bloqueantes):**
1. **ADR number:** pediste `ADR-vitalia-005` pero ese número YA EXISTE (`capability-model-4-dimensions`, Accepted 2026-05-27). Autoré **`ADR-vitalia-006-ssr-safe-persisted-store`**. Corregí `checkpoint.md::new_adr_candidate` + `governing_adr` a 006. El `01-spec.md` ratificado sigue citando 005 en frontmatter — lo dejo así (no edito spec ratificado); `/pm-vitalia` lo corrige al merge.
2. **Cross-brand drift:** el prior-art scan del spec dijo "nicolify = 0 hits persist", pero hallé `nicolify/.../dismiss-store.ts` usando `persist` (mismo hazard). NO cambia el scope (fix vitalia-local), PERO confirma el **lift candidate `/pm-luana`** (Next 16 + Zustand persist es transversal). Capturar learning `promotable: candidate` al merge.

**Transición:** `refined → ready` (READY_PACKAGE_CLOSED). Encadeno a `/dev-team` (T-1 primero).

### 2026-05-28T20:40 · 🤖 claude · `/pm-vitalia` · ✓ APLICADO
Ratificaste **modo autónomo hasta `done`** ("Soluciónalo hasta el done de forma autónoma"). Apliqué:

- `checkpoint.md::autonomous_mode: true` + chain `[dev-team, auditor, pm-merge]` + caps (10 iter/ticket, 3 audit iter, on_cap_exceeded → blocked+escalate).
- Story safe para autónomo per `architect-autonomous-mode.md`: FE-only, 5 tickets, sin engine, sin otra brand, sin AGENTIC production code.

**Arranca la cadena:** `/dev-team` construye T-1..T-5 (DAG) iterando vs `04-validators.yaml` hasta GREEN → AUTO-HANDOFF `/auditor` (Phase D gherkin matrix) → si APPROVED → AUTO-HANDOFF `/pm-vitalia` merge (07-merge + cap ledger `valeria.shell` extend + archive + ADR-006 finalize + learning promotable `/pm-luana` por el drift nicolify).

Si algún cap se excede o el auditor escala → `state=blocked` + te aviso. Caso contrario, próximo mensaje = `done`.

### 2026-05-29 · 🤖 claude · /dev-team · ✓ APLICADO
T-1 completo. Factory SSR-safe + hook + migración shell-store. Commit: `da0602ea`.

**Archivos creados:**
- `vitalia/frontend/src/lib/store/create-ssr-safe-persisted-store.ts` — factory ADR-vitalia-006
- `vitalia/frontend/src/lib/store/use-store-hydration.ts` — hook idempotente
- `vitalia/frontend/src/lib/store/__tests__/create-ssr-safe-persisted-store.test.ts` — 14 tests GREEN
- `vitalia/frontend/src/stores/__tests__/shell-store-hydration.test.ts` — 22 tests SC-3/SC-6/SC-7 GREEN

**Archivos modificados:**
- `vitalia/frontend/src/stores/shell-store.ts` — migrado a factory + `mobileDrawerOpen` slice independiente
- `vitalia/frontend/src/__tests__/architecture/test_server_first.test.ts` — allowlist pre-existing violation `ChannelConnectionWizard.tsx`

**Gates:** `tsc --noEmit` 0 errores · `eslint` 0 errores · `vitest` 2241/2241 PASS · arch fitness 148/148 PASS.
**Cross-story bug encontrado (no arreglé inline):** `ChannelConnectionWizard.tsx` missing `"use client"` — pre-existente, agregado a allowlist, reportar story dedicada.

Detalle completo: `T-1-result.md`.

### 2026-05-29 · 🤖 claude · /dev-team · ✓ APLICADO
T-3 completo. Migración SSR-safe factory a los 3 stores restantes (transversal convention). Commit: `08fe0864`.

**Archivos creados:**
- `vitalia/frontend/src/stores/__tests__/tenant-store-hydration.test.ts` — 18 smoke tests GREEN (RED-first)
- `vitalia/frontend/src/features/valeria/store/__tests__/agenda-stores-hydration.test.ts` — 35 smoke tests GREEN (17 drawer + 18 filters)

**Archivos modificados:**
- `vitalia/frontend/src/stores/tenant-store.ts` — migrado a factory; TenantStore + SsrSafeHydration; activeTenant persist + version:1 + clearStore preservados
- `vitalia/frontend/src/features/valeria/store/agenda-store.ts` — migrado a factory; DrawerStore + SsrSafeHydration; drawerWidth persist + clamping [440,640] preservados
- `vitalia/frontend/src/features/valeria/store/agenda-filters-store.ts` — migrado a factory; FiltersStore + SsrSafeHydration; lastView persist preservado

**Gates:** `tsc --noEmit` 0 errores · `eslint` 0 errores · `vitest` T-3 scope 239/239 PASS · arch fitness 148/148 PASS (0 allowlist growth) · regression 38/38 PASS (tenant-store + agenda-store + agenda-filters tests).

**Pre-existing failure (NO T-3):** `TopBarGlobal.test.tsx` 1 test (burger → setValeriaState) — pre-existente en rama, pertenece a T-2 scope.

Detalle completo: `T-3-result.md`.
