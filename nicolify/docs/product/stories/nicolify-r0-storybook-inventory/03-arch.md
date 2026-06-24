---
story_id: nicolify-r0-storybook-inventory
brand: nicolify
arch_version: 1
schema_version: v4.1
architecture_pattern: ADR-014-design-system-homologation   # design-system (NO ADR-nicolify-001 — no construye sub-tab; espeja a ds-adoption)
adr_014_compliance: full
verification_nature: técnica          # render-sanity + a11y + completitud-contrato + clasificación. SIN flujo de usuario, SIN live-verify de writes.
cap_target: design-system/nicolify-ui-homologation
cap_change_type: extend
surfaces: [FE-storybook, DOCS-contract]   # NO BE · NO AGENTIC
architect_run_on: 2026-06-24
---

# Contract — Inventario 1:1 de la UI de nicolify en Storybook (Fase 1)

> **SSoT de implementación** para builders + auditor. La story NO construye pantallas: escribe las `.stories.tsx` de los componentes brand-local de nicolify (balde 3) y sube `nicolify/docs/architecture/SHELL-DESIGN-CONTRACT.md` a inventario descriptivo 1:1. Contrato ratificado = `01-spec.md` (RN-1..8, AC-1..6). Este 03-arch traduce el spec a tickets ejecutables, NO lo re-deriva.

## 0. Context Summary

- **Story:** `nicolify-r0-storybook-inventory` · Release R0 · módulo/bucket `design-system` (`code:design-system`).
- **Architect run on:** 2026-06-24.
- **Zona/caja (paradigma):** Infraestructura → plataforma-tecnica → design-system. `user_visible: false`. Atributo de calidad (inventario navegable de la UI). Derivada de `SYSTEM-MAP.yaml::zones`.
- **Naturaleza:** **técnica** (no funcional). NO hay flujo de usuario, NO live-verify de writes, NO playwright de rutas (no hay rutas). La "demo" = storybook de nicolify navegable + contrato 1:1 legible.
- **Surfaces touched:** (a) `nicolify/frontend/src/**/*.stories.tsx` co-locadas + `nicolify/frontend/.storybook/**` (config) · (b) `nicolify/docs/architecture/SHELL-DESIGN-CONTRACT.md` (subir a 1:1).

### Surface → builder → auditor mapping (PM/dev-team spawnean estos)

| Surface | Builder | Auditor |
|---|---|---|
| `nicolify/frontend/src/**/*.stories.tsx` (production_code FE) + `.storybook/preview.ts` | **`builder-frontend`** (workhorse) | **`auditor-frontend`** (flagship) |
| `nicolify/docs/architecture/SHELL-DESIGN-CONTRACT.md` (docs, production_code:false) | **`builder-frontend`** (mismo lane — el contrato deriva del output del inventario) | **`auditor-frontend`** |

> **NO hay surface BE ni AGENTIC.** Cero `builder-backend`, cero `builder-agentic`. Tier **workhorse** (FE no-agentic). NUNCA flagship (R23 no aplica — no es agentic).

### Skills consulted (decisión tomada de cada uno)

- **`nicolify-design-system`** (índice DS nicolify, Storybook-first): la SSoT visual de balde-1 es el kit (`@luana/ui-kit`) con `brand=nicolify`; la marca solo storia balde-3. Tokens nicolify viven en `globals.css` (ya importado en `preview.ts`).
- **`frontend-expert`** (CSF3, FSD-Lite, React Query): el patrón de decorator para componentes con deps (React Query/Clerk/`next/navigation`) = seed del `QueryClient` + provider Clerk stub + `appDirectory:true`. Co-locar `Componente.stories.tsx` junto al `.tsx`.
- **`frontend-visual-fidelity.md § Storybook`** (canon §5): partir del kit, net-new se PROMUEVE (no queda local). Cero arbitrary-value.
- **Storybook CSF3 conventions** (replicadas de vitalia): `Meta` + `StoryObj`, `tags:["autodocs"]`, `argTypes` con controls, una story por estado discreto.

### CONTEXT-BRIEF source

No hubo `CONTEXT-BRIEF.md`. Self-ran greps (Path B) + lectura directa de `01-spec.md` (ratificada) + `00-research.md` + el kit + vitalia + el código brand-local de nicolify. Clasificación cerrada con grep cross-kit (ver § 2).

### capability YAML afectados (post-merge)

- `nicolify/docs/product/capabilities/design-system/nicolify-ui-homologation.yaml` — **extend** (status `planned` → scenarios/superficie del inventario). NO `make new-cap` (es extend, no new). nicolify cap enforcement es **advisory** (no HARD como vitalia/comunify).
- `nicolify/docs/architecture/SHELL-DESIGN-CONTRACT.md` — el documento de inventario (deliverable de la story, no es cap YAML).

