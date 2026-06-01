// cap: clinics.lisa.doctores
// story-origin: vitalia-fase2-lisa-doctores
/**
 * EntitySubNavBar.test.tsx — Tests for N3-dynamic entity workspace navigation.
 *
 * TDD RED-first: tests written before implementation per tdd-mandatory.md.
 *
 * Covers:
 *   - WAI-ARIA role=tablist + role=tab
 *   - Roving tabindex (only active tab has tabIndex=0)
 *   - Arrow key navigation (Left/Right)
 *   - Disabled leaves when entity=null (aria-disabled + tabIndex=-1)
 *   - Active leaf derived from activeLeaf prop
 *   - Back link rendered correctly
 *
 * V-ARCH-9 validator gate.
 * T-FE-2 vitalia-fase2-lisa-doctores
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EntitySubNavBar } from "./EntitySubNavBar";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/tenant-123/lisa/staff/doc-456",
}));

const defaultLeaves = [
  { id: "perfil", label: "Perfil", href: "/tenant-123/lisa/staff/doc-456/perfil" },
  { id: "horarios", label: "Horarios", href: "/tenant-123/lisa/staff/doc-456/horarios" },
  { id: "servicios", label: "Servicios", href: "/tenant-123/lisa/staff/doc-456/servicios" },
];

const defaultEntity = {
  id: "doc-456",
  name: "Dr. García",
  avatarUrl: null,
};

describe("EntitySubNavBar", () => {
  describe("with entity present (workspace mode)", () => {
    it("renders a nav with role=tablist", () => {
      render(
        <EntitySubNavBar
          rootHref="/tenant-123/lisa/staff"
          rootLabel="Staff"
          entity={defaultEntity}
          leaves={defaultLeaves}
          activeLeaf="perfil"
        />,
      );
      expect(screen.getByRole("tablist")).toBeInTheDocument();
    });

    it("renders all leaves as tab buttons", () => {
      render(
        <EntitySubNavBar
          rootHref="/tenant-123/lisa/staff"
          rootLabel="Staff"
          entity={defaultEntity}
          leaves={defaultLeaves}
          activeLeaf="perfil"
        />,
      );
      const tabs = screen.getAllByRole("tab");
      expect(tabs).toHaveLength(3);
      expect(tabs[0]).toHaveTextContent("Perfil");
      expect(tabs[1]).toHaveTextContent("Horarios");
      expect(tabs[2]).toHaveTextContent("Servicios");
    });

    it("marks active leaf with aria-selected=true", () => {
      render(
        <EntitySubNavBar
          rootHref="/tenant-123/lisa/staff"
          rootLabel="Staff"
          entity={defaultEntity}
          leaves={defaultLeaves}
          activeLeaf="horarios"
        />,
      );
      const tabs = screen.getAllByRole("tab");
      expect(tabs[1]).toHaveAttribute("aria-selected", "true");
      expect(tabs[0]).toHaveAttribute("aria-selected", "false");
    });

    it("uses roving tabindex — only focused tab has tabIndex=0", () => {
      render(
        <EntitySubNavBar
          rootHref="/tenant-123/lisa/staff"
          rootLabel="Staff"
          entity={defaultEntity}
          leaves={defaultLeaves}
          activeLeaf="perfil"
        />,
      );
      const tabs = screen.getAllByRole("tab");
      // Active tab (perfil = idx 0) should have tabIndex=0
      expect(tabs[0]).toHaveAttribute("tabindex", "0");
      expect(tabs[1]).toHaveAttribute("tabindex", "-1");
      expect(tabs[2]).toHaveAttribute("tabindex", "-1");
    });

    it("leaves are NOT aria-disabled when entity is present", () => {
      render(
        <EntitySubNavBar
          rootHref="/tenant-123/lisa/staff"
          rootLabel="Staff"
          entity={defaultEntity}
          leaves={defaultLeaves}
          activeLeaf="perfil"
        />,
      );
      const tabs = screen.getAllByRole("tab");
      tabs.forEach((tab) => {
        expect(tab).not.toHaveAttribute("aria-disabled", "true");
      });
    });

    it("renders entity name", () => {
      render(
        <EntitySubNavBar
          rootHref="/tenant-123/lisa/staff"
          rootLabel="Staff"
          entity={defaultEntity}
          leaves={defaultLeaves}
          activeLeaf="perfil"
        />,
      );
      expect(screen.getByText("Dr. García")).toBeInTheDocument();
    });

    it("renders back link to root", () => {
      render(
        <EntitySubNavBar
          rootHref="/tenant-123/lisa/staff"
          rootLabel="Staff"
          entity={defaultEntity}
          leaves={defaultLeaves}
          activeLeaf="perfil"
        />,
      );
      const backLink = screen.getByRole("link", { name: /staff/i });
      expect(backLink).toHaveAttribute("href", "/tenant-123/lisa/staff");
    });
  });

  describe("with entity=null (directory mode)", () => {
    it("renders leaves as aria-disabled", () => {
      render(
        <EntitySubNavBar
          rootHref="/tenant-123/lisa/staff"
          rootLabel="Staff"
          entity={null}
          leaves={defaultLeaves}
          activeLeaf={null}
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
          rootHref="/tenant-123/lisa/staff"
          rootLabel="Staff"
          entity={null}
          leaves={defaultLeaves}
          activeLeaf={null}
        />,
      );
      const tabs = screen.getAllByRole("tab");
      tabs.forEach((tab) => {
        expect(tab).toHaveAttribute("tabindex", "-1");
      });
    });
  });

  describe("keyboard navigation", () => {
    it("ArrowRight moves focus to next tab", () => {
      render(
        <EntitySubNavBar
          rootHref="/tenant-123/lisa/staff"
          rootLabel="Staff"
          entity={defaultEntity}
          leaves={defaultLeaves}
          activeLeaf="perfil"
        />,
      );
      const nav = screen.getByRole("tablist");
      const tabs = screen.getAllByRole("tab");
      // Focus the first tab
      tabs[0]?.focus();
      fireEvent.keyDown(nav, { key: "ArrowRight" });
      // After ArrowRight from index 0, focused should move to index 1
      expect(tabs[1]).toHaveAttribute("tabindex", "0");
    });

    it("ArrowLeft moves focus to previous tab", () => {
      render(
        <EntitySubNavBar
          rootHref="/tenant-123/lisa/staff"
          rootLabel="Staff"
          entity={defaultEntity}
          leaves={defaultLeaves}
          activeLeaf="horarios"
        />,
      );
      const nav = screen.getByRole("tablist");
      const tabs = screen.getAllByRole("tab");
      // Focus the second tab (horarios)
      tabs[1]?.focus();
      fireEvent.keyDown(nav, { key: "ArrowLeft" });
      expect(tabs[0]).toHaveAttribute("tabindex", "0");
    });
  });
});
