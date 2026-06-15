---
brand: comunify
story_id: comunify-shell-organism
module: platform
state: refining
story_type: ui-story
created: 2026-06-15
last_updated: 2026-06-15
parallel_safe: true
owner: /pm-comunify
next_handoff: /po-ux (UI shell mockup + spec)
surface: [frontend]
estimated_size: L
cap_target: comunify/shell-organism
cap_change_type: new
verification_nature: funcional
autonomous_mode: false
cast_ratified: true   # ADR-comunify-001-agentes-cast (Chris 2026-06-15)
input_spec_signed: true    # FIRMA 1 funcional (Chris 2026-06-15)
mockup_final_signed: false # FIRMA 2 pendiente (post sitemap ratificado)
artifacts:
  - ADR-comunify-001-agentes-cast.md (cast cementado)
  - 01-spec.md (RONDA 1 funcional · FIRMA 1)
  - navigation-tree.md (sitemap propuesto · pend. ratificación)
---

# Comunify — Shell-organism migration (R-shell · MVP)

## Spark

Comunify es la **única brand activa todavía en el paradigma dashboard viejo**. Su frontend
(`app/(dashboard)/{authority,cohorts,community,offers,ladder,subscriptions,voice,brand-studio,community-audit}`,
28 `page.tsx`, 10 áreas) shipped 2026-05-20 y **nunca migró al shell-organism agéntico** que nicolify
+ vitalia ya tienen. Consume **cero** `@luana/*` (nicolify consume 6: ui-kit, design-tokens, format,
hooks, schemas, api-client). No tiene shell-organism, ni routing `[tenantId]/(shell-organism)`, ni
features per-agente, ni skill `comunify-design-system`. Viola PARADIGM.md (trabajadores sobre un
sistema · mapa = 3 zonas · Ribbon de especialistas + supervisora).

Esta story levanta el **shell-organism MVP** de comunify: chrome consumiendo `@luana/ui-kit`
(incl. `organism/shell` ya lifteado 2026-06-11 — **consumir, NO mirror de nicolify**, anti-duplication),
routing tenant-scoped, nav de 3 zonas, Ribbon del cast comunify, sidebar supervisora, Config. Las 10
áreas dashboard se portan en stories siguientes (R-shell+1..N) — esta deja el shell **levantado** y
las tabs como shell/placeholder.

## Why now

- Chris pidió alinear comunify con la nueva base metodológica + de UI (sync con main hecho: wip/comunify 0/35 vs origin/main, HEAD 7501136e).
- nicolify/vitalia ya migraron; comunify es el rezagado → riesgo de mirror cuando se toque cualquier UI.
- El shell chrome compartido ya está en `@luana/ui-kit/organism/shell` (proposal migrated) → ventana óptima para consumir, no recrear.
- Backend agentic comunify ya existe (4 tools + 4 guardrails vía EP) — las acciones que los agentes invocan ya están; falta la cara (shell + cast).

## Decisiones de Chris (intake-handshake 2026-06-15 — ver chris-input.md)

1. **Path = Historia SDD completa** (refine → arch → build → audit → DoD live-verify). No spike.
2. **Drift cleanup = ahora**, plegado como **Ticket-0 hygiene** (con `pnpm install`-verify, no blind-delete):
   alinear lockfiles a vitalia (= sin lockfile frontend; root `pnpm-lock.yaml` es SSoT → quitar
   `comunify/frontend/{package-lock.json,pnpm-lock.yaml}`) + trackear `comunify/frontend/next-env.d.ts`
   (como nicolify/vitalia) + declarar deps `@luana/*` en `comunify/frontend/package.json`.
3. **Cast = comunify-específico** (personas propias creator economy, como nicolify con Abel/Brenda)
   → requiere ADR-comunify + catálogo ANTES de la UX del Ribbon. **BLOCKER de refining.**
4. **Scope = MVP shell + features stub** (esta story = shell up; features portados incremental).

## Scope hint (alcance probable, /po-ux lo refina)

**In scope (R-shell MVP)**
- T-0 hygiene: lockfiles + `next-env.d.ts` + deps `@luana/*` (con `pnpm install` verde).
- T-1 consumir `@luana/ui-kit` (incl. `organism/shell`) — reskin tokens comunify (morado `#7B2FF7` + azul).
- T-2 routing `app/[tenantId]/(shell-organism)/` (tenant-scoped, como nicolify/vitalia).
- T-3 Ribbon del cast comunify + sidebar supervisora (Luana orquestadora).
- T-4 nav 3 zonas (Agentes · Plataforma · Infraestructura) + Config tab.
- Tabs de agente = shell/placeholder (las 10 áreas dashboard se montan/portan después).

**Out of scope (stories siguientes R-shell+1..N)**
- Portar `(dashboard)/{authority,cohorts,community,offers,ladder,subscriptions,voice,brand-studio,community-audit}` a sus homes de agente.
- Retiro final del grupo `(dashboard)` viejo (se hace cuando todas las áreas migraron).

## Prior art / coordinación (de /pm-luana)

- Shell chrome compartido: `core/@luana/ui-kit/src/organism/shell` — **consumir vía import** (proposal ya migrated; NO nueva proposal).
- Referencia de port: `nicolify/frontend/src/app/[tenantId]/(shell-organism)/` + `nicolify/frontend/src/components/shared/shell-organism/` + skill `nicolify-design-system`.
- comunify necesita su propio skill `comunify-design-system` (nicolify/vitalia lo tienen; comunify no).
- Tokens comunify: `comunify/docs/architecture/design-system.md` (SSoT visual).

## Cast ratificado (ADR-comunify-001 · 2026-06-15)

Sidebar: **Luana** (supervisora+orquestadora+onboarding). Ribbon: **Nina** (estratega) ·
**Tomás** (atraer) · **Sofía** (vender) · **Bruno** (operar) · **Lucía** (retener) + tab **Plataforma**.
Mapeo 1:1 a cadena de valor canónica (vitalia/nicolify). Detalle: `ADR-comunify-001-agentes-cast.md`.

## Next action

`/po-ux` en curso. FIRMA 1 ✓ (funcional). Pendiente: ratificar `navigation-tree.md` (sitemap) →
**mockup creativo** (port re-temizado de @luana/ui-kit + tokens comunify + Ribbon del cast + sub-tabs
del sitemap, todas "Próximamente" salvo Luana) → **FIRMA 2** (final) → refining→refined → `/architect`.
Decisión de motor: Luana consume `core/luana-core-copilot /chat` (comunify-first, lift chat-store a @luana).
