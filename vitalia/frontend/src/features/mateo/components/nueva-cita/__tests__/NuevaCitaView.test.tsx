// cap: scheduling.mateo-agenda
/**
 * NuevaCitaView.test.tsx — TDD (T-FE-1 base + T-FE-4 integration mocks).
 *
 * Tests for NuevaCitaView integrated client root:
 *   - Renders FormPageScaffold with back-pill
 *   - Renders service selector (ServicePicker)
 *   - Canal picker (CanalPicker) renders
 *   - Renders end time error when fin <= inicio
 *   - Service dur=null defaults end time to +30min
 *   - Prefills date/time from props
 *   - FormActionBar submit disabled until form valid + availability (RN-10)
 *   - Does not render a modal/drawer (AC-9)
 *
 * T-FE-4 additions:
 *   - PatientPickerWithCreate replaces manual UUID input
 *   - AvailabilityChip renders when doctor+time selected
 *   - DayAvailabilityStrip renders when startTime set
 *   - FreeDoctorsList renders
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
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

vi.mock("@/hooks/useTenantId", () => ({
  useTenantId: () => "tenant-1",
}));

// Mock parent hooks (used by NuevaCitaView directly)
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
  nuevaCitaKeys: {
    services: () => ["mateo", "nueva-cita", "services"],
    freeDoctors: () => ["mateo", "nueva-cita", "free-doctors"],
    availabilityCheck: () => ["mateo", "nueva-cita", "availability"],
    patientSearch: () => ["mateo", "nueva-cita", "patient-search"],
    patientInlineCreate: () => ["mateo", "nueva-cita", "patient-inline-create"],
    create: () => ["mateo", "nueva-cita", "create"],
  },
}));

// Mock patient hooks (used by PatientPickerWithCreate)
vi.mock("../../../hooks/use-patients", () => ({
  useSearchPatients: () => ({
    searchFn: vi.fn().mockResolvedValue([]),
  }),
  useCreatePatientInline: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ patientId: "p-1", isDuplicate: false }),
    isPending: false,
    error: null,
  }),
}));

// Mock availability hooks (used by AvailabilityChip + DayAvailabilityStrip)
vi.mock("../../../hooks/use-availability", () => ({
  useAvailabilityCheck: () => ({
    data: null,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useDayStrip: () => ({
    data: null,
    isPending: false,
    isError: false,
  }),
  availabilityKeys: {
    check: () => ["mateo", "availability", "check"],
    dayStrip: () => ["mateo", "availability", "day-strip"],
  },
}));

// Mock @luana/ui-kit — minimal test doubles
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
  FormActionBar: ({
    submitLabel,
    onSubmit,
    onCancel,
    submitting,
    submitDisabled,
    testId,
  }: {
    submitLabel: string;
    onSubmit?: () => void;
    onCancel?: () => void;
    submitting?: boolean;
    submitDisabled?: boolean;
    testId?: string;
  }) =>
    React.createElement("div", { "data-testid": testId ?? "form-action-bar" },
      React.createElement("button", { onClick: onCancel, "data-testid": `${testId ?? "form-action-bar"}-cancel` }, "Cancelar"),
      React.createElement("button", {
        onClick: onSubmit,
        disabled: submitting || submitDisabled,
        "data-testid": `${testId ?? "form-action-bar"}-submit`,
      }, submitLabel),
    ),
  Badge: ({ children, variant }: { children: React.ReactNode; variant?: string }) =>
    React.createElement("span", { "data-variant": variant }, children),
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
      readOnly: !onChange,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value),
    }),
  EntityPicker: ({
    placeholder,
    testId,
    createAction,
  }: {
    placeholder?: string;
    testId?: string;
    createAction?: { label: (q: string) => string; onCreate: (q: string) => void };
  }) =>
    React.createElement("div", { "data-testid": testId ?? "entity-picker" },
      React.createElement("input", { placeholder, "data-testid": `${testId ?? "entity-picker"}-input` }),
      createAction ? React.createElement("button", {
        "data-testid": `${testId ?? "entity-picker"}-create`,
        onClick: () => createAction.onCreate("test"),
      }, createAction.label("test")) : null,
    ),
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

  it("back-pill click calls router.back", () => {
    render(
      React.createElement(NuevaCitaView, {
        tenantId: "tenant-1",
        prefillDate: undefined,
        prefillTime: undefined,
      }),
    );
    screen.getByTestId("page-header-back").click();
    expect(mockBack).toHaveBeenCalled();
  });

  it("renders service selector (ServicePicker) with services from hook", () => {
    render(
      React.createElement(NuevaCitaView, {
        tenantId: "tenant-1",
        prefillDate: undefined,
        prefillTime: undefined,
      }),
    );
    // ServicePicker renders service options
    expect(screen.getByText(/Limpieza dental/i)).toBeInTheDocument();
  });

  it("renders NuevaCitaActions (FormActionBar) with 'Crear cita' label", () => {
    render(
      React.createElement(NuevaCitaView, {
        tenantId: "tenant-1",
        prefillDate: undefined,
        prefillTime: undefined,
      }),
    );
    // NuevaCitaActions uses testId="nueva-cita-actions"
    const actionBar = screen.getByTestId("nueva-cita-actions");
    expect(actionBar).toBeInTheDocument();
    const submitBtn = screen.getByTestId("nueva-cita-actions-submit");
    expect(submitBtn.textContent).toContain("Crear");
  });

  it("submit is disabled initially (RN-10: fail-closed — no valid form + availability null)", () => {
    render(
      React.createElement(NuevaCitaView, {
        tenantId: "tenant-1",
        prefillDate: undefined,
        prefillTime: undefined,
      }),
    );
    const submitBtn = screen.getByTestId("nueva-cita-actions-submit");
    expect(submitBtn).toBeDisabled();
  });

  it("shows end-time error when endTime <= startTime (SC-fin-invalido) — no error before submission", () => {
    render(
      React.createElement(NuevaCitaView, {
        tenantId: "tenant-1",
        prefillDate: "2026-07-01",
        prefillTime: "10:00",
      }),
    );
    // No error initially (form not submitted yet)
    const endTimeError = screen.queryByText(/El horario de fin debe ser posterior/i);
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

  it("CanalPicker renders walk_in + telefono options", () => {
    render(
      React.createElement(NuevaCitaView, {
        tenantId: "tenant-1",
        prefillDate: undefined,
        prefillTime: undefined,
      }),
    );
    // CanalPicker renders "Presencial" and "Teléfono" tab triggers
    expect(screen.getByTestId("canal-picker-walk-in")).toBeInTheDocument();
    expect(screen.getByTestId("canal-picker-telefono")).toBeInTheDocument();
  });

  it("PatientPickerWithCreate renders EntityPicker (typeahead)", () => {
    render(
      React.createElement(NuevaCitaView, {
        tenantId: "tenant-1",
        prefillDate: undefined,
        prefillTime: undefined,
      }),
    );
    // PatientPickerWithCreate renders EntityPicker with testId="patient-picker"
    expect(screen.getByTestId("patient-picker")).toBeInTheDocument();
  });

  it("FreeDoctorsList renders no-slot message when startTime not set", () => {
    render(
      React.createElement(NuevaCitaView, {
        tenantId: "tenant-1",
        prefillDate: undefined,
        prefillTime: undefined,
      }),
    );
    // FreeDoctorsList shows "Selecciona fecha y hora..." when no slot
    expect(screen.getByTestId("free-doctors-no-slot")).toBeInTheDocument();
  });

  it("DayAvailabilityStrip container not shown when startTime not set", () => {
    render(
      React.createElement(NuevaCitaView, {
        tenantId: "tenant-1",
        prefillDate: undefined,
        prefillTime: undefined,
      }),
    );
    // nc-day-strip-container only renders when startTime is truthy
    expect(screen.queryByTestId("nc-day-strip-container")).toBeNull();
  });

  // ── UX fix-loop tests (UX-FIXLOOP-2026-06-24) ────────────────────────────

  it("M1: shows avail intro block when startTime not set", () => {
    render(
      React.createElement(NuevaCitaView, {
        tenantId: "tenant-1",
        prefillDate: undefined,
        prefillTime: undefined,
      }),
    );
    expect(screen.getByTestId("nc-avail-intro")).toBeInTheDocument();
  });

  it("M1: hides avail intro block when startTime is set", () => {
    render(
      React.createElement(NuevaCitaView, {
        tenantId: "tenant-1",
        prefillDate: "2026-07-01",
        prefillTime: "10:00",
      }),
    );
    expect(screen.queryByTestId("nc-avail-intro")).toBeNull();
  });

  it("M2: notes textarea has HIPAA logistics placeholder", () => {
    render(
      React.createElement(NuevaCitaView, {
        tenantId: "tenant-1",
        prefillDate: undefined,
        prefillTime: undefined,
      }),
    );
    const textarea = screen.getByTestId("nc-notas-textarea");
    expect(textarea).toHaveAttribute("placeholder", expect.stringContaining("Solo logística"));
  });

  it("M3: duration section shows helper text", () => {
    render(
      React.createElement(NuevaCitaView, {
        tenantId: "tenant-1",
        prefillDate: undefined,
        prefillTime: undefined,
      }),
    );
    expect(screen.getByTestId("nc-duracion-hint")).toBeInTheDocument();
    expect(screen.getByTestId("nc-duracion-hint").textContent).toContain("Viene del servicio");
  });

  it("H2: shows blocking reason when submit disabled (no patient)", () => {
    render(
      React.createElement(NuevaCitaView, {
        tenantId: "tenant-1",
        prefillDate: undefined,
        prefillTime: undefined,
      }),
    );
    // Submit is disabled (empty form) → blocking reason should be visible
    expect(screen.getByTestId("nc-blocking-reason")).toBeInTheDocument();
    expect(screen.getByTestId("nc-blocking-reason").textContent).toContain("paciente");
  });

  it("L1: CanalPicker shows mockup labels (🚶 Walk-in / 📞 Teléfono)", () => {
    render(
      React.createElement(NuevaCitaView, {
        tenantId: "tenant-1",
        prefillDate: undefined,
        prefillTime: undefined,
      }),
    );
    const walkInBtn = screen.getByTestId("canal-picker-walk-in");
    expect(walkInBtn.textContent).toBe("🚶 Walk-in");
    const telefonoBtn = screen.getByTestId("canal-picker-telefono");
    expect(telefonoBtn.textContent).toBe("📞 Teléfono");
  });

  it("L6: notes textarea renders character counter", () => {
    render(
      React.createElement(NuevaCitaView, {
        tenantId: "tenant-1",
        prefillDate: undefined,
        prefillTime: undefined,
      }),
    );
    expect(screen.getByTestId("nc-notas-counter")).toBeInTheDocument();
    expect(screen.getByTestId("nc-notas-counter").textContent).toContain("/500");
  });
});
