// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-4
/**
 * chat-store.ts — Zustand store for Luana chat state (Nicolify R0 skeleton).
 *
 * Port re-tematizado from vitalia/chat-store.ts (Valeria→Luana, vitalia agents→nicolify).
 *
 * NOT persisted — chat is ephemeral cross-reload. Re-hydrates MOCK_MESSAGES on mount.
 * R1+ will wire real SSE/WebSocket handler.
 *
 * sendMessage mock flow (NON-functional R0 skeleton):
 * 1. Push user message + thinking indicator
 * 2. Set status='thinking'
 * 3. setTimeout 800ms → remove thinking + push canned response
 * 4. Set status='idle'
 *
 * Named export (no default export) per FSD-Lite enforce.
 * downstream-regression-na: brand-local store; no cross-brand consumers
 */

import { create } from "zustand";

import { AGENT_CATALOG, DEFAULT_CHAT_AGENT } from "@/lib/agent-catalog";
import { MOCK_MESSAGES, MOCK_RESPONSES_BY_AGENT } from "@/stores/_mock-messages";

import type { AgentSlug } from "@/lib/agent-catalog";

/** Message role — determines rendering variant */
export type MessageRole = "bot" | "user" | "delegate" | "thinking";

/** Chat message shape — covers all role variants */
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content?: string;
  time?: string;
  agent?: AgentSlug;
  fromAgent?: AgentSlug;
  toAgent?: AgentSlug;
  delegateMode?: string;
}

/** Chat store status */
export type ChatStatus = "idle" | "thinking" | "streaming";

/** Chat store interface */
export interface ChatStore {
  messages: ChatMessage[];
  activeAgent: AgentSlug;
  status: ChatStatus;
  sendMessage(content: string): void;
  clearMessages(): void;
  setActiveAgent(agent: AgentSlug): void;
}

function getNowHHMM(): string {
  return new Date().toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function resolveInitialMessages(): ChatMessage[] {
  if (
    process.env.NODE_ENV !== "production" &&
    typeof window !== "undefined" &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    Array.isArray((window as any).__chatStoreSeed__)
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    return (window as any).__chatStoreSeed__ as ChatMessage[];
  }
  return [...MOCK_MESSAGES];
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: resolveInitialMessages(),
  activeAgent: DEFAULT_CHAT_AGENT,
  status: "idle",

  sendMessage: (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    if (get().status === "thinking") return;

    const { activeAgent } = get();
    const agentName = AGENT_CATALOG[activeAgent]?.name ?? capitalize(activeAgent);

    const userCount = get().messages.filter((m) => m.role === "user").length;

    const responses = MOCK_RESPONSES_BY_AGENT[activeAgent]?.length
      ? MOCK_RESPONSES_BY_AGENT[activeAgent]
      : MOCK_RESPONSES_BY_AGENT[DEFAULT_CHAT_AGENT];

    const replyContent = responses[userCount % responses.length]?.content ?? "";

    const now = getNowHHMM();

    set((s) => ({
      status: "thinking",
      messages: [
        ...s.messages,
        {
          id: crypto.randomUUID(),
          role: "user",
          content: trimmed,
          time: now,
        },
        {
          id: crypto.randomUUID(),
          role: "thinking",
          agent: activeAgent,
          content: `${agentName} está escribiendo…`,
        },
      ],
    }));

    setTimeout(() => {
      const replyTime = getNowHHMM();
      set((s) => ({
        status: "idle",
        messages: [
          ...s.messages.filter((m) => m.role !== "thinking"),
          {
            id: crypto.randomUUID(),
            role: "bot",
            agent: activeAgent,
            content: replyContent,
            time: replyTime,
          },
        ],
      }));
    }, 800);
  },

  clearMessages: () => set({ messages: [], status: "idle" }),
  setActiveAgent: (agent: AgentSlug) => set({ activeAgent: agent }),
}));

if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  (window as any).__chatStore__ = useChatStore;
}
