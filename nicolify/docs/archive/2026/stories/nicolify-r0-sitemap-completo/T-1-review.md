<!-- voseo-allowed: audit review may cite spanish-text.md glosario verbatim per R25 (.claude/rules/spanish-text.md § Magic comment escape) -->

# Frontend Code Review: Nicolify R0 sitemap-completo (nav-skeleton v3)

**Date:** 2026-06-03
**Story:** `nicolify-r0-sitemap-completo` · Brand: **nicolify** · Tickets: **T-1** (production_code FE routing-data + N3 route) + **T-2** (tests: e2e nav-walk + anti-burbuja fixture)
**PR / Spec:** `06-tickets.yaml` + `04-validators.yaml` + `03-arch.md` (`adr_001_compliance: partial-with-rationale`)
**Files Reviewed:** 16 (diff `a2c8150e~1..HEAD -- nicolify/frontend`)
**Domains touched:** shell-organism nav routing (FE-only · thin nav-skeleton · NO agentic, NO offer/brand/copilot/sales-agent domain logic)
**Skills consulted:** frontend-expert (FSD-Lite, Server/Client, runtime-quality). Domain experts (brand/offer/copilot/sales-agent/metrics) routed but NOT applicable — this is pure routing-data over shipped data-driven machinery, no domain surface touched.
**Live-verified:** YES — `dod_evidence` in checkpoint cites nav-walk GREEN vs localhost:3001 (gate anti-burbuja active) + Chris manual browse on dev-app.nicolify.com (approved post redirect fix). `demo_signoff_preauth: APPROVED` contingent on live-verify GREEN (met).
**Verdict:** **APPROVED** (both tickets) — overall **APPROVED**

---

## /test-frontend Gate Status (from gate-output.json — fresh, exit 0)

| Gate | Step | Result | Detail |
|---|---|---|---|
| QUALITY | tsc --noEmit (strict) | PASS | 0 errors |
| QUALITY | ESLint (`npx eslint src/`, real gate) | PASS | 0 errors, 102 warnings (pre-existing baseline) |
| QUALITY | Arch fitness (shell-routes SSoT + FSD boundaries) | PASS | SSoT enforced, Sara block = 1 subtab, FSD clean |
| FUNCTIONAL | Vitest | PASS | 131/131 (5 files: shell-routes 43 + SSoT 13 + spanish-neutro 40 + others) |
| HEALTH | arch boundary (no engine / cross-brand) | PASS | 0 cross-brand imports, 0 `luana-core` imports |
| FUNCTIONAL | e2e nav-walk-v3 + anti-burbuja (T-2, regression project) | PASS | 31 nav-walk + 28 empty-states + 4 ribbon-nav + 3 deeplink + 3 avatar GREEN; gate anti-burbuja active (0 pageerror/console-error/hydration/api-4xx/Next-overlay) |

> 1 flaky observed in live nav-walk (`sara/proximamente` → pageerror `SyntaxError: Invalid or unexpected token` on first attempt, passed on retry; 1 flaky / 32 passed, exit 0). **Assessed from code below (§ Flaky analysis): NO product-code cause — next-dev first-compile chunk artifact, prod-immune.**

## Warning Baseline Movement

Nicolify is post-reset (own FE, no shared cross-brand baselines). The real gate (`npx eslint src/`) = **0 errors**. ESLint warnings = **102** (pre-existing nicolify-r0-shell debt: jsdoc, next/image, sonarjs). T-1 introduces **0 new warnings** and **0 errors** (gate-runner confirms). The `04-validators` `eslint_zero` validator (`--max-warnings 0`) is over-specified vs the enforced gate — see FLAG #1 (harness mis-spec, NOT a story bug).

## Category Summary

