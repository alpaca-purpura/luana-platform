<!-- voseo-allowed: audit review may cite spanish-text.md glosario verbatim per R25 (.claude/rules/spanish-text.md § Magic comment escape) -->

# T-KIT-ALIGN-CHECKPOINTS — Independent audit of abel ICP kit-alignment delta

**Date:** 2026-06-25 · **Auditor:** `/auditor` (auditor-frontend, responsible v5 · Carril R authority) · **Brand:** nicolify
**Story:** nicolify-r1-abel-icp-buyer (`reviewing`, phase `KIT_ALIGNMENT_FIX_LOOP`)
**Scope audited:** the kit-alignment delta ONLY — commits `d3c91f93` (kit-atoms + 7 page-primitive divs) + `2aad9726` (14 micro-layout divs → kit Stack/Grid) over 4 components in `nicolify/frontend/src/features/abel/components/icp/` + the `test-no-div-layout` / `test-no-native-select` ratchets + `BuyerLeafForm.test.tsx`. (`4c67928f` kit Stack/Grid primitive = `core/@luana/ui-kit`, engine, OUT of brand scope — verified separately per task; NOT audited here.)
**Files reviewed:** 4 components + 1 test + 2 ratchet baselines (7 files)
**Skills consulted:** frontend-expert · brand-expert (abel = brand-studio leaf) · frontend-visual-fidelity.md § Storybook · shell-mockup-per-component.md (nicolify, Storybook-first) · design-system-canon §0/§2.5/§2.7/§5
**Live-verified:** PARTIAL (stack up, route reachable, bundle compiles clean, kit imports resolve; authenticated MCP write blocked by cross-brand MCP-profile mismatch — see § Live-verify). Demo gate #37 (Chris) remains the human live check.

## Verdict: **APPROVED**

Zero-behavior-change kit-alignment refactor. Visual output preserved at the class level against the kit contracts. JSX balanced. RHF wiring intact. No test weakening (the decision-power assertion is arguably *stronger*). Ratchet lowering is HONEST (independently re-scanned → abel = 0 / full-src = 18/7, exact match). All gates re-run by me are GREEN.

---

## Gate status (re-run BY ME this session — verdict is the re-run, not a stale JSON)

| Gate | Result | Detail |
|---|---|---|
| `tsc --noEmit` | **PASS** | 1 error total = the pre-existing `core/@luana/hooks/create-ssr-safe-persisted-store.ts` zustand-persist typing (untouched, out of brand scope → `/pm-luana`). **0 abel errors.** |
| `eslint src/features/abel src/__tests__/architecture --cache` | **PASS** | **0 errors**, 142 warnings (all pre-existing in non-migrated abel files: hooks/types/store/icp-schema; the 4 migrated icp files add 0 new). |
| `vitest src/features/abel src/__tests__/architecture` | **PASS** | **344/344** (26 files), incl. the 4 DS ratchets: `test-no-div-layout` (baseline 18/7), `test-no-native-select` (0/0), `test-no-local-kit-primitive`, `test-no-cross-brand-import`. |
| Independent ratchet re-scan | **PASS** | replicated `countLayoutDivs` logic → abel ICP = **0** flagged · full src = **18 total / 7 files** → exact match to new baseline. NOT stale-high. |

---

## The 6 focus points — scored

### 1. Visual preservation (class-level equivalence) — **PASS** (1 WARN-level nuance, non-blocking)

Verified each migrated primitive against the real kit source (`core/@luana/ui-kit/src/layout/stack.tsx` + `page.tsx`):

- `Stack` → `cn("flex", DIRECTION[dir], GAP[gap], align?…, justify?…, className)`. `<Stack gap={1} className="min-w-0">` ≡ `flex flex-col gap-1 min-w-0` ✓ · `<Stack gap={4} align="center" className="py-8 text-center">` ≡ `flex flex-col gap-4 items-center py-8 text-center` ✓ (AnalyzingState). Every gap/align value in the diff maps 1:1 to the original div's classes.
- `Grid` → `cn("grid", COLS[cols], GAP[gap], className)`. `<Grid cols={2} gap={3}>` ≡ `grid grid-cols-2 gap-3` ✓ · `<Grid cols={3} gap={3}>` ≡ `grid grid-cols-3 gap-3` ✓.
- `PageSection` (no `title`) → `<section className={cn("flex flex-col gap-3", className)}>` ≡ the original `<div className="flex flex-col gap-3">` **class-for-class** ✓. The element changes `<div>`→`<section>` and (with no title) adds no heading and `aria-labelledby={undefined}` → a11y-neutral; these were content-grouping divs inside a `Group`, so `<section>` is benign/semantically-fine.
- Non-layout classes (`min-w-0`, `py-4/py-8`, `text-center`, `mt-2 pt-4 border-t border-border/40`, `p-6`) + ALL attributes (`data-testid`, `aria-busy`, `aria-label`, `role`, `aria-live`) preserved via `className` + `...props` passthrough ✓.

