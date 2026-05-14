export type PostStatus = "pending_moderation" | "approved" | "rejected" | "removed";

export interface CommunityPost {
  id: string;
  tenant_id: string;
  cohort_id: string | null;
  author_id: string;
  author_name: string;
  content: string;
  status: PostStatus;
  classifier_scores: {
    spam: number;
    nsfw: number;
    doxxing: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface MemberContext {
  tier: string;
  cohort: string;
  firstPost: boolean;
}

export type ModerationAction = "approve" | "reject" | "ban";

export interface ComplianceAuditEvent {
  id: string;
  event_type: string;
  actor_id: string | null;
  target_id: string | null;
  detail: Record<string, unknown>;
  created_at: string;
}
