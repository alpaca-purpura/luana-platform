// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-3
/**
 * IcpCard.test.tsx — TDD tests for the IcpCard component.
 *
 * Covers:
 *   - Renders label + vertical + buyer count
 *   - Renders status badge (borrador | listo)
 *   - NO completeness ring (RN-8 — the spec removed the barra de completitud)
 *   - Correct href links to /{tenantId}/abel/icp/{icpId}
 *   - 200 ICPs: renders without layout break (SC-large perf smoke)
 *   - Accessible label (aria-label includes label + status)
 *   - G3 JIT-safe: no template literals in class strings (source scan)
 *   - Uses Link (not <a> tag)
 *
 * TDD RED-first per tdd-mandatory.md.
 * spec_anchor: 03-arch-fe.md §7 Estados visuales → lista (≥1 ICP)
 * validators_gate: RN-8 (NO completeness ring) + SC-large (200 ICPs)
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { readFileSync } from "fs";
import { resolve } from "path";

import { IcpCard } from "./IcpCard";
import type { IcpListItem } from "../../types/icp";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useParams: () => ({ tenantId: "tenant-test" }),
  useRouter: () => ({ push: vi.fn() }),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const icpBorrador: IcpListItem = {
  id: "icp-1",
  label: "Agencia de marketing mid-market",
  vertical: "Agencias de marketing",
  status: "borrador",
  buyerCount: 2,
};

const icpListo: IcpListItem = {
  id: "icp-2",
  label: "Consultora de software",
  vertical: null,
  status: "listo",
  buyerCount: 0,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("IcpCard — renders core data", () => {
  it("displays the ICP label", () => {
    render(<IcpCard icp={icpBorrador} />);
    expect(screen.getByText("Agencia de marketing mid-market")).toBeDefined();
  });

  it("displays the vertical when set", () => {
    render(<IcpCard icp={icpBorrador} />);
    expect(screen.getByText("Agencias de marketing")).toBeDefined();
  });

  it("does NOT show vertical placeholder when null", () => {
    render(<IcpCard icp={icpListo} />);
    // No vertical text — the element should be absent
    expect(screen.queryByText("null")).toBeNull();
  });

  it("displays buyer count (2 buyers)", () => {
    render(<IcpCard icp={icpBorrador} />);
    expect(screen.getByText("2 buyers")).toBeDefined();
  });

  it("displays '1 buyer' (singular) when count is 1", () => {
    const icpWithOneBuyer: IcpListItem = { ...icpBorrador, buyerCount: 1 };
    render(<IcpCard icp={icpWithOneBuyer} />);
    expect(screen.getByText("1 buyer")).toBeDefined();
  });

  it("displays 'Sin buyers' when count is 0", () => {
    render(<IcpCard icp={icpListo} />);
    expect(screen.getByText("Sin buyers")).toBeDefined();
  });
});

describe("IcpCard — status badge (borrador | listo)", () => {
  it("shows 'Borrador' badge for borrador status", () => {
    render(<IcpCard icp={icpBorrador} />);
    expect(screen.getByTestId("icp-card-status-icp-1")).toBeDefined();
    expect(screen.getByText("Borrador")).toBeDefined();
  });

  it("shows 'Listo' badge for listo status", () => {
    render(<IcpCard icp={icpListo} />);
    expect(screen.getByTestId("icp-card-status-icp-2")).toBeDefined();
    expect(screen.getByText("Listo")).toBeDefined();
  });
});

describe("IcpCard — NO completeness ring (RN-8)", () => {
  const CARD_PATH = resolve(__dirname, "./IcpCard.tsx");

  it("does NOT render .ring CSS class (completeness ring removed — RN-8)", () => {
    render(<IcpCard icp={icpBorrador} />);
    // No element with ring-related completeness data
    const ringElements = document.querySelectorAll('[class*="completeness"]');
    expect(ringElements.length).toBe(0);
  });

  it("source does NOT render completeness ring (no ring element/variable)", () => {
    const src = readFileSync(CARD_PATH, "utf-8");
    // The mockup had a .ring CSS class for completeness — must NOT be in JSX
    // (it can be in comments explaining why it's absent, but not in JSX className or data-*)
    expect(src).not.toMatch(/data-testid=["'].*ring/);
    // No CircularProgress or similar ring components
    expect(src).not.toContain("CircularProgress");
    expect(src).not.toContain("progress-ring");
    // No aria-valuenow or similar completeness progress attributes
    expect(src).not.toContain("aria-valuenow");
  });
});

describe("IcpCard — navigation", () => {
  it("links to /{tenantId}/abel/icp/{icpId}", () => {
    render(<IcpCard icp={icpBorrador} />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/tenant-test/abel/icp/icp-1");
  });

  it("uses data-testid attribute for card identification", () => {
    render(<IcpCard icp={icpBorrador} />);
    expect(screen.getByTestId("icp-card-icp-1")).toBeDefined();
  });
});

describe("IcpCard — accessibility", () => {
  it("has aria-label including label and status", () => {
    render(<IcpCard icp={icpBorrador} />);
    const link = screen.getByRole("link");
    const label = link.getAttribute("aria-label") ?? "";
    expect(label).toContain("Agencia de marketing mid-market");
    expect(label).toContain("Borrador");
  });
});

describe("IcpCard — SC-large (200 ICPs smoke test)", () => {
  it("renders 200 cards without throwing", () => {
    const items: IcpListItem[] = Array.from({ length: 200 }, (_, i) => ({
      id: `icp-${i}`,
      label: `ICP número ${i}`,
      vertical: i % 2 === 0 ? "Agencias" : null,
      status: i % 3 === 0 ? "listo" : "borrador",
      buyerCount: i % 5,
    }));

    expect(() => {
      items.forEach((icp) => {
        render(<IcpCard icp={icp} />);
      });
    }).not.toThrow();
  });
});

describe("IcpCard — G3 JIT-safe (no template literals in class strings)", () => {
  const CARD_PATH = resolve(__dirname, "./IcpCard.tsx");

  it("source does NOT use template literals for agent class strings", () => {
    const src = readFileSync(CARD_PATH, "utf-8");
    // Template literals in className = G3 violation
    // Detect `${agentSlug}` or similar in className context
    expect(src).not.toMatch(/className=\{`[^`]*\$\{agent/);
  });

  it("uses agentBgClass() from _agent-tw-classes.ts (G3 JIT-safe lookup)", () => {
    const src = readFileSync(CARD_PATH, "utf-8");
    expect(src).toContain("agentBgClass");
    expect(src).toContain("_agent-tw-classes");
  });
});
