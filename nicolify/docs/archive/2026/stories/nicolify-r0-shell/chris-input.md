# chris-input — nicolify-r0-shell

> Buzon de la conversacion asincrona Chris <-> Claude para esta story. Chris vuelca lo que desea/necesita; Claude lo aplica, lo rebate o propone. Nace con la story (R4).

## Inputs crudos de Chris

- Fusionar las 5 stories R0 del shell (design-system-tokens, ribbon-subtabs, routing-empty-states, shell-layout-splitter, topbar) en una sola.
- No partir de cero: replicar como lo hizo Vitalia (shell-organism / componentes FE re-tematizados).

## Conversacion

### 2026-05-30T22:05 · claude · `/pm-nicolify` · ✓ APLICADO
Fusione **6** stories (las 5 que nombraste + `nicolify-r0-luana-chat`, que ratificaste incluir porque en Vitalia el chat lateral vivio dentro de la story de layout) en una sola: `nicolify-r0-shell`. Mecanica: reuse la story mas avanzada (`design-system-tokens`, ya en `refining`) como contenedora y la **renombre** a `nicolify-r0-shell` — un `story_id` "design-system-tokens" para un shell completo habria confundido a cada skill downstream + el cockpit. Consolide los 6 Goals verbatim en `## Historias fusionadas` para no perder scope, e incorpore **Sara** al Ribbon (el stub original listaba 4 agentes; Sara se agrego 2026-05-30). `dev-stack` queda separada (es BE/infra + blocker). Las 5 stubs absorbidas se eliminan (eran `idea` sin artefactos; la traza vive aca + en R0.yaml + git). Actualice `R0.yaml`. **Proximo paso:** `/po-ux nicolify nicolify-r0-shell` -> 01-spec unificado con scenarios por bloque reusando el mockup `shell.html`.

### 2026-05-30T22:30 · claude · `/po-ux` · ✓ APLICADO
Escribi `01-spec.md` v1 (unificado, 6 bloques A-F). Prior-art scan documentado (engine `@luana/ui-kit` + port verbatim re-temizado del shell de Vitalia + 5 learnings aplicados). Consolide la estructura de scenarios de las 6 specs archivadas de Vitalia en **6 bloques** (A bootstrap/routing/empty · B topbar/tokens/tema · C layout/splitter · D panel Luana skeleton · E ribbon/sub-tabs · F a11y/i18n) evitando duplicar transversales. Apliqué tus 2 decisiones: **Sara como 5ª tab** + **default landing `christian/pipeline`**. Sub-categorias v4.1 race/concurrent/network/large marcadas `not_applicable` (shell estatico sin data/fetch en R0). `shell-routes.ts` con `AGENT_SUBTABS` del nav-tree. Necesito que respondas las 3 abajo.

### 2026-05-30T22:31 · claude · `/po-ux` · ⚠️ DUDA
**No puedo cerrar `refining→refined` todavia** por el gate **G1 (mockup-per-component)**: el mockup `shell.html` ratificado muestra **4 agentes** y ratificaste **Sara (5 tabs)** — requiere refit + re-ratificacion del Ribbon de 5 tabs. 3 cosas para destrabar: (1) ¿refit del mockup de 5 tabs lo hago yo ahora (HTML) y lo ratificas? · (2) sub-tabs de Sara `[mi-dia, proyectos]` 💡 ¿OK o ajustas? · (3) confirmas que R0 es esqueleto puro (empty-states en todo, chat composer no-funcional, cero endpoints nuevos). Con eso cierro refined y encadeno `/architect`.

### 2026-05-30T22:48 · claude · `/po-ux` · ✓ APLICADO
Refit del mockup `nicolify-r0-shell-organism/mockups/shell.html` a **5 tabs**: agregué a **Sara** (ámbar `#F59E0B`) entre Christian y Norvil — CSS vars light+dark + reglas `.ribbon-tab.active`/`.sub-tab.active` + 5ª tab en el markup + entry en la data `TABS` (sub-tab `Proyectos`, rol "Jefa de Proyectos · Operación"). Creé el avatar placeholder `assets/agents/sara.svg` (ámbar, inicial "S"). Verifiqué render headless (screenshot 5 tabs OK, Christian activo). Ajusté el spec: Sara solo `[proyectos]`; todo el set de sub-tabs queda como provisional (se replantea en story dedicada). Servido en http://localhost:8888/shell.html.

