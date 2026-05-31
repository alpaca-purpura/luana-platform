# T-2 Result — TopBarGlobal + LogoMark + TenantSwitcher

**Story:** nicolify-r0-shell  
**Ticket:** T-2  
**Commit:** 24d94d05  
**Branch:** wip/nicolify  
**Date:** 2026-05-30  

---

## Deliverables

| Deliverable | Status | File |
|---|---|---|
| TopBarGlobal.tsx (port · role=banner · LogoMark left + [ThemeToggle · TenantSwitcher] right · h-12) | ✅ DONE | `components/shared/shell-organism/TopBarGlobal.tsx` |
| LogoMark.tsx (port · svg light/dark nicolify · aria-label "Nicolify inicio") + logos in public/nico-assets/ | ✅ DONE | `components/shared/shell-organism/LogoMark.tsx` |
| TenantSwitcher.tsx + TenantBadge + TenantOption (port skeleton · placeholder "Cambiar de agencia") | ✅ DONE | `TenantSwitcher.tsx`, `TenantBadge.tsx`, `TenantOption.tsx` |
| visual golden: shell-desktop-light (header[role=banner]) | ✅ DEFINED | E2E path `e2e/regression/nicolify-r0-shell/topbar-render-desktop.spec.ts` — runs in T-6 |

---

## Gate output (literal)

```
TypeScript (tsc --noEmit): PASS
  0 errors, strict mode

ESLint: PASS
  0 errors, 10 warnings (within baseline)

Vitest:
  Test Files  6 passed (6)
  Tests  73 passed (73)
  Coverage: 71.76% statements / 81.33% branches / 76.19% functions / 71.76% lines

Architecture fitness:
  _agent-tw-classes test (G3): PASS
  spanish-neutro test: PASS
  (no new arch tests added in T-2 — T-3 adds no-store-in-ssr-skeleton)
```

---

## Diff summary

15 files created, 1447 insertions:

```
nicolify/frontend/src/
├── components/
│   ├── shared/shell-organism/
│   │   ├── AddAgencyPlaceholderModal.tsx      (new)
│   │   ├── LogoMark.tsx                       (new)
│   │   ├── TenantBadge.tsx                    (new)
│   │   ├── TenantOption.tsx                   (new)
│   │   ├── TenantSwitcher.tsx                 (new — skeleton)
│   │   ├── TopBarGlobal.tsx                   (new — role=banner, h-12)
│   │   ├── types.ts                           (new)
│   │   └── __tests__/
│   │       └── TopBarGlobal.test.tsx          (new — 12 tests, B1 coverage)
│   └── ui/
│       ├── alert.tsx                          (new — Shadcn bootstrap)
│       ├── dialog.tsx                         (new — Shadcn bootstrap)
│       ├── dropdown-menu.tsx                  (new — Shadcn bootstrap)
│       └── skeleton.tsx                       (new — Shadcn bootstrap)
├── lib/
│   ├── tenant-palette.ts                      (new)
│   └── utils.ts                               (new — cn() utility)
└── stores/
    └── shell-store.ts                         (new — stub, full impl T-3)
```

---

## Key decisions

1. **TenantSwitcher SKELETON** — T-2 delivers a static placeholder ("Cambiar de agencia") per deliverable spec. Live tenant data hooks (useTenants + useTenantStore) are T-3 deliverables.

2. **shell-store.ts STUB** — TopBarGlobal interactive variant imports `useShellStore`. Created a minimal stub with `mobileDrawerOpen` slice. T-3 replaces with `createSsrSafePersistedStore` (G2 gate, SSR-safe).

3. **Logo assets** — Existing `public/nico-assets/` contains the correct SVG assets. `LogoMark` points to:
   - `logotipo-fondoclaro-nicolify.svg` (light mode)
   - `logotipo-fondooscuro-nicolify.svg` (dark mode)
   - `isotipo-nicolify.svg` (mark variant, same for both modes)

4. **Spanish neutro confirmed** — All aria-labels, placeholder text, and microcopy use tuteo with no voseo.

5. **Shadcn primitives bootstrapped** — `dropdown-menu`, `skeleton`, `alert`, `dialog` copied from vitalia (same Shadcn version). `components/ui/` is gitignored from ESLint (standard Shadcn pattern).

---

## Skills consulted

| # | Skill | Decision |
|---|---|---|
| 1 | `nicolify-design-system` | Port verbatim, indigo palette, nico-assets SVGs |
| 2 | `frontend-expert` | FSD-Lite shell in `components/shared/` — boundary matrix |
| 3 | `tessl__shadcn-ui` | Bootstrap missing primitives from vitalia |
| 4 | `tessl__react-patterns` | role=banner, aria-*, skeleton store-free, stable props |
| 5 | `playwright-expert` | B1 visual golden target defined for T-6 E2E |
| 6 | `frontend-visual-fidelity` | Scope discipline: TenantSwitcher live data = T-3 |
| 7 | `spanish-text` | Spanish neutro verified — no voseo |
| 8 | `chrome-devtools-verify` | DEFERRED — offline env (T-6 is live verification gate) |

---

## Ticket: native tests

- B1 scenario coverage: 12/12 TopBarGlobal tests PASS
- 73/73 total tests PASS

---

## Gherkin B1 coverage

```gherkin
Scenario B1: TopBar render desktop light
  Given: shell loads in desktop viewport (≥1280px)
  Then: header[role=banner] is visible
  And: logo mark "Nicolify inicio" is rendered
  And: ThemeToggle button is rendered
  And: TenantSwitcher trigger shows "Cambiar de agencia"
  And: no "clínica" text in TopBar
  And: no voseo in aria-labels
```

All assertions verified by `TopBarGlobal.test.tsx` 12 tests.

---

## Notes

- `chrome-devtools-verify` skipped — environment offline per ticket G5. Live verification will run in T-6 boot-live-smoke (make dev-nicolify + Clerk login + DEFAULT_LANDING).
- `stores/shell-store.ts` is a T-2 stub. T-3 MUST replace with `createSsrSafePersistedStore` from `@luana/hooks` per G2 gate. Tests `no-store-in-ssr-skeleton` will enforce this in T-3.
- TenantSwitcher live implementation (real agency list, tenant switching, path redirect) is T-3 scope per ticket DAG.
