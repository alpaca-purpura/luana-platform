import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cumplimiento médico — Vitalia",
};

/**
 * Panel de cumplimiento médico — alertas de adherencia y protocolos.
 * Server Component — contenido real en T-fe-3.
 * D9: chrome UI Spanish neutro tuteo.
 */
export default function MedicalCompliancePage() {
  return (
    <section aria-label="Cumplimiento médico">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">
        Cumplimiento médico
      </h1>
      {/* TODO T-fe-3: renderizar <ComplianceDashboard /> con alertas y métricas */}
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
        Panel de cumplimiento médico (pendiente T-fe-3)
      </div>
    </section>
  );
}
