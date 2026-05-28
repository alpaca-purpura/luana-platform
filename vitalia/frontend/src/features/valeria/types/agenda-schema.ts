// cap: scheduling.valeria-agenda
// story-origin: TBD
/**
 * agenda-schema.ts — Zod validation schemas for Valeria Agenda feature.
 * T-11 vitalia-fase2-valeria-agenda
 *
 * Key contract:
 *   - Enum schemas are z.enum(...) native (not z.string())
 *   - ChargeRequestSchema uses discriminatedUnion("currency", [...]) per 03-arch § 6.7
 *     Each currency literal variant restricts fiscalDocType to country-specific values
 *   - emitInvoice=true requires fiscalDocType (cross-field refine)
 *   - PHI masked fields validated as opaque strings (server-masking invariant)
 *   - Spanish neutro LatAm error messages (sin voseo, con tildes)
 *   - ISO 8601 datetimes as string (no Date objects)
 *
 * Named exports only — NO default exports (FSD-Lite boundary enforcement).
 * downstream-regression-na: brand-local FE schemas; no cross-brand consumers
 * spec_anchor: 03-arch.md § 6.7 + § 4.1..4.4 + 06-tickets.yaml T-11 A1+A2
 */

import { z } from "zod";

// ────────────────────────────────────────────────────────────────────────────
// Enum schemas (z.enum native)
// ────────────────────────────────────────────────────────────────────────────

/** Payment status enum — drives slot border color + filter chip. */
export const SlotPaymentStatusSchema = z.enum([
  "paid",
  "deposit",
  "unpaid",
  "no_show",
]);

/** Appointment origin enum — drives badge icon in slot. */
export const AppointmentOriginSchema = z.enum([
  "walk_in",
  "phone",
  "proactive_adrian",
  "existing_patient",
]);

/** Calendar view mode — persisted in URL params. */
export const AgendaViewSchema = z.enum(["dia", "semana", "mes"]);

/** Preset filter chip values. */
export const AgendaFilterSchema = z.enum([
  "today",
  "tomorrow_pending",
  "reschedule",
  "no_shows",
  "pending_balances",
]);

/** Payment method for cobrar saldo form. */
export const PaymentMethodSchema = z.enum([
  "cash",
  "card",
  "transfer",
  "mercadopago",
  "other",
]);

/** Fiscal doc type — top-level union of all country variants. */
export const FiscalDocTypeSchema = z.enum(["factura", "boleta", "ticket"]);

// ────────────────────────────────────────────────────────────────────────────
// AgendaSlot schema (mirrors AgendaSlotDTO)
// ────────────────────────────────────────────────────────────────────────────

/**
 * AgendaSlotSchema — single slot in grid response.
 * PHI invariant: patientNameMasked is an opaque server-masked string.
 * Frontend NEVER receives raw patient.name.
 */
export const AgendaSlotSchema = z.object({
  appointmentId: z.string().uuid(),
  patientId: z.string().uuid(),
  /**
   * HIPAA-lite masked name. Format: "P. Hernández"
   * Validated as non-empty string — server guarantees masking.
   */
  patientNameMasked: z.string().min(1, "Nombre enmascarado requerido"),
  startTime: z.string().datetime({ offset: true }),
  endTime: z.string().datetime({ offset: true }),
  doctorId: z.string().uuid(),
  doctorLabel: z.string().min(1),
  serviceLabel: z.string().min(1),
  appointmentStatus: z.string().min(1),
  paymentStatus: SlotPaymentStatusSchema,
  origin: AppointmentOriginSchema,
  balanceDueCents: z.number().int().nullable(),
  balancePaidCents: z.number().int().nullable(),
  /** ISO 4217 currency code (3 chars, uppercase). */
  currency: z.string().length(3),
});

export type AgendaSlotDTO = z.infer<typeof AgendaSlotSchema>;

// ────────────────────────────────────────────────────────────────────────────
// AgendaGridResponse schema
// ────────────────────────────────────────────────────────────────────────────

export const AgendaGridResponseSchema = z.object({
  view: AgendaViewSchema,
  dateFrom: z.string().datetime({ offset: true }),
  dateTo: z.string().datetime({ offset: true }),
  slots: z.array(AgendaSlotSchema),
  serverTime: z.string().datetime({ offset: true }),
  clinicId: z.string().uuid(),
  tenantId: z.string().uuid(),
});

export type AgendaGridResponseDTO = z.infer<typeof AgendaGridResponseSchema>;

// ────────────────────────────────────────────────────────────────────────────
// AppointmentPayment schema
// ────────────────────────────────────────────────────────────────────────────

export const AppointmentPaymentSchema = z.object({
  paymentId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  currency: z.string().length(3),
  method: z.string().min(1),
  fiscalDocUrl: z.string().url().nullable(),
  fiscalDocType: z.string().nullable(),
  createdAt: z.string().datetime({ offset: true }),
  createdByLabel: z.string().nullable(),
});

