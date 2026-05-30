// cap: sales_agent.inbox-handler-mode-occ
// story-origin: TBD
"use client";

/**
 * VoiceStyleChip.tsx — Read-only chip showing Adrián's current voice style.
 *
 * Consumes brand_personality state (from conversation/tenant config).
 * When voice is configured: shows style label (e.g. "Estilo: consultivo · sin presión").
 * When not configured: shows unconfigured state + CTA link to wizard P2.
 *
 * No click/mutation — purely informational + navigation link.
 * CSS vars only — no HEX literals.
 *
 * downstream-regression-na: brand-local FE component; no cross-brand consumers
 */

import Link from "next/link";
import { cn } from "@/lib/cn";
import { INBOX_COPY } from "../copy";

interface VoiceStyleChipProps {
  /** Whether a brand voice has been configured for this tenant */
  isConfigured?: boolean;
  /** Display label for the configured voice style (e.g. "consultivo · sin presión") */
  styleLabel?: string | null;
  /** Link to wizard P2 for voice configuration */
  configureHref?: string;
  className?: string;
}

/**
 * VoiceStyleChip — informational chip for Adrián's voice personality.
 * Read-only status indicator with optional CTA to configure.
 */
export function VoiceStyleChip({
  isConfigured = false,
  styleLabel,
  configureHref = "/brand-studio/estilo",
  className,
}: VoiceStyleChipProps) {
  const displayLabel = isConfigured
    ? (styleLabel ?? INBOX_COPY.voiceStyleChip.configured)
    : INBOX_COPY.voiceStyleChip.unconfigured;

  return (
    <div
      className={cn("flex items-center gap-2", className)}
      aria-label={INBOX_COPY.voiceStyleChip.ariaLabel}
      data-testid="voice-style-chip"
    >
      {/* Status dot */}
      <span
        aria-hidden="true"
        className={cn(
          "inline-block h-2 w-2 rounded-full shrink-0",
          isConfigured ? "bg-[var(--vitalia-cian)]" : "vt-bg-muted",
        )}
      />

      {/* Style label */}
      <span className="text-xs vt-text-muted whitespace-nowrap">
        {displayLabel}
      </span>

      {/* CTA link (always visible — configure or reconfigure) */}
      <Link
        href={configureHref}
        className={cn(
          "text-xs underline-offset-2 hover:underline",
          "text-[var(--vitalia-cian)] focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-[var(--vitalia-cian)]",
        )}
        data-testid="voice-style-chip-cta"
        aria-label={`${INBOX_COPY.voiceStyleChip.cta} — ${INBOX_COPY.voiceStyleChip.ariaLabel}`}
      >
        {INBOX_COPY.voiceStyleChip.cta}
      </Link>
    </div>
  );
}
