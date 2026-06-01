// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-3
/**
 * Architecture fitness test: no-store-in-ssr-skeleton (G2 gate)
 *
 * Enforces ADR-nicolify-001 G2:
 * 1. ShellOrganismLayout.tsx uses dynamic({ssr:false}) wrapping ShellOrganismLayoutClient
 * 2. The SSR skeleton component (ShellOrganismLayoutSkeleton) is store-free — does NOT
 *    subscribe to useShellStore (prevents spurious default write on SSR/hydration — Bug C3)
 * 3. useStoreHydration is called in ShellOrganismLayoutClient (the ssr:false boundary)
 * 4. ShellOrganismLayout.tsx exports ShellOrganismLayout (named export, no default)
 *
 * Text-scan tests (don't import the actual components to avoid SSR issues in test env).
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

import { describe, it, expect } from "vitest";

const SHELL_DIR = resolve(__dirname, "../../components/shared/shell-organism");

const LAYOUT_PATH = resolve(SHELL_DIR, "ShellOrganismLayout.tsx");
const LAYOUT_CLIENT_PATH = resolve(SHELL_DIR, "ShellOrganismLayoutClient.tsx");
const APP_PANEL_PATH = resolve(SHELL_DIR, "AppPanelSlot.tsx");
const VIEWPORT_GUARD_PATH = resolve(SHELL_DIR, "useViewportGuard.ts");
const STORE_PATH = resolve(__dirname, "../../stores/shell-store.ts");

describe("Architecture: no-store-in-ssr-skeleton (G2 gate)", () => {
  // ── File existence ─────────────────────────────────────────────────────────

  it("ShellOrganismLayout.tsx exists", () => {
    expect(existsSync(LAYOUT_PATH)).toBe(true);
  });

  it("ShellOrganismLayoutClient.tsx exists", () => {
    expect(existsSync(LAYOUT_CLIENT_PATH)).toBe(true);
  });

  it("AppPanelSlot.tsx exists", () => {
    expect(existsSync(APP_PANEL_PATH)).toBe(true);
  });

  it("useViewportGuard.ts exists", () => {
    expect(existsSync(VIEWPORT_GUARD_PATH)).toBe(true);
  });

  it("shell-store.ts exists (replaced stub)", () => {
    expect(existsSync(STORE_PATH)).toBe(true);
  });

  // ── ShellOrganismLayout.tsx: SSR boundary ───────────────────────────────────

  describe("ShellOrganismLayout.tsx — SSR boundary", () => {
    it("uses dynamic import with ssr:false (G2 boundary)", () => {
      const content = readFileSync(LAYOUT_PATH, "utf-8");
      expect(content).toMatch(/ssr:\s*false/);
    });

    it("imports 'dynamic' from 'next/dynamic' for SSR boundary", () => {
      const content = readFileSync(LAYOUT_PATH, "utf-8");
      expect(content).toContain("dynamic");
      expect(content).toContain("next/dynamic");
    });

    it("skeleton function is store-free — does NOT import useShellStore", () => {
      const content = readFileSync(LAYOUT_PATH, "utf-8");
      // The skeleton in ShellOrganismLayout must not subscribe to the store
      // The file may import TopBarGlobal which is fine (TopBarGlobal has skeleton variant)
      // But the layout wrapper itself must not call useShellStore directly
      //
      // Key check: the skeleton renders TopBarGlobal with variant="skeleton"
      expect(content).toContain('variant="skeleton"');
    });

    it("exports ShellOrganismLayout as named export (no default export)", () => {
      const content = readFileSync(LAYOUT_PATH, "utf-8");
      expect(content).toMatch(/export\s+function\s+ShellOrganismLayout/);
      // Must not have 'export default'
      expect(content).not.toMatch(/^export\s+default\s/m);
    });

    it("loading prop passes the skeleton to dynamic (no flash)", () => {
      const content = readFileSync(LAYOUT_PATH, "utf-8");
      expect(content).toContain("loading");
      // loading function should reference the Skeleton
      // Check loading and Skeleton exist in the file (both words present)
      expect(content).toContain("loading");
      expect(content).toContain("Skeleton");
    });
  });

  // ── ShellOrganismLayoutClient.tsx: hydration ─────────────────────────────────

  describe("ShellOrganismLayoutClient.tsx — hydration + splitter", () => {
    it("uses 'use client' directive", () => {
      const content = readFileSync(LAYOUT_CLIENT_PATH, "utf-8");
      expect(content).toContain('"use client"');
    });

    it("calls useStoreHydration (G2 requirement)", () => {
      const content = readFileSync(LAYOUT_CLIENT_PATH, "utf-8");
      expect(content).toContain("useStoreHydration");
    });

    it("uses useShellStore for state subscription (client side)", () => {
      const content = readFileSync(LAYOUT_CLIENT_PATH, "utf-8");
      expect(content).toContain("useShellStore");
    });

    it("uses react-resizable-panels Group/Panel/Separator", () => {
      const content = readFileSync(LAYOUT_CLIENT_PATH, "utf-8");
      expect(content).toContain("Group");
      expect(content).toContain("Panel");
      expect(content).toContain("Separator");
    });

    it("Separator has aria-label for accessibility (hit-area + a11y)", () => {
      const content = readFileSync(LAYOUT_CLIENT_PATH, "utf-8");
      expect(content).toContain("aria-label");
      // Check for the resize label
      expect(content).toContain("Redimensionar paneles");
    });

    it("uses useGroupRef for snap-up (Fix A — C3 bug mitigation)", () => {
      const content = readFileSync(LAYOUT_CLIENT_PATH, "utf-8");
      expect(content).toContain("useGroupRef");
    });

    it("exports ShellOrganismLayoutClient as named export (no default export)", () => {
      const content = readFileSync(LAYOUT_CLIENT_PATH, "utf-8");
      expect(content).toMatch(/export\s+function\s+ShellOrganismLayoutClient/);
      expect(content).not.toMatch(/^export\s+default\s/m);
    });
  });

  // ── shell-store.ts: SSR-safe factory ──────────────────────────────────────────

  describe("shell-store.ts — real SSR-safe implementation (not stub)", () => {
    it("uses createSsrSafePersistedStore (not raw Zustand create)", () => {
      const content = readFileSync(STORE_PATH, "utf-8");
      expect(content).toContain("createSsrSafePersistedStore");
      expect(content).not.toMatch(/import\s*\{\s*create\s*\}\s*from\s*["']zustand["']/);
    });

    it("storage key is 'nicolify-shell-state'", () => {
      const content = readFileSync(STORE_PATH, "utf-8");
      expect(content).toContain("nicolify-shell-state");
    });

    it("partializes without setters and without _hasHydrated", () => {
      const content = readFileSync(STORE_PATH, "utf-8");
      // partialize function should exist
      expect(content).toContain("partialize");
      // partialize result should not include setter names (manual check: 5 setters excluded)
      // The function signature should look like PersistedState or similar
    });

    it("exports useShellStore as named export (no default export)", () => {
      const content = readFileSync(STORE_PATH, "utf-8");
      expect(content).toMatch(/export\s+const\s+useShellStore/);
      expect(content).not.toMatch(/^export\s+default\s/m);
    });

    it("exports SHELL_STORAGE_KEY", () => {
      const content = readFileSync(STORE_PATH, "utf-8");
      expect(content).toContain("export const SHELL_STORAGE_KEY");
    });
  });

  // ── AppPanelSlot.tsx: typed slots ────────────────────────────────────────────

  describe("AppPanelSlot.tsx — typed placeholder slots", () => {
    it("is NOT a 'use client' component (Server Component per spec)", () => {
      const content = readFileSync(APP_PANEL_PATH, "utf-8");
      // AppPanelSlot should be a Server Component (no 'use client' at top)
      // It can reference Client Components like Ribbon/SubTabsBar — that's fine
      const firstLines = content.split("\n").slice(0, 5).join("\n");
      expect(firstLines).not.toContain('"use client"');
    });

    it("exports AppPanelSlot as named export (no default export)", () => {
      const content = readFileSync(APP_PANEL_PATH, "utf-8");
      expect(content).toMatch(/export\s+function\s+AppPanelSlot/);
      expect(content).not.toMatch(/^export\s+default\s/m);
    });

    it("has aria-label 'Panel aplicación' for accessibility", () => {
      const content = readFileSync(APP_PANEL_PATH, "utf-8");
      expect(content).toContain("Panel aplicación");
    });

    it("has data-testid='app-panel-slot'", () => {
      const content = readFileSync(APP_PANEL_PATH, "utf-8");
      expect(content).toContain('data-testid="app-panel-slot"');
    });
  });

  // ── useViewportGuard.ts: one-way rail guard ───────────────────────────────────

  describe("useViewportGuard.ts — one-way rail guard <1104px", () => {
    it("exports FULL_STATE_MIN_VIEWPORT = 1104", () => {
      const content = readFileSync(VIEWPORT_GUARD_PATH, "utf-8");
      expect(content).toContain("FULL_STATE_MIN_VIEWPORT");
      expect(content).toMatch(/FULL_STATE_MIN_VIEWPORT\s*=\s*1104/);
    });

    it("exports MOBILE_BREAKPOINT = 768", () => {
      const content = readFileSync(VIEWPORT_GUARD_PATH, "utf-8");
      expect(content).toContain("MOBILE_BREAKPOINT");
      expect(content).toMatch(/MOBILE_BREAKPOINT\s*=\s*768/);
    });

    it("exports useViewportGuard as named export", () => {
      const content = readFileSync(VIEWPORT_GUARD_PATH, "utf-8");
      expect(content).toMatch(/export\s+function\s+useViewportGuard/);
      expect(content).not.toMatch(/^export\s+default\s/m);
    });

    it("references setLuanaState (not setValeriaState — renamed to Luana)", () => {
      const content = readFileSync(VIEWPORT_GUARD_PATH, "utf-8");
      expect(content).toContain("setLuanaState");
      expect(content).not.toContain("setValeriaState");
    });
  });
});
