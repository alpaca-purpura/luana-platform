---
story_id: vitalia-fase1-ribbon-6-tabs
outcome: vitalia-mvp-ui-foundation
phase: fase-1
type: ui-story
agent_owner: shell
module: shell-organism
capability: shell.ribbon
state: idea
last_modified: 2026-05-22
ratified_by_chris: false
parallel_safe: true
priority: high
estimated_dev_days: 1-2
dependencies:
  hard: [vitalia-fase1-shell-layout-5050, vitalia-fase1-design-tokens-theme]
  soft: []
blocks_hard: [vitalia-fase1-sub-tabs-line2, vitalia-fase1-routing-shell]
reuse_map_summary: "NEW ribbon component · consume Next.js router para active state · PNGs agentes ya en /public/agents/"
spawned_at: 2026-05-22
next_action: "/po-ux refinar 01-spec.md"
---

# F1-S7 vitalia-fase1-ribbon-6-tabs — checkpoint

## Goal

`Ribbon` organismo: barra horizontal arriba del AppPanel con 5 RibbonTabs (Lisa · Lucas · Adrián · Valeria · Camila) + 1 ConfigTab (⚙️ Configurar al final right-aligned). Active state per URL segment `[agent]`. Click navega a default subtab del agente.

## Anti-objetivos

- NO incluir sub-tabs línea 2 (eso es F1-S8)
- NO implementar content per tab (eso son empty-states F1-S10 + Fase 2)
- NO bell icon notifications (Fase 2 postponed)

## Scope verbatim

### § 1 — `AGENT_CATALOG` constant

`vitalia/frontend/src/lib/agents/catalog.ts` (per Design Contract § 7.3):

```ts
export type AgentKey = 'lisa' | 'lucas' | 'adrian' | 'valeria' | 'camila' | 'config'

export const AGENT_CATALOG: Record<AgentKey, AgentMeta> = {
  lisa:    { tabLabel: 'Mi Clínica', role: 'Lisa',    color: 'lisa',    avatarSrc: '/agents/lisa/thumbnail.png' },
  lucas:   { tabLabel: 'Atraer',     role: 'Lucas',   color: 'lucas',   avatarSrc: '/agents/lucas/thumbnail.png' },
  adrian:  { tabLabel: 'Vender',     role: 'Adrián',  color: 'adrian',  avatarSrc: '/agents/adrian/thumbnail.png' },
  valeria: { tabLabel: 'Operar',     role: 'Valeria', color: 'valeria', avatarSrc: '/agents/valeria/thumbnail.png' },
  camila:  { tabLabel: 'Mantener',   role: 'Camila',  color: 'camila',  avatarSrc: '/agents/camila/thumbnail.png' },
  config:  { tabLabel: 'Configurar', role: 'Admin',   color: 'config',  iconName: 'Settings' },
}

export const AGENT_DEFAULT_SUBTAB: Record<AgentKey, string> = {
  lisa: 'marca', lucas: 'lanzar', adrian: 'inbox', valeria: 'agenda', camila: 'voz', config: 'cuenta',
}
```

### § 2 — `Ribbon` organismo

`vitalia/frontend/src/components/shared/shell-organism/Ribbon.tsx`:

```tsx
'use client'
import { usePathname, useRouter, useParams } from 'next/navigation'
import { RibbonTab } from './RibbonTab'
import { ConfigTab } from './ConfigTab'
import { AGENT_CATALOG, AGENT_DEFAULT_SUBTAB, AgentKey } from '@/lib/agents/catalog'

const AGENT_ORDER: AgentKey[] = ['lisa', 'lucas', 'adrian', 'valeria', 'camila']

export function Ribbon() {
  const pathname = usePathname()
  const router = useRouter()
  const params = useParams<{ tenantId: string }>()

  // Extract active agent from URL (e.g. /sonrisa-plena/lisa/marca → 'lisa')
  const activeAgent = extractAgentFromPath(pathname)

  const handleClick = (agent: AgentKey) => {
    router.push(`/${params.tenantId}/${agent}/${AGENT_DEFAULT_SUBTAB[agent]}`)
  }

  return (
    <nav
      role="tablist"
      aria-label="Agentes"
      className="h-14 bg-card border-b border-border flex items-stretch px-3 gap-1 overflow-x-auto"
    >
      {AGENT_ORDER.map(agent => (
        <RibbonTab
          key={agent}
          agent={agent}
          active={activeAgent === agent}
          onClick={() => handleClick(agent)}
        />
      ))}
      <div className="ml-auto" />
      <ConfigTab active={activeAgent === 'config'} onClick={() => handleClick('config')} />
    </nav>
  )
}
```

### § 3 — `RibbonTab` molécula

`vitalia/frontend/src/components/shared/shell-organism/RibbonTab.tsx`:

