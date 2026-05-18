# T-1 Implementation Log — Foundation (globals.css + layout + tailwind)

**Story:** comunify-design-system-cement
**Ticket:** T-1 Foundation
**Builder:** builder-frontend (Claude Sonnet 4.6)
**Date:** 2026-05-18
**Branch:** wip/comunify-bootstrap
**Status:** COMPLETE — all T-1 validators GREEN (except fe_build — pre-existing Clerk env issue, documented)

---

## Skills Consulted

| Skill | Reason | Decision |
|---|---|---|
| `frontend-expert` | FSD-Lite boundaries, Server-First default, no cross-feature imports | Applied: layout.tsx is Server Component (no "use client"), fonts loaded at root level per Next.js 16 App Router canonical pattern |
| `tessl__react-patterns` | Error boundaries, loading/error/empty states baseline | Applied: layout.tsx is root Server Component; Providers wraps client boundary |
| `tessl__tailwind` | Utility-first, theme tokens, cn() for conditional classes | Applied: `theme.extend.colors` pattern (v3-compat with v4.1); no inline style |
| `tessl__nextjs-app-router-modularization` | Page Server+Client boundary | layout.tsx is pure Server Component; Providers.tsx handles client boundary (pre-existing, not touched) |
| `chrome-devtools-verify` | Live verification | DEPRECATED on Linux Mint (WSL2+Windows bridge required). Escalating to Chris staging gate manual. See §Live Verification below. |

---

## Decisions Made

### D1: `theme.extend.colors` pattern (not `@theme inline`)
**Decision:** Kept v3-style `theme.extend.colors` with `hsl(var(--x))` values.
**Rationale:**
- Existing `tailwind.config.ts` already used this pattern with 6 seed slots
- `design-system.md` §5 explicitly documents this as the canonical config pattern
- Tailwind 4.1 maintains full backward compat — `theme.extend` valid without warnings
- `@theme inline` CSS-first would require additional refactor outside T-1 scope
- Documented as tech-debt: "If cross-brand lift requires `@theme inline` migration, it's a dedicated story."

### D2: Path B — Plus Jakarta Sans as Satoshi fallback
**Decision:** `Plus_Jakarta_Sans` (Google Fonts) mapped to `--font-satoshi` variable.
**Rationale:** `src/assets/fonts/Satoshi-Bold.woff2` does NOT exist in the repo.
```bash
# Verified:
ls comunify/frontend/src/assets/fonts/Satoshi-Bold.woff2
# → No such file
```
Per spec Scenario 3 option (c): "Plus Jakarta Sans Bold via next/font/google" is the auto-resolve when binary missing. Font variable `--font-satoshi` always set → consumers use `font-satoshi` class normally. Tech-debt declared: "comunify-design-system-satoshi-binary: replace Plus Jakarta fallback with Satoshi Bold woff2 once Chris provides binary."

### D3: `comunify-primary-fg` alias
Added `"comunify-primary-fg": "hsl(var(--comunify-primary-foreground))"` as alias alongside `"comunify-primary-foreground"`. Per 03-arch.md §5 key invariants: design-system.md §6 component recipes use shorter name. Both work.

---

## Files Created / Modified

| File | Action | Notes |
|---|---|---|
| `comunify/frontend/src/app/globals.css` | CREATE | 15 CSS vars HSL channels + radius tokens + gradient |
| `comunify/frontend/src/app/layout.tsx` | MODIFY | 3 fonts (Plus_Jakarta_Sans/Manrope/Inter) + globals.css import + font variables on `<html>` + `bg-comunify-bg font-inter text-comunify-text` on `<body>` |
| `comunify/frontend/tailwind.config.ts` | MODIFY | Extended 6→16 color slots + backgroundImage + fontFamily + borderRadius |
| `comunify/frontend/src/app/__tests__/layout.test.tsx` | CREATE | 9 Vitest unit tests for font vars + body tokens |

---

## Validators Run

| Validator | Command | Result | Notes |
|---|---|---|---|
| `fe_typecheck` | `npx tsc --noEmit` | GREEN ✓ | 0 errors |
| `fe_lint` | `npx eslint src/ --cache` | GREEN ✓ | 0 errors |
| `scenario_happy_tokens_loaded` | `npx vitest run src/app/__tests__/layout.test.tsx` | GREEN ✓ | 9/9 pass |
| `scenario_edge_satoshi_fallback` | `npx vitest run ... -t 'font-satoshi var present'` | GREEN ✓ | 1/1 pass |
| `fe_build` | `npx next build` | BLOCKED — pre-existing Clerk env issue | See §Build Issue below |

---

## Build Issue (pre-existing — not caused by T-1)

`npx next build` fails at prerendering `/cohorts/new` with:
```
Error: @clerk/nextjs: Missing publishableKey.
```

**Root cause:** No `.env.dev` or `.env.local` exists with `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`. This is a pre-existing environment configuration issue — the repo has no committed `.env` files (correctly — they're secret). The compilation step succeeds:
- `✓ Compiled successfully in 7.5s` — Tailwind v4, fonts, globals.css all compiled correctly
- `Finished TypeScript in 2.5s` — 0 TypeScript errors

The prerender failure is Clerk auth validation during SSG, which requires real Clerk credentials. This was pre-existing before T-1 changes (verified: same error with stashed T-1 changes).

**Escalation:** `fe_build` validator requires full dev stack per `04-validators.yaml::preflight`. Visual smoke validators (`make dev-comunify`) are the correct gate for build + Clerk integration. Escalating to Chris staging gate for this validator.

---

## Live Verification

`chrome-devtools-verify` skill is DEPRECATED on Linux Mint (designed for WSL2+Windows bridge, requires rewrite for Linux Mint). Cannot do live browser verification in this environment.

**Escalation:** Chris staging gate manual required before marking PR shipped (per role system prompt). Manual verification steps:
1. Start `make dev-comunify` (backend 8003 + frontend 3003)
2. Open http://localhost:3003 in browser
3. Inspect `<html>` className — should contain `--font-satoshi`, `--font-manrope`, `--font-inter`
4. Inspect `<body>` — should have `bg-comunify-bg`, `font-inter`, `text-comunify-text` computed styles
5. Background should be `#F8FAFC` (comunify-bg HSL 210 40% 98%)

---

## Token Inventory (globals.css)

All 15 CSS vars from `comunify/docs/architecture/design-system.md §1` verified verbatim:

| Var | HSL channels |
|---|---|
| `--comunify-primary` | `264 92% 58%` |
| `--comunify-primary-foreground` | `0 0% 100%` |
| `--comunify-primary-hover` | `254 79% 49%` |
| `--comunify-purple-mid` | `252 100% 62%` |
| `--comunify-blue` | `217 95% 58%` |
| `--comunify-blue-deep` | `220 84% 45%` |
| `--comunify-accent` | `355 100% 69%` |
| `--comunify-stable` | `152 80% 43%` |
| `--comunify-warning` | `45 100% 48%` |
| `--comunify-critical` | `0 84% 60%` |
| `--comunify-text` | `226 49% 9%` |
| `--comunify-text-muted` | `215 16% 47%` |
| `--comunify-bg` | `210 40% 98%` |
| `--comunify-surface` | `0 0% 100%` |
| `--comunify-border` | `214 32% 91%` |
| `--radius` | `0.75rem` |
| `--radius-lg` | `1.25rem` |
| `--comunify-gradient` | `linear-gradient(135deg, #7B2FF7 0%, #6A3CFF 35%, #2D7FF9 70%, #1E5EFF 100%)` |
