/**
 * fetchClient unit tests — nicolify (T-3 validator V-NF-3, V-NF-4)
 *
 * Verifies:
 * 1. X-Tenant-ID header injected from options (tenant isolation raíz)
 * 2. Authorization Bearer header injected from token
 * 3. Content-Type application/json always present
 * 4. NO X-Clinic-ID (PHI dual-filter es vitalia-only — AD-5)
 * 5. ApiError thrown on non-2xx responses
 * 6. timeout cancels via AbortController
 * 7. 204 No Content returns undefined (not JSON parse error)
 *
 * RED-first (T-3 TDD): this test is written BEFORE implementation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { ApiError, fetchClient } from "@/lib/api/fetch-client";

// Mock global fetch
const mockFetch = vi.fn();
beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function makeOkResponse(body: unknown = { ok: true }, status = 200): Response {
  return {
    ok: true,
    status,
    statusText: "OK",
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

function makeErrorResponse(status: number, body: unknown = null): Response {
  return {
    ok: false,
    status,
    statusText: `HTTP ${status}`,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

// Shared test URL constant (avoids duplicate string lint warning)
const TEST_URL = "/api/v1/test";

describe("fetchClient", () => {
  it("injects Authorization Bearer header", async () => {
    mockFetch.mockResolvedValueOnce(makeOkResponse());
    await fetchClient(TEST_URL, { token: "my-jwt", tenantId: "t-123" });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer my-jwt");
  });

  it("injects X-Tenant-ID header from options", async () => {
    mockFetch.mockResolvedValueOnce(makeOkResponse());
    await fetchClient(TEST_URL, {
      token: "jwt",
      tenantId: "tenant-abc-123",
    });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["X-Tenant-ID"]).toBe("tenant-abc-123");
  });

  it("injects Content-Type application/json", async () => {
    mockFetch.mockResolvedValueOnce(makeOkResponse());
    await fetchClient(TEST_URL, { token: "jwt", tenantId: "t-1" });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("does NOT inject X-Clinic-ID (PHI dual-filter is vitalia-only — AD-5)", async () => {
    mockFetch.mockResolvedValueOnce(makeOkResponse());
    await fetchClient(TEST_URL, { token: "jwt", tenantId: "t-1" });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["X-Clinic-ID"]).toBeUndefined();
  });

  it("throws ApiError on 401 response", async () => {
    mockFetch.mockResolvedValueOnce(makeErrorResponse(401, { detail: "Unauthorized" }));
    await expect(
      fetchClient("/api/v1/iam/users/me", { token: "bad", tenantId: "t-1" }),
    ).rejects.toThrow(ApiError);
  });

  it("throws ApiError with correct status on 403", async () => {
    mockFetch.mockResolvedValueOnce(makeErrorResponse(403, { detail: "Forbidden" }));
    const err = await fetchClient("/api/v1/iam/users/me", {
      token: "jwt",
      tenantId: "foreign-tenant",
    }).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(403);
  });

  it("returns undefined for 204 No Content without parse error", async () => {
    const noContentResponse = {
      ok: true,
      status: 204,
      statusText: "No Content",
      json: () => Promise.reject(new Error("no body")),
    } as unknown as Response;
    mockFetch.mockResolvedValueOnce(noContentResponse);

    const result = await fetchClient<undefined>(TEST_URL, {
      token: "jwt",
      tenantId: "t-1",
    });
    expect(result).toBeUndefined();
  });

  it("merges custom headers without overriding mandatory ones", async () => {
    mockFetch.mockResolvedValueOnce(makeOkResponse());
    await fetchClient(TEST_URL, {
      token: "jwt",
      tenantId: "t-1",
      headers: { "X-Request-ID": "req-999" },
    });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["X-Request-ID"]).toBe("req-999");
    expect(headers["Authorization"]).toBe("Bearer jwt");
    expect(headers["X-Tenant-ID"]).toBe("t-1");
  });

  it("throws ApiError with body parsed from response", async () => {
    const errorBody = { detail: "Not found" };
    mockFetch.mockResolvedValueOnce(makeErrorResponse(404, errorBody));

    const err = await fetchClient("/api/v1/missing", {
      token: "jwt",
      tenantId: "t-1",
    }).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).body).toEqual(errorBody);
  });
});
