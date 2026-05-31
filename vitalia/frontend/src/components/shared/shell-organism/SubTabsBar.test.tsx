/**
 * SubTabsBar.test.tsx — SubTabsBar organism unit tests (F1-S8 T-4 TDD mandatory)
 *
 * gherkin_coverage per 06-tickets.yaml T-4:
 * SC-1: renders nav role=tablist + N SubTabs from RIBBON_SUBTABS[activeAgent]
 * SC-1: click SubTab → router.push to /{tenant}/{agent}/{subtab}
 * SC-2: agent change re-renders SubTabsBar with new sub-tabs
 * SC-3: deep link → URL-derived active state correct
 * SC-4: activeAgent null → return null total
 * SC-5: invalid subtab segment → no SubTab active (all inactive)
 * SC-7: XSS payload → safe
 * SC-8: roving tabindex pattern (Arrow Right/Left/Home/End + Enter/Space + circular wrap)
 * SC-8: onFocus on SubTab updates focusedIdx
 * SC-9: nav aria-label dynamic per agente (Spanish neutro)
 * defensive: useParams.tenantId undefined → navigation cancelled
 *
 * spec_anchor: 01-spec.md § Gherkin SC-1..SC-9 + § Wireframe + § Accessibility · 03-arch.md § 2.4 + § 6
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SubTabsBar } from "./SubTabsBar";

// ──────────────────────────────────────────────────────────────────────────────
// next/navigation mocks
// ──────────────────────────────────────────────────────────────────────────────

const mockPush = vi.fn();
// vi.fn() without generic type args — return types inferred from usage
const mockPathname = vi.fn(() => "/tenant-x/lisa/marca" as string | null);
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
  mockPathname.mockReturnValue("/tenant-x/lisa/marca");
  mockParams.mockReturnValue({ tenantId: "tenant-x" });
});

// ──────────────────────────────────────────────────────────────────────────────
// SC-1 — renders nav role=tablist + N SubTabs from RIBBON_SUBTABS[activeAgent]
// ──────────────────────────────────────────────────────────────────────────────

describe("SubTabsBar — renders nav + N SubTabs (SC-1)", () => {
  it("mock usePathname '/tenant-x/lisa/marca' → renders <nav role='tablist' aria-label='Sub-secciones Lisa' data-testid='sub-tabs-bar'>", () => {
    render(<SubTabsBar />);
    const nav = screen.getByRole("tablist");
    expect(nav).toBeDefined();
    expect(nav.getAttribute("aria-label")).toBe("Sub-secciones Lisa");
    expect(nav.getAttribute("data-testid")).toBe("sub-tabs-bar");
  });

  it("renders exactly 4 SubTab children when activeAgent=lisa (RIBBON_SUBTABS.lisa.length === 4)", () => {
    render(<SubTabsBar />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(4);
  });

  it("mock usePathname '/tenant-x/lucas/lanzar' → 5 SubTabs (caso max)", () => {
    mockPathname.mockReturnValue("/tenant-x/lucas/lanzar");
    render(<SubTabsBar />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(5);
  });

  it("mock usePathname '/tenant-x/mateo/agenda' → 2 SubTabs (caso mínimo — v1.2 mateo has agenda+pacientes)", () => {
    // v1.2 (2026-05-30): Mateo is Operar with 2 subtabs [agenda, pacientes]
    // (valeria now has 0 subtabs — is sidebar-only)
    mockPathname.mockReturnValue("/tenant-x/mateo/agenda");
    render(<SubTabsBar />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(2);
  });

  it("container className contains 'min-h-[42px] bg-card border-b border-border flex items-center px-4 gap-1 overflow-x-auto'", () => {
    render(<SubTabsBar />);
    const nav = screen.getByRole("tablist");
    const cls = nav.className;
    expect(cls).toContain("min-h-[42px]");
    expect(cls).toContain("bg-card");
    expect(cls).toContain("border-b");
    expect(cls).toContain("border-border");
    expect(cls).toContain("flex");
    expect(cls).toContain("items-center");
    expect(cls).toContain("px-4");
    expect(cls).toContain("gap-1");
    expect(cls).toContain("overflow-x-auto");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SC-1 — click SubTab → router.push to /{tenant}/{agent}/{subtab}
// ──────────────────────────────────────────────────────────────────────────────

describe("SubTabsBar — click SubTab → router.push (SC-1)", () => {
  it("mock useParams returns {tenantId: 'tenant-x'} + usePathname='/tenant-x/lisa/marca' → click sub-tab-staff → router.push called with '/tenant-x/lisa/staff'", () => {
    render(<SubTabsBar />);
    const doctoresTab = screen.getByTestId("sub-tab-staff");
    fireEvent.click(doctoresTab);
    expect(mockPush).toHaveBeenCalledWith("/tenant-x/lisa/staff");
  });

  it("usePathname='/tenant-x/camila/voz' → click sub-tab-reactivar → router.push('/tenant-x/camila/reactivar')", () => {
    mockPathname.mockReturnValue("/tenant-x/camila/voz");
    render(<SubTabsBar />);
    const reactivarTab = screen.getByTestId("sub-tab-reactivar");
    fireEvent.click(reactivarTab);
    expect(mockPush).toHaveBeenCalledWith("/tenant-x/camila/reactivar");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SC-2 — agent change re-renders SubTabsBar with new sub-tabs
// ──────────────────────────────────────────────────────────────────────────────

describe("SubTabsBar — agent change re-renders (SC-2)", () => {
  it("initial mock usePathname '/tenant-x/lisa/staff' → 4 SubTabs Lisa + nav aria-label='Sub-secciones Lisa'", () => {
    mockPathname.mockReturnValue("/tenant-x/lisa/staff");
    render(<SubTabsBar />);
    const nav = screen.getByRole("tablist");
    expect(nav.getAttribute("aria-label")).toBe("Sub-secciones Lisa");
    expect(screen.getAllByRole("tab")).toHaveLength(4);
  });

  it("re-render with mock usePathname='/tenant-x/lucas/lanzar' → 5 SubTabs Lucas + nav aria-label='Sub-secciones Lucas'", () => {
    mockPathname.mockReturnValue("/tenant-x/lisa/staff");
    const { rerender } = render(<SubTabsBar />);

    mockPathname.mockReturnValue("/tenant-x/lucas/lanzar");
    rerender(<SubTabsBar />);

    const nav = screen.getByRole("tablist");
    expect(nav.getAttribute("aria-label")).toBe("Sub-secciones Lucas");
    expect(screen.getAllByRole("tab")).toHaveLength(5);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SC-3 — deep link → URL-derived active state correct
// ──────────────────────────────────────────────────────────────────────────────

describe("SubTabsBar — URL-derived active state (SC-3)", () => {
  it("usePathname '/tenant-x/camila/reactivar' → sub-tab-reactivar data-active='true' aria-selected='true' + others data-active='false'", () => {
    mockPathname.mockReturnValue("/tenant-x/camila/reactivar");
    render(<SubTabsBar />);
    const reactivarTab = screen.getByTestId("sub-tab-reactivar");
    expect(reactivarTab.getAttribute("data-active")).toBe("true");
    expect(reactivarTab.getAttribute("aria-selected")).toBe("true");

    // Others should be inactive
    const voz = screen.getByTestId("sub-tab-voz");
    expect(voz.getAttribute("data-active")).toBe("false");
  });

  it("usePathname '/tenant-x/lisa/compliance' → sub-tab-compliance active + sub-tab-marca inactive", () => {
    mockPathname.mockReturnValue("/tenant-x/lisa/compliance");
    render(<SubTabsBar />);
    const complianceTab = screen.getByTestId("sub-tab-compliance");
    const marcaTab = screen.getByTestId("sub-tab-marca");
    expect(complianceTab.getAttribute("data-active")).toBe("true");
    expect(marcaTab.getAttribute("data-active")).toBe("false");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SC-4 — activeAgent null → return null total
// ──────────────────────────────────────────────────────────────────────────────

describe("SubTabsBar — activeAgent null → return null (SC-4 Q5 cement)", () => {
  it("mock usePathname '/tenant-x/foobar/anything' (extractAgentFromPath returns null) → component returns null → container.firstChild is null", () => {
    mockPathname.mockReturnValue("/tenant-x/foobar/anything");
    const { container } = render(<SubTabsBar />);
    expect(container.firstChild).toBeNull();
  });

  it("no <nav data-testid='sub-tabs-bar'> rendered in DOM when agent invalid", () => {
    mockPathname.mockReturnValue("/tenant-x/foobar/anything");
    render(<SubTabsBar />);
    expect(screen.queryByTestId("sub-tabs-bar")).toBeNull();
  });

  it("usePathname='/' → return null (extractAgentFromPath returns null)", () => {
    mockPathname.mockReturnValue("/");
    const { container } = render(<SubTabsBar />);
    expect(container.firstChild).toBeNull();
  });

  it("usePathname=null → return null (defensive nullable input)", () => {
    mockPathname.mockReturnValue(null as unknown as string);
    const { container } = render(<SubTabsBar />);
    expect(container.firstChild).toBeNull();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SC-5 — invalid subtab segment → no SubTab active (all inactive)
// ──────────────────────────────────────────────────────────────────────────────

describe("SubTabsBar — invalid subtab → all inactive (SC-5)", () => {
  it("usePathname '/tenant-x/lisa/inexistente' → 4 SubTabs Lisa rendered (no return null — agent valid) + NINGÚN SubTab has aria-selected='true'", () => {
    mockPathname.mockReturnValue("/tenant-x/lisa/inexistente");
    render(<SubTabsBar />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(4);
    for (const tab of tabs) {
      expect(tab.getAttribute("aria-selected")).toBe("false");
    }
  });

  it("all 4 SubTabs have data-active='false' + className includes 'text-muted-foreground'", () => {
    mockPathname.mockReturnValue("/tenant-x/lisa/inexistente");
    render(<SubTabsBar />);
    const tabs = screen.getAllByRole("tab");
    for (const tab of tabs) {
      expect(tab.getAttribute("data-active")).toBe("false");
      expect(tab.className).toContain("text-muted-foreground");
    }
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SC-7 adversarial — XSS payload
// ──────────────────────────────────────────────────────────────────────────────

describe("SubTabsBar — XSS payload → safe (SC-7)", () => {
  it("usePathname '/tenant-x/lisa/<script>alert(1)</script>' → 4 SubTabs Lisa render + ninguno active + no script tag injected into DOM", () => {
    mockPathname.mockReturnValue("/tenant-x/lisa/<script>alert(1)</script>");
    const { container } = render(<SubTabsBar />);
    // Agent is lisa (valid) — 4 subtabs rendered
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(4);
    // Subtab segment is XSS payload — does not match any RIBBON_SUBTABS.lisa[].id → all inactive
    for (const tab of tabs) {
      expect(tab.getAttribute("aria-selected")).toBe("false");
    }
    // No actual <script> tag injected
    expect(container.querySelectorAll("script").length).toBe(0);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SC-8 a11y — roving tabindex pattern (verbatim from Ribbon.tsx)
// ──────────────────────────────────────────────────────────────────────────────

describe("SubTabsBar — roving tabindex + keyboard navigation (SC-8 a11y)", () => {
  it("initial focusedIdx = index of active sub-tab → sub-tab-marca has tabIndex='0', others tabIndex='-1'", () => {
    mockPathname.mockReturnValue("/tenant-x/lisa/marca");
    render(<SubTabsBar />);
    // 'marca' is index 0 in RIBBON_SUBTABS.lisa — should have tabIndex=0
    const marcaTab = screen.getByTestId("sub-tab-marca");
    expect(marcaTab.getAttribute("tabindex")).toBe("0");
    // Others should be -1
    const doctoresTab = screen.getByTestId("sub-tab-staff");
    expect(doctoresTab.getAttribute("tabindex")).toBe("-1");
  });

  it("Arrow Right → advances focusedIdx to next tab (tabIndex changes)", () => {
    mockPathname.mockReturnValue("/tenant-x/lisa/marca");
    render(<SubTabsBar />);
    const nav = screen.getByRole("tablist");
    // Initial: marca (idx 0) has tabIndex=0
    expect(screen.getByTestId("sub-tab-marca").getAttribute("tabindex")).toBe(
      "0",
    );
    // Press Arrow Right → focusedIdx becomes 1 (doctores)
    fireEvent.keyDown(nav, { key: "ArrowRight" });
    expect(
      screen.getByTestId("sub-tab-staff").getAttribute("tabindex"),
    ).toBe("0");
    expect(screen.getByTestId("sub-tab-marca").getAttribute("tabindex")).toBe(
      "-1",
    );
  });

  it("Arrow Left → setFocusedIdx -1 + circular wrap", () => {
    mockPathname.mockReturnValue("/tenant-x/lisa/marca");
    render(<SubTabsBar />);
    const nav = screen.getByRole("tablist");
    // Initial: marca (idx 0), press Left → wraps to last (compliance, idx 3)
    fireEvent.keyDown(nav, { key: "ArrowLeft" });
    expect(
      screen.getByTestId("sub-tab-compliance").getAttribute("tabindex"),
    ).toBe("0");
  });

  it("Home → focus first SubTab (idx 0)", () => {
    // Start at 'compliance' (idx 3) and press Home
    mockPathname.mockReturnValue("/tenant-x/lisa/compliance");
    render(<SubTabsBar />);
    const nav = screen.getByRole("tablist");
    // Press Right first to confirm we're at compliance idx
    fireEvent.keyDown(nav, { key: "Home" });
    expect(screen.getByTestId("sub-tab-marca").getAttribute("tabindex")).toBe(
      "0",
    );
  });

  it("End → focus last SubTab (idx N-1)", () => {
    mockPathname.mockReturnValue("/tenant-x/lisa/marca");
    render(<SubTabsBar />);
    const nav = screen.getByRole("tablist");
    fireEvent.keyDown(nav, { key: "End" });
    // Last for lisa is 'compliance' (idx 3)
    expect(
      screen.getByTestId("sub-tab-compliance").getAttribute("tabindex"),
    ).toBe("0");
  });

  it("Enter on focused tab → router.push called with /{tenant}/{agent}/{subtab}", () => {
    // Initial focused: marca (idx 0)
    mockPathname.mockReturnValue("/tenant-x/lisa/marca");
    render(<SubTabsBar />);
    const nav = screen.getByRole("tablist");
    fireEvent.keyDown(nav, { key: "Enter" });
    expect(mockPush).toHaveBeenCalledWith("/tenant-x/lisa/marca");
  });

  it("Space on focused tab → router.push called (same as Enter)", () => {
    mockPathname.mockReturnValue("/tenant-x/lisa/marca");
    render(<SubTabsBar />);
    const nav = screen.getByRole("tablist");
    fireEvent.keyDown(nav, { key: " " });
    expect(mockPush).toHaveBeenCalledWith("/tenant-x/lisa/marca");
  });

  it("Arrow Right wraps from last to first (circular modulo)", () => {
    mockPathname.mockReturnValue("/tenant-x/lisa/compliance");
    render(<SubTabsBar />);
    const nav = screen.getByRole("tablist");
    // compliance is idx 3 (last) → right wraps to marca (idx 0)
    fireEvent.keyDown(nav, { key: "ArrowRight" });
    expect(screen.getByTestId("sub-tab-marca").getAttribute("tabindex")).toBe(
      "0",
    );
  });

  it("other keys (Tab, Escape, etc.) → no router.push, no focus change from current position", () => {
    mockPathname.mockReturnValue("/tenant-x/lisa/marca");
    render(<SubTabsBar />);
    const nav = screen.getByRole("tablist");
    fireEvent.keyDown(nav, { key: "Tab" });
    fireEvent.keyDown(nav, { key: "Escape" });
    // No navigation called
    expect(mockPush).not.toHaveBeenCalled();
    // Focus remains on marca (idx 0)
    expect(screen.getByTestId("sub-tab-marca").getAttribute("tabindex")).toBe(
      "0",
    );
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SC-8 — onFocus updates focusedIdx (no navigation side-effect)
// ──────────────────────────────────────────────────────────────────────────────

describe("SubTabsBar — onFocus updates focusedIdx (SC-8)", () => {
  it("synthetic onFocus on sub-tab-servicios (idx=2) → tabIndex updated to 0, router.push NOT called", () => {
    mockPathname.mockReturnValue("/tenant-x/lisa/marca");
    render(<SubTabsBar />);
    const serviciosTab = screen.getByTestId("sub-tab-servicios");
    // Before focus: servicios has tabIndex -1
    expect(serviciosTab.getAttribute("tabindex")).toBe("-1");
    // Fire focus
    fireEvent.focus(serviciosTab);
    // After focus: servicios should have tabIndex 0
    expect(serviciosTab.getAttribute("tabindex")).toBe("0");
    // No navigation side effect
    expect(mockPush).not.toHaveBeenCalled();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SC-9 i18n — nav aria-label dynamic per agente (Spanish neutro)
// ──────────────────────────────────────────────────────────────────────────────

describe("SubTabsBar — aria-label dynamic Spanish neutro (SC-9 i18n)", () => {
  it("activeAgent='lisa' → aria-label='Sub-secciones Lisa'", () => {
    mockPathname.mockReturnValue("/tenant-x/lisa/marca");
    render(<SubTabsBar />);
    const nav = screen.getByRole("tablist");
    expect(nav.getAttribute("aria-label")).toBe("Sub-secciones Lisa");
  });

  it("activeAgent='lucas' → aria-label='Sub-secciones Lucas'", () => {
    mockPathname.mockReturnValue("/tenant-x/lucas/lanzar");
    render(<SubTabsBar />);
    expect(screen.getByRole("tablist").getAttribute("aria-label")).toBe(
      "Sub-secciones Lucas",
    );
  });

  it("activeAgent='adrian' → aria-label='Sub-secciones Adrián' (con tilde)", () => {
    mockPathname.mockReturnValue("/tenant-x/adrian/inbox");
    render(<SubTabsBar />);
    expect(screen.getByRole("tablist").getAttribute("aria-label")).toBe(
      "Sub-secciones Adrián",
    );
  });

  it("activeAgent='mateo' → aria-label='Sub-secciones Mateo' (v1.2 — Mateo is Operar ribbon agent)", () => {
    // v1.2 (2026-05-30): Mateo is now a ribbon agent with subtabs
    mockPathname.mockReturnValue("/tenant-x/mateo/agenda");
    render(<SubTabsBar />);
    expect(screen.getByRole("tablist").getAttribute("aria-label")).toBe(
      "Sub-secciones Mateo",
    );
  });

  it("activeAgent='camila' → aria-label='Sub-secciones Camila'", () => {
    mockPathname.mockReturnValue("/tenant-x/camila/voz");
    render(<SubTabsBar />);
    expect(screen.getByRole("tablist").getAttribute("aria-label")).toBe(
      "Sub-secciones Camila",
    );
  });

  it("activeAgent='config' → aria-label='Sub-secciones Configuración' (con tilde)", () => {
    mockPathname.mockReturnValue("/tenant-x/config/cuenta");
    render(<SubTabsBar />);
    expect(screen.getByRole("tablist").getAttribute("aria-label")).toBe(
      "Sub-secciones Configuración",
    );
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// defensive — useParams.tenantId undefined → navigation cancelled
// ──────────────────────────────────────────────────────────────────────────────

describe("SubTabsBar — useParams.tenantId undefined → navigation cancelled (defensive)", () => {
  it("mock useParams returns null → click SubTab → router.push NOT called (early return guard)", () => {
    mockParams.mockReturnValue(null);
    render(<SubTabsBar />);
    const marcaTab = screen.queryByTestId("sub-tab-marca");
    if (marcaTab) {
      fireEvent.click(marcaTab);
    }
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("mock useParams returns {} (no tenantId) → click SubTab → router.push NOT called", () => {
    mockParams.mockReturnValue({});
    render(<SubTabsBar />);
    const marcaTab = screen.queryByTestId("sub-tab-marca");
    if (marcaTab) {
      fireEvent.click(marcaTab);
    }
    expect(mockPush).not.toHaveBeenCalled();
  });
});
