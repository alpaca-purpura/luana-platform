/**
 * voz-tono-section.pom.ts — VozTonoSection POM for arreglar-guardado-voz-y-tono regression specs.
 *
 * Scoped to voz-y-tono sub-sub-tab: archetype selector, voice compiler blocks,
 * autosave badge, and page navigation.
 *
 * Methods per 04-validators.yaml § test_construction_plan step 3 (poms_required):
 *   goto()               — navigate to voz-y-tono for the given tenantId
 *   selectArchetype()    — click archetype card by name
 *   editVoiceBlock()     — fill a named voice block textarea
 *   getAutosaveStatus()  — read autosave badge data-state attribute
 *   reload()             — reload the page and wait for domcontentloaded
 *
 * No assertions in POM methods — assertions live in spec files.
 *
 * downstream-regression-na: brand-local vitalia e2e POM T-3 arreglar-guardado-voz-y-tono
 *
 * @see 04-validators.yaml § test_construction_plan step 3
 * @see 06-tickets.yaml T-3 deliverables
 */

import type { Page, Locator } from "@playwright/test";

// Voice block names as shown in the UI and mapped to the textarea data-testid.
export type VoiceBlockName =
  | "Así hablo"
  | "Así no hablo"
  | "Contexto técnico"
  | "Formato"
  | "Ancla identidad"
  | "Contexto dominio";

/** Archetype slugs available in the salud brand. */
export type SaludArchetype = "caregiver" | "sage" | "healer" | "hero";

/** Autosave badge states matching AutosaveBadge data-state attribute. */
export type AutosaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

// Map from UI-facing block name to the data-testid suffix used in the component.
const BLOCK_TESTID_MAP: Record<VoiceBlockName, string> = {
  "Así hablo": "tone-block-asi-hablo-textarea",
  "Así no hablo": "tone-block-asi-no-hablo-textarea",
  "Contexto técnico": "tone-block-tech-context-textarea",
  "Formato": "tone-block-format-textarea",
  "Ancla identidad": "tone-block-identity-textarea",
  "Contexto dominio": "tone-block-context-textarea",
};

// Map from archetype slug to data-testid used in ArchetypeSelector component.
const ARCHETYPE_TESTID_MAP: Record<SaludArchetype, string> = {
  caregiver: "archetype-card-caregiver",
  sage: "archetype-card-sage",
  healer: "archetype-card-healer",
  hero: "archetype-card-hero",
};

export class VozTonoSectionPom {
  readonly page: Page;
  readonly tenantId: string;

  // ---------------------------------------------------------------------------
  // Core locators
  // ---------------------------------------------------------------------------

  /** Autosave badge indicator — data-state = idle|dirty|saving|saved|error */
  readonly autosaveBadge: Locator;

  /** Archetype selector container */
  readonly archetypeSelector: Locator;

  /** Section root (if rendered by VozTonoView) */
  readonly sectionRoot: Locator;

  /** Page main content area */
  readonly marcaContent: Locator;

  /** Loading skeleton */
  readonly loadingSkeleton: Locator;

  // ---------------------------------------------------------------------------
  // Constructor
  // ---------------------------------------------------------------------------

