/**
 * voz-tono-section.pom.ts — VozTonoSectionPage POM
 *
 * Page object for the Voz y tono sub-sub-tab within lisa/marca.
 * Covers: archetype selector (4 Jung archetypes salud-friendly),
 * tone block textareas (openingHook/mainBody/closingCta),
 * prohibited phrase warning alert, override toggle,
 * and BrandVoicePreview footer section.
 *
 * No assertions in POM methods (assertions live in spec files).
 *
 * downstream-regression-na: brand-local vitalia e2e POM F2-S7
 *
 * @see 04-validators.yaml § test_construction_plan step 7
 */

import type { Page, Locator } from "@playwright/test";

/** Jung archetypes available for salud brand (OQ-B resolution) */
export type SaludArchetype = "caregiver" | "sage" | "healer" | "hero";

export class VozTonoSectionPage {
  readonly page: Page;

  // ---------------------------------------------------------------------------
  // Section container
  // ---------------------------------------------------------------------------

  readonly sectionRoot: Locator;

  // ---------------------------------------------------------------------------
  // Archetype selector (4 radio cards)
  // ---------------------------------------------------------------------------

  /** Container for all archetype radio cards */
  readonly archetypeSelector: Locator;

  /** Individual archetype radio cards */
  readonly archetypeCaregiverCard: Locator;
  readonly archetypeSageCard: Locator;
  readonly archetypeHealerCard: Locator;
  readonly archetypeHeroCard: Locator;

  // ---------------------------------------------------------------------------
  // Tone block textareas
  // ---------------------------------------------------------------------------

  /** Opening hook textarea */
  readonly openingHookTextarea: Locator;

  /** Main body textarea */
  readonly mainBodyTextarea: Locator;

  /** Closing CTA textarea */
  readonly closingCtaTextarea: Locator;

  // ---------------------------------------------------------------------------
  // Prohibited phrase warning
  // ---------------------------------------------------------------------------

  /** Warning alert shown when prohibited phrase detected */
  readonly warningAlert: Locator;

  /** List of detected phrases inside the warning alert */
  readonly warningPhraseList: Locator;

  /** "Continuar de todas formas" override toggle/button */
  readonly overrideWarningButton: Locator;

  // ---------------------------------------------------------------------------
  // Voice blocklist management
  // ---------------------------------------------------------------------------

  /** Voice blocklist section */
  readonly voiceBlocklistSection: Locator;

  /** Add phrase to blocklist input */
  readonly addPhraseInput: Locator;

  /** Add phrase submit button */
  readonly addPhraseButton: Locator;

  /** Blocklist items container */
  readonly blocklistItems: Locator;

  // ---------------------------------------------------------------------------
  // BrandVoicePreview footer
  // ---------------------------------------------------------------------------

  /** BrandVoicePreview section container (unique footer per OQ-E) */
  readonly brandVoicePreview: Locator;

  /** Preview opening hook text */
  readonly previewOpeningHook: Locator;

  /** Preview main body text */
  readonly previewMainBody: Locator;

  /** Preview closing CTA text */
  readonly previewClosingCta: Locator;

  /** Preview loading skeleton */
  readonly previewLoadingSkeleton: Locator;

  /** Preview error state */
  readonly previewErrorState: Locator;

  /** Preview empty state (no personality configured) */
  readonly previewEmptyState: Locator;

  /** "Regenerar vista previa" button */
  readonly regeneratePreviewButton: Locator;

  /** Cache hit badge (shows "En caché" when cacheHit=true) */
  readonly previewCacheHitBadge: Locator;

  // ---------------------------------------------------------------------------
  // Constructor
  // ---------------------------------------------------------------------------

  constructor(page: Page) {
    this.page = page;

    this.sectionRoot = page.locator('[data-testid="voz-tono-section-root"]');

    // Archetype selector
    this.archetypeSelector = page.locator(
      '[data-testid="archetype-selector"]',
    );
    this.archetypeCaregiverCard = page.locator(
      '[data-testid="archetype-card-caregiver"]',
    );
    this.archetypeSageCard = page.locator(
      '[data-testid="archetype-card-sage"]',
    );
    this.archetypeHealerCard = page.locator(
      '[data-testid="archetype-card-healer"]',
    );
    this.archetypeHeroCard = page.locator(
      '[data-testid="archetype-card-hero"]',
    );

    // Tone blocks
    this.openingHookTextarea = page.locator(
      '[data-testid="tone-block-opening-hook-textarea"]',
    );
    this.mainBodyTextarea = page.locator(
      '[data-testid="tone-block-main-body-textarea"]',
    );
    this.closingCtaTextarea = page.locator(
      '[data-testid="tone-block-closing-cta-textarea"]',
    );

    // Warning alert
    this.warningAlert = page.locator(
      '[data-testid="prohibited-phrase-warning-alert"]',
    );
    this.warningPhraseList = page.locator(
      '[data-testid="prohibited-phrase-list"]',
    );
    this.overrideWarningButton = page.locator(
      '[data-testid="prohibited-phrase-override-button"]',
    );

    // Voice blocklist
    this.voiceBlocklistSection = page.locator(
      '[data-testid="voice-blocklist-section"]',
    );
    this.addPhraseInput = page.locator(
      '[data-testid="voice-blocklist-add-input"]',
    );
    this.addPhraseButton = page.locator(
      '[data-testid="voice-blocklist-add-button"]',
    );
    this.blocklistItems = page.locator(
      '[data-testid="voice-blocklist-items"]',
    );

    // BrandVoicePreview
    this.brandVoicePreview = page.locator(
      '[data-testid="brand-voice-preview"]',
    );
    this.previewOpeningHook = page.locator(
      '[data-testid="voice-preview-opening-hook"]',
    );
    this.previewMainBody = page.locator(
      '[data-testid="voice-preview-main-body"]',
    );
    this.previewClosingCta = page.locator(
      '[data-testid="voice-preview-closing-cta"]',
    );
    this.previewLoadingSkeleton = page.locator(
      '[data-testid="voice-preview-loading-skeleton"]',
    );
    this.previewErrorState = page.locator(
      '[data-testid="voice-preview-error-state"]',
    );
    this.previewEmptyState = page.locator(
      '[data-testid="voice-preview-empty-state"]',
    );
    this.regeneratePreviewButton = page.locator(
      '[data-testid="voice-preview-regenerate-button"]',
    );
    this.previewCacheHitBadge = page.locator(
      '[data-testid="voice-preview-cache-hit-badge"]',
    );
  }

