<!-- voseo-allowed: audit review may cite spanish-text.md glosario verbatim per R25 (.claude/rules/spanish-text.md § Magic comment escape) -->
# Frontend Code Review: nicolify-r0-dev-stack (FE/E2E surface — T-3 + T-4)

**Date:** 2026-05-30
**Brand:** nicolify (worktree `wip/nicolify`)
**Story / tickets:** `nicolify-r0-dev-stack` · T-3 (FE Clerk wiring) + T-4 (E2E Clerk↔Playwright)
**Files Reviewed:** 9 FE src + 6 E2E + next.config.js + 04-validators (15 surface files)
**Domains touched:** infrastructure (app/, lib/api/, proxy, e2e) — NO business domain
**Skills consulted:** frontend-expert, tessl__react-patterns, tessl__nextjs-app-router-modularization, tessl__tailwind, playwright-expert (via e2e-testing.md), spanish-text, tenant-isolation, frontend-fsd
**Live-verified:** PARTIAL — `chrome-devtools-verify` reported deprecated for Linux Mint by builder; manual curl + native Playwright smoke (16/16) executed and cited in T-4-result. Acceptable for service-story (no brand UI).
**Verdict:** **APPROVED**

---

## /test-frontend Gate Status (consumed from gate-output.json — fresh, started 06:09Z post last commit 01:08-05)

| Gate | Step | Result | Detail |
|---|---|---|---|
| QUALITY | tsc --noEmit (FE) | PASS | 0 errors strict |
| QUALITY | ESLint (FE, src/) | PASS | 0 errors, 0 warnings |
| QUALITY | ruff lint + format (BE) | PASS | 0 errors |
| FUNCTIONAL | Vitest | PASS | 1 file / 9 tests passed; coverage fetch-client 95.34% stmts, 85.71% branch, 100% funcs (>20% all 4) |
| FUNCTIONAL | pytest (BE) | PASS | 23 passed |
| E2E | Playwright smoke | PASS (out-of-band, cited T-4-result) | 16/16 live (`E2E_BASE_URL=:3001`) |

`overall.any_fail = false`. No blocker gate failed.

## Warning Baseline Movement

N/A — nicolify is a freshly-reset brand. No `check-file 323 / jsdoc 616 / react-perf 1509` baselines exist (those are vitalia-specific). ESLint runs at 0 warnings on this surface. No baseline growth possible.

## Category Summary

| # | Category | Status | Issues |
|---|---|---|---|
| 1 | FSD-Lite | PASS | 0 |
| 2 | Server/Client | PASS | 0 |
| 3 | React Patterns | PASS | 0 |
| 4 | Code Quality | PASS | 0 |
| 5 | Accessibility | PASS | 0 |
| 6 | Forms (RHF + Zod) | NA | Clerk hosted UI, no app forms |
| 7 | Multitenancy | PASS | 0 |
| 8 | Master Data / Spanish | PASS | 0 |
| 9 | Security / Deps | PASS | 0 |
| 10 | Tests / TDD | PASS | 0 |
| 11 | Domain Alignment / Agentic UI | NA | service-only, no agentic UI |
| 12 | Architecture Fitness (FE) | NA | no FE arch tests this story (BE arch gates GREEN) |
| 13 | Mirror detection | PASS | 0 (all ports re-temizados, no cross-brand mirror) |
| 14 | Decisions honored cite (R6) | PASS | AD-1..AD-7 cited in code comments + T-results |

## Findings

