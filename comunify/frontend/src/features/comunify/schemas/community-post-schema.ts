import { z } from "zod";

export const communityPostSchema = z.object({
  cohort_id: z.string().optional(),
  content: z.string().min(1, "El mensaje no puede estar vacío").max(2000),
  media_url: z.string().url("URL inválida").optional().or(z.literal("")),
});

export type CommunityPostInput = z.infer<typeof communityPostSchema>;
