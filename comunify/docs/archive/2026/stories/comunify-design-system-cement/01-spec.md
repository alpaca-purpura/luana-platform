---
story_id: comunify-design-system-cement
type: ui-story
module: frontend-design-system
capability: design-system-cement
po_version: 1
last_modified: 2026-05-18
ratified_by_chris: pending  # autonomous /pm-comunify run authorized 2026-05-18; ratification implicit per Chris auth
ratified_by_pm_comunify: 2026-05-18  # autonomous mode (Chris pre-authorized full E2E)
links:
  story_checkpoint: "./checkpoint.md"
  design_system_ssot: "../../../architecture/design-system.md"
  brand_rule_overlay: "../../../../.claude/rules/creator-funnels.md"
---

# Spec — Comunify Design System Cement (FE)

## Resumen ejecutivo

Cementar la identidad visual Comunify en el FE: crear `globals.css` con 15 CSS vars del brandbook, cargar 3 fuentes (Satoshi local + Manrope/Inter Google) en `layout.tsx`, extender `tailwind.config.ts` con los 10 slots de color faltantes + gradient + fontFamily + radius, migrar ~107 ocurrencias de paleta Tailwind stock (`gray/green/yellow/red/orange/blue/purple/indigo`) en 23 archivos FE a tokens semánticos `comunify-*`, y blindar con un arch fitness test ratchet anti-stock-palette + anti-HEX-literal. Outcome: Comunify deja de verse genérico (gris Tailwind) y muestra identidad creator-economy premium consistente.

**Para quién:** creators/coaches/educadores LATAM que ven el dashboard/onboarding (impacto premium percibido + retención visual).
**Outcome esperado:** 0 violaciones arch fitness anti-stock-palette · todas las pantallas usando tokens `comunify-*` · Satoshi/Manrope/Inter visibles en H1/H2/body · Playwright smoke screenshot baseline nuevo aprobado.

## Acceptance Criteria (Gherkin AI-resistant)

### Scenario 1 — `tokens-cargados-render-correcto` (`type: happy`)

**Given:**
- `comunify/frontend/src/app/globals.css` existe con las 15 vars `--comunify-*` declaradas
- `comunify/frontend/src/app/layout.tsx` importa `./globals.css` + carga `next/font/local` Satoshi + `next/font/google` Manrope/Inter aplicando `.variable` al `<html>`
- `comunify/frontend/tailwind.config.ts` declara los 15 slots de color + `backgroundImage.comunify-gradient` + `fontFamily.{satoshi,manrope,inter}` + `borderRadius.DEFAULT`/`lg`
- Un componente migrado (ej. dashboard card) usa `bg-comunify-surface border-comunify-border text-comunify-text`

**When:**
- Usuario navega a `/dashboard` con sesión Clerk válida

**Then:**
- El `<body>` renderiza con `font-inter` (computado: `Inter, ui-sans-serif, system-ui, sans-serif`)
- El `<html>` lleva las 3 CSS vars `--font-satoshi`, `--font-manrope`, `--font-inter` definidas
- Las cards del dashboard renderizan `background-color` = `hsl(0 0% 100%)` (surface) + `border-color` = `hsl(214 32% 91%)` (border) + `color` = `hsl(226 49% 9%)` (text)
- El CTA primario gradient renderiza con `background-image` matching `linear-gradient(135deg, #7B2FF7 0%, ...)`
- 0 errores consola navegador

**Graders:**
- Playwright DOM/CSS assertion — `comunify/frontend/e2e/specs/smoke/design-system.smoke.spec.ts`
- Vitest unit — `comunify/frontend/src/app/__tests__/layout.test.tsx` (font vars applied)

---

### Scenario 2 — `stock-palette-prohibida` (`type: negative`)

**Given:**
- Arch fitness `comunify/frontend/src/__tests__/architecture/test-no-stock-palette.test.ts` existe con allowlist shrink-only inicial `[]` (clean slate, 0 violaciones esperadas tras migración)

**When:**
- Un developer agrega un componente nuevo `comunify/frontend/src/features/comunify/components/foo.tsx` con `className="bg-gray-500 text-yellow-700"`