**WARN-level nuance (fidelity, NOT a fail):** the native `<textarea>` (local helper, no `min-h`) → kit `Textarea` which carries `min-h-[80px]` in its base + `rounded-control` (token) + `text-base md:text-sm`. The builder added `className="resize-none text-sm"` to every consumption → tailwind-merge restores `resize-none` and forces `text-sm` (matching the old `text-sm`). Net delta: the 2-row textareas now have an ~80px min-height floor (slightly taller min, content/`rows` unchanged) and `rounded-md`→`rounded-control` (both resolve to the same radius token, canon §0). This is a near-imperceptible min-height nudge on empty 2-row fields, not a behavior change. Acceptable canon adoption (the kit Textarea is the canonical atom). Flag only so Chris's #37 demo eyeballs the textarea heights.

### 2. JSX balance — **PASS**

Per-file open/close counts (grep): IcpCard Stack 1/1 · IcpIntakeOverlay Stack 3/3 · IcpDatosForm Stack 3/3, Grid 3/3, PageSection 3/3 · BuyerLeafForm Stack 3/3, Grid 1/1, PageSection 4/4. **Every migrated opening tag has its matching close — zero orphaned/mismatched tags.** Counts match the migration map in T-KIT-ALIGN2-result.md.

### 3. kit-atom correctness + RHF wiring — **PASS**

- 0 native `<select>`/`<textarea>`/`<button>` remain in any of the 4 components; 0 arbitrary-values remain (grep-verified).
- `Badge` from `@luana/ui-kit` (IcpCard) · `Select`/`Textarea`/`Stack`/`Grid`/`PageSection`/`Group` from `@luana/ui-kit`.
- **RHF on the decision-power Select is correct.** `useForm` destructures `register, watch, setValue, reset` (BuyerLeafForm:234). The Select is controlled: `value={watch("decisionPower") ?? ""}` + `onValueChange={(val)=>setValue("decisionPower", val, { shouldDirty: true })}`. This is the *right* migration: the old native `<select {...register(...)}>` cannot drive Radix; `watch`/`setValue` is the canonical controlled pattern, and `shouldDirty:true` keeps the `watch()` subscription (BuyerLeafForm:277) firing autosave on change — autosave behavior preserved.
- `Button`/`Input`/`Skeleton` still from `@/components/ui/*` (local Shadcn) — **deliberately deferred**: the wholesale 8-atom local→kit migration is the design-system-adoption story's systematic job (documented scope boundary). The canon violation (native HTML) is 100% resolved; routing the `×`/`+ Agregar`/`Agregar` controls to the *local* Button atom is consistent. **Minor doc-accuracy WARN (Cat 14/doc, non-blocking):** T-KIT-ALIGN-result.md's table says `<button>` → "kit Button"; the actual import is `@/components/ui/button`. The substance (native→atom) is correct; only the result-doc label is imprecise. No code change needed.

### 4. a11y — **PASS**

- Radix Select (decision-power): native `option`/`listbox` roles + keyboard handled by Radix — strictly superior to the old native `<select>` for the canon. The test exercises the `option` role on open.
- Skeleton loading: `aria-busy="true"` + `aria-label="Cargando buyer"` preserved on `<Stack>` → `getByRole("generic", { name: "Cargando buyer" })` resolves (GREEN).
- Error states: `role="alert"` + `aria-live="polite"` preserved (IcpIntakeOverlay ErrorState outer Stack; BuyerLeafForm `getByRole("alert")`).
- AnalyzingState: `role="status"` + `aria-live="polite"` + `aria-busy="true"` + `data-testid` preserved on `<Stack>`.

### 5. No test weakening — **PASS** (arguably stronger)

`BuyerLeafForm.test.tsx` decision-power assertion went from reading a native `<select>.value === "high"` to: open the trigger (`user.click`) → `findByRole("option", { name: /Alto — decisor final/ })`. Tests the **same behavior** (the decision-power options are offered with the right label) via a more realistic Radix interaction. NOT a vacuous `if(el){…}else{expect(true).toBe(true)}` hedge (checked — no such pattern; no `expect(true).toBe(true)`). Passed in the real run (672ms, Radix opens in happy-dom). T-KIT-ALIGN2 added/changed NO test assertions (every DOM query target preserved via passthrough) — confirmed by the GREEN suite.

### 6. Gates — **PASS** (see Gate status table above; all re-run by me)

---

## Live-verify (#37) — status

