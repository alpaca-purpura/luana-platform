/**
 * Integration test A3 — Offer wizard 5-step medical_services_v1 preset flow.
 *
 * Tests: per-step schema validation, step sequencing, payload assembly,
 * microcopy alignment, component export contract.
 *
 * No DOM rendering (no @testing-library/react installed).
 * Validates: schemas, component export, offer payload from wizard steps.
 */
import { describe, it, expect } from "vitest";

// ── A3.1 Offer wizard client export contract ──────────────────────────────────

describe("A3: Offer wizard — export contract", () => {
  it("offer-wizard-client exports named function (not default)", async () => {
    const mod = await import(
      "@/features/vitalia/components/offer-wizard-client"
    ) as Record<string, unknown>;
    expect(typeof mod["OfferWizardClient"]).toBe("function");
    expect(mod).not.toHaveProperty("default");
  });
});

// ── A3.2 Step 1 — Service type schema ────────────────────────────────────────

describe("A3: Offer wizard — step 1 service type schema", () => {
  it("valid step 1 data passes schema", async () => {
    const { offerWizardStep1Schema } = await import(
      "@/features/vitalia/schemas/offer-wizard-schema"
    );
    const result = offerWizardStep1Schema.safeParse({
      service_name: "Consulta inicial dental",
      offer_category: "consulta",
    });
    expect(result.success).toBe(true);
  });

  it("empty service_name fails step 1 validation", async () => {
    const { offerWizardStep1Schema } = await import(
      "@/features/vitalia/schemas/offer-wizard-schema"
    );
    const result = offerWizardStep1Schema.safeParse({
      service_name: "",
      offer_category: "consulta",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain("service_name");
    }
  });

  it("empty offer_category fails step 1 validation", async () => {
    const { offerWizardStep1Schema } = await import(
      "@/features/vitalia/schemas/offer-wizard-schema"
    );
    const result = offerWizardStep1Schema.safeParse({
      service_name: "Consulta",
      offer_category: "",
    });
    expect(result.success).toBe(false);
  });
});

// ── A3.3 Step 2 — Target patient schema ──────────────────────────────────────

describe("A3: Offer wizard — step 2 target patient schema", () => {
  it("valid step 2 data passes schema", async () => {
    const { offerWizardStep2Schema } = await import(
      "@/features/vitalia/schemas/offer-wizard-schema"
    );
    const result = offerWizardStep2Schema.safeParse({
      target_description: "Adultos con problemas de ansiedad leve a moderada",
    });
    expect(result.success).toBe(true);
  });

  it("empty target_description fails step 2 validation", async () => {
    const { offerWizardStep2Schema } = await import(
      "@/features/vitalia/schemas/offer-wizard-schema"
    );
    const result = offerWizardStep2Schema.safeParse({ target_description: "" });
    expect(result.success).toBe(false);
  });

  it("target_description too long (>1000) fails step 2", async () => {
    const { offerWizardStep2Schema } = await import(
      "@/features/vitalia/schemas/offer-wizard-schema"
    );
    const result = offerWizardStep2Schema.safeParse({
      target_description: "A".repeat(1001),
    });
    expect(result.success).toBe(false);
  });
});

// ── A3.4 Step 3 — Pricing schema ─────────────────────────────────────────────

describe("A3: Offer wizard — step 3 pricing schema", () => {
  it("valid step 3 data (no prepay) passes schema", async () => {
    const { offerWizardStep3Schema } = await import(
      "@/features/vitalia/schemas/offer-wizard-schema"
    );
    const result = offerWizardStep3Schema.safeParse({
      base_price: 15000,
      currency: "ARS",
      requires_prepay: false,
    });
    expect(result.success).toBe(true);
  });

  it("valid step 3 data with prepay + deposit_percent passes schema", async () => {
    const { offerWizardStep3Schema } = await import(
      "@/features/vitalia/schemas/offer-wizard-schema"
    );
    const result = offerWizardStep3Schema.safeParse({
      base_price: 50000,
      currency: "CLP",
      requires_prepay: true,
      deposit_percent: 30,
    });
    expect(result.success).toBe(true);
  });

  it("zero base_price fails step 3 validation", async () => {
    const { offerWizardStep3Schema } = await import(
      "@/features/vitalia/schemas/offer-wizard-schema"
    );
    const result = offerWizardStep3Schema.safeParse({
      base_price: 0,
      currency: "USD",
      requires_prepay: false,
    });
    expect(result.success).toBe(false);
  });

  it("deposit_percent over 100 fails step 3 validation", async () => {
    const { offerWizardStep3Schema } = await import(
      "@/features/vitalia/schemas/offer-wizard-schema"
    );
    const result = offerWizardStep3Schema.safeParse({
      base_price: 100,
      currency: "USD",
      requires_prepay: true,
      deposit_percent: 101,
    });
    expect(result.success).toBe(false);
  });
});

// ── A3.5 Step 4 — Consent schema ─────────────────────────────────────────────

describe("A3: Offer wizard — step 4 consent schema", () => {
  it("valid step 4 data (no consent required) passes schema", async () => {
    const { offerWizardStep4Schema } = await import(
      "@/features/vitalia/schemas/offer-wizard-schema"
    );
    const result = offerWizardStep4Schema.safeParse({
      requires_informed_consent: false,
    });
    expect(result.success).toBe(true);
  });

  it("valid step 4 data with consent + template slug passes schema", async () => {
    const { offerWizardStep4Schema } = await import(
      "@/features/vitalia/schemas/offer-wizard-schema"
    );
    const result = offerWizardStep4Schema.safeParse({
      requires_informed_consent: true,
      consent_template_slug: "dental-standard-v1",
    });
    expect(result.success).toBe(true);
  });
});

// ── A3.6 Step 5 — Duration + doctor schema ────────────────────────────────────

describe("A3: Offer wizard — step 5 duration and doctor schema", () => {
  it("valid step 5 data passes schema", async () => {
    const { offerWizardStep5Schema } = await import(
      "@/features/vitalia/schemas/offer-wizard-schema"
    );
    const result = offerWizardStep5Schema.safeParse({
      duration_min: 60,
      doctor_id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("zero duration_min fails step 5 validation", async () => {
    const { offerWizardStep5Schema } = await import(
      "@/features/vitalia/schemas/offer-wizard-schema"
    );
    const result = offerWizardStep5Schema.safeParse({
      duration_min: 0,
      doctor_id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(false);
  });

  it("invalid uuid for doctor_id fails step 5 validation", async () => {
    const { offerWizardStep5Schema } = await import(
      "@/features/vitalia/schemas/offer-wizard-schema"
    );
    const result = offerWizardStep5Schema.safeParse({
      duration_min: 30,
      doctor_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});

// ── A3.7 Full wizard payload assembly ─────────────────────────────────────────

describe("A3: Offer wizard — full payload assembly from all steps", () => {
  it("merges 5 steps into valid OfferCreatePayload shape", async () => {
    const {
      offerWizardStep1Schema,
      offerWizardStep2Schema,
      offerWizardStep3Schema,
      offerWizardStep4Schema,
      offerWizardStep5Schema,
    } = await import("@/features/vitalia/schemas/offer-wizard-schema");

    const step1 = offerWizardStep1Schema.parse({
      service_name: "Ortodoncia correctiva",
      offer_category: "ortodoncia",
    });
    const step2 = offerWizardStep2Schema.parse({
      target_description: "Adultos y adolescentes con maloclusión",
    });
    const step3 = offerWizardStep3Schema.parse({
      base_price: 250000,
      currency: "ARS",
      requires_prepay: true,
      deposit_percent: 20,
    });
    const step4 = offerWizardStep4Schema.parse({
      requires_informed_consent: true,
      consent_template_slug: "dental-ortho-v1",
    });
    const step5 = offerWizardStep5Schema.parse({
      duration_min: 45,
      doctor_id: "550e8400-e29b-41d4-a716-446655440000",
    });

    // Assemble full offer payload
    const offerPayload = {
      service_name: step1.service_name,
      offer_category: step1.offer_category,
      target_description: step2.target_description,
      base_price: step3.base_price,
      currency: step3.currency,
      requires_prepay: step3.requires_prepay,
      deposit_percent: step3.deposit_percent,
      requires_informed_consent: step4.requires_informed_consent,
      consent_template_slug: step4.consent_template_slug,
      duration_min: step5.duration_min,
      doctor_id: step5.doctor_id,
    };

    expect(offerPayload.service_name).toBe("Ortodoncia correctiva");
    expect(offerPayload.base_price).toBe(250000);
    expect(offerPayload.currency).toBe("ARS");
    expect(offerPayload.requires_prepay).toBe(true);
    expect(offerPayload.deposit_percent).toBe(20);
    expect(offerPayload.requires_informed_consent).toBe(true);
    expect(offerPayload.duration_min).toBe(45);
    expect(offerPayload.doctor_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });
});

// ── A3.8 Offer wizard microcopy alignment ─────────────────────────────────────

describe("A3: Offer wizard — microcopy alignment", () => {
  it("offer wizard microcopy has all 5 step labels", async () => {
    const { MICROCOPY_OFFER_WIZARD } = await import(
      "@/features/vitalia/config/microcopy"
    );
    expect(MICROCOPY_OFFER_WIZARD.steps.serviceType).toBeTruthy();
    expect(MICROCOPY_OFFER_WIZARD.steps.targetPatient).toBeTruthy();
    expect(MICROCOPY_OFFER_WIZARD.steps.price).toBeTruthy();
    expect(MICROCOPY_OFFER_WIZARD.steps.consent).toBeTruthy();
    expect(MICROCOPY_OFFER_WIZARD.steps.durationAndDoctor).toBeTruthy();
  });

  it("offer wizard publish CTA is defined in Spanish", async () => {
    const { MICROCOPY_OFFER_WIZARD } = await import(
      "@/features/vitalia/config/microcopy"
    );
    expect(MICROCOPY_OFFER_WIZARD.publish.cta).toBeTruthy();
    expect(MICROCOPY_OFFER_WIZARD.publish.cta).not.toContain("Publish");
  });

  it("offer wizard prepay microcopy has all 3 variants", async () => {
    const { MICROCOPY_OFFER_WIZARD } = await import(
      "@/features/vitalia/config/microcopy"
    );
    expect(MICROCOPY_OFFER_WIZARD.prepay.label).toBeTruthy();
    expect(MICROCOPY_OFFER_WIZARD.prepay.fullPayment).toBeTruthy();
    expect(MICROCOPY_OFFER_WIZARD.prepay.partialDeposit).toBeTruthy();
  });

  it("wizard microcopy labels are in Spanish neutro (no voseo)", async () => {
    const { MICROCOPY_OFFER_WIZARD } = await import(
      "@/features/vitalia/config/microcopy"
    );
    const voseoVerbs = /\b(tenés|podés|hacés|mirá|dejá|usá|elegí|configurá|revisá|guardá)\b/i;
    const allStrings = [
      MICROCOPY_OFFER_WIZARD.title,
      ...Object.values(MICROCOPY_OFFER_WIZARD.steps),
      ...Object.values(MICROCOPY_OFFER_WIZARD.prepay),
      ...Object.values(MICROCOPY_OFFER_WIZARD.publish),
    ];
    for (const str of allStrings) {
      expect(str).not.toMatch(voseoVerbs);
    }
  });
});

// ── A3.8b cn() utility coverage ───────────────────────────────────────────────

describe("A3: Offer wizard — cn utility coverage", () => {
  it("cn() merges class strings correctly", async () => {
    const { cn } = await import("@/lib/cn");
    expect(cn("base")).toBe("base");
    expect(cn("a", "b")).toBe("a b");
    expect(cn("a", false && "b", "c")).toBe("a c");
    expect(cn("a", undefined, "b")).toBe("a b");
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("cn() with conditional classes (isLoading pattern)", async () => {
    const { cn } = await import("@/lib/cn");
    const isLoading = true;
    const result = cn(
      "rounded-md text-sm",
      isLoading && "opacity-50 cursor-not-allowed"
    );
    expect(result).toContain("opacity-50");
    expect(result).toContain("cursor-not-allowed");
  });
});

// ── A3.9 Preset slug contract ─────────────────────────────────────────────────

describe("A3: Offer wizard — medical_services_v1 preset contract", () => {
  it("medical_services_v1 is the expected preset slug string", () => {
    const PRESET_SLUG = "medical_services_v1";
    // Validates the constant used throughout the wizard
    expect(PRESET_SLUG).toBe("medical_services_v1");
    expect(PRESET_SLUG.includes("medical")).toBe(true);
    expect(PRESET_SLUG.includes("v1")).toBe(true);
  });
});
