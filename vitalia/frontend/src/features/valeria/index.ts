/**
 * valeria/index.ts — Feature public API (FSD-Lite boundary matrix).
 * F1-S10 vitalia-fase1-empty-states · T-11 vitalia-fase2-valeria-agenda
 *
 * Exposes placeholder components created in T-2 and T-7.
 * T-7 adds 5 agenda molecules + AgendaPlaceholder organismo.
 * T-11 adds agenda TypeScript types + Zod runtime schemas.
 * T-12 adds React Query hooks + Zustand stores + page root + AgendaHeader.
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

// ── Agenda root + header (T-12) ───────────────────────────────────────────────
export { ValeriaAgendaView } from "./components/agenda/ValeriaAgendaView";
export type { ValeriaAgendaViewProps } from "./components/agenda/ValeriaAgendaView";
export { AgendaHeader } from "./components/agenda/AgendaHeader";
export type { AgendaHeaderProps } from "./components/agenda/AgendaHeader";

// ── T-16: Preset filters + Crear cita + Patient autocomplete + Mobile sheet ───
export { AgendaPresetFilters } from "./components/agenda/AgendaPresetFilters";
export type { AgendaPresetFiltersProps } from "./components/agenda/AgendaPresetFilters";
export { CrearCitaButton } from "./components/agenda/CrearCitaButton";
export type { CrearCitaButtonProps } from "./components/agenda/CrearCitaButton";
export { CrearCitaForm } from "./components/agenda/CrearCitaForm";
export type { CrearCitaFormProps, CrearCitaOrigin } from "./components/agenda/CrearCitaForm";
export { PatientAutocomplete } from "./components/agenda/PatientAutocomplete";
export type {
  PatientAutocompleteProps,
  PatientSearchResult,
} from "./components/agenda/PatientAutocomplete";
export { MobileBottomSheet } from "./components/agenda/MobileBottomSheet";
export type { MobileBottomSheetProps } from "./components/agenda/MobileBottomSheet";

// ── SSR server-side fetch (T-12) — Server Components only ────────────────────
// NOTE: This import is safe in server context. Do NOT import this in "use client" components.
export { getInitialAgendaState } from "./api/agenda-server";
export type { GetInitialAgendaStateOptions } from "./api/agenda-server";

// ── React Query hooks (T-12) ──────────────────────────────────────────────────
export {
  agendaKeys,
  useAgendaGrid,
  useAgendaAggregates,
  useAppointmentDetail,
  useCreateAppointment,
  usePatchAppointmentStatus,
  useChargeAppointment,
  useEmitFiscalDoc,
  useSendReminder,
} from "./api/agenda";
export type {
  UseAgendaGridOptions,
  UseAgendaAggregatesOptions,
  AgendaAggregatesResponse,
  UseAppointmentDetailOptions,
  ChargeAppointmentVariables,
  EmitFiscalDocVariables,
  SendReminderResponse,
  PatchAppointmentVariables,
} from "./api/agenda";
export { useChargeMutation } from "./api/payments";
export type { ChargeMutationVariables } from "./api/payments";
export { useFiscalEmitMutation } from "./api/fiscal";
export type { FiscalEmitVariables } from "./api/fiscal";
export { useSendNotificationMutation } from "./api/notify";
export type { SendNotificationResponse } from "./api/notify";

// ── Zustand stores (T-12) ─────────────────────────────────────────────────────
export {
  useDrawerStore,
  DRAWER_WIDTH_MIN,
  DRAWER_WIDTH_MAX,
  DRAWER_WIDTH_DEFAULT,
} from "./store/agenda-store";
export type { DrawerStore, DrawerState, DrawerActions } from "./store/agenda-store";
export { useFiltersStore } from "./store/agenda-filters-store";
export type {
  FiltersStore,
  FiltersState,
  FiltersActions,
} from "./store/agenda-filters-store";

// ── Calendar components (T-13) ───────────────────────────────────────────────
export { AgendaCalendar } from "./components/agenda/AgendaCalendar";
export type { AgendaCalendarProps } from "./components/agenda/AgendaCalendar";
export { DayCalendar, DAY_CALENDAR_VIRTUAL_THRESHOLD } from "./components/agenda/DayCalendar";
export type { DayCalendarProps } from "./components/agenda/DayCalendar";
export { WeekCalendar } from "./components/agenda/WeekCalendar";
export type { WeekCalendarProps } from "./components/agenda/WeekCalendar";
export { MonthCalendar } from "./components/agenda/MonthCalendar";
export type { MonthCalendarProps, MonthAggregates, DayAggregate } from "./components/agenda/MonthCalendar";
export { SkeletonCalendar } from "./components/agenda/SkeletonCalendar";
export type { SkeletonCalendarProps } from "./components/agenda/SkeletonCalendar";
export { AgendaSlotInteractive } from "./components/agenda/AgendaSlotInteractive";
export type { AgendaSlotInteractiveProps } from "./components/agenda/AgendaSlotInteractive";
export { FreshnessIndicator } from "./components/agenda/FreshnessIndicator";
export type { FreshnessIndicatorProps } from "./components/agenda/FreshnessIndicator";

// ── Custom hooks (T-12) ───────────────────────────────────────────────────────
export { useAgendaFilters } from "./hooks/useAgendaFilters";
export type {
  UseAgendaFiltersReturn,
  AgendaFiltersState,
  AgendaFiltersActions,
} from "./hooks/useAgendaFilters";
export { useDrawerWidth } from "./hooks/useDrawerWidth";
export type { UseDrawerWidthReturn } from "./hooks/useDrawerWidth";
export { useFreshness } from "./hooks/useFreshness";
export type { UseFreshnessReturn } from "./hooks/useFreshness";

// ── AppointmentDrawer components (T-14) ───────────────────────────────────────
export { AppointmentDrawer } from "./components/agenda/AppointmentDrawer";
export type { AppointmentDrawerProps } from "./components/agenda/AppointmentDrawer";
export { AppointmentDrawerHeader } from "./components/agenda/AppointmentDrawerHeader";
export type { AppointmentDrawerHeaderProps } from "./components/agenda/AppointmentDrawerHeader";
export { AppointmentDrawerSkeleton } from "./components/agenda/AppointmentDrawerSkeleton";
export { AppointmentDrawerStaleBanner } from "./components/agenda/AppointmentDrawerStaleBanner";
export type { AppointmentDrawerStaleBannerProps } from "./components/agenda/AppointmentDrawerStaleBanner";
export { AppointmentDrawerTurnoSection } from "./components/agenda/AppointmentDrawerTurnoSection";
export type { AppointmentDrawerTurnoSectionProps } from "./components/agenda/AppointmentDrawerTurnoSection";
export { AppointmentDrawerPagoSection } from "./components/agenda/AppointmentDrawerPagoSection";
export type { AppointmentDrawerPagoSectionProps } from "./components/agenda/AppointmentDrawerPagoSection";
export { AppointmentDrawerNotasSection } from "./components/agenda/AppointmentDrawerNotasSection";
export type { AppointmentDrawerNotasSectionProps } from "./components/agenda/AppointmentDrawerNotasSection";
export { AppointmentDrawerAccionesAvanzadasSection } from "./components/agenda/AppointmentDrawerAccionesAvanzadasSection";
export type { AppointmentDrawerAccionesAvanzadasSectionProps } from "./components/agenda/AppointmentDrawerAccionesAvanzadasSection";

// ── CobrarSaldoSubform + helpers (T-15) ───────────────────────────────────────
export { CobrarSaldoSubform } from "./components/agenda/CobrarSaldoSubform";
export type {
  CobrarSaldoSubformProps,
  ChargeErrorState,
} from "./components/agenda/CobrarSaldoSubform";
export { CobrarSaldoSubformErrorAlert } from "./components/agenda/CobrarSaldoSubformErrorAlert";
export type { CobrarSaldoSubformErrorAlertProps } from "./components/agenda/CobrarSaldoSubformErrorAlert";
export {
  showChargeSuccessToast,
  ChargeSuccessToastDescription,
} from "./components/agenda/CobrarSaldoSubformSuccessToast";
export type {
  ShowChargeSuccessToastParams,
  ChargeSuccessToastDescriptionProps,
} from "./components/agenda/CobrarSaldoSubformSuccessToast";
