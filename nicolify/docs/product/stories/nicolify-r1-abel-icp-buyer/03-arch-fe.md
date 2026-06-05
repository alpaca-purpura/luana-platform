# 03-arch-fe · Abel → ICP & buyer (Frontend)

> Surface: `nicolify/frontend/src/`. Owner builder: **`builder-frontend`** (Sonnet). Auditor: **`auditor-frontend`** (Opus). FSD-Lite · Next.js 16 Server-First · React Query + Zustand. Consolidado: `03-arch.md`.
>
> **must_load_skills (HARD):** `nicolify-design-system` (SIEMPRE en cada ticket FE) + `frontend-expert` + `playwright-expert`. Gates: ADR-nicolify-001 G1/G2/G3 + frontend-visual-fidelity D1/D2/D3.
>
> **Mockup G1 ratificado (referencia visual exacta):** `mockups/icp-buyer.html` (`ratified_visual_by_chris: true`). 4 vistas: Arranque · Lista · Detalle · Abel propone.

## 0. Routing (ADR-nicolify-001 §1 · nav N3-dynamic EntitySubNavBar · SHELL-DESIGN-CONTRACT §5.1)

> **CORRECCIÓN DE DISEÑO (audit iter 3 — 2026-06-04):** El diseño original colocaba la ruta de detalle bajo un segmento `[entityId]/` (hermano de `[subsubtab]/` del R0). Next.js 16 prohíbe dos nombres de slug distintos a la misma profundidad: `"You cannot use different slug names for the same dynamic path ('entityId' !== 'subsubtab')"`. El error solo aparece al inicio del servidor/build — tsc/eslint/vitest/playwright list NO lo detectan. **Fix:** unificar bajo el slug R0 incumbente `[subsubtab]`, absorbiendo el comportamiento R1 via dispatch en el layout. Las URLs públicas NO cambian (`/{tenantId}/abel/icp/{icpId}/datos` sigue igual — solo el nombre del param Next.js cambia `entityId→subsubtab`).

El shell R0 ya tiene rutas dinámicas genéricas `[agent]/[subtab]/[subsubtab]`. Esta story agrega el nivel **detalle** bajo el mismo segmento `[subsubtab]` via dispatch condicional:

```
app/[tenantId]/(shell-organism)/[agent]/[subtab]/
  ├── page.tsx                         # MODIFIED-via-dispatcher: abel.icp → IcpMasterListView (lista). Resto sin cambio.
  └── [subsubtab]/                     # R0 incumbente (renaming a [entityId] era ILEGAL — Next.js slug conflict)
      ├── layout.tsx                   # NEW (R1) · Dispatch:
      │                                #   abel.icp → IcpEntityLayoutClient (icpId = subsubtab param)
      │                                #   otros subtabs → pass-through {children} (R0 no tenía layout aquí)
      ├── page.tsx                     # MERGED (R0+R1) · Dispatch:
      │                                #   abel.icp → redirect → ./datos (icpId sin leaf → primer leaf)
      │                                #   otros subtabs → whitelist validate → SubTabContent (R0 verbatim)
      └── [leaf]/
          └── page.tsx                 # NEW (R1) · leaf ∈ {datos | buyerId}: datos→IcpDatosForm, else→BuyerLeafForm
                                       # Solo alcanzable cuando agent=abel, subtab=icp
```

- **Master** se sirve por el dispatcher `SubTabContent` existente (no nueva ruta): reemplazar el `EmptyState` de `"abel.icp"` por `<IcpMasterListView/>`. Las rutas detalle son nuevos niveles bajo `[subsubtab]`.
- `params` / `searchParams` son `Promise<>` (Next.js 16) → `await` antes de usar.
- **Whitelist guard (defense-in-depth):** `[subsubtab]/layout.tsx` valida `agent/subtab` via shell-routes SSoT; para `abel.icp` valida que `subsubtab` (= icpId) sea UUID-shaped. Datos sensibles nunca en URL (solo `icpId`/`buyerId` opacos).
- **Param key rename (interno, sin impacto en URLs):** el valor del icpId fluye igual por props; el Server layout extrae `subsubtab` (antes `entityId`) del `Promise<params>` y lo pasa como `icpId` prop a `IcpEntityLayoutClient`. `EntityWorkspaceLayout` y `IcpEntityLayoutClient` leen `icpId` por prop (no de `useParams`) → cero impacto en componentes Client.
- Server Component default · SSR initial state vía layout → hidrata React Query.

## 1. FSD-Lite layout (ADR-nicolify-001 §2)

