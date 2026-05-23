/**
 * TenantSwitcherSlot.test.tsx — Unit tests for TenantSwitcherSlot placeholder
 * F1-S2 vitalia-fase1-topbar-global — T-3 TDD RED-first
 *
 * TenantSwitcherSlot is a placeholder that returns null until F1-S3 ships.
 * Tests verify: named export, null render, no DOM output.
 *
 * downstream-regression-na: brand-local shell-organism test; no cross-brand consumers
 */

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TenantSwitcherSlot } from "./TenantSwitcherSlot";

describe("TenantSwitcherSlot — placeholder (F1-S3 pending)", () => {
  it("renders nothing (returns null)", () => {
    const { container } = render(<TenantSwitcherSlot />);
    expect(container.childNodes).toHaveLength(0);
  });

  it("is a named export (not default)", () => {
    expect(typeof TenantSwitcherSlot).toBe("function");
  });

  it("renders null when tenantName is provided (still placeholder)", () => {
    const { container } = render(
      <TenantSwitcherSlot tenantName="Aurora Dental" />,
    );
    expect(container.childNodes).toHaveLength(0);
  });
});
