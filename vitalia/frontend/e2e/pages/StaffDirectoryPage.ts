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
 *
 * B2 fix (2026-05-31): ShellOrganismLayout mounts children twice (desktop +
 * mobile branch, one hidden via CSS). Every panel testid resolves to 2 elements
 * → Playwright strict-mode violation. Fix: scope all panel locators to the
 * single visible `[data-testid="app-panel-slot"]` element via .filter({visible:true}).
 * Modal is a Radix portal (single instance — NOT inside app-panel-slot) → keeps
 * page-level locators.
 *
 * B3 fix (2026-05-31): shadcn Select for "País de registro" is NOT a native
 * <select> → selectOption() doesn't work. fillNewDoctorForm now uses
 * click-on-trigger + click-on-item pattern.
 */

import type { Page, Locator } from "@playwright/test";

export class StaffDirectoryPage {
  readonly page: Page;

  /** Visible app-panel-slot — root for all panel-scoped locators (B2 fix). */
  readonly panelRoot: Locator;

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

  // + Nuevo doctor modal — Radix portal (page-level, single instance, NOT in panel)
  readonly nuevoIntegranteModal: Locator;
  readonly modalFirstNameInput: Locator;
  readonly modalLastNameInput: Locator;
  readonly modalDniInput: Locator;
  readonly modalEmailInput: Locator;
  readonly modalPhoneInput: Locator;
  readonly modalSpecialtyInput: Locator;
  readonly modalCredentialInput: Locator;
  /** Shadcn SelectTrigger for "País de registro" — click to open dropdown (B3 fix). */
  readonly modalCredentialCountryTrigger: Locator;
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

    // B2 fix: single visible panel root — all panel content is scoped here.
    this.panelRoot = page
      .locator('[data-testid="app-panel-slot"]')
      .filter({ visible: true });

    // Container — component renders data-testid="staff-directory"
    this.staffDirectoryView = this.panelRoot.getByTestId("staff-directory");

    // Header — shipped UI uses "integrante" terminology + dedicated testid
    this.addDoctorButton = this.panelRoot.getByTestId("btn-nuevo-integrante");
    this.searchInput = this.panelRoot.getByPlaceholder(/Buscar/i);
    this.specialtyFilter = this.panelRoot.getByLabel(/Especialidad/i).first();
    this.activeFilter = this.panelRoot.getByLabel(/Activo/i).first();

    // Grid — each card is data-testid="staff-card-{id}"; match by prefix
    this.doctorCards = this.panelRoot.locator('[data-testid^="staff-card-"]');
    this.firstDoctorCard = this.doctorCards.first();

    // Pagination — wrapper data-testid="staff-pagination"; buttons by aria-label
    this.paginationPrev = this.panelRoot.getByRole("button", {
      name: /Página anterior/i,
    });
    this.paginationNext = this.panelRoot.getByRole("button", {
      name: /Página siguiente/i,
    });
    this.paginationInfo = this.panelRoot.getByTestId("staff-pagination");

    // States
    this.loadingSkeleton = this.panelRoot.getByTestId("staff-skeleton");
    this.emptyState = this.panelRoot.getByTestId("empty-doctores");
    this.emptyStateCtaButton = this.panelRoot.getByTestId(
      "btn-agregar-primer-integrante",
    );
    this.errorBanner = this.panelRoot.getByTestId("error-banner-staff");
    this.retryButton = this.panelRoot.getByTestId("btn-reintentar");

