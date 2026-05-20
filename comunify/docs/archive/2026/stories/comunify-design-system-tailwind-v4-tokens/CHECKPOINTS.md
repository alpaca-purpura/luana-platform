# Story DoD CHECKPOINTS — comunify/comunify-design-system-tailwind-v4-tokens

> Brand: comunify
> Auditor: auditor-frontend (Opus 4.7) + /auditor orchestrator (Opus 4.7)
> Date: 2026-05-18
> Verdict: **APPROVED**
> 1 ticket story (hot-fix). Synthesis derived directly from `T-1-review.md` + `06-audit/gherkin-matrix.md` + `gate-output.json` (audit-1 iter, ran_at 2026-05-18T21:41:05Z).

## C1 — Code

- [x] Tests RED → GREEN (TDD respected, evidence in `T-1-impl-log.md` iteration_log iter 0 → iter 4)
- [x] Coverage no regression (no new untested code paths — fix is config + assertion corrections)
- [x] Lint + format clean (gate-output.json: val-typecheck-1 exit 0 + val-arch-1 PASS + 0 ESLint blockers in T-1-review.md C1)
- [x] Type-check clean (`npx tsc --noEmit` exit 0)

**C1: 4/4 ✅**

## C2 — Spec compliance

- [x] Each Gherkin scenario in `01-spec.md` has GREEN test — Phase D matrix `06-audit/gherkin-matrix.md` 7/7 PASS (SC-01 .. SC-07)
- [x] Playwright E2E passes — val-fe-2 (design-system 3/3) + val-fe-3 (full smoke 8 passed)
- [x] Agentic eval N/A (no agentic surface)
- [x] Screenshots updated N/A (no visual rendering changes beyond runtime token activation — pre-fix tokens never applied; post-fix matches existing pre-cement layouts)
- [x] Voice fidelity grader N/A (no sales_agent voice scope)

**C2: 5/5 ✅** (7/7 Gherkin scenarios verified)

## C3 — Architecture

- [x] Arch fitness 0 violations (val-arch-1: 3/3 PASS, no-stock-palette ratchet allowlist `[]` clean)
- [x] DDD boundaries respected — FE only, no cross-module imports
- [x] Tenant isolation N/A (CSS pipeline change, no data access)
- [x] Anti-duplication scan — 1 WARN Cat 13 (postcss.config.mjs mirrors nicolify by Tailwind v4 convention; flagged promotable to `_pm-brand-template/` lift candidate, not blocking)
- [x] Cross-module audit — no shared/ touched. Downstream regression: vitalia has same Tailwind v4 PostCSS gap — promotable opened for separate story
- [x] `05-guidelines.md` "Files in scope" — original 2 files; final 5 (scope expansion justified in T-1-impl-log.md + T-1-review.md Note 3; root cause discovery, not scope creep)

**C3: 6/6 ✅** (1 non-blocking WARN promotable)

## C4 — Cross-cutting

- [x] Spanish neutro N/A (no user-facing string changes)
- [x] PII sanitization N/A (no response models / no traces)
- [x] Currency/master-data N/A (no monetary fields)
- [x] Migrations idempotentes N/A (no DB migrations)
- [x] Default flag flips N/A (R31 not applicable — no flag changes)
- [x] Security — no SQL injection / XSS / prompt injection vectors. Tailwind config + smoke test assertions only.

**C4: 6/6 ✅**

## C5 — Trace

- [x] `checkpoint.md` final state=reviewing (will transition to done by `/pm-comunify` at merge)
- [x] `comunify/docs/product/BACKLOG.{yaml,md}` regeneration ready (pending /pm-comunify regen post-merge)
- [x] Capability migration ready — `comunify/docs/product/capabilities/frontend_design_system/design-system-cement.yaml` exists (created in cement story) — `/pm-comunify` should append or create new capability `tailwind-v4-tokens.yaml` per `T-1-review.md § Recommendation for /pm-comunify merge`
- [x] `comunify/docs/product/modules/frontend_design_system.md` auto-list refresh ready (pending /pm-comunify regen post-merge)
- [x] `comunify/docs/learnings/` candidate — promotable=yes cross-brand pattern (Tailwind v4 PostCSS plugin wiring): vitalia has same gap + brand template should enforce. `/pm-comunify` should write learning + ping `/pm-luana`
- [x] Story folder ready for archive to `comunify/docs/archive/2026/stories/comunify-design-system-tailwind-v4-tokens/`

**C5: 6/6 ✅**

## Findings summary

