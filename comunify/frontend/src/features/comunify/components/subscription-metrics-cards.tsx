// TODO T-fe-6 polish post-merge: wire useSubscriptionMetrics hook + real currency formatting

interface SubscriptionMetricsCardsProps {
  isLoading?: boolean;
  className?: string;
}

export function SubscriptionMetricsCards({ isLoading, className }: SubscriptionMetricsCardsProps) {
  if (isLoading) {
    return (
      <div
        className={className}
        aria-busy="true"
        aria-label="Cargando métricas"
        data-testid="subscription-metrics-cards-loading"
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div
      className={className}
      data-testid="subscription-metrics-cards"
    >
      <div className="rounded-xl border bg-card p-4">
        <p className="text-xs text-muted-foreground">Suscripciones activas</p>
        <p className="text-2xl font-bold">—</p>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <p className="text-xs text-muted-foreground">MRR</p>
        <p className="text-2xl font-bold">—</p>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <p className="text-xs text-muted-foreground">Cancelaciones este mes</p>
        <p className="text-2xl font-bold">—</p>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <p className="text-xs text-muted-foreground">En cobranza</p>
        <p className="text-2xl font-bold">—</p>
      </div>
    </div>
  );
}
