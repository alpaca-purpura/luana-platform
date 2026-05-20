---
brand: comunify
story_id: comunify-design-system-tailwind-v4-tokens
state: reviewing
phase: HANDOFF_TO_PM_MERGE
last_artifact: CHECKPOINTS.md
gherkin_matrix: 06-audit/gherkin-matrix.md
auditor_verdict: APPROVED
next_action: "/pm-comunify aplica merge → 07-merge.md 5 secciones → update capabilities/* + modules MD → archive story → state=reviewing→done"
state_transition_log:
  - { from: idea, to: ready, at: 2026-05-18, by: /pm-comunify, reason: "Chris ratificó Opción A explícitamente. Per hotfix-repro-mandatory.md repro_verified=true permite skip /po-ux + /architect. Ready package compactado escrito (01-spec + 04-validators + 05-guidelines + 06-tickets)." }
  - { from: ready, to: developing, at: 2026-05-18, by: /dev-team, reason: "T-1 pickup. Owner: builder-frontend Sonnet (R23 FE no-agentic + production_code=true). Story-closure gate Layer 2 GREEN (0 other comunify stories open)." }
  - { from: developing, to: developed, at: 2026-05-18, by: /dev-team, reason: "T-1 GREEN all 6 validators (val-be-1 + val-fe-1 + val-fe-2 + val-fe-3 + val-arch-1 + val-typecheck-1). Scope expansion documented: added postcss.config.mjs + @tailwindcss/postcss devDep (root cause Tailwind v4 never wired through PostCSS in comunify — deeper than initial repro). Cross-brand promotable: vitalia has same gap." }
  - { from: developed, to: reviewing, at: 2026-05-18, by: /auditor, reason: "Auto-handoff pickup. Surface frontend → auditor-frontend Opus. Phase D gherkin matrix + CHECKPOINTS C1-C5." }
created: 2026-05-18
last_updated: 2026-05-18
parallel_safe: true
owner: /pm-comunify
next_handoff: /dev-team
surface: [frontend, design-system]
estimated_size: S
estimated_minutes: 30
origin: spawned by /pm-comunify autonomous run 2026-05-18 — validators deferred audit revealed silent ship of design-system cement merge db8a155
hotfix: true
repro_verified: true
chris_ratified_option: A  # @theme block native v4
ready_package_complete: true
ready_package_files:
  - 01-spec.md            # Gherkin SC-01..07 + test correction diffs
  - 04-validators.yaml    # 6 validators (1 BE + 4 FE + 1 arch + 1 typecheck)
  - 05-guidelines.md      # files in/out of scope + @theme template + skills/rules to load
  - 06-tickets.yaml       # T-1 single ticket, handoff_notes para builder
repro_evidence:
  brand: comunify
  command: "cd ${WS}/comunify/frontend && E2E_BASE_URL=http://localhost:3003 npx playwright test --project=smoke e2e/specs/smoke/design-system.smoke.spec.ts --reporter=list"
  output: |
    3 failed
      design-system.smoke.spec.ts:27 › font CSS variables are present on <html>
        Expected pattern: /--font-satoshi/
        Received string:  "plus_jakarta_sans_b1ca11ca-module__AdoW4q__variable manrope_6254a1c2-module__Oa-ihW__variable inter_29f246d4-module__8Y_Bfa__variable"
      design-system.smoke.spec.ts:46 › body background is comunify-bg + text is comunify-text
        Expected pattern: /rgb\(\s*248,\s*250,\s*252\s*\)/
        Received string:  "rgba(0, 0, 0, 0)"
      design-system.smoke.spec.ts:67 › sign-in page (chrome elements) inherits comunify tokens
        Expected pattern: /rgb\(\s*248,\s*250,\s*252\s*\)/
        Received string:  "rgba(0, 0, 0, 0)"
  diagnosis_validates_handoff: true
  diagnosis: |
    Tailwind v4 ignores legacy `tailwind.config.ts::theme.extend.colors` mappings. Cement story T-1 added
    `comunify-*` color tokens via legacy config but `comunify/frontend/tailwind.config.ts` is NOT being
    consumed by Tailwind v4 (`@import "tailwindcss"` in globals.css triggers v4 CSS-first mode).

    Served CSS bundle `/_next/static/chunks/[root-of-the-server]__0nvdkmw._.css` (467 lines):
    - HAS `:root { --comunify-* }` vars (from globals.css)
    - HAS font module `--font-satoshi/manrope/inter` definitions
    - LACKS any `.bg-comunify-*` / `.text-comunify-*` utility class rules → utilities never generated

    Body element renders `<body class="min-h-screen bg-comunify-bg font-inter text-comunify-text antialiased">`
    but `bg-comunify-bg` has zero CSS rule attached → `getComputedStyle(body).backgroundColor` = `rgba(0,0,0,0)`.

    Tailwind v4 token registration requires EITHER:
      (a) `@theme { --color-comunify-bg: hsl(...); ... }` block in globals.css (v4 native), OR
      (b) `@config "../../tailwind.config.ts";` directive at top of globals.css (v4 legacy bridge)

    Neither is currently present.
