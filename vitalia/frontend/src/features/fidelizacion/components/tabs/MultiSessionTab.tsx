"use client";

/**
 * MultiSessionTab — multi-session re-engagement pattern list.
 *
 * downstream-regression-na: brand-local FE component; no cross-brand consumers
 */

import { FIDELIZACION_COPY } from "../../copy";
import { useReEngagementPatterns } from "../../api/use-re-engagement-patterns";
import { ReEngagementCard, type ReEngagementCardHandlers } from "../ReEngagementCard";
import type { FidelizacionPeriod, UrgencyFilter } from "../../types/url-state";

interface MultiSessionTabProps extends ReEngagementCardHandlers {
  period: FidelizacionPeriod;
  vertical?: string | null;
  doctorId?: string | null;
  urgency?: UrgencyFilter[];
}

export function MultiSessionTab({
  period,
  vertical,
  doctorId,
  urgency,
  ...handlers
}: MultiSessionTabProps) {
  const { data, isPending, isError } = useReEngagementPatterns({
    pattern: "multi_session",
    period,
    vertical,
    doctorId,
    urgency: urgency as import("../../types/re-engagement").UrgencyLevel[] | undefined,
  });

  if (isPending) {
    return (
      <div className="space-y-3 p-4" aria-busy="true" aria-label="Cargando...">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-md bg-[hsl(var(--vitalia-bg-soft,220_20%_96%))]" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div role="alert" className="p-4 text-sm text-[hsl(var(--vitalia-danger,0_75%_45%))]">
        {FIDELIZACION_COPY.errors.generic}
      </div>
    );
  }

  const rows = data?.rows ?? [];

  if (rows.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-[hsl(var(--vitalia-muted,220_10%_55%))]">
        {FIDELIZACION_COPY.empty.multisession}
      </div>
    );
  }

  return (
    <section
      id="panel-multisession"
      role="tabpanel"
      aria-labelledby="tab-multisession"
      className="space-y-3 p-4"
    >
      {rows.map((row) => (
        <ReEngagementCard key={row.reEngagementEventId} row={row} {...handlers} />
      ))}
    </section>
  );
}
