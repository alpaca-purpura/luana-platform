<!-- voseo-allowed: internal architecture documentation, design system SSoT -->

# Shell-Organism Design Contract — SSoT

> **Versión:** 1.0 · **Fecha:** 2026-05-22 · **Estado:** ratificado por Chris · **Branch:** wip/vitalia
>
> **Propósito:** documento canónico que cementa CADA átomo · molécula · organismo · template del shell-organism agéntico Vitalia. TODA historia de usuario Fase 1 y Fase 2 cita este doc como referencia técnica. Sin este doc, las historias serían textos sueltos sin contrato visual ni funcional verificable.
>
> **Fuente visual:** `vitalia/docs/product/stories/vitalia-shell-organism/mockups/dual-mode-shell.html` (mockup ratificado 2026-05-22). Este Design Contract traduce ESE mockup a Next.js + Shadcn UI + Vitalia tokens.

---

## § 1 — Decisiones cementadas (input para Design Contract)

Pre-decisión Chris 2026-05-22, antes de empezar este doc:

| # | Decisión | Implicancia |
|---|---|---|
| D1 | Shadcn UI se instala AHORA en `vitalia/frontend/` | `npx shadcn@latest init` en F1-S0. Componentes copy-paste local |
| D2 | **Deprecar `.vt-*` utility classes COMPLETO** | Migrar a Tailwind directo + Shadcn. Stories incluyen migración por feature |
| D3 | Migration path = **route group paralelo** `(shell-organism)/` | Coexiste con `/(dashboard)/` viejo hasta Fase 2 completa |
| D4 | **Verificar Tailwind v4 empíricamente** | Story F1-S0 incluye `make dev-vitalia` + browser visual check |
| D5 | Atomic design strict | Componentes clasificados en átomos · moléculas · organismos · templates · pages |
| D6 | Cada componente ENTRA al sistema solo con Playwright golden visual + test funcional | Zero deuda técnica desde origen |

---

## § 2 — Atomic Design Layers — nomenclatura cementada

```
átomos       → primitivos sin lógica de dominio (Button, Input, Avatar, Icon)
moléculas    → átomos combinados con propósito específico (TabButton, RailIconButton, TenantOption)
organismos   → composiciones funcionales completas con estado (TopBarGlobal, ValeriaSidebar, Ribbon)
templates    → layouts que componen organismos (ShellOrganismLayout 50/50)
pages        → rutas Next.js que renderizan templates (/(shell-organism)/[agent]/[subtab]/page.tsx)
```

**Convención de paths Vitalia (FSD-Lite):**

```
vitalia/frontend/src/
├── components/
│   ├── ui/                       # Átomos Shadcn copy-paste (Button, Input, Avatar, ...)
│   └── shared/                   # Moléculas + organismos compartidos cross-feature
│       ├── shell-organism/       # Organismos del shell-organism (TopBarGlobal, ValeriaSidebar, Ribbon, SubTabs)
│       └── ...                   # Otros shared existentes (mantienen ubicación actual)
├── features/
│   └── {agent}/                  # Features per agente: lisa, lucas, adrian, valeria, camila, config
│       ├── components/           # Componentes específicos del agente
│       ├── api/
│       ├── hooks/
│       ├── store/
│       ├── types/
│       └── index.ts (barrel)
├── app/
│   ├── (dashboard)/              # LEGACY — coexiste hasta Fase 2 completa
│   └── [tenantId]/
│       └── (shell-organism)/     # NUEVO route group — shell-organism
│           ├── layout.tsx         # ShellOrganismTemplate (50/50)
│           ├── page.tsx           # Default landing
│           └── [agent]/
│               ├── layout.tsx
│               ├── page.tsx       # Default sub-tab (primera del agente)
│               └── [subtab]/
│                   └── page.tsx   # Vista específica
├── lib/
│   ├── tokens/                   # CSS vars + Tailwind theme extend
│   ├── api/                      # fetchClient (HIPAA dual filter)
│   └── ...
├── stores/                       # Zustand stores globales
│   ├── shell-state.ts            # NEW: valeria sidebar state, theme, active tenant
│   └── ...
└── hooks/                        # Hooks globales (useTenantLocale, useTheme, useShellState)
```

---

## § 3 — Inventario exhaustivo: mockup → componentes

> **Cada fila es un contrato.** El builder de la story respectiva DEBE producir EXACTAMENTE este componente con EXACTAMENTE estas props/state/a11y. Cualquier desviación falla el Playwright visual golden + auditor.

### § 3.1 — Átomos (átomos Shadcn instalables)

