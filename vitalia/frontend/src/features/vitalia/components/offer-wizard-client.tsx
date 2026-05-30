// cap: shell-organism.shell-vitalia
// story-origin: TBD
/**
 * OfferWizardClient — 5-step offer wizard for medical_services_v1 preset.
 *
 * Composes MedicalServicesOfferWizardSteps (indicator nav) with per-step
 * form fields. On step 5 "Publicar oferta", calls useOfferCreate mutation.
 * Local state per step — no "Guardar" button per form-runtime-array.md.
 *
 * D9 pattern: Server Component page renders this Client Component.
 *
 * @architecture-group vitalia-ui-strings
 */
"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { MedicalServicesOfferWizardSteps } from "./medical-services-offer-wizard-steps";
import { useOfferCreate } from "@/features/vitalia/api/use-offer-create";
import {
  offerWizardStep1Schema,
  offerWizardStep2Schema,
  offerWizardStep3Schema,
  offerWizardStep4Schema,
  offerWizardStep5Schema,
} from "@/features/vitalia/schemas/offer-wizard-schema";
import { MICROCOPY_OFFER_WIZARD } from "@/features/vitalia/config/microcopy";
import type {
  OfferWizardStep1Input,
  OfferWizardStep2Input,
  OfferWizardStep3Input,
  OfferWizardStep4Input,
  OfferWizardStep5Input,
} from "@/features/vitalia/schemas/offer-wizard-schema";
import type { OfferCreatePayload } from "@/features/vitalia/api/use-offer-create";

export interface OfferWizardClientProps {
  presetSlug?: string;
  onSuccess?: (offerId: string) => void;
  onCancel?: () => void;
}

type WizardStep = 1 | 2 | 3 | 4 | 5;

interface WizardState {
  step1: Partial<OfferWizardStep1Input>;
  step2: Partial<OfferWizardStep2Input>;
  step3: Partial<OfferWizardStep3Input>;
  step4: Partial<OfferWizardStep4Input>;
  step5: Partial<OfferWizardStep5Input>;
}

const inputBaseClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors";

