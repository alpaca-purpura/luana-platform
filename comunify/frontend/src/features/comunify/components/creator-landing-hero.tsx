// TODO T-fe-3 polish post-merge: wire real creator profile data + image opt

interface CreatorLandingHeroProps {
  creatorName?: string;
  tagline?: string;
  avatarUrl?: string;
  handle?: string;
  className?: string;
}

export function CreatorLandingHero({
  creatorName,
  tagline,
  avatarUrl,
  handle,
  className,
}: CreatorLandingHeroProps) {
  return (
    <section
      className={className}
      aria-label="Perfil del creador"
      data-testid="creator-landing-hero"
    >
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={creatorName ?? "Foto de perfil"}
            className="h-24 w-24 rounded-full object-cover ring-4 ring-primary/20"
          />
        ) : (
          <div
            className="flex h-24 w-24 items-center justify-center rounded-full bg-muted text-3xl font-bold text-muted-foreground"
            aria-hidden="true"
          >
            {creatorName?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {creatorName ?? "Creador"}
          </h1>
          {handle && (
            <p className="mt-1 text-sm text-muted-foreground">@{handle}</p>
          )}
          {tagline && (
            <p className="mt-3 max-w-md text-base text-muted-foreground">
              {tagline}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
