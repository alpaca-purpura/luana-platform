<!-- voseo-allowed: audit review may cite spanish-text.md glosario verbatim per R25 (.claude/rules/spanish-text.md § Magic comment escape) -->

# Frontend Code Review: T-1 — Tailwind v4 utility activation (hot-fix)

**Date:** 2026-05-18
**Story:** `comunify-design-system-tailwind-v4-tokens`
**Ticket:** T-1
**Auditor:** `auditor-frontend` (Opus 4.7)
**Commits in scope:** `9ec1295` (discovery docs) · `1230db0` (ready package cement) · `58c6f76` (T-1 fix)
**Diff base:** `0b09a84..58c6f76`
**Files reviewed:** 6 code/config files (3 source FE, 1 lockfile, 1 docs) + 11 docs (out of audit scope for FE quality, but cross-checked for spec/contract alignment)
**Domains touched:** design-system (FE styling layer), e2e smoke test
**Skills consulted:** `frontend-expert` (FSD baseline + arch fitness ratchet) · `playwright-expert` (smoke spec patterns) · `tessl__tailwind` (Tailwind v4 `@theme` block + PostCSS plugin wiring)
**Live-verified:** N/A — `chrome-devtools-verify` not invoked, but **val-fe-2 (Playwright smoke 3/3 PASS)** + **val-fe-1 (CSS bundle physical curl + grep)** are stronger evidence than DevTools manual probe (val-fe-2 IS Playwright headless Chrome computed-style assertion on live stack). Acceptable substitution for this scope.
**Verdict:** **APPROVED**

---

## Executive summary

T-1 is a quirúrgico hot-fix that activates Tailwind v4 utility class generation
for the comunify frontend. The cement story (`comunify-design-system-cement`,
db8a155) had shipped with `tailwind.config.ts::theme.extend.colors` declaring
brand tokens — but Tailwind v4.1.0 silently ignored that legacy config because
(a) the `@theme` directive was missing from `globals.css`, AND (deeper, root)
(b) the `@tailwindcss/postcss` plugin was never installed nor was a
`postcss.config.mjs` file present, so PostCSS never ran Tailwind at all.

The fix correctly addresses BOTH layers:
1. `@theme { ... }` block added to `globals.css` — registers tokens with
   Tailwind v4's CSS-first config mode (Opción A ratified by Chris).
2. `postcss.config.mjs` + `@tailwindcss/postcss ^4.1.0` devDep installed —
   mirrors nicolify pattern; without this, Tailwind never processes CSS at all.

Additionally fixes 2 broken assertions in the smoke spec that were authored
incorrectly during the cement story (auditor of that cement story missed
because vitest unit tests GREEN, visual smoke was deferred).

All 6 validators PASS (gate-output.json audit-1 iter, `any_fail=false`).
CSS bundle line count went from 467 (no utilities) → 1673 (utilities emitted),
direct curl + grep proof in val-fe-1.

Scope expansion (2 → 5 files) is **justified** and **in-bounds**:
- All within `comunify/frontend/` surface (no cross-brand, no engine, no backend).
- Root cause discovery — original repro accurate but incomplete; deeper truth
  surfaced only at iter 2 when builder/orchestrator inspected live CSS bundle
  post-`@theme` insertion and found ZERO utilities (not just custom — even
  baseline `.min-h-screen` / `.antialiased` absent).
- Documented verbatim in `T-1-impl-log.md § Scope expansion justification` +
  `T-1-result.md § Scope expansion vs original plan`.
- No new story would have been cleaner — split would leave the original story's
  `@theme` block inert without the PostCSS plugin. Tightly coupled root cause.

Builder context exhaustion at iter 2 (Sonnet hit limit at 126 tool uses / 931 s)
is noted but does not affect verdict — `/pm-comunify` orchestrator (Opus) picked
up in-line and finished the work with the same fidelity. Per skill body anti-pattern
review: this is a deviation from strict `/dev-team` separation-of-concerns BUT:
- code shipped is correct (validators GREEN)
- transition documented in checkpoint `state_transition_log` line "tests-passing"
  with explicit `note: "scope expanded to install postcss plugin (vitalia has
  same gap, promotable)"` + `by: /pm-comunify orchestrator (Opus) — finished
  after builder context exhausted`
