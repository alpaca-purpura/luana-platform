# Merge artifact — comunify/comunify-design-system-tailwind-v4-tokens

> Brand: comunify
> Merged: 2026-05-20
> Commit (build-phase SHA): 58c6f76 (`fix(comunify/frontend): activate Tailwind v4 utilities — install @tailwindcss/postcss + @theme block + fix smoke assertions`)
> Closure commit (this artifact): TBD (set by /pm-comunify at merge step)
> Story state transition: `reviewing → done`
> Owner: `/pm-comunify`

> Hot-fix de cementado design-system. Story `comunify-design-system-cement` shipped Tailwind v4 tokens en globals.css `@theme` block + 23 archivos migrados, pero las utilidades `.bg-comunify-*` / `.text-comunify-*` nunca se generaban en el bundle CSS (CSS bundle 467 líneas con solo `:root` vars, ZERO utility classes). Esta story descubrió root cause: comunify nunca tuvo `postcss.config.*` ni `@tailwindcss/postcss` devDep — Tailwind v4 requiere el plugin PostCSS para emitir utilities.

## § 1 — Gherkin verification matrix

> Copia verbatim de `06-audit/gherkin-matrix.md` (Phase D auditor).

| Scenario (Gherkin) | Test path | Status |
|---|---|---|
| SC-01 body `bg-comunify-bg` utility applies at runtime — `getComputedStyle(body).backgroundColor` matches `/rgb\(\s*248,\s*250,\s*252\s*\)/` | `comunify/frontend/e2e/specs/smoke/design-system.smoke.spec.ts::body background is comunify-bg + text is comunify-text (computed style)` (l. 54) | ✅ PASS |
| SC-02 body `text-comunify-text` utility applies — `getComputedStyle(body).color` matches `/rgb\(\s*1[0-5],\s*1[5-9],\s*3[0-5]\s*\)/` | mismo spec/test l. 54 | ✅ PASS |
| SC-03 font CSS variables accessible from `:root` — `getPropertyValue('--font-satoshi')` non-empty + contains "Plus Jakarta Sans" | `comunify/.../design-system.smoke.spec.ts::font CSS variables are present on <html>` (l. 27) | ✅ PASS |
| SC-04 body font-family resolves to Inter (negative) | mismo test SC-03 l. 48-51 | ✅ PASS |
| SC-05 CSS bundle contains generated utility rules (edge: build verification) — bundle contains literal `.bg-comunify-bg` + `.text-comunify-text` + `.font-inter` | val-fe-1 (curl + grep CSS bundle direct assertion) | ✅ PASS |
| SC-06 design-system smoke test suite passes (cumulative) — 3/3 PASS | val-fe-2 (`npx playwright design-system.smoke.spec.ts`) | ✅ PASS |
| SC-07 no regression in other passing smoke tests (adversarial) — full suite ≥8 passing | val-fe-3 (`full smoke project`) — 8 passed (3.1s) | ✅ PASS |

**Aggregate: 7/7 PASS · 0 FAIL · 0 NO_COVERAGE.**

CHECKPOINTS C1-C5: 27/27 ✅ · 1 WARN no-blocking (postcss.config mirror nicolify — promotable cross-brand vía `_pm-brand-template/`).

## § 2 — Playwright E2E run

> Última corrida E2E targeted post-fix. Comando + output verdict.

```bash
cd ${WS}/comunify/frontend && E2E_BASE_URL=http://localhost:3003 npx playwright test --project=smoke e2e/specs/smoke/design-system.smoke.spec.ts
```

```
Running 3 tests using 3 workers

  ✓  1 [smoke] › design-system.smoke.spec.ts:75:7 › sign-in page (chrome elements) inherits comunify tokens — no stock gray fallback (600ms)
  ✓  2 [smoke] › design-system.smoke.spec.ts:27:7 › font CSS variables are present on <html> (801ms)
  ✓  3 [smoke] › design-system.smoke.spec.ts:54:7 › body background is comunify-bg + text is comunify-text (computed style) (803ms)

  3 passed (1.3s)
```

Full smoke regression (val-fe-3): `8 passed (2.9s)` — baseline 5 + design-system 3 unlocked. 18 Clerk-env-blocked tests pre-existing (Story 12 deferral, out of scope per `01-spec.md`).

- Specs run: 3 (design-system targeted) + 5 (baseline regression)
- Passed: 3 + 5 = 8
- Failed: 0 in scope
- Pre-existing failures (excluded): 18 (Clerk env Story 12 — separate)

## § 3 — Capabilities updated/created

> Inventory enforcement (R32). Paths exactos.

