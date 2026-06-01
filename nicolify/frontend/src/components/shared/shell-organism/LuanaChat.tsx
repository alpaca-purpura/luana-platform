// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-4
"use client";

/**
 * LuanaChat — organism root for Luana chat panel (Nicolify R0 skeleton).
 *
 * Port re-tematizado from vitalia/ValeriaChat.tsx.
 * Re-themed: Valeria→Luana, aria-label="Chat con Luana".
 *
 * Composes ChatHeader + ChatMessages + ChatComposer in a 3-row CSS Grid:
 *   grid-rows-[auto_1fr_auto]
 *
 * section[role="region"] per WAI-ARIA landmark spec for chat panels.
 *
 * Named export (no default) per FSD-Lite enforce.
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { ChatComposer } from "./ChatComposer";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";

/**
 *
 */
export function LuanaChat() {
  return (
    <section
      role="region"
      aria-label="Chat con Luana"
      data-testid="luana-chat"
      className="grid grid-rows-[auto_1fr_auto] overflow-hidden h-full bg-background"
    >
      <ChatHeader agent="luana" status="online" mode="agent" />
      <ChatMessages />
      <ChatComposer />
    </section>
  );
}
