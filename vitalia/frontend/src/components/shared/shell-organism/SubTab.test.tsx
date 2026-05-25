/**
 * SubTab.test.tsx — SubTab molécula unit tests (F1-S8 T-3 TDD mandatory)
 *
 * gherkin_coverage per 06-tickets.yaml T-3:
 * SC-1 happy: renders button + emoji + label · active/inactive states
 * SC-1/Lucas exception: active → bg-agent-lucas-soft + text-foreground (NOT text-agent-lucas)
 * SC-1/Config exception: active → bg-muted + text-foreground
 * SC-8 a11y: tabIndex + focus-visible ring + aria-selected + aria-hidden emoji
 * forwardRef contract: ref.current is HTMLButtonElement
 * SC-7 adversarial: XSS guard label rendered as text
 * agentTextClassSubTab inline import verify (T-2 integration)
 *
 * spec_anchor: 01-spec.md § Componentes (SubTab) + § Estados visuales · 03-arch.md § 2.3
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { createRef } from "react";
import { SubTab } from "./SubTab";
import { agentTextClassSubTab } from "./_agent-tw-classes";
import type { SubTabMeta } from "@/lib/agent-catalog";

const MARCA_SUBTAB: SubTabMeta = {
  id: "marca",
  label: "Marca",
  icon: "🏥",
};

const DOCTORES_SUBTAB: SubTabMeta = {
  id: "doctores",
  label: "Doctores",
  icon: "👨‍⚕️",
};

// ──────────────────────────────────────────────────────────────────────────────
// agentTextClassSubTab inline verification (T-2 integration — cited in T-3 gherkin)
// ──────────────────────────────────────────────────────────────────────────────

describe("agentTextClassSubTab — imported from _agent-tw-classes (T-2 integration verify)", () => {
  it("agentTextClassSubTab('lisa') === 'text-agent-lisa'", () => {
    expect(agentTextClassSubTab("lisa")).toBe("text-agent-lisa");
  });

  it("agentTextClassSubTab('adrian') === 'text-agent-adrian'", () => {
    expect(agentTextClassSubTab("adrian")).toBe("text-agent-adrian");
  });

  it("agentTextClassSubTab('valeria') === 'text-agent-valeria'", () => {
    expect(agentTextClassSubTab("valeria")).toBe("text-agent-valeria");
  });

  it("agentTextClassSubTab('camila') === 'text-agent-camila'", () => {
    expect(agentTextClassSubTab("camila")).toBe("text-agent-camila");
  });

  it("agentTextClassSubTab('lucas') === 'text-foreground' (NO 'text-agent-lucas' — contrast issue near-black on rgba 10% black bg)", () => {
    expect(agentTextClassSubTab("lucas")).toBe("text-foreground");
  });

  it("agentTextClassSubTab('config') === 'text-foreground' (Config no es agente — bg-muted neutral)", () => {
    expect(agentTextClassSubTab("config")).toBe("text-foreground");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SC-1 — renders button + emoji + label
// ──────────────────────────────────────────────────────────────────────────────

describe("SubTab — renders button + emoji + label (SC-1)", () => {
  it("renders <button role='tab'> with data-testid=`sub-tab-${subtab.id}`", () => {
    render(
      <SubTab
        subtab={MARCA_SUBTAB}
        color="lisa"
        active={false}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const btn = screen.getByRole("tab");
    expect(btn).toBeDefined();
    expect(btn.getAttribute("data-testid")).toBe("sub-tab-marca");
  });

  it("renders emoji span aria-hidden='true' (decorative — no double-narration with label)", () => {
    render(
      <SubTab
        subtab={MARCA_SUBTAB}
        color="lisa"
        active={false}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const btn = screen.getByRole("tab");
    // Emoji span is aria-hidden — not accessible by role; check DOM
    const emojiSpan = btn.querySelector('[aria-hidden="true"]');
    expect(emojiSpan).not.toBeNull();
    expect(emojiSpan!.textContent).toBe("🏥");
  });

  it("renders label span with subtab.label text", () => {
    render(
      <SubTab
        subtab={MARCA_SUBTAB}
        color="lisa"
        active={false}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    expect(screen.getByText("Marca")).toBeDefined();
  });

  it("data-color='{slug}' attribute reflects color prop", () => {
    render(
      <SubTab
        subtab={MARCA_SUBTAB}
        color="valeria"
        active={false}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const btn = screen.getByRole("tab");
    expect(btn.getAttribute("data-color")).toBe("valeria");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SC-1 / SC-3 — active state standard agents (Lisa/Adrián/Valeria/Camila)
// ──────────────────────────────────────────────────────────────────────────────

describe("SubTab — active state standard agents (SC-1 / SC-3)", () => {
  it("color='lisa' + active=true → className contains 'bg-agent-lisa-soft' + 'text-agent-lisa' + 'font-semibold'", () => {
    render(
      <SubTab
        subtab={MARCA_SUBTAB}
        color="lisa"
        active={true}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const btn = screen.getByRole("tab");
    const cls = btn.className;
    expect(cls).toContain("bg-agent-lisa-soft");
    expect(cls).toContain("text-agent-lisa");
    expect(cls).toContain("font-semibold");
  });

  it("color='camila' + active=true → className contains 'bg-agent-camila-soft' + 'text-agent-camila'", () => {
    render(
      <SubTab
        subtab={MARCA_SUBTAB}
        color="camila"
        active={true}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const btn = screen.getByRole("tab");
    const cls = btn.className;
    expect(cls).toContain("bg-agent-camila-soft");
    expect(cls).toContain("text-agent-camila");
  });

  it("color='valeria' + active=true → className contains 'bg-agent-valeria-soft' + 'text-agent-valeria'", () => {
    render(
      <SubTab
        subtab={MARCA_SUBTAB}
        color="valeria"
        active={true}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const btn = screen.getByRole("tab");
    const cls = btn.className;
    expect(cls).toContain("bg-agent-valeria-soft");
    expect(cls).toContain("text-agent-valeria");
  });

  it("active=true → aria-selected='true' + data-active='true' attributes", () => {
    render(
      <SubTab
        subtab={MARCA_SUBTAB}
        color="lisa"
        active={true}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const btn = screen.getByRole("tab");
    expect(btn.getAttribute("aria-selected")).toBe("true");
    expect(btn.getAttribute("data-active")).toBe("true");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SC-1 — Lucas exception active state (text-foreground)
// ──────────────────────────────────────────────────────────────────────────────

describe("SubTab — Lucas exception active state (F1-S8 D18)", () => {
  it("color='lucas' + active=true → className contains 'bg-agent-lucas-soft' + 'text-foreground' (NO 'text-agent-lucas' — Lucas exception per § 3 D18)", () => {
    render(
      <SubTab
        subtab={{ id: "lanzar", label: "Lanzar", icon: "🚀" }}
        color="lucas"
        active={true}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const btn = screen.getByRole("tab");
    const cls = btn.className;
    expect(cls).toContain("bg-agent-lucas-soft");
    expect(cls).toContain("text-foreground");
    expect(cls).not.toContain("text-agent-lucas");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SC-1 — Config exception active state (bg-muted + text-foreground)
// ──────────────────────────────────────────────────────────────────────────────

describe("SubTab — Config exception active state (F1-S8 D19)", () => {
  it("color='config' + active=true → className contains 'bg-muted' + 'text-foreground' (Config no es agente — neutral mockup ratificado)", () => {
    render(
      <SubTab
        subtab={{ id: "cuenta", label: "Mi cuenta", icon: "🏢" }}
        color="config"
        active={true}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const btn = screen.getByRole("tab");
    const cls = btn.className;
    expect(cls).toContain("bg-muted");
    expect(cls).toContain("text-foreground");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SC-1 — inactive state visual
// ──────────────────────────────────────────────────────────────────────────────

describe("SubTab — inactive state visual (SC-1)", () => {
  it("active=false → className contains 'text-muted-foreground' + 'font-medium'", () => {
    render(
      <SubTab
        subtab={MARCA_SUBTAB}
        color="lisa"
        active={false}
        tabIndex={-1}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const btn = screen.getByRole("tab");
    const cls = btn.className;
    expect(cls).toContain("text-muted-foreground");
    expect(cls).toContain("font-medium");
  });

  it("active=false → className contains 'hover:bg-muted' + 'hover:text-foreground'", () => {
    render(
      <SubTab
        subtab={MARCA_SUBTAB}
        color="lisa"
        active={false}
        tabIndex={-1}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const btn = screen.getByRole("tab");
    const cls = btn.className;
    expect(cls).toContain("hover:bg-muted");
    expect(cls).toContain("hover:text-foreground");
  });

  it("active=false → aria-selected='false' + data-active='false'", () => {
    render(
      <SubTab
        subtab={MARCA_SUBTAB}
        color="lisa"
        active={false}
        tabIndex={-1}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const btn = screen.getByRole("tab");
    expect(btn.getAttribute("aria-selected")).toBe("false");
    expect(btn.getAttribute("data-active")).toBe("false");
  });

  it("any agent slug inactive class structure identical (color-agnostic when inactive)", () => {
    const { rerender } = render(
      <SubTab
        subtab={MARCA_SUBTAB}
        color="lisa"
        active={false}
        tabIndex={-1}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const lisaInactiveCls = screen.getByRole("tab").className;

    rerender(
      <SubTab
        subtab={MARCA_SUBTAB}
        color="camila"
        active={false}
        tabIndex={-1}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const camilaInactiveCls = screen.getByRole("tab").className;
    // Inactive state should be the same regardless of color (color-agnostic)
    expect(lisaInactiveCls).toBe(camilaInactiveCls);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Q16 paridad F1-S7 — active:hover preserves tint exception
// ──────────────────────────────────────────────────────────────────────────────

describe("SubTab — active:hover preserves tint (Q16 paridad F1-S7)", () => {
  it("color='lisa' + active=true → className contains hover that preserves bg-agent-lisa-soft (no competing hover:bg-muted in active branch)", () => {
    render(
      <SubTab
        subtab={MARCA_SUBTAB}
        color="lisa"
        active={true}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const btn = screen.getByRole("tab");
    const cls = btn.className;
    // Active branch must NOT contain hover:bg-muted (that's inactive only)
    expect(cls).not.toContain("hover:bg-muted");
    // Active branch has the agent-soft bg already providing the tint
    expect(cls).toContain("bg-agent-lisa-soft");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SC-8 a11y — tabIndex + focus-visible ring
// ──────────────────────────────────────────────────────────────────────────────

describe("SubTab — tabIndex + focus-visible ring (SC-8 a11y)", () => {
  it("tabIndex=0 prop → DOM attribute tabIndex='0'", () => {
    render(
      <SubTab
        subtab={MARCA_SUBTAB}
        color="lisa"
        active={true}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const btn = screen.getByRole("tab");
    expect(btn.getAttribute("tabindex")).toBe("0");
  });

  it("tabIndex=-1 prop → DOM attribute tabIndex='-1'", () => {
    render(
      <SubTab
        subtab={DOCTORES_SUBTAB}
        color="lisa"
        active={false}
        tabIndex={-1}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const btn = screen.getByRole("tab");
    expect(btn.getAttribute("tabindex")).toBe("-1");
  });

  it("className contains 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1'", () => {
    render(
      <SubTab
        subtab={MARCA_SUBTAB}
        color="lisa"
        active={false}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const btn = screen.getByRole("tab");
    const cls = btn.className;
    expect(cls).toContain("focus-visible:outline-none");
    expect(cls).toContain("focus-visible:ring-2");
    expect(cls).toContain("focus-visible:ring-ring");
    expect(cls).toContain("focus-visible:ring-offset-1");
  });

  it("no plain 'focus:' classes (only focus-visible — mouse-click no muestra ring)", () => {
    render(
      <SubTab
        subtab={MARCA_SUBTAB}
        color="lisa"
        active={false}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const btn = screen.getByRole("tab");
    // focus: without -visible should not appear (focus-visible: is allowed)
    const cls = btn.className;
    // Split by space, filter classes starting with "focus:" (not "focus-visible:")
    const plainFocusClasses = cls
      .split(" ")
      .filter((c) => c.startsWith("focus:"));
    expect(plainFocusClasses).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Layout classes
// ──────────────────────────────────────────────────────────────────────────────

describe("SubTab — layout classes (whitespace-nowrap + flex + px/py + rounded + text-sm)", () => {
  it("className contains 'whitespace-nowrap' (HARD — label NO wrap)", () => {
    render(
      <SubTab
        subtab={MARCA_SUBTAB}
        color="lisa"
        active={false}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const btn = screen.getByRole("tab");
    expect(btn.className).toContain("whitespace-nowrap");
  });

  it("className contains 'flex items-center gap-1.5' + 'px-3 py-1.5' + 'rounded-md' + 'text-sm'", () => {
    render(
      <SubTab
        subtab={MARCA_SUBTAB}
        color="lisa"
        active={false}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const btn = screen.getByRole("tab");
    const cls = btn.className;
    expect(cls).toContain("flex");
    expect(cls).toContain("items-center");
    expect(cls).toContain("gap-1.5");
    expect(cls).toContain("px-3");
    expect(cls).toContain("py-1.5");
    expect(cls).toContain("rounded-md");
    expect(cls).toContain("text-sm");
  });

  it("className contains 'transition-all' (smooth state transitions)", () => {
    render(
      <SubTab
        subtab={MARCA_SUBTAB}
        color="lisa"
        active={false}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    const btn = screen.getByRole("tab");
    expect(btn.className).toContain("transition-all");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SC-8 a11y — onClick + onFocus handlers
// ──────────────────────────────────────────────────────────────────────────────

describe("SubTab — onClick + onFocus handlers (SC-8 a11y)", () => {
  it("onClick mock called once when button clicked", () => {
    const mockClick = vi.fn();
    render(
      <SubTab
        subtab={MARCA_SUBTAB}
        color="lisa"
        active={false}
        tabIndex={0}
        onClick={mockClick}
        onFocus={vi.fn()}
      />,
    );
    const btn = screen.getByRole("tab");
    fireEvent.click(btn);
    expect(mockClick).toHaveBeenCalledTimes(1);
  });

  it("onClick mock receives synthetic event", () => {
    const mockClick = vi.fn();
    render(
      <SubTab
        subtab={MARCA_SUBTAB}
        color="lisa"
        active={false}
        tabIndex={0}
        onClick={mockClick}
        onFocus={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("tab"));
    expect(mockClick).toHaveBeenCalledWith(expect.any(Object));
  });

  it("onFocus mock called when button focused (parent SubTabsBar uses to track focusedIdx)", () => {
    const mockFocus = vi.fn();
    render(
      <SubTab
        subtab={MARCA_SUBTAB}
        color="lisa"
        active={false}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={mockFocus}
      />,
    );
    const btn = screen.getByRole("tab");
    fireEvent.focus(btn);
    expect(mockFocus).toHaveBeenCalledTimes(1);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// forwardRef contract
// ──────────────────────────────────────────────────────────────────────────────

describe("SubTab — forwardRef contract", () => {
  it("forwardRef pattern — ref.current is HTMLButtonElement when parent passes ref", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <SubTab
        ref={ref}
        subtab={MARCA_SUBTAB}
        color="lisa"
        active={false}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    expect(ref.current).not.toBeNull();
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SC-7 adversarial — XSS guard
// ──────────────────────────────────────────────────────────────────────────────

describe("SubTab — XSS guard (SC-7)", () => {
  it("no dangerouslySetInnerHTML usage (grep verifies — component uses JSX text nodes only)", () => {
    // Runtime check: label with XSS payload renders as literal text
    const xssSubtab: SubTabMeta = {
      id: "test",
      label: "<script>alert(1)</script>",
      icon: "⚠️",
    };
    render(
      <SubTab
        subtab={xssSubtab}
        color="lisa"
        active={false}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    // React JSX auto-escapes — no script tag injected
    const btn = screen.getByRole("tab");
    // The text is present as literal string, not as an HTML script element
    expect(btn.textContent).toContain("<script>alert(1)</script>");
    // And there's no actual <script> element in the DOM
    expect(document.querySelectorAll("script[data-test]").length).toBe(0);
  });

  it("subtab.label with '<script>alert(1)</script>' renders as literal text (React JSX auto-escape)", () => {
    const xssSubtab: SubTabMeta = {
      id: "xss-test",
      label: "<script>alert(1)</script>",
      icon: "⚠️",
    };
    const { container } = render(
      <SubTab
        subtab={xssSubtab}
        color="lisa"
        active={false}
        tabIndex={0}
        onClick={vi.fn()}
        onFocus={vi.fn()}
      />,
    );
    // Verify no actual <script> element was injected
    expect(container.querySelectorAll("script").length).toBe(0);
  });
});
