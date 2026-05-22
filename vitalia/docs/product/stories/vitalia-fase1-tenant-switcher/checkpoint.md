---
story_id: vitalia-fase1-tenant-switcher
outcome: vitalia-mvp-ui-foundation
phase: fase-1
type: ui-story
agent_owner: shell
module: shell-organism
capability: shell.tenant-switcher
state: idea
last_modified: 2026-05-22
ratified_by_chris: false
parallel_safe: true                                # paralelo a F1-S4..F1-S10
priority: high
estimated_dev_days: 1-2
dependencies:
  hard: [vitalia-fase1-stack-stability, vitalia-fase1-design-tokens-theme, vitalia-fase1-topbar-global]
  soft: []
blocks_hard: []
reuse_map_summary: "REUSE 95% nicolify/frontend/src/components/shared/layout/TenantSwitcher.tsx (cambia x-tenant-id key + redirect path) · CONSUME core/luana-core-iam API tenants list via /api/tenants (BE shipped)"
spawned_at: 2026-05-22
next_action: "/po-ux refinar 01-spec.md"
---

# F1-S3 vitalia-fase1-tenant-switcher — checkpoint

## Goal

`TenantSwitcher` molécula: dropdown con lista de clínicas accesibles para el usuario actual (multi-clinic support si plan habilita) + CTAs "Agregar clínica" + "Administrar cuenta". Persiste tenant activo en localStorage `vitalia-active-tenant-id`. Cambio dispara hard redirect preservando ruta actual.

## Anti-objetivos

- NO crear nueva API BE `/api/tenants` (ya shipped en `vitalia/backend/src/modules/vitalia/iam/`)
- NO implementar "Agregar clínica" full flow (placeholder modal "Próximamente" — Fase 2)
- NO implementar "Administrar cuenta" full flow (link a `/{tenant}/(shell-organism)/config/cuenta` — F2-S20)

## Scope verbatim

### § 1 — `TenantSwitcher` molécula

`vitalia/frontend/src/components/shared/shell-organism/TenantSwitcher.tsx`:

```tsx
'use client'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, ... } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useRouter, usePathname } from 'next/navigation'
import { useTenantStore } from '@/stores/tenant-store'

export function TenantSwitcher() {
  const { activeTenant, availableTenants, switchTenant } = useTenantStore()
  const router = useRouter()
  const pathname = usePathname()

  const handleSwitch = (tenantId: string) => {
    switchTenant(tenantId)
    // Hard redirect preservando ruta actual (cambia solo segment [tenantId])
    const newPath = pathname.replace(/^\/[^/]+/, `/${tenantId}`)
    window.location.href = newPath
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" data-testid="tenant-switcher-trigger" aria-label="Cambiar clínica">
          <TenantBadge tenant={activeTenant} />
          <span>{activeTenant?.name}</span>
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[260px]">
        {availableTenants.map(t => (
          <TenantOption key={t.id} tenant={t} active={t.id === activeTenant?.id} onClick={() => handleSwitch(t.id)} />
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => alert('Próximamente')}>➕ Agregar clínica</DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/${activeTenant?.id}/(shell-organism)/config/cuenta`}>⚙️ Administrar cuenta</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### § 2 — `TenantOption` molécula

`vitalia/frontend/src/components/shared/shell-organism/TenantOption.tsx`:

Composición avatar + name + subtitle (clínica + sucursal/ciudad) + active check.

### § 3 — `TenantBadge` átomo helper

`vitalia/frontend/src/components/shared/shell-organism/TenantBadge.tsx`:

Cuadrado 20x20 con initials (ej. "SP" Sonrisa Plena) + bg color per tenant (hash determinístico o stored color).

### § 4 — `tenantStore` zustand

`vitalia/frontend/src/stores/tenant-store.ts`:

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Tenant {
  id: string
  name: string
  subtitle?: string
  color?: string
  initials?: string
}

interface TenantStore {
  activeTenant: Tenant | null
  availableTenants: Tenant[]
  setActiveTenant: (t: Tenant) => void
  setAvailableTenants: (ts: Tenant[]) => void
  switchTenant: (id: string) => void
}

export const useTenantStore = create<TenantStore>()(
  persist(
    (set, get) => ({
      activeTenant: null,
      availableTenants: [],
      setActiveTenant: (t) => set({ activeTenant: t }),
      setAvailableTenants: (ts) => set({ availableTenants: ts }),
      switchTenant: (id) => {
        const t = get().availableTenants.find(x => x.id === id)
        if (t) set({ activeTenant: t })
      },
    }),
    { name: 'vitalia-tenant-state', partialize: (s) => ({ activeTenant: s.activeTenant }) }
  )
)
```

### § 5 — API consumer hook

`vitalia/frontend/src/hooks/useTenants.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import { fetchClient } from '@/lib/api/fetchClient'