### Architecture gates que deben seguir verdes (ver § 12 + 04-validators)

- `nicolify/frontend/src/__tests__/architecture/` ratchets (HB-106 `no-div-layout` baseline 39, `no-native-select` baseline 1; HB-107 `no-local-kit-primitive` baseline 0; `no-kit-mirror`; `no-cross-brand-import`) — **shrink-only, no subir baseline**.
- `@luana/ds/no-arbitrary-value` (eslint error) — cero hex/px nuevo en las stories.
- `build-storybook` exit 0 (render-sanity de todas las stories).

---

## Prior art audit (NO-NEW-LAYER · anti-duplication-refining)

> Esta story es **anti-duplicación por construcción** (inventaría para NO duplicar). No crea capa nueva. Evidencia con paths verbatim:

### Kit consumido (READ-ONLY · engine boundary)

- `core/@luana/ui-kit` **0.6.0** — 82 stories (átomos/layout/moléculas/**shell**/archetypes/EntityWorkspaceLayout). nicolify ya importa de `@luana/ui-kit` en 15 archivos.
- `core/@luana/ui-kit/.storybook/preview.ts` — `globalTypes.brand` (vitalia/nicolify) → `[data-brand]` en `<html>` → 1 bloque de tokens por marca. **Aquí se ven los balde-1 con `brand=nicolify`.**
- `@luana/design-tokens` 0.2.0 (name-contract) · `@luana/eslint-config` 0.1.0 (`no-arbitrary-value`).
- ❌ **NUNCA editar `core/@luana/ui-kit/src/`** (engine — `/pm-luana` lift gate). Esta story solo CONSUME + CITA stories del kit por id.

### Vitalia replicado (modelo, NO copia de componentes)

- `vitalia/frontend/.storybook/` + sus **44 `.stories.tsx`** brand-local → convención CSF3 a replicar (NO copiar — las features difieren; nicolify hoy solo tiene Abel ICP).
- `vitalia/frontend/src/components/shared/agents/AgentAvatar.stories.tsx` → patrón exacto a espejar para `nicolify .../agents/AgentAvatar.stories.tsx` (re-skin).
- `vitalia/docs/architecture/SHELL-DESIGN-CONTRACT.md` → estructura § 1-8 a espejar (rellenada con realidad nicolify + columna balde + token-overrides + § Roster).

### Cap extendido (NO new)

- `nicolify/docs/product/capabilities/design-system/nicolify-ui-homologation.yaml` (`status: planned`) → **extend**. Mismo bucket `code:design-system` que `nicolify-r0-design-system-adoption` (en G).

### Cross-brand mirror check

Cero mirror cross-brand: las stories son brand-local de nicolify, no replican una abstracción de otra marca. Las moléculas brand-local (TenantSwitcher/ThemeToggle/AgentAvatar…) son **ports re-temizados de vitalia** ya existentes en nicolify (no se crean acá — solo se storían). El `EntitySubNavBar`/`EntityWorkspaceLayout` ya están **en el kit** (consumidos, no mirrors).

**Veredicto:** EXTEND del inventario existente (cap homologación). Cero capa nueva. Cero engine edit. Cero cross-brand edit. ✅

---

## Existing systems audit (NO NEW LAYER rule)

### Source of evidence
- [x] Self-run greps (Path B — no hubo CONTEXT-BRIEF)
- [x] grep cross-kit ejecutado para clasificación de baldes (ver § 2)

### Audit cross-module ejecutado

```bash
# 1. Componentes brand-local de nicolify (no-story, no-test)
find nicolify/frontend/src -name "*.tsx" | grep -vE "\.(test|spec|stories)\." | grep -E "components/|features/"
# 2. Twins en el kit (¿existe el componente en @luana/ui-kit?)
for n in TenantSwitcher ThemeToggle TenantBadge ConfigTab SubSubTabsBar AgentAvatar; do find core/@luana/ui-kit -iname "*$n*"; done
# 3. Stories del kit (82) → balde-1 reference
find core/@luana/ui-kit/stories -name "*.stories.tsx"
# 4. Kit-shaped primitives locales (balde-2 deuda)
ls nicolify/frontend/src/components/ui/   # button input badge dialog dropdown-menu skeleton tooltip alert
```

### Sistemas existentes encontrados

