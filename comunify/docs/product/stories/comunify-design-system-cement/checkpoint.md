---
brand: comunify
story_id: comunify-design-system-cement
state: idea
created: 2026-05-16
last_updated: 2026-05-16
parallel_safe: true
owner: /pm-comunify
next_handoff: /po-ux
surface: [frontend]
estimated_size: M
---

# Comunify — Design system cement (FE tokens + tipografía + migración)

## Spark

El brandbook de Comunify (morado + azul + acentos coral/verde + stack Satoshi/Manrope/Inter) ya está resumido en `comunify/docs/architecture/design-system.md` (SSoT). El `tailwind.config.ts` declara 5 slots `--comunify-*` vacíos (placeholder de Story 12 — comentario `T-fe-3`). El FE actual usa la paleta Tailwind stock (gray/green/yellow/red) — no hay HEX hardcoded ni identidad Comunify visible en componentes.

Esta story cementa los tokens en código: CSS vars + fuentes Next + migración de las ~52 ocurrencias de clases stock a tokens semánticos `comunify-*`, todo respaldado por un arch fitness test que prohíba regresiones (HEX literales + colores stock fuera de allowlist).

## Why now

- Story 12 dejó marker `T-fe-3` que nunca se ejecutó (slots vacíos en `tailwind.config.ts`).
- Comunify se ve genérico (gris Tailwind por default) y eso baja el efecto premium que vende a creators/coaches.
- Próximas stories de FE (onboarding refresh, dashboard creator) van a multiplicar la deuda si no cementamos ahora.
- 0 HEX hardcoded actuales = ventana óptima para arch fitness ratchet (allowlist arranca limpia).

## Scope hint (alcance probable, /po-ux lo refina)

**In scope**
- `comunify/frontend/src/app/globals.css` (crear) con `:root` CSS vars per `design-system.md` §4.
- `comunify/frontend/src/app/layout.tsx`: cargar Satoshi (local) + Manrope/Inter (next/font/google) + importar globals.
- `comunify/frontend/tailwind.config.ts`: extender 15 slots de color + `backgroundImage.comunify-gradient` + `fontFamily.{satoshi,manrope,inter}` + `borderRadius`.
- `comunify/frontend/src/assets/fonts/Satoshi-Bold.woff2` (asset binario — Chris provee).
- Migración: ~52 ocurrencias de `(bg|text|border)-(gray|green|yellow|red)-NNN` en 56 .tsx → tokens `comunify-*` semánticos (gray→`text|bg|border`, green→`stable`, yellow→`warning`, red→`critical`).
- Arch fitness: `comunify/frontend/src/__tests__/architecture/test-no-stock-palette.test.ts` (allowlist shrink-only, prohíbe `bg-gray-*`/`text-gray-*`/etc. en componentes excepto allowlist explícita).
- Onboarding wizard (4 steps existentes en `app/onboarding/`): aplicar `bg-comunify-gradient` progress bar + hero del step 1.
- Dashboard cards (~20 archivos en `app/(dashboard)/`): aplicar `bg-comunify-surface` + `border-comunify-border`.
- Verificación visual: smoke E2E captura screenshot landing + dashboard + onboarding (Playwright `--update-snapshots` baseline nuevo).

**Out of scope (split a futuras stories si surgen)**
- Dark mode (ADR separado cuando se demande).
- Logo wordmark Comunify (asset SVG — pendiente diseño, separado).
- Animaciones gradient (Framer Motion) — primero estático, luego iteramos.
- Lift de tokens a `core/luana-core-platform/design-tokens/` cross-brand — requiere `/pm-luana` promotion proposal, no es esta story.
- Migración paralela de paletas en otros brands.

## Inventario actual (snapshot 2026-05-16)

| Surface                                            | Estado actual                                              | Acción |
|---|---|---|
| `tailwind.config.ts`                               | 5 slots `--comunify-*` vacíos (marker `T-fe-3`)            | Extender a 15 + gradient + fonts + radius |
| `globals.css`                                      | No existe                                                  | Crear con `:root` vars |
| `layout.tsx`                                       | No carga fuentes custom                                    | Cargar Satoshi local + Manrope/Inter Google |
| Componentes FE                                     | 56 .tsx, 0 HEX hardcoded, ~52 usos Tailwind stock          | Migrar a tokens semánticos |
| Arch fitness FE                                    | 1 test existente (`__tests__/components/`)                 | Agregar `test-no-stock-palette.test.ts` |
| Assets fuentes                                     | No existen                                                 | Chris provee `Satoshi-Bold.woff2` |

## Open questions (para /po-ux + Chris)

1. **Satoshi licensing:** ¿usar Satoshi (Fontshare free for personal/comm) o alternativa libre Plus Jakarta Sans? Decision impacta legal review + bundle size.
2. **Gradient en hero landing público:** ¿full-bleed o contenido sobre `bg-comunify-bg` con gradient sólo en el CTA? (Brandbook recomienda no abusar.)
3. **Dashboard charts:** ¿`comunify-blue` para series neutras + `comunify-stable` para positivas, o quedan los colores stock de la lib de charts? (Define paleta de viz.)
4. **Migración de los 20 archivos `app/(dashboard)/`:** ¿1 ticket grande o split por sub-area (cards, tables, nav, forms)? `/architect` decide al sacar 06-tickets.

## Next action

Chris dice "refinemos comunify-design-system-cement" → `/pm-comunify` transition state=idea→refining + handoff `/po-ux` para redactar `01-spec.md` (UI std story con Gherkin + wireframes inline de onboarding/dashboard post-cement).

## Bitácora

- 2026-05-16: story abierta state=idea por `/pm-comunify`. Origen: brandbook Chris brief 2026-05-16 → resumido a `comunify/docs/architecture/design-system.md`. Inventario FE: 56 .tsx, 0 HEX, ~52 usos paleta stock, slots tailwind vacíos desde Story 12 (`T-fe-3` nunca ejecutado).
