// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-1
/**
 * RootLayout — Nicolify app root layout.
 *
 * T-1 additions (nicolify-r0-shell tokens/theme):
 * - Google Fonts preconnect + preload (League Spartan + Bree Serif)
 * - SSR anti-FOUC inline script en <head> (lee "nicolify-theme" de localStorage
 *   y aplica class "dark" antes del primer render — evita flash of unstyled content)
 * - suppressHydrationWarning en <html> (necesario cuando next-themes maneja la clase)
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
 * SSR anti-FOUC script: lee "nicolify-theme" de localStorage en el cliente
 * ANTES del hydration y aplica la clase "dark" en <html> si corresponde.
 * Evita el parpadeo (flash of unstyled content) en modo oscuro.
 *
 * MUST be rendered as dangerouslySetInnerHTML (no JSX — evita escape de strings).
 * suppressHydrationWarning en <html> cubre la diferencia server/client del atributo data-theme.
 */
const themeScript = `
(function() {
  try {
    var theme = localStorage.getItem('nicolify-theme');
    var isDark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } catch (e) {}
})();
`;

/** Extracted to satisfy react-perf/jsx-no-new-object-as-prop — stable reference */
const themeScriptInnerHtml = { __html: themeScript } as const;

/**
 * Root layout — wraps app with anti-FOUC script + Providers.
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
        {/* SSR anti-FOUC: aplica dark class antes del primer render */}
        <script dangerouslySetInnerHTML={themeScriptInnerHtml} />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
