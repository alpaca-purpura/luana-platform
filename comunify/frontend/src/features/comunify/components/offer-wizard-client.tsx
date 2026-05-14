"use client";

// TODO T-fe-3 polish post-merge: wire useOfferCreate + coaching_offers preset 5-step wizard

export function OfferWizardClient() {
  return (
    <div className="flex flex-col gap-6 p-6" data-testid="offer-wizard-client">
      <h1 className="text-2xl font-bold">Nueva oferta</h1>
      <p className="text-sm text-muted-foreground">
        Crea tu oferta de coaching paso a paso.
      </p>
    </div>
  );
}