| Sistema | Path | Naturaleza | Estado |
|---|---|---|---|
| Inventario compartido (kit) | `core/@luana/ui-kit` 82 stories | SSoT visual cross-brand | active (consumido) |
| Storybook brand nicolify | `nicolify/frontend/.storybook` | infra montada, 0 stories | **deshabitada** (el gap) |
| Contrato 1:1 | `nicolify/docs/architecture/SHELL-DESIGN-CONTRACT.md` | normativo, no descriptivo | a poblar a inventario |
| Brand-toggle | kit `preview.ts` `globalTypes.brand` | divergencia por-marca = token | active |
| HB-106/107 ratchets | `nicolify/frontend/src/__tests__/architecture/{no-div-layout,no-native-select,no-local-kit-primitive}.test.ts` | enforcement DS | **LIVE** (seeded 2026-06-24) |

### Decisión por sistema
- **Storybook brand nicolify (deshabitada):** **EXTEND** — escribir las `.stories.tsx` brand-local (balde 3). Es justo el gap que la story cierra.
- **Contrato 1:1:** **EXTEND** — subir a inventario descriptivo 1:1, espejando la estructura de vitalia.
- **Kit (82 stories):** **CONSUMIR** — citar por id de story. NO recrear (engine boundary).
- **HB-106/107 ratchets:** **CONSUMIR como gate** — no subir baseline.

No hay bloque NEW: cero capa nueva creada.

---

## Surfaces

### Surface A — FE storybook (`builder-frontend`, auditor-frontend)

- `nicolify/frontend/.storybook/preview.ts` — **modificar**: agregar `parameters.nextjs.appDirectory: true` (los organismos Abel ICP usan `next/navigation` → `@storybook/nextjs-vite` lo auto-mockea con `appDirectory`). El kit ya lo tiene; nicolify hoy NO. Es prerequisito de las stories de los containers Abel.
- `nicolify/frontend/src/**/*.stories.tsx` — **crear** (balde 3, ver § FE).

### Surface B — DOCS contrato (`builder-frontend`, auditor-frontend)

- `nicolify/docs/architecture/SHELL-DESIGN-CONTRACT.md` — **subir a 1:1 descriptivo** (ver § Esquema). production_code:false.

---

## Integration design (CONN — anti-orphan-integration.md)

Toda salida cumple las 4 contenciones CONN (nada llega a `done` como isla):

- **C — Consumed:** las stories son consumidas por `/architect` (citar el átomo/molécula exacto en `03-arch § FE` de stories futuras), `/dev-team` (construir desde la story citada), y **Chris** ("¿qué componentes toco ante un cambio de UI?" → el contrato 1:1). El contrato es consumido por todas las stories FE futuras de nicolify.
- **O — On the map:** vive en la cap `design-system/nicolify-ui-homologation` (hogar declarado, zona Infraestructura→plataforma-tecnica→design-system).
- **N — Navigable/reachable:** el storybook de nicolify se levanta (`pnpm --filter ... storybook` :6006 / `build-storybook` → `storybook-static/`) y las stories nuevas aparecen en el sidebar bajo sus `title`. El contrato es un `.md` linkeado desde el skill `nicolify-design-system` + el README de rules.
- **N — Notarized/registered:** las `.stories.tsx` quedan **registradas en el storybook de nicolify** por convención de discovery (`main.ts::stories: ['../src/**/*.stories.@(...|tsx)']`) — el glob las descubre automáticamente. Cero registro manual. El roster doc-story queda en `Agentes/Roster`.

> **Reachability path concreto:** `pnpm --filter @nicolify/frontend storybook` (dev :6006) → sidebar `Abel/ICP/*`, `Shared/*`, `Agentes/Roster` → cada story renderiza. + `SHELL-DESIGN-CONTRACT.md` abierto = mapa 1:1 navegable. Sin isla.

---

## FE — Clasificación final de baldes + stories a escribir

> **Resultado del ticket T-1 (clasificación grep-cross-kit).** Cierra la lista EXACTA balde-2 vs balde-3. Esta es la tabla que el builder escribe al contrato + de la que salen los tickets de stories.

### Balde (1) — Compartido, ya en el kit (NO story, citar story del kit + brand-toggle)

Átomos/layout/moléculas/shell consumidos directo de `@luana/ui-kit`. Se ven en el storybook del **kit** con `brand=nicolify`. Citar por id en el contrato:

