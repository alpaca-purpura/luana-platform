// cap: shell-organism.shell-nicolify
// story-origin: platform-lift-shell-chrome-ui-kit T-N1
/**
 * Shell Organism Route Group Layout — Server Component.
 * platform-lift-shell-chrome-ui-kit T-N1 — re-wired to @luana/ui-kit ShellLayout.
 *
 * Architecture Decisions D1 (03-arch.md):
 *   Tenant resolution SKELETON — valida sesión Clerk (auth() → userId).
 *   Sin sesión → redirect /sign-in.
 *   La validación cross-tenant completa (fetchUserTenants + audit IAM) se difiere
 *   a cuando el IAM nicolify esté cableado. R0 usa tenantId de la URL directamente.
 *   TODO: wire fetchUserTenants when IAM routes are available (R1+).
 *
 * Route group (shell-organism) no aparece en la URL.
 * No "use client" — Server Component obligatorio para auth() + redirect().
 * No metadata export — las páginas hijas son dueñas de su metadata.
 *
 * T-N1: ShellOrganismLayout (legacy chrome) replaced with ShellLayoutWire
 * (thin client bridge → @luana/ui-kit ShellLayout).
 *
 * spec_anchor: 03-arch.md § Architecture Decisions D1 + 06-tickets.yaml T-N1
 * gherkin_coverage: A1 A2 A3
 * downstream-regression-na: brand-local route; no cross-brand consumers.
 */

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { ShellLayoutWire } from "./_components/ShellLayoutWire";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ tenantId: string }>;
}

/**
 * Shell organism route group layout.
 * Validates Clerk session then renders ShellLayoutWire (kit chrome).
 */
export default async function ShellOrganismGroupLayout({ children, params }: LayoutProps) {
  // params is awaited for Next 16 async params compliance
  void params;

  // SC-01: sin sesión Clerk → redirect a /sign-in
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  // D1: Skeleton tenant resolution — use tenantId from URL directly.
  // Full IAM validation (fetchUserTenants + cross-tenant audit + redirect) is
  // deferred to R1+ when nicolify IAM routes exist.
  // The Clerk middleware in proxy.ts already protects [tenantId]/** routes.

  // Happy path: tenant valid per middleware → render kit shell
  return <ShellLayoutWire>{children}</ShellLayoutWire>;
}
