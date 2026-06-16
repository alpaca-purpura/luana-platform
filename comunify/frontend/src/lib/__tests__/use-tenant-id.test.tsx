// cap: iam.luana-core-adoption
// story-origin: comunify-shell-organism
/**
 * use-tenant-id.test.tsx — verifies useTenantId resolves tenant_id from
 * user.publicMetadata (NOT Clerk org). Mirrors vitalia post no-clerk-org fix.
 *
 * The mock provides ONLY useUser. If useTenantId imported useOrganization /
 * useAuth for orgId, those calls would be undefined → the hook would throw —
 * which is exactly the regression this guards against.
 */
import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUseUser = vi.fn();
vi.mock("@clerk/nextjs", () => ({ useUser: () => mockUseUser() }));

import { useTenantId } from "../use-tenant-id";

const tenantId = "e69a691d-070e-5caf-a053-6e74642ec100";

describe("useTenantId", () => {
  beforeEach(() => mockUseUser.mockReset());

  it("returns tenant_id from user.publicMetadata", () => {
    mockUseUser.mockReturnValue({ user: { publicMetadata: { tenant_id: tenantId } }, isLoaded: true });
    expect(renderHook(() => useTenantId()).result.current).toBe(tenantId);
  });

  it("returns null when tenant_id absent", () => {
    mockUseUser.mockReturnValue({ user: { publicMetadata: {} }, isLoaded: true });
    expect(renderHook(() => useTenantId()).result.current).toBeNull();
  });

  it("returns null when tenant_id empty or wrong type", () => {
    mockUseUser.mockReturnValue({ user: { publicMetadata: { tenant_id: "" } }, isLoaded: true });
    expect(renderHook(() => useTenantId()).result.current).toBeNull();
    mockUseUser.mockReturnValue({ user: { publicMetadata: { tenant_id: 42 } }, isLoaded: true });
    expect(renderHook(() => useTenantId()).result.current).toBeNull();
  });

  it("returns null while loading / not signed in", () => {
    mockUseUser.mockReturnValue({ user: null, isLoaded: false });
    expect(renderHook(() => useTenantId()).result.current).toBeNull();
    mockUseUser.mockReturnValue({ user: null, isLoaded: true });
    expect(renderHook(() => useTenantId()).result.current).toBeNull();
  });

  it("never returns a Clerk org id format (org_xxx) and uses only useUser", () => {
    mockUseUser.mockReturnValue({ user: { publicMetadata: { tenant_id: tenantId } }, isLoaded: true });
    const { result } = renderHook(() => useTenantId());
    expect(result.current).not.toMatch(/^org_/);
    expect(mockUseUser).toHaveBeenCalled();
  });
});