    // Modal — Radix portal: both shell branches mount NuevoIntegranteModal, so there
    // can be 2 dialog elements with same testid. Both have data-state="open" when the
    // shared Zustand state is toggled (state is shared between mounted instances).
    // Radix sets data-aria-hidden="true" on the "background" dialog — this is the
    // FIRST one in DOM order (desktop branch mounted first). The LAST one (mobile branch)
    // is the interactive foreground dialog. Use .last() to get the interactable one.
    // NOTE: this is a harness workaround for the dual-mount. The underlying production
    // issue (two NuevoIntegranteModal instances synced) is noted in observed-bugs.
    this.nuevoIntegranteModal = page
      .getByTestId("modal-nuevo-integrante")
      .last();
    this.modalFirstNameInput = this.nuevoIntegranteModal.getByLabel(/Nombre/i);
    this.modalLastNameInput =
      this.nuevoIntegranteModal.getByLabel(/Apellido/i);
    this.modalDniInput = this.nuevoIntegranteModal.getByLabel(/DNI|Documento/i);
    this.modalEmailInput = this.nuevoIntegranteModal.getByLabel(/Correo/i);
    this.modalPhoneInput = this.nuevoIntegranteModal.getByLabel(/Teléfono/i);
    this.modalSpecialtyInput =
      this.nuevoIntegranteModal.getByLabel(/Especialidad/i);
    this.modalCredentialInput =
      this.nuevoIntegranteModal.getByTestId("input-credential");
    // B3 fix: shadcn Select trigger (not native <select>)
    this.modalCredentialCountryTrigger =
      this.nuevoIntegranteModal.getByLabel(/País de registro/i);
    this.modalSubmitButton =
      this.nuevoIntegranteModal.getByTestId("btn-crear-integrante");
    this.modalCancelButton = this.nuevoIntegranteModal.getByRole("button", {
      name: /Cancelar/i,
    });
    // Error message element — <p> with the validation error text.
    // Use paragraph role or text-destructive class to avoid matching labels/options.
    this.modalCredentialError = this.nuevoIntegranteModal
      .locator("p.text-\\[0\\.8rem\\]")
      .filter({ hasText: /credencial.*numérica|La credencial/i })
      .or(
        this.nuevoIntegranteModal.getByText(/La credencial CMP debe ser numérica/i),
      );

    // EntitySubNavBar (in directory: leaves disabled) — panel-scoped
    this.entitySubNavBar = this.panelRoot.getByTestId("entity-sub-nav-bar");
    this.perfilLeaf = this.panelRoot.getByTestId("entity-leaf-perfil");
    this.horariosLeaf = this.panelRoot.getByTestId("entity-leaf-horarios");
    this.serviciosLeaf = this.panelRoot.getByTestId("entity-leaf-servicios");
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

  /**
   * Fill all required fields in the new-doctor modal.
   * B3 fix: "País de registro" is a shadcn Select (not native <select>).
   *   → click trigger → click item with matching value label.
   */
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
      await this._selectCredentialCountry(data.credentialCountry);
    }
  }

  /**
   * Select country in the shadcn Select "País de registro" (B3 fix).
   * Maps country code to display label used in SelectItem.
   */
  private async _selectCredentialCountry(countryCode: string): Promise<void> {
    // Labels must match the exact text in SelectItem (NuevoIntegranteModal.tsx):
    //   PE → "Perú (CMP)", AR → "Argentina", MX → "México", CL → "Chile"
    const labelMap: Record<string, RegExp> = {
      PE: /Perú \(CMP\)/i,
      AR: /Argentina/i,
      MX: /México/i,
      CL: /Chile/i,
      CO: /Colombia/i,
      BR: /Brasil/i,
    };
    const label = labelMap[countryCode] ?? new RegExp(countryCode, "i");

    // Click trigger to open the shadcn Select dropdown
    await this.modalCredentialCountryTrigger.click();

    // Radix Select renders the content as a portal at document body level.
    // Wait for any visible option matching the label.
    const option = this.page.getByRole("option", { name: label });
    await option.waitFor({ state: "visible", timeout: 3_000 });
    await option.click();

    // Dropdown should close after click
    await this.page
      .locator('[role="listbox"]')
      .waitFor({ state: "hidden", timeout: 3_000 })
      .catch(() => {
        /* May already be hidden */
      });
  }

  /** Submit the modal form. */
  async submitNewDoctorForm(): Promise<void> {
    await this.modalSubmitButton.click();
  }

  /** Get a specific doctor card by doctor id (panel-scoped). */
  getDoctorCard(doctorId: string): Locator {
    return this.panelRoot.getByTestId(`staff-card-${doctorId}`);
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
      .catch(() => {
        /* Skeleton may not be rendered for instant mocks */
      });
    await this.panelRoot
      .locator("[data-testid='staff-directory']")
      .waitFor({ timeout: 10_000 });
    // Small stabilization wait to allow React Query to finish rendering cards
    await this.page.waitForTimeout(200);
  }

  /** Search for a doctor by name. */
  async searchFor(query: string): Promise<void> {
    await this.searchInput.fill(query);
    // Wait for debounce + re-render
    await this.page.waitForTimeout(500);
  }

  /** Assert card count equals expected (panel-scoped — counts only visible panel). */
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
    const hasDestructive = await input.evaluate(
      (el) =>
        el.classList.contains("border-destructive") ||
        el.getAttribute("data-invalid") === "true",
    );
    return ariaInvalid === "true" || hasDestructive;
  }
}
