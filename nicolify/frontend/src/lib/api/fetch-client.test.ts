/**
 * Tests for fetch-client.ts — specifically the SSR-aware URL resolution
 * introduced in audit iteration 6 (BUG-1b).
 *
 * resolveUrl() must:
 *   - Browser: return the URL unchanged (typeof window !== "undefined").
 *   - Server + absolute URL: return unchanged.
 *   - Server + relative URL + INTERNAL_API_URL set: return prefixed absolute URL.
 *   - Server + relative URL + INTERNAL_API_URL unset: throw clear Error.
 *
 * NOTE on "typeof window" mocking strategy:
 *   Vitest (happy-dom) sets window as a global by default, so typeof window is
 *   "object" in all tests unless we delete it. We control the "browser vs server"
 *   distinction by deleting/restoring `globalThis.window` in beforeEach/afterEach.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { resolveUrl } from "./fetch-client";

// Store the original window reference so we can restore it after server-mode tests.
const originalWindow = globalThis.window;

function simulateServer() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (globalThis as any).window;
}

function simulateBrowser() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).window = originalWindow ?? {};
}

describe("resolveUrl — browser mode (typeof window !== 'undefined')", () => {
  beforeEach(() => {
    simulateBrowser();
  });

  it("returns relative URL unchanged (Next.js proxy handles it)", () => {
    expect(resolveUrl("/api/v1/abel/icp")).toBe("/api/v1/abel/icp");
  });

  it("returns relative URL with path params unchanged", () => {
    expect(resolveUrl("/api/v1/abel/icp/some-uuid-here")).toBe("/api/v1/abel/icp/some-uuid-here");
  });

  it("returns absolute http URL unchanged", () => {
    expect(resolveUrl("http://example.com/api/v1/test")).toBe("http://example.com/api/v1/test");
  });

  it("returns absolute https URL unchanged", () => {
    expect(resolveUrl("https://example.com/api/v1/test")).toBe("https://example.com/api/v1/test");
  });
});

describe("resolveUrl — server mode (typeof window === 'undefined')", () => {
  const originalEnv = process.env.INTERNAL_API_URL;

  beforeEach(() => {
    simulateServer();
  });

  afterEach(() => {
    simulateBrowser();
    // Restore env
    if (originalEnv !== undefined) {
      process.env.INTERNAL_API_URL = originalEnv;
    } else {
      delete process.env.INTERNAL_API_URL;
    }
  });

  describe("with INTERNAL_API_URL set", () => {
    beforeEach(() => {
      process.env.INTERNAL_API_URL = "http://nicolify_backend_dev:8001";
    });

    it("prefixes relative URL with INTERNAL_API_URL", () => {
      expect(resolveUrl("/api/v1/abel/icp")).toBe(
        "http://nicolify_backend_dev:8001/api/v1/abel/icp",
      );
    });

    it("prefixes relative URL with path params", () => {
      const uuid = "7f464ab7-0000-0000-0000-000000000001";
      expect(resolveUrl(`/api/v1/abel/icp/${uuid}`)).toBe(
        `http://nicolify_backend_dev:8001/api/v1/abel/icp/${uuid}`,
      );
    });

    it("strips trailing slash from INTERNAL_API_URL before joining", () => {
      process.env.INTERNAL_API_URL = "http://nicolify_backend_dev:8001/";
      expect(resolveUrl("/api/v1/abel/icp")).toBe(
        "http://nicolify_backend_dev:8001/api/v1/abel/icp",
      );
    });

    it("returns absolute http URL unchanged (no double-prefix)", () => {
      expect(resolveUrl("http://other-host:8001/api/v1/something")).toBe(
        "http://other-host:8001/api/v1/something",
      );
    });

    it("returns absolute https URL unchanged (no double-prefix)", () => {
      expect(resolveUrl("https://api.example.com/v1/test")).toBe("https://api.example.com/v1/test");
    });
  });

  describe("with INTERNAL_API_URL unset", () => {
    beforeEach(() => {
      delete process.env.INTERNAL_API_URL;
    });

    it("throws a clear Error for relative URL (misconfiguration)", () => {
      expect(() => resolveUrl("/api/v1/abel/icp")).toThrowError(/INTERNAL_API_URL is not set/);
    });

    it("includes the offending relative URL in the error message", () => {
      const path = "/api/v1/abel/icp/some-uuid";
      expect(() => resolveUrl(path)).toThrowError(path);
    });

    it("does NOT throw for absolute http URL (env not needed)", () => {
      expect(() => resolveUrl("http://host:8001/api/v1/test")).not.toThrow();
    });

    it("does NOT throw for absolute https URL (env not needed)", () => {
      expect(() => resolveUrl("https://host/api/v1/test")).not.toThrow();
    });
  });
});
