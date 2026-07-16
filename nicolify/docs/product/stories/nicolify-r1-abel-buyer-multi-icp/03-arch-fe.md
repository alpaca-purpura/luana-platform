# 03-arch-fe · Abel → Buyer multi-ICP (Frontend)

> Surface: `nicolify/frontend/src/features/abel/**` + `lib/routing/shell-routes.ts` + `components/shared/shell-organism/SubTabContent.tsx`. Owner builder: **`builder-frontend`** (workhorse). Auditor: **`auditor-frontend`** (flagship). Consolidado: `03-arch.md`.
>
> **architecture_pattern: ADR-nicolify-001** · **adr_001_compliance: full** (nueva sub-tab "buyers" → G0-G3). **Storybook-first reuse-only** — cero átomo/kit PROMOTE (composiciones feature-local con átomos del kit existentes, `shell-mockup-per-component.md §5.bis`).

---

## 0. Realidad FE actual (read-side gate — NO imaginar el contrato)

Verificado contra código real (anti [[embudo-imagined-contract]]):

| Claim del spec | Realidad verificada (path:línea) | Consecuencia |
|---|---|---|
| Sheet "+ buyer" con 2 tabs (Elegir existente / Crear nuevo) | **NO existe sheet hoy.** "+ buyer" es un *affordance leaf* que crea blank + navega (`IcpEntityLayoutClient.tsx:154-190`, `useCreateBuyer`) | El sheet es composición NUEVA feature-local |
| "Crear nuevo → BuyerLeafForm.tsx **sin cambios**" | **Inexacto.** `BuyerLeafForm.tsx:225,228` usa `is_primary` escalar + `useSetPrimaryBuyer(buyerId, icpId)` sin `icp_id` en body | BuyerLeafForm tiene 3 cambios reales (ver §3) |
| `RawBuyer` con `icp_id` + `is_primary` escalar | `buyer-api.ts:63-81` (`RawBuyer`) + `types/buyer.ts` (`Buyer.icpId`, `Buyer.isPrimary`) + `mapBuyer:95-115` | Rompen con el nuevo `BuyerResponse` (§1) → T-FE-1 los migra |
| `GET /icp/{id}/buyers` list item | `RawBuyerListItem` = `{id,name,role,decision_power,is_primary}` (`buyer-api.ts:55`) | Coincide con `BuyerListItemResponse` BE → `mapBuyerListItem` **sin cambio** |
| Callers de `DELETE /buyer/{id}` (retirado) | `buyer-api.ts::delete:228`, `use-buyer-mutations::useDeleteBuyer:127`, tests `buyer-api.test.ts:123`+`use-buyer-mutations.test.ts:87` | Migrar a detach `DELETE /icp/{icp_id}/buyers/{buyer_id}` |
| Callers de `set-primary` | `buyer-api.ts::setPrimary:214`, `use-buyer-mutations::useSetPrimaryBuyer:102`, `BuyerLeafForm.tsx:228,302` | Agregar `icp_id` al body |
| **(v2)** "Borrar buyer" tiene UI hoy | **NO** — `useDeleteBuyer` existe solo como hook+api+tests; cero consumidor en componentes (grep verificado). | El botón "Quitar de este ICP" (detach) es affordance **net-new** en `BuyerLeafForm` (§3.4) — no una migración de botón existente |
| **(v2)** `isPrimary` en el create body | `buyer-api.ts:122` lo manda condicional + `IcpEntityLayoutClient:175` (`isPrimary: buyers.length === 0`) — pero `BuyerCreate` BE NO tiene el campo (verificado) → **payload muerto**, server siempre seteaba False | Eliminar `isPrimary` de `CreateBuyerPayload` + del caller; el server decide (RN-12) |
| **(v2)** ICP delete en UI | "Descartar borrador" — `IcpWorkspaceView.tsx:74,87` (`useDeleteIcp` + confirm via prop `isDescartando`) | El copy del confirm gana la advertencia cascade (§7); `useDeleteIcp` gana invalidación del directory |

---

## 1. TypeScript types (camelCase mirror de los DTOs BE §4)

`types/buyer.ts` — DIFF:
```ts
export interface AttachedIcpRef {          // NUEVO — mirror BE AttachedIcpRef
  icpId: string;
  label: string;
  isPrimary: boolean;
}

export interface Buyer {                   // DIFF — ICP-agnóstico
  id: string;
  // ── ELIMINADOS: icpId, isPrimary (escalares) ──
  name: string;
  role: string | null;
  decisionPower: DecisionPower | null;
  demographics / psychographics / painPoints / desires / objections /
    buyerJourney / purchaseTriggers / preferredChannels;   // SIN CAMBIO
  attachedIcps: AttachedIcpRef[];          // ← NUEVO
  createdAt: string | null;
  updatedAt: string | null;
}

export interface BuyerListItem {           // SIN CAMBIO (id,name,role,decisionPower,isPrimary)
  ...                                      // isPrimary = para ESE ICP
}
```

