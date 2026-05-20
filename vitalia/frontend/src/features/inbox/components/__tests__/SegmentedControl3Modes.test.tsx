/**
 * SegmentedControl3Modes.test.tsx — Unit tests for SegmentedControl3Modes.
 *
 * Gherkin coverage per 06-tickets.yaml:
 *   SC-01: test_3_states_aria_radiogroup — renders 3 buttons, role=radiogroup,
 *           each button has role=radio + aria-checked.
 *   SC-01: test_onchange_dispatches_set_mode — clicking segment calls onChange.
 *   SC-03: test_optimistic_rollback_on_409 — isConflict=true shows conflict state.
 *
 * downstream-regression-na: brand-local FE test; no cross-brand consumers
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SegmentedControl3Modes } from "../SegmentedControl3Modes";
import { INBOX_COPY } from "../../copy";
import type { SegmentedModeValue } from "../../hooks/use-mode-toggle";

describe("SegmentedControl3Modes — SC-01 3-state aria-radiogroup", () => {
  it("test_3_states_aria_radiogroup: renders container with role=radiogroup", () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl3Modes
        value="adrian-decide"
        onChange={onChange}
      />
    );
    const group = screen.getByRole("radiogroup");
    expect(group).toBeDefined();
    expect(group.getAttribute("aria-label")).toBe(
      INBOX_COPY.segmentedMode.ariaLabel
    );
  });

  it("test_3_states_aria_radiogroup: renders 3 radio buttons", () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl3Modes
        value="adrian-decide"
        onChange={onChange}
      />
    );
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(3);
  });

  it("test_3_states_aria_radiogroup: active segment has aria-checked=true, others false", () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl3Modes
        value="adrian-consulta"
        onChange={onChange}
      />
    );
    const radios = screen.getAllByRole("radio");
    const checkedStates = radios.map((r) => r.getAttribute("aria-checked"));
    // Only "adrian-consulta" (index 1) should be checked
    expect(checkedStates[0]).toBe("false");
    expect(checkedStates[1]).toBe("true");
    expect(checkedStates[2]).toBe("false");
  });

  it("test_3_states_aria_radiogroup: segment labels match INBOX_COPY", () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl3Modes
        value="yo-escribo"
        onChange={onChange}
      />
    );
    expect(
      screen.getByTestId("segment-adrian-decide")
    ).toBeDefined();
    expect(
      screen.getByTestId("segment-adrian-consulta")
    ).toBeDefined();
    expect(
      screen.getByTestId("segment-yo-escribo")
    ).toBeDefined();
    // Check label text via INBOX_COPY
    expect(
      screen.getByTestId("segment-adrian-decide").textContent
    ).toContain(INBOX_COPY.segmentedMode.adrianDecide);
  });

  it("test_onchange_dispatches_set_mode: clicking inactive segment calls onChange with new value", () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl3Modes
        value="adrian-decide"
        onChange={onChange}
      />
    );
    // Click "Adrián consulta" (currently inactive)
    fireEvent.click(screen.getByTestId("segment-adrian-consulta"));
    expect(onChange).toHaveBeenCalledTimes(1);
    const expected: SegmentedModeValue = "adrian-consulta";
    expect(onChange).toHaveBeenCalledWith(expected);
  });

  it("test_onchange_dispatches_set_mode: clicking already active segment does NOT call onChange", () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl3Modes
        value="adrian-decide"
        onChange={onChange}
      />
    );
    // Click the active segment
    fireEvent.click(screen.getByTestId("segment-adrian-decide"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("test_onchange_dispatches_set_mode: yo-escribo segment calls onChange correctly", () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl3Modes
        value="adrian-decide"
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByTestId("segment-yo-escribo"));
    const expected: SegmentedModeValue = "yo-escribo";
    expect(onChange).toHaveBeenCalledWith(expected);
  });
});

describe("SegmentedControl3Modes — SC-03 OCC conflict (409 rollback)", () => {
  it("test_optimistic_rollback_on_409: isConflict=true adds conflict indicator", () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl3Modes
        value="adrian-decide"
        onChange={onChange}
        isConflict={true}
      />
    );
    const group = screen.getByTestId("segmented-control-3-modes");
    expect(group.getAttribute("data-conflict")).toBe("true");
  });

  it("test_optimistic_rollback_on_409: isConflict=false has no conflict indicator", () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl3Modes
        value="adrian-decide"
        onChange={onChange}
        isConflict={false}
      />
    );
    const group = screen.getByTestId("segmented-control-3-modes");
    expect(group.getAttribute("data-conflict")).toBeNull();
  });

  it("test_optimistic_rollback_on_409: isPending=true disables all buttons", () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl3Modes
        value="adrian-decide"
        onChange={onChange}
        isPending={true}
      />
    );
    const radios = screen.getAllByRole("radio");
    radios.forEach((radio) => {
      expect((radio as HTMLButtonElement).disabled).toBe(true);
    });
  });

  it("test_optimistic_rollback_on_409: isPending=true blocks onChange on click", () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl3Modes
        value="adrian-decide"
        onChange={onChange}
        isPending={true}
      />
    );
    // Button is disabled, click should not fire onChange
    fireEvent.click(screen.getByTestId("segment-adrian-consulta"));
    expect(onChange).not.toHaveBeenCalled();
  });
});
