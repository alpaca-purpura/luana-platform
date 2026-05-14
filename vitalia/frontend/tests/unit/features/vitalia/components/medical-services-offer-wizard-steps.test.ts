/**
 * Tests for MedicalServicesOfferWizardSteps component contract.
 * Verifies: named exports, wizard steps, microcopy alignment.
 */
import { describe, it, expect } from "vitest";

describe("MedicalServicesOfferWizardSteps exports", () => {
  it("exports MedicalServicesOfferWizardSteps as named export", async () => {
    const mod = await import(
      "@/features/vitalia/components/medical-services-offer-wizard-steps"
    );
    expect(typeof mod.MedicalServicesOfferWizardSteps).toBe("function");
    expect(mod).not.toHaveProperty("default");
  });

  it("exports OFFER_WIZARD_STEPS array with 5 steps", async () => {
    const { OFFER_WIZARD_STEPS } = await import(
      "@/features/vitalia/components/medical-services-offer-wizard-steps"
    );
    expect(Array.isArray(OFFER_WIZARD_STEPS)).toBe(true);
    expect(OFFER_WIZARD_STEPS).toHaveLength(5);
  });

  it("wizard steps are numbered 1-5", async () => {
    const { OFFER_WIZARD_STEPS } = await import(
      "@/features/vitalia/components/medical-services-offer-wizard-steps"
    );
    const nums = OFFER_WIZARD_STEPS.map((s) => s.stepNumber);
    expect(nums).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("MedicalServicesOfferWizardSteps microcopy", () => {
  it("all 5 steps have non-empty labels", async () => {
    const { OFFER_WIZARD_STEPS } = await import(
      "@/features/vitalia/components/medical-services-offer-wizard-steps"
    );
    for (const step of OFFER_WIZARD_STEPS) {
      expect(typeof step.label).toBe("string");
      expect(step.label.length).toBeGreaterThan(0);
    }
  });

  it("microcopy has publish CTA text", async () => {
    const { MICROCOPY_OFFER_WIZARD } = await import("@/features/vitalia/config/microcopy");
    expect(MICROCOPY_OFFER_WIZARD.publish.cta).toBe("Publicar oferta");
    expect(MICROCOPY_OFFER_WIZARD.publish.successTitle).toBe("Oferta publicada");
  });

  it("prepay microcopy has no voseo", async () => {
    const { MICROCOPY_OFFER_WIZARD } = await import("@/features/vitalia/config/microcopy");
    const voseoVerbs = /\b(tenés|podés|hacés|mirá|dejá|usá)\b/i;
    expect(MICROCOPY_OFFER_WIZARD.prepay.label).not.toMatch(voseoVerbs);
    expect(MICROCOPY_OFFER_WIZARD.prepay.fullPayment).not.toMatch(voseoVerbs);
    expect(MICROCOPY_OFFER_WIZARD.prepay.partialDeposit).not.toMatch(voseoVerbs);
  });
});
