// cap: comunify-shell-organism
/**
 * _agent-tw-classes.ts — internal Tailwind class name lookup for comunify agent slugs.
 *
 * Comunify shell-organism internal helper. Prefix `_` = module-private.
 *
 * CRITICAL (G3 gate): Tailwind v4 JIT purges dynamic class names (e.g. `bg-agent-${slug}`).
 * ALL class names MUST be statically knowable. Use explicit switch/map ONLY.
 * NUNCA template literals: `bg-agent-${slug}` → Tailwind JIT purge silently drops it.
 *
 * Reference: learning vitalia/docs/learnings/2026-05-25-q16-tailwind-jit-template-purge.md
 *
 * Comunify agents:
 *   nina   (#7B2FF7) · tomas  (#2D7FF9) · sofia  (#16C784)
 *   bruno  (#F59E0B) · lucia  (#1246D6) · luana  (#7B2FF7)
 *   plataforma (#64748b neutral)
 *
 * Consumed by: Ribbon · RibbonTab · SubTabsBar · SubTab · AgentAvatar
 *              LuanaSidebar · ChatHeader · TypingIndicator
 */

/** Agent slugs for Ribbon (5 creator agents + plataforma config) */
export type RibbonTabSlug =
  | "nina"
  | "tomas"
  | "sofia"
  | "bruno"
  | "lucia"
  | "plataforma";

/** All agent slugs including luana (orchestrator sidebar) */
export type AgentSlug = RibbonTabSlug | "luana";

// ─────────────────────────────────────────────────────────────────────────────
// Background class — full saturation (avatar, user bubbles, accents)
// ─────────────────────────────────────────────────────────────────────────────

/** Background class for agent (full saturation — avatar, user bubbles, accents). */
export function agentBgClass(slug: AgentSlug): string {
  switch (slug) {
    case "nina":
      return "bg-agent-nina";
    case "tomas":
      return "bg-agent-tomas";
    case "sofia":
      return "bg-agent-sofia";
    case "bruno":
      return "bg-agent-bruno";
    case "lucia":
      return "bg-agent-lucia";
    case "plataforma":
      return "bg-agent-plataforma";
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
    case "nina":
      return "bg-agent-nina-soft";
    case "tomas":
      return "bg-agent-tomas-soft";
    case "sofia":
      return "bg-agent-sofia-soft";
    case "bruno":
      return "bg-agent-bruno-soft";
    case "lucia":
      return "bg-agent-lucia-soft";
    case "plataforma":
      return "bg-agent-plataforma-soft";
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
    case "nina":
      return "text-agent-nina";
    case "tomas":
      return "text-agent-tomas";
    case "sofia":
      return "text-agent-sofia";
    case "bruno":
      return "text-agent-bruno";
    case "lucia":
      return "text-agent-lucia";
    case "plataforma":
      return "text-agent-plataforma";
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
// Plataforma exception: not an agent — uses bg-muted neutral → text-foreground.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Text color class for active sub-tab label (SubTab molecule).
 *
 * Plataforma exception: not an agent — bg-muted neutral, text-foreground.
 *
 * CRITICAL: No dynamic string construction — Tailwind v4 JIT purges non-static class names.
 */
export function agentTextClassSubTab(slug: RibbonTabSlug): string {
  switch (slug) {
    case "nina":
      return "text-agent-nina";
    case "tomas":
      return "text-agent-tomas";
    case "sofia":
      return "text-agent-sofia";
    case "bruno":
      return "text-agent-bruno";
    case "lucia":
      return "text-agent-lucia";
    case "plataforma":
      // Plataforma is not an agent — bg-muted neutral, text-foreground per mockup
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
    case "nina":
      return "border-agent-nina";
    case "tomas":
      return "border-agent-tomas";
    case "sofia":
      return "border-agent-sofia";
    case "bruno":
      return "border-agent-bruno";
    case "lucia":
      return "border-agent-lucia";
    case "plataforma":
      return "border-agent-plataforma";
    default: {
      const _exhaustiveCheck: never = slug;
      return _exhaustiveCheck;
    }
  }
}
