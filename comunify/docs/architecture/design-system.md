---
brand: comunify
type: design-system
status: draft
last_updated: 2026-05-16
ssot_owner: /pm-comunify
consumers: [comunify/frontend, comunify/landing]
supersedes: brandbook-raw (Chris brief)
---

# Comunify — Design System (frontend SSoT)

> Resumen accionable del brandbook. **Esta es la única fuente de tokens visuales para Comunify FE.** Si algo no está acá, no es Comunify. Cambios → ADR.

**Esencia:** "Tecnología avanzada de marketing para creadores que escalan profesionalmente." Mezcla SaaS premium (HubSpot/Kajabi) + IA creativa (Jasper/Notion AI) + creator economy (ClickFunnels). Morado innovación + azul confianza + minimalismo blanco.

## 1. Color tokens

### Fuente de verdad (HEX + HSL channels)

HSL en formato `H S% L%` (Tailwind v4 / Shadcn pattern — consumido vía `hsl(var(--x))`).

| Slot                          | Uso                                  | HEX       | HSL channels      |
|---|---|---|---|
| `--comunify-primary`          | Botón primario, links, foco          | `#7B2FF7` | `264 92% 58%`     |
| `--comunify-primary-fg`       | Texto sobre primary                  | `#FFFFFF` | `0 0% 100%`       |
| `--comunify-primary-hover`    | Hover botón primario                 | `#5A1EDC` | `254 79% 49%`     |
| `--comunify-purple-mid`       | Gradient mid                         | `#6A3CFF` | `252 100% 62%`    |
| `--comunify-blue`             | Acento tech / dashboards             | `#2D7FF9` | `217 95% 58%`     |
| `--comunify-blue-deep`        | Hover azul / trust elements          | `#1246D6` | `220 84% 45%`     |
| `--comunify-accent`           | CTA secundario (coral, conversiones) | `#FF5F6D` | `355 100% 69%`    |
| `--comunify-stable`           | Success / dashboards positivos       | `#16C784` | `152 80% 43%`     |
| `--comunify-warning`          | Warning / gold contrast              | `#F5B700` | `45 100% 48%`     |
| `--comunify-critical`         | Error / moderation severity high     | `#EF4444` | `0 84% 60%`       |
| `--comunify-text`             | Texto cuerpo / títulos               | `#0B1020` | `226 49% 9%`      |
| `--comunify-text-muted`       | Secundario / metadata                | `#64748B` | `215 16% 47%`     |
| `--comunify-bg`               | Fondo principal app                  | `#F8FAFC` | `210 40% 98%`     |
| `--comunify-surface`          | Cards, modals                        | `#FFFFFF` | `0 0% 100%`       |
| `--comunify-border`           | Bordes sutiles                       | `#E2E8F0` | `214 32% 91%`     |

### Gradient signature (logo + hero only)

```css
--comunify-gradient: linear-gradient(135deg, #7B2FF7 0%, #6A3CFF 35%, #2D7FF9 70%, #1E5EFF 100%);
```

**Uso permitido:** logo, hero CTA button, hero background overlay, onboarding wizard progress bar.
**Prohibido:** body backgrounds extensos (cansa la vista), cards estándar, texto sobre gradient sin filtro de contraste.

### Combinaciones aprobadas

| Contexto              | Tokens                                                    |
|---|---|
| App shell             | `bg` + `text` + `border` + `primary` (links/acciones)     |
| Hero / onboarding     | `gradient` background + `primary-fg` text + `accent` CTA  |
| Dashboard métricas    | `bg` + `blue` (charts neutros) + `stable` (positivos)     |
| CTA conversion-heavy  | `accent` (coral) sobre `bg` — NO usar para acciones neutras |
| Blog / contenido largo| `bg` + `text` + `text-muted` + `primary` solo en links    |
| Moderation severity   | `stable` (clean) / `warning` (review) / `critical` (block)|

## 2. Typography

### Stack final (3 fuentes, no más)

| Rol        | Familia               | Peso         | Uso                                    |
|---|---|---|---|
| Display/H1 | **Satoshi**           | `700` Bold   | Logo wordmark, hero H1, landing claims |
| Headings   | **Manrope**           | `600` SemiBold | H2–H4, section titles, button labels  |
| Body       | **Inter**             | `400` / `500`| Body, blog, forms, tables, tooltips    |

