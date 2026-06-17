# 01-spec — Comunify Design System Tailwind v4 token activation

> **Hot-fix story.** Spec compactada porque `repro_verified: true` + Chris ratificó
> Opción A explícitamente. Per `.claude/rules/hotfix-repro-mandatory.md` § Step 4
> permite spawn directo `/dev-team` saltando /po-ux + /architect formales.

## Contexto (heredado de checkpoint.md)

Cement story `comunify-design-system-cement` (mergeada commit `db8a155`) cargó tokens
brand vía `tailwind.config.ts::theme.extend.colors`. Tailwind v4.1.0 ignora silenciosamente
ese legacy config — utility classes `.bg-comunify-*` / `.text-comunify-*` / `.font-inter`
nunca se generan en el CSS bundle (verified `/_next/static/chunks/[root-of-the-server]__0nvdkmw._.css`,
467 líneas, contiene `:root` vars + font modules pero **cero** utility rules).

Body HTML aplica `class="min-h-screen bg-comunify-bg font-inter text-comunify-text antialiased"`
pero `getComputedStyle(body).backgroundColor` = `rgba(0,0,0,0)` (transparent default).

Auditor APPROVED merge porque visual_smoke_design_system quedó deferred + vitest 38/38 GREEN
cubre componentes/lógica, NO output CSS runtime.

## Solución ratificada (Opción A — `@theme` block native v4)

Agregar `@theme { ... }` block en `comunify/frontend/src/app/globals.css` después de
`@import "tailwindcss"` y antes del `:root` block. Mapea cada token a namespace
`--color-comunify-*` (que Tailwind v4 lee como source para generar utilities
`bg-comunify-*` / `text-comunify-*` / `border-comunify-*`) y re-exporta font vars
para que `font-satoshi` / `font-manrope` / `font-inter` también generen utilities.

Conserva el `:root` block existente para retro-compat con consumers que leen
`hsl(var(--comunify-X))` directamente (si los hay) — no hay riesgo de regresión.

`tailwind.config.ts` queda como artefacto histórico (no consumido por v4 sin
`@config` directive). Se puede eliminar en story de cleanup separada (out of scope).

## Acceptance criteria (Gherkin)

```gherkin
Feature: Tailwind v4 utility classes activate at runtime for comunify-* tokens

  Background:
    Given the comunify frontend dev stack is running on port 3003
    And the backend dev stack is running on port 8003

  Scenario: SC-01 — body bg-comunify-bg utility applies at runtime (happy path)
    When I GET /sign-in via Playwright
    And I evaluate "getComputedStyle(document.body).backgroundColor"
    Then the returned value matches /rgb\(\s*248,\s*250,\s*252\s*\)/
    # rgb(248,250,252) = HSL(210,40%,98%) = --comunify-bg

  Scenario: SC-02 — body text-comunify-text utility applies (happy path)
    When I GET /sign-in via Playwright
    And I evaluate "getComputedStyle(document.body).color"
    Then the returned value matches /rgb\(\s*1[0-5],\s*1[5-9],\s*3[0-5]\s*\)/
    # rgb(~12,~17,~33) = HSL(226,49%,9%) = --comunify-text

  Scenario: SC-03 — font CSS variables accessible from :root (happy path)
    When I GET / via Playwright
    And I evaluate "getComputedStyle(document.documentElement).getPropertyValue('--font-satoshi')"
    Then the returned value is non-empty
    And the returned value contains "Plus Jakarta Sans"

  Scenario: SC-04 — body font-family resolves to Inter (negative: not stock sans-serif)
    When I GET / via Playwright
    And I evaluate "getComputedStyle(document.body).fontFamily"
    Then the returned value (case-insensitive) contains "inter"
    And the returned value does NOT exactly equal "sans-serif" or "system-ui"

  Scenario: SC-05 — CSS bundle contains generated utility rules (edge: build verification)
    When I GET the served CSS bundle from /_next/static/chunks/[hash].css
    Then the response body contains a literal substring matching ".bg-comunify-bg"
    And the response body contains a literal substring matching ".text-comunify-text"
    And the response body contains a literal substring matching ".font-inter"

  Scenario: SC-06 — design-system smoke test suite passes (cumulative)
    When I run "npx playwright test --project=smoke e2e/specs/smoke/design-system.smoke.spec.ts"
    Then 3 of 3 tests pass

  Scenario: SC-07 — no regression in other passing smoke tests (adversarial)
    When I run "npx playwright test --project=smoke" full suite
    Then dev-stack.smoke tests still pass (3/3)
    And no new test fails relative to baseline (5 passing pre-fix → ≥8 passing post-fix)
    # baseline: 5 pass / 21 fail (18 Clerk env pre-existing). Post-fix: ≥8 pass (5 + 3 design-system).
```

