// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-6
/**
 * Subtab Page — Server Component.
 * nicolify-r0-shell T-6 — port from vitalia subtab page, re-themed to Nicolify.
 *
 * Validates both [agent] and [subtab] params against shell-routes.ts SSoT (whitelist).
 * If either is invalid → notFound() → Next.js renders [subtab]/not-found.tsx.
 *
 * On valid route → delegates to SubTabContent dispatcher which maps
 * all {agent}.{subtab} combos to EmptyState (R0 skeleton — no real features).
 *
 * A4 XSS/path-injection defense-in-depth: isValidAgent + isValidSubtab are
 * whitelist-only guards (shell-routes.ts). ANY input not in the catalog → notFound().
 * Prevents XSS payload rendering, path traversals, prototype pollution.
 *
 * No "use client" — Server Component.
 * Next.js 16 App Router: params is Promise → await before use.
 *
 * spec_anchor: 01-spec.md § A3 A4 A5 + 03-arch.md § Integration design (CONN)
 * gherkin_coverage: A1 A3 A4 A5
 * downstream-regression-na: brand-local route; no cross-brand consumers.
 */

import { notFound } from "next/navigation";

import { SubTabContent } from "@/components/shared/shell-organism/SubTabContent";
import { isValidAgent, isValidSubtab, type RibbonTabSlug } from "@/lib/routing/shell-routes";

interface PageProps {
  params: Promise<{ tenantId: string; agent: string; subtab: string }>;
}

/**
 *
 */
export default async function SubtabPage({ params }: PageProps) {
  const { agent, subtab } = await params;

  // Whitelist validation (A4): any invalid segment → 404 contextual (shell chrome intact).
  // Covers: XSS payloads (<script>...), path traversals (../../), SQL fragments, etc.
  if (!isValidAgent(agent) || !isValidSubtab(agent, subtab)) {
    notFound();
  }

  return <SubTabContent agent={agent} subtab={subtab} />;
}
