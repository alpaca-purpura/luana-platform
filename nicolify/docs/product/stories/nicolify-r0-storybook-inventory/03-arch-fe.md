---
story_id: nicolify-r0-storybook-inventory
brand: nicolify
surface: FE-storybook
builder: builder-frontend
auditor: auditor-frontend
tier: workhorse
---

# 03-arch-fe — Surface FE (Storybook stories de nicolify)

> Sub-vista del consolidado `03-arch.md`. Solo lo que `builder-frontend` necesita para la superficie `nicolify/frontend/src/**/*.stories.tsx` + `.storybook/`. NO inventes BE (no hay). NO inventes rutas (no hay).

## Scope (paths in scope)

- `nicolify/frontend/src/**/*.stories.tsx` (co-locadas) — **crear** (balde 3).
- `nicolify/frontend/.storybook/preview.ts` — **modificar** (agregar `parameters.nextjs.appDirectory: true`).
- `nicolify/frontend/.storybook/decorators/withQueryClient.tsx` — **crear** (helper SOLO-storybook).
- `nicolify/frontend/.storybook/mocks/clerk.ts` (+ `use-tenant-id`) — **crear** (module-mock compartido).
- `nicolify/frontend/.storybook/fixtures/abel-icp.ts` — **crear** (fixtures sintéticas LatAm B2B).

**NEVER touch:** `core/@luana/ui-kit/src/` · otras marcas (`vitalia/comunify/lupulo`) · `components/ui/*.tsx` runtime (no-story) · `components/shared/**/*.tsx` runtime · `features/abel/**/*.tsx` runtime (NO reescribir componentes — solo storiar) · `.claude/`.

## Stories a escribir (balde 3 · 15 + roster doc-story)

Ver `03-arch.md § FE — Clasificación final de baldes` (tablas Grupo A/B/C). Resumen:

- **Grupo A — Abel ICP (7):** IcpCard, IcpDatosForm, BuyerLeafForm (presentacionales/forms) · IcpMasterListView, IcpWorkspaceView, IcpEntityLayoutClient, IcpIntakeOverlay (containers — necesitan decorators).
- **Grupo B — Moléculas/shell nicolify-only (8):** AgentAvatar, UniversalIntake, ProposalBanner, WhatForChip, DraftFirstStarter, AddAgencyPlaceholderModal, LogoMark, TenantSwitcher (+ TenantBadge/TenantOption como sub-stories).
- **Grupo C — Roster doc-story (1):** `Agentes/Roster` (AgentRoster.stories.tsx) — los 6 agentes con avatar+color+pill de status. CERO story falsa de componente pendiente.

## Convención CSF3 (replicar de vitalia · `AgentAvatar.stories.tsx`)

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ComponentName } from "./ComponentName";

const meta: Meta<typeof ComponentName> = {
  title: "Abel/ICP/ComponentName",   // o "Shared/...", "Agentes/Roster"
  component: ComponentName,
  tags: ["autodocs"],
  argTypes: { /* controls por prop */ },
};
export default meta;
type Story = StoryObj<typeof ComponentName>;

export const Default: Story = { args: { /* ... */ } };
// una story por estado discreto del componente (idle/selected/loading/error/empty…)
```

- Co-locar `Componente.stories.tsx` junto al `.tsx`.
- `title` jerárquico: `Abel/ICP/*`, `Shared/*`, `Agentes/Roster`.
- Una story por estado discreto (ver columna "Estados" del consolidado).
- Spanish neutro (tuteo). Fixtures B2B LatAm realistas (NO Lorem).

## Patrón de decorators (★ containers Abel ICP) — ver `03-arch.md § FE — Patrón de decorators`

1. **`next/navigation`:** `appDirectory: true` global (deliverable preview.ts) + `parameters.nextjs.navigation.params` por-story.
2. **React Query:** `withSeededQuery((qc) => qc.setQueryData(['abel','icp','list'], fixture))` — query keys verbatim de `use-icps.ts`/`use-buyers.ts`. Loading=no-seed · Empty=seed `[]` · Error=seed error state.
3. **Clerk:** module-mock `@clerk/nextjs` → `useAuth` stub (`getToken`, `isLoaded:true`, `isSignedIn:true`) + `useTenantId` → UUID demo. Espeja los `.test.tsx` existentes.
4. **Fixtures:** `.storybook/fixtures/abel-icp.ts` (ICPs/buyers sintéticos).

> NO reescribir el componente de producto. El decorator inyecta el entorno. Si un container es inviable sin reescribir → storiar su leaf presentacional + documentar la limitación (scope discipline).

## Gates FE (ver 04-validators)

- `npx tsc --noEmit` (strict) · `npx eslint src/**/*.stories.tsx` (incl. `@luana/ds/no-arbitrary-value`).
- `npx storybook build` exit 0 (render-sanity).
- `npx vitest run src/__tests__/architecture/` (ratchets HB-106/107 no suben).

## Verificación REAL (demo técnica)

Levantar `pnpm --filter @nicolify/frontend storybook` (:6006) → navegar `Abel/ICP/*`, `Shared/*`, `Agentes/Roster` → cada story renderiza fiel (no "Cargando" colgado, no throw). a11y addon verde o excepción documentada. NO basta `build` exit 0 — hay que VER las stories.
