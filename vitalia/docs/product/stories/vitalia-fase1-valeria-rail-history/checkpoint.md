---
story_id: vitalia-fase1-valeria-rail-history
outcome: vitalia-mvp-ui-foundation
phase: fase-1
type: ui-story
agent_owner: shell
module: shell-organism
capability: shell.valeria-sidebar
state: idea
last_modified: 2026-05-22
ratified_by_chris: false
parallel_safe: true
priority: high
estimated_dev_days: 2-3
dependencies:
  hard: [vitalia-fase1-shell-layout-5050]
  soft: []
blocks_hard: [vitalia-fase1-valeria-chat-skeleton]
reuse_map_summary: "REUSE 80% nicolify CopilotSidebar (TRANSPONER grid · invertir [chat][rail] → [rail][chat]) · adapt widths · renombrar Valeria · CSS vars Vitalia"
spawned_at: 2026-05-22
next_action: "/po-ux refinar 01-spec.md"
---

# F1-S5 vitalia-fase1-valeria-rail-history — checkpoint

## Goal

`ValeriaSidebar` organismo: panel izquierdo 50% con grid interno `[Rail/History] [Chat]` (transpuesta del Copilot Nicolify pegado al borde derecho). 3 estados (collapsed · rail · full) con keyboard shortcuts C/R/F/N/Esc/Cmd+K. Rail 60px con 7 íconos · History 280px con buscador + grupos Hoy/Ayer/Esta semana + lista conversaciones placeholder.

## Anti-objetivos

- NO implementar chat real (eso es F1-S6 — solo el slot vacío estructural)
- NO implementar mensajería WebSocket (Fase 2)
- NO implementar funcionalidad "Nueva conversación" real (mock alert por ahora)
- NO crear API `/api/conversations` real (mock data hardcoded)

## Scope verbatim

### § 1 — `ValeriaSidebar` organismo

`vitalia/frontend/src/components/shared/shell-organism/ValeriaSidebar.tsx`:

```tsx
'use client'
import { useShellStore } from '@/stores/shell-store'
import { ValeriaRail } from './ValeriaRail'
import { ValeriaHistory } from './ValeriaHistory'
import { ValeriaChatSlot } from './ValeriaChatSlot'  // placeholder F1-S6

export function ValeriaSidebar() {
  const { valeriaState, setValeriaState, cycleValeriaState } = useShellStore()

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'c': () => setValeriaState('collapsed'),
    'r': () => setValeriaState('rail'),
    'f': () => setValeriaState('full'),
    'n': () => alert('Nueva conversación (mock)'),
    'Escape': () => setValeriaState('collapsed'),
    'mod+k': () => document.getElementById('valeria-composer')?.focus(),
  })

  const railOrHistoryWidth = valeriaState === 'full' ? 280 : 60

  return (
    <aside
      role="complementary"
      aria-label="Panel Valeria"
      aria-expanded={valeriaState !== 'collapsed'}
      data-testid="valeria-sidebar"
      className="h-full overflow-hidden border-r border-border bg-card"
      style={{
        display: 'grid',
        gridTemplateColumns: `${railOrHistoryWidth}px 1fr`,
        gridTemplateRows: 'minmax(0, 1fr)',
        transition: 'grid-template-columns 220ms cubic-bezier(.2,.8,.2,1)',
      }}
    >
      {valeriaState === 'full' ? <ValeriaHistory /> : <ValeriaRail />}
      <ValeriaChatSlot />
    </aside>
  )
}
```

### § 2 — `ValeriaRail` molécula

`vitalia/frontend/src/components/shared/shell-organism/ValeriaRail.tsx`:

7 botones (per mockup):
- 📂 toggle history (action: cycleValeriaState)
- ➕ nueva conversación (alert mock)
- 🔍 buscar (focus composer Cmd+K)
- divider
- 📌 anclados (Fase 2)
- ✅ tareas (Fase 2)
- 📝 notas (Fase 2)
- spacer (flex-1)
- ⏴ collapsar (setValeriaState 'collapsed')

Cada botón = Shadcn `<Button variant="ghost" size="icon">` + Tooltip con keyboard hint.

### § 3 — `ValeriaHistory` molécula

`vitalia/frontend/src/components/shared/shell-organism/ValeriaHistory.tsx`:

- Header: title "Conversaciones" + acciones (➕ nueva · ⏴ colapsar)
- Search: Input con placeholder "Buscar conversación..."
- HistoryGroup × 3:
  - "Hoy" — 3 items mock
  - "Ayer" — 2 items mock
  - "Esta semana" — 3 items mock
- Scrollable

Mock data hardcoded en `vitalia/frontend/src/components/shared/shell-organism/_mock-conversations.ts`:

```ts
export const MOCK_CONVERSATIONS = [
  { id: '1', title: 'Resumen reseñas semana', meta: '14:32 · 8 mensajes', group: 'today' },
  // ... 8 total
]
```

### § 4 — `HistoryItem` + `HistoryGroup` moléculas

`HistoryItem.tsx`: item clicable con title + meta + active state
`HistoryGroup.tsx`: section con label + items[]

