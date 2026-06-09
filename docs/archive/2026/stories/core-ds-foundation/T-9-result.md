# T-9 result — /showcase route rendering real @luana/ui-kit (R-FID durable showcase)

**Ticket:** T-9 · story `core-ds-foundation` · canon §5 (R-FID durable showcase).
**Scope:** `/showcase` route in `vitalia/frontend/` that renders the REAL `@luana/ui-kit` components (replaces static showcase.html) + public reachability + anti-burbuja e2e smoke. Build only — orchestrator runs live Chrome-MCP verification after.

## Files created
- `vitalia/frontend/src/app/showcase/page.tsx` — `"use client"` route. `<main bg-background>` → `PageContainer` → `PageContentStack` → `PageHeader` ("Design System · @luana/ui-kit") + the 5 section components.
- `vitalia/frontend/src/app/showcase/sections/AtomsSection.tsx` — Button (6 variants + sizes), Badge (4), Input, Select (país MX/AR/CO/PE/CL), Avatar, Tooltip, Switch, Checkbox, Card, Separator, Skeleton. `data-testid="showcase-section-atoms"`.
- `vitalia/frontend/src/app/showcase/sections/LayoutPrimitivesSection.tsx` — Toolbar, FilterBar, EmptyState, ErrorState, ListPageSkeleton, FormPageSkeleton, Pagination (stateful), DetailLayout, FormLayout. `data-testid="showcase-section-layout"`.
- `vitalia/frontend/src/app/showcase/sections/EntitySection.tsx` — EntityPicker over a 30-item in-memory `searchClinicas` stub (cursor pagination, NO backend), EntityInfoCard grid (Opción B auto-fill + Skeleton + Empty), EntityWorkspaceLayout in master (entity=null) AND detail (PACIENTE + N3 leaves) modes. `data-testid="showcase-section-entity"`.
- `vitalia/frontend/src/app/showcase/sections/AutosaveGroupSection.tsx` — FloatingAutosaveIndicator (5-state cycle), AutosaveBadge (saving/saved/error), Group + GroupHeader (agent accent + error/missingFields). `data-testid="showcase-section-autosave"`.
- `vitalia/frontend/src/app/showcase/sections/ArchetypesSection.tsx` — ListPageScaffold, DetailPageScaffold, FormPageScaffold (paired + autosaveIndicator), DashboardPageScaffold. `data-testid="showcase-section-archetypes"`.
- `vitalia/frontend/e2e/specs/smoke/showcase.smoke.spec.ts` — anti-burbuja smoke. Imports `test`/`expect` from `../../fixtures/base` (NOT `@playwright/test`). Navigates `/showcase`, asserts the 5 section testids + `Design System` + `Átomos` headings visible; base.ts teardown asserts no pageerror/console-error/Next overlay.

## Files modified
- `vitalia/frontend/src/proxy.ts` — added `"/showcase(.*)"` to `isPublicRoute` matcher (catálogo público, sin tenant/PHI). Existing route protection untouched (entry appended after `/test-stack(.*)`).

All new files start with `// canon: design-system-canon.md §5 · story-origin: core-ds-foundation`. Sample data is LatAm + Spanish neutro (no Lorem ipsum, no USA data). No arbitrary hex/px on locked axes (token classes `bg-agent-*`, `border-t-agent-*`, `border-l-agent-*`); only CSS grid arbitrary `[grid-template-columns:repeat(auto-fill,minmax(250px,1fr))]` (non-locked axis — eslint DS-lock passed).

## Reachability note
`/showcase` is a PUBLIC route — no auth, no tenant, no PHI. Added to `isPublicRoute` in `src/proxy.ts` (vitalia uses the Next 16 edge `proxy.ts` convention, NOT `middleware.ts`). The `config.matcher` is unchanged, so the route is still proxied; `auth.protect()` is simply skipped for it. Anonymous visitors get the catalog directly. The `bareTenantLandingRedirect` edge-redirect does not match `/showcase`, so no redirect. Existing protected routes keep redirecting to `/sign-in`.

## Gate output
- `npx tsc --noEmit 2>&1 | grep -E "app/showcase|e2e/specs/smoke/showcase|e2e/fixtures/base"` → **EMPTY** (my files tsc-clean). One pre-fix error (`ErrorState` was passed `description`/`action`; the kit uses `message`/`onRetry`/`retryLabel` — confirmed by reading `core/@luana/ui-kit/src/layout/states.tsx`) fixed → now clean.
- `npx eslint src/app/showcase --cache` → **0 errors** (DS-lock not tripped).
- `npx eslint e2e/specs/smoke/showcase.smoke.spec.ts --cache` → **0 errors**.
- Live Playwright / dev server NOT run (orchestrator does live Chrome-MCP verification).

## Skills consulted
- None invoked. Export names + prop signatures confirmed by reading `core/@luana/ui-kit/src/index.ts` + component sources (ErrorState/PageHeader/PageSection/states). Anti-burbuja fixture confirmed by reading `vitalia/frontend/e2e/fixtures/base.ts`. Smoke project config confirmed in `playwright.config.ts`. Canon SSoT: `docs/architecture/luana-platform/design-system-canon.md §5`.

## SHA
`a168ae27` (wip/vitalia)
