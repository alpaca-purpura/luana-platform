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
 *
 * SSR-AWARE URL RESOLUTION (audit iter 6 — BUG-1b):
 * Node.js `fetch` (used by Next.js Server Components) CANNOT parse relative URLs.
 * In the browser, Next.js rewrites proxy `/api/v1/*` → `INTERNAL_API_URL/api/v1/*`
 * transparently. On the server, that proxy doesn't apply to direct `fetch()` calls.
 *
 * Resolution: when running server-side (typeof window === "undefined") and the
 * path is relative (starts with "/"), this wrapper prefixes INTERNAL_API_URL.
 * If INTERNAL_API_URL is unset on the server, it throws immediately with a clear
 * diagnostic (misconfiguration) rather than building an unparseable URL.
 *
 * Browser behavior is UNCHANGED — relative paths still work via Next.js proxy.
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
 * Resolves a (possibly relative) URL to an absolute URL safe for both
 * server-side (Node.js fetch) and browser (Next.js proxy) environments.
 *
 * - Browser: returns the URL unchanged (Next.js rewrites handle `/api/v1/*`).
 * - Server, absolute URL: returns unchanged.
 * - Server, relative URL (starts with "/"): prefixes INTERNAL_API_URL.
 *   Throws if INTERNAL_API_URL is unset (misconfiguration, not a runtime error).
 *
 * @internal — exported for testing only; callers use fetchClient directly.
 */
export function resolveUrl(url: string): string {
  // Browser: Next.js proxy handles relative → absolute transparently.
  if (typeof window !== "undefined") {
    return url;
  }

  // Server + absolute URL: pass through unchanged.
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // Server + relative URL: must prefix the internal base URL.
  const base = process.env.INTERNAL_API_URL;
  if (!base) {
    throw new Error(
      `[fetchClient] INTERNAL_API_URL is not set. ` +
        `Cannot resolve relative URL "${url}" in a Server Component. ` +
        `Set INTERNAL_API_URL (e.g. http://nicolify_backend_dev:8001) in the environment.`,
    );
  }

  // Strip trailing slash from base to avoid double-slash.
  return `${base.replace(/\/$/, "")}${url}`;
}

/**
 * Tenant-aware fetch wrapper for Nicolify.
 *
 * @throws ApiError on non-2xx response
 */
export async function fetchClient<T>(url: string, options: FetchClientOptions): Promise<T> {
  const { token, tenantId, headers: customHeaders, timeoutMs = 30000, ...rest } = options;

  // Resolve relative URLs to absolute on the server (BUG-1b fix — audit iter 6).
  const resolvedUrl = resolveUrl(url);

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
    response = await fetch(resolvedUrl, {
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