### § 5 — `useKeyboardShortcuts` hook

`vitalia/frontend/src/hooks/useKeyboardShortcuts.ts`:

```ts
import { useEffect } from 'react'

export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const inInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      if (inInput && !e.metaKey && !e.ctrlKey) return

      const key = e.key.toLowerCase()
      const modKey = e.metaKey || e.ctrlKey ? `mod+${key}` : key

      const action = shortcuts[modKey] || shortcuts[e.key]
      if (action) {
        e.preventDefault()
        action()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [shortcuts])
}
```

### § 6 — Replace ValeriaSidebarSlot in ShellOrganismLayout

Update F1-S4 layout para usar `<ValeriaSidebar />` real en vez de placeholder.

### § 7 — Mobile drawer pattern

En `< md` viewport: ValeriaSidebar fixed inset-y-0 left-0 z-60 con backdrop. Slide-in animation. Botón hamburger en TopBar lo abre.

## Acceptance criteria

| AC | Verificación |
|---|---|
| AC-1 | ValeriaSidebar renderiza con grid `[60px][1fr]` en state `rail` (default) |
| AC-2 | Press `F` → grid switches `[280px][1fr]` (history visible) |
| AC-3 | Press `R` → vuelve a rail |
| AC-4 | Press `C` o `Esc` → collapsed `[60px][0]` |
| AC-5 | Press `N` → alert "Nueva conversación (mock)" |
| AC-6 | Cmd/Ctrl+K → focus composer (cuando F1-S6 esté listo · placeholder por ahora) |
| AC-7 | Rail muestra 7 íconos + tooltips al hover |
| AC-8 | History muestra search + 3 grupos con 8 conversaciones mock |
| AC-9 | Click history item activa con bg-agent-valeria-soft |
| AC-10 | Visual golden 3 states (collapsed · rail · full) light + dark |
| AC-11 | a11y: `aria-expanded` + `aria-label` correctos |
| AC-12 | Mobile: drawer behavior |
| AC-13 | localStorage shellStore persiste valeriaState |
| AC-14 | Vitest unit + Playwright functional + a11y axe pass |

## Gherkin scenarios

### Scenario 1 — happy keyboard cycle

**Given:** Shell carga con valeriaState `rail` (default)

**When:**
1. Press `F`
2. Press `R`
3. Press `C`
4. Press `Esc`

**Then:**
- F → history expandido (280px)
- R → rail (60px)
- C → collapsed (60px chat hidden)
- Esc → idem collapsed

### Scenario 2 — input focus respect

**Given:** Focus en `<input>` (ej. search)

**When:** Press `F`

**Then:**
- NO cambia valeriaState (handler skip si focus en input)
- Letra F se escribe en el input normalmente

### Scenario 3 — history click

**Given:** History expandido, item "Resumen reseñas semana" no activo

**When:** Click ese item

**Then:**
- Item activa con bg-agent-valeria-soft
- Otros items des-activan
- (Fase 2: cambia conversación activa en chat — placeholder por ahora)

### Scenario 4 — mobile drawer

**Given:** Viewport 375x667, ValeriaSidebar oculto

**When:** Click burger en TopBar

**Then:**
- ValeriaSidebar slide-in desde izq con backdrop
- Press Esc o backdrop click → cierra
- aria-modal correcto

### Scenario 5 — visual golden parity con mockup

**Given:** ValeriaSidebar render state `full`

**When:** Playwright `toHaveScreenshot()`

**Then:**
- Visual match con mockup `dual-mode-shell.html` (history view exact pixel)
- Tolerance `maxDiffPixelRatio: 0.001`

## Deliverables

| File | Acción |
|---|---|
| `vitalia/frontend/src/components/shared/shell-organism/ValeriaSidebar.tsx` | NEW |
| `vitalia/frontend/src/components/shared/shell-organism/ValeriaRail.tsx` | NEW |
| `vitalia/frontend/src/components/shared/shell-organism/ValeriaHistory.tsx` | NEW |
| `vitalia/frontend/src/components/shared/shell-organism/HistoryItem.tsx` | NEW |
| `vitalia/frontend/src/components/shared/shell-organism/HistoryGroup.tsx` | NEW |
| `vitalia/frontend/src/components/shared/shell-organism/ValeriaChatSlot.tsx` | NEW (placeholder F1-S6) |
| `vitalia/frontend/src/components/shared/shell-organism/_mock-conversations.ts` | NEW |
| `vitalia/frontend/src/hooks/useKeyboardShortcuts.ts` | NEW |
| `vitalia/frontend/src/components/shared/shell-organism/ShellOrganismLayout.tsx` | MODIFY (replace ValeriaSidebarSlot) |
| `vitalia/frontend/e2e/shell-organism/valeria-sidebar.spec.ts` | NEW |
| `vitalia/frontend/e2e/__screenshots__/shell/valeria-{collapsed,rail,full}-{light,dark}.png` | NEW (6 goldens) |

## Próximo paso post-done

F1-S6 valeria-chat-skeleton reemplaza ChatSlot con chat real.
