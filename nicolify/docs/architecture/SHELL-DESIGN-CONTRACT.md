# Nicolify — SHELL DESIGN CONTRACT

> **SSoT atomic-design del shell-organism agéntico de Nicolify.** Qué componentes existen, sus tokens, el modelo de navegación y el catálogo de agentes. Ratificado por Chris 2026-05-29 (mockup `nicolify/docs/product/stories/nicolify-r0-shell-organism/mockups/shell.html`).
>
> Reuse del patrón de Vitalia (`vitalia/docs/architecture/SHELL-DESIGN-CONTRACT.md`) re-temizado a la marca Nicolify (nicolify.com). Arquitectura del patrón por sub-tab: `ADR-nicolify-001`. Carga el skill `nicolify-design-system` antes de tocar `nicolify/frontend/src/**`.

## 1. Visión del shell

Shell **dual-mode agéntico**: panel izquierdo = **Luana** (chat orquestador persistente, único rostro, NO está en el Ribbon) · panel derecho = **App** (Ribbon de 4 agentes expertos + Configurar · sub-tabs · contenido). Layout 50/50 con splitter resizable de 3 estados.

```
┌────────────────────────────────────────────────────────────────┐
│ TopBar:  [logo Nicolify]            [splitter][tema][agencia ▾]  │
├──────────────────────┬─────────── splitter (drag) ──────────────┤
│  LUANA (orquestadora) │  N1 Ribbon: Abel·Brenda·Christian·Norvil·│
│  chat persistente     │             Configurar                  │
│  rail/history/chat     ├─────────────────────────────────────────┤
│                       │  N2 SubTabsBar (del agente activo)      │
│                       ├─────────────────────────────────────────┤
│                       │  N3 SubSubTabsBar (opcional · 3+ vistas) │
│                       ├─────────────────────────────────────────┤
│                       │  Hoja (page.tsx) — contenido            │
└──────────────────────┴─────────────────────────────────────────┘
  Layout: dual-mode 50/50 · splitter resizable (chat-collapsed/narrow/50-50)
```

## 2. Tokens (autoridad)

| Qué | SSoT | Valor |
|---|---|---|
| Colores / tipografía / radios | `nicolify/frontend/src/app/globals.css` **(a crear en R0)** | CSS vars `:root` + `.dark`. Paleta **nicolify.com**. |
| Wiring vars → Tailwind | `nicolify/frontend/tailwind.config.ts` **(a crear en R0)** | `hsl(var(--*))` o hex directo. |
| Lookup agent-color JIT-safe | `components/shared/shell-organism/_agent-tw-classes.ts` **(a crear)** | static helpers · NUNCA template literals. |
| Z-index | `@luana/design-tokens` → `Z_INDEX` | consumir del engine. |

**Paleta (nicolify.com):** primario indigo **`#635BFF`** + púrpura **`#A855F7`** (gradiente) · neutros grises fríos (slate) · fondo blanco / dark deep-indigo · acentos azul `#3B82F6` / verde `#22C55E` / rosa `#EC4899`.
**Fuentes:** **League Spartan** (display/UI · 400-800) + **Bree Serif** (serif acento) — Google Fonts.

## 3. Átomos — `@luana/ui-kit` (consumir, NO recrear)

`Accordion · Alert · AlertDialog · Avatar · Badge · Button · Calendar · Card · Chart · Checkbox · Collapsible · Command · CurrencySelector · DetailPanel · Dialog · DropdownMenu · Form · Input · Label · LoadingButton · Popover · Progress · RadioGroup · RichSelect · ScrollArea · Select · Separator · Sheet · Skeleton · Slider · SmartDatetimePicker · Sonner · Switch · Table · Tabs · Textarea · TimezoneSelect · Tooltip` (+ más).

→ Si falta una primitiva, agregar Shadcn estándar en `components/ui/` (no `<div>` crudo). `Tabs` NO se usa para sub-secciones de una hoja (eso es N3-static).

## 4. Moléculas + Organismos (a crear en R0 · `components/shared/shell-organism/`)

**Moléculas:** `LogoMark` · `TenantSwitcher` (+ `TenantBadge`, `TenantOption`) · `ThemeToggle` · `RibbonTab` · `ConfigTab` · `SubTab` · `SubSubTab` · `AgentAvatar` · `StatusDot` · `ChatHeader` · `MessageBubble` · `TypingIndicator` · `ChatComposer` · `ChatStarters` · `EmptyState` · `PlaceholderCard` · `DelegateMarker`.

