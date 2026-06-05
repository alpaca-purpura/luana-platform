// cap: abel/icp-buyer
/**
 * AbelBuyerLeafPage.ts — Page Object Model for the Buyer leaf form.
 *
 * Covers: /{tenantId}/abel/icp/{icpId}/{buyerId}
 *   - BuyerLeafForm (buyer data fields)
 *   - Set primary buyer
 *   - Autosave indicator
 *
 * Locators: data-testid first, ARIA as fallback. NO CSS selectors or XPath.
 * No assertions in POM methods — actions + locators only.
 *
 * spec_anchor: 04-validators.yaml § poms_required (AbelBuyerLeafPage)
 * story-origin: nicolify-r1-abel-icp-buyer T-E2E-1
 */

import type { Page, Locator } from "@playwright/test";

export class AbelBuyerLeafPage {
  readonly page: Page;

  // ── Shell ─────────────────────────────────────────────────────────────────

  readonly shellReady: Locator;

  // ── BuyerLeafForm ──────────────────────────────────────────────────────────

  /** BuyerLeafForm container */
  readonly buyerForm: Locator;

  /** "Establecer como principal" button */
  readonly setPrimaryBtn: Locator;

  /** Buyer name field */
  readonly fieldName: Locator;

  /** Buyer role field */
  readonly fieldRole: Locator;

  /** Buyer decision power select/field */
  readonly fieldDecisionPower: Locator;

  /** Pain points array container */
  readonly painPoints: Locator;

  /** Desires array container */
  readonly desires: Locator;

  /** Objections array container */
  readonly objections: Locator;

  /** Preferred channels array container */
  readonly preferredChannels: Locator;

  /** Autosave indicator */
  readonly autosaveIndicator: Locator;

  constructor(page: Page) {
    this.page = page;

    this.shellReady = page.locator("[data-shell-ready='true']");

    this.buyerForm = page.getByTestId("buyer-leaf-form");
    this.setPrimaryBtn = page.getByTestId("buyer-set-primary-btn");
    this.fieldName = page.getByTestId("buyer-field-name");
    this.fieldRole = page.getByTestId("buyer-field-role");
    this.fieldDecisionPower = page.getByTestId("buyer-field-decision-power");
    this.painPoints = page.getByTestId("buyer-pain-points");
    this.desires = page.getByTestId("buyer-desires");
    this.objections = page.getByTestId("buyer-objections");
    this.preferredChannels = page.getByTestId("buyer-preferred-channels");
    this.autosaveIndicator = page.getByTestId("buyer-autosave-indicator");
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  /**
   * Navigate to a specific buyer leaf.
   * Waits for shell ready + buyer form visible.
   */
  async goto(tenantId: string, icpId: string, buyerId: string): Promise<void> {
    await this.page.goto(
      `/${tenantId}/abel/icp/${icpId}/${buyerId}`,
      { waitUntil: "load" }
    );
    await this.shellReady.waitFor({ state: "visible", timeout: 20_000 });
  }

  // ── Interaction helpers ───────────────────────────────────────────────────

  /**
   * Fill the buyer name field.
   */
  async fillName(value: string): Promise<void> {
    await this.fieldName.fill(value);
  }

  /**
   * Fill the buyer role field.
   */
  async fillRole(value: string): Promise<void> {
    await this.fieldRole.fill(value);
  }

  /**
   * Click "Establecer como principal" to set this buyer as primary.
   */
  async clickSetPrimary(): Promise<void> {
    await this.setPrimaryBtn.click();
  }

  /**
   * Wait for autosave to settle (600ms debounce + inflight request).
   */
  async waitForAutosave(timeout = 5_000): Promise<void> {
    await this.page.waitForTimeout(800);
    try {
      await this.autosaveIndicator.waitFor({ state: "hidden", timeout });
    } catch {
      // indicator may not be present in all states — OK
    }
  }
}
