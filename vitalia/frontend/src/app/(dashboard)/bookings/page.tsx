import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reservas — Vitalia",
};

/**
 * Calendario de administración de reservas.
 * Server Component — contenido real en T-fe-3.
 * D9: chrome UI Spanish neutro tuteo.
 */
export default function BookingsPage() {
  return (
    <section aria-label="Administración de reservas">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">
        Reservas
      </h1>
      {/* TODO T-fe-3: renderizar <BookingsAdminCalendar /> con calendar-view */}
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
        Calendario de reservas (pendiente T-fe-3)
      </div>
    </section>
  );
}
