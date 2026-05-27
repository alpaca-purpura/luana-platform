/**
 * identidad-section.pom.ts — IdentidadSectionPage POM
 *
 * Page object for the Identidad sub-sub-tab within lisa/marca.
 * Covers: brand name, tagline, description, logo upload, color picker,
 * team preview link, and edit-config (clinic vertical read-only) link.
 *
 * No assertions in POM methods (assertions live in spec files).
 *
 * downstream-regression-na: brand-local vitalia e2e POM F2-S7
 *
 * @see 04-validators.yaml § test_construction_plan step 6
 */

import type { Page, Locator } from "@playwright/test";

export class IdentidadSectionPage {
  readonly page: Page;

  // ---------------------------------------------------------------------------
  // Section container
  // ---------------------------------------------------------------------------

  readonly sectionRoot: Locator;

  // ---------------------------------------------------------------------------
  // Brand name + tagline + description form
  // ---------------------------------------------------------------------------

  /** Brand name input field */
  readonly nameInput: Locator;

  /** Tagline input field */
  readonly taglineInput: Locator;

  /** Description textarea */
  readonly descriptionTextarea: Locator;

  // ---------------------------------------------------------------------------
  // Logo upload
  // ---------------------------------------------------------------------------

  /** Logo drop zone (accepts drag + click-to-browse) */
  readonly logoDropZone: Locator;

  /** File input inside logo drop zone */
  readonly logoFileInput: Locator;

  /** Logo preview image (once uploaded) */
  readonly logoPreviewImage: Locator;

  /** Logo size error alert */
  readonly logoSizeErrorAlert: Locator;

  /** Logo type error alert */
  readonly logoTypeErrorAlert: Locator;

  /** Remove logo button */
  readonly removeLogoButton: Locator;

  // ---------------------------------------------------------------------------
  // Color picker
  // ---------------------------------------------------------------------------

  /** Primary color picker trigger */
  readonly primaryColorPicker: Locator;

  /** Primary color hex input */
  readonly primaryColorHexInput: Locator;

  /** Secondary color picker trigger */
  readonly secondaryColorPicker: Locator;

  /** Secondary color hex input */
  readonly secondaryColorHexInput: Locator;

  // ---------------------------------------------------------------------------
  // Clinic vertical (read-only)
  // ---------------------------------------------------------------------------

  /** Clinic vertical badge (read-only display) */
  readonly clinicVerticalBadge: Locator;

  /** "Editar configuración de clínica" link */
  readonly editConfigLink: Locator;

  // ---------------------------------------------------------------------------
  // Team preview
  // ---------------------------------------------------------------------------

  /** Team member count preview */
  readonly teamPreviewCount: Locator;

  /** "Ver miembros del equipo" link */
  readonly teamPreviewLink: Locator;

  // ---------------------------------------------------------------------------
  // Visual extraction stub
  // ---------------------------------------------------------------------------

  /** "Próximamente" stub button (extraction disabled) */
  readonly extractionStubButton: Locator;

  /** Extraction stub tooltip */
  readonly extractionStubTooltip: Locator;

  // ---------------------------------------------------------------------------
  // Constructor
  // ---------------------------------------------------------------------------

