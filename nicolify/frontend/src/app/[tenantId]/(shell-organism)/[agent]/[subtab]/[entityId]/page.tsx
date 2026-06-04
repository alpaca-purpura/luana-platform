// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-1
/**
 * [entityId]/page.tsx — Redirect from entityId root to first leaf ("datos").
 *
 * When user navigates to /{tenantId}/abel/icp/{entityId} (no leaf),
 * redirect to the first leaf: /{tenantId}/abel/icp/{entityId}/datos
 *
 * This ensures the EntitySubNavBar always has an active leaf selected.
 * URL-derived activeLeaf pattern: no leaf → redirect → datos leaf active.
 *
 * Server Component — no "use client".
 * Next.js 16: params is Promise → await before use.
 *
 * spec_anchor: 03-arch-fe.md §0 Routing (entityId sin leaf → redirect to primer leaf)
 * validators_gate: routing redirect correctness
 * downstream-regression-na: brand-local route; no cross-brand consumers
 */

import { redirect } from "next/navigation";

interface EntityRootPageProps {
  params: Promise<{ tenantId: string; agent: string; subtab: string; entityId: string }>;
}

/**
 * Redirect [entityId] (no leaf) to the first leaf: "datos".
 * Ensures EntitySubNavBar always has an activeLeaf.
 */
export default async function EntityRootPage({ params }: EntityRootPageProps) {
  const { tenantId, agent, subtab, entityId } = await params;
  redirect(`/${tenantId}/${agent}/${subtab}/${entityId}/datos`);
}
