# Nicolify — SHELL DESIGN CONTRACT

> **SSoT atomic-design del shell-organism agéntico de Nicolify.** Qué componentes existen, sus tokens, el modelo de navegación y el catálogo de agentes. Ratificado por Chris 2026-05-29 (mockup `nicolify/docs/product/stories/nicolify-r0-shell-organism/mockups/shell.html`).
>
> Reuse del patrón de Vitalia (`vitalia/docs/architecture/SHELL-DESIGN-CONTRACT.md`) re-temizado a la marca Nicolify (nicolify.com). Arquitectura del patrón por sub-tab: `ADR-nicolify-001`. Carga el skill `nicolify-design-system` antes de tocar `nicolify/frontend/src/**`.
>
> **Extensión 2026-06-03 (ratificada Chris):** formalizado el patrón **list→detail `EntitySubNavBar`** (§ 5 + § 5.1 + § 4) — soporta leaves fijos (staff vitalia) y dinámicos poblados por hijos + agregar (ICP→buyers nicolify). Reemplaza la noción "N3-dynamic = Sheet drawer". Mockup de referencia: `nicolify/docs/product/stories/nicolify-r1-abel-icp-buyer/mockups/icp-buyer.html`.

## 1. Visión del shell

Shell **dual-mode agéntico**: panel izquierdo = **Luana** (chat orquestador persistente, único rostro, NO está en el Ribbon) · panel derecho = **App** (Ribbon de 5 agentes expertos + Configurar · sub-tabs · contenido). Layout 50/50 con splitter resizable de 3 estados.

> **Encaje con el paradigma de 3 zonas** (`ADR-nicolify-002` · `SYSTEM-MAP.yaml::zones`): el **Ribbon = zona Agentes** (abel/brenda/christian/sara/norvil) · **Luana = supervisora** de la zona Agentes pero vive en el sidebar (fuera del grid de cajas) · el **ConfigTab = zona Plataforma** (agrupa acceso/onboarding/configuracion). La zona **Infraestructura** (motor-agentico, observabilidad, etc.) NO es user-facing → no tiene tab. Christian es el único **bifronte** (interno `copilot` + externo `sales_agent`).

```
┌────────────────────────────────────────────────────────────────┐
│ TopBar:  [logo Nicolify]            [splitter][tema][agencia ▾]  │
├──────────────────────┬─────────── splitter (drag) ──────────────┤
│  LUANA (orquestadora) │  N1 Ribbon: Abel·Brenda·Christian·       │
│  chat persistente     │             Sara·Norvil·Configurar       │
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

→ Si falta una primitiva, agregar Shadcn estándar en `components/ui/` (no `<div>` crudo). `Tabs` NO se usa para sub-secciones de una hoja (eso es N3-static `SubSubTabsBar`) ni para el detalle de un item (eso es N3-dynamic `EntitySubNavBar`); en ambos casos las leaves son **rutas**, no `Tabs`.

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
| `Ribbon` | N1 · 5 RibbonTab (Abel/Brenda/Christian/Sara/Norvil) + ConfigTab. `role="tablist"`. agent-color border en active. |
| `SubTabsBar` | N2 · SubTab[] del agente activo (URL-derived). |
| `SubSubTabsBar` | N3-static · render condicional si `AGENT_SUBSUBTABS[agent][subtab]?.length`. |
| `EntitySubNavBar` | N3-dynamic · barra de workspace del **detalle** (patrón list→detail). `‹ rootLabel` + identidad (avatar+nombre) + leaves **a la izquierda**. Directory mode (entity=null) → leaves disabled. `role="tablist"` + roving tabindex + flechas · `router.push` (sin full reload). Leaves **fijas** (por tipo) o **dinámicas** (colección hija + `+ agregar`). Ver § 5.1. **Port re-temizado de vitalia · lift candidate a `@luana/ui-kit`.** |
| `EntityWorkspaceLayout` | `[entityId]/layout.tsx` del detalle: monta `EntitySubNavBar` + hidrata la entidad (SSR) + slot `{children}` (el leaf activo). |
| `ShellOrganismLayout` | Splitter resizable dual-mode (chat-collapsed/narrow/50-50) · `dynamic({ssr:false})` boundary · skeleton store-free. |
| `AppPanelSlot` | Contiene Ribbon + SubTabsBar + SubSubTabsBar + `{children}`. |

## 5. Modelo de navegación

3 niveles de tab que GUÍAN hasta la **hoja** (= contenido del `page.tsx`, lo único que cambia · NUNCA contiene tabs internas):
- **N1 Ribbon** → `[agent]` (Abel/Brenda/Christian/Sara/Norvil/Config) · Luana NO es tab.
- **N2 SubTabsBar** → `[agent]/[subtab]` (whitelist `AGENT_SUBTABS`).
- **N3-static (`SubSubTabsBar`)** → `[agent]/[subtab]/[subsubtab]` · sub-vistas **fijas** de UNA hoja (≥3 vistas discretas, del catálogo `AGENT_SUBSUBTABS`). Ej: Christian→propuestas→{borrador·revisión·firmado}.
- **N3-dynamic (`EntitySubNavBar` · patrón list→detail)** → el sub-tab es una **lista** de entidades; al entrar a una, su **detalle** es un workspace con back + identidad (avatar+nombre) + leaves. La **entidad** es dinámica (item elegido en runtime); sus **leaves** pueden ser fijos o dinámicos (ver § 5.1). **Reemplaza** la vieja noción "Sheet drawer" — el `Sheet` queda SOLO para paneles transitorios livianos, NUNCA para el detalle canónico de un item.

| Modo N3 | Componente | Fuente de las leaves | Caso |
|---|---|---|---|
| **static** | `SubSubTabsBar` | catálogo `AGENT_SUBSUBTABS` (fijas) | Christian→propuestas→{borrador·revisión·firmado} |
| **dynamic · leaves fijos** | `EntitySubNavBar` | sub-vistas fijas por **tipo** de entidad | **staff/doctor** (vitalia): Perfil·Horarios·Servicios |
| **dynamic · leaves dinámicos** | `EntitySubNavBar` | colección **hija** en runtime **+ botón agregar** | **ICP→buyers** (nicolify): [Datos del ICP][buyers…][+ buyer] |

Routing SSoT: `nicolify/frontend/src/lib/routing/shell-routes.ts` (`AGENT_CATALOG` + `AGENT_SUBTABS` + `AGENT_SUBSUBTABS`). Sub-tabs ratificadas: ver `nicolify/docs/product/stories/nicolify-r0-shell-organism/navigation-tree.md`.

```
N3-static:   app/[tenantId]/(shell-organism)/[agent]/[subtab]/[subsubtab]/page.tsx
N3-dynamic:  app/[tenantId]/(shell-organism)/[agent]/[subtab]/page.tsx              (lista/master)
             app/[tenantId]/(shell-organism)/[agent]/[subtab]/[entityId]/layout.tsx (monta EntitySubNavBar + slot)
             app/[tenantId]/(shell-organism)/[agent]/[subtab]/[entityId]/[leaf]/page.tsx (detalle del leaf)