export type AppointmentPaymentDTO = z.infer<typeof AppointmentPaymentSchema>;

// ────────────────────────────────────────────────────────────────────────────
// AppointmentDetail schema (drawer)
// ────────────────────────────────────────────────────────────────────────────

/**
 * AppointmentDetailSchema — full drawer data.
 * PHI invariant: all patient-identifying fields are server-masked.
 *   patientNameMasked: "P. Hernández"
 *   patientDniMasked:  "12.***.***"
 *   patientPhoneMasked: "+51 9** *** 423"
 *   patientEmailMasked: "p***@gmail.com"
 */
export const AppointmentDetailSchema = z.object({
  appointmentId: z.string().uuid(),
  patientId: z.string().uuid(),
  /** Server-masked. Format: "P. Hernández". NEVER raw name. */
  patientNameMasked: z.string().min(1, "Nombre enmascarado requerido"),
  /** Server-masked DNI. Format: "12.***.***". Null if not registered. */
  patientDniMasked: z.string().nullable(),
  /** Server-masked phone. Format: "+51 9** *** 423". Null if not registered. */
  patientPhoneMasked: z.string().nullable(),
  /** Server-masked email. Format: "p***@gmail.com". Null if not registered. */
  patientEmailMasked: z.string().nullable(),
  startTime: z.string().datetime({ offset: true }),
  endTime: z.string().datetime({ offset: true }),
  doctorId: z.string().uuid(),
  doctorLabel: z.string().min(1),
  serviceLabel: z.string().min(1),
  appointmentStatus: z.string().min(1),
  paymentStatus: SlotPaymentStatusSchema,
  origin: AppointmentOriginSchema,
  balanceDueCents: z.number().int().nullable(),
  balancePaidCents: z.number().int().nullable(),
  currency: z.string().length(3),
  /** Per-transaction currency override (e.g. USD for tourist visit in AR). */
  currencyOverride: z.string().length(3).nullable(),
  payments: z.array(AppointmentPaymentSchema),
  notesInternal: z.string().nullable(),
  lastActivityAt: z.string().datetime({ offset: true }).nullable(),
  lastActivityByLabel: z.string().nullable(),
});

export type AppointmentDetailDTO = z.infer<typeof AppointmentDetailSchema>;

// ────────────────────────────────────────────────────────────────────────────
// FiscalDocument schema
// ────────────────────────────────────────────────────────────────────────────

export const FiscalDocumentSchema = z.object({
  fiscalDocId: z.string().uuid(),
  appointmentPaymentId: z.string().uuid(),
  docType: z.string().min(1),
  docNumber: z.string().nullable(),
  docUrl: z.string().url().nullable(),
  status: z.enum(["emitted", "pending", "failed"]),
  errorMessage: z.string().nullable(),
  createdAt: z.string().datetime({ offset: true }),
});

export type FiscalDocumentDTO = z.infer<typeof FiscalDocumentSchema>;

// ────────────────────────────────────────────────────────────────────────────
// ChargeRequestSchema — discriminated union by currency
// Per 03-arch § 6.7: discriminator is "currency" (country-specific fiscal types)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Base charge fields shared across all currency variants.
 * Extend per currency to restrict fiscalDocType to country-specific values.
 */
const baseChargeFields = {
  appointmentId: z.string().uuid("ID de turno inválido"),
  amountCents: z.number().int("El monto debe ser un número entero").positive("El monto debe ser mayor a cero"),
  method: PaymentMethodSchema,
  emitInvoice: z.boolean().default(true),
  notes: z.string().max(500, "Las notas no pueden superar 500 caracteres").optional(),
  idempotencyKey: z.string().uuid("Clave de idempotencia inválida"),
};

/**
 * ChargeRequestSchema — currency-discriminated union.
 *
 * Per 03-arch § 6.7, fiscalDocType varies by currency/country:
 *   PEN (Perú):    boleta | factura
 *   ARS (Argentina): factura_b | factura_a | recibo
 *   MXN (México):  cfdi | ticket
 *   USD:           ticket | factura
 *   COP (Colombia): ticket
 *   CLP (Chile):   boleta | factura
 *
 * Cross-field refine: emitInvoice=true requires fiscalDocType.
 * Error message: Spanish neutro LatAm.
 */
