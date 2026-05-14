import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ofertas — Vitalia",
};

/**
 * Lista de ofertas publicadas (servicios médicos).
 * Contenido real en T-fe-3.
 * D9: chrome UI Spanish neutro tuteo.
 */
export default function OffersPage() {
  return (
    <section aria-label="Lista de ofertas">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">
          Ofertas
        </h1>
        <a
          href="/offers/new"
          className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
        >
          Nueva oferta
        </a>
      </div>
      {/* TODO T-fe-3: tabla de ofertas con DataTable de @luana/shared */}
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
        Lista de ofertas (pendiente T-fe-3)
      </div>
    </section>
  );
}
