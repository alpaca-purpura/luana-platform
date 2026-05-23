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
 * Playwright specs (e2e/regression/vitalia-fase1-shell-layout-5050/*.spec.ts)
 * usan POM `ShellLayoutPage.gotoShell()` que navega aquí.
 *
 * HIPAA-lite: no-phi-scope — UI shell fixture, zero PHI.
 * downstream-regression-na: brand-local E2E fixture; no cross-brand consumers
 */

import { ShellOrganismLayout } from "@/components/shared/shell-organism/ShellOrganismLayout";

const FIXTURE_TENANT_ID = "test-tenant-shell-layout";

export default function ShellLayoutShowcasePage() {
  return (
    <ShellOrganismLayout tenantId={FIXTURE_TENANT_ID}>
      {/* AppPanelSlot children — placeholder vacío. F1-S7/S8/S10 lo llenan */}
      <div
        data-testid="app-panel-slot-children"
        className="flex h-full items-center justify-center text-sm text-muted-foreground"
      >
        Contenido AppPanel (F1-S7 / S8 / S10 lo construirá)
      </div>
    </ShellOrganismLayout>
  );
}
