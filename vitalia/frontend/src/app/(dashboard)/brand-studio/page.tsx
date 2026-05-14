import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Studio de marca — Vitalia",
};

/**
 * Brand Studio — navegación de secciones (identidad/contacto/equipo/testimonios).
 * Contenido real en T-fe-3.
 * D9: chrome UI Spanish neutro tuteo.
 */
export default function BrandStudioPage() {
  return (
    <section aria-label="Studio de marca">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">
        Studio de marca
      </h1>
      <p className="mb-4 text-sm text-gray-500">
        Configura la identidad de tu clínica para que los pacientes te reconozcan.
      </p>
      {/* TODO T-fe-3: secciones de brand studio con nav lateral */}
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
        Secciones de marca (pendiente T-fe-3)
      </div>
    </section>
  );
}
