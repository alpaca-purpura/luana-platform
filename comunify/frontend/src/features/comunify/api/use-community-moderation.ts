"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { comunifyFetch } from "@/lib/fetch-client";
import type { CommunityPost, ModerationAction } from "../types/community.types";
import { comunifyQueryKeys } from "./query-keys";

export function useCommunityModerationInbox() {
  const { getToken, userId, isLoaded } = useAuth();

  return useQuery({
    queryKey: comunifyQueryKeys.community.moderationInbox(),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) throw new Error("No autenticado");
      return comunifyFetch<CommunityPost[]>(
        "/api/v1/comunify/community/moderation/inbox",
        { token, tenantId: userId }
      );
    },
    enabled: isLoaded && !!userId,
    refetchInterval: 30_000,
  });
}

export function useModerationAction() {
  const { getToken, userId } = useAuth();
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
      if (!token || !userId) throw new Error("No autenticado");
      return comunifyFetch<{ success: boolean }>(
        `/api/v1/comunify/community/moderation/${postId}/action`,
        {
          token,
          tenantId: userId,
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
