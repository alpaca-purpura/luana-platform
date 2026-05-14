"use client";

// TODO T-fe-1 polish post-merge: wire creatorProfileSchema + useCreatorProfileCreate

export function OnboardingStep1Client() {
  return (
    <div className="flex flex-col gap-6" data-testid="onboarding-step-1">
      <div>
        <h2 className="text-xl font-semibold">Tu perfil de creador</h2>
        <p className="text-sm text-muted-foreground">
          Comencemos con lo básico sobre ti y tu marca.
        </p>
      </div>
      <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        Formulario en construcción — T-fe-1 polish post-merge.
      </p>
    </div>
  );
}
