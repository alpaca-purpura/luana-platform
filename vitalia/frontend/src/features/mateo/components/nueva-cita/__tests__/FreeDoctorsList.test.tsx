// cap: scheduling.mateo-agenda
/**
 * FreeDoctorsList.test.tsx — RED-first tests for T-FE-3.
 * Covers: SC-reasignar, SC-reasignar-vacio, SC-empty-medicos.
 */
import * as React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mockSetSelectedDoctorId = vi.fn();
let mockSelectedDoctorId: string | null = null;

vi.mock("../../../store/nueva-cita-store", () => ({
  useNuevaCitaStore: vi.fn(
    (selector: (s: Record<string, unknown>) => unknown) =>
      selector({
        setSelectedDoctorId: mockSetSelectedDoctorId,
        selectedDoctorId: mockSelectedDoctorId,
      }),
  ),
}));

const { FreeDoctorsList } = await import("../FreeDoctorsList");

const BASE_PROPS = {
  tenantId: "t-1",
  // token removed — T-FE-4: not used by FreeDoctorsList (takes doctors/isPending as props)
  startIso: "2026-06-22T10:00:00Z",
  durationMinutes: 30,
};

const DOCTORS = [
  { doctorId: "d-1", doctorLabel: "Dra. García" },
  { doctorId: "d-2", doctorLabel: "Dr. López" },
];

describe("FreeDoctorsList", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows loading state", () => {
    render(<FreeDoctorsList {...BASE_PROPS} isPending={true} doctors={[]} />);
    expect(screen.getByTestId("free-doctors-loading")).toBeTruthy();
  });

  it("SC-empty-medicos: shows empty state when no doctors", () => {
    render(<FreeDoctorsList {...BASE_PROPS} isPending={false} doctors={[]} />);
    expect(screen.getByTestId("free-doctors-empty")).toBeTruthy();
    expect(screen.getByText(/sin médicos disponibles/i)).toBeTruthy();
  });

  it("SC-reasignar: renders list of available doctors", () => {
    render(
      <FreeDoctorsList {...BASE_PROPS} isPending={false} doctors={DOCTORS} />,
    );
    expect(screen.getByText("Dra. García")).toBeTruthy();
    expect(screen.getByText("Dr. López")).toBeTruthy();
  });

  it("SC-reasignar: clicking a doctor calls setSelectedDoctorId", () => {
    render(
      <FreeDoctorsList {...BASE_PROPS} isPending={false} doctors={DOCTORS} />,
    );
    fireEvent.click(screen.getByTestId("free-doctor-btn-d-1"));
    expect(mockSetSelectedDoctorId).toHaveBeenCalledWith("d-1");
  });

  it("shows selected state on active doctor (aria-pressed)", () => {
    // Set selected before render
    mockSelectedDoctorId = "d-1";
    render(
      <FreeDoctorsList {...BASE_PROPS} isPending={false} doctors={DOCTORS} />,
    );
    const btn = screen.getByTestId("free-doctor-btn-d-1");
    expect(btn.getAttribute("aria-pressed")).toBe("true");
    // Reset
    mockSelectedDoctorId = null;
  });

  it("SC-reasignar-vacio: shows empty state when startIso not set", () => {
    render(
      <FreeDoctorsList
        {...BASE_PROPS}
        startIso=""
        isPending={false}
        doctors={[]}
      />,
    );
    expect(screen.getByTestId("free-doctors-no-slot")).toBeTruthy();
  });
});
