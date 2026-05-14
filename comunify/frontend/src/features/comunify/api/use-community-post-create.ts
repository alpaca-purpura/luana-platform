"use client";

// TODO T-fe-5 polish post-merge: wire real CreatePostPayload from CONTRACT
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { comunifyQueryKeys } from "./query-keys";

interface CreatePostPayload {
  content: string;
  cohort_id?: string;
  media_urls?: string[];
}

interface CommunityPost {
  id: string;
  content: string;
  author_id: string;
  created_at: string;
}

export function useCommunityPostCreate() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreatePostPayload): Promise<CommunityPost> => {
      const token = await getToken();
      const res = await fetch("/api/v1/community/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Error al crear publicación");
      return res.json() as Promise<CommunityPost>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: comunifyQueryKeys.community.feed({}) });
    },
  });
}
