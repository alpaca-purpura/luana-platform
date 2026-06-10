# T-2 result — Enforcement: `@luana/eslint-config` no-arbitrary lock + ratchet arch-tests + vitalia pilot

**Story:** core-ds-foundation (platform) · **Ticket:** T-2 · **Agent:** builder-frontend (Sonnet) · **Mode:** autonomous · **State:** tests-passing

---

## What was built

### 1. NEW package `core/@luana/eslint-config` (flat-config ESLint 9)
- `src/no-arbitrary-value.js` — custom rule that LOCKS arbitrary values on the four token axes `{spacing, radius, font-size, color-hex}` and flags Tailwind `base-[value]` literals.
  - **Actionable suggestion (D2/AC-2):** each report names the offending axis + the canonical token alternatives (spacing → `p-1 / p-2 / p-4 …`, font-size → `text-xs / text-sm …`, radius → `rounded-sm / rounded-md …`, color-hex → `text-foreground / bg-card …`).
  - **Sizing allowlist (RN-1/AC-3):** `w / h / min-w / max-w / min-h / max-h / size / basis` arbitraries are NOT flagged (layout sizing stays free).
  - **Named escape (RN-6/SC-4):** `// ds-lock-allow: <razón>` on the same or previous line exempts the line.
  - **Tokenized bypass:** values expressed through `var() / theme() / hsl() / oklch() / color-mix() / rgb()` are NOT literals → not flagged. Variant prefixes (`md:`, `hover:`, `!`) tolerated before the base.
- `src/index.js` — plugin barrel exporting `rules["no-arbitrary-value"]`.
- `package.json` — `@luana/eslint-config@0.1.0`, `type: module`, exports, `peerDependencies.eslint >=9`.
- `src/__tests__/no-arbitrary-value.test.js` — RuleTester, **25 cases** (valid + invalid: locked axes report, sizing allowlist clean, escape clean, tokenized clean). **GREEN** (`node --test`: pass 1 / fail 0).

### 2. Vitalia pilot wiring (D3)
- `vitalia/frontend/eslint.config.mjs` — `import luanaDs from "@luana/eslint-config"`; rule = `error` globally on `src/**/*.{ts,tsx}` (ignoring `src/__tests__/**`), then `off` on `DS_LOCK_BASELINE` (the **48 files** that already carry locked-axis arbitraries). Lock ON for new code without breaking the build (NF-2). Shrink-only enforcement lives in the F-4 vitest ratchet, not in eslint.
- `vitalia/frontend/package.json` — `@luana/design-tokens` (dep) + `@luana/eslint-config` (devDep), both `workspace:*`.
- Probe verified: a throwaway file with `p-[18px] text-[13px] rounded-[7px] text-[#635BFF]` produced exactly **4** `@luana/ds/no-arbitrary-value` errors with actionable suggestions; deleted after.

### 3. Arch-tests (TDD, brand-local `vitalia/frontend/src/__tests__/architecture/`)
| File | Validator | Seed (MEASURED 2026-06-08) | Result |
|---|---|---|---|
| `_ds-lock-scanner.ts` | shared helper (parity with the rule) | — | — |
| `test-ds-tokens-lock.test.ts` | F-3 (SC-1/SC-2/SC-4) | fixture-based | **16/16** |
| `test-ds-tokens-lock-ratchet.test.ts` | F-4 (RN-2/AC-4/AC-6) | font-size 82 · radius 7 · spacing 4 · color-hex 0 | **8/8** |
| `test-no-native-select.test.ts` | A-1 (canon §2.5) | 8 native `<select>` / 4 files | **3/3** |
| `test-no-div-layout.test.ts` | A-2 (canon §2.7) | 301 layout `<div>` / 121 files | **3/3** |
| `test_no_hardcoded_colors.test.ts` | A-3 (EXTENDED, NOT forked) | existing baseline | **2/2** |

All seeds MEASURED via the shared scanner (`countLockedAxes` / `countLayoutDivs` / `NATIVE_SELECT_RE`), never guessed. All ratchets SHRINK-ONLY (+1 → FAIL, −N → pass, baseline never rises) + stale-high guard (total 0 ⇒ baseline must be 0).

### 4. F-5 / AC-5 / RN-3 — other brands UNCHANGED
`grep -rn "@luana/eslint-config" nicolify/frontend comunify/frontend` → CLEAN (no reference). Lock is opt-in per brand; nicolify + comunify configs untouched (no default flip side-effect).

---

## Gate outputs (G5 smoke, all GREEN BEFORE commit)
```
vitest (5 T-2 arch files)  → 32 passed (32)
eslint-config RuleTester   → pass 1 / fail 0   (25 cases)
tsc --noEmit (vitalia/fe)  → EXIT 0
eslint src/ (vitalia/fe)   → EXIT 0   (NF-2: lock ON, build not broken)
F-5 grep nicolify/comunify → CLEAN
```

## Scope discipline
- Touched ONLY: `core/@luana/eslint-config/**`, `vitalia/frontend/eslint.config.mjs`, `vitalia/frontend/package.json`, the 4 new + 1 extended arch-test + `_ds-lock-scanner.ts`, `pnpm-lock.yaml`.
- NOT touched (forbidden): `nicolify/frontend/**`, `comunify/frontend/**`, `core/luana-core-*/**`, `core/@luana/ui-kit/src/**` (T-3..T-8 own it).
- `test_no_hardcoded_colors.test.ts` EXTENDED in place (NO fork — NO-NEW-LAYER).

## Live-verify
R-FID live-verify (/showcase) does NOT apply to T-2 — this ticket ships tooling (an ESLint rule + arch-test ratchets), no user-reachable surface. The live gate lives in T-9 (vitalia adoption).

## Skills consulted
- **frontend-expert** — invoked for ESLint flat-config rule authorship + arch-fitness ratchet pattern (shrink-only baselines seeded at measured count; `Linter.verify` plugin loading in vitest; RuleTester `errors[]` must not mix `message` + `messageId`). Followed `frontend-quality.md` (ratchet allowlists shrink only) + `frontend-visual-fidelity.md` D1 (Design System Canon §0/§2.5/§2.7 mechanical enforcement).
- **architectural-fitness.md** — ratchet pattern (KNOWN_* allowlists shrink only; new violation = build fail).

## Commit
`feat(core-ds): T-2 eslint no-arbitrary lock + ratchet arch-tests + vitalia pilot`
SHA: see chris-input.md / 06-tickets.yaml (appended post-push).

**Awaiting orchestrator → gate-runner → auditor-frontend (independent verdict).**
