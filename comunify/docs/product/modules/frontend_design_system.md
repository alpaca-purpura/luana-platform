---
module: frontend_design_system
brand: comunify
last_updated: 2026-05-20
---

# frontend_design_system — Tokens + Tailwind v4 utilities + arch fitness

Sistema de design tokens Comunify cementado en `comunify/frontend/src/app/globals.css` (`@theme` block Tailwind v4): 15 CSS variables `--color-comunify-*` (paleta morado/azul/coral/verde + neutros + semánticos) + 3 font slots (Satoshi via Plus Jakarta Sans fallback + Manrope + Inter) + gradient signature + radius. Pipeline PostCSS via `@tailwindcss/postcss` plugin emite utilities `.bg-comunify-X` / `.text-comunify-X` / `.font-X` / `.rounded-X` runtime. Arch fitness ratchet anti-stock-palette + anti-HEX-literal con allowlist `[]` shrink-only.

## Surface

- **CSS tokens SSoT:** `comunify/frontend/src/app/globals.css` — `@theme` block v4 con 15 vars HSL + radius + gradient HEX (allowlisted como SSoT)
- **PostCSS config:** `comunify/frontend/postcss.config.mjs` — declara `@tailwindcss/postcss` (single plugin)
- **Font loading:** `comunify/frontend/src/app/layout.tsx` — `next/font/google` 3 families con `.variable` aplicado a `<html>` className
- **Arch fitness:** `comunify/frontend/src/__tests__/architecture/test-no-stock-palette.test.ts` + `_stock-palette-allowlist.json` (baseline `[]`)
- **Playwright smoke:** `comunify/frontend/e2e/specs/smoke/design-system.smoke.spec.ts` (3 tests runtime + bundle assertion)
- **Migration completada:** 23 archivos FE migrated stock palette → comunify tokens (91 occurrences → 0)

## Capabilities

<!-- auto-list:start -->
- `design-system-cement` (live · 2026-05-18) — tokens SSoT + 23 archivos migrados + arch fitness ratchet
- `tailwind-v4-tokens` (live · 2026-05-18) — hot-fix activación runtime utilities (PostCSS wiring)
- `a11y-contrast-cement` (live · 2026-05-20) — 5 tokens `*-text` + Camino B universal + arch fitness anti-low-contrast (opción C híbrida)
<!-- auto-list:end -->

## Cross-brand status

Patrón Tailwind v4 + PostCSS plugin wiring es candidate **promotable cross-brand**:
- **Vitalia:** mismo gap latente (postcss.config inexistente, @tailwindcss/postcss devDep missing)
- **Brands futuras (saasora/inmoflow/retailly/fixia/guestly/fitflow):** deberían heredar el scaffold completo desde `_pm-brand-template/` para evitar el silent-ship pattern detected aquí

Ver `comunify/docs/learnings/2026-05-18-tailwind-v4-postcss-wiring-gap.md` (promotable=yes) y ping `/pm-luana`.

**a11y-contrast-cement promotable candidates** (post-merge a evaluar):
- **Camino B universal pattern** (outline buttons + badges + alerts con `bg-X/10 border + text-X-text`) — lifteable a `_pm-brand-template/` para brands futuras.
- **Arch fitness anti-low-contrast** test pattern (6 HARD-blocked + allowlist `[]` + magic comment escape) — lifteable a `core/luana-core-platform/design-tokens/` cuando 2+ brands lo necesiten.
