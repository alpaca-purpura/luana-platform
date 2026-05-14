// Components
export { ClinicTypePicker } from "./components/clinic-type-picker";
export type { ClinicTypePickerProps } from "./components/clinic-type-picker";
export { MedicalServicesOfferWizardSteps, OFFER_WIZARD_STEPS } from "./components/medical-services-offer-wizard-steps";
export type { MedicalServicesOfferWizardStepsProps, WizardStep } from "./components/medical-services-offer-wizard-steps";
export { TreatmentTimeline } from "./components/treatment-timeline";
export type { TreatmentTimelineProps, TreatmentMilestone, MilestoneName } from "./components/treatment-timeline";
export { ConsentSignatureModal } from "./components/consent-signature-modal";
export type { ConsentSignatureModalProps } from "./components/consent-signature-modal";
export { ComplianceStatsCards } from "./components/compliance-stats-cards";
export type { ComplianceStatsCardsProps } from "./components/compliance-stats-cards";
export { DoctorAvatarPicker } from "./components/doctor-avatar-picker";
export type { DoctorAvatarPickerProps, DoctorOption } from "./components/doctor-avatar-picker";
export { MedicalDisclaimerBanner } from "./components/medical-disclaimer-banner";
export type { MedicalDisclaimerBannerProps, DisclaimerContext } from "./components/medical-disclaimer-banner";

// Microcopy SSoT
export {
  MICROCOPY_ONBOARDING,
  MICROCOPY_BRAND_STUDIO,
  MICROCOPY_OFFER_WIZARD,
  MICROCOPY_BOOKING,
  MICROCOPY_TREATMENT,
  MICROCOPY_COMPLIANCE,
  MICROCOPY_DISCLAIMER,
} from "./config/microcopy";

// Types
export type { ClinicType, Country, PlanTierSlug, CreateClinicProfileResponse, OnboardingStatusResponse, SubscribeResponse, OfferPresetResponse } from "./types/vitalia.types";
export type { PlanTierItem, PlanTierListResponse } from "./types/plan-tier.types";
export type { BookingStatus, PaymentStatus, DeliveryChannel, CreateBookingRequest, CreateBookingResponse, BookingSummary, BookingListResponse, RescheduleBookingRequest, RescheduleBookingResponse, CancelBookingRequest, CancelBookingResponse, ConsentSignRequest, ConsentSignResponse, SlotItem, AvailableSlotsResponse } from "./types/booking.types";
export type { TreatmentSummary, TreatmentListResponse, TreatmentDetailResponse, TreatmentFollowupStateResponse, ManualHandoffRequest, ManualHandoffResponse, ReleaseHandoffResponse, StartFollowupRequest, PatientSummary, PatientListResponse, PatientDetailResponse, UploadMedicalPdfRequest, UploadMedicalPdfResponse } from "./types/treatment.types";
export type { ConsentRecordResponse, ConsentRecordListResponse } from "./types/consent.types";
export type { ComplianceSeverity, ActorType, ComplianceEventItem, ComplianceEventListResponse } from "./types/compliance.types";

// Schemas
export { clinicProfileSchema } from "./schemas/clinic-profile-schema";
export type { ClinicProfileInput } from "./schemas/clinic-profile-schema";
export { offerWizardStep1Schema, offerWizardStep2Schema, offerWizardStep3Schema, offerWizardStep4Schema, offerWizardStep5Schema } from "./schemas/offer-wizard-schema";
export type { OfferWizardStep1Input, OfferWizardStep2Input, OfferWizardStep3Input, OfferWizardStep4Input, OfferWizardStep5Input } from "./schemas/offer-wizard-schema";
export { bookingCreateSchema } from "./schemas/booking-schema";
export type { BookingCreateInput } from "./schemas/booking-schema";
export { consentSignSchema } from "./schemas/consent-schema";
export type { ConsentSignInput } from "./schemas/consent-schema";
export { manualHandoffSchema } from "./schemas/handoff-schema";
export type { ManualHandoffInput } from "./schemas/handoff-schema";
export { complianceFilterSchema } from "./schemas/compliance-schema";
export type { ComplianceFilterInput } from "./schemas/compliance-schema";
export { medicalPdfUploadSchema } from "./schemas/patient-schema";
export type { MedicalPdfUploadInput } from "./schemas/patient-schema";
export { startFollowupSchema } from "./schemas/treatment-schema";
export type { StartFollowupInput } from "./schemas/treatment-schema";
export { rescheduleBookingSchema } from "./schemas/appointment-schema";
export type { RescheduleBookingInput } from "./schemas/appointment-schema";

// API hooks
export { vitaliaQueryKeys } from "./api/query-keys";
export { useClinicProfileCreate } from "./api/use-clinic-profile-create";
export type { CreateClinicProfilePayload } from "./api/use-clinic-profile-create";
export { useOnboardingStatus } from "./api/use-onboarding-status";
export { usePlanTiers } from "./api/use-plan-tiers";
export { useOfferPreset } from "./api/use-offer-presets";
export { useOffers } from "./api/use-offers";
export type { OfferSummary, OfferListResponse } from "./api/use-offers";
export { useOffer } from "./api/use-offer";
export { useOfferCreate } from "./api/use-offer-create";
export type { OfferCreatePayload } from "./api/use-offer-create";
export { useBookingAvailability } from "./api/use-booking-availability";
export type { AvailableSlotsFilters } from "./api/use-booking-availability";
export { useBookingCreate } from "./api/use-booking-create";
export { useBookings } from "./api/use-bookings";
export { useBooking } from "./api/use-booking";
export { useBookingReschedule } from "./api/use-booking-reschedule";
export { useBookingCancel } from "./api/use-booking-cancel";
export { useTreatments } from "./api/use-treatments";
export { useTreatment } from "./api/use-treatment";
export { useTreatmentCreate } from "./api/use-treatment-create";
export type { TreatmentCreatePayload } from "./api/use-treatment-create";
export { useTreatmentFollowupStart } from "./api/use-treatment-followup-start";
export { useTreatmentSnapshot } from "./api/use-treatment-snapshot";
export { usePatients } from "./api/use-patients";
export { usePatient } from "./api/use-patient";
export { usePatientUploadPdf } from "./api/use-patient-upload-pdf";
export { useComplianceEvents } from "./api/use-compliance-events";
export type { ComplianceEventsFilters } from "./api/use-compliance-events";
