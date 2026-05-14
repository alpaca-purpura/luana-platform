"use client";

import { useCallback, useState } from "react";

export interface OnboardingFlowContext {
  creatorHandle?: string;
  selectedPlanId?: string;
  billingInterval?: "monthly" | "annual";
  nicheSlug?: string;
}

export function useFlowContext() {
  const [context, setContext] = useState<OnboardingFlowContext>({});

  const updateContext = useCallback((patch: Partial<OnboardingFlowContext>) => {
    setContext((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetContext = useCallback(() => {
    setContext({});
  }, []);

  return { context, updateContext, resetContext };
}
