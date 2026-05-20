"use client";

/**
 * AbsenceTab — absence re-engagement pattern list.
 *
 * downstream-regression-na: brand-local FE component; no cross-brand consumers
 */

import { FIDELIZACION_COPY } from "../../copy";
import { useReEngagementPatterns } from "../../api/use-re-engagement-patterns";
import { ReEngagementCard, type ReEngagementCardHandlers } from "../ReEngagementCard";
import type { FidelizacionPeriod, UrgencyFilter } from "../../types/url-state";
import type { UrgencyLevel } from "../../types/re-engagement";

interface AbsenceTabProps extends ReEngagementCardHandlers {
  period: FidelizacionPeriod;
  vertical?: string | null;
  doctorId?: string | null;
  urgency?: UrgencyFilter[];
}

export function AbsenceTab({
  period,
  vertical,
  doctorId,
  urgency,
  ...handlers
}: AbsenceTabProps) {
  const { data, isPending, isError } = useReEngagementPatterns({
    pattern: "absence",
    period,
    vertical,
    doctorId,
    urgency: urgency as UrgencyLevel[] | undefined,
  });

  if (isPending) {
    return (
      <div className="space-y-3 p-4" aria-busy="true">
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
        {FIDELIZACION_COPY.empty.absence}
      </div>
    );
  }

  return (
    <section
      id="panel-absence"
      role="tabpanel"
      aria-labelledby="tab-absence"
      className="space-y-3 p-4"
    >
      {rows.map((row) => (
        <ReEngagementCard key={row.reEngagementEventId} row={row} {...handlers} />
      ))}
    </section>
  );
}
