# T-2 Implementation Log — Arch Fitness Test (RED baseline)

**Brand:** comunify
**Ticket:** T-2 (comunify-design-system-a11y-contrast-cement)
**Date:** 2026-05-20
**Builder:** claude-sonnet (builder-frontend)
**Status:** RED (intentional — TDD discipline per 03-arch.md § 4.6)

## Files Created

1. `comunify/frontend/src/__tests__/architecture/test-no-low-contrast-pairs.test.ts` — Vitest arch fitness with 4 tests (sc-01 + sc-02 forbidden pairs + sc-02 allowlist + sc-04 ratchet).
2. `comunify/frontend/src/__tests__/architecture/_low-contrast-allowlist.json` — Content: `[]` (clean slate baseline).

## RED Baseline — 13 violations detected

```
src/features/comunify/components/authority-vault-editor.tsx:26 [stable-text-on-bg]
src/features/comunify/components/community-moderation-card.tsx:22 [warning-bg-white-text]
src/features/comunify/components/community-moderation-card.tsx:21 [stable-bg-white-text]
src/features/comunify/components/community-moderation-card.tsx:75 [warning-text-on-bg]
src/features/comunify/components/community-moderation-card.tsx:76 [stable-text-on-bg]
src/features/comunify/components/dunning-active-banner.tsx:31 [warning-bg-white-text]
src/features/comunify/components/dunning-active-banner.tsx:20 [warning-text-on-bg]
src/features/comunify/components/dunning-active-banner.tsx:23 [warning-text-on-bg]
src/features/comunify/components/voice-distilled-preview.tsx:54 [stable-text-on-bg]
src/features/comunify/components/voice-samples-uploader.tsx:144 [warning-text-on-bg]
src/features/comunify/components/voice-samples-uploader.tsx:143 [stable-text-on-bg]
src/features/comunify/utils/format-engagement-bucket.ts:11 [warning-text-on-bg]
src/features/comunify/utils/format-engagement-bucket.ts:10 [stable-text-on-bg]
```

## Test State

| Test | T-2 State | Post-T-3 Expected |
|------|-----------|-------------------|
| sc-01-utility-classes-exist-in-bundle | ✅ GREEN | ✅ GREEN |
| sc-02-forbidden-pairs-fail-build | ❌ RED (13 violations) | ✅ GREEN (0 violations) |
| sc-02-allowlist-requires-justification | ✅ GREEN | ✅ GREEN |
| sc-04-legacy-pattern-grep-ratchet | ❌ RED (10 violations) | ✅ GREEN (0 violations) |

## Validators (T-2 phase)

| Validator | Expected | Actual |
|-----------|----------|--------|
| val-arch-1 (test-no-low-contrast-pairs RED) | exit_code=1 (violations) | ✅ CORRECT RED |
| val-arch-3 (allowlist content = []) | content equals "[]" | ✅ PASS |

## Notes on Opción C (NOT blocked)

The following patterns are marginal (3.60–3.81:1 UI/large OK) and intentionally NOT hard-blocked
per 03-arch.md § 4.3:
- `bg-comunify-critical text-white` (3.76:1) — `community-moderation-card.tsx:23` ban button migrates by consistency in T-3 but pattern NOT in arch test
- `bg-comunify-blue text-white` (3.81:1) — no usages found today
- `text-comunify-critical` bare, `text-comunify-blue` bare — marginal, not hard-blocked
- `cohort-broadcast-composer.tsx` error labels use `text-comunify-critical-text` which was already a -text variant? Checking T-3.

## T-3 Action Plan

All 13 violations will be fixed by T-3 sweep per 06-tickets.yaml verbatim migration spec.