| Pieza usada por nicolify | Story del kit a citar |
|---|---|
| Button (vía `components/ui/button` que reexporta `@luana/ui-kit`) | `atoms.Button` |
| EntityWorkspaceLayout / EntitySubNavBar | `EntityWorkspaceLayout`, `EntitySubNavBar` |
| ShellLayout (vía `ShellLayoutWire`) | `shell.ShellLayout` |
| Ribbon / SubTabsBar / TopBarShell / SupervisorSidebar / ChatPanel | `shell.Ribbon`, `shell.SubTabsBar`, `shell.TopBarShell`, `shell.SupervisorSidebar`, `shell.ChatPanel` |
| AgentColors foundation | `foundations.AgentColors` |

### Balde (2) — Port local de pieza del kit (deuda · listar marcado "consumir-kit (ds-adoption)" · NO story)

Kit-shaped primitives re-implementadas localmente (su twin con story vive en el kit → re-storiarlas duplicaría). Su convergencia es de `nicolify-r0-design-system-adoption`, NO de esta story:

| Port local | Path | Kit twin | Story del kit |
|---|---|---|---|
| `ui/button` | `components/ui/button.tsx` | `atoms.Button` | `atoms.Button` |
| `ui/input` | `components/ui/input.tsx` | `atoms.Input` | `atoms.Input` |
| `ui/badge` | `components/ui/badge.tsx` | `atoms.Badge` | `atoms.Badge` |
| `ui/dialog` | `components/ui/dialog.tsx` | `overlays.Dialog` | `overlays.Dialog` |
| `ui/dropdown-menu` | `components/ui/dropdown-menu.tsx` | `overlays.DropdownMenu` | `overlays.DropdownMenu` |
| `ui/skeleton` | `components/ui/skeleton.tsx` | `atoms.Skeleton` | `atoms.Skeleton` |
| `ui/tooltip` | `components/ui/tooltip.tsx` | `overlays.Tooltip` | `overlays.Tooltip` |
| `ui/alert` | `components/ui/alert.tsx` | `overlays.Alert` | `overlays.Alert` |
| `ConfigTab` (port) | `components/shared/shell-organism/ConfigTab.tsx` | kit `organism/shell/ConfigTab.tsx` (sin story dedicada; aparece en `shell.AppPanelSlot`) | `shell.AppPanelSlot` |
| `SubSubTabsBar` (port) | `components/shared/shell-organism/SubSubTabsBar.tsx` | kit `organism/shell/SubSubTabsBar.tsx` | `shell.SubSubTabsBar` |
| `SubSubTab` (port) | `components/shared/shell-organism/SubSubTab.tsx` | inline en kit `SubSubTabsBar` | `shell.SubSubTabsBar` |

> **Nota deuda:** `SubTabContent` (`components/shared/shell-organism/`) es un **dispatcher brand-local** (rutea agent.subtab → contenido) — NO es kit-shaped, pero tampoco se storia (es un router, sin valor visual aislado). Se lista en el contrato como **infraestructura de routing brand-local, no-storiable** (balde aparte: "wire/dispatcher"). Igual `ShellLayoutWire` (wire del shell del kit) y `_agent-tw-classes.ts` (helper, no componente) y `types.ts`.

### Balde (3) — Único de nicolify (ESCRIBIR `.stories.tsx` + entrada en contrato)

> **15 componentes** → ~15 archivos `.stories.tsx`. Agrupados en tickets lógicos (ver 06-tickets).

**Grupo A — Abel ICP (7):**

| Componente | Path | Naturaleza | Stories (estados) | Compone del kit |
|---|---|---|---|---|
| `IcpCard` | `features/abel/components/icp/IcpCard.tsx` | molécula **presentacional** (props: `icp`, `className`) | `Default`, `Selected`, `Ready`, `Draft`, `Grid` (varios en `EntityInfoCard` grid) | `atoms.Card`, `atoms.Badge`, `foundations.AgentColors` (abel) |
| `IcpDatosForm` | `.../IcpDatosForm.tsx` | form **presentacional** (props: `icpId`, `icp`, `buyers`) — usa `useAutosave` (no fetch) | `Empty`, `Filled`, `WithBuyers`, `MissingFields` | `atoms.Input`, `atoms.Textarea`, `forms.Form`, autosave indicator |
| `BuyerLeafForm` | `.../BuyerLeafForm.tsx` | form **presentacional** (props: `buyerId`, `icpId`) — usa hooks de buyer | `Empty`, `Filled`, `Primary` | `atoms.Input`, `atoms.Select` (decision_power), `forms.Form` |
| `IcpMasterListView` | `.../IcpMasterListView.tsx` | **container** (`useIcps` RQ + Clerk + router) | `Empty` (DraftFirstStarter), `Loading`, `Error`, `List` (≥1), `LargeList` (200) | `atoms.Card`, `atoms.Skeleton`, `overlays.Alert`, `IcpCard` |
| `IcpWorkspaceView` | `.../IcpWorkspaceView.tsx` | **container** (`useIcp`+`useBuyers` RQ) | `DatosLeaf`, `BuyerLeaf`, `Loading` | `EntityWorkspaceLayout`, `IcpDatosForm`, `BuyerLeafForm` |
| `IcpEntityLayoutClient` | `.../IcpEntityLayoutClient.tsx` | **container** (`useIcp`+`useBuyers`, `notFound()`) | `Loaded`, `Loading`, `NotFound` | `EntitySubNavBar`, `EntityWorkspaceLayout` |
| `IcpIntakeOverlay` | `.../IcpIntakeOverlay.tsx` | **container** (`useTenantId`+`useIcpExtract`) | `Idle`, `Extracting`, `Result`, `Error` | `overlays.Dialog`, `UniversalIntake` |

