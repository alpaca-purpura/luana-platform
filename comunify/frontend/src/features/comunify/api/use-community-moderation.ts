"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { comunifyFetch } from "@/lib/fetch-client";
import { useTenantId } from "@/lib/use-tenant-id";
import type { CommunityPost, ModerationAction } from "../types/community.types";
import { comunifyQueryKeys } from "./query-keys";

export function useCommunityModerationInbox() {
  const { getToken, isLoaded } = useAuth();
  const tenantId = useTenantId();

  return useQuery({
    queryKey: comunifyQueryKeys.community.moderationInbox(),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("No autenticado");
      return comunifyFetch<CommunityPost[]>(
        "/api/v1/comunify/community/moderation/inbox",
        { token, tenantId }
      );
    },
    enabled: isLoaded && !!tenantId,
    refetchInterval: 30_000,
  });
}

export function useModerationAction() {
  const { getToken } = useAuth();
  const tenantId = useTenantId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      action,
      reason,
    }: {
      postId: string;
      action: ModerationAction;
      reason?: string;
    }) => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("No autenticado");
      return comunifyFetch<{ success: boolean }>(
        `/api/v1/comunify/community/moderation/${postId}/action`,
        {
          token,
          tenantId,
          method: "POST",
          body: JSON.stringify({ action, reason }),
        }
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: comunifyQueryKeys.community.moderationInbox(),
      });
      void queryClient.invalidateQueries({
        queryKey: ["comunify", "community", "feed"],
      });
    },
  });
}
