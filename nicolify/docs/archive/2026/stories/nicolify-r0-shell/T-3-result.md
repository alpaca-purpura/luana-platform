# T-3 Result — Layout/Splitter + Shell-Store SSR-safe (G2 gate)

**Ticket:** T-3 of nicolify-r0-shell  
**Commit:** 7dfff0f0  
**Date:** 2026-05-30  
**Files changed:** 13 files (1579 insertions, 54 deletions)

---

## Status

All gates GREEN. Tests: 146/146 PASS. TypeScript: 0 errors. ESLint: 0 errors.

---

## Deliverables implemented (verbatim from 06-tickets.yaml T-3)

| Deliverable | File | Status |
|---|---|---|
| shell-store.ts (REPLACE stub · LuanaState/ShellSplitState/mobileDrawerOpen · createSsrSafePersistedStore · key nicolify-shell-state) | `nicolify/frontend/src/stores/shell-store.ts` | ✅ |
| shell-store tests (estados + hydration) | `src/stores/__tests__/shell-store.test.ts` + `shell-store-hydration.test.ts` | ✅ 37 tests |
| ShellOrganismLayout.tsx (port · dynamic({ssr:false}) boundary · skeleton store-free) | `src/components/shared/shell-organism/ShellOrganismLayout.tsx` | ✅ |
| ShellOrganismLayoutClient.tsx (port · Group/Panel/Separator · useGroupRef snap-up · useStoreHydration · hit-area ≥8px · C/R/F · aria-label) | `src/components/shared/shell-organism/ShellOrganismLayoutClient.tsx` | ✅ |
| AppPanelSlot.tsx (port · Ribbon+SubTabsBar+SubSubTabsBar+children slot) | `src/components/shared/shell-organism/AppPanelSlot.tsx` | ✅ |
| useViewportGuard.ts (one-way rail <1104px) | `src/components/shared/shell-organism/useViewportGuard.ts` | ✅ |
| arch test: no-store-in-ssr-skeleton (G2) | `src/__tests__/architecture/no-store-in-ssr-skeleton.test.tsx` | ✅ 30 tests |
| Placeholder stubs for T-4 (LuanaSidebar) + R0 (ShellModeToggle) | `LuanaSidebar.tsx` + `ShellModeToggle.tsx` | ✅ |

---

## Gate output (literal)

### TypeScript (tsc --noEmit)
```
(no output — 0 errors)
```

### ESLint
```
✖ 15 problems (0 errors, 15 warnings)
  0 errors and 1 warning potentially fixable with the --fix option.
```

### Vitest with coverage
```
 Test Files  9 passed (9)
      Tests  146 passed (146)
   Duration  1.34s

Coverage summary:
  Statements   : 47.7% ( 333/698 ) — above 20% threshold ✓
  Branches     : 75.3% ( 61/81 ) — above 20% threshold ✓
  Functions    : 59.25% ( 16/27 ) — above 20% threshold ✓
  Lines        : 47.7% ( 333/698 ) — above 20% threshold ✓
```

### Architecture fitness (no-store-in-ssr-skeleton — G2 gate)
```
Tests  30 passed (30)
```

---

## Skills consulted (must_load enforcement v4.1)

| Skill | Invoked | Decision |
|---|---|---|
| `nicolify-design-system` | ✅ | Port verbatim from vitalia; tokens/catalog confirmed; LuanaSidebar stub for T-4 |
| `frontend-expert` | ✅ | FSD-Lite boundary: AppPanelSlot=Server Component, Client boundary at ShellOrganismLayoutClient; @luana/hooks consumed not recreated |
| `tessl__react-patterns` | ✅ | aria-label on all elements, data-shell-ready for E2E determinism, no array-index keys (Array.from), error boundary via skeleton fallback |
| `tessl__vitest` | ✅ | act()+setTimeout(0) for rehydration async; spy on Storage.prototype.setItem for NO-OP guard test; localStorage direct check post-hydration |
| `.claude/rules/frontend-fsd.md` | ✅ | Boundaries enforced: no cross-brand imports, @luana/* consumed via workspace imports |
| `.claude/rules/test-design-doctrine.md` | ✅ | RED→GREEN TDD; adversarial SC-3 tests (C3 bug pattern from vitalia); arch fitness text-scan |

---

## Critical gate: G2 SSR-safe (C3 bug mitigation)

Vitalia had a production bug where `raw zustand persist()` wrote the default value to localStorage during SSR/skeleton render, clobbering user preferences on every reload. Solution (ADR-vitalia-006, lifted to `@luana/hooks`):

1. `createSsrSafePersistedStore` — `setItem` NO-OP while `_hasHydrated=false`
2. `ShellOrganismLayoutSkeleton` renders `TopBarGlobal variant="skeleton"` — store-free
3. `useStoreHydration(useShellStore)` in `ShellOrganismLayoutClient` (inside `ssr:false`) — triggers `rehydrate()` exactly once

Architecture test `no-store-in-ssr-skeleton.test.tsx` enforces this mechanically (30 tests).

---

## Nicolify adaptations vs vitalia

| Pattern | Vitalia | Nicolify |
|---|---|---|
| Sidebar state | `collapsed\|rail\|full` | `collapsed\|history\|full` (no `rail`) |
| State cycle | `full↔rail` (2-state) | `collapsed→history→full→collapsed` (3-state) |
| Viewport guard force | `full → rail` | `full → history` |
| Storage key | `vitalia-shell-state` | `nicolify-shell-state` |
| Group ID | `vitalia-shell-split-agentic` | `nicolify-shell-split-agentic` |
| Panel ID | `valeria-panel` | `luana-panel` |

---

## Workspace fixes applied

- `vitest.config.mts`: added `@luana/hooks/*` → `core/@luana/hooks/src/*` + `zustand` → `nicolify/frontend/node_modules/zustand` aliases to resolve peerDependency gap under Vitest
- `tsconfig.json`: added `@luana/hooks` + `zustand` paths mappings for `tsc --noEmit` resolution

These are required infrastructure fixes for the workspace monorepo pattern (peerDependencies not hoisted to workspace root).

---

## Live verification

`chrome-devtools-verify` not invoked — app not reachable live until T-6 routing completes (no shell route exists yet). Live verification is the DoD of T-6 via boot-live-smoke A0. Escalated to Chris staging gate per T-6 scope.

---

## Pending (out of T-3 scope)

- LuanaSidebar full impl: `LuanaRail.tsx`, `LuanaHistory.tsx`, `LuanaChat.tsx`, `ChatComposer.tsx`, etc. → T-4
- Ribbon/SubTabsBar real organisms → T-5
- shell-routes.ts + routing route-group → T-5/T-6
