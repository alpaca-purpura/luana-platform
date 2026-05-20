---
brand: comunify
story_id: comunify-design-system-a11y-contrast-cement
type: arch
surface: frontend-only
state: ready
architect_run_on: 2026-05-20
ssot_owner: /architect
next_handoff: /dev-team
sub_arch_split: false
---

# Architecture — Comunify Design System a11y Contrast Cement

## § 0. Context Summary

- **Story:** `comunify-design-system-a11y-contrast-cement` (v4.1 spec ratified Chris 2026-05-20).
- **Predecessors:** `comunify-design-system-cement` (v0.2.0) + `comunify-design-system-tailwind-v4-tokens` (v0.2.1).
- **Surface:** pure frontend — `comunify/frontend/src/**` + `comunify/docs/architecture/design-system.md`.
- **Sub-architects:** **NONE.** Pure FE/CSS/Tailwind tokens migration. No BE, no agentic.
- **Surface → builder → auditor mapping:**

  | Surface | Builder | Auditor |
  |---|---|---|
  | `comunify/frontend/src/app/globals.css` (CSS vars `@theme` + `:root`) | `builder-frontend` (Sonnet) | `auditor-frontend` (Opus) |
  | `comunify/frontend/tailwind.config.ts` | `builder-frontend` (Sonnet) | `auditor-frontend` (Opus) |
  | `comunify/frontend/src/features/comunify/components/*.tsx` (6 files migration) | `builder-frontend` (Sonnet) | `auditor-frontend` (Opus) |
  | `comunify/frontend/src/features/comunify/utils/format-engagement-bucket.ts` | `builder-frontend` (Sonnet) | `auditor-frontend` (Opus) |
  | `comunify/frontend/src/__tests__/architecture/test-no-low-contrast-pairs.test.ts` (NEW) | `builder-frontend` (Sonnet) | `auditor-frontend` (Opus) |
  | `comunify/frontend/src/__tests__/architecture/_low-contrast-allowlist.json` (NEW) | `builder-frontend` (Sonnet) | `auditor-frontend` (Opus) |
  | `comunify/frontend/e2e/regression/comunify-design-system-a11y-contrast-cement/*.spec.ts` (NEW) | `builder-frontend` (Sonnet) | `auditor-frontend` (Opus) |
  | `comunify/docs/architecture/design-system.md` (§ 1.5 + § 6) | `builder-frontend` (Sonnet) | `auditor-frontend` (Opus) |

- **Skills consulted:**
  - `frontend-expert` → ratifica FSD-Lite scope + Shadcn baseline + arch fitness ratchet pattern (allowlist shrink-only)
  - `tessl__tailwind` (load on builder side) → Tailwind v4 `@theme` block authoring + CSS var bridge to `hsl(var(--x))`
  - `playwright-expert` (load on builder side for SC-01/03/04) → axe-core integration + computed style contrast probes
  - `.claude/rules/frontend-fsd.md` — N/A scope (no cross-feature imports added) but referenced for guardrails
  - `.claude/rules/spanish-text.md` — magic comment `<!-- voseo-allowed -->` precedent (no microcopy touched; voseo glosario reference)
- **CONTEXT-BRIEF source:** spec 01-spec.md is exhaustive and ratified verbatim; § 7/§ 8 of brief inferred directly from `01-spec.md § Audit findings` + `§ Decisión técnica cementada` (no hidden duplication — sibling cement stories are sequential, not parallel layers).
- **capability YAML files affected (post-merge update):**
  - NEW: `comunify/docs/product/capabilities/frontend_design_system/a11y-contrast.yaml` (status: live, version: v0.3.0)
  - UPDATE: `comunify/docs/product/modules/frontend_design_system.md` (auto-list refresh; capability count 2 → 3)
- **Architecture gates that must keep passing:**
  - `comunify/frontend/src/__tests__/architecture/test-no-stock-palette.test.ts` (pre-existing — must not regress)
  - `comunify/frontend/src/__tests__/architecture/test-no-low-contrast-pairs.test.ts` (NEW — green at story close)
  - Lint + tsc + format + vitest unit + Playwright smoke (existing).

