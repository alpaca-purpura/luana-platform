// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-1
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
 * Covers:
 *   - WAI-ARIA role=tablist + role=tab
 *   - Roving tabindex (only focused tab has tabIndex=0)
 *   - Arrow key navigation (Left/Right)
 *   - Directory mode: all leaves aria-disabled + tabIndex=-1 when entity=null
 *   - Active leaf derived from activeLeaf prop
 *   - Back link rendered correctly
 *   - "+ agregar" affordance rendered and aria-disabled in directory mode
 *   - Overflow scroll with many leaves (SC-large)
 *   - router.push called on leaf click (not full reload)
 *
 * spec_anchor: 03-arch-fe.md § 8 Accessibility + SHELL-DESIGN-CONTRACT §5.1
 * validators_gate: SC-a11y + 04-validators.yaml § a11y
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

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

// Import component under test — will fail (RED) until implemented
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
  href: "#",
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

    it("renders all leaves as tab buttons", () => {
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
      expect(tabs).toHaveLength(3);
      expect(tabs[0]).toHaveTextContent("Datos del ICP");
      expect(tabs[1]).toHaveTextContent("Ana García");
      expect(tabs[2]).toHaveTextContent("Carlos Ruiz");
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
      expect(tabs[1]).toHaveAttribute("aria-selected", "true");
      expect(tabs[0]).toHaveAttribute("aria-selected", "false");
      expect(tabs[2]).toHaveAttribute("aria-selected", "false");
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
      // datos = idx 0 (active → focused initially)
      expect(tabs[0]).toHaveAttribute("tabindex", "0");
      expect(tabs[1]).toHaveAttribute("tabindex", "-1");
      expect(tabs[2]).toHaveAttribute("tabindex", "-1");
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

    it("renders back link to root (ICPs) with correct href", () => {
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
      const backLink = screen.getByRole("link", { name: /icp/i });
      expect(backLink).toHaveAttribute("href", "/tenant-abc/abel/icp");
    });

    it("calls router.push (not full reload) when leaf tab clicked", () => {
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
      fireEvent.click(tabs[1]); // click Ana García
      expect(mockPush).toHaveBeenCalledWith("/tenant-abc/abel/icp/icp-001/buyer-a1b2");
    });
  });

  describe("directory mode (entity=null)", () => {
    it("renders all leaves as aria-disabled", () => {
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
      tabs.forEach((tab) => {
        expect(tab).toHaveAttribute("aria-disabled", "true");
      });
    });

    it("renders leaves with tabIndex=-1 when entity=null", () => {
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
      tabs.forEach((tab) => {
        expect(tab).toHaveAttribute("tabindex", "-1");
      });
    });

    it("does NOT call router.push when directory-mode leaf clicked", () => {
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
      const tabs = screen.getAllByRole("tab");
      fireEvent.click(tabs[0]);
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("keyboard navigation", () => {
    it("ArrowRight moves focus to next tab", () => {
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
      tabs[0]?.focus();
      fireEvent.keyDown(nav, { key: "ArrowRight" });
      expect(tabs[1]).toHaveAttribute("tabindex", "0");
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
      tabs[1]?.focus();
      fireEvent.keyDown(nav, { key: "ArrowLeft" });
      expect(tabs[0]).toHaveAttribute("tabindex", "0");
    });

    it("Home moves focus to first tab", () => {
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
      tabs[2]?.focus();
      fireEvent.keyDown(nav, { key: "Home" });
      expect(tabs[0]).toHaveAttribute("tabindex", "0");
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
      tabs[0]?.focus();
      fireEvent.keyDown(nav, { key: "End" });
      expect(tabs[2]).toHaveAttribute("tabindex", "0");
    });

    it("ArrowRight wraps around to first tab from last", () => {
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
      tabs[2]?.focus();
      fireEvent.keyDown(nav, { key: "ArrowRight" });
      expect(tabs[0]).toHaveAttribute("tabindex", "0");
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
      expect(tabs).toHaveLength(30);
      // overflow container must exist (data-testid)
      const bar = screen.getByTestId("entity-sub-nav-bar");
      expect(bar).toBeInTheDocument();
    });
  });

  describe("+ buyer add affordance", () => {
    it("renders + buyer button when addLeaf prop provided", () => {
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

    it("+ buyer is aria-disabled in directory mode", () => {
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
      const allTabs = screen.getAllByRole("tab");
      // All should be disabled including + buyer
      allTabs.forEach((tab) => {
        expect(tab).toHaveAttribute("aria-disabled", "true");
      });
    });
  });
});
