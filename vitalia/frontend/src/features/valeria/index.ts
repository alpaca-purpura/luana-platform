/**
 * valeria/index.ts — Feature public API (FSD-Lite boundary matrix).
 * F1-S10 vitalia-fase1-empty-states · T-11 vitalia-fase2-valeria-agenda
 *
 * Exposes placeholder components created in T-2 and T-7.
 * T-7 adds 5 agenda molecules + AgendaPlaceholder organismo.
 * T-11 adds agenda TypeScript types + Zod runtime schemas.
 *
 * downstream-regression-na: brand-local FE barrel; no cross-brand consumers
 */

// ── Agenda types + Zod schemas (T-11) ────────────────────────────────────────
export type {
  SlotPaymentStatus,
  AppointmentOrigin,
  AgendaView,
  AgendaFilter,
  PaymentMethod,
  FiscalDocType,
  AgendaSlot as AgendaSlotDTO,
  AgendaGridResponse,
  AppointmentPayment,
  Appointment,
  FiscalDocument,
} from "./types/agenda.types";

export {
  SlotPaymentStatusSchema,
  AppointmentOriginSchema,
  AgendaViewSchema,
  AgendaFilterSchema,
  PaymentMethodSchema,
  FiscalDocTypeSchema,
  AgendaSlotSchema,
  AgendaGridResponseSchema,
  AppointmentDetailSchema,
  AppointmentPaymentSchema,
  FiscalDocumentSchema,
  ChargeRequestSchema,
  ChargeResponseSchema,
  CreateAppointmentRequestSchema,
  PatchAppointmentRequestSchema,
  NotifyRequestSchema,
} from "./types/agenda-schema";
export type {
  ChargeFormValues,
  ChargeResponseDTO,
  CreateAppointmentRequestDTO,
  PatchAppointmentRequestDTO,
  NotifyRequestDTO,
} from "./types/agenda-schema";

// ── Placeholder components (T-2 generic EmptyState wrappers) ──────────────────
export { PacientesPlaceholder } from "./components/placeholders/PacientesPlaceholder";

// ── Agenda organismo (T-7) ────────────────────────────────────────────────────
export { AgendaPlaceholder } from "./components/placeholders/AgendaPlaceholder";

// ── Agenda molecules (T-7) ────────────────────────────────────────────────────
export { AgendaToolbar } from "./components/agenda/AgendaToolbar";
export type {
  AgendaToolbarProps,
  PeriodMode,
} from "./components/agenda/AgendaToolbar";
export { AgendaFilters } from "./components/agenda/AgendaFilters";
export type { AgendaFiltersProps } from "./components/agenda/AgendaFilters";
export { AgendaDayHeader } from "./components/agenda/AgendaDayHeader";
export type { AgendaDayHeaderProps } from "./components/agenda/AgendaDayHeader";
export { AgendaSlot } from "./components/agenda/AgendaSlot";
export type {
  AgendaSlotProps,
  SlotStatus,
  SlotOrigin,
} from "./components/agenda/AgendaSlot";
export { AgendaSummaryFooter } from "./components/agenda/AgendaSummaryFooter";
export type { AgendaSummaryFooterProps } from "./components/agenda/AgendaSummaryFooter";
