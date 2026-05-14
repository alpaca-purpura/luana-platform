/**
 * SubscribeWidgetRoot — main widget orchestrator.
 * Manages step state: plan selection → payment → success.
 * TODO T-widget-1 polish post-merge: full API wiring, plan fetch, ResizeObserver postMessage
 */

import { useState, useEffect } from "react";
import { PlanTierStep } from "./PlanTierStep";
import type { PlanTier } from "./PlanTierStep";
import { PaymentStep } from "./PaymentStep";
import { SuccessStep } from "./SuccessStep";
import { postToHost } from "../postmessage-protocol";

type WidgetStep = "plans" | "payment" | "success";

interface SubscribeWidgetRootProps {
  creatorHandle: string;
  offerId?: string;
}

// Mock plans — TODO T-widget-1: replace with fetch from /api/v1/public/{handle}/plans
const MOCK_PLANS: PlanTier[] = [
  {
    id: "plan-monthly",
    name: "Mensual",
    price: 29,
    currency: "USD",
    interval: "month",
    description: "Acceso completo, cancela cuando quieras",
  },
  {
    id: "plan-annual",
    name: "Anual",
    price: 249,
    currency: "USD",
    interval: "year",
    description: "Ahorra 30% vs mensual",
  },
];

export function SubscribeWidgetRoot({ creatorHandle, offerId: _offerId }: SubscribeWidgetRootProps) {
  const [step, setStep] = useState<WidgetStep>("plans");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Notify host of height changes
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      postToHost({ type: "RESIZE", height: document.body.scrollHeight });
    });
    observer.observe(document.body);
    return () => observer.disconnect();
  }, []);

  const selectedPlan = MOCK_PLANS.find((p) => p.id === selectedPlanId);

  const handleSubscribe = async (email: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      // TODO T-widget-1: real subscribe API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const mockSubId = `sub_${email.split("@")[0]}_${Date.now()}`;
      setSubscriptionId(mockSubId);
      postToHost({ type: "SUBSCRIBE_SUCCESS", subscriptionId: mockSubId });
      setStep("success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al procesar pago";
      setError(message);
      postToHost({ type: "SUBSCRIBE_ERROR", message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="widget-root" data-testid="subscribe-widget-root">
      {step === "plans" && (
        <PlanTierStep
          plans={MOCK_PLANS}
          selectedPlanId={selectedPlanId}
          onSelect={setSelectedPlanId}
          onNext={() => { if (selectedPlanId) setStep("payment"); }}
        />
      )}
      {step === "payment" && selectedPlan && (
        <PaymentStep
          planName={selectedPlan.name}
          planPrice={`${selectedPlan.currency} ${selectedPlan.price}/${selectedPlan.interval === "month" ? "mes" : "año"}`}
          onSubscribe={handleSubscribe}
          onBack={() => setStep("plans")}
          isSubmitting={isSubmitting}
          error={error}
        />
      )}
      {step === "success" && (
        <SuccessStep
          creatorName={creatorHandle}
          subscriptionId={subscriptionId}
          onClose={() => { postToHost({ type: "CLOSE" }); }}
        />
      )}
    </div>
  );
}
