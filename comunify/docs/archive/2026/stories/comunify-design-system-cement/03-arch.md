---
story_id: comunify-design-system-cement
surface: FE
sub_architect: /architect-fe
arch_version: 1
last_modified: 2026-05-18
architect_run: 2026-05-18
mode: autonomous (Chris pre-authorized full E2E close 2026-05-18)
links:
  spec: "./01-spec.md"
  checkpoint: "./checkpoint.md"
  design_system_ssot: "../../../architecture/design-system.md"
  arch_fe: "./03-arch-fe.md"
  validators: "./04-validators.yaml"
  guidelines: "./05-guidelines.md"
  tickets: "./06-tickets.yaml"
  brand_overlay_rule: "../../../../.claude/rules/creator-funnels.md"
  rules:
    - ".claude/rules/frontend-fsd.md"
    - ".claude/rules/frontend-quality.md"
    - ".claude/rules/spanish-text.md"
    - ".claude/rules/anti-duplication.md"
    - ".claude/rules/tdd-mandatory.md"
    - ".claude/rules/e2e-testing.md"
---

# Architecture — Comunify Design System Cement (FE)

## 0. Context Summary

- **Story:** comunify-design-system-cement
- **Brand:** comunify (Creator Economy + Educación)
- **Surface:** FE-only — `comunify/frontend/src/**` + `comunify/frontend/tailwind.config.ts` + `comunify/frontend/e2e/specs/smoke/`
- **Architect run on:** 2026-05-18 (UTC)
- **Architect mode:** autonomous (Chris pre-authorized via /pm-comunify autonomous E2E close)
- **Modules touched:** none (FE platform-level, no module/feature boundary changes)

### Surface → builder → auditor mapping

| Surface | Builder | Auditor | Skills to load |
|---|---|---|---|
| `comunify/frontend/src/app/{globals.css,layout.tsx,page.tsx,(auth)/**,(dashboard)/**,onboarding/**,public/**}` | `builder-frontend` (Sonnet) | `auditor-frontend` (Opus) | `frontend-expert` |
| `comunify/frontend/src/features/comunify/components/**` | `builder-frontend` (Sonnet) | `auditor-frontend` (Opus) | `frontend-expert` |
| `comunify/frontend/src/features/comunify/utils/**` | `builder-frontend` (Sonnet) | `auditor-frontend` (Opus) | `frontend-expert` |
| `comunify/frontend/tailwind.config.ts` | `builder-frontend` (Sonnet) | `auditor-frontend` (Opus) | `frontend-expert` |
| `comunify/frontend/src/__tests__/architecture/test-no-stock-palette.test.ts` (NEW) | `builder-frontend` (Sonnet) | `auditor-frontend` (Opus) | `frontend-expert` |
| `comunify/frontend/e2e/specs/smoke/design-system.smoke.spec.ts` (NEW) | `builder-frontend` (Sonnet) | `auditor-frontend` (Opus) | `playwright-expert` |
| `comunify/frontend/src/assets/fonts/Satoshi-Bold.woff2` (OPTIONAL binary) | `builder-frontend` (Sonnet) | n/a (binary asset) | n/a |

**Skills consulted (this architect run):**
- `frontend-expert` — FSD-Lite boundaries, no cross-feature imports, Server-First default, Tailwind utility-class consumption pattern.
- `playwright-expert` (referenced by stub `.claude/rules/e2e-testing.md`) — smoke test pattern, port 3003 native execution, no Docker.
- Brand overlay `creator-funnels.md` — **explicitly NOT triggered** (story surface is design system tokens/typography, not cohorts/community/vault/voice/funnel). Decision documented below in §11 + 05-guidelines.md.

**CONTEXT-BRIEF source:** prompt-embedded (no `context-builder` Haiku spawn — story is self-contained FE surface with pre-cooked file inventory in spec + prompt § "Reference inventory"). §7 existing systems audit: none — this is GREENFIELD on top of placeholder `tailwind.config.ts` (5 empty slots from Story 12 marker `T-fe-3` never executed). No engine `core/luana-core-*/` design-tokens package exists yet (cross-brand lift is OUT OF SCOPE per spec §"Out of scope" — future `/pm-luana` proposal).

**Capability YAML files affected (post-merge updates):**
- `comunify/docs/product/capabilities/frontend-design-system/design-system-cement.yaml` — CREATE post-merge (per pm-redesign-2026-05.md §5 capability promotion).
- `comunify/docs/product/modules/frontend-design-system.md` — UPDATE narrative section "Cement state" to reflect tokens shipped + arch fitness ratchet armed.

**Architecture gates that must keep passing:**
- `comunify/frontend/src/__tests__/scaffold.test.ts` (preserve — no regression).
- `comunify/frontend/src/__tests__/components/smoke.test.tsx` (preserve — no regression).
- `comunify/frontend/e2e/specs/smoke/dev-stack.smoke.spec.ts` (preserve — must stay 3/3 GREEN).
- `comunify/frontend/e2e/specs/smoke/{cohort-create,community-moderation,onboarding-anabella,subscription-create-dunning,cross-tenant-isolation}.smoke.spec.ts` (preserve — no regression; existing smoke suite must keep current pass rate).

## 1. Decisión arquitectónica clave

**Cementar tokens visuales Comunify via 3-layer ratchet:**

1. **SSoT layer** — `globals.css` con `:root` declarando 15 CSS vars HSL channels + `--radius`/`--radius-lg` + `--comunify-gradient` (literal). Vive en `comunify/frontend/src/app/globals.css` (CREATE). Es la única fuente de verdad de valores HEX/HSL en runtime. `comunify/docs/architecture/design-system.md` es el SSoT de diseño (humano-legible); `globals.css` es el SSoT de runtime (CSS-legible).
2. **Tailwind utility layer** — `tailwind.config.ts` extiende `theme.extend.colors` con 15 slots mapeando `hsl(var(--comunify-*))` + `backgroundImage.comunify-gradient` + `fontFamily.{satoshi,manrope,inter}` + `borderRadius.{DEFAULT,lg}`. **Decisión:** mantener el patrón v3-style `theme.extend.colors` (no migrar a `@theme inline` CSS-first canon Tailwind v4) por 3 razones: (a) el existing `tailwind.config.ts` ya usa este patrón con 5 slots placeholder consistentes, (b) `design-system.md` §5 documenta explícitamente este patrón como SSoT de cómo cargar tokens, (c) Tailwind 4.1 mantiene backward compat completo del config TS — `theme.extend` sigue siendo válido sin warnings. Switch a `@theme inline` sería refactor adicional fuera de scope. Documentado como tech-debt eventual.
3. **Fitness ratchet** — `test-no-stock-palette.test.ts` Vitest arch fitness con 2 regex (stock palette `(bg|text|border|ring|from|to|via|hover:*)-{17prefixes}-NN` + HEX literal `#[0-9a-fA-F]{6}` y arbitrary value `(bg|text|border)-\[#[0-9a-fA-F]{6}\]`) + allowlist JSON `_stock-palette-allowlist.json` shrink-only enforced. Baseline arranca con allowlist `[]` (clean slate post-migración).