- `comunify/docs/product/capabilities/frontend_design_system/tailwind-v4-tokens.yaml` — **NEW** (status: live, date_introduced: 2026-05-18, story_introduced: comunify-design-system-tailwind-v4-tokens, package_version: 0.2.1)
- `comunify/docs/product/capabilities/frontend_design_system/design-system-cement.yaml` — **UNCHANGED** (status: live remains, package_version: 0.2.0 — cement deliverable independiente; tokens-activation es hotfix complementario)

## § 4 — Modules MD refreshed

> Auto-list marker regenera.

- `comunify/docs/product/modules/frontend_design_system.md` — **NEW** module MD (no existía; cement merge no creó porque inventory enforcement R32 se cementó después). Auto-list ahora lista 2 capabilities: `design-system-cement` (live) + `tailwind-v4-tokens` (live · 2026-05-18).

## § 5 — How to verify (reproducible commands)

```bash
# Setup: stack comunify levantado vía `make dev-comunify` (host port 3003).
WS=$(git rev-parse --show-toplevel)

# 1. CSS bundle contains generated utilities (val-fe-1 SC-05)
CSS_URL=$(curl -sS http://127.0.0.1:3003/sign-in | grep -oE '/_next/static/chunks/[^"]+\.css' | head -1)
curl -sS "http://127.0.0.1:3003${CSS_URL}" | grep -E '\.(bg|text|font)-comunify-' | head -10
# Expected: lines containing `.bg-comunify-bg {`, `.text-comunify-text {`, `.font-inter {`, etc.

# 2. Playwright design-system smoke (val-fe-2 SC-01..04, SC-06)
cd ${WS}/comunify/frontend && E2E_BASE_URL=http://localhost:3003 npx playwright test --project=smoke e2e/specs/smoke/design-system.smoke.spec.ts
# Expected: 3 passed

# 3. Full smoke regression (val-fe-3 SC-07)
cd ${WS}/comunify/frontend && E2E_BASE_URL=http://localhost:3003 npx playwright test --project=smoke
# Expected: ≥8 passed (baseline 5 + design-system 3)

# 4. Architecture fitness (val-arch-1)
cd ${WS}/comunify/frontend && npx vitest run src/__tests__/architecture/test-no-stock-palette.test.ts
# Expected: 3 passed, allowlist `[]` clean

# 5. Type-check (val-typecheck-1)
cd ${WS}/comunify/frontend && npx tsc --noEmit
# Expected: exit code 0

# 6. Backend health (val-be-1)
curl -sS http://127.0.0.1:8003/health
# Expected: {"status":"ok","brand":"comunify","version":"0.1.0"}
```

**Expected:** todos retornan exit code 0 con output indicado.

## Notes — Decisiones cardinales

1. **Capability split vs append:** se eligió crear `tailwind-v4-tokens.yaml` separada en lugar de bump `design-system-cement.yaml` 0.2.0 → 0.2.1 con sección postcss_wiring. Razón: dos stories distintas con audit independiente, traceability más clara, archive snapshot per-story limpio. Auditor CHECKPOINTS § C5 explicita que "either is correct" — judgment de `/pm-comunify`.

2. **Scope expansion ratificada:** ticket original `files_in_scope: 2` → final `5 files` (added `postcss.config.mjs` + `package.json` + `pnpm-lock.yaml`). Root cause Tailwind v4 PostCSS plugin wiring nunca existió en comunify (no scope creep). Documentado en `T-1-impl-log.md § Scope expansion justification` + auditor C3 PASS.

3. **Cross-brand promotable identified:** vitalia tiene **mismo gap** (`tailwindcss ^4.1.0` declared sin `postcss.config.*` ni `@tailwindcss/postcss` plugin dep). Vitalia frontend probablemente sirve CSS bundle sin utilities también (no verificado live — fuera de scope esta story). Promotable=yes documentado en learning + ping `/pm-luana` para coordinar fix vitalia + cement en `_pm-brand-template/`.

4. **STORY_CLOSURE_GATE_SKIP=1 usado en commits previos (sesión Clerk+tunnel 2026-05-20):** durante el setup Clerk+Cloudflare tunnel hot-path (commits `ab54ff9`, `2773c30`, `cb5fcf9`) se usó override emergencia porque esta story (`tailwind-v4-tokens`) llevaba 2 días en `reviewing+APPROVED` sin cierre formal. Ratificado por Chris. Este merge artifact cierra el gate retroactivamente.

5. **No engine changes:** story es 100% brand-extension (`comunify/frontend/`). No tocó `core/luana-core-*/`. Promotable cross-brand → `_pm-brand-template/` scaffold (no engine package todavía).
