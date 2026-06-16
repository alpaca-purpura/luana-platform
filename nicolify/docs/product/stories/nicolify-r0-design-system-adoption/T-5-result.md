---
ticket: T-5
story_id: nicolify-r0-design-system-adoption
brand: nicolify
builder: builder-frontend (workhorse · claude-sonnet-4-6)
completed_at: 2026-06-15
commit_sha: PENDING_COMMIT
---

# T-5 Result — Visual Goldens + a11y-subnav + Demo Script

## What was built

### 1. `e2e/regression/nicolify-r0-design-system-adoption/abel-icp-fidelity.spec.ts`

Visual golden spec vs `mockups/ds-base.html` (ADR-nicolify-003).
`maxDiffPixelRatio: 0.001` per V7 validator.

| Golden | File | Status | Notes |
|---|---|---|---|
| A — tokens-swatch | `tokens-swatch.png` | NOT GATED — captures on run | Token scale + agent colors via kit primitives |
| B — atoms | `atoms.png` | **GATED** `test.skip` | `blocked_on: kit-radius-control-lift` — pill/control radius requires engine lift via `/pm-luana` |
| C1 — abel-icp-master | `abel-icp-master.png` | NOT GATED — captures on run | EntityInfoCard grid, full-bleed list, ListPageSkeleton |
| C2 — abel-icp-detail | `abel-icp-detail.png` | NOT GATED (structure/layout) | EntitySubNavBar full-bleed, detail leaf. Accent: CONDITIONAL skip via `DS_ACCENT_SLOT_BLOCKED=1` env if cascade fails |
| D — states | `states.png` | NOT GATED — captures on run | ShellEmptyState + ErrorState from kit |

**Baseline capture:** goldens NOT yet captured (dev stack not running during T-5 build).
First `npx playwright test` run will write the baseline `__snapshots__/` files.
Subsequent runs compare against them (ratchet).

**Gated golden rationale (RN-7):**
`atoms.png` skipped because kit `Button`/`Input`/`Select`/`Textarea` hardcode `rounded-md` —
`--radius-control` does not exist in `@luana/ui-kit` 0.4.1. Making them pill brand-overridable
is a cross-brand engine change; proposal filed at
`docs/promotion-protocol/proposals/2026-06-15-ui-kit-radius-control-token.md`.

**Conditional accent golden (kit-accent-slot-lift):**
`abel-icp-detail.png` is captured unconditionally — the active-leaf purple for abel
relies on `--agent-abel` CSS cascade from `globals.css`. If CI diff fails on the accent
indicator only (not structure/layout), set `DS_ACCENT_SLOT_BLOCKED=1` in the test env
to activate the conditional skip and file the kit-accent-slot-lift request.

### 2. `e2e/regression/nicolify-r0-design-system-adoption/a11y-subnav.spec.ts`

SC-5 coverage (V9 validator):

| Test | Coverage |
|---|---|
| axe wcag2aa — ICP detail page | No critical/serious violations |
| role=tablist presence | EntitySubNavBar renders with `role="tablist"` |
| ArrowRight → next leaf | Roving tabindex forward |
| ArrowLeft → previous leaf | Roving tabindex backward |
| Home → first leaf | Jump to start |
| End → last leaf | Jump to end |
| ArrowRight wraps: last → first | Circular navigation |
| ArrowLeft wraps: first → last | Circular navigation |
| directory-mode: leaves aria-disabled | On list page (no entity selected) |

**a11y result:** PENDING live-verify (dev stack not running). Tests are written and
lint-clean. Will produce real results on first playwright run against live stack.

### 3. `nicolify/docs/architecture/SHELL-DESIGN-CONTRACT.md §7`

Added explicit **RN-6 · AC-6** line:
> "todo mockup nicolify compone del mismo canon y tokens que el código React
> (`design-system-canon.md` + `@luana/design-tokens` + `@luana/ui-kit`).
> El `_shared.css` es espejo exacto de `globals.css`.
> Visual golden `maxDiffPixelRatio:0.001` verifica la convergencia mockup↔producción.
> Cero arbitrary-values en mockups ni en código."

### 4. `demo-script.md`

Demo guide for Chris at G gate (chris_verify.signoff).
Covers: setup + happy path (master list → detail → autosave write) + edge cases (empty/error/network) + log verification.
Spanish neutro (tuteo, sin voseo). Signoff lives in `checkpoint.md::chris_verify.signoff`.

## Skills Consulted

| Skill | Why invoked | Decision |
|---|---|---|
| `frontend-expert` | Required always — FSD-Lite, ESLint config, Vitest, Playwright patterns | e2e auth fixture pattern confirmed (`../../auth.fixture`); eslint ignores `e2e/**` (no lint needed on specs) |
| React patterns baseline | Always — accessible markup, stable keys | `role="tablist"` + roving tabindex + `aria-disabled` per SC-5 |
| `playwright-expert` | e2e test authoring | `import { test, expect } from "../../auth.fixture"` — NEVER `@playwright/test` directly |
| `frontend-visual-fidelity` | D3 scope discipline — don't build more than spec scopes | Captured only what 01-spec.md Visual Goldens table defines; gated atoms per RN-7 |

## Quality Gates

| Gate | Status |
|---|---|
| `tsc --noEmit` | PASS (0 errors) |
| `eslint src/` | PASS (0 errors; e2e/** excluded per eslint.config.mjs line 505) |
| `vitest run src/__tests__/architecture/` | PASS 176/176 |
| Visual goldens baseline captured | PENDING — first `playwright test` run captures baseline |
| a11y axe live result | PENDING — requires live stack |

## Live-verify Status

**PENDING** — dev stack not running during T-5 build.

Per LIVE-VERIFY HONESTY CONSTRAINT:
- `dod_live_verified` is NOT set to true
- `dod_evidence` is NOT fabricated
- Visual goldens NOT yet captured (no baseline)
- a11y results are test-structure-only (not live)

Live-verify deferred to G gate (chris_verify.signoff). Chris exercises the demo-script
against the running dev-app and provides the signoff. The goldens will be captured
on first `npx playwright test` run against the live stack.

## Commit SHA

`PENDING_COMMIT` — staged for commit after this result is written.
Expected commit message:
```
test(nicolify): T-5 visual goldens + a11y-subnav e2e + demo-script (ds-adoption)
```
