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
 */

import type { Page, Locator } from "@playwright/test";

export class DoctorWorkspacePage {
  readonly page: Page;

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

    // Nav
    this.entitySubNavBar = page.getByTestId("entity-sub-nav-bar");
    this.backToStaffLink = page.getByRole("link", { name: /Staff/i });
    this.perfilTab = page.getByTestId("entity-leaf-perfil");
    this.horariosTab = page.getByTestId("entity-leaf-horarios");
    this.serviciosTab = page.getByTestId("entity-leaf-servicios");
    this.entityName = page.locator("[data-testid='entity-sub-nav-bar'] .truncate");

    // Perfil
    this.specialtyInput = page.getByLabel("Especialidad");
    this.phoneInput = page.getByLabel("Teléfono");
    this.yearsExperienceInput = page.getByLabel("Años de experiencia");
    this.languagesInput = page.getByLabel("Idiomas (separados por coma)");
    this.visibilityToggle = page.getByLabel("Visible en landing");
    this.autosaveHint = page.getByText("Los cambios se guardan automáticamente");

    // Bio
    this.bioNotesTextarea = page.getByLabel("Notas para la bio");
    this.bioLinkInput = page.getByLabel("URL de referencia");
    this.bioAddLinkButton = page.getByRole("button", { name: "Agregar" });
    this.generateBioButton = page.getByRole("button", { name: /Generar bio/i });

    // Avatar
    this.avatarButton = page.getByRole("button", { name: /Cambiar foto/i });
    this.dropzoneArea = page.getByTestId("dropzone-area");

    // Servicios
    this.serviciosPlaceholder = page.getByTestId("servicios-placeholder");
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
    const tab = this.page.getByTestId(`entity-leaf-${leafId}`);
    await tab.click();
    await this.page.waitForURL(`**/${leafId}`);
  }

  /** Press Arrow key on the tablist for keyboard nav (SC-10) */
  async pressArrowRight() {
    const tablist = this.page.getByRole("tablist");
    await tablist.focus();
    await this.page.keyboard.press("ArrowRight");
  }

  async pressArrowLeft() {
    const tablist = this.page.getByRole("tablist");
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
