/**
 * comunifyFetch — tenant-aware fetch wrapper for Comunify React Query hooks.
 *
 * Injects:
 * - Authorization: Bearer <token>
 * - X-Tenant-ID: <tenantId>
 * - Content-Type: application/json
 *
 * Per .claude/rules/tenant-isolation.md — NEVER hardcode tenantId.
 */

export class ApiError extends Error {
  status: number;
  statusText: string;
  body: unknown;

  constructor(response: Response, body?: unknown) {
    super(`API error ${response.status}: ${response.statusText}`);
    this.name = "ApiError";
    this.status = response.status;
    this.statusText = response.statusText;
    this.body = body;
  }
}

export interface ComunifyFetchOptions extends Omit<RequestInit, "headers"> {
  token: string;
  tenantId: string;
  headers?: Record<string, string>;
}

export async function comunifyFetch<T>(
  url: string,
  options: ComunifyFetchOptions
): Promise<T> {
  const { token, tenantId, headers: customHeaders, ...rest } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(url, {
      ...rest,
      signal: rest.signal ?? controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...customHeaders,
        Authorization: `Bearer ${token}`,
        "X-Tenant-ID": tenantId,
      },
    });

    if (!response.ok) {
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        // ignore
      }
      throw new ApiError(response, body);
    }

    // 204 No Content — return void-safe empty
    if (response.status === 204) {
      return undefined as unknown as T;
    }

    return response.json() as Promise<T>;
  } finally {
    clearTimeout(timeoutId);
  }
}
