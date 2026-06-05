// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-1
// T-FE-NAVBAR: updated for root-as-leaf refactor (Chris round 4)
/**
 * EntitySubNavBar.test.tsx — Tests for N3-dynamic entity workspace navigation (nicolify port).
 *
 * TDD RED-first: tests written before implementation per tdd-mandatory.md.
 *
 * Port from vitalia EntitySubNavBar.test.tsx, adapted for:
 * - Dynamic leaves (ICP datos + N buyers + "+ buyer" affordance)
 * - agent-abel color (#A855F7 via _agent-tw-classes.ts G3)
 * - Spanish neutro LatAm microcopy
 *
 * T-FE-NAVBAR changes (root-as-leaf refactor):
 * - Root leaf "ICPs" is now a LeafTabButton (not a Link back-link)
 * - Master mode (entity=null): root leaf is ACTIVE, no back-arrow, no other leaves
 * - Workspace mode (entity present): root leaf is inactive peer, full leaves rendered
 *
 * Covers:
 *   - WAI-ARIA role=tablist + role=tab
 *   - Roving tabindex (only focused tab has tabIndex=0)
 *   - Arrow key navigation (Left/Right)
 *   - Master mode (entity=null): root leaf ACTIVE, only root leaf visible
 *   - Workspace mode (entity present): root leaf inactive + full leaves
 *   - Active leaf derived from activeLeaf prop
 *   - Root leaf rendered as tab (not link)
 *   - "+ agregar" affordance rendered and accessible
 *   - Overflow scroll with many leaves (SC-large)
 *   - router.push called on leaf click (not full reload)
 *
 * spec_anchor: 03-arch-fe.md § 8 Accessibility + SHELL-DESIGN-CONTRACT §5.1
 * validators_gate: SC-a11y + 04-validators.yaml § a11y
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// Mock next/navigation — router.push is the key assertion
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/tenant-abc/abel/icp/icp-001/datos",
}));

// Mock next/image (node env doesn't render <img> with next internals)
vi.mock("next/image", () => ({
  default: ({ src, alt, ...rest }: { src: string; alt: string; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...rest} />
  ),
}));

// Import component under test
import { EntitySubNavBar } from "./EntitySubNavBar";

// ── Test Fixtures ─────────────────────────────────────────────────────────────

const icpEntity = {
  id: "icp-001",
  name: "Tech B2B Mid-Market",
  avatarUrl: null,
};

const dynamicLeaves = [
  { id: "datos", label: "Datos del ICP", href: "/tenant-abc/abel/icp/icp-001/datos" },
  { id: "buyer-a1b2", label: "Ana García", href: "/tenant-abc/abel/icp/icp-001/buyer-a1b2" },
  { id: "buyer-c3d4", label: "Carlos Ruiz", href: "/tenant-abc/abel/icp/icp-001/buyer-c3d4" },
];

const addBuyerAffordance = {
  id: "__add_buyer__",
  label: "+ buyer",
  href: "",
  isAddAffordance: true,
};

const allLeaves = [...dynamicLeaves, addBuyerAffordance];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("EntitySubNavBar (nicolify — dynamic leaves ICP/buyer)", () => {
  describe("workspace mode (entity present)", () => {
    it("renders a nav element with role=tablist", () => {
      render(
        <EntitySubNavBar
          rootHref="/tenant-abc/abel/icp"
          rootLabel="ICPs"
          entity={icpEntity}
          leaves={dynamicLeaves}
          activeLeaf="datos"
          agentSlug="abel"
        />,
      );
      expect(screen.getByRole("tablist")).toBeInTheDocument();
    });

    it("renders root leaf + all content leaves as tab buttons", () => {
      render(
        <EntitySubNavBar
          rootHref="/tenant-abc/abel/icp"
          rootLabel="ICPs"
          entity={icpEntity}
          leaves={dynamicLeaves}
          activeLeaf="datos"
          agentSlug="abel"
        />,
      );
      const tabs = screen.getAllByRole("tab");
      // root leaf (ICPs) + 3 content leaves = 4 total
      expect(tabs).toHaveLength(4);
      expect(tabs[0]).toHaveTextContent("ICPs"); // root leaf
      expect(tabs[1]).toHaveTextContent("Datos del ICP");
      expect(tabs[2]).toHaveTextContent("Ana García");
      expect(tabs[3]).toHaveTextContent("Carlos Ruiz");
    });

    it("root leaf is NOT active when a content leaf is selected", () => {
      render(
        <EntitySubNavBar
          rootHref="/tenant-abc/abel/icp"
          rootLabel="ICPs"
          entity={icpEntity}
          leaves={dynamicLeaves}
          activeLeaf="datos"
          agentSlug="abel"
        />,
      );
      const tabs = screen.getAllByRole("tab");
      // root leaf at idx 0: not active
      expect(tabs[0]).toHaveAttribute("aria-selected", "false");
      // datos leaf at idx 1: active
      expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    });

    it("marks active leaf with aria-selected=true", () => {
      render(
        <EntitySubNavBar
          rootHref="/tenant-abc/abel/icp"
          rootLabel="ICPs"
          entity={icpEntity}
          leaves={dynamicLeaves}
          activeLeaf="buyer-a1b2"
          agentSlug="abel"
        />,
      );
      const tabs = screen.getAllByRole("tab");
      // root=0, datos=1, buyer-a1b2=2, buyer-c3d4=3
      expect(tabs[0]).toHaveAttribute("aria-selected", "false"); // root
      expect(tabs[1]).toHaveAttribute("aria-selected", "false"); // datos
      expect(tabs[2]).toHaveAttribute("aria-selected", "true"); // buyer-a1b2 (active)
      expect(tabs[3]).toHaveAttribute("aria-selected", "false"); // buyer-c3d4
    });

    it("uses roving tabindex — only focused tab has tabIndex=0", () => {
      render(
        <EntitySubNavBar
          rootHref="/tenant-abc/abel/icp"
          rootLabel="ICPs"
          entity={icpEntity}
          leaves={dynamicLeaves}
          activeLeaf="datos"
          agentSlug="abel"
        />,
      );
      const tabs = screen.getAllByRole("tab");
      // datos is at idx 1 in allTabs → focusedIdx = 1
      expect(tabs[0]).toHaveAttribute("tabindex", "-1"); // root
      expect(tabs[1]).toHaveAttribute("tabindex", "0"); // datos (focused)
      expect(tabs[2]).toHaveAttribute("tabindex", "-1");
      expect(tabs[3]).toHaveAttribute("tabindex", "-1");
    });

    it("leaves are NOT aria-disabled when entity is present", () => {
      render(
        <EntitySubNavBar
          rootHref="/tenant-abc/abel/icp"
          rootLabel="ICPs"
          entity={icpEntity}
          leaves={dynamicLeaves}
          activeLeaf="datos"
          agentSlug="abel"
        />,
      );
      const tabs = screen.getAllByRole("tab");
      tabs.forEach((tab) => {
        expect(tab).not.toHaveAttribute("aria-disabled", "true");
      });
    });

    it("renders entity name in identity area", () => {
      render(
        <EntitySubNavBar
          rootHref="/tenant-abc/abel/icp"
          rootLabel="ICPs"
          entity={icpEntity}
          leaves={dynamicLeaves}
          activeLeaf="datos"
          agentSlug="abel"
        />,
      );
      expect(screen.getByText("Tech B2B Mid-Market")).toBeInTheDocument();
    });

    it("renders root leaf as tab button (NOT a link)", () => {
      render(
        <EntitySubNavBar
          rootHref="/tenant-abc/abel/icp"
          rootLabel="ICPs"
          entity={icpEntity}
          leaves={dynamicLeaves}
          activeLeaf="datos"
          agentSlug="abel"
        />,
      );
      // Root is now a tab button, not a link
      const rootTab = screen.getByTestId("entity-leaf-root");
      expect(rootTab.tagName).toBe("BUTTON");
      expect(rootTab).toHaveAttribute("role", "tab");
      expect(rootTab).toHaveAttribute("data-root-leaf", "true");
    });

    it("root leaf navigates to rootHref when clicked (router.push)", () => {
      mockPush.mockClear();
      render(
        <EntitySubNavBar
          rootHref="/tenant-abc/abel/icp"
          rootLabel="ICPs"
          entity={icpEntity}
          leaves={dynamicLeaves}
          activeLeaf="datos"
          agentSlug="abel"
        />,
      );
      const rootTab = screen.getByTestId("entity-leaf-root");
      fireEvent.click(rootTab);
      expect(mockPush).toHaveBeenCalledWith("/tenant-abc/abel/icp");
    });

    it("calls router.push (not full reload) when content leaf tab clicked", () => {
      mockPush.mockClear();
      render(
        <EntitySubNavBar
          rootHref="/tenant-abc/abel/icp"
          rootLabel="ICPs"
          entity={icpEntity}
          leaves={dynamicLeaves}
          activeLeaf="datos"
          agentSlug="abel"
        />,
      );
      const tabs = screen.getAllByRole("tab");
      fireEvent.click(tabs[2]); // click Ana García (index 2 = root + datos + ana)
      expect(mockPush).toHaveBeenCalledWith("/tenant-abc/abel/icp/icp-001/buyer-a1b2");
    });

    it("does NOT render the ‹ back-link arrow", () => {
      render(
        <EntitySubNavBar
          rootHref="/tenant-abc/abel/icp"
          rootLabel="ICPs"
          entity={icpEntity}
          leaves={dynamicLeaves}
          activeLeaf="datos"
          agentSlug="abel"
        />,
      );
      // The ‹ character should not be present (no back-link)
      const text = screen.queryByText("‹");
      expect(text).toBeNull();
      // No <a> tag pointing to rootHref (root is a tab, not a link)
      const links = document.querySelectorAll("a");
      const rootLink = Array.from(links).find(
        (a) => a.getAttribute("href") === "/tenant-abc/abel/icp",
      );
      expect(rootLink).toBeUndefined();
    });
  });

  describe("master mode (entity=null) — root leaf active, no content leaves", () => {
    it("renders ONLY the root leaf (ICPs) as the single tab in master mode", () => {
      render(
        <EntitySubNavBar
          rootHref="/tenant-abc/abel/icp"
          rootLabel="ICPs"
          entity={null}
          leaves={dynamicLeaves}
          activeLeaf={null}
          agentSlug="abel"
        />,
      );
      const tabs = screen.getAllByRole("tab");
      // Only 1 tab: root leaf
      expect(tabs).toHaveLength(1);
      expect(tabs[0]).toHaveTextContent("ICPs");
    });

    it("root leaf is aria-selected=true in master mode (active)", () => {
      render(
        <EntitySubNavBar
          rootHref="/tenant-abc/abel/icp"
          rootLabel="ICPs"
          entity={null}
          leaves={dynamicLeaves}
          activeLeaf={null}
          agentSlug="abel"
        />,
      );
      const rootTab = screen.getByTestId("entity-leaf-root");
      expect(rootTab).toHaveAttribute("aria-selected", "true");
    });

    it("root leaf is NOT aria-disabled in master mode", () => {
      render(
        <EntitySubNavBar
          rootHref="/tenant-abc/abel/icp"
          rootLabel="ICPs"
          entity={null}
          leaves={dynamicLeaves}
          activeLeaf={null}
          agentSlug="abel"
        />,
      );
      const rootTab = screen.getByTestId("entity-leaf-root");
      expect(rootTab).not.toHaveAttribute("aria-disabled", "true");
    });

    it("root leaf has tabIndex=0 in master mode (roving tabindex — only tab)", () => {
      render(
        <EntitySubNavBar
          rootHref="/tenant-abc/abel/icp"
          rootLabel="ICPs"
          entity={null}
          leaves={dynamicLeaves}
          activeLeaf={null}
          agentSlug="abel"
        />,
      );
      const rootTab = screen.getByTestId("entity-leaf-root");
      expect(rootTab).toHaveAttribute("tabindex", "0");
    });

    it("shows placeholder 'Selecciona un ICP' in master mode", () => {
      render(
        <EntitySubNavBar
          rootHref="/tenant-abc/abel/icp"
          rootLabel="ICPs"
          entity={null}
          leaves={dynamicLeaves}
          activeLeaf={null}
          agentSlug="abel"
        />,
      );
      expect(screen.getByText("Selecciona un ICP")).toBeInTheDocument();
    });

    it("does NOT render entity name in master mode", () => {
      render(
        <EntitySubNavBar
          rootHref="/tenant-abc/abel/icp"
          rootLabel="ICPs"
          entity={null}
          leaves={dynamicLeaves}
          activeLeaf={null}
          agentSlug="abel"
        />,
      );
      expect(screen.queryByText("Tech B2B Mid-Market")).toBeNull();
    });

    it("does NOT render buyer leaves or datos in master mode", () => {
      render(
        <EntitySubNavBar
          rootHref="/tenant-abc/abel/icp"
          rootLabel="ICPs"
          entity={null}
          leaves={dynamicLeaves}
          activeLeaf={null}
          agentSlug="abel"
        />,
      );
      expect(screen.queryByText("Datos del ICP")).toBeNull();
      expect(screen.queryByText("Ana García")).toBeNull();
    });

    it("root leaf in master mode calls router.push(rootHref) when clicked", () => {
      mockPush.mockClear();
      render(
        <EntitySubNavBar
          rootHref="/tenant-abc/abel/icp"
          rootLabel="ICPs"
          entity={null}
          leaves={dynamicLeaves}
          activeLeaf={null}
          agentSlug="abel"
        />,
      );
      const rootTab = screen.getByTestId("entity-leaf-root");
      fireEvent.click(rootTab);
      // Root tab navigates to rootHref (it IS the root — still navigates there)
      expect(mockPush).toHaveBeenCalledWith("/tenant-abc/abel/icp");
    });
  });

  describe("keyboard navigation", () => {
    it("ArrowRight moves focus to next tab (root→datos in workspace mode)", () => {
      render(
        <EntitySubNavBar
          rootHref="/tenant-abc/abel/icp"
          rootLabel="ICPs"
          entity={icpEntity}
          leaves={dynamicLeaves}
          activeLeaf="datos"
          agentSlug="abel"
        />,
      );
      const nav = screen.getByRole("tablist");
      const tabs = screen.getAllByRole("tab");
      // Focus datos (idx 1), then ArrowRight → idx 2
      tabs[1]?.focus();
      fireEvent.keyDown(nav, { key: "ArrowRight" });
      expect(tabs[2]).toHaveAttribute("tabindex", "0");
    });

    it("ArrowLeft moves focus to previous tab", () => {
      render(
        <EntitySubNavBar
          rootHref="/tenant-abc/abel/icp"
          rootLabel="ICPs"
          entity={icpEntity}
          leaves={dynamicLeaves}
          activeLeaf="buyer-a1b2"
          agentSlug="abel"
        />,
      );
      const nav = screen.getByRole("tablist");
      const tabs = screen.getAllByRole("tab");
      tabs[2]?.focus(); // focus buyer-a1b2
      fireEvent.keyDown(nav, { key: "ArrowLeft" });
      expect(tabs[1]).toHaveAttribute("tabindex", "0");
    });

    it("Home moves focus to first tab (root leaf)", () => {
      render(
        <EntitySubNavBar
          rootHref="/tenant-abc/abel/icp"
          rootLabel="ICPs"
          entity={icpEntity}
          leaves={dynamicLeaves}
          activeLeaf="buyer-c3d4"
          agentSlug="abel"
        />,
      );
      const nav = screen.getByRole("tablist");
      const tabs = screen.getAllByRole("tab");
      tabs[3]?.focus();
      fireEvent.keyDown(nav, { key: "Home" });
      expect(tabs[0]).toHaveAttribute("tabindex", "0"); // root leaf is first
    });

    it("End moves focus to last tab", () => {
      render(
        <EntitySubNavBar
          rootHref="/tenant-abc/abel/icp"
          rootLabel="ICPs"
          entity={icpEntity}
          leaves={dynamicLeaves}
          activeLeaf="datos"
          agentSlug="abel"
        />,
      );
      const nav = screen.getByRole("tablist");
      const tabs = screen.getAllByRole("tab");
      tabs[1]?.focus();
      fireEvent.keyDown(nav, { key: "End" });
      expect(tabs[3]).toHaveAttribute("tabindex", "0");
    });

    it("ArrowRight wraps around to first tab (root) from last", () => {
      render(
        <EntitySubNavBar
          rootHref="/tenant-abc/abel/icp"
          rootLabel="ICPs"
          entity={icpEntity}
          leaves={dynamicLeaves}
          activeLeaf="buyer-c3d4"
          agentSlug="abel"
        />,
      );
      const nav = screen.getByRole("tablist");
      const tabs = screen.getAllByRole("tab");
      tabs[3]?.focus(); // last tab
      fireEvent.keyDown(nav, { key: "ArrowRight" });
      expect(tabs[0]).toHaveAttribute("tabindex", "0"); // wraps to root
    });
  });

  describe("overflow / many leaves (SC-large)", () => {
    it("renders 30 leaves without breaking (overflow scroll wrapper exists)", () => {
      const manyLeaves = Array.from({ length: 30 }, (_, i) => ({
        id: `buyer-${i}`,
        label: `Buyer ${i + 1}`,
        href: `/tenant-abc/abel/icp/icp-001/buyer-${i}`,
      }));
      render(
        <EntitySubNavBar
          rootHref="/tenant-abc/abel/icp"
          rootLabel="ICPs"
          entity={icpEntity}
          leaves={manyLeaves}
          activeLeaf="buyer-0"
          agentSlug="abel"
        />,
      );
      const tabs = screen.getAllByRole("tab");
      // 1 root leaf + 30 content leaves = 31 total
      expect(tabs).toHaveLength(31);
      // overflow container must exist (data-testid)
      const bar = screen.getByTestId("entity-sub-nav-bar");
      expect(bar).toBeInTheDocument();
    });
  });

  describe("+ buyer add affordance", () => {
    it("renders + buyer button when addLeaf provided in workspace mode", () => {
      render(
        <EntitySubNavBar
          rootHref="/tenant-abc/abel/icp"
          rootLabel="ICPs"
          entity={icpEntity}
          leaves={allLeaves}
          activeLeaf="datos"
          agentSlug="abel"
        />,
      );
      // The "+ buyer" affordance should be visible
      expect(screen.getByText("+ buyer")).toBeInTheDocument();
    });

    it("+ buyer is NOT rendered in master mode (entity=null)", () => {
      render(
        <EntitySubNavBar
          rootHref="/tenant-abc/abel/icp"
          rootLabel="ICPs"
          entity={null}
          leaves={allLeaves}
          activeLeaf={null}
          agentSlug="abel"
        />,
      );
      // Master mode: only root leaf. No add affordance.
      expect(screen.queryByTestId("entity-leaf-add-affordance")).toBeNull();
      expect(screen.queryByText("+ buyer")).toBeNull();
    });

    // clicking + buyer must call onAddAffordance, NOT router.push to a literal route.
    it("calls onAddAffordance when + buyer affordance is clicked (NOT router.push)", () => {
      mockPush.mockClear();
      const onAddAffordance = vi.fn();
      render(
        <EntitySubNavBar
          rootHref="/tenant-abc/abel/icp"
          rootLabel="ICPs"
          entity={icpEntity}
          leaves={allLeaves}
          activeLeaf="datos"
          agentSlug="abel"
          onAddAffordance={onAddAffordance}
        />,
      );
      const addBtn = screen.getByTestId("entity-leaf-add-affordance");
      fireEvent.click(addBtn);
      expect(onAddAffordance).toHaveBeenCalledTimes(1);
      expect(mockPush).not.toHaveBeenCalledWith(expect.stringContaining("__add_buyer__"));
    });

    it("renders + buyer with data-add-affordance=true (e2e locator stability)", () => {
      render(
        <EntitySubNavBar
          rootHref="/tenant-abc/abel/icp"
          rootLabel="ICPs"
          entity={icpEntity}
          leaves={allLeaves}
          activeLeaf="datos"
          agentSlug="abel"
        />,
      );
      const addBtn = screen.getByTestId("entity-leaf-add-affordance");
      expect(addBtn).toHaveAttribute("data-add-affordance", "true");
    });
  });

  describe("root leaf testid (e2e stability)", () => {
    it("root leaf has data-testid='entity-leaf-root' (default rootLeafId)", () => {
      render(
        <EntitySubNavBar
          rootHref="/tenant-abc/abel/icp"
          rootLabel="ICPs"
          entity={icpEntity}
          leaves={dynamicLeaves}
          activeLeaf="datos"
          agentSlug="abel"
        />,
      );
      const rootLeaf = screen.getByTestId("entity-leaf-root");
      expect(rootLeaf).toBeInTheDocument();
    });

    it("root leaf has data-root-leaf=true attribute", () => {
      render(
        <EntitySubNavBar
          rootHref="/tenant-abc/abel/icp"
          rootLabel="ICPs"
          entity={icpEntity}
          leaves={dynamicLeaves}
          activeLeaf="datos"
          agentSlug="abel"
        />,
      );
      const rootLeaf = screen.getByTestId("entity-leaf-root");
      expect(rootLeaf).toHaveAttribute("data-root-leaf", "true");
    });
  });
});
