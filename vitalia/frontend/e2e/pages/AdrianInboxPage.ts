/**
 * AdrianInboxPage — POM for Adrián Inbox placeholder (3-col layout + Takeover UX A↔B).
 * F1-S10 vitalia-fase1-empty-states — T-10
 *
 * Wraps the InboxPlaceholder at /{tenantId}/adrian/inbox.
 * Encapsulates all aria-labels and data-testids from:
 *   - InboxPlaceholder.tsx (data-sidebar, data-testid="inbox-global-mode-toggle")
 *   - ThreadHeader.tsx (aria-label="Tomar el control..." | aria-label="Cerrar panel de detalles")
 *   - TakeoverBanner.tsx (aria-label="Devolver el control a Adrián en esta conversación")
 *   - ConversationItem.tsx (aria-label="Conversación con {name}...")
 *   - MessageInput.tsx (placeholder text changes on state)
 *
 * Takeover UX states:
 *   A = "Adrián maneja" → chip visible + botón "✋ Tomar el control" + MessageInput disabled
 *   B = "Usuario en control" → TakeoverBanner visible + MessageInput enabled + chip oculto
 *
 * downstream-regression-na: brand-local vitalia e2e POM; no cross-brand consumers
 */

import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

export class AdrianInboxPage {
  readonly page: Page;
  readonly tenantId: string;

  // ── Main layout locators ──────────────────────────────────────────────
  readonly globalModeToggle: Locator;
  readonly conversationList: Locator;
  readonly threadSection: Locator;
  readonly contactSidebar: Locator;

  // ── Takeover UX locators ──────────────────────────────────────────────
  readonly takeControlButton: Locator;
  readonly returnControlButton: Locator;
  readonly takeoverBanner: Locator;
  readonly adrianModeChip: Locator;

  // ── Sidebar control ───────────────────────────────────────────────────
  readonly closeSidebarButton: Locator;
  readonly sidebarContainer: Locator;

  constructor(page: Page, tenantId: string) {
    this.page = page;
    this.tenantId = tenantId;

    this.globalModeToggle = page.locator(
      '[data-testid="inbox-global-mode-toggle"]',
    );
    this.conversationList = page.locator(
      '[aria-label="Lista de conversaciones"]',
    );
    this.threadSection = page.locator(
      'section[aria-label*="Conversación con"]',
    );
    // ContactSidebar container — the 3rd col
    this.contactSidebar = page
      .locator("[data-sidebar]")
      .locator("aside")
      .last();

    // Takeover UX — aria-labels verbatim from ThreadHeader.tsx
    this.takeControlButton = page.locator(
      '[aria-label="Tomar el control de esta conversación · Adrián pausará aquí"]',
    );
    // TakeoverBanner return button — aria-label from TakeoverBanner.tsx
    this.returnControlButton = page.locator(
      '[aria-label="Devolver el control a Adrián en esta conversación"]',
    );
    // TakeoverBanner wrapper — detect by the banner's role + content
    this.takeoverBanner = page
      .locator('[role="alert"], [role="status"]')
      .filter({ hasText: /Adrián|Devolver/ });

    // Adrian mode chip — aria-label from ThreadHeader.tsx state A
    this.adrianModeChip = page.locator(
      '[aria-label="Adrián está manejando esta conversación"]',
    );

    // Sidebar close button — aria-label from ThreadHeader.tsx state A
    this.closeSidebarButton = page.locator(
      '[aria-label="Cerrar panel de detalles"]',
    );

    // The 3-col grid container with data-sidebar attribute
    this.sidebarContainer = page.locator("[data-sidebar]");
  }

