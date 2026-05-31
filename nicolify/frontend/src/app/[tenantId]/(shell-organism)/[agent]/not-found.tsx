// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-6
/**
 * NotFoundAgent — 404 del segmento [agent] (Server Component).
 * nicolify-r0-shell T-6 — port from vitalia, re-themed to Nicolify copy.
 *
 * Renderiza cuando el [agent] slug en la URL no es válido.
 * Ejemplo: /{tenantId}/zzz/pipeline → isValidAgent("zzz") = false → notFound()
 * → Next.js renderiza este archivo.
 *
 * Shell chrome (TopBar + Ribbon + LuanaSidebar) permanece intacto via layout.tsx.
 * Este not-found.tsx provee el contenido del panel principal (#main-content).
 * Ribbon NO marca ningún tab activo (agente inválido).
 *
 * Server Component puro — sin hooks, sin "use client".
 * Spanish neutro LatAm, tuteo (sin voseo).
 *
 * spec_anchor: 01-spec.md § A2 ("Ese agente no existe" · shell chrome intacto · Ribbon sin tab activa)
 * gherkin_coverage: A2
 * downstream-regression-na: brand-local route; no cross-brand consumers.
 */

import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 *
 */
export default function NotFoundAgent() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-6 p-8 py-16 text-center"
      data-testid="not-found-agent"
      role="status"
    >
      {/* Ícono — aria-hidden (decorativo) */}
      <span aria-hidden="true" className="text-5xl opacity-50">
        🤖
      </span>

      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Ese agente no existe
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          El agente que buscas no está disponible en esta cuenta. Selecciona uno del menú.
        </p>
      </div>

      <Button asChild>
        <Link href="/">Volver al inicio</Link>
      </Button>
    </div>
  );
}