**Then:**
- `cd comunify/frontend && npx vitest run src/__tests__/architecture/test-no-stock-palette.test.ts` exit code != 0
- El error report cita exactamente: `foo.tsx:N — bg-gray-500 (use bg-comunify-surface or bg-comunify-bg)` + `foo.tsx:N — text-yellow-700 (use text-comunify-warning)`
- Stock palette regex enforced: `\b(bg|text|border|ring|from|to|via|hover:bg|hover:text|hover:border)-(gray|green|yellow|red|blue|emerald|amber|rose|sky|violet|purple|pink|orange|teal|cyan|indigo|fuchsia)-[0-9]+\b`
- Allowlist solo via fichero `comunify/frontend/src/__tests__/architecture/_stock-palette-allowlist.json` con `{file, class, justification, owner_pr}` por entry, shrink-only enforced

**Graders:**
- Vitest arch fitness — `test-no-stock-palette.test.ts`

---

### Scenario 3 — `satoshi-fallback-grace` (`type: edge`)

**Given:**
- `comunify/frontend/src/assets/fonts/Satoshi-Bold.woff2` NO existe (asset binario aún no provisto por Chris)
- `layout.tsx` configura `next/font/local` con `fallback: ["ui-sans-serif", "system-ui", "sans-serif"]` y `adjustFontFallback: false`

**When:**
- `next build` ejecuta el linter de fuentes

**Then:**
- Si el archivo woff2 existe → build PASS, Satoshi se carga en H1 con `font-satoshi` class
- Si el archivo woff2 NO existe → build FAIL con error claro `Cannot find module ../assets/fonts/Satoshi-Bold.woff2`. Architect 03-arch.md DEBE proveer: (a) script `scripts/fetch-satoshi.sh` que descargue de Fontshare CDN si licencia permite redistribución, O (b) commit un placeholder `Satoshi-Bold.woff2` desde Plus Jakarta Sans Bold (sustituto visualmente cercano libre — Google Fonts), O (c) fallback completo a Plus Jakarta Sans via `next/font/google` con variable `--font-satoshi` mapeada a Plus Jakarta Sans Bold
- Decisión por defecto (auto-resolve): **opción (c)** — Plus Jakarta Sans Bold como `--font-satoshi` hasta que Chris provea el binario real. Documentado como tech-debt en T-N-impl-log.md.

**Graders:**
- Vitest unit — `layout.test.tsx` verifica `--font-satoshi` siempre presente (sea Satoshi real o Plus Jakarta fallback)
- Playwright visual diff tolerance — H1 con `font-satoshi` renderiza con weight 700 (verificable via computed style)

---

### Scenario 4 — `hex-literal-blocked` (`type: adversarial`)

> AI-resistant: developer hostil/distraído intenta hardcodear color violando SSoT.

**Given:**
- Arch fitness `test-no-stock-palette.test.ts` también enforce regex anti-HEX

**When:**
- Developer agrega `style={{ color: "#7B2FF7" }}` o `<div className="bg-[#7B2FF7]">` en un componente

**Then:**
- Vitest arch fitness FAILS con mensaje `foo.tsx:N — HEX literal #7B2FF7 forbidden (use text-comunify-primary)`
- Regex enforced: `#[0-9a-fA-F]{6}\b` Y `\b(bg|text|border)-\[#[0-9a-fA-F]{6}\]` (Tailwind arbitrary value HEX)
- Exception: archivos bajo `comunify/frontend/src/app/globals.css` y `comunify/docs/architecture/design-system.md` (ambos son fuentes de verdad — allowlist permanente)
- 0 HEX literales en `src/**/*.{tsx,ts}` permitido (baseline 0, ratchet shrink-only)

**Graders:**
- Vitest arch fitness — `test-no-stock-palette.test.ts` cubre ambas regex (stock palette + HEX)
- Pre-commit hook (opcional, futuro): grep pre-stage en `comunify/frontend/src/**/*.tsx`

---

## Wireframes inline (mockups ASCII)

