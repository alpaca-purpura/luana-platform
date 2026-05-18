"use client";

/**
 * useCurrentUser — returns current authenticated user with role.
 *
 * Reads from Clerk user public metadata:
 *   - user.publicMetadata.role (PHI access role)
 *
 * Roles per hipaa-lite.md: doctor | nurse | admin_clinic | patient | marketing | sales
 */

import { useUser } from "@clerk/nextjs";

export type VitaliaRole =
  | "doctor"
  | "nurse"
  | "admin_clinic"
  | "patient"
  | "marketing"
  | "sales"
  | "superadmin";

export interface CurrentUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: VitaliaRole | null;
  /** Whether user has PHI access (doctor | nurse | admin_clinic) */
  hasPhiAccess: boolean;
  isLoaded: boolean;
}

const PHI_ROLES: ReadonlySet<string> = new Set(["doctor", "nurse", "admin_clinic"]);

/**
 * Returns current authenticated user with vitalia-specific role.
 */
export function useCurrentUser(): CurrentUser {
  const { user, isLoaded } = useUser();

  if (!isLoaded || !user) {
    return {
      id: "",
      firstName: null,
      lastName: null,
      email: null,
      role: null,
      hasPhiAccess: false,
      isLoaded,
    };
  }

  const meta = user.publicMetadata as Record<string, unknown>;
  const role =
    typeof meta.role === "string" ? (meta.role as VitaliaRole) : null;

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.primaryEmailAddress?.emailAddress ?? null,
    role,
    hasPhiAccess: role !== null && PHI_ROLES.has(role),
    isLoaded: true,
  };
}
