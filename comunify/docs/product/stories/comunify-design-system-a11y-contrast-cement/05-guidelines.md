---
brand: comunify
story_id: comunify-design-system-a11y-contrast-cement
ssot_owner: /architect
last_updated: 2026-05-20
surface: frontend-only
---

# Guidelines — Comunify Design System a11y Contrast Cement

## § must_load_skills (enforceable — builder/auditor MUST load before any edit)

| Skill | Trigger | Reason |
|---|---|---|
| `frontend-expert` | always | FSD-Lite scope confirm + Shadcn baseline + arch fitness ratchet pattern + Vitest harness |
| `tessl__tailwind` | when editing `globals.css` OR `tailwind.config.ts` | Tailwind v4 `@theme` block authoring; CSS var bridge `hsl(var(--x))`; utility class generation rules |
| `playwright-expert` | when authoring SC-01/03/04 Playwright specs | Clerk auth fixture reuse + axe-core integration + computed style probes |
| `.claude/rules/frontend-fsd.md` | always (read) | No cross-feature imports added (scope guardrail) |
| `.claude/rules/spanish-text.md` | always (read) | Glosario reference: spec carries magic comment `<!-- voseo-allowed -->`; preserve verbatim |
| `.claude/rules/tdd-mandatory.md` | always (read) | RED-first order enforce: T-2 arch test before T-3 sweep |
| `.claude/rules/architectural-fitness.md` | always (read) | Ratchet shrink-only invariant for `_low-contrast-allowlist.json` |
| `.claude/rules/anti-duplication.md` | T-1 + T-3 only | Verify no parallel design tokens layer creep (story only EXTENDS existing globals.css + tailwind.config.ts pattern) |

## § Patterns REQUIRED

### Pattern 1 — Camino B universal (outline + tint + dark text)

```tsx
// Verbatim recipe — replace solid bg + text-white with this on warning/stable/accent/critical contexts
"bg-comunify-{X}/10 border border-comunify-{X} text-comunify-{X}-text hover:bg-comunify-{X}/20"

// With focus ring (mandatory on interactive buttons)
"bg-comunify-{X}/10 border border-comunify-{X} text-comunify-{X}-text hover:bg-comunify-{X}/20 focus:ring-2 focus:ring-comunify-{X}"
```

Apply to: moderation buttons (approve/reject/ban), dunning retry CTA, any new interactive surface that needs semantic color identification.

### Pattern 2 — Badge tint (non-interactive)

```tsx
// For status pills, badges, label chips
"bg-comunify-{X}/10 text-comunify-{X}-text"
```

Apply to: voice-samples status pills, authority-vault status badges, voice-distilled badge, format-engagement-bucket keys.

### Pattern 3 — Inline error label

```tsx
// For form validation errors (no bg needed — inherits parent)
"text-comunify-critical-text"
```

Apply to: cohort-broadcast-composer error labels.

### Pattern 4 — Alert banner sólido (dark text on saturated bg)

```tsx
// For high-visibility banner where bg color is essential
"bg-comunify-{X} text-comunify-text"   // text-comunify-text (dark) NOT text-white
```

Apply when banner solid bg is wanted (rare — spec ratificó Camino B universal even for dunning; this is documented as alternative).

### Pattern 5 — Arch fitness ratchet shrink-only

```typescript
// Follow exact pattern of test-no-stock-palette.test.ts
// _low-contrast-allowlist.json baseline = []
// Magic comment escape: // a11y-allow: <razón>
// Each new violation forces auditor scrutiny via PR review
```

### Pattern 6 — Token addition (both surfaces)

When adding ANY new design token, must declare in BOTH places (current Comunify hybrid setup):
1. `globals.css @theme { --color-comunify-X: hsl(...) }` (Tailwind v4 utility generation)
2. `globals.css :root { --comunify-X: H S% L% }` (CSS var bridge — channel-only format)
3. `tailwind.config.ts colors: { "comunify-X": "hsl(var(--comunify-X))" }` (legacy plugin compatibility + IDE intellisense)

## § Patterns FORBIDDEN (hard fail in arch fitness + auditor)

### Forbidden 1 — Solid bg + text-white on warning/stable/accent

```tsx
// ❌ NEVER — fails WCAG AA (1.80–2.95:1)
"bg-comunify-warning text-white"
"bg-comunify-stable hover:bg-comunify-stable/90 text-white"
"bg-comunify-accent text-white"
```

