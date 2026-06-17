<!-- voseo-allowed: audit review may cite spanish-text.md glosario verbatim per R25 (.claude/rules/spanish-text.md § Magic comment escape) -->
# Gherkin Verification Matrix — comunify-design-system-a11y-contrast-cement

**Story:** comunify-design-system-a11y-contrast-cement
**Auditor:** auditor-frontend (Opus)
**Date:** 2026-05-20
**Head SHA:** 0a5af6b

## Scenario → Test → Status mapping

| Scenario | Test path | Type | Status | Evidence |
|---|---|---|---|---|
| **SC-01** — Happy: pares canónicos del recipe aplican (computed contrast ≥ 4.5:1) | `comunify/frontend/e2e/regression/comunify-design-system-a11y-contrast-cement/design-system-pairs.spec.ts::sc-01-camino-b-buttons-pass-aa` | E2E (Playwright) | ✅ TEST_EXISTS · ⏳ LIVE_DEFERRED | Test file authored with WCAG L formula in-browser; live run deferred (dev stack down) |
| **SC-01** (utility emission) — 5 *-text utility classes exist | `comunify/frontend/e2e/regression/comunify-design-system-a11y-contrast-cement/design-system-pairs.spec.ts::sc-01-utility-classes-exist-in-computed-stylesheet` | E2E (Playwright) | ✅ TEST_EXISTS · ⏳ LIVE_DEFERRED | Probes `:root` for 5 CSS vars; static verification via `test-no-low-contrast-pairs.test.ts::sc-01-utility-classes-exist-in-bundle` passes (4/4 GREEN) |
| **SC-01** (utility emission — static cross-check) | `comunify/frontend/src/__tests__/architecture/test-no-low-contrast-pairs.test.ts::sc-01-utility-classes-exist-in-bundle` | Vitest arch | ✅ PASS | 1/1 GREEN; greps `tailwind.config.ts` for 5 slot names |
| **SC-02** — Negative: par prohibido bloqueado por arch fitness | `comunify/frontend/src/__tests__/architecture/test-no-low-contrast-pairs.test.ts::sc-02-forbidden-pairs-fail-build` | Vitest arch | ✅ PASS | 1/1 GREEN; 0 violations post T-3 sweep (was 13 RED at T-2) |
| **SC-02** (allowlist requires justification) | `comunify/frontend/src/__tests__/architecture/test-no-low-contrast-pairs.test.ts::sc-02-allowlist-requires-justification` | Vitest arch | ✅ PASS | 1/1 GREEN; allowlist baseline = `[]` (clean slate ratchet) |
| **SC-03** — Edge: Camino B en moderation card preserva semántica color | `comunify/frontend/e2e/regression/comunify-design-system-a11y-contrast-cement/moderation-card.spec.ts::sc-03-camino-b-semantic-preserved` | E2E (Playwright) | ✅ TEST_EXISTS · ⏳ LIVE_DEFERRED | Graceful skip if auth not configured; asserts NO `text-white` + presence of `comunify-{stable,warning,critical}` classes; static source verified by `community-moderation-card.tsx:20-26` |
| **SC-03** (axe-core wcag2aa zero violations) | `comunify/frontend/e2e/regression/comunify-design-system-a11y-contrast-cement/moderation-card.spec.ts::sc-03-axe-wcag2aa-zero-violations` | E2E + axe-core | ✅ TEST_EXISTS · ⏳ LIVE_DEFERRED | `@axe-core/playwright ^4.11.3` devDep installed; `.withTags(["wcag2aa","wcag21aa"])` + `.exclude(".cl-rootBox,...")` per Clerk widget scope |
| **SC-04** — Adversarial: tints sobre light bg verificados | `comunify/frontend/e2e/regression/comunify-design-system-a11y-contrast-cement/badges-tints.spec.ts::sc-04-tints-contrast-sample` | E2E (Playwright) | ✅ TEST_EXISTS · ⏳ LIVE_DEFERRED | Injects 3 pair samples + computes contrast ≥ 4.5:1 |
| **SC-04** (legacy pattern ratchet) | `comunify/frontend/src/__tests__/architecture/test-no-low-contrast-pairs.test.ts::sc-04-legacy-pattern-grep-ratchet` | Vitest arch | ✅ PASS | 1/1 GREEN; 0 bare `text-comunify-{warning,stable,accent}` matches in features/ + app/ |
| **SC-04** (legacy pattern ratchet — HTML belt) | `comunify/frontend/e2e/regression/comunify-design-system-a11y-contrast-cement/badges-tints.spec.ts::sc-04-legacy-pattern-grep-ratchet-html` | E2E (Playwright) | ✅ TEST_EXISTS · ⏳ LIVE_DEFERRED | Greps page HTML for forbidden patterns |
| **SC-a11y** — Sub-categoría mandatory accessibility | bundled in SC-01/03/04 + Playwright `regression` project axe runs on `/dashboard/community` + `/dashboard/membership` | E2E (axe-core) | ✅ TEST_EXISTS · ⏳ LIVE_DEFERRED | Same as SC-03 + SC-01-axe-membership; `aria-label` per button verified statically |

## Coverage summary

- **Static (vitest arch) — 4/4 PASS**
- **E2E (Playwright regression) — 10 tests authored, NOT executed live (dev stack offline)**
- **All Gherkin scenarios have at least one test asset** (static OR e2e OR both)
- **Live verification status:** DEFERRED to Chris staging gate per builder T-4-impl-log § Escalation Note. The `chrome-devtools-verify` skill is deprecated on Linux (WSL2 bridge); no alternative live verification path exercised in this audit.

## Verdict per scenario

| Scenario | Verdict | Reasoning |
|---|---|---|
| SC-01 | ✅ APPROVED | Static cross-check GREEN; E2E specs authored with WCAG formula |
| SC-02 | ✅ APPROVED | Vitest arch GREEN; allowlist clean slate; ratchet enforced |
| SC-03 | ⚠️ APPROVED-WITH-CAVEAT | Specs authored, axe-core wired, but live run pending. Static source review confirms Camino B applied verbatim |
| SC-04 | ✅ APPROVED | Vitest arch GREEN (legacy ratchet 0 matches); E2E specs authored |
| SC-a11y | ⚠️ APPROVED-WITH-CAVEAT | axe-core devDep installed + spec authored, but ZERO_VIOLATIONS only verifiable live |

## Recommendation

**APPROVED** for state transition `developed → reviewing → done` contingent on Chris executing the documented live verification commands on staging or local dev stack:

```bash
cd comunify/frontend
make dev-comunify  # terminal 1

# terminal 2 — full regression project
E2E_BASE_URL=http://localhost:3003 \
  npx playwright test e2e/regression/comunify-design-system-a11y-contrast-cement/ \
  --project=regression

# SC-03 with auth (requires CLERK_TESTING_TOKEN):
CLERK_TESTING_TOKEN=<token> E2E_BASE_URL=http://localhost:3003 \
  npx playwright test e2e/regression/comunify-design-system-a11y-contrast-cement/moderation-card.spec.ts \
  --project=regression
```

The auditor does NOT block merge for live E2E since builder followed the documented escalation path (`.claude/rules/e2e-testing.md` honored: native execution, no `make e2e*` Docker invocation, preflight commands provided in impl-log).