  constructor(page: Page) {
    this.page = page;

    this.sectionRoot = page.locator(
      '[data-testid="identidad-section-root"]',
    );

    // Form fields
    this.nameInput = page.locator('[data-testid="identity-brand-name-input"]');
    this.taglineInput = page.locator(
      '[data-testid="identity-tagline-input"]',
    );
    this.descriptionTextarea = page.locator(
      '[data-testid="identity-description-textarea"]',
    );

    // Logo upload
    this.logoDropZone = page.locator('[data-testid="logo-drop-zone"]');
    this.logoFileInput = page.locator('[data-testid="logo-file-input"]');
    this.logoPreviewImage = page.locator(
      '[data-testid="logo-preview-image"]',
    );
    this.logoSizeErrorAlert = page.locator(
      '[data-testid="logo-size-error-alert"]',
    );
    this.logoTypeErrorAlert = page.locator(
      '[data-testid="logo-type-error-alert"]',
    );
    this.removeLogoButton = page.locator(
      '[data-testid="logo-remove-button"]',
    );

    // Color picker
    this.primaryColorPicker = page.locator(
      '[data-testid="primary-color-picker-trigger"]',
    );
    this.primaryColorHexInput = page.locator(
      '[data-testid="primary-color-hex-input"]',
    );
    this.secondaryColorPicker = page.locator(
      '[data-testid="secondary-color-picker-trigger"]',
    );
    this.secondaryColorHexInput = page.locator(
      '[data-testid="secondary-color-hex-input"]',
    );

    // Clinic vertical (read-only)
    this.clinicVerticalBadge = page.locator(
      '[data-testid="clinic-vertical-badge"]',
    );
    this.editConfigLink = page.locator(
      '[data-testid="edit-clinic-config-link"]',
    );

    // Team preview
    this.teamPreviewCount = page.locator(
      '[data-testid="team-preview-count"]',
    );
    this.teamPreviewLink = page.locator(
      '[data-testid="team-preview-link"]',
    );

    // Visual extraction stub
    this.extractionStubButton = page.locator(
      '[data-testid="visual-extraction-stub-button"]',
    );
    this.extractionStubTooltip = page.locator(
      '[data-testid="visual-extraction-stub-tooltip"]',
    );
  }

  // ---------------------------------------------------------------------------
  // Form interaction helpers
  // ---------------------------------------------------------------------------

  /**
   * Returns the current value of the brand name input.
   */
  async getNameInputValue(): Promise<string> {
    return this.nameInput.inputValue();
  }

  /**
   * Clears and fills the brand name input.
   * Triggers autosave debounce (600ms).
   */
  async fillName(value: string): Promise<void> {
    await this.nameInput.click();
    await this.nameInput.fill(value);
  }

  /**
   * Clears and fills the tagline input.
   */
  async fillTagline(value: string): Promise<void> {
    await this.taglineInput.click();
    await this.taglineInput.fill(value);
  }

  /**
   * Clears and fills the description textarea.
   */
  async fillDescription(value: string): Promise<void> {
    await this.descriptionTextarea.click();
    await this.descriptionTextarea.fill(value);
  }

  // ---------------------------------------------------------------------------
  // Logo upload helpers
  // ---------------------------------------------------------------------------

  /**
   * Returns the logo drop zone locator for drag or click interaction.
   */
  getLogoDropZone(): Locator {
    return this.logoDropZone;
  }

  /**
   * Uploads a logo file via the hidden file input.
   * Does NOT validate size/type — call this then check alerts.
   */
  async uploadLogo(filePath: string): Promise<void> {
    await this.logoFileInput.setInputFiles(filePath);
  }

  /**
   * Returns whether the logo size error alert is visible.
   */
  async isLogoSizeErrorVisible(): Promise<boolean> {
    return this.logoSizeErrorAlert.isVisible();
  }

  // ---------------------------------------------------------------------------
  // Color picker helpers
  // ---------------------------------------------------------------------------

  /**
   * Opens primary color picker and fills hex value.
   */
  async fillHexColor(
    type: "primary" | "secondary",
    hexValue: string,
  ): Promise<void> {
    if (type === "primary") {
      await this.primaryColorPicker.click();
      await this.primaryColorHexInput.fill(hexValue);
      await this.primaryColorHexInput.press("Enter");
    } else {
      await this.secondaryColorPicker.click();
      await this.secondaryColorHexInput.fill(hexValue);
      await this.secondaryColorHexInput.press("Enter");
    }
  }

  /**
   * Returns the current hex value of a color input.
   */
  async getColorHexValue(type: "primary" | "secondary"): Promise<string> {
    if (type === "primary") {
      return this.primaryColorHexInput.inputValue();
    }
    return this.secondaryColorHexInput.inputValue();
  }

  // ---------------------------------------------------------------------------
  // Navigation helpers
  // ---------------------------------------------------------------------------

  /**
   * Returns the team preview link locator.
   */
  getTeamPreviewLink(): Locator {
    return this.teamPreviewLink;
  }

  /**
   * Returns the "Editar configuración de clínica" link locator.
   */
  getEditConfigLink(): Locator {
    return this.editConfigLink;
  }
}
