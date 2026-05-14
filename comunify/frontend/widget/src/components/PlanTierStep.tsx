/**
 * PlanTierStep — step 1 of subscription widget.
 * Displays available plan tiers for user to select.
 * TODO T-widget-1 polish post-merge: full API wiring + PlanTier type from CONTRACT
 */

export interface PlanTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: "month" | "year";
  description?: string;
  features?: string[];
}

interface PlanTierStepProps {
  plans: PlanTier[];
  selectedPlanId: string | null;
  onSelect: (planId: string) => void;
  onNext: () => void;
  isLoading?: boolean;
}

export function PlanTierStep({
  plans,
  selectedPlanId,
  onSelect,
  onNext,
  isLoading,
}: PlanTierStepProps) {
  if (isLoading) {
    return (
      <div className="widget-step" aria-busy="true" aria-label="Cargando planes">
        <div style={{ height: 80, borderRadius: 12, background: "#f3f4f6", animation: "pulse 1.5s infinite" }} />
        <div style={{ height: 80, borderRadius: 12, background: "#f3f4f6", animation: "pulse 1.5s infinite" }} />
      </div>
    );
  }

  return (
    <div className="widget-step" data-testid="plan-tier-step">
      <h2 className="widget-title">Elige tu plan</h2>
      <p className="widget-subtitle">Selecciona el plan que mejor se adapte a ti.</p>

      <div role="list" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {plans.map((plan) => {
          const isSelected = plan.id === selectedPlanId;
          return (
            <div
              key={plan.id}
              role="listitem"
              className="widget-plan-card"
              aria-selected={isSelected}
              tabIndex={0}
              onClick={() => onSelect(plan.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(plan.id);
                }
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p className="widget-plan-name">{plan.name}</p>
                  {plan.description && (
                    <p className="widget-subtitle" style={{ marginTop: "0.25rem" }}>
                      {plan.description}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <p className="widget-plan-price">
                    {plan.currency} {plan.price}
                  </p>
                  <p className="widget-subtitle">
                    /{plan.interval === "month" ? "mes" : "año"}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="widget-btn widget-btn-primary"
        disabled={!selectedPlanId}
        onClick={onNext}
        style={{ marginTop: "0.5rem" }}
      >
        Continuar
      </button>
    </div>
  );
}
