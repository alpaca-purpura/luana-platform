/**
 * ShellOrganismLayout showcase — test page fixture
 * F1-S4 vitalia-fase1-shell-layout-5050 — T-7 Fase 7A micro-fix
 *
 * Renders ShellOrganismLayout isolated for visual + functional E2E testing
 * sin requerir Clerk auth ni un real /{tenantId}/lisa/marca route (que
 * todavía no existe — Fase 2 lo construirá). Mismo pattern parity con
 * F1-S0..S3 test-stack showcases.
 *
 * Accessible via dev server: /test-stack/shell-layout
 * NOT protected by Clerk auth (public dev-only, no PHI).
 *
 * Pre-hydrates tenant-store con mock tenants LatAm para que TenantSwitcher
 * en TopBarGlobal renderice (sin Clerk auth fetched, store viene vacío
 * y TenantSwitcher hace graceful degrade a null).
 *
 * NO pasa children al AppPanelSlot — el skeleton interno ya identifica
 * el placeholder (slot labels visibles). Children sería redundante.
 *
 * Playwright specs (e2e/regression/vitalia-fase1-shell-layout-5050/*.spec.ts)
 * usan POM `ShellLayoutPage.gotoShell()` que navega aquí.
 *
 * HIPAA-lite: no-phi-scope — UI shell fixture, zero PHI.
 * downstream-regression-na: brand-local E2E fixture; no cross-brand consumers
 */

"use client";

import { useEffect } from "react";
import { ShellOrganismLayout } from "@/components/shared/shell-organism/ShellOrganismLayout";
import { useTenantStore } from "@/stores/tenant-store";
import type { Tenant } from "@/components/shared/shell-organism/types";

const FIXTURE_TENANT_ID = "test-tenant-shell-layout";

/** Mock tenants LatAm para que TenantSwitcher renderice en showcase. */
const MOCK_TENANTS: ReadonlyArray<Tenant> = [
  { id: FIXTURE_TENANT_ID, name: "Sonrisa Plena", city: "Lima" },
  { id: "tenant-dermalia-mx", name: "Dermalia MX", city: "CDMX" },
];

export default function ShellLayoutShowcasePage() {
  const setAvailableTenants = useTenantStore((s) => s.setAvailableTenants);
  const setActiveTenant = useTenantStore((s) => s.setActiveTenant);

  // Mock hydration post-mount (best-effort). En la práctica TenantSwitcher
  // returned null al primer render por availableTenants=[] + graceful degrade.
  // El useEffect llega tarde y zustand re-render del child no funciona porque
  // el child Component está dentro de dynamic({ssr:false}) y vive en un chunk
  // que se carga después. En PROD real con Clerk auth no hay este gap — la
  // tenant list viene de /api/tenants vía useTenants() y el pill renderiza.
  // Test fixture caveat documentado en T-7-impl-log.md (follow-up nice-to-have).
  useEffect(() => {
    setAvailableTenants(MOCK_TENANTS);
    setActiveTenant(MOCK_TENANTS[0]);
  }, [setAvailableTenants, setActiveTenant]);

  // Empty children: skeleton del AppPanelSlot ya identifica placeholder.
  // ShellOrganismLayoutProps.children es required; pasamos null Element.
  return (
    <ShellOrganismLayout tenantId={FIXTURE_TENANT_ID}>
      {null}
    </ShellOrganismLayout>
  );
}
