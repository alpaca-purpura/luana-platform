import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inicio — Vitalia",
};

/**
 * Dashboard home — resumen de métricas principales.
 * Contenido real en T-fe-3.
 * D9: chrome UI Spanish neutro tuteo.
 */
export default function DashboardPage() {
  return (
    <section aria-label="Resumen del panel">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">
        Panel de control
      </h1>
      {/* TODO T-fe-3: métricas, próximas citas, alertas */}
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
        Métricas del panel (pendiente T-fe-3)
      </div>
    </section>
  );
}