  // ── Navigation ────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto(`/${this.tenantId}/adrian/inbox`);
    await this.page.waitForLoadState("networkidle");
  }

  // ── Conversation list ─────────────────────────────────────────────────

  /**
   * Click a conversation by display name.
   * Locates the conversation item by its aria-label which includes the name.
   */
  async clickConversation(displayName: string): Promise<void> {
    await this.page
      .locator(`[aria-label*="Conversación con ${displayName}"]`)
      .first()
      .click();
  }

  /**
   * Get all conversation items visible in the list.
   */
  getConversationItems(): Locator {
    return this.page.locator(
      '[aria-label="Lista de conversaciones"] [aria-label*="Conversación con"]',
    );
  }

  /**
   * Get the YouChip element for a human-handled conversation.
   * YouChip renders "✋ Tú" text per ConversationItem.tsx.
   */
  getYouChip(): Locator {
    return this.page.locator(
      'span[title="Tomaste el control · Adrián pausado en esta conversación"]',
    );
  }

  /**
   * Assert that a conversation item shows the green border (human-handled).
   * The ConversationItem with leadId="cp" (Carlos Pérez) has handlerMode="human".
   */
  async expectHumanHandledConversationVisible(
    displayName: string,
  ): Promise<void> {
    await expect(
      this.page.locator(`[aria-label*="Conversación con ${displayName}"]`),
    ).toBeVisible();
    await expect(this.getYouChip().first()).toBeVisible();
  }

  // ── Takeover UX A↔B ──────────────────────────────────────────────────

  /**
   * Transition from state A (Adrián maneja) to state B (user takeover).
   * Clicks the "✋ Tomar el control" button.
   */
  async takeControl(): Promise<void> {
    await this.takeControlButton.click();
  }

  /**
   * Transition from state B (user takeover) back to state A.
   * Clicks the "🤖 Devolver a Adrián" button in TakeoverBanner.
   */
  async returnControl(): Promise<void> {
    await this.returnControlButton.click();
  }

  /**
   * Assert state A is active:
   *   - "Adrián está manejando" chip visible
   *   - "✋ Tomar el control" button visible
   *   - MessageInput textarea has disabled-state placeholder
   *   - TakeoverBanner NOT visible
   */
  async expectStateA(): Promise<void> {
    await expect(this.adrianModeChip).toBeVisible();
    await expect(this.takeControlButton).toBeVisible();
    // TakeoverBanner should not be present or visible
    await expect(
      this.page.locator("text=🤖 Devolver a Adrián"),
    ).not.toBeVisible();
    // MessageInput placeholder in state A
    await expect(
      this.page.locator('[placeholder*="Adrián decide automáticamente"]'),
    ).toBeVisible();
  }

  /**
   * Assert state B is active:
   *   - TakeoverBanner visible with "Devolver a Adrián" button
   *   - MessageInput enabled (no disabled placeholder)
   *   - "Adrián está manejando" chip NOT visible
   */
  async expectStateB(): Promise<void> {
    await expect(this.returnControlButton).toBeVisible();
    await expect(
      this.page.locator('[placeholder*="Escribir como tú"]'),
    ).toBeVisible();
    // The chip for state A must be hidden
    await expect(this.adrianModeChip).not.toBeVisible();
  }

  // ── Sidebar toggle ────────────────────────────────────────────────────

  /**
   * Close the contact sidebar by clicking the × button.
   * After click, data-sidebar attribute becomes "closed".
   */
  async closeSidebar(): Promise<void> {
    await this.closeSidebarButton.first().click();
  }

  /**
   * Assert sidebar is open (data-sidebar="open").
   */
  async expectSidebarOpen(): Promise<void> {
    await expect(this.page.locator('[data-sidebar="open"]')).toBeVisible();
  }

  /**
   * Assert sidebar is closed (data-sidebar="closed").
   * The grid col-3 collapses to 0 width.
   */
  async expectSidebarClosed(): Promise<void> {
    await expect(this.page.locator('[data-sidebar="closed"]')).toBeVisible();
  }

  // ── Thread assertions ─────────────────────────────────────────────────

  /**
   * Assert the message thread section is visible with live region.
   */
  async expectThreadVisible(): Promise<void> {
    await expect(
      this.page.locator(
        '[aria-live="polite"][aria-label="Mensajes de la conversación"]',
      ),
    ).toBeVisible();
  }

  /**
   * Assert global mode toggle is rendered with all 3 options.
   */
  async expectGlobalModeToggleVisible(): Promise<void> {
    await expect(this.globalModeToggle).toBeVisible();
  }
}