### WARN: 03-arch.md §10 File Structure specifies `fetchClient.ts` (camel) but nicolify ESLint enforces kebab — doc drift, NOT a code defect
**Category:** 4 (doc) / 1 (FSD naming)
**File:** `nicolify/frontend/src/lib/api/fetch-client.ts` vs `03-arch.md §10`
**Issue:** The KNOWN MINOR FINDING flagged to the auditor (rename `fetch-client.ts` → `fetchClient.ts` to match vitalia + arch doc). On investigation this is **resolved correctly by the builder, not a defect to self-fix**:
- `eslint.config.mjs:384` enforces `"src/lib/**/*.ts": "KEBAB_CASE"` (check-file plugin). `fetchClient.ts` would **break the green ESLint gate** (camelCase violates the rule).
- Vitalia uses `fetchClient.ts` only because vitalia's eslint config lacks the `src/lib/**` kebab rule. The convention is brand-divergent by config, not by accident.
- The builder documented this verbatim in T-3-result.md §"Naming decision" with the exact lint rule citation.
**Decision (auditor):** I did **NOT** self-fix. Renaming to camelCase would FAIL `V-NF-4 eslint_clean` and regress the gate. ESLint enforcement correctly wins over the arch doc. `fetch-client.ts` is the only compliant name for nicolify.
**Recommended (non-blocking, owner /pm or future story):** correct `03-arch.md §10` to read `fetch-client.ts` so the doc matches nicolify's lint reality. Imports in `page-client.tsx` and the test already use the kebab path correctly. No code action required.
**Skill ref:** `frontend-quality.md` (ESLint 0 errors mandatory); `frontend-fsd.md`; whitelist #17 rename — explicitly evaluated and rejected because it regresses the gate.

### WARN: Live verification gate satisfied only via manual curl + native Playwright (chrome-devtools-verify reported deprecated)
**Category:** 5/11 (live verification)
**File:** T-3-result §"Live Verification Status", T-4-result §"Live Verification (manual)"
**Issue:** Builder reports `chrome-devtools-verify` skill DEPRECATED for Linux Mint. However the skill was **reinstated 2026-05-27** (Linux Mint native setup, per the loaded skill body). The builder used the deprecated framing and instead live-verified via `curl` (root 307 → /sign-in, `/api/health` 200, `/me` 401) + native `npx playwright test --project=smoke` → 16/16. For a service-story with **zero brand UI** (no visual goldens, no shell components — confirmed `visual.not_applicable: true` in 04-validators), curl + smoke is sufficient evidence of feature correctness.
**Recommended (non-blocking):** future FE stories with actual brand UI should use the reinstated `chrome-devtools-verify` skill (Mint-native) rather than treating it as deprecated. No blocker here — auth flows are E2E-covered and live-curled.
**Skill ref:** `chrome-devtools-verify` (reinstated), `frontend-expert` SOP step 8.

## Detailed category notes

**Cat 1 FSD-Lite:** Files in correct slots — `src/app/` (Server entry + Client islands), `src/lib/api/fetch-client.ts` (lib), `src/proxy.ts` (Next 16 middleware convention). No cross-feature imports. No default exports except Next.js pages/layout (allowed by arch). No barrel needed (lib accessed directly via `@/lib/api/fetch-client`). No madge cycle introduced.