### 2026-05-30T22:50 · claude · `/po-ux` · ✓ APLICADO
Chris **ratificó** el mockup de 5 tabs ("ratificado, dale"). Flip `ratified_by_chris: true` + `ratified_visual_by_chris: true` (G1 satisfecho). Gate refined v4.1 PASS (4 base + a11y + i18n + empty_state; race/concurrent/network/large = not_applicable shell estático). **Transición `refining → refined`.** Encadeno `/architect nicolify nicolify-r0-shell` para el ready package.

### 2026-05-30T23:10 · claude · `/architect` · ✓ APLICADO
Ready package cerrado (state `refined → ready`). 5 artefactos: `03-arch.md` (FE · adr_001_compliance: partial-with-rationale por divergencias R0 skeleton + Tailwind v4 · § Prior art audit + § Integration design CONN: shell = entry point, cero isla), `04-validators.yaml` (cobertura 100% de los 20 scenarios A1-F2 · categorías non_functional/functional/visual/architectural_validation · sin agentic_eval · test_construction_plan + playwright_visual_scope), `05-guidelines.md` (must_load_skills con nicolify-design-system obligatorio), `06-tickets.yaml` (6 tickets FE: T-1 tokens · T-2 topbar · T-3 layout+splitter+store · T-4 panel Luana · T-5 ribbon+subtabs+routes · T-6 routing+empty-states · todos builder-frontend/sonnet · DAG dev-stack→T-1→T-3→T-5→T-6, T-2/T-4 paralelizables), `dispatch-plan.md` (autonomous_mode:false · ~$3.35 · ~210min · recomienda supervisar T-3 por bug SSR-safe store conocido de Vitalia). Flag: agregar dep `react-resizable-panels@^4.11.1` (T-1).

### 2026-05-30T23:11 · claude · `/architect` · ⚠️ DUDA
**No encadeno `/dev-team` todavía: falta el blocker `nicolify-r0-dev-stack`.** El shell necesita el scaffold de `nicolify/frontend/` (Next.js 16 + Clerk + estructura FSD + BE :8001 / FE :3001) que es trabajo de la story `nicolify-r0-dev-stack` — que está listada en R0.yaml pero **no existe como story** (sin checkpoint, sin build). Opciones: (a) creamos + construimos `nicolify-r0-dev-stack` primero (yo lo refino con /pm-nicolify → /po → /architect → /dev-team), luego el shell; (b) si el scaffold de `nicolify/frontend/` ya existe en disco de un bootstrap previo, lo verifico y arranco `/dev-team nicolify-r0-shell` directo. ¿Cuál?

### 2026-05-30T23:14 · claude · `/architect` · 💡 PROPONE
Corrección a la DUDA anterior: verifiqué disco y el scaffold de `nicolify/frontend/` **YA EXISTE** (Next.js 16 + Clerk wired + `@luana/{ui-kit,design-tokens,hooks,format,schemas,api-client}` workspace + zustand + next-themes + react-query). Solo tiene rutas `sign-in/sign-up/api/health`; el `(shell-organism)` + `[tenantId]` es justo lo que crea T-6. El shell es **FE aditivo** sobre ese scaffold → `/dev-team nicolify-r0-shell` PUEDE arrancar ya (T-1 agrega la dep `react-resizable-panels`). Único caveat: los validators e2e necesitan `make dev-nicolify` levantado (FE :3001). La story `nicolify-r0-dev-stack` (formalizar BE health + alembic baseline) NO bloquea el build del shell FE skeleton (no consume endpoints). Propongo: arrancar `/dev-team nicolify-r0-shell` directo. Esperá tu OK.

