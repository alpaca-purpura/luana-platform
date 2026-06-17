<!-- voseo-allowed: audit review may cite spanish-text.md glosario verbatim per R25 (.claude/rules/spanish-text.md § Magic comment escape) -->

# Phase D — Gherkin verification matrix

> Story: `comunify-design-system-tailwind-v4-tokens` · Ticket: T-1
> Auditor: `auditor-frontend` (Opus 4.7) · Date: 2026-05-18
> SSoT scenarios: `01-spec.md § Acceptance criteria` (SC-01 .. SC-07)
> SSoT mapping: `06-tickets.yaml::T-1.gherkin_coverage`
> Source: gate-output.json (iter `audit-1`, ran_at 2026-05-18T21:41:05Z)

Each SC scenario from `01-spec.md` is mapped to its declared test path
(per `06-tickets.yaml::T-1.gherkin_coverage`), cross-verified against
`gate-output.json` validator results. Verdict per scenario.

| # | Scenario (Gherkin verbatim from `01-spec.md`) | Test path / validator | Status | Evidence |
|---|---|---|---|---|
| SC-01 | body `bg-comunify-bg` utility applies at runtime (happy path) — `getComputedStyle(document.body).backgroundColor` matches `/rgb\(\s*248,\s*250,\s*252\s*\)/` | `comunify/frontend/e2e/specs/smoke/design-system.smoke.spec.ts::body background is comunify-bg + text is comunify-text (computed style)` (l. 54) | ✅ PASS | val-fe-2: "3 passed (1.3s)" — test fires `expect(bodyBg).toMatch(/rgb\(\s*248,\s*250,\s*252\s*\)/)` on line 66, returns GREEN. Also indirectly verified by val-fe-1 (CSS bundle contains `.bg-comunify-bg { background-color: var(--color-comunify-bg); }`). |
| SC-02 | body `text-comunify-text` utility applies (happy path) — `getComputedStyle(document.body).color` matches `/rgb\(\s*1[0-5],\s*1[5-9],\s*3[0-5]\s*\)/` | Same spec/test name (test asserts both bg + color in single test); `comunify/.../design-system.smoke.spec.ts:72` | ✅ PASS | val-fe-2: same test l. 54 contains second assertion `expect(bodyColor).toMatch(/rgb\(\s*1[0-5],\s*1[5-9],\s*3[0-5]\s*\)/)`. Test GREEN. |
| SC-03 | font CSS variables accessible from `:root` (happy path) — `getPropertyValue('--font-satoshi')` non-empty + contains "Plus Jakarta Sans" | `comunify/frontend/e2e/specs/smoke/design-system.smoke.spec.ts::font CSS variables are present on <html>` (l. 27) | ✅ PASS | val-fe-2: test l. 32-45 reads `--font-satoshi` via `getPropertyValue()` and asserts `/Plus Jakarta Sans/`; also asserts `--font-manrope` + `--font-inter` non-empty. GREEN. Note: T-1 corrected the assertion from broken `htmlClassName.toMatch(/--font-satoshi/)` (per `01-spec.md § Fix 1`). |
| SC-04 | body font-family resolves to Inter (negative: not stock sans-serif) | Same test as SC-03 (`font CSS variables are present on <html>`, l. 48-51 — `bodyFontFamily.toLowerCase()` matches `/inter/`) | ✅ PASS | val-fe-2: test asserts `expect(bodyFontFamily.toLowerCase()).toMatch(/inter/)` on l. 51, GREEN. |
| SC-05 | CSS bundle contains generated utility rules (edge: build verification) — bundle contains literal `.bg-comunify-bg` + `.text-comunify-text` + `.font-inter` | val-fe-1 validator (curl + grep direct CSS bundle assertion) | ✅ PASS | val-fe-1: command `curl -sS … | grep -qE '\.bg-comunify-bg\s*\{'` exit_code=0; stdout_tail = `.bg-comunify-bg {`. CSS bundle line count went from 467 → 1673 post-fix (per `T-1-impl-log.md § CSS bundle proof`); `.bg-comunify-bg / .text-comunify-text / .font-inter` all emitted (verbatim sample in impl-log). |
| SC-06 | design-system smoke test suite passes (cumulative) — 3/3 tests pass | val-fe-2 validator (npx playwright design-system.smoke.spec.ts) | ✅ PASS | val-fe-2: "3 passed (1.5s)" — all 3 tests in `design-system.smoke.spec.ts` GREEN. |
| SC-07 | no regression in other passing smoke tests (adversarial) — full suite ≥8 passing (baseline 5 + design-system 3) | val-fe-3 validator (full smoke project) | ✅ PASS | val-fe-3: "8 passed (3.1s)". Baseline 5 (Clerk-blocked 18 remain failing — pre-existing Story 12 deferral, out of scope per `01-spec.md § Out of scope` + validator note in gate-output.json). 8 = 5 baseline + 3 design-system unlocked. Target ≥8 met. No new regression. |

