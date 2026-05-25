/**
 * _agent-tw-classes.ts — internal Tailwind class name lookup for agent slugs.
 *
 * Vitalia shell-organism internal helper. Prefix `_` = module-private.
 *
 * CRITICAL: Tailwind v4 JIT purges dynamic class names (e.g. `bg-${agent}-soft`).
 * ALL class names MUST be statically knowable. Use explicit switch/map only.
 *
 * Consumed by: ChatHeader · TypingIndicator · DelegateMarker · MessageBubble
 *
 * spec_anchor: 03-arch.md § 2.4 "Tailwind classnames pattern" + § 2.5 sub-component contracts
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import type { AgentSlug } from "@/lib/agent-catalog";

/** Background class for agent (full saturation — avatar, user bubbles, accents). */
export function agentBgClass(slug: AgentSlug): string {
  switch (slug) {
    case "lisa":
      return "bg-agent-lisa";
    case "valeria":
      return "bg-agent-valeria";
    case "adrian":
      return "bg-agent-adrian";
    case "lucas":
      return "bg-agent-lucas";
    case "camila":
      return "bg-agent-camila";
    case "mateo":
      return "bg-agent-mateo";
    default:
      return "bg-agent-valeria";
  }
}

/** Soft background class for agent (desaturated — TypingIndicator bubble, DelegateMarker). */
export function agentBgSoftClass(slug: AgentSlug): string {
  switch (slug) {
    case "lisa":
      return "bg-agent-lisa-soft";
    case "valeria":
      return "bg-agent-valeria-soft";
    case "adrian":
      return "bg-agent-adrian-soft";
    case "lucas":
      return "bg-agent-lucas-soft";
    case "camila":
      return "bg-agent-camila-soft";
    case "mateo":
      return "bg-agent-mateo-soft";
    default:
      return "bg-agent-valeria-soft";
  }
}

/** Text color class for agent (for name labels inside TypingIndicator, DelegateMarker). */
export function agentTextClass(slug: AgentSlug): string {
  switch (slug) {
    case "lisa":
      return "text-agent-lisa";
    case "valeria":
      return "text-agent-valeria";
    case "adrian":
      return "text-agent-adrian";
    case "lucas":
      return "text-agent-lucas";
    case "camila":
      return "text-agent-camila";
    case "mateo":
      return "text-agent-mateo";
    default:
      return "text-agent-valeria";
  }
}

/** Dot/icon background for typing-dot dots (same as full bg). */
export const agentDotBgClass = agentBgClass;
