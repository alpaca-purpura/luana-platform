---
story_id: vitalia-fase1-routing-shell
outcome: vitalia-mvp-ui-foundation
phase: fase-1
type: ui-story
agent_owner: shell
module: shell-organism
capability: shell.routing
state: idea
last_modified: 2026-05-22
ratified_by_chris: false
parallel_safe: false
priority: high
estimated_dev_days: 1
dependencies:
  hard: [vitalia-fase1-shell-layout-5050, vitalia-fase1-ribbon-6-tabs, vitalia-fase1-sub-tabs-line2]
  soft: []
blocks_hard: [vitalia-fase1-empty-states]
reuse_map_summary: "Next.js App Router native · dynamic segments [agent][subtab] · redirect() helper · not-found.tsx"
spawned_at: 2026-05-22
next_action: "/po-ux refinar 01-spec.md"
---

# F1-S9 vitalia-fase1-routing-shell — checkpoint

## Goal

Cementar el esqueleto de routing del shell-organism: App Router tree completo `[tenantId]/(shell-organism)/[agent]/[subtab]/page.tsx`, redirects automáticos a defaults, not-found.tsx, validación agent + subtab vs whitelist. Cada combinación válida renderiza placeholder vacío (contenido real en F1-S10).

## Anti-objetivos

- NO contenido per sub-tab (eso es F1-S10)
- NO N3-dyn workspaces (Fase 2)
- NO middleware Clerk custom (Clerk middleware nicolify ya existe — reusar pattern)

## Scope verbatim

### § 1 — App Router tree completo

```
vitalia/frontend/src/app/[tenantId]/(shell-organism)/
├── layout.tsx                                    # F1-S4 (ya creado)
├── page.tsx                                       # F1-S4 redirect a /lisa/marca
├── not-found.tsx                                  # NEW — 404 user-friendly
├── [agent]/
│   ├── layout.tsx                                 # NEW — propaga + valida agent
│   ├── page.tsx                                   # NEW — redirect a default subtab
│   └── [subtab]/
│       └── page.tsx                               # NEW — valida subtab + renderiza placeholder
```

### § 2 — `[agent]/layout.tsx`

```tsx
import { notFound } from 'next/navigation'
import { isValidAgent } from '@/lib/agents/catalog'

export default function AgentLayout({ children, params }: { children: React.ReactNode, params: { agent: string, tenantId: string } }) {
  if (!isValidAgent(params.agent)) {
    notFound()
  }
  return <>{children}</>
}
```

### § 3 — `[agent]/page.tsx` (default subtab redirect)

```tsx
import { redirect } from 'next/navigation'
import { AGENT_DEFAULT_SUBTAB, isValidAgent } from '@/lib/agents/catalog'

export default function AgentRootPage({ params }: { params: { tenantId: string, agent: string } }) {
  if (!isValidAgent(params.agent)) {
    return null  // layout already returned notFound
  }
  redirect(`/${params.tenantId}/${params.agent}/${AGENT_DEFAULT_SUBTAB[params.agent]}`)
}
```

### § 4 — `[agent]/[subtab]/page.tsx`

```tsx
import { notFound } from 'next/navigation'
import { isValidAgent, isValidSubtab } from '@/lib/agents/catalog'
import { SubTabContent } from '@/components/shared/shell-organism/SubTabContent'  // F1-S10

export default function SubtabPage({ params }: { params: { tenantId: string, agent: string, subtab: string } }) {
  if (!isValidAgent(params.agent) || !isValidSubtab(params.agent, params.subtab)) {
    notFound()
  }
  return <SubTabContent agent={params.agent} subtab={params.subtab} />
}
```

### § 5 — `not-found.tsx`

```tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-10 text-center">
      <div className="text-6xl mb-4 opacity-50">🔍</div>
      <h2 className="text-xl font-semibold mb-2">No encontramos esta vista</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Quizás el enlace está roto o el agente que buscas no existe.
        Vuelve al inicio para seguir trabajando.
      </p>
      <Button asChild>
        <Link href="/">Volver al inicio</Link>
      </Button>
    </div>
  )
}
```

### § 6 — Validación helpers

`vitalia/frontend/src/lib/agents/catalog.ts` (extend):

```ts
import { AGENT_SUBTABS } from './subtabs'

export function isValidAgent(agent: string): agent is AgentKey {
  return agent in AGENT_CATALOG
}

export function isValidSubtab(agent: AgentKey, subtab: string): boolean {
  const subtabs = AGENT_SUBTABS[agent]
  return subtabs.some(st => st.id === subtab)
}
```

### § 7 — Middleware (si necesita)

