// cap: clinics.lisa.doctores
// story-origin: vitalia-fase2-lisa-doctores
/**
 * staff-schema.ts — Zod schemas for NuevoIntegrante form + availability block forms.
 *
 * NuevoIntegranteModal is submit-driven (atomic create — one exception to autosave).
 * Credential validation is country-specific:
 *   PE: CMP — numeric only
 *   AR: Matrícula nacional — alphanumeric
 *   MX: Cédula profesional — alphanumeric
 *   CL: Registro nacional — alphanumeric
 *
 * T-FE-1 vitalia-fase2-lisa-doctores
 * spec_anchor: 03-arch-fe.md § Forms + 01-spec.md § Business rules credential-validator-country-specific
 * downstream-regression-na: brand-local vitalia FE schema; no cross-brand consumers
 */

import { z } from "zod";

// ── Country-specific credential validators ─────────────────────────────────────

/**
 * Credential validation per country (mirrors backend credential_validator.py).
 * PE: CMP numeric only. AR/MX/CL: alphanumeric.
 */
function credentialRefinement(country: string, credential: string): boolean {
  if (!credential) return true; // Required check handled separately
  switch (country) {
    case "PE":
      return /^\d+$/.test(credential);
    case "AR":
    case "MX":
    case "CL":
      return /^[A-Za-z0-9\s-]+$/.test(credential);
    default:
      return true;
  }
}

function credentialErrorMessage(country: string): string {
  switch (country) {
    case "PE":
      return "La credencial CMP debe ser numérica";
    case "AR":
      return "La matrícula debe contener solo letras, números o guiones";
    case "MX":
      return "La cédula profesional debe contener solo letras, números o guiones";
    case "CL":
      return "El registro nacional debe contener solo letras, números o guiones";
    default:
      return "Credencial inválida";
  }
}

// ── Doctor create schema (NuevoIntegranteModal — submit-driven) ────────────────

export const doctorCreateSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "El nombre es requerido")
      .max(100, "Máximo 100 caracteres"),
    lastName: z
      .string()
      .min(1, "El apellido es requerido")
      .max(100, "Máximo 100 caracteres"),
    dni: z
      .string()
      .min(1, "El documento es requerido")
      .max(20, "Máximo 20 caracteres"),
    email: z
      .string()
      .email("Correo electrónico inválido")
      .max(200, "Máximo 200 caracteres"),
    phone: z
      .string()
      .max(30, "Máximo 30 caracteres")
      .optional()
      .or(z.literal("")),
    specialty: z
      .string()
      .max(100, "Máximo 100 caracteres")
      .optional()
      .or(z.literal("")),
    credential: z
      .string()
      .min(1, "La credencial es requerida")
      .max(50, "Máximo 50 caracteres"),
    credentialCountry: z.enum(["PE", "AR", "MX", "CL"]),
    active: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!credentialRefinement(data.credentialCountry, data.credential)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: credentialErrorMessage(data.credentialCountry),
        path: ["credential"],
      });
    }
  });

export type DoctorCreateFormValues = z.infer<typeof doctorCreateSchema>;

// ── Bio schema (autosave patch) ────────────────────────────────────────────────

export const bioSchema = z.object({
  bioInputsNotes: z.string().max(5000, "Máximo 5000 caracteres").optional(),
  bioLinks: z.array(z.string().url("URL inválida")).max(20),
  bioPublicResumen: z
    .string()
    .max(2000, "Máximo 2000 caracteres")
    .optional()
    .or(z.literal("")),
  bioPublicFormacion: z
    .string()
    .max(2000, "Máximo 2000 caracteres")
    .optional()
    .or(z.literal("")),
  bioPublicEnfoque: z
    .string()
    .max(2000, "Máximo 2000 caracteres")
    .optional()
    .or(z.literal("")),
});

export type BioFormValues = z.infer<typeof bioSchema>;

// ── Availability block schema (recurrent vs one-off — discriminated union) ─────

const recurrentBlockSchema = z
  .object({
    kind: z.literal("recurrent"),
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Formato inválido (HH:mm)"),
    endTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Formato inválido (HH:mm)"),
    freq: z.enum(["weekly", "biweekly"]),
    endConditionKind: z.enum(["end_date", "occurrences", "open_ended"]),
    endDate: z.string().optional().nullable(),
    occurrences: z.number().int().min(1).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.endConditionKind === "end_date" && !data.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecciona una fecha de fin",
        path: ["endDate"],
      });
    }
    if (data.endConditionKind === "occurrences" && !data.occurrences) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ingresa el número de iteraciones",
        path: ["occurrences"],
      });
    }
  });

const oneOffBlockSchema = z.object({
  kind: z.literal("one_off"),
  specificDate: z.string().min(1, "Selecciona una fecha"),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Formato inválido (HH:mm)"),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Formato inválido (HH:mm)"),
});

export const availabilityBlockSchema = z.discriminatedUnion("kind", [
  recurrentBlockSchema,
  oneOffBlockSchema,
]);

export type AvailabilityBlockFormValues = z.infer<
  typeof availabilityBlockSchema
>;
