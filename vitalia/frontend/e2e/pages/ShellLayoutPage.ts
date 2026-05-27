/**
 * ShellLayoutPage.ts — Page Object Model para ShellOrganismLayout
 *
 * F1-S4 vitalia-fase1-shell-layout-5050 — T-7
 *
 * Locators: data-testid first, ARIA como fallback.
 * Sin assertions en métodos POM — solo acciones + locators.
 *
 * Spec: 03-arch.md § 3 + 04-validators.yaml POM methods:
 *   gotoShell, setShellModeViaStore, setValeriaStateViaStore,
 *   dragResizeHandle, getValeriaWidth, getPersistedSplit.
 *
 * Storage keys (shell-store.ts SSoT):
 *   SHELL_STORAGE_KEY = 'vitalia-shell-state'
 *   SHELL_GROUP_ID    = 'vitalia-shell-split-agentic'
 *
 * downstream-regression-na: brand-local E2E POM; no cross-brand consumers
 */

import type { Page, Locator } from "@playwright/test";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ValeriaState = "full" | "rail" | "collapsed";
export type ShellMode = "agentic" | "web";

export interface ShellStorageState {
  shellMode?: ShellMode;
  valeriaState?: ValeriaState;
}

// localStorage keys (must stay in sync with shell-store.ts)
const SHELL_STORAGE_KEY = "vitalia-shell-state";
const SHELL_SPLIT_KEY = "vitalia-shell-split-agentic";

// ---------------------------------------------------------------------------
// ShellLayoutPage — POM
// ---------------------------------------------------------------------------

export class ShellLayoutPage {
  readonly page: Page;

  // ── Structural locators ────────────────────────────────────────────────────

  /** Fixed top navigation bar (header[role="banner"]) */
  readonly topBar: Locator;

  /** Skip-link to main content (href="#main-content") */
  readonly skipLink: Locator;

  /** The visible <main id="main-content"> element (CSS-gated triple pattern) */
  readonly main: Locator;

  /** Valeria sidebar slot aside[data-testid="valeria-sidebar-slot"] */
  readonly valeriaSlot: Locator;

  /** Application panel slot section[data-testid="app-panel-slot"] */
  readonly appSlot: Locator;

  /** Resize handle Separator component (aria-label="Redimensionar paneles") */
  readonly resizeHandle: Locator;

  // ── Top-bar interactive elements ──────────────────────────────────────────

  /** LogoMark link (navigates to vitalia root) */
  readonly logoMark: Locator;

  /** ThemeToggle button */
  readonly themeToggle: Locator;

  /** TenantSwitcher trigger button */
  readonly tenantSwitcher: Locator;

  /** ShellModeToggle chip (disabled placeholder F1-S4) */
  readonly shellModeToggle: Locator;

