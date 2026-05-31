// cap: clinics.lisa.doctores
// story-origin: vitalia-fase2-lisa-doctores
/**
 * horarios/page.tsx — Doctor horarios page (Server Component).
 *
 * Delegates interactivity to DoctorHorariosView ("use client").
 * Content is T-FE-3 scope — placeholder rendered here for T-FE-2.
 *
 * ADR-vitalia-004 § 3: Server-First default.
 *
 * T-FE-2 vitalia-fase2-lisa-doctores
 * spec_anchor: 03-arch-fe.md § Routing
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Horarios del integrante — Vitalia",
};

interface HorariosPageProps {
  params: Promise<{ tenantId: string; "doctor-id": string }>;
}

export default async function HorariosPage({ params: _params }: HorariosPageProps) {
  // T-FE-3 will replace this with DoctorHorariosView
  return (
    <div className="p-5 md:p-6">
      <div className="rounded-lg border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
        <p className="font-medium">Horarios — próximamente</p>
        <p className="mt-1">La gestión de disponibilidad está disponible en la siguiente actualización.</p>
      </div>
    </div>
  );
}
