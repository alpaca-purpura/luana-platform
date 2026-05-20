# T-4 Impl Log — Playwright regression specs + axe-core a11y validators

**Ticket:** T-4  
**Story:** comunify-design-system-a11y-contrast-cement  
**Surface:** frontend (e2e)  
**Started:** 2026-05-20  
**Completed:** 2026-05-20

## Summary

Created 3 Playwright regression specs + 1 helper module under:
`comunify/frontend/e2e/regression/comunify-design-system-a11y-contrast-cement/`

Added `regression` project to `playwright.config.ts` (matches `.*\/regression\/.*\.spec\.ts`).

Installed `@axe-core/playwright ^4.11.3` as devDependency.

## Files Created

| File | Coverage |
|---|---|
| `_helpers.ts` | WCAG formula utilities: `getContrastRatio()`, `hasResolvedColor()` |
| `design-system-pairs.spec.ts` | SC-01: computed contrast ≥ 4.5:1 for all 5 `-text` tokens; CSS var presence in `:root`; no JS errors |
| `moderation-card.spec.ts` | SC-03: Camino B button class verification (no `text-white`); axe-core `wcag2aa` zero violations on `/dashboard/community`; graceful skip if auth not configured |
| `badges-tints.spec.ts` | SC-04: tint bg + `-text` token contrast ≥ 4.5:1; legacy pattern grep ratchet on SSR HTML; StatusBadge token resolution |

## Files Modified

| File | Change |
|---|---|
| `playwright.config.ts` | Added `regression` project matching `/regression/**/*.spec.ts` |

## Validation

- `npx tsc --noEmit`: 0 errors (e2e files type-check via tsconfig)
- `npx eslint src/`: 0 errors (e2e files not in eslint scope per eslint.config.mjs)
- `npx prettier --check` on all new files: PASS (ran --write)
- `npx vitest run` (full suite): 49/49 PASS (arch fitness GREEN maintained)

## Design Decisions

1. **Graceful degradation in SC-03:** `/dashboard/community` requires Clerk auth. Tests use `test.skip()` when CLERK_TESTING_TOKEN not set, rather than failing. This allows CI to run without auth configuration and still surface axe violations when auth is available.

2. **SC-01 unauthenticated:** CSS var validation on `/sign-in` page (unauthenticated) — tokens are available in the global stylesheet regardless of auth state.

3. **SC-04 HTML ratchet:** Checks SSR-rendered HTML for bare legacy class patterns. Belt-and-suspenders complementing the Vitest arch fitness test on source files.

4. **No new POM files:** Per 03-arch.md § 5.3 — no POM required for this story. Helper module `_helpers.ts` provides shared contrast utilities.

5. **Playwright E2E not executed live:** Dev stack (`make dev-comunify`) not running in this session. Per `.claude/rules/e2e-testing.md`, live E2E requires `scripts/e2e-preflight.sh` + running stack. Specs validated by tsc + manual code review. Live execution delegated to Chris staging gate.

## Escalation Note

`chrome-devtools-verify` skill is DEPRECATED for Linux (designed for WSL2+Windows bridge per project notes 2026-05-15). Live verification escalated to Chris staging gate per IMPL-LOG standard procedure.

Manual verification commands:
```bash
cd comunify/frontend
make dev-comunify  # terminal 1 — start dev stack on 3003

# terminal 2 — run regression specs
E2E_BASE_URL=http://localhost:3003 \
  npx playwright test e2e/regression/comunify-design-system-a11y-contrast-cement/ \
  --project=regression

# SC-03 with auth (requires CLERK_TESTING_TOKEN):
CLERK_TESTING_TOKEN=<token> E2E_BASE_URL=http://localhost:3003 \
  npx playwright test e2e/regression/comunify-design-system-a11y-contrast-cement/moderation-card.spec.ts \
  --project=regression
```
