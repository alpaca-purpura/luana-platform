// cap: shell-organism.shell-vitalia
// story-origin: vitalia-fase2-s7-TBD
/**
 * shell-routes.ts — Sub-sub-tab (N3-static) routing catalog for ADR-vitalia-004 v1.1.
 *
 * AGENT_SUBSUBTABS: maps `{agent}.{subtab}` → ordered array of N3 sub-sub-tab descriptors.
 * Only entries with N3-static routes (page.tsx files) live here. Subtabs without N3
 * (dispatcher-rendered or placeholder) are NOT listed.
 *
 * Consumed by:
 *   - SubSubTabsBar (components/shared/shell-organism/SubSubTabsBar.tsx)
 *     → renders the N3 navigation strip between SubTabsBar and page content
 *   - Architecture fitness test (src/__tests__/architecture/test_agent_subsubtabs_ssot.test.ts)
 *
 * Naming convention: SubSubTabMeta mirrors SubTabMeta from agent-catalog.ts.
 *
 * ADR reference: ADR-vitalia-004 v1.1 — N3-static SubSubTabsBar pattern.
 * ANTI-PATTERN GUARD: Sub-sub-tabs MUST be static segments (e.g. /lisa/marca/identidad).
 * NEVER use Shadcn <Tabs> body inside a sub-tab view to group conceptually discrete
 * sub-sections — that is the Nivel 4 anti-pattern prohibited by ADR-vitalia-004 v1.1.
 *
 * T-4 vitalia-fase2-lisa-marca
 * spec_anchor: ADR-vitalia-004 v1.1 § 3.1.1 + 03-arch.md § T-4
 * downstream-regression-na: brand-local vitalia shell catalog; no cross-brand consumers
 */

/**
 * DEFAULT_LANDING_SUBPATH — SSoT del subpath de aterrizaje post-login del shell.
 *
 * Bug #1 fix (vitalia-bugfix-shell-nav-scroll-errors T-1): la agenda migró de
 * `valeria/agenda` → `mateo/agenda` (paradigm-map-zones T-5, v1.2 2026-05-30) pero
 * 3 redirects siguieron apuntando a `valeria/agenda`. Como `isValidAgent('valeria')
 * === false` (Valeria es supervisora sidebar, NO ribbon agent), esa ruta cae en el
 * dinámico `[agent]/layout.tsx` → `notFound()` → 404.
 *
 * `mateo/agenda` SÍ es ruta estática real (SHIPPED_STATIC_SUBTABS en agent-catalog.ts)
 * que renderiza `mateo/agenda/page.tsx` directamente sin pasar por isValidAgent.
 *
 * Un único const consumido por los 3 redirects evita que vuelva a driftear:
 *   - app/page.tsx (root landing post-login)
 *   - (shell-organism)/page.tsx (/{tenantId} → default)
 *   - (shell-organism)/layout.tsx (redirect cross-tenant inválido → primer tenant válido)
 *
 * NOTA: NO incluye el `/{tenantId}` prefix — el caller lo antepone
 * (`/${tenantId}/${DEFAULT_LANDING_SUBPATH}`).
 */
export const DEFAULT_LANDING_SUBPATH = "mateo/agenda" as const;

/**
 * BARE_TENANT_PATH — matches a path that is EXACTLY one tenant-UUID segment
 * (e.g. `/e69a691d-070e-5caf-a053-6e74642ec100`), optional trailing slash.
 *
 * UUID-only on purpose: never matches `/sign-in`, `/sign-out`, `/marketing`,
 * `/public`, etc. (those are non-UUID single segments).
 */
export const BARE_TENANT_PATH = /^\/([0-9a-f-]{36})\/?$/i;

/**
 * Returns the edge-redirect target for a BARE tenant path
 * (`/{uuid}` → `/{uuid}/${DEFAULT_LANDING_SUBPATH}`), or `null` if `pathname`
 * is not a bare tenant path.
 *
 * Bug #1 hardening (vitalia-bugfix-shell-nav-scroll-errors): proxy.ts consumes
 * this to redirect at the EDGE (HTTP 307) instead of letting the Server Component
 * `(shell-organism)/page.tsx` do an in-route-group `redirect()`. That in-group
 * redirect triggers a Next.js 16.2.3 client-Router soft-navigation that throws
 * "Rendered more hooks than during the previous render" (~40% flake). A fresh
 * edge redirect makes the browser load the destination cleanly. See proxy.ts.
 */
export function bareTenantLandingRedirect(pathname: string): string | null {
  const match = pathname.match(BARE_TENANT_PATH);
  return match ? `/${match[1]}/${DEFAULT_LANDING_SUBPATH}` : null;
}

export interface SubSubTabMeta {
  /** URL segment identifier — kebab-case static segment (e.g., "identidad", "voz-y-tono"). */
  id: string;
  /** Visible label — Spanish neutro LatAm, sin voseo. */
  label: string;
  /** Emoji icon for the sub-sub-tab. */
  icon: string;
}

/**
 * Sub-sub-tab catalog — keyed by `{agent}.{subtab}` composite.
 *
 * Only entries that have actual static page.tsx routes live here.
 * When a new story adds N3-static routing, extend this record — do NOT hardcode
 * sub-sub-tab lists inside any component (arch test enforces this file as SSoT).
 *
 * Current entries:
 *   - lisa.marca → 3 sub-sub-tabs: identidad · voz-y-tono · presencia (T-4 F2-S7)
 */
export const AGENT_SUBSUBTABS: Partial<
  Record<`${string}.${string}`, readonly SubSubTabMeta[]>
> = {
  "lisa.marca": [
    { id: "identidad", label: "Identidad", icon: "🏥" },
    { id: "voz-y-tono", label: "Voz y tono", icon: "🎙️" },
    { id: "presencia", label: "Presencia", icon: "📍" },
  ],
} as const;

/**
 * Returns the sub-sub-tabs for a given agent.subtab combo, or null if none.
 * Used by SubSubTabsBar and page.tsx redirects.
 */
export function getSubSubTabs(
  agent: string,
  subtab: string,
): readonly SubSubTabMeta[] | null {
  const key = `${agent}.${subtab}` as `${string}.${string}`;
  return AGENT_SUBSUBTABS[key] ?? null;
}

/**
 * Returns the default (first) sub-sub-tab id for a given agent.subtab combo.
 * Returns null if no sub-sub-tabs exist for this combo.
 */
export function getDefaultSubSubTab(
  agent: string,
  subtab: string,
): string | null {
  const subsubtabs = getSubSubTabs(agent, subtab);
  return subsubtabs?.[0]?.id ?? null;
}