## 2. API client + hooks (`api/buyer-api.ts`, `hooks/`)

`buyer-api.ts` — DIFF:
- `RawBuyer`: `icp_id`/`is_primary` → `attached_icps: {icp_id,label,is_primary}[]`; `mapBuyer` mapea `attachedIcps`.
- `setPrimary(opts, id, icpId)` → body `{ icp_id: icpId }`.
- **(v2)** `CreateBuyerPayload`: **eliminar `isPrimary`** (línea 40 + spread condicional línea 122) — payload muerto (BE nunca tuvo el campo); el server decide primary (RN-12).
- **NUEVO** `attach(opts, icpId, buyerId)` → `POST /api/v1/abel/icp/{icpId}/buyers/{buyerId}/attach` → `RawBuyer`.
- **NUEVO** `detach(opts, icpId, buyerId)` → `DELETE /api/v1/abel/icp/{icpId}/buyers/{buyerId}` (reemplaza `delete`).
- **NUEVO** `listAll(opts)` → `GET /api/v1/abel/buyers` → `RawBuyer[]` (directory).

`hooks/use-buyers.ts` — agregar `useAllBuyers()` (RQ key `['abel','buyers','directory']`, mismo patrón auth/tenant que `useBuyers`).
`hooks/use-buyer-mutations.ts` — DIFF:
- `useSetPrimaryBuyer(buyerId, icpId)` → pasa `icpId` a `setPrimary`.
- **NUEVO** `useAttachBuyer(icpId)` → invalida `listByIcp(icpId)` + `['abel','buyers','directory']`. **(v2, SC-2)** `onError`: si status 409 → toast "«{name}» ya está en este ICP" (Spanish neutro) + invalida ambas keys igualmente (la lista stale se refresca y el buyer sale del picker). Otros errores → toast genérico de attach (SC-9).
- `useDeleteBuyer` → `useDetachBuyer(buyerId, icpId)` → `detach`; invalida `listByIcp(icpId)` + directory + `['abel','buyer',buyerId]` (detail — badges).

`hooks/use-icp-mutations.ts` — **(v2, RN-11)** `useDeleteIcp` gana invalidación de `['abel','buyers','directory']` (el cascade pudo soft-deletear buyers exclusivos / quitar badges).

## 3. `BuyerLeafForm.tsx` — 5 cambios reales (prop `icpId` pasa a opcional) — v2 amplía de 3 a 5
1. `is_primary` per-ICP: derivar de la lista del ICP (`useBuyers(icpId)` item) o de `buyer.attachedIcps.find(a => a.icpId === icpId)?.isPrimary` — NO del `buyer.isPrimary` escalar (ya no existe).
2. set-primary: `useSetPrimaryBuyer(buyerId, icpId)` pasa `icpId`.
3. **Modo directory** (`icpId` ausente): oculta botón set-primary y "Quitar de este ICP"; muestra badges de `attachedIcps` + botón **"+ agregar a otro ICP"** (abre `AttachToIcpSheet`).
4. **(v2, SC-14) Botón "Quitar de este ICP"** (modo ICP, affordance net-new — hoy no existe ningún botón de borrar/quitar): destructive-secondary al pie del form. Flujo:
   - `attachedIcps.length > 1` → confirm simple (`Dialog` kit): "¿Quitar «{name}» de este ICP? Seguirá disponible en tus otros ICPs y en Buyers." → `useDetachBuyer` → `router.push` al detalle del ICP (`/{tenantId}/abel/icp/{icpId}/datos`).
   - `attachedIcps.length === 1` → confirm **destructivo** (botón rojo, copy explícito): "Es el último ICP de este buyer — al quitarlo, el perfil se eliminará." → detach (BE hace el soft-delete, SC-3b) → mismo navigate.
   - Cancelar → cero requests. Estado `isPending` deshabilita el botón (no doble-submit).
5. **(v2, RN-9 awareness)** Fila "También en: {badges de los otros ICPs}" visible en modo ICP cuando `attachedIcps.length > 1` — mismos badges que el directory (`BuyerCard`). El usuario sabe que edita una entidad compartida ANTES de tocar campos.

## 4. Composiciones NUEVAS (feature-local · átomos `@luana/ui-kit` · sin PROMOTE)