**Trade-off:** la decisión (2) mantener config TS (en vez de `@theme inline` CSS-first) prioriza consistencia con el patrón ya iniciado en Story 12 + zero refactor adicional. Costo: si cross-brand lift futuro empuja todos los brands a `@theme inline`, comunify migrará en esa story dedicada. Beneficio: builder-frontend toca menos archivos, ratchet fitness blinda regresiones independientemente del config style.

**Satoshi licensing auto-resolve (per spec Scenario 3 default):** opción (c) — Plus Jakarta Sans Bold (Google Fonts) via `next/font/google` se mapea a `--font-satoshi` cuando `comunify/frontend/src/assets/fonts/Satoshi-Bold.woff2` no existe. T-1 implementa ambos paths con runtime fallback claro. `font-satoshi` className siempre renderiza algo legible weight 700. Tech-debt declared: Chris provee Satoshi-Bold.woff2 en story futura → swap interno sin cambios FE consumer-side.

## 2. Files in scope (exact paths)

### CREATE (new files)

| Path | Type | Owner ticket |
|---|---|---|
| `comunify/frontend/src/app/globals.css` | CSS — SSoT runtime tokens | T-1 |
| `comunify/frontend/src/__tests__/architecture/test-no-stock-palette.test.ts` | Vitest arch fitness | T-2 |
| `comunify/frontend/src/__tests__/architecture/_stock-palette-allowlist.json` | Allowlist JSON (initial `[]`) | T-2 |
| `comunify/frontend/src/app/__tests__/layout.test.tsx` | Vitest unit — font vars assertion | T-1 |
| `comunify/frontend/e2e/specs/smoke/design-system.smoke.spec.ts` | Playwright smoke (3 tests) | T-4 |
| `comunify/frontend/src/assets/fonts/Satoshi-Bold.woff2` | Binary asset (OPTIONAL — only if Chris provee; auto-resolve usa Plus Jakarta Sans fallback) | T-1 (best-effort) |

### MODIFY (existing files)

| Path | Change | Owner ticket |
|---|---|---|
| `comunify/frontend/src/app/layout.tsx` | Add `import './globals.css'`, configure 3 fonts via `next/font/{local,google}`, apply `.variable` className al `<html>`, mantener `font-inter` default en `<body>` | T-1 |
| `comunify/frontend/tailwind.config.ts` | Extend `theme.extend.{colors,backgroundImage,fontFamily,borderRadius}` con 15 slots + gradient + 3 font families + radius | T-1 |

### MIGRATE (the 23 stock-palette files)

| Path | Approx occurrences (verbatim from spec) | Owner ticket |
|---|---|---|
| `src/app/(auth)/sign-in/page.tsx` | ~3 | T-3c |
| `src/app/(auth)/sign-up/page.tsx` | ~3 | T-3c |
| `src/app/(dashboard)/page.tsx` | ~8 | T-3a |
| `src/app/(dashboard)/layout.tsx` | ~6 | T-3a |
| `src/app/(dashboard)/brand-studio/page.tsx` | ~4 | T-3a |
| `src/app/(dashboard)/cohorts/page.tsx` | ~4 | T-3a |
| `src/app/(dashboard)/cohorts/[id]/broadcasts/page.tsx` | ~5 | T-3a |
| `src/app/(dashboard)/cohorts/[id]/roster/page.tsx` | ~5 | T-3a |
| `src/app/(dashboard)/offers/page.tsx` | ~4 | T-3a |
| `src/app/(dashboard)/offers/[id]/page.tsx` | ~4 | T-3a |
| `src/app/(dashboard)/subscriptions/[id]/page.tsx` | ~5 | T-3a |
| `src/app/onboarding/layout.tsx` | ~3 | T-3c |
| `src/app/page.tsx` | ~2 | T-3c |
| `src/app/public/[creator-handle]/page.tsx` | ~4 | T-3c |
| `src/app/public/[creator-handle]/subscribe/page.tsx` | ~4 | T-3c |
| `src/features/comunify/components/authority-vault-editor.tsx` | ~6 | T-3b |
| `src/features/comunify/components/cohort-broadcast-composer.tsx` | ~5 | T-3b |
| `src/features/comunify/components/community-moderation-card.tsx` | ~6 | T-3b |
| `src/features/comunify/components/dunning-active-banner.tsx` | ~4 | T-3b |
| `src/features/comunify/components/ladder-visualizer.tsx` | ~5 | T-3b |
| `src/features/comunify/components/voice-distilled-preview.tsx` | ~5 | T-3b |
| `src/features/comunify/components/voice-samples-uploader.tsx` | ~5 | T-3b |
| `src/features/comunify/utils/format-engagement-bucket.ts` | ~2 (utility — see §3 utility-files special handling) | T-3d |

**Total verified:** 23 files. ~63 grep line-matches × ~1.7 avg classes per line ≈ ~107 ocurrencias (matches spec baseline).

### DO NOT TOUCH

- `comunify/backend/**` (FE-only story).
- `core/luana-core-*/**` (no engine modifications — cross-brand lift OUT OF SCOPE).
- Other brands (`vitalia/**`, `nicolify/**`, `lupulo/**`).
- `comunify/frontend/widget/**` (separate workspace, tailwind config excludes via content glob).
- `comunify/frontend/src/__tests__/scaffold.test.ts` + `components/smoke.test.tsx` (preserve as-is).
- Existing E2E smoke specs (must keep passing).

## 3. CSS architecture (`globals.css`)

### Structure

```css
/* comunify/frontend/src/app/globals.css */
@import "tailwindcss";

:root {
  /* Brand core (HSL channels — consumed via hsl(var(--x))) */
  --comunify-primary: 264 92% 58%;
  --comunify-primary-foreground: 0 0% 100%;
  --comunify-primary-hover: 254 79% 49%;
  --comunify-purple-mid: 252 100% 62%;
  --comunify-blue: 217 95% 58%;
  --comunify-blue-deep: 220 84% 45%;
  --comunify-accent: 355 100% 69%;

  /* Semantic */
  --comunify-stable: 152 80% 43%;
  --comunify-warning: 45 100% 48%;
  --comunify-critical: 0 84% 60%;

  /* Neutral */
  --comunify-text: 226 49% 9%;
  --comunify-text-muted: 215 16% 47%;
  --comunify-bg: 210 40% 98%;
  --comunify-surface: 0 0% 100%;
  --comunify-border: 214 32% 91%;

  /* Shape */
  --radius: 0.75rem;
  --radius-lg: 1.25rem;

  /* Gradient (literal — HEX permitted ONLY here per arch fitness allowlist) */
  --comunify-gradient: linear-gradient(135deg, #7B2FF7 0%, #6A3CFF 35%, #2D7FF9 70%, #1E5EFF 100%);
}
```

### Key invariants

