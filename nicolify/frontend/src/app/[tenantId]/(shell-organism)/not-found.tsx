// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-6
/**
 * NotFoundShellRoot — 404 raíz del route-group shell-organism (Server Component).
 * nicolify-r0-shell T-6 — port from vitalia not-found.tsx, re-themed.
 *
 * Renderiza cuando ninguna ruta del route-group coincide.
 * Shell chrome (TopBar + Ribbon + LuanaSidebar) permanece intacto via layout.tsx.
 * Este not-found.tsx provee el contenido del panel principal (#main-content).
 *
 * Server Component puro — sin hooks, sin "use client".
 * Spanish neutro LatAm, tuteo (sin voseo).
 *
 * spec_anchor: 01-spec.md § A2 (shell chrome intacto en 404)
 * gherkin_coverage: A2
 * downstream-regression-na: brand-local route; no cross-brand consumers.
 */

import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 *
 */
export default function NotFoundShellRoot() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-6 p-8 py-16 text-center"
      data-testid="not-found-shell-root"
      role="status"
    >
      {/* Ícono — aria-hidden (decorativo) */}
      <span aria-hidden="true" className="text-5xl opacity-50">
        🔍
      </span>

      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          No encontramos esta página
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          La ruta que buscas no existe. Vuelve a la vista principal para continuar.
        </p>
      </div>

      <Button asChild>
        <Link href="/">Volver al inicio</Link>
      </Button>
    </div>
  );
}
