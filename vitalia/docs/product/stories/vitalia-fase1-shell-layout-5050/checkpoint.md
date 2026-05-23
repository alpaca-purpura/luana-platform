---
story_id: vitalia-fase1-shell-layout-5050
outcome: vitalia-mvp-ui-foundation
phase: fase-1
type: ui-story
agent_owner: shell
module: shell-organism
capability: shell.layout-5050
state: refined
last_modified: 2026-05-23
ratified_by_chris: true
ratified_at: 2026-05-23T13:45:00Z
ratified_visual_by_chris: true                     # gate bloqueante satisfecho
ratified_visual_at: 2026-05-23T13:45:00Z
ratified_visual_iter: 4                            # v1 base · v2 resize dynamic + state toggle · v3 LogoMark assets · v4 CSS swap fix
ratified_visual_mockups:
  - vitalia/docs/product/stories/vitalia-fase1-shell-layout-5050/mockups/shell-layout-agentic.html
  - vitalia/docs/product/stories/vitalia-fase1-shell-layout-5050/mockups/shell-layout-web.html
transitioned_to_refined_at: 2026-05-23T13:45:00Z
parallel_safe: false
priority: critical
estimated_dev_days: 1-2
dependencies:
  hard: [vitalia-fase1-stack-stability, vitalia-fase1-design-tokens-theme, vitalia-fase1-topbar-global]
  soft: [vitalia-fase1-tenant-switcher]
blocks_hard: [vitalia-fase1-valeria-rail-history, vitalia-fase1-valeria-chat-skeleton, vitalia-fase1-ribbon-6-tabs, vitalia-fase1-routing-shell, vitalia-fase1-empty-states]
hard_deps_status: "CHAIN F1-S0..S3 COMPLETE 2026-05-23 — blocker_hard removido por /pm-vitalia"
reuse_map_summary: "NEW shell layout · route group `(shell-organism)/` paralelo a `(dashboard)/` legacy · zustand shellStore para mode (agentic/web)"
spawned_at: 2026-05-22
transitioned_to_refining_at: 2026-05-23
next_action: "/architect vitalia vitalia-fase1-shell-layout-5050 → lee 01-spec.md + 2 mockups ratificados → produce ready package (03-arch.md + 04-validators.yaml + 05-guidelines.md + 06-tickets.yaml) → transition refined→ready"
---

# F1-S4 vitalia-fase1-shell-layout-5050 — checkpoint

## Goal

Crear el layout root del route group `(shell-organism)/` con split 50/50 (modo agentic default): TopBarGlobal arriba + Grid `[ValeriaPanel 50%] [AppPanel 50%]` debajo. Soportar modo web alternativo (Valeria collapsed a rail · App 100%). Mobile responsive.

## Anti-objetivos

- NO incluir contenido del ValeriaPanel (eso es F1-S5 + F1-S6)
- NO incluir contenido del AppPanel (eso es F1-S7 + F1-S8 + F1-S10)
- NO touch `(dashboard)/` legacy

## Scope verbatim

### § 1 — Route group + layout root

`vitalia/frontend/src/app/[tenantId]/(shell-organism)/layout.tsx`:

```tsx
import { ShellOrganismLayout } from '@/components/shared/shell-organism/ShellOrganismLayout'

export default function Layout({ children, params }: { children: React.ReactNode, params: { tenantId: string } }) {
  return <ShellOrganismLayout tenantId={params.tenantId}>{children}</ShellOrganismLayout>
}
```

### § 2 — `ShellOrganismLayout` template

`vitalia/frontend/src/components/shared/shell-organism/ShellOrganismLayout.tsx`:

```tsx
'use client'
import { TopBarGlobal } from './TopBarGlobal'
import { ValeriaSidebarSlot } from './ValeriaSidebarSlot'  // placeholder F1-S5
import { AppPanelSlot } from './AppPanelSlot'              // placeholder F1-S7
import { useShellStore } from '@/stores/shell-store'

export function ShellOrganismLayout({ children, tenantId }: { children: React.ReactNode, tenantId: string }) {
  const shellMode = useShellStore(s => s.shellMode)

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopBarGlobal />
      <main
        id="main-content"
        tabIndex={-1}
        className={cn(
          'flex-1 grid overflow-hidden',
          shellMode === 'agentic' ? 'grid-cols-2' : 'grid-cols-[60px_1fr]'
        )}
      >
        <ValeriaSidebarSlot />
        <AppPanelSlot>{children}</AppPanelSlot>
      </main>
    </div>
  )
}
```

### § 3 — Placeholders Valeria + App

`ValeriaSidebarSlot.tsx`: aside vacío con border-right + class `bg-card`
`AppPanelSlot.tsx`: section vacío con `{children}` slot

Estos serán reemplazados en F1-S5/S7 con componentes reales.

### § 4 — `shellStore` zustand

