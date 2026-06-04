// cap: abel/icp-buyer
/**
 * UniversalIntakeModal.ts — Page Object Model for the UniversalIntake component.
 *
 * Covers the intake modal opened via "Generar con Abel" or similar CTAs:
 *   - 4 input modes: URL | Archivo | Texto | Conectar (disabled day-1)
 *   - Mode tab switching
 *   - URL input + submit ("Analizar")
 *   - Texto input + submit
 *   - Archivo dropzone trigger
 *   - Conectar placeholder (disabled, CTA to Config→Conexiones)
 *   - Cancel button
 *
 * Locators: data-testid first, ARIA as fallback. NO CSS selectors or XPath.
 * No assertions in POM methods — actions + locators only.
 *
 * spec_anchor: 04-validators.yaml § poms_required (UniversalIntakeModal)
 * story-origin: nicolify-r1-abel-icp-buyer T-E2E-1
 */

import type { Page, Locator } from "@playwright/test";

export type IntakeMode = "url" | "archivo" | "texto" | "conectar";

export class UniversalIntakeModal {
  readonly page: Page;

  // ── Container ─────────────────────────────────────────────────────────────

  /** UniversalIntake root container */
  readonly container: Locator;

  // ── Mode tabs ─────────────────────────────────────────────────────────────

  /** Mode tabs row */
  readonly modeTabs: Locator;

  // ── URL mode ──────────────────────────────────────────────────────────────

  /** URL input field (visible when mode=url) */
  readonly urlInput: Locator;

  // ── Texto mode ────────────────────────────────────────────────────────────

  /** Texto input field (visible when mode=texto) */
  readonly textoInput: Locator;

  // ── Archivo mode ──────────────────────────────────────────────────────────

  /** File dropzone (visible when mode=archivo) */
  readonly fileDropzone: Locator;

  /** Hidden file input for archivo mode */
  readonly fileInput: Locator;

  // ── Conectar mode ─────────────────────────────────────────────────────────

  /** Conectar placeholder (visible when mode=conectar — disabled day-1) */
  readonly conectarPlaceholder: Locator;

  /** Conectar CTA (points to Config→Conexiones) */
  readonly conectarCta: Locator;

  // ── Actions ───────────────────────────────────────────────────────────────

  /** Submit / "Analizar" button */
  readonly submitBtn: Locator;

  /** Cancel button */
  readonly cancelBtn: Locator;

  constructor(page: Page) {
    this.page = page;

    this.container = page.getByTestId("universal-intake");
    this.modeTabs = page.getByTestId("intake-mode-tabs");

    this.urlInput = page.getByTestId("intake-url-input");
    this.textoInput = page.getByTestId("intake-texto-input");
    this.fileDropzone = page.getByTestId("intake-file-dropzone");
    this.fileInput = page.getByTestId("intake-file-input");
    this.conectarPlaceholder = page.getByTestId("intake-conectar-placeholder");
    this.conectarCta = page.getByTestId("intake-conectar-cta");

    this.submitBtn = page.getByTestId("intake-submit-btn");
    this.cancelBtn = page.getByTestId("intake-cancel-btn");
  }

  // ── Mode helpers ──────────────────────────────────────────────────────────

  /**
   * Get a mode tab locator by mode id.
   */
  modeTab(mode: IntakeMode): Locator {
    return this.page.getByTestId(`intake-tab-${mode}`);
  }

  /**
   * Switch to a specific intake mode by clicking its tab.
   */
  async switchMode(mode: IntakeMode): Promise<void> {
    await this.modeTab(mode).click();
  }

  // ── URL mode ──────────────────────────────────────────────────────────────

  /**
   * Enter a URL for extraction.
   */
  async fillUrl(url: string): Promise<void> {
    await this.switchMode("url");
    await this.urlInput.fill(url);
  }

  // ── Texto mode ────────────────────────────────────────────────────────────

  /**
   * Enter free text for extraction.
   */
  async fillTexto(text: string): Promise<void> {
    await this.switchMode("texto");
    await this.textoInput.fill(text);
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  /**
   * Click "Analizar" to submit the intake for extraction.
   */
  async submit(): Promise<void> {
    await this.submitBtn.click();
  }

  /**
   * Fill URL and submit in one action.
   */
  async analyzeUrl(url: string): Promise<void> {
    await this.fillUrl(url);
    await this.submit();
  }

  /**
   * Fill text and submit in one action.
   */
  async analyzeTexto(text: string): Promise<void> {
    await this.fillTexto(text);
    await this.submit();
  }

  // ── Visibility helpers ────────────────────────────────────────────────────

  /**
   * Wait for the intake modal/container to be visible.
   */
  async waitForVisible(timeout = 10_000): Promise<void> {
    await this.container.waitFor({ state: "visible", timeout });
  }

  /**
   * Wait for the intake modal to be hidden (dismissed).
   */
  async waitForHidden(timeout = 10_000): Promise<void> {
    await this.container.waitFor({ state: "hidden", timeout });
  }

  /**
   * Cancel and dismiss the intake modal.
   */
  async cancel(): Promise<void> {
    await this.cancelBtn.click();
  }
}