function Step1Fields({
  data,
  onChange,
  errors,
}: {
  data: Partial<OfferWizardStep1Input>;
  onChange: (d: Partial<OfferWizardStep1Input>) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label
          htmlFor="service-name"
          className="text-sm font-medium text-gray-700"
        >
          Nombre del servicio
          <span className="text-red-500 ml-1" aria-hidden="true">
            *
          </span>
        </label>
        <input
          id="service-name"
          type="text"
          value={data.service_name ?? ""}
          onChange={(e) => onChange({ ...data, service_name: e.target.value })}
          aria-invalid={!!errors.service_name}
          aria-describedby={
            errors.service_name ? "service-name-error" : undefined
          }
          className={cn(
            inputBaseClass,
            errors.service_name && "border-red-500",
          )}
          placeholder="Ej: Consulta inicial dental"
        />
        {errors.service_name && (
          <p
            id="service-name-error"
            role="alert"
            className="text-xs text-red-600"
          >
            {errors.service_name}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <label
          htmlFor="offer-category"
          className="text-sm font-medium text-gray-700"
        >
          Categoría
          <span className="text-red-500 ml-1" aria-hidden="true">
            *
          </span>
        </label>
        <input
          id="offer-category"
          type="text"
          value={data.offer_category ?? ""}
          onChange={(e) =>
            onChange({ ...data, offer_category: e.target.value })
          }
          aria-invalid={!!errors.offer_category}
          aria-describedby={
            errors.offer_category ? "offer-category-error" : undefined
          }
          className={cn(
            inputBaseClass,
            errors.offer_category && "border-red-500",
          )}
          placeholder="Ej: consulta, ortodoncia, terapia"
        />
        {errors.offer_category && (
          <p
            id="offer-category-error"
            role="alert"
            className="text-xs text-red-600"
          >
            {errors.offer_category}
          </p>
        )}
      </div>
    </div>
  );
}

function Step2Fields({
  data,
  onChange,
  errors,
}: {
  data: Partial<OfferWizardStep2Input>;
  onChange: (d: Partial<OfferWizardStep2Input>) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label
          htmlFor="target-description"
          className="text-sm font-medium text-gray-700"
        >
          ¿Para qué paciente es esta oferta?
          <span className="text-red-500 ml-1" aria-hidden="true">
            *
          </span>
        </label>
        <textarea
          id="target-description"
          value={data.target_description ?? ""}
          onChange={(e) =>
            onChange({ ...data, target_description: e.target.value })
          }
          aria-invalid={!!errors.target_description}
          aria-describedby={
            errors.target_description ? "target-desc-error" : undefined
          }
          rows={3}
          maxLength={1000}
          className={cn(
            inputBaseClass,
            "resize-none",
            errors.target_description && "border-red-500",
          )}
          placeholder="Ej: Adultos con ansiedad leve, sin diagnóstico previo"
        />
        <span className="text-xs text-gray-400 self-end">
          {(data.target_description ?? "").length}/1000
        </span>
        {errors.target_description && (
          <p
            id="target-desc-error"
            role="alert"
            className="text-xs text-red-600"
          >
            {errors.target_description}
          </p>
        )}
      </div>
    </div>
  );
}

function Step3Fields({
  data,
  onChange,
  errors,
}: {
  data: Partial<OfferWizardStep3Input>;
  onChange: (d: Partial<OfferWizardStep3Input>) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <div className="flex flex-col gap-1 flex-1">
          <label
            htmlFor="base-price"
            className="text-sm font-medium text-gray-700"
          >
            Precio base
            <span className="text-red-500 ml-1" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="base-price"
            type="number"
            min={0}
            step={0.01}
            value={data.base_price ?? ""}
            onChange={(e) =>
              onChange({ ...data, base_price: parseFloat(e.target.value) || 0 })
            }
            aria-invalid={!!errors.base_price}
            className={cn(
              inputBaseClass,
              errors.base_price && "border-red-500",
            )}
            placeholder="0.00"
          />
          {errors.base_price && (
            <p role="alert" className="text-xs text-red-600">
              {errors.base_price}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1 w-28">
          <label
            htmlFor="currency"
            className="text-sm font-medium text-gray-700"
          >
            Moneda
          </label>
          <input
            id="currency"
            type="text"
            value={data.currency ?? ""}
            onChange={(e) =>
              onChange({
                ...data,
                currency: e.target.value.toUpperCase().slice(0, 3),
              })
            }
            maxLength={3}
            placeholder="ARS"
            className={cn(inputBaseClass, "uppercase")}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={data.requires_prepay ?? false}
            onChange={(e) =>
              onChange({ ...data, requires_prepay: e.target.checked })
            }
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            {MICROCOPY_OFFER_WIZARD.prepay.label}
          </span>
        </label>
        {data.requires_prepay && (
          <div className="ml-6 flex flex-col gap-1">
            <label htmlFor="deposit-percent" className="text-xs text-gray-600">
              Porcentaje de depósito (0 = pago completo)
            </label>
            <input
              id="deposit-percent"
              type="number"
              min={0}
              max={100}
              value={data.deposit_percent ?? ""}
              onChange={(e) =>
                onChange({
                  ...data,
                  deposit_percent: parseInt(e.target.value) || 0,
                })
              }
              className={cn(inputBaseClass, "w-32")}
              placeholder="30"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Step4Fields({
  data,
  onChange,
}: {
  data: Partial<OfferWizardStep4Input>;
  onChange: (d: Partial<OfferWizardStep4Input>) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={data.requires_informed_consent ?? false}
          onChange={(e) =>
            onChange({ ...data, requires_informed_consent: e.target.checked })
          }
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">
          Requiere consentimiento informado
        </span>
      </label>
      {data.requires_informed_consent && (
        <div className="flex flex-col gap-1 ml-6">
          <label htmlFor="consent-slug" className="text-xs text-gray-600">
            Plantilla de consentimiento (opcional)
          </label>
          <input
            id="consent-slug"
            type="text"
            value={data.consent_template_slug ?? ""}
            onChange={(e) =>
              onChange({ ...data, consent_template_slug: e.target.value })
            }
            className={cn(inputBaseClass)}
            placeholder="dental-standard-v1"
          />
        </div>
      )}
    </div>
  );
}

function Step5Fields({
  data,
  onChange,
  errors,
}: {
  data: Partial<OfferWizardStep5Input>;
  onChange: (d: Partial<OfferWizardStep5Input>) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label
          htmlFor="duration-min"
          className="text-sm font-medium text-gray-700"
        >
          Duración (minutos)
          <span className="text-red-500 ml-1" aria-hidden="true">
            *
          </span>
        </label>
        <input
          id="duration-min"
          type="number"
          min={1}
          value={data.duration_min ?? ""}
          onChange={(e) =>
            onChange({ ...data, duration_min: parseInt(e.target.value) || 0 })
          }
          aria-invalid={!!errors.duration_min}
          className={cn(
            inputBaseClass,
            errors.duration_min && "border-red-500",
          )}
          placeholder="60"
        />
        {errors.duration_min && (
          <p role="alert" className="text-xs text-red-600">
            {errors.duration_min}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <label
          htmlFor="doctor-id"
          className="text-sm font-medium text-gray-700"
        >
          ID del profesional asignado
          <span className="text-red-500 ml-1" aria-hidden="true">
            *
          </span>
        </label>
        <input
          id="doctor-id"
          type="text"
          value={data.doctor_id ?? ""}
          onChange={(e) => onChange({ ...data, doctor_id: e.target.value })}
          aria-invalid={!!errors.doctor_id}
          aria-describedby={errors.doctor_id ? "doctor-id-error" : undefined}
          className={cn(inputBaseClass, errors.doctor_id && "border-red-500")}
          placeholder="UUID del profesional"
        />
        {errors.doctor_id && (
          <p id="doctor-id-error" role="alert" className="text-xs text-red-600">
            {errors.doctor_id}
          </p>
        )}
      </div>
    </div>
  );
}

export function OfferWizardClient({
  onSuccess,
  onCancel,
}: OfferWizardClientProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [wizardState, setWizardState] = useState<WizardState>({
    step1: {},
    step2: {},
    step3: { requires_prepay: false },
    step4: { requires_informed_consent: false },
    step5: {},
  });
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { mutateAsync: createOffer, isPending: isSubmitting } =
    useOfferCreate();

  function validateCurrentStep(): boolean {
    let result;
    switch (currentStep) {
      case 1:
        result = offerWizardStep1Schema.safeParse(wizardState.step1);
        break;
      case 2:
        result = offerWizardStep2Schema.safeParse(wizardState.step2);
        break;
      case 3:
        result = offerWizardStep3Schema.safeParse(wizardState.step3);
        break;
      case 4:
        result = offerWizardStep4Schema.safeParse(wizardState.step4);
        break;
      case 5:
        result = offerWizardStep5Schema.safeParse(wizardState.step5);
        break;
      default:
        return true;
    }

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = String(issue.path[0] ?? "");
        if (field) fieldErrors[field] = issue.message;
      }
      setStepErrors(fieldErrors);
      return false;
    }

    setStepErrors({});
    return true;
  }

  function handleStepChange(step: WizardStep) {
    // Only allow going back without validation
    if (step < currentStep) {
      setCurrentStep(step);
      setStepErrors({});
      return;
    }
    // Going forward requires validation
    if (validateCurrentStep()) {
      setCurrentStep(step);
    }
  }

  async function handlePublish() {
    if (!validateCurrentStep()) return;

    // Parse all steps to get typed data
    const step1Result = offerWizardStep1Schema.safeParse(wizardState.step1);
    const step2Result = offerWizardStep2Schema.safeParse(wizardState.step2);
    const step3Result = offerWizardStep3Schema.safeParse(wizardState.step3);
    const step4Result = offerWizardStep4Schema.safeParse(wizardState.step4);
    const step5Result = offerWizardStep5Schema.safeParse(wizardState.step5);

    if (
      !step1Result.success ||
      !step2Result.success ||
      !step3Result.success ||
      !step4Result.success ||
      !step5Result.success
    ) {
      setSubmitError("Completa todos los pasos antes de publicar.");
      return;
    }

    const payload: OfferCreatePayload = {
      service_name: step1Result.data.service_name,
      offer_category: step1Result.data.offer_category,
      target_description: step2Result.data.target_description,
      base_price: step3Result.data.base_price,
      currency: step3Result.data.currency,
      requires_prepay: step3Result.data.requires_prepay,
      deposit_percent: step3Result.data.deposit_percent,
      requires_informed_consent: step4Result.data.requires_informed_consent,
      consent_template_slug: step4Result.data.consent_template_slug,
      duration_min: step5Result.data.duration_min,
      doctor_id: step5Result.data.doctor_id,
    };

    try {
      setSubmitError(null);
      const created = await createOffer(payload);
      setIsSubmitted(true);
      onSuccess?.(created.id);
    } catch {
      setSubmitError("No se pudo publicar la oferta. Intenta de nuevo.");
    }
  }

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div
          className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center"
          aria-hidden="true"
        >
          <span className="text-3xl">✓</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          {MICROCOPY_OFFER_WIZARD.publish.successTitle}
        </h2>
        <p className="text-sm text-gray-500">
          {MICROCOPY_OFFER_WIZARD.publish.successBody}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold text-gray-900">
        {MICROCOPY_OFFER_WIZARD.title}
      </h2>

      {/* 5-step indicator */}
      <MedicalServicesOfferWizardSteps
        currentStep={currentStep}
        onStepChange={handleStepChange}
        // Step 1 props
        serviceType={wizardState.step1.service_name}
        onServiceTypeChange={(v) =>
          setWizardState((prev) => ({
            ...prev,
            step1: { ...prev.step1, service_name: v },
          }))
        }
        // Step 3 prepay props
        requiresPrepay={wizardState.step3.requires_prepay}
        onRequiresPrepayChange={(v) =>
          setWizardState((prev) => ({
            ...prev,
            step3: { ...prev.step3, requires_prepay: v },
          }))
        }
        depositOnly={
          wizardState.step3.deposit_percent !== undefined &&
          wizardState.step3.deposit_percent > 0
        }
        onDepositOnlyChange={(v) =>
          setWizardState((prev) => ({
            ...prev,
            step3: { ...prev.step3, deposit_percent: v ? 30 : 0 },
          }))
        }
        // Step 4 consent props
        requiresConsent={wizardState.step4.requires_informed_consent}
        onRequiresConsentChange={(v) =>
          setWizardState((prev) => ({
            ...prev,
            step4: { ...prev.step4, requires_informed_consent: v },
          }))
        }
        disabled={isSubmitting}
      />

      {/* Step-specific additional fields below indicator */}
      <div aria-live="polite" aria-atomic="true">
        {currentStep === 1 && (
          <Step1Fields
            data={wizardState.step1}
            onChange={(d) => setWizardState((prev) => ({ ...prev, step1: d }))}
            errors={stepErrors}
          />
        )}
        {currentStep === 2 && (
          <Step2Fields
            data={wizardState.step2}
            onChange={(d) => setWizardState((prev) => ({ ...prev, step2: d }))}
            errors={stepErrors}
          />
        )}
        {currentStep === 3 && (
          <Step3Fields
            data={wizardState.step3}
            onChange={(d) => setWizardState((prev) => ({ ...prev, step3: d }))}
            errors={stepErrors}
          />
        )}
        {currentStep === 4 && (
          <Step4Fields
            data={wizardState.step4}
            onChange={(d) => setWizardState((prev) => ({ ...prev, step4: d }))}
          />
        )}
        {currentStep === 5 && (
          <Step5Fields
            data={wizardState.step5}
            onChange={(d) => setWizardState((prev) => ({ ...prev, step5: d }))}
            errors={stepErrors}
          />
        )}
      </div>

      {submitError && (
        <p role="alert" className="text-sm text-red-600">
          {submitError}
        </p>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <div className="flex gap-2">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={() => handleStepChange((currentStep - 1) as WizardStep)}
              disabled={isSubmitting}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                "border border-gray-300 text-gray-700 hover:bg-gray-50",
                "focus:outline-none focus:ring-2 focus:ring-blue-500",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              Atrás
            </button>
          )}
          {onCancel && currentStep === 1 && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              Cancelar
            </button>
          )}
        </div>

        {currentStep < 5 ? (
          <button
            type="button"
            onClick={() => handleStepChange((currentStep + 1) as WizardStep)}
            disabled={isSubmitting}
            className={cn(
              "px-6 py-2 rounded-md text-sm font-medium transition-colors",
              "bg-blue-600 text-white hover:bg-blue-700",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            Siguiente
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePublish}
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className={cn(
              "px-6 py-2 rounded-md text-sm font-semibold transition-colors",
              "bg-green-600 text-white hover:bg-green-700",
              "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            {isSubmitting
              ? "Publicando..."
              : MICROCOPY_OFFER_WIZARD.publish.cta}
          </button>
        )}
      </div>
    </div>
  );
}
