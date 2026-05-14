"use client";

// TODO T-fe-1 polish post-merge: wire nicheAudienceSchema + CreatorNichePicker

export function OnboardingStep2Client() {
  return (
    <div className="flex flex-col gap-6" data-testid="onboarding-step-2">
      <div>
        <h2 className="text-xl font-semibold">Tu nicho y audiencia</h2>
        <p className="text-sm text-muted-foreground">
          Cuéntanos sobre tu especialidad y a quién te diriges.
        </p>
      </div>
      <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        Formulario en construcción — T-fe-1 polish post-merge.
      </p>
    </div>
  );
}
