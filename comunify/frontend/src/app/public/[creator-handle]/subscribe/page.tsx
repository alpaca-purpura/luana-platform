import type { Metadata } from "next";

interface PublicSubscribePageProps {
  params: Promise<{ "creator-handle": string }>;
  searchParams: Promise<{ offer_id?: string }>;
}

export async function generateMetadata({ params }: PublicSubscribePageProps): Promise<Metadata> {
  const { "creator-handle": handle } = await params;
  return {
    title: `Suscribirse — ${handle} — Comunify`,
  };
}

export default async function PublicSubscribePage({
  params,
  searchParams,
}: PublicSubscribePageProps) {
  const { "creator-handle": handle } = await params;
  const { offer_id } = await searchParams;
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-md px-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Suscribirse a {handle}
        </h1>
        {offer_id && (
          <p className="mt-2 text-sm text-gray-500">Oferta: {offer_id}</p>
        )}
      </div>
    </main>
  );
}
