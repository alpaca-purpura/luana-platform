// fitflow/frontend/src/app/layout.tsx
// Placeholder — FitFlow (Fitness + Deporte vertical)
// bootstrap brand topology — 2026-05-15

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FitFlow",
  description: "Fitness + Deporte — facturación recurrente membresías, control aforo, calendario clases, waivers digitales",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
