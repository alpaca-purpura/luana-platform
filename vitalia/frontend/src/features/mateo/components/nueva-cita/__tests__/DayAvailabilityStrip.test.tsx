// cap: scheduling.mateo-agenda
/**
 * DayAvailabilityStrip.test.tsx — RED-first tests for T-FE-3.
 * Covers: SC-mini-vista (AC-8), empty/loading/error states.
 */
import * as React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const mockUseDayStrip = vi.fn();
vi.mock("../../../hooks/use-availability", () => ({
  useDayStrip: (...args: unknown[]) => mockUseDayStrip(...args),
  useAvailabilityCheck: vi.fn().mockReturnValue({ data: undefined, isPending: false, isError: false }),
}));

const { DayAvailabilityStrip } = await import("../DayAvailabilityStrip");

const BASE_PROPS = {
  tenantId: "t-1",
  token: "tok",
  doctorId: "d-1",
  dateLocal: "2026-06-22",
  selectedStartIso: "2026-06-22T10:00:00Z",
  selectedEndIso: "2026-06-22T10:30:00Z",
};

describe("DayAvailabilityStrip", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders nothing when doctorId is null", () => {
    mockUseDayStrip.mockReturnValue({ data: undefined, isPending: false, isError: false });
    const { container } = render(
      <DayAvailabilityStrip {...BASE_PROPS} doctorId={null} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows skeleton while loading", () => {
    mockUseDayStrip.mockReturnValue({ data: undefined, isPending: true, isError: false });
    render(<DayAvailabilityStrip {...BASE_PROPS} />);
    expect(screen.getByTestId("day-strip-loading")).toBeTruthy();
  });

  it("shows error state on failure", () => {
    mockUseDayStrip.mockReturnValue({ data: undefined, isPending: false, isError: true });
    render(<DayAvailabilityStrip {...BASE_PROPS} />);
    expect(screen.getByTestId("day-strip-error")).toBeTruthy();
  });

  it("SC-mini-vista: renders strip with working_hours block", () => {
    mockUseDayStrip.mockReturnValue({
      data: {
        doctorId: "d-1",
        dateLocal: "2026-06-22",
        blocks: [
          { kind: "working_hours", start: "2026-06-22T08:00:00Z", end: "2026-06-22T17:00:00Z" },
        ],
      },
      isPending: false,
      isError: false,
    });
    render(<DayAvailabilityStrip {...BASE_PROPS} />);
    expect(screen.getByTestId("day-strip")).toBeTruthy();
    expect(screen.getByTestId("day-strip-block-0")).toBeTruthy();
  });

  it("SC-mini-vista: renders busy block with distinct class", () => {
    mockUseDayStrip.mockReturnValue({
      data: {
        doctorId: "d-1",
        dateLocal: "2026-06-22",
        blocks: [
          { kind: "working_hours", start: "2026-06-22T08:00:00Z", end: "2026-06-22T17:00:00Z" },
          { kind: "busy", start: "2026-06-22T10:00:00Z", end: "2026-06-22T11:00:00Z" },
        ],
      },
      isPending: false,
      isError: false,
    });
    render(<DayAvailabilityStrip {...BASE_PROPS} />);
    expect(screen.getByTestId("day-strip-block-1")).toBeTruthy();
  });

  it("shows selected-slot highlight when selectedStartIso/End are set", () => {
    mockUseDayStrip.mockReturnValue({
      data: {
        doctorId: "d-1",
        dateLocal: "2026-06-22",
        blocks: [
          { kind: "working_hours", start: "2026-06-22T08:00:00Z", end: "2026-06-22T17:00:00Z" },
        ],
      },
      isPending: false,
      isError: false,
    });
    render(<DayAvailabilityStrip {...BASE_PROPS} />);
    expect(screen.getByTestId("day-strip-selected")).toBeTruthy();
  });

  it("no selected highlight when selectedStartIso is null", () => {
    mockUseDayStrip.mockReturnValue({
      data: {
        doctorId: "d-1",
        dateLocal: "2026-06-22",
        blocks: [{ kind: "working_hours", start: "2026-06-22T08:00:00Z", end: "2026-06-22T17:00:00Z" }],
      },
      isPending: false,
      isError: false,
    });
    render(
      <DayAvailabilityStrip
        {...BASE_PROPS}
        selectedStartIso={null}
        selectedEndIso={null}
      />,
    );
    expect(screen.queryByTestId("day-strip-selected")).toBeNull();
  });
});
