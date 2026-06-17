// cap: comunify-shell-organism
/**
 * chat-store.test.ts — Unit tests for useChatStore (T-chat-store).
 *
 * Scenarios covered:
 *   SC-chat-ok        — happy path: SSE streams, messages accumulate, status idle at end
 *   SC-chat-error     — 5xx response → status "error", bot bubble removed, user msg kept
 *   SC-chat-network   — AbortError (timeout/network drop) → status "network"
 *   SC-chat-double-send — second sendMessage while thinking/streaming is a no-op
 *   SC-chat-delegate  — agentic-no-domain-write: no fetch to domain endpoints
 *
 * Transport is MOCKED — no live backend hit.
 * @vitest-environment happy-dom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useChatStore } from "../chat-store";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a raw SSE string from event+data pairs. */
function buildSseStream(events: { event: string; data: string }[]): string {
  return events.map((e) => `event: ${e.event}\ndata: ${e.data}\n\n`).join("");
}

/** Create a ReadableStream from a string (simulates SSE body). */
function stringToStream(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(text);
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoded);
      controller.close();
    },
  });
}

/** Reset the store to initial state between tests. */
function resetStore() {
  useChatStore.setState({
    messages: [],
    conversations: [],
    status: "idle",
    activeAgent: "valeria",
    _authContext: null,
    _hasHydrated: true,
  });
}

/** Wait for the store status to reach the expected value (polls up to maxMs). */
async function waitForStatus(
  expected: string,
  maxMs = 2000
): Promise<void> {
  const start = Date.now();
  return new Promise<void>((resolve, reject) => {
    const check = () => {
      const { status } = useChatStore.getState();
      if (status === expected) {
        resolve();
        return;
      }
      if (Date.now() - start > maxMs) {
        reject(
          new Error(
            `Timeout waiting for status "${expected}" (got "${status}") after ${maxMs}ms`
          )
        );
        return;
      }
      setTimeout(check, 20);
    };
    check();
  });
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  resetStore();
  useChatStore.getState().setAuthContext("tok-test", "ten-abc");
  vi.resetAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── SC-chat-ok ────────────────────────────────────────────────────────────────

describe("SC-chat-ok — happy path SSE stream", () => {
  it("pushes user message, streams bot reply, ends at idle", async () => {
    const sseBody = buildSseStream([
      { event: "message_start", data: "{}" },
      { event: "block_start", data: "{}" },
      { event: "block_delta", data: JSON.stringify({ text: "Hola " }) },
      { event: "block_delta", data: JSON.stringify({ text: "mundo" }) },
      { event: "message_end", data: "{}" },
    ]);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        body: stringToStream(sseBody),
        json: () => Promise.resolve({}),
      })
    );

    useChatStore.getState().sendMessage("hola");

    // Immediately after sendMessage: user bubble + thinking bubble, status thinking
    const afterSend = useChatStore.getState();
    expect(afterSend.status).toBe("thinking");
    expect(afterSend.messages).toHaveLength(2);
    expect(afterSend.messages[0].role).toBe("user");
    expect(afterSend.messages[0].content).toBe("hola");
    expect(afterSend.messages[1].role).toBe("thinking");

    // Wait for stream to complete
    await waitForStatus("idle");

    const final = useChatStore.getState();
    expect(final.status).toBe("idle");
    expect(final.messages).toHaveLength(2);
    const botMsg = final.messages[1];
    expect(botMsg.role).toBe("bot");
    expect(botMsg.content).toBe("Hola mundo");

    // Only copilot endpoint called — no domain writes
    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/v1/comunify/copilot/chat");
    expect(options.method).toBe("POST");
  });

  it("sets status streaming on first block_delta before message_end", async () => {
    const statusSnapshots: string[] = [];

    const sseBody = buildSseStream([
      { event: "block_delta", data: JSON.stringify({ text: "Primer chunk" }) },
      { event: "message_end", data: "{}" },
    ]);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        body: stringToStream(sseBody),
      })
    );

    const unsub = useChatStore.subscribe((state) => {
      statusSnapshots.push(state.status);
    });

    useChatStore.getState().sendMessage("prueba");
    await waitForStatus("idle");
    unsub();

    expect(statusSnapshots).toContain("thinking");
    expect(statusSnapshots).toContain("streaming");
    expect(statusSnapshots[statusSnapshots.length - 1]).toBe("idle");
  });

  it("injects X-Tenant-ID and Authorization headers", async () => {
    const sseBody = buildSseStream([
      { event: "done", data: "{}" },
    ]);

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      body: stringToStream(sseBody),
    });
    vi.stubGlobal("fetch", fetchMock);

    useChatStore.getState().sendMessage("mensaje");
    await waitForStatus("idle");

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
    expect(options.headers?.["Authorization"]).toBe("Bearer tok-test");
    expect(options.headers?.["X-Tenant-ID"]).toBe("ten-abc");
  });
});