| Componente | Rol | Átomos kit reusados | Storybook ref |
|---|---|---|---|
| `AddBuyerSheet.tsx` | Sheet "+ buyer" en detalle ICP: 2 tabs. **Elegir existente** — search client-side sobre `useAllBuyers` (filtra ya-attached a ese ICP) → click → `useAttachBuyer`; **(v2)** empty states propios: sin buyers en tenant → "Aún no tienes buyers creados." + CTA que salta al tab Crear nuevo · todos attached → "Todos tus buyers ya están en este ICP."; 409 stale → toast + refresh (hook §2). **Crear nuevo** — **(v2, AC-10)** input **nombre required** (autofocus, `maxLength 200`) + botón "Crear buyer" (disabled si vacío/`isPending`) → `useCreateBuyer({ name })` → cierra sheet + navega al leaf nuevo. Mata el create-blank "Nuevo buyer". | `Dialog`/`Sheet`, `Input`, `Button`, `Tabs`, `ShellEmptyState` (kit) | patrón `Dialog` story `@luana/ui-kit` |
| `BuyersMasterListView.tsx` | Directory: grid tenant-wide (mirror de `IcpMasterListView`), cada card con badges de ICPs attached; click → abre buyer detail (panel/sheet, modo directory) | `PageContainer`,`PageHeader`,`EntityInfoCard`/`IcpCard`-pattern,`ListPageSkeleton`,`ErrorState`,`ShellEmptyState` | `IcpMasterListView` pattern (grid) |
| `BuyerCard.tsx` | Card del directory (nombre + role + badges ICPs) | `EntityInfoCard` (canon §2.3) | `EntityInfoCard` story |
| `AttachToIcpSheet.tsx` | Picker de ICP (desde buyer detail "+ agregar a otro ICP") → `useAttachBuyer` | `Dialog`, `Input`, `Button` | `Dialog` story |

> Todas son composiciones de un solo uso con átomos del kit → `shell-mockup-per-component.md §5.bis`: quedan en `features/abel/components/` sin story propia, sin PROMOTE, sin rechazo del auditor por esa razón. Cero `<select>` nativo, cero arbitrary-value, cero `<div>` de layout donde hay page-primitive (canon §0/§2.5/§2.7). Spanish neutro tuteo. Colores agente vía `bg-agent-abel` (G3 JIT-safe, sin template literals).

## 5. Integration design (CONN) — reachability de la sub-tab "Buyers"

**Decisión de routing (ponytail + [[registry-exists-resolver-closed]]):** el buyer-detail del directory NO usa una ruta anidada nueva → **panel/sheet client-side** dentro de `BuyersMasterListView`. Razón: el dispatch entity-bearing del shell está **hardcodeado a `agent==="abel" && subtab==="icp"`** en DOS archivos (`[subtab]/[subsubtab]/layout.tsx` + `page.tsx`) — extenderlo a `abel.buyers` tocaría el path crítico de `abel.icp` (fuera de scope + riesgo). El master de "buyers" SÍ es reachable por ruta dinámica (no toca ese dispatch). Alternativa (ruta URL-addressable del buyer detail) = **deferrable** a story aparte si Chris la pide en G.

**Registration points (notarized · exactos):**
1. `nicolify/frontend/src/lib/routing/shell-routes.ts` → `AGENT_SUBTABS.abel` gana 4º entry: `{ id: "buyers", label: "Buyers", icon: "👥" }` (hoy: `icp`, `oferta`, `marca`). Esto habilita `isValidSubtab("abel","buyers")` → `[subtab]/page.tsx` valida y renderiza `<SubTabContent agent="abel" subtab="buyers" />` (sin N3 leaves → no redirect).
2. `nicolify/frontend/src/components/shared/shell-organism/SubTabContent.tsx` → agrega dispatch `if (key === "abel.buyers") return <BuyersMasterListView />;` (junto al `abel.icp` existente). `SUBTAB_CONTENT_MAP["abel.buyers"]` NO necesario (el dispatch lo precede; opcionalmente empty-state fallback).
3. `features/abel/index.ts` → export `BuyersMasterListView`.

**Reachability path concreto:** Ribbon → tab "Estrategia" (abel) → SubTabsBar muestra `[ICP & buyer] [Oferta] [Marca] [Buyers]` → click "Buyers" → `/{tenantId}/abel/buyers` → `[subtab]/page.tsx` (valida whitelist) → `SubTabContent` → `BuyersMasterListView`. **Consumed** (usuario), **On-map** (cap `abel/icp-buyer`), **Navigable** (SubTabsBar), **Notarized** (`shell-routes.ts` + `SubTabContent.tsx`). CONN ✅.

