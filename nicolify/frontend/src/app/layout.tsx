/**
 * RootLayout — Nicolify app root layout.
 *
 * Mounts ClerkProvider via Providers wrapper (foundational AD-1 exception —
 * this file is touched because ClerkProvider must wrap the entire app tree,
 * and layout.tsx is the entry point. AD-1 documents this as intentional:
 * "shell-feature-architecture NO aplica — esta es bootstrap auth, no sub-tab UI").
 *
 * NO shell, NO topbar — those are separate stories (nicolify-r0-topbar, etc).
 * NO design tokens — handled in nicolify-r0-design-system-tokens story.
 *
 * lang="es" per spanish-text.md (Spanish neutro LatAm, tuteo, sin voseo).
 *
 * T-3 (nicolify-r0-dev-stack): FE Clerk wiring bootstrap.
 */
import { Providers } from "./providers";

import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Nicolify — Equipo de Revenue & Operaciones",
  description: "Nicolify — Agentes IA para agencias y servicios profesionales B2B en Latinoamérica",
};

/**
 * Root layout — wraps app with Providers (ClerkProvider + QueryClientProvider).
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
