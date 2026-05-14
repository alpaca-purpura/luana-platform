export type CohortStatus =
  | "draft"
  | "active"
  | "in_progress"
  | "completed"
  | "cancelled";

export type EngagementBucket = "high" | "medium" | "low";
export type MemberTier = "regular" | "premium";

export interface Cohort {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  offer_id: string;
  capacity_max: number;
  capacity_filled: number;
  start_date: string;
  end_date: string;
  status: CohortStatus;
  enrollment_criteria: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CohortMember {
  id: string;
  cohort_id: string;
  subscriber_id: string;
  subscriber_name: string;
  subscriber_email: string;
  tier: MemberTier;
  engagement_bucket: EngagementBucket;
  last_active_at: string | null;
  enrolled_at: string;
}

export interface BroadcastPayload {
  subject: string;
  body: string;
  channel: "whatsapp" | "email" | "sms";
  audience: "all" | "engaged_only" | "inactive_7d";
  voice_embed_url?: string | null;
  video_link_url?: string | null;
}

export interface CohortBroadcast {
  id: string;
  cohort_id: string;
  subject: string;
  sent_at: string;
  recipients_count: number;
  channel: string;
}
