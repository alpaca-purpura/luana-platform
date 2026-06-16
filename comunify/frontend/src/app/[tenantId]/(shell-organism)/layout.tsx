// cap: comunify-shell-organism
/**
 * Shell Organism Route Group Layout — Server Component.
 * T-shell — wire to @luana/ui-kit ShellLayout via ShellLayoutWire.
 *
 * Architecture Decision D1 (03-arch-fe.md):
 *   Tenant resolution SKELETON — validates Clerk session (auth() → userId).
 *   Sin sesión → redirect /sign-in.
 *   Full IAM validation deferred to R1+ when IAM routes exist.
 *   R0 uses tenantId from URL directly (proxy.ts already protects routes).
 *
 * Route group (shell-organism) does NOT appear in the URL.
 * No "use client" — Server Component obligatorio for auth() + redirect().
 * No metadata export — child pages own their metadata.
 *
 * spec_anchor: 03-arch-fe.md § Architecture Decisions D1
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
  // params awaited for Next 16 async params compliance
  void params;

  // SC-01: sin sesión Clerk → redirect a /sign-in
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  // D1: Skeleton tenant resolution — use tenantId from URL directly.
  // Full IAM validation (fetchUserTenants + cross-tenant audit + redirect) is
  // deferred to R1+ when comunify IAM routes exist.
  // The Clerk proxy in proxy.ts already protects [tenantId]/** routes.

  // Happy path: tenant valid per proxy → render kit shell
  return <ShellLayoutWire>{children}</ShellLayoutWire>;
}