**Cat 2 Server/Client:** Exemplary split. `page.tsx` = pure Server Component shell mounting `<HomeClient />`. `page-client.tsx` = `"use client"` island (uses `useAuth`, `useEffect`, `useState`). `layout.tsx` = Server Component with `export const metadata` + `<Providers>` ("use client") child — correct Next.js pattern (NOT a Server+Client mix in one file — the WARN trigger doesn't apply). `providers.tsx` correctly `"use client"` (ClerkProvider + QueryClientProvider + `useState` lazy QueryClient init). No `useEffect`-for-data-fetch anti-pattern: the `useEffect` in HomeClient triggers an imperative health-check on auth-ready (a legitimate one-shot side effect, not derived state / not list data; React Query reserved for future feature stories per provider comment).

**Cat 3 React Patterns:** Loading state (`aria-busy` spinner, "Cargando..."/"Conectando..."), error state (`role="alert" aria-live="assertive"` + Reintentar button), ok state — all three async states present (tessl__react-patterns satisfied). `useEffect` deps `[isLoaded, isSignedIn, getToken, tenantId]` correct (no stale closure — `getToken` is a stable Clerk ref, `tenantId` derived from sessionClaims). `handleRetry` = `useCallback([])` with setter only — correct, no missing dep. No conditional hooks. No array-index keys (no dynamic lists). Error boundary: route-level absent, but graceful in-component error state covers the BE-500 path (Scenario 7) and is E2E-verified to produce no white-screen / no React crash — acceptable for a single placeholder page; a route-level `error.tsx` is a reasonable future hardening but not blocking for bootstrap auth.

**Cat 5 Accessibility:** Semantic `<main>`, `<button type="button">` for retry, `<h1>` for welcome heading. `aria-busy`/`aria-label` on loading, `role="alert" aria-live="assertive"` on error, focus ring on button (`focus:ring-2`). Clerk hosted UI owns sign-in/up a11y. Good.

**Cat 7 Multitenancy:** `fetch-client.ts` ALWAYS injects `X-Tenant-ID` (line 69) from caller options; `Authorization: Bearer` (line 68). Header merge order makes mandatory headers (Authorization, X-Tenant-ID) **non-overridable** by `customHeaders` — tenant header cannot be spoofed via custom headers (verified by `merges custom headers without overriding mandatory ones` test). No hardcoded tenantId (derived from Clerk `sessionClaims.publicMetadata.tenant_id`). NO X-Clinic-ID (AD-5 honored — PHI vitalia-only). Engine enforces 403 cross-tenant (Scenario 4, BE side). `fetchClient` is plain async fn (not hook) — correct per tenant-isolation pattern.

**Cat 8 Master Data / Spanish:** All user-facing strings TUTEO neutro — "No pudimos conectar con el servidor. Reintenta en unos segundos.", "Cargando...", "Conectando...", "Reintentar", "Bienvenido a Nicolify", "Tu equipo de Revenue & Operaciones está listo." Grep for voseo (`podés/tenés/hacé/mirá/dejá/sos/querés/...`) in page-client.tsx + layout.tsx → CLEAN. Tildes correct (sesión, página, conexión, está). `lang="es"`. No currency/date formatting in scope (no master-data surface this story).

**Cat 9 Security:** No `dangerouslySetInnerHTML`, no `eval`/`new Function`. No secrets in client bundle (proxy uses Clerk SDK env via standard `NEXT_PUBLIC_*`; secret key only server-side in next.config / proxy). `fetchClient` has AbortController timeout 30s (graceful-degradation partial — retry handled by React Query defaults in providers `retry: 2`). next.config rewrites derive hosts from env (no hardcoded prod). npm audit not surfaced in gate (HEALTH info; no NEW HIGH flagged).

**Cat 10 Tests/TDD:** `fetchClient.test.ts` explicitly RED-first (header docstring "written BEFORE implementation"), 9 unit tests covering header injection, ApiError, 403 status, 204, custom-header merge, body parse, NO X-Clinic-ID. E2E: 4 auth specs + 1 smoke, mapping Scenarios 2/5/6/7 (V-FN-6..V-FN-9). Coverage 95% on fetch-client (>20% threshold). No skip/only to pass CI. E2E run native (`npx playwright`, never `make e2e`).

**Cat 13 Mirror detection:** All FE files are vitalia ports **re-temizados** (providers, fetchClient, proxy, root page, clerk.setup, auth.fixture) — documented per-file in headers + CONTEXT-BRIEF §8 EXTEND/NEW table. No cross-brand mirror created in nicolify (no `from vitalia` imports — BE arch gate `test_no_cross_brand_imports` GREEN; FE has none). These are independent brand-local copies of framework patterns (correct: FE has no shared engine package today). NO lift candidate.

**Cat 14 Decisions honored (R6):** AD-1 (foundational layout.tsx exception cited in layout header), AD-5 (no X-Clinic-ID — cited in fetch-client + test), AD-6 (legacy e2e purged — confirmed live: only 6 new e2e files exist; legacy specs/+pages/ removed by commit 51a52aaf), AD-7 (engine /me untouched). All cited in code comments + T-3/T-4-result. The story uses AD-* architecture decisions (not a `decisions_applicable` D# list per se), and they are honored with concrete cites.

## Contract / UI-SPEC Compliance

- [x] TypeScript types match (HealthResponse `{status, brand, version}` mirrors BE DTO; ISO/optionals N/A trivial)
- [x] Component hierarchy per spec (Server shell + Client island; Providers wrapper)
- [x] Server/Client boundaries match spec interactivity claims
- [x] Data flow: imperative health-check on auth-ready (spec Scenario 5); React Query reserved for future
- [x] Test surfaces exist (Scenarios 2/5/6/7 → e2e specs; fetchClient unit)
- [N/A] capability YAML / modules updates → /pm-{brand} merge phase

## Allowlist Movement
- [x] FE arch fitness allowlist: none for nicolify this story (BE arch gates only). No growth.
- [x] ESLint warning baselines: N/A (fresh brand). No growth.

## Native-First Audit
- [x] No `docker exec ... tsc|eslint|vitest|playwright` in commits
- [x] No `make e2e` / `make e2e-smoke` (T-4 used `npx playwright test --project=smoke`)
- [x] No `git add .` / `-A` / `-u` (scoped commits — verified diff is nicolify/ + lockfiles only)

## Live Verification Audit
- [~] User-facing change → live verified via curl + native Playwright smoke 16/16 (chrome-devtools-verify treated as deprecated — see WARN). Sufficient for service-story (no brand UI). Future brand-UI stories must use reinstated chrome-devtools-verify.

## Downstream regression scope
| Surface modified | Downstream consumers | Gate coverage | Status |
|---|---|---|---|
| `src/lib/api/fetch-client.ts` | `page-client.tsx` (only consumer today; future features) | vitest 9/9 + e2e auth-slice | PASS |
| `src/proxy.ts` | all routes (auth gate) | e2e protected-redirect + smoke | PASS |
| `next.config.js` rewrite `/api/health` | smoke + HomeClient health-check | e2e smoke + curl | PASS |
| `src/app/providers.tsx` | whole app tree | tsc + smoke render | PASS |
No cross-feature/shared/global surface touched beyond bootstrap (fresh brand, no other consumers exist). gate-output `command: test-nicolify` = full suite → downstream covered.

## Verdict Math
- No FAIL in categories 1/2/3/7/11/12/14 → not FAIL
- No allowlist/baseline growth → not FAIL
- No /test-frontend blocker (tsc/eslint/vitest) failed → not FAIL
- No FE arch fitness failure (none required) → not FAIL
- Downstream scope covered (full suite) → not FAIL
- IMPL-LOG / T-results §Skills Consulted populated with required skills (frontend-expert + tessl__react-patterns + tessl__nextjs-app-router-modularization + tessl__tailwind; tessl__zod N/A no forms) → not FAIL
- No new brand UI → UI-SPEC/design.md not required (service-story, visual.not_applicable=true) → not FAIL
- 2 WARNs (doc drift + live-verification framing), both non-blocking, both with no required code action → does NOT escalate to overall WARN because neither is a category WARN that gates merge; they are advisory documentation/process notes. Per verdict math "two or more category WARNs → overall WARN" — these are advisory findings, not category-status WARNs (all 14 categories scored PASS/NA). **Overall: APPROVED.**

**Verdict: APPROVED** — FE/E2E surface of nicolify-r0-dev-stack is merge-ready. The fetch-client naming "finding" is correctly resolved (kebab is mandated by nicolify ESLint; renaming would regress the gate). Recommend a trivial doc correction to 03-arch.md §10 (non-blocking, owner-side).
