export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "cancelled"
  | "trialing"
  | "unpaid";

export interface Subscription {
  id: string;
  tenant_id: string;
  subscriber_id: string;
  subscriber_name: string;
  subscriber_email: string;
  offer_id: string;
  plan_name: string;
  status: SubscriptionStatus;
  amount: number;
  currency: string;
  billing_cycle: "monthly" | "yearly";
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionMetrics {
  mrr: { amount: number; currency: string };
  active_count: number;
  past_due_count: number;
  churn_rate: number;
  distribution: {
    active: number;
    past_due: number;
    cancelled: number;
  };
}
