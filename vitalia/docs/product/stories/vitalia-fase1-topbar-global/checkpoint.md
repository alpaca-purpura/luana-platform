---
story_id: vitalia-fase1-topbar-global
outcome: vitalia-mvp-ui-foundation
phase: fase-1
type: ui-story
agent_owner: shell
module: shell-organism
capability: shell.topbar-global
state: idea
last_modified: 2026-05-22
ratified_by_chris: false
parallel_safe: false
priority: critical
estimated_dev_days: 1
dependencies:
  hard: [vitalia-fase1-stack-stability, vitalia-fase1-design-tokens-theme]
  soft: []
blocks_hard: [vitalia-fase1-shell-layout-5050]
reuse_map_summary: "NEW LogoMark + TopBarGlobal composes ThemeToggle (F1-S1) + TenantSwitcher slot (F1-S3)"
spawned_at: 2026-05-22
next_action: "/po-ux refinar 01-spec.md"
---

# F1-S2 vitalia-fase1-topbar-global — checkpoint

## Goal

Crear `TopBarGlobal` (organismo) + `LogoMark` (átomo) — la barra superior thin de 48px que aparece en todas las rutas del shell-organism. Compone logo izquierda + slot acciones derecha (ThemeToggle + TenantSwitcher placeholder).

## Anti-objetivos

- NO incluir TenantSwitcher funcional (F1-S3) — solo placeholder `<TenantSwitcherSlot />` o `null`
- NO tocar shell layout 50/50 (F1-S4)
- NO incluir notificaciones bell icon (Fase 2 postponed)

## Scope verbatim

### § 1 — `LogoMark` átomo

`vitalia/frontend/src/components/shared/shell-organism/LogoMark.tsx`:

Props:
- `size?: 'sm' | 'md' | 'lg'` (default 'md')
- `variant?: 'full' | 'mark'` (default 'full' = mark + "Vitalia" text · 'mark' = solo cuadrado V gradiente)

Visual contract (Design Contract § 3.1):
- Cuadrado 28x28 (md) con gradient 135° `from-agent-adrian to-agent-valeria` (#01b2f8 → #7b2d91)
- Letra "V" white center
- Si `variant="full"`: + texto "Vitalia" font-weight 700 size 16px al lado

```tsx
// Ejemplo (Spanish neutro)
export function LogoMark({ size = 'md', variant = 'full' }: LogoMarkProps) {
  return (
    <a href="/" className="flex items-center gap-2" aria-label="Vitalia inicio">
      <div className={cn('rounded-lg bg-gradient-to-br from-agent-adrian to-agent-valeria flex items-center justify-center text-white font-bold', sizeClass[size])}>
        V
      </div>
      {variant === 'full' && <span className="font-bold text-foreground">Vitalia</span>}
    </a>
  )
}
```

### § 2 — `TopBarGlobal` organismo

`vitalia/frontend/src/components/shared/shell-organism/TopBarGlobal.tsx`:

```tsx
<header
  role="banner"
  className="h-12 border-b border-border bg-background flex items-center justify-between px-5 relative z-50"
  data-testid="topbar-global"
>
  <LogoMark />
  <div className="flex items-center gap-2">
    <ThemeToggle />
    <TenantSwitcherSlot />  {/* placeholder en F1-S2, real component en F1-S3 */}
  </div>
</header>
```

### § 3 — `TenantSwitcherSlot` placeholder

`vitalia/frontend/src/components/shared/shell-organism/TenantSwitcherSlot.tsx`:

Por ahora retorna `null` con TODO comment apuntando a F1-S3. Cuando F1-S3 merge, esta linea se reemplaza con `<TenantSwitcher />` real.

### § 4 — Skip link a11y

En `app/layout.tsx` o `(shell-organism)/layout.tsx` agregar antes del shell:

```tsx
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-[200] focus:p-2 focus:bg-primary focus:text-primary-foreground">
  Saltar al contenido
</a>
```

## Acceptance criteria

| AC | Verificación |
|---|---|
| AC-1 | TopBar renderiza altura exacta 48px (h-12) |
| AC-2 | LogoMark visible izquierda con gradient correcto |
| AC-3 | ThemeToggle visible derecha (funcional desde F1-S1) |
| AC-4 | TenantSwitcherSlot retorna placeholder/null (real en F1-S3) |
| AC-5 | Skip link aparece al press Tab desde body root |
| AC-6 | TopBar tiene `role="banner"` |
| AC-7 | LogoMark `<a>` tiene `aria-label="Vitalia inicio"` |
| AC-8 | Visual golden snapshot match mockup |
| AC-9 | Light + Dark mode ambos renderizan correctamente |
| AC-10 | Mobile responsive (≥375px) sin overflow |

## Gherkin scenarios

### Scenario 1 — happy render

**Given:** Usuario navega a `/{tenant}/(shell-organism)/lisa/marca`

**When:** Página carga

**Then:**
- TopBar visible top con altura 48px exacta
- LogoMark izquierda con "V" + "Vitalia"
- ThemeToggle visible derecha
- NO TenantSwitcher real (placeholder)

### Scenario 2 — skip link a11y

**Given:** Usuario en cualquier shell route

**When:** Press `Tab` desde page root

**Then:**
- Skip link "Saltar al contenido" visible top-left con focus ring
- Press Enter → focus salta a `#main-content`

### Scenario 3 — mobile responsive

**Given:** Viewport 375x667

**When:** Página carga

**Then:**
- TopBar mantiene 48px altura
- Logo "Vitalia" texto puede ocultarse si necesita (only `variant="mark"` en mobile)
- ThemeToggle visible

### Scenario 4 — theme switch persists across TopBar

**Given:** TopBar visible, theme light

**When:** Click ThemeToggle

**Then:**
- TopBar bg cambia a dark mode
- Border color switch
- LogoMark gradient mantiene (es brand, no theme-dependent)

## Deliverables

| File | Acción |
|---|---|
| `vitalia/frontend/src/components/shared/shell-organism/LogoMark.tsx` | NEW |
| `vitalia/frontend/src/components/shared/shell-organism/LogoMark.stories.tsx` | NEW |
| `vitalia/frontend/src/components/shared/shell-organism/LogoMark.test.tsx` | NEW |
| `vitalia/frontend/src/components/shared/shell-organism/TopBarGlobal.tsx` | NEW |
| `vitalia/frontend/src/components/shared/shell-organism/TopBarGlobal.stories.tsx` | NEW |
| `vitalia/frontend/src/components/shared/shell-organism/TopBarGlobal.test.tsx` | NEW |
| `vitalia/frontend/src/components/shared/shell-organism/TenantSwitcherSlot.tsx` | NEW (placeholder) |
| `vitalia/frontend/e2e/shell-organism/topbar.spec.ts` | NEW |
| `vitalia/frontend/e2e/__screenshots__/shell/topbar-{light,dark}.png` | NEW |

## Próximo paso post-done

F1-S3 `vitalia-fase1-tenant-switcher` arranca refining. Reemplaza `TenantSwitcherSlot` con componente real.