**Exercised / confirmed:**
- BE `:8001` health → `{"status":"ok","brand":"nicolify"}` ✓
- FE `:3001` up; abel ICP route `/{tenant}/abel/icp` → **HTTP 307** (auth redirect = route exists, compiled, reachable) ✓
- dev-app tunnel `https://dev-app.nicolify.com` → 307 (Clerk), cloudflared 4 tunnel connections registered ✓
- FE container logs: **0 abel/icp/ui-kit module-resolution or runtime errors** on the changed bundle ✓ (the only log noise is a cosmetic Turbopack `next-code-frame/highlight.rs` char-boundary panic when rendering an error frame that contains the `──` box-drawing chars in abel's `{/* ── Grupo … ── */}` comments — a Turbopack error-renderer bug, recovers, `✓ Ready`; NOT an abel fault. Minor: consider plain `--` separators in comments to avoid tripping it.)
- Lane E Clerk session seeded successfully (`make lane-auth-nicolify`).

**NOT exercised (env limitation, documented — does NOT block):**
- A full **authenticated Chrome-MCP write** on the changed forms (open the decision-power Select live + edit a buyer/datos field) was blocked: `~/.claude.json`'s chrome-devtools MCP `userDataDir` is pinned to **`luana-vitalia-${LUANA_LANE}`**, but the seeded Clerk session is in **`luana-nicolify-E`** — cross-brand profile mismatch. Editing the global/session MCP config mid-audit is unsafe (risks colliding with a parallel vitalia lane-E session), so I did not.

**Why APPROVED despite the partial live-verify:** this is a **zero-behavior-change** kit-alignment refactor. (a) The headline create/extract/edit flow was already live-verified 2026-06-04 (`dod_live_verified: substantial`); (b) the changed surface is covered by 344 GREEN tests incl. the Radix Select open-interaction; (c) visual preservation is verified at the class level against the actual kit contracts; (d) the route compiles and is reachable with a clean bundle. The DoD #37 demo gate (Chris's human live check) remains the explicit owner of final live sign-off before merge (`phase: KIT_ALIGNMENT_FIX_LOOP → demo gate #37 → merge`).

---

## Category summary (relevant categories)

| # | Category | Status | Note |
|---|---|---|---|
| 1 | FSD-Lite | PASS | abel feature-local; kit via `@luana/*`; no cross-feature/cross-brand import (ratchet GREEN) |
| 2 | Server/Client | PASS | client leaf forms unchanged; no Server-Comp hook misuse introduced |
| 3 | React Patterns | PASS | loading/error/empty states preserved; stable keys unchanged; RHF deps intact |
| 4 | Code Quality | PASS | tsc 0 abel-err · eslint 0 err · ratchets shrink-only honest (no growth) |
| 5 | Accessibility | PASS | Radix Select > native; all aria/role/aria-busy/aria-live preserved |
| 6 | Forms (RHF+Zod) | PASS | controlled Select `watch`/`setValue`+`shouldDirty`; autosave-on-change preserved |
| 8 | Master Data / Spanish | PASS | no copy regressions; `min-h-7` token swap; currency RN-11 field grid untouched semantically |
| 10 | Tests / TDD | PASS | decision-power assertion same-behavior/stronger; no vacuous guard; no skip/only |
| 13 | Mirror detection | PASS | net-new Stack/Grid promoted to `@luana/ui-kit` (not left local) — exactly the canon promote-check |
| 14 | Decisions honored | PASS (doc nit) | result.md "kit Button" label imprecise (actual = local Button atom, deferred-by-design); substance correct |
| 16 | Visual fidelity | PASS | composed from `@luana/ui-kit` (Storybook canon); 0 reinvented primitives; 0 arbitrary; net-new promoted to kit + stories (4c67928f); 1 WARN textarea min-h nuance |

## Verdict math

No FAIL in cat 1/2/3/7/11/12/14. No allowlist/baseline growth (both ratchets shrank, honestly). No `/test-frontend` blocker FAILs. Cat 16 PASS (composed from kit, net-new promoted with stories). Two WARN-level nuances (textarea min-h fidelity · result.md "kit Button" label) — both non-blocking, neither a category FAIL. `dod_live_verified: substantial` + zero-behavior refactor + 344 tests + class-level visual proof + #37 demo gate owns final live sign-off → **APPROVED**.

## Self-fix log

None. No mechanical issue found (no class drift, no mismatched tag, no lost attribute). Nothing to fix under Carril R.

## Upstream deficiency (auto-hardening reflex)

Already captured by the prior pass and acted on: HB-111 (kit lacked micro-layout/Grid primitive + scanner not altitude-aware) → the Stack/Grid primitive landed in `@luana/ui-kit` (4c67928f, verified 38/38 separately) and abel migrated to it. No NEW upstream deficiency from this delta. Minor observation (not a HB): the abel `{/* ── … ── */}` box-drawing comments trip Turbopack's error-frame highlighter (`next-code-frame/highlight.rs` char-boundary panic) — cosmetic, recovers; plain `--` separators would avoid it.

done -> nicolify/docs/product/stories/nicolify-r1-abel-icp-buyer/T-KIT-ALIGN-CHECKPOINTS.md
