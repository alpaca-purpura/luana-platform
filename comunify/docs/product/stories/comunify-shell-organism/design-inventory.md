# Comunify Shell — Design Inventory (tokens · átomos · moléculas · organismos)

> **Goldens del shell MVP** (Chris pidió 2026-06-15). Lo que el mockup usa = lo que dev-team construye.
> Regla de oro: **CONSUMIR de `@luana/ui-kit` vía import — NO recrear** (`.claude/rules/anti-duplication.md`).
> comunify solo aporta: **tokens de marca** + **wrapper/config** (cast, nav-tree, chat-store). Todo lo demás ya existe en el kit.
> Graduará a `comunify/docs/architecture/SHELL-DESIGN-CONTRACT.md` cuando `/architect` cierre el ready package.

---

## 1. Tokens (comunify — SSoT `comunify/docs/architecture/design-system.md` + globals.css)

### Color (HSL channels · `hsl(var(--x))`)
| Token | Light | Uso |
|---|---|---|
| `--comunify-primary` | `264 92% 58%` (#7B2FF7) | Luana · primario · gradiente |
| `--comunify-primary-hover` | `254 79% 49%` (#5A1EDC) | hover primario |
| `--comunify-purple-mid` | `252 100% 62%` (#6A3CFF) | **agent Nina** · gradient mid |
| `--comunify-blue` | `217 95% 58%` (#2D7FF9) | **agent Tomás** · acento tech |
| `--comunify-blue-deep` | `220 84% 45%` (#1246D6) | **agent Lucía** |
| `--comunify-stable` | `152 80% 43%` (#16C784) | **agent Sofía** · success |
| `--comunify-warning` | `38 92% 50%` (#F59E0B aprox) | **agent Bruno** · warning |
| `--comunify-critical` | `0 84% 60%` (#EF4444) | error/moderación (NO color de agente) |
| `--agent-{luana,nina,tomas,sofia,bruno,lucia}` | = arriba | borde/ring por agente (RibbonTab, avatar) |
| neutrales `--bg/--panel/--line/--muted/--ink` | ver globals | superficies shell |

### Dark mode (override `.dark` — cement: bordes vía token, no blancos)
`--bg:240 18% 8% · --panel:240 16% 12% · --line:240 12% 22% · --muted:240 8% 62% · --ink:240 20% 96%`.
Regla: `*{border-color:hsl(var(--line))}` — bordes adaptan a tema.

### Radius (★ CAMBIO ratificado Chris 2026-06-15)
- **Controles → pill** (`rounded-full`): botones, icon-buttons (círculos), Ribbon tabs, sub-tabs, composer, inputs, selects, dropdowns, CTA.
- **Cards / burbujas de chat / contenedores → `--radius-lg` (1.25rem)** (pill en card se ve mal).
- **Implica:** actualizar `--radius` del design-system (era 12px) + **verificar que `@luana/ui-kit` honre el radio de marca vía token** (si no → divergencia del kit = anti-duplication). `/architect` lo resuelve token-driven.

### Tipografía
Satoshi (display/H1 700 · self-host `next/font/local`) · Manrope (headings 600/700 · google) · Inter (body 400/500 · google).

### Gradient signature (logo + hero only)
`--comunify-gradient: linear-gradient(135deg,#7B2FF7 0%,#6A3CFF 35%,#2D7FF9 70%,#1E5EFF 100%)`.

### Logos (reales · `comunify/frontend/public/brand/`)
`Logo.png` (isotipo · TopBar) · `Logo.ico` (favicon) · `Logo_fondo_claro.png` + `Logo_fondo_oscuro.png` (full stacked · login/splash, swap por tema).

---

## 2. Átomos — CONSUMIR de `@luana/ui-kit` (`core/@luana/ui-kit/src/`)

Usados por el shell MVP (import, no recrear):
`button` · `input` · `textarea` · `select` (canónico, NO `<select>` nativo) · `badge` · `avatar` · `tooltip` · `label` · `separator` · `skeleton` · `switch` · `dropdown-menu` · `scroll-area` · `sonner` (toasts).

Disponibles para hojas futuras (no MVP): `form` · `dialog` · `sheet` · `popover` · `command` · `table` · `tabs` · `calendar` · `checkbox` · `radio-group` · `slider` · `progress` · `currency-selector` · `timezone-select` · `smart-datetime-picker` · `inline-editable` · `rich-select` · `AutosaveBadge` · `FloatingAutosaveIndicator` · `field-info`.

> Todos respetan tokens. comunify NO crea átomos nuevos para el shell — si falta uno, se levanta a `@luana/ui-kit` vía `/pm-luana`.

---

## 3. Moléculas — CONSUMIR de `@luana/ui-kit/organism/shell/`

Usadas por el shell MVP: `RibbonTab` · `ConfigTab` · `SubTab` · `SubSubTab` · `ChatHeader` · `MessageBubble` · `TypingIndicator` · `ChatComposer` · `EmptyState` / `EmptyStateInline` · `PlaceholderCard` · `DelegateMarker` (chip "delega en {agente}") · `StatusDot` · `TogglePill` · `HistoryGroup` / `HistoryItem` · `SupervisorCollapsedStrip`.

Brand-provided (comunify, derivados): `AgentAvatar` (consume catálogo cast) · `TenantSwitcher` (single-user → display del creator) · `LogoMark` (isotipo Logo.png) · `ThemeToggle`.

---

## 4. Organismos — CONSUMIR de `@luana/ui-kit/organism/shell/`

`TopBarShell` · `SupervisorSidebar` (= "LuanaSidebar"; estados collapsed/rail/history/full) · `ChatPanel` (+ `ChatMessages`) · `Ribbon` · `SubTabsBar` · `SubSubTabsBar` · `ShellLayout` / `ShellLayoutClient` (`ShellOrganismLayout` · splitter dual-mode · `dynamic({ssr:false})` boundary · skeleton store-free) · `AppPanelSlot` · `EntityWorkspaceLayout` + `EntitySubNavBar` (list→detail · para hojas futuras).

Hooks/util del kit: `create-shell-store` · `routing.ts` · `useKeyboardShortcuts` (C/R/F) · `useViewportGuard` · `types.ts`.

---

## 5. comunify-specific (lo único net-new que dev-team escribe)

| Pieza | Path destino | Nota |
|---|---|---|
| Tokens marca | `comunify/frontend/src/app/globals.css` + `tailwind.config.ts` | colores + radius pill + fonts |
| Catálogo cast | `comunify/frontend/src/.../agents.ts` (o config) | ADR-comunify-001 (slug/color/avatar/label función) |
| Nav-tree / rutas | `comunify/frontend/src/lib/routing/shell-routes.ts` | sitemap v2 (`navigation-tree.md`) |
| Avatares | `comunify/frontend/public/agents/{slug}/avatar.svg` | placeholders SVG (Chris da finales) |
| **chat-store real** | `comunify/frontend/src/stores/chat-store.ts` | SSE → `core copilot /chat`. **LIFT CANDIDATE → `@luana`** (vitalia/nicolify cambian su mock por este) |
| Wrapper shell | `comunify/frontend/src/app/[tenantId]/(shell-organism)/` | monta organismos del kit + inyecta config |
| BE copilot mount | `comunify/backend/src/modules/comunify/copilot/` | monta `core/luana-core-copilot /chat` en `/api/v1/comunify/copilot` (thin) |

---

## 6. Goldens para dev-team

1. **Mockup FINAL** `mockups/shell.html` (firmado FIRMA 2) = golden visual. "Lo que ves = lo que se programa".
2. **Tokens** (sección 1) = golden de color/radius/fonts. Cero hardcode hex en componentes.
3. **Cast** (`ADR-comunify-001`) + **sitemap v2** (`navigation-tree.md`) = golden de estructura/nav.
4. **@luana/ui-kit** (secciones 2-4) = source of truth de átomos/moléculas/organismos — **consumir, no recrear** (auditor Cat 12 mirror scan).
5. **Decisiones funcionales** (`01-spec.md` § Mapa funcional + RONDA 2) = golden de comportamiento (Luana viva conversa+anuncia · landing · reemplazo · single-user · tabs "Próximamente").