| Mockup ref | Átomo | Shadcn CLI install | Path local | Props clave | Usado en |
|---|---|---|---|---|---|
| `.topbar-btn` con 🌙/☀️ | `IconButton` (wrapper Button) | `npx shadcn add button` | `components/ui/button.tsx` | `variant="ghost" size="icon"` | TopBarGlobal · Rail · History toolbar |
| Logo "V" cuadrado gradiente | `LogoMark` | NEW (no Shadcn) | `components/shared/shell-organism/LogoMark.tsx` | `size, variant: full\|mark` | TopBarGlobal |
| `.tenant-item-avatar` "SP", "DM" | `Avatar` + fallback letras | `npx shadcn add avatar` | `components/ui/avatar.tsx` | `src, alt, fallback` | TenantSwitcher · Ribbon tabs · Chat header |
| `.tenant-switcher-btn` con ▾ | `Button` + chevron | `npx shadcn add button` | idem | `variant="outline"` | TopBarGlobal |
| `.tenant-switcher-dropdown` | `DropdownMenu` | `npx shadcn add dropdown-menu` | `components/ui/dropdown-menu.tsx` | items array | TenantSwitcher |
| `.history-search input` | `Input` | `npx shadcn add input` | `components/ui/input.tsx` | `placeholder` | History panel · Composer |
| `.rail-btn` cuadrado | `Button variant="ghost" size="icon"` | (Button reuso) | idem | + Tooltip wrap | Rail · History toolbar |
| `.kbd` (keyboard hint) | `Kbd` | NEW | `components/ui/kbd.tsx` | `children` | Footer mockup · Tooltips |
| `.chat-mode-pill` 🤖 | `Badge` | `npx shadcn add badge` | `components/ui/badge.tsx` | `variant="outline"` | Chat header · Camila modes · Adrián modes |
| `.composer-input` textarea | `Textarea` | `npx shadcn add textarea` | `components/ui/textarea.tsx` | `rows, placeholder` | Composer |
| `.composer-send` button | `Button` | (Button reuso) | idem | `variant="default"` | Composer |
| `.msg-bubble` user/bot | `MessageBubble` | NEW | `components/shared/shell-organism/MessageBubble.tsx` | `role: user\|bot, content` | Chat messages |
| `.msg-thinking` dots | `TypingIndicator` | NEW | `components/shared/shell-organism/TypingIndicator.tsx` | — | Chat messages while streaming |
| `.msg-delegate` italic | `DelegateMarker` | NEW | `components/shared/shell-organism/DelegateMarker.tsx` | `fromAgent, toAgent` | Chat messages |
| `.toggle-pill` segmented control | `Tabs` (Shadcn) | `npx shadcn add tabs` | `components/ui/tabs.tsx` | `defaultValue, items[]` | Catálogo\|Escalera · Kanban\|Lista · 3-modos Camila/Adrián |
| Tooltip al hover rail btn | `Tooltip` | `npx shadcn add tooltip` | `components/ui/tooltip.tsx` | `content, side` | Rail buttons · Topbar icons |
| Scrollbar styled | Tailwind utility | (Tailwind native) | global.css | — | History list · Chat messages · Content |

### § 3.2 — Moléculas (composiciones específicas)

| Mockup ref | Molécula | Composición | Props | State | Path |
|---|---|---|---|---|---|
| `.tenant-switcher-btn` + dropdown | `TenantSwitcher` | DropdownMenu + Avatar + Button | `currentTenant, tenants[], onSwitch` | localStorage `x-tenant-id` | `components/shared/shell-organism/TenantSwitcher.tsx` |
| `.topbar-btn` theme | `ThemeToggle` | Button + Icon (Moon/Sun) | — | localStorage `vitalia-theme` · ThemeProvider | `components/shared/shell-organism/ThemeToggle.tsx` |
| `.ribbon-tab` (5 agentes) | `RibbonTab` | Avatar + Labels + active border | `agent: AgentKey, active, onClick` | — (controlled) | `components/shared/shell-organism/RibbonTab.tsx` |
| `.ribbon-tab` ⚙️ Configurar | `ConfigTab` | IconBox + Labels | `active, onClick` | — | `components/shared/shell-organism/ConfigTab.tsx` |
| `.sub-tab` línea 2 | `SubTab` | Button con tint color agente | `label, color, active, onClick` | — | `components/shared/shell-organism/SubTab.tsx` |
| `.tenant-item` dropdown row | `TenantOption` | Avatar + Meta + active state | `tenant, active` | — | `components/shared/shell-organism/TenantOption.tsx` |
| `.history-item` row | `HistoryItem` | Title + Meta + active state | `conv: ConvSummary, active` | — | `components/shared/shell-organism/HistoryItem.tsx` |
| `.history-group` + label | `HistoryGroup` | Section + items | `label, items[]` | — | `components/shared/shell-organism/HistoryGroup.tsx` |
| `.chat-header` | `ChatHeader` | Avatar + Name + Status + Pill | `agent: 'valeria', status, mode` | — | `components/shared/shell-organism/ChatHeader.tsx` |
| `.empty-state` placeholder | `EmptyState` | Icon + Title + Desc | `icon, title, desc, action?` | — | `components/shared/shell-organism/EmptyState.tsx` |
| `.placeholder-card` grid card | `PlaceholderCard` | Icon + Title + Desc + Status dot | `icon, title, desc, status: shipped\|planned\|todo` | — | `components/shared/shell-organism/PlaceholderCard.tsx` |
| Pipeline col header + cards | `PipelineColumn` | Header + cards stack | `stage, count, value, leads[]` | — | `features/adrian/components/embudo/PipelineColumn.tsx` |
| Agenda slot cell | `AgendaSlot` | Status color border + content | `slot: SlotData, onClick` | — | `features/valeria/components/agenda/AgendaSlot.tsx` |

