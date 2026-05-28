// cap: shell-organism.shell-vitalia
// atomics: TBD
// story-origin: TBD
/**
 * MedicalServicesOfferWizardSteps — 5-step wizard for medical_services_v1 preset.
 *
 * Vitalia-specific: prepay policy + consent template + doctor assigned + duration.
 * Luana core offer wizard is preset-agnostic. Justification: spec § 6.3.2 anti-duplication.
 *
 * @architecture-group vitalia-ui-strings
 */
"use client";

import { cn } from "@/lib/cn";
import { MICROCOPY_OFFER_WIZARD } from "@/features/vitalia/config/microcopy";

export interface WizardStep {
  stepNumber: 1 | 2 | 3 | 4 | 5;
  label: string;
}

export interface MedicalServicesOfferWizardStepsProps {
  currentStep: 1 | 2 | 3 | 4 | 5;
  onStepChange?: (step: 1 | 2 | 3 | 4 | 5) => void;
  /** Step 1: service type */
  serviceType?: string;
  onServiceTypeChange?: (value: string) => void;
  /** Step 3: pricing */
  requiresPrepay?: boolean;
  onRequiresPrepayChange?: (value: boolean) => void;
  depositOnly?: boolean;
  onDepositOnlyChange?: (value: boolean) => void;
  /** Step 4: consent */
  requiresConsent?: boolean;
  onRequiresConsentChange?: (value: boolean) => void;
  /** Disable navigation */
  disabled?: boolean;
}

const STEPS: WizardStep[] = [
  { stepNumber: 1, label: MICROCOPY_OFFER_WIZARD.steps.serviceType },
  { stepNumber: 2, label: MICROCOPY_OFFER_WIZARD.steps.targetPatient },
  { stepNumber: 3, label: MICROCOPY_OFFER_WIZARD.steps.price },
  { stepNumber: 4, label: MICROCOPY_OFFER_WIZARD.steps.consent },
  { stepNumber: 5, label: MICROCOPY_OFFER_WIZARD.steps.durationAndDoctor },
];

function StepIndicator({
  step,
  currentStep,
  onStepChange,
}: {
  step: WizardStep;
  currentStep: number;
  onStepChange?: (step: 1 | 2 | 3 | 4 | 5) => void;
}) {
  const isCompleted = step.stepNumber < currentStep;
  const isCurrent = step.stepNumber === currentStep;

  return (
    <button
      type="button"
      onClick={() => onStepChange?.(step.stepNumber)}
      aria-current={isCurrent ? "step" : undefined}
      aria-label={`Paso ${step.stepNumber}: ${step.label}`}
      className={cn(
        "flex flex-col items-center gap-1 text-xs font-medium transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded",
        isCompleted && "text-blue-600",
        isCurrent && "text-blue-700",
        !isCompleted && !isCurrent && "text-gray-400",
      )}
    >
      <span
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2",
          isCompleted && "bg-blue-600 border-blue-600 text-white",
          isCurrent && "bg-white border-blue-600 text-blue-600",
          !isCompleted &&
            !isCurrent &&
            "bg-white border-gray-300 text-gray-400",
        )}
        aria-hidden="true"
      >
        {isCompleted ? "✓" : step.stepNumber}
      </span>
      <span className="hidden sm:block text-center max-w-16">{step.label}</span>
    </button>
  );
}