**Grupo B — Moléculas/shell nicolify-only (8):**

| Componente | Path | Naturaleza | Stories (estados) | Compone del kit |
|---|---|---|---|---|
| `AgentAvatar` | `components/shared/agents/AgentAvatar.tsx` | átomo **presentacional** (mirror re-skin de vitalia) | `Abel`, `Brenda`, `Christian`, `Sara`, `Norvil`, `Luana`, `AllAgents`, `SizeVariants` | `atoms.Avatar` + tokens `--agent-{slug}` |
| `UniversalIntake` | `components/shared/intake/UniversalIntake.tsx` | molécula | `Default`, `WithPlaceholder`, `Disabled` | `atoms.Textarea`, `atoms.Button` |
| `ProposalBanner` | `components/shared/ProposalBanner.tsx` | molécula | `Default`, `Dismissed` | `overlays.Alert` / `atoms.Card` |
| `WhatForChip` | `components/shared/WhatForChip.tsx` | átomo | `Default`, `Variants` | `atoms.Badge` |
| `DraftFirstStarter` | `components/shared/DraftFirstStarter.tsx` | molécula (empty-state CTA) | `Default`, `Loading` | `atoms.Button`, `layout.EmptyState` |
| `AddAgencyPlaceholderModal` | `components/shared/shell-organism/AddAgencyPlaceholderModal.tsx` | molécula (dialog) | `Closed`, `Open` | `overlays.Dialog` |
| `LogoMark` | `components/shared/shell-organism/LogoMark.tsx` | átomo | `Light`, `Dark` | `next/image` (re-skin nicolify.com) |
| `TenantSwitcher` | `components/shared/shell-organism/TenantSwitcher.tsx` | molécula (+ `TenantBadge`, `TenantOption`) | `SingleAgency`, `MultiAgency`, `Active` | `overlays.DropdownMenu` + `TenantBadge` + `TenantOption` |

> **`TenantBadge` + `TenantOption`** se cubren como **sub-componentes dentro de `TenantSwitcher.stories.tsx`** (render compuesto + stories individuales `TenantBadge`/`TenantOption`) — son moléculas hijas de TenantSwitcher, no merecen archivo aparte (decisión de agrupación, NO story falsa). `ThemeToggle` se cubre como story dentro del grupo shell-molecules (estado light/dark) — opcional, ver T-4.

**Grupo C — Roster doc-story (1, RN-8 / AC-6):**

| Story-doc | Path | Naturaleza | Contenido |
|---|---|---|---|
| `Agentes/Roster` | `components/shared/agents/AgentRoster.stories.tsx` (story-doc, NO componente nuevo de producto) | **doc-story** (estilo `foundations.AgentColors` del kit) | renderiza los 6 (Luana+Abel+Brenda+Christian+Sara+Norvil) con `AgentAvatar` + color `--agent-{slug}` + **pill de status** (Construido/Pendiente). Construidos linkean a sus stories; pendientes muestran status + superficies anticipadas. CERO story de componente para un agente pendiente. |

> **`AgentRoster.stories.tsx` es una story-doc pura** (un `render: () => (...)` que compone `AgentAvatar` + Badge de status) — NO crea un componente React de producto nuevo. Si el render necesita un helper visual (pill de status), va inline en la story o como un mini-componente local SOLO-storybook (no en `features/`). Es el equivalente nicolify de `foundations.AgentColors` del kit.

---

## FE — Patrón de decorators para componentes con deps (★ crítico)

