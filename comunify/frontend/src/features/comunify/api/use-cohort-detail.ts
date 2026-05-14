"use client";

// TODO T-fe-4 polish post-merge: wire real CohortDetail type from CONTRACT
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { comunifyQueryKeys } from "./query-keys";

interface CohortDetail {
  id: string;
  name: string;
  offer_id: string;
  capacity_max: number;
  enrolled_count: number;
  start_date: string;
  end_date: string;
  description?: string;
  status: string;
}

export function useCohortDetail(cohortId: string | undefined) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: comunifyQueryKeys.cohorts.detail(cohortId ?? ""),
    queryFn: async (): Promise<CohortDetail> => {
      const token = await getToken();
      const res = await fetch(`/api/v1/cohorts/${cohortId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Error al cargar cohorte");
      return res.json() as Promise<CohortDetail>;
    },
    enabled: isLoaded && isSignedIn && Boolean(cohortId),
  });
}
