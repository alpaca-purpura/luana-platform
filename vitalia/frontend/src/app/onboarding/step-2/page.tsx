import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paso 2 — Elige tu plan — Vitalia",
};

/**
 * Paso 2 del wizard: selección de plan.
 * Server Component — delegará en <OnboardingStep2Client /> (T-fe-3).
 * D9: chrome UI Spanish neutro tuteo (Q1=B ratificado).
 */
export default function OnboardingStep2Page() {
  return (
    <section aria-label="Paso 2: Selección de plan">
      <h1 className="mb-2 text-2xl font-semibold text-gray-900">
        Elige el plan para tu clínica
      </h1>
      <p className="mb-8 text-sm text-gray-500">
        Puedes cambiar de plan en cualquier momento desde configuración.
      </p>
      {/* TODO T-fe-3: renderizar <OnboardingStep2Client /> */}
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
        Selector de plan (pendiente T-fe-3)
      </div>
    </section>
  );
}
