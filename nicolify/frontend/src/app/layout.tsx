// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-1
/**
 * RootLayout — Nicolify app root layout.
 *
 * T-1 additions (nicolify-r0-shell tokens/theme):
 * - Google Fonts preconnect + preload (League Spartan + Bree Serif)
 * - suppressHydrationWarning en <html> (necesario cuando next-themes maneja data-theme)
 *   Anti-FOUC delegado al script propio de next-themes (igual que vitalia; sin script custom).
 *
 * Mounts Providers (ThemeProvider + ClerkProvider + QueryClientProvider).
 *
 * lang="es" per spanish-text.md (Spanish neutro LatAm, tuteo, sin voseo).
 */
import { Providers } from "./providers";

import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Nicolify — Equipo de Revenue & Operaciones",
  description: "Nicolify — Agentes IA para agencias y servicios profesionales B2B en Latinoamérica",
};

/**
 * Root layout — wraps app with Providers.
 *
 * Anti-FOUC: lo maneja el script propio de next-themes (ThemeProvider en providers.tsx,
 * attribute="data-theme" + defaultTheme="light"). NO se usa un script custom — igual que
 * vitalia. El script custom anterior agregaba `.dark` al <html> y, como next-themes solo
 * gestiona data-theme, la clase quedaba pegada → tema trabado en oscuro (bug ds-adoption).
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Google Fonts preconnect — DNS + TLS hints (fonts cargadas vía globals.css @import) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