  constructor(page: Page) {
    this.page = page;

    this.topBar = page.locator('header[role="banner"]').first();
    this.skipLink = page.locator('a[href="#main-content"]').first();
    // Only one <main> is visible at any time — :visible ensures we target the right one
    this.main = page
      .locator("main#main-content")
      .filter({ hasText: "" })
      .first();
    // Triple-main pattern: multiple testid instances exist in DOM (one per CSS branch:
    // agentic md:block, web md:grid, mobile md:hidden). Only ONE is visible per viewport.
    // Filter por visibility para que assertions toBeVisible() resuelvan el correcto en
    // CADA viewport sin asumir DOM order (mobile fallback es el último, no el primero).
    this.valeriaSlot = page
      .getByTestId("valeria-sidebar-slot")
      .filter({ visible: true })
      .first();
    this.appSlot = page
      .getByTestId("app-panel-slot")
      .filter({ visible: true })
      .first();
    this.resizeHandle = page.locator('[aria-label="Redimensionar paneles"]');
    this.logoMark = page.locator('header a[aria-label*="Vitalia"]').first();
    this.themeToggle = page
      .locator(
        'header button[aria-label*="tema"], header button[aria-label*="Tema"]',
      )
      .first();
    this.tenantSwitcher = page.getByTestId("tenant-switcher-trigger");
    this.shellModeToggle = page.getByTestId("shell-mode-toggle");
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  /**
   * Navigate to the shell organism route for visual + functional E2E testing.
   *
   * Default: `/test-stack/shell-layout` (public dev-only page, no Clerk auth,
   * pattern parity con F1-S0..S3). Esta page monta ShellOrganismLayout
   * directamente sin requerir un real /{tenantId}/lisa/marca route (que no
   * existe hasta Fase 2).
   *
   * Opcional: pasá `useProdRoute: true` para navegar via /{tenantId} redirect
   * cuando exista la ruta `/lisa/marca` (Fase 2+).
   *
   * Waits for topBar visible para confirmar hydration.
   */
  async gotoShell(
    tenantId?: string,
    opts: { useProdRoute?: boolean } = {},
  ): Promise<void> {
    if (opts.useProdRoute && tenantId) {
      await this.page.goto(`/${tenantId}`);
    } else {
      await this.page.goto("/test-stack/shell-layout");
    }
    // Wait for shell to hydrate — topBar must be visible
    await this.topBar.waitFor({ state: "visible", timeout: 30_000 });
  }

  // ── Store manipulation (via localStorage pre-navigation) ───────────────────

  /**
   * Set shellMode in localStorage and reload to apply.
   * Zustand persist reads localStorage on mount.
   */
  async setShellModeViaStore(mode: ShellMode): Promise<void> {
    await this.page.evaluate(
      ([key, m]) => {
        try {
          const raw = localStorage.getItem(key);
          const data = raw ? JSON.parse(raw) : { state: {}, version: 0 };
          data.state = { ...(data.state as object), shellMode: m };
          localStorage.setItem(key, JSON.stringify(data));
        } catch {
          localStorage.setItem(
            key,
            JSON.stringify({ state: { shellMode: m }, version: 0 }),
          );
        }
      },
      [SHELL_STORAGE_KEY, mode] as const,
    );
    await this.page.reload();
    await this.topBar.waitFor({ state: "visible", timeout: 30_000 });
  }

  /**
   * Set valeriaState in localStorage and reload to apply.
   */
  async setValeriaStateViaStore(state: ValeriaState): Promise<void> {
    await this.page.evaluate(
      ([key, s]) => {
        try {
          const raw = localStorage.getItem(key);
          const data = raw ? JSON.parse(raw) : { state: {}, version: 0 };
          data.state = { ...(data.state as object), valeriaState: s };
          localStorage.setItem(key, JSON.stringify(data));
        } catch {
          localStorage.setItem(
            key,
            JSON.stringify({ state: { valeriaState: s }, version: 0 }),
          );
        }
      },
      [SHELL_STORAGE_KEY, state] as const,
    );
    await this.page.reload();
    await this.topBar.waitFor({ state: "visible", timeout: 30_000 });
  }

  // ── Resize handle interaction ─────────────────────────────────────────────

  /**
   * Drag the resize handle horizontally by deltaX pixels.
   * Uses mouse simulation with 20 intermediate steps for smoothness.
   */
  async dragResizeHandle(deltaX: number): Promise<void> {
    const box = await this.resizeHandle.boundingBox();
    if (!box)
      throw new Error("resize handle not found — is agentic mode active?");
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;
    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(startX + deltaX, startY, { steps: 20 });
    await this.page.mouse.up();
    // Brief settle for layout recalculation
    await this.page.waitForTimeout(100);
  }

  // ── Measurement helpers ───────────────────────────────────────────────────

  /**
   * Get the current pixel width of the Valeria sidebar slot.
   * Returns 0 if the element is not visible.
   */
  async getValeriaWidth(): Promise<number> {
    const box = await this.valeriaSlot.boundingBox();
    return box?.width ?? 0;
  }

  /**
   * Get the current pixel width of the App panel slot.
   * Returns 0 if the element is not visible.
   */
  async getAppSlotWidth(): Promise<number> {
    const box = await this.appSlot.boundingBox();
    return box?.width ?? 0;
  }

  /**
   * Get the raw localStorage value for the split panel persistence key.
   * react-resizable-panels v4 stores this as a JSON array of percentages.
   */
  async getPersistedSplit(): Promise<string | null> {
    return await this.page.evaluate(
      (key) => localStorage.getItem(key),
      SHELL_SPLIT_KEY,
    );
  }

  /**
   * Get the parsed shell store state from localStorage.
   * Returns null if key is absent or JSON parse fails.
   */
  async getStorageState(): Promise<ShellStorageState | null> {
    return await this.page.evaluate((key) => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as { state?: ShellStorageState };
        return parsed.state ?? null;
      } catch {
        return null;
      }
    }, SHELL_STORAGE_KEY);
  }

  // ── Visibility helpers ────────────────────────────────────────────────────

  /**
   * Returns true if the resize handle is visible (agentic desktop mode).
   */
  async isResizeHandleVisible(): Promise<boolean> {
    try {
      await this.resizeHandle.waitFor({ state: "visible", timeout: 3_000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns true if the Valeria slot is visible (desktop non-mobile).
   */
  async isValeriaSlotVisible(): Promise<boolean> {
    try {
      const box = await this.valeriaSlot.boundingBox();
      if (!box || box.width === 0) return false;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the top bar height in pixels.
   */
  async getTopBarHeight(): Promise<number> {
    const box = await this.topBar.boundingBox();
    return box?.height ?? 0;
  }

  /**
   * Get the total width of the resizable panel group container (PanelGroup).
   * Used to compute dynamic min/max widths with Fase 7A ResizeObserver clamp [10, 70]%.
   * Returns the sum of ValeriaSlot + AppSlot widths (the panel group's visible width).
   */
  async getMainContainerWidth(): Promise<number> {
    // The panel group container holds both panels; its width = valeriaWidth + appWidth
    const valeriaBox = await this.valeriaSlot.boundingBox();
    const appBox = await this.appSlot.boundingBox();
    return (valeriaBox?.width ?? 0) + (appBox?.width ?? 0);
  }
}
