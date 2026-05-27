/**
 * presencia-section.pom.ts — PresenciaSectionPage POM
 *
 * Page object for the Presencia sub-sub-tab within lisa/marca.
 * Covers: website + social media (instagram/tiktok/google-business) fields,
 * trust signals management (PE hybrid catalog + free-text "Otra"),
 * and address/phone contact fields.
 *
 * No assertions in POM methods (assertions live in spec files).
 *
 * downstream-regression-na: brand-local vitalia e2e POM F2-S7
 *
 * @see 04-validators.yaml § test_construction_plan step 8
 */

import type { Page, Locator } from "@playwright/test";

export class PresenciaSectionPage {
  readonly page: Page;

  // ---------------------------------------------------------------------------
  // Section container
  // ---------------------------------------------------------------------------

  readonly sectionRoot: Locator;

  // ---------------------------------------------------------------------------
  // Digital presence fields
  // ---------------------------------------------------------------------------

  /** Website URL input */
  readonly websiteInput: Locator;

  /** Instagram handle input */
  readonly instagramInput: Locator;

  /** TikTok handle input */
  readonly tiktokInput: Locator;

  /** Google Business URL input */
  readonly googleBusinessInput: Locator;

  // ---------------------------------------------------------------------------
  // Address / phone contact
  // ---------------------------------------------------------------------------

  /** Address input */
  readonly addressInput: Locator;

  /** Phone input */
  readonly phoneInput: Locator;

  // ---------------------------------------------------------------------------
  // Trust signals
  // ---------------------------------------------------------------------------

  /** Trust signals section container */
  readonly trustSignalsSection: Locator;

  /** Trust signals list (existing items) */
  readonly trustSignalsList: Locator;

  /** Trust catalog dropdown/combobox trigger */
  readonly trustCatalogTrigger: Locator;

  /** Trust catalog options list */
  readonly trustCatalogOptions: Locator;

  /** Custom trust signal "Otra" free-text input */
  readonly customTrustSignalInput: Locator;

  /** Add trust signal confirm button */
  readonly addTrustSignalButton: Locator;

  /** Empty state for trust signals (no items yet) */
  readonly trustSignalsEmptyState: Locator;

  // ---------------------------------------------------------------------------
  // Constructor
  // ---------------------------------------------------------------------------

  constructor(page: Page) {
    this.page = page;

    this.sectionRoot = page.locator(
      '[data-testid="presencia-section-root"]',
    );

    // Digital presence
    this.websiteInput = page.locator(
      '[data-testid="contact-website-input"]',
    );
    this.instagramInput = page.locator(
      '[data-testid="contact-instagram-input"]',
    );
    this.tiktokInput = page.locator('[data-testid="contact-tiktok-input"]');
    this.googleBusinessInput = page.locator(
      '[data-testid="contact-google-business-input"]',
    );

    // Address / phone
    this.addressInput = page.locator('[data-testid="contact-address-input"]');
    this.phoneInput = page.locator('[data-testid="contact-phone-input"]');

    // Trust signals
    this.trustSignalsSection = page.locator(
      '[data-testid="trust-signals-section"]',
    );
    this.trustSignalsList = page.locator(
      '[data-testid="trust-signals-list"]',
    );
    this.trustCatalogTrigger = page.locator(
      '[data-testid="trust-catalog-trigger"]',
    );
    this.trustCatalogOptions = page.locator(
      '[data-testid="trust-catalog-options"]',
    );
    this.customTrustSignalInput = page.locator(
      '[data-testid="trust-signal-custom-input"]',
    );
    this.addTrustSignalButton = page.locator(
      '[data-testid="trust-signal-add-button"]',
    );
    this.trustSignalsEmptyState = page.locator(
      '[data-testid="trust-signals-empty-state"]',
    );
  }

  // ---------------------------------------------------------------------------
  // Digital presence helpers
  // ---------------------------------------------------------------------------

  /**
   * Fills the website URL input.
   */
  async fillWebsite(url: string): Promise<void> {
    await this.websiteInput.click();
    await this.websiteInput.fill(url);
  }

  /**
   * Returns the current website input value.
   */
  async getWebsiteValue(): Promise<string> {
    return this.websiteInput.inputValue();
  }

  /**
   * Fills the Instagram handle input.
   */
  async fillInstagram(handle: string): Promise<void> {
    await this.instagramInput.click();
    await this.instagramInput.fill(handle);
  }

  /**
   * Fills the TikTok handle input.
   */
  async fillTikTok(handle: string): Promise<void> {
    await this.tiktokInput.click();
    await this.tiktokInput.fill(handle);
  }

  /**
   * Fills the Google Business URL input.
   */
  async fillGoogleBusiness(url: string): Promise<void> {
    await this.googleBusinessInput.click();
    await this.googleBusinessInput.fill(url);
  }

  // ---------------------------------------------------------------------------
  // Trust signal helpers
  // ---------------------------------------------------------------------------

  /**
   * Returns the number of trust signal items currently displayed.
   */
  async getTrustSignalCount(): Promise<number> {
    const items = this.trustSignalsList.locator(
      '[data-testid^="trust-signal-item-"]',
    );
    return items.count();
  }

  /**
   * Selects a trust signal from the PE catalog dropdown.
   * @param catalogLabel - The label text of the catalog item to select.
   */
  async selectTrustSignal(catalogLabel: string): Promise<void> {
    await this.trustCatalogTrigger.click();
    await this.trustCatalogOptions
      .locator(`text="${catalogLabel}"`)
      .first()
      .click();
  }

  /**
   * Adds a custom (free-text "Otra") trust signal.
   * @param customValue - The free text value for the custom signal.
   */
  async addCustomTrustSignal(customValue: string): Promise<void> {
    // Open catalog and select "Otra"
    await this.trustCatalogTrigger.click();
    await this.trustCatalogOptions.locator('text="Otra"').first().click();

    // Fill custom input (appears after selecting "Otra")
    await this.customTrustSignalInput.fill(customValue);
    await this.addTrustSignalButton.click();
  }

  /**
   * Removes a trust signal by its display position (0-indexed).
   * Clicks the remove button for the item at the given index.
   */
  async removeTrustSignal(index: number): Promise<void> {
    const items = this.trustSignalsList.locator(
      '[data-testid^="trust-signal-item-"]',
    );
    const item = items.nth(index);
    await item
      .locator('[data-testid="trust-signal-remove-button"]')
      .click();
  }

  /**
   * Returns an array of trust signal display values currently visible.
   */
  async getTrustSignalValues(): Promise<string[]> {
    const items = this.trustSignalsList.locator(
      '[data-testid^="trust-signal-item-"]',
    );
    const count = await items.count();
    const values: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await items
        .nth(i)
        .locator('[data-testid="trust-signal-value"]')
        .textContent();
      values.push(text ?? "");
    }
    return values;
  }

  /**
   * Returns whether the trust signals empty state is visible.
   */
  async isTrustSignalsEmptyStateVisible(): Promise<boolean> {
    return this.trustSignalsEmptyState.isVisible();
  }

  /**
   * Waits until the trust signals list renders (skeleton gone).
   */
  async waitForTrustSignalsLoaded(timeoutMs: number = 10_000): Promise<void> {
    await this.page
      .locator('[data-testid="trust-signals-loading-skeleton"]')
      .waitFor({ state: "hidden", timeout: timeoutMs });
    await this.trustSignalsSection.waitFor({
      state: "visible",
      timeout: timeoutMs,
    });
  }
}
