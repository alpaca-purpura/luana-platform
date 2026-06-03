// cap: adrian.inbox
// story-origin: vitalia-fase2-adrian-inbox
/**
 * ChannelBadge — reusable channel identifier badge.
 * T-3 vitalia-fase2-adrian-inbox
 *
 * Displays a compact visual badge for each communication channel
 * (WhatsApp, Instagram, Email, Web/generic). Reusable across features.
 *
 * Design rules:
 * - Uses CSS tokens only (NO hardcoded hex) — test_no_hardcoded_colors enforces.
 * - Uses lucide-react icons for channel glyphs.
 * - Server Component by default (no state, no effects).
 *
 * Lift candidate: brand-local for now. If ≥2 brands need it → lift to
 * @luana/ui-kit via /pm-luana promotion gate (anti-duplication.md).
 *
 * spec_anchor: 03-arch-fe.md § 8 + 06-tickets.yaml T-3
 * downstream-regression-na: brand-local component; no cross-brand consumers
 */

import { MessageCircle, Camera, Mail, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Channel types ───────────────────────────────────────────────────────────────

export type ChannelSlug =
  | "whatsapp"
  | "instagram"
  | "email"
  | "web"
  | "telegram"
  | string;

// ── Helpers ─────────────────────────────────────────────────────────────────────

/** Returns Tailwind color classes for each channel (CSS token-based, no hardcoded hex). */
function channelColorClass(channel: ChannelSlug): string {
  switch (channel) {
    case "whatsapp":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
    case "instagram":
      return "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300";
    case "email":
      return "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300";
    case "telegram":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    case "web":
    default:
      return "bg-muted text-muted-foreground";
  }
}

/** Returns the lucide icon for a channel. */
function ChannelIcon({
  channel,
  size,
}: {
  channel: ChannelSlug;
  size: number;
}) {
  const props = { size, "aria-hidden": true as const, focusable: false };
  switch (channel) {
    case "whatsapp":
      return <MessageCircle {...props} />;
    case "instagram":
      return <Camera {...props} />;
    case "email":
      return <Mail {...props} />;
    default:
      return <Globe {...props} />;
  }
}

/** Maps channel slug to short Spanish neutro label. */
function channelLabel(channel: ChannelSlug): string {
  switch (channel) {
    case "whatsapp":
      return "WhatsApp";
    case "instagram":
      return "Instagram";
    case "email":
      return "Correo";
    case "telegram":
      return "Telegram";
    case "web":
      return "Web";
    default:
      // Capitalise unknown slug gracefully
      return channel.charAt(0).toUpperCase() + channel.slice(1);
  }
}

// ── Component Props ──────────────────────────────────────────────────────────────

export interface ChannelBadgeProps {
  /** Channel slug — e.g. "whatsapp", "instagram", "email", "web". */
  channel: ChannelSlug;
  /** When true, renders icon only (no text label). Defaults to false. */
  iconOnly?: boolean;
  /** Optional extra Tailwind classes injected on the outer span. */
  className?: string;
}

// ── ChannelBadge ─────────────────────────────────────────────────────────────────

/**
 * ChannelBadge — compact badge identifying a communication channel.
 *
 * Usage:
 *   <ChannelBadge channel="whatsapp" />
 *   <ChannelBadge channel="instagram" iconOnly />
 *
 * Accessible: icon has aria-hidden; label is visible text (or sr-only when iconOnly).
 */
export function ChannelBadge({
  channel,
  iconOnly = false,
  className,
}: ChannelBadgeProps) {
  const label = channelLabel(channel);

  return (
    <span
      data-testid={`channel-badge-${channel}`}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        channelColorClass(channel),
        className,
      )}
    >
      <ChannelIcon channel={channel} size={12} />
      {iconOnly ? (
        <span className="sr-only">{label}</span>
      ) : (
        <span>{label}</span>
      )}
    </span>
  );
}
