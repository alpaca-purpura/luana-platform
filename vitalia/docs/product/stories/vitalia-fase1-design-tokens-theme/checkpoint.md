---
story_id: vitalia-fase1-design-tokens-theme
outcome: vitalia-mvp-ui-foundation
phase: fase-1
type: ui-story
agent_owner: shell
module: shell-organism
capability: shell.design-tokens-theme
state: ready
phase_state: READY_PACKAGE_CLOSED
last_modified: 2026-05-22
last_artifact: 06-tickets.yaml
ratified_by_chris: true
ratified_visual_by_chris: true
ratified_visual_at: 2026-05-22T19:00:00-05:00
ratified_visual_iter: 1
ratified_visual_mockups:
  - vitalia/docs/product/stories/vitalia-fase1-design-tokens-theme/mockups/theme-toggle.html
po_ux_iterations: 1
po_ux_decisions_cemented_2026_05_22:
  D1: "light/dark only (enableSystem=false, defaultTheme=light) — scope minimal F1"
  D2: "Mockup theme-toggle.html con 4 states aislados en card neutral (light-idle, light-hover, dark-idle, dark-hover)"
  D3: "Storybook N/A en F1-S1 — diferido a story dedicada futura si se necesita"
  D4: "storageKey='vitalia-theme' namespaced — defense-in-depth multi-brand FE coexistencia"
  D5: "drop useTheme.ts hook wrapper — ThemeToggle.tsx import next-themes directo"
parallel_safe: false
priority: critical
estimated_dev_days: 1-2
dependencies:
  hard: [vitalia-fase1-stack-stability]
  soft: []
blocks_hard: [vitalia-fase1-topbar-global, vitalia-fase1-shell-layout-5050, vitalia-fase1-valeria-rail-history, vitalia-fase1-ribbon-6-tabs]
reuse_map_summary: "REUSE next-themes (npm) · NEW ThemeToggle component · tokens cementados en Design Contract § 5"
spawned_at: 2026-05-22
next_action: "/dev-team vitalia-fase1-design-tokens-theme autonomous build (T-1 fe-next-themes-install first; F1-S0 done state prerequisite — verify done before pickup)"
---

# F1-S1 vitalia-fase1-design-tokens-theme — checkpoint

## Goal

Cementar el sistema de design tokens Vitalia post-Shadcn (CSS vars Shadcn-style + agent tokens) + ThemeProvider + componente `ThemeToggle` operativo con persistencia localStorage. Output: cualquier story Fase 1 onwards puede consumir `bg-primary`, `text-foreground`, `bg-agent-lisa`, etc. + toggle ☀️/🌙 funcional.

## Anti-objetivos

- NO crear TopBarGlobal completo (eso es F1-S2)
- NO tocar `.vt-*` legacy classes (deprecación es story final)
- NO crear theme picker custom (use next-themes oficial)

## Scope verbatim

### § 1 — Instalar next-themes

```bash
cd vitalia/frontend
npm install next-themes
```

### § 2 — `globals.css` con CSS vars completas

Implementar verbatim Design Contract § 5.1: vars Shadcn-style (`--background`, `--foreground`, `--primary`, `--accent`, etc.) + agent tokens (`--agent-lisa`, `--agent-lucas`, `--agent-adrian`, `--agent-valeria`, `--agent-camila`, `--agent-mateo`, `--agent-config`) en `:root` (light) + `.dark` (dark variants).

### § 3 — `tailwind.config.ts` extend

Implementar verbatim Design Contract § 5.2: `colors.{background,foreground,primary,accent,...}` consumiendo `hsl(var(--...))` + `colors.agent.{lisa,lucas,adrian,valeria,camila,mateo,config}`.

### § 4 — ThemeProvider integration

`vitalia/frontend/src/app/layout.tsx`:

```tsx
import { ThemeProvider } from 'next-themes'

<ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem={false}>
  {children}
</ThemeProvider>
```

### § 5 — `ThemeToggle` component

`vitalia/frontend/src/components/shared/shell-organism/ThemeToggle.tsx`:

```tsx
'use client'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Cambiar tema (actual: ${isDark ? 'oscuro' : 'claro'})`}
      aria-pressed={isDark}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      data-testid="theme-toggle"
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  )
}
```

### § 6 — Hook reusable

`vitalia/frontend/src/hooks/useTheme.ts`: re-export de `next-themes` o wrapper si necesita logic adicional (ej. analytics tracking de theme changes).

### § 7 — Storybook story

`vitalia/frontend/src/components/shared/shell-organism/ThemeToggle.stories.tsx`: 2 variants (light · dark) + interaction (`click` cambia tema).

## Acceptance criteria

| AC | Verificación |
|---|---|
| AC-1 | Tailwind class `bg-primary` renderiza con #01b2f8 (light) / mismo dark |
| AC-2 | Tailwind class `bg-agent-lisa` renderiza #00D084 |
| AC-3 | Tailwind class `bg-agent-lucas` renderiza #111111 |
| AC-4 | Click `<ThemeToggle>` alterna `<html data-theme="light">` ↔ `data-theme="dark"` |
| AC-5 | localStorage `vitalia-theme` (o key next-themes) persiste selección |
| AC-6 | Reload página preserva theme seleccionado |
| AC-7 | a11y: button tiene `aria-label` + `aria-pressed` correcto |
| AC-8 | Playwright visual golden: ThemeToggle light + dark snapshots |
| AC-9 | Vitest unit: render + interaction + state change |
| AC-10 | NO `.vt-*` class usada en código nuevo |

## Gherkin scenarios

### Scenario 1 — happy theme toggle

**Given:** Usuario en cualquier ruta `(shell-organism)/...`, theme actual `light`

**When:** Click `[data-testid="theme-toggle"]`

**Then:**
- `<html data-theme>` cambia a `dark`
- localStorage actualizado
- Icon cambia de 🌙 a ☀️
- CSS vars switch a dark variants (verificable: `getComputedStyle(body).backgroundColor` cambia)

### Scenario 2 — persistence reload

**Given:** Usuario seteó `dark` theme

**When:** Reload página (F5)

**Then:**
- Theme `dark` se mantiene
- `<html data-theme="dark">` desde el SSR
- NO flash of light (FOUC) — next-themes maneja hydration

### Scenario 3 — agent tokens accessible

**Given:** Tailwind config con agent colors

**When:** `<div className="bg-agent-camila text-white">test</div>` en componente

**Then:**
- Background = `hsl(244 84% 32%)` ≈ `#180d95`
- Text white
- Dark mode: `bg-agent-camila-soft` aplica si se usa

### Scenario 4 — a11y axe pass

**Given:** ThemeToggle renderizado

**When:** Playwright axe-core scan

**Then:** No violations (button has accessible name, role, state)

## Deliverables

| File | Acción |
|---|---|
| `vitalia/frontend/package.json` | MODIFY (+ next-themes) |
| `vitalia/frontend/src/app/globals.css` | MODIFY (full CSS vars per Design Contract § 5.1) |
| `vitalia/frontend/tailwind.config.ts` | MODIFY (extend colors per § 5.2) |
| `vitalia/frontend/src/app/layout.tsx` | MODIFY (wrap ThemeProvider) |
| `vitalia/frontend/src/components/shared/shell-organism/ThemeToggle.tsx` | NEW |
| `vitalia/frontend/src/components/shared/shell-organism/ThemeToggle.stories.tsx` | NEW |
| `vitalia/frontend/src/components/shared/shell-organism/ThemeToggle.test.tsx` | NEW |
| `vitalia/frontend/src/hooks/useTheme.ts` | NEW |
| `vitalia/frontend/e2e/shell-organism/theme-toggle.spec.ts` | NEW |
| `vitalia/frontend/e2e/__screenshots__/shell/theme-toggle-{light,dark}.png` | NEW (goldens) |

## Próximo paso post-done

F1-S2 `vitalia-fase1-topbar-global` arranca refining. Consume `ThemeToggle` como child del TopBar.