```
features/abel/
├── api/
│   ├── icp-api.ts             # fetchClient (auto X-Tenant-ID) — list/get/create/patch/markReady/delete
│   ├── buyer-api.ts          # list-by-icp/get/create/patch/setPrimary/delete
│   └── extract-api.ts        # start + poll
├── hooks/
│   ├── use-icps.ts           # useIcps (key ['abel','icp','list']) · useIcp (['abel','icp',id])
│   ├── use-buyers.ts         # useBuyers (['abel','icp',id,'buyers']) · useBuyer (['abel','buyer',id])
│   ├── use-icp-mutations.ts  # create/patch/markReady/delete + cache invalidation
│   ├── use-buyer-mutations.ts
│   └── use-icp-extract.ts    # start + poll (status analizando→done/failed)
├── store/
│   └── abel-ui-store.ts      # Zustand SSR-safe (G2): intake overlay open, analizando overlay, proposal banner visible
├── types/
│   ├── icp.ts                # Icp, IcpListItem, IcpStatus, IcpOrigin (camelCase mirror)
│   ├── buyer.ts              # Buyer, DecisionPower
│   ├── extract.ts            # IcpExtractJob
│   └── icp-schema.ts         # Zod (RHF) — icpFormSchema, buyerFormSchema
└── components/icp/
    ├── IcpMasterListView.tsx     # "use client" root del master (hidrata RQ)
    ├── IcpCard.tsx               # card: icono + nombre + vertical + estado + #buyers (SIN comp-bar)
    ├── IcpWorkspaceView.tsx      # "use client" root del detalle (recibe ICP + leaf hidratados)
    ├── IcpDatosForm.tsx          # grupos de campos + WhatForChip por grupo (RHF autosave 600ms)
    └── BuyerLeafForm.tsx         # form buyer (rol/poder/demo/psico/pains/desires/objeciones/canales)
```

### Reusables fundacionales → `components/shared/` (NO `features/abel/`)

| Componente | Path | Nota |
|---|---|---|
| `UniversalIntake` | `components/shared/intake/UniversalIntake.tsx` | 4 modos: URL/Archivo/Texto/Conectar(disabled→CTA Config). Emite seed → extract-api |
| `DraftFirstStarter` | `components/shared/DraftFirstStarter.tsx` | arranque 2-caminos (Abel lo arma / Lo armo yo) |
| `ProposalBanner` | `components/shared/ProposalBanner.tsx` | banner "Abel propuso · Descartar/Ratificar" |
| `WhatForChip` | `components/shared/WhatForChip.tsx` | chip "¿para qué sirve?" (agente consumidor + tooltip) |
| `EntitySubNavBar` | `components/shared/shell-organism/EntitySubNavBar.tsx` | **PORT de vitalia re-temizado** · variante leaves-dinámicos · lift candidate |
| `EntityWorkspaceLayout` | `components/shared/shell-organism/EntityWorkspaceLayout.tsx` | monta EntitySubNavBar + hidrata entidad + slot |

D1 (design-system-first): reusar átomos `@luana/ui-kit` (Button/Badge/Card/Input/Textarea/Select/Form/Tooltip/Skeleton/Sonner/DetailPanel) antes de crear. Crear primitiva solo si no existe (Shadcn en `components/ui/`, NUNCA `<div>` crudo).

## 2. Client root + data layer (ADR-nicolify-001 §3, §4)

- `IcpMasterListView` / `IcpWorkspaceView` = `"use client"` línea 1 + props de hidratación; `useHydrateQueryClient` en mount.
- **server data → React Query** (ICPs, buyers, job poll). **UI state → Zustand** (intake/analizando/banner). **URL state → searchParams + path** (`entityId`/`leaf` activo URL-derived). **forms → RHF**. NUNCA Zustand para data fetched.
- **`EntitySubNavBar` activeLeaf = URL-derived** (lee `leaf` del path), no de un store. `router.push` (no full reload — preserva RQ cache · SHELL-DESIGN-CONTRACT §5.1).

## 3. Forms (ADR-nicolify-001 §5)

- RHF + `zodResolver` (`types/icp-schema.ts`). Autosave debounce **600ms** por campo → PATCH (RN-8 guardar nunca bloquea). Toast `sonner` "Guardado." (microcopy spec).
- `mark-ready`: botón "Marcar listo" → POST; 422 con `missing[]` → muestra el bloqueo inline ("Para marcarlo listo falta: ángulo de venta y al menos un buyer con rol.") sin cambiar estado.
- Currency: `avgTicket` + `avgTicketCurrency`; display `formatMoney(amount, currency ?? useTenantLocale().currency)`. NUNCA `'USD'` hardcoded (RN-11).

## 4. SSR-safe store (G2 · ADR-vitalia-006)

`abel-ui-store.ts` → si persiste (recordar último intake mode), usar `createSsrSafePersistedStore` + `useStoreHydration` DENTRO del chunk `dynamic({ssr:false})`. Skeleton del `EntityWorkspaceLayout` boundary = 100% store-free (`no-store-in-ssr-skeleton` arch test). Si el store es efímero (no persist), aún así no suscribir en skeleton.

## 5. Tailwind JIT-safe (G3)

`EntitySubNavBar` + cards + leaves usan agent-color via `_agent-tw-classes.ts` (`agentClass('abel')` → literal completo `--agent-abel #A855F7`). NUNCA template literals en class strings (`test_agent_tw_classes` lo bloquea).

