import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lista de participantes — Comunify",
};

interface CohortRosterPageProps {
  params: Promise<{ id: string }>;
}

export default async function CohortRosterPage({ params }: CohortRosterPageProps) {
  const { id } = await params;
  return (
    <div>
      <h1 className="text-2xl font-bold text-comunify-text">Participantes</h1>
      <p className="mt-2 text-sm text-comunify-text-muted">Cohorte: {id}</p>
    </div>
  );
}
