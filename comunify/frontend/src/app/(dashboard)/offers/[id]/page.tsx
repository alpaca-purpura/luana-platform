import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Detalle de oferta — Comunify",
};

interface OfferDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OfferDetailPage({ params }: OfferDetailPageProps) {
  const { id } = await params;
  return (
    <div>
      <h1 className="text-2xl font-bold text-comunify-text">Oferta</h1>
      <p className="mt-2 text-sm text-comunify-text-muted">ID: {id}</p>
    </div>
  );
}
