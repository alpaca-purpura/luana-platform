# T-4 Review — Playwright regression specs + axe-core a11y validators

**Brand:** comunify
**Story:** comunify-design-system-a11y-contrast-cement
**Ticket:** T-4
**Auditor:** auditor-frontend (Opus)
**Reviewed at:** 2026-05-20
**Verdict:** **APPROVED-WITH-CAVEAT** (live E2E deferred a Chris — non-blocking)

## Files reviewed

3 specs Playwright + helpers + devDep + config:

| Path | Type | Notes |
|---|---|---|
| `comunify/frontend/e2e/regression/comunify-design-system-a11y-contrast-cement/design-system-pairs.spec.ts` | NEW | SC-01 — 3 tests (WCAG L formula in-browser, CSS var presence, no JS errors) |
| `comunify/frontend/e2e/regression/comunify-design-system-a11y-contrast-cement/moderation-card.spec.ts` | NEW | SC-03 — 3 tests (Camino B classes, axe wcag2aa, no JS errors). Graceful skip si CLERK_TESTING_TOKEN missing |
| `comunify/frontend/e2e/regression/comunify-design-system-a11y-contrast-cement/badges-tints.spec.ts` | NEW | SC-04 — 3 tests (tint contrast sample, HTML ratchet, StatusBadge resolution) |
| `comunify/frontend/e2e/regression/comunify-design-system-a11y-contrast-cement/_helpers.ts` | NEW | Shared utilities (WCAG L formula, getComputedStyle helper) |
| `comunify/frontend/package.json` | MODIFY | `@axe-core/playwright ^4.11.3` agregado a devDependencies |
| `comunify/frontend/playwright.config.ts` | MODIFY | `regression` project añadido con scope `e2e/regression/` |

## Compliance vs spec

| Spec requirement | Status | Evidence |
|---|---|---|
| SC-01 spec authored con WCAG formula computed | ✅ | `design-system-pairs.spec.ts::sc-01-camino-b-buttons-pass-aa` usa relative luminance + ratio calculation in-browser |
| SC-03 spec authored con axe wcag2aa | ✅ | `moderation-card.spec.ts::sc-03-axe-wcag2aa-zero-violations` usa AxeBuilder().withTags(["wcag2aa","wcag21aa"]) |
| SC-04 spec authored con tint verification + HTML ratchet | ✅ | `badges-tints.spec.ts` cubre injection samples + HTML grep |
| axe-core devDep installed | ✅ | package.json verified, version `^4.11.3` |
| Playwright config con `regression` project | ✅ | Verified scope `e2e/regression/` |
| Graceful skip si auth no configured (SC-03) | ✅ | Spec contiene `test.skip(!process.env.CLERK_TESTING_TOKEN, ...)` |
| Native execution (no Docker per `.claude/rules/e2e-testing.md`) | ✅ | Spec runner npx playwright, NO make e2e* |
| Preflight commands documentados | ✅ | T-4-impl-log.md cita comandos reproducibles para staging |

## Findings

### Finding F1 (informational, non-blocking) — Live E2E deferred

**Severidad:** INFORMATIONAL
**Categoría:** verification scope, NO violation

T-4 author specs but NOT execute live (dev stack offline durante build phase). Builder explícitamente escaló esto en T-4-impl-log.md siguiendo `.claude/rules/e2e-testing.md` (native execution preflight + `chrome-devtools-verify` DEPRECATED on Linux).

**Mitigation cementado en spec:** auditor NO bloquea merge por live E2E — builder followed documented escalation path. Tests están authored, paths existen, devDep installed, config wired. Verificación live es responsabilidad Chris staging gate.

**Comandos reproducibles para Chris:**
```bash
cd ${WS}/comunify/frontend
make dev-comunify  # terminal 1

# terminal 2 — regression project full
E2E_BASE_URL=http://localhost:3003 \
  npx playwright test e2e/regression/comunify-design-system-a11y-contrast-cement/ \
  --project=regression

# Con auth (SC-03):
CLERK_TESTING_TOKEN=<token> E2E_BASE_URL=http://localhost:3003 \
  npx playwright test e2e/regression/comunify-design-system-a11y-contrast-cement/moderation-card.spec.ts \
  --project=regression
```

## Validator evidence (6 from this phase)

- val-fe-4a (3 specs en e2e/regression/): EXIT=0 ✅
- val-fe-4b (axe-core devDep): EXIT=0 ✅
- val-fe-4c (regression project en config): EXIT=0 ✅
- val-fe-4d (tsc 0 errors specs): EXIT=0 ✅
- val-fe-4e (eslint 0 errors specs): EXIT=0 ✅
- val-fe-4f (vitest 49/49 maintained): EXIT=0 ✅
- val-fn-3/4 (E2E live): DEFERRED (per Finding F1 — non-blocking)

## Quality notes

- ✅ Helpers extraídos a `_helpers.ts` — DRY across 3 specs
- ✅ axe `.exclude([".cl-rootBox", ".cl-cardBox"])` per Clerk widget scope (excluye violations fuera de scope story)
- ✅ Tests usan `data-testid` o `data-action` selectors (no CSS/XPath frágiles)
- ✅ Graceful skip patterns previenen failures en CI sin secrets
- ✅ WCAG L formula encapsulado in-browser (evita inconsistencia client/server)

## Cross-cutting

- Tenant isolation: N/A (E2E specs no toca data layer en este story)
- Spanish neutro: N/A
- Cross-brand pollution: 0 (e2e/regression/ path scoped a comunify)
- Engine boundary: PASS
- Anti-duplication: PASS (helpers extraídos a `_helpers.ts`, no copy-paste)

## Verdict

**APPROVED-WITH-CAVEAT** — Specs cementan cobertura E2E para SC-01/03/04 + axe a11y. Live E2E execution responsabilidad Chris staging gate (per documented escalation path). Auditor NO bloquea merge — builder cumplió contrato T-4 verbatim del spec. Recomendación: Chris ejecute comandos pre-merge si quiere live verification, o post-merge en CI cuando dev stack disponible.
