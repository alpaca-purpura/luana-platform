/**
 * fidelizacion.page.ts — POM for /fidelizacion
 *
 * Per playwright-expert POM patterns:
 *   - All locator logic lives HERE; specs have zero CSS/XPath selectors
 *   - Action methods represent user flows (no assertions)
 *   - Locators use getByRole / getByLabel / getByTestId (ARIA-first)
 *
 * Route: /(dashboard)/fidelizacion (vitalia frontend port 3002)
 *
 * downstream-regression-na: brand-local E2E POM; no cross-brand consumers
 */

import type { Locator, Page } from "@playwright/test";

// Tab names matching FIDELIZACION_COPY.tabs values
const TAB_LABELS = {
  multisession: "Multisesión",
  followup: "Seguimiento médico",
  maintenance: "Mantenimiento",
  absence: "Ausencia",
  nps: "NPS",
} as const;

export type FidelizacionTabKey = keyof typeof TAB_LABELS;

export class FidelizacionPage {
  readonly page: Page;

  // ─── Page header ──────────────────────────────────────────────────────────
  readonly pageTitle: Locator;
  readonly pageDescription: Locator;
  readonly periodSelector: Locator;

  // ─── KPIs hero ────────────────────────────────────────────────────────────
  readonly kpisRegion: Locator;
  readonly kpiPatientsInFollowup: Locator;
  readonly kpiNearAbandonment: Locator;
  readonly kpiReturnRate: Locator;
  readonly kpiReEngaged: Locator;
  readonly kpiNpsAverage: Locator;

  // ─── Tabs bar ─────────────────────────────────────────────────────────────
  readonly tabsNav: Locator;

  // ─── Tab content region ───────────────────────────────────────────────────
  readonly tabContent: Locator;

  // ─── Activity footer ─────────────────────────────────────────────────────
  readonly activityFooter: Locator;

  // ─── PHI denied banner ────────────────────────────────────────────────────
  readonly phiDeniedBanner: Locator;

  // ─── Modals ───────────────────────────────────────────────────────────────
  /** ConfirmTemplateModal */
  readonly confirmTemplateModal: Locator;
  readonly confirmTemplateTitle: Locator;
  readonly confirmTemplateSendButton: Locator;
  readonly confirmTemplateCancelButton: Locator;

  /** PausePatientModal */
  readonly pauseModal: Locator;
  readonly pauseModalTitle: Locator;
  readonly pauseModalConfirmButton: Locator;
  readonly pauseModalCancelButton: Locator;

  /** ManualCallLoggedModal */
  readonly manualCallModal: Locator;
  readonly manualCallModalTitle: Locator;
  readonly manualCallNotesInput: Locator;
  readonly manualCallConfirmButton: Locator;
  readonly manualCallCancelButton: Locator;

  /** SuggestSlotsModal */
  readonly suggestSlotsModal: Locator;
  readonly suggestSlotsModalTitle: Locator;
  readonly suggestSlotsConfirmButton: Locator;
  readonly suggestSlotsCancelButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // ── Header ──
    this.pageTitle = page.getByRole("heading", { name: "Seguimiento y fidelización" });
    this.pageDescription = page.getByText(
      "Gestiona el seguimiento activo de tus pacientes y las acciones de reactivación."
    );
    this.periodSelector = page.getByRole("group", { name: /período/i });

    // ── KPIs ──
    this.kpisRegion = page.getByRole("region", {
      name: /indicadores clave de seguimiento/i,
    });
    this.kpiPatientsInFollowup = page.getByRole("status", {
      name: /en seguimiento activo/i,
    });
    this.kpiNearAbandonment = page.getByRole("status", {
      name: /cerca de abandonar/i,
    });
    this.kpiReturnRate = page.getByRole("status", {
      name: /tasa de retorno/i,
    });
    this.kpiReEngaged = page.getByRole("status", {
      name: /reactivados este período/i,
    });
    this.kpiNpsAverage = page.getByRole("status", {
      name: /nps promedio/i,
    });

    // ── Tabs ──
    this.tabsNav = page.getByRole("navigation", {
      name: /navegación de pestañas de seguimiento/i,
    });

    // ── Tab content (main scrollable region) ──
    this.tabContent = page.getByRole("main");

    // ── Activity footer ──
    this.activityFooter = page.getByRole("region", {
      name: /actividad reciente de seguimiento/i,
    });

    // ── PHI denied ──
    this.phiDeniedBanner = page.getByRole("alert").filter({
      hasText: /no tienes permisos para ver esta información/i,
    });