---

# Comunify — Design System Tailwind v4 token activation (hot-fix)

## Spark

Validators `visual_smoke_design_system` + `visual_smoke_regression` quedaron deferred a Chris post-merge de
`comunify-design-system-cement` (2026-05-18, db8a155). Pre-text del defer fue "worktree mount mismatch".

`/pm-comunify` ejecutó verificación autónoma 2026-05-18 ~07:30 UTC contra stack live (containers `luana-dev-comunify_*_dev`
up 23h, mount `principal/comunify/frontend → /app/comunify/frontend`). Sync wip/comunify = origin/main (0/0).

3 tests de `design-system.smoke.spec.ts` fallaron. Inspección del CSS bundle servido reveló que ninguna
utility class `.bg-comunify-*` se genera — solo las `:root` vars + font modules. Cement shipped silently
con design system **NO funcional a nivel runtime**.

Auditor APPROVED merge porque:
- 38/38 vitest GREEN (vitest cubre componentes/lógica, NO CSS final output)
- 0 stock palette violations (codebase grep clean)
- Arch fitness allowlist `[]` clean
- Validators visual_smoke quedaron deferred (gap escapatoria)

Caso ejemplar de **gap test coverage (vitest unit ≠ E2E visual smoke)** que merece process learning post-fix.

## Why now

- Design system shipped a producción ya no aplica visualmente (cierta confianza shipping rota — riesgo
  baja de futuras stories que asumen tokens funcionales)
- Fix quirúrgico (1 archivo `globals.css`, ~10 líneas `@theme` block O `@config` directive)
- Bloquea `comunify-warning-token-contrast-fix` (esa story asume `bg-comunify-warning` aplica)
- Reproducible 100% verificado (3 tests Playwright fallan con evidencia exacta)

## Acceptance (Gherkin draft, /po-ux puede ratificar o skip-direct-to-dev)

```gherkin
Feature: Tailwind v4 utility classes activate for comunify-* tokens

  Scenario: body bg-comunify-bg utility applies at runtime
    Given the comunify frontend dev stack is running on port 3003
    When I GET /sign-in
    Then the served CSS bundle contains a CSS rule for `.bg-comunify-bg`
    And `getComputedStyle(document.body).backgroundColor` equals "rgb(248, 250, 252)"

  Scenario: font CSS variables are accessible from :root
    Given the comunify frontend dev stack is running on port 3003
    When I GET /sign-in and evaluate `getComputedStyle(document.documentElement).getPropertyValue('--font-satoshi')`
    Then the returned value is non-empty and contains "Plus Jakarta Sans"

  Scenario: all design-system smoke tests pass
    Given the comunify frontend dev stack is running on port 3003
    When I run `npx playwright test --project=smoke e2e/specs/smoke/design-system.smoke.spec.ts`
    Then 3/3 tests pass
```

## Scope hint (probable, dev decide entre A/B)

### Opción A (recomendada) — `@theme` block native v4

Agregar block `@theme { ... }` en `globals.css` ANTES del `:root` block, mapeando cada CSS var a `--color-*`
namespace que Tailwind v4 genera utilities desde:

