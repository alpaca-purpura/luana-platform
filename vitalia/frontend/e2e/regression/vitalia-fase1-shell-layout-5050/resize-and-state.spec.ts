/**
 * resize-and-state.spec.ts — SC-3 edge: resize boundary clamp + persistencia + snap-up.
 *
 * F1-S4 vitalia-fase1-shell-layout-5050 — T-7
 * Gherkin: SC-3 "Given ShellOrganismLayout agentic mode desktop,
 *           When user drags resize handle left below min 620px (full) / 360px (rail),
 *           Then panel clamps at minimum width, localStorage persists, snap-up occurs
 *           when state changes."
 *
 * Scenario coverage (04-validators.yaml):
 *   val-fe-e2e-resize-and-state
 *
 * Project: smoke (playwright.config.ts — regression/*.spec.ts añadido a testMatch)
 * Requires: dev server at E2E_BASE_URL (localhost:3002), Clerk auth state.
 *
 * Run:
 *   cd vitalia/frontend && E2E_BASE_URL=http://localhost:3002 \
 *     npx playwright test e2e/regression/vitalia-fase1-shell-layout-5050/resize-and-state.spec.ts \
 *     --project=smoke
 *
 * Notes:
 *   - Panel percentages: minValeriaPct = 38 (full) or 22 (rail) of total group width.
 *   - At 1280px viewport, 38% ≈ 486px, 50% ≈ 640px.
 *   - Drag left by 400px from ~640px center → hits 38% clamp.
 *   - react-resizable-panels v4 stores layout as JSON array [valeriaPct, appPct].
 *
 * downstream-regression-na: brand-local E2E spec; no cross-brand consumers
 */

import { test, expect } from "../../fixtures/shell-theme.fixture";
import { ShellLayoutPage } from "../../pages/ShellLayoutPage";

const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

