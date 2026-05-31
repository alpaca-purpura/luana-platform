// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-4 (RED test — written before implementation)
/**
 * AgentAvatar — T-4 tests (RED first, TDD)
 *
 * Tests:
 * 1. Renders initial letter when avatar image fails (fallback E4 scenario)
 * 2. Renders img element when no error
 * 3. Has descriptive aria-label
 *
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { AgentAvatar } from "../../agents/AgentAvatar";

describe("AgentAvatar", () => {
  it("renders img element by default", () => {
    render(
      <AgentAvatar slug="luana" name="Luana" initial="L" thumbnail="/agents/luana/avatar.svg" />,
    );
    expect(screen.getByRole("img", { hidden: true })).toBeTruthy();
  });

  it("shows initial fallback when img fails to load (E4 fallback)", async () => {
    render(
      <AgentAvatar slug="luana" name="Luana" initial="L" thumbnail="/agents/luana/avatar.svg" />,
    );
    // Find the actual img element (aria-hidden)
    const { container } = render(
      <AgentAvatar slug="luana" name="Luana" initial="L" thumbnail="/agents/luana/avatar.svg" />,
    );
    const img = container.querySelector("img");
    expect(img).toBeTruthy();
    // Trigger error to exercise the fallback path
    if (img) {
      const { act } = await import("@testing-library/react");
      await act(async () => {
        fireEvent.error(img);
      });
    }
    // After error, the initial letter 'L' should replace img
    // The span with text "L" should be present in the re-rendered component
    expect(container.textContent).toContain("L");
  });

  it("has descriptive aria-label containing agent name", () => {
    render(
      <AgentAvatar slug="luana" name="Luana" initial="L" thumbnail="/agents/luana/avatar.svg" />,
    );
    // The container element should have aria-label with Luana
    const { container } = render(
      <AgentAvatar slug="luana" name="Luana" initial="L" thumbnail="/agents/luana/avatar.svg" />,
    );
    const el = container.firstChild as HTMLElement;
    const label = el?.getAttribute("aria-label") ?? "";
    expect(label.toLowerCase()).toContain("luana");
  });
});
