"use client";

// TODO T-fe-1 polish post-merge: wire planTierSchema + usePlanTiers

export function OnboardingStep3Client() {
  return (
    <div className="flex flex-col gap-6" data-testid="onboarding-step-3">
      <div>
        <h2 className="text-xl font-semibold">Elige tu plan</h2>
        <p className="text-sm text-muted-foreground">
          Selecciona el plan que mejor se adapta a tus necesidades.
        </p>
      </div>
      <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        Selector de plan en construcción — T-fe-1 polish post-merge.
      </p>
    </div>
  );
}
