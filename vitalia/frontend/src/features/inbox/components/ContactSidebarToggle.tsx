"use client";

/**
 * ContactSidebarToggle.tsx — Button to toggle the contact sidebar (right panel).
 *
 * Reads/writes contactSidebarOpen from useInboxStore.
 * 👤 icon in ThreadHeader.
 * aria-expanded reflects current state.
 *
 * downstream-regression-na: brand-local FE component; no cross-brand consumers
 */

import { cn } from "@/lib/cn";
import { INBOX_COPY } from "../copy";

interface ContactSidebarToggleProps {
  /** Whether the contact sidebar is currently open */
  isOpen: boolean;
  /** Called when user toggles */
  onClick: () => void;
  className?: string;
}

/**
 * ContactSidebarToggle — icon button to show/hide the contact sidebar.
 */
export function ContactSidebarToggle({
  isOpen,
  onClick,
  className,
}: ContactSidebarToggleProps) {
  const label = isOpen
    ? INBOX_COPY.contactSidebar.toggleClose
    : INBOX_COPY.contactSidebar.toggleOpen;

  return (
    <button
      onClick={onClick}
      data-testid="contact-sidebar-toggle"
      aria-label={label}
      aria-expanded={isOpen}
      title={label}
      className={cn(
        "inline-flex items-center justify-center rounded-lg",
        "p-2 transition-colors",
        "focus-visible:outline focus-visible:outline-2",
        "focus-visible:outline-[var(--vitalia-cian)]",
        isOpen
          ? "vt-bg-primary/12 vt-text-primary"
          : "vt-text-foreground hover:vt-bg-muted",
        className,
      )}
    >
      {/* Contact icon — 👤 */}
      <span aria-hidden="true" className="text-sm leading-none">
        👤
      </span>
    </button>
  );
}
