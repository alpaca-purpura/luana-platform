# T-4 Result — no-arbitrary-value lock ON at zero allowlist

**Story:** nicolify-r0-design-system-adoption  
**Ticket:** T-4 — Migrate arbitraries to tokens + enable no-arbitrary-value lock at ZERO allowlist (ANTI-DEFAULT-FLIP)  
**Commit SHA:** 45052deb  
**Date:** 2026-06-15  

---

## Anti-default-flip workflow (MANDATORY)

### Step 1 — Baseline grep

Scope: `src/components/shared/**` + `src/features/abel/**`  
Locked axes: spacing / radius / font-size / color-hex  

```
grep results (locked axes only):
nicolify/frontend/src/components/shared/agents/AgentAvatar.tsx:39  → text-[10px]
nicolify/frontend/src/components/shared/WhatForChip.tsx:104        → text-[10px]
```

**Baseline count: 2 violations**

Sizing-axis arbitraries found (exempt per RN-1 — NOT in baseline):
- `TenantSwitcher.tsx:56` — `max-w-[120px]` (w-axis, exempt)
- `SubSubTabsBar.tsx:161` — `min-h-[38px]` (h-axis, exempt)
- `IcpIntakeOverlay.tsx:163` — `sm:max-w-[560px]` (w-axis, exempt)
- `IcpDatosForm.tsx:514` — `min-h-[28px]` (h-axis, exempt)

### Step 2 — Migration

Both violations are `text-[10px]` — font-size locked axis.

**Token evaluation:** `--text-caption: 0.75rem` (= 12px = `text-xs`). No sub-xs token exists in the nicolify brand scale (no `text-2xs`, no 10px token). Smallest token = 12px.

**Resolution path: Bif-2 (no token equivalent) → `// ds-lock-allow: <razón>` escape**

| File | Line | Arbitrary | Resolution |
|---|---|---|---|
| `AgentAvatar.tsx` | 39 | `text-[10px]` in sm SIZE_CLASSES | `// ds-lock-allow: 10px initial in 24px circle; below text-xs (12px), no smaller token in brand scale` (prev-line) |
| `WhatForChip.tsx` | 104 | `text-[10px]` for emoji span | `{/* ds-lock-allow: 10px emoji decorator in chip; below text-xs (12px), no smaller token */}` (prev-line) |

**Migrated count: 2 → 0 bare arbitraries. Allowlisted with ds-lock-allow: 2.**

### Step 3 — ESLint OFF (baseline green)

```
eslint src/ --rule '{"@luana/ds/no-arbitrary-value": "off"}'
Result: ✖ 220 problems (0 errors, 220 warnings)
        0 no-arbitrary-value violations
```

### Step 4 — ESLint ON (zero violations)

```
eslint src/ (with @luana/ds/no-arbitrary-value: error wired in eslint.config.mjs)
Result: ✖ 220 problems (0 errors, 220 warnings)
        0 no-arbitrary-value violations
        (import/order warning on test file import line — pre-existing pattern, not a no-arbitrary violation)
```

**V4-eslint-lock-zero: PASS — zero no-arbitrary-value errors**

---

## Deliverables

### 1. eslint.config.mjs — MODIFIED

Added at top of file:
```javascript
import luanaDs from "@luana/eslint-config";
```

Added DS lock block (before nicolify custom rules):
```javascript
{
  files: ["src/**/*.ts", "src/**/*.tsx"],
  ignores: ["src/components/ui/**", "src/__tests__/**"],
  plugins: { "@luana/ds": luanaDs },
  rules: { "@luana/ds/no-arbitrary-value": "error" },
},
```

**Zero DS_LOCK_BASELINE array** — nicolify achieves zero-allowlist from day one (unlike vitalia which has 48 pre-existing files downgraded).

### 2. test-ds-tokens-lock.test.ts — NEW

Path: `src/__tests__/architecture/test-ds-tokens-lock.test.ts`  
16 tests, all GREEN:
- SC-1: 5 tests (font-size/radius/spacing/color-hex flagged + multi)
- SC-2: 4 tests (sizing axes exempt: w/max-w/min-h+h/size)
- Tokenized: 4 tests (hsl(var), rounded-[var], bg-[var], p-[theme] exempt)
- SC-4: 3 tests (same-line escape / prev-line escape / prose-comment NOT exempt)

### 3. Migrations applied

- `AgentAvatar.tsx` — ds-lock-allow prev-line comment added
- `WhatForChip.tsx` — ds-lock-allow JSX comment added

---

## Gate results (G5 PRE-COMMIT SMOKE)

| Gate | Result |
|---|---|
| V2-tsc (`tsc --noEmit`) | 0 errors ✓ |
| V4-eslint-lock-zero (eslint src/ ON) | 0 no-arbitrary-value violations ✓ |
| V3-arch-tokens-lock (vitest arch test) | 16/16 PASS ✓ |

---

## Allowlist summary

| Count | Status |
|---|---|
| 0 | Bare arbitrary-values remaining in scope |
| 2 | `ds-lock-allow` escapes (10px sub-xs, structural, Bif-2 path) |
| 0 | DS_LOCK_BASELINE entries (zero legacy debt) |

---

## /pm-luana FLAG

**Token gap:** `text-[10px]` (2 occurrences) exists because the brand scale has no sub-xs tier.  
Current smallest typography token: `--text-caption: 0.75rem` (12px = `text-xs`).

If `@luana/design-tokens` adds a `text-2xs` tier (e.g., 10px for avatar initials/icon decorators), these 2 `ds-lock-allow` escapes become removable. The ratchet is shrink-only — removing escapes is always allowed.

Proposal: add `TYPOGRAPHY_TIERS` tier `micro` or `2xs` at 10px to `@luana/design-tokens` via `/pm-luana` promotion gate.

---

## Skills consulted

| Skill | Why invoked | Decision |
|---|---|---|
| `frontend-expert` | FSD-Lite boundaries, ESLint config patterns, arch test conventions | Followed vitalia test pattern exactly; kept OFF for `components/ui/**` + `__tests__/**` |
| `.claude/rules/anti-default-flip-audit.md` | MANDATORY for flag flip | Ran full 4-step workflow: baseline grep → migrate → OFF (green) → ON (zero violations) |
| `.claude/rules/tdd-mandatory.md § Default flag flips` | TDD + flag flip mandatory | Wrote arch test first (RED confirmed on install), then made GREEN via eslint config |
| `docs/architecture/luana-platform/design-system-canon.md` | Canon §0 (no-arbitrary rule) | Confirmed locked axes + sizing-exempt + tokenized-exempt + ds-lock-allow escape behavior |
| `core/@luana/eslint-config` (no-arbitrary-value.js) | Rule behavior verification | Confirmed ARBITRARY_TOKEN_RE pattern, escape mechanism, sizing exemptions |
| `core/@luana/design-tokens` (typography.ts) | Check for sub-xs token | Confirmed no 10px tier exists; brand scale bottom = 12px. Bif-2 path confirmed. |