```
Server Component default · SSR initial state · datos sensibles nunca en URL · `[entityId]` redirige al primer leaf.

### 5.1 Patrón list→detail (`EntitySubNavBar`) — ★ canónico para todo "lista → detalle"

> **Origen:** inventado en vitalia (`lisa/staff/doctores`, `ADR-vitalia-004 § D-1`). Adoptado cross-brand 2026-06-03 (Chris). Reference impl: `vitalia/frontend/src/components/shared/shell-organism/EntitySubNavBar.tsx` (+ `StaffWorkspaceShell.tsx` + `[doctor-id]/layout.tsx`).

Cuando un sub-tab N2 **es una colección de entidades** (ICPs, staff, cuentas, contactos…) que se **listan** y luego se **entra al detalle** de una, se usa `EntitySubNavBar`:

- **Master (lista):** `[agent]/[subtab]/page.tsx` — grid/lista de cards. SIN `EntitySubNavBar` (es la lista).
- **Detalle (workspace):** al hacer click en un item → `[agent]/[subtab]/[entityId]/[leaf]`. El `layout.tsx` monta la **`EntitySubNavBar` como barra N3 superior** (parte del stack Ribbon→SubTabs→**EntitySubNavBar**→contenido — NO un card flotante dentro del contenido).
- **Anatomía de la barra:** `[‹ {rootLabel}]  |  {avatar} {nombre entidad}  |  {leaves…}` — leaves **pegadas a la izquierda** (después de la identidad), no a la derecha.
- **Back link** (`rootLabel`) = nombre de la lista: `‹ ICPs` · `‹ Staff` · `‹ Buyers`.
- **Directory mode** (entity=null, p.ej. lista sin selección): las leaves se renderizan **deshabilitadas/atenuadas** (aria-disabled, opacity ~.45) — el "dummy" hasta que hay entidad.
- **Las leaves son RUTAS, NO Shadcn `Tabs`.** a11y: `role="tablist"` + roving tabindex + navegación por flechas (Left/Right/Home/End). `router.push` (no full reload — preserva React Query cache).

**Dos fuentes de leaves (misma barra, distinto origen):**

| Variante | Leaves | Botón agregar | Routing del leaf | Ejemplo |
|---|---|---|---|---|
| **leaves fijos** | definidos por tipo de entidad (constante `LEAF_DEFS`) | no | `[entityId]/{perfil\|horarios\|servicios}` | staff/doctor (vitalia) |
| **leaves dinámicos** | la colección **hija** de la entidad (runtime) + `+ agregar` | sí | `[entityId]/{datos\|[childId]}` | ICP→buyers (nicolify): leaf `datos` (la entidad madre) + un leaf por buyer + `+ buyer` |

> En la variante dinámica, la **entidad madre** (sus propios campos) vive en un leaf inicial (ej. `📋 Datos del ICP`) y los **hijos** son los leaves siguientes; el `+ agregar` crea un hijo nuevo.

**Lift candidate (★):** `EntitySubNavBar` ya tiene **N=2 consumers** (staff vitalia + ICP nicolify) → candidato fuerte a lift a `core/@luana/ui-kit` vía `/pm-luana` (promotion gate). Mientras tanto, cada brand lo porta re-temizado desde vitalia (no reinventar).

### ★ Fidelidad del wrapper — portar verbatim de Vitalia + re-temizar
TopBar + Ribbon + SubTabsBar + LuanaSidebar/chat se portan de las fuentes canónicas de Vitalia (`~/Proyectos/luana-vitalia/vitalia/docs/archive/2026/stories/vitalia-shell-organism/mockups/dual-mode-shell.html` + `valeria-chat-sample.html` + `valeria-rail.html`) y se re-temizan a Nicolify — NO se reinventan simplificados. Referencia visual ratificada: el mockup `nicolify-r0-shell-organism/mockups/shell.html`.

## 6. Catálogo de agentes (paleta nicolify.com)

| Agente | slug | `--agent-{slug}` | rol | en Ribbon? | avatar (placeholder) |
|---|---|---|---|---|---|
| Luana | `luana` | `#635BFF` indigo | orquestadora · chat lateral | **NO** | `public/agents/luana/avatar.svg` |
| Abel | `abel` | `#A855F7` púrpura | estrategia & oferta | sí | `…/abel/avatar.svg` |
| Brenda | `brenda` | `#22C55E` verde | growth & presupuesto | sí | `…/brenda/avatar.svg` |
| Christian | `christian` | `#3B82F6` azul | SDR / outbound | sí | `…/christian/avatar.svg` |
| Sara | `sara` | `#F59E0B` ámbar **(ratificado Chris 2026-05-30)** | jefa de proyectos · operación/delivery | sí | `…/sara/avatar.svg` **(pendiente)** |
| Norvil | `norvil` | `#EC4899` rosa | account manager | sí | `…/norvil/avatar.svg` |
| (Config) | `config` | `#64748b` slate | settings | sí | — |

