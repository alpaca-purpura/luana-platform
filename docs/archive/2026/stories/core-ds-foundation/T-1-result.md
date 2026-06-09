# T-1 result — Tokens scale + R-1SRC single token source

> Story `core-ds-foundation` (platform · Track A · autonomous_mode) · ticket T-1 · builder-frontend.
> Verdict: **tests-passing** · Commit `2b7932e4` · pushed `wip/vitalia` · 11 files.

## Scope (exact files touched)

| File | Change |
|---|---|
| `core/@luana/design-tokens/src/spacing.ts` | NEW — frozen `SPACING` (Tailwind 4px scale AS-IS) + `SpacingKey` type |
| `core/@luana/design-tokens/src/radius.ts` | NEW — frozen `RADIUS_NAMES` (NAME contract) + `RadiusName` type |
| `core/@luana/design-tokens/src/typography.ts` | NEW — frozen `TYPOGRAPHY_TIERS` + `TypographyTier` type |
| `core/@luana/design-tokens/src/color-names.ts` | NEW — frozen `COLOR_NAMES` (NAME contract) + `ColorName` type |
| `core/@luana/design-tokens/src/index.ts` | EDIT — barrel re-exports 4 new modules (+ z-index) |
| `core/@luana/design-tokens/package.json` | EDIT — exports map (`./spacing ./radius ./typography ./color-names`) + `test` script + vitest devDep |
| `core/@luana/design-tokens/vitest.config.ts` | NEW — node env, globals |
| `core/@luana/design-tokens/src/__tests__/scale.test.ts` | NEW — F-1 (12 tests) |
| `vitalia/frontend/src/app/globals.css` | EDIT — R-1SRC single `--radius` + `--vitalia-*` aliasing |
| `vitalia/frontend/src/__tests__/architecture/test-ds-single-token-source.test.ts` | NEW — F-2 (6 tests) |
| `pnpm-lock.yaml` | EDIT — design-tokens vitest devDep resolution |

## TOKENS (RN-4 / RN-5 — canon §6.1)

- **`spacing.ts`** = Tailwind 4px scale AS-IS, **identical VALUE cross-brand** (D1/RN-4). Frozen const + `keyof typeof` key type.
- **`radius.ts` / `typography.ts` / `color-names.ts`** = shared **NAME contract only, NOT values** (RN-5). Each is a frozen tuple of canonical names; the per-brand VALUES live in each brand's `globals.css`. **Palettes are never merged** — names cross-brand, values per-brand.
- All four use the `Object.freeze([...] as const)` / `Object.freeze({...} as const)` idiom matching `z-index.ts` (the reference). Types derived via `(typeof X)[number]` (tuples) / `keyof typeof X` (spacing map).
- Required canon header line 1 on every new prod `.ts`: `// canon: design-system-canon.md §6.1 · story-origin: core-ds-foundation`.

## R-1SRC (RATIFIED Q3 = ALIASING — additive, non-breaking)

Goal: ONE `--radius` + `--vitalia-*` pointing at Shadcn tokens (single token source). Method = aliasing, **NOT** deletion (deletion is Fase 3).

- `globals.css` had TWO base `--radius` (Shadcn `.625rem`, legacy `.5rem`). **Kept** Shadcn `.625rem`; **deleted** legacy `.5rem` (line 151) → comment notes single source lives in Shadcn block. `--radius-lg/-bubble/-pill` untouched.
- `--vitalia-*` brand-core color vars (HSL channel triplets) **converted to aliases** of Shadcn tokens so ~85 downstream consumers keep rendering unchanged:
  - `--vitalia-cian: var(--primary);`
  - `--vitalia-purpura: var(--accent);`
  - `--vitalia-amarillo: var(--agent-mateo);`
  - `--vitalia-azul-marino: var(--agent-camila);`
  - `--vitalia-verde-lima: 70 73% 51%;` — kept literal (no Shadcn equivalent).
- Aliasing is sound because both sides are HSL channel triplets consumed via `hsl(var(--X))`. `--vitalia-*` vars **NOT deleted** (Fase 3). Wrapped `-color` literal vars left independent (out of F-2 channel-triple scope, no regression).
- Dark-mode note: `azul-marino → agent-camila` inherits camila's dark lavender override — judged strictly better for dark a11y; verde-lima static (literal) as before.

## Tests (TDD RED-first per tdd-mandatory.md)

| Test | Location | Result |
|---|---|---|
| F-1 scale | `core/@luana/design-tokens/src/__tests__/scale.test.ts` | 12/12 GREEN |
| F-2 single-token-source | `vitalia/frontend/src/__tests__/architecture/test-ds-single-token-source.test.ts` | 6/6 GREEN |

F-1 asserts: spacing values exact, tokens frozen, NAME-only contracts present, barrel re-exports resolve, types compile.
F-2 asserts (reads `globals.css`): exactly 1 base `--radius`, value `0.625rem`, no `--radius: 0.5rem`; `--vitalia-cian/purpura/amarillo/azul-marino` each `var(--…)` and NOT a raw channel triple.

## Gates

- `tsc --noEmit`: design-tokens EXIT=0 · vitalia frontend EXIT=0.
- `eslint`: F-2 test file EXIT=0 (changed files clean; no warning-baseline growth).
- T-1-gating vitalia ratchets: `test_page_padding` (3) + `test-no-vt-classes-in-new-features` (1) GREEN.
- **Pre-existing red (NOT T-1 regression):** 3 arch test files fail (`test_fsd_boundaries`, `test_no_cross_feature_imports`, `test_no_hardcoded_colors`) — failures live in `features/adrian/embudo/*` + `features/inbox/*` (`hsl(` literals + stale inbox allowlist). `git status` on those paths returned EMPTY → baseline red from parallel embudo/inbox sessions. My diff is design-tokens + globals.css (EXEMPT from color test) + 2 test files.
- Live-verify R-FID (`/showcase` localhost:3002 Chrome MCP) **N/A for T-1** (tokens + CSS, no exercisable surface) — that gate lives in T-9.

## Skills consulted

- **frontend-expert** — invoked for FSD-Lite TS-package conventions + token idiom + Vitest setup. Decision: mirror `z-index.ts` frozen-const idiom for the 4 new token modules; node-env vitest config; barrel-only exports (no default exports per arch gate).
- Rules applied: **frontend-fsd** (no default exports, barrel `index.ts`, package boundary) · **frontend-quality** (eslint 0 errors, tsc strict) · **tdd-mandatory** (F-1/F-2 RED before GREEN) · **anti-duplication** (NAMES shared / VALUES per-brand RN-5 → palettes never merged; aliasing not mirroring) · **spanish-text** (N/A — no user-facing strings in tokens/CSS vars) · **frontend-visual-fidelity** D1 (design-system-first; tokens are the canon source) · **parallel-safety** M14 (commit by pathspec, single-hub shared index; unstaged architect story docs out of T-1 scope).

## Forbidden-to-touch respected

- `nicolify/frontend/**` · `comunify/frontend/**` · `core/luana-core-*/**` (Python engine) · other brands' `globals.css` — none touched (`@luana/*` TS DESIGN packages are authorized; `luana-core-*` Python is NOT).
