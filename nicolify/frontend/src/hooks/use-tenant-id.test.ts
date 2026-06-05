/**
 * use-tenant-id.test.ts — unit tests for useTenantId hook.
 *
 * Covers:
 *   - Returns "" while Clerk is loading (isLoaded=false)
 *   - Returns "" when user is null
 *   - Returns publicMetadata.tenant_id UUID when loaded
 *   - Returns "" when publicMetadata has no tenant_id
 *   - NEVER returns orgId
 *   - Source scan: does NOT use useParams or orgId
 *
 * TDD RED-first per tdd-mandatory.md.
 * Regression gate: DoD #37 systemic tenant-id bug (2026-06-04).
 */

import { readFileSync } from "fs";
import { resolve } from "path";

import { describe, it, expect, vi, beforeEach } from "vitest";

const HOOK_PATH = resolve(__dirname, "./use-tenant-id.ts");

// ── Source scan: NEVER orgId, NEVER useParams ─────────────────────────────────

describe("useTenantId source scan — tenant isolation", () => {
  it("does NOT import useParams (comments explaining prohibition are OK)", () => {
    const src = readFileSync(HOOK_PATH, "utf-8");
    // Comments that say "NEVER useParams" are documentation — check no import
    expect(src).not.toMatch(/import\s*\{[^}]*useParams[^}]*\}\s*from/);
  });

  it("does NOT use orgId as a variable (comments OK)", () => {
    const src = readFileSync(HOOK_PATH, "utf-8");
    // orgId should not appear in code — only in comments explaining the prohibition
    // Check no runtime usage of orgId (not in expressions or assignments)
    expect(src).not.toMatch(/\bconst\s+\w*orgId\b/);
    expect(src).not.toMatch(/\.orgId\b/);
    expect(src).not.toContain("useOrganization");
  });

  it("does NOT import useAuth (uses useUser instead for publicMetadata)", () => {
    const src = readFileSync(HOOK_PATH, "utf-8");
    // useAuth doesn't expose publicMetadata — we use useUser instead
    // Check that useAuth is not IMPORTED (comments mentioning it are OK)
    expect(src).not.toMatch(/import\s*\{[^}]*useAuth[^}]*\}\s*from/);
  });

  it("imports useUser from @clerk/nextjs", () => {
    const src = readFileSync(HOOK_PATH, "utf-8");
    expect(src).toContain("useUser");
    expect(src).toContain("@clerk/nextjs");
  });

  it("reads tenant_id from publicMetadata", () => {
    const src = readFileSync(HOOK_PATH, "utf-8");
    expect(src).toContain("publicMetadata");
    expect(src).toContain("tenant_id");
  });

  it("returns empty string when not loaded (loading guard)", () => {
    const src = readFileSync(HOOK_PATH, "utf-8");
    // Should return "" on not-loaded path
    expect(src).toContain('return ""');
    // isLoaded guard should be present
    expect(src).toContain("isLoaded");
  });

  it("has no hardcoded USD or currency", () => {
    const src = readFileSync(HOOK_PATH, "utf-8");
    expect(src).not.toMatch(/'USD'/);
    expect(src).not.toMatch(/"USD"/);
  });
});

// ── Behavioural: mock useUser + renderHook ────────────────────────────────────

vi.mock("@clerk/nextjs", () => ({
  useUser: vi.fn(),
}));

import { renderHook } from "@testing-library/react";
import { useUser } from "@clerk/nextjs";

import { useTenantId } from "./use-tenant-id";

beforeEach(() => {
  vi.clearAllMocks();
});

// Helper to create typed mock return values
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeUseUserReturn(value: Record<string, unknown>): any {
  return value;
}

describe("useTenantId — behavioural", () => {
  it("returns '' when Clerk is not loaded (isLoaded=false)", () => {
    vi.mocked(useUser).mockReturnValue(
      makeUseUserReturn({ isLoaded: false, user: null, isSignedIn: false }),
    );
    const { result } = renderHook(() => useTenantId());
    expect(result.current).toBe("");
  });

  it("returns '' when user is null (signed out)", () => {
    vi.mocked(useUser).mockReturnValue(
      makeUseUserReturn({ isLoaded: true, user: null, isSignedIn: false }),
    );
    const { result } = renderHook(() => useTenantId());
    expect(result.current).toBe("");
  });

  it("returns the UUID from publicMetadata.tenant_id when loaded", () => {
    const uuid = "e4373552-f70f-58e0-b2bf-55425cc3259f";
    vi.mocked(useUser).mockReturnValue(
      makeUseUserReturn({
        isLoaded: true,
        isSignedIn: true,
        user: {
          publicMetadata: { tenant_id: uuid, tenant_slug: "alpaca-purpura", role: "owner" },
        },
      }),
    );
    const { result } = renderHook(() => useTenantId());
    expect(result.current).toBe(uuid);
  });

  it("returns '' when publicMetadata has no tenant_id", () => {
    vi.mocked(useUser).mockReturnValue(
      makeUseUserReturn({
        isLoaded: true,
        isSignedIn: true,
        user: { publicMetadata: { tenant_slug: "alpaca-purpura", role: "owner" } },
      }),
    );
    const { result } = renderHook(() => useTenantId());
    expect(result.current).toBe("");
  });

  it("returns '' when tenant_id is an empty string", () => {
    vi.mocked(useUser).mockReturnValue(
      makeUseUserReturn({
        isLoaded: true,
        isSignedIn: true,
        user: { publicMetadata: { tenant_id: "", tenant_slug: "alpaca-purpura" } },
      }),
    );
    const { result } = renderHook(() => useTenantId());
    expect(result.current).toBe("");
  });

  it("returns '' when publicMetadata is empty object", () => {
    vi.mocked(useUser).mockReturnValue(
      makeUseUserReturn({
        isLoaded: true,
        isSignedIn: true,
        user: { publicMetadata: {} },
      }),
    );
    const { result } = renderHook(() => useTenantId());
    expect(result.current).toBe("");
  });

  it("does NOT return the slug — only the UUID", () => {
    const slug = "alpaca-purpura";
    const uuid = "e4373552-f70f-58e0-b2bf-55425cc3259f";
    vi.mocked(useUser).mockReturnValue(
      makeUseUserReturn({
        isLoaded: true,
        isSignedIn: true,
        user: { publicMetadata: { tenant_id: uuid, tenant_slug: slug } },
      }),
    );
    const { result } = renderHook(() => useTenantId());
    expect(result.current).toBe(uuid);
    expect(result.current).not.toBe(slug);
  });
});
