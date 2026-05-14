import type { Metadata } from "next";

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(
  { params }: BookingDetailPageProps
): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Reserva ${id} — Vitalia`,
  };
}

/**
 * Detalle de reserva — estado, paciente, profesional, pago, consentimiento.
 * Server Component — contenido real en T-fe-3.
 * D9: chrome UI Spanish neutro tuteo.
 */
export default async function BookingDetailPage({
  params,
}: BookingDetailPageProps) {
  const { id } = await params;

  return (
    <section aria-label="Detalle de reserva">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">
        Detalle de reserva
      </h1>
      {/* TODO T-fe-3: renderizar <BookingDetailCard bookingId={id} /> */}
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
        Detalle de reserva &quot;{id}&quot; (pendiente T-fe-3)
      </div>
    </section>
  );
}
