<!-- voseo-allowed: audit review may cite spanish-text.md glosario verbatim per R25 (.claude/rules/spanish-text.md § Magic comment escape) -->

# Frontend Code Review: build-autosave-primitive-luana (autosave primitive @luana + nicolify adoption)

**Date:** 2026-05-30
**Story / ADR:** docs/product/stories/build-autosave-primitive-luana/ · ADR-012-autosave-primitive-platform (accepted)
**Tickets:** T-1 (@luana/schemas+hooks) · T-2 (@luana/ui-kit AutosaveBadge+showcase) · T-3 (nicolify form-runtime adoption)
**Files Reviewed:** 19 (core/@luana/{schemas,hooks,ui-kit}/src/** + nicolify/frontend/src/components/form-runtime/**)
**Domains touched:** platform shared FE lib (design system primitive) + nicolify form-runtime
**Skills consulted:** frontend-expert, tessl__react-patterns, tessl__tailwind, tessl__vitest, frontend-fsd, spanish-text, anti-duplication, frontend-visual-fidelity
**Live-verified:** N/A — library primitive, verified via Vitest unit/component (deterministic, no backend). E2E real-backend deferred to consumer stories per spec (correct).
**Verdict:** **APPROVED** (after Carril A self-fix of 5 ESLint errors — re-verified GREEN)

## Scope check
- ✅ Only `core/@luana/{schemas,hooks,ui-kit}` + `nicolify/frontend/` touched — both authorized by ADR-012 (platform lift). NOT cross-brand pollution.
- ✅ No root legacy `frontend/src/` paths. No `core/luana-core-*` (Python) edits.
- ✅ No vitalia edits (adoption is a separate consumer story, correctly out-of-scope).

## /test-frontend Gate Status (independently re-verified)

| Gate | Step | Result | Detail |
|---|---|---|---|
| QUALITY | tsc (new autosave files) | PASS | 0 errors in useAutosave.ts / autosave.ts / AutosaveBadge.tsx / AutosaveShowcase.tsx |
| QUALITY | tsc (nicolify full) | PASS | 0 errors |
| QUALITY | tsc (@luana hooks/ui-kit pkg-wide) | RED (pre-existing, scoped-out) | errors ONLY in use-copilot-offset.ts / use-currency-catalog.ts / use-shell-mutex.ts / timezone-select.tsx — last touched by lift commits b1bdb3ab/3282768a, NOT this story. Documented in docs/observed-bugs/2026-05-31-luana-hooks-uikit-tsc-lift-debt.md |
| QUALITY | ESLint (nicolify changed files) | PASS (after self-fix) | was 5 errors → now 0 errors, 5 pre-existing-class warnings |
| FUNCTIONAL | Vitest useAutosave | PASS | 11/11 |
| FUNCTIONAL | Vitest AutosaveBadge | PASS | 32/32 |
| FUNCTIONAL | Vitest nicolify form-runtime (regression) | PASS | 143/143 (unchanged, after self-fix re-run) |
| HEALTH | no-@clerk-import guard | PASS | only a doc comment mentions @clerk; zero real import statements |
| HEALTH | barrels export | PASS | schemas/hooks/ui-kit src/index.ts all export the new symbols |

**Pre-existing tsc debt verdict:** scoping the hooks_tsc/uikit_tsc validators to "no NEW autosave tsc errors" is **legitimate, not masking a regression**. git blame confirms every failing file was last modified by lift commits b1bdb3ab/3282768a (pre-story). The story only ADDS files; the new files are tsc-clean; the package-wide debt is orthogonal and tracked in observed-bugs.

## Category Summary

| # | Category | Status | Issues |
|---|---|---|---|
| 1 | FSD-Lite / barrels | PASS | 0 |
| 2 | Server/Client | PASS | 0 |
| 3 | React Patterns | PASS | 0 |
| 4 | Code Quality (ESLint/tsc) | PASS (self-fixed) | 5 ESLint errors fixed |
| 5 | Accessibility | PASS | 0 |
| 6 | Forms (RHF+Zod) | N/A | library primitive, not a form |
| 7 | Multitenancy | PASS | 0 (auth injected, no hardcoded tenant) |
| 8 | Master Data / Spanish | PASS | 0 (no voseo, no hardcoded USD) |
| 9 | Security / Deps | PASS | vite@^6 devDep (see WARN) |
| 10 | Tests / TDD | PASS | 10 scenarios → tests; 143 regression preserved |
| 11 | Domain Alignment | PASS | 0 |
| 12 | Architecture Fitness | PASS | no default exports; barrels present |
| 13 | Mirror detection / anti-dup | PASS | this IS the SSoT lift (ADR-012); consumed by showcase + nicolify |
| 14 | Decisions honored cite | N/A | no decisions_applicable field on tickets |
| 15 | Connectivity (CONN) | PASS | both exports have real consumers in same PR (showcase + nicolify) |
| 16 | Visual fidelity | PASS | composes existing Badge primitive; AA contrast fixed |

## Findings

### Self-fixed (Carril A — gate-verified, FE surface, behavior covered by existing 143 form-runtime tests)
**Category 4 — ESLint 5 errors on nicolify form-runtime changed files.**
- `AutosaveBanner.tsx`: `import/no-duplicates` — `@luana/ui-kit` imported on two separate lines (AutosaveBadge + Button). Merged to one import. Also fixed import/order.
- `AutosaveBanner.tsx:58,107` + `FormRuntimeProvider.tsx:154`: `prettier/prettier` formatting. Fixed via `eslint --fix`.
- **Verification:** `npx tsc --noEmit` 0 errors + `npx vitest run src/components/form-runtime/` 143/143 GREEN post-fix. No new test required (formatting + import-merge are behavior-neutral; existing suite is the independent verifier). Not stake-asymmetric. See § Self-fix log.

### WARN: vite@^6 devDep added to nicolify/frontend/package.json
**Category 9.** Added under devDependencies to resolve a pre-existing vitest@^4 / vite test-env mismatch so the form-runtime regression suite runs. devDep-only (no runtime/bundle impact). Acceptable as a tooling fix necessary to validate the story; not feature scope creep. Flagging for visibility — confirm vite@^6 is compatible with the existing storybook@^10 / tailwind toolchain at next full install.

### WARN: subtle error-state timing in FormRuntimeProvider wrapper (non-blocking)
**Category 3/11.** The original `useAutoSave` cleared `error` to null on entering "saving"; the new `useAutosave` does not, and the wrapper clears `autosaveError` only on `onSaved` (success). Observable behavior is preserved because `AutosaveBanner` renders the error UI only when `status === "error"` (during a subsequent "saving" the badge shows "saving", stale `autosaveError` is not displayed). 143/143 tests confirm no consumer reads `autosaveError` mid-"saving". Note only.

### WARN: legacy `lib/form-runtime/hooks/use-auto-save.ts` retained
**Category 13.** The bespoke `useAutoSave` is kept because offer-studio's section editor still consumes it via the compat shim. Correct (offer-studio is out-of-scope here) and NOT an island (still consumed). Future consolidation candidate — flag for a follow-up consumer story, not this PR.

## Contract / UI-SPEC Compliance
- ✅ TypeScript contract (AutosaveStatus / UseAutosaveOptions<T> / UseAutosaveReturn<T>) matches 01-spec § Contrato + 03-arch verbatim. `debounceMs` default 2000, `authReadyAttempts` default 10×200ms.
- ✅ All 10 Gherkin scenarios mapped to tests (debounce-coalesce, save-success-badge, auth-ready-no-error-permanente, error-recovery-retry, concurrent-edits-last-wins, network-failure, unmount-cancels, badge-aria-live, badge-i18n-neutro, telemetry-opt-in) + nicolify-form-runtime-sin-regresion (143 tests).
- ✅ getToken injected (no @clerk coupling). getTokenReady loops authReadyAttempts × 200ms before throwing — correct robustness (auth-ready scenario).
- ✅ Hook: stable refs for save/getToken/callbacks (no stale closures), unmount guard (isMountedRef), last-wins (cancel prior timer in scheduleSave), concurrent-save guard (isSavingRef), cleanup on unmount.

## Accessibility (Cat 5) — the contrast bug was AVOIDED
- ✅ `aria-live="assertive"` for error, `"polite"` otherwise; `role="status"`, `aria-atomic="true"`.
- ✅ Icon + text, never color alone (WCAG 1.4.1).
- ✅ **Contrast AA preserved:** saved uses `text-emerald-700` (#047857 = 5.49:1 on white, passes AA) — explicitly NOT the vitalia `emerald-600`/#009966 (3.65:1) bug. dirty uses `text-amber-700 dark:text-amber-400` (≥4.5:1). error uses `text-destructive`. Tests assert the token classes + document the rejected low-contrast variants. (axe-core not in the unit env; contrast enforced via documented token-class assertions — acceptable for unit scope.)

## Spanish neutro (Cat 8)
- ✅ Default labels: "Sin guardar" / "Guardando…" / "Guardado" / "No se pudo guardar. Reintenta." — tuteo, no voseo. nicolify "Reintentar" (infinitive) OK. Labels injectable (i18n-ready).

## nicolify behavior preservation (HARD) — PASS
- ✅ Public API of form-runtime unchanged: FormRuntimeContextValue shape intact, AutosaveBanner props (status/error/onRetry/className) intact, banner-level AutosaveStatus union ("idle"|"saving"|"saved"|"error") intact ("dirty" mapped to "idle").
- ✅ 800ms debounce preserved (debounceMs: 800 passed explicitly; 2000 is only the new-consumer default).
- ✅ 143 existing tests pass without modification (before and after self-fix).
- ✅ useMemo deps array on ctxValue complete (schema, values, saveMode, autosaveStatus, autosaveError, setFieldValue, undoSession, isDirty, bridge).

## Self-fix log (Carril A)
- `nicolify/frontend/src/components/form-runtime/AutosaveBanner.tsx`: merged duplicate `@luana/ui-kit` import (lines 21-22 → 1) + import order; prettier formatting (lines 58, 107). Existing test: src/components/form-runtime/__tests__/ (19 files, 143 tests) covers banner render states. Diff: import statements consolidated + whitespace.
- `nicolify/frontend/src/components/form-runtime/FormRuntimeProvider.tsx`: prettier formatting (line 154 nested-ternary line break). Existing test: same suite covers provider status mapping. Diff: whitespace only.
- Verification (independent): `npx tsc --noEmit` 0 errors; `npx vitest run src/components/form-runtime/` 143/143 GREEN.

## Allowlist / Native-First / Live Verification
- No arch fitness allowlist growth (no @luana arch tests touched; no default exports introduced).
- No `docker exec` / `make e2e` / `git add .` in commits.
- Live verification N/A (library primitive). E2E correctly deferred to consumer stories.

## Verdict Math
- No FAIL in cats 1/2/3/7/11/12/14.
- ESLint blocker (Cat 4) was the only blocker → resolved via Carril A self-fix, re-verified GREEN (gates = independent verifier; no new test needed; FE surface; not stake-asymmetric).
- New autosave files tsc-clean; pre-existing package debt legitimately scoped-out (git-blame confirmed).
- 3 WARNs (vite devDep, error-timing nuance, retained legacy hook) — all non-blocking.
- → overall **APPROVED**.
