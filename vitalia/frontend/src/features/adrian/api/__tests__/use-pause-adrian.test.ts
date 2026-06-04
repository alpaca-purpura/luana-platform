/**
 * use-pause-adrian.test.ts — Tests for usePauseAdrian hook.
 *
 * Covers:
 * - Happy path: pauses with reason → conversation.pause_until set
 * - Happy path: pauses without reason
 * - Invalidates conversation detail + list on settle
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { usePauseAdrian } from "../use-pause-adrian";

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({
    getToken: vi.fn().mockResolvedValue("mock-token"),
    orgId: "org-test-tenant",
    isLoaded: true,
    isSignedIn: true,
  }),
}));
vi.mock("@/hooks/useTenantId", () => ({ useTenantId: () => "mock-tenant-id" }));


vi.mock("@/hooks/useClinicId", () => ({
  useClinicId: () => "clinic-abc",
}));

vi.mock("@/lib/api/fetchClient", () => ({
  fetchClient: vi.fn(),
  ApiError: class extends Error {},
}));

import { fetchClient } from "@/lib/api/fetchClient";

const CONVERSATION_ID = "conv-pause-001";

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  };
}

describe("usePauseAdrian", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  it("pauses Adrián with a reason and returns updated conversation", async () => {
    const pausedConversation = {
      id: CONVERSATION_ID,
      pause_until: "2026-01-01T11:00:00Z",
    };
    vi.mocked(fetchClient).mockResolvedValue({
      conversation: pausedConversation,
    });

    const { result } = renderHook(() => usePauseAdrian(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({
        conversationId: CONVERSATION_ID,
        reason: "Paciente fuera de horario, Adrián puede esperar",
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.conversation).toMatchObject({
      pause_until: "2026-01-01T11:00:00Z",
    });

    expect(fetchClient).toHaveBeenCalledWith(
      expect.stringContaining("/pause-adrian"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          reason: "Paciente fuera de horario, Adrián puede esperar",
        }),
      }),
    );
  });

  it("pauses without reason (null reason)", async () => {
    vi.mocked(fetchClient).mockResolvedValue({
      conversation: {
        id: CONVERSATION_ID,
        pause_until: "2026-01-01T11:00:00Z",
      },
    });

    const { result } = renderHook(() => usePauseAdrian(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ conversationId: CONVERSATION_ID });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchClient).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ body: JSON.stringify({ reason: null }) }),
    );
  });

  it("invalidates conversation detail and list on settle", async () => {
    vi.mocked(fetchClient).mockResolvedValue({
      conversation: { id: CONVERSATION_ID },
    });

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => usePauseAdrian(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ conversationId: CONVERSATION_ID, reason: null });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["adrian", "inbox", "conversation", CONVERSATION_ID],
      }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["adrian", "inbox", "conversations"] }),
    );
  });
});
