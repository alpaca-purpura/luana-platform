/**
 * RibbonTab.test.tsx — Unit tests for RibbonTab molecule
 * T-2 of vitalia-fase1-ribbon-6-tabs (F1-S7)
 * TDD RED-first per tdd-mandatory.md
 *
 * gherkin_coverage:
 * - SC-1 happy · RibbonTab renders avatar + tabLabel + role sub-label
 * - SC-1 happy · RibbonTab active state visual (bg-agent-*-soft + font-semibold)
 * - SC-1 happy · RibbonTab inactive state (text-muted-foreground + font-medium)
 * - SC-9 avatar fallback · AvatarFallback initial letter when PNG 404
 * - Callback props · onClick + onFocus fired correctly
 * - forwardRef · ref forwarded to HTMLButtonElement
 * - tabIndex passthrough · 0 or -1
 * - aria-selected sync with active prop
 * - Q15 cement · whitespace-nowrap on label spans
 *
 * Spec: 01-spec.md § Estados visuales · 03-arch.md § 2.3
 * Named export (NO default) per FSD-Lite enforce.
 *
 * downstream-regression-na: brand-local shell-organism test; no cross-brand consumers
 */

import { createRef } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RibbonTab } from "./RibbonTab";
import { AGENT_CATALOG } from "@/lib/agent-catalog";
import { agentBgSoftClass } from "./_agent-tw-classes";

// Mock next/navigation — not used in RibbonTab but imports from _agent-tw-classes might chain
// No navigation imports in RibbonTab itself — no mock needed

