// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-6
/**
 * NotFoundSubtab — 404 del segmento [subtab] (Server Component).
 * nicolify-r0-shell T-6 — port from vitalia, re-themed to Nicolify copy.
 *
 * Renderiza cuando el [subtab] no es válido para el agente dado.
 * Ejemplo: /{tenantId}/abel/zzz → isValidSubtab("abel","zzz") = false → notFound()
 * → Next.js renderiza este archivo.
 *
 * Shell chrome (TopBar + Ribbon + LuanaSidebar) permanece intacto via layout.tsx.
 * Ribbon marca el agente activo (el [agent] segment sigue siendo válido).
 * SubTabsBar del agente permanece visible.
 *
 * Server Component puro — sin hooks, sin "use client".
 * Spanish neutro LatAm, tuteo (sin voseo).
 *
 * spec_anchor: 01-spec.md § A3 ("Esa sección no existe" · Ribbon marca agente · SubTabsBar visible)
 * gherkin_coverage: A3
 * downstream-regression-na: brand-local route; no cross-brand consumers.
 */

import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 *
 */
export default function NotFoundSubtab() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-6 p-8 py-16 text-center"
      data-testid="not-found-subtab"
      role="status"
    >
      {/* Ícono — aria-hidden (decorativo) */}
      <span aria-hidden="true" className="text-5xl opacity-50">
        📂
      </span>

      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Esa sección no existe para este agente
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          La vista que buscas no está disponible. Elige una sección del menú del agente.
        </p>
      </div>

      <Button asChild>
        <Link href="/">Volver al inicio</Link>
      </Button>
    </div>
  );
}
