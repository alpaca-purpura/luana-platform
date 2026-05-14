import { z } from "zod";

export const broadcastComposeSchema = z.object({
  subject: z.string().min(3, "Ingresa el asunto del mensaje").max(100),
  body: z.string().min(10, "El mensaje debe tener al menos 10 caracteres").max(2000),
  channel: z.enum(["whatsapp", "email", "sms"] as const, {
    error: "Selecciona un canal",
  }),
  audience: z.enum(["all", "engaged_only", "inactive_7d"] as const, {
    error: "Selecciona la audiencia",
  }),
  voice_embed_url: z.string().url("URL inválida").optional().or(z.literal("")),
  video_link_url: z.string().url("URL inválida").optional().or(z.literal("")),
});

export type BroadcastComposeInput = z.infer<typeof broadcastComposeSchema>;