Arch test `test-no-low-contrast-pairs.test.ts` blocks build.

### Forbidden 2 — Bare semantic text token on light bg

```tsx
// ❌ NEVER — fails WCAG AA on bg-comunify-bg (1.72–2.82:1)
"text-comunify-warning"
"text-comunify-stable"
"text-comunify-accent"
```

Use `-text` suffix variant always.

### Forbidden 3 — HEX literal in components

```tsx
// ❌ NEVER — bypasses token system
"text-[#8E6B00]"
className="bg-[#F5B700]"
```

Pre-existing `test-no-stock-palette.test.ts` already blocks. Story does not regress this.

### Forbidden 4 — Modifying HSL principales del brandbook

```css
/* ❌ NEVER — these stay intact (Chris hard requirement) */
--comunify-warning: 45 100% 48%;   /* preserve */
--comunify-stable:  152 80% 43%;   /* preserve */
--comunify-accent:  355 100% 69%;  /* preserve */
--comunify-critical: 0 84% 60%;    /* preserve */
--comunify-blue:    217 95% 58%;   /* preserve */
```

The new `-text` tokens are ADDITIONAL siblings, NOT replacements.

### Forbidden 5 — Adding violations to `_low-contrast-allowlist.json` without justification

Auditor FAIL if any new allowlist entry lacks:
- `file: "<exact-path>"`
- `match: "<exact-class>"`
- `kind: "<one-of-6-blocked-kinds>"`
- `justification: "<why this is the only viable solution>"`
- `owner_pr: "<this-story-id>"`

### Forbidden 6 — Scope creep

Out of scope (anti-creep per spec § Out of scope):
- ❌ Dark mode
- ❌ Logo wordmark
- ❌ Audit other brands
- ❌ Lift to core engine
- ❌ New components (zero — only class migration)
- ❌ Typography/spacing/motion changes
- ❌ Microcopy edits

### Forbidden 7 — Cross-brand pollution

- ❌ NEVER touch `vitalia/`, `nicolify/`, `lupulo/` (other brands)
- ❌ NEVER touch `core/luana-core-*/` (engine off-limits — requires `/pm-luana` promotion gate)

### Forbidden 8 — Editing `_low-contrast-allowlist.json` from `[]` baseline at T-2 close

T-2 closes with allowlist = `[]` (clean slate). T-3 sweep migrates components → 0 violations. No allowlist additions allowed in this story (baseline ratchet enforces).

### Forbidden 9 — `.smoke.spec.ts` placement

New Playwright specs go in `comunify/frontend/e2e/regression/comunify-design-system-a11y-contrast-cement/` (NOT in `e2e/specs/smoke/`). Spec naming: `*.spec.ts` (no `.smoke` suffix — these are regression scoped to this story). `playwright.config.ts` regression project covers them via default testDir.

## § Files in scope (verbatim — out of these → REVERT)

### CREATE (5)

```
comunify/frontend/src/__tests__/architecture/test-no-low-contrast-pairs.test.ts
comunify/frontend/src/__tests__/architecture/_low-contrast-allowlist.json
comunify/frontend/e2e/regression/comunify-design-system-a11y-contrast-cement/design-system-pairs.spec.ts
comunify/frontend/e2e/regression/comunify-design-system-a11y-contrast-cement/moderation-card.spec.ts
comunify/frontend/e2e/regression/comunify-design-system-a11y-contrast-cement/badges-tints.spec.ts
```

Optionally (helper):
```
comunify/frontend/e2e/regression/comunify-design-system-a11y-contrast-cement/_helpers.ts
```

### MODIFY (10)

```
comunify/frontend/src/app/globals.css
comunify/frontend/tailwind.config.ts
comunify/docs/architecture/design-system.md
comunify/frontend/src/features/comunify/components/community-moderation-card.tsx
comunify/frontend/src/features/comunify/components/dunning-active-banner.tsx
comunify/frontend/src/features/comunify/components/voice-samples-uploader.tsx
comunify/frontend/src/features/comunify/components/voice-distilled-preview.tsx
comunify/frontend/src/features/comunify/components/cohort-broadcast-composer.tsx
comunify/frontend/src/features/comunify/components/authority-vault-editor.tsx
comunify/frontend/src/features/comunify/utils/format-engagement-bucket.ts
```

Optionally (no-op confirmation):
```
comunify/frontend/src/features/comunify/components/ladder-visualizer.tsx  (no edit — verify status only)
```

