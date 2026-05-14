import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pacientes — Vitalia",
};

/**
 * Lista de pacientes registrados en la clínica.
 * Server Component — contenido real en T-fe-3.
 * D9: chrome UI Spanish neutro tuteo.
 */
export default function PatientsPage() {
  return (
    <section aria-label="Lista de pacientes">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">
        Pacientes
      </h1>
      {/* TODO T-fe-3: renderizar <PatientListTable /> con búsqueda y filtros */}
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
        Lista de pacientes (pendiente T-fe-3)
      </div>
    </section>
  );
}