describe("RibbonTab — render básico (SC-1 happy)", () => {
  it("data-testid='ribbon-tab-lisa' attribute present", () => {
    render(
      <RibbonTab
        slug="lisa"
        active={false}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    expect(screen.getByTestId("ribbon-tab-lisa")).toBeDefined();
  });

  it("renders <button role='tab'>", () => {
    render(
      <RibbonTab
        slug="lisa"
        active={false}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const tab = screen.getByRole("tab");
    expect(tab).toBeDefined();
    expect(tab.tagName.toLowerCase()).toBe("button");
  });

  it("renders AGENT_CATALOG[slug].tabLabel as visible text", () => {
    render(
      <RibbonTab
        slug="lisa"
        active={false}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    expect(screen.getByText(AGENT_CATALOG.lisa.tabLabel)).toBeDefined();
  });

  it("renders AGENT_CATALOG[slug].name as role sub-label", () => {
    render(
      <RibbonTab
        slug="valeria"
        active={false}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    expect(screen.getByText(AGENT_CATALOG.valeria.name)).toBeDefined();
  });

  it("Avatar root container rendered (data-slot='avatar')", () => {
    const { container } = render(
      <RibbonTab
        slug="lucas"
        active={false}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    // Radix Avatar root always renders — verify it is present
    // (AvatarImage relies on image loading which doesn't occur in happy-dom)
    const avatarRoot = container.querySelector("[data-slot='avatar']");
    expect(avatarRoot).not.toBeNull();
  });
});

describe("RibbonTab — active state (SC-1 happy)", () => {
  it("active=true → data-active='true'", () => {
    render(
      <RibbonTab
        slug="lisa"
        active={true}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const tab = screen.getByTestId("ribbon-tab-lisa");
    expect(tab.getAttribute("data-active")).toBe("true");
  });

  it("active=true → aria-selected=true", () => {
    render(
      <RibbonTab
        slug="lisa"
        active={true}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const tab = screen.getByRole("tab");
    expect(tab.getAttribute("aria-selected")).toBe("true");
  });

  it("active=true → className contains agentBgSoftClass(slug)", () => {
    render(
      <RibbonTab
        slug="lisa"
        active={true}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const tab = screen.getByTestId("ribbon-tab-lisa");
    expect(tab.className).toContain(agentBgSoftClass("lisa"));
  });

  it("active=true → className contains 'font-semibold'", () => {
    render(
      <RibbonTab
        slug="lisa"
        active={true}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const tab = screen.getByTestId("ribbon-tab-lisa");
    expect(tab.className).toContain("font-semibold");
  });

  it("active=true → className contains 'text-foreground'", () => {
    render(
      <RibbonTab
        slug="camila"
        active={true}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const tab = screen.getByTestId("ribbon-tab-camila");
    expect(tab.className).toContain("text-foreground");
  });
});

describe("RibbonTab — inactive state", () => {
  it("active=false → data-active='false'", () => {
    render(
      <RibbonTab
        slug="adrian"
        active={false}
        tabIndex={-1}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const tab = screen.getByTestId("ribbon-tab-adrian");
    expect(tab.getAttribute("data-active")).toBe("false");
  });

  it("active=false → aria-selected=false", () => {
    render(
      <RibbonTab
        slug="adrian"
        active={false}
        tabIndex={-1}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const tab = screen.getByRole("tab");
    expect(tab.getAttribute("aria-selected")).toBe("false");
  });

  it("active=false → className contains 'text-muted-foreground'", () => {
    render(
      <RibbonTab
        slug="lucas"
        active={false}
        tabIndex={-1}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const tab = screen.getByTestId("ribbon-tab-lucas");
    expect(tab.className).toContain("text-muted-foreground");
  });

  it("active=false → className contains 'font-medium'", () => {
    render(
      <RibbonTab
        slug="valeria"
        active={false}
        tabIndex={-1}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const tab = screen.getByTestId("ribbon-tab-valeria");
    expect(tab.className).toContain("font-medium");
  });
});

describe("RibbonTab — tabIndex passthrough", () => {
  it("tabIndex=0 set on button", () => {
    render(
      <RibbonTab
        slug="lisa"
        active={false}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const tab = screen.getByRole("tab");
    expect(tab.getAttribute("tabindex")).toBe("0");
  });

  it("tabIndex=-1 set on button", () => {
    render(
      <RibbonTab
        slug="lucas"
        active={false}
        tabIndex={-1}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const tab = screen.getByRole("tab");
    expect(tab.getAttribute("tabindex")).toBe("-1");
  });
});

describe("RibbonTab — callbacks", () => {
  it("onClick callback fired on click", () => {
    const handleClick = vi.fn();
    render(
      <RibbonTab
        slug="lisa"
        active={false}
        tabIndex={0}
        onClick={handleClick}
        onFocus={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("tab"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("onFocus callback fired on focus", () => {
    const handleFocus = vi.fn();
    render(
      <RibbonTab
        slug="lisa"
        active={false}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={handleFocus}
      />,
    );
    fireEvent.focus(screen.getByRole("tab"));
    expect(handleFocus).toHaveBeenCalledTimes(1);
  });
});

describe("RibbonTab — forwardRef", () => {
  it("ref forwarded to HTMLButtonElement", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <RibbonTab
        ref={ref}
        slug="valeria"
        active={false}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName.toLowerCase()).toBe("button");
  });
});

describe("RibbonTab — Q15 whitespace-nowrap cement", () => {
  it("tabLabel span has whitespace-nowrap class", () => {
    const { container } = render(
      <RibbonTab
        slug="lisa"
        active={false}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    // Find the span containing tabLabel text
    const tabLabelSpan = container.querySelector(`span.whitespace-nowrap`);
    expect(tabLabelSpan).not.toBeNull();
  });

  it("role sub-label span has whitespace-nowrap class", () => {
    const { container } = render(
      <RibbonTab
        slug="lisa"
        active={false}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const spans = container.querySelectorAll("span.whitespace-nowrap");
    // Both tabLabel span and name sub-label span should have whitespace-nowrap
    expect(spans.length).toBeGreaterThanOrEqual(2);
  });
});

describe("RibbonTab — SC-9 avatar fallback", () => {
  it("AvatarFallback contains initial letter", () => {
    const { container } = render(
      <RibbonTab
        slug="lisa"
        active={false}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    // Radix AvatarFallback renders with data-slot="avatar-fallback"
    const fallback = container.querySelector("[data-slot='avatar-fallback']");
    expect(fallback).not.toBeNull();
    expect(fallback?.textContent).toBe(AGENT_CATALOG.lisa.initial);
  });

  it("AvatarFallback has agentBgSoftClass(slug) in className", () => {
    const { container } = render(
      <RibbonTab
        slug="lucas"
        active={false}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const fallback = container.querySelector("[data-slot='avatar-fallback']");
    expect(fallback?.className).toContain(agentBgSoftClass("lucas"));
  });
});