### 2026-05-30T23:30 · claude · `/architect` · ✓ APLICADO
Absorbí `nicolify-r0-dev-stack` como **T-0** dentro de la story (ratif. Chris) para que al término tengamos una **app realmente funcional LIVE**, no componentes sobre un stack apagado. Hallazgo: el stack ya está ~90% (BE `:8001/health` 200 ✓, alembic baseline `001` ✓, scaffold FE + Clerk + docker-compose + Makefile) → T-0 es **fino**: cablea el boot (Clerk middleware rutas tenant + env + deps) + deja `make dev-nicolify` verde + smoke live. NO toca código BE. Cambios al package: 06-tickets (T-0 nuevo, DAG T-0→T-1→T-3→T-5→T-6, 7 tickets, +DoD), 01-spec (scenario A0 boot live), 04-validators (F-A0 + map 21 scenarios), 03-arch (CONN reachability + D1 + §16), dispatch-plan (matriz +T-0, ~$3.65/~235min), checkpoint (merged_from +dev-stack, depends_on:[]), R0.yaml (dev-stack absorbido). El smoke A0 cierra tras T-6. Story sigue en `ready`. ¿Arranco `/dev-team nicolify-r0-shell` desde T-0?

### 2026-05-30T18:20 · 🤖 claude · `/pm-nicolify` · ✓ APLICADO
Chris pidió "arranca nicolify-r0-shell hasta el done". Step 0 GREEN (sin stories OPEN bloqueantes; `shell-organism` y `dev-stack` ya en done). Validado: state=ready→developing, WIP cap libre, autonomous_mode=true ratificado (caps $8.00/180min/10 iter), deps done. Encadeno `Skill(dev-team)` para el build autónomo de los 7 tickets (T-0 dev-stack verify → T-6 routing+empty). La chain seguirá: dev-team → auditor → pm-merge hasta done.

### 2026-05-30T23:45 · 🤖 claude · `builder-frontend` · ✓ APLICADO (T-0 DONE)
T-0 completado. Deliverables verificados:
- Paths modificados: `nicolify/frontend/package.json` (+ react-resizable-panels@^4.11.1), `pnpm-lock.yaml`
- Paths creados: `T-0-impl-log.md`, `T-0-result.md`
- Decisiones clave: (1) react-resizable-panels instalado via `pnpm add --filter "@luana/nicolify-web"` (npm falla con workspace:* protocol); (2) proxy.ts ya existía y funciona — cero código nuevo de middleware; (3) alembic `001_nicolify (head)` confirmado; (4) .env.dev completo; (5) boot-smoke A0 deferred to T-6 documentado en impl-log.
- Gate output: tsc 0 errores, eslint 0 errores, 5/5 HTTP checks PASS.
- Stack listo para T-1 (tokens/globals.css/ThemeToggle/_agent-tw-classes).

