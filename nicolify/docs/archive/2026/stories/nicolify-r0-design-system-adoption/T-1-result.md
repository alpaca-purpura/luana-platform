# T-1 Result — globals.css ↔ @luana/design-tokens align + --radius-control

**Story:** nicolify-r0-design-system-adoption  
**Ticket:** T-1  
**State:** tests-passing (awaiting gate-runner + auditor-frontend)  
**Date:** 2026-06-15

---

## Deliverables

### 1. `nicolify/frontend/src/app/globals.css` — MODIFIED

Added to `@theme` block (after fonts, before color palette):

- **Spacing scale** (`--spacing-0` through `--spacing-16`, 11 entries) — mirrors `@luana/design-tokens::SPACING` values exactly.
- **Radius names** (`--radius-sm/md/lg/bubble/pill`) — names from `RADIUS_NAMES`; rem values are BRAND-OWNED (nicolify scale).
- **Typography tiers** (`--text-display/heading/body/caption`) — names from `TYPOGRAPHY_TIERS`; sizes are BRAND-OWNED.

Added to `:root` block (after `--radius: 0.625rem`):

- `--radius-pill: 9999px` — brand-owned value.
- `--radius-control: var(--radius-pill)` — RN-7 DECOUPLED: token brand-scoped, ready for `/pm-luana` kit-lift. `@luana/ui-kit` controls still hardcode `rounded-md` until that lift lands (expected, not a bug).

**Identity HARD-preserved:**
- `--primary: 243 100% 68%` (nicolify indigo #635BFF) — exact, unchanged.
- 7 agent colors (luana/abel/brenda/christian/sara/norvil/config + -soft variants) — unchanged.
- League Spartan (sans) + Bree Serif (serif) — unchanged.
- Dark mode agent-soft variants — unchanged.

### 2. `nicolify/frontend/package.json` — MODIFIED

Added `"@luana/eslint-config": "workspace:*"` to `devDependencies` (needed by T-4 to enable the no-arbitrary-value lock). `pnpm install` ran clean (existing visx peer warnings are pre-existing, not introduced by this change).

### 3. `nicolify/frontend/src/__tests__/architecture/test-ds-single-token-source.test.ts` — NEW

TDD RED→GREEN:
- **RED** (before globals.css changes): 21 failures — spacing/radius/typography/radius-control tests all failing.
- **GREEN** (after globals.css changes): 39/39 passing.

Test asserts:
- Every `SPACING` key/value present in globals.css.
- Every `RADIUS_NAMES` entry maps to `--radius-{name}` in globals.css.
- Every `TYPOGRAPHY_TIERS` entry maps to `--text-{tier}` in globals.css.
- Semantic `COLOR_NAMES` (primary/background/foreground/card/muted/border/ring) present via `--color-{name}` in `@theme`.
- Brand identity: `--primary: 243 100% 68%` (exact regex), League Spartan, Bree Serif, 7 nicolify agent slugs.
- `--radius-pill: 9999px` declared.
- `--radius-control: var(--radius-pill)` declared.

Note on COLOR_NAMES: `@luana/design-tokens::COLOR_NAMES` lists vitalia agent names (`agent-lisa/lucas/...`). Test correctly filters to semantic-only names for the shared-contract assertion; nicolify's brand-owned agent colors are asserted separately via `NICOLIFY_AGENT_SLUGS`.

---

## Validator output (literal)

### V1-arch-single-token-source

```
 ✓ src/__tests__/architecture/test-ds-single-token-source.test.ts (39 tests) 6ms
 Test Files  1 passed (1)
     Tests  39 passed (39)
```

### V2-tsc

```
(no output — 0 errors)
```

### ESLint (test file)

```
(no output — 0 errors, 0 warnings after auto-fix by eslint --fix)
```

---

## Architecture decisions

- `--radius-pill` declared TWICE: once in `@theme` (as scale entry, generates `rounded-pill` utility) and once in `:root` (consumed by `--radius-control`). The `@theme` declaration is the Tailwind-utility-generating one; the `:root` one is for CSS var resolution by `--radius-control`. Both are brand-correct.
- Spacing values use `.25rem` (with leading dot) to exactly match `@luana/design-tokens` export format — the arch-test `css.includes(value)` checks for exact match.
- Typography tiers use `--text-{tier}` (Tailwind v4 convention); the test also checks `--font-size-{tier}` as fallback.

---

## Skills consulted

| Skill | Invoked | Decision |
|---|---|---|
| `frontend-expert` | Pre-implementation | TDD RED→GREEN order, eslint --fix after write, no inline style, no arbitrary values, spacing/radius/typography var naming per Tailwind v4 convention (`--spacing-N`, `--text-tier`) |
| `nicolify-design-system` | Pre-implementation | Brand identity HARD: `--primary: 243 100% 68%`, 7 agent colors, League Spartan/Bree Serif — do NOT touch. RN-7 = brand-scoped `--radius-control`, kit not touched |
| `design-system-canon.md` | Pre-implementation | ADR-014 Fase 3 adoption: mirror values into @theme + arch-test drift gate; NO codegen pipeline |
| `frontend-visual-fidelity.md` | Pre-implementation | D1: no arbitrary values; tokens consumed from `@luana/design-tokens` exports; identity-preserving |
| `spanish-text.md` | Applied | No user-facing strings in this ticket; CSS comments are internal/harness (voseo-free exempt) |

---

## Files modified

- `nicolify/frontend/src/app/globals.css` (+32 lines: spacing scale + radius names + typography tiers + --radius-control/pill in :root)
- `nicolify/frontend/package.json` (+1 line: `@luana/eslint-config: workspace:*` in devDependencies)
- `nicolify/frontend/src/__tests__/architecture/test-ds-single-token-source.test.ts` (NEW — 110 lines)

---

<!-- @pm: build phase done (state: tests-passing). Files: 3. Native ticket tests: 39/39 PASS. Awaiting orchestrator → gate-runner → auditor-frontend (independent verdict). -->
