---
brand: comunify
date: 2026-05-17
slug: playwright-runner-parity-gap
promotable: yes                           # vitalia tiene mismo gap (fix-forward sweep candidato)
applies_to_other_brands_potentially: [vitalia, lupulo, saasora, inmoflow, retailly, fixia, guestly, fitflow]
target_core_package: null                 # no aplica package — patrón en {brand}/frontend/package.json + scripts
---

# Playwright runner parity gap vs nicolify pattern

**Qué aprendimos:** Stories de bootstrap brand (Story 11 vitalia, Story 12 comunify) shipped `playwright.config.ts` + fixtures + 5-6 specs `*.smoke.spec.ts` scaffolded — pero **olvidaron declarar `@playwright/test` en `devDependencies`**. Scripts `test:e2e:smoke` referencian `npx playwright test` que falla `playwright: not found` porque pnpm no hoistea Playwright a node_modules del brand si no está declarado localmente.

Nicolify es el único brand que tiene el setup completo:

```json
"devDependencies": {
  "@playwright/test": "^1.59.1",
  "@clerk/testing": "^2.0.8",      // sólo si fixtures usan setupClerkTestingToken
  "@axe-core/playwright": "^4.11.3" // sólo si specs usan axe-core a11y
}
```

**Origen:** `comunify-dev-stack-functional` (este merge) intentó correr Playwright smoke → `playwright: not found`. Inspección reveló vitalia tiene mismo gap.

**Why:** durante bootstrap stories, copiamos config + fixtures + specs de nicolify (template) pero asumimos que pnpm workspace hoisting cubriría Playwright runtime. NO cubre — pnpm only hoistea deps explícitamente declaradas. Las specs **compilaban** (TS check pasa porque @playwright/test está globalmente disponible en workspace) pero **no ejecutaban** (runtime resolve falla).

**How to apply:**

1. Cada brand con `playwright.config.ts` MUST declarar `@playwright/test` en su `devDependencies`. Versión pinned a la misma que nicolify (`^1.59.1` hoy, resuelve a 1.60.0 en lock) para cross-brand parity.

2. Scripts mirror nicolify pattern (4 scripts mínimo):

```json
"scripts": {
  "test:e2e": "playwright test",
  "test:e2e:smoke": "playwright test --project=smoke",
  "test:e2e:report": "playwright show-report --host 0.0.0.0",
  "test:e2e:ui": "playwright test --ui --ui-host 0.0.0.0"
}
```

3. Si fixtures usan setupClerkTestingToken → agregar `@clerk/testing` también.
4. Si specs usan axe-core para a11y → agregar `@axe-core/playwright` también.
5. Install local: `pnpm install --filter @luana/{brand}-web`.
6. Browser shared cache: `pnpm exec playwright install chromium` (cache global `~/.cache/ms-playwright/`).

**Fix-forward sweep candidato:** abrir `vitalia-playwright-runner-bootstrap` (state=idea) para replicar fix-15 a vitalia/frontend. Cuando lupulo bootstrap → incluir esto en su Story 13 inicial.

**Vínculos:**
- `[[named-volume-staleness-post-pyproject-bump]]` — bug 14 hermano (mismo cluster de bootstrap gaps)
- Pattern nicolify referencia: `nicolify/frontend/package.json::devDependencies` + `nicolify/frontend/playwright.config.ts`
- Merge artifact: `comunify/docs/archive/2026/stories/comunify-dev-stack-functional/07-merge.md` § bug 15
