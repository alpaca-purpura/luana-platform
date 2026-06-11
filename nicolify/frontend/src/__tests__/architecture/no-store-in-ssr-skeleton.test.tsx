// cap: shell-organism.shell-nicolify
// story-origin: platform-lift-shell-chrome-ui-kit T-N1
/**
 * Architecture fitness test: shell-wire-kit (T-N1 convergence gate)
 *
 * Replaces the legacy no-store-in-ssr-skeleton test (which validated ShellOrganismLayout +
 * ShellOrganismLayoutClient — both retired in T-N1).
 *
 * Enforces T-N1 post-convergence invariants:
 * 1. Legacy chrome machine is RETIRED (LuanaSidebar/LuanaRail/ShellOrganismLayout etc.)
 * 2. ShellLayoutWire.tsx exists and uses @luana/ui-kit ShellLayout
 * 3. shell-store.ts uses createShellStore from @luana/ui-kit (not raw createSsrSafePersistedStore)
 * 4. shell-store.ts exports migrateLuanaState + SHELL_STORAGE_KEY + useShellStoreKit
 * 5. layout.tsx imports ShellLayoutWire (not ShellOrganismLayout)
 * 6. chat-store.ts no longer imports from shell-organism/_mock-messages
 *
 * RN-7 (convergencia sancionada): retiring legacy tests is the sanctioned goal.
 * Text-scan tests (don't import actual components to avoid SSR issues in test env).
 */
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

import { describe, it, expect } from "vitest";

const SRC_ROOT = resolve(__dirname, "../../");
const SHELL_DIR = resolve(SRC_ROOT, "components/shared/shell-organism");
const STORES_DIR = resolve(SRC_ROOT, "stores");
const WIRE_PATH = resolve(
  SRC_ROOT,
  "app/[tenantId]/(shell-organism)/_components/ShellLayoutWire.tsx",
);
const LAYOUT_PATH = resolve(SRC_ROOT, "app/[tenantId]/(shell-organism)/layout.tsx");
const STORE_PATH = resolve(STORES_DIR, "shell-store.ts");
const CHAT_STORE_PATH = resolve(STORES_DIR, "chat-store.ts");

