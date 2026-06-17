# Merge artifact — comunify/comunify-design-system-a11y-contrast-cement

> Brand: comunify
> Merged: 2026-05-20
> Squash-merge SHA: pending /pm-comunify final squash-merge to main
> Last wip SHA: 50effd5

## § 1 — Gherkin verification matrix

> Cada scenario de `01-spec.md` mapeado a test que pasa. Copia consolidada de `06-audit/gherkin-matrix.md`.

| Scenario (Gherkin) | Test path | Status |
|---|---|---|
| SC-01 "Happy: pares canónicos del recipe aplican (computed contrast ≥ 4.5:1)" | `comunify/frontend/e2e/regression/comunify-design-system-a11y-contrast-cement/design-system-pairs.spec.ts::sc-01-camino-b-buttons-pass-aa` | ✅ TEST_AUTHORED · ⏳ LIVE_DEFERRED |
| SC-01 (utility emission cross-check) | `comunify/frontend/src/__tests__/architecture/test-no-low-contrast-pairs.test.ts::sc-01-utility-classes-exist-in-bundle` | ✅ PASS (vitest) |
| SC-02 "Negative: par prohibido bloqueado por arch fitness" | `comunify/frontend/src/__tests__/architecture/test-no-low-contrast-pairs.test.ts::sc-02-forbidden-pairs-fail-build` | ✅ PASS (vitest) |
| SC-02 (allowlist requires justification) | `comunify/frontend/src/__tests__/architecture/test-no-low-contrast-pairs.test.ts::sc-02-allowlist-requires-justification` | ✅ PASS (vitest) |
| SC-03 "Edge: Camino B en moderation card preserva semántica color" | `comunify/frontend/e2e/regression/comunify-design-system-a11y-contrast-cement/moderation-card.spec.ts::sc-03-camino-b-semantic-preserved` | ✅ TEST_AUTHORED · ⏳ LIVE_DEFERRED |
| SC-03 (axe-core wcag2aa zero violations) | `comunify/frontend/e2e/regression/comunify-design-system-a11y-contrast-cement/moderation-card.spec.ts::sc-03-axe-wcag2aa-zero-violations` | ✅ TEST_AUTHORED · ⏳ LIVE_DEFERRED |
| SC-04 "Adversarial: tints sobre light bg verificados" | `comunify/frontend/e2e/regression/comunify-design-system-a11y-contrast-cement/badges-tints.spec.ts::sc-04-tints-contrast-sample` | ✅ TEST_AUTHORED · ⏳ LIVE_DEFERRED |
| SC-04 (legacy pattern ratchet) | `comunify/frontend/src/__tests__/architecture/test-no-low-contrast-pairs.test.ts::sc-04-legacy-pattern-grep-ratchet` | ✅ PASS (vitest) |
| SC-a11y (Mandatory sub-category) | bundled SC-01/03/04 + axe-core wcag2aa on `/dashboard/community` + `/dashboard/membership` | ⚠️ APPROVED-WITH-CAVEAT (live deferred) |

**Static coverage:** 4/4 PASS (vitest arch fitness).
**E2E coverage:** 10 tests authored, NOT executed live (dev stack offline durante audit phase).
**Caveat non-blocking:** auditor explicitly approved merge per `e2e-testing.md` escalation path (builder followed native execution preflight, `chrome-devtools-verify` DEPRECATED on Linux).

## § 2 — Playwright E2E run

```bash
# Comando reproducible para Chris staging gate:
WS=$(git rev-parse --show-toplevel)
cd ${WS}/comunify/frontend
E2E_BASE_URL=http://localhost:3003 \
  npx playwright test e2e/regression/comunify-design-system-a11y-contrast-cement/ \
  --project=regression

# Con auth (SC-03 axe):
CLERK_TESTING_TOKEN=<token> E2E_BASE_URL=http://localhost:3003 \
  npx playwright test e2e/regression/comunify-design-system-a11y-contrast-cement/moderation-card.spec.ts \
  --project=regression
```

- Specs authored: 3 files (`design-system-pairs.spec.ts` + `moderation-card.spec.ts` + `badges-tints.spec.ts`) + `_helpers.ts`
- Tests count: 9 tests (3 per spec)
- devDep: `@axe-core/playwright ^4.11.3` installed
- Playwright config: `regression` project added
- Live execution: DEFERRED a Chris staging gate (per CHECKPOINTS Finding T-4-F1, non-blocking)
- Traces post-execution: `comunify/frontend/playwright-report/` (post-run)

## § 3 — Capabilities updated/created

- `comunify/docs/product/capabilities/frontend_design_system/a11y-contrast-cement.yaml` — **NEW** (status: live, package_version: 0.3.0)

## § 4 — Modules MD refreshed

- `comunify/docs/product/modules/frontend_design_system.md` — auto-list refresh post-merge:
  - cement (v0.2.0)
  - tailwind-v4-tokens (v0.2.1)
  - a11y-contrast-cement (v0.3.0) **NEW**

## § 5 — How to verify (reproducible commands)

```bash
# Setup
WS=$(git rev-parse --show-toplevel)

# 1. Static arch fitness (vitest)
cd ${WS}/comunify/frontend && npx vitest run src/__tests__/architecture/test-no-low-contrast-pairs.test.ts
# Expected: 4 tests PASS (0 violations, allowlist=[])

# 2. Stock-palette regression (preserve baseline)
cd ${WS}/comunify/frontend && npx vitest run src/__tests__/architecture/test-no-stock-palette.test.ts
# Expected: 3 tests PASS

# 3. Full vitest suite (49 tests baseline)
cd ${WS}/comunify/frontend && npx vitest run
# Expected: 49/49 PASS

# 4. Lint + type-check
cd ${WS}/comunify/frontend && npx tsc --noEmit
cd ${WS}/comunify/frontend && npx eslint src/ --cache

# 5. (Opcional, live) Playwright regression project
make dev-comunify  # terminal 1, levanta stack
# terminal 2:
cd ${WS}/comunify/frontend && E2E_BASE_URL=http://localhost:3003 \
  npx playwright test e2e/regression/comunify-design-system-a11y-contrast-cement/ \
  --project=regression
# Expected: 9 tests authored ejecutan; SC-03 axe skip si no CLERK_TESTING_TOKEN

# 6. (Opcional) Grep ratchet manual — confirm 0 legacy patterns
cd ${WS}/comunify/frontend
grep -rEn 'bg-comunify-(warning|stable|accent) text-white' src/ && echo "FAIL" || echo "PASS — no legacy patterns"
grep -rEn 'text-comunify-(warning|stable|accent)([^-]|$)' src/features/ src/app/ | grep -v '\-text' && echo "FAIL" || echo "PASS — no bare semantic text"
```

**Expected:** todos los comandos retornan exit code 0 (steps 1-4). Steps 5-6 son opcionales/post-merge.
