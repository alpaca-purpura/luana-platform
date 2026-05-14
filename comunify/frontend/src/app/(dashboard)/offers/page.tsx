import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ofertas — Comunify",
};

export default function OffersListPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Mis ofertas</h1>
    </div>
  );
}
