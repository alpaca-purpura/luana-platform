import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardWelcome } from "@/features/dashboard";

export const metadata: Metadata = {
  title: "Inicio — Vitalia",
};

/**
 * Dashboard home — welcome state con contexto de tenant.
 *
 * Server Component: auth() verificado server-side, no client overhead.
 * T-3: Implementación welcome state real (reemplaza placeholder T-fe-3).
 *
 * SC-06: usuario autenticado ve h1 "Hola, {first_name}" + badge clínica.
 * SC-07: CTA "Configurar tu clínica" visible si !is_onboarded.
 */
export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <section aria-label="Panel de inicio">
      <DashboardWelcome userId={userId} />
    </section>
  );
}
