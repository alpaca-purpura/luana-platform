/**
 * ValeriaChatSlot.test.tsx — Unit tests for ValeriaChatSlot placeholder
 * T-3 of vitalia-fase1-valeria-rail-history (F1-S5)
 * TDD RED-first per tdd-mandatory.md
 *
 * gherkin_coverage:
 * - (visual baseline) ValeriaChatSlot placeholder shape
 *   · ChatHeader avatar Valeria + nombre + status dot + 'En línea'
 *   · 4 skeleton bubbles alternated self-start/self-end
 *   · composer placeholder con id='valeria-composer-placeholder' tabIndex=0
 *   · label flotante 'CHATSLOT · F1-S6'
 *   · section role='region' aria-label='Chat con Valeria (próximamente)'
 *
 * Spec: 01-spec.md § 0 D6 + § 5 · 03-arch.md § 2.5 ValeriaChatSlot
 * Named export (NO default) per FSD-Lite enforce.
 *
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ValeriaChatSlot } from "./ValeriaChatSlot";

describe("ValeriaChatSlot — ChatHeader (visual baseline)", () => {
  it("ChatHeader avatar Valeria + nombre 'Valeria' + status dot + 'En línea'", () => {
    render(<ValeriaChatSlot />);
    // Avatar initial "V" is present
    const dom = document.body.textContent ?? "";
    expect(dom).toContain("Valeria");
    expect(dom).toContain("En línea");
  });

  it("status dot element present (green online indicator)", () => {
    render(<ValeriaChatSlot />);
    const statusDot = document.querySelector("[data-testid='valeria-status-dot']");
    expect(statusDot).not.toBeNull();
  });

  it("avatar element with initial 'V' rendered", () => {
    render(<ValeriaChatSlot />);
    const avatar = document.querySelector("[data-testid='valeria-avatar']");
    expect(avatar).not.toBeNull();
    expect(avatar?.textContent).toContain("V");
  });
});

describe("ValeriaChatSlot — skeleton bubbles (visual baseline)", () => {
  it("4 skeleton bubbles alternated self-start/self-end", () => {
    render(<ValeriaChatSlot />);
    const bubbles = document.querySelectorAll("[data-testid='skeleton-bubble']");
    expect(bubbles).toHaveLength(4);
  });

  it("odd skeleton bubbles have self-start alignment (received messages)", () => {
    render(<ValeriaChatSlot />);
    const bubbles = document.querySelectorAll("[data-testid='skeleton-bubble']");
    // Bubble 0 (index 0) = self-start (received)
    expect(bubbles[0]?.className).toContain("self-start");
  });

  it("even-indexed skeleton bubbles have self-end alignment (sent messages)", () => {
    render(<ValeriaChatSlot />);
    const bubbles = document.querySelectorAll("[data-testid='skeleton-bubble']");
    // Bubble 1 (index 1) = self-end (sent)
    expect(bubbles[1]?.className).toContain("self-end");
  });
});

describe("ValeriaChatSlot — composer placeholder (visual baseline)", () => {
  it("composer placeholder con id='valeria-composer-placeholder' tabIndex=0", () => {
    render(<ValeriaChatSlot />);
    const composer = document.getElementById("valeria-composer-placeholder");
    expect(composer).not.toBeNull();
    expect(composer?.getAttribute("tabindex")).toBe("0");
  });
});

describe("ValeriaChatSlot — label flotante + region (visual baseline)", () => {
  it("label flotante 'CHATSLOT · F1-S6' present in DOM", () => {
    render(<ValeriaChatSlot />);
    const dom = document.body.textContent ?? "";
    expect(dom).toContain("CHATSLOT · F1-S6");
  });

  it("section role='region' aria-label='Chat con Valeria (próximamente)'", () => {
    render(<ValeriaChatSlot />);
    const region = screen.getByRole("region", {
      name: "Chat con Valeria (próximamente)",
    });
    expect(region).toBeDefined();
  });

  it("data-testid='valeria-chat-slot' present", () => {
    render(<ValeriaChatSlot />);
    expect(document.querySelector("[data-testid='valeria-chat-slot']")).not.toBeNull();
  });
});

describe("ValeriaChatSlot — named export contract", () => {
  it("is a named export function (not default)", () => {
    expect(typeof ValeriaChatSlot).toBe("function");
  });
});