  constructor(page: Page, tenantId: string) {
    this.page = page;
    this.tenantId = tenantId;

    this.autosaveBadge = page.locator('[data-testid="autosave-badge"]');
    this.archetypeSelector = page.locator('[data-testid="archetype-selector"]');
    this.sectionRoot = page.locator('[data-testid="voz-tono-section-root"]');
    this.marcaContent = page.locator('[data-testid="lisa-marca-content"]');
    this.loadingSkeleton = page.locator(
      '[data-testid="lisa-marca-loading-skeleton"]',
    );
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  /**
   * Navigate directly to the voz-y-tono sub-sub-tab for this tenant.
   * Waits for domcontentloaded.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/${this.tenantId}/lisa/marca/voz-y-tono`);
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * Reload the page (simulates browser F5).
   * Waits for domcontentloaded.
   */
  async reload(): Promise<void> {
    await this.page.reload();
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * Wait until the page content is fully loaded (skeleton hidden, content visible).
   */
  async waitForLoaded(timeoutMs = 15_000): Promise<void> {
    await this.loadingSkeleton.waitFor({
      state: "hidden",
      timeout: timeoutMs,
    });
    await this.marcaContent.waitFor({
      state: "visible",
      timeout: timeoutMs,
    });
  }

  // ---------------------------------------------------------------------------
  // Archetype interaction
  // ---------------------------------------------------------------------------

  /**
   * Click the archetype card with the given name (slug).
   * Triggers autosave debounce (600ms).
   *
   * @param name - One of the 4 salud archetypes: caregiver, sage, healer, hero.
   */
  async selectArchetype(name: SaludArchetype): Promise<void> {
    const testid = ARCHETYPE_TESTID_MAP[name];
    const card = this.page.locator(`[data-testid="${testid}"]`);
    await card.click();
  }

  /**
   * Returns the currently selected archetype slug.
   * Reads data-selected="true" from archetype cards.
   * Returns null if none selected.
   */
  async getSelectedArchetype(): Promise<SaludArchetype | null> {
    const archetypes = Object.keys(ARCHETYPE_TESTID_MAP) as SaludArchetype[];
    for (const archetype of archetypes) {
      const card = this.page.locator(
        `[data-testid="${ARCHETYPE_TESTID_MAP[archetype]}"][data-selected="true"]`,
      );
      if ((await card.count()) > 0) return archetype;
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Voice block interaction
  // ---------------------------------------------------------------------------

  /**
   * Fill a named voice block textarea.
   * Triggers autosave debounce after fill.
   *
   * @param block - UI-facing block name (e.g., "Así hablo").
   * @param text  - The text to fill into the block.
   */
  async editVoiceBlock(block: VoiceBlockName, text: string): Promise<void> {
    const testid = BLOCK_TESTID_MAP[block];
    const textarea = this.page.locator(`[data-testid="${testid}"]`);
    await textarea.click();
    await textarea.fill(text);
  }

  /**
   * Returns the current value of a named voice block textarea.
   */
  async getVoiceBlockValue(block: VoiceBlockName): Promise<string> {
    const testid = BLOCK_TESTID_MAP[block];
    const textarea = this.page.locator(`[data-testid="${testid}"]`);
    return textarea.inputValue();
  }

  // ---------------------------------------------------------------------------
  // Autosave badge helpers
  // ---------------------------------------------------------------------------

  /**
   * Returns the current autosave status from the badge data-state attribute.
   * Returns "idle" if badge is not visible or attribute is absent.
   */
  async getAutosaveStatus(): Promise<AutosaveStatus> {
    const visible = await this.autosaveBadge.isVisible();
    if (!visible) return "idle";
    const state = await this.autosaveBadge.getAttribute("data-state");
    if (
      state === "idle" ||
      state === "dirty" ||
      state === "saving" ||
      state === "saved" ||
      state === "error"
    ) {
      return state;
    }
    return "idle";
  }

  /**
   * Returns the text content of the autosave badge.
   * Returns null if badge is not visible.
   */
  async getAutosaveBadgeText(): Promise<string | null> {
    const visible = await this.autosaveBadge.isVisible();
    if (!visible) return null;
    return this.autosaveBadge.textContent();
  }

  /**
   * Waits until autosave badge shows "saved" state.
   * Throws if timeout exceeded.
   */
  async waitForAutosaveSaved(timeoutMs = 10_000): Promise<void> {
    await this.page
      .locator('[data-testid="autosave-badge"][data-state="saved"]')
      .waitFor({ state: "visible", timeout: timeoutMs });
  }

  /**
   * Waits until autosave badge shows "saving" state.
   */
  async waitForAutosaveSaving(timeoutMs = 10_000): Promise<void> {
    await this.page
      .locator('[data-testid="autosave-badge"][data-state="saving"]')
      .waitFor({ state: "visible", timeout: timeoutMs });
  }

  /**
   * Waits until autosave badge shows "error" state.
   */
  async waitForAutosaveError(timeoutMs = 10_000): Promise<void> {
    await this.page
      .locator('[data-testid="autosave-badge"][data-state="error"]')
      .waitFor({ state: "visible", timeout: timeoutMs });
  }
}
