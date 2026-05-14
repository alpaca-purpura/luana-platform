"use client";

import { useVoiceDistillationPoll } from "../api/use-voice-distillation-poll";

/**
 * Convenience wrapper: polls a distillation job and exposes
 * boolean flags for easy conditional rendering.
 */
export function usePollDistillationJob(jobId: string | null) {
  const query = useVoiceDistillationPoll(jobId ?? "");

  const isIdle = !jobId;
  const isQueued = query.data?.status === "queued";
  const isProcessing = query.data?.status === "processing";
  const isCompleted = query.data?.status === "completed";
  const isFailed = query.data?.status === "failed";
  const isTerminal = isCompleted || isFailed;

  return {
    ...query,
    isIdle,
    isQueued,
    isProcessing,
    isCompleted,
    isFailed,
    isTerminal,
    progress: query.data?.progress_pct ?? 0,
    compiledVoice: isCompleted ? query.data?.compiled_voice ?? null : null,
  };
}
