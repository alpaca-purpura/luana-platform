// cap: adrian.inbox
// story-origin: TBD
"use client";

/**
 * ContactSidebar.tsx — Inbox contact details panel (PHI-aware fork for vitalia).
 *
 * Adapter fork from shared ContactSidebar (components/shared/contact-sidebar/),
 * extended with:
 *   - PiiMaskedSpan on all PHI fields (name, phone, email, date_of_birth)
 *   - RequireRole gate for NPS history section (doctor/nurse/admin_clinic only)
 *   - AuditedSection wrapper on the entire contact section (HIPAA-lite audit log)
 *
 * Per 03-arch-fe.md § 7 + hipaa-lite.md:
 *   - marketing, sales, patient roles NEVER see NPS history
 *   - AuditedSection fires audit log row on mount (resourceType=patient_profile)
 *   - PiiMaskedSpan masks phone/email/name by default (requires click to reveal)
 *
 * "use client" required for:
 *   - useCurrentUser hook (reads Clerk user.publicMetadata.role)
 *   - AuditedSection (fires useEffect audit log)
 *   - Reveal toggle state (useState)
 *
 * downstream-regression-na: brand-local FE component; no cross-brand consumers
 */

import { cn } from "@/lib/cn";
import { PiiMaskedSpan } from "@/components/shared/phi/PiiMaskedSpan";
import { RequireRole } from "@/components/shared/phi/RequireRole";
import { AuditedSection } from "@/components/shared/phi/AuditedSection";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useTenantLocale } from "@/hooks/useTenantLocale";
import { formatTenantDate } from "@/lib/format/formatTenantDate";
import { INBOX_COPY } from "../../lib/copy";

/** NPS history entry shape */
export interface NpsEntry {
  /** Score 0–10 */
  score: number;
  /** ISO 8601 timestamp */
  recorded_at: string;
  /** Optional patient comment */
  comment?: string | null;
}

/** Contact info for the inbox sidebar */
export interface InboxContactInfo {
  /** Patient UUID hash (not PHI — safe to log) */
  patientId: string;
  /** Patient display name (PHI) */
  name?: string | null;
  /** Patient phone (PHI) */
  phone?: string | null;
  /** Patient email (PHI) */
  email?: string | null;
  /** Sales stage tag (non-PHI) */
  statusTag?: string | null;
  /** NPS history (role-gated — doctor/nurse/admin_clinic only) */
  npsHistory?: NpsEntry[] | null;
}

interface ContactSidebarProps {
  /** Conversation ID for audit log context */
  conversationId: string;
  /** Lead ID for linking */
  leadId: string;
  /** Contact information to display */
  contact: InboxContactInfo;
  /** Additional CSS classes */
  className?: string;
}

/** NPS score color badge — vt-* semantic tokens per globals.css */
function NpsScoreBadge({ score }: { score: number }) {
  const color =
    score >= 9
      ? "vt-text-success vt-bg-success-soft vt-border-success-30"
      : score >= 7
        ? "vt-text-warning vt-bg-warning-12 vt-border-warning-30"
        : "vt-text-danger vt-bg-danger-soft vt-border-danger-soft";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-8 h-8 rounded-full",
        "text-sm font-bold border",
        color,
      )}
      aria-label={`NPS ${score}`}
    >
      {score}
    </span>
  );
}

/**
 * Inbox ContactSidebar — PHI-aware patient contact panel.
 * Wraps PHI fields with PiiMaskedSpan and gates NPS history behind RequireRole.
 * AuditedSection fires audit log on mount (HIPAA-lite compliance).
 */
