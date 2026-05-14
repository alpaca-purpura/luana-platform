import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Estudio de marca — Comunify",
};

export default function BrandStudioPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Estudio de marca</h1>
      <p className="mt-2 text-sm text-gray-600">
        Configura tu identidad, posicionamiento y voz.
      </p>
    </div>
  );
}
