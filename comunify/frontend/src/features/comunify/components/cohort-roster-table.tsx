"use client";

import { cn } from "@/lib/cn";
import type { CohortMember } from "../types/cohort.types";
import { formatEngagementBucket, engagementBucketColor } from "../utils/format-engagement-bucket";

interface CohortRosterTableProps {
  members: CohortMember[];
  isLoading?: boolean;
  className?: string;
}

export function CohortRosterTable({ members, isLoading, className }: CohortRosterTableProps) {
  if (isLoading) {
    return (
      <div className={cn("flex flex-col gap-2", className)} aria-busy="true" aria-label="Cargando lista de miembros">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className={cn("rounded-xl border bg-card py-12 text-center", className)}>
        <p className="text-sm text-muted-foreground">No hay miembros en este cohorte aún.</p>
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto rounded-xl border", className)}>
      <table className="w-full text-sm" aria-label="Lista de miembros del cohorte">
        <thead>
          <tr className="border-b bg-muted/50">
            <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">
              Nombre
            </th>
            <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">
              Contacto
            </th>
            <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">
              Engagement
            </th>
            <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">
              Nivel
            </th>
            <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">
              Ingresó
            </th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id} className="border-b last:border-b-0 hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">
                {member.subscriber_name}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {member.subscriber_email}
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    engagementBucketColor(member.engagement_bucket)
                  )}
                >
                  {formatEngagementBucket(member.engagement_bucket)}
                </span>
              </td>
              <td className="px-4 py-3 capitalize">{member.tier}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Intl.DateTimeFormat("es-419", { dateStyle: "short" }).format(
                  new Date(member.enrolled_at)
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
