import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Suscripción — Comunify",
};

interface SubscriptionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SubscriptionDetailPage({
  params,
}: SubscriptionDetailPageProps) {
  const { id } = await params;
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Suscripción</h1>
      <p className="mt-2 text-sm text-gray-500">ID: {id}</p>
    </div>
  );
}