### DO NOT TOUCH (anti-creep enforcement)

- ❌ Any file outside the 10 MODIFY + 5 CREATE list
- ❌ Other brands (`vitalia/`, `nicolify/`, `lupulo/`)
- ❌ Engine (`core/luana-core-*/`)
- ❌ Other Comunify features (`creator-landing-hero.tsx`, `subscription-metrics-cards.tsx`, etc.)
- ❌ Backend (`comunify/backend/`)
- ❌ Other arch tests (`test-no-stock-palette.test.ts` — leave as-is)
- ❌ `package.json` (except adding `@axe-core/playwright` as devDependency if missing — confirm first)

## § Spanish neutro

No microcopy touched. Spec line 1 carries `<!-- voseo-allowed -->` magic comment for glosario reference verbatim — preserve. No new strings introduced by this story (CSS classes only).

## § Voseo policy (this story)

- ✅ Magic comment `<!-- voseo-allowed -->` in `01-spec.md` (preserved)
- ✅ Magic comment `// voseo-allowed: glosario` in test files IF they include voseo regex strings for reference (none expected in this story)
- ❌ NO voseo introduced in chrome UI (story does not touch chrome — but rule continues to apply)

## § Test discipline (TDD)

**RED-FIRST ORDER (mandatory)**:

1. T-1 foundation: tokens + tailwind config + design-system.md docs → run validators val-arch-4 + val-arch-5 (must PASS — 5 tokens declared) + val-arch-2 (must stay PASS — stock-palette baseline preserved) + val-nf-1 + val-nf-2 (lint+tsc green).
2. T-2 RED baseline: create `test-no-low-contrast-pairs.test.ts` + `_low-contrast-allowlist.json: []` → run val-arch-1 → MUST FAIL with ~13 violations listed. Capture violations in `T-2-impl-log.md`.
3. T-3 sweep migration: edit 6 components + 1 utils file → re-run val-arch-1 → MUST PASS (0 violations) + val-fn-1 (vitest unit suite green) + val-arch-3 (allowlist still `[]`).
4. T-4 validators bundle: create Playwright regression specs → run val-fn-2 + val-fn-3 + val-fn-4 + val-vis-1 + val-vis-2 → MUST PASS.

Skip RED at T-2 → auditor FAIL Cat 10 (Tests/TDD).

## § Cost guardrails

- **Total LOC delta:** ~190 added (mostly arch test + Playwright specs), ~25 modified (class migrations).
- **Total tests added:** 1 vitest file + 3 Playwright specs. Net suite impact <1min.
- **Zero LLM calls** in any test (pure FE).
- **Owner eligibility:** `qwen-opencode + claude-sonnet`. R23 NOT triggered (`production_code: false` — FE design tokens, no agentic).

## § Pre-commit hook awareness

The `scripts/git-hooks/pre-commit` Section 13 (scope per branch) enforces `wip/comunify-*` branches must only touch `comunify/**` paths. This story is fully within scope.

## § Verification commands recap (also in 03-arch § 6)

```bash
WS=$(git rev-parse --show-toplevel)
cd ${WS}/comunify/frontend

# Per-ticket
npx tsc --noEmit                       # T-1
npx eslint src/ --cache                # T-1
npx vitest run src/__tests__/architecture/test-no-low-contrast-pairs.test.ts   # T-2 RED → T-3 GREEN
npx vitest run                         # T-3 full FE suite
E2E_BASE_URL=http://localhost:3003 npx playwright test e2e/regression/comunify-design-system-a11y-contrast-cement/   # T-4
```

## § References

- 01-spec.md (this story — ratified Chris 3 batches 2026-05-20)
- 03-arch.md (this story — sibling)
- 04-validators.yaml (this story — sibling)
- 06-tickets.yaml (this story — sibling)
- `comunify/docs/architecture/design-system.md` (SSoT to update)
- `comunify/frontend/src/__tests__/architecture/test-no-stock-palette.test.ts` (precedent arch fitness pattern)
- `.claude/rules/frontend-fsd.md`
- `.claude/rules/architectural-fitness.md`
- `.claude/rules/tdd-mandatory.md`
- `.claude/rules/spanish-text.md`
- `.claude/rules/anti-duplication.md`
- WCAG 2.1 SC 1.4.3 — `https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html`
- `@axe-core/playwright` — `https://www.npmjs.com/package/@axe-core/playwright`
