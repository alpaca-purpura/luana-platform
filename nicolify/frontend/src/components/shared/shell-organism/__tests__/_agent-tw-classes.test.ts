// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-1
/**
 * _agent-tw-classes.ts unit tests — nicolify-r0-shell T-1
 * TDD: RED written BEFORE _agent-tw-classes.ts (GREEN) per tdd-mandatory.md
 *
 * Gherkin B2 coverage: theme toggle + G3 JIT-safe agent color lookup.
 * G3 gate: NUNCA template literals en class strings.
 *
 * Agent slugs nicolify: abel · brenda · christian · sara · norvil · config · luana
 */
import { describe, it, expect } from "vitest";

import {
  agentBgClass,
  agentBgSoftClass,
  agentTextClass,
  agentTextClassSubTab,
  agentBorderClass,
} from "../_agent-tw-classes";

// ──────────────────────────────────────────────────────────────────────────────
// agentBgClass — full saturation bg
// ──────────────────────────────────────────────────────────────────────────────
describe("agentBgClass — returns static class literals (G3 JIT-safe)", () => {
  it("abel → bg-agent-abel (#A855F7 púrpura)", () => {
    expect(agentBgClass("abel")).toBe("bg-agent-abel");
  });
  it("brenda → bg-agent-brenda (#22C55E verde)", () => {
    expect(agentBgClass("brenda")).toBe("bg-agent-brenda");
  });
  it("christian → bg-agent-christian (#3B82F6 azul)", () => {
    expect(agentBgClass("christian")).toBe("bg-agent-christian");
  });
  it("sara → bg-agent-sara (#F59E0B ámbar)", () => {
    expect(agentBgClass("sara")).toBe("bg-agent-sara");
  });
  it("norvil → bg-agent-norvil (#EC4899 rosa)", () => {
    expect(agentBgClass("norvil")).toBe("bg-agent-norvil");
  });
  it("luana → bg-agent-luana (#635BFF indigo)", () => {
    expect(agentBgClass("luana")).toBe("bg-agent-luana");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// agentBgSoftClass — soft/desaturated bg
// ──────────────────────────────────────────────────────────────────────────────
describe("agentBgSoftClass — soft background (typing bubble, delegate marker)", () => {
  it("abel → bg-agent-abel-soft", () => {
    expect(agentBgSoftClass("abel")).toBe("bg-agent-abel-soft");
  });
  it("brenda → bg-agent-brenda-soft", () => {
    expect(agentBgSoftClass("brenda")).toBe("bg-agent-brenda-soft");
  });
  it("christian → bg-agent-christian-soft", () => {
    expect(agentBgSoftClass("christian")).toBe("bg-agent-christian-soft");
  });
  it("sara → bg-agent-sara-soft", () => {
    expect(agentBgSoftClass("sara")).toBe("bg-agent-sara-soft");
  });
  it("norvil → bg-agent-norvil-soft", () => {
    expect(agentBgSoftClass("norvil")).toBe("bg-agent-norvil-soft");
  });
  it("luana → bg-agent-luana-soft", () => {
    expect(agentBgSoftClass("luana")).toBe("bg-agent-luana-soft");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// agentTextClass — text color
// ──────────────────────────────────────────────────────────────────────────────
describe("agentTextClass — text color for agent labels", () => {
  it("abel → text-agent-abel", () => {
    expect(agentTextClass("abel")).toBe("text-agent-abel");
  });
  it("brenda → text-agent-brenda", () => {
    expect(agentTextClass("brenda")).toBe("text-agent-brenda");
  });
  it("christian → text-agent-christian", () => {
    expect(agentTextClass("christian")).toBe("text-agent-christian");
  });
  it("sara → text-agent-sara", () => {
    expect(agentTextClass("sara")).toBe("text-agent-sara");
  });
  it("norvil → text-agent-norvil", () => {
    expect(agentTextClass("norvil")).toBe("text-agent-norvil");
  });
  it("luana → text-agent-luana", () => {
    expect(agentTextClass("luana")).toBe("text-agent-luana");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// agentTextClassSubTab — text color for active sub-tab
// (config exception: bg-muted neutral → text-foreground)
// ──────────────────────────────────────────────────────────────────────────────
describe("agentTextClassSubTab — sub-tab active text (config exception)", () => {
  it("abel → text-agent-abel", () => {
    expect(agentTextClassSubTab("abel")).toBe("text-agent-abel");
  });
  it("brenda → text-agent-brenda", () => {
    expect(agentTextClassSubTab("brenda")).toBe("text-agent-brenda");
  });
  it("christian → text-agent-christian", () => {
    expect(agentTextClassSubTab("christian")).toBe("text-agent-christian");
  });
  it("sara → text-agent-sara", () => {
    expect(agentTextClassSubTab("sara")).toBe("text-agent-sara");
  });
  it("norvil → text-agent-norvil", () => {
    expect(agentTextClassSubTab("norvil")).toBe("text-agent-norvil");
  });
  it("config → text-foreground (Config is not an agent — bg-muted neutral)", () => {
    expect(agentTextClassSubTab("config")).toBe("text-foreground");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// agentBorderClass — ribbon active border color
// ──────────────────────────────────────────────────────────────────────────────
describe("agentBorderClass — ribbon tab active border", () => {
  it("abel → border-agent-abel", () => {
    expect(agentBorderClass("abel")).toBe("border-agent-abel");
  });
  it("christian → border-agent-christian", () => {
    expect(agentBorderClass("christian")).toBe("border-agent-christian");
  });
  it("config → border-agent-config", () => {
    expect(agentBorderClass("config")).toBe("border-agent-config");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// G3 gate: NO template literals — all returns are static string literals
// ──────────────────────────────────────────────────────────────────────────────
describe("G3 JIT-safe — all return values are static (no dynamic class construction)", () => {
  const slugs = ["abel", "brenda", "christian", "sara", "norvil", "luana"] as const;
  const ribbonSlugs = ["abel", "brenda", "christian", "sara", "norvil", "config"] as const;

  it("agentBgClass returns only known static bg-agent-* classes", () => {
    for (const slug of slugs) {
      const cls = agentBgClass(slug);
      expect(cls).toMatch(/^bg-agent-(abel|brenda|christian|sara|norvil|luana|config)$/);
    }
  });

  it("agentTextClassSubTab returns only static class names (no template literals)", () => {
    for (const slug of ribbonSlugs) {
      const cls = agentTextClassSubTab(slug);
      expect(cls).toMatch(
        /^(text-agent-(abel|brenda|christian|sara|norvil|luana)|text-foreground)$/,
      );
    }
  });

  it("agentBorderClass returns only static border-agent-* class names", () => {
    for (const slug of ribbonSlugs) {
      const cls = agentBorderClass(slug);
      expect(cls).toMatch(/^border-agent-(abel|brenda|christian|sara|norvil|config|luana)$/);
    }
  });
});
