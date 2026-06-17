// cap: comunify-shell-organism
// LIFT CANDIDATE → @luana/ui-kit post-merge (T-chat-store 2026-06-15).
// Once lifted, brand injects via ShellLayoutProps.useChatStore = useChatStore as unknown as ShellChatStore.
// This store owns the SSE lifecycle for POST /api/v1/comunify/copilot/chat.
// agentic-no-domain-write: ONLY calls /copilot/chat — never domain endpoints.

import { create } from "zustand/react"; // index export* falla en turbopack (HB-78)
import type {
  ShellChatMessage,
  ShellChatStatus,
  ShellConversationMeta,
} from "@luana/ui-kit";

// ── Internal extended status (kit ShellChatStatus lacks error/network) ────────
/** @internal */
type ChatStoreStatus = ShellChatStatus | "error" | "network";

// ── SSE event types from core/luana-core-copilot/api/chat.py ─────────────────
type SseEventType =
  | "status"
  | "message_start"
  | "block_start"
  | "block_delta"
  | "block_end"
  | "block_append"
  | "tool_start"
  | "tool_result"
  | "message_end"
  | "done"
  | "error";

interface SseEvent {
  event: SseEventType;
  data: string;
}

// ── Auth context (injected by ShellLayoutWire wrapper component) ──────────────
interface AuthContext {
  token: string;
  tenantId: string;
}

// ── Full store state (extends ShellChatStoreApi + auth context + SsrSafeHydration stub) ──
export interface ChatStoreState {
  // ShellChatStoreApi fields
  messages: ShellChatMessage[];
  conversations: ShellConversationMeta[];
  activeAgent: string;
  status: ChatStoreStatus;

  // SsrSafeHydration stub (chat is ephemeral — no localStorage persist needed)
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  // Auth context — set by wrapper component, never from hooks inside the store
  _authContext: AuthContext | null;

  // Actions (ShellChatStoreApi)
  sendMessage: (content: string) => void;
  clearMessages: () => void;
  newConversation: () => void;
  setActiveAgent: (agent: string) => void;

