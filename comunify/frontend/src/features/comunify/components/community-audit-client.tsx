"use client";

// TODO T-fe-5 polish post-merge: wire useCommunityAuditEvents + DataTable

export function CommunityAuditClient() {
  return (
    <div className="flex flex-col gap-6 p-6" data-testid="community-audit-client">
      <h1 className="text-2xl font-bold">Auditoría de comunidad</h1>
      <p className="text-sm text-muted-foreground">
        Registro de eventos de moderación y cumplimiento.
      </p>
    </div>
  );
}