### § 3.3 — Organismos (composiciones funcionales con estado)

| Mockup ref | Organismo | Composición | State management | Keyboard | Path |
|---|---|---|---|---|---|
| `.topbar` header | `TopBarGlobal` | LogoMark + (ThemeToggle + TenantSwitcher) | — (consume hooks) | — | `components/shared/shell-organism/TopBarGlobal.tsx` |
| `.panel-valeria` 50% izq | `ValeriaSidebar` | Rail OR History + Chat (grid interno) | zustand `shellStore.valeriaState` | `C/R/F/N/Esc/Cmd+K` | `components/shared/shell-organism/ValeriaSidebar.tsx` |
| `.valeria-rail` 60px | `ValeriaRail` | RailIconButtons + divider | — (recibe state) | (delegado a parent) | `components/shared/shell-organism/ValeriaRail.tsx` |
| `.valeria-history` 280px | `ValeriaHistory` | Header + Search + HistoryGroup[] | React Query convs · search local | — | `components/shared/shell-organism/ValeriaHistory.tsx` |
| `.valeria-chat` | `ValeriaChat` | ChatHeader + Messages + Composer | zustand `chatStore.messages` · WebSocket | (delegado) | `components/shared/shell-organism/ValeriaChat.tsx` |
| `.ribbon` 6 tabs | `Ribbon` | RibbonTab[] + ConfigTab | router state (active from URL) | — | `components/shared/shell-organism/Ribbon.tsx` |
| `.sub-tabs` línea 2 | `SubTabsBar` | SubTab[] (dinámico per tab) | router state | — | `components/shared/shell-organism/SubTabsBar.tsx` |
| `.content` body derecho | `ContentArea` | slot — children = page actual | — (Next.js routing) | — | (es el `{children}` del layout) |

### § 3.4 — Templates (layouts)

| Mockup ref | Template | Composición | Variantes | Path |
|---|---|---|---|---|
| Layout shell completo | `ShellOrganismLayout` | TopBarGlobal + (ValeriaSidebar \| ContentSection) grid 50/50 | modo `agentic` (default 50/50) · modo `web` (Valeria → rail 60px, content 100%) | `app/[tenantId]/(shell-organism)/layout.tsx` |
| ContentSection | `ContentSection` | Ribbon + SubTabsBar + ContentArea | — | inline en layout o componente extraído |

### § 3.5 — Pages (rutas concretas)

| Path Next.js | Renderiza | Default redirect |
|---|---|---|
| `/[tenantId]/(shell-organism)/page.tsx` | landing del shell | redirige a `/[tenantId]/(shell-organism)/lisa/marca` (default Lisa→Marca) |
| `/[tenantId]/(shell-organism)/[agent]/page.tsx` | landing del agente | redirige a primera sub-tab del agente |
| `/[tenantId]/(shell-organism)/[agent]/[subtab]/page.tsx` | sub-tab específica | renderiza componente per agente+subtab |
| `/[tenantId]/(shell-organism)/[agent]/[subtab]/[...slug]/page.tsx` | N3-dyn workspace (detalle item) | renderiza detalle workspace |

---

## § 4 — Shadcn CLI install plan (story F1-S0)

```bash
# Story F1-S0 ejecuta:
cd vitalia/frontend
npx shadcn@latest init
# Interactive prompts:
#  - Style: New York (vs Default)
#  - Base color: Slate
#  - CSS variables: yes
#  - Tailwind config: existing
#  - Import alias: @/ (already configured)

# Después de init, instalar primitivos del Design Contract § 3.1:
npx shadcn@latest add button avatar dropdown-menu input badge textarea tabs tooltip

# Componentes adicionales por agente (en stories Fase 2 según necesidad):
# Lisa Servicios canvas → npx shadcn add card scroll-area separator
# Adrián Embudo → npx shadcn add card + @dnd-kit/core (NPM, NO shadcn)
# Adrián Inbox → npx shadcn add sheet popover scroll-area
# Camila Voz → npx shadcn add accordion progress
# Valeria Agenda → custom date picker (no Shadcn primitive — built composite)
# Config Conexiones → npx shadcn add sheet card switch
```

**Output:** `vitalia/frontend/src/components/ui/` poblado · `components.json` versionado · primitives Tailwind/Radix listos.

---

## § 5 — Tokens system (nuevo, post-deprecación `.vt-*`)

> **Cambio estructural:** los 150+ `.vt-*` utility classes se reemplazan por:
> 1. CSS variables Shadcn-style (`--background`, `--foreground`, `--primary`, etc.) que VALORAN a colores Vitalia
> 2. Tailwind utility classes nativas (`bg-background`, `text-muted-foreground`, etc.)
> 3. Brand tokens extras (`--agent-lisa`, `--agent-lucas`, etc.) para colores agentes