### Onboarding step 1 — hero post-cement

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [LOGO Comunify ●]                              [salir]    │  ← bg-comunify-bg + text-comunify-text
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │   │  ← progress bar: bg-comunify-gradient
│  │  Paso 1 de 4                                        │   │     text en font-manrope text-comunify-text-muted
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│           ╔═══════════════════════════════════════╗         │
│           ║                                       ║         │
│           ║  Bienvenido, ¿cómo se llama tu       ║         │  ← H1: font-satoshi text-display
│           ║  proyecto?                            ║         │     text-comunify-text
│           ║                                       ║         │
│           ║  ┌────────────────────────────────┐  ║         │
│           ║  │ Mi proyecto de coaching...     │  ║         │  ← input: border-comunify-border bg-comunify-surface
│           ║  └────────────────────────────────┘  ║         │     rounded-[var(--radius)]
│           ║                                       ║         │
│           ║  ┌─────────────────────────┐         ║         │
│           ║  │ Continuar →             │         ║         │  ← CTA primary: bg-comunify-gradient
│           ║  └─────────────────────────┘         ║         │     text-comunify-primary-fg font-manrope
│           ║                                       ║         │     rounded-[var(--radius)]
│           ╚═══════════════════════════════════════╝         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Dashboard card — post-cement

