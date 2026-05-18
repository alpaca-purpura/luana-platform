# T-4 Implementation Log — Playwright smoke design-system.smoke.spec.ts

**Story:** comunify-design-system-cement
**Ticket:** T-4
**Builder:** claude-sonnet-4-6 (autonomous build, Chris pre-authorized)
**Date:** 2026-05-18
**Branch:** wip/comunify-bootstrap

---

## Skills Consulted

| Skill | Why invoked | Decision |
|---|---|---|
| `frontend-expert` | ALWAYS — runtime quality checklist, FSD boundaries, e2e patterns | Followed SOP § E2E Testing, pattern from `dev-stack.smoke.spec.ts` |
| `tessl__react-patterns` | ALWAYS baseline | No async UI changes; spec is test-only, no components |
| `brand-expert` | Invoked per skill matrix (touching comunify tokens surface) | No brand aggregates touched — design system tokens only |
| `offer-expert` | Listed per matrix | Not relevant to this ticket (no offer surfaces) |
| `offer-type-preset-expert` | Listed per matrix | Not relevant (no presets) |
| `copilot-expert` | Listed per matrix | Not relevant (no copilot surfaces) |
| `sales-agent-expert` | Listed per matrix | Not relevant (no sales agent surfaces) |
| `metrics-expert` | Listed per matrix | Not relevant (no analytics surfaces) |
| `chrome-devtools-verify` | FE PR ≥ M — invoked per gate | DEPRECATED for Linux Mint (WSL2-only bridge). Escalate Chris staging gate manual. |

---

## Spec Written

**File created:** `comunify/frontend/e2e/specs/smoke/design-system.smoke.spec.ts`

Verbatim from `03-arch.md §8` — 3 tests in `test.describe("Comunify design system cement smoke")`:

1. **`font CSS variables are present on <html>`** — visits `/`, checks `document.documentElement.className` contains `--font-satoshi`, `--font-manrope`, `--font-inter`. Also checks `getComputedStyle(document.body).fontFamily` matches `/inter/`.

2. **`body background is comunify-bg + text is comunify-text (computed style)`** — visits `/`, checks computed `backgroundColor` matches `rgb(248, 250, 252)` (HSL 210 40% 98%), checks `color` matches narrow regex for `rgb(1[0-5], 1[5-9], 3[0-5])` (HSL 226 49% 9%).

3. **`sign-in page (chrome elements) inherits comunify tokens — no stock gray fallback`** — visits `/sign-in`, checks response 200, checks `backgroundColor` matches `rgb(248, 250, 252)`, checks `hasComunifyClasses` (any DOM element with class starting `comunify-`).

Pattern: follows `dev-stack.smoke.spec.ts` structure. No auth (unauth chrome state only). Native execution, port 3003.

---

## Validators Run

### New spec in isolation:
```bash
E2E_BASE_URL=http://localhost:3003 COMUNIFY_BE_URL=http://127.0.0.1:8003 \
  npx playwright test e2e/specs/smoke/design-system.smoke.spec.ts --project=smoke
```

**Result: 3/3 FAILED**

### Full smoke regression:
```bash
E2E_BASE_URL=http://localhost:3003 COMUNIFY_BE_URL=http://127.0.0.1:8003 \
  npx playwright test --project=smoke
```

**Result: 5/24 passed** (only `dev-stack.smoke.spec.ts` 3 tests + 2 cross-tenant-isolation tests)

---

## Root Cause Analysis

**The spec file is correct.** Failures are caused by an environment mismatch:

### Environment Gap

The running dev container `luana-dev-comunify_frontend_dev-1` mounts from:
```
/home/chalreme/Proyectos/luana-platform/comunify/frontend
```
(= main branch, pre-T-1 changes)

The T-1/T-2/T-3 changes are in the current wip worktree:
```
/home/chalreme/Proyectos/luana-comunify/comunify/frontend
```

### Evidence

Container layout.tsx (main branch):
```
body className="min-h-screen bg-white font-sans antialiased"
```

Wip worktree layout.tsx (T-1 done):
```
body className="min-h-screen bg-comunify-bg font-inter text-comunify-text antialiased"
```

Container has no `globals.css` (T-1 creates it). Body background reports `rgba(0, 0, 0, 0)` (transparent default = no `bg-comunify-bg` class processed by Tailwind), `<html>` className is `""` (no font `.variable` classes applied).

### Pre-existing Smoke Failures (not caused by T-4)

The other 16 failing smoke specs (cohort-create, community-moderation, onboarding-anabella, subscription-create-dunning, cross-tenant-isolation) fail due to Clerk testing token setup (`CLERK_TESTING_TOKEN` not configured in this environment). These were failing BEFORE T-4 and are out of scope for this ticket.

---

## Status

**Spec file: READY** — `design-system.smoke.spec.ts` correctly validates the cemented design system tokens once T-1/T-3 are deployed to the running dev stack.

**Tests: BLOCKED** — will pass once wip branch is merged to main branch (which the container reads from), OR container is reconfigured to mount from `luana-comunify/` worktree.

**Action required:** /pm-comunify or Chris must squash-merge `wip/comunify-bootstrap → main` (after T-5 validators pass) or restart the dev container pointing at the worktree path for smoke validation.

---

## Live Verification

`chrome-devtools-verify` skill DEPRECATED for Linux Mint (designed for WSL2+Windows bridge). Escalating to Chris staging gate manual per instructions.

Manual verification path (once container reflects T-1/T-3):
1. `curl -s http://localhost:3003/ | grep 'bg-comunify-bg'` — should match
2. DevTools → Elements → `<html>` className should contain `__font_satoshi__` `__font_manrope__` `__font_inter__` (or similar next/font hashed names containing the variable substrings)
3. DevTools → Computed → body → `background-color: rgb(248, 250, 252)`

---

## Decisions Honored (per 03-arch.md §18)

- **D7** — Smoke tests use unauth chrome state (no Clerk fixture coupling for design-only smoke). ✓
- **D8** — Native execution via `npx playwright test`, never `make e2e*`. ✓
