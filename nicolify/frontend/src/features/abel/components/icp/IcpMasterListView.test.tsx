// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-3
/**
 * IcpMasterListView.test.tsx — TDD tests for IcpMasterListView.
 *
 * Covers:
 *   - Empty state (0 ICPs) → renders DraftFirstStarter (RN-2)
 *   - "generar" path → calls setIntakeOverlayOpen(true)
 *   - "Empezar en blanco" path → calls createIcp.mutateAsync({label:"Nuevo ICP"})
 *     and navigates to /{tenantId}/abel/icp/{newId}/datos (NOT /nuevo) — BUG FIX
 *   - "Empezar en blanco" error path → shows toast error (no nav)
 *   - Loading state → shows skeleton (aria-busy)
 *   - Error state → shows error banner with retry
 *   - List state (≥1 ICP) → shows grid of IcpCards
 *   - SC-large: 200 ICPs renders without crash
 *   - fetchClient X-Tenant-ID from useParams (NEVER orgId)
 *
 * TDD RED-first per tdd-mandatory.md.
 * spec_anchor: 03-arch-fe.md §2 Client root + data layer + §7 Estados visuales
 * validators_gate: RN-2 (draft-first) + SC-empty + SC-large
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { readFileSync } from "fs";
import { resolve } from "path";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRouterPush = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ tenantId: "tenant-test" }),
  useRouter: () => ({ push: mockRouterPush }),
  usePathname: () => "/tenant-test/abel/icp",
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({
    getToken: vi.fn().mockResolvedValue("test-token"),
    isLoaded: true,
    isSignedIn: true,
  }),
}));

// Mock the ICP query hook
const mockUseIcps = vi.fn();
vi.mock("../../hooks/use-icps", () => ({
  useIcps: () => mockUseIcps(),
  icpQueryKeys: {
    list: () => ["abel", "icp", "list"],
    detail: (id: string) => ["abel", "icp", id],
  },
}));

// Mock useCreateIcp mutation hook
const mockMutateAsync = vi.fn();
vi.mock("../../hooks/use-icp-mutations", () => ({
  useCreateIcp: () => ({ mutateAsync: mockMutateAsync }),
  usePatchIcp: () => ({ mutateAsync: vi.fn() }),
  useMarkReadyIcp: () => ({ mutateAsync: vi.fn() }),
  useDeleteIcp: () => ({ mutateAsync: vi.fn() }),
}));

// Mock the abel-ui-store
const mockSetIntakeOverlayOpen = vi.fn();
vi.mock("../../store/abel-ui-store", () => ({
  useAbelUiStore: (
    selector: (s: { setIntakeOverlayOpen: typeof mockSetIntakeOverlayOpen }) => unknown,
  ) => selector({ setIntakeOverlayOpen: mockSetIntakeOverlayOpen }),
  ABEL_UI_STORAGE_KEY: "nicolify-abel-ui-state",
}));

// Mock IcpIntakeOverlay — the overlay is tested in its own unit test.
// IcpMasterListView unit tests scope to the list view behavior only.
// The overlay integration is covered by E2E (Journey 5: intake modal open).
vi.mock("./IcpIntakeOverlay", () => ({
  IcpIntakeOverlay: () => null,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

import { IcpMasterListView } from "./IcpMasterListView";
import type { IcpListItem } from "../../types/icp";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const sampleIcps: IcpListItem[] = [
  {
    id: "icp-1",
    label: "Agencias mid-market",
    vertical: "Marketing",
    status: "borrador",
    buyerCount: 2,
  },
  { id: "icp-2", label: "Consultoras software", vertical: null, status: "listo", buyerCount: 0 },
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("IcpMasterListView — empty state (0 ICPs)", () => {
  beforeEach(() => {
    mockSetIntakeOverlayOpen.mockClear();
    mockRouterPush.mockClear();
    mockMutateAsync.mockClear();
    mockUseIcps.mockReturnValue({ data: [], isLoading: false, error: null, refetch: vi.fn() });
  });

  it("renders DraftFirstStarter when 0 ICPs (RN-2 draft-first)", () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<IcpMasterListView />, { wrapper: makeWrapper(qc) });
    expect(screen.getByTestId("draft-first-starter")).toBeDefined();
  });

  it("does NOT show icp-card-grid when empty", () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<IcpMasterListView />, { wrapper: makeWrapper(qc) });
    expect(screen.queryByTestId("icp-card-grid")).toBeNull();
  });
});

describe("IcpMasterListView — 'generar' path (UniversalIntake)", () => {
  beforeEach(() => {
    mockSetIntakeOverlayOpen.mockClear();
    mockRouterPush.mockClear();
    mockMutateAsync.mockClear();
    mockUseIcps.mockReturnValue({ data: [], isLoading: false, error: null, refetch: vi.fn() });
  });

  it("calls setIntakeOverlayOpen(true) when 'Abel te arma un borrador' is clicked", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const user = userEvent.setup();
    render(<IcpMasterListView />, { wrapper: makeWrapper(qc) });
    const generateBtn = screen.getByTestId("draft-first-generate-btn");
    await user.click(generateBtn);
    expect(mockSetIntakeOverlayOpen).toHaveBeenCalledWith(true);
  });
});

describe("IcpMasterListView — 'Empezar en blanco' path (create + navigate fix)", () => {
  beforeEach(() => {
    mockSetIntakeOverlayOpen.mockClear();
    mockRouterPush.mockClear();
    mockMutateAsync.mockClear();
    mockUseIcps.mockReturnValue({ data: [], isLoading: false, error: null, refetch: vi.fn() });
  });

  it("calls createIcp.mutateAsync with {label:'Nuevo ICP'} when 'Empezar en blanco' is clicked", async () => {
    mockMutateAsync.mockResolvedValue({ id: "new-icp-uuid-123", label: "Nuevo ICP" });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const user = userEvent.setup();
    render(<IcpMasterListView />, { wrapper: makeWrapper(qc) });
    const blankBtn = screen.getByTestId("draft-first-blank-btn");
    await user.click(blankBtn);
    expect(mockMutateAsync).toHaveBeenCalledWith({ label: "Nuevo ICP" });
  });

  it("navigates to /{tenantId}/abel/icp/{newId}/datos on success — NOT to a /nuevo literal", async () => {
    const newId = "new-icp-uuid-123";
    mockMutateAsync.mockResolvedValue({ id: newId, label: "Nuevo ICP" });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const user = userEvent.setup();
    render(<IcpMasterListView />, { wrapper: makeWrapper(qc) });
    const blankBtn = screen.getByTestId("draft-first-blank-btn");
    await user.click(blankBtn);
    // Success: must navigate to /datos leaf
    expect(mockRouterPush).toHaveBeenCalledWith(`/tenant-test/abel/icp/${newId}/datos`);
    // Must NOT navigate to the dead literal /nuevo route
    const pushedArgs = mockRouterPush.mock.calls.map((c: string[]) => c[0]);
    expect(pushedArgs.some((url: string) => url.endsWith("/nuevo"))).toBe(false);
  });

  it("shows toast error and does NOT navigate when createIcp fails", async () => {
    const { toast } = await import("sonner");
    mockMutateAsync.mockRejectedValue(new Error("Network error"));
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const user = userEvent.setup();
    render(<IcpMasterListView />, { wrapper: makeWrapper(qc) });
    const blankBtn = screen.getByTestId("draft-first-blank-btn");
    await user.click(blankBtn);
    expect(toast.error).toHaveBeenCalledWith("No se pudo crear. Intenta de nuevo.");
    expect(mockRouterPush).not.toHaveBeenCalled();
  });
});

describe("IcpMasterListView — loading state", () => {
  beforeEach(() => {
    mockUseIcps.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });
  });

  it("shows loading skeleton with aria-busy", () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<IcpMasterListView />, { wrapper: makeWrapper(qc) });
    const loadingEl = screen.getByTestId("icp-master-loading");
    expect(loadingEl.getAttribute("aria-busy")).toBe("true");
  });

  it("does NOT show DraftFirstStarter while loading", () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<IcpMasterListView />, { wrapper: makeWrapper(qc) });
    expect(screen.queryByTestId("draft-first-starter")).toBeNull();
  });
});

describe("IcpMasterListView — error state", () => {
  beforeEach(() => {
    mockUseIcps.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Network error"),
      refetch: vi.fn(),
    });
  });

  it("shows error banner with role='alert'", () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<IcpMasterListView />, { wrapper: makeWrapper(qc) });
    const errorEl = screen.getByTestId("icp-master-error");
    expect(errorEl.getAttribute("role")).toBe("alert");
  });

  it("shows retry option in error state", () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<IcpMasterListView />, { wrapper: makeWrapper(qc) });
    expect(screen.getByText("Reintentar")).toBeDefined();
  });
});

describe("IcpMasterListView — list state (≥1 ICP)", () => {
  beforeEach(() => {
    mockUseIcps.mockReturnValue({
      data: sampleIcps,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it("renders icp-card-grid when ≥1 ICP", () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<IcpMasterListView />, { wrapper: makeWrapper(qc) });
    expect(screen.getByTestId("icp-card-grid")).toBeDefined();
  });

  it("does NOT show DraftFirstStarter when ICPs exist", () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<IcpMasterListView />, { wrapper: makeWrapper(qc) });
    expect(screen.queryByTestId("draft-first-starter")).toBeNull();
  });

  it("shows both ICP cards", () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<IcpMasterListView />, { wrapper: makeWrapper(qc) });
    expect(screen.getByTestId("icp-card-icp-1")).toBeDefined();
    expect(screen.getByTestId("icp-card-icp-2")).toBeDefined();
  });

  it("shows the count header", () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<IcpMasterListView />, { wrapper: makeWrapper(qc) });
    expect(screen.getByText("2 perfiles")).toBeDefined();
  });
});

describe("IcpMasterListView — SC-large (200 ICPs)", () => {
  it("renders 200 ICPs without crashing", () => {
    const largeList: IcpListItem[] = Array.from({ length: 200 }, (_, i) => ({
      id: `icp-${i}`,
      label: `ICP ${i}`,
      vertical: null,
      status: "borrador" as const,
      buyerCount: 0,
    }));
    mockUseIcps.mockReturnValue({
      data: largeList,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    expect(() => {
      render(<IcpMasterListView />, { wrapper: makeWrapper(qc) });
    }).not.toThrow();

    // All 200 cards rendered
    expect(screen.getByTestId("icp-card-grid").children.length).toBe(200);
  });
});

describe("IcpMasterListView — fetchClient tenant isolation", () => {
  const COMPONENT_PATH = resolve(__dirname, "./IcpMasterListView.tsx");

  it("does NOT use orgId as tenantId (source scan)", () => {
    const src = readFileSync(COMPONENT_PATH, "utf-8");
    expect(src).not.toContain("orgId");
    expect(src).not.toContain("useOrganization");
  });

  it("uses useParams() for tenantId (source scan)", () => {
    const src = readFileSync(COMPONENT_PATH, "utf-8");
    expect(src).toContain("useParams");
    expect(src).toContain("tenantId");
  });
});

describe("IcpMasterListView — source scan: no dead /nuevo literal route", () => {
  const COMPONENT_PATH = resolve(__dirname, "./IcpMasterListView.tsx");

  it("does NOT contain the dead /nuevo literal route (regression guard)", () => {
    const src = readFileSync(COMPONENT_PATH, "utf-8");
    // The fix replaces the dead literal with create-then-navigate
    expect(src).not.toContain('"/nuevo"');
    expect(src).not.toContain("`/${tenantId}/abel/icp/nuevo`");
  });

  it("navigates via created.id (source scan)", () => {
    const src = readFileSync(COMPONENT_PATH, "utf-8");
    // Must use the created ICP id in the navigation path
    expect(src).toContain("created.id");
    expect(src).toContain("/datos");
  });
});
