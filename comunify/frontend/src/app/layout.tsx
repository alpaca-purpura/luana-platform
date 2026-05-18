import type { Metadata } from "next";
import { Manrope, Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

// Path B: Plus Jakarta Sans Bold as Satoshi fallback
// (src/assets/fonts/Satoshi-Bold.woff2 does not exist — auto-resolved per D2 spec option c)
const satoshi = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-satoshi",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Comunify — Plataforma para creadores",
  description:
    "Comunify — Plataforma para creadores, coaches y educadores de Latinoamérica para gestionar cohortes, comunidad y suscripciones.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${satoshi.variable} ${manrope.variable} ${inter.variable}`}
    >
      <body className="min-h-screen bg-comunify-bg font-inter text-comunify-text antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
