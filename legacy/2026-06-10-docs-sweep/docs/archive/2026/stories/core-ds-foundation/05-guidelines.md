# 05-guidelines — core-ds-foundation

> Build guidance for `builder-frontend`. Surface = FE only (`@luana/{design-tokens, ui-kit}` + `@luana/eslint-config` + vitalia pilot). NO backend, NO agentic. Sonnet eligible (all non-agentic FE).

## must_load_skills (per builder)

- `frontend-expert` — FSD-Lite, component construction, lift import rewiring, live-verify.
- `playwright-expert` — ONLY for T-9 (/showcase live-verify smoke).
- (read as docs, not skills) `docs/architecture/luana-platform/design-system-canon.md` — **the contract + code examples §6**. Build EXACTLY these.
- `.claude/rules/frontend-visual-fidelity.md` (§ Design System Canon) — D1 mechanical, this story builds the gates.
- `.claude/rules/frontend-fsd.md` — boundaries (vitalia pilot).
- `.claude/rules/frontend-quality.md` — tsc/eslint/vitest gates.
- `.claude/rules/tdd-mandatory.md` — RED before GREEN per component; arch-test RED before the gate.
- `.claude/rules/anti-duplication.md` — lifts via IMPORT-and-generalize, resolve the cross-brand mirror to `@luana/ui-kit`.
- `.claude/rules/spanish-text.md` — neutro LatAm for all UI strings + /showcase labels.

## must_load_artifacts

- `03-arch.md` (consolidated contract) + `03-arch-fe.md` (CONN + canon adherence + prior-art).
- `04-validators.yaml` (test plan + ratchet policy).
- `design-system-canon.md` §2 (contracts) + §6 (code examples — the implementation contract).
- `design-system-inventory-best-of-best.md` (the lift map with `file:line`).
- `checkpoint.md` (scope · already_done · build_inventory · D1-D11).

## Files IN scope (builder may edit)

```
core/@luana/design-tokens/src/{spacing,radius,typography,color-names}.ts + index.ts + package.json
core/@luana/ui-kit/src/{EntityWorkspaceLayout,EntitySubNavBar,EntityPicker,EntityInfoCard,Group,FloatingAutosaveIndicator}.tsx
core/@luana/ui-kit/src/layout/*.tsx + archetypes/*.tsx + index.ts + __tests__/*
core/@luana/ui-kit/package.json   (add @tanstack/react-virtual dep for EntityPicker windowing)
core/@luana/hooks/src/useAutosave.ts + __tests__   (EXTEND: coalesce + flush, back-compat)
core/@luana/eslint-config/**       (NEW package: no-arbitrary rule + RuleTester tests)
vitalia/frontend/package.json      (add @luana/ui-kit + @luana/design-tokens + @luana/eslint-config workspace deps)
vitalia/frontend/src/app/globals.css      (R-1SRC)
vitalia/frontend/eslint.config.mjs        (wire no-arbitrary + baseline allowlist)
vitalia/frontend/src/app/showcase/**      (route)
vitalia/frontend/src/__tests__/architecture/{test-ds-tokens-lock,test-ds-tokens-lock-ratchet,test-ds-single-token-source,test-no-native-select,test-no-div-layout}.test.ts + baseline files
vitalia/frontend/e2e/specs/smoke/showcase.smoke.spec.ts
```

## forbidden_to_touch (HARD)

- ❌ `nicolify/frontend/src/**`, `comunify/frontend/src/**` (lint UNCHANGED — opt-in, RN-3/AC-5). You may READ them as lift sources but NEVER edit.
- ❌ `core/luana-core-*/src/luana_core_*/**` (Python engine — out of scope; different from `@luana/*` TS packages).
- ❌ Any other brand's globals.css / eslint.config / arch-tests.
- ❌ The lifted per-brand originals (`vitalia .../StaffCard.tsx`, `nicolify .../EntityWorkspaceLayout.tsx`, etc.) — leave them in place; Fase 3 rewires consumers. Do NOT delete or modify the brand-local sources in this story.

## Patterns REQUIRED

