"use client";

// TODO T-fe-2 polish post-merge: wire real DTO type + AuthorityVaultEntry
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { comunifyQueryKeys } from "./query-keys";

interface AddCredentialPayload {
  title: string;
  issuer: string;
  year?: number;
  url?: string;
}

export function useAuthorityCredentialAdd() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AddCredentialPayload) => {
      const token = await getToken();
      const res = await fetch("/api/v1/authority/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Error al agregar credencial");
      return res.json() as Promise<Record<string, unknown>>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: comunifyQueryKeys.authorityVault.all() });
    },
  });
}
