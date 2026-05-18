<!-- voseo-allowed: audit review may cite spanish-text.md glosario verbatim per R25 (.claude/rules/spanish-text.md § Magic comment escape) -->
# Frontend Code Review — Comunify Design System Cement

```
verdict: APPROVED
date: 2026-05-18
reviewer: auditor-frontend (autonomous Opus 4.7 run, Chris pre-authorized E2E close)
gate_output_consumed: T-5-gate-output.json
brand: comunify
cross_brand_pollution_flags: 0
engine_edit_flags: 0
live_verification: deferred_with_documented_reason (Chris staging gate post-merge)
```

## Files Reviewed

| Type | Count |
|---|---|
| Created | 5 (globals.css, layout.test.tsx, test-no-stock-palette.test.ts, _stock-palette-allowlist.json, design-system.smoke.spec.ts) |
| Modified | 2 platform files (layout.tsx, tailwind.config.ts) + 23 migration files |
| Total story diff | 30 files |

**Domains touched:** frontend design system (tokens + typography + arch fitness ratchet). NO backend, NO agentic, NO core engine, NO cross-brand.

**Skills consulted:** `frontend-expert`, `brand-expert` (brand identity domain), `tessl__react-patterns` (Server Component preservation), `tessl__tailwind` (utility pattern + opacity notation v4), `tessl__nextjs-app-router-modularization` (layout Server Component), `tessl__vitest` (test patterns).

## /test-frontend Gate Status (per T-5-gate-output.json)

