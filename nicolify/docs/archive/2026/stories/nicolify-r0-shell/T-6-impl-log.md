# T-6 Implementation Log — nicolify-r0-shell

## Ticket
T-6 — Routing route-group + not-found jerárquico + empty-states + e2e regression suite (21 specs)

## Plan

### Design-system-first (D1)
Reused atoms from `@luana/ui-kit` (Button). All new components (`EmptyState`, `PlaceholderCard`, `SubTabContent`, `not-found.tsx` variants) use only semantic tokens — no hex/px hardcoded.

### Mockup adherence + scope
Mockup `shell.html` ratificado 5 tabs. T-6 scope: routing + empty-states + e2e. No layout reinvented. Spec § Microcopy followed verbatim (copy nicole tuteo, 404 messages, empty-state branded for christian/pipeline).

### Batería de tests
- Vitest: 224 PASS (existing + new arch-fitness tests)
- E2E: 21 specs (20 scenarios A1-F2 + boot-live-smoke A0 DoD) — written, DEFERRED per live stack requirement (honest per test-design-doctrine.md verification-real-not-200 rule)
- Architecture fitness: 88 PASS

### Integración CONN (anti-orphan)
- Consumed: SubTabContent consumed by `[agent]/[subtab]/page.tsx`
- On-map: `cap_target: null` (shell infra-container, R0 no capabilities) — routing wired
- Navigable: full reachability from `/{tenantId}` → redirect DEFAULT_LANDING → all 20 sub-tabs
- Notarized: registered in Next.js App Router route-group `(shell-organism)`

## Files created/modified

### Production files (32 total)
- `src/app/[tenantId]/(shell-organism)/layout.tsx` — Server, Clerk auth, D1 tenant skeleton
- `src/app/[tenantId]/(shell-organism)/page.tsx` — redirect DEFAULT_LANDING
- `src/app/[tenantId]/(shell-organism)/not-found.tsx` — shell chrome intact
- `src/app/[tenantId]/(shell-organism)/[agent]/page.tsx` — redirect getDefaultSubtab
- `src/app/[tenantId]/(shell-organism)/[agent]/not-found.tsx` — "Ese agente no existe"
- `src/app/[tenantId]/(shell-organism)/[agent]/[subtab]/page.tsx` — validates A4 XSS, SubTabContent
- `src/app/[tenantId]/(shell-organism)/[agent]/[subtab]/not-found.tsx` — "Esa sección no existe"
- `src/components/shared/shell-organism/EmptyState.tsx` — port vitalia, re-themed
- `src/components/shared/shell-organism/PlaceholderCard.tsx` — port vitalia
- `src/components/shared/shell-organism/SubTabContent.tsx` — 20 combos → EmptyState (R0)
- `playwright.config.ts` — added regression project

### E2E specs (21)
- `e2e/regression/nicolify-r0-shell/boot-live-smoke.spec.ts` — A0 DoD
- 20 scenario specs: A1-A5 / B1-B3 / C1-C3 / D1-D2 / E1-E5 / F1-F2

## Gate results

| Gate | Result | Detail |
|---|---|---|
| `tsc --noEmit` | PASS | 0 errors |
| ESLint | PASS | 0 errors, 102 warnings total (11 new from T-6, all jsdoc/require-description pattern) |
| Vitest | PASS | 224/224 tests |
| Architecture fitness | PASS | 88/88 tests |
| Coverage statements | PASS | 27.94% (≥20% threshold) |
| Coverage branches | PASS | 71.08% |
| Coverage functions | PASS | 38.66% |
| E2E regression | DEFERRED | Stack not up in offline CI env; 21 specs written, require `make dev-nicolify` + `E2E_BASE_URL=http://localhost:3001 npx playwright test --project=regression` |
| `git push` | PASS | SHA 655c9380 pushed to wip/nicolify |

## E2E honesty note (test-design-doctrine.md verification-real-not-200)

The 21 e2e specs require a live stack (`make dev-nicolify` with BE :8001 + FE :3001). They CANNOT be run in this offline environment. They have been written to exercise REAL user actions (navigation, clicks, keyboard shortcuts, DOM state) — not just "did the page return 200".

The boot-live-smoke.spec.ts closes Scenario A0 (Definition of Done): it exercises the full flow (health check → authenticated navigation → DEFAULT_LANDING redirect → empty-state visible). This is the DoD gate per 01-spec.md.

To run the full regression suite:
```bash
cd nicolify/frontend
make dev-nicolify  # or docker-compose up
E2E_BASE_URL=http://localhost:3001 npx playwright test --project=setup
E2E_BASE_URL=http://localhost:3001 npx playwright test --project=regression
```

## Skills consulted (must_load enforcement v4.1)

| Skill | Why invoked | Decision |
|---|---|---|
| `frontend-expert` | FSD-Lite boundaries, Server-First routing, SSR gate | Route group Server Components, no `"use client"` in routing files, tenant skeleton per D1 |
| `nicolify-design-system` | Shell organism component catalog, port verbatim discipline | EmptyState/PlaceholderCard port from vitalia re-themed; SubTabContent uses AGENT_SUBTABS SSoT |
| `playwright-expert` | E2E auth lifecycle, storageState, 21 spec structure | Used auth.fixture.ts, setupClerkTestingToken per skill SSoT; regression project added to playwright.config.ts |
| `tessl__nextjs-app-router-modularization` | Route group layout/page/not-found hierarchy, `params: Promise<>` | All page files Server Components, `await params` per Next.js 16 contract |
| `tessl__react-patterns` | Loading/error/empty states, accessible markup | All not-found pages have `role="status"`, EmptyState has `aria-live="polite"`, semantic HTML |
| `tessl__shadcn-ui` | Reuse `Button` primitive | All CTA buttons use `Button` from `@luana/ui-kit` via `components/ui/button` |
| `tessl__tailwind` | `cn()` for conditional classes, semantic tokens | EmptyState/PlaceholderCard use `cn()`, no inline styles, no hex colors |
| `.claude/rules/anti-orphan-integration.md` | CONN verification | Routing is the entry point; all combos reachable; SubTabContent dispatches; Next.js route-group registers everything |
| `.claude/rules/spanish-text.md` | Tuteo, sin voseo | All microcopy verified: "Ese agente no existe", "Esa sección no existe", copy tuteo per spec § Microcopy |
| `.claude/rules/test-design-doctrine.md` | Verification real ≠ HTTP 200 | E2E specs exercise real actions (navigate, click, DOM state assertions), not just status codes |

## Mockup scope notes
Mockup shell.html shows the full shell with 5 tabs and content area. T-6 scope is strictly:
- Routing (layout, page, not-found hierarchy)
- Empty-states (EmptyState.tsx, PlaceholderCard.tsx, SubTabContent.tsx)
- E2E regression suite (21 specs)

NOT built in T-6 (out of scope): visual goldens (spec declares them as future), real feature content (R1+), N3 sub-sub-tabs.

## chrome-devtools-verify
Live verification NOT possible in this offline environment (no running stack). Escalated to Chris staging gate:
- Gate: `E2E_BASE_URL=http://localhost:3001 npx playwright test --project=regression` with `make dev-nicolify`
- Manual verification steps: navigate `/{tenantId}`, confirm redirect to `christian/pipeline`, confirm EmptyState "Aún no hay deals en tu pipeline" visible, confirm 404 pages for invalid agent/subtab, confirm skip-link present.