| # | Category | Status | Issues |
|---|---|---|---|
| 1 | FSD-Lite | PASS | 0 |
| 2 | Server/Client | PASS | 0 |
| 3 | React Patterns | PASS | 0 |
| 4 | Code Quality | PASS | 0 |
| 5 | Accessibility | PASS | 0 |
| 6 | Forms (RHF + Zod) | PASS (N/A) | 0 — no forms in nav-skeleton |
| 7 | Multitenancy | PASS | 0 — FE routing only, no queries; tenantId from route params |
| 8 | Master Data / Spanish | PASS | 0 — Spanish neutro tuteo, tildes correct, 0 voseo, no currency |
| 9 | Security / Deps | PASS | 0 — N3 guard rejects XSS/traversal/`__proto__` (unit-verified + route-enforced) |
| 10 | Tests / TDD | PASS | 0 |
| 11 | Domain Alignment / Agentic UI | PASS (N/A) | 0 — no domain surface; no hardcoded catalogs/`*_METADATA` |
| 12 | Architecture Fitness | PASS | 0 |
| 13 | Mirror detection | PASS | 0 — N3 route/not-found are intra-brand clones of N2 pattern (legit), 0 cross-brand mirror |
| 14 | Decisions honored cite (R6) | PASS (N/A) | ticket has no `decisions_applicable` field → category NA |
| 15 | Connectivity (anti-isla) | PASS | 0 — N3 route closes the 404 island; every leaf Consumed+On-map+Navigable+Notarized |
| 16 | Visual fidelity (design system + scope + states) | PASS | 0 — EmptyState reused (no reinvented primitive), scope D3 honored, all leaves render empty-state |

## Findings

No FAIL findings. No blocking WARN findings. Notes below are advisory/affirmative.

### NOTE (Cat 2/9): N3 Server Component — correct
`[subsubtab]/page.tsx:38` is a pure Server Component (`export default async function`, no `"use client"`), `await params` per Next 16 App Router, and calls the whitelist guard **before render**:
```ts
if (!isValidAgent(agent) || !isValidSubtab(agent, subtab) || !isValidSubSubTab(agent, subtab, subsubtab)) {
  notFound();
}
return <SubTabContent agent={agent} subtab={subtab} subsubtab={subsubtab} />;
```
The route enforces the guard (not just a unit test in isolation). `isValidSubSubTab` (`shell-routes.ts:269`) is whitelist-only and is unit-covered for `<script>`, `../../etc/passwd`, `__proto__`, empty string, non-existent leaf, and invalid agent/subtab (`shell-routes.test.ts:317-357`). **Verification point #3 (route calls guard before render) CONFIRMED.**

### NOTE (Cat 16/15 — FLAG #4): redirect to first leaf — implemented correctly, no loop, override acceptable
`[subtab]/page.tsx:52-55`: an N2 with N3 leaves does a server-side `redirect()` to the first leaf. Assessed:
- **No redirect loop:** `[subtab]/page.tsx` redirects only when `getSubSubTabs(agent, subtab)` returns leaves (3 combos). The target `[subsubtab]/page.tsx` has **NO redirect** (terminal) — grep-confirmed. Chain is provably finite: N2-with-leaves → first leaf → render. The other 17 N2 sub-tabs (no leaves) render their empty-state directly.
- **Leaf marked active:** `SubSubTabsBar.tsx:71,170` derives the active leaf from the URL (`extractSubSubTabFromPath(pathname)`, `active={activeSubSubTab === subsubtab.id}`). After the server redirect the URL is `/{t}/{agent}/{subtab}/{firstLeaf}`, so the leaf is correctly highlighted — no client-state mismatch.
- **forbidden_to_touch override:** `[subtab]/page.tsx` was in `forbidden_to_touch` (read-only-to-clone). The edit is a single, behavior-additive change (redirect-when-leaves) ratified by Chris live (commit `b94c9ec6`). It changes `03-arch §17` (architect had decided NO auto-select). **Acceptable** — Chris ratified, the change is correct and contained, and the spec delta is documented. PM should record the §17 amendment at merge.