Fallbacks: `ui-sans-serif, system-ui, -apple-system, sans-serif`.

### Carga en Next.js (App Router)

Satoshi no está en Google Fonts → self-host (CSS Variables — `next/font/local`). Manrope + Inter via `next/font/google`. Ejemplo (`comunify/frontend/src/app/layout.tsx`):

```ts
import localFont from "next/font/local";
import { Manrope, Inter } from "next/font/google";

const satoshi = localFont({
  src: [
    { path: "../assets/fonts/Satoshi-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-satoshi",
  display: "swap",
});
const manrope = Manrope({ subsets: ["latin"], weight: ["500","600","700"], variable: "--font-manrope", display: "swap" });
const inter   = Inter({ subsets: ["latin"], weight: ["400","500","600"], variable: "--font-inter", display: "swap" });
```

Aplicar `${satoshi.variable} ${manrope.variable} ${inter.variable}` al `<html>`.

### Escala (clamp responsive, sin breakpoints frágiles)

| Token            | Tailwind class hint | Min → Max          |
|---|---|---|
| `text-display`   | h1 hero             | `clamp(2.5rem, 6vw, 4.5rem)` / `1.05` line-height |
| `text-h1`        | page title          | `clamp(2rem, 4vw, 3rem)` / `1.15`                  |
| `text-h2`        | section             | `1.75rem` / `1.2`                                   |
| `text-h3`        | sub-section         | `1.375rem` / `1.3`                                  |
| `text-body`      | párrafo             | `1rem` / `1.6`                                      |
| `text-small`     | metadata / hints    | `0.875rem` / `1.5`                                  |

## 3. Shape & spacing

Heredados de Shadcn UI / Tailwind defaults — sólo se overridean estos:

- `--radius`: `0.75rem` (12px) — botones, inputs, cards. Premium pero no agresivo.
- `--radius-lg`: `1.25rem` (20px) — modals, hero cards.
- Sombras: `shadow-sm` para cards estándar; `shadow-lg` con tinte `rgba(123,47,247,0.12)` para CTA primario en estado hover.

## 4. CSS variables — drop-in `globals.css`

Pegar en `comunify/frontend/src/app/globals.css` (crear si no existe) o `:root` del layout root. Tailwind v4 lee estas vars automáticamente cuando `tailwind.config.ts` mapea `hsl(var(--x))`.

```css
:root {
  /* Brand core */
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

  /* Gradient (no es HSL, es valor literal) */
  --comunify-gradient: linear-gradient(135deg, #7B2FF7 0%, #6A3CFF 35%, #2D7FF9 70%, #1E5EFF 100%);
}
```

Dark mode: **out of scope para Story 12**. Cuando se aborde → ADR separado con tokens `--comunify-bg-dark` etc.

## 5. Tailwind config — extender slots existentes

Editar `comunify/frontend/tailwind.config.ts` extendiendo el bloque `colors` actual (que ya declara 5 slots vacíos):

```ts
colors: {
  "comunify-primary":         "hsl(var(--comunify-primary))",
  "comunify-primary-fg":      "hsl(var(--comunify-primary-foreground))",
  "comunify-primary-hover":   "hsl(var(--comunify-primary-hover))",
  "comunify-purple-mid":      "hsl(var(--comunify-purple-mid))",
  "comunify-blue":            "hsl(var(--comunify-blue))",
  "comunify-blue-deep":       "hsl(var(--comunify-blue-deep))",
  "comunify-accent":          "hsl(var(--comunify-accent))",
  "comunify-stable":          "hsl(var(--comunify-stable))",
  "comunify-warning":         "hsl(var(--comunify-warning))",
  "comunify-critical":        "hsl(var(--comunify-critical))",
  "comunify-text":            "hsl(var(--comunify-text))",
  "comunify-text-muted":      "hsl(var(--comunify-text-muted))",
  "comunify-bg":              "hsl(var(--comunify-bg))",
  "comunify-surface":         "hsl(var(--comunify-surface))",
  "comunify-border":          "hsl(var(--comunify-border))",
},
backgroundImage: {
  "comunify-gradient": "var(--comunify-gradient)",
},
fontFamily: {
  satoshi: ["var(--font-satoshi)", "ui-sans-serif", "system-ui", "sans-serif"],
  manrope: ["var(--font-manrope)", "ui-sans-serif", "system-ui", "sans-serif"],
  inter:   ["var(--font-inter)",   "ui-sans-serif", "system-ui", "sans-serif"],
},
borderRadius: {
  DEFAULT: "var(--radius)",
  lg: "var(--radius-lg)",
},
```

