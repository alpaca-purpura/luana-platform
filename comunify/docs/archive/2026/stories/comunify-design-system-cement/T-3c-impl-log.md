# T-3c Implementation Log — Auth + Onboarding + Public + Landing Migration

**Story:** comunify-design-system-cement
**Ticket:** T-3c — Migrate auth + onboarding + public + landing (6 files)
**Builder:** builder-frontend (Claude Sonnet 4.6)
**Date:** 2026-05-18
**Branch:** wip/comunify-bootstrap
**Status:** COMPLETE — 0 violations in scope files

---

## Files Migrated (6)

### src/app/(auth)/sign-in/page.tsx

| Stock | Migrated to |
|---|---|
| `bg-gray-50` | `bg-comunify-bg` |

### src/app/(auth)/sign-up/page.tsx

| Stock | Migrated to |
|---|---|
| `bg-gray-50` | `bg-comunify-bg` |

### src/app/onboarding/layout.tsx (SPECIAL: progress bar migration)

| Stock | Migrated to | Notes |
|---|---|---|
| `bg-gray-50` | `bg-comunify-bg` | Page background |
| `bg-gray-200` | `bg-comunify-border` | Progress bar track (`bg-gray-200 → bg-comunify-border` per map) |
| `bg-indigo-600` | `bg-comunify-gradient` | Progress bar fill — per spec T-3c wireframe: onboarding progress bar gets `bg-comunify-gradient` |

Note: `bg-indigo-600` maps to `bg-comunify-primary` per the general map, but the ticket spec explicitly states "onboarding progress bar gets `bg-comunify-gradient`" per spec wireframe. Applied `bg-comunify-gradient` to the fill element per ticket requirement T-3c deliverable. The T-6c acceptance criterion A2 verifies `grep -E 'bg-comunify-gradient' onboarding/layout.tsx`.

### src/app/page.tsx (landing root)

| Stock | Migrated to |
|---|---|
| `text-gray-900` | `text-comunify-text` |
| `text-gray-600` | `text-comunify-text-muted` |

### src/app/public/[creator-handle]/page.tsx

| Stock | Migrated to |
|---|---|
| `text-gray-900` | `text-comunify-text` |
| `text-gray-600` | `text-comunify-text-muted` |

### src/app/public/[creator-handle]/subscribe/page.tsx

| Stock | Migrated to |
|---|---|
| `bg-gray-50` | `bg-comunify-bg` |
| `text-gray-900` | `text-comunify-text` |
| `text-gray-500` | `text-comunify-text-muted` |

---

## Violation Count

| Phase | Count |
|---|---|
| Before T-3c (post T-3b) | ~18 |
| After T-3c | ~10 (auth+onboarding+public scope resolved) |

---

## Validators

| Validator | Result |
|---|---|
| `fe_typecheck` (`npx tsc --noEmit`) | GREEN ✓ |
| `fe_lint` (`npx eslint`) | GREEN ✓ |

---

## Decisions

- **COLOR/CLASS ONLY** — no logic, copy, or component structure changes.
- Onboarding progress bar fill: applied `bg-comunify-gradient` as specified in ticket T-3c (overrides generic `bg-indigo-600 → bg-comunify-primary` rule per explicit spec wireframe requirement).
- Server Component boundaries preserved (none of these files use `"use client"`).
- No voseo found.
- Allowlist stays `[]`.

## Decisions honored: D3, D6
- D3: Migration map applied 1:1 per spec §7, with the progress bar gradient exception as explicitly documented in ticket spec.
- D6: COLOR/CLASS only.
