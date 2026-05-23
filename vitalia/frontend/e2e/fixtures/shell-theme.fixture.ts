/**
 * shell-theme.fixture.ts — Playwright fixture extending auth.fixture for shell + theme E2E.
 *
 * F1-S4 vitalia-fase1-shell-layout-5050 — T-7
 *
 * Extends auth.fixture.ts to add:
 *   - `shellPage`: authedPage with deterministic localStorage pre-seeded
 *     (shellMode + valeriaState + theme) via addInitScript BEFORE navigation.
 *     Prevents Zustand hydration from reading stale/random state.
 *   - `darkShellPage`: same but forces dark theme for visual goldens.
 *
 * addInitScript executes BEFORE page scripts — deterministic for visual goldens.
 *
 * Shell storage keys (must stay in sync with shell-store.ts):
 *   SHELL_STORAGE_KEY = 'vitalia-shell-state'
 *   SHELL_GROUP_ID    = 'vitalia-shell-split-agentic'
 *
 * Theme key: 'vitalia-theme' (next-themes stores to localStorage).
 *
 * downstream-regression-na: brand-local E2E fixture; no cross-brand consumers
 */

import { test as base } from "../auth.fixture";
import type { Page } from "@playwright/test";
import { ShellLayoutPage } from "../pages/ShellLayoutPage";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SHELL_STORAGE_KEY = "vitalia-shell-state";
const SHELL_SPLIT_KEY = "vitalia-shell-split-agentic";
/** Default split: [50, 50] as react-resizable-panels v4 stores percentages */
const DEFAULT_SPLIT_AGENTIC = JSON.stringify([50, 50]);

// ---------------------------------------------------------------------------
// Fixtures interface
// ---------------------------------------------------------------------------

export interface ShellThemeFixtures {
  /** Authenticated page with agentic shell + valeriaState='full' + light theme pre-seeded. */
  shellPage: Page;
  /** Authenticated page with agentic shell + valeriaState='full' + DARK theme pre-seeded. */
  darkShellPage: Page;
  /** POM instance bound to shellPage. */
  shellPom: ShellLayoutPage;
}

// ---------------------------------------------------------------------------
// Fixture implementation
// ---------------------------------------------------------------------------

/**
 * Seed localStorage deterministically via addInitScript.
 * Runs BEFORE any page script — guarantees Zustand hydrates from this state.
 */
async function seedShellLocalStorage(
  page: Page,
  options: {
    shellMode?: "agentic" | "web";
    valeriaState?: "full" | "rail" | "collapsed";
    theme?: "light" | "dark" | "system";
  } = {},
): Promise<void> {
  const {
    shellMode = "agentic",
    valeriaState = "full",
    theme = "light",
  } = options;

  const shellState = JSON.stringify({
    state: { shellMode, valeriaState },
    version: 0,
  });

  await page.addInitScript(
    ({ shellKey, splitKey, shellStateStr, splitStr, themeKey, themeValue }) => {
      // Seed shell state (Zustand persist format)
      localStorage.setItem(shellKey, shellStateStr);
      // Seed split persistence (react-resizable-panels v4 format)
      localStorage.setItem(splitKey, splitStr);
      // Seed theme (next-themes format)
      localStorage.setItem(themeKey, themeValue);
    },
    {
      shellKey: SHELL_STORAGE_KEY,
      splitKey: SHELL_SPLIT_KEY,
      shellStateStr: shellState,
      splitStr: DEFAULT_SPLIT_AGENTIC,
      themeKey: "vitalia-theme",
      themeValue: theme,
    },
  );
}

// ---------------------------------------------------------------------------
// Extended test with shell-theme fixtures
// ---------------------------------------------------------------------------

export const test = base.extend<ShellThemeFixtures>({
  /**
   * shellPage: authenticated page with deterministic shell state (agentic, full, light).
   * Uses authedPage as base (Clerk token injected + tenantId available).
   */
  shellPage: async ({ authedPage }, use) => {
    await seedShellLocalStorage(authedPage, {
      shellMode: "agentic",
      valeriaState: "full",
      theme: "light",
    });
    await use(authedPage);
  },

  /**
   * darkShellPage: authenticated page with dark theme for visual goldens.
   */
  darkShellPage: async ({ authedPage }, use) => {
    await seedShellLocalStorage(authedPage, {
      shellMode: "agentic",
      valeriaState: "full",
      theme: "dark",
    });
    await use(authedPage);
  },

  /**
   * shellPom: convenience POM bound to shellPage.
   */
  shellPom: async ({ shellPage }, use) => {
    await use(new ShellLayoutPage(shellPage));
  },
});

export { expect } from "@playwright/test";
