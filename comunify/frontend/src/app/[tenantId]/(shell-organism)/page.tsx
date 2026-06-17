// cap: comunify-shell-organism
/**
 * Shell root page — Server Component redirect to DEFAULT_LANDING.
 * T-shell — comunify shell root.
 *
 * Visiting /{tenantId} redirects server-side to DEFAULT_LANDING (nina/marca).
 * Edge-redirect in proxy.ts also handles bare-tenant route (defense-in-depth).
 *
 * No "use client" — redirect() is a Server Action.
 * Next.js 16: params is Promise → await before use.
 *
 * spec_anchor: navigation-tree.md v2 § DEFAULT_LANDING
 * gherkin_coverage: A1
 * downstream-regression-na: brand-local route; no cross-brand consumers.
 */

import { redirect } from "next/navigation";

import { DEFAULT_LANDING } from "@/lib/routing/shell-routes";

interface PageProps {
  params: Promise<{ tenantId: string }>;
}

/**
 *
 */
export default async function ShellRootPage({ params }: PageProps) {
  const { tenantId } = await params;
  redirect(`/${tenantId}/${DEFAULT_LANDING.agent}/${DEFAULT_LANDING.subtab}`);
}
