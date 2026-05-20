# T-1 impl log — Tailwind v4 @theme block + smoke test fixes

> Hot-fix story. Single ticket scope. Owner spawned: builder-frontend (Sonnet)
> Result: scope expanded mid-implementation (postcss plugin gap discovered).
> /pm-comunify orchestrator finished work in-line after builder context exhausted.

## Plan

1. Apply `@theme` block to `comunify/frontend/src/app/globals.css` per `05-guidelines.md` canonical template.
2. Fix 2 assertion bugs in `comunify/frontend/e2e/specs/smoke/design-system.smoke.spec.ts`.
3. If HMR doesn't pick up globals.css change → restart `luana-dev-comunify_frontend_dev-1`.
4. Run validators (val-be-1 / val-fe-1 / val-fe-2 / val-fe-3 / val-arch-1 / val-typecheck-1) in order.
5. All GREEN → commit + push wip/comunify with STORY_CLOSURE_GATE_SKIP=1.
6. Write `T-1-result.md` with verbatim validator outputs + commit SHA.

## Owner assigned

- agent_type: builder-frontend
- model: sonnet
- assigned_at: 2026-05-18
- finished_by: /pm-comunify orchestrator (Opus) after builder ran out of context (126 tool uses, 931 seconds wall-clock — hit limit mid-iteration before postcss issue surfaced)
- reason R23: FE no-agentic + production_code=true → Sonnet OK

## Iteration log

### Iter 0 — Baseline RED (already verified pre-spawn)
- Ran val-fe-2 (design-system.smoke 3/3 FAIL)
- Root cause documented in checkpoint.md repro_evidence

### Iter 1 — Builder Sonnet first pass
- Applied @theme block to `globals.css` (CORRECT structure: color/font/radius/gradient tokens)
- Fixed 2 smoke test assertion bugs in `design-system.smoke.spec.ts` (line 35 + line 89)
- **BUG INTRODUCED:** replaced `@import "tailwindcss";` (v4 canonical entry) with `@tailwind base/components/utilities;` (v3 legacy directives) — Tailwind v4 didn't generate utilities
- Restarted frontend container (HMR)
- Builder context ran out before validators were run by builder

### Iter 2 — /pm-comunify orchestrator (Opus) takeover
- Verified live CSS bundle: 504 lines, contains `--color-comunify-*` :root vars (from @theme conversion) but ZERO utility class rules (`.bg-comunify-bg` etc. missing)
- Reverted `@tailwind ...` directives → `@import "tailwindcss";` in canónico globals.css
- Restarted container — STILL no utilities generated
- Investigated postcss config: NO `postcss.config.*` file existed AND no `@tailwindcss/postcss` plugin in package.json devDeps
- Compared to nicolify/vitalia: nicolify has `postcss.config.mjs` + `@tailwindcss/postcss` dep — pattern parity needed
- ROOT CAUSE confirmed: Tailwind v4.1.0 NEEDS `@tailwindcss/postcss` PostCSS plugin to process source files. Without it, NO utilities generate (not just custom — basic `.min-h-screen` etc. also absent)

### Iter 3 — Postcss plugin install
- Created `comunify/frontend/postcss.config.mjs` mirroring nicolify pattern:
  ```js
  const config = { plugins: { "@tailwindcss/postcss": {} } };
  export default config;
  ```
- Added `"@tailwindcss/postcss": "^4.1.0"` to `comunify/frontend/package.json` devDeps
- Synced files canónico → principal (`/home/chalreme/Proyectos/luana-platform/`) because docker bind mount points to principal
- `docker exec -w /app/comunify/frontend luana-dev-comunify_frontend_dev-1 pnpm install` — 10 packages added (including @tailwindcss/postcss + transitive deps)
- Initial container restart errored: "Cannot find module '@tailwindcss/postcss'" — Turbopack cache stale
- Cleared `/app/comunify/frontend/.next` cache + restarted container → SUCCESS
- Host install: `cd luana-comunify && pnpm install --filter "@luana/comunify-web"` to satisfy vitest postcss loading

### Iter 4 — Validators GREEN
- val-be-1 (BE /health): `{"status":"ok","brand":"comunify","version":"0.1.0"}` ✓
- val-fe-1 (CSS bundle .bg-comunify-bg grep): PASS — utility rule `.bg-comunify-bg { background-color: var(--color-comunify-bg); }` generated
- val-fe-2 (Playwright design-system 3/3): **3 passed (1.3s)** ✓
- val-fe-3 (Playwright full smoke): **8 passed** (baseline 5 + design-system 3 unlocked). 18 Clerk env failures pre-existing, no new regressions.
- val-arch-1 (vitest no-stock-palette): 3/3 PASS — ratchet still clean
- val-typecheck-1 (`tsc --noEmit`): 0 errors

## CSS bundle proof

CSS bundle line count: 467 (pre-fix) → 504 (after wrong @tailwind directives + @theme only) → **1673 (after postcss plugin installed)**.

Rules now generated (sample):
```
.min-h-screen { min-height: 100vh; }
.bg-comunify-bg { background-color: var(--color-comunify-bg); }
.text-comunify-text { color: var(--color-comunify-text); }
.text-comunify-text-muted { color: var(--color-comunify-text-muted); }
.font-inter { font-family: var(--font-inter); }
.antialiased { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
```

## Files modified (canónico)

1. `comunify/frontend/src/app/globals.css` — @theme block inserted, @import "tailwindcss" preserved
2. `comunify/frontend/e2e/specs/smoke/design-system.smoke.spec.ts` — 2 assertion fixes (`getPropertyValue` for fonts, `includes("comunify-")` for class probe)
3. `comunify/frontend/postcss.config.mjs` — NEW — `@tailwindcss/postcss` plugin config (mirrors nicolify pattern)
4. `comunify/frontend/package.json` — added `"@tailwindcss/postcss": "^4.1.0"` to devDependencies
5. `pnpm-lock.yaml` — auto-updated from pnpm install (workspace lock)

Files in scope expansion vs 05-guidelines.md: postcss.config.mjs + package.json + pnpm-lock.yaml were NOT originally listed. Root cause of scope expansion was the postcss plugin gap discovered during validation — not in original repro_evidence. Cross-brand learning candidate: vitalia has same gap (lacks postcss.config + @tailwindcss/postcss dep). Promotable to /pm-luana.

## Scope expansion justification

Per `.claude/rules/hotfix-repro-mandatory.md`, repro_evidence was based on observed Playwright failures + CSS bundle inspection. The original diagnosis pointed to `tailwind.config.ts::theme.extend.colors` being silently ignored — TRUE, but the deeper cause was that Tailwind v4 had NEVER been wired correctly (no PostCSS plugin). Adding @theme block was necessary but insufficient — needed the plugin to make Tailwind actually run.

Decision: continue with expanded scope rather than escalate, because:
- Scope still small (3 files added vs 2 original)
- All in scope of frontend/design-system surface (no cross-cutting)
- repro_verified holds (we have the green validators as evidence the fix works)
- Discovery is cross-brand promotable (vitalia has same gap — to be opened as separate story)

## Result

T-1 state: tests-passing → pushed (commit SHA pending — orchestrator commits below)
Story state: developing → developed (after commit + push)
Next: AUTO-HANDOFF /auditor per story-closure-gate.md.

## Closing note

This is the SECOND silent design-system Tailwind v4 bug shipped — once in Story 12 (cement story missing @theme entirely), once in this hot-fix (builder agent introduced @tailwind directives regression). Process learning candidate: visual_smoke validators should be MANDATORY-BLOCKING for any story touching globals.css or design system, never deferrable.
