import { z } from "zod";

export const planTierSelectionSchema = z.object({
  plan_id: z.string().min(1, "Selecciona un plan"),
  billing_interval: z.enum(["monthly", "yearly"]),
});

export type PlanTierSelectionInput = z.infer<typeof planTierSelectionSchema>;