### § 5.1 — CSS variables canónicas (light + dark)

```css
/* vitalia/frontend/src/app/globals.css */

@layer base {
  :root {
    /* Surface (Shadcn standard) */
    --background: 0 0% 100%;              /* #ffffff */
    --foreground: 240 10% 4%;             /* near-black */
    --card: 0 0% 100%;
    --card-foreground: 240 10% 4%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 4%;

    /* Primary = Vitalia cyan (Adrián) */
    --primary: 198 99% 49%;               /* #01b2f8 */
    --primary-foreground: 0 0% 100%;

    /* Secondary = neutral */
    --secondary: 240 5% 96%;
    --secondary-foreground: 240 6% 10%;

    /* Muted */
    --muted: 240 5% 96%;
    --muted-foreground: 240 4% 46%;

    /* Accent = Vitalia purpura (Valeria) */
    --accent: 287 53% 37%;                /* #7b2d91 */
    --accent-foreground: 0 0% 100%;

    /* Destructive */
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 98%;

    /* Border + input + ring */
    --border: 240 6% 90%;
    --input: 240 6% 90%;
    --ring: 198 99% 49%;                  /* matches primary */

    /* Radius */
    --radius: 0.625rem;

    /* === Agent tokens === */
    --agent-lisa: 156 100% 41%;           /* #00D084 — NEW token */
    --agent-lisa-soft: 156 80% 92%;
    --agent-lucas: 0 0% 7%;               /* #111111 — NEW token */
    --agent-lucas-soft: 0 0% 92%;
    --agent-adrian: 198 99% 49%;          /* #01b2f8 = same as --primary */
    --agent-adrian-soft: 197 90% 89%;
    --agent-valeria: 287 53% 37%;         /* #7b2d91 */
    --agent-valeria-soft: 287 53% 90%;
    --agent-camila: 244 84% 32%;          /* #180d95 */
    --agent-camila-soft: 244 53% 92%;
    --agent-mateo: 53 99% 51%;            /* #fee209 — reservado para Mateo (transversal sin tab) */
    --agent-config: 240 4% 46%;           /* neutral gray */
  }

  .dark {
    --background: 240 10% 4%;
    --foreground: 0 0% 98%;
    --card: 240 8% 8%;
    --card-foreground: 0 0% 98%;
    --popover: 240 8% 8%;
    --popover-foreground: 0 0% 98%;

    --primary: 198 99% 49%;
    --primary-foreground: 240 10% 4%;

    --secondary: 240 4% 16%;
    --secondary-foreground: 0 0% 98%;

    --muted: 240 4% 16%;
    --muted-foreground: 240 5% 65%;

    --accent: 287 53% 50%;                /* lighter para dark mode */
    --accent-foreground: 0 0% 98%;

    --destructive: 0 63% 31%;
    --destructive-foreground: 0 0% 98%;

    --border: 240 4% 20%;
    --input: 240 4% 20%;
    --ring: 198 99% 49%;

    /* Agent tokens dark variants */
    --agent-lisa-soft: 156 60% 15%;
    --agent-lucas-soft: 0 0% 20%;
    --agent-adrian-soft: 198 60% 20%;
    --agent-valeria-soft: 287 40% 25%;
    --agent-camila-soft: 244 50% 20%;
  }
}
```

### § 5.2 — Tailwind config extend

```ts
// vitalia/frontend/tailwind.config.ts
export default {
  // ...
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        accent:  { DEFAULT: 'hsl(var(--accent))',  foreground: 'hsl(var(--accent-foreground))' },
        muted:   { DEFAULT: 'hsl(var(--muted))',   foreground: 'hsl(var(--muted-foreground))' },
        card:    { DEFAULT: 'hsl(var(--card))',    foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },

        // Agent tokens
        agent: {
          lisa: 'hsl(var(--agent-lisa))',
          'lisa-soft': 'hsl(var(--agent-lisa-soft))',
          lucas: 'hsl(var(--agent-lucas))',
          'lucas-soft': 'hsl(var(--agent-lucas-soft))',
          adrian: 'hsl(var(--agent-adrian))',
          'adrian-soft': 'hsl(var(--agent-adrian-soft))',
          valeria: 'hsl(var(--agent-valeria))',
          'valeria-soft': 'hsl(var(--agent-valeria-soft))',
          camila: 'hsl(var(--agent-camila))',
          'camila-soft': 'hsl(var(--agent-camila-soft))',
          mateo: 'hsl(var(--agent-mateo))',
          config: 'hsl(var(--agent-config))',
        },
      },
      borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius) - 2px)', sm: 'calc(var(--radius) - 4px)' },
    },
  },
}
```

### § 5.3 — Deprecación `.vt-*` (plan)

Story F1-S0 incluye scan + plan deprecación. Strategy:

