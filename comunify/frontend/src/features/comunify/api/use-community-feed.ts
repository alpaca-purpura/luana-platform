"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { comunifyFetch } from "@/lib/fetch-client";
import type { CommunityPost } from "../types/community.types";
import type { CommunityPostInput } from "../schemas/community-post-schema";
import { comunifyQueryKeys } from "./query-keys";

interface FeedFilters {
  cohort_id?: string;
  status?: string;
}

export function useCommunityFeed(filters: FeedFilters = {}) {
  const { getToken, userId, isLoaded } = useAuth();

  return useQuery({
    queryKey: comunifyQueryKeys.community.feed(filters),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !userId) throw new Error("No autenticado");
      const params = new URLSearchParams();
      if (filters.cohort_id) params.set("cohort_id", filters.cohort_id);
      if (filters.status) params.set("status", filters.status);
      const qs = params.toString();
      return comunifyFetch<CommunityPost[]>(
        `/api/v1/comunify/community/feed${qs ? `?${qs}` : ""}`,
        { token, tenantId: userId }
      );
    },
    enabled: isLoaded && !!userId,
  });
}

export function useCommunityPostCreate() {
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CommunityPostInput) => {
      const token = await getToken();
      if (!token || !userId) throw new Error("No autenticado");
      return comunifyFetch<CommunityPost>(
        "/api/v1/comunify/community/posts",
        {
          token,
          tenantId: userId,
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["comunify", "community", "feed"],
      });
    },
  });
}