**Organismos:**
| Organismo | Rol |
|---|---|
| `TopBarGlobal` | LogoMark (izq) + [splitter control · ThemeToggle · TenantSwitcher] (der). `role="banner"`. variant `interactive`/`skeleton` (skeleton NO suscribe stores). |
| `LuanaSidebar` | Panel orquestador izq · 3 estados (`collapsed`→`LuanaRail` / `history`→`LuanaHistory` / `full`→`LuanaChat`). `role="complementary"`. Teclado C/R/F. |
| `LuanaRail` | Modo colapsado (rail ~60px de íconos). |
| `LuanaHistory` | Lista de conversaciones (React Query) + búsqueda. |
| `LuanaChat` | ChatHeader + ChatMessages + ChatComposer + TypingIndicator. El orquestador: intención → delega → reporta. |
| `Ribbon` | N1 · 4 RibbonTab (Abel/Brenda/Christian/Norvil) + ConfigTab. `role="tablist"`. agent-color border en active. |
| `SubTabsBar` | N2 · SubTab[] del agente activo (URL-derived). |
| `SubSubTabsBar` | N3-static · render condicional si `AGENT_SUBSUBTABS[agent][subtab]?.length`. |
| `ShellOrganismLayout` | Splitter resizable dual-mode (chat-collapsed/narrow/50-50) · `dynamic({ssr:false})` boundary · skeleton store-free. |
| `AppPanelSlot` | Contiene Ribbon + SubTabsBar + SubSubTabsBar + `{children}`. |

## 5. Modelo de navegación

3 niveles de tab que GUÍAN hasta la **hoja** (= contenido del `page.tsx`, lo único que cambia · NUNCA contiene tabs internas):
- **N1 Ribbon** → `[agent]` (Abel/Brenda/Christian/Norvil/Config) · Luana NO es tab.
- **N2 SubTabsBar** → `[agent]/[subtab]` (whitelist `AGENT_SUBTABS`).
- **N3-static SubSubTabsBar** → `[agent]/[subtab]/[subsubtab]` (cuando ≥3 vistas discretas).
- **N3-dynamic** → `[...slug]` (Sheet drawer · detalle de item).

Routing SSoT: `nicolify/frontend/src/lib/routing/shell-routes.ts` (`AGENT_CATALOG` + `AGENT_SUBTABS` + `AGENT_SUBSUBTABS`). Sub-tabs ratificadas: ver `nicolify/docs/product/stories/nicolify-r0-shell-organism/navigation-tree.md`.

```
app/[tenantId]/(shell-organism)/[agent]/[subtab]/[subsubtab]/page.tsx
```
Server Component default · SSR initial state · datos sensibles nunca en URL.

### ★ Fidelidad del wrapper — portar verbatim de Vitalia + re-temizar
TopBar + Ribbon + SubTabsBar + LuanaSidebar/chat se portan de las fuentes canónicas de Vitalia (`~/Proyectos/luana-vitalia/vitalia/docs/archive/2026/stories/vitalia-shell-organism/mockups/dual-mode-shell.html` + `valeria-chat-sample.html` + `valeria-rail.html`) y se re-temizan a Nicolify — NO se reinventan simplificados. Referencia visual ratificada: el mockup `nicolify-r0-shell-organism/mockups/shell.html`.

## 6. Catálogo de agentes (paleta nicolify.com)

| Agente | slug | `--agent-{slug}` | rol | en Ribbon? | avatar (placeholder) |
|---|---|---|---|---|---|
| Luana | `luana` | `#635BFF` indigo | orquestadora · chat lateral | **NO** | `public/agents/luana/avatar.svg` |
| Abel | `abel` | `#A855F7` púrpura | estrategia & oferta | sí | `…/abel/avatar.svg` |
| Brenda | `brenda` | `#22C55E` verde | growth & presupuesto | sí | `…/brenda/avatar.svg` |
| Christian | `christian` | `#3B82F6` azul | SDR / outbound | sí | `…/christian/avatar.svg` |
| Norvil | `norvil` | `#EC4899` rosa | account manager | sí | `…/norvil/avatar.svg` |
| (Config) | `config` | `#64748b` slate | settings | sí | — |

Cada agente con tab: `--agent-{slug}` + `--agent-{slug}-soft`. Default chat = `luana`. **Avatares SVG placeholder temporales — Chris entrega finales en semanas (reemplazo 1:1).** Logos reales: `nico-assets/` (legacy worktree).

## 7. Gates de proceso (ver `ADR-nicolify-001`)

- **Mockup-per-component**: componente shell nuevo → mockup HTML ratificado por Chris ANTES de `refining→refined`. `/architect` REFUSE sin `ratified_visual_by_chris: true`.
- **Shell-feature pattern (9 secciones)**: toda sub-tab cita `architecture_pattern: ADR-nicolify-001`.
- **SSR-safe persisted store**: factory `createSsrSafePersistedStore` + `useStoreHydration` (skeleton store-free).

## 8. Testing

Visual goldens Playwright side-by-side vs el mockup ratificado (3 secciones × 2 themes) + Vitest unit + axe a11y. Mapping `mockup → golden → component → este contrato`.

## Referencias

- `nicolify/docs/architecture/ADR-nicolify-001-shell-feature-architecture.md` — patrón por sub-tab
- `nicolify/docs/product/stories/nicolify-r0-shell-organism/{navigation-tree.md, mockups/shell.html, 00-fe-architecture-review.md}`
- `.claude/skills/nicolify-design-system/SKILL.md` — índice cargable
- `nicolify/docs/architecture/SYSTEM-MAP.yaml` — mapa funcional (cockpit)
- Vitalia (referencia): `vitalia/docs/architecture/{SHELL-DESIGN-CONTRACT.md, ADR-vitalia-003/004/006}`
- `core/@luana/{ui-kit,format,hooks,design-tokens}` — engine FE