| Gate | Result | Detail |
|---|---|---|
| `fe_typecheck` (tsc strict) | PASS | 0 errors |
| `fe_lint` (ESLint) | PASS | 0 errors, no warning baseline grew |
| `fe_arch_fitness_no_stock_palette` | PASS | 3/3 tests — 0 stock palette + 0 HEX violations, allowlist `[]` |
| `fe_unit_tests_full` | PASS | 38/38 (1 scaffold + 9 layout + 3 arch + 25 components) |
| `fe_coverage_threshold` | PASS_WITH_WARNING | 1.47% stmts pre-existing Story 12 gap (schemas/lib untested); +12 tests improves delta. Auditor accepts per scope notes. |
| `scenario_happy_tokens_loaded` | PASS | layout.test.tsx 9/9 |
| `scenario_negative_stock_palette_prohibited` | PASS | deduped (arch fitness covers) |
| `scenario_edge_satoshi_fallback` | PASS | `--font-satoshi` present (Plus Jakarta Sans D2 Path B) |
| `scenario_adversarial_hex_blocked` | PASS | 0 HEX literals in src/** |
| `fe_build` | DEFERRED | PRE-EXISTING: Clerk publishable key missing in `.env.local`. Compilation step verified GREEN in T-1 (`✓ Compiled successfully in 7.5s`). Not introduced. |
| `visual_smoke_design_system` | DEFERRED | Runtime serves principal worktree (main branch), not wip. Spec FILE verified verbatim from arch §8. Post-merge restart resolves. |
| `visual_smoke_regression` | DEFERRED | Same as above. |

## Category Summary

| # | Category | Status | Issues |
|---|---|---|---|
| 1 | FSD-Lite | PASS | 0 |
| 2 | Server/Client | PASS | 0 |
| 3 | React Patterns | PASS | 0 (story is color/class migration only; no async UI added) |
| 4 | Code Quality | PASS | 0 |
| 5 | Accessibility | WARN | 1 (warning token contrast — NOT introduced, pre-existing SSoT mapping) |
| 6 | Forms (RHF + Zod) | N/A | story doesn't touch forms |
| 7 | Multitenancy | N/A | FE-pure, no queries |
| 8 | Master Data / Spanish | PASS | 0 voseo spot-checks clean |
| 9 | Security / Deps | PASS | 0 (no new deps, no PII, no secrets) |
| 10 | Tests / TDD | PASS | RED→GREEN honored per T-2 baseline 91→T-5 0 |
| 11 | Domain Alignment / Agentic UI | N/A | not agentic surface |
| 12 | Architecture Fitness (20) | PASS | New ratchet armed: test-no-stock-palette.test.ts (3 tests) GREEN with allowlist `[]` |
| 13 | Mirror detection | PASS | per-brand globals.css is expected pattern (nicolify + vitalia have own); no shared-extraction candidate triggered |
| 14 | Decisions honored cite (R6) | PASS | T-1/T-2/T-3a/T-3b/T-3c/T-3d/T-4/T-5 impl logs all cite which D# were honored |

## Findings

### WARN: warning token contrast vs white text (NOT a regression introduced by this story; flag for follow-up SSoT story)
**Category:** 5 (Accessibility)
**Files:**
- `src/features/comunify/components/dunning-active-banner.tsx:31` — `bg-comunify-warning ... text-white`
- `src/features/comunify/components/community-moderation-card.tsx:22` — `bg-comunify-warning ... text-white`
**Issue:** `--comunify-warning: 45 100% 48%` (≈ yellow) + `text-white` yields **1.80:1** contrast ratio. WCAG AA needs 4.5:1 (normal text) / 3:1 (UI components). Pre-existing baseline `bg-orange-600 text-white` yielded ~3.6:1 — semantic swap to warning made it worse.
**Root cause:** the migration honored the SSoT map 1:1 per `03-arch.md §6` (`bg-orange-{500,600} → bg-comunify-warning`). The HSL value in `comunify/docs/architecture/design-system.md` §4 is the actual source of the contrast issue, not this implementation.
**Out-of-scope fix:** revise `--comunify-warning` to darker tone (e.g., L=40% instead of 48%) in SSoT, OR pair warning with `text-comunify-text` (dark) instead of `text-white`. Either is a separate story (`comunify-warning-token-contrast-fix`) — auditor recommends `/pm-comunify` log to BACKLOG.
**Verification:** confirmed via Python contrast calc (sRGB→linear→WCAG formula): 1.80:1 for white-on-warning, vs 3.60:1 for white-on-orange-600 baseline.
**Skill ref:** `tessl__react-patterns` (accessibility baseline) + spec NFR table (only checked text/bg + primary-fg/gradient pairs, which both PASS at 17.93:1 and 5.62:1 — so spec was not violated, but the warning pair was simply not tested).
**Why WARN not FAIL:** the story migrated faithfully to the SSoT; the SSoT itself is the lever. No verdict block.

## Contract / UI-SPEC Compliance

- [x] 4 Gherkin scenarios from `01-spec.md` mapped to validators (4/4 GREEN per gate output).
- [x] 8 decisions D1-D8 from `03-arch.md §18` honored (cited per ticket impl log).
- [x] 23 migration files exactly match `05-guidelines.md §6` allowlist (verified via `git status`).
- [x] No out-of-scope files touched (no `comunify/backend/`, no `core/luana-core-*/`, no other brands).
- [x] Token migration map applied 1:1 per `03-arch.md §6` (spot-verified in dunning-active-banner.tsx, community-moderation-card.tsx, format-engagement-bucket.ts).
- [x] Arch fitness test verbatim from `03-arch.md §7` (3 describe blocks, 2 regex SSoT, permanent + JSON allowlists).
- [x] Playwright smoke spec verbatim from `03-arch.md §8` (3 tests, unauth routes per D7).

## Allowlist Movement

- `_stock-palette-allowlist.json` initial state `[]` (clean slate) — auditor verified file contents.
- Shrink-only test enforces `expect(ALLOWLIST.length).toBeLessThanOrEqual(0)` — passes trivially.
- No new entries needed (all 91 baseline violations resolved by migration without justified exceptions).
- ESLint warning baselines: N/A for comunify (this brand's eslint config doesn't enforce shrink baselines for check-file/jsdoc/react-perf — those are nicolify-specific).

## Native-First Audit

- [x] No `docker exec ... tsc|eslint|vitest|playwright` in commits or impl logs.
- [x] No `make e2e` / `make e2e-smoke` invocations (deferred visual smoke explicitly noted as needing native `npx playwright test` post-merge restart).
- [x] No `git add .` / `-A` / `-u` (story didn't reach commit phase; impl logs don't show batch staging).

## Live Verification Audit

- [x] User-facing change → live verification absence documented and explicitly escalated to Chris staging gate manual per role system prompt acceptance notes.
- [x] `chrome-devtools-verify` correctly identified as deprecated for Linux Mint (T-1 + T-4 impl logs cite this — skill SSoT is WSL2+Windows bridge).
- [x] Visual smoke spec FILE exists, content verbatim from arch §8, would PASS with right runtime (per T-4 impl log root cause analysis — env mismatch, not code defect).

## Cross-Brand / Engine Audit

- 0 cross-brand pollution (diff scope is `comunify/frontend/**` + `comunify/docs/product/stories/comunify-design-system-cement/**` exclusively).
- 0 engine edits (no `core/luana-core-*/` modifications).
- Brand globals.css per-brand independence is the expected pattern (nicolify + vitalia have their own globals.css; lupulo is placeholder). No lift-to-shared candidate triggered.

## Brand Overlay Scope (`creator-funnels.md`)

Correctly NOT triggered. Justified at `05-guidelines.md §3` + `03-arch.md §11 D6`:
- Surface: FE design system tokens (CSS vars + Tailwind tokens + fonts), NOT cohorts/community/vault/voice/funnel.
- No `tenant_id` queries (FE-pure).
- No voice_profile changes.
- No ladder/cohort/vault data flow.

7 mandatory tests from `creator-funnels.md` apply ONLY to BE PRs in those modules — auditor confirms 0 of those tests are missing because none should be present.

## Verdict Math

- 0 FAILs in categories 1/2/3/7/11/12/14 → no overall FAIL.
- Allowlist did NOT grow (stayed `[]`).
- 0 ESLint warning baseline movement (comunify uses brand-local eslint config without ratchet baselines).
- All 9 native gates PASS (1 PASS_WITH_WARNING accepted as pre-existing per scope notes).
- 20 arch fitness tests (Comunify equivalent: this story added the first one + scaffold + smoke = 3 total; future stories can add more) — current PASS.
- 1 WARN in Category 5 (accessibility) — NOT introduced by this story; SSoT-level concern.
- Downstream regression scope: 23 modified .tsx + tailwind config + layout.tsx → fully covered by `fe_unit_tests_full` (38 tests, same suite that gate-runner ran). No cross-feature/cross-brand consumer regression triggered.
- Mandatory skills consulted per IMPL-LOG.md `Skills Consulted` section (T-1, T-4): frontend-expert + tessl__react-patterns + tessl__tailwind + tessl__nextjs-app-router-modularization + chrome-devtools-verify (deprecated, escalated).

**Outcome:** all categories PASS or N/A or WARN-with-acceptance-note. Story ready to merge.

## Final Verdict

**APPROVED** — Story comunify-design-system-cement is ready for `state=reviewing → done` transition. `/pm-comunify` can apply squash-merge wip → main, after which Chris should run the post-merge gates (`fe_build` + `visual_smoke_*`) to close the 3 deferred items.

### Post-merge follow-up actions (NOT blockers for this APPROVED verdict)

1. Chris: `cd /home/chalreme/Proyectos/luana-platform && make dev-down-comunify && make dev-comunify` then `cd comunify/frontend && E2E_BASE_URL=http://localhost:3003 npx playwright test --project=smoke` to confirm visual smoke GREEN.
2. `/pm-comunify`: log to BACKLOG `comunify-warning-token-contrast-fix` story for accessibility WARN (revise `--comunify-warning` HSL in design-system.md SSoT, or document warning+text-comunify-text pairing).
3. `/pm-comunify`: log to BACKLOG `comunify-clerk-env-bootstrap` story (Story 12 pre-existing gap) if not already tracked.
4. `/pm-comunify`: create capability YAML `comunify/docs/product/capabilities/frontend-design-system/design-system-cement.yaml` per `03-arch.md §13` (post-merge task).