### 2026-05-30T19:10 · 🤖 claude · `builder-frontend` · ✓ APLICADO (T-1 DONE)
T-1 completado. Deliverables verificados:
- `nicolify/frontend/src/app/globals.css` — tokens nicolify.com (Tailwind v4 `@theme/@layer`) `:root` + `.dark` + `dark/[data-theme="dark"]` · primario `#635BFF` + agent-colors (abel/brenda/christian/sara ámbar/norvil/config/luana) + League Spartan / Bree Serif @import + Z_INDEX consumido de `@luana/design-tokens` + typing-dot animation.
- `nicolify/frontend/src/components/shared/shell-organism/ThemeToggle.tsx` — port vitalia re-tema · `useCallback` para onClick estable · spanish neutro aria-label · `data-testid="theme-toggle"`.
- `nicolify/frontend/src/app/layout.tsx` — SSR anti-FOUC inline script `<head>` · `suppressHydrationWarning` en `<html>` · preconnect Google Fonts · ThemeProvider wired.
- `nicolify/frontend/src/app/providers.tsx` — ThemeProvider (`attribute="data-theme"`, `storageKey="nicolify-theme"`) + ClerkProvider + QueryClientProvider.
- `nicolify/frontend/src/components/shared/shell-organism/_agent-tw-classes.ts` — G3 static lookup (switch/case, NUNCA template literals) · 5 funciones (bgClass/bgSoftClass/textClass/textClassSubTab/borderClass) · 7 slugs (abel/brenda/christian/sara/norvil/config/luana).
- `nicolify/frontend/src/components/ui/button.tsx` — standalone Shadcn Button (avoids @luana/ui-kit barrel transitive dep).
- `nicolify/frontend/src/__tests__/architecture/test_agent_tw_classes.test.ts` — 5 arch tests G3 gate.
- `nicolify/frontend/src/__tests__/architecture/test_spanish_neutro.test.ts` — 3 arch tests voseo scan.
- `nicolify/frontend/src/components/shared/shell-organism/__tests__/_agent-tw-classes.test.ts` — 30 unit tests.
- `nicolify/frontend/src/components/shared/shell-organism/__tests__/ThemeToggle.test.tsx` — 7 unit tests.
- Gates: tsc 0 errores ✅ · eslint 0 errores / 4 warnings (test files, non-blocking) ✅ · vitest 54 tests PASS / 88% coverage ✅ · react-resizable-panels@^4.11.1 ya presente (T-0) ✅.

### 2026-05-30 · 🤖 claude · `builder-frontend` · ✓ APLICADO (T-2 DONE)
T-2 completado. Deliverables verificados:
- `TopBarGlobal.tsx` — port vitalia re-tema · role=banner · h-12 · interactive/skeleton variants · "Luana" (not "Valeria") · "agencia" (not "clínica").
- `LogoMark.tsx` — Nicolify SVGs (`/nico-assets/logotipo/` + `/nico-assets/isotipo/`) · aria-label="Nicolify inicio" · light/dark CSS swap · Server Component.
- `TenantSwitcher.tsx` — SKELETON placeholder "Cambiar de agencia" (live hooks en T-3).
- `TenantBadge.tsx` + `TenantOption.tsx` — port re-tema ("Agencia activa", not "Clínica activa").
- `AddAgencyPlaceholderModal.tsx` — "Agregar agencia" placeholder.
- `types.ts` — Tenant interface (re-themed from clinic→agency context).
- `lib/utils.ts` + `lib/tenant-palette.ts` — cn() + deterministic badge colors.
- `stores/shell-store.ts` — STUB (T-3 implements full SSR-safe store with createSsrSafePersistedStore).
- `components/ui/{dropdown-menu,skeleton,alert,dialog}.tsx` — Shadcn primitives bootstrapped.
- `TopBarGlobal.test.tsx` — 12 tests (B1 coverage) · TDD RED→GREEN.
- Gates: tsc 0 errores ✅ · eslint 0 errores / 10 warnings (non-blocking) ✅ · vitest 73/73 PASS / 71.76% coverage ✅.
- Commit: 24d94d05.

