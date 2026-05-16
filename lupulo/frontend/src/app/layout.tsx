// lupulo/frontend/src/app/layout.tsx
// Placeholder layout — S-DOCKER-DEV-MULTIBRAND T-4
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
