// cap: sales_agent.inbox-handler-mode-occ
// atomics: TBD
// story-origin: TBD
"use client";

/**
 * use-mode-toggle.ts — Orchestration hook for SegmentedControl3Modes.
 *
 * Bridges the UI segmented control (3 values: adrian-decide / adrian-consulta / yo-escribo)
 * to the backend useSetMode mutation (which only knows "ai" | "human" + proposalRequired).
 *
 * URL mode → API mapping:
 *   "adrian-decide"  → { newMode: "ai",    proposalRequired: false }
 *   "adrian-consulta"→ { newMode: "ai",    proposalRequired: true  }
 *   "yo-escribo"     → { newMode: "human", proposalRequired: false }
 *
 * OCC: Uses conversation.updated_at as expectedUpdatedAt for If-Match header.
 * On 409: caller component should show conflict toast (INBOX_COPY.errors.sendConflict).
 *
 * downstream-regression-na: brand-local FE hook; no cross-brand consumers
 */

import { useCallback } from "react";
import { useSetMode } from "../api/use-set-mode";
import type { Conversation } from "@/features/crm-shared";

export type SegmentedModeValue =
  | "adrian-decide"
  | "adrian-consulta"
  | "yo-escribo";

/** Map UI segment value → API mode input */
const SEGMENT_TO_API: Record<
  SegmentedModeValue,
  { newMode: "ai" | "human"; proposalRequired: boolean }
> = {
  "adrian-decide": { newMode: "ai", proposalRequired: false },
  "adrian-consulta": { newMode: "ai", proposalRequired: true },
  "yo-escribo": { newMode: "human", proposalRequired: false },
};

/** Map API state → UI segment value (for controlled display) */
export function conversationToSegmentValue(
  conversation: Pick<Conversation, "handler_mode" | "proposal_required">,
): SegmentedModeValue {
  if (conversation.handler_mode === "human") return "yo-escribo";
  if (conversation.proposal_required) return "adrian-consulta";
  return "adrian-decide";
}

export interface UseModeToggleResult {
  /** Call with the new UI segment value; handles OCC internally */
  toggle: (newSegment: SegmentedModeValue) => void;
  /** Whether the mutation is in-flight */
  isPending: boolean;
  /** Whether the last mutation resulted in a 409 conflict */
  isConflict: boolean;
}

/**
 * Orchestrates SetMode mutation with segment-to-API mapping.
 *
 * @param conversationId - The conversation to change mode for
 * @param conversation - Current conversation entity (for OCC updated_at + current display)
 */
export function useModeToggle(
  conversationId: string,
  conversation: Pick<Conversation, "updated_at"> | null | undefined,
): UseModeToggleResult {
  const { mutate, isPending, error } = useSetMode(conversationId);

  const toggle = useCallback(
    (newSegment: SegmentedModeValue) => {
      if (!conversation) return;
      const apiInput = SEGMENT_TO_API[newSegment];
      mutate({
        ...apiInput,
        expectedUpdatedAt: conversation.updated_at,
      });
    },
    [conversation, mutate],
  );

  // Detect 409 conflict from ApiError
  const isConflict =
    error !== null &&
    typeof error === "object" &&
    "status" in error &&
    (error as { status: number }).status === 409;

  return { toggle, isPending, isConflict };
}
