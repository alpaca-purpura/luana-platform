import type { Metadata } from "next";

interface OfferDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(
  { params }: OfferDetailPageProps
): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Oferta ${id} — Vitalia`,
  };
}

/**
 * Detalle de oferta — vista de configuración completa.
 * Server Component — contenido real en T-fe-3.
 * D9: chrome UI Spanish neutro tuteo.
 */
export default async function OfferDetailPage({
  params,
}: OfferDetailPageProps) {
  const { id } = await params;

  return (
    <section aria-label="Detalle de oferta">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">
        Detalle de oferta
      </h1>
      {/* TODO T-fe-3: renderizar detalle completo de oferta id={id} */}
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
        Detalle de oferta &quot;{id}&quot; (pendiente T-fe-3)
      </div>
    </section>
  );
}
