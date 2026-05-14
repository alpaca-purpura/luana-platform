import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vitalia",
  description: "Vitalia — Health & Medical vertical on Luana Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