1. **Rename block:** todas las `.vt-bg-*`, `.vt-text-*`, `.vt-border-*` apuntan a las nuevas vars Shadcn-style (compatibilidad temporal — 1 release)
2. **Migration por feature:** cuando una feature migra al shell-organism (Fase 2), su código se refactoriza a Tailwind directo
3. **Final drop:** cuando 100% del código FE usa Tailwind directo, eliminamos `.vt-*` block del globals.css

**Story dedicada:** F2-S23 `vitalia-fase2-vt-deprecation-final` (último step, después de todas las Fase 2 features migradas).

---

## § 6 — State management (zustand stores)

### § 6.1 — `shellStore` (NEW — global shell state)

```ts
// vitalia/frontend/src/stores/shell-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ValeriaState = 'collapsed' | 'rail' | 'full'
type ShellMode = 'agentic' | 'web'

interface ShellStore {
  valeriaState: ValeriaState
  shellMode: ShellMode
  setValeriaState: (s: ValeriaState) => void
  cycleValeriaState: () => void  // rail → full → rail
  setShellMode: (m: ShellMode) => void
}

export const useShellStore = create<ShellStore>()(
  persist(
    (set, get) => ({
      valeriaState: 'rail',
      shellMode: 'agentic',
      setValeriaState: (s) => set({ valeriaState: s }),
      cycleValeriaState: () => set({
        valeriaState: get().valeriaState === 'full' ? 'rail' : 'full'
      }),
      setShellMode: (m) => set({ shellMode: m }),
    }),
    { name: 'vitalia-shell-state' }
  )
)
```

### § 6.2 — `themeStore` (NEW — light/dark)

> Alternativa: usar `next-themes` (recomendado). Story F1-S1 evalúa next-themes vs zustand custom.

### § 6.3 — `tenantStore` (NEW — clinic activa)

```ts
// vitalia/frontend/src/stores/tenant-store.ts
interface TenantStore {
  activeTenantId: string | null
  availableTenants: Tenant[]
  switchTenant: (id: string) => void  // persist + hard redirect
}
```

### § 6.4 — `chatStore` (NEW — Valeria chat)

Story F1-S6 define schema completo (mensajes + streaming state + conversation ID).

---

## § 7 — Routing structure cementada

### § 7.1 — App Router tree

```
app/
├── (auth)/                                 # LEGACY — sign-in / sign-up
├── (dashboard)/                            # LEGACY — coexiste hasta migración Fase 2 completa
│   ├── page.tsx
│   ├── patients/...
│   ├── appointments/...
│   ├── brand-studio/[section]/page.tsx
│   ├── fidelizacion/page.tsx
│   ├── medical-compliance/page.tsx
│   └── ...
├── [tenantId]/
│   ├── (shell-organism)/                   # NEW route group — shell-organism
│   │   ├── layout.tsx                       # ShellOrganismLayout (50/50)
│   │   ├── page.tsx                         # → redirect /[tenantId]/(shell-organism)/lisa/marca
│   │   └── [agent]/
│   │       ├── layout.tsx                   # — (vacío, propaga al children)
│   │       ├── page.tsx                     # → redirect a primera sub-tab del agente
│   │       └── [subtab]/
│   │           ├── page.tsx                 # sub-tab content (single panel) o redirect a primera subsubtab
│   │           ├── [subsubtab]/page.tsx     # ★ N3-static (sub-sub-tabs cabecera, opcional per AGENT_SUBSUBTABS)
│   │           └── [...slug]/page.tsx       # N3-dynamic workspaces (catch-all, detalle item)
│   └── ... (otras rutas legacy bajo [tenantId] si las hubiera)
└── layout.tsx (root)                       # Providers globales
```

### § 7.2 — Agent + subtab whitelist

```ts
// vitalia/frontend/src/lib/routing/shell-routes.ts
export const SHELL_AGENTS = ['lisa', 'lucas', 'adrian', 'valeria', 'camila', 'config'] as const
export type AgentKey = typeof SHELL_AGENTS[number]

export const AGENT_SUBTABS: Record<AgentKey, readonly string[]> = {
  lisa:    ['marca', 'doctores', 'servicios', 'compliance'],
  lucas:   ['lanzar', 'envuelo', 'recursos', 'resultados', 'mercado'],
  adrian:  ['inbox', 'embudo', 'outbound', 'propuestas'],
  valeria: ['agenda', 'pacientes'],
  camila:  ['voz', 'reactivar', 'multiplicar', 'reputacion'],
  config:  ['cuenta', 'conexiones', 'avanzado'],
} as const

export const AGENT_DEFAULT_SUBTAB: Record<AgentKey, string> = {
  lisa: 'marca',
  lucas: 'lanzar',
  adrian: 'inbox',
  valeria: 'agenda',
  camila: 'voz',
  config: 'cuenta',
}

// ★ NEW v1.1 (2026-05-27) — Nivel 3 estático (sub-sub-tabs cabecera) opcional per (agent, subtab).
// Solo declarar cuando la sub-tab agrupa 3+ vistas conceptualmente discretas.
// Default redirect cuando user llega a [agent]/[subtab]/ sin subsubtab: primera entry del array (KISS).
export const AGENT_SUBSUBTABS: Partial<Record<AgentKey, Partial<Record<string, readonly string[]>>>> = {
  lisa: {
    marca: ['identidad', 'voz-y-tono', 'presencia'],
    // doctores: undefined  → single panel
    // servicios: ['catalogo', 'escalera']  (futuro lisa-servicios)
    // compliance: ['semaforo', 'retencion', 'reportes']  (futuro lisa-compliance)
  },
  // Otros agentes declaran subsubtabs cuando aplica (en su story dedicada)
} as const
```

