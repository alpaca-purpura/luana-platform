import { z } from "zod";

export const nicheAudienceSchema = z.object({
  niche: z.enum(
    [
      "business_coaching",
      "health_creator",
      "course_creator",
      "content_creator",
      "expert_author",
      "consultant",
    ] as const,
    { error: "Selecciona tu nicho" }
  ),
  audience_description: z
    .string()
    .min(20, "Describe tu audiencia en al menos 20 caracteres")
    .max(500),
  follower_count_range: z.enum(["0-1k", "1k-10k", "10k-100k", "100k+"]),
  primary_platform: z.enum(["instagram", "youtube", "tiktok", "linkedin", "podcast", "other"]),
});

export type NicheAudienceInput = z.infer<typeof nicheAudienceSchema>;