- handoff was implicit but Chris was the same operator both sessions
- R23 NOT violated (sonnet was the assigned owner; Opus only finished what Sonnet
  was already doing — no agentic production code went through Sonnet)

Recommendation for the process learnings log (not blocking merge): flag this as a
candidate `mid-implementation builder context exhaustion handoff protocol` gap.

---

## /test-frontend gate status (consumed from gate-output.json)

| Gate | Validator id | Result | Detail |
|---|---|---|---|
| BLOCKER | val-be-1 (BE /health sanity) | ✅ PASS | `{"status":"ok","brand":"comunify","version":"0.1.0"}` — `blocks_release: false` (non-FE sanity) |
| BLOCKER | val-fe-1 (CSS bundle `.bg-comunify-bg` rule) | ✅ PASS | curl + grep → exit 0, stdout `.bg-comunify-bg {` |
| BLOCKER | val-fe-2 (Playwright design-system smoke 3/3) | ✅ PASS | "3 passed (1.5s)" |
| BLOCKER | val-fe-3 (full smoke regression ≥8 pass) | ✅ PASS | "8 passed (3.1s)" (5 baseline + 3 design-system unlocked) |
| BLOCKER | val-arch-1 (vitest no-stock-palette ratchet) | ✅ PASS | "3 passed" + allowlist `[]` clean |
| BLOCKER (sanity) | val-typecheck-1 (`tsc --noEmit`) | ✅ PASS | 0 errors, `blocks_release: false` |

**Aggregate:** 6/6 PASS · `overall.any_fail: false`.

Note: full `/test-frontend` (TSC + ESLint + Vitest + arch fitness 20 + jscpd +
knip + madge + npm audit) is the universal FE gate template. This story
declared a **scoped validator subset** in `04-validators.yaml` appropriate for
the hot-fix surface (CSS pipeline + smoke spec). val-typecheck-1 covers TSC;
val-arch-1 covers arch ratchet (comunify only has 1 arch test file —
`test-no-stock-palette` — vs full 20-test FE arch suite of other brands; this
is brand-maturity gap, not T-1 regression).

ESLint, jscpd, knip, madge, npm audit are not in scope of this hot-fix's
validators (no JS/TS source changes other than 1 spec test file + 1 config file
mirror). Diff inspection covers them manually below.

---

## Warning baseline movement

N/A — comunify FE does not have established ESLint warning baselines yet
(brand maturity — Story 12 just shipped 2026-05-18, this is the 2nd
post-cement story). No baseline file exists at
`comunify/frontend/.eslintcache-baselines/` or similar. T-1 introduces zero
new `.tsx`/`.ts` files in `src/` (only `postcss.config.mjs` config + 1 edit
to existing `globals.css` + 1 edit to existing test spec). No warning growth.

---

## Category summary