## 6. Component recipes

### Botón primario (gradient)
```tsx
className="bg-comunify-gradient text-comunify-primary-fg font-manrope font-semibold
           px-6 py-3 rounded-[var(--radius)] transition
           hover:brightness-110 hover:shadow-lg hover:shadow-comunify-primary/20"
```

### Botón secundario (outline)
```tsx
className="border border-comunify-primary text-comunify-primary font-manrope font-semibold
           px-6 py-3 rounded-[var(--radius)] hover:bg-comunify-primary/5"
```

### CTA conversion (coral)
```tsx
className="bg-comunify-accent text-white font-manrope font-semibold
           px-6 py-3 rounded-[var(--radius)] hover:brightness-95"
```

Reservar coral para **conversiones high-intent** (checkout, upsell, trial-start). NUNCA acciones neutras (cancel, back, edit).

### Card dashboard
```tsx
className="bg-comunify-surface border border-comunify-border rounded-lg p-6
           shadow-sm hover:shadow-md transition"
```

### Heading hero
```tsx
className="font-satoshi font-bold text-display text-comunify-text"
```

## 7. Reglas duras (do / don't)

**Do**
- Background app SIEMPRE `--comunify-bg`. Cards en `--comunify-surface`.
- Gradient sólo en hero + logo + onboarding progress.
- Coral (`accent`) sólo para CTA de conversión.
- Verde (`stable`) sólo para métricas positivas / health indicators.
- Texto cuerpo en `Inter` — NUNCA Satoshi para texto largo (mata legibilidad).

**Don't**
- Hardcodear `#7B2FF7` en componentes → usar `bg-comunify-primary`.
- Mezclar paletas de otros brands (Vitalia teal, Nicolify, etc.) en Comunify FE.
- Usar gradient como fondo de página completa.
- Aplicar coral a acciones destructivas (esas son `--comunify-critical`).
- Inventar tokens fuera de esta tabla. Token nuevo → editar este file primero.

## 8. Spanish neutro

Todo string UI sigue `.claude/rules/spanish-text.md` (tuteo LatAm, sin voseo). Brand voice de Comunify (creator-friendly, cálida) NO autoriza voseo en chrome UI — sólo en outputs de `sales_agent` cuando tenant lo configure.

## 9. Implementation handoff

| Paso | Path | Owner | Estado |
|---|---|---|---|
| 1. Crear `globals.css` con `:root` vars | `comunify/frontend/src/app/globals.css` | builder-frontend | TODO |
| 2. Importar `globals.css` en `layout.tsx` | `comunify/frontend/src/app/layout.tsx` | builder-frontend | TODO |
| 3. Cargar Satoshi (local) + Manrope/Inter (Google) | `comunify/frontend/src/app/layout.tsx` + `assets/fonts/` | builder-frontend | TODO |
| 4. Extender `tailwind.config.ts` (sección §5) | `comunify/frontend/tailwind.config.ts` | builder-frontend | TODO |
| 5. Migrar componentes con colores hardcoded | `comunify/frontend/src/**/*.tsx` (grep `#[0-9a-fA-F]{6}`) | builder-frontend | TODO |
| 6. Arch fitness test: prohibir HEX literales en componentes | `comunify/frontend/src/__tests__/architecture/` | builder-frontend | TODO |

Implementación efectiva: abrir story state=idea `comunify-design-system-cement` en `comunify/docs/product/stories/` → `/po-ux` redacta spec → `/architect` saca tickets → `/dev-team` ejecuta.

## 10. Referencias

- Brandbook raw (Chris brief 2026-05-16) — origen, descartado tras este resumen
- `core/luana-core-platform/src/luana_core_platform/design-tokens/` — tokens engine (futuro, cuando se lifteen patrones cross-brand)
- `.claude/rules/frontend-fsd.md` — FSD-Lite + Shadcn UI baseline
- `.claude/rules/spanish-text.md` — strings user-facing
