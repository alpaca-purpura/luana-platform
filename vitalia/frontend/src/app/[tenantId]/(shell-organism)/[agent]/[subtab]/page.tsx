/**
 * Subtab Page — Server Component placeholder.
 * F1-S9 vitalia-fase1-routing-shell — T-4
 *
 * 03-arch-fe.md § 9.6 — verbatim spec.
 *
 * Validates both [agent] and [subtab] params against agent-catalog.ts.
 * If either is invalid → notFound() → Next.js renders [agent]/not-found.tsx (inner).
 *
 * On valid route → renders a placeholder.
 * F1-S10 (empty-states) will replace this placeholder with <SubTabContent />.
 *
 * No "use client" — notFound() is a Server Action.
 * Next.js 16: params is Promise → await before use.
 *
 * spec_anchor: 03-arch-fe.md § 9.6 + 06-tickets.yaml T-4 SC-3
 * downstream-regression-na: brand-local route; no cross-brand consumers.
 */

import { notFound } from "next/navigation";

import { isValidAgent, isValidSubtab, type RibbonTabSlug } from "@/lib/agent-catalog";

interface PageProps {
  params: Promise<{ tenantId: string; agent: string; subtab: string }>;
}

export default async function SubtabPage({ params }: PageProps) {
  const { agent, subtab } = await params;
  if (!isValidAgent(agent) || !isValidSubtab(agent as RibbonTabSlug, subtab)) {
    notFound();
  }
  // F1-S10 reemplazará este placeholder por <SubTabContent>
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      <p>Contenido próximamente — F1-S10 empty-states</p>
    </div>
  );
}