```css
@import "tailwindcss";

@theme {
  --color-comunify-primary: hsl(264 92% 58%);
  --color-comunify-bg: hsl(210 40% 98%);
  --color-comunify-text: hsl(226 49% 9%);
  /* ... 16 tokens total ... */
  --font-satoshi: var(--font-satoshi);  /* re-export font module vars */
  --font-manrope: var(--font-manrope);
  --font-inter: var(--font-inter);
}

:root {
  /* mantener para retro-compat con consumers que leen --comunify-* directamente */
  --comunify-primary: 264 92% 58%;
  ...
}
```

Pros: Native v4, fast lookup, no legacy config indirection. Cons: duplicar definitions (raw HSL + `--color-*`).

### Opción B — `@config` directive bridge

Agregar `@config "../../tailwind.config.ts";` al top de `globals.css`:

```css
@import "tailwindcss";
@config "../../tailwind.config.ts";

:root { ... }
```

Tailwind v4 lee legacy `tailwind.config.ts::theme.extend.colors` como antes.

Pros: 1-line fix, conserva existente tailwind.config.ts. Cons: Path indirection (v4 docs recomienda
deprecar legacy config para nuevos proyectos).

### Opción C — eliminar tailwind.config.ts, full v4 native

Migrar todos los tokens a `@theme` y borrar `tailwind.config.ts` entero. Más grande scope (cambio de
contrato build), no hot-fix.

## Out of scope

- Migración Tailwind v3 → v4 broader (ya estamos en v4.1.0, OK)
- Lift de pattern Tailwind v4 a `_pm-brand-template/` (candidato cross-brand — verificar vitalia +
  nicolify también, posible same gap)
- Re-correr `comunify-design-system-cement` audit C1-C5 con esta cement re-shipped (separate)

## Test plan post-fix

1. `docker exec luana-dev-comunify_frontend_dev-1 rm -rf .next` + restart container (CSS bundle cache)
2. `curl http://127.0.0.1:3003/_next/static/chunks/[hash].css | grep '\.bg-comunify-bg'` → debe existir
3. `npx playwright test --project=smoke e2e/specs/smoke/design-system.smoke.spec.ts` → 3/3 PASS
4. Visual spot-check `/sign-in` con DevTools → body bg debe ser `rgb(248,250,252)` no transparent
5. Cross-page sample: `/onboarding`, `/dashboard`, `/community` con `bg-comunify-bg` aplicado

## Promotable learnings (candidates)

1. **Gap vitest vs e2e visual:** vitest unit GREEN no garantiza CSS output runtime. Auditor checklist
   debe escalar visual_smoke deferred a BLOQUEANTE (no defer Chris para validators visuales
   pertinentes a la propia story).
2. **Tailwind v4 migration trap:** legacy `tailwind.config.ts::theme.extend.colors` silenciosamente
   ignorado en v4 sin warning explícito. Lift a `_pm-brand-template/` rule: cualquier brand en Tailwind
   v4 debe usar `@theme` o `@config` directive — verificar paridad vitalia/nicolify.

## Referencias

- `comunify/docs/product/stories/comunify-design-system-cement/CHECKPOINTS.md` (story origen, archived)
- `comunify/docs/archive/2026/stories/comunify-design-system-cement/07-merge.md` (deferred validators)
- `comunify/frontend/src/app/globals.css` (1 archivo a editar)
- `comunify/frontend/tailwind.config.ts` (legacy config no consumido — Opción A/C borra eventualmente)
- `comunify/frontend/e2e/specs/smoke/design-system.smoke.spec.ts` (RED → debe ir GREEN)
- `.claude/rules/hotfix-repro-mandatory.md` (R26 — `repro_verified: true` cumplido arriba)
- Tailwind v4 docs: https://tailwindcss.com/docs/theme (canonical @theme directive)

## Next action

Chris dice "refinemos comunify-design-system-tailwind-v4-tokens" + ratifica Opción A o B → si scope
queda como hot-fix S quirúrgico (1 archivo, ≤1h), `/pm-comunify` puede transition state directo a
`refined` saltando `/po-ux` + `/architect` (per hotfix-repro-mandatory.md § 4 — repro_verified
permite spawn directo `/dev-team`).
