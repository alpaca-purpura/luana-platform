/**
 * Root page — Nicolify (Server Component shell).
 *
 * Entry point autenticado del tenant.
 * Clerk proxy protege esta ruta: usuario sin sesión es redirigido a /sign-in.
 *
 * Estructura: Server Component shell (no "use client") + Client island para
 * data fetching y manejo de errores BE.
 *
 * Scenario 7 (fe-network-failure): si BE devuelve 500, el Client island muestra
 * mensaje español neutro TUTEO sin white-screen ni error boundary blanco.
 *
 * T-3 (nicolify-r0-dev-stack): root placeholder autenticado.
 * Evolucionará a shell completo en stories de agentes posteriores.
 */

import { HomeClient } from "./page-client";

/**
 * Home page — Server Component shell mounting HomeClient island.
 */
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <HomeClient />
    </main>
  );
}
