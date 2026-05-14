import type { Metadata } from "next";

interface TreatmentFollowupPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(
  { params }: TreatmentFollowupPageProps
): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Seguimiento tratamiento ${id} — Vitalia`,
  };
}

/**
 * Registro de seguimiento de tratamiento — evolución y notas clínicas.
 * Server Component — contenido real en T-fe-3.
 * D9: chrome UI Spanish neutro tuteo.
 */
export default async function TreatmentFollowupPage({
  params,
}: TreatmentFollowupPageProps) {
  const { id } = await params;

  return (
    <section aria-label="Seguimiento de tratamiento">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">
        Seguimiento de tratamiento
      </h1>
      {/* TODO T-fe-3: renderizar <TreatmentFollowupForm treatmentId={id} /> */}
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
        Seguimiento tratamiento &quot;{id}&quot; (pendiente T-fe-3)
      </div>
    </section>
  );
}