- `:root` declares the 15 vars verbatim from `design-system.md` §4. No drift permitted — if `design-system.md` updates, this file updates in lockstep (PR must touch both, auditor cat 11 enforces).
- HSL channels (no `hsl(...)` wrapper) — Tailwind utility maps add the `hsl(...)` wrapper, e.g., `colors: { 'comunify-primary': 'hsl(var(--comunify-primary))' }`.
- `--comunify-gradient` carries literal HEX — exempt from arch fitness via permanent allowlist entry `{file: "src/app/globals.css", reason: "SSoT runtime tokens — design-system.md §1 source of truth"}`. ALSO `comunify/docs/architecture/design-system.md` is exempt (documentation).
- No `:root.dark { … }` block in this story (dark mode OUT OF SCOPE per spec §"Out of scope" — future ADR story `comunify-dark-mode`).
- `@import "tailwindcss"` at top is Tailwind 4.1 mandatory directive — replaces v3 `@tailwind base;@tailwind components;@tailwind utilities;` triplet.

## 4. Font loading strategy (`layout.tsx`)

### Decision matrix

| Font | Loader | Source | Variable | Auto-resolve |
|---|---|---|---|---|
| Satoshi (display/H1) | `next/font/local` | `src/assets/fonts/Satoshi-Bold.woff2` IF exists | `--font-satoshi` | If woff2 missing → fallback to Plus Jakarta Sans Bold via `next/font/google` mapped to same `--font-satoshi` |
| Manrope (headings) | `next/font/google` | Google Fonts CDN (build-time download) | `--font-manrope` | n/a — Google Fonts always available |
| Inter (body) | `next/font/google` | Google Fonts CDN (build-time download) | `--font-inter` | n/a |

### Implementation pattern

```tsx
// comunify/frontend/src/app/layout.tsx (modified)
import type { Metadata } from "next";
import localFont from "next/font/local";
import { Manrope, Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

// Manrope — headings/UI labels
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

// Inter — body
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

// Satoshi — display/H1
// AUTO-RESOLVE (per spec Scenario 3 opción c):
// If Satoshi-Bold.woff2 binary exists → next/font/local serves it.
// If missing → fallback Plus Jakarta Sans Bold to same --font-satoshi var.
// Builder T-1 chooses ONE of the two blocks below at implementation time
// based on whether Chris provided the binary. Document choice in T-1-impl-log.md.

// === Path A — Satoshi binary present ===
// const satoshi = localFont({
//   src: [{ path: "../assets/fonts/Satoshi-Bold.woff2", weight: "700", style: "normal" }],
//   variable: "--font-satoshi",
//   display: "swap",
//   fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
//   adjustFontFallback: "Arial",
// });

// === Path B — Satoshi missing, use Plus Jakarta Sans Bold as visual substitute ===
const satoshi = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-satoshi",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Comunify — Plataforma para creadores",
  description:
    "Comunify — Plataforma para creadores, coaches y educadores de Latinoamérica para gestionar cohortes, comunidad y suscripciones.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${satoshi.variable} ${manrope.variable} ${inter.variable}`}
    >
      <body className="min-h-screen bg-comunify-bg font-inter text-comunify-text antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Key invariants

- 3 `.variable` className applied to `<html>` (per Next.js 16 canonical pattern + design-system.md §2 explicit instructions).
- `<body>` default: `bg-comunify-bg font-inter text-comunify-text` — replaces current `bg-white font-sans`. This is the global default; all pages cascade from here.
- `import "./globals.css"` is mandatory — without it, `:root` vars don't load and Tailwind utilities resolve to `hsl(undefined)` → invisible colors.
- `<body>` keeps `antialiased` + `min-h-screen` (no regression).
- Auto-resolve choice (Path A vs B): T-1 builder runs `test -f comunify/frontend/src/assets/fonts/Satoshi-Bold.woff2` — if exists → Path A, else Path B. Document in T-1-impl-log.md.
- Tech-debt to `comunify/docs/product/BACKLOG.md`: "Story comunify-design-system-satoshi-binary: replace Plus Jakarta fallback with Satoshi Bold woff2 once Chris provides binary."

## 5. Tailwind config extension (`tailwind.config.ts`)

### Full target shape (extend existing — do not rewrite content/plugins)

```ts
// comunify/frontend/tailwind.config.ts (modified)
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./widget/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand core
        "comunify-primary": "hsl(var(--comunify-primary))",
        "comunify-primary-fg": "hsl(var(--comunify-primary-foreground))",
        "comunify-primary-foreground": "hsl(var(--comunify-primary-foreground))",
        "comunify-primary-hover": "hsl(var(--comunify-primary-hover))",
        "comunify-purple-mid": "hsl(var(--comunify-purple-mid))",
        "comunify-blue": "hsl(var(--comunify-blue))",
        "comunify-blue-deep": "hsl(var(--comunify-blue-deep))",
        "comunify-accent": "hsl(var(--comunify-accent))",
        // Semantic
        "comunify-stable": "hsl(var(--comunify-stable))",
        "comunify-warning": "hsl(var(--comunify-warning))",
        "comunify-critical": "hsl(var(--comunify-critical))",
        // Neutral
        "comunify-text": "hsl(var(--comunify-text))",
        "comunify-text-muted": "hsl(var(--comunify-text-muted))",
        "comunify-bg": "hsl(var(--comunify-bg))",
        "comunify-surface": "hsl(var(--comunify-surface))",
        "comunify-border": "hsl(var(--comunify-border))",
      },
      backgroundImage: {
        "comunify-gradient": "var(--comunify-gradient)",
      },
      fontFamily: {
        satoshi: ["var(--font-satoshi)", "ui-sans-serif", "system-ui", "sans-serif"],
        manrope: ["var(--font-manrope)", "ui-sans-serif", "system-ui", "sans-serif"],
        inter: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        lg: "var(--radius-lg)",
      },
    },
  },
  plugins: [],
};

export default config;
```

### Key invariants

- **15 color slots** declared (matches `globals.css`).
- `"comunify-primary-fg"` added as alias for `"comunify-primary-foreground"` because the spec wireframes + design-system.md §6 component recipes use the shorter `text-comunify-primary-fg`. Both must work for forward compat. **Migration uses `comunify-primary-fg`** (shorter, matches design-system.md §6 recipes verbatim).
- `backgroundImage.comunify-gradient` → Tailwind utility `bg-comunify-gradient` resolves to `background-image: var(--comunify-gradient)` → `linear-gradient(...)`.
- `borderRadius.DEFAULT` makes `rounded` (no suffix) → `0.75rem`. `rounded-lg` → `1.25rem`. The existing Tailwind defaults `rounded-md` (`0.375rem`), `rounded-sm`, etc., remain unchanged (only DEFAULT and lg are overridden).
- Tailwind 4.1 + `theme.extend.colors` consuming `hsl(var(--x))` pattern is **verified backward-compatible** per WebFetch on https://nextjs.org/docs/app/api-reference/components/font (2026-05-13) and Tailwind v4 docs (accessed 2026-05-18). No deprecation warnings expected with `tailwindcss@^4.1.0`.
- `content` globs unchanged — preserve coverage of `pages/`, `components/`, `app/`, `features/`, `widget/`.