```tsx
import Image from 'next/image'
import { AGENT_CATALOG, AgentKey } from '@/lib/agents/catalog'
import { cn } from '@/lib/utils'

const COLOR_BORDER_CLASS: Record<AgentKey, string> = {
  lisa: 'border-b-agent-lisa',
  lucas: 'border-b-agent-lucas',
  adrian: 'border-b-agent-adrian',
  valeria: 'border-b-agent-valeria',
  camila: 'border-b-agent-camila',
  config: 'border-b-agent-config',
}

export function RibbonTab({ agent, active, onClick }: { agent: AgentKey, active: boolean, onClick: () => void }) {
  const meta = AGENT_CATALOG[agent]
  return (
    <button
      role="tab"
      aria-selected={active}
      data-testid={`ribbon-tab-${agent}`}
      data-color={agent}
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 border-b-[3px] border-transparent text-sm font-medium transition-all',
        active ? cn('text-foreground font-semibold', COLOR_BORDER_CLASS[agent]) : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <Image
        src={meta.avatarSrc!}
        alt=""
        width={28}
        height={28}
        className={cn('rounded-full border-2', active ? `border-agent-${agent}` : 'border-transparent')}
      />
      <span className="flex flex-col items-start leading-tight">
        <span>{meta.tabLabel}</span>
        <span className="text-[10px] text-muted-foreground">{meta.role}</span>
      </span>
    </button>
  )
}
```

### § 4 — `ConfigTab` molécula

Similar a RibbonTab pero con `<Settings />` Lucide icon en cuadrado `bg-muted` en vez de PNG avatar. Right-aligned via `ml-auto`.

### § 5 — Replace AppPanelSlot wrapper

Update F1-S4 `AppPanelSlot.tsx` para usar:

```tsx
<section className="grid grid-rows-[auto_auto_1fr] overflow-hidden">
  <Ribbon />
  <SubTabsBarSlot />   {/* F1-S8 placeholder */}
  <div className="overflow-y-auto p-7">{children}</div>
</section>
```

### § 6 — Helper `extractAgentFromPath`

```ts
export function extractAgentFromPath(pathname: string): AgentKey | null {
  // /{tenantId}/{agent}/{subtab}/...
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length < 2) return null
  const agent = segments[1]
  return isValidAgent(agent) ? agent : null
}
```

## Acceptance criteria

| AC | Verificación |
|---|---|
| AC-1 | Ribbon visible top del AppPanel altura 56px |
| AC-2 | 5 RibbonTabs renderizados con PNG avatars |
| AC-3 | ConfigTab al final right-aligned con `<Settings />` icon |
| AC-4 | Tab activa: border-bottom 3px color agente + avatar border color |
| AC-5 | Tab inactiva: muted-foreground · hover bg-muted |
| AC-6 | Click tab → router.push `/{tenant}/{agent}/{default-subtab}` |
| AC-7 | URL change updates active state |
| AC-8 | a11y: `role="tablist"` + `role="tab"` + `aria-selected` |
| AC-9 | Visual golden 6 variants (per active tab) light + dark |
| AC-10 | Horizontal scroll en viewport estrecho |
| AC-11 | Vitest unit + Playwright functional |
| AC-12 | Avatar fallback (next/image onError) o fallback con role text |

## Gherkin scenarios

### Scenario 1 — happy click tab

**Given:** Usuario en `/{tenant}/lisa/marca`, active tab Lisa

**When:** Click RibbonTab "Atraer" (Lucas)

**Then:**
- router.push `/{tenant}/lucas/lanzar` (default subtab Lucas)
- Active tab cambia a Lucas con border bg-agent-lucas
- Avatar Lucas border highlight

### Scenario 2 — URL deep link

**Given:** Usuario navega directamente a `/{tenant}/camila/voz`

**When:** Página carga

**Then:**
- Active tab Camila marca correcto
- URL refleja agent + subtab
- Sub-tabs (F1-S8) muestra opciones Camila (cuando S8 listo)

### Scenario 3 — config tab

**Given:** Active tab cualquier agente

**When:** Click ConfigTab ⚙️

**Then:**
- router.push `/{tenant}/config/cuenta`
- ConfigTab active style aplica
- Avatar PNG replaced por Settings icon

### Scenario 4 — keyboard a11y

**Given:** Focus en tab Lisa

**When:** Press Arrow Right

**Then:**
- Focus mueve a tab Lucas
- (Radix tabs pattern u manual implementation)

### Scenario 5 — visual parity mockup

**Given:** Active tab Lisa

**When:** Playwright `toHaveScreenshot()`

**Then:** Pixel match con mockup HTML ribbon section (active state Lisa)

## Deliverables

| File | Acción |
|---|---|
| `vitalia/frontend/src/lib/agents/catalog.ts` | NEW |
| `vitalia/frontend/src/components/shared/shell-organism/Ribbon.tsx` | NEW |
| `vitalia/frontend/src/components/shared/shell-organism/RibbonTab.tsx` | NEW |
| `vitalia/frontend/src/components/shared/shell-organism/ConfigTab.tsx` | NEW |
| `vitalia/frontend/src/lib/agents/routing.ts` | NEW (extractAgentFromPath) |
| `vitalia/frontend/src/components/shared/shell-organism/AppPanelSlot.tsx` | MODIFY (compose Ribbon) |
| `vitalia/frontend/e2e/shell-organism/ribbon.spec.ts` | NEW |
| `vitalia/frontend/e2e/__screenshots__/shell/ribbon-{lisa,lucas,adrian,valeria,camila,config}-{light,dark}.png` | NEW (12 goldens) |

## Próximo paso post-done

F1-S8 sub-tabs-line2 arranca (depende de Ribbon para active agent context).
