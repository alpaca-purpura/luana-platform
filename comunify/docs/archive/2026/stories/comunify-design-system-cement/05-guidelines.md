---
story_id: comunify-design-system-cement
last_modified: 2026-05-18
purpose: "Patterns required / forbidden + files in scope + skills/rules to load for builder-frontend + auditor-frontend"
links:
  spec: "./01-spec.md"
  arch: "./03-arch.md"
  validators: "./04-validators.yaml"
  tickets: "./06-tickets.yaml"
---

# Guidelines — Comunify Design System Cement

> Read 03-arch.md first. This file is the **operational cheat sheet** for builder-frontend (T-1..T-5) and auditor-frontend.

## 1. Skills to load (when picking up tickets)

| Ticket | Skills (load via Skill tool) |
|---|---|
| T-1 (foundation: globals.css + layout.tsx + tailwind.config.ts) | `frontend-expert` |
| T-2 (arch fitness test + allowlist JSON + Vitest layout test) | `frontend-expert` |
| T-3a (migrate dashboard files) | `frontend-expert` |
| T-3b (migrate features/comunify/components files) | `frontend-expert` |
| T-3c (migrate auth + onboarding + public + landing files) | `frontend-expert` |
| T-3d (audit utility files) | `frontend-expert` |
| T-4 (Playwright smoke spec) | `playwright-expert` + `frontend-expert` |
| T-5 (final sanity validation pass) | `frontend-expert` |

## 2. Rules to load (auto-applied)

| Rule | Why it applies | Critical clauses for this story |
|---|---|---|
| `.claude/rules/frontend-fsd.md` | FE story | FSD-Lite + Server-First + no cross-feature imports |
| `.claude/rules/frontend-quality.md` | All FE | ESLint 0 errors, tsc strict, vitest 20% threshold |
| `.claude/rules/spanish-text.md` | Touches user-facing surfaces (migrating component files) | Preserve existing copy; if voseo encountered inline → fix per glossary |
| `.claude/rules/anti-duplication.md` | Multi-file changes + cross-brand awareness | NO token duplication: globals.css = SSoT runtime, tailwind.config.ts = utility layer, design-system.md = SSoT design. Three coherent layers, not duplication |
| `.claude/rules/tdd-mandatory.md` | All tickets | T-2 RED before T-3 migration. Layout test RED before T-1 foundation lands |
| `.claude/rules/e2e-testing.md` | T-4 only | NATIVE Playwright execution mandatory (NEVER `make e2e*`) |
| `.claude/rules/git-safety.md` | Every commit | Stage by exact name, NO `git add .`, conventional commits, NO force push |

## 3. Brand overlay applicability (CRITICAL — auditor read this)

**`comunify/.claude/rules/creator-funnels.md` is EXPLICITLY NOT TRIGGERED for this story.**

### Rationale (per 03-arch.md § 11 D6)

This story touches the FE design system surface:
- `comunify/frontend/src/app/globals.css` (CREATE)
- `comunify/frontend/src/app/layout.tsx` (MODIFY)
- `comunify/frontend/tailwind.config.ts` (MODIFY)
- 23 component/page files (color migration only — no logic change)
- Arch fitness test + Playwright smoke (NEW)

It does NOT touch any of the surfaces gated by `creator-funnels.md`:
- ❌ `comunify/backend/src/modules/comunify/community/` (cohort dual-filter scope)
- ❌ `comunify/backend/src/modules/comunify/cohort/` (state machine scope)
- ❌ `comunify/backend/src/modules/comunify/vault/` (attribution + consent scope)
- ❌ `comunify/backend/src/modules/comunify/voice_profile/` (consent + fallback scope)
- ❌ `comunify/backend/src/modules/comunify/funnel/` (ladder integrity scope)

### Auditor: DO NOT flag missing tests

The 7 mandatory tests listed in `creator-funnels.md § "Tests requeridos"` (RBAC by role, tenant+cohort dual filter, attribution preservation, ladder integrity, cohort state machine, voice fallback, voice consent enforcement) apply ONLY to BE PRs touching those modules. This is an FE design-system story — those tests would be 100% noise.

### What DOES inherit from creator-funnels.md baseline

- ✅ **Spanish neutro tuteo** — preserved (story does not modify any user-facing copy).
- ✅ **Tenant isolation** — N/A (no queries, no `tenant_id` filtering in FE).
- ✅ **Anti-duplication** — applied cross-layer (globals.css ↔ tailwind.config.ts ↔ design-system.md are 3 coherent layers, not duplicates).

## 4. Required patterns (USE THESE)

### Color consumption