### § 7.2.1 — Niveles de navegación (★ v1.1 cementación 2026-05-27)

```
N1 (Ribbon)           → [agent]                                    → 6 agentes fijos
N2 (SubTabsBar)       → [agent]/[subtab]                           → AGENT_SUBTABS whitelist
N3-static (NEW)       → [agent]/[subtab]/[subsubtab]               → AGENT_SUBSUBTABS opcional
N3-dynamic            → [agent]/[subtab]/[...slug]                 → workspace detalle item (catch-all)
```

**Reglas:**
- N3-static y N3-dynamic **coexisten** en misma sub-tab — Next.js prioriza static segment sobre catch-all
- N3-static es **opcional** — solo cuando la sub-tab agrupa 3+ vistas discretas (Anti-pattern: Shadcn `Tabs` body en lugar de cabecera N3-static)
- N3-dynamic se renderiza típicamente vía Sheet drawer (Shadcn) con URL state opcional (patrón valeria-agenda `AppointmentDrawer`)
- **Anti-pattern PROHIBIDO:** content tab nav fuera de la cabecera shell (sería "Nivel 4" implícito)

**Source decisión:** ADR-vitalia-004 v1.1 § 3.1.1 (cementación 2026-05-27 origen lisa-marca refinement).

### § 7.3 — Static metadata catalog

```ts
// vitalia/frontend/src/lib/agents/catalog.ts
export const AGENT_CATALOG = {
  lisa:    { tabLabel: 'Mi Clínica', role: 'Lisa',    color: 'lisa',    avatarSrc: '/agents/lisa/thumbnail.png' },
  lucas:   { tabLabel: 'Atraer',     role: 'Lucas',   color: 'lucas',   avatarSrc: '/agents/lucas/thumbnail.png' },
  adrian:  { tabLabel: 'Vender',     role: 'Adrián',  color: 'adrian',  avatarSrc: '/agents/adrian/thumbnail.png' },
  valeria: { tabLabel: 'Operar',     role: 'Valeria', color: 'valeria', avatarSrc: '/agents/valeria/thumbnail.png' },
  camila:  { tabLabel: 'Mantener',   role: 'Camila',  color: 'camila',  avatarSrc: '/agents/camila/thumbnail.png' },
  config:  { tabLabel: 'Configurar', role: 'Admin',   color: 'config',  iconName: 'Settings' },
} as const
```

PNGs ya en `vitalia/frontend/public/agents/{agent}/thumbnail.png` — verificado por inventario.

---

## § 8 — Accessibility checklist (obligatorio per organismo)

| Organismo | a11y requirements |
|---|---|
| `TopBarGlobal` | `<header role="banner">` · logo `<a>` con `aria-label="Vitalia inicio"` |
| `ThemeToggle` | `<button aria-label="Cambiar tema (claro/oscuro)" aria-pressed={isDark}>` |
| `TenantSwitcher` | DropdownMenu Radix (a11y nativo) · `aria-label="Cambiar clínica"` en trigger |
| `ValeriaSidebar` | `<aside role="complementary" aria-label="Panel Valeria">` · `aria-expanded={isExpanded}` |
| `ValeriaRail` | Cada button `aria-label` específico · keyboard discoverable · Tooltip al hover |
| `ValeriaHistory` | `<nav aria-label="Historial conversaciones">` · search input `aria-label` |
| `ValeriaChat` | `<section role="region" aria-label="Chat con Valeria">` · messages `aria-live="polite"` |
| `Ribbon` | `<nav role="tablist" aria-label="Agentes">` · cada tab `role="tab" aria-selected` |
| `SubTabsBar` | `<nav role="tablist" aria-label="Sub-secciones {agente}">` |
| `ContentArea` | `<main id="main-content" tabindex="-1">` (focus management on route change) |

**Skip links:** `<a href="#main-content">Saltar al contenido</a>` en root layout.

**Keyboard shortcuts globales (Story F1-S5):**

| Tecla | Acción | Scope |
|---|---|---|
| `C` | Valeria → collapsed | Global, skip si focus en input |
| `R` | Valeria → rail | idem |
| `F` | Valeria → full (history) | idem |
| `N` | Nueva conversación Valeria | idem |
| `Esc` | Cerrar overlays / colapsar Valeria | Global |
| `Cmd/Ctrl+K` | Focus composer Valeria | Global, override default |
| `Tab` / `Shift+Tab` | Navigation natural | Web standard |

