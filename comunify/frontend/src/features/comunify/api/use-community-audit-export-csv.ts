"use client";

// TODO T-fe-6 polish post-merge: wire real export endpoint
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

interface AuditExportFilters {
  event_type?: string;
  date_from?: string;
  date_to?: string;
}

export function useCommunityAuditExportCsv() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (filters: AuditExportFilters): Promise<Blob> => {
      const token = await getToken();
      const params = new URLSearchParams();
      if (filters.event_type) params.set("event_type", filters.event_type);
      if (filters.date_from) params.set("date_from", filters.date_from);
      if (filters.date_to) params.set("date_to", filters.date_to);

      const res = await fetch(`/api/v1/community/audit/export-csv?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Error al exportar auditoría");
      return res.blob();
    },
  });
}
