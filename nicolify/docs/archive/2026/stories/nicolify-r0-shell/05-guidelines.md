# 05-guidelines — nicolify-r0-shell

> Guía enforceable para `builder-frontend`. FE-ONLY. Port verbatim re-tematizado del shell de Vitalia → Nicolify.
> Naturaleza: esqueleto estático (cero BE, cero runtime agéntico).

## must_load_skills (verbatim · enforceable)

```yaml
- nicolify-design-system          # SSoT tokens + shell organism + catálogo 5 agentes + wrapper fidelity (CARGAR SÍ O SÍ)
- frontend-expert                 # FSD-Lite, Server-First, React Query/Zustand split, SSR-safe store
- playwright-expert               # E2E regression + axe (test_construction_plan)
- tessl__react-patterns
- tessl__shadcn-ui
- tessl__tailwind
- tessl__vitest
- tessl__zod
- tessl__nextjs-app-router-modularization
# Rules (overlay nicolify + raíz):
- nicolify/.claude/rules/shell-feature-architecture.md   # ADR-nicolify-001 gate (G0/G1/G2/G3)
- .claude/rules/frontend-fsd.md
- .claude/rules/frontend-visual-fidelity.md               # design-system-first + mockup adherence + scope discipline
- .claude/rules/spanish-text.md                           # tuteo, sin voseo
- .claude/rules/tdd-mandatory.md
- .claude/rules/test-design-doctrine.md                   # matriz naturaleza→tests + "verificación real ≠ HTTP 200"
- .claude/rules/anti-duplication.md                       # consumir @luana, port re-tematizado (no mirror cross-brand)
- .claude/rules/anti-orphan-integration.md                # CONN (shell es entry point + organismos entre sí)
```

## must_load_artifacts

```yaml
- "nicolify/docs/product/stories/nicolify-r0-shell/01-spec.md"        # scenarios A-F + microcopy + routing SSoT + componentes
- "nicolify/docs/product/stories/nicolify-r0-shell/03-arch.md"        # contrato FE + file structure + integration design + ADR divergencias
- "nicolify/docs/product/stories/nicolify-r0-shell/04-validators.yaml § test_construction_plan + playwright_visual_scope"
- "nicolify/docs/architecture/SHELL-DESIGN-CONTRACT.md"              # atomic design + tokens + catálogo agentes
- "nicolify/docs/architecture/ADR-nicolify-001-shell-feature-architecture.md"  # 9 secciones + G1/G2/G3
- "nicolify/docs/product/stories/nicolify-r0-shell-organism/navigation-tree.md"   # AGENT_SUBTABS (★ Sara solo [proyectos] en R0)
- "nicolify/docs/product/stories/nicolify-r0-shell-organism/mockups/shell.html"   # mockup ratificado (visual golden source)
```

## Patterns REQUIRED

### Port re-tematizado (causa #1 de pérdida — NO reinventar simplificado)
- Portar VERBATIM de `vitalia/frontend/src/components/shared/shell-organism/{Componente}.tsx` → `nicolify/frontend/src/components/shared/shell-organism/`, luego **re-tematizar** (tokens nicolify.com + 5 agentes Revenue/Ops + Valeria→Luana).
- Fuentes de wrapper visual (read-only · re-tematizar): `vitalia/.../shell-organism/{TopBarGlobal,Ribbon,SubTabsBar,ShellOrganismLayout*,ValeriaSidebar,Valeria{Rail,History,Chat}}.tsx` + mockup `shell.html`.
- Renombrar: `ValeriaSidebar→LuanaSidebar`, `ValeriaRail→LuanaRail`, `ValeriaHistory→LuanaHistory`, `ValeriaChat→LuanaChat`.

### Tokens (G3 + Tailwind v4)
- Tokens nicolify.com en `globals.css` vía Tailwind v4 (`@theme`/`@layer` — NO `tailwind.config.ts`). Paleta: primario `#635BFF` indigo + `#A855F7` púrpura · agent-colors (abel `#A855F7` · brenda `#22C55E` · christian `#3B82F6` · sara `#F59E0B` · norvil `#EC4899` · config `#64748b` · luana `#635BFF`). Fuentes League Spartan + Bree Serif.
- Agent-color en componentes vía `_agent-tw-classes.ts` (static lookup → class literals completas). **NUNCA** template literals (`` `bg-agent-${slug}` `` purga JIT).
- Z-index de `@luana/design-tokens` (`Z_INDEX`). Cero hex/px nuevo fuera de tokens.

### Átomos / engine (consumir, NO recrear)
- Átomos de `@luana/ui-kit` (Button, Avatar, Tooltip, Sheet, ScrollArea, Skeleton, Input, Separator…). Si falta primitiva → Shadcn estándar en `components/ui/` (NO `<div>` crudo).
- SSR-safe store: `createSsrSafePersistedStore` + `useStoreHydration` de `@luana/hooks` (NO recrear).

### Routing (Next.js 16 · Server-First)
- Route group `(shell-organism)/[agent]/[subtab]/page.tsx`. Server Component default. `params: Promise<>` → `await`.
- `not-found.tsx` jerárquico por segmento (root · [agent] · [subtab]) — shell chrome intacto en 404.
- SSoT routing en `shell-routes.ts` (`AGENT_CATALOG` + `AGENT_SUBTABS` + guards). NUNCA hardcodear sub-tabs/agentes fuera de ahí.
- N3-static via `SubSubTabsBar` cuando aplique (vacío en R0). NUNCA Shadcn `Tabs` internas en la hoja.
- Default landing: `christian/pipeline`. Sara solo `[proyectos]`. AGENT_CATALOG: `[abel, brenda, christian, sara, norvil, config]` (Luana NO es tab).