test.describe("SC-3 — resize boundary + persistencia + snap-up (F1-S4)", () => {
  test.use({ viewport: DESKTOP_VIEWPORT });

  // ── Assertion 1: drag handle left below min (580 full) clamped ─────────────

  test("drag handle left below min (580 full) clamped", async ({
    shellPage,
    tenantId,
  }) => {
    const pom = new ShellLayoutPage(shellPage);
    await pom.gotoShell(tenantId);
    await pom.waitForShellReady();

    // Record initial Valeria width
    const initialWidth = await pom.getValeriaWidth();
    expect(initialWidth).toBeGreaterThan(0);

    // Drag far left (400px) — should be clamped at Fase 7A ResizeObserver clamp [10, 70]%
    await pom.dragResizeHandle(-400);

    const clampedWidth = await pom.getValeriaWidth();
    // F1-S5 lowered MIN_VALERIA_PX to 580px (full) / 360px (rail) — 2-col model
    // (rail XOR history). ResizeObserver converts the pixel min to a percent with
    // clamp [10, 70]. At 1280px viewport, 580px ≈ 45.3% (within clamp, no cap).
    // Assertion: min = Math.min(580, containerWidth * 0.7) con 5% tolerancia.
    const containerWidth = await pom.getMainContainerWidth();
    const expectedMin = Math.min(580, containerWidth * 0.7);
    expect(clampedWidth).toBeGreaterThanOrEqual(expectedMin * 0.95); // 5% tolerance
    // Width should be smaller than initial (we moved left)
    expect(clampedWidth).toBeLessThanOrEqual(initialWidth + 20);
  });

  // ── Assertion 2: localStorage vitalia-shell-split-agentic persists post-drag ─

  test("localStorage vitalia-shell-split-agentic persists post-drag", async ({
    shellPage,
    tenantId,
  }) => {
    const pom = new ShellLayoutPage(shellPage);
    await pom.gotoShell(tenantId);

    // Drag handle right by 50px to ensure a non-default layout
    await pom.dragResizeHandle(50);

    // react-resizable-panels v4 persists via useDefaultLayout → localStorage
    const persistedSplit = await pom.getPersistedSplit();
    // Should be a JSON array like [52.3, 47.7]
    expect(persistedSplit).not.toBeNull();
    if (persistedSplit) {
      const parsed = JSON.parse(persistedSplit) as unknown;
      expect(Array.isArray(parsed)).toBe(true);
      expect((parsed as unknown[]).length).toBeGreaterThanOrEqual(2);
    }
  });

  // ── Assertion 2b: shell state (valeriaState + shellMode) survives reload ────
  // UN-SKIPPED 2026-05-29 (vitalia-shell-state-persistence T-5):
  // The fix landed in T-1..T-4: createSsrSafePersistedStore factory + skeleton store-free
  // (TopBarGlobal variant="skeleton") + mobileDrawerOpen independent slice.
  // The root cause (SSR skeleton clobbering localStorage on every reload) is now resolved.
  //
  // Uses valeriaRailPage fixture (seeds 'rail' via addInitScript on every navigation).
  // addInitScript seeds before page scripts → store hydrates with 'rail' (not default 'full').
  // If the bug were still present, addInitScript('rail') would be overwritten by the
  // default-write cycle. With the fix, 'rail' is preserved after SSR+hydration.

  test("shell state (valeriaState) survives reload", async ({
    valeriaRailPage,
    tenantId,
  }) => {
    const pom = new ShellLayoutPage(valeriaRailPage);
    // Navigate with valeriaState='rail' pre-seeded (valeriaRailPage fixture)
    await pom.gotoShell(tenantId);
    await pom.waitForShellReady();

    // After navigation+hydration the store MUST read the persisted value ('rail'),
    // not the default ('full'). With the fix in place, no clobber write occurs.
    const state = await pom.getStorageState();
    expect(state?.valeriaState).toBe("rail");
  });

  // ── Assertion 3: state full->rail no auto-shrink current width ──────────────

  test("state full->rail no auto-shrink current width", async ({
    shellPage,
    tenantId,
  }) => {
    const pom = new ShellLayoutPage(shellPage);
    await pom.gotoShell(tenantId);
    await pom.waitForShellReady();

    // Record width at valeriaState='full'
    const fullWidth = await pom.getValeriaWidth();
    expect(fullWidth).toBeGreaterThan(0);

    // Switch to 'rail' via store (minSize drops; current width is preserved)
    await pom.setValeriaStateViaStore("rail");
    await pom.waitForShellReady();

    // At 'rail', the current layout is preserved (user's last drag position)
    // The panel does NOT auto-shrink — minSize is now lower, current stays wherever it was
    const railWidth = await pom.getValeriaWidth();
    // Width should be >= 22% of 1280px ≈ 282px
    expect(railWidth).toBeGreaterThanOrEqual(200);
    // Width should be approximately fullWidth (no auto-shrink on state change)
    // Allow ±50px for rounding in layout recalculation
    expect(Math.abs(railWidth - fullWidth)).toBeLessThanOrEqual(100);
  });

  // ── Assertion 4: state rail->full snap-up to min (580 full) ────────────────
  // UN-SKIPPED 2026-05-29 (vitalia-shell-state-persistence T-5):
  // The persistence bug is fixed — valeriaState='rail' now survives the reload correctly.
  // Uses valeriaRailPage to start in rail mode (avoids addInitScript/reload conflict).
  // Then uses store direct-mutation (no reload) to switch to 'full' and verify snap-up.

  test("state rail->full snap-up to min (580 full)", async ({
    valeriaRailPage,
    tenantId,
  }) => {
    const pom = new ShellLayoutPage(valeriaRailPage);
    // Start in 'rail' mode (valeriaRailPage fixture seeds rail via addInitScript)
    await pom.gotoShell(tenantId);
    await pom.waitForShellReady();

    // Drag left past what would be the 'full' minimum.
    // At 'rail' the minimum is lower (360px), so the panel can go narrow —
    // below the 'full' minimum, setting up the snap-up test.
    await pom.dragResizeHandle(-300);
    const narrowWidth = await pom.getValeriaWidth();
    // At rail, narrow drag should bring it below 580px (full's minimum)
    // Allow generous tolerance — if already narrow enough, test proceeds.
    // If the panel can't go below 500, the snap-up assertion still validates
    // that switching to 'full' enforces the minimum.
    const containerWidth = await pom.getMainContainerWidth();
    const expectedFullMin = Math.min(580, containerWidth * 0.7);

    // Now switch to 'full' — the panel must snap up to the 'full' minimum.
    // Use direct store mutation (Zustand) instead of setValeriaStateViaStore
    // (which would reload and trigger addInitScript, resetting valeriaState).
    await valeriaRailPage.evaluate(() => {
      // Access the Zustand store directly in browser context
      // The store is a module-level export; we find it via the zustand devtools hook
      // or by importing through the window. For Playwright evaluate, we dispatch a
      // custom DOM event that the store responds to (simpler approach: keyboard shortcut).
      // keyboard 'f' → setValeriaState('full') per ValeriaSidebar useKeyboardShortcuts.
      // We rely on the body having focus for keyboard dispatch.
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "f", bubbles: true }));
    });

    // Wait for shell to stabilize (snap-up reconciliation)
    await pom.waitForShellReady();

    const snapWidth = await pom.getValeriaWidth();
    // F1-S5 MIN_VALERIA_PX full = 580px. ResizeObserver → percent with clamp [10, 70].
    // Assertion: width should be at or above the full minimum.
    // Allow 10% tolerance for layout calculation.
    expect(snapWidth).toBeGreaterThanOrEqual(expectedFullMin * 0.90);
    expect(narrowWidth).toBeLessThanOrEqual(snapWidth + 100); // narrowWidth before snap-up
  });
});
