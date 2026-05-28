// cap: sales_agent.inbox-handler-mode-occ
// atomics: TBD
// story-origin: TBD
"use client";

/**
 * use-set-mode.ts — Mutation hook to change handler mode (ai ↔ human).
 *
 * Endpoint: POST /api/v1/vitalia/inbox/conversations/{conversationId}/mode
 *
 * Key features:
 * - OCC: If-Match header with conversation.updated_at prevents stale write
 * - Optimistic update: immediately reflects mode change in UI
 * - 409 Conflict → rollback optimistic state + re-fetch + caller shows toast
 * - SC-03: OCC conflict scenario verified in test suite
 *
 * downstream-regression-na: brand-local FE hook; no cross-brand consumers
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useClinicId } from "@/hooks/useClinicId";
import { fetchClient, ApiError } from "@/lib/api/fetchClient";
import { conversationDetailKey, conversationsListKey } from "./_keys";
import type { ConversationDetail } from "../types/conversation-detail";
import type { Conversation } from "@/features/crm-shared";

export interface SetModeInput {
  /** New handler mode */
  newMode: "ai" | "human";
  /** Whether the agent should wait for operator approval before sending */
  proposalRequired: boolean;
  /** OCC: conversation.updated_at used as ETag */
  expectedUpdatedAt: string;
}

export interface SetModeResult {
  conversation: Conversation;
}

/**
 * Mutation to toggle handler mode with optimistic UI update and OCC rollback.
 *
 * @param conversationId - The conversation to update.
 */
export function useSetMode(conversationId: string) {
  const { getToken, orgId } = useAuth();
  const clinicId = useClinicId();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: SetModeInput): Promise<SetModeResult> => {
      const token = await getToken();
      if (!token || !orgId) throw new Error("Not authenticated");

      return fetchClient<SetModeResult>(
        `/api/v1/vitalia/inbox/conversations/${conversationId}/mode`,
        {
          method: "POST",
          token,
          tenantId: orgId,
          clinicId,
          headers: {
            "If-Match": input.expectedUpdatedAt,
          },
          body: JSON.stringify({
            mode: input.newMode,
            proposal_required: input.proposalRequired,
          }),
        },
      );
    },
    onMutate: async (input) => {
      const key = conversationDetailKey(conversationId);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<ConversationDetail>(key);

      // Optimistic update: reflect mode change immediately
      if (previous) {
        qc.setQueryData<ConversationDetail>(key, {
          ...previous,
          conversation: {
            ...previous.conversation,
            handler_mode: input.newMode,
            proposal_required: input.proposalRequired,
          },
        });
      }

      return { previous };
    },
    onError: (err, _input, ctx) => {
      // Rollback optimistic update
      if (ctx?.previous) {
        qc.setQueryData(conversationDetailKey(conversationId), ctx.previous);
      }
      // On OCC conflict: re-fetch fresh state so UI reflects server truth
      if (err instanceof ApiError && err.status === 409) {
        void qc.invalidateQueries({
          queryKey: conversationDetailKey(conversationId),
        });
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({
        queryKey: conversationDetailKey(conversationId),
      });
      void qc.invalidateQueries({ queryKey: conversationsListKey() });
    },
  });
}
