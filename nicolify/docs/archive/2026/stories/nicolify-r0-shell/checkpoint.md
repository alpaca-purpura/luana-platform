---
story_id: nicolify-r0-shell
brand: nicolify
type: ui-story
state: done
phase: MERGED
release: R0
map_zone: infraestructura        # paradigma 3 zonas (ADR-nicolify-002) · shell = contenedor, no agente
map_box: plataforma-tecnica
architecture_pattern: ADR-nicolify-001
adr_001_compliance: partial-with-rationale   # divergencias R0 skeleton (BE/telemetría N/A · Tailwind v4 CSS-based) — ver 03-arch § Architecture Decisions
ratified_by_chris: true
ratified_visual_by_chris: true   # G1 mockup 5 tabs ratificado 2026-05-30
autonomous_mode: true            # ★ Chris opt-in 2026-05-30 ("arranca hasta el done")
autonomous_mode_chain: [dev-team, auditor, pm-merge]
autonomous_mode_ratified_by: chris
autonomous_mode_caps: {max_iterations_per_ticket: 10, max_audit_iterations: 3, max_total_cost_usd: 8.00, max_wall_clock_minutes: 240, on_cap_exceeded: "state=blocked + escalate Chris"}
last_artifact: dispatch-plan.md
ready_package:                    # ★ paquete ready cerrado 2026-05-30 (/architect)
  - 03-arch.md
  - 04-validators.yaml
  - 05-guidelines.md
  - 06-tickets.yaml
  - dispatch-plan.md
next_action: "/dev-team nicolify nicolify-r0-shell → build (T-0 dev-stack boot → T-1..T-6 FE · primary_agent builder-frontend). DoD: app funcional LIVE (smoke A0)."
priority: critical
cap_target: null
cap_change_type: new
depends_on: []                       # nicolify-r0-dev-stack ABSORBIDO como T-0 (2026-05-30) — sin blocker externo
r0_order: 2
parent_story: nicolify-r0-shell-organism   # design-story que cementó el contrato
merged_from:                         # fusión 2026-05-30 (ratificada Chris) — 7 stories R0 → 1
  - nicolify-r0-design-system-tokens   # contenedora original (renombrada → nicolify-r0-shell)
  - nicolify-r0-topbar
  - nicolify-r0-shell-layout-splitter
  - nicolify-r0-luana-chat
  - nicolify-r0-ribbon-subtabs
  - nicolify-r0-routing-empty-states
  - nicolify-r0-dev-stack              # absorbido como T-0 (2026-05-30) — para que la story termine con app funcional LIVE
spawned_at: 2026-05-30T02:28:00.000Z
spawned_by: pm-nicolify-r0-backlog
ssot_owner: /pm-nicolify
last_modified: '2026-05-30'
---

# nicolify-r0-shell — checkpoint

## Goal

Portar el **shell-organism agéntico completo** de Nicolify (esqueleto FE estático/navegable) reusando verbatim re-tematizado la base madura de Vitalia. Una sola story que entrega: design tokens + TopBar + layout dual-mode con splitter + panel orquestador de Luana (skeleton) + Ribbon de agentes + sub-tabs + routing + empty-states. SSoT de diseño: design-story `nicolify-r0-shell-organism` (done) + `SHELL-DESIGN-CONTRACT.md` + `ADR-nicolify-001` + mockup `shell.html`.

## Contexto

Story de **R0 (Fundación + shell agéntico)**. Reuse del patrón de Vitalia re-temizado (ver `nicolify/docs/architecture/{SHELL-DESIGN-CONTRACT.md, ADR-nicolify-001-shell-feature-architecture.md}` + design-story `nicolify-r0-shell-organism` + skill `nicolify-design-system`). En Vitalia el chat lateral vivió dentro de la story de layout — por eso el panel de Luana se fusiona acá, no queda como story aparte. Cargar skill `nicolify-design-system` antes de tocar FE. Gate G1 ADR-003 (mockup) ya satisfecho por la design-story (`mockups/shell.html` ratificado).

