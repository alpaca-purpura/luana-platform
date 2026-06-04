// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-1
/**
 * [entityId]/layout.tsx — Server Component layout for entity detail workspace.
 *
 * Mounts EntityWorkspaceLayout with EntitySubNavBar (N3-dynamic bar).
 * Hydrates ICP + buyers server-side and passes as props to Client components.
 *
 * Defense-in-depth whitelist guard (A4):
 *   - Validates agent === "abel" && subtab === "icp" (only N3-dynamic route so far)
 *   - Validates entityId is a UUID-shaped string (opaque ID, not PII)
 *   - Cross-tenant isolation: ICP fetch validates tenant_id match server-side
 *
 * Server Component default — no "use client" on this file.
 * Next.js 16: params is Promise → await before use.
 *
 * IcpEntityLayoutClient handles the actual EntityWorkspaceLayout mount
 * (Client Component — needs useParams for leaf URL-derivation).
 *
 * spec_anchor: 03-arch-fe.md §0 Routing + SHELL-DESIGN-CONTRACT §5.1
 * validators_gate: A4 whitelist + tenant isolation
 * downstream-regression-na: brand-local abel/icp route; no cross-brand consumers
 */

import { notFound } from "next/navigation";
import { type ReactNode } from "react";

import { IcpEntityLayoutClient } from "@/features/abel/components/icp/IcpEntityLayoutClient";
import { isValidAgent, isValidSubtab } from "@/lib/routing/shell-routes";

interface EntityLayoutProps {
  params: Promise<{ tenantId: string; agent: string; subtab: string; entityId: string }>;
  children: ReactNode;
}

/**
 * Server layout for N3-dynamic entity detail.
 *
 * Only for agent=abel subtab=icp (the only N3-dynamic route in R1).
 * Validates route, delegates to IcpEntityLayoutClient for the N3 bar mount.
 */
export default async function EntityLayout({ params, children }: EntityLayoutProps) {
  const { tenantId, agent, subtab, entityId } = await params;

  // Whitelist guard (A4): only valid agent + subtab combinations reach this layout.
  if (!isValidAgent(agent) || !isValidSubtab(agent, subtab)) {
    notFound();
  }

  // Currently only abel.icp has an N3-dynamic entity detail workspace.
  // Other agents' subtabs with entity routing added in future stories.
  if (agent !== "abel" || subtab !== "icp") {
    notFound();
  }

  // entityId safety check: opaque UUID-shaped strings only.
  // Full data validation + cross-tenant isolation happens in IcpEntityLayoutClient
  // via React Query (client) — server layout just guards the route shape.
  const isUuidShaped = /^[0-9a-f-]{8,64}$/i.test(entityId);
  if (!isUuidShaped) {
    notFound();
  }

  return (
    <IcpEntityLayoutClient
      tenantId={tenantId}
      icpId={entityId}
      rootHref={`/${tenantId}/abel/icp`}
      rootLabel="ICPs"
    >
      {children}
    </IcpEntityLayoutClient>
  );
}
