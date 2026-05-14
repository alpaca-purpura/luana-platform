import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vitalia — Plataforma de salud",
  description: "Vitalia — Gestión clínica integral para profesionales de salud en Latinoamérica",
};

/**
 * Root layout — Vitalia health vertical.
 *
 * Providers (ClerkProvider + QueryClientProvider + Toaster) se conectan en T-fe-2
 * una vez que @clerk/nextjs + @tanstack/react-query estén en package.json.
 * Este scaffold satisface A1 (rutas montables + tsc estricto) para T-fe-1.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-white font-sans antialiased">
        {/* TODO T-fe-2: envolver con ClerkProvider + QueryClientProvider + Toaster */}
        {children}
      </body>
    </html>
  );
}