// ── SC-chat-error ─────────────────────────────────────────────────────────────

describe("SC-chat-error — 5xx server error", () => {
  it("sets status error, removes bot bubble, keeps user message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      })
    );

    useChatStore.getState().sendMessage("consulta fallida");
    await waitForStatus("error");

    const state = useChatStore.getState();
    expect(state.status).toBe("error");
    // User message kept, bot bubble removed
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0].role).toBe("user");
    expect(state.messages[0].content).toBe("consulta fallida");
  });

  it("handles SSE stream error event", async () => {
    const sseBody = buildSseStream([
      { event: "block_delta", data: JSON.stringify({ text: "parcial..." }) },
      { event: "error", data: JSON.stringify({ code: "COPILOT_FAIL" }) },
    ]);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        body: stringToStream(sseBody),
      })
    );

    useChatStore.getState().sendMessage("mensaje con error mid-stream");
    await waitForStatus("error");

    const state = useChatStore.getState();
    expect(state.status).toBe("error");
    // Bot bubble removed on error
    const botMsgs = state.messages.filter((m) => m.role === "bot");
    expect(botMsgs).toHaveLength(0);
    // User message kept
    expect(state.messages[0].role).toBe("user");
  });
});

// ── SC-chat-network ───────────────────────────────────────────────────────────

describe("SC-chat-network — abort / timeout / connection drop", () => {
  it("sets status network on AbortError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(
        Object.assign(new Error("The operation was aborted"), { name: "AbortError" })
      )
    );

    useChatStore.getState().sendMessage("mensaje abortado");
    await waitForStatus("network");

    const state = useChatStore.getState();
    expect(state.status).toBe("network");
    // Bot bubble removed; user message kept
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0].role).toBe("user");
  });

  it("sets status network on generic network error (no response)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(new TypeError("Failed to fetch"))
    );

    useChatStore.getState().sendMessage("sin red");
    await waitForStatus("network");

    expect(useChatStore.getState().status).toBe("network");
  });

  it("handles null response body (streaming not available)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        body: null,
      })
    );

    useChatStore.getState().sendMessage("body nulo");
    await waitForStatus("network");

    expect(useChatStore.getState().status).toBe("network");
  });
});

// ── SC-chat-double-send ───────────────────────────────────────────────────────

describe("SC-chat-double-send — second sendMessage is no-op while in-flight", () => {
  it("ignores second sendMessage while status=thinking", async () => {
    // Set up a long-running SSE stream that doesn't resolve quickly
    let streamController!: ReadableStreamDefaultController<Uint8Array>;
    const slowStream = new ReadableStream<Uint8Array>({
      start(c) { streamController = c; },
    });

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      body: slowStream,
    });
    vi.stubGlobal("fetch", fetchMock);

    // First send
    useChatStore.getState().sendMessage("primer mensaje");

    // Status should be thinking immediately
    expect(useChatStore.getState().status).toBe("thinking");

    // Second send while thinking — should be no-op
    useChatStore.getState().sendMessage("segundo mensaje (ignorado)");

    // Fetch should have been called only once
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Messages: only 2 (user + thinking from first send)
    const state = useChatStore.getState();
    expect(state.messages).toHaveLength(2);
    expect(state.messages[0].content).toBe("primer mensaje");

    // Close the stream to clean up
    const encoder = new TextEncoder();
    streamController.enqueue(encoder.encode("event: done\ndata: {}\n\n"));
    streamController.close();
    await waitForStatus("idle");
  });

  it("ignores second sendMessage while status=streaming", async () => {
    let streamController!: ReadableStreamDefaultController<Uint8Array>;
    const liveStream = new ReadableStream<Uint8Array>({
      start(c) { streamController = c; },
    });

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      body: liveStream,
    });
    vi.stubGlobal("fetch", fetchMock);

    useChatStore.getState().sendMessage("mensaje en curso");

    // Push first delta to trigger streaming status
    const encoder = new TextEncoder();
    await new Promise<void>((resolve) => setTimeout(resolve, 10));
    streamController.enqueue(
      encoder.encode("event: block_delta\ndata: {\"text\":\"chunk\"}\n\n")
    );

    await waitForStatus("streaming");

    // Attempt second send while streaming — no-op
    useChatStore.getState().sendMessage("interrumpir (ignorado)");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Clean up
    streamController.enqueue(encoder.encode("event: message_end\ndata: {}\n\n"));
    streamController.close();
    await waitForStatus("idle");
  });
});