- **C1: 4/4 ✅**
- **C2: 5/5 ✅** (Phase D gherkin matrix 7/7 PASS)
- **C3: 6/6 ✅** (1 non-blocking WARN: postcss.config mirror — promotable cross-brand)
- **C4: 6/6 ✅**
- **C5: 6/6 ✅**

**Total: 27/27 ✅ · 1 WARN (non-blocking, promotable) · 0 FAIL**

## Verdict

**APPROVED** — story ready for merge by `/pm-comunify`.

## Notes for `/pm-comunify` merge

### Capabilities to update

- **NEW or UPDATE:** `comunify/docs/product/capabilities/frontend_design_system/` — add Tailwind v4 utility activation. Could be:
  - Append fields to existing `design-system-cement.yaml` (postcss_wiring section), bumping `package_version` 0.2.0 → 0.2.1
  - OR create separate `tailwind-v4-tokens.yaml` capability (status: live, date_introduced: 2026-05-18)
  - `/pm-comunify` judgment call (skill loaded). Either is correct per capability inventory protocol.

### Modules MD refresh

- `comunify/docs/product/modules/frontend_design_system.md` auto-list will include the capability update.

### Learnings entry (cardinal decision — promotable)

Promotable learning candidate:

```yaml
# comunify/docs/learnings/2026-05-18-tailwind-v4-postcss-wiring-gap.md
---
brand: comunify
date: 2026-05-18
slug: tailwind-v4-postcss-wiring-gap
promotable: yes
applies_to_other_brands_potentially: [vitalia, all-future-brands]
target_core_package: _pm-brand-template (scaffold rule)
---

Cement: stories que declaran `tailwindcss ^4.x` deben ALSO declarar `@tailwindcss/postcss` devDep + `postcss.config.mjs` mirror pattern (nicolify SSoT). Sin esto, Tailwind v4 NO procesa source files — utilities (custom y stock) NUNCA se generan. Falla silenciosa porque vitest unit tests no testean CSS output runtime; solo visual smoke E2E (Playwright `getComputedStyle`) detecta.

**Why:** Story 12 cement de comunify (db8a155) shipped con utilities runtime BROKEN durante 1 día completo + visual_smoke validators deferred. Vitalia tiene MISMO gap (`tailwindcss ^4.1.0` + sin postcss). FitFlow/Retailly/etc. al bootstrap heredarán el bug si template no se actualiza.

**How to apply:**
- `_pm-brand-template/` scaffold rule: cualquier brand new bootstrap MUST include `postcss.config.mjs` (mirror nicolify) + `@tailwindcss/postcss` devDep
- Vitalia: open hot-fix story `vitalia-tailwind-v4-postcss-wiring` análoga
- Auditor checklist: cuando story toca `globals.css` o `tailwind.config.ts`, visual_smoke validator MANDATORY (no defer permitido)
```

### Promotion candidate (cross-brand pattern detected)

YES — ping `/pm-luana` with promotion proposal `docs/promotion-protocol/proposals/2026-05-18-tailwind-v4-postcss-wiring.md` once merge is done. Two layers:

1. **Template lift:** `_pm-brand-template/frontend/` should include postcss.config.mjs + @tailwindcss/postcss devDep by default.
2. **Auditor process:** visual_smoke validator on design-system story SHOULD be MANDATORY-BLOCKING, NOT deferrable. (Second silent design-system bug shipped in 2 days proves the gap is real.)

### Companion stories to open

Per `T-1-review.md § Recommendation for /pm-comunify merge`:

- **`comunify-tailwind-config-cleanup`** (state=idea) — remove legacy `comunify/frontend/tailwind.config.ts` (currently inert artifact; Tailwind v4 reads only `globals.css @theme` block). Avoids future confusion. Out of scope this hot-fix.
- **`comunify-warning-token-contrast-fix`** (already exists, state=idea) — now **UNBLOCKED** by this hot-fix. Background `bg-comunify-warning` actually applies now, so the original WCAG AA contrast issue (1.80:1) is fixable per Opción B (text-comunify-text on warning bg). `/pm-comunify` should update that checkpoint with `blocked_by` removed.

## Auto-handoff

```
→ AUTO-HANDOFF /pm-comunify merge comunify-design-system-tailwind-v4-tokens

  Per .claude/rules/story-closure-gate.md default forward-motion (no defer_audit).
  /pm-comunify writes 07-merge.md with 5 cemented sections (gherkin matrix +
  Playwright E2E run + capabilities + modules + how to verify), updates the
  capability YAML in comunify/docs/product/capabilities/frontend_design_system/,
  refreshes module MD auto-list, writes the promotable learning, opens companion
  stories, squash-merges wip/comunify → main, archives this story → state=done.
```