```tsx
// CORRECT — semantic token via Tailwind utility
<div className="bg-comunify-surface border-comunify-border text-comunify-text">
<button className="bg-comunify-primary text-comunify-primary-fg">
<button className="bg-comunify-gradient text-comunify-primary-fg">  // hero CTA
<span className="text-comunify-stable">Active</span>                  // success
<span className="text-comunify-warning">Review</span>                 // warning
<span className="text-comunify-critical">Blocked</span>               // error
```

### Opacity notation (Tailwind v4)

```tsx
// CORRECT — Tailwind v4 /N opacity works with hsl(var(--x)) colors
<div className="bg-comunify-stable/10">  // 10% opacity
<div className="bg-comunify-primary/5 hover:bg-comunify-primary/10">
<button className="hover:bg-comunify-stable/90">  // 90% on hover
```

### Font family

```tsx
// CORRECT — semantic font tokens
<h1 className="font-satoshi font-bold">Display</h1>       // Plus Jakarta fallback acceptable
<h2 className="font-manrope font-semibold">Section</h2>
<p className="font-inter">Body text</p>                    // default on body, optional explicit
```

### Border radius

```tsx
// CORRECT — uses --radius (12px) or --radius-lg (20px)
<button className="rounded">  // var(--radius) = 0.75rem
<div className="rounded-lg">  // var(--radius-lg) = 1.25rem
<input className="rounded-[var(--radius)]">  // explicit if needed for visibility
```

### Layout structure (preserved from existing pattern)

```tsx
// In layout.tsx — body default
<body className="min-h-screen bg-comunify-bg font-inter text-comunify-text antialiased">
```

## 5. Forbidden patterns (NEVER DO)

### Stock Tailwind palette (arch fitness blocks)

```tsx
// FORBIDDEN — arch fitness catches and FAILS the test
<div className="bg-gray-500 text-yellow-700 border-red-400">
<button className="bg-indigo-600">
<div className="hover:bg-green-700">
```

Allowed only via documented allowlist entry (`_stock-palette-allowlist.json`) with non-empty `justification` + `owner_pr`. Auditor verifies justifications are real (not "TODO" / "tbd").

### HEX literals in src/ (arch fitness blocks)

```tsx
// FORBIDDEN
<div style={{ color: "#7B2FF7" }}>
<div className="bg-[#7B2FF7]">  // Tailwind arbitrary value
const COLOR = "#FF5F6D";  // even in const
```

Only place HEX is canonical: `src/app/globals.css` (`--comunify-gradient` literal). Auditor sees permanent allowlist; no other exceptions.

### Inline `style={{}}` for colors

```tsx
// FORBIDDEN
<div style={{ backgroundColor: "white", color: "#0B1020" }}>

// CORRECT
<div className="bg-comunify-surface text-comunify-text">
```

### Hardcoded font-family strings

```tsx
// FORBIDDEN
<h1 style={{ fontFamily: "Satoshi, sans-serif" }}>
<p className="font-['Satoshi']">

// CORRECT (uses CSS variable from next/font)
<h1 className="font-satoshi">
```

### Modifying out-of-scope files

```bash
# FORBIDDEN
# Editing comunify/backend/** — this is FE-only story
# Editing core/luana-core-** — cross-brand lift OUT OF SCOPE
# Editing vitalia/** nicolify/** lupulo/** — single-brand story
# Editing comunify/frontend/widget/** — separate workspace
# Editing existing E2E specs — must preserve as-is (only ADD design-system.smoke.spec.ts)
```

## 6. Files in scope (allowlist — builders MAY touch these)

### CREATE (new files)

```
comunify/frontend/src/app/globals.css
comunify/frontend/src/app/__tests__/layout.test.tsx
comunify/frontend/src/__tests__/architecture/test-no-stock-palette.test.ts
comunify/frontend/src/__tests__/architecture/_stock-palette-allowlist.json
comunify/frontend/e2e/specs/smoke/design-system.smoke.spec.ts
comunify/frontend/src/assets/fonts/Satoshi-Bold.woff2     # OPTIONAL — only if Chris provides binary
```

### MODIFY (existing files — extend, don't rewrite)

```
comunify/frontend/src/app/layout.tsx
comunify/frontend/tailwind.config.ts
```

### MIGRATE (color/class only, no logic change)

