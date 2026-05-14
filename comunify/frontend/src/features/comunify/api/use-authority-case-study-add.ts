"use client";

// TODO T-fe-2 polish post-merge: wire real DTO type
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { comunifyQueryKeys } from "./query-keys";

interface AddCaseStudyPayload {
  client_name: string;
  result: string;
  timeframe?: string;
  testimonial_quote?: string;
}

export function useAuthorityCaseStudyAdd() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AddCaseStudyPayload) => {
      const token = await getToken();
      const res = await fetch("/api/v1/authority/case-studies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Error al agregar caso de éxito");
      return res.json() as Promise<Record<string, unknown>>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: comunifyQueryKeys.authorityVault.all() });
    },
  });
}
