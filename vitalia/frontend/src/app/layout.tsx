import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Vitalia — Plataforma de salud",
  description: "Vitalia — Gestión clínica integral para profesionales de salud en Latinoamérica",
};

/**
 * RootLayout — root layout for Vitalia app.
 *
 * F1-S2 (T-5): Added WCAG 2.4.1 skip link before Providers wrapper.
 * Skip link is sr-only at rest; visible on keyboard focus (focus:not-sr-only).
 * Target: #main-content — id is set on <main> in AppShell (components/shared/shell/AppShell.tsx).
 *
 * Spanish neutro: "Saltar al contenido" (no voseo).
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-white font-sans antialiased">
        {/* WCAG 2.4.1 Bypass Blocks — skip link (T-5) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-[200] focus:p-2 focus:bg-primary focus:text-primary-foreground"
        >
          Saltar al contenido
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
