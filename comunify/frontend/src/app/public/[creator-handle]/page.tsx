import type { Metadata } from "next";

interface PublicCreatorPageProps {
  params: Promise<{ "creator-handle": string }>;
}

export async function generateMetadata({ params }: PublicCreatorPageProps): Promise<Metadata> {
  const { "creator-handle": handle } = await params;
  return {
    title: `${handle} — Comunify`,
    description: `Explora las ofertas y comunidad de ${handle}.`,
  };
}

export default async function PublicCreatorPage({ params }: PublicCreatorPageProps) {
  const { "creator-handle": handle } = await params;
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900">@{handle}</h1>
        <p className="mt-4 text-gray-600">Cargando perfil del creador...</p>
      </div>
    </main>
  );
}