## Historias fusionadas (scope consolidado · ratificado Chris 2026-05-30)

Las 5 stubs auto-generadas del backlog R0 + la contenedora se consolidan acá (nunca se construyeron — eran `idea`/`refining`). Cada Goal se preserva verbatim para que `/po-ux` lo refine como un solo 01-spec con scenarios por bloque:

1. **Design tokens** (era `design-system-tokens`) — `globals.css` + `tailwind.config.ts` paleta nicolify.com (primario #635BFF, agentes, neutros slate) + League Spartan + Bree Serif + dark mode + ThemeToggle + Z-index de `@luana/design-tokens` + `_agent-tw-classes.ts` (JIT-safe · G3).
2. **TopBar** (era `topbar`) — `TopBarGlobal`: `LogoMark` (svg claro/oscuro) izq + `TenantSwitcher` (agencia, a la DERECHA) + `ThemeToggle`. `role=banner`.
3. **Layout + splitter** (era `shell-layout-splitter`) — `ShellOrganismLayout` dual-mode 50/50 + splitter resizable 3 estados (chat-collapsed/narrow/50-50, drag + snaps + C/R/F). Boundary `dynamic(ssr:false)` + store SSR-safe (G2 ADR-vitalia-006). Skeleton store-free.
4. **Panel Luana** (era `luana-chat`) — `LuanaSidebar` (panel orquestador izq): 3 estados `LuanaRail`/`LuanaHistory`/`LuanaChat` skeleton (`ChatHeader` + `MessageBubble` + `ChatComposer` + `TypingIndicator`). Único rostro: intención→delega→reporta. Avatar de Luana.
5. **Ribbon + sub-tabs** (era `ribbon-subtabs`) — Ribbon N1 (**Abel/Brenda/Christian/Sara/Norvil** + ConfigTab, agent-color border) + `SubTabsBar` N2 + `shell-routes.ts` (`AGENT_CATALOG` + `AGENT_SUBTABS` del navigation-tree). Avatares en el ribbon. (Sara incorporada 2026-05-30 · ADR-nicolify-002 D-D — el stub original listaba 4.)
6. **Routing + empty-states** (era `routing-empty-states`) — Routing `[tenantId]/(shell-organism)/[agent]/[subtab]/page.tsx` (Next.js 16 + clerkMiddleware + not-found jerárquico + landing default) + empty-states elegantes por sub-tab del nav-tree.

> Dependencia interna (informativa, ya resuelta al ser una sola story): tokens → topbar/layout → panel-luana/ribbon → routing. `dev-stack` (BE :8001 + FE :3001) sigue siendo el único blocker externo.

## Prior art (reuse, NO mirror)

- **Vitalia** `vitalia/frontend/` + archive stories R0/fase1 (`vitalia-fase1-design-tokens-theme`, `vitalia-fase1-topbar-global`, `vitalia-fase1-shell-layout-5050`, `vitalia-shell-state-persistence`, `vitalia-fase1-ribbon-6-tabs`, `vitalia-fase1-routing-shell`) — fuente verbatim re-tematizada. Vitalia los shippeó como stories separadas; Nicolify los porta como una (el código ya existe maduro).
- **Engine** `@luana/design-tokens` + `@luana/ui-kit` (consumir, NO recrear) · lift `core/luana-core-ui` diferido post-R0 (N=2).
- Scan detallado al refinar (`.claude/rules/anti-duplication-refining.md`).

## Next action

`/po-ux nicolify nicolify-r0-shell` → 01-spec unificado con scenarios por bloque (1-6) + wireframes (reuse mockup `shell.html`) + Playwright graders. Prior-art scan obligatorio documentado. Gate `shell-feature-architecture.md` (cita ADR-nicolify-001) aplica.