describe("Architecture: shell-wire-kit (T-N1 convergence gate)", () => {
  // ── 1. Legacy chrome machine RETIRED ─────────────────────────────────────

  describe("Legacy chrome machine retired (T-N1 RN-7)", () => {
    const legacyFiles = [
      "LuanaSidebar.tsx",
      "LuanaRail.tsx",
      "LuanaChat.tsx",
      "LuanaHistory.tsx",
      "ShellModeToggle.tsx",
      "ShellOrganismLayout.tsx",
      "ShellOrganismLayoutClient.tsx",
      "Ribbon.tsx",
      "RibbonTab.tsx",
      "SubTabsBar.tsx",
      "SubTab.tsx",
      "TopBarGlobal.tsx",
      "ChatComposer.tsx",
      "ChatHeader.tsx",
      "ChatMessages.tsx",
      "MessageBubble.tsx",
      "TypingIndicator.tsx",
      "DelegateMarker.tsx",
      "HistoryGroup.tsx",
      "HistoryItem.tsx",
      "PlaceholderCard.tsx",
      "useViewportGuard.ts",
      "_mock-messages.ts",
      "_mock-conversations.ts",
      "AppPanelSlot.tsx",
    ];

    for (const file of legacyFiles) {
      it(`${file} is RETIRED (does not exist)`, () => {
        expect(existsSync(resolve(SHELL_DIR, file))).toBe(false);
      });
    }
  });

  // ── 2. ShellLayoutWire.tsx exists and uses kit ────────────────────────────

  describe("ShellLayoutWire.tsx — exists and uses @luana/ui-kit", () => {
    it("ShellLayoutWire.tsx exists at _components/ location", () => {
      expect(existsSync(WIRE_PATH)).toBe(true);
    });

    it("imports ShellLayout from @luana/ui-kit", () => {
      const content = readFileSync(WIRE_PATH, "utf-8");
      expect(content).toContain("@luana/ui-kit");
      expect(content).toContain("ShellLayout");
    });

    it("is a 'use client' component (required for usePathname)", () => {
      const content = readFileSync(WIRE_PATH, "utf-8");
      expect(content).toContain('"use client"');
    });

    it("supervisorName='Luana' (nicolify brand)", () => {
      const content = readFileSync(WIRE_PATH, "utf-8");
      expect(content).toContain('supervisorName="Luana"');
    });

    it("supervisorSlug='luana' (nicolify brand)", () => {
      const content = readFileSync(WIRE_PATH, "utf-8");
      expect(content).toContain('supervisorSlug="luana"');
    });

    it("uses useShellStoreKit from stores/shell-store", () => {
      const content = readFileSync(WIRE_PATH, "utf-8");
      expect(content).toContain("useShellStoreKit");
    });

    it("splitGroupId='nicolify-shell-split' (SC-6 equivalent for nicolify)", () => {
      const content = readFileSync(WIRE_PATH, "utf-8");
      expect(content).toContain("nicolify-shell-split");
    });

    it("exports ShellLayoutWire as named export (no default export)", () => {
      const content = readFileSync(WIRE_PATH, "utf-8");
      expect(content).toMatch(/export\s+function\s+ShellLayoutWire/);
      expect(content).not.toMatch(/^export\s+default\s/m);
    });
  });

  // ── 3. shell-store.ts — createShellStore factory (not raw SSR factory) ───

  describe("shell-store.ts — createShellStore factory (T-N1 thin wrapper)", () => {
    it("uses createShellStore from @luana/ui-kit (not raw createSsrSafePersistedStore directly)", () => {
      const content = readFileSync(STORE_PATH, "utf-8");
      expect(content).toContain("createShellStore");
      expect(content).toContain("@luana/ui-kit");
    });

    it("does NOT use raw zustand create() directly", () => {
      const content = readFileSync(STORE_PATH, "utf-8");
      expect(content).not.toMatch(/import\s*\{\s*create\s*\}\s*from\s*["']zustand["']/);
    });

    it("storage key is 'nicolify-shell-state' (SC-6)", () => {
      const content = readFileSync(STORE_PATH, "utf-8");
      expect(content).toContain("nicolify-shell-state");
    });

    it("exports SHELL_STORAGE_KEY", () => {
      const content = readFileSync(STORE_PATH, "utf-8");
      expect(content).toContain("export const SHELL_STORAGE_KEY");
    });

    it("exports useShellStoreKit as named export", () => {
      const content = readFileSync(STORE_PATH, "utf-8");
      expect(content).toMatch(/export\s+const\s+useShellStoreKit/);
    });

    it("exports migrateLuanaState as named export (T-N1 migration function)", () => {
      const content = readFileSync(STORE_PATH, "utf-8");
      expect(content).toMatch(/export\s+function\s+migrateLuanaState/);
    });

    it("migrateLuanaState maps luanaState → supervisorOpen", () => {
      const content = readFileSync(STORE_PATH, "utf-8");
      expect(content).toContain("luanaState");
      expect(content).toContain("supervisorOpen");
    });

    it("does NOT export default", () => {
      const content = readFileSync(STORE_PATH, "utf-8");
      expect(content).not.toMatch(/^export\s+default\s/m);
    });
  });

  // ── 4. layout.tsx — imports ShellLayoutWire (not ShellOrganismLayout) ────

  describe("layout.tsx — uses ShellLayoutWire (T-N1 kit wire)", () => {
    it("layout.tsx exists", () => {
      expect(existsSync(LAYOUT_PATH)).toBe(true);
    });

    it("imports ShellLayoutWire from _components/ShellLayoutWire", () => {
      const content = readFileSync(LAYOUT_PATH, "utf-8");
      expect(content).toContain("ShellLayoutWire");
    });

    it("does NOT import ShellOrganismLayout (legacy chrome retired)", () => {
      const content = readFileSync(LAYOUT_PATH, "utf-8");
      // Check no import statement references ShellOrganismLayout (comments may still reference it for history)
      expect(content).not.toMatch(/import\s+\{[^}]*ShellOrganismLayout[^}]*\}/);
    });
  });

  // ── 5. chat-store.ts — mock import path updated ───────────────────────────

  describe("chat-store.ts — _mock-messages import path updated", () => {
    it("does NOT import _mock-messages from shell-organism (legacy path retired)", () => {
      const content = readFileSync(CHAT_STORE_PATH, "utf-8");
      expect(content).not.toContain("shell-organism/_mock-messages");
    });

    it("imports _mock-messages from stores/ (new canonical path)", () => {
      const content = readFileSync(CHAT_STORE_PATH, "utf-8");
      expect(content).toContain("_mock-messages");
      // Should import from stores/, not from shell-organism/
      expect(content).toContain("@/stores/_mock-messages");
    });
  });
});
