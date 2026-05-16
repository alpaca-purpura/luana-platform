// fixia/frontend/src/app/layout.tsx
// Placeholder — Fixia (Servicios Hogar + Oficios vertical)
// bootstrap brand topology — 2026-05-15

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fixia",
  description: "Servicios Hogar + Oficios — técnicos en campo con cotización on-site mobile y reseñas locales SEO",
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
