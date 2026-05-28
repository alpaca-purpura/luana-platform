// cap: shell-organism.shell-vitalia
// atomics: TBD
// story-origin: TBD
import { z } from "zod";

export const offerWizardStep1Schema = z.object({
  service_name: z.string().min(1, "Nombre del servicio requerido").max(255),
  offer_category: z.string().min(1, "Categoría requerida"),
});

export const offerWizardStep2Schema = z.object({
  target_description: z
    .string()
    .min(1, "Descripción del paciente objetivo requerida")
    .max(1000),
});

export const offerWizardStep3Schema = z.object({
  base_price: z.number().positive("El precio debe ser mayor a 0"),
  currency: z.string().min(3).max(3),
  requires_prepay: z.boolean(),
  deposit_percent: z.number().min(0).max(100).optional(),
});

export const offerWizardStep4Schema = z.object({
  requires_informed_consent: z.boolean(),
  consent_template_slug: z.string().min(1).max(64).optional(),
});

export const offerWizardStep5Schema = z.object({
  duration_min: z.number().int().positive("La duración debe ser mayor a 0"),
  doctor_id: z.string().uuid("ID de profesional inválido"),
});

export type OfferWizardStep1Input = z.infer<typeof offerWizardStep1Schema>;
export type OfferWizardStep2Input = z.infer<typeof offerWizardStep2Schema>;
export type OfferWizardStep3Input = z.infer<typeof offerWizardStep3Schema>;
export type OfferWizardStep4Input = z.infer<typeof offerWizardStep4Schema>;
export type OfferWizardStep5Input = z.infer<typeof offerWizardStep5Schema>;
