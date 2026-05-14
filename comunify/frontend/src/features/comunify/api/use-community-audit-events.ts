"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { comunifyFetch } from "@/lib/fetch-client";
import type { ComplianceAuditEvent } from "../types/community.types";
import type { AuditFilterInput } from "../schemas/audit-filter-schema";
import { comunifyQueryKeys } from "./query-keys";

export function useCommunityAuditEvents(filters: Partial<AuditFilterInput> = {}) {
  const { getToken, userId, isLoaded } = useAuth();

  return useQuery({
    queryKey: comunifyQueryKeys.audit.events(filters),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) throw new Error("No autenticado");
      const params = new URLSearchParams();
      if (filters.event_type) params.set("event_type", filters.event_type);
      if (filters.from_date) params.set("from_date", filters.from_date);
      if (filters.to_date) params.set("to_date", filters.to_date);
      params.set("page", String(filters.page ?? 1));
      params.set("page_size", String(filters.page_size ?? 25));
      return comunifyFetch<{ items: ComplianceAuditEvent[]; total: number }>(
        `/api/v1/comunify/community/audit/events?${params.toString()}`,
        { token, tenantId: userId }
      );
    },
    enabled: isLoaded && !!userId,
  });
}

export function useCommunityAuditExportCsv() {
  const { getToken, userId } = useAuth();

  return useMutation({
    mutationFn: async (filters: Partial<AuditFilterInput>) => {
      const token = await getToken();
      if (!token || !userId) throw new Error("No autenticado");
      const params = new URLSearchParams();
      if (filters.event_type) params.set("event_type", filters.event_type);
      if (filters.from_date) params.set("from_date", filters.from_date);
      if (filters.to_date) params.set("to_date", filters.to_date);
      // Returns blob CSV — handle separately in component
      const response = await fetch(
        `/api/v1/comunify/community/audit/events/export.csv?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-ID": userId,
          },
          signal: AbortSignal.timeout(30_000),
        }
      );
      if (!response.ok) throw new Error("Error exportando auditoría");
      return response.blob();
    },
  });
}
