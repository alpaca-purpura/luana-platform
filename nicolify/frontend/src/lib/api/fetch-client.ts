/**
 * fetchClient — Nicolify tenant-aware fetch wrapper.
 *
 * Auto-injects per tenant isolation raíz (.claude/rules/tenant-isolation.md):
 *   - Authorization: Bearer <token>   (Clerk JWT)
 *   - X-Tenant-ID: <tenantId>          (from Clerk publicMetadata.tenant_id)
 *   - Content-Type: application/json
 *
 * NOTE: Does NOT inject X-Clinic-ID — PHI dual-filter is vitalia-only (AD-5).
 * Nicolify is B2B SaaS for agencies, not a health-compliance brand.
 *
 * Design: plain async function (NOT a React hook).
 * Caller pattern in React Query queryFn:
 *   1. useAuth() → getToken()
 *   2. useAuth() → sessionClaims.publicMetadata.tenant_id
 *   3. queryFn calls fetchClient({ token, tenantId })
 *
 * Per .claude/rules/tenant-isolation.md: EVERY request MUST include X-Tenant-ID.
 *
 * NEVER manually inject X-Tenant-ID in Client Components — this file handles it.
 *
 * Port of vitalia/frontend/src/lib/api/fetchClient.ts re-temizado para nicolify.
 * Ported in T-3 (nicolify-r0-dev-stack) following AD-5.
 */

/**
 *
 */
export class ApiError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly body: unknown;

  constructor(response: Response, body?: unknown) {
    super(`API error ${response.status}: ${response.statusText}`);
    this.name = "ApiError";
    this.status = response.status;
    this.statusText = response.statusText;
    this.body = body;
  }
}

export interface FetchClientOptions extends Omit<RequestInit, "headers"> {
  /** Clerk JWT obtained via useAuth().getToken() */
  token: string;
  /** Tenant ID from Clerk publicMetadata.tenant_id (X-Tenant-ID header) */
  tenantId: string;
  /** Additional headers to merge */
  headers?: Record<string, string>;
  /** Abort signal timeout in ms (default: 30000) */
  timeoutMs?: number;
}

/**
 * Tenant-aware fetch wrapper for Nicolify.
 *
 * @throws ApiError on non-2xx response
 */
export async function fetchClient<T>(url: string, options: FetchClientOptions): Promise<T> {
  const { token, tenantId, headers: customHeaders, timeoutMs = 30000, ...rest } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const mergedHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...customHeaders,
    Authorization: `Bearer ${token}`,
    "X-Tenant-ID": tenantId,
  };

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: mergedHeaders,
      signal: rest.signal ?? controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    throw new ApiError(response, body);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json() as Promise<T>;
}
