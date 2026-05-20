"use client";

/**
 * use-mark-external — Mutation hook for silencing external treatment.
 *
 * Endpoint: POST /api/v1/vitalia/fidelization/patients/{patientId}/mark-external
 *
 * downstream-regression-na: brand-local FE hook; no cross-brand consumers
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { vitaliaFetch } from "@/lib/fetch-client";
import type { MarkExternalRequest, MarkExternalResponse } from "../types/re-engagement";

interface MarkExternalArgs {
  patientId: string;
  payload: MarkExternalRequest;
}

/**
 * Mutation for marking a patient as attending external treatment.
 */
export function useMarkExternal() {
  const queryClient = useQueryClient();
  const { getToken, orgId } = useAuth();

  return useMutation({
    mutationFn: async ({ patientId, payload }: MarkExternalArgs) => {
      const token = await getToken();
      if (!token || !orgId) throw new Error("Not authenticated");

      return vitaliaFetch<MarkExternalResponse>(
        `/api/v1/vitalia/fidelization/patients/${patientId}/mark-external`,
        {
          token,
          tenantId: orgId,
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["fidelizacion"] });
    },
  });
}
