import type { Metadata } from "next";

interface TreatmentDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(
  { params }: TreatmentDetailPageProps
): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Tratamiento ${id} — Vitalia`,
  };
}

/**
 * Detalle de tratamiento — protocolo, adherencia, próxima sesión.
 * Server Component — contenido real en T-fe-3.
 * D9: chrome UI Spanish neutro tuteo.
 */
export default async function TreatmentDetailPage({
  params,
}: TreatmentDetailPageProps) {
  const { id } = await params;

  return (
    <section aria-label="Detalle de tratamiento">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">
        Detalle de tratamiento
      </h1>
      {/* TODO T-fe-3: renderizar <TreatmentDetailCard treatmentId={id} /> */}
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
        Tratamiento &quot;{id}&quot; (pendiente T-fe-3)
      </div>
    </section>
  );
}
