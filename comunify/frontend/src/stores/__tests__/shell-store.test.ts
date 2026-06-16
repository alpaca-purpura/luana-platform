// cap: comunify-shell-organism
/**
 * shell-store.test.ts — RED test for comunify shell-store.ts (T-shell TDD).
 *
 * Tests the createShellStore wrapper and migration logic BEFORE implementation.
 * These tests run RED until shell-store.ts is created with the correct exports.
 */

import { describe, it, expect } from "vitest";

// ── RED: these imports will fail until shell-store.ts is created ──────────────

describe("shell-store", () => {
  it("exports useShellStoreKit (kit factory result)", async () => {
    const mod = await import("../shell-store");
    expect(typeof mod.useShellStoreKit).toBe("function");
  });

  it("exports SHELL_STORAGE_KEY as string", async () => {
    const mod = await import("../shell-store");
    expect(typeof mod.SHELL_STORAGE_KEY).toBe("string");
    expect(mod.SHELL_STORAGE_KEY).toContain("comunify");
  });

  it("exports migrateComunifyState function", async () => {
    const mod = await import("../shell-store");
    expect(typeof mod.migrateComunifyState).toBe("function");
  });

  it("migrateComunifyState returns defaults for null input", async () => {
    const { migrateComunifyState } = await import("../shell-store");
    const result = migrateComunifyState(null, 0);
    expect(result).toHaveProperty("supervisorOpen");
    expect(["closed", "chat"]).toContain(result.supervisorOpen);
  });

  it("migrateComunifyState handles corrupt shapes gracefully", async () => {
    const { migrateComunifyState } = await import("../shell-store");
    const result = migrateComunifyState({ unknown: true }, 0);
    expect(result).toHaveProperty("supervisorOpen");
    expect(result).toHaveProperty("mobileDrawerOpen");
  });

  it("migrateComunifyState preserves valid supervisorOpen from stored state", async () => {
    const { migrateComunifyState } = await import("../shell-store");
    const stored = { supervisorOpen: "closed", splitPct: null, mobileDrawerOpen: false };
    const result = migrateComunifyState(stored, 1);
    expect(result.supervisorOpen).toBe("closed");
  });
});