---

## § 9 — Testing strategy (per organismo)

### § 9.1 — Niveles de test

| Nivel | Herramienta | Qué prueba | Cuándo corre |
|---|---|---|---|
| **Unit** | Vitest + RTL | Componente aislado: props → render | Pre-commit · CI |
| **Integration** | Vitest + RTL | Organismo con state interno | CI |
| **Functional E2E** | Playwright `@project=smoke` | Flujo usuario completo (click tab → ve sub-tabs → click sub-tab → ve contenido) | Pre-push main · CI |
| **Visual golden** | Playwright `@project=visual` con `toHaveScreenshot()` | Componente render pixel-perfect vs golden snapshot generado del mockup HTML | CI · cada PR FE |
| **A11y** | Playwright `@project=a11y` con axe-core | WCAG 2.1 AA compliance | CI |

### § 9.2 — Golden snapshots — proceso

```bash
# Generación inicial (story F1-S1):
WS=$(git rev-parse --show-toplevel)
cd ${WS}/vitalia/frontend
npm run test:e2e:visual:update  # genera baseline screenshots por componente

# Verify en CI:
npm run test:e2e:visual  # falla si diff > 0.1% pixels
```

**Storage de goldens:** `vitalia/frontend/e2e/__screenshots__/{spec-name}/{component}-{viewport}.png` · gitignored hasta ratificación · gestionado por `.gitattributes` con LFS si crecen.

### § 9.3 — Por organismo: tests obligatorios

| Organismo | Unit | Integration | Functional E2E | Visual golden | A11y |
|---|---|---|---|---|---|
| `TopBarGlobal` | render con logo + slots | tenant switcher dropdown abre/cierra | abrir tema → cambia · abrir tenant → switchea | full snapshot light + dark | axe pass |
| `ValeriaSidebar` | render 3 estados | keyboard shortcuts C/R/F | press F → expande history · click colapsar → rail | rail snapshot + history snapshot + collapsed | axe pass |
| `ValeriaRail` | render 7 íconos | tooltips aparecen | hover btn → tooltip | full snapshot | axe pass |
| `ValeriaHistory` | render groups + items | search filtra · click item activa | typing search reduce list · click conv → activa | full snapshot | axe pass |
| `ValeriaChat` | render messages bot/user | streaming dots aparecen | composer enter → mensaje aparece | snapshot con 5 mensajes ejemplo | axe pass |
| `Ribbon` | render 6 tabs | active tab change | click tab → URL cambia + tab activa visual | full ribbon snapshot per active tab (6) | axe pass |
| `SubTabsBar` | render sub-tabs per agente | click sub-tab → activa | URL refleja sub-tab | snapshot per agente (6) | axe pass |
| `ShellOrganismLayout` | render 50/50 | resize collapse Valeria | full flow nav cross-agente | snapshot agentic + web modes | axe pass |

### § 9.4 — Playwright `@project=visual` config

```ts
// vitalia/frontend/playwright.config.ts (extiende existente)
projects: [
  // ... smoke, a11y, mobile existentes
  {
    name: 'visual',
    use: {
      ...devices['Desktop Chrome'],
      viewport: { width: 1440, height: 900 },
      colorScheme: 'light',
    },
    snapshotPathTemplate: 'e2e/__screenshots__/{testFilePath}/{arg}{ext}',
    expect: {
      toHaveScreenshot: {
        maxDiffPixelRatio: 0.001,  // 0.1% tolerance
        animations: 'disabled',
        caret: 'hide',
      },
    },
  },
]
```

---

## § 10 — Mapeo Stories Fase 1 → componentes que construyen

> Cada historia es responsable de COMPONENTES CONCRETOS. Sin overlap. Story = ownership atómica.

