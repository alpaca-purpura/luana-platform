/**
 * DashboardData — camelCase mirror of IAMUserResponse (Pydantic DTO).
 * Source: /api/v1/iam/me
 *
 * Per 03-arch-brief.md § 1.3 — T-3 types contract.
 */

export interface DashboardUserData {
  /** Clerk user ID */
  userId: string;
  /** First name (from Clerk profile or backend) */
  firstName: string;
  /** Last name (from Clerk profile or backend) */
  lastName: string;
  /** Email */
  email: string;
  /** RBAC role in this clinic */
  role: "doctor" | "nurse" | "admin_clinic" | "patient" | "marketing" | "sales" | "superadmin";
  /** Whether the tenant has completed onboarding wizard */
  isOnboarded: boolean;
  /** Clinic name for the current tenant */
  clinicName: string;
  /** Subscription plan tier */
  planTier: "starter" | "professional" | "enterprise" | "trial";
  /** Tenant ID (Clerk org ID) */
  tenantId: string;
  /** Clinic ID (vitalia HIPAA-lite dual filter) */
  clinicId: string;
}

/**
 * Props for DashboardWelcome Server Component.
 */
export interface DashboardWelcomeProps {
  userId: string;
}
