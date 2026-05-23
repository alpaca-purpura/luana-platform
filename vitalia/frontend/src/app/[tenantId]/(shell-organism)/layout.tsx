/**
 * Shell Organism Route Group Layout — Server Component.
 * F1-S4 vitalia-fase1-shell-layout-5050 — T-4
 *
 * 03-arch.md § 2.1 — verbatim spec.
 *
 * Receives [tenantId] dynamic param (Next.js 16 — params is Promise).
 * Awaits params, forwards tenantId to ShellOrganismLayout (Client Component).
 *
 * No "use client" — this is a pure Server Component.
 * No metadata export — intentional (child pages own their metadata).
 *
 * Route group (shell-organism) does NOT appear in the URL path.
 *
 * HIPAA-lite: not applicable — chrome UI, no PHI.
 * downstream-regression-na: brand-local route; no cross-brand consumers.
 */

import { ShellOrganismLayout } from "@/components/shared/shell-organism/ShellOrganismLayout";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ tenantId: string }>;
}

export default async function Layout({ children, params }: LayoutProps) {
  const { tenantId } = await params;
  return (
    <ShellOrganismLayout tenantId={tenantId}>{children}</ShellOrganismLayout>
  );
}