## Test corrections required

Dos assertions en `comunify/frontend/e2e/specs/smoke/design-system.smoke.spec.ts` están
mal redactadas y deben corregirse en T-1 además del fix CSS:

### Fix 1 — Test "font CSS variables are present on <html>" (línea 35)

**Actual (INCORRECTO):**
```ts
const htmlClassName = await page.evaluate(() => document.documentElement.className);
expect(htmlClassName).toMatch(/--font-satoshi/);  // ← htmlClassName es "plus_jakarta_sans_...variable", NO "--font-satoshi"
```

**Corregido:**
```ts
const satoshiVar = await page.evaluate(() =>
  getComputedStyle(document.documentElement).getPropertyValue('--font-satoshi').trim()
);
expect(satoshiVar).toMatch(/Plus Jakarta Sans/);
// idem para manrope/inter
```

### Fix 2 — Test "sign-in page chrome elements" hasComunifyClasses regex (línea 89)

**Actual (INCORRECTO):**
```ts
const hasComunifyClasses = await page.evaluate(() => {
  const all = Array.from(document.body.querySelectorAll("*"));
  return all.some((el) =>
    Array.from(el.classList).some((c) => c.startsWith("comunify-"))  // ← falla: clases son "bg-comunify-X" o "text-comunify-X" no "comunify-X"
  );
});
```

**Corregido:**
```ts
const hasComunifyClasses = await page.evaluate(() => {
  const all = [document.body, ...Array.from(document.body.querySelectorAll("*"))];
  return all.some((el) =>
    Array.from(el.classList).some((c) =>
      c.includes("comunify-")  // matches bg-comunify-bg, text-comunify-text, border-comunify-border, etc.
    )
  );
});
```

## Out of scope (separate stories)

- Borrar `comunify/frontend/tailwind.config.ts` (cleanup pendiente, no afecta runtime)
- Refactor `comunify/.../components/dunning-active-banner.tsx` + `community-moderation-card.tsx` warning contrast (eso es story `comunify-warning-token-contrast-fix` desbloqueada post-merge de esta hot-fix)
- Lift cross-brand del pattern `@theme` a `_pm-brand-template/` (candidate `/pm-luana` promotable)
- Verificar paridad vitalia + nicolify (probable mismo gap Tailwind v4) — promotable learning

## Referencias

- `comunify/docs/product/stories/comunify-design-system-tailwind-v4-tokens/checkpoint.md` (repro_evidence verbatim)
- `comunify/frontend/src/app/globals.css` (archivo único a editar runtime — Opción A `@theme`)
- `comunify/frontend/e2e/specs/smoke/design-system.smoke.spec.ts` (test corrections, 2 assertions)
- `comunify/frontend/tailwind.config.ts` (legacy config, NO se borra en este ticket — referencia para mapeos)
- Tailwind v4 `@theme` docs: https://tailwindcss.com/docs/theme (canonical reference)
- `.claude/rules/hotfix-repro-mandatory.md` (R26 — repro_verified=true ya cumplido)
