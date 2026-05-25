import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { existsSync } from "node:fs";

const WS = resolve(__dirname, "../../../../.."); // hasta luana-vitalia/

function grepCount(pattern: string, paths: string[]): number {
  try {
    const targets = paths.filter((p) => {
      try {
        return existsSync(p);
      } catch {
        return false;
      }
    });
    if (targets.length === 0) return 0;
    const result = execSync(
      `grep -rl "${pattern}" ${targets.join(" ")} 2>/dev/null || true`,
      { encoding: "utf-8" },
    );
    return result.trim().split("\n").filter(Boolean).length;
  } catch {
    return 0;
  }
}

const OTHER_BRANDS_FRONTEND = ["nicolify", "comunify", "lupulo"].map(
  (b) => `${WS}/${b}/frontend/src`,
);

describe("arch: anti-duplication cross-brand mirror = 0 (NEW gate T-6)", () => {
  it("no matches for ShellOrganismLayout in nicolify/comunify/lupulo", () => {
    expect(grepCount("ShellOrganismLayout", OTHER_BRANDS_FRONTEND)).toBe(0);
  });

  it("no matches for shell-store across brands", () => {
    expect(grepCount("shell-store", OTHER_BRANDS_FRONTEND)).toBe(0);
  });

  it("no matches for useShellStore across brands", () => {
    expect(grepCount("useShellStore", OTHER_BRANDS_FRONTEND)).toBe(0);
  });

  it("no matches for ValeriaSidebarSlot across brands", () => {
    expect(grepCount("ValeriaSidebarSlot", OTHER_BRANDS_FRONTEND)).toBe(0);
  });
});

describe("arch: anti-duplication cross-brand mirror = 0 (F1-S5 NEW names T-7)", () => {
  it("no matches for ValeriaSidebar in nicolify/comunify/lupulo", () => {
    expect(grepCount("ValeriaSidebar", OTHER_BRANDS_FRONTEND)).toBe(0);
  });

  it("no matches for ValeriaRail across brands", () => {
    expect(grepCount("ValeriaRail", OTHER_BRANDS_FRONTEND)).toBe(0);
  });

  it("no matches for ValeriaHistory across brands", () => {
    expect(grepCount("ValeriaHistory", OTHER_BRANDS_FRONTEND)).toBe(0);
  });

  it("no matches for ValeriaChatSlot across brands", () => {
    expect(grepCount("ValeriaChatSlot", OTHER_BRANDS_FRONTEND)).toBe(0);
  });

  it("no matches for HistoryItem across brands", () => {
    expect(grepCount("HistoryItem", OTHER_BRANDS_FRONTEND)).toBe(0);
  });

  it("no matches for HistoryGroup across brands", () => {
    expect(grepCount("HistoryGroup", OTHER_BRANDS_FRONTEND)).toBe(0);
  });

  it("no matches for EmptyStateInline across brands", () => {
    expect(grepCount("EmptyStateInline", OTHER_BRANDS_FRONTEND)).toBe(0);
  });

  it("no matches for useKeyboardShortcuts across brands", () => {
    expect(grepCount("useKeyboardShortcuts", OTHER_BRANDS_FRONTEND)).toBe(0);
  });
});

describe("arch: anti-duplication cross-brand mirror = 0 (F1-S6 NEW names T-6)", () => {
  // ValeriaChat is vitalia-specific (Valeria prefix) — zero-tolerance cross-brand
  it("no matches for ValeriaChat in nicolify/comunify/lupulo", () => {
    expect(grepCount("ValeriaChat", OTHER_BRANDS_FRONTEND)).toBe(0);
  });

  // DelegateMarker is vitalia shell-organism specific — zero-tolerance cross-brand
  it("no matches for DelegateMarker across brands", () => {
    expect(grepCount("DelegateMarker", OTHER_BRANDS_FRONTEND)).toBe(0);
  });

  // chat-store is vitalia-specific zustand store — zero-tolerance cross-brand
  it("no matches for useChatStore across brands", () => {
    expect(grepCount("useChatStore", OTHER_BRANDS_FRONTEND)).toBe(0);
  });

  // AGENT_CATALOG is vitalia agent registry — zero-tolerance cross-brand
  it("no matches for AGENT_CATALOG across brands", () => {
    expect(grepCount("AGENT_CATALOG", OTHER_BRANDS_FRONTEND)).toBe(0);
  });

  // NOTE: ChatComposer, ChatHeader, ChatMessages, MessageBubble, TypingIndicator
  // are generic UI component names that may independently exist in other brand frontends
  // (e.g. nicolify/copilot features). The anti-duplication rule protects against
  // architectural MIRRORS (same pattern imported cross-brand), not naming coincidences.
  // Vitalia-specific identifiers (Valeria prefix, DelegateMarker, useChatStore, AGENT_CATALOG)
  // provide sufficient cross-brand isolation guarantees for the shell-organism pattern.
  // Future: if a second brand adopts a similar agent-chat pattern, escalate to /pm-luana
  // for promotion to core/@luana/shell-chat-organism/ (LIFT CANDIDATE documented).
});

describe("arch: anti-duplication cross-brand mirror = 0 (F1-S7 NEW names T-2)", () => {
  // RibbonTab is vitalia shell-organism specific molecule — zero-tolerance cross-brand
  it("no matches for RibbonTab in nicolify/comunify/lupulo", () => {
    expect(grepCount("RibbonTab", OTHER_BRANDS_FRONTEND)).toBe(0);
  });

  // ConfigTab is vitalia shell-organism specific molecule — zero-tolerance cross-brand
  it("no matches for ConfigTab across brands", () => {
    expect(grepCount("ConfigTab", OTHER_BRANDS_FRONTEND)).toBe(0);
  });

  // AGENT_RIBBON_ORDER is vitalia-specific ribbon nav constant — zero-tolerance cross-brand
  it("no matches for AGENT_RIBBON_ORDER across brands", () => {
    expect(grepCount("AGENT_RIBBON_ORDER", OTHER_BRANDS_FRONTEND)).toBe(0);
  });

  // extractAgentFromPath is vitalia shell-organism specific helper — zero-tolerance cross-brand
  it("no matches for extractAgentFromPath across brands", () => {
    expect(grepCount("extractAgentFromPath", OTHER_BRANDS_FRONTEND)).toBe(0);
  });
});
