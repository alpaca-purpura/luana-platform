import { z } from "zod";

export const creatorProfileSchema = z.object({
  creator_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(120),
  creator_handle: z
    .string()
    .min(3, "El handle debe tener al menos 3 caracteres")
    .max(40)
    .regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  country: z.enum(["AR", "CL", "MX", "CO", "PE", "BR", "UY", "US", "ES"] as const, {
    error: "Selecciona un país",
  }),
  city: z.string().min(2, "Ingresa tu ciudad").max(120),
  main_language: z.enum(["es-neutral", "es-AR", "es-CL", "es-MX"] as const, {
    error: "Selecciona tu variante de español",
  }),
  bio: z.string().max(500).optional(),
  website_url: z.string().url("Ingresa una URL válida").optional().or(z.literal("")),
});

export type CreatorProfileInput = z.infer<typeof creatorProfileSchema>;
