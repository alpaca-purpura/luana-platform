// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-1
/**
 * _agent-tw-classes.ts — internal Tailwind class name lookup for nicolify agent slugs.
 *
 * Nicolify shell-organism internal helper. Prefix `_` = module-private.
 *
 * CRITICAL (G3 gate): Tailwind v4 JIT purges dynamic class names (e.g. `bg-agent-${slug}`).
 * ALL class names MUST be statically knowable. Use explicit switch/map ONLY.
 * NUNCA template literals: `bg-agent-${slug}` → Tailwind JIT purge silently drops it.
 *
 * Reference: .claude/rules/nicolify/shell-feature-architecture.md § G3
 * Learning: vitalia/docs/learnings/2026-05-25-q16-tailwind-jit-template-purge.md
 *
 * Nicolify agents: abel (#A855F7) · brenda (#22C55E) · christian (#3B82F6)
 *                  sara (#F59E0B) · norvil (#EC4899) · config (#64748b) · luana (#635BFF)
 *
 * Consumed by: Ribbon · RibbonTab · SubTabsBar · SubTab · AgentAvatar
 *              LuanaSidebar · ChatHeader · TypingIndicator
 */

/** Agent slugs for Ribbon (5 Revenue/Ops agents + config) */
export type RibbonTabSlug = "abel" | "brenda" | "christian" | "sara" | "norvil" | "config";

/** All agent slugs including luana (orchestrator sidebar) */
export type AgentSlug = RibbonTabSlug | "luana";

// ─────────────────────────────────────────────────────────────────────────────
// Background class — full saturation (avatar, user bubbles, accents)
// ─────────────────────────────────────────────────────────────────────────────

/** Background class for agent (full saturation — avatar, user bubbles, accents). */
export function agentBgClass(slug: AgentSlug): string {
  switch (slug) {
    case "abel":
      return "bg-agent-abel";
    case "brenda":
      return "bg-agent-brenda";
    case "christian":
      return "bg-agent-christian";
    case "sara":
      return "bg-agent-sara";
    case "norvil":
      return "bg-agent-norvil";
    case "config":
      return "bg-agent-config";
    case "luana":
      return "bg-agent-luana";
    default: {
      // TypeScript exhaustiveness guard
      const _exhaustiveCheck: never = slug;
      return _exhaustiveCheck;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Soft background class — desaturated (TypingIndicator bubble, DelegateMarker)
// ─────────────────────────────────────────────────────────────────────────────

/** Soft background class for agent (desaturated — TypingIndicator, DelegateMarker). */
export function agentBgSoftClass(slug: AgentSlug): string {
  switch (slug) {
    case "abel":
      return "bg-agent-abel-soft";
    case "brenda":
      return "bg-agent-brenda-soft";
    case "christian":
      return "bg-agent-christian-soft";
    case "sara":
      return "bg-agent-sara-soft";
    case "norvil":
      return "bg-agent-norvil-soft";
    case "config":
      return "bg-agent-config-soft";
    case "luana":
      return "bg-agent-luana-soft";
    default: {
      const _exhaustiveCheck: never = slug;
      return _exhaustiveCheck;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Text color class — agent name labels
// ─────────────────────────────────────────────────────────────────────────────

/** Text color class for agent name labels (ChatHeader, TypingIndicator, DelegateMarker). */
export function agentTextClass(slug: AgentSlug): string {
  switch (slug) {
    case "abel":
      return "text-agent-abel";
    case "brenda":
      return "text-agent-brenda";
    case "christian":
      return "text-agent-christian";
    case "sara":
      return "text-agent-sara";
    case "norvil":
      return "text-agent-norvil";
    case "config":
      return "text-agent-config";
    case "luana":
      return "text-agent-luana";
    default: {
      const _exhaustiveCheck: never = slug;
      return _exhaustiveCheck;
    }
  }
}

/** Dot/icon background for typing-dot dots (same as full bg). */
export const agentDotBgClass = agentBgClass;

// ─────────────────────────────────────────────────────────────────────────────
// Text color class for active sub-tab label (SubTab molecule, SubTabsBar)
//
// Config exception: Config is not an agent — uses bg-muted neutral → text-foreground.
// (Analogous to Vitalia's lucas exception D18/D19)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Text color class for active sub-tab label (SubTab molecule).
 *
 * Config exception: Config is not an agent — uses bg-muted neutral, text-foreground.
 *
 * CRITICAL: No dynamic string construction — Tailwind v4 JIT purges non-static class names.
 */
export function agentTextClassSubTab(slug: RibbonTabSlug): string {
  switch (slug) {
    case "abel":
      return "text-agent-abel";
    case "brenda":
      return "text-agent-brenda";
    case "christian":
      return "text-agent-christian";
    case "sara":
      return "text-agent-sara";
    case "norvil":
      return "text-agent-norvil";
    case "config":
      // Config is not an agent — bg-muted neutral, text-foreground per mockup
      return "text-foreground";
    default: {
      const _exhaustiveCheck: never = slug;
      return _exhaustiveCheck;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Border color class — ribbon tab active border (bottom indicator)
// ─────────────────────────────────────────────────────────────────────────────

/** Border color class for ribbon tab active indicator. */
export function agentBorderClass(slug: RibbonTabSlug): string {
  switch (slug) {
    case "abel":
      return "border-agent-abel";
    case "brenda":
      return "border-agent-brenda";
    case "christian":
      return "border-agent-christian";
    case "sara":
      return "border-agent-sara";
    case "norvil":
      return "border-agent-norvil";
    case "config":
      return "border-agent-config";
    default: {
      const _exhaustiveCheck: never = slug;
      return _exhaustiveCheck;
    }
  }
}
