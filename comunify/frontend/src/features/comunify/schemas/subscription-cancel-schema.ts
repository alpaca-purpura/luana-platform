import { z } from "zod";

export const subscriptionCancelSchema = z.object({
  reason: z.enum(["too_expensive", "not_using", "found_alternative", "other"] as const, {
    error: "Selecciona un motivo",
  }),
  feedback: z.string().max(500).optional(),
  cancel_immediately: z.boolean().default(false),
});

export type SubscriptionCancelInput = z.infer<typeof subscriptionCancelSchema>;
