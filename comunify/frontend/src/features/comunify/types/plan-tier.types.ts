export type BillingInterval = "monthly" | "yearly";

export interface PlanFeature {
  key: string;
  label: string;
  included: boolean;
}

export interface PlanTier {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  features: PlanFeature[];
  is_popular: boolean;
}
