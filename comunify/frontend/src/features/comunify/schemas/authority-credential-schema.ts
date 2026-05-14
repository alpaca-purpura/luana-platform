import { z } from "zod";

export const authorityCredentialSchema = z.object({
  title: z.string().min(2, "Ingresa el nombre del certificado").max(200),
  issuer: z.string().min(2, "Ingresa la institución emisora").max(200),
  issued_year: z.number().int().min(1970).max(new Date().getFullYear()).optional(),
  credential_url: z.string().url("Ingresa una URL válida").optional().or(z.literal("")),
});

export const authorityCaseStudySchema = z.object({
  title: z.string().min(3).max(200),
  client_name: z.string().min(2).max(100),
  result_summary: z.string().min(20, "Describe el resultado en al menos 20 caracteres").max(500),
  url: z.string().url("Ingresa una URL válida").optional().or(z.literal("")),
});

export const authorityPressMentionSchema = z.object({
  publication: z.string().min(2).max(100),
  headline: z.string().min(5).max(300),
  url: z.string().url("Ingresa la URL de la mención"),
  published_at: z.string().optional(),
});

export type AuthorityCredentialInput = z.infer<typeof authorityCredentialSchema>;
export type AuthorityCaseStudyInput = z.infer<typeof authorityCaseStudySchema>;
export type AuthorityPressMentionInput = z.infer<typeof authorityPressMentionSchema>;
