"use client";

// TODO T-fe-5 polish post-merge: wire useCommunityFeed + infinite scroll

export function CommunityFeedClient() {
  return (
    <div className="flex flex-col gap-6 p-6" data-testid="community-feed-client">
      <h1 className="text-2xl font-bold">Comunidad</h1>
      <p className="text-sm text-muted-foreground">
        Feed de la comunidad — publicaciones de todas las cohortes.
      </p>
    </div>
  );
}
