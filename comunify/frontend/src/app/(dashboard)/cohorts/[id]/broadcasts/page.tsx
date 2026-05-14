import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comunicaciones de cohorte — Comunify",
};

interface CohortBroadcastsPageProps {
  params: Promise<{ id: string }>;
}

export default async function CohortBroadcastsPage({ params }: CohortBroadcastsPageProps) {
  const { id } = await params;
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Comunicaciones</h1>
      <p className="mt-2 text-sm text-gray-500">Cohorte: {id}</p>
    </div>
  );
}
