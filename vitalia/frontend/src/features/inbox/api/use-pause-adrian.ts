// cap: sales_agent.inbox-handler-mode-occ
// atomics: TBD
// story-origin: TBD
"use client";

/**
 * use-pause-adrian.ts — Mutation hook to pause Adrián for 60 minutes.
 *
 * Endpoint: POST /api/v1/vitalia/inbox/conversations/{conversationId}/pause-adrian
 *
 * Pausing sets conversation.pause_until = now + 60min on the server.
 * Invalidates conversation detail to refresh the paused state in UI.
 *
 * downstream-regression-na: brand-local FE hook; no cross-brand consumers
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useClinicId } from "@/hooks/useClinicId";
import { fetchClient } from "@/lib/api/fetchClient";
import { conversationDetailKey, conversationsListKey } from "./_keys";
import type { Conversation } from "@/features/crm-shared";

export interface PauseAdrianInput {
  conversationId: string;
  /** Optional operator-provided reason (logged in audit trail) */
  reason?: string | null;
}

export interface PauseAdrianResult {
  conversation: Conversation;
}

/**
 * Mutation to pause Adrián for 60 minutes in the given conversation.
 */
export function usePauseAdrian() {
  const { getToken, orgId } = useAuth();
  const clinicId = useClinicId();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: PauseAdrianInput): Promise<PauseAdrianResult> => {
      const token = await getToken();
      if (!token || !orgId) throw new Error("Not authenticated");

      return fetchClient<PauseAdrianResult>(
        `/api/v1/vitalia/inbox/conversations/${input.conversationId}/pause-adrian`,
        {
          method: "POST",
          token,
          tenantId: orgId,
          clinicId,
          body: JSON.stringify({
            reason: input.reason ?? null,
          }),
        },
      );
    },
    onSettled: (_data, _err, input) => {
      void qc.invalidateQueries({
        queryKey: conversationDetailKey(input.conversationId),
      });
      void qc.invalidateQueries({ queryKey: conversationsListKey() });
    },
  });
}