## § 1. File map (paths exactos)

### NEW files (4)

| Path | Purpose | Owner |
|---|---|---|
| `comunify/frontend/src/__tests__/architecture/test-no-low-contrast-pairs.test.ts` | Vitest arch fitness: 6 HARD-blocked Tailwind class pair patterns + allowlist mechanism + magic comment escape | T-2 |
| `comunify/frontend/src/__tests__/architecture/_low-contrast-allowlist.json` | Allowlist baseline `[]` (clean slate ratchet) | T-2 |
| `comunify/frontend/e2e/regression/comunify-design-system-a11y-contrast-cement/design-system-pairs.spec.ts` | SC-01 Playwright: computed contrast ≥ 4.5:1 sample probe + utility class emission grep | T-4 |
| `comunify/frontend/e2e/regression/comunify-design-system-a11y-contrast-cement/moderation-card.spec.ts` | SC-03 Playwright: Camino B render + axe-core `wcag2aa` zero violations on `/dashboard/community` | T-4 |
| `comunify/frontend/e2e/regression/comunify-design-system-a11y-contrast-cement/badges-tints.spec.ts` | SC-04 Playwright: tints sobre light bg verification + legacy pattern grep | T-4 |

### MODIFIED files (10)

| Path | Change | Owner |
|---|---|---|
| `comunify/frontend/src/app/globals.css` | `@theme` + `:root`: add 5 new `--color-comunify-{X}-text` + corresponding `--comunify-{X}-text` HSL channels | T-1 |
| `comunify/frontend/tailwind.config.ts` | `colors` extend: add 5 new `"comunify-{X}-text"` slots wired via `hsl(var(--comunify-{X}-text))` | T-1 |
| `comunify/docs/architecture/design-system.md` | § 1.5 NEW table (5 `-text` tokens + ratios) + § 6 NEW recipes (Camino B universal, badge tint, alert banner, error label) | T-1 |
| `comunify/frontend/src/features/comunify/components/community-moderation-card.tsx` | Lines 21-23 buttons → Camino B universal; lines 75-77 status pills → `text-comunify-{X}-text` | T-3 |
| `comunify/frontend/src/features/comunify/components/dunning-active-banner.tsx` | Lines 20, 23 → `text-comunify-warning-text`; line 31 button → Camino B universal | T-3 |
| `comunify/frontend/src/features/comunify/components/voice-samples-uploader.tsx` | Lines 143-145: 3 status badges → `text-comunify-{X}-text` | T-3 |
| `comunify/frontend/src/features/comunify/components/voice-distilled-preview.tsx` | Line 54: badge → `text-comunify-stable-text` | T-3 |
| `comunify/frontend/src/features/comunify/components/cohort-broadcast-composer.tsx` | Lines 94, 114: 2 error labels → `text-comunify-critical-text` | T-3 |
| `comunify/frontend/src/features/comunify/components/authority-vault-editor.tsx` | Lines 26-27: 2 badges → `text-comunify-{X}-text` | T-3 |
| `comunify/frontend/src/features/comunify/utils/format-engagement-bucket.ts` | Lines 10-12: 3 keys → `text-comunify-{X}-text` (warning/stable/blue) | T-3 |

## § 2. Token system architecture

### 2.1 `globals.css` — `@theme` block (Tailwind v4 utility generation)

Tailwind v4 reads `@theme { --color-X-Y: ... }` to auto-generate `.bg-X-Y / .text-X-Y / .border-X-Y` utility classes. Add **5 new tokens** following the existing pattern (`hsl(H S% L%)` literal — NOT `hsl(var(...))` — because `@theme` requires resolvable color at config-read time):

