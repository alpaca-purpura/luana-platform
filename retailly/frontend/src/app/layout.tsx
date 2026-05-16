// retailly/frontend/src/app/layout.tsx
// Placeholder layout — bootstrap brand topology
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
