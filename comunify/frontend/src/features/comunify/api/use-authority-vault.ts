"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { comunifyFetch } from "@/lib/fetch-client";
import type { AuthorityVault } from "../types/authority-vault.types";
import type {
  AuthorityCredentialInput,
  AuthorityCaseStudyInput,
  AuthorityPressMentionInput,
} from "../schemas/authority-credential-schema";
import { comunifyQueryKeys } from "./query-keys";

export function useAuthorityVault() {
  const { getToken, userId, isLoaded } = useAuth();

  return useQuery({
    queryKey: comunifyQueryKeys.authorityVault.all(),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) throw new Error("No autenticado");
      return comunifyFetch<AuthorityVault>(
        "/api/v1/comunify/authority-vault",
        { token, tenantId: userId }
      );
    },
    enabled: isLoaded && !!userId,
  });
}

export function useAuthorityCredentialAdd() {
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AuthorityCredentialInput) => {
      const token = await getToken();
      if (!token || !userId) throw new Error("No autenticado");
      return comunifyFetch<{ id: string }>(
        "/api/v1/comunify/authority-vault/credentials",
        {
          token,
          tenantId: userId,
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: comunifyQueryKeys.authorityVault.all() });
    },
  });
}

export function useAuthorityCaseStudyAdd() {
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AuthorityCaseStudyInput) => {
      const token = await getToken();
      if (!token || !userId) throw new Error("No autenticado");
      return comunifyFetch<{ id: string }>(
        "/api/v1/comunify/authority-vault/case-studies",
        {
          token,
          tenantId: userId,
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: comunifyQueryKeys.authorityVault.all() });
    },
  });
}

export function useAuthorityPressMentionAdd() {
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AuthorityPressMentionInput) => {
      const token = await getToken();
      if (!token || !userId) throw new Error("No autenticado");
      return comunifyFetch<{ id: string }>(
        "/api/v1/comunify/authority-vault/press-mentions",
        {
          token,
          tenantId: userId,
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: comunifyQueryKeys.authorityVault.all() });
    },
  });
}