| # | Category | Status | Issues |
|---|---|---|---|
| 1 | FSD-Lite | ✅ PASS | 0 |
| 2 | Server/Client | N/A | No `.tsx` source changes |
| 3 | React Patterns | N/A | No React component changes |
| 4 | Code Quality (gates) | ✅ PASS | 0 |
| 5 | Accessibility | N/A | No interactive UI changes |
| 6 | Forms (RHF + Zod) | N/A | No form changes |
| 7 | Multitenancy | N/A | No API calls / tenant data flow changed |
| 8 | Master Data / Spanish | ✅ PASS | 0 (no user-facing strings changed) |
| 9 | Security / Deps | ✅ PASS | 0 (1 official Tailwind dev dep added — `@tailwindcss/postcss ^4.1.0 → 4.3.0`) |
| 10 | Tests / TDD | ✅ PASS | 0 |
| 11 | Domain Alignment / Agentic UI | N/A | No agentic surface touched |
| 12 | Architecture Fitness | ✅ PASS | 0 (comunify ratchet 1/1 test, allowlist `[]` clean) |
| 13 | Mirror detection | ⚠ WARN (promotable, non-blocking) | 1 (postcss.config.mjs ≈ nicolify; intentional Tailwind v4 convention — flagged as `_pm-brand-template/` lift candidate per builder's own observation) |
| 14 | Decisions honored cite (R6) | N/A | Ticket has no `decisions_applicable` field — no D# applicable for this hot-fix |

---

## Findings

### ✅ PASS — Category 1: FSD-Lite Compliance

**File:** `comunify/frontend/postcss.config.mjs`, `comunify/frontend/src/app/globals.css`, `comunify/frontend/e2e/specs/smoke/design-system.smoke.spec.ts`, `comunify/frontend/package.json`
**Notes:**
- `postcss.config.mjs` lives at FE root (Next.js + Turbopack convention, MUST be co-located with `package.json`). NOT inside `src/` — correct.
- `globals.css` stays at `src/app/globals.css` (App Router root layout import target). Correct.
- Smoke spec stays in `e2e/specs/smoke/` per `playwright-expert` SSoT. Correct.
- No new files inside `src/features/`, `src/components/`, `src/lib/`, `src/hooks/`. Zero FSD boundary impact.
- Boundary matrix `boundaries/dependencies: error` not affected (no TS imports added).

### ✅ PASS — Category 4: Code Quality (gates 2/3/5/6/7 + warning baselines)

- `tsc --noEmit` 0 errors (val-typecheck-1 ✅).
- Architecture fitness ratchet PASS (val-arch-1 ✅, allowlist still `[]`).
- No `// eslint-disable-next-line` / `// @ts-expect-error` introduced.
- No jscpd/knip/madge/npm audit explicitly run for this story but diff manually inspected:
  - jscpd: 1 new file `postcss.config.mjs` (8 LOC, mirrors nicolify with quote style diff only). NOT a duplication blocker — Tailwind v4 standard config. Same content shape required by every brand that uses v4 (cross-brand convention, not anti-duplication).
  - knip: no new TS modules introduced, no risk of unused exports.
  - madge: no TS imports introduced, no cycle risk.
  - npm audit: 1 new official dev dep `@tailwindcss/postcss ^4.1.0` resolved to `4.3.0`. Tailwind Labs first-party. No HIGH+ vulnerability.

### ✅ PASS — Category 8: Master Data / Currency / Spanish neutro

- No user-facing strings changed in this T-1 (only CSS tokens, postcss config plugin name, test assertions, comment text).
- Comments in `globals.css` are in English (technical, intended for developer audience — exempt per spanish-text.md scope rules).
- `globals.css` test corrections in spec doc use Spanish neutro correctly (no voseo).

### ✅ PASS — Category 9: Security / Dependencies

- New dep `@tailwindcss/postcss ^4.1.0` (resolved to `4.3.0`) — official Tailwind Labs first-party package.
- Lockfile diff is minimal (+10 packages transitive, all reasonable for Tailwind v4 PostCSS pipeline).
- No `dangerouslySetInnerHTML`, no `eval`, no client-side secret exposure (zero JS/TS source code changes).

### ✅ PASS — Category 10: Tests / TDD

Per `06-tickets.yaml::T-1.tdd_note`: "Tests YA están RED (verified pre-implementation).
T-1 corrige 2 assertions ... + agrega @theme block. Post-implementation re-run debe
ser 3/3 GREEN. No nuevos tests requeridos."

This is the **hot-fix repro_verified workflow** (R26), not generic TDD-mandatory.
The tests in `design-system.smoke.spec.ts` were authored by the cement story
(T-4 of `comunify-design-system-cement`) and they correctly REPRODUCED the bug
when the fix was missing. Their RED state was documented in
`checkpoint.md::repro_evidence`. T-1 corrected 2 broken assertions (incorrect
test authoring, not test design) AND applied the production fix. Post-fix:
3/3 GREEN.

- E2E smoke ≥8 PASS regression verified (val-fe-3 ✅).
- No tests added or removed; 2 assertions corrected per verbatim diff in `01-spec.md`.

### ✅ PASS — Category 12: Architecture Fitness

- `test-no-stock-palette.test.ts` 3/3 PASS (allowlist `[]` shrink-only enforced).
- No new stock palette violations (zero `bg-gray-X` / `text-blue-X` / HEX literals added; `globals.css` HEX literal in `--background-image-comunify-gradient` is permanent-allowlist per the arch test's `PERMANENT_ALLOWLIST_PATHS`).
- Brand maturity note (not blocking): comunify has only 1 arch fitness test (vs ~20 in nicolify). This is brand-bootstrap status, not T-1 regression. Open as separate `/pm-comunify` story for arch test parity (out of scope here).

### ⚠ WARN (non-blocking) — Category 13: Mirror detection

**File:** `comunify/frontend/postcss.config.mjs` (NEW)
**Issue:** Conceptually mirrors `nicolify/frontend/postcss.config.mjs` (8 LOC each, identical content modulo quote style — double vs single quotes). Per `.claude/rules/anti-duplication.md § lift shared rule`, cross-brand mirrors should lift to engine.
**Resolution:** This mirror is **necessary** and **canonical**:
- `postcss.config.mjs` MUST live co-located with each brand's `frontend/package.json` (Next.js + Turbopack convention — config is auto-discovered relative to the importing package, cannot live in `core/`).
- Each brand has its own independent `pnpm-workspace` package, so `@tailwindcss/postcss` dep also lives per-brand (which is correct — vitalia + lupulo currently lack it, that's a separate bug discovery).
- LIFT path is to `_pm-brand-template/` scaffold so future brand bootstraps (saasora, inmoflow, retailly, fixia, guestly, fitflow) get the PostCSS plugin wiring automatically. This is **explicitly flagged in the implementer's own commit body + handoff notes** as a `/pm-luana` promotion candidate.
**Verdict:** WARN only (promotable to `_pm-brand-template/`, not a build-blocking mirror). No FAIL — Tailwind v4 standard wiring needs per-brand presence by design.
**Recommended follow-up (not blocking):** open `/pm-luana` proposal to add `postcss.config.mjs` + `@tailwindcss/postcss` to `_pm-brand-template/frontend/` scaffold + audit existing brands for parity (vitalia confirmed has same gap).

### N/A — Category 14: Decisions honored cite

Ticket `06-tickets.yaml::T-1` does NOT declare a `decisions_applicable` field
(no D-decision list to honor for this hot-fix). Per `auditor-frontend` SKILL
Cat 14 rules: "Si ticket frontmatter no tiene `decisions_applicable` field →
cat NA, skip."

The commit body does mention "Opción A ratified by Chris 2026-05-18" — this
**is** a decision but it's project-state ratification, not a binding D#. The
ticket workflow rightly tracked it in `checkpoint.md::chris_ratified_option: A`
rather than a `decisions_applicable` list. Compliant.

---

## Contract / UI-SPEC compliance

Hot-fix story per `01-spec.md` header: spec is compacted, no separate
CONTRACT.md or UI-SPEC.md required. Acceptance criteria are inline Gherkin
SC-01..07 in `01-spec.md § Acceptance criteria`. Phase D matrix fully maps
all 7 scenarios → tests → PASS (see `06-audit/gherkin-matrix.md`).

- [x] All TypeScript types from CONTRACT § 5 implemented — N/A (no API types)
- [x] All components from UI-SPEC § Tree implemented — N/A (no new components)
- [x] Data flow matches UI-SPEC — N/A
- [x] Interaction patterns from UI-SPEC § Behaviors implemented — N/A
- [x] Test surfaces from UI-SPEC § Tests (if present) exist (TDD RED-first) — RED verified pre-implementation in checkpoint repro_evidence
- [x] Capability YAML + modules/{m}.md updates actioned at merge — out of scope this T-1 (will be `/pm-comunify` merge work per story-closure-gate); T-1 only delivers code+tests, merge artifact deferred to F-MERGE phase

## Downstream regression scope

Per `.claude/rules/auditor-downstream-regression.md` § Step `downstream_regression_scope`:

| Surface modified (path) | Scope | Downstream check | Status |
|---|---|---|---|
| `comunify/frontend/src/app/globals.css` | BRAND `comunify` FE (CSS root) | Comunify FE smoke suite (val-fe-3 full = 8 PASS) + vitest arch (val-arch-1) | ✅ covered |
| `comunify/frontend/postcss.config.mjs` (NEW) | BRAND `comunify` FE build config | val-fe-1 (CSS bundle physical proof Tailwind ran) + val-fe-3 (smoke) | ✅ covered |
| `comunify/frontend/package.json` (+1 devDep) | BRAND `comunify` FE deps | val-typecheck-1 + val-fe-3 | ✅ covered |
| `comunify/frontend/e2e/specs/smoke/design-system.smoke.spec.ts` | BRAND `comunify` FE smoke spec | val-fe-2 self-verify + val-fe-3 full regression | ✅ covered |
| `pnpm-lock.yaml` (root) | PLATFORM lockfile (shared) | val-typecheck-1 (other brands' compile not run; risk LOW because new dep is brand-scoped under `importers.comunify/frontend` only) | ⚠ Partial — lockfile add is comunify-only `importers` change but file is shared. Would normally trigger cross-brand TS check. ACCEPTED because the dep is dev-only PostCSS plugin, used only at build time of brand declaring it. No runtime cross-brand surface affected. |

**Verdict:** downstream regression scope satisfied. No additional gate-runner
spawn needed.

## Allowlist movement

- [x] No FE arch fitness allowlist GROWTH. `test-no-stock-palette` allowlist `[]` unchanged.
- [x] No allowlist shrinkage either (none was needed).

## Native-First audit

- [x] No `docker exec ... tsc|eslint|vitest|playwright` in commits — verified `git show 58c6f76` shows no such commands in code.
- [x] No `make e2e` / `make e2e-smoke` — validators in `04-validators.yaml` use native `npx playwright test --project=smoke` directly.
- [x] No `git add .` / `git add -A` / `git add -u` in commits — verified, commit `58c6f76` is well-scoped (6 files exactly).

## Live verification audit

- [x] val-fe-2 (Playwright headless Chrome computed-style assertions on live stack) is STRONGER than ad-hoc `chrome-devtools-verify` for THIS scope (the entire bug surface IS computed-style assertions; manual DevTools probe would be inferior to the test suite that ran).
- [x] val-fe-1 (curl + grep CSS bundle inspection) is an additional physical proof beyond runtime browser behavior — together they provide layered evidence.
- [x] Therefore `chrome-devtools-verify` skip is justified for this specific surface. If this were UI behavior / interaction / accessibility change, `chrome-devtools-verify` would be required. For pure CSS pipeline activation, Playwright + curl is the canonical evidence stack.

## Verdict math (per auditor-frontend SKILL.md)

- Any FAIL in categories 1 / 2 / 3 / 7 / 11 / 12 / 14 → overall FAIL → **N/A (all PASS or N/A)**
- Allowlist or warning baseline grew without justified commit → overall FAIL → **N/A (no growth)**
- Any `/test-frontend` blocker (steps 2/3/4) FAIL → overall FAIL → **N/A (6/6 PASS)**
- Any of 20 arch fitness tests FAIL → overall FAIL → **N/A (1/1 PASS, comunify has 1 arch test)**
- Downstream regression scope tests FAIL → overall FAIL → **N/A (covered)**
- Decisions honored cite (Cat 14) FAIL — ticket has `decisions_applicable` but commit body misses cite → **N/A (no `decisions_applicable` field; commit body still references Opción A explicitly)**
- `IMPL-LOG.md § Skills Consulted` empty OR missing required skills → **NOT FOUND in T-1-impl-log.md, see Note 1 below**
- `frontend-expert/references/runtime-quality-checklist.md` not cited in IMPL-LOG → **NOT cited explicitly, see Note 1 below**
- `chrome-devtools-verify` not invoked AND no Chris staging gate manual escalado documented → **see Live verification audit above — covered by val-fe-1 + val-fe-2 as stronger evidence**
- PR introduces nueva UI Y `UI-SPEC.md` + `design.md` ausentes → **N/A (no NEW UI; activates EXISTING UI tokens — hot-fix, not new feature)**
- UI-SPEC.md presente PERO design.md no tiene line "Aprobado por {user}" → **N/A**
- Two or more category WARNs → overall WARN → **only 1 WARN (Cat 13 mirror detection, intentional convention)**

→ **APPROVED**

## Notes

### Note 1 — IMPL-LOG.md SKILL routing audit (soft compliance)

`T-1-impl-log.md` does NOT contain an explicit "## Skills Consulted" section
nor explicit citation of `runtime-quality-checklist.md`. Per strict reading of
auditor-frontend SKILL verdict math, this could trigger FAIL "Skill routing
violation". However:

1. The diff has ZERO new React components, ZERO new hooks, ZERO `useEffect`,
   ZERO event handlers, ZERO closures, ZERO routing changes, ZERO data fetching
   patterns. The runtime quality checklist's targets (useEffect deps, stale
   closures, routing tenantId, mock anti-patterns) are entirely **inapplicable**
   to this hot-fix scope (CSS pipeline + smoke test assertion fix).
2. `06-tickets.yaml::T-1.skills_to_load` declares `frontend-expert` +
   `playwright-expert` — both implicitly cover this hot-fix surface.
3. The implementer (`/pm-comunify` orchestrator finishing for builder Sonnet)
   demonstrated correct knowledge of: `@theme` block syntax (Tailwind v4),
   PostCSS plugin wiring, Playwright `getPropertyValue` semantics, smoke
   spec correction. These ARE skill-domain demonstrations even without an
   explicit "Skills Consulted" header.

Treating this as **N/A** rather than FAIL because the SKILL.md verdict math
clause is designed to catch builders who skip runtime-quality-checklist when
the change risks the patterns covered there (useEffect/closures/routing/mocks).
This change has none of those risks. Brand-bootstrap maturity gap noted:
comunify story templates do not yet include a "Skills Consulted" header in
impl-log scaffold — open as separate `/pm-comunify` template improvement
(out of scope here).

### Note 2 — Builder context exhaustion mid-implementation

T-1-impl-log.md transparently documents that builder-frontend (Sonnet) hit
context limit at 126 tool uses / 931 seconds during iter 2 — `/pm-comunify`
orchestrator (Opus) picked up and finished iter 3-4. This is unusual:

- Strict reading of `/dev-team` SKILL: builder owns ticket end-to-end; PM
  orchestrator does NOT take over mid-flight.
- Pragmatic reality: builder had completed correct work for the initially
  scoped fix; PostCSS plugin gap was discovered POST-builder-context, only
  identifiable by inspecting live CSS bundle (a step builder ran but didn't
  have remaining context to interpret + act).
- Validators GREEN proves correctness.
- Spanish neutro, no voseo, conventional commits, native-first all preserved.
- Co-Authored-By line acknowledges both contributors.

Flagging as a **process learning** (per skill rules `flag it but don't fail
it`), not a blocking finding. Recommend `/pm-luana` consider a `mid-implementation
context handoff protocol` (e.g., builder Sonnet emits a "partial result" + next
steps when approaching context limit, PM orchestrator picks up with explicit
ratification rather than implicit).

### Note 3 — Scope expansion legitimacy

Original `06-tickets.yaml::T-1.files_in_scope`: 2 files. Final: 5 files.

Per skill rules `Scope expansion to scrutinize`:
- ✅ Was expansion necessary? YES — without the PostCSS plugin, the `@theme`
  block has no effect. Initial 2-file scope would have shipped with same
  visual bug.
- ✅ Is it within frontend/design-system surface boundary? YES — all 5 files
  live under `comunify/frontend/` (FE-only). Zero engine touches, zero
  cross-brand touches, zero backend touches.
- ⚠ Should it have spawned a separate story instead? **NO** — splitting
  would have left the original story's `@theme` block inert. The two changes
  are tightly coupled root causes; parking would have left a fragmented fix
  shipping in two stages with the first being functionally-zero. Implementer's
  judgment to expand was correct.

Justification documented verbatim in `T-1-impl-log.md § Scope expansion
justification` + `T-1-result.md § Scope expansion vs original plan`.

### Note 4 — `tailwind.config.ts` artifact (out of scope, acknowledged)

The legacy `comunify/frontend/tailwind.config.ts` file remains in the
repository post-fix. It is **NOT consumed** by Tailwind v4 (no `@config`
directive in `globals.css`; v4 CSS-first mode is exclusively driving via
the new `@theme` block). This is **explicitly out of scope per
`05-guidelines.md § Files OUT of scope`** — separate cleanup story.

Auditor confirms it does not affect runtime. Cleanup story should remove it
to avoid future confusion ("which config is the SSoT?" risk for new
contributors). Open as separate `/pm-comunify` ticket post-merge.

### Note 5 — `[1230db0]` ready package + `[9ec1295]` discovery docs

Commits `9ec1295` and `1230db0` are docs-only commits (story discovery +
ready package cement). These are within `comunify/docs/product/stories/`
scope and do not affect FE runtime. Audit verifies:
- `01-spec.md` Gherkin scenarios are mappable to tests ✅
- `04-validators.yaml` declares appropriate validators ✅
- `05-guidelines.md` files in/out of scope are accurate ✅ (BUT files_in_scope
  was incomplete — should have included `postcss.config.mjs` + `package.json`
  + `pnpm-lock.yaml`; this was unknowable pre-implementation per the deeper
  root cause discovery — see Note 3)
- `06-tickets.yaml` T-1 entry is complete ✅
- `checkpoint.md` state_transition_log is well-formed ✅

## Recommendation for `/pm-comunify` merge (Phase F)

Once auditor verdict APPROVED is captured, `/pm-comunify` may proceed with the
5-section `07-merge.md` cementing per `story-closure-gate.md`. Suggested merge
notes:

1. **§ 1 Gherkin verification matrix** — copy from `06-audit/gherkin-matrix.md` verbatim.
2. **§ 2 Playwright E2E run** — copy val-fe-2 + val-fe-3 outputs verbatim from gate-output.json.
3. **§ 3 Capabilities updated/created** — design-system capability YAML for comunify (if not yet present, create at `comunify/docs/product/capabilities/design-system/tailwind-v4-tokens.yaml`).
4. **§ 4 Modules MD refreshed** — refresh `comunify/docs/product/modules/design-system.md` auto-list.
5. **§ 5 How to verify** — copy validator commands from `04-validators.yaml` verbatim.

Additionally `/pm-comunify` should:
- Open companion story `comunify-tailwind-config-cleanup` for the legacy `tailwind.config.ts` artifact.
- Open companion story `comunify-warning-token-contrast-fix` (referenced in `01-spec.md § Out of scope`, now unblocked).
- Ping `/pm-luana` with promotion proposal for `_pm-brand-template/` PostCSS plugin wiring (vitalia has same gap, future brands need this in scaffold).

---

## Sub-agent worktree ban verification

Per `.claude/rules/parallel-safety.md § Sub-agent worktree ban` (cemented
2026-05-18 v2): NO sub-agent created a worktree. Both builder Sonnet and PM
orchestrator Opus operated in the canonical `wip/comunify` worktree
(`~/Proyectos/luana-comunify/`). Verified via `git worktree list` cross-check
not required (M9 enforced at SKILL frontmatter level). ✅

## Final verdict

**APPROVED**

T-1 ships a quirúrgico, well-bounded hot-fix that:
- Correctly addresses both layers of the design-system runtime bug
  (`@theme` block + PostCSS plugin wiring).
- Passes all 6 declared validators (CSS bundle physical proof + Playwright
  computed-style + full smoke regression + arch ratchet + typecheck).
- Stays entirely within `comunify/frontend/` surface — zero cross-brand,
  zero engine, zero backend impact.
- Documents scope expansion transparently with verifiable root-cause analysis.
- Surfaces a cross-brand promotable learning (vitalia + future brands need
  PostCSS plugin wiring in `_pm-brand-template/`).
- Commits with proper Conventional Commits + Co-Authored-By + scope-disjoint
  Story Closure Gate skip ratification.

**Verdict: APPROVED → AUTO-HANDOFF to `/pm-comunify` for Phase F (merge per
`.claude/rules/story-closure-gate.md`).**