```
┌──────────────────────────────────────────────────────┐
│  Métricas Cohort                          ↗  +12.4% │  ← bg-comunify-surface
│  ────────────────────────                            │     border border-comunify-border
│                                                      │     rounded-lg p-6
│   1,247        88%        $24.5k                    │     shadow-sm
│   Miembros    Engagement  MRR                       │
│  ────────     ────────    ────────                  │  ← labels: text-comunify-text-muted font-inter text-small
│                                                      │     numbers: text-comunify-text font-satoshi text-h2
│   Chart (comunify-blue series + comunify-stable     │
│          positives) — placeholder                    │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Token migration map (ejemplos representativos del baseline)

| Stock actual (count) | Token semántico Comunify | Justificación |
|---|---|---|
| `text-gray-900` (12) | `text-comunify-text` | Texto cuerpo/títulos principal |
| `text-gray-600` (5) | `text-comunify-text-muted` | Secundario/metadata |
| `text-gray-500` (5) | `text-comunify-text-muted` | Secundario (mismo target) |
| `text-gray-700` (3) | `text-comunify-text` | Cuerpo legible |
| `bg-gray-50` (5) | `bg-comunify-bg` | Fondo app |
| `bg-gray-100` (4) | `bg-comunify-border/30` o `bg-comunify-bg` | Hover/divider sutil |
| `bg-gray-200` (1) | `bg-comunify-border` | Divider visible |
| `border-gray-200` (2) | `border-comunify-border` | Bordes |
| `text-green-700` (5) / `bg-green-100` (5) | `text-comunify-stable` / `bg-comunify-stable/10` | Success/positivos |
| `bg-green-500/600` (2) | `bg-comunify-stable` | Success buttons |
| `text-yellow-700` (3) / `bg-yellow-100` (3) | `text-comunify-warning` / `bg-comunify-warning/10` | Warning/review |
| `bg-yellow-500/600` (2) | `bg-comunify-warning` | Warning emphasis |
| `text-red-700` (3) / `bg-red-100` (3) | `text-comunify-critical` / `bg-comunify-critical/10` | Error/destructivos |
| `bg-red-400/600` (2) / `border-red-400` (2) / `text-red-500` (2) | `bg-comunify-critical` / `border-comunify-critical` / `text-comunify-critical` | Critical |
| `text-orange-700/900` (2) / `bg-orange-50/600` (3) / `border-orange-200/300` (2) / `ring-orange-500` (1) | `text-comunify-warning` / `bg-comunify-warning/10` / `border-comunify-warning` / `ring-comunify-warning` | Naranja consolidado a warning |
| `text-blue-700` (1) / `border-blue-300` (1) | `text-comunify-blue` / `border-comunify-blue` | Acento tech (charts/dashboards) |
| `bg-indigo-600` (1) | `bg-comunify-primary` | Indigo consolidado a primary |
| `bg-purple-50` (1) / `border-purple-300` (1) | `bg-comunify-primary/10` / `border-comunify-primary` | Púrpura → primary scale |
| `border-green-300` (1) | `border-comunify-stable` | Verde border → stable |
| `hover:bg-green-700/yellow-700/red-700/orange-700` (4) | `hover:bg-comunify-stable/90` etc. (con opacidad TW v4) | Hover variants consolidados |

**Total ocurrencias migrar:** ~107 (baseline grep 2026-05-18). **Archivos tocados:** 23 (.tsx en `src/app/` + `src/features/comunify/components/` + `src/features/comunify/utils/`).

## Microcopy (Spanish neutro — tuteo, sin voseo)

Esta story NO cambia copy de pantallas (solo tokens/estilos). Strings existentes se preservan verbatim. Excepción: si el migrador encuentra string voseo en componente tocado, hace el fix inline + cita en T-N-impl-log.md (per `.claude/rules/spanish-text.md`).

## Estados visuales clave

| Componente | Default | Hover | Focus | Disabled |
|---|---|---|---|---|
| Botón primary gradient | `bg-comunify-gradient` + `text-comunify-primary-fg` | `brightness-110` + `shadow-lg shadow-comunify-primary/20` | `outline-comunify-primary outline-2 outline-offset-2` | `opacity-50 cursor-not-allowed` |
| Botón secondary outline | `border-comunify-primary text-comunify-primary` | `bg-comunify-primary/5` | `outline-comunify-primary` | `opacity-50` |
| CTA accent (coral) | `bg-comunify-accent text-white` | `brightness-95` | `outline-comunify-accent` | `opacity-50` |
| Card dashboard | `bg-comunify-surface border-comunify-border shadow-sm` | `shadow-md` | n/a | n/a |
| Input | `bg-comunify-surface border-comunify-border text-comunify-text` | n/a | `outline-comunify-primary outline-2` | `bg-comunify-border/30 text-comunify-text-muted` |
| Severity moderation | `text-comunify-stable` (clean) / `text-comunify-warning` (review) / `text-comunify-critical` (block) | n/a | n/a | n/a |

## Non-functional requirements

| Categoría | Requisito | Verificador |
|---|---|---|
| Bundle size impact | < +50KB gzip (3 fuentes + tokens) | `next build` output size check |
| Lighthouse perf | >= 90 mobile (no degradación post-cement) | Playwright `lighthouse` (opcional) |
| Mobile | viewport >= 375px sin overflow horizontal | Playwright `page.setViewportSize({width: 375, height: 812})` |
| Accesibilidad | WCAG AA contrast en pares `text-comunify-text` sobre `bg-comunify-bg` (>= 4.5:1) y `text-comunify-primary-fg` sobre `bg-comunify-gradient` mid-point (>= 4.5:1) | axe-core o cálculo manual documentado en 03-arch.md |
| i18n | Spanish neutro preservado (no regresión) | Lint regex existente `voseo-allowed` |
| Build determinístico | `next build` idempotente sin warnings nuevos | `next build` exit 0 + 0 warnings nuevos vs baseline |
| Multitenancy | n/a (story FE pura, sin queries data) | n/a |
| PII | n/a (story FE pura, sin DTOs nuevos) | n/a |

## Constraints técnicos heredados

- `.claude/rules/frontend-fsd.md` — FSD-Lite, Server-first, Shadcn UI baseline. Cambios solo en `comunify/frontend/src/**` y `comunify/frontend/tailwind.config.ts`. Ningún cambio cross-feature ni cross-brand.
- `.claude/rules/frontend-quality.md` — tsc strict + ESLint + Vitest coverage. Esta story NO debe degradar coverage 20% threshold ni introducir errores.
- `.claude/rules/spanish-text.md` — strings preservados (no toca copy).
- `.claude/rules/anti-duplication.md` — tokens viven SOLO en `globals.css` + `tailwind.config.ts`. Prohibido inline `style={{}}` HEX (cubre arch fitness Scenario 4).
- `.claude/rules/parallel-safety.md` — story parallel_safe: true (FE-only, no toca core ni backend).
- `.claude/rules/tdd-mandatory.md` — arch fitness test (Scenario 2/4) escrito ANTES de migración masiva. Reproduce baseline ~107 violations RED → migración → GREEN.
- Brand overlay `comunify/.claude/rules/creator-funnels.md` — NO aplica directamente (story toca surface design system, NO cohorts/community/vault/voice). Subset baseline aplica (tenant-isolation N/A FE pura, spanish_neutro tuteo respetado).

## Edge cases adicionales (no-Gherkin pero tracked)

1. **Plus Jakarta Sans fallback:** si Satoshi woff2 missing, `next/font/google` Plus Jakarta Sans Bold se mapea a `--font-satoshi`. Visual diff aceptable (ambas son grotesque sans condensadas, weight 700).
2. **Dark mode futuro:** vars deben estructurarse para permitir override `.dark { --comunify-bg: ... }` sin reescribir consumers. Tokens son SLOTS semánticos, no colores.
3. **Charts library colors:** si hay recharts/visx consumiendo HEX directos, T-N-impl-log.md cita exception magic comment `// stock-palette-allowed: chart library prop, no Tailwind class`. Allowlist incluye.
4. **Tailwind v4 + arbitrary values:** opacidad TW v4 con `/N` notation (`bg-comunify-stable/10`) requiere config compatibility. Verificar en arch tests.
5. **Storybook (futuro):** no existe Storybook hoy. Migración no bloquea Storybook setup futuro porque tokens son CSS vars consumibles por cualquier setup.

## Playwright graders (proyecto smoke)

Spec nuevo: `comunify/frontend/e2e/specs/smoke/design-system.smoke.spec.ts` con 3 tests:

1. **HTML font vars present** — visita `/` (landing), asserta `document.documentElement.style.getPropertyValue('--font-satoshi')` no vacío.
2. **Dashboard card uses comunify tokens** — visita `/dashboard` (auth required, usa fixture Clerk testing token), asserta primer `[data-testid="metric-card"]` (o equivalente) tiene `getComputedStyle().backgroundColor === 'rgb(255, 255, 255)'` (surface) y `borderColor === 'rgb(226, 232, 240)'` (border).
3. **Onboarding step 1 has gradient CTA** — visita `/onboarding/step-1`, asserta botón Continuar tiene `getComputedStyle().backgroundImage` contiene `linear-gradient` y los HEX `#7b2ff7` y `#1e5eff` lowercased.

Existing smoke (`dev-stack.smoke.spec.ts`) NO debe romperse. Run completo `npm run test:e2e:smoke` debe quedar 6/6 GREEN (3 prev + 3 nuevos).

## Out of scope (split a futuras stories)

- Dark mode (ADR `comunify/docs/architecture/ADR-comunify-NNN-dark-mode.md` cuando se demande)
- Logo wordmark SVG (pendiente diseño, story separada `comunify-brand-logo`)
- Animaciones gradient Framer Motion (story `comunify-motion-system` futura)
- Lift de tokens a `core/luana-core-platform/design-tokens/` cross-brand (requiere `/pm-luana` promotion proposal, no esta story)
- Migración paralela de paletas en vitalia/nicolify/lupulo
- Storybook setup
- Visual regression snapshots Playwright (`toMatchScreenshot`) — esta story solo asegura DOM/CSS correctness. Story `comunify-visual-regression-baseline` futura.

## Resolución open questions checkpoint (auto por /pm-comunify)

1. **Satoshi licensing** → Default: Plus Jakarta Sans Bold como fallback hasta que Chris provea Satoshi-Bold.woff2 (Fontshare free for commercial — Chris descarga manual). `--font-satoshi` siempre presente independiente del binary.
2. **Gradient hero landing** → Solo CTA + overlay sutil hero (no full-bleed body bg). Brandbook §1 explícito "Prohibido body backgrounds extensos".
3. **Dashboard charts** → `comunify-blue` neutros + `comunify-stable` positivos (consistente §1 tabla "Combinaciones aprobadas: Dashboard métricas"). Charts library color props consumen `hsl(var(--comunify-blue))` resolved en runtime.
4. **Migración 20 archivos dashboard** → Architect decide en 06-tickets.yaml. Sugerencia: split T-fe-3a (cards/page bg), T-fe-3b (tables/lists), T-fe-3c (nav/layout), T-fe-3d (forms/inputs).

## Ratificación

`/pm-comunify` autoriza este spec en modo autónomo (per Chris pre-authorization 2026-05-18). state: refining → refined al cerrar este archivo.
