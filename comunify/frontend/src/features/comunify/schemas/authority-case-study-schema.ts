import { z } from "zod";

export const authorityCaseStudySchema = z.object({
  client_name: z.string().min(2, "El nombre del cliente es requerido").max(120),
  result: z.string().min(10, "Describe el resultado obtenido").max(500),
  timeframe: z.string().max(80).optional(),
  testimonial_quote: z.string().max(600).optional(),
});

export type AuthorityCaseStudyInput = z.infer<typeof authorityCaseStudySchema>;