    // ── ConfirmTemplateModal ──
    this.confirmTemplateModal = page.getByRole("dialog").filter({
      hasText: /confirmar recordatorio/i,
    });
    this.confirmTemplateTitle = page.getByRole("heading", {
      name: /confirmar recordatorio/i,
    });
    this.confirmTemplateSendButton = page.getByRole("button", {
      name: /enviar recordatorio/i,
    });
    this.confirmTemplateCancelButton = this.confirmTemplateModal.getByRole(
      "button",
      { name: /cancelar/i }
    );

    // ── PausePatientModal ──
    this.pauseModal = page.getByRole("dialog").filter({
      hasText: /pausar seguimiento/i,
    });
    this.pauseModalTitle = page.getByRole("heading", {
      name: /pausar seguimiento/i,
    });
    this.pauseModalConfirmButton = page.getByRole("button", {
      name: /pausar seguimiento/i,
    });
    this.pauseModalCancelButton = this.pauseModal.getByRole("button", {
      name: /cancelar/i,
    });

    // ── ManualCallLoggedModal ──
    this.manualCallModal = page.getByRole("dialog").filter({
      hasText: /registrar llamada/i,
    });
    this.manualCallModalTitle = page.getByRole("heading", {
      name: /registrar llamada/i,
    });
    this.manualCallNotesInput = page.getByRole("textbox", {
      name: /notas de la llamada/i,
    });
    this.manualCallConfirmButton = page.getByRole("button", {
      name: /registrar llamada/i,
    });
    this.manualCallCancelButton = this.manualCallModal.getByRole("button", {
      name: /cancelar/i,
    });

