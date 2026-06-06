---
story_id: nicolify-r0-sitemap-completo
kind: 03-arch-fe
surface: frontend
builder: builder-frontend
auditor: auditor-frontend
parent: 03-arch.md
---

# 03-arch-fe — Nicolify R0 sitemap (FE-only thin nav build)

> Surface FE único de esta story. Detalle completo en `03-arch.md` (consolidado). Esta vista = el contrato que `builder-frontend` consume.

## Archivos en scope (NEW vs MODIFIED)

| Archivo | Acción | Qué |
|---|---|---|
| `src/lib/routing/shell-routes.ts` | MODIFIED | SSoT: `AGENT_CATALOG.defaultSubtab` (1er subtab v3), `AGENT_SUBTABS` (árbol v3), `AGENT_SUBSUBTABS` (3 leaves), `tabLabel` sara="Próximamente". `DEFAULT_LANDING` SIN cambio. Guards SIN cambio de lógica (validan el nuevo set por construcción). + agregar `isValidSubSubTab(agent, subtab, subsubtab)` (whitelist, simétrico a `isValidSubtab`). |
| `src/lib/agent-catalog.ts` | MODIFIED | `AGENT_CATALOG` (catálogo del panel Luana): `defaultSubtab` por agente al árbol v3 + role/label Sara → "Próximamente". |
| `src/components/shared/shell-organism/SubTabContent.tsx` | MODIFIED | `SUBTAB_CONTENT_MAP`: reescribir keys al árbol v3 (N2 + 8 leaves N3). Copy empty-state español neutro tuteo. Reusa `EmptyState` molécula (NO nueva UI). |
| `src/app/[tenantId]/(shell-organism)/[agent]/[subtab]/[subsubtab]/page.tsx` | ★ NEW | Ruta N3 que falta. Server Component, `await params`, valida agent+subtab+subsubtab vía whitelist → `notFound()`. Delega al dispatcher para el empty-state del leaf. Clon verbatim del patrón de `[subtab]/page.tsx`. |
| `src/app/[tenantId]/(shell-organism)/[agent]/[subtab]/[subsubtab]/not-found.tsx` | ★ NEW (recomendado) | 404 contextual del segmento N3 (clon de `[subtab]/not-found.tsx`). |
| `src/lib/routing/__tests__/shell-routes.test.ts` | MODIFIED | Unit de datos: arrays v3 + guards + `AGENT_SUBSUBTABS`. |
| `src/__tests__/architecture/test_shell_routes_ssot.test.ts` | MODIFIED | Bloque Sara: `'"proyectos"'` → `'"proximamente"'` (sigue exactamente 1 subtab). |
| `e2e/fixtures/base.ts` | ★ NEW | Fixture anti-burbuja (pageerror/console.error/response≥400 en `/api/`/`nextjs-portal`) extendiendo `auth.fixture` (Clerk token). DoD #37. |
| `e2e/regression/nicolify-r0-shell/nav-walk-v3.spec.ts` | ★ NEW | Recorre TODO el árbol v3 (Ribbon→N2→N3) + assert empty-state + 0 errores. Importa `base.ts`. |
| `e2e/regression/nicolify-r0-shell/empty-states-all-subtabs.spec.ts` | MODIFIED | `ALL_SUBTABS` → árbol v3 (data). |
| `e2e/regression/nicolify-r0-shell/{ribbon-nav,ribbon-deeplink}.spec.ts` | MODIFIED (si referencian slugs viejos) | Solo data (URLs/slugs), nunca mecánica. |

## FORBIDDEN to touch (maquinaria shipped — data-driven desde el SSoT)
`Ribbon.tsx` · `RibbonTab.tsx` · `SubTabsBar.tsx` · `SubTab.tsx` · `SubSubTabsBar.tsx` · `SubSubTab.tsx` · `EmptyState.tsx` · `ShellOrganismLayout*` · `LuanaSidebar*` / `Luana*` · `TopBarGlobal*` · `[agent]/page.tsx` · `[subtab]/page.tsx` (se LEE para clonar, NO se edita) · `components/ui/*` · `core/luana-core-*/` · cualquier otro brand.

## Constraints FE
- Server-First: los empty-states + páginas N3 son Server Components (sin `"use client"`). Solo la maquinaria N2/N3 (ya shipped) es client.
- G3 (Tailwind JIT-safe): NUNCA template literals en class strings.
- FSD-Lite boundaries: la ruta N3 importa del SSoT (`lib/routing`) + dispatcher (`components/shared`) — capas permitidas.
- Español neutro tuteo en TODOS los labels + copy (sin voseo). Sara tab = "Próximamente".
- `tsc --noEmit --strict` + `eslint --max-warnings 0` = 0 errores.

## Whitelist guard N3 (a agregar en shell-routes.ts)
```ts
export function isValidSubSubTab(agent: unknown, subtab: unknown, subsubtab: unknown): boolean {
  if (!isValidSubtab(agent, subtab)) return false;
  if (typeof subsubtab !== "string" || subsubtab.length === 0) return false;
  const leaves = getSubSubTabs(agent as string, subtab as string);
  return leaves !== null && leaves.some((l) => l.id === subsubtab);
}
```
Cubre A4 (XSS/path-injection) en N3 igual que `isValidSubtab` en N2.
