import { z } from "zod";

/** Step 1 — Tipo de oferta */
export const offerTypeStepSchema = z.object({
  preset_id: z.string().min(1, "Selecciona un tipo de oferta"),
});

/** Step 2 — Nombre y propuesta de valor */
export const offerBasicsStepSchema = z.object({
  title: z.string().min(3, "Ingresa el nombre de tu oferta").max(120),
  short_description: z.string().min(10).max(280),
  value_level: z.enum(["lead_magnet", "tripwire", "core", "premium", "enterprise"]),
});

/** Step 3 — Precio y entrega */
export const offerPricingStepSchema = z.object({
  price: z.number().min(0, "El precio no puede ser negativo"),
  currency: z.string().length(3),
  delivery_format: z.enum(["live", "async", "hybrid"]),
  duration_weeks: z.number().int().min(1).optional(),
});

/** Step 4 — Detalles de la oferta */
export const offerDetailsStepSchema = z.object({
  includes: z.array(z.string().min(1)).min(1, "Agrega al menos un beneficio"),
  target_result: z.string().min(10).max(500),
});

/** Step 5 — Publicación */
export const offerPublishStepSchema = z.object({
  is_published: z.boolean(),
  published_at: z.string().optional(),
});

/** Full wizard schema */
export const coachingOfferWizardSchema = offerTypeStepSchema
  .merge(offerBasicsStepSchema)
  .merge(offerPricingStepSchema)
  .merge(offerDetailsStepSchema)
  .merge(offerPublishStepSchema);

export type CoachingOfferWizardInput = z.infer<typeof coachingOfferWizardSchema>;