    // ── SuggestSlotsModal ──
    this.suggestSlotsModal = page.getByRole("dialog").filter({
      hasText: /sugerir turnos/i,
    });
    this.suggestSlotsModalTitle = page.getByRole("heading", {
      name: /sugerir turnos disponibles/i,
    });
    this.suggestSlotsConfirmButton = page.getByRole("button", {
      name: /enviar sugerencias/i,
    });
    this.suggestSlotsCancelButton = this.suggestSlotsModal.getByRole("button", {
      name: /cancelar/i,
    });
  }

  // ─── Navigation ───────────────────────────────────────────────────────────

  async goto() {
    await this.page.goto("/fidelizacion");
  }

  async gotoWithTab(tab: FidelizacionTabKey) {
    await this.page.goto(`/fidelizacion?tab=${tab}`);
  }

  // ─── Page readiness ───────────────────────────────────────────────────────

  async waitForReady(timeout = 15_000) {
    await this.pageTitle.waitFor({ state: "visible", timeout });
  }

  async waitForKPIsLoaded(timeout = 10_000) {
    // KPIs load asynchronously — wait for any kpi status to be visible
    await this.kpisRegion.waitFor({ state: "visible", timeout });
  }

  // ─── Tab navigation ───────────────────────────────────────────────────────

  /** Click a tab by its key (e.g. "multisession", "absence") */
  async clickTab(tabKey: FidelizacionTabKey) {
    const label = TAB_LABELS[tabKey];
    await this.page.getByRole("tab", { name: label }).click();
  }

  /** Get the currently active tab button */
  activeTab(): Locator {
    return this.tabsNav.getByRole("tab", { selected: true });
  }

  // ─── Period selection ─────────────────────────────────────────────────────

  async selectPeriod(period: "7d" | "30d" | "90d") {
    const labels: Record<"7d" | "30d" | "90d", string> = {
      "7d": "Últimos 7 días",
      "30d": "Últimos 30 días",
      "90d": "Últimos 90 días",
    };
    const btn = this.periodSelector.getByRole("button", {
      name: labels[period],
    });
    await btn.click();
  }

  // ─── Card locators ────────────────────────────────────────────────────────

  /**
   * Locate a re-engagement card by pattern + event ID.
   * Maps to data-testid="re-engagement-card-{pattern}-{eventId}"
   */
  card(pattern: string, eventId: string): Locator {
    return this.page.getByTestId(`re-engagement-card-${pattern}-${eventId}`);
  }

  /** Patient name within a card */
  cardPatientName(pattern: string, eventId: string): Locator {
    return this.card(pattern, eventId).getByRole("heading");
  }

  /** Urgency badge within a card */
  cardUrgencyBadge(pattern: string, eventId: string): Locator {
    return this.card(pattern, eventId).getByRole("status").filter({
      hasText: /crítico|alerta|próximo|en espera|al día/i,
    });
  }

  // ─── Card action buttons ──────────────────────────────────────────────────

  /** "Recordatorio Adrián" button within a card */
  cardSendReminderButton(pattern: string, eventId: string): Locator {
    return this.card(pattern, eventId).getByRole("button", {
      name: /recordatorio adrián/i,
    });
  }

  /** "Llamada manual" button within a card */
  cardManualCallButton(pattern: string, eventId: string): Locator {
    return this.card(pattern, eventId).getByRole("button", {
      name: /llamada manual/i,
    });
  }

  /** "Sugerir turnos" button within a card */
  cardSuggestSlotsButton(pattern: string, eventId: string): Locator {
    return this.card(pattern, eventId).getByRole("button", {
      name: /sugerir turnos/i,
    });
  }

  /** "Pausar seguimiento" button within a card */
  cardPauseButton(pattern: string, eventId: string): Locator {
    return this.card(pattern, eventId).getByRole("button", {
      name: /pausar seguimiento/i,
    });
  }

  /** "Ver conversación" button within a card */
  cardOpenConversationButton(pattern: string, eventId: string): Locator {
    return this.card(pattern, eventId).getByRole("button", {
      name: /ver conversación/i,
    });
  }

  // ─── Marketing opt-in disabled tooltip ───────────────────────────────────

  /** No-marketing tooltip text within a card's disabled send_reminder */
  noMarketingTooltip(pattern: string, eventId: string): Locator {
    return this.card(pattern, eventId).getByText(
      /paciente no aceptó.*marketing/i
    );
  }

  // ─── Empty states ─────────────────────────────────────────────────────────

  emptyStateForTab(tabKey: FidelizacionTabKey): Locator {
    const messages: Record<FidelizacionTabKey, RegExp> = {
      multisession: /todos los pacientes están al día/i,
      followup: /no hay seguimientos pendientes/i,
      maintenance: /no hay pacientes que requieran mantenimiento/i,
      absence: /no hay pacientes con ausencia prolongada/i,
      nps: /no hay respuestas de nps/i,
    };
    return this.tabContent.getByText(messages[tabKey]);
  }

  // ─── Modal actions ────────────────────────────────────────────────────────

  async waitForConfirmTemplateModal(timeout = 10_000) {
    await this.confirmTemplateModal.waitFor({ state: "visible", timeout });
  }

  async waitForPauseModal(timeout = 10_000) {
    await this.pauseModal.waitFor({ state: "visible", timeout });
  }

  async waitForManualCallModal(timeout = 10_000) {
    await this.manualCallModal.waitFor({ state: "visible", timeout });
  }

  async waitForSuggestSlotsModal(timeout = 10_000) {
    await this.suggestSlotsModal.waitFor({ state: "visible", timeout });
  }

  async confirmTemplate() {
    await this.confirmTemplateSendButton.click();
    // Modal should close after send
    await this.confirmTemplateModal.waitFor({ state: "hidden", timeout: 10_000 });
  }

  async cancelTemplate() {
    await this.confirmTemplateCancelButton.click();
    await this.confirmTemplateModal.waitFor({ state: "hidden", timeout: 10_000 });
  }

  async confirmPause() {
    await this.pauseModalConfirmButton.click();
    await this.pauseModal.waitFor({ state: "hidden", timeout: 10_000 });
  }

  async logManualCall(notes: string, outcome: "reached" | "voicemail" | "no_answer" = "reached") {
    await this.manualCallNotesInput.fill(notes);
    // Select outcome radio/button
    const outcomeLabels: Record<"reached" | "voicemail" | "no_answer", string> = {
      reached: "Contacté al paciente",
      voicemail: "Dejé mensaje de voz",
      no_answer: "No contestó",
    };
    await this.manualCallModal
      .getByRole("radio", { name: outcomeLabels[outcome] })
      .click();
    await this.manualCallConfirmButton.click();
    await this.manualCallModal.waitFor({ state: "hidden", timeout: 10_000 });
  }

  async confirmSuggestSlots() {
    await this.suggestSlotsConfirmButton.click();
    await this.suggestSlotsModal.waitFor({ state: "hidden", timeout: 10_000 });
  }

  // ─── Toast assertions ─────────────────────────────────────────────────────

  /** Wait for a success toast containing the given text */
  async waitForSuccessToast(textPattern: string | RegExp, timeout = 8_000) {
    await this.page
      .getByRole("status")
      .filter({ hasText: textPattern })
      .waitFor({ state: "visible", timeout });
  }
}
