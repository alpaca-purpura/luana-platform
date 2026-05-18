# T-2 Implementation Log — Arch Fitness RED Baseline

**Story:** comunify-design-system-cement
**Ticket:** T-2 Arch fitness RED baseline
**Builder:** builder-frontend (Claude Sonnet 4.6)
**Date:** 2026-05-18
**Branch:** wip/comunify-bootstrap
**Status:** COMPLETE — RED baseline captured (91 violations). TypeScript GREEN.

---

## Deliverables

| File | Action | Notes |
|---|---|---|
| `comunify/frontend/src/__tests__/architecture/test-no-stock-palette.test.ts` | CREATE | 3 `it()` blocks matching 03-arch.md §7 spec verbatim |
| `comunify/frontend/src/__tests__/architecture/_stock-palette-allowlist.json` | CREATE | `[]` (empty — migrations in T-3a/b/c/d populate entries if needed) |

---

## T-2 Validators

| Validator | Command | Result | Notes |
|---|---|---|---|
| `fe_typecheck` | `npx tsc --noEmit` | GREEN ✓ | 0 errors (import assertion `with { type: "json" }` valid in tsconfig) |
| `fe_arch_fitness_no_stock_palette` | `npx vitest run src/__tests__/architecture/test-no-stock-palette.test.ts` | RED (expected) | 91 stock palette violations — this IS the success criterion for T-2 |

**T-2 RED is the correct outcome per 03-arch.md §7:**
> "RED state (T-2 baseline): test fails with ~91 violations listed verbatim (1 per occurrence × line). Output is the source-of-truth migration TODO list for T-3{a,b,c,d}."

---

## RED Baseline — 91 violations across 23 files

```
Test: "no stock palette classes in src/**/*.{tsx,ts}"
Violations: 91
Files: 23

src/app/(auth)/sign-in/page.tsx:10 — bg-gray-50
src/app/(auth)/sign-up/page.tsx:10 — bg-gray-50
src/app/(dashboard)/brand-studio/page.tsx:10,11 — text-gray-900, text-gray-600
src/app/(dashboard)/cohorts/[id]/broadcasts/page.tsx:15,16 — text-gray-900, text-gray-500
src/app/(dashboard)/cohorts/[id]/roster/page.tsx:15,16 — text-gray-900, text-gray-500
src/app/(dashboard)/cohorts/page.tsx:10 — text-gray-900
src/app/(dashboard)/layout.tsx:13,15,16,17 — bg-gray-50, border-gray-200 (×2), text-gray-900
src/app/(dashboard)/offers/[id]/page.tsx:15,16 — text-gray-900, text-gray-500
src/app/(dashboard)/offers/page.tsx:10 — text-gray-900
src/app/(dashboard)/page.tsx:10,11 — text-gray-900, text-gray-600
src/app/(dashboard)/subscriptions/[id]/page.tsx:17,18 — text-gray-900, text-gray-500
src/app/onboarding/layout.tsx:13,16,17 — bg-gray-50, bg-gray-200, bg-indigo-600
src/app/page.tsx:12,15 — text-gray-900, text-gray-600
src/app/public/[creator-handle]/page.tsx:20,21 — text-gray-900, text-gray-600
src/app/public/[creator-handle]/subscribe/page.tsx:22,24,28 — bg-gray-50, text-gray-900, text-gray-500
src/features/comunify/components/authority-vault-editor.tsx:26,27,28 — {bg,text}-{green,red,gray}-{100,700,600}
src/features/comunify/components/cohort-broadcast-composer.tsx:89,94,109,114 — border/text-red-{400,500}
src/features/comunify/components/community-moderation-card.tsx:21..78 — {bg,text}-{green,yellow,red,gray}-{100,600,700}
src/features/comunify/components/dunning-active-banner.tsx:18..31 — border/bg/text/ring-orange-{200..700}
src/features/comunify/components/ladder-visualizer.tsx:16..96 — border/bg-{blue,green,orange,purple}-{50..500}
src/features/comunify/components/voice-distilled-preview.tsx:54 — bg/text-green-{100,700}
src/features/comunify/components/voice-samples-uploader.tsx:118..146 — bg/text-{green,yellow,red,gray}-{100..700}
src/features/comunify/utils/format-engagement-bucket.ts:10..20 — bg/text-{green,yellow,blue,gray}-{100,700}
```

**HEX literal test:** PASS ✓ (0 HEX violations in *.tsx/*.ts — globals.css is permanently allowlisted)
**Shrink-only test:** PASS ✓ (`ALLOWLIST.length === 0 <= 0`)

---

## Test Design (03-arch.md §7 verbatim)

The test implements:
1. **Stock palette regex:** `/\b(bg|text|border|ring|from|to|via|hover:bg|...)-(gray|green|yellow|...|slate)-[0-9]+\b/g`
2. **HEX literal regex:** `/#[0-9a-fA-F]{6}\b/g` — throws Error when found (except permanent allowlist)
3. **HEX arbitrary Tailwind regex:** `/\b(bg|text|border|ring|from|to|via)-\[#[0-9a-fA-F]{6}\]/g`
4. **Shrink-only assertion:** `expect(ALLOWLIST.length).toBeLessThanOrEqual(0)` — trivially passes when `[]`

Allowlist JSON schema (for T-3 justified additions):
```json
{
  "file": "src/features/comunify/components/X.tsx",
  "class": "bg-green-500",
  "line": 42,
  "justification": "Chart library prop — no Tailwind class",
  "owner_pr": "T-3b"
}
```

---

## Migration TODO List (for T-3a/b/c/d)

T-3a (dashboard pages): 11 files in `src/app/(dashboard)/`
T-3b (feature components): 7 files in `src/features/comunify/components/`
T-3c (auth + public pages): 5 files in `src/app/(auth|onboarding|public|root)`
T-3d (utilities): 1 file `src/features/comunify/utils/format-engagement-bucket.ts`

Migration map lives in `03-arch.md §6` (canonical reference for T-3 builders).

---

## Notes for T-3 Builders

- The arch test RED baseline (91 violations) becomes the migration TODO list
- Each T-3{a,b,c,d} ticket reduces violation count toward 0
- After ALL T-3* complete → test goes GREEN (0 violations, allowlist stays `[]`)
- If a chart library exception needed → add to allowlist JSON with justification + owner_pr
- SHRINK-ONLY: NEVER add to allowlist without PR justification — fix instead