`vitalia/frontend/src/stores/shell-store.ts`: (per Design Contract § 6.1)

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ValeriaState = 'collapsed' | 'rail' | 'full'
type ShellMode = 'agentic' | 'web'

interface ShellStore {
  valeriaState: ValeriaState
  shellMode: ShellMode
  setValeriaState: (s: ValeriaState) => void
  cycleValeriaState: () => void
  setShellMode: (m: ShellMode) => void
}

export const useShellStore = create<ShellStore>()(
  persist(
    (set, get) => ({
      valeriaState: 'rail',
      shellMode: 'agentic',
      setValeriaState: (s) => set({ valeriaState: s }),
      cycleValeriaState: () => set({ valeriaState: get().valeriaState === 'full' ? 'rail' : 'full' }),
      setShellMode: (m) => set({ shellMode: m }),
    }),
    { name: 'vitalia-shell-state' }
  )
)
```

### § 5 — Mobile drawer pattern

En viewport `< md` (768px):
- Grid switchea a `grid-cols-1` (App panel ocupa todo)
- ValeriaSidebar oculto by default, accesible via FAB/burger menu
- Cuando abre: fixed inset-y-0 left-0 z-50 con backdrop

### § 6 — Default landing page

`vitalia/frontend/src/app/[tenantId]/(shell-organism)/page.tsx`:

```tsx
import { redirect } from 'next/navigation'

export default function ShellRootPage({ params }: { params: { tenantId: string } }) {
  redirect(`/${params.tenantId}/lisa/marca`)
}
```

## Acceptance criteria

| AC | Verificación |
|---|---|
| AC-1 | URL `/{tenant}/(shell-organism)` → redirect a `/lisa/marca` |
| AC-2 | Grid 50/50 visible: ValeriaPanel left · AppPanel right |
| AC-3 | TopBar siempre visible top 48px |
| AC-4 | `main` element tiene `id="main-content"` + `tabIndex={-1}` (skip link target) |
| AC-5 | shellMode toggle (test via store dev mode) switchea grid: agentic 50/50 ↔ web 60px/1fr |
| AC-6 | shellMode persiste en localStorage |
| AC-7 | Mobile (375px): grid colapsa a 1 column · ValeriaPanel oculto |
| AC-8 | Visual golden agentic mode + web mode (light + dark) |
| AC-9 | `(dashboard)/` legacy sigue funcionando (no rompe) |
| AC-10 | Vitest unit ShellOrganismLayout |
| AC-11 | Playwright functional: navegar a shell → ver grid 50/50 |

## Gherkin scenarios

### Scenario 1 — happy 50/50 render

**Given:** Usuario en `/{tenant}/(shell-organism)/lisa/marca`

**When:** Página carga

**Then:**
- Grid template columns = `1fr 1fr`
- ValeriaPanel ocupa 50% izq, AppPanel 50% der
- TopBar 48px arriba
- shellMode `agentic` (default)

### Scenario 2 — mode web toggle (dev test)

**Given:** shellMode `agentic`

**When:** Dispatch `setShellMode('web')` (dev test, no UI todavía)

**Then:**
- Grid template columns = `60px 1fr`
- ValeriaPanel se reduce a rail
- AppPanel ocupa el resto
- localStorage persist

### Scenario 3 — mobile drawer

**Given:** Viewport 375x667

**When:** Página carga

**Then:**
- Grid colapsa a 1 column
- ValeriaPanel oculto (display: none o translate-x-full)
- TopBar incluye botón burger (visible solo mobile)

### Scenario 4 — legacy compat

**Given:** Usuario navega a `/{tenant}/dashboard` (legacy `/(dashboard)/`)

**When:** Página carga

**Then:**
- Layout legacy renderiza (no shell-organism)
- Sidebar 240px + TopBar 56px viejo
- Sin breaking changes

## Deliverables

| File | Acción |
|---|---|
| `vitalia/frontend/src/app/[tenantId]/(shell-organism)/layout.tsx` | NEW |
| `vitalia/frontend/src/app/[tenantId]/(shell-organism)/page.tsx` | NEW (redirect) |
| `vitalia/frontend/src/components/shared/shell-organism/ShellOrganismLayout.tsx` | NEW |
| `vitalia/frontend/src/components/shared/shell-organism/ValeriaSidebarSlot.tsx` | NEW (placeholder) |
| `vitalia/frontend/src/components/shared/shell-organism/AppPanelSlot.tsx` | NEW (placeholder) |
| `vitalia/frontend/src/stores/shell-store.ts` | NEW |
| `vitalia/frontend/e2e/shell-organism/layout-5050.spec.ts` | NEW |
| `vitalia/frontend/e2e/__screenshots__/shell/layout-{agentic,web}-{light,dark}.png` | NEW |

## Próximo paso post-done

F1-S5 valeria-rail-history + F1-S7 ribbon-6-tabs pueden arrancar en paralelo (independientes entre sí).
