import { z } from "zod";

export const moderationActionSchema = z.object({
  action: z.enum(["approve", "reject", "ban"] as const, {
    error: "Acción inválida",
  }),
  reason: z.string().max(500).optional(),
});

export type ModerationActionInput = z.infer<typeof moderationActionSchema>;
