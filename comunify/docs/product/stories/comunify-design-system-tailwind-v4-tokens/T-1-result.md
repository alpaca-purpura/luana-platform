# T-1 result — Tailwind v4 utility activation

## Verdict

**tests-passing** → ready to commit + push as wip/comunify.

## Diff summary

```
 M comunify/frontend/e2e/specs/smoke/design-system.smoke.spec.ts   (2 assertion fixes)
 M comunify/frontend/package.json                                  (+1 devDep @tailwindcss/postcss)
 M comunify/frontend/src/app/globals.css                           (+@theme block, +28 lines)
 M pnpm-lock.yaml                                                  (auto-updated, +10 packages)
?? comunify/frontend/postcss.config.mjs                            (NEW, 7 lines)
```

## Validator outputs (verbatim)

### val-be-1 — Backend /health
```
{"status":"ok","brand":"comunify","version":"0.1.0"}
```
✅ PASS

### val-fe-1 — CSS bundle .bg-comunify-bg rule
```bash
$ curl -sS "$(curl -sS http://127.0.0.1:3003/sign-in | grep -oE '/_next/static/chunks/[^\"]+\.css' | head -1 | sed 's|^|http://127.0.0.1:3003|')" | grep -qE '\.bg-comunify-bg\s*\{'
$ echo $?
0
```
✅ PASS — utility rule generated:
```css
.bg-comunify-bg {
  background-color: var(--color-comunify-bg);
}
```

### val-fe-2 — Playwright design-system smoke
```
Running 3 tests using 3 workers

  ✓  1 [smoke] › design-system.smoke.spec.ts:75:7 › sign-in page (chrome elements) inherits comunify tokens — no stock gray fallback (600ms)
  ✓  2 [smoke] › design-system.smoke.spec.ts:27:7 › font CSS variables are present on <html> (801ms)
  ✓  3 [smoke] › design-system.smoke.spec.ts:54:7 › body background is comunify-bg + text is comunify-text (computed style) (803ms)

  3 passed (1.3s)
```
✅ PASS

### val-fe-3 — Full smoke regression
```
  8 passed (2.9s)
```
✅ PASS — baseline 5 + design-system 3 unlocked = 8 (target ≥8). 18 Clerk env tests remain failing pre-existing (Story 12 deferral, out of scope).

### val-arch-1 — vitest architecture ratchet
```
 ✓ src/__tests__/architecture/test-no-stock-palette.test.ts (3 tests) 35ms

 Test Files  1 passed (1)
      Tests  3 passed (3)
```
✅ PASS — no-stock-palette allowlist `[]` still clean.

### val-typecheck-1 — tsc --noEmit
```
$ npx tsc --noEmit
$ echo $?
0
```
✅ PASS — 0 type errors.

## Gherkin coverage (per 06-tickets.yaml::T-1.gherkin_coverage)

| Scenario | Test | Status |
|---|---|---|
| SC-01 body bg-comunify-bg applies | design-system.smoke.spec.ts::body background is comunify-bg | ✅ PASS |
| SC-02 body text-comunify-text applies | design-system.smoke.spec.ts::body background is comunify-bg | ✅ PASS |
| SC-03 font vars accessible from :root | design-system.smoke.spec.ts::font CSS variables on <html> | ✅ PASS |
| SC-04 body font-family resolves Inter | design-system.smoke.spec.ts::font CSS variables on <html> | ✅ PASS |
| SC-05 CSS bundle contains utility rules | val-fe-1 curl + grep | ✅ PASS |
| SC-06 design-system suite passes | val-fe-2 3/3 | ✅ PASS |
| SC-07 no regression other smoke | val-fe-3 ≥8 pass | ✅ PASS (8 pass, 18 Clerk pre-existing) |

## Commit + push

Pending — orchestrator commits in next step with `STORY_CLOSURE_GATE_SKIP=1` (vitalia open story Layer 4 override authorized by Chris this session).

## Scope expansion vs original plan

Original 06-tickets.yaml files_in_scope: 2 files. Final: 5 files (added postcss.config.mjs + package.json + pnpm-lock.yaml). Justification documented in T-1-impl-log.md § "Scope expansion justification" — root cause deeper than initial repro (Tailwind v4 had NEVER been wired through PostCSS in comunify). Validators GREEN evidence the fix is complete and correct.

## Cross-brand promotable

Vitalia frontend has same gap: `tailwindcss ^4.1.0` declared but NO `postcss.config.*` AND no `@tailwindcss/postcss` plugin dep. Likely same silent design-system breakage. Open as separate `/pm-vitalia` story + lift candidate to `/pm-luana` `_pm-brand-template/` pattern audit.
