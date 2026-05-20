# T-4 Result — Playwright regression specs + axe-core a11y validators

**Ticket:** T-4  
**Story:** comunify-design-system-a11y-contrast-cement  
**State:** done  
**Surface:** frontend (e2e)

## Validators

| Validator | Condition | Status |
|---|---|---|
| val-fe-4a | 3 Playwright spec files created under `e2e/regression/comunify-design-system-a11y-contrast-cement/` | PASS |
| val-fe-4b | `@axe-core/playwright` installed as devDependency | PASS |
| val-fe-4c | `playwright.config.ts` has `regression` project | PASS |
| val-fe-4d | tsc --noEmit 0 errors | PASS |
| val-fe-4e | eslint 0 errors | PASS |
| val-fe-4f | vitest run 49/49 (arch fitness GREEN maintained) | PASS |

## Spec Coverage

| Scenario | Spec | Tests |
|---|---|---|
| SC-01 (Happy) | `design-system-pairs.spec.ts` | 3 tests (contrast ≥ 4.5:1, CSS var presence, no JS errors) |
| SC-03 (Edge + axe) | `moderation-card.spec.ts` | 3 tests (Camino B classes, axe wcag2aa, no JS errors) — graceful skip if no CLERK_TESTING_TOKEN |
| SC-04 (Adversarial) | `badges-tints.spec.ts` | 3 tests (tint contrast, HTML ratchet, StatusBadge resolution) |

## Live E2E Status

NOT RUN in this session — dev stack not available.  
Live verification escalated to Chris staging gate.  
`chrome-devtools-verify` skill DEPRECATED for Linux (documented per 2026-05-15 notes).

Run commands documented in T-4-impl-log.md.
