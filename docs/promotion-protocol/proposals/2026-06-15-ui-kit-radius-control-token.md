---
proposal_id: 2026-06-15-ui-kit-radius-control-token
state: accepted                # ★ Chris GO 2026-06-15 ("arrancá ambos") — /pm-luana ejecuta el lift en worktree core efímero (scope M13: NO desde worktree de marca)
opened_date: 2026-06-15
opened_by: /architect (nicolify-r0-design-system-adoption)
ratified_by: chris
ratified_date: 2026-06-15

# Origen
origin_story: nicolify/docs/product/stories/nicolify-r0-design-system-adoption   # RN-7
origin_brands: [nicolify]                  # nicolify pide pill controls; vitalia/comunify stay md (no visual change)
relates_to: 2026-06-07-design-system-homologation.md   # accepted — esta es una pieza de enforcement de la misma doctrina (ADR-014)
sibling_proposal: 2026-06-12-ui-kit-entity-subnavbar-picker-slot.md   # mismo patrón slot-en-kit (cross-ref accent §B)

# Target
target_package: core/@luana/ui-kit + core/@luana/design-tokens
target_files:
  - core/@luana/ui-kit/src/{button,input,select,textarea}.tsx
  - core/@luana/design-tokens/src/radius.ts
  - core/@luana/ui-kit tailwind preset (utilidad rounded-control)
brands_affected: [nicolify, vitalia, comunify, lupulo]   # todas consumen los controls del kit → downstream-regression obligatoria
---

# Lift: `--radius-control` token brand-overridable en los controls de @luana/ui-kit

## Problema

Los átomos de control del kit (`Button`/`Input`/`Select`/`Textarea`) **hardcodean `rounded-md`**. Nicolify ratificó (FIRMA 2, 2026-06-15) un lenguaje visual de **controles fully-rounded (pill)**, coherente con tabs/chips/composer. Hoy es imposible sin (a) hardcodear pill en el kit (rompe vitalia/comunify) o (b) un mirror local (viola anti-duplication). Las **superficies** (card/group/panel) NO cambian — solo los controles.

## Cambio propuesto (chico, low-risk)

1. **`@luana/design-tokens` radius.ts** — agregar el nombre `control` a la escala de radios (nombre compartido, valor por marca).
2. **kit Button/Input/Select/Textarea** — `rounded-md` → `rounded-control` (= `border-radius: var(--radius-control)`).
3. **tailwind preset del kit** — mapear la utilidad `rounded-control` → `var(--radius-control)`.
4. **Cada brand globals.css define `--radius-control`** (brand-scoped, NO en el kit):
   - **nicolify** = `9999px` (pill) — se agrega en esta story (`nicolify-r0-design-system-adoption` T-1, ya brand-scoped).
   - **vitalia / comunify / lupulo** = `var(--radius)` (= md actual) → **cero cambio visual**.

> Salvaguarda: el default del kit cuando `--radius-control` no está definido debe ser `var(--radius-md, 0.625rem)` (= comportamiento actual) — ninguna marca rompe aunque no setee el token.

## Blast radius + downstream regression (auditor-downstream-regression.md)

`Button/Input/Select/Textarea` los consumen las 4 marcas. Obligatorio antes de bump:
- [ ] vitalia: controls renderizan `md` idéntico a hoy (golden/visual sin diff) — vitalia define `--radius-control: var(--radius)`.
- [ ] comunify: idem (define el token = `var(--radius)`).
- [ ] lupulo: placeholder — define el token defensivo.
- [ ] nicolify: controls renderizan pill (post-bump + dep upgrade).
- [ ] arch-fitness de cada marca verde.

## Secuencia (Chris ratificó "decouple + parallel" 2026-06-15)

1. `nicolify-r0-design-system-adoption` cierra `ready` y construye la adopción estructural **sin** depender de este lift (el token brand-scoped se setea; los controls quedan `rounded-md` hasta el bump).
2. `/pm-luana` acepta esta proposal → lift en worktree core efímero → bump `@luana/ui-kit` → regression cross-brand.
3. nicolify bumpea la dep → controls pill → el golden `atoms.png` (control-radius, hoy `blocked_on: kit-radius-control-lift`) + el **demo gate #37** (Abel convergence) corren cuando AMBOS tracks aterrizan.

## §B — Conditional add-on (NO bloqueante): accent-slot en EntitySubNavBar

El active-leaf del `EntitySubNavBar` usa `accent`/`primary` semánticos; el mockup nicolify ratificado muestra acento `agent-abel`. **Solo si** el golden con tokens semánticos no matchea → lift candidate: `EntitySubNavBar` acepta `accentToken`/`agentSlot` opcional (mismo patrón slot que `2026-06-12-ui-kit-entity-subnavbar-picker-slot.md`). Gateado en el golden `abel-icp-detail.png`. Tracked como `kit-accent-slot-lift` en `04-validators.yaml` de la story.

## No-go

- ❌ Hardcodear pill en el kit (rompe vitalia/comunify).
- ❌ Mirror local de los controls en nicolify (anti-duplication).
- ❌ Bump sin la regression cross-brand de arriba.
