import { describe, it, expect } from "vitest";
import {
  offerWizardStep1Schema,
  offerWizardStep2Schema,
  offerWizardStep3Schema,
  offerWizardStep4Schema,
  offerWizardStep5Schema,
} from "@/features/vitalia/schemas/offer-wizard-schema";

describe("offerWizardStep1Schema", () => {
  it("accepts valid step 1 data", () => {
    const result = offerWizardStep1Schema.safeParse({
      service_name: "Implante dental unitario",
      offer_category: "dental_implant",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty service_name", () => {
    const result = offerWizardStep1Schema.safeParse({
      service_name: "",
      offer_category: "dental_implant",
    });
    expect(result.success).toBe(false);
  });
});

describe("offerWizardStep2Schema", () => {
  it("accepts valid step 2 data", () => {
    const result = offerWizardStep2Schema.safeParse({
      target_description: "Pacientes adultos con pérdida de pieza dental",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty target_description", () => {
    const result = offerWizardStep2Schema.safeParse({
      target_description: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("offerWizardStep3Schema", () => {
  it("accepts valid step 3 pricing data", () => {
    const result = offerWizardStep3Schema.safeParse({
      base_price: 85000,
      currency: "ARS",
      requires_prepay: true,
      deposit_percent: 30,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative base_price", () => {
    const result = offerWizardStep3Schema.safeParse({
      base_price: -100,
      currency: "ARS",
      requires_prepay: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejects deposit_percent above 100", () => {
    const result = offerWizardStep3Schema.safeParse({
      base_price: 85000,
      currency: "ARS",
      requires_prepay: true,
      deposit_percent: 110,
    });
    expect(result.success).toBe(false);
  });
});

describe("offerWizardStep4Schema", () => {
  it("accepts step 4 with consent required", () => {
    const result = offerWizardStep4Schema.safeParse({
      requires_informed_consent: true,
      consent_template_slug: "dental_implant_v1",
    });
    expect(result.success).toBe(true);
  });

  it("accepts step 4 without consent", () => {
    const result = offerWizardStep4Schema.safeParse({
      requires_informed_consent: false,
    });
    expect(result.success).toBe(true);
  });
});

describe("offerWizardStep5Schema", () => {
  it("accepts valid step 5 data", () => {
    const result = offerWizardStep5Schema.safeParse({
      duration_min: 90,
      doctor_id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects duration_min of 0", () => {
    const result = offerWizardStep5Schema.safeParse({
      duration_min: 0,
      doctor_id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(false);
  });
});
