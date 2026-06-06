// cap: __shared__
// story-origin: TBD
"use client";

/**
 * use-conversation-detail.ts — React Query hook for CRM conversation detail.
 *
 * Endpoint: GET /api/v1/vitalia/crm/conversations/{id}
 * Returns ConversationDetail compound: conversation + lead + messages + action_receipts + tools_state.
 *
 * PHI constraint: lead.name/phone/email must be rendered via PiiMaskedSpan in UI.
 *
 * downstream-regression-na: brand-local FE hook; no cross-brand consumers
 */

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useTenantId } from "@/hooks/useTenantId";
import { useClinicId } from "@/hooks/useClinicId";
import { fetchClient } from "@/lib/api/fetchClient";
import type { ConversationDetail } from "@/features/adrian/types/inbox.types";

/**
 * Fetches the full compound conversation detail.
 *
 * @param conversationId - The conversation UUID. Pass null/undefined to disable.
 */
export function useConversationDetail(
  conversationId: string | null | undefined,
) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const tenantId = useTenantId();
  const clinicId = useClinicId();

  return useQuery({
    queryKey: ["crm", "conversation", conversationId],
    queryFn: async () => {
      const token = await getToken();
      if (!token || !tenantId) throw new Error("Not authenticated");
      if (!conversationId) throw new Error("conversationId required");
      return fetchClient<ConversationDetail>(
        `/api/v1/crm/conversations/${conversationId}`,
        { token, tenantId, clinicId },
      );
    },
    enabled: isLoaded && isSignedIn === true && !!conversationId,
    staleTime: 10_000,
  });
}