> Los componentes Abel ICP **container** (IcpMasterListView/IcpWorkspaceView/IcpEntityLayoutClient/IcpIntakeOverlay) y los forms con hooks (BuyerLeafForm) dependen de **React Query + Clerk + `next/navigation`**. Storybook NO usa `vi.mock` (eso es Vitest). El builder DEBE replicar el efecto vía **decorators + module mocks de `@storybook/nextjs-vite`**. El patrón canónico ya está resuelto en los `.test.tsx` existentes (`IcpMasterListView.test.tsx`) — se traduce a decorator así:

### 1. `next/navigation` → `appDirectory: true` (config global)

El kit lo resuelve con `parameters.nextjs.appDirectory: true` en `preview.ts` → `@storybook/nextjs(-vite)` auto-mockea `useParams`/`useRouter`/`usePathname`. **Deliverable T-1.5:** agregar ese parámetro a `nicolify/frontend/.storybook/preview.ts`. Por-story se overridea params con `parameters.nextjs.navigation` (ej. `{ params: { tenantId: 'tenant-demo', agent: 'abel', subtab: 'icp', entityId: 'icp-1' } }`).

### 2. React Query → `QueryClientProvider` con cache pre-seedeado (decorator)

Crear un decorator helper en `nicolify/frontend/.storybook/decorators/withQueryClient.tsx`:

```tsx
// SOLO-storybook (no en src/features). Seedea la cache con las query keys exactas que el hook usa,
// así el hook resuelve de cache SIN red. (keys verbatim de use-icps.ts / use-buyers.ts)
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
export const withSeededQuery = (seed: (qc: QueryClient) => void) => (Story) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  seed(qc);                              // qc.setQueryData(['abel','icp','list'], FIXTURE)
  return <QueryClientProvider client={qc}><Story /></QueryClientProvider>;
};
```

Cada story de container la usa con su fixture: `decorators: [withSeededQuery((qc) => qc.setQueryData(['abel','icp','list'], icpsFixture))]`. Para los estados `Loading`/`Error`/`Empty` se seedea acordemente (no seedear → loading; `setQueryData` con `[]` → empty; error → `qc.setQueryData` con un estado de error o decorator que fuerza `error`).

### 3. Clerk → stub provider (decorator)

`useAuth()` (de `@clerk/nextjs`) se usa dentro de los hooks. Module-mock vía `@storybook/nextjs-vite` `sb.mock()` o un decorator que provee un `ClerkProvider`-stub. **Patrón recomendado (mínima superficie):** mock del módulo `@clerk/nextjs` en `.storybook/` (subpath import mock) devolviendo `{ useAuth: () => ({ getToken: async () => 'sb-token', isLoaded: true, isSignedIn: true }) }` + `useTenantId` (de `@/hooks/use-tenant-id`) → mock devolviendo un UUID demo. Esto espeja exactamente lo que hacen los `.test.tsx`. Documentar en `.storybook/mocks/` un único archivo de mocks compartido (no per-story).

### 4. Fixtures de datos (LatAm B2B realista, NO Lorem)

Crear `nicolify/frontend/.storybook/fixtures/abel-icp.ts` con ICPs/buyers sintéticos realistas (agencias B2B LatAm — ej. "Agencias de performance marketing 50-200 empleados", "Boutiques de software B2B"). Reusados por las stories de container. Spanish neutro (tuteo, sin voseo).

> **Regla de oro decorator:** el builder NO refactoriza los componentes para hacerlos "storybook-friendly". El componente se storia **tal cual** + el decorator inyecta el entorno (cache/clerk/router). Si un container es genuinamente inviable de storiar sin reescribir (caso extremo), se storia su **leaf presentacional** (ej. el render de `IcpMasterListView` con datos ya resueltos) y se documenta la limitación en el contrato — NUNCA se reescribe el componente de producto en esta story (scope discipline).

---

## Esquema del SHELL-DESIGN-CONTRACT.md (subir a 1:1 · mirror vitalia § 1-8)

El contrato actual (`nicolify/docs/architecture/SHELL-DESIGN-CONTRACT.md`, normativo) se **extiende** a inventario descriptivo 1:1. Espejar la estructura § de vitalia, rellenada con realidad nicolify:

