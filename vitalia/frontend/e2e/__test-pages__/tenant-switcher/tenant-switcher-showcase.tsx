/**
 * TenantSwitcher showcase — test page fixture
 * F1-S3 vitalia-fase1-tenant-switcher — T-FIX-1
 *
 * Renders TopBarGlobal isolated in full-width layout for visual testing.
 * TopBarGlobal already mounts TenantSwitcher internally (F1-S3 T-8).
 * Used by Playwright visual and functional specs targeting TenantSwitcher.
 *
 * This fixture is imported by the Next.js test-stack route wrapper at:
 *   src/app/test-stack/tenant-switcher/page.tsx
 *
 * Accessible via dev server: /test-stack/tenant-switcher
 * NOT protected by Clerk auth (public dev-only, no PHI).
 *
 * HIPAA-lite: no-phi-scope — test fixture, zero PHI.
 * downstream-regression-na: brand-local E2E fixture; no cross-brand consumers
 */

import { TopBarGlobal } from "@/components/shared/shell-organism/TopBarGlobal";

export default function TenantSwitcherShowcasePage() {
  return (
    <div className="min-h-screen bg-background" data-testid="tenant-switcher-showcase">
      <TopBarGlobal />
      {/* Main content anchor for skip link target (WCAG 2.4.1) */}
      <main id="main-content" tabIndex={-1} className="p-6">
        <h1 className="text-lg font-semibold text-foreground">
          Vitalia — TenantSwitcher (F1-S3 baseline)
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Página de prueba para TenantSwitcher. Accede al componente en la
          barra de navegación superior.
        </p>
      </main>
    </div>
  );
}