> ⚠️ `SubTabContent.tsx` vive en `components/shared/` — está en `forbidden_visual_changes` del visual scope PERO el cambio aquí es **1 línea de dispatch** (registration point declarado en spec + anti-orphan), NO un cambio visual. Es la única edición permitida a shared en esta story (registro de reachability, no restyle). El auditor lo valida contra este arch.

## 6. FE delta en `IcpEntityLayoutClient.tsx` (detalle ICP)
El affordance "+ buyer" (`:154-190`) pasa de **crear-inmediato** a **abrir `AddBuyerSheet`** (local state, no store). **(v2)** Se ELIMINA `handleAddBuyer` con su create-blank (`name: "Nuevo buyer"`) y su `isPrimary: buyers.length === 0` (payload muerto — BE nunca lo leyó): el create ahora vive en el tab "Crear nuevo" del sheet, con nombre real (AC-10) y primary decidido por el server (RN-12). El tab "Elegir existente" hace attach + invalida `listByIcp`.

**(v2) `IcpWorkspaceView.tsx` — copy del confirm "Descartar borrador":** agrega la advertencia cascade (RN-11): "Los buyers que solo existen en este ICP se eliminarán también." Cambio de copy + test, cero cambio de estructura.

## 7. Estados visuales (scenarios FE)
- SC-9 network-failure: `useAllBuyers` / attach fallan → `ErrorState` + retry, Spanish neutro ("No pudimos cargar los buyers…"), sin white-screen.
- SC-10 empty-state: directory sin buyers → `ShellEmptyState` con CTA a "crear el primer ICP + buyer" (reusa patrón de `abel.icp`).
- SC-11 a11y: WCAG AA sub-tab "buyers" (átomos ya accesibles del kit; tab order, focus visible) — incluye los dialogs nuevos (confirm detach, sheet).
- **(v2)** SC-15 picker-empty-states: tab "Elegir existente" — sin buyers → CTA a "Crear nuevo"; todos attached → mensaje sin CTA.
- **(v2)** SC-2 (UI): 409 stale en attach → toast "«{name}» ya está en este ICP" + lista refrescada, sheet operable.
- **(v2)** SC-14: confirm detach en 2 variantes (simple >1 ICP · destructivo último ICP) — copy exacto en spec § Pantallas.
- **(v2)** RN-9 awareness: "También en: {badges}" en modo ICP con `attachedIcps.length > 1`.
- **(v2)** SC-12 (copy): confirm "Descartar borrador" advierte eliminación de buyers exclusivos.

## 8. Tests (TDD RED-first)
- `api/buyer-api.test.ts` — attach/detach/listAll paths + setPrimary body `{icp_id}` (migrar los 2 tests de `delete`/`set-primary`); **(v2)** create body SIN `is_primary`.
- `hooks/use-buyer-mutations.test.ts` — useAttachBuyer/useDetachBuyer/setPrimary(icpId) source-scan + invalidación; **(v2)** useAttachBuyer onError 409 → invalidación + toast (mock 409); useDetachBuyer invalida buyer-detail.
- `hooks/use-icp-mutations.test.ts` — **(v2)** useDeleteIcp invalida directory.
- `hooks/use-buyers.test.ts` — useAllBuyers.
- `components/.../AddBuyerSheet.test.tsx` — tabs, filtro ya-attached, **(v2)** nombre required (botón disabled vacío), empty states ×2 (SC-15), toast 409 + refresh (SC-2).
- `components/.../BuyersMasterListView.test.tsx` — grid, badges, panel detalle.
- `components/.../BuyerLeafForm.test.tsx` — directory mode + set-primary icpId; **(v2)** confirm detach simple vs destructivo (SC-14 — cancelar NO llama detach), fila "También en:" solo con >1 ICP.
- `components/.../IcpWorkspaceView.test.tsx` — **(v2)** copy cascade en confirm descartar (SC-12).
- e2e `nicolify/frontend/e2e/regression/nicolify-r1-abel-buyer-multi-icp/`: `attach-existing.spec.ts` (SC-1), `edit-propagates.spec.ts` (SC-4), `buyers-directory.spec.ts` (SC-9 network, SC-10 empty, SC-11 axe), **(v2)** `detach-last-confirm.spec.ts` (SC-14 — dialog real, cancelar/confirmar, buyer desaparece del directory).

## 9. Cross-cutting
- Tenant: `useTenantId()` (NUNCA `orgId`) — patrón existente en todos los hooks.
- FSD-Lite: named exports, sin deep imports cross-feature. `SubTabContent` (shared) → import de `features/abel` permitido (patrón ya usado con `IcpMasterListView`).
- G2 SSR-safe: `BuyersMasterListView` usa store solo tras el boundary `ssr:false` (igual que `IcpMasterListView`). G3 JIT-safe: `_agent-tw-classes` / clases estáticas.
