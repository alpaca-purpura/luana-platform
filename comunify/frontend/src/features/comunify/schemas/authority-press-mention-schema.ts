import { z } from "zod";

export const authorityPressMentionSchema = z.object({
  outlet: z.string().min(2, "El nombre del medio es requerido").max(120),
  headline: z.string().min(5, "El título del artículo es requerido").max(300),
  url: z.string().url("Ingresa una URL válida"),
  published_at: z.string().optional(),
});

export type AuthorityPressMentionInput = z.infer<typeof authorityPressMentionSchema>;