export const ChargeRequestSchema = z
  .discriminatedUnion("currency", [
    z.object({
      ...baseChargeFields,
      currency: z.literal("PEN"),
      fiscalDocType: z
        .enum(["boleta", "factura"], {
          error: "Tipo de comprobante inválido para PEN",
        })
        .optional(),
    }),
    z.object({
      ...baseChargeFields,
      currency: z.literal("ARS"),
      fiscalDocType: z
        .enum(["factura_b", "factura_a", "recibo"], {
          error: "Tipo de comprobante inválido para ARS",
        })
        .optional(),
    }),
    z.object({
      ...baseChargeFields,
      currency: z.literal("MXN"),
      fiscalDocType: z
        .enum(["cfdi", "ticket"], {
          error: "Tipo de comprobante inválido para MXN",
        })
        .optional(),
    }),
    z.object({
      ...baseChargeFields,
      currency: z.literal("USD"),
      fiscalDocType: z
        .enum(["ticket", "factura"], {
          error: "Tipo de comprobante inválido para USD",
        })
        .optional(),
    }),
    z.object({
      ...baseChargeFields,
      currency: z.literal("COP"),
      fiscalDocType: z
        .enum(["ticket"], {
          error: "Tipo de comprobante inválido para COP",
        })
        .optional(),
    }),
    z.object({
      ...baseChargeFields,
      currency: z.literal("CLP"),
      fiscalDocType: z
        .enum(["boleta", "factura"], {
          error: "Tipo de comprobante inválido para CLP",
        })
        .optional(),
    }),
  ])
  .refine(
    (data) => !data.emitInvoice || !!data.fiscalDocType,
    {
      message: "El tipo de comprobante es requerido cuando se emite un comprobante",
      path: ["fiscalDocType"],
    },
  );

export type ChargeFormValues = z.infer<typeof ChargeRequestSchema>;

// ────────────────────────────────────────────────────────────────────────────
// ChargeResponseSchema — mirrors ChargeResponseDTO
// ────────────────────────────────────────────────────────────────────────────

export const ChargeResponseSchema = z.object({
  paymentId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  currency: z.string().length(3),
  method: z.string().min(1),
  externalPaymentId: z.string().nullable(),
  fiscalDocId: z.string().uuid().nullable(),
  fiscalDocUrl: z.string().url().nullable(),
  fiscalEmissionStatus: z.enum(["emitted", "pending", "failed", "skipped"]),
  fiscalErrorMessage: z.string().nullable(),
  /** Remaining balance after payment (cents). 0 = paid in full. */
  balanceAfterCents: z.number().int(),
});

export type ChargeResponseDTO = z.infer<typeof ChargeResponseSchema>;

// ────────────────────────────────────────────────────────────────────────────
// CreateAppointmentRequestSchema
// ────────────────────────────────────────────────────────────────────────────

const PatientNewDataSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(128, "El nombre no puede superar 128 caracteres"),
  dni: z.string().max(32).nullable().optional(),
  phone: z
    .string()
    .min(6, "El teléfono debe tener al menos 6 caracteres")
    .max(24, "El teléfono no puede superar 24 caracteres"),
  email: z.string().email("Correo inválido").nullable().optional(),
});

export const CreateAppointmentRequestSchema = z.object({
  origin: z.enum(["walk_in", "telefono", "existing_patient"], {
    error: "Origen de turno inválido",
  }),
  patientId: z.string().uuid("ID de paciente inválido").nullable(),
  patientNewData: PatientNewDataSchema.nullable(),
  doctorId: z.string().uuid("ID de médico inválido"),
  serviceLabel: z
    .string()
    .min(1, "La descripción del servicio es requerida")
    .max(128, "La descripción del servicio no puede superar 128 caracteres"),
  startTime: z.string().datetime({ offset: true, message: "Fecha de inicio inválida" }),
  endTime: z.string().datetime({ offset: true, message: "Fecha de fin inválida" }),
  notesInternal: z
    .string()
    .max(500, "Las notas no pueden superar 500 caracteres")
    .nullable(),
  /** Per-appointment currency override (ISO 4217). Null = use tenant default. */
  currencyOverride: z.string().length(3).nullable(),
});

export type CreateAppointmentRequestDTO = z.infer<
  typeof CreateAppointmentRequestSchema
>;

// ────────────────────────────────────────────────────────────────────────────
// PatchAppointmentRequestSchema
// ────────────────────────────────────────────────────────────────────────────

export const PatchAppointmentRequestSchema = z.object({
  newStatus: z.enum(["CANCELLED", "COMPLETED", "NO_SHOW"], {
    error: "Estado de turno inválido",
  }),
  reason: z
    .string()
    .max(500, "El motivo no puede superar 500 caracteres")
    .optional(),
});

export type PatchAppointmentRequestDTO = z.infer<
  typeof PatchAppointmentRequestSchema
>;

// ────────────────────────────────────────────────────────────────────────────
// NotifyRequestSchema
// ────────────────────────────────────────────────────────────────────────────

export const NotifyRequestSchema = z.object({
  templateId: z
    .string()
    .min(1, "El ID de plantilla es requerido")
    .max(64, "El ID de plantilla no puede superar 64 caracteres"),
  scheduledFor: z.string().datetime({ offset: true, message: "Fecha de envío inválida" }),
  locale: z.string().min(2, "El locale es requerido"),
});

export type NotifyRequestDTO = z.infer<typeof NotifyRequestSchema>;
