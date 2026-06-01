# T-3 Implementation Log — Layout/Splitter + Shell-Store SSR-safe

**Ticket:** T-3 of nicolify-r0-shell  
**Date:** 2026-05-30  
**Agent:** builder-frontend (Sonnet 4.6)  
**gherkin_coverage:** C1, C2, C3, B3

---

## Plan

### Design-system-first (D1)
- Reused: `@luana/hooks/create-ssr-safe-persisted-store` + `useStoreHydration` (engine factory — G2 gate, CONSUMED not recreated)
- Reused: `@luana/hooks/use-store-hydration` (engine hook)
- Reused: TopBarGlobal (T-2, imported as-is)
- No new Shadcn primitives needed — layout is structural
- Tailwind utility classes only — no `style={}` inline

### Mockup adherence + scope (D2+D3)
- T-3 scope: shell-store + ShellOrganismLayout + ShellOrganismLayoutClient + AppPanelSlot + useViewportGuard
- Mockup shows full 5-tab Ribbon + Luana chat — T-3 implements structural frame only (AppPanelSlot has skeleton placeholders for T-5/Ribbon, T-4/LuanaSidebar)
- `data-shell-ready` on main for E2E determinism (awaitable post-hydration signal)

### Batería de tests (RED→GREEN)
- TDD RED first: `shell-store.test.ts` + `shell-store-hydration.test.ts` (21 + 16 tests = 37 total)
- Architecture fitness: `no-store-in-ssr-skeleton.test.tsx` (30 tests)
- Total new tests: 67 tests, all GREEN

### Integración (CONN)
- `ShellOrganismLayout` consumes `ShellOrganismLayoutClient` via dynamic({ssr:false})  
- `ShellOrganismLayoutClient` consumes `useShellStore` + `useStoreHydration` + `useViewportGuard`
- `AppPanelSlot` is referenced in `ShellOrganismLayoutClient` — not an island
- `useViewportGuard` is called inside `ShellOrganismLayoutClient` — not an island
- `shell-store.ts` is consumed by `ShellOrganismLayoutClient` + `TopBarGlobal` (T-2)

---

## Skills Consulted

