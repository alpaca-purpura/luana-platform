import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inicio — Comunify",
};

export default function DashboardHomePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-comunify-text">Inicio</h1>
      <p className="mt-2 text-sm text-comunify-text-muted">
        Bienvenido a tu panel de creador.
      </p>
    </div>
  );
}
