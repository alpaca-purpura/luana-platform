import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nueva oferta — Vitalia",
};

/**
 * Wizard de creación de oferta — preset medical_services_v1.
 * Server Component — delegará en <OfferWizardClient /> (T-fe-3).
 * D9: chrome UI Spanish neutro tuteo.
 */
export default function NewOfferPage() {
  return (
    <section aria-label="Crear nueva oferta">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">
        Crear nueva oferta
      </h1>
      <p className="mb-4 text-sm text-gray-500">
        Define el servicio que ofreces en tu clínica.
      </p>
      {/* TODO T-fe-3: renderizar <OfferWizardClient /> con 5 pasos */}
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
        Wizard de oferta médica (pendiente T-fe-3)
      </div>
    </section>
  );
}