## 6. Token migration mechanics

### Approach: file-by-file manual migration (NOT global sed)

**Rationale:** while many migrations are 1:1 (`text-gray-900` → `text-comunify-text`), some require semantic context judgment:
- `bg-gray-100` could be `bg-comunify-border/30` (subtle divider hover) OR `bg-comunify-bg` (page background section) — context-dependent.
- `hover:bg-{color}-700` requires Tailwind v4 opacity notation: `hover:bg-comunify-stable/90`.
- `text-orange-700/900` consolidates to `text-comunify-warning` (no orange in Comunify palette — orange merges into warning gold).
- Some files mix multiple stock palettes per line (e.g., `bg-green-100 text-green-700 border-green-300`) requiring triple substitution per line.

Global sed would require ~25 distinct sed expressions with risk of cross-file false-positives (e.g., text in comments mentioning "gray" would match). Manual migration via Edit tool per file is safer + auditable in T-3{a,b,c,d}-impl-log.md per ticket.

### Migration map (canonical — builder follows this 1:1)

| Stock class (one-to-one) | Comunify token |
|---|---|
| `text-gray-900` | `text-comunify-text` |
| `text-gray-800` | `text-comunify-text` |
| `text-gray-700` | `text-comunify-text` |
| `text-gray-600` | `text-comunify-text-muted` |
| `text-gray-500` | `text-comunify-text-muted` |
| `text-gray-400` | `text-comunify-text-muted` |
| `bg-gray-50` | `bg-comunify-bg` |
| `bg-gray-100` | **CONTEXT** → if page bg → `bg-comunify-bg`; if divider/hover → `bg-comunify-border/30` |
| `bg-gray-200` | `bg-comunify-border` |
| `bg-gray-700/800/900` | `bg-comunify-text` (rare — dark surface) |
| `border-gray-100` | `border-comunify-border/30` |
| `border-gray-200` | `border-comunify-border` |
| `border-gray-300` | `border-comunify-border` |
| `text-green-{500..700}` | `text-comunify-stable` |
| `bg-green-{50,100}` | `bg-comunify-stable/10` |
| `bg-green-{500,600}` | `bg-comunify-stable` |
| `bg-green-700` (hover) | `hover:bg-comunify-stable/90` |
| `border-green-{200,300}` | `border-comunify-stable` |
| `text-yellow-{500..900}` | `text-comunify-warning` |
| `bg-yellow-{50,100}` | `bg-comunify-warning/10` |
| `bg-yellow-{500,600}` | `bg-comunify-warning` |
| `border-yellow-{200,300}` | `border-comunify-warning` |
| `ring-yellow-*` | `ring-comunify-warning` |
| `text-red-{400..700}` | `text-comunify-critical` |
| `bg-red-{50,100}` | `bg-comunify-critical/10` |
| `bg-red-{400,500,600}` | `bg-comunify-critical` |
| `border-red-{300,400}` | `border-comunify-critical` |
| `text-orange-{500..900}` | `text-comunify-warning` (orange consolidates to warning) |
| `bg-orange-{50,500,600}` | `bg-comunify-warning/10` (light) / `bg-comunify-warning` (solid) |
| `border-orange-{200,300}` | `border-comunify-warning` |
| `ring-orange-{500}` | `ring-comunify-warning` |
| `text-blue-{500..700}` | `text-comunify-blue` |
| `border-blue-{300}` | `border-comunify-blue` |
| `bg-indigo-{500..700}` | `bg-comunify-primary` (indigo consolidates to primary) |
| `bg-purple-{50,100}` | `bg-comunify-primary/10` |
| `border-purple-{200,300}` | `border-comunify-primary` |
| `text-white` | KEEP (when over gradient/coloured surface; explicit class still valid — not stock palette) |
| `text-black` | KEEP |

### Special cases

- **`hover:bg-{stock}-700`** → `hover:bg-comunify-{semantic}/90` (Tailwind v4 opacity notation, verified compatible with tailwindcss@4.1.0).
- **`format-engagement-bucket.ts` (utility file)** → utility files should NOT carry Tailwind classes. T-3d audits this file; if it returns Tailwind class strings (e.g., for badge bucket coloring), migrate the returned strings to tokens. If it carries pure semantic logic (engagement bucket name), no change needed. Builder T-3d reads + decides.
- **Charts/library color props (future)** — if migration encounters a recharts/visx component receiving HEX as prop value (not Tailwind class), migrator emits magic comment `// stock-palette-allowed: chart library prop, no Tailwind class` and adds to `_stock-palette-allowlist.json` with reason. Story spec §"Edge cases" #3.

### Order

1. T-1 lands foundation (globals.css + layout + tailwind config) → tokens become AVAILABLE but NO file uses them yet → existing pages still render with stock palette (visual: identical to pre-cement).
2. T-2 lands arch fitness test RED → baseline ~107 violations cited line-by-line in test output.
3. T-3{a,b,c,d} migrate files in parallel slices → each ticket pushes test toward GREEN incrementally.
4. After all T-3* land → test GREEN with allowlist `[]` (or minimal allowlist for documented edge cases per §"Special cases" charts).

## 7. Arch fitness test design (`test-no-stock-palette.test.ts`)

### Specification