// ── SC-chat-delegate — agentic-no-domain-write ───────────────────────────────

describe("SC-chat-delegate — agentic-no-domain-write: store only calls /copilot/chat", () => {
  it("only fetches the copilot endpoint, never a domain endpoint", async () => {
    const sseBody = buildSseStream([
      { event: "done", data: "{}" },
    ]);

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      body: stringToStream(sseBody),
    });
    vi.stubGlobal("fetch", fetchMock);

    useChatStore.getState().sendMessage("delegar acción");
    await waitForStatus("idle");

    // Assert: exactly ONE fetch call, and it's to the copilot endpoint
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0] as [string, unknown];
    expect(url).toBe("/api/v1/comunify/copilot/chat");

    // Negative assertion: none of these domain paths were hit
    const forbiddenPatterns = [
      "/brand",
      "/offer",
      "/crm",
      "/analytics",
      "/community",
      "/cohort",
      "/vault",
      "/voice_profile",
    ];
    for (const [calledUrl] of fetchMock.mock.calls as [[string, unknown]]) {
      for (const forbidden of forbiddenPatterns) {
        expect(calledUrl).not.toContain(forbidden);
      }
    }
  });

  it("clearMessages resets to idle without fetch", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    // Manually set some messages
    useChatStore.setState({
      messages: [
        { id: "1", role: "user", content: "hola" },
        { id: "2", role: "bot", content: "respuesta" },
      ],
      status: "idle",
    });

    useChatStore.getState().clearMessages();

    expect(useChatStore.getState().messages).toHaveLength(0);
    expect(useChatStore.getState().status).toBe("idle");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("newConversation archives messages without fetch", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    useChatStore.setState({
      messages: [
        { id: "1", role: "user", content: "sesión anterior" },
        { id: "2", role: "bot", content: "respuesta previa" },
      ],
      conversations: [],
      status: "idle",
    });

    useChatStore.getState().newConversation();

    const state = useChatStore.getState();
    expect(state.messages).toHaveLength(0);
    expect(state.conversations).toHaveLength(1);
    expect(state.conversations[0].title).toContain("sesión anterior");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("setActiveAgent changes activeAgent without fetch", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    useChatStore.getState().setActiveAgent("lisa");

    expect(useChatStore.getState().activeAgent).toBe("lisa");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

// ── Additional store state correctness ───────────────────────────────────────

describe("store state correctness", () => {
  it("setAuthContext stores token and tenantId", () => {
    useChatStore.getState().setAuthContext("new-token", "new-tenant");
    const auth = useChatStore.getState()._authContext;
    expect(auth?.token).toBe("new-token");
    expect(auth?.tenantId).toBe("new-tenant");
  });

  it("_hasHydrated is true by default (ephemeral store, no SSR persist)", () => {
    expect(useChatStore.getState()._hasHydrated).toBe(true);
  });

  it("initial status is idle", () => {
    expect(useChatStore.getState().status).toBe("idle");
  });

  it("initial messages and conversations are empty arrays", () => {
    expect(useChatStore.getState().messages).toHaveLength(0);
    expect(useChatStore.getState().conversations).toHaveLength(0);
  });
});