Asegurar Clerk middleware `vitalia/frontend/src/middleware.ts` protege `(shell-organism)/` con auth check + tenant validation:

```ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isShellRoute = createRouteMatcher(['/:tenantId/(shell-organism)/(.*)'])

export default clerkMiddleware((auth, req) => {
  if (isShellRoute(req)) {
    auth().protect()  // redirect to sign-in if not authenticated
  }
})
```

(Verificar middleware nicolify pattern y replicar.)

## Acceptance criteria

| AC | Verificación |
|---|---|
| AC-1 | URL `/{tenant}` → handle por root layout (legacy compat) |
| AC-2 | URL `/{tenant}/(shell-organism)` → redirect a `/lisa/marca` |
| AC-3 | URL `/{tenant}/lisa` → redirect a `/lisa/marca` |
| AC-4 | URL `/{tenant}/lucas` → redirect a `/lucas/lanzar` |
| AC-5 | URL `/{tenant}/inexistente` → 404 not-found |
| AC-6 | URL `/{tenant}/lisa/inexistente-subtab` → 404 not-found |
| AC-7 | URL `/{tenant}/lisa/marca` → renderiza placeholder SubTabContent |
| AC-8 | not-found.tsx UX: ícono + título + descripción + CTA volver |
| AC-9 | Sin auth → Clerk middleware redirige a `/sign-in` |
| AC-10 | Playwright functional: navegar TODAS las 22 combos sub-tab válidas |
| AC-11 | Playwright functional: 404 visible para slugs inválidos |
| AC-12 | Active state Ribbon + SubTabsBar sincronizado con URL |

## Gherkin scenarios

### Scenario 1 — happy navegación complete

**Given:** Usuario autenticado en `/{tenant}/(shell-organism)`

**When:**
1. Página carga (redirect a `/lisa/marca`)
2. Click Ribbon "Atraer"
3. Click SubTab "Recursos"

**Then:**
- URL final = `/{tenant}/lucas/recursos`
- Ribbon active Lucas
- SubTabsBar active "Recursos"
- Placeholder content renders

### Scenario 2 — invalid agent

**Given:** URL manual `/{tenant}/foo`

**When:** Página carga

**Then:**
- not-found.tsx renders
- UX: ícono 🔍 + título + CTA "Volver al inicio"
- Status code HTTP 404
- Ribbon + SubTabsBar NO renderizan (layout omite)

### Scenario 3 — invalid subtab

**Given:** URL manual `/{tenant}/camila/bar`

**When:** Página carga

**Then:**
- not-found.tsx renders dentro layout shell (Ribbon visible con Camila active)
- SubTabsBar muestra sub-tabs Camila pero ninguna active
- Content area muestra 404

### Scenario 4 — unauthenticated

**Given:** Sin Clerk session

**When:** Navega a `/{tenant}/(shell-organism)/lisa/marca`

**Then:**
- Clerk middleware redirige a `/sign-in?redirect=...`
- NO leak shell content

### Scenario 5 — tenant invalid

**Given:** JWT.org_id `tenant-A`, user intenta `/{tenant-B}/(shell-organism)/lisa/marca`

**When:** Página carga

**Then:**
- BE valida → 403
- Redirige a `/{tenant-A}/(shell-organism)/lisa/marca` o `/select-tenant`

### Scenario 6 — deep link funcional cross-tab

**Given:** Email contiene link a `/{tenant}/camila/voz/conv-abc123`

**When:** Click link

**Then:**
- Shell carga · Ribbon active Camila · SubTab active "Voz del paciente"
- N3-dyn route (placeholder Fase 2)

## Deliverables

| File | Acción |
|---|---|
| `vitalia/frontend/src/app/[tenantId]/(shell-organism)/[agent]/layout.tsx` | NEW |
| `vitalia/frontend/src/app/[tenantId]/(shell-organism)/[agent]/page.tsx` | NEW |
| `vitalia/frontend/src/app/[tenantId]/(shell-organism)/[agent]/[subtab]/page.tsx` | NEW |
| `vitalia/frontend/src/app/[tenantId]/(shell-organism)/not-found.tsx` | NEW |
| `vitalia/frontend/src/lib/agents/catalog.ts` | MODIFY (add validators) |
| `vitalia/frontend/src/middleware.ts` | MODIFY (extend Clerk matcher si necesita) |
| `vitalia/frontend/e2e/shell-organism/routing.spec.ts` | NEW (cubre 22 combos sub-tab + 404 scenarios) |
| `vitalia/frontend/e2e/__screenshots__/shell/not-found-{light,dark}.png` | NEW |

## Próximo paso post-done

F1-S10 empty-states-navegable: implementar SubTabContent componente que renderiza placeholders per sub-tab.
