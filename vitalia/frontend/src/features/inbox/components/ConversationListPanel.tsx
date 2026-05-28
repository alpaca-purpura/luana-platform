// cap: sales_agent.inbox-handler-mode-occ
// atomics: TBD
// story-origin: TBD
/**
 * ConversationListPanel.tsx — Left pane container (320px) of the inbox layout.
 *
 * Composes:
 *   SearchInput (debounced 300ms, drives URL ?search=)
 *   FilterChips (channel/status/stage/mode/period/helpNeeded/unreadMedia → URL params)
 *   ConversationList (React Query data, skeleton, empty states)
 *
 * URL state (nuqs) owned here via useInboxUrlState.
 * useConversationFilters bridges URL → React Query filters.
 * useConversations fetches paginated conversations list.
 *
 * "use client" required: useInboxUrlState (nuqs), useConversations (React Query),
 *   useInboxStore (Zustand), useState for local search debounce bridge.
 *
 * HIPAA-lite: patient names fetched separately via useLeads — passed as lookup fn.
 * PHI fields (name) are displayed using plain text since ConversationListPanel
 * only shows name preview. Full PHI masking applies in ConversationThread/ContactSidebar.
 *
 * downstream-regression-na: brand-local FE component; no cross-brand consumers
 */
"use client";

import { useInboxUrlState } from "../url-state";
import { useConversationFilters } from "../hooks/use-conversation-filters";
import { useConversations } from "@/features/crm-shared/api/use-conversations";
import { SearchInput } from "./SearchInput";
import { FilterChips } from "./FilterChips";
import type { FilterChipsValue } from "./FilterChips";
import { ConversationList } from "./ConversationList";
import { INBOX_COPY } from "../copy";
import { cn } from "@/lib/cn";

interface ConversationListPanelProps {
  className?: string;
}

/**
 * ConversationListPanel — 320px left pane containing search + filters + list.
 *
 * Wires URL state (nuqs) ↔ React Query ↔ child components.
 * Handles loading / error / empty states per tessl__react-patterns baseline.
 */
export function ConversationListPanel({
  className,
}: ConversationListPanelProps) {
  const [urlState, setUrlState] = useInboxUrlState();
  const filters = useConversationFilters();
  const { data, isLoading, isError } = useConversations(filters);

  const conversations = data?.conversations ?? [];

  // Determine empty variant based on active filters
  function getEmptyVariant():
    | "noConversations"
    | "noHelpNeeded"
    | "noMediaUnread"
    | "noResultsFilter" {
    if (urlState.helpNeeded) return "noHelpNeeded";
    if (urlState.unreadMedia) return "noMediaUnread";
    const hasOtherFilter =
      urlState.channel !== null ||
      urlState.status !== null ||
      urlState.stage !== null ||
      urlState.mode !== null ||
      urlState.period !== null ||
      urlState.search !== null;
    if (hasOtherFilter) return "noResultsFilter";
    return "noConversations";
  }

  function handleClearFilters() {
    void setUrlState({
      channel: null,
      status: null,
      stage: null,
      mode: null,
      period: null,
      helpNeeded: null,
      unreadMedia: null,
      search: null,
    });
  }

  function handleSearchChange(val: string | null) {
    void setUrlState({ search: val });
  }

  function handleFiltersChange(next: FilterChipsValue) {
    void setUrlState({
      channel: next.channel,
      status: next.status,
      stage: next.stage,
      mode: next.mode,
      period: next.period,
      helpNeeded: next.helpNeeded,
      unreadMedia: next.unreadMedia,
    });
  }

  function handleSelect(conversationId: string) {
    void setUrlState({ lead: conversationId });
  }

  // Derive current FilterChipsValue from URL state
  const filterChipsValue: FilterChipsValue = {
    channel: urlState.channel ?? null,
    status: urlState.status ?? null,
    stage: urlState.stage ?? null,
    mode: urlState.mode ?? null,
    period: urlState.period ?? null,
    helpNeeded: urlState.helpNeeded ?? null,
    unreadMedia: urlState.unreadMedia ?? null,
  };

  return (
    <div
      className={cn("flex h-full flex-col overflow-hidden", className)}
      data-testid="conversation-list-panel-inner"
    >
      {/* Search bar */}
      <div className="shrink-0 border-b vt-border px-3 py-2">
        <SearchInput
          value={urlState.search ?? ""}
          onChange={handleSearchChange}
        />
      </div>

      {/* Filter chips */}
      <div className="shrink-0 border-b vt-border py-2">
        <FilterChips value={filterChipsValue} onChange={handleFiltersChange} />
      </div>

      {/* Error state */}
      {isError && !isLoading && (
        <div
          role="alert"
          aria-live="assertive"
          className="shrink-0 px-4 py-2 text-xs vt-text-danger"
          data-testid="conversations-error"
        >
          {INBOX_COPY.errors.loadConversations}
        </div>
      )}

      {/* Conversation list — scrollable, takes remaining height */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <ConversationList
          conversations={conversations}
          selectedId={urlState.lead ?? null}
          onSelect={handleSelect}
          isLoading={isLoading}
          emptyVariant={getEmptyVariant()}
          onClearFilters={handleClearFilters}
          className="h-full"
        />
      </div>
    </div>
  );
}
