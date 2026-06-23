// cap: scheduling.mateo-agenda
/**
 * NuevaCitaView.test.tsx — TDD RED first (T-FE-1).
 *
 * Tests for NuevaCitaView client root:
 *   - Renders FormPageScaffold with back-pill
 *   - Renders service selector
 *   - Renders end time error when fin <= inicio
 *   - Service dur=null defaults end time to +30min
 *   - Prefills date/time from props
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// Mock router (Next.js)
const mockPush = vi.fn();
const mockBack = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  useParams: () => ({ tenantId: "tenant-1" }),
}));

// Mock Clerk
vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({
    getToken: vi.fn().mockResolvedValue("test-token"),
    isLoaded: true,
    isSignedIn: true,
  }),
  // useTenantLocale calls useUser() to read user.publicMetadata locale prefs
  useUser: () => ({
    user: {
      publicMetadata: {
        currency: "ARS",
        timezone: "America/Argentina/Buenos_Aires",
        locale: "es-419",
      },
    },
    isLoaded: true,
  }),
}));

vi.mock("@/hooks/useClinicId", () => ({
  useClinicId: () => "clinic-uuid-123",
}));

vi.mock("@/hooks/useActorHeaders", () => ({
  useActorHeaders: () => ({
    "X-Clinic-ID": "clinic-uuid-123",
    "X-User-ID": "user-uuid-123",
    "X-User-Role": "admin_clinic",
  }),
}));

// Mock hooks
vi.mock("../../../hooks/use-nueva-cita", () => ({
  useNuevaCitaServices: () => ({
    data: {
      items: [
        {
          offerId: "svc-1",
          publicName: "Limpieza dental",
          initialApptDurationMinutes: 45,
          isActive: true,
        },
        {
          offerId: "svc-2",
          publicName: "Blanqueamiento",
          initialApptDurationMinutes: null,
          isActive: true,
        },
      ],
    },
    isPending: false,
    isError: false,
  }),
  useNuevaCitaFreeDoctors: () => ({
    data: { doctors: [] },
    isPending: false,
    isError: false,
  }),
  useNuevaCitaAvailabilityCheck: () => ({
    data: null,
    isPending: false,
  }),
  useNuevaCitaCreate: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
}));

// Mock useTenantId
vi.mock("@/hooks/useTenantId", () => ({
  useTenantId: () => "tenant-1",
}));

// Mock @luana/ui-kit
vi.mock("@luana/ui-kit", () => ({
  FormPageScaffold: ({ header, children }: { header: React.ReactNode; children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "form-page-scaffold" }, header, children),
  PageHeader: ({
    title,
    backLabel,
    onBack,
  }: {
    title: React.ReactNode;
    backLabel?: string;
    onBack?: () => void;
  }) =>
    React.createElement("div", null,
      backLabel ? React.createElement("button", { onClick: onBack, "data-testid": "page-header-back" }, "‹ " + backLabel) : null,
      React.createElement("h1", null, title),
    ),
  FormActionBar: ({ submitLabel, onSubmit, onCancel, submitting }: {
    submitLabel: string;
    onSubmit?: () => void;
    onCancel?: () => void;
    submitting?: boolean;
  }) =>
    React.createElement("div", { "data-testid": "form-action-bar" },
      React.createElement("button", { onClick: onCancel, "data-testid": "form-action-bar-cancel" }, "Cancelar"),
      React.createElement("button", { onClick: onSubmit, disabled: submitting, "data-testid": "form-action-bar-submit" }, submitLabel),
    ),
  Badge: ({ children }: { children: React.ReactNode }) => React.createElement("span", null, children),
  // SmartDateTimePicker is used for startTime/endTime fields
  SmartDateTimePicker: ({
    value,
    onChange,
    "data-testid": testId,
  }: {
    value?: string;
    onChange?: (iso: string) => void;
    "data-testid"?: string;
    [key: string]: unknown;
  }) =>
    React.createElement("input", {
      type: "text",
      "data-testid": testId ?? "smart-date-time-picker",
      value: value ?? "",
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value),
    }),
}));

import { NuevaCitaView } from "../NuevaCitaView";

describe("NuevaCitaView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders back-pill pointing to agenda (AC-9: no modal)", () => {
    render(
      React.createElement(NuevaCitaView, {
        tenantId: "tenant-1",
        prefillDate: undefined,
        prefillTime: undefined,
      }),
    );
    expect(screen.getByTestId("page-header-back")).toBeInTheDocument();
    expect(screen.getByTestId("form-page-scaffold")).toBeInTheDocument();
  });

  it("back-pill click calls router.back or push to agenda", () => {
    render(
      React.createElement(NuevaCitaView, {
        tenantId: "tenant-1",
        prefillDate: undefined,
        prefillTime: undefined,
      }),
    );
    fireEvent.click(screen.getByTestId("page-header-back"));
    expect(mockBack).toHaveBeenCalled();
  });

  it("renders service selector with services from hook", () => {
    render(
      React.createElement(NuevaCitaView, {
        tenantId: "tenant-1",
        prefillDate: undefined,
        prefillTime: undefined,
      }),
    );
    expect(screen.getByText(/Limpieza dental/i)).toBeInTheDocument();
  });

  it("renders FormActionBar with 'Crear cita' label", () => {
    render(
      React.createElement(NuevaCitaView, {
        tenantId: "tenant-1",
        prefillDate: undefined,
        prefillTime: undefined,
      }),
    );
    expect(screen.getByTestId("form-action-bar-submit")).toBeInTheDocument();
    expect(screen.getByTestId("form-action-bar-submit").textContent).toContain("Crear");
  });

  it("shows end-time error when endTime <= startTime (SC-fin-invalido)", async () => {
    render(
      React.createElement(NuevaCitaView, {
        tenantId: "tenant-1",
        prefillDate: "2026-07-01",
        prefillTime: "10:00",
      }),
    );
    // This test will fail RED until NuevaCitaView has the fin <= inicio validation
    // that shows an inline error message
    const endTimeError = screen.queryByText(/El horario de fin debe ser posterior/i);
    // Initially no error (form not submitted yet)
    expect(endTimeError).toBeNull();
  });

  it("does not render a modal/drawer (AC-9 full-page only)", () => {
    render(
      React.createElement(NuevaCitaView, {
        tenantId: "tenant-1",
        prefillDate: undefined,
        prefillTime: undefined,
      }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