## Aggregate verdict

**7 of 7 scenarios PASS · 0 FAIL · 0 NO_COVERAGE.**

Every Gherkin scenario in `01-spec.md` has a declared mapping in
`06-tickets.yaml::T-1.gherkin_coverage`, and every declared test/validator
returns GREEN per gate-output.json. CSS bundle physical inspection
(val-fe-1) confirms utilities are emitted; runtime computed-style
assertions (val-fe-2) confirm browser-side application; full smoke
regression (val-fe-3) confirms no collateral breakage.

## Notes on assertion fixes (SC-03 + SC-04 + adversarial smoke)

Per `01-spec.md § Test corrections required`, two assertion bugs were
discovered in the test code itself during repro:

1. **SC-03 / line 35** — the test was checking
   `htmlClassName.toMatch(/--font-satoshi/)` but `htmlClassName` contains
   Next.js Google Fonts CSS module class names (e.g.
   `plus_jakarta_sans_b1ca11ca-module__AdoW4q__variable`), never the literal
   `--font-satoshi` token. T-1 corrected to
   `getComputedStyle(document.documentElement).getPropertyValue('--font-satoshi').trim()`
   asserting substring `Plus Jakarta Sans`. Verified in diff
   `git diff 0b09a84..58c6f76 -- comunify/.../design-system.smoke.spec.ts`.

2. **Adversarial probe / line 89** — the third test was scanning for
   `c.startsWith("comunify-")` but Tailwind v4 utilities are
   `bg-comunify-X` / `text-comunify-X` / etc., never bare `comunify-X`.
   T-1 corrected to `c.includes("comunify-")` and also added
   `document.body` to the scanned element list (it had been excluded).
   Diff verified.

Both corrections are within frontend/design-system surface scope and
documented in `01-spec.md § Test corrections required` with verbatim
diff before-after — implementer applied the diff exactly as specified.

## Cross-reference to validator results

| Scenario | Primary validator | Secondary corroboration |
|---|---|---|
| SC-01 | val-fe-2 (runtime computed style) | val-fe-1 (CSS bundle physical proof) |
| SC-02 | val-fe-2 (runtime computed style) | — |
| SC-03 | val-fe-2 (`getPropertyValue` runtime) | — |
| SC-04 | val-fe-2 (`bodyFontFamily` runtime) | — |
| SC-05 | val-fe-1 (CSS bundle curl + grep) | val-fe-2 (utilities apply at runtime — would not if absent from bundle) |
| SC-06 | val-fe-2 (3/3 PASS literal) | — |
| SC-07 | val-fe-3 (≥8 PASS literal, 8 actual) | — |

## Verdict

Phase D matrix complete. All 7 scenarios mapped, executed, and PASS.
No coverage gaps. No skipped scenarios. No `NO_COVERAGE` rows.

Phase D contributes **PASS** to overall T-1 verdict.
