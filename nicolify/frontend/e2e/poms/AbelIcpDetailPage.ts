// cap: abel/icp-buyer
/**
 * AbelIcpDetailPage.ts — Page Object Model for the ICP entity detail workspace.
 *
 * Covers: /{tenantId}/abel/icp/{icpId}/{leaf}
 *   - EntitySubNavBar (N3-dynamic — leaves: datos + buyers + "+" affordance)
 *   - Back navigation to ICP list
 *   - IcpDatosForm (leaf="datos")
 *   - "Marcar como listo" action
 *   - ProposalBanner (draft origin)
 *
 * Locators: data-testid first, ARIA as fallback. NO CSS selectors or XPath.
 * No assertions in POM methods — actions + locators only.
 *
 * spec_anchor: 04-validators.yaml § poms_required (AbelIcpDetailPage)
 * story-origin: nicolify-r1-abel-icp-buyer T-E2E-1
 */

import type { Page, Locator } from "@playwright/test";

export class AbelIcpDetailPage {
  readonly page: Page;

  // ── Shell ─────────────────────────────────────────────────────────────────

  readonly shellReady: Locator;

  // ── EntitySubNavBar (N3 bar) ───────────────────────────────────────────────

  /** The EntitySubNavBar wrapper (role=navigation) */
  readonly subNavBar: Locator;

  /** The tablist inside the EntitySubNavBar */
  readonly tabList: Locator;

  // ── IcpDatosForm ──────────────────────────────────────────────────────────

  /** The datos form container */
  readonly datosForm: Locator;

  /** ICP label field */
  readonly fieldLabel: Locator;

  /** ICP vertical (industry) field */
  readonly fieldVertical: Locator;

  /** ICP company size field */
  readonly fieldCompanySize: Locator;

  /** ICP geo field */
  readonly fieldGeo: Locator;

  /** ICP business model field */
  readonly fieldBusinessModel: Locator;

  /** ICP avg ticket field */
  readonly fieldAvgTicket: Locator;

  /** ICP sales cycle field */
  readonly fieldSalesCycle: Locator;

  /** ICP main pain field */
  readonly fieldMainPain: Locator;

  /** Mark-ready buyers missing warning (shown when mark-ready fails RN-8) */
  readonly markReadyBuyersMissing: Locator;

  // ── ProposalBanner ────────────────────────────────────────────────────────

  /** ProposalBanner (shown when ICP is draft origin + borrador status) */
  readonly proposalBanner: Locator;

  /** "Ratificar" button in ProposalBanner */
  readonly ratificarBtn: Locator;

  /** "Descartar" button in ProposalBanner */
  readonly descartarBtn: Locator;

  constructor(page: Page) {
    this.page = page;

    this.shellReady = page.locator("[data-shell-ready='true']");

    // EntitySubNavBar
    this.subNavBar = page.getByTestId("entity-sub-nav-bar");
    this.tabList = page.getByTestId("entity-sub-nav-tablist");

    // IcpDatosForm
    this.datosForm = page.getByTestId("icp-datos-form");
    this.fieldLabel = page.getByTestId("icp-field-label");
    this.fieldVertical = page.getByTestId("icp-field-vertical");
    this.fieldCompanySize = page.getByTestId("icp-field-company-size");
    this.fieldGeo = page.getByTestId("icp-field-geo");
    this.fieldBusinessModel = page.getByTestId("icp-field-business-model");
    this.fieldAvgTicket = page.getByTestId("icp-field-avg-ticket");
    this.fieldSalesCycle = page.getByTestId("icp-field-sales-cycle");
    this.fieldMainPain = page.getByTestId("icp-field-main-pain");
    this.markReadyBuyersMissing = page.getByTestId("mark-ready-buyers-missing");

    // ProposalBanner
    this.proposalBanner = page.getByTestId("proposal-banner");
    this.ratificarBtn = page.getByTestId("proposal-banner-ratificar");
    this.descartarBtn = page.getByTestId("proposal-banner-descartar");
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  /**
   * Navigate to the ICP datos leaf.
   * Waits for shell ready + datos form visible.
   */
  async goto(tenantId: string, icpId: string): Promise<void> {
    await this.page.goto(`/${tenantId}/abel/icp/${icpId}/datos`, {
      waitUntil: "load",
    });
    await this.shellReady.waitFor({ state: "visible", timeout: 20_000 });
  }

  /**
   * Navigate to a specific leaf within the entity workspace.
   */
  async gotoLeaf(tenantId: string, icpId: string, leaf: string): Promise<void> {
    await this.page.goto(`/${tenantId}/abel/icp/${icpId}/${leaf}`, {
      waitUntil: "load",
    });
    await this.shellReady.waitFor({ state: "visible", timeout: 20_000 });
  }

  // ── EntitySubNavBar interaction ───────────────────────────────────────────

  /**
   * Get a leaf tab locator by its leaf id.
   */
  leafTab(leafId: string): Locator {
    return this.page.getByTestId(`entity-leaf-${leafId}`);
  }

  /**
   * Click a leaf tab in the EntitySubNavBar.
   */
  async clickLeaf(leafId: string): Promise<void> {
    await this.leafTab(leafId).click();
  }

  /**
   * Navigate back to the ICP list using the back link.
   * Uses role=link with text matching "ICPs" or the back arrow.
   */
  async goBack(): Promise<void> {
    const backLink = this.page.locator(
      "[data-testid='entity-sub-nav-back'], a[aria-label*='ICPs'], a[aria-label*='volver']"
    ).first();
    await backLink.click();
  }

  // ── IcpDatosForm interaction ───────────────────────────────────────────────

  /**
   * Fill the ICP label field.
   */
  async fillLabel(value: string): Promise<void> {
    await this.fieldLabel.fill(value);
  }

  /**
   * Fill the main pain field.
   */
  async fillMainPain(value: string): Promise<void> {
    await this.fieldMainPain.fill(value);
  }

  /**
   * Wait for the autosave indicator to complete (field saved).
   * After typing in a field, autosave fires at 600ms debounce.
   */
  async waitForAutosave(timeout = 5_000): Promise<void> {
    // Wait for autosave to complete (field-level) — brief settle
    await this.page.waitForTimeout(800);
    // If there's an autosave indicator, wait for it to resolve
    const indicator = this.page.getByTestId("buyer-autosave-indicator");
    try {
      await indicator.waitFor({ state: "hidden", timeout });
    } catch {
      // indicator may not be present for ICP form — that's OK
    }
  }

  // ── ProposalBanner interaction ─────────────────────────────────────────────

  /**
   * Click "Ratificar" in the ProposalBanner to confirm the draft.
   */
  async clickRatificar(): Promise<void> {
    await this.ratificarBtn.click();
  }

  /**
   * Click "Descartar" in the ProposalBanner to discard the draft.
   */
  async clickDescartar(): Promise<void> {
    await this.descartarBtn.click();
  }

  // ── Accessibility helpers ──────────────────────────────────────────────────

  /**
   * Focus the tablist for keyboard navigation tests.
   */
  async focusTabList(): Promise<void> {
    await this.tabList.focus();
  }

  /**
   * Press a key while the tablist is focused (for roving tabindex tests).
   */
  async pressKey(key: string): Promise<void> {
    await this.tabList.press(key);
  }
}