1. **§ 1 Visión del shell** — (ya existe, conservar).
2. **§ 2 Tokens (autoridad)** — (ya existe) + agregar **§ Token-overrides nicolify por átomo compartido** (RN-4): cada átomo del kit con un override de marca (ej. `Input` → `--radius-control: pill` vía `globals.css` `[data-brand=nicolify]`). Tabla `átomo · token · valor nicolify`.
3. **§ 3 Átomos** — (ya existe) + marcar cuáles se consumen directo (balde 1) vs port local (balde 2).
4. **§ 4-5 Moléculas/Organismos + Navegación** — (ya existe, conservar).
5. **§ Inventario exhaustivo por balde (★ NUEVO — el corazón de la story)** — la tabla 1:1:

   | Componente | Path | Capa | Balde | Props (clave) | Estados | Story | Token-overrides nicolify |
   |---|---|---|---|---|---|---|---|
   | Input | `@luana/ui-kit/.../input.tsx` | átomo | (1) kit | `type,disabled…` | idle/focus/error/disabled | `kit: atoms.Input` | `--radius-control: pill` |
   | `ui/button` (port) | `components/ui/button.tsx` | átomo | (2) port | — | — | (kit: `atoms.Button`) | deuda: consumir-kit (ds-adoption) |
   | IcpCard | `features/abel/components/icp/IcpCard.tsx` | molécula | (3) único | `icp,onSelect…` | idle/selected/ready/draft | `nicolify: Abel/ICP/IcpCard` (NEW) | — |
   | … (todos los componentes brand-local, 0 sin clasificar — RN-7) | | | | | | | |

6. **§ Roster de agentes (★ NUEVO — RN-8 / AC-6)** — la tabla del spec (los 6 con `status: construido | pendiente`), pendientes con superficies anticipadas + slot en el Ribbon. Linkea a `Agentes/Roster` story-doc.
7. **§ Stores + § Routing/shell** — (ya existen, conservar).
8. **§ Modelo de divergencia por-marca (★ NUEVO — RN-4)** — la tabla token>variante>fork del spec § Modelo de divergencia.

> **Completitud (RN-7 · AC-3):** el § Inventario exhaustivo lista **todos** los componentes brand-local de nicolify (de `find nicolify/frontend/src ... -name "*.tsx"` no-test/no-story) — cero sin fila + balde. El check de completitud (ver § 14) compara la lista de archivos vs las filas del contrato = 0 sin clasificar.

---

## Migration Notes

N/A — esta story NO toca BE, NO crea tablas, NO corre migraciones. Cero SQL.

## Architecture Fitness Impact (§ 12)

- **HB-106 `no-div-layout`** (baseline 39) — las stories nuevas NO deben introducir `<div className="flex-col gap-…">` / `grid-cols-…` crudos. Usar primitives del kit o `className` token. **No subir baseline.**
- **HB-106 `no-native-select`** (baseline 1) — cero `<select>` nativo en stories. Usar `atoms.Select` del kit.
- **HB-107 `no-local-kit-primitive`** (baseline 0) — cero archivo `features/{m}/components/<Primitive>.tsx` con nombre de primitiva pelado. Las stories NO crean componentes de producto (excepto el mini-helper de status del roster, que vive en `.storybook/` no en `features/`).
- **`no-kit-mirror`** + **`no-cross-brand-import`** — cero declaración local de `EntityWorkspaceLayout`/`EntitySubNavBar`/`EmptyState` (allowlist vacía); cero import `from vitalia/comunify/lupulo`.
- **`@luana/ds/no-arbitrary-value`** (eslint error) — cero hex/px/arbitrary en stories.
- **`eslint-plugin-storybook`** (ya instalado) — las stories siguen las reglas de Storybook (no `play` mal-formado, default export de meta, etc.).

**Allowlist shrinkage:** ninguna (story aditiva de stories, no migra código). NO sube baselines.

## Cross-Cutting Concerns (§ 11)

- **Spanish neutro LatAm:** todos los strings de las stories (labels, fixtures, descripciones) en tuteo, sin voseo. Datos B2B LatAm realistas (agencias/software). Las stories de producto user-facing escanean por `test_spanish_neutro.test.ts`.
- **Cero arbitrary / tokens nicolify:** las stories componen del kit + tokens de `globals.css` (ya importado en `preview.ts`). Cero hex/px nuevo.
- **Engine boundary:** cero edit a `core/@luana/ui-kit/src/`. Solo consumir + citar. Si aparece pieza net-new genuinamente compartible (improbable en inventario) → `PROMOTE` deliverable vía `/pm-luana`, NO local sin promover (RN-6).
- **Cross-brand:** cero edit a vitalia/comunify/lupulo (solo LEER vitalia como modelo).
- **Tenant isolation / currency / PII / master-data:** N/A (no hay BE, no hay datos reales, no hay queries). Las fixtures son sintéticas.
- **Native-first:** `build-storybook` + `tsc` + `eslint` + `vitest` corren native (host), nunca docker exec.

## Test Surfaces (§ 14 · TDD-mandatory adaptado a técnica)

