// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-2
"use client";
/**
 * use-icp-extract.ts — React Query hook for Abel draft-first ICP extraction.
 *
 * Flow:
 *   1. startExtract(payload) → POST /icp/extract → receives IcpExtractJob (status=analizando)
 *   2. Sets jobId in local state → triggers pollQuery (refetchInterval 2s)
 *   3. pollQuery runs until status=done|failed OR max retries exceeded
 *   4. On done → invalidates ['abel','icp','list'] + clears jobId
 *   5. On failed → surfaces error → retry + manual fallback available (NF-res-extract)
 *
 * Graceful degradation (NF-res-extract):
 *   - Extraction timeout → job.status=failed → FE shows retry + manual fallback
 *   - NO infinite spinner — polling stops when done/failed
 *
 * G2 SSR-safe: uses useAuth only client-side (no store subscription in skeleton).
 * RN-1 tenant isolation: fetchClient auto-injects X-Tenant-ID.
 * NEVER useAuth().orgId — use useParams() for tenantId from URL.
 *
 * Named export (NO default) per FSD-Lite enforce.
 * spec_anchor: 03-arch-fe.md §1 FSD-Lite layout / hooks/use-icp-extract.ts
 * validators_gate: NF-res-extract + RN-3 (propone borrador) + RN-10 (audit row)
 */

import { useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { extractApi } from "../api/extract-api";
import type { IcpExtractRequest, IcpExtractJob } from "../types/extract";

// ── Constants ─────────────────────────────────────────────────────────────────

/** Poll interval in ms while job is analizando */
const POLL_INTERVAL_MS = 2_000;

/** Stop polling after this many failed poll attempts (network resilience) */
const MAX_POLL_ERRORS = 5;

// ── Query keys ────────────────────────────────────────────────────────────────

export const extractQueryKeys = {
  /** Poll key for a specific extraction job */
  poll: (jobId: string) => ["abel", "icp", "extract", "poll", jobId] as const,
  /** Invalidated on done — causes ICP list to re-fetch */
  icpList: () => ["abel", "icp", "list"] as const,
} as const;

// ── Hook return type ──────────────────────────────────────────────────────────

export interface UseIcpExtractReturn {
  /** Start an extraction. Resolves with initial job (status=analizando). */
  startExtract: (payload: IcpExtractRequest, tenantId: string) => Promise<IcpExtractJob>;
  /** Current extraction job (polling result) — null when no active job */
  job: IcpExtractJob | null;
  /** True while the extraction is in-flight (analizando) */
  isAnalyzing: boolean;
  /** True while starting the extraction (POST in flight) */
  isStarting: boolean;
  /** Error from start or poll phase */
  extractError: Error | null;
  /** Clear the current job (allows manual fallback path) */
  clearJob: () => void;
  /** Retry the last start payload */
  retryExtract: (() => void) | null;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useIcpExtract — manages the full lifecycle of an Abel ICP extraction job.
 *
 * Usage:
 * ```tsx
 * const { startExtract, job, isAnalyzing, extractError, clearJob } = useIcpExtract();
 * // On intake submit:
 * await startExtract(payload, tenantId);
 * // job?.status tracks analizando → done | failed
 * ```
 */
export function useIcpExtract(): UseIcpExtractReturn {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  // Active job ID being polled
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  // Last start payload (for retry)
  const [lastPayload, setLastPayload] = useState<{
    payload: IcpExtractRequest;
    tenantId: string;
  } | null>(null);
  // Poll error counter (stops polling on repeated network errors)
  const [pollErrorCount, setPollErrorCount] = useState(0);
  // Extraction error (start or poll failure)
  const [extractError, setExtractError] = useState<Error | null>(null);
  // Last known job (from start or poll)
  const [lastJob, setLastJob] = useState<IcpExtractJob | null>(null);

  // ── Mutation: start extraction ──────────────────────────────────────────────

  const startMutation = useMutation<
    IcpExtractJob,
    Error,
    { payload: IcpExtractRequest; tenantId: string }
  >({
    mutationFn: async ({ payload, tenantId }) => {
      const token = await getToken();
      if (!token) throw new Error("No autenticado");
      return extractApi.startExtraction({ token, tenantId }, payload);
    },
    onMutate: () => {
      // Clear previous state
      setExtractError(null);
      setActiveJobId(null);
      setLastJob(null);
      setPollErrorCount(0);
    },
    onSuccess: (job) => {
      setLastJob(job);
      if (job.status === "analizando") {
        // Start polling
        setActiveJobId(job.jobId);
      } else if (job.status === "done") {
        // Immediate success (edge case — no polling needed)
        void queryClient.invalidateQueries({ queryKey: extractQueryKeys.icpList() });
      } else {
        // Immediate failure
        setExtractError(new Error("La extracción no pudo completarse. Intenta de nuevo."));
      }
    },
    onError: (error) => {
      setExtractError(error);
    },
  });

  // ── Query: poll extraction status ───────────────────────────────────────────

  const pollQuery = useQuery<IcpExtractJob, Error>({
    queryKey: activeJobId ? extractQueryKeys.poll(activeJobId) : ["abel", "icp", "extract", "noop"],
    queryFn: async () => {
      if (!activeJobId) throw new Error("No hay trabajo activo");
      const token = await getToken();
      if (!token) throw new Error("No autenticado");
      // tenantId comes from lastPayload (set by start)
      const tenantId = lastPayload?.tenantId ?? "";
      return extractApi.pollExtraction({ token, tenantId }, activeJobId);
    },
    enabled:
      isLoaded && isSignedIn === true && activeJobId !== null && pollErrorCount < MAX_POLL_ERRORS,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Stop polling when done or failed
      if (data?.status === "done" || data?.status === "failed") return false;
      return POLL_INTERVAL_MS;
    },
    retry: 2,
  });

  // ── React to poll results ───────────────────────────────────────────────────

  // Update lastJob and handle terminal states
  const pollData = pollQuery.data;
  const pollError = pollQuery.error;

  // Handle poll success (in render — synchronous with state)
  if (pollData && pollData !== lastJob) {
    setLastJob(pollData);
    if (pollData.status === "done") {
      setActiveJobId(null); // stop polling
      void queryClient.invalidateQueries({ queryKey: extractQueryKeys.icpList() });
    } else if (pollData.status === "failed") {
      setActiveJobId(null); // stop polling
      setExtractError(
        new Error(
          pollData.errorMessage ??
            "Abel no pudo leer la fuente. Intenta de nuevo o completa los datos manualmente.",
        ),
      );
    }
  }

  // Handle poll network error
  if (pollError && pollError !== extractError) {
    setPollErrorCount((c) => c + 1);
    if (pollErrorCount + 1 >= MAX_POLL_ERRORS) {
      setActiveJobId(null); // stop polling
      setExtractError(pollError);
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  const startExtract = useCallback(
    async (payload: IcpExtractRequest, tenantId: string): Promise<IcpExtractJob> => {
      setLastPayload({ payload, tenantId });
      return startMutation.mutateAsync({ payload, tenantId });
    },
    [startMutation],
  );

  const clearJob = useCallback(() => {
    setActiveJobId(null);
    setLastJob(null);
    setExtractError(null);
    setPollErrorCount(0);
  }, []);

  const retryExtract = lastPayload
    ? () => {
        void startExtract(lastPayload.payload, lastPayload.tenantId);
      }
    : null;

  const isAnalyzing = activeJobId !== null && lastJob?.status === "analizando";

  return {
    startExtract,
    job: lastJob,
    isAnalyzing,
    isStarting: startMutation.isPending,
    extractError,
    clearJob,
    retryExtract,
  };
}
