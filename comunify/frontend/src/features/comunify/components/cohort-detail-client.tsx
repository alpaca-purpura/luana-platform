"use client";

// TODO T-fe-4 polish post-merge: wire useCohortDetail + CohortRosterTable + CohortBroadcastComposer

/**
 * Alias for new cohort creation route.
 * TODO T-fe-4 polish post-merge: replace with dedicated form
 */
export function CreateCohortClient(_props?: { mode?: string }) {
  return <CohortDetailClient mode="new" />;
}

interface CohortDetailClientProps {
  cohortId?: string;
  mode?: "new" | "detail";
}

export function CohortDetailClient({ cohortId, mode = "detail" }: CohortDetailClientProps) {
  if (mode === "new") {
    return (
      <div className="flex flex-col gap-6 p-6" data-testid="cohort-create-client">
        <h1 className="text-2xl font-bold">Crear cohorte</h1>
        <p className="text-sm text-muted-foreground">
          Configura una nueva cohorte para tu oferta.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6" data-testid="cohort-detail-client">
      <h1 className="text-2xl font-bold">Detalle de cohorte</h1>
      {cohortId && (
        <p className="text-xs text-muted-foreground">ID: {cohortId}</p>
      )}
    </div>
  );
}