```
comunify/frontend/src/app/(auth)/sign-in/page.tsx
comunify/frontend/src/app/(auth)/sign-up/page.tsx
comunify/frontend/src/app/(dashboard)/brand-studio/page.tsx
comunify/frontend/src/app/(dashboard)/cohorts/[id]/broadcasts/page.tsx
comunify/frontend/src/app/(dashboard)/cohorts/[id]/roster/page.tsx
comunify/frontend/src/app/(dashboard)/cohorts/page.tsx
comunify/frontend/src/app/(dashboard)/layout.tsx
comunify/frontend/src/app/(dashboard)/offers/[id]/page.tsx
comunify/frontend/src/app/(dashboard)/offers/page.tsx
comunify/frontend/src/app/(dashboard)/page.tsx
comunify/frontend/src/app/(dashboard)/subscriptions/[id]/page.tsx
comunify/frontend/src/app/onboarding/layout.tsx
comunify/frontend/src/app/page.tsx
comunify/frontend/src/app/public/[creator-handle]/page.tsx
comunify/frontend/src/app/public/[creator-handle]/subscribe/page.tsx
comunify/frontend/src/features/comunify/components/authority-vault-editor.tsx
comunify/frontend/src/features/comunify/components/cohort-broadcast-composer.tsx
comunify/frontend/src/features/comunify/components/community-moderation-card.tsx
comunify/frontend/src/features/comunify/components/dunning-active-banner.tsx
comunify/frontend/src/features/comunify/components/ladder-visualizer.tsx
comunify/frontend/src/features/comunify/components/voice-distilled-preview.tsx
comunify/frontend/src/features/comunify/components/voice-samples-uploader.tsx
comunify/frontend/src/features/comunify/utils/format-engagement-bucket.ts
```

### DO NOT TOUCH (out-of-scope — auditor flags any change)

```
comunify/backend/**                                       # FE-only story
core/luana-core-**                                        # cross-brand lift OUT OF SCOPE
vitalia/** nicolify/** lupulo/**                          # single-brand story
comunify/frontend/widget/**                               # separate workspace
comunify/frontend/src/__tests__/scaffold.test.ts          # preserve
comunify/frontend/src/__tests__/components/smoke.test.tsx # preserve
comunify/frontend/e2e/specs/smoke/dev-stack.smoke.spec.ts # preserve
comunify/frontend/e2e/specs/smoke/cohort-create.smoke.spec.ts
comunify/frontend/e2e/specs/smoke/community-moderation.smoke.spec.ts
comunify/frontend/e2e/specs/smoke/onboarding-anabella.smoke.spec.ts
comunify/frontend/e2e/specs/smoke/subscription-create-dunning.smoke.spec.ts
comunify/frontend/e2e/specs/smoke/cross-tenant-isolation.smoke.spec.ts
comunify/frontend/playwright.config.ts                    # no project changes needed
comunify/frontend/vitest.config.ts                        # 20% threshold preserved
comunify/frontend/package.json                            # no new deps needed (Next/Tailwind/Vitest already present)
comunify/docs/architecture/design-system.md               # SSoT — DO NOT MODIFY in this story
```

## 7. Migration map (canonical — follow 1:1)

See 03-arch.md § 6 "Token migration mechanics" — the table is the source of truth. Quick reference:

| Stock | Comunify token |
|---|---|
| `text-gray-{500..900}` | `text-comunify-text` (700-900) / `text-comunify-text-muted` (400-600) |
| `bg-gray-50` | `bg-comunify-bg` |
| `bg-gray-100` | CONTEXT: `bg-comunify-bg` (page) or `bg-comunify-border/30` (divider) |
| `bg-gray-200` / `border-gray-{200,300}` | `bg-comunify-border` / `border-comunify-border` |
| `*-green-*` | `*-comunify-stable` (full: `bg-`/`text-`/`border-`/`hover:bg-X/90`) |
| `*-yellow-*` / `*-orange-*` | `*-comunify-warning` (orange consolidates to warning) |
| `*-red-*` | `*-comunify-critical` |
| `*-blue-*` | `*-comunify-blue` |
| `bg-indigo-*` | `bg-comunify-primary` |
| `bg-purple-*` / `border-purple-*` | `bg-comunify-primary/10` / `border-comunify-primary` |
| `text-white` / `text-black` | KEEP (explicit; not stock palette) |

### Opacity translation

- `bg-green-100` → `bg-comunify-stable/10` (10% opacity over surface)
- `hover:bg-green-700` → `hover:bg-comunify-stable/90` (90% — darken via opacity, NOT a separate hover color slot)
- `bg-purple-50` → `bg-comunify-primary/10`

## 8. Commit conventions

Per `.claude/rules/git-safety.md` + git-haiku-delegation.md:

### Single ticket commit shape

