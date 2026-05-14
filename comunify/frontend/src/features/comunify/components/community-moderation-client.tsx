"use client";

// TODO T-fe-5 polish post-merge: wire useCommunityModerationInbox + CommunityModerationCard

export function CommunityModerationClient() {
  return (
    <div className="flex flex-col gap-6 p-6" data-testid="community-moderation-client">
      <h1 className="text-2xl font-bold">Moderación</h1>
      <p className="text-sm text-muted-foreground">
        Bandeja de entrada de contenido pendiente de moderación.
      </p>
    </div>
  );
}