## 6. TypeScript Types (camelCase mirror de los DTOs BE)

```ts
// types/icp.ts
export type IcpStatus = "borrador" | "listo";
export type IcpOrigin = "manual" | "draft";
export interface Icp {
  id: string; label: string; description: string | null;
  vertical: string | null; companySize: string | null; geo: string | null;
  businessModel: string | null; avgTicket: string | null; avgTicketCurrency: string | null;
  salesCycle: string | null; mainPain: string | null; salesAngle: string | null;
  signals: string[]; antiPattern: string | null;
  status: IcpStatus; origin: IcpOrigin; buyerCount: number;
  createdAt: string | null; updatedAt: string | null;   // ISO 8601
}
export interface IcpListItem { id: string; label: string; vertical: string | null; status: IcpStatus; buyerCount: number; }
// types/buyer.ts — Buyer (camelCase: icpId, decisionPower, isPrimary, preferredChannels, etc.)
// types/extract.ts — IcpExtractJob { jobId: string; status: "analizando"|"done"|"failed"; icpId: string | null; }
```

> `fetchClient` (nicolify lib) auto-inyecta `X-Tenant-ID` (Clerk → `useTenantId()`, NUNCA `orgId`). Mapeo snake→camel en la capa `api/`.

## 7. Estados visuales (spec § Estados) → componentes

| Estado | Componente / vista |
|---|---|
| arranque (0 ICPs) | `DraftFirstStarter` (master cuando lista vacía) — sin EntitySubNavBar |
| intake | `UniversalIntake` (overlay) — 4 modos, "Conectar" disabled+CTA Config |
| analizando | overlay "Abel está leyendo…" (`aria-live`) |
| lista (≥1 ICP) | `IcpMasterListView` + `IcpCard[]` (sin comp-bar) |
| detalle-datos | `EntitySubNavBar` (leaf 📋 activo) + `IcpDatosForm` |
| detalle-buyer | `EntitySubNavBar` (leaf buyer activo) + `BuyerLeafForm` |
| borrador-propuesto | `ProposalBanner` arriba del contenido (Descartar/Ratificar) |
| directory-mode | `EntitySubNavBar` leaves `aria-disabled` (SC-a11y) |
| error | banner "Abel no pudo leerlo" + reintento + fallback manual (SC-network) |

## 8. Accessibility (SC-a11y · spec § Accessibility)

- `EntitySubNavBar` = `role="tablist"`; cada leaf `role="tab"` + `aria-selected`; directory-mode `aria-disabled`. Roving tabindex + flechas Left/Right/Home/End. `router.push` (no reload).
- Master list teclado-navegable, foco visible `focus:ring-2`. Intake dropzone con alternativa teclado + `aria-live`. WhatForChip accesible (tooltip + texto para lector). Contraste AA. axe `wcag2aa` en goldens.

## 9. Visual fidelity (D1/D2/D3 · frontend-visual-fidelity)

- **D2 mockup adherence:** las 4 vistas del mockup `icp-buyer.html` (Arranque/Lista/Detalle/Propuesta). Visual goldens side-by-side (4 vistas × 2 themes). ⚠️ El mockup muestra un `.ring` de completitud en CSS pero el spec RN-8 **eliminó la barra de completitud** — implementar SIN completeness ring (el spec manda sobre el CSS residual del mockup).
- **D3 scope discipline:** SOLO `/abel/icp**`. NO tocar otros subtabs, NO el wrapper shell (TopBar/Ribbon/SubTabsBar/LuanaSidebar — port R0 ya shipped). Ver `playwright_visual_scope` en 04-validators.

## 10. Tests (TDD RED-first · Vitest + Playwright)

- **Vitest co-located:** hooks (RQ keys, invalidation), `IcpCard`, `IcpDatosForm` (autosave, mark-ready missing[]), `BuyerLeafForm`, `UniversalIntake` (4 modos, Conectar disabled), `ProposalBanner`, `DraftFirstStarter`, `WhatForChip`, `EntitySubNavBar` (leaves dinámicos, roving tabindex, directory-mode disabled).
- **Playwright (fixture `base.ts` anti-burbuja — pageerror/console/response/next-overlay):** 15 SC (ver 04-validators `scenario_coverage`). Visual goldens vs mockup. axe a11y. Cold-start variant donde aplique (no seeded-state mask).
- Comandos: `cd nicolify/frontend && npx tsc --noEmit && npx eslint src/ --cache && npx vitest run --coverage`; E2E `E2E_BASE_URL=http://localhost:3001 npx playwright test`.

## 11. Registration (CONN)

- `SubTabContent.tsx` (MODIFIED): `"abel.icp"` → `<IcpMasterListView/>` (reemplaza EmptyState).
- Nav: `abel.icp` ya en `AGENT_SUBTABS` + `AGENT_CATALOG.abel.defaultSubtab="icp"` (shell-routes SSoT — NO duplicar).
- Detalle: nuevas rutas `[entityId]/{layout,page,[leaf]/page}` enganchan el EntitySubNavBar al stack.