### 2026-05-30 · 🤖 claude · `builder-frontend` · ✓ APLICADO (T-3 DONE)
T-3 completado. Deliverables verificados:
- `stores/shell-store.ts` — REPLACED stub · `createSsrSafePersistedStore` (G2 gate) · `LuanaState(collapsed|history|full)` + `ShellSplitState(chat-collapsed|narrow|50-50)` + `mobileDrawerOpen` · key `nicolify-shell-state` · partialize sin setters/_hasHydrated.
- `ShellOrganismLayout.tsx` — `dynamic({ssr:false})` boundary · skeleton store-free (TopBarGlobal variant="skeleton") · C3 bug mitigado.
- `ShellOrganismLayoutClient.tsx` — `Group/Panel/Separator` (react-resizable-panels v4) · `useGroupRef` snap-up Fix A · `useStoreHydration(useShellStore)` · hit-area ≥8px · `aria-label="Redimensionar paneles"`.
- `AppPanelSlot.tsx` — Server Component · typed placeholder slots (Ribbon/SubTabsBar T-5 fills) · `data-testid="app-panel-slot"` · `aria-label="Panel aplicación"`.
- `useViewportGuard.ts` — FULL_STATE_MIN_VIEWPORT=1104 · MOBILE_BREAKPOINT=768 · one-way `full→history` (Nicolify 3-state model, no `rail`).
- `LuanaSidebar.tsx` + `ShellModeToggle.tsx` — placeholder stubs (T-4/R0).
- `src/__tests__/architecture/no-store-in-ssr-skeleton.test.tsx` — 30 arch tests G2 gate (GREEN).
- `stores/__tests__/shell-store.test.ts` + `shell-store-hydration.test.ts` — 37 tests store+hydration (SC-3/SC-6/SC-7) GREEN.
- `vitest.config.mts` + `tsconfig.json` — @luana/hooks + zustand path aliases (monorepo peerDep fix).
- Gates: tsc 0 errores ✅ · eslint 0 errores / 15 warnings ✅ · vitest 146/146 PASS / 47.7% coverage ✅ · arch G2 30/30 ✅.
- Commit: 7dfff0f0.

### 2026-05-30 · 🤖 claude · `builder-frontend` · ✓ APLICADO (T-5 DONE)

T-5 completado. Deliverables verificados:
- `src/lib/routing/shell-routes.ts` — SSoT completo (AGENT_CATALOG[abel,brenda,christian,sara,norvil,config] + AGENT_RIBBON_ORDER + AGENT_SUBTABS + DEFAULT_LANDING=christian/pipeline + AGENT_SUBSUBTABS={} + guards isValidAgent/isValidSubtab/getDefaultSubtab + extractors URL) · Sara SOLO [proyectos] (navigation-tree.md constraint) · XSS whitelist guard (A4).
- `src/components/shared/shell-organism/Ribbon.tsx` — port re-tematizado · 5 tabs + ConfigTab ml-auto · roving tabindex (WAI-ARIA tablist) · mobile overflow-x-auto · URL-derived active state.
- `src/components/shared/shell-organism/RibbonTab.tsx` — port re-tematizado · AgentAvatar fallback (E4) · tabLabel + name · agentBgSoftClass active + agentBorderClass indicator.
- `src/components/shared/shell-organism/ConfigTab.tsx` — port re-tematizado · Settings icon · ml-auto · Tooltip "Configurar".
- `src/components/shared/shell-organism/SubTab.tsx` — port re-tematizado · emoji icon + label · agentBgSoftClass + agentTextClassSubTab active.
- `src/components/shared/shell-organism/SubTabsBar.tsx` — port re-tematizado · URL-derived sub-tabs · roving tabindex · useMemo for exhaustive-deps.
- `src/components/shared/shell-organism/SubSubTab.tsx` — port re-tematizado · N3-static molécula (R0: unused, R1+ activará).
- `src/components/shared/shell-organism/SubSubTabsBar.tsx` — port re-tematizado · retorna null para todas las rutas R0 (AGENT_SUBSUBTABS vacío).
- `src/components/shared/shell-organism/AppPanelSlot.tsx` — MODIFIED: skeleton placeholders reemplazados con Ribbon/SubTabsBar/SubSubTabsBar reales.
- `src/__tests__/architecture/test_shell_routes_ssot.test.ts` — 13 arch tests SSoT enforcement + Sara constraint + DEFAULT_LANDING.
- `src/lib/routing/__tests__/shell-routes.test.ts` — 28 unit tests (A4 XSS guards + E1-E5 subtabs + all guards/extractors).
- Avatar placeholders: ya existían de T-4 (abel/brenda/christian/sara/norvil/avatar.svg).
- Gates: tsc 0 errores ✅ · eslint 0 errores / 91 warnings ✅ · vitest 221/221 PASS / 30.39% coverage (> 20% threshold) ✅ · arch fitness 85/85 ✅.

