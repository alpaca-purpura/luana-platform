// guestly/frontend/src/app/layout.tsx
// Placeholder — Guestly (Turismo + Hotelería vertical)
// bootstrap brand topology — 2026-05-15

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guestly",
  description: "Turismo + Hotelería — motor de reservas por temporada, sync OTAs (Airbnb/Booking), guest experience automatizado",
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
