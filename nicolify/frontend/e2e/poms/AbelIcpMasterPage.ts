// cap: abel/icp-buyer
/**
 * AbelIcpMasterPage.ts — Page Object Model for the ICP master list view.
 *
 * Covers: /{tenantId}/abel/icp (lista de ICPs)
 *   - DraftFirstStarter (empty state when no ICPs)
 *   - IcpCard grid (list state with cards)
 *   - "Generar con Abel" and "+ Nuevo" CTAs
 *   - UniversalIntakeModal trigger
 *
 * Locators: data-testid first, ARIA as fallback. NO CSS selectors or XPath.
 * No assertions in POM methods — actions + locators only.
 *
 * spec_anchor: 04-validators.yaml § poms_required (AbelIcpMasterPage)
 * story-origin: nicolify-r1-abel-icp-buyer T-E2E-1
 */

import type { Page, Locator } from "@playwright/test";

export class AbelIcpMasterPage {
  readonly page: Page;

  // ── Structural locators ────────────────────────────────────────────────────

  /** Shell ready indicator */
  readonly shellReady: Locator;

  /** ICP master empty state (DraftFirstStarter) */
  readonly emptyState: Locator;

  /** DraftFirstStarter container (shown when no ICPs) */
  readonly draftFirstStarter: Locator;

  /** "Generar con Abel" CTA inside DraftFirstStarter */
  readonly generateWithAbelBtn: Locator;

  /** "+ En blanco" / "Nuevo en blanco" CTA inside DraftFirstStarter */
  readonly blankBtn: Locator;

  /** ICP master list container (shown when ICPs exist) */
  readonly masterList: Locator;

  /** "+ Nuevo ICP" / add button in the header/toolbar */
  readonly addBtn: Locator;

  /** Grid of ICP cards */
  readonly cardGrid: Locator;

  /** Loading state of the master list */
  readonly loadingState: Locator;

  /** Error state of the master list */
  readonly errorState: Locator;

  constructor(page: Page) {
    this.page = page;

    this.shellReady = page.locator("[data-shell-ready='true']");
    this.emptyState = page.getByTestId("icp-master-empty");
    this.draftFirstStarter = page.getByTestId("draft-first-starter");
    this.generateWithAbelBtn = page.getByTestId("draft-first-generate-btn");
    this.blankBtn = page.getByTestId("draft-first-blank-btn");
    this.masterList = page.getByTestId("icp-master-list");
    this.addBtn = page.getByTestId("icp-master-add-btn");
    this.cardGrid = page.getByTestId("icp-card-grid");
    this.loadingState = page.getByTestId("icp-master-loading");
    this.errorState = page.getByTestId("icp-master-error");
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  /**
   * Navigate to the ICP master list.
   * Waits for shell to be ready (hydration complete).
   */
  async goto(tenantId: string): Promise<void> {
    await this.page.goto(`/${tenantId}/abel/icp`, { waitUntil: "load" });
    await this.shellReady.waitFor({ state: "visible", timeout: 20_000 });
  }

  // ── State helpers ─────────────────────────────────────────────────────────

  /**
   * Wait for the master list to be in one of the stable states:
   * empty (DraftFirstStarter), loaded (cardGrid visible), or error.
   */
  async waitForStableState(timeout = 20_000): Promise<"empty" | "loaded" | "error"> {
    const resolved = await Promise.race([
      this.emptyState.waitFor({ state: "visible", timeout }).then(() => "empty" as const),
      this.masterList.waitFor({ state: "visible", timeout }).then(() => "loaded" as const),
      this.errorState.waitFor({ state: "visible", timeout }).then(() => "error" as const),
    ]);
    return resolved;
  }

  // ── Card helpers ──────────────────────────────────────────────────────────

  /**
   * Get a specific ICP card by its ID.
   */
  icpCard(icpId: string): Locator {
    return this.page.getByTestId(`icp-card-${icpId}`);
  }

  /**
   * Click an ICP card to navigate to its detail page.
   */
  async clickIcpCard(icpId: string): Promise<void> {
    await this.icpCard(icpId).click();
  }

  // ── Intake modal trigger ──────────────────────────────────────────────────

  /**
   * Click "Generar con Abel" to open the UniversalIntakeModal.
   */
  async openIntakeViaGenerate(): Promise<void> {
    await this.generateWithAbelBtn.click();
  }

  /**
   * Click the add button (+ Nuevo ICP) in list state.
   */
  async clickAddBtn(): Promise<void> {
    await this.addBtn.click();
  }

  // ── URL helpers ───────────────────────────────────────────────────────────

  /**
   * Returns whether the current URL matches the ICP master route for the given tenant.
   */
  isOnMasterRoute(tenantId: string): boolean {
    return this.page.url().includes(`/${tenantId}/abel/icp`);
  }
}
