/**
 * ConfigTab.test.tsx — Unit tests for ConfigTab molecule
 * T-2 of vitalia-fase1-ribbon-6-tabs (F1-S7)
 * TDD RED-first per tdd-mandatory.md
 *
 * gherkin_coverage:
 * - SC-3 happy · ConfigTab renders Settings icon + aria-label="Configurar" + role="tab"
 * - SC-3 happy · ConfigTab active state visual (bg-muted + ring-1 ring-border)
 * - SC-3 happy · ConfigTab inactive state
 * - Q13 cement · role="tab" + aria-selected attribute present
 * - Callback props · onClick + onFocus fired correctly
 * - forwardRef · ref forwarded to HTMLButtonElement
 * - tabIndex passthrough · 0 or -1
 * - Tooltip "Configurar" content present in DOM (Radix renders in portal)
 *
 * Spec: 01-spec.md § Estados visuales ConfigTab · 03-arch.md § 2.4
 * Named export (NO default) per FSD-Lite enforce.
 *
 * downstream-regression-na: brand-local shell-organism test; no cross-brand consumers
 */

import { createRef } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfigTab } from "./ConfigTab";

describe("ConfigTab — render básico (SC-3 happy)", () => {
  it("data-testid='ribbon-config-tab' attribute present", () => {
    render(
      <ConfigTab
        active={false}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    expect(screen.getByTestId("ribbon-config-tab")).toBeDefined();
  });

  it("aria-label='Configurar'", () => {
    render(
      <ConfigTab
        active={false}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const btn = screen.getByRole("tab");
    expect(btn.getAttribute("aria-label")).toBe("Plataforma");
  });

  it("renders <button role='tab'>", () => {
    render(
      <ConfigTab
        active={false}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const tab = screen.getByRole("tab");
    expect(tab.tagName.toLowerCase()).toBe("button");
  });
});

describe("ConfigTab — Q13 cement: WAI-ARIA tablist peer", () => {
  it("role='tab' present on button", () => {
    render(
      <ConfigTab
        active={false}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    expect(screen.getByRole("tab")).toBeDefined();
  });

  it("aria-selected attribute present (false when inactive)", () => {
    render(
      <ConfigTab
        active={false}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const tab = screen.getByRole("tab");
    expect(tab.hasAttribute("aria-selected")).toBe(true);
    expect(tab.getAttribute("aria-selected")).toBe("false");
  });

  it("aria-selected='true' when active", () => {
    render(
      <ConfigTab
        active={true}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const tab = screen.getByRole("tab");
    expect(tab.getAttribute("aria-selected")).toBe("true");
  });
});

describe("ConfigTab — active state", () => {
  it("active=true → data-active='true'", () => {
    render(
      <ConfigTab
        active={true}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const tab = screen.getByTestId("ribbon-config-tab");
    expect(tab.getAttribute("data-active")).toBe("true");
  });

  it("active=true → className contains 'ring-1'", () => {
    render(
      <ConfigTab
        active={true}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const tab = screen.getByTestId("ribbon-config-tab");
    expect(tab.className).toContain("ring-1");
  });

  it("active=true → className contains 'ring-border'", () => {
    render(
      <ConfigTab
        active={true}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const tab = screen.getByTestId("ribbon-config-tab");
    expect(tab.className).toContain("ring-border");
  });
});

describe("ConfigTab — inactive state", () => {
  it("active=false → data-active='false'", () => {
    render(
      <ConfigTab
        active={false}
        tabIndex={-1}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const tab = screen.getByTestId("ribbon-config-tab");
    expect(tab.getAttribute("data-active")).toBe("false");
  });

  it("active=false → className contains 'text-muted-foreground'", () => {
    render(
      <ConfigTab
        active={false}
        tabIndex={-1}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const tab = screen.getByTestId("ribbon-config-tab");
    expect(tab.className).toContain("text-muted-foreground");
  });
});

describe("ConfigTab — tabIndex passthrough", () => {
  it("tabIndex=0 set on button", () => {
    render(
      <ConfigTab
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
      <ConfigTab
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

describe("ConfigTab — callbacks", () => {
  it("onClick callback fired on click", () => {
    const handleClick = vi.fn();
    render(
      <ConfigTab
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
      <ConfigTab
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

describe("ConfigTab — forwardRef", () => {
  it("ref forwarded to HTMLButtonElement", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <ConfigTab
        ref={ref}
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

describe("ConfigTab — Tooltip 'Plataforma' content (v1.2 — renamed from Configurar)", () => {
  it("Tooltip content 'Plataforma' present in DOM", () => {
    // v1.2 (2026-05-30): ConfigTab label renamed 'Configurar' → 'Plataforma'
    // Radix TooltipContent renders in a portal. In happy-dom environment
    // Radix portals attach to document.body. We verify the text is rendered
    // when the tooltip is mounted (Radix renders even if not visually visible).
    const { baseElement } = render(
      <ConfigTab
        active={false}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    // Trigger hover/focus to open tooltip
    const tab = screen.getByRole("tab");
    fireEvent.focus(tab);
    // Radix may render tooltip in portal — check baseElement (full document)
    // In test env with happy-dom, Radix portals are accessible via baseElement
    expect(baseElement.textContent).toContain("Plataforma");
  });
});
