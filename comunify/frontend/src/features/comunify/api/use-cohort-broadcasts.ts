"use client";

// TODO T-fe-4 polish post-merge: wire real BroadcastRecord type from CONTRACT
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { comunifyQueryKeys } from "./query-keys";

interface BroadcastRecord {
  id: string;
  channel: string;
  subject?: string;
  status: string;
  sent_at?: string;
  recipient_count: number;
}

export function useCohortBroadcasts(cohortId: string | undefined) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: comunifyQueryKeys.cohorts.broadcasts(cohortId ?? ""),
    queryFn: async (): Promise<BroadcastRecord[]> => {
      const token = await getToken();
      const res = await fetch(`/api/v1/cohorts/${cohortId}/broadcasts`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Error al cargar broadcasts");
      return res.json() as Promise<BroadcastRecord[]>;
    },
    enabled: isLoaded && isSignedIn && Boolean(cohortId),
  });
}