  // ---------------------------------------------------------------------------
  // Archetype interaction helpers
  // ---------------------------------------------------------------------------

  /**
   * Clicks the archetype card for the given archetype slug.
   * Triggers autosave debounce.
   */
  async selectArchetype(archetype: SaludArchetype): Promise<void> {
    const cardMap: Record<SaludArchetype, Locator> = {
      caregiver: this.archetypeCaregiverCard,
      sage: this.archetypeSageCard,
      healer: this.archetypeHealerCard,
      hero: this.archetypeHeroCard,
    };
    await cardMap[archetype].click();
  }

  /**
   * Returns the currently selected archetype slug.
   * Reads data-selected="true" attribute from archetype cards.
   */
  async getSelectedArchetype(): Promise<SaludArchetype | null> {
    const archetypes: SaludArchetype[] = [
      "caregiver",
      "sage",
      "healer",
      "hero",
    ];
    for (const archetype of archetypes) {
      const card = this.archetypeSelector.locator(
        `[data-testid="archetype-card-${archetype}"][data-selected="true"]`,
      );
      const count = await card.count();
      if (count > 0) return archetype;
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Tone block helpers
  // ---------------------------------------------------------------------------

  /**
   * Fills a tone block textarea.
   * Triggers autosave debounce after fill.
   */
  async fillBlock(
    block: "openingHook" | "mainBody" | "closingCta",
    value: string,
  ): Promise<void> {
    const blockMap: Record<string, Locator> = {
      openingHook: this.openingHookTextarea,
      mainBody: this.mainBodyTextarea,
      closingCta: this.closingCtaTextarea,
    };
    const textarea = blockMap[block];
    if (!textarea) return;
    await textarea.click();
    await textarea.fill(value);
  }

  /**
   * Returns the current text content of a tone block textarea.
   */
  async getBlockValue(
    block: "openingHook" | "mainBody" | "closingCta",
  ): Promise<string> {
    const blockMap: Record<string, Locator> = {
      openingHook: this.openingHookTextarea,
      mainBody: this.mainBodyTextarea,
      closingCta: this.closingCtaTextarea,
    };
    return (blockMap[block] ?? this.openingHookTextarea).inputValue();
  }

  // ---------------------------------------------------------------------------
  // Warning alert helpers
  // ---------------------------------------------------------------------------

  /**
   * Returns whether the prohibited phrase warning alert is visible.
   */
  async isWarningAlertVisible(): Promise<boolean> {
    return this.warningAlert.isVisible();
  }

  /**
   * Returns the list of detected prohibited phrases from the warning alert.
   */
  async getWarningPhrases(): Promise<string[]> {
    const items = await this.warningPhraseList.locator("li").all();
    return Promise.all(
      items.map(async (item) => (await item.textContent()) ?? ""),
    );
  }

  /**
   * Clicks "Continuar de todas formas" to dismiss the warning and persist.
   */
  async clickOverrideWarning(): Promise<void> {
    await this.overrideWarningButton.click();
  }

  // ---------------------------------------------------------------------------
  // BrandVoicePreview helpers
  // ---------------------------------------------------------------------------

  /**
   * Returns the brand voice preview container locator.
   */
  getBrandVoicePreview(): Locator {
    return this.brandVoicePreview;
  }

  /**
   * Waits for the preview to load (skeleton gone, preview text visible).
   */
  async waitForPreviewLoaded(timeoutMs: number = 10_000): Promise<void> {
    await this.previewLoadingSkeleton.waitFor({
      state: "hidden",
      timeout: timeoutMs,
    });
    await this.previewOpeningHook.waitFor({
      state: "visible",
      timeout: timeoutMs,
    });
  }

  /**
   * Returns the text content of each preview sample block.
   */
  async getPreviewSamples(): Promise<{
    openingHook: string | null;
    mainBody: string | null;
    closingCta: string | null;
  }> {
    const [openingHook, mainBody, closingCta] = await Promise.all([
      this.previewOpeningHook.textContent(),
      this.previewMainBody.textContent(),
      this.previewClosingCta.textContent(),
    ]);
    return { openingHook, mainBody, closingCta };
  }

  /**
   * Returns whether the preview cache hit badge is visible.
   */
  async isPreviewCacheHit(): Promise<boolean> {
    return this.previewCacheHitBadge.isVisible();
  }
}