| Story | Construye | Lifts del mockup | Tests obligatorios |
|---|---|---|---|
| **F1-S0** stack-stability | Shadcn install · tokens base · `.vt-*` deprecation plan | (infra) | Manual browser check + arch test "no .vt-* in new components" |
| **F1-S1** design-tokens-and-theme | `globals.css` vars (§5.1) · `tailwind.config.ts` extend (§5.2) · `<ThemeProvider>` · `ThemeToggle` (§3.2) · `useTheme` hook | Theme toggle ☀️/🌙 visible TopBar | Visual golden light + dark · Vitest theme toggle |
| **F1-S2** topbar-global | `TopBarGlobal` (§3.3) · `LogoMark` (§3.1) | TopBar header completo del mockup | Visual golden · a11y axe |
| **F1-S3** tenant-switcher | `TenantSwitcher` (§3.2) · `TenantOption` (§3.2) · `tenantStore` (§6.3) · API `/api/tenants` consume | Tenant dropdown completo del mockup | Functional E2E (click → switch) · visual golden open+closed |
| **F1-S4** shell-layout-5050 | `ShellOrganismLayout` (§3.4) · route group `app/[tenantId]/(shell-organism)/layout.tsx` · `shellStore.shellMode` (§6.1) | Estructura 50/50 base | Visual golden agentic + web modes |
| **F1-S5** valeria-rail-history | `ValeriaSidebar` · `ValeriaRail` · `ValeriaHistory` (§3.3) · keyboard handlers (§8) · `shellStore.valeriaState` · mock history data | Panel Valeria izq COMPLETO (rail + history transpuesta) | Functional E2E keyboard C/R/F/N · visual golden 3 states · a11y |
| **F1-S6** valeria-chat-skeleton | `ValeriaChat` (§3.3) · `ChatHeader` · `MessageBubble` · `TypingIndicator` · `DelegateMarker` · Composer (Textarea + IconButtons) · `chatStore` mock (§6.4) | Chat mockup con 5 mensajes ejemplo + composer | Visual golden con mensajes · functional (typing en composer) |
| **F1-S7** ribbon-6-tabs | `Ribbon` · `RibbonTab` · `ConfigTab` (§3.2-3.3) · routing wiring | Ribbon 6 tabs completo con active states | Visual golden per active tab (6 variants) · functional click → URL change |
| **F1-S8** sub-tabs-line2 | `SubTabsBar` · `SubTab` (§3.2-3.3) · routing wiring + dynamic per `AGENT_SUBTABS` | Línea 2 sub-tabs per agente | Visual golden 6 variants (per agente) · functional click → URL change |
| **F1-S9** routing-shell | App Router pages (§3.5) · `shell-routes.ts` whitelist (§7.2) · `AGENT_CATALOG` (§7.3) · default redirects · breadcrumb logic | Routing completo funcional | Functional E2E "navego entre tabs y URL refleja" · 404 si agent invalido |
| **F1-S10** empty-states-navegable | `EmptyState` + 22 sub-tab pages cada una con su empty-state · `PlaceholderCard` para casos especiales (Lisa Servicios cards, Conexiones grid, etc.) | Contenido placeholder navegable mockup | Visual golden por sub-tab (22 snapshots) · functional "todas las sub-tabs renderizan algo" |

**Componentes específicos por agente** (Fase 2 — NO en Fase 1, salvo placeholder card mockup):
- `PipelineColumn` → F2-S4 adrian-embudo
- `AgendaSlot` → F2-S1 valeria-agenda
- (etc.)

---

## § 11 — Zero deuda técnica — checklist mandatorio por story

Toda historia DEBE pasar ANTES de merge:

- [ ] Lint 0 errors (ESLint config Vitalia)
- [ ] TypeScript strict 0 errors
- [ ] Vitest unit tests ≥80% coverage del componente nuevo
- [ ] Playwright functional E2E pasa
- [ ] Playwright visual golden generado + reviewed por Chris
- [ ] Playwright a11y axe pass
- [ ] NO `.vt-*` utility classes en código nuevo (arch test bloquea)
- [ ] NO `any` TypeScript (use `unknown` + guards)
- [ ] NO default exports (FSD-Lite enforce)
- [ ] NO cross-feature imports (FSD-Lite enforce)
- [ ] Componente documentado en Storybook (1+ story con variants)
- [ ] Spanish neutro LatAm en strings user-facing (excepto sales_agent voz tenant)
- [ ] CSS variables consumidas (NO hex hardcoded)
- [ ] Mobile responsive (breakpoint md+ minimum)
- [ ] Dark mode soportado (CSS vars switch)
- [ ] Skip link funcional (para organisms top-level)

---

## § 12 — Referencias cruzadas

- **Mockup HTML SSoT visual:** `vitalia/docs/product/stories/vitalia-shell-organism/mockups/dual-mode-shell.html`
- **Baseline funcional shell:** `vitalia/docs/product/stories/vitalia-shell-organism/00-session-baseline.md` (1069 líneas, 17 decisiones)
- **ADR-008 luana-core-ui (proposed):** `docs/architecture/luana-platform/ADR-008-luana-core-ui-shadcn-cli-pattern.md`
- **Engine consumido (Python BE):** `core/luana-core-{iam,platform,channels,copilot,observability,compliance}`
- **Pattern Copilot Nicolify (transponible):** `nicolify/frontend/src/features/copilot/components/CopilotSidebar.tsx`
- **Pattern TenantSwitcher Nicolify (reusable):** `nicolify/frontend/src/components/shared/layout/TenantSwitcher.tsx`
- **Tokens z-index Nicolify (copy-paste):** `nicolify/frontend/src/lib/tokens/z-index.ts`
- **HIPAA-lite overlay:** `vitalia/.claude/rules/hipaa-lite.md` (dual filter, audit log, sanitization en traces)
- **FSD-Lite enforcement:** `.claude/rules/frontend-fsd.md` + arch tests `vitalia/frontend/src/__tests__/architecture/`
- **Spanish neutro:** `.claude/rules/spanish-text.md` (glosario voseo → neutro)

---

## § 13 — Changelog

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0 | 2026-05-22 | Snapshot inicial post-ratificación Chris. 5 decisiones cementadas (D1-D6). 13 secciones. SSoT para todas las stories Fase 1. |
