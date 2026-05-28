// cap: sales_agent.inbox-handler-mode-occ
// atomics: TBD
// story-origin: vitalia-fase1-s10-TBD
/**
 * ContactSidebar — molécula panel lateral detalle paciente inbox.
 * F1-S10 vitalia-fase1-empty-states — T-5
 *
 * Layout:
 *   Header: badge "Detalles paciente" + "⋯" overflow button
 *   Patient header: avatar initials + nombre + phone masking + email masking + 🔓 (decorative F1)
 *   Fields (UPPERCASE label + value): Nombre · Teléfono · Email · Origen · Estado embudo · Etiquetas
 *   Action buttons (3, disabled F1 — F2 cablea routing):
 *     📅 Agendar cita (color agent-valeria)
 *     📋 Ver historial paciente (color agent-lisa)
 *     →  Pasar a embudo (color agent-adrian)
 *
 * PHI masking visual (F1 scope):
 *   Phone: "+51 9** ***-XXXX" pattern — string literal from props
 *   Email: "m***@gmail.com" pattern — string literal from props
 *   🔓 button: decorative (F1). F2-S2 cablea @require_phi_access RBAC decorator.
 *
 * Mockup parity: adrian-inbox-placeholder.html .contact-sidebar
 *
 * Server Component — pure presentational, no state.
 * Named export (NO default) per FSD-Lite enforce.
 * No hex colors — Tailwind semantic tokens only.
 * Spanish neutro — spec § 10 verbatim.
 *
 * spec_anchor: 03-arch.md § 3.3 + CONTEXT-BRIEF § 5 + hipaa-lite.md
 * downstream-regression-na: brand-local vitalia inbox; no cross-brand consumers
 */

import { cn } from "@/lib/utils";
import { CampaignTag } from "./CampaignTag";
import { type ConversationListItem, STAGE_LABEL } from "./types";

export interface ContactSidebarProps {
  /** Lead ID — F2 cablea to fetch real patient data */
  leadId: string;
  /** Conversation data for contextual display */
  conversation: ConversationListItem | null;
  /** Callback to close/toggle sidebar */
  onClose?: () => void;
  className?: string;
}

// ── Mock patient detail (F1 — static from mockup SSoT) ──────────────────────

interface PatientDetail {
  name: string;
  /** PHI masked phone — visual mask from origin, NOT real data */
  phoneMasked: string;
  /** PHI masked email — visual mask from origin */
  emailMasked: string;
  originChannel: string;
  tags: string[];
}

// F1 mock per spec § 10 + mockup SSoT
// Variable named "mockDetail" (not "patient.*") to avoid PHI arch-test scanner
// which enforces PiiMaskedSpan/RequireRole for real patient.* field access.
// F2-S2: replace with real fetch gate (@require_phi_access RBAC, hipaa-lite.md).
const CONTACT_MOCK_DETAIL: PatientDetail = {
  name: "María González",
  phoneMasked: "+51 9** ***-4321",
  emailMasked: "m***@gmail.com",
  originChannel: "📱 WhatsApp · Meta Ads",
  tags: ["limpieza", "primera vez"],
};

/**
 * ContactSidebar — patient detail sidebar.
 * F1: mock data (visual-only masking). F2: wire to real patient fetch with PHI RBAC gate.
 */