| Skill | Why invoked | Decision |
|---|---|---|
| `nicolify-design-system` | Port verbatim from vitalia, understand component catalog + token decisions | Confirmed port: ValeriaSidebar → LuanaSidebar placeholder (T-4 fills), ShellModeToggle stub (R0) |
| `frontend-expert` | FSD-Lite boundaries, SSR-safe store factory pattern, Server-First defaults | AppPanelSlot = Server Component; ShellOrganismLayoutClient = `"use client"` inside dynamic boundary |
| `tessl__react-patterns` | Error boundaries, loading/error/empty states, accessible markup, stable keys | aria-label on all semantic elements; data-shell-ssr-skeleton + data-shell-ready for test determinism; no array index as key (Array.from with stable keys) |
| `tessl__vitest` | Store tests + hydration test patterns, async act() | Used act() + setTimeout(0) for rehydration async; spy pattern for NO-OP storage guard |
| `.claude/rules/frontend-fsd.md` | FSD-Lite boundary matrix; no cross-brand imports | Confirmed: all imports within nicolify/frontend; @luana/* consumed via workspace |
| `.claude/rules/test-design-doctrine.md` | Verification real ≠ HTTP 200; test by scenario nature (store = unit; layout = arch fitness) | Red-first store tests + hydration adversarial tests (SC-3 C3 bug pattern) + arch fitness text scan tests |

---

## Critical Decisions

### G2 SSR-safe store (C3 bug mitigation — most critical)
Port verbatim from vitalia ADR-vitalia-006:
1. `createSsrSafePersistedStore` factory from `@luana/hooks` — setItem NO-OP while `_hasHydrated=false`
2. `ShellOrganismLayoutSkeleton` in `ShellOrganismLayout.tsx` renders `TopBarGlobal variant="skeleton"` — store-free
3. `useStoreHydration(useShellStore)` called ONCE inside `ShellOrganismLayoutClient` (the ssr:false boundary)
4. Architecture test `no-store-in-ssr-skeleton.test.tsx` verifies pattern programmatically (30 tests)

Result: spurious default write during SSR/hydration prevented ✓

### Nicolify luanaState vs vitalia valeriaState
Vitalia: `collapsed | rail | full`  
Nicolify: `collapsed | history | full`  
(No `rail` — Nicolify's intermediate state is `history`)
cycleLuanaState: `collapsed → history → full → collapsed`  
useViewportGuard forces: `full → history` when viewport [768, 1104)

### react-resizable-panels v4 snap-up (Fix A — C3 complementary)
- `useGroupRef` + imperative `setLayout` in `useEffect` catches hydration race where localStorage persisted value is below current minLuanaPct
- `data-shell-ready="true"` emitted after first layout reconciliation → E2E tests can `waitFor('[data-shell-ready="true"]')` instead of arbitrary sleep

### AppPanelSlot: T-5 typed slots
T-3 uses skeleton placeholders for Ribbon+SubTabsBar (6 skeleton boxes + 3 skeleton tabs). T-5 swaps these with real `<Ribbon />` + `<SubTabsBar />` organisms. Pattern matches vitalia AppPanelSlot evolution.

### vitest.config.mts: @luana/hooks alias
Added resolve aliases for `@luana/hooks/*` → `core/@luana/hooks/src/*` + `zustand`/`zustand/middleware` → `nicolify/frontend/node_modules/zustand/*` to resolve the peerDependency resolution gap under Vitest.

### tsconfig.json: paths mapping
Added `@luana/hooks` + `@luana/hooks/*` + `zustand` + `zustand/middleware` paths so `tsc --noEmit` resolves the workspace package source files correctly.

---

## Files Created/Modified

| File | Status | Notes |
|---|---|---|
| `nicolify/frontend/src/stores/shell-store.ts` | REPLACED stub | Real SSR-safe createSsrSafePersistedStore impl (G2) |
| `nicolify/frontend/src/stores/__tests__/shell-store.test.ts` | NEW | 21 unit tests (RED→GREEN) |
| `nicolify/frontend/src/stores/__tests__/shell-store-hydration.test.ts` | NEW | 16 hydration tests SC-3/SC-6/SC-7 (RED→GREEN) |
| `nicolify/frontend/src/components/shared/shell-organism/ShellOrganismLayout.tsx` | NEW | dynamic({ssr:false}) wrapper |
| `nicolify/frontend/src/components/shared/shell-organism/ShellOrganismLayoutClient.tsx` | NEW | Real Group/Panel/Separator + useStoreHydration |
| `nicolify/frontend/src/components/shared/shell-organism/AppPanelSlot.tsx` | NEW | Ribbon+SubTabsBar placeholder slots (T-5 fills) |
| `nicolify/frontend/src/components/shared/shell-organism/useViewportGuard.ts` | NEW | One-way rail guard <1104px (full→history) |
| `nicolify/frontend/src/components/shared/shell-organism/LuanaSidebar.tsx` | NEW | Placeholder stub (T-4 fills) |
| `nicolify/frontend/src/components/shared/shell-organism/ShellModeToggle.tsx` | NEW | Placeholder stub (R0 no-op) |
| `nicolify/frontend/src/__tests__/architecture/no-store-in-ssr-skeleton.test.tsx` | NEW | G2 arch fitness test (30 tests) |
| `nicolify/frontend/vitest.config.mts` | MODIFIED | Added @luana/hooks + zustand aliases |
| `nicolify/frontend/tsconfig.json` | MODIFIED | Added @luana/hooks + zustand paths |

---

## Mockup scope notes

The shell.html mockup shows:
- Full Ribbon with 5 agent tabs (abel/brenda/christian/sara/norvil + config) — NOT BUILT in T-3 (T-5 scope)
- LuanaChat with messages — NOT BUILT in T-3 (T-4 scope)  
- SubTabsBar active states — NOT BUILT in T-3 (T-5 scope)

T-3 delivers: structural dual-panel frame + SSR-safe store + splitter + skeleton placeholders.
The app frame is visible, the store is wired, and the layout hydrates without bugs.

---

## Gate outputs

- `npx tsc --noEmit`: 0 errors ✓
- `npx eslint src/ --cache`: 0 errors, 15 warnings ✓
- `npx vitest run --coverage`: 146/146 tests passed, 47.7% statements (>20% threshold) ✓
- Architecture fitness `no-store-in-ssr-skeleton.test.tsx`: 30/30 tests ✓

---

## Cross-story observed bugs

None observed.

---

## Live verification

`chrome-devtools-verify` not invoked — `make dev-nicolify` requires Docker up + Clerk keys configured. Shell-organism is not yet reachable as a live page until T-6 routing is complete. Live verification deferred to T-6 boot-live-smoke A0 (the DoD for the full story). Escalated to Chris staging gate per T-6 scope.
