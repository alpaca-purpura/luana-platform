// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-sitemap-completo T-1
/**
 * NotFoundSubSubtab — 404 del segmento [subsubtab] (Server Component).
 * nicolify-r0-sitemap-completo T-1 — NEW (cloned from [subtab]/not-found.tsx, re-themed N3).
 *
 * Renderiza cuando el [subsubtab] no es válido para el agente+subtab dados.
 * Ejemplo: /{tenantId}/abel/oferta/zzz → isValidSubSubTab("abel","oferta","zzz") = false → notFound()
 * → Next.js renderiza este archivo.
 *
 * Shell chrome (TopBar + Ribbon + LuanaSidebar) permanece intacto via layout.tsx.
 * Ribbon marca el agente activo + SubTabsBar + SubSubTabsBar siguen visibles.
 *
 * Server Component puro — sin hooks, sin "use client".
 * Spanish neutro LatAm, tuteo (sin voseo).
 *
 * spec_anchor: 06-tickets.yaml T-1 · 03-arch-fe.md (N3 route + not-found)
 * gherkin_coverage: F-INVALID-GUARD
 * downstream-regression-na: brand-local route; no cross-brand consumers.
 */

import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Contextual 404 for an invalid N3 [subsubtab] segment — shell chrome stays intact.
 *
 * For the abel.icp entity path (/{tenantId}/abel/icp/{icpId}/...):
 *   Rendered when the ICP UUID does not exist or belongs to another tenant.
 *   The [subsubtab]/layout.tsx calls notFound() server-side after a 404 from the BE.
 *
 * For R0 nav-leaf subtabs that use [subsubtab]:
 *   Rendered when the sub-sub-section is not valid for the agent+subtab combination.
 *
 * Shell chrome (TopBar + Ribbon + LuanaSidebar) remains intact via layout.tsx hierarchy.
 * The message text covers both cases — "Este ICP no existe" (entity case) is the primary
 * trigger; "sub-sección no válida" (nav-leaf case) is a secondary fallback.
 */
export default function NotFoundSubSubtab() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-6 p-8 py-16 text-center"
      data-testid="not-found-subsubtab"
      role="status"
    >
      {/* Ícono — aria-hidden (decorativo) */}
      <span aria-hidden="true" className="text-5xl opacity-50">
        🗂️
      </span>

      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Este ICP no existe
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          El perfil que buscas no está disponible o no pertenece a tu cuenta. Elige un ICP de la
          lista.
        </p>
      </div>

      <Button asChild>
        <Link href="/">Volver al inicio</Link>
      </Button>
    </div>
  );
}
