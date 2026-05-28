// cap: shell-organism.shell-vitalia
// atomics: TBD
// story-origin: vitalia-fase1-s6-TBD
"use client";

/**
 * ValeriaChat — organism root for Valeria chat panel (T-5, F1-S6).
 *
 * Composes ChatHeader + ChatMessages + ChatComposer in a 3-row CSS Grid:
 *   grid-rows-[auto_1fr_auto]
 *   - Row 1 (auto): ChatHeader — fixed height, agent status + mode pill
 *   - Row 2 (1fr): ChatMessages — flex-1 overflow-y-auto, fills available space
 *   - Row 3 (auto): ChatComposer — fixed height, textarea + send button
 *
 * section[role="region"] per WAI-ARIA landmark spec for chat panels.
 * aria-label="Chat con Valeria" identifies the region to screen readers.
 *
 * spec_anchor: 01-spec.md § 1 SC-1/SC-2/SC-5/SC-6 + § 3 ValeriaChat + § 6 microcopy
 *              03-arch.md § 2.1 component tree + § 2.5 ValeriaChat organism
 * Named export (NO default) per FSD-Lite enforce.
 *
 * 'use client' REQUIRED: composes Client Components (ChatHeader, ChatMessages, ChatComposer).
 *
 * LIFT CANDIDATE: cross-brand chat organism shell. Second brand consumer triggers
 * /pm-luana promotion proposal for core/@luana/shell-chat-organism/.
 *
 * HIPAA-lite: not_applicable — shell chrome UI, no PHI, mock data only.
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatComposer } from "./ChatComposer";

// ─── ValeriaChat ───────────────────────────────────────────────────────────────

/**
 * ValeriaChat — 3-row CSS Grid chat organism.
 *
 * Layout contract:
 *   Parent MUST provide h-full (or explicit height) for 1fr row to expand.
 *   ValeriaSidebar (T-6) wraps this in h-full container — already satisfied.
 *
 * Static props: agent="valeria", status="online", mode="agent"
 * Rationale: T-5 scope is the chat skeleton, not dynamic agent switching.
 * Dynamic agent switching will be wired in a future story (F2+).
 */
export function ValeriaChat() {
  return (
    <section
      role="region"
      aria-label="Chat con Valeria"
      data-testid="valeria-chat"
      className="grid grid-rows-[auto_1fr_auto] overflow-hidden h-full bg-background"
    >
      <ChatHeader agent="valeria" status="online" mode="agent" />
      <ChatMessages />
      <ChatComposer />
    </section>
  );
}