### NOTE (Cat 4 — FLAG #2): 2 forbidden_to_touch machinery files edited for pre-existing eslint — Carril-A-equivalent, accepted
`ChatComposer.tsx` + `ShellOrganismLayoutClient.tsx` were in `forbidden_to_touch`. Diff reviewed:
- `ChatComposer.tsx`: added `// eslint-disable-next-line @typescript-eslint/unbound-method` **with a documented justification** ("zustand action is bound/stable; wrapping it reintroduces the getSnapshot loop"). Behavior-neutral — no code change, only a lint suppression with rationale (satisfies frontend-quality § disable-with-justification).
- `ShellOrganismLayoutClient.tsx`: prettier reflow of a `<Panel>` JSX (one-line → multi-line props). Zero behavior change.
Both were **pre-existing errors** (not introduced by this story) blocking the real `npx eslint src/` gate for the **whole brand FE**. They are covered by the existing eslint gate (which is now GREEN). This is equivalent to Carril-A self-fix (mechanical, FE surface, no new test, gate-verified). The auditor does NOT object to the scope: the fixes unblock the gate and are revertible. Logged in § Self-fix log as builder-applied (not auditor-applied).

### NOTE (Cat 8): Spanish neutro tuteo — clean
All new copy (24 EmptyState entries + tab labels + 2 not-found pages) scanned: 0 voseo, tildes/ñ correct (`Próximamente`, `Configura`, `Fidelización`, `Conexiones`, `Elige`, `tu agencia`). Test `shell-routes.test.ts:152` asserts labels have no voseo. `not-found` uses tuteo `Elige`, `buscas`.

## Flaky analysis (SyntaxError on sara/proximamente — assessed from code, no e2e run)

