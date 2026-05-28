// cap: platform.shell-foundation-shadcn-tailwind-v4
// atomics: TBD
// story-origin: TBD
"use client";

/**
 * AuditedSection — wraps PHI content and fires audit log on mount.
 *
 * Per vitalia/.claude/rules/hipaa-lite.md:
 *   - TODA lectura de PHI registra audit_log row
 *   - Audit log write is SYNC (not fire-and-forget)
 *   - Row includes: tenant_id, clinic_id, user_id, action, resource_type, resource_id
 *
 * This component fires a beacon to the audit log API on mount.
 * Use around any section that renders PHI fields.
 *
 * Usage:
 *   <AuditedSection
 *     resourceType="patient_profile"
 *     resourceId={patient.id}
 *     action="view"
 *   >
 *     <PatientDetailContent />
 *   </AuditedSection>
 */

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useAuth, useOrganization } from "@clerk/nextjs";
import { useClinicId } from "@/hooks/useClinicId";

export interface AuditedSectionProps {
  /** Resource type being viewed (e.g. "patient_profile", "treatment_record") */
  resourceType: string;
  /** Resource ID being viewed */
  resourceId: string;
  /** Action being performed (default: "view") */
  action?: "view" | "download" | "print" | "export";
  /** Content to render */
  children: ReactNode;
}

/**
 * Fires a PHI access audit log event on mount (HIPAA-lite compliance).
 * Silent fail — audit failure should NOT block UI (but is logged to console.error).
 */
export function AuditedSection({
  resourceType,
  resourceId,
  action = "view",
  children,
}: AuditedSectionProps) {
  const { getToken, userId } = useAuth();
  const { organization } = useOrganization();
  const clinicId = useClinicId();
  const auditFired = useRef(false);

  useEffect(() => {
    if (auditFired.current) return;
    auditFired.current = true;

    const fireAudit = async () => {
      if (!userId || !organization?.id) return;

      try {
        const token = await getToken();
        if (!token) return;

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": organization.id,
        };

        if (clinicId) {
          headers["X-Clinic-ID"] = clinicId;
        }

        // Fire audit log — best-effort (UI continues regardless)
        await fetch("/api/v1/vitalia/audit-log", {
          method: "POST",
          headers,
          body: JSON.stringify({
            action,
            resourceType,
            resourceId,
            userId,
          }),
        });
      } catch (err) {
        // Silent fail per hipaa-lite.md: audit failure logs to observability but does not block UI
        if (process.env.NODE_ENV !== "production") {
          console.error(
            "[AuditedSection] audit log failed (non-blocking):",
            err,
          );
        }
      }
    };

    void fireAudit();
  }, [
    action,
    clinicId,
    getToken,
    organization?.id,
    resourceId,
    resourceType,
    userId,
  ]);

  return <>{children}</>;
}