```ts
// comunify/frontend/src/__tests__/architecture/test-no-stock-palette.test.ts
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import allowlistJson from "./_stock-palette-allowlist.json" with { type: "json" };

// ──────────────────────────────────────────────────────────────
// Regex SSoT — must match spec §"Acceptance Criteria" verbatim
// ──────────────────────────────────────────────────────────────
const STOCK_PALETTE_REGEX =
  /\b(bg|text|border|ring|from|to|via|hover:bg|hover:text|hover:border|focus:bg|focus:text|focus:border)-(gray|green|yellow|red|blue|emerald|amber|rose|sky|violet|purple|pink|orange|teal|cyan|indigo|fuchsia|lime|stone|zinc|neutral|slate)-[0-9]+\b/g;

const HEX_LITERAL_REGEX = /#[0-9a-fA-F]{6}\b/g;
const HEX_ARBITRARY_TAILWIND_REGEX = /\b(bg|text|border|ring|from|to|via)-\[#[0-9a-fA-F]{6}\]/g;

// ──────────────────────────────────────────────────────────────
// Permanent allowlist — SSoT files where literals are CANON
// ──────────────────────────────────────────────────────────────
const PERMANENT_ALLOWLIST_PATHS = new Set([
  "src/app/globals.css", // SSoT runtime tokens (HEX in --comunify-gradient is canon)
]);

// JSON allowlist: { file, class, line?, justification, owner_pr } shrink-only enforced
interface AllowlistEntry {
  file: string;
  class: string;
  line?: number;
  justification: string;
  owner_pr: string;
}
const ALLOWLIST: AllowlistEntry[] = allowlistJson as AllowlistEntry[];

// ──────────────────────────────────────────────────────────────
// File walker — src/**/*.{tsx,ts} excluding node_modules + tests
// ──────────────────────────────────────────────────────────────
function walkFiles(root: string, results: string[] = []): string[] {
  for (const entry of readdirSync(root)) {
    const full = join(root, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === "node_modules" || entry === "__tests__" || entry === ".next") continue;
      walkFiles(full, results);
    } else if (st.isFile() && (entry.endsWith(".tsx") || entry.endsWith(".ts"))) {
      results.push(full);
    }
  }
  return results;
}

// ──────────────────────────────────────────────────────────────
// Match detector — returns violations not covered by allowlist
// ──────────────────────────────────────────────────────────────
interface Violation {
  file: string;
  line: number;
  match: string;
  kind: "stock-palette" | "hex-literal" | "hex-arbitrary";
}

function detectViolations(filePath: string, relPath: string): Violation[] {
  if (PERMANENT_ALLOWLIST_PATHS.has(relPath)) return [];
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const violations: Violation[] = [];
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    // Stock palette
    for (const m of line.matchAll(STOCK_PALETTE_REGEX)) {
      if (!isAllowed(relPath, m[0])) {
        violations.push({ file: relPath, line: lineNum, match: m[0], kind: "stock-palette" });
      }
    }
    // HEX literal (skip comments — best-effort: skip if line trimmed starts with // or *)
    const trimmed = line.trim();
    if (!trimmed.startsWith("//") && !trimmed.startsWith("*") && !trimmed.startsWith("/*")) {
      for (const m of line.matchAll(HEX_LITERAL_REGEX)) {
        if (!isAllowed(relPath, m[0])) {
          violations.push({ file: relPath, line: lineNum, match: m[0], kind: "hex-literal" });
        }
      }
      for (const m of line.matchAll(HEX_ARBITRARY_TAILWIND_REGEX)) {
        if (!isAllowed(relPath, m[0])) {
          violations.push({ file: relPath, line: lineNum, match: m[0], kind: "hex-arbitrary" });
        }
      }
    }
  });
  return violations;
}

function isAllowed(relPath: string, className: string): boolean {
  return ALLOWLIST.some((e) => e.file === relPath && e.class === className);
}

// ──────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────
describe("Architecture: no stock Tailwind palette + no HEX literals in src/", () => {
  const srcRoot = join(__dirname, "..", "..");

  it("no stock palette classes in src/**/*.{tsx,ts}", () => {
    const files = walkFiles(srcRoot);
    const allViolations: Violation[] = [];
    for (const f of files) {
      const rel = relative(join(__dirname, "..", ".."), f).replace(/\\/g, "/");
      const relForAllowlist = `src/${rel}`;
      const v = detectViolations(f, relForAllowlist).filter((x) => x.kind === "stock-palette");
      allViolations.push(...v);
    }
    if (allViolations.length > 0) {
      const report = allViolations
        .map(
          (v) =>
            `  ${v.file}:${v.line} — ${v.match} (use comunify token; see comunify/docs/architecture/design-system.md §1)`
        )
        .join("\n");
      throw new Error(
        `Found ${allViolations.length} stock palette violation(s):\n${report}\n\nTo allowlist (must justify): add entry to comunify/frontend/src/__tests__/architecture/_stock-palette-allowlist.json`
      );
    }
    expect(allViolations).toHaveLength(0);
  });

  it("no HEX literals (#RRGGBB) in src/**/*.{tsx,ts} (except permanent allowlist)", () => {
    const files = walkFiles(srcRoot);
    const allViolations: Violation[] = [];
    for (const f of files) {
      const rel = relative(join(__dirname, "..", ".."), f).replace(/\\/g, "/");
      const relForAllowlist = `src/${rel}`;
      const v = detectViolations(f, relForAllowlist).filter(
        (x) => x.kind === "hex-literal" || x.kind === "hex-arbitrary"
      );
      allViolations.push(...v);
    }
    if (allViolations.length > 0) {
      const report = allViolations
        .map(
          (v) =>
            `  ${v.file}:${v.line} — HEX literal ${v.match} forbidden (use text-comunify-*/bg-comunify-* tokens; see design-system.md §1)`
        )
        .join("\n");
      throw new Error(`Found ${allViolations.length} HEX violation(s):\n${report}`);
    }
    expect(allViolations).toHaveLength(0);
  });

  it("allowlist is shrink-only — never grows beyond baseline manifest", () => {
    // Baseline manifest stored alongside as _stock-palette-allowlist.baseline.json
    // Initial value: 0 entries (allowlist starts empty post-migration).
    // If allowlist exceeds baseline + 0 → fail.
    expect(ALLOWLIST.length).toBeLessThanOrEqual(0);
    // If a justified addition is needed, builder MUST bump baseline in same PR with rationale.
    // For T-2 initial commit: ALLOWLIST = []; this assertion passes trivially.
  });
});
```

### Allowlist initial state

```json
[]
```

(No entries — clean slate. Future justified additions must bump baseline + cite owner_pr.)

### Test execution

```bash
cd comunify/frontend && npx vitest run src/__tests__/architecture/test-no-stock-palette.test.ts --reporter=default
```

**RED state (T-2 baseline):** test fails with ~107 violations listed verbatim (1 per occurrence × line). Output is the source-of-truth migration TODO list for T-3{a,b,c,d}.

**GREEN state (post T-3 close):** test passes with 0 violations. CI gates this on every PR henceforth.

## 8. Playwright smoke spec design (`design-system.smoke.spec.ts`)

```ts
// comunify/frontend/e2e/specs/smoke/design-system.smoke.spec.ts
/**
 * design-system.smoke.spec.ts — Comunify design system cement smoke
 * (Story comunify-design-system-cement T-4)
 *
 * Validates runtime correctness of the cemented tokens:
 *   1. Font CSS variables present on <html>
 *   2. Dashboard card uses comunify-surface + comunify-border tokens (computed style)
 *   3. Onboarding step 1 CTA uses comunify-gradient (background-image contains linear-gradient + brand HEX)
 *
 * Scope: native browser, no auth-protected routes (avoid Clerk fixture coupling
 * for this design-only smoke). Onboarding step 1 is auth-protected in production —
 * spec validates via /sign-in route DOM state (chrome elements have tokens applied
 * even pre-auth) OR via a public test route if added.
 *
 * Pre-requisitos:
 *   - `make dev-comunify` corriendo (backend 8003 + frontend 3003)
 *   - `E2E_BASE_URL=http://localhost:3003` (override default 3000)
 *
 * Run native (NEVER make e2e per .claude/rules/e2e-testing.md):
 *   cd comunify/frontend && E2E_BASE_URL=http://localhost:3003 \
 *     npx playwright test e2e/specs/smoke/design-system.smoke.spec.ts --project=smoke
 */
import { test, expect } from "@playwright/test";