export function useTenants() {
  return useQuery({
    queryKey: ['tenants'],
    queryFn: () => fetchClient<{ tenants: Tenant[] }>('/api/tenants'),
    staleTime: 5 * 60 * 1000,  // 5 min
  })
}
```

### § 6 — Inicialización al app boot

En `app/layout.tsx` o un client-side bootstrap:

1. Fetch `/api/tenants` con useTenants
2. Si activeTenant `null` y hay tenants → set primer tenant como active
3. Si URL tiene `[tenantId]` válido → set como active

### § 7 — Replace placeholder TopBarGlobal

Update `TopBarGlobal.tsx` para usar `<TenantSwitcher />` real en vez de `<TenantSwitcherSlot />`.

## Acceptance criteria

| AC | Verificación |
|---|---|
| AC-1 | TenantSwitcher visible TopBar derecha |
| AC-2 | Click trigger abre dropdown con lista tenants |
| AC-3 | Tenant activo marca con check + bg suave |
| AC-4 | Click otro tenant → hard redirect preservando ruta |
| AC-5 | LocalStorage `vitalia-tenant-state` persiste activo |
| AC-6 | "Agregar clínica" click → alert "Próximamente" |
| AC-7 | "Administrar cuenta" click → navega a `/config/cuenta` |
| AC-8 | a11y: trigger tiene `aria-label`, DropdownMenu Radix nativo a11y |
| AC-9 | Visual golden: dropdown closed + open snapshots |
| AC-10 | Vitest unit: render + click → switchTenant called |
| AC-11 | Playwright functional: complete tenant switch flow |
| AC-12 | Loading state: si API pending, dropdown muestra Skeleton |
| AC-13 | Error state: si API 500, dropdown muestra Alert + reintentar |

## Gherkin scenarios

### Scenario 1 — happy switch

**Given:** Usuario autenticado en `/{sonrisa-plena}/(shell-organism)/lisa/marca`, tenant activo "Sonrisa Plena"

**When:** Click TenantSwitcher → click "Dermalia MX"

**Then:**
- LocalStorage `vitalia-tenant-state.activeTenant` actualizado
- Hard redirect a `/{dermalia-mx}/(shell-organism)/lisa/marca`
- React Query cache invalidated (queries tenant-scoped refetchean)

### Scenario 2 — single tenant (sin switch)

**Given:** Usuario con solo 1 clínica accesible

**When:** Click TenantSwitcher

**Then:**
- Dropdown muestra solo esa clínica
- "Agregar clínica" + "Administrar cuenta" visibles
- NO opciones extras

### Scenario 3 — error API tenants

**Given:** `/api/tenants` retorna 500

**When:** TenantSwitcher intenta cargar lista

**Then:**
- Dropdown muestra `<Alert variant="destructive">No pudimos cargar tus clínicas...</Alert>`
- Botón "Reintentar" dispara refetch
- Sentry capture sin PHI

### Scenario 4 — adversarial cross-tenant URL

**Given:** Usuario tenant A intenta navegar manual a `/{tenant-B}/(shell-organism)/...`

**When:** Página carga

**Then:**
- BE valida JWT.org_id vs `tenant-B` → 403
- Clerk middleware redirige a `/sign-in` o `/{tenant-A}/(shell-organism)/...` (rollback)
- NO leak data de tenant-B

### Scenario 5 — keyboard a11y

**Given:** TenantSwitcher renderizado

**When:** Tab navigate hasta trigger, press Enter

**Then:**
- Dropdown abre (Radix nativo a11y)
- Arrow keys navegan items
- Enter selecciona, Esc cierra

## Deliverables

| File | Acción |
|---|---|
| `vitalia/frontend/src/components/shared/shell-organism/TenantSwitcher.tsx` | NEW |
| `vitalia/frontend/src/components/shared/shell-organism/TenantOption.tsx` | NEW |
| `vitalia/frontend/src/components/shared/shell-organism/TenantBadge.tsx` | NEW |
| `vitalia/frontend/src/components/shared/shell-organism/{TenantSwitcher,TenantOption}.stories.tsx` | NEW |
| `vitalia/frontend/src/components/shared/shell-organism/{TenantSwitcher,TenantOption,TenantBadge}.test.tsx` | NEW |
| `vitalia/frontend/src/stores/tenant-store.ts` | NEW |
| `vitalia/frontend/src/hooks/useTenants.ts` | NEW |
| `vitalia/frontend/src/components/shared/shell-organism/TopBarGlobal.tsx` | MODIFY (replace placeholder) |
| `vitalia/frontend/e2e/shell-organism/tenant-switcher.spec.ts` | NEW |
| `vitalia/frontend/e2e/__screenshots__/shell/tenant-switcher-{closed,open}-{light,dark}.png` | NEW |

## Próximo paso post-done

F1-S2 TopBarGlobal completo. F1-S4 shell-layout-5050 puede arrancar (es independiente de S3 técnicamente).
