// cap: clinics.lisa.doctores
// story-origin: vitalia-fase2-lisa-doctores
/**
 * DoctorWorkspacePage.ts — Playwright POM for doctor workspace.
 *
 * Covers: EntitySubNavBar + perfil autosave + bio generation + avatar upload.
 *
 * Used by T-E2E specs for SC-10 (keyboard nav) and visual goldens.
 *
 * T-FE-2 vitalia-fase2-lisa-doctores
 * spec_anchor: 04-validators.yaml § POM fixtures
 *
 * B2 fix (2026-05-31): ShellOrganismLayout mounts children twice (desktop +
 * mobile branch, one hidden via CSS). Every panel testid resolves to 2 elements
 * → Playwright strict-mode violation. Fix: scope all panel locators to the
 * single visible `[data-testid="app-panel-slot"]` element via .filter({visible:true}).
 */

import type { Page, Locator } from "@playwright/test";

export class DoctorWorkspacePage {
  readonly page: Page;

  /** Visible app-panel-slot — root for all panel-scoped locators (B2 fix). */
  readonly panelRoot: Locator;

  // Navigation
  readonly entitySubNavBar: Locator;
  readonly backToStaffLink: Locator;
  readonly perfilTab: Locator;
  readonly horariosTab: Locator;
  readonly serviciosTab: Locator;
  readonly entityName: Locator;

  // Perfil form
  readonly specialtyInput: Locator;
  readonly phoneInput: Locator;
  readonly yearsExperienceInput: Locator;
  readonly languagesInput: Locator;
  readonly visibilityToggle: Locator;
  readonly autosaveHint: Locator;

  // Bio repo inputs
  readonly bioNotesTextarea: Locator;
  readonly bioLinkInput: Locator;
  readonly bioAddLinkButton: Locator;
  readonly generateBioButton: Locator;

  // Avatar uploader
  readonly avatarButton: Locator;
  readonly dropzoneArea: Locator;

  // Servicios placeholder
  readonly serviciosPlaceholder: Locator;

  constructor(page: Page) {
    this.page = page;

    // B2 fix: single visible panel root — all panel content is scoped here.
    this.panelRoot = page
      .locator('[data-testid="app-panel-slot"]')
      .filter({ visible: true });

    // Nav — panel-scoped
    this.entitySubNavBar = this.panelRoot.getByTestId("entity-sub-nav-bar");
    this.backToStaffLink = this.panelRoot.getByRole("link", { name: /Staff/i });
    this.perfilTab = this.panelRoot.getByTestId("entity-leaf-perfil");
    this.horariosTab = this.panelRoot.getByTestId("entity-leaf-horarios");
    this.serviciosTab = this.panelRoot.getByTestId("entity-leaf-servicios");
    this.entityName = this.panelRoot.locator(
      "[data-testid='entity-sub-nav-bar'] .truncate",
    );

    // Perfil — panel-scoped
    this.specialtyInput = this.panelRoot.getByLabel("Especialidad");
    this.phoneInput = this.panelRoot.getByLabel("Teléfono");
    this.yearsExperienceInput = this.panelRoot.getByLabel("Años de experiencia");
    this.languagesInput = this.panelRoot.getByLabel(
      "Idiomas (separados por coma)",
    );
    this.visibilityToggle = this.panelRoot.getByLabel("Visible en landing");
    this.autosaveHint = this.panelRoot.getByText(
      "Los cambios se guardan automáticamente",
    );

    // Bio — panel-scoped
    this.bioNotesTextarea = this.panelRoot.getByLabel("Notas para la bio");
    this.bioLinkInput = this.panelRoot.getByLabel("URL de referencia");
    this.bioAddLinkButton = this.panelRoot.getByRole("button", {
      name: "Agregar",
    });
    this.generateBioButton = this.panelRoot.getByRole("button", {
      name: /Generar bio/i,
    });

    // Avatar — panel-scoped
    this.avatarButton = this.panelRoot.getByRole("button", {
      name: /Cambiar foto/i,
    });
    this.dropzoneArea = this.panelRoot.getByTestId("dropzone-area");

    // Servicios — panel-scoped
    this.serviciosPlaceholder = this.panelRoot.getByTestId("servicios-placeholder");
  }

  async navigateToPerfil(tenantId: string, doctorId: string) {
    await this.page.goto(`/${tenantId}/lisa/staff/${doctorId}/perfil`);
  }

  async navigateToHorarios(tenantId: string, doctorId: string) {
    await this.page.goto(`/${tenantId}/lisa/staff/${doctorId}/horarios`);
  }

  async navigateToServicios(tenantId: string, doctorId: string) {
    await this.page.goto(`/${tenantId}/lisa/staff/${doctorId}/servicios`);
  }

  /** Click a leaf tab by id and wait for navigation */
  async clickLeaf(leafId: "perfil" | "horarios" | "servicios") {
    const tab = this.panelRoot.getByTestId(`entity-leaf-${leafId}`);
    await tab.click();
    await this.page.waitForURL(`**/${leafId}`);
  }

  /** Press Arrow key on the tablist for keyboard nav (SC-10) */
  async pressArrowRight() {
    const tablist = this.panelRoot.getByRole("tablist");
    await tablist.focus();
    await this.page.keyboard.press("ArrowRight");
  }

  async pressArrowLeft() {
    const tablist = this.panelRoot.getByRole("tablist");
    await tablist.focus();
    await this.page.keyboard.press("ArrowLeft");
  }

  /** Fill specialty and wait for autosave */
  async fillSpecialtyAndWait(value: string) {
    await this.specialtyInput.clear();
    await this.specialtyInput.fill(value);
    // Wait 600ms debounce + server response
    await this.page.waitForTimeout(800);
  }

  /** Click generate bio and wait for sections to appear */
  async generateBio() {
    await this.generateBioButton.click();
    await this.page.waitForSelector("[contenteditable]", { timeout: 10_000 });
  }
}
