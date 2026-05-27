/**
 * ValeriaAgendaPage — Server Component.
 * T-12 vitalia-fase2-valeria-agenda · F2-S1
 *
 * Static route segment /valeria/agenda takes precedence over [agent]/[subtab]
 * per Next.js static-vs-dynamic routing rules (03-arch.md § 6.0).
 *
 * Responsibilities:
 *   1. Await params + searchParams (Next.js 16 App Router — Promise-based).
 *   2. Resolve view/date/presetFilter from URL (SSoT).
 *   3. Call getInitialAgendaState() for SSR hydration (graceful degradation).
 *   4. Pass initialData to ValeriaAgendaView (client root).
 *
 * No "use client" — Server Component.
 * Auth: shell-organism layout handles Clerk validation + tenant redirect.
 * HIPAA-lite: no PHI in metadata, no PHI in server logs.
 *
 * spec_anchor: 03-arch.md § 6.3 + 06-tickets.yaml T-12 (A1)
 * downstream-regression-na: brand-local route; no cross-brand consumers.
 */

import { type Metadata } from "next";
import {
  ValeriaAgendaView,
  getInitialAgendaState,
} from "@/features/valeria";
import type { AgendaView } from "@/features/valeria";

export const metadata: Metadata = {
  title: "Agenda — Valeria | Vitalia",
  description: "Gestión de citas y pagos de tu clínica",
};

interface PageProps {
  params: Promise<{ tenantId: string }>;
  searchParams: Promise<{
    view?: string;
    date?: string;
    preset_filter?: string;
  }>;
}

const VALID_VIEWS: AgendaView[] = ["dia", "semana", "mes"];

function resolveView(raw?: string): AgendaView {
  if (raw && (VALID_VIEWS as string[]).includes(raw)) {
    return raw as AgendaView;
  }
  return "semana";
}

export default async function ValeriaAgendaPage({
  params,
  searchParams,
}: PageProps) {
  const { tenantId } = await params;
  const sp = await searchParams;

  const view = resolveView(sp.view);
  const date = sp.date ?? new Date().toISOString().slice(0, 10);
  const presetFilter = sp.preset_filter ?? null;

  // SSR initial data — graceful degradation (returns empty grid on error)
  const initialData = await getInitialAgendaState({
    tenantId,
    view,
    date,
    presetFilter,
  });

  return (
    <ValeriaAgendaView
      initialData={initialData}
      initialView={view}
      initialDate={date}
      initialPresetFilter={presetFilter}
      tenantId={tenantId}
    />
  );
}
