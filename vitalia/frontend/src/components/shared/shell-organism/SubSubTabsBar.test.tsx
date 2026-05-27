/**
 * SubSubTabsBar.test.tsx — SubSubTabsBar N3-static organism unit tests (T-4 TDD mandatory).
 *
 * Tests:
 * SC-1: renders nav role=tablist with sub-sub-tabs from AGENT_SUBSUBTABS[agent.subtab]
 * SC-2: click sub-sub-tab → router.push to /{tenant}/{agent}/{subtab}/{subsubtab}
 * SC-3: deep link → URL-derived active state correct (aria-selected + aria-current)
 * SC-4: agent.subtab without N3 entry → returns null (no nav rendered)
 * SC-5: N3 route active → correct sub-sub-tab has aria-selected=true
 * SC-6: roving tabindex (ArrowRight/ArrowLeft/Home/End + Enter/Space + circular wrap)
 * SC-7: onFocus updates focusedIdx
 * defensive: useParams.tenantId undefined → navigation cancelled
 *
 * T-4 vitalia-fase2-lisa-marca
 * spec_anchor: ADR-vitalia-004 v1.1 § 3.1.1 + 03-arch.md § T-4
 * downstream-regression-na: brand-local FE test; no cross-brand consumers
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SubSubTabsBar } from "./SubSubTabsBar";

// ──────────────────────────────────────────────────────────────────────────────
// next/navigation mocks
// ──────────────────────────────────────────────────────────────────────────────

const mockPush = vi.fn();
const mockPathname = vi.fn(() => "/tenant-x/lisa/marca/identidad" as string | null);
const mockParams = vi.fn(
  () => ({ tenantId: "tenant-x" }) as { tenantId?: string } | null,
);

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({ push: mockPush }),
  useParams: () => mockParams(),
}));

beforeEach(() => {
  mockPush.mockClear();
  mockPathname.mockReturnValue("/tenant-x/lisa/marca/identidad");
  mockParams.mockReturnValue({ tenantId: "tenant-x" });
});

// ──────────────────────────────────────────────────────────────────────────────
// SC-1 — renders nav role=tablist with 3 sub-sub-tabs for lisa.marca
// ──────────────────────────────────────────────────────────────────────────────

describe("SC-1: renders sub-sub-tabs for lisa.marca", () => {
  it("renders nav with role=tablist and data-testid=sub-sub-tabs-bar", () => {
    render(<SubSubTabsBar />);
    const nav = screen.getByRole("tablist");
    expect(nav).toBeTruthy();
    expect(nav.getAttribute("data-testid")).toBe("sub-sub-tabs-bar");
  });

  it("renders 3 sub-sub-tabs for lisa.marca (identidad, voz-y-tono, presencia)", () => {
    render(<SubSubTabsBar />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);
  });

  it("renders sub-sub-tab labels in Spanish neutro", () => {
    render(<SubSubTabsBar />);
    expect(screen.getByTestId("sub-sub-tab-identidad")).toBeTruthy();
    expect(screen.getByTestId("sub-sub-tab-voz-y-tono")).toBeTruthy();
    expect(screen.getByTestId("sub-sub-tab-presencia")).toBeTruthy();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SC-2 — click → router.push to /{tenant}/{agent}/{subtab}/{subsubtab}
// ──────────────────────────────────────────────────────────────────────────────

describe("SC-2: click sub-sub-tab navigates correctly", () => {
  it("click voz-y-tono tab → push /tenant-x/lisa/marca/voz-y-tono", () => {
    render(<SubSubTabsBar />);
    const vozTab = screen.getByTestId("sub-sub-tab-voz-y-tono");
    fireEvent.click(vozTab);
    expect(mockPush).toHaveBeenCalledWith("/tenant-x/lisa/marca/voz-y-tono");
  });

  it("click presencia tab → push /tenant-x/lisa/marca/presencia", () => {
    render(<SubSubTabsBar />);
    const presenciaTab = screen.getByTestId("sub-sub-tab-presencia");
    fireEvent.click(presenciaTab);
    expect(mockPush).toHaveBeenCalledWith("/tenant-x/lisa/marca/presencia");
  });

  it("click identidad tab → push /tenant-x/lisa/marca/identidad", () => {
    mockPathname.mockReturnValue("/tenant-x/lisa/marca/voz-y-tono");
    render(<SubSubTabsBar />);
    const identidadTab = screen.getByTestId("sub-sub-tab-identidad");
    fireEvent.click(identidadTab);
    expect(mockPush).toHaveBeenCalledWith("/tenant-x/lisa/marca/identidad");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SC-3 — deep link → URL-derived active state
// ──────────────────────────────────────────────────────────────────────────────

describe("SC-3: active state derived from URL", () => {
  it("identidad URL → identidad tab has aria-selected=true", () => {
    mockPathname.mockReturnValue("/tenant-x/lisa/marca/identidad");
    render(<SubSubTabsBar />);
    const identidadTab = screen.getByTestId("sub-sub-tab-identidad");
    expect(identidadTab.getAttribute("aria-selected")).toBe("true");
    expect(identidadTab.getAttribute("aria-current")).toBe("page");
  });

  it("voz-y-tono URL → voz-y-tono tab has aria-selected=true", () => {
    mockPathname.mockReturnValue("/tenant-x/lisa/marca/voz-y-tono");
    render(<SubSubTabsBar />);
    const vozTab = screen.getByTestId("sub-sub-tab-voz-y-tono");
    expect(vozTab.getAttribute("aria-selected")).toBe("true");
  });

  it("active tab: others have aria-selected=false", () => {
    mockPathname.mockReturnValue("/tenant-x/lisa/marca/identidad");
    render(<SubSubTabsBar />);
    const vozTab = screen.getByTestId("sub-sub-tab-voz-y-tono");
    const presenciaTab = screen.getByTestId("sub-sub-tab-presencia");
    expect(vozTab.getAttribute("aria-selected")).toBe("false");
    expect(presenciaTab.getAttribute("aria-selected")).toBe("false");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SC-4 — returns null when no N3 entry for agent.subtab
// ──────────────────────────────────────────────────────────────────────────────

describe("SC-4: returns null for non-N3 agent.subtab", () => {
  it("lisa.doctores (no N3) → no nav rendered", () => {
    mockPathname.mockReturnValue("/tenant-x/lisa/doctores");
    render(<SubSubTabsBar />);
    expect(screen.queryByTestId("sub-sub-tabs-bar")).toBeNull();
  });

  it("valeria.agenda (no N3) → no nav rendered", () => {
    mockPathname.mockReturnValue("/tenant-x/valeria/agenda");
    render(<SubSubTabsBar />);
    expect(screen.queryByTestId("sub-sub-tabs-bar")).toBeNull();
  });

  it("camila.voz (no N3) → no nav rendered", () => {
    mockPathname.mockReturnValue("/tenant-x/camila/voz");
    render(<SubSubTabsBar />);
    expect(screen.queryByTestId("sub-sub-tabs-bar")).toBeNull();
  });

  it("no agent in URL → no nav rendered", () => {
    mockPathname.mockReturnValue("/tenant-x");
    render(<SubSubTabsBar />);
    expect(screen.queryByTestId("sub-sub-tabs-bar")).toBeNull();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SC-6 — roving tabindex keyboard navigation
// ──────────────────────────────────────────────────────────────────────────────

describe("SC-6: roving tabindex keyboard navigation", () => {
  it("ArrowRight moves focus to next tab", () => {
    render(<SubSubTabsBar />);
    const nav = screen.getByRole("tablist");
    // identidad is first (idx=0), fire ArrowRight → focus should be idx=1
    fireEvent.keyDown(nav, { key: "ArrowRight" });
    const tabs = screen.getAllByRole("tab");
    // After ArrowRight from idx=0, focusedIdx=1 → tabIndex=0 on idx=1
    expect(tabs[1]?.getAttribute("tabindex")).toBe("0");
    expect(tabs[0]?.getAttribute("tabindex")).toBe("-1");
  });

  it("ArrowLeft wraps to last tab from first", () => {
    render(<SubSubTabsBar />);
    const nav = screen.getByRole("tablist");
    // identidad is first (idx=0), ArrowLeft → circular wrap to last (idx=2)
    fireEvent.keyDown(nav, { key: "ArrowLeft" });
    const tabs = screen.getAllByRole("tab");
    expect(tabs[2]?.getAttribute("tabindex")).toBe("0");
  });

  it("End moves focus to last tab", () => {
    render(<SubSubTabsBar />);
    const nav = screen.getByRole("tablist");
    fireEvent.keyDown(nav, { key: "End" });
    const tabs = screen.getAllByRole("tab");
    expect(tabs[2]?.getAttribute("tabindex")).toBe("0");
    expect(tabs[0]?.getAttribute("tabindex")).toBe("-1");
  });

  it("Home moves focus to first tab", () => {
    mockPathname.mockReturnValue("/tenant-x/lisa/marca/presencia");
    render(<SubSubTabsBar />);
    const nav = screen.getByRole("tablist");
    fireEvent.keyDown(nav, { key: "Home" });
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0]?.getAttribute("tabindex")).toBe("0");
  });

  it("Enter on focused tab triggers navigation", () => {
    render(<SubSubTabsBar />);
    const nav = screen.getByRole("tablist");
    // focusedIdx=0 (identidad), Enter → navigate to identidad
    fireEvent.keyDown(nav, { key: "Enter" });
    expect(mockPush).toHaveBeenCalledWith("/tenant-x/lisa/marca/identidad");
  });

  it("Space on focused tab triggers navigation", () => {
    render(<SubSubTabsBar />);
    const nav = screen.getByRole("tablist");
    fireEvent.keyDown(nav, { key: " " });
    expect(mockPush).toHaveBeenCalledWith("/tenant-x/lisa/marca/identidad");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SC-7 — defensive: no tenantId → navigation cancelled
// ──────────────────────────────────────────────────────────────────────────────

describe("SC-7: defensive navigation guard", () => {
  it("no tenantId → click does not call router.push", () => {
    mockParams.mockReturnValue({ tenantId: undefined } as { tenantId?: string });
    render(<SubSubTabsBar />);
    const vozTab = screen.getByTestId("sub-sub-tab-voz-y-tono");
    fireEvent.click(vozTab);
    expect(mockPush).not.toHaveBeenCalled();
  });
});
