/**
 * ShellLayoutPage.ts — Page Object Model para ShellOrganismLayout
 *
 * F1-S4 vitalia-fase1-shell-layout-5050 — T-7
 * Extended vitalia-shell-state-persistence T-5:
 *   - openMobileDrawerViaBurger(): tap burger, waits for role=dialog
 *   - isMobileDrawerOpen(): check if mobile drawer (role=dialog) present
 *   - getMobileDrawerSlice(): read mobileDrawerOpen from localStorage
 *   - instrumentSetItem(): install spy; getSetItemWrites(): collect writes
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

  /** Valeria sidebar aside[data-testid="valeria-sidebar"] (real component since F1-S5) */
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
    // F1-S5 replaced the ValeriaSidebarSlot placeholder with the real ValeriaSidebar
    // component (testid "valeria-sidebar"). Updated 2026-05-28 (F1-S4b race-fix) — the
    // old "valeria-sidebar-slot" testid no longer exists in the DOM.
    this.valeriaSlot = page
      .getByTestId("valeria-sidebar")
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

  /**
   * Await a stable post-hydration layout in agentic desktop mode.
   *
   * topBar visibility alone fires at the SSR-skeleton stage — BEFORE the
   * dynamic({ssr:false}) client chunk mounts, the ResizeObserver measures, and
   * the Fix A snap-up reconciles. Measuring panel widths before this settles is
   * the SC-3 transition+drag-immediately race (F1-S4b). The agentic main exposes
   * `data-shell-ready="true"` once reconciliation completes; await it for a
   * deterministic measurement point.
   *
   * No-op outside agentic desktop (web/mobile mains carry no readiness attribute).
   */
  async waitForShellReady(): Promise<void> {
    await this.page
      .locator('main#main-content[data-shell-ready="true"]')
      .first()
      .waitFor({ state: "visible", timeout: 30_000 });
  }

  /**
   * Anchor the browser's *sequential focus navigation starting point* to the
   * very top of the document, so the NEXT `keyboard.press("Tab")` lands on the
   * first focusable element in DOM order (the WCAG skip-link).
   *
   * ─── WHY THIS EXISTS (read before touching focus-order assertions) ─────────
   * The shell mounts via `dynamic({ ssr: false })`: an SSR skeleton is swapped
   * for the real client shell after hydration. When Chromium replaces that
   * <main> subtree, the *sequential focus navigation starting point* (a browser
   * concept SEPARATE from `document.activeElement`) is left anchored INSIDE the
   * new subtree (≈ the chat composer), NOT at the document start — even though
   * `document.activeElement` is still <body> and nothing stole focus
   * (verified: `focusin` trace empty during mount, no focus trap, no `inert`,
   * no `aria-hidden`, all controls `tabIndex=0`, DOM order is correct).
   *
   * Net effect in tests: a bare `keyboard.press("Tab")` right after load jumps
   * mid-shell and SKIPS the skip-link — a Chromium + dynamic-SSR artifact, NOT
   * a real focus-order defect in the components (a real keyboard user arriving
   * from the URL bar, or after any click/scroll, gets the correct order).
   *
   * This helper neutralizes that artifact deterministically by focusing <body>
   * with a transient `tabindex="-1"` then clearing it — leaving the page in the
   * exact "fresh, no prior interaction" state with the starting point at the top.
   *
   * ─── WHEN TO USE ───────────────────────────────────────────────────────────
   * Call it AFTER `gotoShell()` / `waitForShellReady()` and BEFORE the first
   * `keyboard.press("Tab")` in ANY test that asserts tab ORDER or skip-link
   * reachability on the dynamically-mounted shell.
   *
   * ─── WHAT NOT TO DO (anti-patterns) ────────────────────────────────────────
   * - Do NOT "fix" this by adding `autoFocus`/`.focus()` in the shell component
   *   — auto-focusing a control on mount is itself a WCAG anti-pattern and would
   *   steal focus from real users. The DOM/tabindex are already correct.
   * - Do NOT use `body.focus()` alone — <body> isn't focusable without a
   *   tabindex, so it does NOT re-anchor the starting point (verified: still
   *   lands on the composer).
   * - Do NOT use `activeElement.blur()` — that leaves the stale starting point
   *   untouched (verified: still lands on the composer).
   *
   * Learning SSoT: vitalia/docs/learnings/2026-05-28-dynamic-ssr-tab-start-anchor.md
   */
  async resetTabSequenceToStart(): Promise<void> {
    await this.page.evaluate(() => {
      const b = document.body;
      b.setAttribute("tabindex", "-1");
      b.focus();
      b.removeAttribute("tabindex");
    });
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

  // ── Mobile drawer helpers (T-5 vitalia-shell-state-persistence) ───────────

  /**
   * Tap the hamburger burger button (data-testid="topbar-hamburger") to open
   * the mobile Valeria drawer. Waits for the drawer dialog to appear.
   *
   * Precondition: page must be loaded at a mobile viewport (<768px).
   */
  async openMobileDrawerViaBurger(): Promise<void> {
    const burger = this.page.getByTestId("topbar-hamburger");
    await burger.waitFor({ state: "visible", timeout: 15_000 });
    await burger.click();
    // Wait for the drawer to appear
    await this.page
      .locator('[role="dialog"][data-testid="valeria-sidebar"]')
      .waitFor({ state: "visible", timeout: 15_000 });
  }

  /**
   * Close the mobile Valeria drawer via the close button (X inside the drawer).
   *
   * Precondition: mobile drawer must be open (role=dialog visible).
   */
  async closeMobileDrawer(): Promise<void> {
    const closeBtn = this.page.getByTestId("valeria-drawer-close");
    await closeBtn.click();
    // Wait for dialog to disappear
    await this.page
      .locator('[role="dialog"][data-testid="valeria-sidebar"]')
      .waitFor({ state: "hidden", timeout: 15_000 });
  }

  /**
   * Returns true if the mobile Valeria drawer (role=dialog) is currently visible.
   * Uses a short timeout to avoid flakiness on transitions.
   */
  async isMobileDrawerOpen(): Promise<boolean> {
    try {
      const drawer = this.page.locator(
        '[role="dialog"][data-testid="valeria-sidebar"]',
      );
      await drawer.waitFor({ state: "visible", timeout: 3_000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read the `mobileDrawerOpen` field from the shell store's localStorage slice.
   * Returns null if the key is absent or parse fails.
   */
  async getMobileDrawerSlice(): Promise<boolean | null> {
    return await this.page.evaluate((key) => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as {
          state?: { mobileDrawerOpen?: boolean };
        };
        const val = parsed.state?.mobileDrawerOpen;
        if (typeof val !== "boolean") return null;
        return val;
      } catch {
        return null;
      }
    }, SHELL_STORAGE_KEY);
  }

  /**
   * Install a localStorage.setItem spy via page.addInitScript-equivalent at runtime.
   * Call BEFORE navigation so all writes are captured from the start.
   *
   * After calling this, use getSetItemWrites() to retrieve all captured calls.
   *
   * HOW IT WORKS:
   *   Overrides localStorage.setItem with a wrapper that pushes each call into
   *   window.__setItemWrites (key, value). The original setItem is still called —
   *   this is non-destructive spy, not a mock.
   *
   * USE CASE (SC-3 adversarial):
   *   Prove that 'full' is NEVER written to the shell storage key when 'rail' was saved.
   */
  async instrumentSetItem(): Promise<void> {
    await this.page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      if (w.__setItemInstrumented) return; // idempotent
      w.__setItemWrites = [] as Array<{ key: string; value: string }>;
      const orig = localStorage.setItem.bind(localStorage);
      localStorage.setItem = (key: string, value: string) => {
        w.__setItemWrites.push({ key, value });
        orig(key, value);
      };
      w.__setItemInstrumented = true;
    });
  }

  /**
   * Retrieve all localStorage.setItem calls captured since instrumentSetItem().
   * Each entry is { key, value } as passed to setItem.
   */
  async getSetItemWrites(): Promise<Array<{ key: string; value: string }>> {
    return await this.page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (window as any).__setItemWrites ?? [];
    });
  }
}