Cada agente con tab: `--agent-{slug}` + `--agent-{slug}-soft`. Default chat = `luana`. **Avatares SVG placeholder temporales — Chris entrega finales en semanas (reemplazo 1:1).** Logos reales: `nico-assets/` (legacy worktree). **★ Sara (agregada 2026-05-30): color `--agent-sara` ámbar `#F59E0B` RATIFICADO Chris. Pendiente: avatar SVG (`…/sara/avatar.svg`) + refit del mockup del Ribbon (5ª tab) — gate G1 mockup-per-component.**

## 7. Gates de proceso (ver `ADR-nicolify-001`)

- **Mockup-per-component**: componente shell nuevo → mockup HTML ratificado por Chris ANTES de `refining→refined`. `/architect` REFUSE sin `ratified_visual_by_chris: true`.
- **★ Mockup-base reusable (ADR-nicolify-003 · cement 2026-06-15)**: todo mockup nicolify **linkea `_shared.css`** (SSoT: `nicolify-r0-design-system-adoption/mockups/_shared.css` — tokens espejo de `globals.css` + átomos + moléculas + layout-primitives + shell wrapper) y porta el wrapper **verbatim**; solo cambia `.panel-content`. Cero estilo inline de layout, cero arbitrary → "lo que veo = lo que programo". Rule: `nicolify/.claude/rules/shell-mockup-per-component.md`.
- **Shell-feature pattern (9 secciones)**: toda sub-tab cita `architecture_pattern: ADR-nicolify-001`.
- **SSR-safe persisted store**: factory `createSsrSafePersistedStore` + `useStoreHydration` (skeleton store-free).
- **RN-6 · AC-6 (ds-adoption 2026-06-15):** todo mockup nicolify **compone del mismo canon y tokens** que el código React (`design-system-canon.md` + `@luana/design-tokens` + `@luana/ui-kit`). El `_shared.css` es espejo exacto de `globals.css`. Visual golden `maxDiffPixelRatio:0.001` verifica la convergencia mockup↔producción. Cero arbitrary-values en mockups ni en código.

## 8. Testing

Visual goldens Playwright side-by-side vs el mockup ratificado (3 secciones × 2 themes) + Vitest unit + axe a11y. Mapping `mockup → golden → component → este contrato`.

## Referencias

- `nicolify/docs/architecture/ADR-nicolify-001-shell-feature-architecture.md` — patrón por sub-tab
- `nicolify/docs/product/stories/nicolify-r0-shell-organism/{navigation-tree.md, mockups/shell.html, 00-fe-architecture-review.md}`
- `.claude/skills/nicolify-design-system/SKILL.md` — índice cargable
- `nicolify/docs/architecture/SYSTEM-MAP.yaml` — mapa funcional (cockpit)
- Vitalia (referencia): `vitalia/docs/architecture/{SHELL-DESIGN-CONTRACT.md, ADR-vitalia-003/004/006}`
- `core/@luana/{ui-kit,format,hooks,design-tokens}` — engine FE