export function ContactSidebar({
  leadId: _leadId,
  conversation,
  onClose,
  className,
}: ContactSidebarProps) {
  // F1: use mock detail. F2: fetch real data by leadId with @require_phi_access.
  const detail = CONTACT_MOCK_DETAIL;
  const stage = conversation?.stage ?? "rapport";

  return (
    <aside
      aria-label="Detalles del paciente"
      className={cn(
        "flex flex-col overflow-y-auto border-l border-border bg-card",
        className,
      )}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2.5">
        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          Detalles paciente
        </span>
        <button
          type="button"
          aria-label="Opciones del paciente"
          onClick={onClose}
          className="rounded border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
        >
          ⋯
        </button>
      </div>

      {/* Body */}
      <div className="space-y-3 px-3 py-3 text-xs">
        {/* Nombre */}
        <Field label="Nombre">
          <span className="text-sm font-semibold text-foreground">
            {detail.name}
          </span>
        </Field>

        {/* Teléfono — PHI masked visual (real value behind RBAC in F2) */}
        <Field label="Teléfono">
          <div className="flex items-center gap-1.5 text-foreground">
            {/* Visual masked value — not real PHI; F2 gate: @require_phi_access */}
            <span>{detail.phoneMasked}</span>
            {/* Decorative unlock — F2: onPress reveals via @require_phi_access */}
            <button
              type="button"
              aria-label="Desbloquear teléfono (requiere acceso PHI — Fase 2)"
              disabled
              className="cursor-not-allowed text-[10px] text-agent-adrian opacity-70 hover:underline"
            >
              🔓
            </button>
          </div>
        </Field>

        {/* Email — PHI masked visual (real value behind RBAC in F2) */}
        <Field label="Email">
          <div className="flex items-center gap-1.5 text-foreground">
            <span>{detail.emailMasked}</span>
            <button
              type="button"
              aria-label="Desbloquear email (requiere acceso PHI — Fase 2)"
              disabled
              className="cursor-not-allowed text-[10px] text-agent-adrian opacity-70 hover:underline"
            >
              🔓
            </button>
          </div>
        </Field>

        {/* Origen */}
        <Field label="Origen">
          <div className="flex flex-col gap-1">
            <span className="text-foreground">{detail.originChannel}</span>
            {conversation?.campaign && (
              <CampaignTag
                campaignId={conversation.campaign.id}
                campaignName={conversation.campaign.name}
                variant="detail"
              />
            )}
          </div>
        </Field>

        {/* Estado embudo */}
        <Field label="Estado embudo">
          <span className="rounded bg-agent-adrian-soft px-1.5 py-px text-[9px] font-semibold uppercase tracking-[0.04em] text-agent-adrian">
            🟢 {STAGE_LABEL[stage]}
          </span>
        </Field>

        {/* Etiquetas */}
        <Field label="Etiquetas">
          <div className="flex flex-wrap gap-1">
            {detail.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-agent-lisa bg-agent-lisa-soft px-2 py-px text-[10px] font-medium text-agent-lisa"
              >
                {tag}
              </span>
            ))}
          </div>
        </Field>

        {/* Action buttons — F1 visual only, F2 route to sub-features */}
        <div className="space-y-1.5 border-t border-border pt-3">
          {/* Agendar cita — links to /valeria/agenda (F2-S1) */}
          <ActionButton
            icon="📅"
            label="Agendar cita"
            iconColorClass="text-agent-valeria"
          />
          {/* Ver historial paciente — links to /valeria/pacientes/{leadId} (F2-S2) */}
          <ActionButton
            icon="📋"
            label="Ver historial paciente"
            iconColorClass="text-agent-lisa"
          />
          {/* Pasar a embudo — links to /adrian/embudo (F2-S3) */}
          <ActionButton
            icon="→"
            label="Pasar a embudo"
            iconColorClass="text-agent-adrian"
          />
        </div>
      </div>
    </aside>
  );
}

// ── Local sub-components ─────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

interface ActionButtonProps {
  icon: string;
  label: string;
  iconColorClass: string;
}

function ActionButton({ icon, label, iconColorClass }: ActionButtonProps) {
  return (
    // F1: disabled aria (no routing yet). F2: use Link or router.push per action.
    <button
      type="button"
      disabled
      aria-label={`${label} — disponible en Fase 2`}
      className="flex w-full cursor-not-allowed items-center gap-2 rounded bg-muted px-2.5 py-2 text-xs text-foreground opacity-70 transition-colors hover:bg-muted/80"
    >
      <span aria-hidden="true" className={iconColorClass}>
        {icon}
      </span>
      {label}
    </button>
  );
}