> **Naturaleza técnica:** los "tests" son los **gates de verificación** (render-sanity por build, a11y, no-arbitrary, completitud, clasificación), NO Gherkin de usuario. No hay RED-first de lógica (las stories no tienen lógica). El RED-equivalente: el `build-storybook` falla si una story no compila → se arregla. Detalle ejecutable en `04-validators.yaml`.

- **render-sanity:** `npx storybook build` (o `build-storybook`) exit 0 = toda story compila + renderiza estáticamente. **Decisión:** NO hay `@storybook/test-runner` instalado → la render-sanity la da el **build** (es suficiente para "monta sin throw" estático). El addon-a11y es interactivo (panel del dev-server), no gateable en CI sin test-runner. Ver § 04-validators para la decisión a11y (advisory).
- **a11y:** `@storybook/addon-a11y` corre en el dev-server (panel interactivo) — verificación **manual** durante la demo (AC-2: verde o excepción documentada). NO gateado en CI (no hay test-runner).
- **no-arbitrary:** `npx eslint src/**/*.stories.tsx` con `@luana/ds/no-arbitrary-value`.
- **completitud-contrato:** check ejecutable (grep componentes brand-local vs filas del contrato = 0 sin clasificar). Ver § 14 04-validators.
- **clasificación correcta:** revisión auditor (cada port balde-2 sin story propia · cada único balde-3 con story).
- **arch-fitness FE:** `npx vitest run src/__tests__/architecture/` (ratchets no suben).

## Research Notes (§ 15)

- **Storybook CSF3** — patrón `Meta` + `StoryObj` confirmado contra `vitalia/frontend/src/components/shared/agents/AgentAvatar.stories.tsx` (accessed 2026-06-24) + `core/@luana/ui-kit/stories/*` (82 stories, accessed 2026-06-24). Es el estándar vigente del kit; replicar 1:1.
- **`@storybook/nextjs-vite` `appDirectory:true` + auto-mock de `next/navigation`** — confirmado en `core/@luana/ui-kit/.storybook/preview.ts` (`parameters.nextjs.appDirectory`) + `EntityWorkspaceLayout.stories.tsx` ("usa next/navigation → @storybook/nextjs mocks it"). accessed 2026-06-24. nicolify usa `@storybook/nextjs-vite@10.3.4` (mismo mecanismo). **No requirió WebSearch** — el patrón está cementado en el propio repo (kit), no es post-cutoff.
- **React Query en stories (seed-cache, no MSW)** — nicolify NO tiene MSW (`grep package.json`). El patrón cache-seed (`qc.setQueryData(key, fixture)`) es el equivalente Storybook del `vi.mock` que ya usan los `.test.tsx`. Elegido sobre MSW porque (a) no introduce dep nueva, (b) las query keys son verbatim conocidas (`['abel','icp','list']`, `['abel','icp',id]`, `['abel','buyer','list',icpId]`). accessed 2026-06-24.
- **Knowledge cutoff:** ningún tema post-cutoff. Storybook 10.x + CSF3 + nextjs-vite están en el repo y mi cutoff (enero 2026) los cubre; además verifiqué contra el código real del kit (manda el código).

## Open Questions for PM (§ 16)

1. **a11y gateado vs advisory:** NO hay `@storybook/test-runner` instalado. **Recomendación del architect:** dejar a11y como **verificación manual durante la demo** (advisory, AC-2 "verde o excepción documentada") + anotar un HB para instalar `@storybook/test-runner` si se quiere a11y HARD en CI cross-brand (sería una mejora del harness, no de esta story). ¿Chris quiere el test-runner ahora (escala el scope) o advisory? → **default architect: advisory + HB-nota.**
2. **HB-106/HB-107 NO son vapor (corrección al spec § Notas):** verifiqué que `no-div-layout`, `no-native-select` (HB-106) y `no-local-kit-primitive` (HB-107) **existen y corren** en nicolify (seeded 2026-06-24, ratchets shrink-only) + `@luana/ds/no-arbitrary-value` es eslint error. Lo que SÍ es vapor es el **promote-gate mecánico** (no hay check automático de que un net-new shared se promovió al kit — eso sigue siendo `/auditor` prosa). 04-validators los declara LIVE (los ratchets) + advisory (el promote-gate por prosa). Sin acción de PM — solo nota.
3. **`SubTabContent` / `ShellLayoutWire` / `_agent-tw-classes.ts` / `types.ts`** — los clasifiqué como "wire/dispatcher/helper no-storiable" (no son ni primitiva ni molécula visual aislada). Se listan en el contrato en esa categoría (no balde 1/2/3). ¿OK, o Chris prefiere forzar una story trivial? → **default architect: no-storiable, listados como infraestructura de routing.**
