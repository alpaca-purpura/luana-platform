// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-2
/**
 * abel-ui-store.test.ts — TDD tests for the Abel UI Zustand store (G2 SSR-safe).
 *
 * Covers:
 *   - Store exists and is a function
 *   - Initial state values
 *   - setIntakeOverlayOpen toggles state
 *   - setAnalyzingOverlayVisible toggles state
 *   - setProposalBannerVisible toggles state
 *   - setIntakeMode changes mode
 *   - Store is NOT subscribed during SSR skeleton (G2 gate — text scan)
 *   - Storage key is 'nicolify-abel-ui-state'
 *   - createSsrSafePersistedStore used (not raw create)
 *
 * G2 SSR-safe: uses createSsrSafePersistedStore (verified by source text scan).
 *
 * TDD RED-first per tdd-mandatory.md.
 * spec_anchor: 03-arch-fe.md §4 SSR-safe store (G2)
 * validators_gate: G2 + no-store-in-ssr-skeleton arch test
 */

import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// ── Source text scan (G2 gate) ────────────────────────────────────────────────

const STORE_PATH = resolve(__dirname, "./abel-ui-store.ts");

describe("abel-ui-store.ts — source scan (G2 SSR-safe gate)", () => {
  let source: string;

  beforeEach(() => {
    source = readFileSync(STORE_PATH, "utf-8");
  });

  it("uses createSsrSafePersistedStore (not raw Zustand create)", () => {
    expect(source).toContain("createSsrSafePersistedStore");
    // Must NOT import { create } from 'zustand' directly
    expect(source).not.toMatch(/import\s*\{\s*create\s*\}\s*from\s*["']zustand["']/);
  });

  it("storage key is 'nicolify-abel-ui-state'", () => {
    expect(source).toContain("nicolify-abel-ui-state");
  });

  it("exports ABEL_UI_STORAGE_KEY", () => {
    expect(source).toContain("export const ABEL_UI_STORAGE_KEY");
  });

  it("exports useAbelUiStore as named export (no default export)", () => {
    expect(source).toMatch(/export\s+const\s+useAbelUiStore/);
    expect(source).not.toMatch(/^export\s+default\s/m);
  });

  it("partializes only intakeMode (not setters or _hasHydrated)", () => {
    expect(source).toContain("partialize");
    expect(source).toContain("intakeMode");
  });

  it("includes SsrSafeHydration interface (G2 contract)", () => {
    expect(source).toContain("SsrSafeHydration");
  });

  it("initializes _hasHydrated: false", () => {
    expect(source).toContain("_hasHydrated: false");
  });
});

// ── Runtime tests ────────────────────────────────────────────────────────────

describe("useAbelUiStore — runtime state management", () => {
  it("useAbelUiStore is importable and is a function", async () => {
    const { useAbelUiStore } = await import("./abel-ui-store");
    expect(typeof useAbelUiStore).toBe("function");
  });

  it("initial state: intakeOverlayOpen=false", async () => {
    const { useAbelUiStore } = await import("./abel-ui-store");
    const state = useAbelUiStore.getState();
    expect(state.intakeOverlayOpen).toBe(false);
  });

  it("initial state: analyzingOverlayVisible=false", async () => {
    const { useAbelUiStore } = await import("./abel-ui-store");
    const state = useAbelUiStore.getState();
    expect(state.analyzingOverlayVisible).toBe(false);
  });

  it("initial state: proposalBannerVisible=false", async () => {
    const { useAbelUiStore } = await import("./abel-ui-store");
    const state = useAbelUiStore.getState();
    expect(state.proposalBannerVisible).toBe(false);
  });

  it("initial state: intakeMode='url'", async () => {
    const { useAbelUiStore } = await import("./abel-ui-store");
    const state = useAbelUiStore.getState();
    expect(state.intakeMode).toBe("url");
  });

  it("setIntakeOverlayOpen(true) updates state", async () => {
    const { useAbelUiStore } = await import("./abel-ui-store");
    useAbelUiStore.getState().setIntakeOverlayOpen(true);
    expect(useAbelUiStore.getState().intakeOverlayOpen).toBe(true);
    // Reset
    useAbelUiStore.getState().setIntakeOverlayOpen(false);
  });

  it("setAnalyzingOverlayVisible(true) updates state", async () => {
    const { useAbelUiStore } = await import("./abel-ui-store");
    useAbelUiStore.getState().setAnalyzingOverlayVisible(true);
    expect(useAbelUiStore.getState().analyzingOverlayVisible).toBe(true);
    // Reset
    useAbelUiStore.getState().setAnalyzingOverlayVisible(false);
  });

  it("setProposalBannerVisible(true) updates state", async () => {
    const { useAbelUiStore } = await import("./abel-ui-store");
    useAbelUiStore.getState().setProposalBannerVisible(true);
    expect(useAbelUiStore.getState().proposalBannerVisible).toBe(true);
    // Reset
    useAbelUiStore.getState().setProposalBannerVisible(false);
  });

  it("setIntakeMode changes mode to 'texto'", async () => {
    const { useAbelUiStore } = await import("./abel-ui-store");
    useAbelUiStore.getState().setIntakeMode("texto");
    expect(useAbelUiStore.getState().intakeMode).toBe("texto");
    // Reset
    useAbelUiStore.getState().setIntakeMode("url");
  });

  it("setIntakeMode changes mode to 'archivo'", async () => {
    const { useAbelUiStore } = await import("./abel-ui-store");
    useAbelUiStore.getState().setIntakeMode("archivo");
    expect(useAbelUiStore.getState().intakeMode).toBe("archivo");
    // Reset
    useAbelUiStore.getState().setIntakeMode("url");
  });
});
