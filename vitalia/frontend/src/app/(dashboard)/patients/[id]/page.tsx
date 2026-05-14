import type { Metadata } from "next";

interface PatientDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(
  { params }: PatientDetailPageProps
): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Paciente ${id} — Vitalia`,
  };
}

/**
 * Detalle de paciente — historial clínico, tratamientos, reservas.
 * Server Component — contenido real en T-fe-3.
 * D9: chrome UI Spanish neutro tuteo.
 */
export default async function PatientDetailPage({
  params,
}: PatientDetailPageProps) {
  const { id } = await params;

  return (
    <section aria-label="Detalle de paciente">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">
        Detalle de paciente
      </h1>
      {/* TODO T-fe-3: renderizar <PatientDetailCard patientId={id} /> */}
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
        Paciente &quot;{id}&quot; (pendiente T-fe-3)
      </div>
    </section>
  );
}
