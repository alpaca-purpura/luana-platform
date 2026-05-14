import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paso 3 — Tu primera oferta — Vitalia",
};

/**
 * Paso 3 del wizard: lanzamiento de la primera oferta.
 * Server Component — delegará en <OnboardingStep3Client /> (T-fe-3).
 * D9: chrome UI Spanish neutro tuteo (Q1=B ratificado).
 */
export default function OnboardingStep3Page() {
  return (
    <section aria-label="Paso 3: Primera oferta">
      <h1 className="mb-2 text-2xl font-semibold text-gray-900">
        Crea tu primera oferta
      </h1>
      <p className="mb-8 text-sm text-gray-500">
        Define el servicio que ofreces para que los pacientes puedan reservar.
      </p>
      {/* TODO T-fe-3: renderizar <OnboardingStep3Client /> */}
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
        Wizard de primera oferta (pendiente T-fe-3)
      </div>
    </section>
  );
}