  // Auth injection (called by ShellLayoutWire or equivalent wrapper)
  setAuthContext: (token: string, tenantId: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function nowHHMM(): string {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function nanoid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Parse a raw SSE line buffer into discrete {event, data} pairs. */
function parseSseChunk(raw: string): SseEvent[] {
  const events: SseEvent[] = [];
  // Split on double-newline to get individual event blocks
  const blocks = raw.split(/\n\n/);
  for (const block of blocks) {
    if (!block.trim()) continue;
    let eventType: SseEventType | null = null;
    let dataLine = "";
    for (const line of block.split("\n")) {
      if (line.startsWith("event:")) {
        eventType = line.slice("event:".length).trim() as SseEventType;
      } else if (line.startsWith("data:")) {
        dataLine = line.slice("data:".length).trim();
      }
    }
    if (eventType) {
      events.push({ event: eventType, data: dataLine });
    }
  }
  return events;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useChatStore = create<ChatStoreState>((set, get) => ({
  // Initial state
  messages: [],
  conversations: [],
  activeAgent: "valeria", // default supervisor slug; overridden by setActiveAgent
  status: "idle",

  // SsrSafeHydration stub — chat state is ephemeral, no persistence needed
  _hasHydrated: true,
  setHasHydrated: (v: boolean) => set({ _hasHydrated: v }),

  // Auth context — null until ShellLayoutWire calls setAuthContext
  _authContext: null,
  setAuthContext: (token: string, tenantId: string) =>
    set({ _authContext: { token, tenantId } }),

  // ── Actions ────────────────────────────────────────────────────────────────

  clearMessages: () => set({ messages: [], status: "idle" }),

  newConversation: () => {
    const { messages } = get();
    if (messages.length === 0) return;

    // Archive current conversation as a new entry in history
    const firstUserMsg = messages.find((m) => m.role === "user");
    const title = firstUserMsg?.content?.slice(0, 60) ?? "Conversación";
    const conv: ShellConversationMeta = {
      id: nanoid(),
      title,
      group: "today",
      meta: nowHHMM(),
    };
    set((s) => ({
      conversations: [conv, ...s.conversations],
      messages: [],
      status: "idle",
    }));
  },

  setActiveAgent: (agent: string) => set({ activeAgent: agent }),

  /**
   * sendMessage — core SSE streaming action.
   *
   * State machine:
   *   idle → thinking (user msg pushed, spinner)
   *   thinking → streaming (first block_delta received)
   *   streaming → idle (message_end / done)
   *   * → error (5xx or parse failure)
   *   * → network (abort / timeout / connection drop)
   *
   * Graceful-degradation: if status ∈ {thinking, streaming} → no-op (single in-flight).
   * agentic-no-domain-write: only calls /api/v1/comunify/copilot/chat.
   */
  sendMessage: (content: string) => {
    const { status, activeAgent, _authContext } = get();

    // Graceful-degradation: single request in-flight
    if (status === "thinking" || status === "streaming") return;

    const auth = _authContext;

    // Push user bubble immediately; set status = thinking
    const userMsg: ShellChatMessage = {
      id: nanoid(),
      role: "user",
      content,
      time: nowHHMM(),
    };

    // Prepare bot placeholder bubble
    const botMsgId = nanoid();
    const botMsg: ShellChatMessage = {
      id: botMsgId,
      role: "thinking",
      content: "",
      agent: activeAgent,
      time: nowHHMM(),
    };

    set((s) => ({
      messages: [...s.messages, userMsg, botMsg],
      status: "thinking",
    }));

    // ── SSE fetch (fire-and-forget async — store subscribes to its own state) ──
    void (async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30_000);

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        };

        if (auth) {
          headers["Authorization"] = `Bearer ${auth.token}`;
          headers["X-Tenant-ID"] = auth.tenantId;
        }

        const response = await fetch("/api/v1/comunify/copilot/chat", {
          method: "POST",
          signal: controller.signal,
          headers,
          body: JSON.stringify({
            message: content,
            agent: activeAgent,
          }),
        });

        if (!response.ok) {
          // 5xx / 4xx → error state; keep user message, allow retry
          set((s) => ({
            messages: s.messages.filter((m) => m.id !== botMsgId),
            status: "error",
          }));
          return;
        }

        if (!response.body) {
          set((s) => ({
            messages: s.messages.filter((m) => m.id !== botMsgId),
            status: "network",
          }));
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulatedContent = "";
        let hasStartedStreaming = false;

        while (true) {
          const { done, value } = await reader.read(); // sequential SSE read loop
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Extract complete SSE event blocks (terminated by \n\n)
          const events = parseSseChunk(buffer);
          // Keep the incomplete trailing part in buffer
          const lastDoubleNl = buffer.lastIndexOf("\n\n");
          if (lastDoubleNl >= 0) {
            buffer = buffer.slice(lastDoubleNl + 2);
          }

          for (const sseEvent of events) {
            switch (sseEvent.event) {
              case "block_delta":
              case "block_append": {
                // First delta → flip to streaming + flip bot bubble from thinking→bot
                if (!hasStartedStreaming) {
                  hasStartedStreaming = true;
                  set((s) => ({
                    status: "streaming",
                    messages: s.messages.map((m) =>
                      m.id === botMsgId ? { ...m, role: "bot" as const } : m
                    ),
                  }));
                }
                // Append delta text
                let delta = "";
                try {
                  const parsed = JSON.parse(sseEvent.data) as {
                    text?: string;
                    delta?: string;
                  };
                  delta = parsed.text ?? parsed.delta ?? "";
                } catch {
                  delta = sseEvent.data;
                }
                accumulatedContent += delta;
                const snap = accumulatedContent;
                set((s) => ({
                  messages: s.messages.map((m) =>
                    m.id === botMsgId ? { ...m, content: snap } : m
                  ),
                }));
                break;
              }

              case "message_end":
              case "done": {
                // Finalize — ensure role=bot and status=idle
                set((s) => ({
                  status: "idle",
                  messages: s.messages.map((m) =>
                    m.id === botMsgId
                      ? { ...m, role: "bot" as const, content: accumulatedContent || m.content }
                      : m
                  ),
                }));
                break;
              }

              case "error": {
                // Server-side error event in the SSE stream
                set((s) => ({
                  messages: s.messages.filter((m) => m.id !== botMsgId),
                  status: "error",
                }));
                break;
              }

              default:
                // status, message_start, block_start, block_end, tool_start, tool_result → ignore
                break;
            }
          }
        }

        // Stream ended without explicit done/message_end → finalize gracefully
        const currentStatus = get().status;
        if (currentStatus === "thinking" || currentStatus === "streaming") {
          set((s) => ({
            status: "idle",
            messages: s.messages.map((m) =>
              m.id === botMsgId
                ? { ...m, role: "bot" as const }
                : m
            ),
          }));
        }
      } catch (err: unknown) {
        // AbortError → network state; other errors → network state too
        const isAbort =
          err instanceof Error && err.name === "AbortError";
        set((s) => ({
          messages: s.messages.filter((m) => m.id !== botMsgId),
          status: isAbort ? "network" : "network",
        }));
      } finally {
        clearTimeout(timeoutId);
      }
    })();
  },
}));