export function ContactSidebar({
  conversationId,
  leadId,
  contact,
  className,
}: ContactSidebarProps) {
  const { role } = useCurrentUser();
  const { timezone, locale } = useTenantLocale();

  return (
    <aside
      role="complementary"
      aria-label={INBOX_COPY.contactSidebar.ariaLabel}
      className={cn(
        "flex flex-col h-full overflow-y-auto vt-bg-surface border-l vt-border",
        className,
      )}
      data-testid="inbox-contact-sidebar"
    >
      {/* Contact section — wrapped in AuditedSection for HIPAA-lite audit log */}
      <AuditedSection
        resourceType="patient_profile"
        resourceId={contact.patientId}
        action="view"
      >
        <section
          className="px-4 pt-4 pb-3 border-b vt-border-soft"
          aria-labelledby={`contact-section-${conversationId}`}
        >
          <h3
            id={`contact-section-${conversationId}`}
            className="text-xs font-semibold vt-text-faint uppercase tracking-wide mb-3"
          >
            {INBOX_COPY.contactSidebar.sectionContact}
          </h3>

          <dl className="space-y-3">
            {/* Patient name (PHI — PiiMaskedSpan) */}
            {contact.name !== undefined && contact.name !== null && (
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs vt-text-faint">Nombre</dt>
                <dd>
                  <PiiMaskedSpan
                    value={contact.name}
                    fieldType="name"
                    className="text-sm vt-text-foreground"
                  />
                </dd>
              </div>
            )}

            {/* Phone (PHI — PiiMaskedSpan) */}
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs vt-text-faint">Teléfono</dt>
              <dd>
                {contact.phone ? (
                  <PiiMaskedSpan
                    value={contact.phone}
                    fieldType="phone"
                    className="text-sm vt-text-foreground"
                  />
                ) : (
                  <span className="text-sm vt-text-muted">
                    {INBOX_COPY.contactSidebar.noPhone}
                  </span>
                )}
              </dd>
            </div>

            {/* Email (PHI — PiiMaskedSpan) */}
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs vt-text-faint">Correo</dt>
              <dd>
                {contact.email ? (
                  <PiiMaskedSpan
                    value={contact.email}
                    fieldType="email"
                    className="text-sm vt-text-foreground"
                  />
                ) : (
                  <span className="text-sm vt-text-muted">
                    {INBOX_COPY.contactSidebar.noEmail}
                  </span>
                )}
              </dd>
            </div>

            {/* Status tag (non-PHI) */}
            {contact.statusTag && (
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs vt-text-faint">Estado</dt>
                <dd>
                  <span
                    className={cn(
                      "inline-flex px-2 py-0.5 text-xs font-medium rounded-[var(--radius-pill)]",
                      "vt-bg-muted vt-text-muted vt-border border",
                    )}
                  >
                    {contact.statusTag}
                  </span>
                </dd>
              </div>
            )}
          </dl>
        </section>
      </AuditedSection>

      {/* NPS History section — gated to doctor/nurse/admin_clinic */}
      <RequireRole roles={["doctor", "nurse", "admin_clinic"]} userRole={role}>
        <section
          className="px-4 pt-4 pb-3"
          aria-labelledby={`nps-section-${conversationId}`}
          data-testid="nps-history-section"
        >
          <h3
            id={`nps-section-${conversationId}`}
            className="text-xs font-semibold vt-text-faint uppercase tracking-wide mb-3"
          >
            {INBOX_COPY.contactSidebar.sectionNpsHistory}
          </h3>

          {!contact.npsHistory || contact.npsHistory.length === 0 ? (
            <p className="text-xs vt-text-muted">
              {INBOX_COPY.contactSidebar.npsEmpty}
            </p>
          ) : (
            <ul className="space-y-2">
              {contact.npsHistory.map((entry, idx) => (
                <li
                  key={`${entry.recorded_at}-${idx}`}
                  className="flex items-start gap-3"
                >
                  <NpsScoreBadge score={entry.score} />
                  <div className="flex flex-col gap-0.5 min-w-0">
                    {/* Per master-data.md: formatTenantDate (never toLocaleDateString) */}
                    <time
                      dateTime={entry.recorded_at}
                      className="text-xs vt-text-faint"
                    >
                      {formatTenantDate(entry.recorded_at, timezone, locale)}
                    </time>
                    {entry.comment && (
                      <p className="text-xs vt-text-muted truncate">
                        {entry.comment}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </RequireRole>

      {/* Stage section — placeholder for Slice 2 */}
      <section className="px-4 pt-3 pb-4 border-t vt-border-soft">
        <h3 className="text-xs font-semibold vt-text-faint uppercase tracking-wide mb-2">
          {INBOX_COPY.contactSidebar.sectionStage}
        </h3>
        <p className="text-xs vt-text-muted" aria-label={`Lead ID: ${leadId}`}>
          {contact.statusTag ?? "—"}
        </p>
      </section>
    </aside>
  );
}