```css
@theme {
  /* ...existing tokens preserved verbatim... */

  /* a11y-contrast cement — foreground variants for light bg (WCAG AA ≥ 4.5:1) */
  --color-comunify-warning-text:  hsl(45 100% 28%);   /* #8E6B00 — gold dark */
  --color-comunify-stable-text:   hsl(152 80% 28%);   /* #0E804B — green dark */
  --color-comunify-accent-text:   hsl(355 100% 45%);  /* #E50013 — coral dark */
  --color-comunify-critical-text: hsl(0 84% 49%);     /* #E51313 — red dark */
  --color-comunify-blue-text:     hsl(217 95% 52%);   /* #1069F8 — blue dark */
}
```

### 2.2 `globals.css` — `:root` (CSS var bridge for `hsl(var(--x))` consumers)

Mirror the same HSL channels (no `hsl()` wrapper — channel-only format `H S% L%`) so legacy `hsl(var(--comunify-{X}))` usages in components scale identically:

```css
:root {
  /* ...existing tokens preserved verbatim... */

  /* a11y-contrast cement — foreground variants for light bg */
  --comunify-warning-text:  45 100% 28%;
  --comunify-stable-text:   152 80% 28%;
  --comunify-accent-text:   355 100% 45%;
  --comunify-critical-text: 0 84% 49%;
  --comunify-blue-text:     217 95% 52%;
}
```

### 2.3 `tailwind.config.ts` — extend `colors`

Add 5 slot mappings consistent with existing pattern (`theme.extend.colors` already wires `hsl(var(--x))`):

```ts
colors: {
  // ...existing slots preserved verbatim...
  "comunify-warning-text":  "hsl(var(--comunify-warning-text))",
  "comunify-stable-text":   "hsl(var(--comunify-stable-text))",
  "comunify-accent-text":   "hsl(var(--comunify-accent-text))",
  "comunify-critical-text": "hsl(var(--comunify-critical-text))",
  "comunify-blue-text":     "hsl(var(--comunify-blue-text))",
}
```

### 2.4 Why both `@theme` AND `tailwind.config.ts`?

Pre-existing pattern from `tailwind-v4-tokens` story (v0.2.1) — Comunify's hybrid setup runs Tailwind v4 utility generation via `@theme` but keeps `tailwind.config.ts` for plugin compatibility + IDE intellisense. New tokens MUST be added to both places to maintain consistency (arch fitness verifies via grep). Single-source migration is out-of-scope for this story.

### 2.5 HSL principales del brandbook NO se modifican (HARD invariant)

