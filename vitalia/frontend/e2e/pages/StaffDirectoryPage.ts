// cap: clinics.lisa.doctores
// story-origin: vitalia-fase2-lisa-doctores
/**
 * StaffDirectoryPage.ts — Playwright POM for Staff Directory.
 *
 * Covers: grid cards, search/filter, pagination, + Nuevo doctor modal,
 * empty-state (SC-8), error banner (SC-7), loading skeleton.
 *
 * T-E2E vitalia-fase2-lisa-doctores
 * spec_anchor: 04-validators.yaml § poms_required
 * playwright-expert: POM patterns
 */

import type { Page, Locator } from "@playwright/test";

export class StaffDirectoryPage {
  readonly page: Page;

  // Container
  readonly staffDirectoryView: Locator;

  // Header
  readonly addDoctorButton: Locator;
  readonly searchInput: Locator;
  readonly specialtyFilter: Locator;
  readonly activeFilter: Locator;

  // Grid
  readonly doctorCards: Locator;
  readonly firstDoctorCard: Locator;

  // Pagination
  readonly paginationPrev: Locator;
  readonly paginationNext: Locator;
  readonly paginationInfo: Locator;

  // States
  readonly loadingSkeleton: Locator;
  readonly emptyState: Locator;
  readonly emptyStateCtaButton: Locator;
  readonly errorBanner: Locator;
  readonly retryButton: Locator;

  // + Nuevo doctor modal
  readonly nuevoIntegranteModal: Locator;
  readonly modalFirstNameInput: Locator;
  readonly modalLastNameInput: Locator;
  readonly modalDniInput: Locator;
  readonly modalEmailInput: Locator;
  readonly modalPhoneInput: Locator;
  readonly modalSpecialtyInput: Locator;
  readonly modalCredentialInput: Locator;
  readonly modalCredentialCountrySelect: Locator;
  readonly modalSubmitButton: Locator;
  readonly modalCancelButton: Locator;
  readonly modalCredentialError: Locator;

  // EntitySubNavBar (in directory mode: leaves disabled)
  readonly entitySubNavBar: Locator;
  readonly perfilLeaf: Locator;
  readonly horariosLeaf: Locator;
  readonly serviciosLeaf: Locator;

  constructor(page: Page) {
    this.page = page;

    // Container
    this.staffDirectoryView = page.getByTestId("staff-directory-view");

    // Header
    this.addDoctorButton = page.getByRole("button", { name: /Nuevo doctor/i });
    this.searchInput = page.getByPlaceholder(/Buscar/i);
    this.specialtyFilter = page.getByLabel(/Especialidad/i).first();
    this.activeFilter = page.getByLabel(/Activo/i).first();

    // Grid
    this.doctorCards = page.getByTestId("staff-card");
    this.firstDoctorCard = this.doctorCards.first();

    // Pagination
    this.paginationPrev = page.getByTestId("pagination-prev");
    this.paginationNext = page.getByTestId("pagination-next");
    this.paginationInfo = page.getByTestId("pagination-info");

    // States
    this.loadingSkeleton = page.getByTestId("staff-loading-skeleton");
    this.emptyState = page.getByTestId("empty-doctores");
    this.emptyStateCtaButton = this.emptyState.getByRole("button", {
      name: /Agregar primer doctor/i,
    });
    this.errorBanner = page.getByTestId("staff-error-banner");
    this.retryButton = page.getByRole("button", { name: /Reintentar/i });

    // Modal
    this.nuevoIntegranteModal = page.getByRole("dialog", {
      name: /Nuevo doctor/i,
    });
    this.modalFirstNameInput = this.nuevoIntegranteModal.getByLabel(/Nombre/i);
    this.modalLastNameInput = this.nuevoIntegranteModal.getByLabel(/Apellido/i);
    this.modalDniInput = this.nuevoIntegranteModal.getByLabel(/DNI|Documento/i);
    this.modalEmailInput = this.nuevoIntegranteModal.getByLabel(/Correo/i);
    this.modalPhoneInput = this.nuevoIntegranteModal.getByLabel(/Teléfono/i);
    this.modalSpecialtyInput = this.nuevoIntegranteModal.getByLabel(
      /Especialidad/i,
    );
    this.modalCredentialInput =
      this.nuevoIntegranteModal.getByLabel(/Credencial/i);
    this.modalCredentialCountrySelect =
      this.nuevoIntegranteModal.getByLabel(/País de credencial/i);
    this.modalSubmitButton = this.nuevoIntegranteModal.getByRole("button", {
      name: /Guardar|Crear/i,
    });
    this.modalCancelButton = this.nuevoIntegranteModal.getByRole("button", {
      name: /Cancelar/i,
    });
    this.modalCredentialError = this.nuevoIntegranteModal.getByText(
      /credencial.*numérica|CMP/i,
    );

    // EntitySubNavBar (in directory: leaves disabled)
    this.entitySubNavBar = page.getByTestId("entity-sub-nav-bar");
    this.perfilLeaf = page.getByTestId("entity-leaf-perfil");
    this.horariosLeaf = page.getByTestId("entity-leaf-horarios");
    this.serviciosLeaf = page.getByTestId("entity-leaf-servicios");
  }