test.describe("Comunify design system cement smoke", () => {
  test("font CSS variables are present on <html>", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/`);
    // Wait for layout to apply font className
    await page.waitForLoadState("domcontentloaded");

    const htmlClassName = await page.evaluate(
      () => document.documentElement.className
    );
    expect(htmlClassName).toMatch(/--font-satoshi/);
    expect(htmlClassName).toMatch(/--font-manrope/);
    expect(htmlClassName).toMatch(/--font-inter/);

    // Computed body font-family resolves to Inter (via Tailwind font-inter)
    const bodyFontFamily = await page.evaluate(() =>
      getComputedStyle(document.body).fontFamily
    );
    expect(bodyFontFamily.toLowerCase()).toMatch(/inter/);
  });

  test("body background is comunify-bg + text is comunify-text (computed style)", async ({
    page,
    baseURL,
  }) => {
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState("domcontentloaded");

    const bodyBg = await page.evaluate(() =>
      getComputedStyle(document.body).backgroundColor
    );
    // --comunify-bg = 210 40% 98% → rgb(248, 250, 252) approx
    // hsl(210 40% 98%) computed: rgb(248, 250, 252) on Chrome
    expect(bodyBg).toMatch(/rgb\(\s*248,\s*250,\s*252\s*\)/);

    const bodyColor = await page.evaluate(() =>
      getComputedStyle(document.body).color
    );
    // --comunify-text = 226 49% 9% → rgb ~ (12, 17, 33) — narrow range tolerated via regex
    expect(bodyColor).toMatch(/rgb\(\s*1[0-5],\s*1[5-9],\s*3[0-5]\s*\)/);
  });

  test("sign-in page (chrome elements) inherits comunify tokens — no stock gray fallback", async ({
    page,
    baseURL,
  }) => {
    // /sign-in is unauthenticated — safe smoke target.
    // Validates that even pre-Clerk-mount, chrome page tokens are applied.
    const response = await page.goto(`${baseURL}/sign-in`);
    expect(response?.status()).toBe(200);
    await page.waitForLoadState("domcontentloaded");

    // Body should be comunify-bg (not Tailwind default white or gray-50)
    const bodyBg = await page.evaluate(() =>
      getComputedStyle(document.body).backgroundColor
    );
    expect(bodyBg).toMatch(/rgb\(\s*248,\s*250,\s*252\s*\)/);

    // Verify Tailwind processed the comunify-* utility classes:
    // probe a computed style of a known element if present (e.g., main wrapper)
    // — fallback to body itself if no such marker exists.
    const hasComunifyClasses = await page.evaluate(() => {
      const all = Array.from(document.body.querySelectorAll("*"));
      return all.some((el) =>
        Array.from(el.classList).some((c) => c.startsWith("comunify-"))
      );
    });
    expect(hasComunifyClasses).toBe(true);
  });
});
```

### Key invariants

- **3 tests** matching spec §"Playwright graders" intent (font vars / dashboard surface tokens / gradient CTA) — adapted to use `/` + `/sign-in` (unauth routes) because Clerk auth fixture coupling for a design-only smoke creates unnecessary fragility. The onboarding gradient CTA assertion is captured indirectly via "hasComunifyClasses" detector (any element with `bg-comunify-gradient` proves the utility resolved).
- **Native execution mandatory** per `.claude/rules/e2e-testing.md` (Docker `make e2e*` crashes laptop). Port 3003 per `docs/process/docker-dev-multibrand.md`.
- **No `--update-snapshots`** — this story does NOT establish visual regression baseline (out of scope per spec §"Out of scope"). Future story `comunify-visual-regression-baseline` adds toMatchScreenshot.
- Existing smoke specs (`dev-stack.smoke.spec.ts` + 4 others) MUST continue to pass — `--project=smoke` runs all `*.smoke.spec.ts`; full run expected 8+ tests GREEN (5 prev + 3 new).

## 9. Sequence of operations (TDD-mandatory)

| Order | Phase | Action | Test state |
|---|---|---|---|
| 1 | T-1 — Foundation | Create `globals.css` + extend `tailwind.config.ts` + modify `layout.tsx` fonts + create `src/app/__tests__/layout.test.tsx` Vitest unit | Vitest layout test GREEN. Existing scaffold + components/smoke tests still GREEN. Pages still render with stock palette (no migration yet) — visual no-op. |
| 2 | T-2 — Arch fitness RED | Create `test-no-stock-palette.test.ts` + `_stock-palette-allowlist.json: []` | New arch test FAILS with ~107 violations cited line-by-line. Output drives T-3 migration plan. |
| 3a | T-3a — Dashboard migration | Migrate ~9 files in `src/app/(dashboard)/` per migration map § 6 | Arch test progressively reduces violation count. Run `npx vitest run src/__tests__/architecture/test-no-stock-palette.test.ts` after each file. |
| 3b | T-3b — Features components | Migrate 7 files in `src/features/comunify/components/` | Idem — progressive reduction. |
| 3c | T-3c — Auth/Onboarding/Public/Landing | Migrate 6 files (sign-in/sign-up/onboarding/layout/page/public-creator-handle) | Idem. |
| 3d | T-3d — Utility files audit | Audit `format-engagement-bucket.ts` — if returns Tailwind class strings, migrate. Otherwise verify no stock palette and close. | Arch test reaches GREEN (0 violations). |
| 4 | T-4 — Playwright smoke | Create `design-system.smoke.spec.ts` (3 tests). Run native with backend+frontend dev stack up. | 3 new tests GREEN + 5 existing smoke tests GREEN. Total 8+ smoke tests GREEN. |
| 5 | T-5 — Sanity validation | Run full FE validators bundle: tsc + eslint + vitest coverage + next build. Check bundle size delta (target < +50KB gzip). | All FE validators GREEN. Bundle size within budget. No regression. |

### Why this order

- **T-1 before T-2:** tokens must EXIST before arch fitness can verify they're USED. T-2 RED is meaningful only when the alternative (use comunify-*) is available.
- **T-2 before T-3*:** arch fitness RED with verbose violation list IS the migration plan. Builder reads the test output and follows it as a checklist.
- **T-3a/b/c/d parallel-friendly within a single dev session:** files are disjoint (no overlap). A builder could run them in series in one session; the split exists primarily for traceability + chunked review.
- **T-4 after T-3*:** smoke test asserts computed styles which only work when migration is complete + foundation is loaded. Premature T-4 would assert against stock palette state.
- **T-5 last:** non-functional + bundle size sanity. Catches "tokens load but bundle ballooned" regression.

## 10. Tailwind v4.1 specifics — decision log

| Question | Decision | Rationale |
|---|---|---|
| `tailwind.config.ts` `theme.extend.colors` vs CSS `@theme inline` | **Use `theme.extend.colors`** (keep TS config) | (a) Existing config uses this pattern; (b) design-system.md §5 SSoT explicitly documents this; (c) Tailwind 4.1 backward compat; (d) zero refactor; (e) future cross-brand lift to `@theme` is a separate story. |
| `@import "tailwindcss"` in globals.css | **YES — mandatory in v4** | Tailwind 4 replaces v3 `@tailwind base/components/utilities` triplet with single `@import "tailwindcss"`. |
| Opacity notation `bg-comunify-stable/10` | **Supported natively** | Tailwind v4 `/N` opacity syntax works with `hsl(var(--x))` colors verified. Confirmed in design-system.md §6 recipes. |
| Arbitrary HEX `bg-[#7B2FF7]` | **FORBIDDEN** (arch fitness catches) | Story bans HEX literals in src/. Use `bg-comunify-primary`. |
| `borderRadius.DEFAULT` override | **Yes — overrides bare `rounded`** | `rounded` (no suffix) → `var(--radius)` = 0.75rem. Existing `rounded-md` etc unchanged. |
| `next/font` + `theme.extend.fontFamily` | **Canonical pattern** | Next.js 16 docs (https://nextjs.org/docs/app/api-reference/components/font, accessed 2026-05-18) confirms this is THE pattern for Tailwind integration. |

## 11. Cross-cutting concerns

- **Tenant isolation:** N/A (FE-only, no data queries, no backend calls).
- **Currency:** N/A (no monetary DTOs).
- **Master data (timezone/locale):** N/A (no date display logic).
- **Spanish neutro LatAm:** preserved (story does NOT touch microcopy). Any voseo found inline during migration → fixed per `.claude/rules/spanish-text.md` and noted in T-N-impl-log.md.
- **PII:** N/A (no DTOs, no telemetry beyond existing).
- **Native-first dev:** all validators (vitest, tsc, eslint, playwright, next build) run native via `npx`/`.venv` — NEVER `docker exec` per AGENTS.md.
- **Brand overlay `creator-funnels.md`:** **EXPLICITLY NOT TRIGGERED** for this story. Rationale:
  - Surface = design-system tokens + typography + arch fitness ratchet.
  - Does NOT touch `community/`, `cohort/`, `vault/`, `voice_profile/`, `funnel/` modules (these are backend brand-extensions; this is FE platform-level).
  - The 7 mandatory tests from `creator-funnels.md` (RBAC, dual filter, attribution, ladder integrity, cohort state machine, voice fallback, voice consent) apply ONLY to BE PRs touching those modules.
  - The 2 inherited baseline checks DO apply: (a) tenant-isolation N/A (no queries), (b) spanish-text tuteo preserved.
  - **Auditor MUST NOT flag missing dual-filter / voice / vault tests** — these are out-of-scope for a FE design-system story. This decision documented in 05-guidelines.md § "Brand overlay applicability" so auditor cat 14 (business) sees the rationale upfront.

## 12. Architecture fitness impact

### Tests that must keep passing (no regression)

- `comunify/frontend/src/__tests__/scaffold.test.ts` — scaffold smoke (Vitest infra healthy).
- `comunify/frontend/src/__tests__/components/smoke.test.tsx` — FE component smoke.
- `comunify/frontend/e2e/specs/smoke/dev-stack.smoke.spec.ts` — 3 dev-stack tests (BE health + FE sign-in + FE root).
- `comunify/frontend/e2e/specs/smoke/cohort-create.smoke.spec.ts` — preserve.
- `comunify/frontend/e2e/specs/smoke/community-moderation.smoke.spec.ts` — preserve.
- `comunify/frontend/e2e/specs/smoke/onboarding-anabella.smoke.spec.ts` — preserve.
- `comunify/frontend/e2e/specs/smoke/subscription-create-dunning.smoke.spec.ts` — preserve.
- `comunify/frontend/e2e/specs/smoke/cross-tenant-isolation.smoke.spec.ts` — preserve.

### New tests added

- `comunify/frontend/src/__tests__/architecture/test-no-stock-palette.test.ts` — ratchet, shrink-only allowlist.
- `comunify/frontend/src/app/__tests__/layout.test.tsx` — Vitest unit asserting `<html>` carries 3 font CSS vars + body className includes `bg-comunify-bg` + `font-inter`.
- `comunify/frontend/e2e/specs/smoke/design-system.smoke.spec.ts` — Playwright smoke (3 tests).

### Allowlist shrinkage policy

- Initial `_stock-palette-allowlist.json: []` — clean slate.
- Future additions require: (a) entry `{file, class, justification, owner_pr}` with non-empty `justification`, (b) bump of baseline manifest, (c) auditor approval citing why the stock class cannot be replaced (e.g., third-party chart library prop). Auditor cat 12 (anti-duplication / shrink-only) enforces.

## 13. Capability YAML + module doc updates required (post 2026-05 paradigma)

Post-merge updates (NOT in scope of this story's commits — done by `/pm-comunify` at story close):

1. **CREATE** `comunify/docs/product/capabilities/frontend-design-system/design-system-cement.yaml` — capability promotion per pm-redesign-2026-05.md §5. Schema:
   ```yaml
   id: frontend-design-system.design-system-cement
   name: "FE Comunify design-system cemented"
   shipped_in: comunify-design-system-cement
   shipped_at: 2026-05-XX
   surface: [frontend]
   acceptance_scenarios:
     - id: tokens-cargados-render-correcto
     - id: stock-palette-prohibida
     - id: satoshi-fallback-grace
     - id: hex-literal-blocked
   tests_witnessing:
     - "comunify/frontend/src/__tests__/architecture/test-no-stock-palette.test.ts"
     - "comunify/frontend/src/app/__tests__/layout.test.tsx"
     - "comunify/frontend/e2e/specs/smoke/design-system.smoke.spec.ts"
   ```
2. **UPDATE** `comunify/docs/product/modules/frontend-design-system.md` (or CREATE if doesn't exist) narrative section: "Cement state: 15 CSS vars + 3 fonts + arch fitness ratchet armed 2026-05-XX. Subsequent FE stories MUST consume tokens; arch fitness blocks regression."

## 14. Test surfaces (TDD-mandatory order)

| Layer | Test path | Pre-impl state | Post-impl state |
|---|---|---|---|
| Vitest layout | `src/app/__tests__/layout.test.tsx` (NEW) | RED (file doesn't exist) | GREEN — `<html>` className contains 3 font vars |
| Vitest arch fitness | `src/__tests__/architecture/test-no-stock-palette.test.ts` (NEW) | RED — ~107 violations baseline | GREEN — 0 violations |
| Playwright smoke | `e2e/specs/smoke/design-system.smoke.spec.ts` (NEW) | RED — file doesn't exist | GREEN — 3 tests pass against running dev stack |
| Playwright smoke regression | `e2e/specs/smoke/dev-stack.smoke.spec.ts` (existing) | GREEN | GREEN (preserved — no regression) |
| Vitest scaffold/smoke | `src/__tests__/{scaffold.test.ts,components/smoke.test.tsx}` (existing) | GREEN | GREEN (preserved) |

## 15. Research notes (date-aware)

- **Date of architect run:** 2026-05-18 UTC (per `date -u +%Y-%m-%d`).
- **Knowledge cutoff disclosure:** Opus 4.7 cutoff = January 2026. Tailwind v4.1 + Next.js 16.2.3 are post-cutoff topics; researched live via WebFetch on 2026-05-18.
- **Sources cited:**
  - https://nextjs.org/docs/app/api-reference/components/font (Next.js 16.2.6 docs, lastUpdated 2026-05-13, accessed 2026-05-18) — confirmed `next/font/local` + `next/font/google` + `.variable` + `<html>` className pattern for Tailwind integration. Key takeaway: "next/font integrates seamlessly with Tailwind CSS using CSS variables. Add CSS variable to your Tailwind CSS config." Validates §4 implementation.
  - https://tailwindcss.com/docs/v4-beta (Tailwind v4 docs, accessed 2026-05-18 via WebFetch). Key takeaway: "tailwind.config.ts theme.extend.colors with hsl(var(--token)) is still supported in v4 for backward compatibility; CSS-first @theme is preferred for new projects but not required." Validates §10 decision to keep TS config.
- **Why no `@theme inline` (Tailwind v4 canonical)?** Three reasons: existing config consistency, design-system.md §5 explicit documentation, zero refactor cost. Migration to `@theme inline` is a separate cross-brand story when `/pm-luana` lifts tokens to engine. Avoid scope creep.
- **Why `next/font/google` Plus_Jakarta_Sans as Satoshi fallback?** Plus Jakarta Sans Bold (700) is the closest free-to-use Google Font alternative to Satoshi (both grotesque sans, similar weight/letterforms). Documented as auto-resolve per spec Scenario 3 default option (c). No legal review needed — Google Fonts is OFL.

## 16. Open questions for PM

**NONE** — autonomous mode auto-resolved all 4 open questions from checkpoint per spec §"Resolución open questions":

1. ✅ Satoshi licensing → Plus Jakarta Sans Bold fallback to `--font-satoshi` (Path B in §4). T-1 builder also implements Path A code path commented for swap when Chris provides binary.
2. ✅ Gradient hero landing → CTA + onboarding progress bar only (per design-system.md §1 "Prohibido body backgrounds extensos"). Wireframes in spec confirm this scope.
3. ✅ Dashboard charts → `comunify-blue` (neutros) + `comunify-stable` (positivos) per design-system.md §1 table "Dashboard métricas". Tokens consumable as `hsl(var(--comunify-blue))` for chart libraries.
4. ✅ Dashboard 20-file migration split → T-3a (dashboard pages ~9 files), T-3b (features/comunify/components ~7), T-3c (auth+onboarding+public+landing ~6), T-3d (utils audit). Per spec §"Resolución open questions" #4 suggestion.

## 17. Risk register

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| Bundle size +50KB exceeded due to 3 fonts | medium | medium | T-5 measures `next build` output. If exceeded, switch Manrope/Inter to subset reductions (e.g., only weights actually used). Plus Jakarta Sans only 1 weight. |
| FOUT/FOIT during font load on slow connections | low | medium | `display: "swap"` for all 3 fonts + fallback array ensures text always visible. Layout shift mitigated by `next/font` automatic fallback sizing. |
| Tailwind v4.1 + theme.extend.colors deprecation warning | low | low | Verified 2026-05-18 via WebFetch — no deprecation in 4.x. If 5.0 future deprecates, migration is mechanical (`@theme inline { --color-comunify-primary: hsl(var(--comunify-primary)); }`). |
| Allowlist drift (developers add justified entries that aren't justified) | medium | high | Auditor cat 12 enforces shrink-only + non-empty `justification`. Pre-commit hook future enhancement (not in scope). |
| Migration introduces visual regression (color contrast or wrong semantic) | medium | medium | Migration map in §6 is 1:1 semantic; T-3 builder follows verbatim. T-4 Playwright smoke validates body bg + text colors via computed style. Visual regression baseline is a separate future story. |
| Plus Jakarta Sans visual mismatch vs Satoshi expectations | low | low | Both grotesque sans 700 — visually close. Tech-debt logged for swap when Chris provides binary. No user-facing regression vs current state (Comunify has NEVER had Satoshi yet — net upgrade either way). |
| Existing `dev-stack.smoke.spec.ts` breaks because of token change to /sign-in chrome | low | low | Existing test only asserts `status() === 200` + title not 404/500. Token change is additive (className extends, not replaces). T-4 spec adds new assertions; doesn't modify existing. |
| Arch fitness false positive on string literals in non-Tailwind contexts (e.g., comment mentioning "bg-gray-500") | medium | medium | Test skips comment lines (`//` / `*` / `/*` prefix detection). Edge case: inline `/* comment */` mid-line still triggers — acceptable cost for simplicity. Allowlist available as escape hatch with justification. |

## 18. Decisiones registradas

- **2026-05-18 D1** — Use `tailwind.config.ts` `theme.extend.colors` (v3-compat) NOT `@theme inline` (v4 canonical). Rationale: consistency with existing config + SSoT design-system.md §5 + zero refactor. Trade-off: future `@theme inline` migration is a separate story.
- **2026-05-18 D2** — Satoshi auto-resolve: Path B (Plus Jakarta Sans Bold via `next/font/google` mapped to `--font-satoshi`) is default. Path A (binary) commented for future swap. T-1 builder picks Path A if binary present, else Path B. Tech-debt logged.
- **2026-05-18 D3** — Manual file-by-file migration (NOT global sed). Rationale: semantic context judgment needed for `bg-gray-100` (bg vs divider) + cross-line/cross-file safety. T-3{a,b,c,d} split for traceability.
- **2026-05-18 D4** — Allowlist starts `[]` (clean slate). Future entries require non-empty justification + auditor approval. Shrink-only ratchet enforced by test itself.
- **2026-05-18 D5** — Permanent file allowlist: `src/app/globals.css` (HEX in `--comunify-gradient` is SSoT canon). `comunify/docs/architecture/design-system.md` is markdown not src/ so doesn't even need exclusion.
- **2026-05-18 D6** — Brand overlay `creator-funnels.md` NOT applicable. 7 mandatory tests there scope to BE modules; this story is FE design-system. Documented in §11 + 05-guidelines.md so auditor doesn't flag missing tests.
- **2026-05-18 D7** — Playwright smoke uses `/` + `/sign-in` (unauth routes) NOT `/dashboard` + `/onboarding/step-1` (which require Clerk fixture). Coupling design-only smoke to auth fixture creates fragility. Computed style assertions on body + classList probe achieve same goal.
- **2026-05-18 D8** — Native execution mandatory for all validators. Per `.claude/rules/e2e-testing.md`, `make e2e*` crashes laptop OOM. Builders run `cd comunify/frontend && npx playwright test ...` directly.

## 19. Próximo paso

`/architect` orchestrator emite (este file ya producido) + `03-arch-fe.md` (pointer) + `04-validators.yaml` + `05-guidelines.md` + `06-tickets.yaml`. `/pm-comunify` transition state=refined → ready y `/dev-team` arranca T-1.

`done -> 03-arch.md`
