import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comunify — Plataforma para creadores de Latinoamérica",
  description:
    "Gestiona cohortes, comunidad y suscripciones. Automatiza ventas con IA.",
};

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-gray-900">
        Comunify
      </h1>
      <p className="mt-4 text-lg text-gray-600">
        Plataforma para creadores, coaches y educadores de Latinoamérica.
      </p>
    </main>
  );
}
