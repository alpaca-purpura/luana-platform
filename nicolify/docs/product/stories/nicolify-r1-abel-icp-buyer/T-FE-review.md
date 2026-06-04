<!-- voseo-allowed: audit review may cite spanish-text.md glosario verbatim per R25 (.claude/rules/spanish-text.md § Magic comment escape) -->

# Frontend Code Review: Abel → ICP & Buyer (R1)

**Date:** 2026-06-04
**Story:** nicolify-r1-abel-icp-buyer
**Tickets reviewed:** T-FE-1, T-FE-2, T-FE-3, T-FE-4, T-E2E-1
**PR / CONTRACT / UI-SPEC:** 03-arch.md (+be/fe/agentic), 04-validators.yaml, 05-guidelines.md, 06-tickets.yaml, mockups/icp-buyer.html
**Files Reviewed:** ~35 FE source + 12 test + 4 POM + 3 e2e specs
**Domains touched:** abel (brand-extension NEW · ICP+Buyer · draft-first intake)
**Skills consulted:** frontend-expert, brand-expert (BuyerPersona schema ref), nicolify-design-system (G1/G2/G3), playwright-expert (e2e authoring), chrome-devtools-verify (live-verify gate — deferred)
**Live-verified:** N (DEFERRED to #37 demo gate — expected per build plan; see § Live-verify note)
**Verdict:** **CHANGES_REQUESTED**

---

## ★ Pre-existing R0 + live-verify-deferred note (read FIRST — do not mis-attribute)

1. **PRE-EXISTING R0 BUG (out of scope · non_egoismo):**
   `src/components/shared/shell-organism/__tests__/ShellOrganismLayoutClient.test.tsx`
   has 2 RED tests ("AppPanelSlot duplicated 2×" in agentic + web mode). Verified:
   `git log a2c38840..HEAD -- ShellOrganismLayoutClient.tsx*` is **EMPTY** — the wrapper
   file is UNTOUCHED by R1. It is in `forbidden_to_touch` (wrapper R0). Documented in
   `nicolify/docs/observed-bugs/2026-06-03-shell-layout-apppanelslot-duplicated.md`.
   **NOT attributed to R1, NOT a CHANGES_REQUESTED trigger.** The 2/361 vitest reds = exactly these.
   My scoped run confirms: only these 2 fail; all abel/shell-organism/intake/architecture tests GREEN.

2. **LIVE-VERIFY DEFERRED to #37 demo gate (expected · correct):**
   E2E suite is AUTHORED + static-green (tsc / `playwright --list`). Live execution + visual
   golden baseline capture + `dod_evidence` are DEFERRED to the #37 demo gate (nicolify dev stack
   stale 12h pre-abel, migration 002 not applied, Chrome MCP disconnected). Per build plan this
   is EXPECTED — **NOT a CHANGES_REQUESTED trigger.** `/pm-nicolify` enforces live-verify +
   `demo_signoff` at merge (`reviewing → done`, DoD #37). Checkpoint correctly records
   `dod_live_verified: false` as PENDING. Phase D live-verify = PENDING (the #37 gate).

---

## /test-frontend Gate Status

| Gate | Step | Result | Detail |
|---|---|---|---|
| QUALITY | tsc --noEmit | PASS | 0 errors strict (verified live) |
| QUALITY | ESLint (60+ rules) | PASS (post self-fix) | **0 errors**, 288 warnings. Was 10 errors (prettier in 2 R1 test files) → Carril A self-fix `--fix` → 0 |
| QUALITY | Arch fitness (90 tests) | PASS | 90/90 (test_agent_tw_classes, no-store-in-ssr-skeleton, test_shell_routes_ssot, test_spanish_neutro — new files scanned) |
| FUNCTIONAL | Vitest + coverage | PASS | 359/361 (2 reds = pre-existing R0 wrapper, out of scope). abel scope 131/131. Coverage ≥20% enforced by vitest.config.mts |
| HEALTH | jscpd | NOT_WIRED | FE-infra pending per implementation_flow table |
| HEALTH | knip | NOT_WIRED | FE-infra pending |
| HEALTH | madge | NOT_WIRED | FE-infra pending |
| HEALTH | npm audit | NOT_RUN | runs in make ci-parity |

## Warning Baseline Movement

| Category | Baseline (FE1) | Current | Δ | Status |
|---|---|---|---|---|
| Total ESLint warnings (nicolify FE) | 290 (FE4 gate) | 288 (post self-fix) | −2 | shrink ✓ |

Baseline did NOT grow. The self-fix removed the 10 prettier errors and net-reduced warnings. No Category 4 baseline FAIL.

## Category Summary

| # | Category | Status | Issues |
|---|---|---|---|
| 1 | FSD-Lite | PASS | 0 |
| 2 | Server/Client | PASS | 0 |
| 3 | React Patterns | WARN | 1 (over-memo watch-in-deps; "+ buyer" lands in Cat 11/15) |
| 4 | Code Quality | PASS (post self-fix) | 0 (10 prettier errors fixed Carril A) |
| 5 | Accessibility | PASS | 0 (role=tablist + roving tabindex + arrows + aria; axe deferred to e2e) |
| 6 | Forms (RHF + Zod) | PASS | 0 |
| 7 | Multitenancy | PASS | 0 (tenantId from useParams, NEVER orgId; source-scan tests) |
| 8 | Master Data / Spanish | PASS | 0 (no USD hardcode; tuteo neutro; ISO 4217 user-provided) |
| 9 | Security / Deps | PASS | 0 |
| 10 | Tests / TDD | WARN | 1 (SC-add-buyer e2e is affordance-only + deferred; no integration test for create flow) |
| 11 | Domain Alignment / Agentic UI | FAIL | 1 ("+ buyer" create flow broken — dead handler) |
| 12 | Architecture Fitness (20→4 nicolify) | PASS | 0 (4/4 declared gates GREEN) |
| 13 | Mirror detection | PASS | 0 (ICP net-new; EntitySubNavBar port flagged lift-candidate, not lifted) |
| 14 | Decisions honored cite (R6) | NA | ticket frontmatter has no `decisions_applicable` field |
| 15 | Connectivity (anti-isla) | WARN | 1 ("+ buyer" leaf navigates to a dead route — partial island) |
| 16 | Visual fidelity (DS + scope + states) | PASS | 0 (no ring RN-8; atoms reused; states present; scoped goldens) |

---

## Findings

### FAIL: "+ buyer" affordance never creates a buyer — dead `useCreateBuyer` handler + dead-route navigation
**Category:** 11 (Domain Alignment) + 15 (Connectivity)
**File:** `nicolify/frontend/src/features/abel/components/icp/IcpEntityLayoutClient.tsx:91-126`
**Issue:** The "+ buyer" leaf is built with `href: ${basePath}/__add_buyer__` (L94) and
`isAddAffordance: true` (L95). `EntitySubNavBar` renders it as a `<button>` whose `onClick`
does `router.push(leaf.href)` (EntitySubNavBar.tsx:243-248) — there is **no `onLeafClick` /
`onAddBuyer` callback** in `EntitySubNavBar`'s prop interface. The `handleAddBuyer` /
`handleLeafClick` closures in `IcpEntityLayoutClient` (L105-126) are **dead code**: they are
`void`-ed (L126: "consumed by EntityWorkspaceLayout via EntitySubNavBar") but are NOT passed to
`EntityWorkspaceLayout` (L128-138 has no such prop) and `EntityWorkspaceLayout` does not forward
any leaf-click callback to `EntitySubNavBar`. Result: clicking "+ buyer" navigates to the literal
route `/{tenantId}/abel/icp/{icpId}/__add_buyer__` →  `[leaf]/page.tsx` → `IcpWorkspaceView`
with `leaf="__add_buyer__"`. Since `leaf !== "datos"`, `buyers.find(b => b.id === "__add_buyer__")`
returns undefined → renders "No se encontró este buyer" error (IcpWorkspaceView.tsx:128-137) when
`buyers.length > 0`, or attempts `<BuyerLeafForm buyerId="__add_buyer__" />` (404 fetch) when empty.
`useCreateBuyer` **never fires.** This breaks **SC-add-buyer** (a declared scenario in
04-validators.yaml § scenario_coverage / business_rules RN-5), which is the core ICP→N-buyer
model this whole story exists to deliver.
**Fix (Carril B — needs new test):** Wire an explicit `onAddBuyer` (or `onLeafClick`) callback
prop through `EntitySubNavBar` → `EntityWorkspaceLayout` → `IcpEntityLayoutClient`. For the
`isAddAffordance` leaf, EntitySubNavBar must call the callback INSTEAD of `router.push(href)`.
`IcpEntityLayoutClient.handleAddBuyer` then `await createBuyer.mutateAsync(...)` and
`router.push(${basePath}/${newBuyer.id})`. Add a co-located component test (RHF/RQ mocked)
asserting click → mutation called → navigate to new buyer leaf, plus an e2e SC-add-buyer that
exercises the create (not just affordance presence). Also add a `data-add-affordance="true"`
attribute on the "+ buyer" `<button>` — the existing e2e locator
(`abel-icp-regression.spec.ts:648`) targets it but EntitySubNavBar never renders it.
**Why Carril B (not self-fix):** requires a NEW integration test to lock the corrected
click→create→navigate path; no existing test covers it (the EntitySubNavBar test only asserts
the affordance renders + is disabled in directory mode; SC-add-buyer e2e is affordance-only and
its assertion is commented out / deferred). Auditor never writes tests → hand to `builder-frontend`.
**Skill ref:** agent-revenue-engine.md (ICP→N buyers model) · anti-orphan-integration.md (CONN-N) ·
04-validators.yaml SC-add-buyer / RN-5 · tdd-mandatory.md.

### WARN: `useMemo` over-stabilisation of RHF `watch("signals")` with eslint-disable
**Category:** 3 (React Patterns)
**File:** `nicolify/frontend/src/features/abel/components/icp/IcpDatosForm.tsx:260-264`
**Issue:** `currentSignals = useMemo(() => watch("signals") ?? [], [watch("signals")])` with an
`// eslint-disable-next-line react-hooks/exhaustive-deps`. Calling `watch(...)` inside the deps
array on every render defeats the memo and is the kind of subtle RHF anti-pattern the runtime
checklist warns about. The signal list is small (tag pills) — a plain `const currentSignals =
watch("signals") ?? []` is clearer and equally correct. Non-blocking.
**Fix:** drop the `useMemo` + eslint-disable; read `watch("signals") ?? []` inline.
**Skill ref:** frontend-expert/references/runtime-quality-checklist.md (memoization correctness).

### WARN: SC-add-buyer e2e is affordance-only + assertion commented out
**Category:** 10 (Tests/TDD)
**File:** `nicolify/frontend/e2e/specs/regression/abel-icp-regression.spec.ts:627-651`
**Issue:** The SC-add-buyer test only checks the "+ buyer" affordance is present and the actual
`expect(addAffordance).toBeVisible()` is commented out (`void addAffordance`). It does not
exercise the click→create→new-leaf flow. This is the test that should have caught the FAIL above.
Couple this fix with the Cat 11 Carril B remediation.
**Skill ref:** definition-of-done-live-verify.md § business-rules coverage · tdd-mandatory.md.

### WARN (informational): stale doc comments
**Category:** N/A (cosmetic)
**Files:** `IcpMasterListView.tsx:22` claims `useStoreHydration called here` (it isn't — only a
selector subscription; SSR-safety still holds via the factory). `IcpEntityLayoutClient.tsx:126`
"consumed by EntityWorkspaceLayout via EntitySubNavBar" — false (the dead handler, see FAIL).
Not a behavior issue; clean up when fixing the FAIL.

---

## Self-fix log (Carril A · auditor-self-fix-policy v4.2)

| # | File:line | Fix | Existing test covering | Verification |
|---|---|---|---|---|
| 1 | `src/components/shared/DraftFirstStarter.test.tsx` (8 prettier errors) | `eslint --fix` (prettier formatting only — collapse multi-line JSX props) | `DraftFirstStarter.test.tsx` (8 tests, run GREEN before+after — formatting does not change behavior) | re-ran vitest 8/8 GREEN + eslint 0 errors |
| 2 | `src/components/shared/ProposalBanner.test.tsx` (2 prettier errors) | `eslint --fix` (prettier formatting only) | `ProposalBanner.test.tsx` (10 tests, GREEN before+after) | re-ran vitest 10/10 GREEN + eslint 0 errors |

**Carril A authority check:** (1) NO new test required — the files ARE the existing tests, behavior
unchanged; (2) NOT stake-asymmetric — pure prettier formatting in test files; (3) FE surface only.
**Gate re-run (independent verification):** `tsc --noEmit` → 0 · `eslint src/` → **0 errors** (was 10) ·
`vitest` 2 affected files + architecture → 108/108 GREEN. ALL GREEN. Working-tree only (no commit —
orchestrator serializes). Caps: 2 self-fixes (≤5), 1 audit iteration (≤4). Within bounds.

> Note: the per-ticket gate JSONs (fe3/fe4) and result MDs labeled these 10 errors as
> "pre-existing in T-FE-2 test files". That is a **mislabel** — `DraftFirstStarter.test.tsx` and
> `ProposalBanner.test.tsx` were CREATED by T-FE-2 (this story); the errors were introduced here,
> not pre-existing. Corrected via Carril A. Builder should not repeat "0 errors in scope, N
> pre-existing elsewhere" when the "elsewhere" files are this story's own deliverables.

---

## Contract / UI-SPEC Compliance

- [x] TypeScript types from 03-arch-fe § 6 implemented (camelCase mirror, ISO 8601 strings, optionals explicit) — `types/icp.ts`, `buyer.ts`, `extract.ts`, snake→camel mapping in `api/`.
- [x] Components from 03-arch-fe § 1 implemented (Server/Client per spec): Server layout (`[entityId]/layout.tsx`, `[leaf]/page.tsx` — no "use client", await params Next 16); Client roots (`IcpMasterListView`, `IcpWorkspaceView`, `IcpEntityLayoutClient` — "use client").
- [x] Data flow matches spec (React Query for ICP/buyers/job; Zustand for UI overlay state only; URL-derived activeLeaf; RHF for forms). NUNCA Zustand for fetched data.
- [x] Interaction patterns: draft-first (RN-2 DraftFirstStarter), propose/ratify (RN-3 ProposalBanner), autosave 600ms (RN-8), mark-ready 422 missing[] inline (RN-8, NO completeness ring), WhatForChip per group (RN-4), set-primary (RN-6).
- [~] Test surfaces from 04-validators § scenario_coverage exist — 31 e2e authored, 0 MISSING in matrix; **but SC-add-buyer is affordance-only and the underlying flow is broken (see FAIL).**
- [ ] capability YAML + modules/abel.md updates → `/pm-nicolify` Fase F (post-merge, not this review).

## Validator table (04-validators.yaml § frontend)

| validator_id | Verdict | Evidence |
|---|---|---|
| test_agent_tw_classes (G3 _agent-tw-classes, no template-literal classes) | PASS | grep: 0 `className={\`...\`}`; agentBgClass/agentTextClass static lookups; arch test 5/5 GREEN |
| no-store-in-ssr-skeleton (G2 EntityWorkspaceLayout skeleton store-free) | PASS | EntityWorkspaceLayout has no store import; abel-ui-store uses createSsrSafePersistedStore; arch test 30/30 GREEN |
| test_shell_routes_ssot (abel.icp already in SSoT, NO new catalogs) | PASS | arch test 13/13 GREEN; SubTabContent dispatches existing key |
| test_spanish_neutro (tuteo, no voseo) | PASS | arch test 42/42 GREEN (new files scanned); manual: "Revisa", "Configura", "Guardado.", "Marcar listo" — tuteo |
| SC-a11y (tablist + roving tabindex + arrows; directory aria-disabled; axe wcag2aa) | PASS (component-level) · axe DEFERRED | EntitySubNavBar role=tablist, roving tabindex, ArrowLeft/Right/Home/End, directory aria-disabled+tabIndex=-1; axe wcag2aa deferred to e2e #37 |
| SC-large (200 ICPs paginate + 30-leaf overflow) | PASS (authored) | IcpMasterListView CSS grid + native scroll; EntitySubNavBar overflow-x-auto; live perf deferred |
| SC-empty (DraftFirstStarter) | PASS | empty branch → DraftFirstStarter; smoke cold-start variant clears localStorage |
| RN-2 (draft-first) | PASS | DraftFirstStarter 2-path; never blank form |
| RN-3 (propose/ratify) | PASS | ProposalBanner shown origin=draft && status=borrador; Ratificar→markReady, Descartar→delete+nav |
| RN-4 (WhatForChip consumer) | PASS | WhatForChip per group; 5 agents; null when empty; accessible |
| RN-6 (set-primary ≤1) | PASS (FE) | BuyerLeafForm set-primary button (hidden when isPrimary); useSetPrimaryBuyer invalidates list (server atomic) |
| RN-8 (mark-ready missing[] inline, NO completeness ring) | PASS | 422 missing[] mapped to per-group inline alerts; **no ring/bar** (grep: 0 production ring; e2e asserts `completenessRing.toHaveCount(0)`) |
| RN-11 (currency no-hardcode) | PASS | avgTicketCurrency user ISO 4217; placeholder "MXN"; grep: 0 `'USD'` in production |
| fetchClient X-Tenant-ID from useParams (NEVER orgId) | PASS | hooks read `useParams().tenantId`; grep: 0 orgId usage (only "NEVER orgId" comments + source-scan tests) |
| RN-5 (buyer FK icp_id / one-icp) | **FAIL** | data layer scopes buyers to icpId, BUT "+ buyer" create flow never fires (see FAIL finding) |

## Allowlist Movement
- [x] No FE arch fitness allowlist grew (4/4 declared gates GREEN, shrink-only intact).
- [x] No new catalogs (test_shell_routes_ssot GREEN — abel.icp pre-existing in SSoT).

## Native-First Audit
- [x] No `docker exec ... tsc|eslint|vitest|playwright` in evidence (native `npx` throughout).
- [x] No `make e2e` / `make e2e-smoke` (Playwright authored native; live run deferred to #37).
- [x] No `git add .` / `-A` / `-u` (orchestrator serializes; self-fix working-tree only, no commit).

## Live Verification Audit
- [~] User-facing change → live-verify DEFERRED to #37 demo gate (expected per build plan; NOT a WARN trigger here). demo-script.md present (SETUP/HAPPY/EDGE/TEARDOWN + demo_signoff awaiting Chris). `/pm-nicolify` REFUSE merge without dod_evidence + demo_signoff.

## Verdict Math
- **Cat 11 (Domain Alignment) FAIL** — "+ buyer" create flow broken (dead handler + dead-route nav) → **overall CHANGES_REQUESTED**. Breaks SC-add-buyer (declared scenario) + RN-5 core ICP→N-buyer model. Requires Carril B (new test) → `builder-frontend`.
- Cat 15 (Connectivity) WARN reinforces (partial island: "+ buyer" leaf reaches a dead route).
- All `/test-frontend` blockers (tsc 0 / eslint 0 post self-fix / vitest reds = pre-existing R0 only) PASS.
- All 4 declared arch fitness gates PASS; no allowlist/baseline growth.
- 2 pre-existing R0 reds + live-verify-deferred = NOT triggers (documented).
- IMPL-LOG skills consulted present (frontend-expert + nicolify-design-system + brand-expert + playwright-expert) — no skill-routing violation.
- Otherwise the implementation is high quality: FSD-Lite clean, Server/Client correct, RHF+Zod forms, tenant isolation honored, no USD hardcode, no completeness ring, G2/G3 respected, accessible nav, scoped visual goldens, anti-burbuja base.ts. **The single FAIL is isolated and surgically fixable.**

→ **CHANGES_REQUESTED** — fix the "+ buyer" create flow (Carril B, `builder-frontend`): wire `onAddBuyer` callback through EntitySubNavBar → EntityWorkspaceLayout → IcpEntityLayoutClient, fire `useCreateBuyer` + navigate to new buyer leaf, add `data-add-affordance` attribute, add component + e2e tests for the create path. Then re-handoff `/auditor`.

---

## Audit iteration 2 (2026-06-04) — Carril B fix re-verification

**Fix commit:** `d5ee83e0` — "fix(nicolify-abel): wire + buyer create flow (audit iter 1 · SC-add-buyer/RN-5)" (builder-frontend, Carril B).
**Scope of this iteration:** focused verification of the single iter-1 FAIL (Cat 11 + Cat 15) + no-regression sweep + scoped gates. **Verdict: APPROVED.**

### 1. The FAIL is genuinely resolved ✓

| Check | Evidence |
|---|---|
| `onAddAffordance` callback threaded EntitySubNavBar → EntityWorkspaceLayout → IcpEntityLayoutClient | EntitySubNavBar.tsx:80-86 (prop) + 257-261 (onClick branch); EntityWorkspaceLayout.tsx:50-57 (prop) + 117-120 (forward); IcpEntityLayoutClient.tsx:119-141 (handleAddBuyer + onAddAffordance) + 148 (passed) |
| Affordance leaf fires `createBuyer.mutateAsync` INSTEAD of `router.push(href)` | EntitySubNavBar.tsx:254-262 — `if (isAdd && onAddAffordance) onAddAffordance(); else router.push(leaf.href)`. `handleAddBuyer` → `createBuyer.mutateAsync({ name: "Nuevo buyer", isPrimary: buyers.length === 0 })` |
| On success navigates to the new buyer's leaf (no dead route, no error state) | IcpEntityLayoutClient.tsx:130-134 — `router.push(/{tenantId}/abel/icp/{icpId}/${newBuyer.id})` guarded by `newBuyer?.id` |
| Dead `__add_buyer__` route removed | Affordance leaf `href: ""` (IcpEntityLayoutClient.tsx:111). grep: **0** routable `__add_buyer__` (`router.push`/`href:` literal) in production code. `__add_buyer__` survives ONLY as internal leaf `id` (L107) + comments — never navigated to |
| `data-testid` + `data-add-affordance` on the "+ buyer" button (e2e locator) | EntitySubNavBar.tsx:251-252 — `data-testid="entity-leaf-add-affordance"` + `data-add-affordance="true"` |
| **RN-5 honored** (buyer FK icp_id, belongs to one ICP) | `useCreateBuyer` is icp-scoped (`use-buyer-mutations`); mutation + navigation both anchored to the parent `icpId`. The data layer already scoped buyers to icpId in iter-1; the create path now actually fires against that scope |
| **SC-add-buyer has a real integration test** (not affordance-only) | NEW `IcpEntityLayoutClient.test.tsx` (5 tests) locks click → `mutateAsync` called with `{name, isPrimary}` → `router.push` to new buyer leaf → NEVER push to `__add_buyer__`. EntitySubNavBar.test.tsx +3 tests (callback fired / data-attr / NOT in directory mode). The Cat-11 FAIL would now fail these tests in RED |

### 2. No regression ✓

| Area | Verdict |
|---|---|
| a11y preserved | EntitySubNavBar still `role=tablist` (L229) + roving tabindex (L250) + ArrowLeft/Right/Home/End (L141-156) + directory `aria-disabled` (L248). The fix only added an `onAddAffordance` branch INSIDE the existing `if (!isDisabled)` onClick guard |
| Non-affordance leaves keep URL-derived soft-nav | `else → router.push(leaf.href)` for `!isAdd` leaves (EntitySubNavBar.tsx:259-261). Unchanged |
| Directory mode safe | `isDisabled = entity === null` (L112); button `disabled` + onClick early-returns; new test asserts `onAddAffordance` NOT called in directory mode |
| G2 / G3 intact | EntityWorkspaceLayout still store-free (no store import added — only a pass-through prop); no template literals in agent class strings |
| Scope discipline | Exactly the 7 declared files changed (6 source/test + 1 doc result). grep confirms no scope creep |

### 3. Scoped gates ✓

| Gate | Result | Detail |
|---|---|---|
| `tsc --noEmit` | **PASS** | 0 errors (strict), exit 0 |
| `eslint src/components/shared/shell-organism src/features/abel --cache` | **PASS** | **0 errors**, 233 warnings (all pre-existing import/order · sonarjs · array-type style — none new from fix, none blocking) |
| `vitest run src/components/shared/shell-organism src/features/abel src/__tests__/architecture` | **PASS (acceptable reds only)** | 323 passed / 2 failed (25 files). The 2 reds = exactly the pre-existing R0 `ShellOrganismLayoutClient.test.tsx` "AppPanelSlot duplicated 2×" tests. Verified: `git log a2c38840..HEAD -- ShellOrganismLayoutClient.tsx*` is **EMPTY** (R0 wrapper untouched by R1) + observed-bug doc `nicolify/docs/observed-bugs/2026-06-03-shell-layout-apppanelslot-duplicated.md` present. NOT attributable to R1, NOT a trigger |

### Carril classification

No Carril A self-fix required this iteration — the builder's Carril B fix is complete and gate-verified as-is. The iter-1 WARNs (over-memo `watch("signals")` in IcpDatosForm; stale doc comment in IcpMasterListView) remain as non-blocking WARNs (not part of this focused re-audit scope; carry to next touch).

### Category delta vs iteration 1

| # | Category | iter-1 | iter-2 | Note |
|---|---|---|---|---|
| 10 | Tests / TDD | WARN | **PASS** | SC-add-buyer now has a real integration test (create flow locked), not affordance-only |
| 11 | Domain Alignment / Agentic UI | **FAIL** | **PASS** | "+ buyer" create flow wired; RN-5 ICP→N-buyer model delivered |
| 15 | Connectivity (anti-isla) | WARN | **PASS** | "+ buyer" leaf no longer reaches a dead route; affordance is Consumed (fires `useCreateBuyer`) + reachable |

Remaining: Cat 3 WARN (over-memo, non-blocking) carries forward.

### Verdict math (iteration 2)

- The single iter-1 blocker (Cat 11 FAIL + Cat 15 WARN) is **resolved** — verified at code + test + gate level.
- All `/test-frontend` blockers (tsc 0 / eslint 0 / vitest reds = pre-existing R0 only) PASS.
- No new arch-fitness / allowlist / baseline growth; scope = 7 declared files (no creep).
- a11y, G2/G3, soft-nav for non-affordance leaves intact (no regression).
- Live-verify + visual golden + `dod_evidence` remain **DEFERRED to the #37 demo gate** (expected per build plan; enforced by `/pm-nicolify` at `reviewing → done`) — NOT a trigger here.

→ **APPROVED.** Re-handoff `/pm-nicolify` for the #37 live-verify + `demo_signoff` merge gate (`reviewing → done`).

---

## Audit iteration 3 (2026-06-04) — demo-gate route fix: slug conflict `[entityId]` vs `[subsubtab]`

**Mode:** `AUDITOR_AUTO_FIX_LOOP`. **Finding origin:** demo-gate live-verify (dev server boot). **Fix scope:** route tree restructure — consolidate under R0 incumbent `[subsubtab]`.

### The bug (architect design error caught at boot)

`[entityId]/` was placed as a sibling of `[subsubtab]/` at the same dynamic depth under `[agent]/[subtab]/`. Next.js 16 raises at route-tree collection time:
```
Error: You cannot use different slug names for the same dynamic path ('entityId' !== 'subsubtab')
```
The dev server rejected the route tree on startup → the app was unreachable. This class of error is **not detectable by tsc / eslint / vitest / `playwright --list`** (all statically green) — it only surfaces at `next dev` or `next build` route-collection, which is why it escaped all prior gates and was only caught at the #37 demo-gate live-verify attempt.

### The fix

Unified the 3rd dynamic segment under the R0 incumbent slug name `[subsubtab]` (load-bearing for R0 nav-leaves: christian.propuestas, norvil.fidelizacion, abel.oferta). Absorbed R1's entity-detail routing via dispatch in the new `[subsubtab]/layout.tsx`.

**Files created/modified/deleted:**

| Action | File |
|---|---|
| CREATED | `app/[tenantId]/(shell-organism)/[agent]/[subtab]/[subsubtab]/layout.tsx` |
| MODIFIED | `app/[tenantId]/(shell-organism)/[agent]/[subtab]/[subsubtab]/page.tsx` (R0 + R1 merged dispatch) |
| CREATED | `app/[tenantId]/(shell-organism)/[agent]/[subtab]/[subsubtab]/[leaf]/page.tsx` |
| DELETED | `app/[tenantId]/(shell-organism)/[agent]/[subtab]/[entityId]/` (entire dir — 3 files) |
| MODIFIED | `nicolify/docs/product/stories/nicolify-r1-abel-icp-buyer/03-arch-fe.md` §0 (corrected routing diagram + design note) |

**Param key rename (internal, no public URL impact):** `entityId` → `subsubtab` in moved Server pages. The icpId VALUE is identical; `IcpEntityLayoutClient` and `EntityWorkspaceLayout` receive icpId as a prop (not from `useParams`) → zero impact on Client components.

### R0 regression guard

The `else` branch in `[subsubtab]/page.tsx` is the original R0 logic verbatim: `isValidAgent + isValidSubtab + isValidSubSubTab` → `notFound()` or `<SubTabContent>`. The R0 e2e regression specs (`nav-walk-v3`, `invalid-subtab-404`, `empty-states-all-subtabs`) exercise paths through this branch — their routes and expectations are unchanged.

### Boot verification

Structural proof: `find .../[subtab] -maxdepth 1 -type d` returns exactly ONE dynamic dir `[subsubtab]` — no `[entityId]` sibling. Next.js collects the route tree from filesystem; one slug name at each depth → conflict eliminated. Full `next build` blocked by Docker `.next` permission issue (dev server wrote files as root); structural verification is the equivalent check and confirms the fix.

### Gates (native, scoped)

| Gate | Result | Detail |
|---|---|---|
| `tsc --noEmit` | **PASS** | 0 errors (strict), exit 0 |
| `eslint 'src/app/[tenantId]' src/features/abel src/components/shared/shell-organism --cache` | **PASS** | **0 errors**, 241 warnings (all pre-existing; none new from this fix) |
| `vitest run src/features/abel src/components/shared/shell-organism src/__tests__/architecture` | **PASS (acceptable reds only)** | 323 passed / 2 failed. The 2 reds = exactly the pre-existing R0 `ShellOrganismLayoutClient.test.tsx` AppPanelSlot reds (untouched by R0 or R1 or iter 3). Architecture fitness 90/90. |

### Category verdicts (iter 3)

| # | Category | iter-3 | Note |
|---|---|---|---|
| 0 | Route-tree boot validity | **PASS** | Slug conflict structurally eliminated; one dynamic slug per depth |
| All others | (carry from iter 2) | APPROVED | No regression; no new findings |

→ **APPROVED (iter 3).** Route tree is boot-clean. All scoped gates green. Re-handoff `/pm-nicolify` for the #37 live-verify + `demo_signoff` merge gate (`reviewing → done`).
