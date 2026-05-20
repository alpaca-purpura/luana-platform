import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { FidelizacionLayout } from "@/features/fidelizacion";

export const metadata: Metadata = {
  title: "Seguimiento y fidelización — Vitalia",
  description: "Gestiona el seguimiento activo de tus pacientes y las acciones de reactivación.",
};

/**
 * Fidelización page — server component shell.
 *
 * Server Component: auth() verificado server-side, no client overhead.
 * Client boundary: FidelizacionLayout ("use client") handles all
 * interactivity (tabs, modals, React Query hooks).
 *
 * HIPAA-lite: RequireRole wraps PHI inside FidelizacionLayout.
 * Access denied shown for non-medical roles (doctor/nurse/admin_clinic).
 *
 * T-11: Feature scaffold — layout + KPIs hero + 5 tabs + 11 components.
 *
 * downstream-regression-na: brand-local FE page; no cross-brand consumers
 */
export default async function FidelizacionPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return <FidelizacionLayout />;
}
