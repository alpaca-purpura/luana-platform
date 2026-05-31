// cap: clinics.lisa.doctores
// story-origin: vitalia-fase2-lisa-doctores
/**
 * LisaStaffView.tsx — Client root for Lisa/Staff sub-tab.
 *
 * Thin wrapper that receives SSR initial data as props and passes to StaffDirectoryView.
 * Per ADR-vitalia-004 § 3.3: "use client" here; page.tsx stays pure Server Component.
 *
 * T-FE-1 vitalia-fase2-lisa-doctores
 * spec_anchor: 03-arch-fe.md § FSD-Lite + ADR-vitalia-004 § 3.3
 * downstream-regression-na: brand-local vitalia FE component; no cross-brand consumers
 */

"use client";

import { StaffDirectoryView } from "./StaffDirectoryView";
import type { PaginatedDoctors } from "../../types/staff.types";

interface LisaStaffViewProps {
  initialData?: PaginatedDoctors;
}

/**
 * LisaStaffView — client root for lisa/staff directory.
 * Hydrates StaffDirectoryView with SSR initial data.
 */
export function LisaStaffView({ initialData }: LisaStaffViewProps) {
  return <StaffDirectoryView initialData={initialData} />;
}
