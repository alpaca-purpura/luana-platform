// cap: shell-organism.shell-vitalia
// atomics: TBD
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