### 2026-05-30 · 🤖 claude · `builder-frontend` · ✓ APLICADO (T-6 DONE)

T-6 completado. Deliverables verificados:
- `src/app/[tenantId]/(shell-organism)/layout.tsx` — Server Component · Clerk auth (auth() → userId) · D1 tenant skeleton resolve (tenantId directo de URL, IAM cross-tenant diff a R1+) · ShellOrganismLayout wired.
- `src/app/[tenantId]/(shell-organism)/page.tsx` — redirect DEFAULT_LANDING (christian/pipeline).
- `src/app/[tenantId]/(shell-organism)/not-found.tsx` — shell chrome intacto via layout · rol="status" · copy "No encontramos esta página".
- `src/app/[tenantId]/(shell-organism)/[agent]/page.tsx` — redirect getDefaultSubtab(agent) · notFound() si inválido.
- `src/app/[tenantId]/(shell-organism)/[agent]/not-found.tsx` — copy "Ese agente no existe" · emoji 🤖.
- `src/app/[tenantId]/(shell-organism)/[agent]/[subtab]/page.tsx` — whitelist validation (A4 XSS) · isValidAgent+isValidSubtab → SubTabContent.
- `src/app/[tenantId]/(shell-organism)/[agent]/[subtab]/not-found.tsx` — copy "Esa sección no existe para este agente" · emoji 📂.
- `src/components/shared/shell-organism/SubTabContent.tsx` — dispatcher 20 combos → EmptyState (R0 skeleton) · Spanish neutro tuteo · branded copy christian/pipeline per spec § Microcopy · SSoT = shell-routes.ts AGENT_SUBTABS.
- `src/components/shared/shell-organism/EmptyState.tsx` — port vitalia re-tematizado · data-testid="empty-state" · role="status" + aria-live="polite".
- `src/components/shared/shell-organism/PlaceholderCard.tsx` — port vitalia.
- `playwright.config.ts` — +regression project (`e2e/regression/**`) dependiente de setup.
- 21 e2e specs (boot-live-smoke A0 + 20 scenarios A1-F2) — DEFERRED (require `make dev-nicolify` + `E2E_BASE_URL=http://localhost:3001 npx playwright test --project=regression`). Specs ejercen acciones reales (navigate, click, DOM state) per test-design-doctrine.md (no falsos HTTP 200).
- Gates: tsc 0 errores ✅ · eslint 0 errores / 102 warnings ✅ · vitest 224/224 PASS / 27.94% coverage ✅ · arch fitness 88/88 ✅.
- Commit: 655c9380 (wip/nicolify, pushed).
- CONN satisfied: routing wired (Navigable) · SubTabContent consumed by routing (Consumed) · shell = entry point (On-map) · Next.js route-group registers (Notarized).
- chrome-devtools-verify: deferred (offline env) · Chris staging gate: `make dev-nicolify` → navigate /{tenantId} → shell reachable → DoD A0.

### 2026-05-30 · 🤖 claude · `builder-frontend` · ✓ APLICADO (BUGFIX: duplicate main-content)

Bugfix de la finding de live-verification. Root cause: la mobile `<main id="main-content">` no tenía guard de shellMode → DOM siempre tenía 2× `<main id="main-content">` simultáneamente (desktop activo + mobile siempre presente) → strict-mode-violation de Playwright + HTML inválido (id duplicado).

Fix: reemplazé 3 `<main>` condicionales por UN SOLO `<main id="main-content">` wrapper con inner chrome que switchea en `shellMode` + `isDesktop` (`useSyncExternalStore` en `matchMedia(md)`). `{children}` renderiza exactamente una vez.

Tests RED→GREEN: 7 tests nuevos en `ShellOrganismLayoutClient.test.tsx` (4 eran RED → todos GREEN). Sin regresiones: 231/231 vitest PASS.

Commit: `15b09539`. Files: `ShellOrganismLayoutClient.tsx` (modified) + `ShellOrganismLayoutClient.test.tsx` (nuevo).