  /** Navigate to the staff directory for a given tenant. */
  async goto(tenantId: string): Promise<void> {
    await this.page.goto(`/${tenantId}/lisa/staff`);
    await this.page.waitForLoadState("networkidle");
  }

  /** Open + Nuevo doctor modal. */
  async openNewDoctorModal(): Promise<void> {
    await this.addDoctorButton.click();
    await this.nuevoIntegranteModal.waitFor({ state: "visible", timeout: 5_000 });
  }

  /** Fill all required fields in the new-doctor modal. */
  async fillNewDoctorForm(data: {
    firstName: string;
    lastName: string;
    dni: string;
    email: string;
    phone?: string;
    specialty?: string;
    credential: string;
    credentialCountry?: string;
  }): Promise<void> {
    await this.modalFirstNameInput.fill(data.firstName);
    await this.modalLastNameInput.fill(data.lastName);
    await this.modalDniInput.fill(data.dni);
    await this.modalEmailInput.fill(data.email);
    if (data.phone) await this.modalPhoneInput.fill(data.phone);
    if (data.specialty) await this.modalSpecialtyInput.fill(data.specialty);
    await this.modalCredentialInput.fill(data.credential);
    if (data.credentialCountry) {
      await this.modalCredentialCountrySelect.selectOption(
        data.credentialCountry,
      );
    }
  }

  /** Submit the modal form. */
  async submitNewDoctorForm(): Promise<void> {
    await this.modalSubmitButton.click();
  }

  /** Get a specific doctor card by doctor id. */
  getDoctorCard(doctorId: string): Locator {
    return this.page.getByTestId(`staff-card-${doctorId}`);
  }

  /** Click "Ver perfil" on a specific doctor card. */
  async clickVerPerfil(doctorId: string): Promise<void> {
    const card = this.getDoctorCard(doctorId);
    await card.getByRole("link", { name: /Ver perfil/i }).click();
  }

  /** Wait until the skeleton is gone and either grid or empty state is visible. */
  async waitForDirectoryToLoad(): Promise<void> {
    await this.loadingSkeleton
      .waitFor({ state: "hidden", timeout: 15_000 })
      .catch(() => {/* Skeleton may not be rendered for instant mocks */});
    await this.page.waitForSelector(
      "[data-testid='staff-directory-view']",
      { timeout: 10_000 },
    );
  }

  /** Search for a doctor by name. */
  async searchFor(query: string): Promise<void> {
    await this.searchInput.fill(query);
    // Wait for debounce + re-render
    await this.page.waitForTimeout(500);
  }

  /** Assert card count equals expected. */
  async assertCardCount(expected: number): Promise<void> {
    const count = await this.doctorCards.count();
    if (count !== expected) {
      throw new Error(`Expected ${expected} doctor cards, got ${count}`);
    }
  }

  /** Check that the credential field is in error state (SC-2). */
  async isCredentialInErrorState(): Promise<boolean> {
    const input = this.modalCredentialInput;
    const ariaInvalid = await input.getAttribute("aria-invalid");
    const hasDestructive =
      await input.evaluate(
        (el) =>
          el.classList.contains("border-destructive") ||
          el.getAttribute("data-invalid") === "true",
      );
    return ariaInvalid === "true" || hasDestructive;
  }
}