function Step1Content({
  serviceType,
  onServiceTypeChange,
}: {
  serviceType?: string;
  onServiceTypeChange?: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-gray-900">
        {MICROCOPY_OFFER_WIZARD.steps.serviceType}
      </h3>
      <div>
        <label
          htmlFor="service-type"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Nombre del servicio
        </label>
        <input
          id="service-type"
          type="text"
          value={serviceType ?? ""}
          onChange={(e) => onServiceTypeChange?.(e.target.value)}
          placeholder="Ej: Consulta inicial dental"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}

function Step3Content({
  requiresPrepay,
  onRequiresPrepayChange,
  depositOnly,
  onDepositOnlyChange,
}: {
  requiresPrepay?: boolean;
  onRequiresPrepayChange?: (value: boolean) => void;
  depositOnly?: boolean;
  onDepositOnlyChange?: (value: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-gray-900">
        {MICROCOPY_OFFER_WIZARD.steps.price}
      </h3>
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={requiresPrepay ?? false}
            onChange={(e) => onRequiresPrepayChange?.(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            {MICROCOPY_OFFER_WIZARD.prepay.label}
          </span>
        </label>
        {requiresPrepay && (
          <div className="ml-6 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="prepay-type"
                checked={!depositOnly}
                onChange={() => onDepositOnlyChange?.(false)}
                className="border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                {MICROCOPY_OFFER_WIZARD.prepay.fullPayment}
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="prepay-type"
                checked={depositOnly ?? false}
                onChange={() => onDepositOnlyChange?.(true)}
                className="border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                {MICROCOPY_OFFER_WIZARD.prepay.partialDeposit}
              </span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

function Step4Content({
  requiresConsent,
  onRequiresConsentChange,
}: {
  requiresConsent?: boolean;
  onRequiresConsentChange?: (value: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-gray-900">
        {MICROCOPY_OFFER_WIZARD.steps.consent}
      </h3>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={requiresConsent ?? false}
          onChange={(e) => onRequiresConsentChange?.(e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">
          Requiere consentimiento informado
        </span>
      </label>
    </div>
  );
}

function StepPlaceholderContent({ label }: { label: string }) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-gray-900">{label}</h3>
      <p className="text-sm text-gray-500">Completa los campos de este paso.</p>
    </div>
  );
}

export function MedicalServicesOfferWizardSteps({
  currentStep,
  onStepChange,
  serviceType,
  onServiceTypeChange,
  requiresPrepay,
  onRequiresPrepayChange,
  depositOnly,
  onDepositOnlyChange,
  requiresConsent,
  onRequiresConsentChange,
  disabled = false,
}: MedicalServicesOfferWizardStepsProps) {
  const canGoBack = currentStep > 1;
  const canGoNext = currentStep < 5;
  const isLastStep = currentStep === 5;

  function handleBack() {
    if (canGoBack) {
      onStepChange?.((currentStep - 1) as 1 | 2 | 3 | 4 | 5);
    }
  }

  function handleNext() {
    if (canGoNext) {
      onStepChange?.((currentStep + 1) as 1 | 2 | 3 | 4 | 5);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Step indicators */}
      <nav
        aria-label="Pasos del wizard"
        className="flex items-center justify-between gap-2"
      >
        {STEPS.map((step, idx) => (
          <div key={step.stepNumber} className="flex items-center flex-1">
            <StepIndicator
              step={step}
              currentStep={currentStep}
              onStepChange={disabled ? undefined : onStepChange}
            />
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-1 transition-colors",
                  step.stepNumber < currentStep ? "bg-blue-600" : "bg-gray-200",
                )}
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </nav>

      {/* Step content */}
      <div className="min-h-32" aria-live="polite" aria-atomic="true">
        {currentStep === 1 && (
          <Step1Content
            serviceType={serviceType}
            onServiceTypeChange={onServiceTypeChange}
          />
        )}
        {currentStep === 2 && (
          <StepPlaceholderContent
            label={MICROCOPY_OFFER_WIZARD.steps.targetPatient}
          />
        )}
        {currentStep === 3 && (
          <Step3Content
            requiresPrepay={requiresPrepay}
            onRequiresPrepayChange={onRequiresPrepayChange}
            depositOnly={depositOnly}
            onDepositOnlyChange={onDepositOnlyChange}
          />
        )}
        {currentStep === 4 && (
          <Step4Content
            requiresConsent={requiresConsent}
            onRequiresConsentChange={onRequiresConsentChange}
          />
        )}
        {currentStep === 5 && (
          <StepPlaceholderContent
            label={MICROCOPY_OFFER_WIZARD.steps.durationAndDoctor}
          />
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={handleBack}
          disabled={!canGoBack || disabled}
          aria-disabled={!canGoBack || disabled}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-colors",
            "border border-gray-300 text-gray-700",
            "hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          {"Atrás"}
        </button>
        <button
          type="button"
          onClick={isLastStep ? undefined : handleNext}
          disabled={disabled}
          aria-disabled={disabled}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-blue-500",
            isLastStep
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          {isLastStep ? MICROCOPY_OFFER_WIZARD.publish.cta : "Siguiente"}
        </button>
      </div>
    </div>
  );
}

export { STEPS as OFFER_WIZARD_STEPS };
