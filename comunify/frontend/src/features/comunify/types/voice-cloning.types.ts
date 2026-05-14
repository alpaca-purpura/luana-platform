export type VoiceDistillationStatus =
  | "queued"
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export interface VoiceSamplesStatus {
  tenant_id: string;
  samples_count: number;
  min_samples_required: number;
  can_distill: boolean;
  last_uploaded_at: string | null;
}

export interface DistillJobStatus {
  job_id: string;
  tenant_id: string;
  status: VoiceDistillationStatus;
  progress_pct: number;
  compiled_voice: import("./comunify.types").CompiledVoice | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}
