// cap: clinics.lisa.doctores
// story-origin: vitalia-fase2-lisa-doctores
/**
 * StaffCard.tsx — Doctor card for Staff directory grid.
 *
 * Shows: avatar + name + specialty badge + bio truncated + tiny stats + "Ver perfil" CTA.
 * Card grid (NOT table) — visual emphasis on personal-branding per spec.
 * Links to /[tenantId]/lisa/staff/[doctor-id]/perfil (real route, not JS navigation).
 *
 * Server Component — no state, no effects. Only receives props.
 * Reuses Shadcn Card, Badge, Avatar, Button from components/ui/.
 *
 * T-FE-1 vitalia-fase2-lisa-doctores
 * spec_anchor: 01-spec.md § Wireframes Directorio + § Componentes
 * downstream-regression-na: brand-local vitalia FE component; no cross-brand consumers
 */

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { DoctorListItem } from "../../types/staff.types";

interface StaffCardProps {
  doctor: DoctorListItem;
  tenantId: string;
}

/**
 * StaffCard — renders a doctor card in the directory grid.
 * data-testid="staff-card-{id}" for Playwright selectors.
 */
export function StaffCard({ doctor, tenantId }: StaffCardProps) {
  // F1 follow-through: null-guard firstName/lastName — BE may return null
  // (stats fields patientsCount/npsScore/avatarUrl are already null-guarded below with "—")
  const displayName = [doctor.firstName, doctor.lastName].filter(Boolean).join(" ") || "—";
  const profileHref = `/${tenantId}/lisa/staff/${doctor.id}/perfil`;

  return (
    <article
      className={cn(
        "rounded-xl border border-border bg-card p-4 flex flex-col gap-3",
        "hover:border-[color:var(--agent-lisa)] hover:shadow-sm transition-all",
        !doctor.active && "opacity-60",
      )}
      data-testid={`staff-card-${doctor.id}`}
      aria-label={`Perfil de ${displayName}`}
    >
      {/* Avatar + name */}
      <div className="flex items-start gap-3">
        <div className="relative h-14 w-14 shrink-0 rounded-full overflow-hidden bg-muted">
          {doctor.avatarUrl ? (
            <Image
              src={doctor.avatarUrl}
              alt={`Foto de ${displayName}`}
              fill
              className="object-cover"
              sizes="56px"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-2xl"
              aria-hidden="true"
            >
              👤
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">
            {displayName}
          </p>
          {doctor.specialty && (
            <Badge
              variant="secondary"
              className="mt-1 text-xs"
              data-testid={`specialty-badge-${doctor.id}`}
            >
              {doctor.specialty}
            </Badge>
          )}
          {!doctor.active && (
            <Badge variant="outline" className="mt-1 text-xs text-muted-foreground">
              Inactivo
            </Badge>
          )}
        </div>
      </div>

      {/* Tiny stats */}
      <dl className="grid grid-cols-3 gap-1 text-center">
        <div className="space-y-0.5">
          <dt className="text-[10px] text-muted-foreground">Años exp.</dt>
          <dd className="text-xs font-medium">
            {doctor.yearsExperience != null ? `${doctor.yearsExperience}a` : "—"}
          </dd>
        </div>
        <div className="space-y-0.5">
          <dt className="text-[10px] text-muted-foreground">Pacientes</dt>
          <dd className="text-xs font-medium">
            {doctor.patientsCount != null ? String(doctor.patientsCount) : "—"}
          </dd>
        </div>
        <div className="space-y-0.5">
          <dt className="text-[10px] text-muted-foreground">NPS</dt>
          <dd className="text-xs font-medium">
            {doctor.npsScore != null ? String(doctor.npsScore) : "—"}
          </dd>
        </div>
      </dl>

      {/* CTA */}
      <Button
        asChild
        variant="outline"
        size="sm"
        className="w-full mt-auto text-xs hover:border-[color:var(--agent-lisa)]"
      >
        <Link href={profileHref} aria-label={`Ver perfil de ${displayName}`}>
          Ver perfil
        </Link>
      </Button>
    </article>
  );
}
