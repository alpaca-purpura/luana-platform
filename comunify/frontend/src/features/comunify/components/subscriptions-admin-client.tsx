"use client";

// TODO T-fe-6 polish post-merge: wire useSubscriptionList + useSubscriptionMetrics + DunningActiveBanner

export function SubscriptionsAdminClient() {
  return (
    <div className="flex flex-col gap-6 p-6" data-testid="subscriptions-admin-client">
      <h1 className="text-2xl font-bold">Suscripciones</h1>
      <p className="text-sm text-muted-foreground">
        Gestiona tus suscriptores activos y el estado de facturación.
      </p>
    </div>
  );
}