### Data layer split
- Server data → React Query · UI state (splitter/drawer/luana state) → Zustand (`useShellStore`) · URL state → segments. NUNCA Zustand para data fetched.
- R0 skeleton: cero fetch de datos. `LuanaHistory` usa `_mock-conversations.ts` o empty-state.

### SSR-safe (G2)
- Boundary `dynamic({ssr:false})` en `ShellOrganismLayout.tsx`. Skeleton del boundary = 100% store-free (no suscribe `useShellStore`). `useStoreHydration(useShellStore)` dentro del chunk client.
- Storage key: `nicolify-shell-state`. partialize: solo state fields (sin setters, sin `_hasHydrated`).

### Splitter
- `react-resizable-panels@^4.11.1` (Group/Panel/Separator + `useGroupRef` + `setLayout` imperativo para snap-up en hidratación). Hit-area handle ≥8px (línea visible 4px). `aria-label="Redimensionar paneles"`. Atajos C/R/F.

### Accessibility + i18n
- `role=banner` (TopBar) · `role=complementary` (LuanaSidebar) · `role=tablist`/`tab` (Ribbon, roving tabindex) · `role=main` (`#main-content`). Skip-link "Saltar al contenido". Focus ring `focus:ring-2 focus:ring-primary`.
- Microcopy tuteo (Spanish neutro) — ver `01-spec.md § Microcopy` verbatim. Prohibido voseo (`escribile→escríbele`).

### Avatares
- `AgentAvatar` con fallback a inicial (`bg-agent-{slug}-soft` + letra) si el asset 404 (cubre gap Sara). Copiar placeholders SVG de `nicolify-r0-shell-organism/mockups/assets/agents/` → `public/agents/{slug}/avatar.svg`.

### TDD (RED first)
- Vitest unit (store + lib + componente) RED antes de implementar. E2E regression RED antes de la ruta. Verificación REAL: ejercer la acción (navegar/toggle/drag), no "render OK". E2E que mockean el backend = falso verde — R0 no hace fetch, pero las navegaciones SÍ se ejercen de verdad.

## Patterns FORBIDDEN

- ❌ Reinventar el wrapper del shell simplificado (grises en vez de tokens · 50/50 hardcoded · chat inventado). PORTAR verbatim de Vitalia.
- ❌ `import` desde `vitalia/frontend/` (cross-brand ban). El port es filesystem copy + re-tematización, NUNCA import.
- ❌ Editar `core/@luana/*` o recrear primitivas/factory/z-index (lift via /pm-luana). El lift del shell a `core/luana-core-ui` está DIFERIDO post-R0 — NO proponerlo, solo notar candidato.
- ❌ Template literals en class strings de Tailwind (`` `bg-agent-${slug}` ``) — purga JIT. Usar `_agent-tw-classes.ts`.
- ❌ `persist` raw de Zustand (sobreescribe localStorage con default en SSR). Usar `createSsrSafePersistedStore`.
- ❌ Suscribir stores en el skeleton del boundary `ssr:false`.
- ❌ Shadcn `Tabs` internas en la hoja para agrupar sub-secciones (es N3-static SubSubTabsBar).
- ❌ Hardcodear sub-tabs/agentes fuera de `shell-routes.ts`.
- ❌ Tocar `nicolify/backend/**`, `modules/{copilot,sales_agent}/**`, telemetría `copilot_trace_event` (engine). Telemetría futura = `nicolify_growth_studio_event`.
- ❌ Hacer funcional el ChatComposer / cablear agentes / fetch de datos (es R1+).
- ❌ Voseo en UI. `PhiRepositoryBase`/dual-filter clínico (eso es Vitalia · Nicolify = tenant-isolation raíz + guardrails agénticos).
- ❌ Componentes `Valeria*` (crear `Luana*` re-tematizados). Catálogo/colores/assets de agentes Vitalia.

## Files in scope

```
ALLOWED (escribir):
  nicolify/frontend/package.json                              # + react-resizable-panels@^4.11.1
  nicolify/frontend/src/app/globals.css                       # tokens nicolify
  nicolify/frontend/src/app/[tenantId]/(shell-organism)/**    # route group
  nicolify/frontend/src/lib/routing/shell-routes.ts           # SSoT routing
  nicolify/frontend/src/stores/shell-store.ts (+ __tests__)
  nicolify/frontend/src/components/shared/shell-organism/**   # port re-tematizado
  nicolify/frontend/src/components/shared/agents/**           # AgentAvatar reuse
  nicolify/frontend/src/__tests__/architecture/**             # EXTEND arch fitness
  nicolify/frontend/public/agents/**                          # avatares placeholder
  nicolify/frontend/public/nico-assets/**                     # logos LogoMark
  nicolify/frontend/e2e/regression/nicolify-r0-shell/**       # 20 specs

FORBIDDEN (NO tocar):
  nicolify/frontend/src/components/ui/**                       # primitivas @luana (escalate si falta)
  core/@luana/**                                               # engine (lift via /pm-luana)
  vitalia/**                                                   # cross-brand (LEER para portar, NUNCA escribir)
  nicolify/backend/**                                          # FE-only story
  nicolify/frontend/src/app/{sign-in,sign-up,api}/**           # esqueleto base, fuera de scope
```

## Precondición (blocker externo)

Todos los tickets bloqueados por `nicolify-r0-dev-stack` (BE :8001 + FE :3001 + Clerk + alembic baseline) — **NO es ticket de esta story**, es precondición. `developing` no arranca hasta que dev-stack esté verde.