1. **Lifts via IMPORT-and-generalize**, not from-scratch. Copy the best version, rewire imports:
   - `@/components/ui/skeleton` → `./skeleton` (ui-kit local).
   - `@/lib/utils` (cn) → ui-kit `cn`.
   - nicolify `Avatar`/`DropdownMenu`/`Popover` → ui-kit equivalents.
   - Strip `// cap:` / `// story-origin:` headers; add a canon-anchored header (`// canon: design-system-canon.md §2.X · story-origin: core-ds-foundation`).
2. **CONSUME existing atoms** — `Select` = existing `select.tsx`, `tooltip.tsx`, `AutosaveBadge`, `detail-panel`, `skeleton`, `popover`, `command`, `scroll-area`, `avatar`, `card`. Verify parity, do NOT rebuild.
3. **EXTEND useAutosave** — add `coalesce` (lift vitalia `use-autosave.ts:112-139` merge logic) + `flush()`. Keep defaults back-compat (`coalesce:false`, `debounceMs:2000`). New canon consumers pass `{ coalesce:true, debounceMs:600 }`.
4. **EntityPicker is query-lib-AGNOSTIC** — takes a `searchFn` prop; ui-kit does NOT take a `@tanstack/react-query` dep. Use `@tanstack/react-virtual` (already a workspace dep) for windowing, NOT `react-virtuoso`. Debounce via `@luana/hooks::use-debounce`.
5. **Tokens = shared NAMES, per-brand VALUES.** NEVER merge color/radius palettes (RN-5). `@luana/design-tokens` exports the NAME contract + the shared spacing scale ONLY; per-brand VALUES stay in each brand theme/globals.css.
6. **R-1SRC FIRST (T-1):** consolidate to ONE `--radius` (keep `0.625rem`); `--vitalia-*` → aliases of Shadcn tokens (non-breaking for 85 consumers). TDD: single-`--radius` test RED first.
7. **Ratchets seed at CURRENT count** (no build break), shrink-only. Do NOT migrate the baselines to zero (Fase 3).
8. **TDD strict** — RED first: hook test → component test → arch-test before the gate exists.
9. **EntityWorkspaceLayout skeleton store-free (G2)** — `activeLeaf` from URL (`useParams`), NEVER from a store; the lifted nicolify version already does this — preserve it.

## Patterns FORBIDDEN

- ❌ Rebuilding `Select`/`tooltip`/`AutosaveBadge` (already in ui-kit — consume).
- ❌ A parallel autosave hook (extend `@luana/hooks::useAutosave`).
- ❌ A parallel no-hardcoded-hex arch-test (extend/verify `test_no_hardcoded_colors.test.ts`).
- ❌ Forcing `react-query`/`react-virtuoso` deps into ui-kit (EntityPicker is prop-driven + uses `@tanstack/react-virtual`).
- ❌ Merging color/radius palettes cross-brand (breaks brand identity).
- ❌ Maquetar a mano a primitive that this story builds (compose from the primitives in the /showcase).
- ❌ `<select>` nativo, arbitrary-values in locked axes, raw `<div>` of layout — in the new /showcase code (the gates you build forbid them; eat your own dog food).
- ❌ Touching nicolify/comunify src or the Python engine.

## Native-first commands

```bash
WS=$(git rev-parse --show-toplevel)
# @luana/* packages
cd ${WS}/core/@luana/ui-kit && npm run typecheck && npm run test
cd ${WS}/core/@luana/design-tokens && npm run typecheck
cd ${WS}/core/@luana/eslint-config && npm run test     # RuleTester
# vitalia pilot
cd ${WS}/vitalia/frontend && npx tsc --noEmit && npx eslint src/ --cache && npx vitest run
# /showcase live-verify (T-9)
cd ${WS}/vitalia/frontend && E2E_BASE_URL=http://localhost:3002 npx playwright test --project=smoke -g showcase
```

## Live-verify (T-9, Critical Rule #37)

The `/showcase` route is the ONE functional surface. Live-verify = open `localhost:3002/showcase` (or `dev-app.vitalialat.com/showcase`) via Chrome DevTools MCP, confirm the REAL `@luana/ui-kit` components render (atoms + primitives + entity components + archetypes), read Console (0 red errors), confirm Next overlay absent. NOT "GET 200". Record `dod_evidence` (action: rendered /showcase, observed: all sections render + console clean, no traceback). The Playwright smoke + anti-burbuja fixture is the persisted golden.
