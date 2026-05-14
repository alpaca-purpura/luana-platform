"use client";

// TODO T-fe-5 polish post-merge: wire real ModerationActionPayload from CONTRACT
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { comunifyQueryKeys } from "./query-keys";

interface ModerationActionPayload {
  post_id: string;
  action: "approve" | "reject" | "delete" | "warn_author";
  reason?: string;
}

export function useCommunityModerationAction() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ModerationActionPayload): Promise<void> => {
      const token = await getToken();
      const res = await fetch(`/api/v1/community/posts/${payload.post_id}/moderation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: payload.action, reason: payload.reason }),
      });
      if (!res.ok) throw new Error("Error al aplicar acción de moderación");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: comunifyQueryKeys.community.moderationInbox() });
    },
  });
}
