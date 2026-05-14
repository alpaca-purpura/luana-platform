import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paso 1 — Perfil de la clínica — Vitalia",
};

/**
 * Paso 1 del wizard: perfil de la clínica.
 * Server Component — delegará en <OnboardingStep1Client /> (T-fe-3).
 * D9: chrome UI Spanish neutro tuteo (Q1=B ratificado).
 */
export default function OnboardingStep1Page() {
  return (
    <section aria-label="Paso 1: Perfil de la clínica">
      <h1 className="mb-2 text-2xl font-semibold text-gray-900">
        Cuéntanos sobre tu clínica
      </h1>
      <p className="mb-8 text-sm text-gray-500">
        Esta información aparecerá en tu página pública de reservas.
      </p>
      {/* TODO T-fe-3: renderizar <OnboardingStep1Client /> */}
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
        Formulario de perfil de clínica (pendiente T-fe-3)
      </div>
    </section>
  );
}
