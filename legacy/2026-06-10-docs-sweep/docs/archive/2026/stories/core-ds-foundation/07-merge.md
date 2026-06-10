# 07-merge — platform/core-ds-foundation

> Merge by /pm-luana · 2026-06-08 · `reviewing → done` (autonomous chain: /pm-luana → /architect → /dev-team → /auditor APPROVED → merge).
> Platform story: the buildable Design System core. NO squash-to-main here (staging deploy MANUAL — story closes `done` on wip/vitalia; integration to main is a separate Chris-gated step).

## § 1 — Scenarios / verification matrix
This is a platform component-library build (`verification_nature: ambas` — T-1..T-8 técnica, T-9 funcional). The tokens-lock spec (01-spec.md) SC-1..SC-4 map to the eslint RuleTester + ratchet arch-tests; the component contracts map to per-component Vitest; the /showcase to the live-verify.

| Coverage | Test | Status |
|---|---|---|
| SC-1 arbitrary-locked → eslint error + token suggestion | @luana/eslint-config RuleTester | ✅ |
| SC-2 sizing arbitrary allowed | RuleTester | ✅ |
| SC-3 ratchet shrink-only (+1 fails, −5 passes) | test-ds-tokens-lock-ratchet | ✅ |
| SC-4 named escape `// ds-lock-allow:` | RuleTester | ✅ |
| layout-primitives (canon §2.7) | ui-kit layout-primitives.test | ✅ |
| EntityWorkspaceLayout/SubNavBar (§2.1/2.2) | ui-kit EntityWorkspaceLayout/EntitySubNavBar.test | ✅ |
| EntityInfoCard B (§2.3) | ui-kit EntityInfoCard.test | ✅ |
| EntityPicker debounced+windowed (§2.4) | ui-kit EntityPicker.test | ✅ |
| useAutosave coalesce + back-compat (§2.6) | hooks useAutosave-coalesce.test | ✅ |
| /showcase renders real components (R-FID §5) | Playwright anti-burbuja smoke | ✅ |

Gherkin matrix: the tokens-lock scenarios + component scenarios all have GREEN tests (see CHECKPOINTS.md). No MISSING.

## § 2 — Live-verify run (Critical Rule #37 — NOT GET 200)
```
cd vitalia/frontend && E2E_BASE_URL=http://localhost:3002 \
  npx playwright test --project=smoke e2e/specs/smoke/showcase.smoke.spec.ts
→ 3 passed (5.0s)
```
`/showcase` exercised in real Chromium: Design System heading + 5 canon sections (atoms/layout/entity/autosave/archetypes by data-testid) + Átomos heading visible = real @luana/ui-kit renders. Anti-burbuja `base.ts` asserted at teardown: **0 pageerror · 0 console.error · 0 response≥400 on /api · 0 Next overlay**. `dod_evidence` in checkpoint.md.

## § 3 — Packages updated (semver MINOR — opt-in per brand; lock turns ON per brand in Fase 3)
| Package | Version | What |
|---|---|---|
| `@luana/design-tokens` | 0.1.0 → **0.2.0** | full token scale (spacing/radius/typography/color-names); was z-index-only |
| `@luana/ui-kit` | 0.2.0 → **0.3.0** | layout-primitives + Entity components + EntityPicker + archetypes + autosave/Group; copilot-decouple → cross-brand consumable |
| `@luana/hooks` | 0.3.0 → **0.4.0** | useAutosave coalesce+flush (back-compat); use-copilot-offset decoupled (CSS-var, subpath-only) |
| `@luana/eslint-config` | **0.1.0** (net-new) | `no-arbitrary-value` rule + RuleTester |
CHANGELOG entries written per package. No registry publish (workspace packages); version field declares capability.

## § 4 — Engine/contract notes
- `@luana/ui-kit` is now genuinely consumable cross-brand (copilot decouple). Fase 3 `{brand}-ds-adoption` stories can import the barrel.
- R-1SRC: vitalia globals.css consolidated to one `--radius`; `--vitalia-*` aliased to Shadcn tokens (85 consumers intact).
- The eslint lock + arch-test ratchets are wired to the vitalia pilot only (opt-in); nicolify/comunify unchanged.
- HB-60 (design-system canon → core-ds materializes it) → materialized by this story.

## § 5 — How to verify (reproducible)
```bash
WS=$(git rev-parse --show-toplevel)
cd ${WS}/core/@luana/design-tokens && npm run typecheck                 # tokens
cd ${WS}/core/@luana/eslint-config && npm test                         # RuleTester
cd ${WS}/core/@luana/hooks && npx vitest run                           # 36/36 (coalesce + back-compat)
cd ${WS}/core/@luana/ui-kit && npm run typecheck && npx vitest run     # 133/133
cd ${WS}/vitalia/frontend && npx vitest run src/__tests__/architecture/test-no-div-layout.test.ts \
  src/__tests__/architecture/test-ds-tokens-lock-ratchet.test.ts       # ratchets GREEN
# live-verify (needs make dev-vitalia / :3002):
cd ${WS}/vitalia/frontend && E2E_BASE_URL=http://localhost:3002 \
  npx playwright test --project=smoke e2e/specs/smoke/showcase.smoke.spec.ts
```

## Verdict
**MERGED → done.** 9 tickets + live-verify fixes + Carril-R no-div-layout fix, all APPROVED. Story archived to `docs/archive/2026/stories/core-ds-foundation/`. Integration to `main` deferred (staging MANUAL).
