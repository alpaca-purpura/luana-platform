"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { comunifyFetch } from "@/lib/fetch-client";
import { useTenantId } from "@/lib/use-tenant-id";
import type { AuthorityVault } from "../types/authority-vault.types";
import type {
  AuthorityCredentialInput,
  AuthorityCaseStudyInput,
  AuthorityPressMentionInput,
} from "../schemas/authority-credential-schema";
import { comunifyQueryKeys } from "./query-keys";

export function useAuthorityVault() {
  const { getToken, isLoaded } = useAuth();
  const tenantId = useTenantId();

  return useQuery({
    queryKey: comunifyQueryKeys.authorityVault.all(),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("No autenticado");
      return comunifyFetch<AuthorityVault>(
        "/api/v1/comunify/authority-vault",
        { token, tenantId }
      );
    },
    enabled: isLoaded && !!tenantId,
  });
}

export function useAuthorityCredentialAdd() {
  const { getToken } = useAuth();
  const tenantId = useTenantId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AuthorityCredentialInput) => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("No autenticado");
      return comunifyFetch<{ id: string }>(
        "/api/v1/comunify/authority-vault/credentials",
        {
          token,
          tenantId,
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
  const { getToken } = useAuth();
  const tenantId = useTenantId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AuthorityCaseStudyInput) => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("No autenticado");
      return comunifyFetch<{ id: string }>(
        "/api/v1/comunify/authority-vault/case-studies",
        {
          token,
          tenantId,
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
  const { getToken } = useAuth();
  const tenantId = useTenantId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AuthorityPressMentionInput) => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("No autenticado");
      return comunifyFetch<{ id: string }>(
        "/api/v1/comunify/authority-vault/press-mentions",
        {
          token,
          tenantId,
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