The 3 primary semantic colors stay intact:
- `--comunify-warning: 45 100% 48%` (#F5B700 — gold)
- `--comunify-stable:  152 80% 43%` (#16C784 — green)
- `--comunify-accent:  355 100% 69%` (#FF5F6D — coral)

The `-text` variants are **additional dark-foreground siblings**, NOT replacements. Both lineages coexist (solid bg use original; text-on-light-bg use `-text`).

## § 3. Camino B pattern (universal recipe)

### 3.1 Verbatim Tailwind recipe

```tsx
"bg-comunify-{X}/10 border border-comunify-{X} text-comunify-{X}-text hover:bg-comunify-{X}/20"
```

Where `{X}` ∈ `{warning, stable, accent, critical, blue}`.

### 3.2 Behavior states (mapped to spec § Estados visuales)

| State | Trigger | Classes |
|---|---|---|
| `idle` | default | `bg-{X}/10 border border-{X} text-{X}-text` |
| `hover` | mouse-over | `hover:bg-{X}/20` |
| `focus` | tab-keyboard | `focus:ring-2 focus:ring-comunify-{X}` (border preserved, +2px ring outside) |
| `active` | mouse-down | `active:bg-{X}/30` (optional — apply only on moderation buttons) |
| `disabled` | aria-disabled | `disabled:opacity-50 disabled:cursor-not-allowed` (50% opacity on bg/border/text) |

### 3.3 Why outline pattern (Camino B) over color-shift (Camino A)

- **Brandbook integrity:** HSL principales se conservan (Chris hard requirement).
- **Semantic preservation:** green=approve, yellow=reject, red=ban identifiable at glance even with outline-only treatment.
- **WCAG AA universal pass:** all 6 critical pairs lift from 1.80–3.76:1 → 4.5–9.7:1 with single pattern.
- **Hover affordance:** `bg/10 → bg/20` tint deepening provides physical-feel without changing hue.

### 3.4 NOT to be migrated (explicit out-of-scope per spec)

- `ladder-visualizer.tsx`: no-op (border-warning OK sin text overlay sobre warning bg)
- Primary CTA (`bg-comunify-gradient text-comunify-primary-foreground`): already AA 5.85:1 — preserved
- `bg-comunify-critical text-white` (3.76:1 marginal) — NOT blocked by arch test (responsabilidad dev). But `community-moderation-card.tsx:23` ban button DOES migrate by consistency (3-button group uniformity).
- `bg-comunify-blue text-white` (3.81:1 marginal) — NOT blocked. Latent — no usages today.

## § 4. Arch fitness test design (`test-no-low-contrast-pairs.test.ts`)

### 4.1 Regex patterns (6 HARD-blocked + 0 NOT-blocked)

The arch test detects regex matches on `.tsx`/`.ts` files under `comunify/frontend/src/**` (excluding `node_modules`, `__tests__`, `.next`). Each pattern emits a violation row with `{file, line, match, kind, reason}`.

```typescript
// SSoT verbatim — matches spec § Decisión técnica § Arch fitness § Patrones HARD blocked
const FORBIDDEN_PAIR_REGEXES: { kind: string; pattern: RegExp; hint: string }[] = [
  // Group A — solid bg + text-white (1.80–2.95:1 fail)
  {
    kind: "warning-bg-white-text",
    pattern: /\bbg-comunify-warning(?!-text)(?![/-])\b[^"'`]*\btext-white\b|\btext-white\b[^"'`]*\bbg-comunify-warning(?!-text)(?![/-])\b/g,
    hint: "1.80:1 fail. Use Camino B: bg-comunify-warning/10 border border-comunify-warning text-comunify-warning-text",
  },
  {
    kind: "stable-bg-white-text",
    pattern: /\bbg-comunify-stable(?!-text)(?![/-])\b[^"'`]*\btext-white\b|\btext-white\b[^"'`]*\bbg-comunify-stable(?!-text)(?![/-])\b/g,
    hint: "2.20:1 fail. Use Camino B: bg-comunify-stable/10 border border-comunify-stable text-comunify-stable-text",
  },
  {
    kind: "accent-bg-white-text",
    pattern: /\bbg-comunify-accent(?!-text)(?![/-])\b[^"'`]*\btext-white\b|\btext-white\b[^"'`]*\bbg-comunify-accent(?!-text)(?![/-])\b/g,
    hint: "2.95:1 fail. Use Camino B: bg-comunify-accent/10 border border-comunify-accent text-comunify-accent-text",
  },
  // Group B — semantic text token on light bg (1.72–2.82:1 fail) — direct usage without -text suffix
  {
    kind: "warning-text-on-bg",
    pattern: /\btext-comunify-warning(?!-text)(?![/-])\b/g,
    hint: "1.72:1 on bg-comunify-bg. Use text-comunify-warning-text (4.72:1 AA).",
  },
  {
    kind: "stable-text-on-bg",
    pattern: /\btext-comunify-stable(?!-text)(?![/-])\b/g,
    hint: "2.10:1 on bg-comunify-bg. Use text-comunify-stable-text (4.77:1 AA).",
  },
  {
    kind: "accent-text-on-bg",
    pattern: /\btext-comunify-accent(?!-text)(?![/-])\b/g,
    hint: "2.82:1 on bg-comunify-bg. Use text-comunify-accent-text (4.53:1 AA).",
  },
];
```

### 4.2 Negative lookahead `(?!-text)(?![/-])` rationale

- `(?!-text)` — exclude legitimate `text-comunify-warning-text` usage (the fix).
- `(?![/-])` — exclude `bg-comunify-warning/10` (Camino B tint) and `bg-comunify-warning-text` (impossible-but-safe).

This makes the regex precise: it flags **only** the bare legacy classes, not the new canonical pairs.

### 4.3 Patterns NOT blocked (opción C híbrida ratificada)

Explicit allowed (dev responsibility):
- `bg-comunify-critical text-white` (3.76:1 — UI/large OK; ban button migrates by consistency but pattern not blocked)
- `bg-comunify-blue text-white` (3.81:1 — UI/large OK)
- `text-comunify-critical` and `text-comunify-blue` bare (3.60:1 — marginal; sweep migrates them but pattern not blocked for future flexibility)

### 4.4 Allowlist mechanism (ratchet shrink-only)

Same pattern as existing `test-no-stock-palette.test.ts`:

```typescript
interface AllowlistEntry {
  file: string;
  match: string;
  kind: string;
  line?: number;
  justification: string;
  owner_pr: string;
}
const ALLOWLIST: AllowlistEntry[] = allowlistJson as AllowlistEntry[];
```

Baseline `_low-contrast-allowlist.json = []` (clean slate post-T-3 sweep). Future violations require:
1. Add entry with `justification` (auditor scrutinizes), OR
2. Add inline magic comment `// a11y-allow: <razón>` on the same line (per spec SC-02).

Magic comment honored via regex `\/\/\s*a11y-allow(?::\s*[^"\n]+)?` on the violation's line — if present, violation suppressed (count NOT added to allowlist either; inline escape).

### 4.5 Permanent file allowlist

```typescript
const PERMANENT_ALLOWLIST_PATHS = new Set([
  "src/app/globals.css",                                  // SSoT runtime tokens — HEX is canon
  "src/__tests__/architecture/test-no-low-contrast-pairs.test.ts",  // self-ref (regex strings)
  "src/__tests__/architecture/_low-contrast-allowlist.json",        // self-ref (json strings)
]);
```

### 4.6 RED → GREEN sequence (TDD)

- **T-2 RED:** test created with `_low-contrast-allowlist.json = []`. Run vitest → expect FAIL with ~13 violations listed (6 from `community-moderation-card.tsx` + 2 from `dunning-active-banner.tsx` + 3 from `voice-samples-uploader.tsx` + 1 each from `voice-distilled-preview.tsx`, `authority-vault-editor.tsx` × 2, `cohort-broadcast-composer.tsx` × 2, `format-engagement-bucket.ts` × 3). Capture exact baseline list in T-2 impl-log.
- **T-3 GREEN:** sweep migrates components → re-run vitest → 0 violations → test PASS.

## § 5. Test Construction Plan v4.1 — orden + POMs + fixtures + scenario_to_test mapping

### 5.1 Test order (RED-first per layer)

| Step | Order | Test/file | RED → GREEN trigger |
|---|---|---|---|
| 1 | T-1 | Smoke vitest unit: `getTokenContrast()` utility (if extracted) ≥ 4.5:1 | NEW — runs in `__tests__/utils/` |
| 2 | T-2 | Arch fitness `test-no-low-contrast-pairs.test.ts` RED baseline | RED until T-3 sweeps |
| 3 | T-3 | Component migration sweep (no new tests; existing component vitest tests must still pass) | Existing tests turn GREEN as classes update |
| 4 | T-4a | Playwright SC-01 `design-system-pairs.spec.ts` (computed contrast probe + utility class grep) | GREEN at first run post-T-3 |
| 5 | T-4b | Playwright SC-03 `moderation-card.spec.ts` (axe wcag2aa + visual_state) | GREEN at first run post-T-3 |
| 6 | T-4c | Playwright SC-04 `badges-tints.spec.ts` (tints + legacy grep ratchet) | GREEN at first run post-T-3 |

### 5.2 scenario_to_test mapping (gherkin coverage)

| Scenario | Test path | Type |
|---|---|---|
| SC-01 (Happy) | `comunify/frontend/e2e/regression/comunify-design-system-a11y-contrast-cement/design-system-pairs.spec.ts::sc-01-camino-b-buttons-pass-aa` | E2E (Playwright) |
| SC-01 (Happy — utility emission) | `comunify/frontend/src/__tests__/architecture/test-no-low-contrast-pairs.test.ts::sc-01-utility-classes-exist-in-bundle` | Arch fitness (vitest grep) |
| SC-02 (Negative) | `comunify/frontend/src/__tests__/architecture/test-no-low-contrast-pairs.test.ts::sc-02-forbidden-pairs-fail-build` | Arch fitness (vitest) |
| SC-02 (Negative — allowlist) | `comunify/frontend/src/__tests__/architecture/test-no-low-contrast-pairs.test.ts::sc-02-allowlist-requires-justification` | Arch fitness (vitest) |
| SC-03 (Edge — moderation) | `comunify/frontend/e2e/regression/comunify-design-system-a11y-contrast-cement/moderation-card.spec.ts::sc-03-camino-b-semantic-preserved` | E2E + axe |
| SC-03 (Edge — axe) | `comunify/frontend/e2e/regression/comunify-design-system-a11y-contrast-cement/moderation-card.spec.ts::sc-03-axe-wcag2aa-zero-violations` | E2E (axe-core) |
| SC-04 (Adversarial) | `comunify/frontend/e2e/regression/comunify-design-system-a11y-contrast-cement/badges-tints.spec.ts::sc-04-tints-contrast-sample` | E2E (Playwright) |
| SC-04 (Adversarial — ratchet) | `comunify/frontend/src/__tests__/architecture/test-no-low-contrast-pairs.test.ts::sc-04-legacy-pattern-grep-ratchet` | Arch fitness (vitest) |
| SC-a11y | bundled in SC-01/03/04 + Playwright `a11y` project axe run on `/dashboard/community` + `/dashboard/membership` | E2E (axe-core) |

### 5.3 POM (Page Object Model) usage

- **Reuse existing:** `comunify/frontend/e2e/specs/smoke/community-moderation.smoke.spec.ts` already exercises `/dashboard/community` — extract or align selectors (no new POM file required, but a small helper module `comunify/frontend/e2e/regression/comunify-design-system-a11y-contrast-cement/_helpers.ts` for computed-style + WCAG formula utilities is acceptable).
- **Selectors stable:** prefer `[data-testid]` already present in components (moderation buttons have `data-action="approve|reject|ban"` per spec wireframe — verify in T-3, add if absent).

### 5.4 Fixtures + auth

- **`auth.fixture.ts` reuse:** existing Clerk testing-token fixture in `comunify/frontend/e2e/auth.fixture.ts`. All new regression specs authenticate via this.
- **No new fixtures.** Story is CSS-only — no data setup, no DB seed.
- **Mock-free:** real components rendered in dev stack (`make dev-comunify` on port 3003).

### 5.5 axe-core integration

Install `@axe-core/playwright` if not yet present (verify in `comunify/frontend/package.json`):

```bash
cd comunify/frontend && npm install --save-dev @axe-core/playwright
```

Usage pattern in SC-03 spec:

```typescript
import { test, expect } from "../../auth.fixture";
import AxeBuilder from "@axe-core/playwright";

test("sc-03 axe wcag2aa zero violations on /dashboard/community", async ({ authenticatedPage }) => {
  await authenticatedPage.goto("/dashboard/community");
  const results = await new AxeBuilder({ page: authenticatedPage })
    .withTags(["wcag2aa", "wcag21aa"])
    .include('[data-testid="moderation-card"]')  // scope to migrated surface
    .analyze();
  expect(results.violations).toEqual([]);
});
```

### 5.6 Computed contrast probe (SC-01 + SC-04)

Helper `_helpers.ts`:

```typescript
export async function getContrastRatio(page: Page, selector: string): Promise<number> {
  return await page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLElement;
    const style = getComputedStyle(el);
    const fg = parseRGB(style.color);
    const bg = parseRGB(style.backgroundColor);
    return wcagRatio(fg, bg);  // standard formula L1+0.05 / L2+0.05
  }, selector);
}
```

Reference WCAG formula: `https://www.w3.org/TR/WCAG20-TECHS/G18.html` (accessed 2026-05-20).

### 5.7 Cost guardrails

- **Total tests added:** 1 arch fitness file (vitest, ~50ms run), 3 Playwright specs (~5–10s each with axe). Net suite impact <1min.
- **No agentic LLM calls** in any test.
- **No new fixtures spawned in CI** — auth fixture reuses storage state.

## § 6. Verification commands

```bash
WS=$(git rev-parse --show-toplevel)
BRAND=comunify

# 1. Lint + format
cd ${WS}/${BRAND}/frontend && npx tsc --noEmit
cd ${WS}/${BRAND}/frontend && npx eslint src/ --cache

# 2. Arch fitness (RED at T-2, GREEN at T-3 close)
cd ${WS}/${BRAND}/frontend && npx vitest run src/__tests__/architecture/test-no-low-contrast-pairs.test.ts

# 3. Full vitest suite (regression — existing tests stay green)
cd ${WS}/${BRAND}/frontend && npx vitest run

# 4. Playwright regression specs (this story)
cd ${WS}/${BRAND}/frontend && E2E_BASE_URL=http://localhost:3003 \
  npx playwright test e2e/regression/comunify-design-system-a11y-contrast-cement/

# 5. Playwright a11y project — full axe on /dashboard/community + /dashboard/membership
cd ${WS}/${BRAND}/frontend && E2E_BASE_URL=http://localhost:3003 \
  npx playwright test --project=a11y --grep "wcag2aa"

# 6. Smoke regression (existing — must not break)
cd ${WS}/${BRAND}/frontend && E2E_BASE_URL=http://localhost:3003 \
  npx playwright test --project=smoke

# 7. Grep ratchet sanity (sc-04 adversarial — zero matches after T-3)
cd ${WS}/${BRAND}/frontend && grep -rnE "text-comunify-(warning|stable|accent)(?!-text)([^-]|$)" src/features/ src/app/ || echo "OK — zero matches"
```

## § 7. Cross-cutting concerns

- **Tenant isolation:** N/A (no BE/data touched).
- **Currency / locale:** N/A.
- **PII:** N/A (no response models, no logs touched).
- **Spanish neutro:** N/A on chrome (no microcopy touched). `01-spec.md` line 1 carries `<!-- voseo-allowed -->` magic comment for glosario reference verbatim — preserved.
- **Native-first dev:** all lint/tsc/vitest/playwright run native via `npx` from `${WS}/comunify/frontend`. No Docker exec for tests.
- **FSD-Lite boundaries:** unchanged. No cross-feature imports added. All modified files stay in their existing slices.
- **Architectural fitness:** new arch test extends ratchet pattern (allowlist shrink-only). Pre-existing `test-no-stock-palette.test.ts` baseline must remain green throughout.
- **TDD discipline:** T-2 writes RED test BEFORE T-3 sweep. Auditor enforces order in review.

## § 8. Architecture fitness impact

- **Pre-existing gates (must stay green):**
  - `comunify/frontend/src/__tests__/architecture/test-no-stock-palette.test.ts` — adding `-text` token usages does NOT trigger this gate (regex matches `bg|text|border-{stock-palette}-{number}`, not `-text` suffix).
- **New gates:**
  - `comunify/frontend/src/__tests__/architecture/test-no-low-contrast-pairs.test.ts` (NEW) — baseline allowlist `[]`, shrink-only.

## § 9. capability YAML + modules/{m}.md updates required (post-merge, paradigma post 2026-05)

To be performed by `/pm-comunify` in Fase F (07-merge):

- **NEW capability:** `comunify/docs/product/capabilities/frontend_design_system/a11y-contrast.yaml`
  ```yaml
  capability_id: a11y-contrast
  module: frontend_design_system
  status: live
  version: v0.3.0
  description: |
    WCAG AA contrast compliance for Comunify design system. Adds 5 *-text token
    siblings (dark foreground variants) for use on light bg. Camino B universal
    pattern (outline + tint) replaces solid bg + text-white in moderation card +
    dunning banner. Arch fitness blocks 6 known low-contrast pair patterns;
    critical + blue marginal pairs remain dev-responsibility (opción C híbrida).
  ssot_files:
    - comunify/frontend/src/app/globals.css
    - comunify/frontend/tailwind.config.ts
    - comunify/docs/architecture/design-system.md
  verification:
    commands:
      - cd ${WS}/comunify/frontend && npx vitest run src/__tests__/architecture/test-no-low-contrast-pairs.test.ts
      - cd ${WS}/comunify/frontend && E2E_BASE_URL=http://localhost:3003 npx playwright test e2e/regression/comunify-design-system-a11y-contrast-cement/
    gherkin_evidence: comunify/docs/product/stories/comunify-design-system-a11y-contrast-cement/06-audit/gherkin-matrix.md
  ```
- **UPDATE auto-list:** `comunify/docs/product/modules/frontend_design_system.md` — `reconcile_capabilities.py --brand comunify` regenerates auto-list section to include `a11y-contrast` (3 caps total: design-system-cement + tailwind-v4-tokens + a11y-contrast).

## § 10. Test surfaces (TDD-mandatory)

Per `.claude/rules/tdd-mandatory.md`:

| Layer | Test type | Path | RED order |
|---|---|---|---|
| Tokens (CSS) | Vitest arch | `test-no-low-contrast-pairs.test.ts` (NEW) — utility class emission grep + allowlist | T-2 |
| Tokens (CSS) | Vitest arch | `test-no-stock-palette.test.ts` (existing) — must stay green | continuous |
| Components | Existing component tests | `comunify/frontend/src/features/comunify/**/*.test.tsx` (whatever exists) | continuous green |
| E2E | Playwright happy | `design-system-pairs.spec.ts` SC-01 | T-4 |
| E2E | Playwright edge + axe | `moderation-card.spec.ts` SC-03 | T-4 |
| E2E | Playwright adversarial | `badges-tints.spec.ts` SC-04 | T-4 |
| Visual / a11y | axe-core wcag2aa | `/dashboard/community` + `/dashboard/membership` | T-4 |

## § 11. Research notes (date-aware)

- WCAG 2.1 SC 1.4.3 (Contrast Minimum AA) — `https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html` (accessed 2026-05-20). Threshold ≥4.5:1 normal text, ≥3:1 UI/large text.
- WCAG contrast formula reference — `https://www.w3.org/TR/WCAG20-TECHS/G18.html` (accessed 2026-05-20).
- `@axe-core/playwright` API v4.10 — `https://www.npmjs.com/package/@axe-core/playwright` (accessed 2026-05-20). `withTags(["wcag2aa", "wcag21aa"])` is the canonical AA filter; `include()` scopes to selector.
- Tailwind v4 `@theme` block — `https://tailwindcss.com/docs/theme` (accessed 2026-05-20). Theme variables prefixed `--color-*` auto-generate `.{bg,text,border}-*` utility classes; theme reads at config time so values must be CSS-color literal not `var()`.
- Audit data dura (22 pares ratios) — sourced from `/tmp/wcag_audit.py` (spec § Audit findings table verbatim). Internal calculation referencing standard WCAG formula. No external research dependency for the ratios themselves.
- Knowledge cutoff: Opus 4.7 cutoff Jan 2026; the cited URLs are public stable spec/library refs unchanged since the cutoff. Verified via memory of canonical references; no live fetch was strictly required to ratify the spec choices already cemented by Chris.

## § 12. Open questions for PM

**Ninguna.** Spec is exhaustively ratified by Chris in 3 batches (2026-05-20). All decisions cemented:
- 5 `-text` tokens with exact HSL channels
- Camino B universal pattern
- Arch fitness opción C híbrida (6 HARD blocks, 0 NOT-blocked critical/blue)
- 10 archivos scope (no expansion)
- 0 new components

Architect's task here is purely contract translation — no design choices left open.

