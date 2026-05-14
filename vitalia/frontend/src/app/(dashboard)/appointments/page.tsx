import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Citas — Vitalia",
};

/**
 * Agenda de citas con vista de día/semana/mes.
 * Server Component — contenido real en T-fe-3.
 * D9: chrome UI Spanish neutro tuteo.
 */
export default function AppointmentsPage() {
  return (
    <section aria-label="Agenda de citas">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">
        Citas
      </h1>
      {/* TODO T-fe-3: renderizar <AppointmentsCalendar /> con vistas día/semana/mes */}
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
        Agenda de citas (pendiente T-fe-3)
      </div>
    </section>
  );
}
