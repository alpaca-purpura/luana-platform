// cap: sales_agent.inbox-handler-mode-occ
// story-origin: TBD
/**
 * inbox-store.ts — Inbox UI state (Zustand).
 *
 * UI-ONLY state: no server/API data here (that lives in React Query).
 * Persisted across re-renders within a session (not persisted to localStorage — HIPAA-lite).
 *
 * State shape per 03-arch-fe.md § 1:
 *   - expandedActivityStream: boolean
 *   - contactSidebarOpen: boolean
 *   - attachQueue: File[]
 *   - retractingMessages: Set<string>
 *   - proactiveModalOpen: boolean
 *
 * PHI constraint: NEVER put PHI (patient names, phone, email, diagnosis) in this store.
 * Only IDs and UI flags.
 *
 * downstream-regression-na: brand-local FE store; no cross-brand consumers
 */
"use client";

import { create } from "zustand";

/** Inbox UI state shape */
interface InboxState {
  /** Whether the AgentActivityStream is expanded (32px → 240px) */
  expandedActivityStream: boolean;
  /** Whether the ContactSidebar is visible (collapsable right panel) */
  contactSidebarOpen: boolean;
  /** Files queued for attachment before send */
  attachQueue: File[];
  /** Message IDs currently being retracted (for loading state on chip) */
  retractingMessages: Set<string>;
  /** Whether the ProactiveOutboundModal is open */
  proactiveModalOpen: boolean;
}

/** Inbox UI actions */
interface InboxActions {
  /** Toggle the AgentActivityStream expanded state */
  toggleActivityStream: () => void;
  /** Toggle the ContactSidebar visibility */
  toggleContactSidebar: () => void;
  /** Add files to the attach queue */
  enqueueAttach: (files: File[]) => void;
  /** Remove a specific file from the attach queue by index */
  dequeueAttach: (index: number) => void;
  /** Clear all files from the attach queue (after send) */
  clearAttachQueue: () => void;
  /** Mark a message as being retracted (show spinner on chip) */
  markRetracting: (messageId: string) => void;
  /** Unmark a message from retracting state */
  unmarkRetracting: (messageId: string) => void;
  /** Open the proactive outbound modal */
  openProactiveModal: () => void;
  /** Close the proactive outbound modal */
  closeProactiveModal: () => void;
  /** Reset all UI state (e.g. when navigating to a different conversation) */
  reset: () => void;
}

const initialState: InboxState = {
  expandedActivityStream: false,
  contactSidebarOpen: false,
  attachQueue: [],
  retractingMessages: new Set<string>(),
  proactiveModalOpen: false,
};

/**
 * useInboxStore — Zustand store for inbox UI state.
 *
 * Usage (Client Components only):
 *   const expandedActivityStream = useInboxStore((s) => s.expandedActivityStream);
 *   const toggleActivityStream = useInboxStore((s) => s.toggleActivityStream);
 */
export const useInboxStore = create<InboxState & InboxActions>()((set) => ({
  ...initialState,

  toggleActivityStream: () =>
    set((s) => ({ expandedActivityStream: !s.expandedActivityStream })),

  toggleContactSidebar: () =>
    set((s) => ({ contactSidebarOpen: !s.contactSidebarOpen })),

  enqueueAttach: (files) =>
    set((s) => ({ attachQueue: [...s.attachQueue, ...files] })),

  dequeueAttach: (index) =>
    set((s) => ({
      attachQueue: s.attachQueue.filter((_, i) => i !== index),
    })),

  clearAttachQueue: () => set({ attachQueue: [] }),

  markRetracting: (messageId) =>
    set((s) => ({
      retractingMessages: new Set([...s.retractingMessages, messageId]),
    })),

  unmarkRetracting: (messageId) =>
    set((s) => {
      const next = new Set(s.retractingMessages);
      next.delete(messageId);
      return { retractingMessages: next };
    }),

  openProactiveModal: () => set({ proactiveModalOpen: true }),

  closeProactiveModal: () => set({ proactiveModalOpen: false }),

  reset: () =>
    set({
      ...initialState,
      retractingMessages: new Set<string>(),
    }),
}));
