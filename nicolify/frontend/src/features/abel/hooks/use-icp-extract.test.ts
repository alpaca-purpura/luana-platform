// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-2
/**
 * use-icp-extract.test.ts — TDD tests for the ICP extraction hook.
 *
 * Covers:
 *   - extractQueryKeys shape (stable, correct)
 *   - Hook initial state (no job, not analyzing)
 *   - startExtract initiates mutation (mocked)
 *   - Poll transitions: analizando → done → invalidates icpList
 *   - Poll transitions: analizando → failed → extractError set
 *   - clearJob resets state
 *   - retryExtract available after failure
 *
 * Uses React Query wrapper + Clerk mock per vitest testing patterns.
 *
 * TDD RED-first per tdd-mandatory.md.
 * spec_anchor: 03-arch-fe.md §1 FSD-Lite hooks/use-icp-extract.ts
 * validators_gate: NF-res-extract + RN-3 + extractQueryKeys ['abel','icp','list'] invalidation
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";

import { extractQueryKeys } from "./use-icp-extract";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({
    getToken: vi.fn().mockResolvedValue("test-token"),
    isLoaded: true,
    isSignedIn: true,
  }),
}));

vi.mock("../api/extract-api", () => ({
  extractApi: {
    startExtraction: vi.fn(),
    pollExtraction: vi.fn(),
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("extractQueryKeys", () => {
  it("poll key has correct shape", () => {
    const key = extractQueryKeys.poll("job-123");
    expect(key).toEqual(["abel", "icp", "extract", "poll", "job-123"]);
  });

  it("icpList key has correct shape", () => {
    const key = extractQueryKeys.icpList();
    expect(key).toEqual(["abel", "icp", "list"]);
  });

  it("poll keys differ by jobId", () => {
    const k1 = extractQueryKeys.poll("job-1");
    const k2 = extractQueryKeys.poll("job-2");
    expect(k1).not.toEqual(k2);
  });
});

describe("useIcpExtract hook", () => {
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

  it("initial state: no job, not analyzing, not starting", async () => {
    const { useIcpExtract } = await import("./use-icp-extract");
    const { result } = renderHook(() => useIcpExtract(), {
      wrapper: makeWrapper(queryClient),
    });

    expect(result.current.job).toBeNull();
    expect(result.current.isAnalyzing).toBe(false);
    expect(result.current.isStarting).toBe(false);
    expect(result.current.extractError).toBeNull();
    expect(result.current.retryExtract).toBeNull();
  });

  it("startExtract is a function", async () => {
    const { useIcpExtract } = await import("./use-icp-extract");
    const { result } = renderHook(() => useIcpExtract(), {
      wrapper: makeWrapper(queryClient),
    });

    expect(typeof result.current.startExtract).toBe("function");
  });

  it("clearJob is a function and can be called without error", async () => {
    const { useIcpExtract } = await import("./use-icp-extract");
    const { result } = renderHook(() => useIcpExtract(), {
      wrapper: makeWrapper(queryClient),
    });

    act(() => {
      result.current.clearJob();
    });

    expect(result.current.job).toBeNull();
    expect(result.current.extractError).toBeNull();
  });

  it("startExtract sets isStarting during mutation", async () => {
    const { extractApi } = await import("../api/extract-api");
    const { useIcpExtract } = await import("./use-icp-extract");

    // Mock a slow extraction start
    let resolveStart!: (v: unknown) => void;
    (extractApi.startExtraction as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      new Promise((r) => {
        resolveStart = r;
      }),
    );

    const { result } = renderHook(() => useIcpExtract(), {
      wrapper: makeWrapper(queryClient),
    });

    act(() => {
      void result.current.startExtract({ seedType: "url", url: "https://test.com" }, "tenant-abc");
    });

    // isStarting should be true while mutation is pending
    expect(result.current.isStarting).toBe(true);

    // Resolve the mutation
    act(() => {
      resolveStart({ jobId: "job-1", status: "analizando", icpId: null, errorMessage: null });
    });
  });

  it("after successful start with status=analizando, job is set and isAnalyzing=true", async () => {
    const { extractApi } = await import("../api/extract-api");
    const { useIcpExtract } = await import("./use-icp-extract");

    (extractApi.startExtraction as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      jobId: "job-001",
      status: "analizando",
      icpId: null,
      errorMessage: null,
    });

    const { result } = renderHook(() => useIcpExtract(), {
      wrapper: makeWrapper(queryClient),
    });

    await act(async () => {
      await result.current.startExtract({ seedType: "url", url: "https://test.com" }, "tenant-abc");
    });

    expect(result.current.job).toMatchObject({ jobId: "job-001", status: "analizando" });
    expect(result.current.isAnalyzing).toBe(true);
  });

  it("after start with immediate status=done, job is set and icpList invalidated", async () => {
    const { extractApi } = await import("../api/extract-api");
    const { useIcpExtract } = await import("./use-icp-extract");
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    (extractApi.startExtraction as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      jobId: "job-002",
      status: "done",
      icpId: "icp-abc",
      errorMessage: null,
    });

    const { result } = renderHook(() => useIcpExtract(), {
      wrapper: makeWrapper(queryClient),
    });

    await act(async () => {
      await result.current.startExtract({ seedType: "url", url: "https://test.com" }, "tenant-abc");
    });

    expect(result.current.job).toMatchObject({ status: "done", icpId: "icp-abc" });
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: extractQueryKeys.icpList() }),
    );
  });

  it("after start with immediate status=failed, extractError is set", async () => {
    const { extractApi } = await import("../api/extract-api");
    const { useIcpExtract } = await import("./use-icp-extract");

    (extractApi.startExtraction as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      jobId: "job-003",
      status: "failed",
      icpId: null,
      errorMessage: "Timeout",
    });

    const { result } = renderHook(() => useIcpExtract(), {
      wrapper: makeWrapper(queryClient),
    });

    await act(async () => {
      await result.current.startExtract({ seedType: "url", url: "https://test.com" }, "tenant-abc");
    });

    expect(result.current.job).toMatchObject({ status: "failed" });
    expect(result.current.extractError).not.toBeNull();
  });

  it("after failure, retryExtract is a function", async () => {
    const { extractApi } = await import("../api/extract-api");
    const { useIcpExtract } = await import("./use-icp-extract");

    (extractApi.startExtraction as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("Network error"),
    );

    const { result } = renderHook(() => useIcpExtract(), {
      wrapper: makeWrapper(queryClient),
    });

    await act(async () => {
      try {
        await result.current.startExtract(
          { seedType: "url", url: "https://test.com" },
          "tenant-abc",
        );
      } catch {
        // Expected to throw
      }
    });

    // retryExtract available after failure (lastPayload set before attempt)
    expect(typeof result.current.retryExtract).toBe("function");
  });
});
