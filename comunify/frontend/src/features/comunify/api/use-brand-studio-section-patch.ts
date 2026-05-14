"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { comunifyQueryKeys } from "./query-keys";

interface PatchBrandSectionPayload {
  section: string;
  data: Record<string, unknown>;
}

export function useBrandStudioSectionPatch() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ section, data }: PatchBrandSectionPayload) => {
      const token = await getToken();
      const res = await fetch(`/api/v1/brand-studio/sections/${section}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error al guardar sección");
      return res.json() as Promise<Record<string, unknown>>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: comunifyQueryKeys.brandStudio.sections(),
      });
    },
  });
}
