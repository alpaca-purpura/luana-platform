import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tratamientos — Vitalia",
};

/**
 * Lista de tratamientos activos con seguimiento de adherencia.
 * Server Component — contenido real en T-fe-3.
 * D9: chrome UI Spanish neutro tuteo.
 */
export default function TreatmentsPage() {
  return (
    <section aria-label="Lista de tratamientos">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">
        Tratamientos
      </h1>
      {/* TODO T-fe-3: tabla <TreatmentListTable /> con filtro por estado */}
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
        Lista de tratamientos (pendiente T-fe-3)
      </div>
    </section>
  );
}
