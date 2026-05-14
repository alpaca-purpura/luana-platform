"use client";

// TODO T-fe-2 polish post-merge: wire real DTO type
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { comunifyQueryKeys } from "./query-keys";

interface AddPressMentionPayload {
  outlet: string;
  headline: string;
  url: string;
  published_at?: string;
}

export function useAuthorityPressMentionAdd() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AddPressMentionPayload) => {
      const token = await getToken();
      const res = await fetch("/api/v1/authority/press-mentions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Error al agregar mención de prensa");
      return res.json() as Promise<Record<string, unknown>>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: comunifyQueryKeys.authorityVault.all() });
    },
  });
}