```
<type>(comunify-fe): <short description> — T-N

Story: comunify-design-system-cement
Ticket: T-N — <title>

<body explaining the why; reference 03-arch.md sections>

Decisions honored:
- D1 (tailwind v3-compat config) — kept theme.extend.colors per 03-arch §10
- D3 (manual migration) — file-by-file with semantic context per 03-arch §6
- D6 (brand overlay N/A) — creator-funnels.md not triggered per 05-guidelines §3

Tests:
- <list of validators passing>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

### Stage by exact name (NEVER `git add .`)

```bash
# CORRECT
git add comunify/frontend/src/app/globals.css comunify/frontend/src/app/layout.tsx comunify/frontend/tailwind.config.ts comunify/frontend/src/app/__tests__/layout.test.tsx

# FORBIDDEN
git add .
git add -A
git add comunify/frontend/
```

## 9. Quality runtime checklist (read before every commit)

From `frontend-expert` skill (`references/runtime-quality-checklist.md`):

- [ ] `useEffect` deps complete (N/A this story — no useEffect added)
- [ ] No stale closures (N/A — no state hooks added)
- [ ] Mock anti-patterns avoided (N/A — no MSW/handlers)
- [ ] Live verification gate: spawn `chrome-devtools-verify` skill OR confirm `make dev-comunify` running + `npx playwright test --project=smoke` all GREEN (T-4 only)
- [ ] Tailwind classes consumed correctly (verify in browser devtools: token resolved, not raw `hsl(undefined)`)
- [ ] No regression in `dev-stack.smoke.spec.ts` (3 tests still GREEN post all changes)

## 10. Auditor cat checklist (auditor-frontend reads this)

For each cat (C1-C5 per CHECKPOINTS.md grid):

| Cat | What to verify |
|---|---|
| C1 Code | Files in scope match § 6 allowlist. No out-of-scope edits. Migration map § 7 applied 1:1. |
| C2 Spec | All 4 Gherkin scenarios from 01-spec.md mapped to validators in 04-validators.yaml. Computed-style assertions match HSL→RGB conversions documented in 03-arch.md §8. |
| C3 Architecture | 03-arch.md decisions D1-D8 honored in implementation. globals.css matches §3 verbatim. tailwind.config.ts extends per §5 (15 slots + gradient + 3 fonts + 2 radius). |
| C4 Cross-cutting | Spanish neutro preserved (no copy changes). Tenant isolation N/A documented. Brand overlay `creator-funnels.md` NOT triggered (justified §3 above). Coverage threshold 20% maintained. |
| C5 Trace | 06-tickets.yaml T-1..T-5 fully executed. Each T-N-impl-log.md cites which decision IDs (D1-D8) were honored. Arch fitness GREEN with allowlist `[]` (or minimal documented). All 4 scenarios mapped → at least 1 GREEN validator each. |

## 11. Tech-debt logged (for `/pm-comunify` BACKLOG insertion post-merge)

1. **comunify-design-system-satoshi-binary** — once Chris provides `Satoshi-Bold.woff2` binary, swap `next/font/google Plus_Jakarta_Sans` (Path B) for `next/font/local` (Path A). 1-file change in `layout.tsx`. Tests: re-run layout.test.tsx (font var still present) + visual regression future.
2. **comunify-tailwind-v4-theme-inline-migration** — when Tailwind v5 deprecates `theme.extend.colors` OR when `/pm-luana` lifts tokens cross-brand, migrate `tailwind.config.ts` → `@theme inline { --color-comunify-X: hsl(var(--comunify-X)); }` in globals.css. Mechanical refactor; arch fitness unaffected.
3. **comunify-design-system-dark-mode** — future ADR + story to add `.dark { --comunify-bg: ...; }` block in globals.css + theme toggle. Tokens are SLOTS so consumers don't change.
4. **comunify-visual-regression-baseline** — future story to add Playwright `toMatchScreenshot` baseline using `--update-snapshots` after this cement lands stable.
5. **comunify-pre-commit-stock-palette-hook** — optional future story for grep-based pre-commit hook catching stock palette BEFORE vitest run. Defense-in-depth on top of arch fitness.

## 12. Failure recovery

If a validator fails during T-N execution:

1. **Read test output verbatim** — arch fitness names the file + line + class.
2. **Fix targeted file only** — do not blanket-touch other files in T-N.
3. **Re-run failing validator** only (per iteration policy in 04-validators.yaml).
4. **If iter cap (10) reached** — set state=developing→blocked, escalate Chris with last trace. Do NOT degrade allowlist as workaround without justification.
5. **If false-positive arch fitness** (e.g., comment "use bg-gray-500 instead" triggers regex) — document in `_stock-palette-allowlist.json` with `justification: "Comment in <file>:<line> explaining migration rationale, not actual class usage"` + cite in commit.

`done -> 05-guidelines.md`
