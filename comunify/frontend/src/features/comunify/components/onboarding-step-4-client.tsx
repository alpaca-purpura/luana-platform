"use client";

// TODO T-fe-1 polish post-merge: wire coachingOfferWizardSchema + LadderVisualizer first offer seed

export function OnboardingStep4Client() {
  return (
    <div className="flex flex-col gap-6" data-testid="onboarding-step-4">
      <div>
        <h2 className="text-xl font-semibold">Tu primera oferta</h2>
        <p className="text-sm text-muted-foreground">
          Define la semilla de tu escalera de valor.
        </p>
      </div>
      <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        Asistente de oferta en construcción — T-fe-1 polish post-merge.
      </p>
    </div>
  );
}