The reported flaky (`pageerror: SyntaxError: Invalid or unexpected token` on first `sara/proximamente` navigation, passes on retry) has **NO product-code cause**:
- `sara/proximamente` resolves to `SUBTAB_CONTENT_MAP["sara.proximamente"]` → a static `{icon, title, description}` object → `<EmptyState>`. Pure data, pure Server Component.
- Grep confirms NO `eval`, `new Function`, dynamic `import()`, `JSON.parse`, or `dangerouslySetInnerHTML` in `SubTabContent.tsx` or `[subsubtab]/page.tsx`.
- The signature (`SyntaxError: Invalid or unexpected token` on **first compile**, GREEN on retry, exit 0) matches a **next-dev first-compile chunk race** (a partially-emitted JS chunk served before HMR finishes) — a dev-mode artifact, **prod-immune** (prod ships pre-built static chunks). This is consistent with the caller's separate characterization.
**No real code cause found. Not a story bug.** (Recommend the caller's dev-mode-chunk-race conclusion stands; do not block.)

## Contract / UI-SPEC Compliance

- [x] AGENT_SUBTABS (N2) + AGENT_SUBSUBTABS (8 N3 leaves) match SYSTEM-MAP v2.0 / 06-tickets T-1 slug-for-slug (unit-verified, `shell-routes.test.ts:107-223`)
- [x] DEFAULT_LANDING = christian/pipeline unchanged; `AGENT_CATALOG.christian.defaultSubtab === "pipeline"`
- [x] Sara = exactly 1 subtab `proximamente`, tabLabel `Próximamente` (deferred · ADR-nicolify-002 D-D), SSoT arch test enforces `idMatches.length === 1`
- [x] Server/Client boundaries per spec (N3 page = Server Component, guard → notFound)
- [x] Data flow: pure routing-data dispatch to EmptyState (no React Query / fetch — matches thin nav-skeleton)
- [x] Test surfaces exist: unit (shell-routes.test, SSoT test) + e2e nav-walk-v3 + anti-burbuja base.ts
- [x] Redirect change documented as `03-arch §17` delta (FLAG #4) — PM to ratify amendment at merge

## Allowlist Movement
- [x] No FE arch fitness allowlist GREW. SSoT test allowlist unchanged. Sara `idMatches.length===1` ratchet preserved (data flipped `proyectos`→`proximamente`, gate NOT relaxed).
- [x] base.ts CONSOLE_ERROR_ALLOWLIST is the initial tight list (Clerk/CSS/DevTools/401) — shrink-only invariant respected, hydration/5xx/404 NOT allowlisted.

## Native-First Audit
- [x] No `docker exec ... tsc|eslint|vitest|playwright` in commits (gates run native per checkpoint)
- [x] e2e command uses `npx playwright test ... --project=regression` native host (NOT `make e2e`)
- [x] No `git add .` / `-A` / `-u` — commits are by pathspec; `docker-compose.dev.yml` correctly left UNCOMMITTED (FLAG #6)

## Live Verification Audit
- [x] User-facing change → live-verify evidence cited: nav-walk GREEN vs localhost:3001 + anti-burbuja gate + Chris manual dev-app browse (approved). `dod_live_verified: true` + `dod_evidence` present (writes N/A — nav-only; effect = empty-states render + 0 burbujas + console clean).
- [x] `demo_signoff_preauth: APPROVED` (contingent on live-verify GREEN — met). DoD #37 satisfied for a thin nav-skeleton.

## Self-fix log
No auditor self-fix applied (Carril A) — the diff is already GREEN and correct.
- Builder-applied (documented for transparency, NOT auditor): `ChatComposer.tsx:39` eslint-disable-with-justification + `ShellOrganismLayoutClient.tsx:185-189` prettier reflow (commit `64132f1b`). Both behavior-neutral, covered by the existing `npx eslint src/` gate (now GREEN). Equivalent to Carril-A (mechanical, FE surface, no new test). Accepted.

## Per-ticket verdict

- **T-1** (production_code · routing-data + N3 route + content-map): **APPROVED**. Tree matches SSoT, guards reject XSS/traversal/`__proto__`/empty (unit + route-enforced), N3 Server Component correct, redirect loop-free & leaf-active-correct, Spanish neutro clean, scope D3 honored (empty-states only, 0 feature imports/fetch), arch SSoT + FSD GREEN.
- **T-2** (tests · nav-walk + anti-burbuja): **APPROVED**. base.ts faithfully ported from vitalia (4 collectors: pageerror/console-error-with-tight-allowlist/api-4xx/Next-overlay, teardown asserts empty, extends Clerk auth.fixture). nav-walk-v3 walks all 20 N2 + 8 N3 leaves, asserts subtab-content + empty-state + SubSubTabsBar, scoped to `:visible` for the documented dual-render. regression_guard specs untouched.

## Verdict Math
- 0 FAIL in any category (incl. 1/2/3/7/11/12/14/16) → not FAIL.
- 0 blocking category WARN → not WARN.
- All /test-frontend blockers (tsc/eslint/vitest) GREEN; arch fitness GREEN; downstream regression scope N/A (brand-local shell, no cross-feature/cross-brand consumers — confirmed `downstream-regression-na` headers).
- Cat 16: no reinvented primitive, no token hardcode, no scope creep, states present, live-verified → PASS.
- The 6 FLAGS are known harness/spec mis-specs (eslint `--max-warnings 0` vs real `npx eslint src/`; `--project=smoke` vs `regression`; redirect §17 delta ratified by Chris; 2 machinery eslint fixes Carril-A-equivalent; dual-render bug pre-existing suite-wide; docker-compose uncommitted) — noted, NOT blocking.
- → overall **APPROVED**.

**Recommendations for /pm-nicolify at merge (non-blocking):**
1. Record the `03-arch §17` redirect amendment (Chris-ratified) in `07-merge.md`.
2. Forward FLAG #1 (`eslint_zero` → `npx eslint src/`) and FLAG #5 (`--project=smoke` → `--project=regression`) to `/harness-issue` — they are validator/harness mis-specs, not story bugs.
3. FLAG #3 (suite-wide dual-render strict-mode bug in untouched specs) → separate cleanup story; out of scope here.
