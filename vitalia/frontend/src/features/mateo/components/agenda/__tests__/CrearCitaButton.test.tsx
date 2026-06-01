/**
 * CrearCitaButton.test.tsx — Vitest unit tests (TDD RED→GREEN).
 *
 * T-16 vitalia-fase2-valeria-agenda
 * spec_anchor: 06-tickets.yaml T-16 acceptance A2, A4
 *
 * Tests:
 *   - Renders desktop button variant by default (A2)
 *   - Button click opens dropdown with 3 options (A2)
 *   - All 3 dropdown options present with correct labels (A2)
 *   - Clicking walk_in option opens dialog with form (A2)
 *   - Clicking telefono option opens dialog with form (A2)
 *   - Clicking existing_patient option opens dialog with form (A2)
 *   - FAB variant renders with fixed bottom-right position classes (A4)
 *   - FAB has aria-label="Nueva cita" (A4 + accessibility)
 *   - Dialog closes on form cancel (A2)
 *
 * NOTE: Radix UI DropdownMenu uses Portal — requires userEvent.setup() with
 *       pointer events for trigger interaction in happy-dom. fireEvent.click
 *       does NOT trigger Radix open state.
 *
 * downstream-regression-na: brand-local FE component; no cross-brand consumers
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CrearCitaButton } from "../CrearCitaButton";

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Mock Clerk useAuth
vi.mock("@clerk/nextjs", () => ({
  useAuth: vi.fn(() => ({
    getToken: vi.fn().mockResolvedValue("mock-token"),
    isLoaded: true,
    isSignedIn: true,
  })),
}));
vi.mock("@/hooks/useTenantId", () => ({ useTenantId: () => "mock-tenant-id" }));


// Mock CrearCitaForm to avoid deep form setup in button tests
vi.mock("../CrearCitaForm", () => ({
  CrearCitaForm: ({
    origin,
    onCancel,
  }: {
    origin: string;
    onCancel?: () => void;
  }) => (
    <div data-testid="crear-cita-form" data-origin={origin}>
      <button type="button" onClick={onCancel} data-testid="form-cancel">
        Cancelar
      </button>
    </div>
  ),
}));

// Mock PatientAutocomplete
vi.mock("../PatientAutocomplete", () => ({
  PatientAutocomplete: () => (
    <div data-testid="patient-autocomplete-mock" />
  ),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

interface RenderProps {
  variant?: "button" | "fab";
}

function renderButton({ variant = "button" }: RenderProps = {}) {
  const qc = makeQueryClient();
  const user = userEvent.setup();
  render(
    <QueryClientProvider client={qc}>
      <CrearCitaButton
        tenantId="tenant-123"
        clinicId="clinic-456"
        variant={variant}
      />
    </QueryClientProvider>,
  );
  return { user };
}

// ── Desktop button tests (A2) ─────────────────────────────────────────────────

describe("CrearCitaButton — desktop variant render (A2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a button with 'Nueva cita' label", () => {
    renderButton();
    expect(screen.getByText("Nueva cita")).toBeDefined();
  });

  it("button has data-testid=crear-cita-button", () => {
    renderButton();
    expect(screen.getByTestId("crear-cita-button")).toBeDefined();
  });

  it("does NOT render FAB by default", () => {
    renderButton();
    expect(screen.queryByTestId("crear-cita-fab")).toBeNull();
  });
});

describe("CrearCitaButton — dropdown interaction (A2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens dropdown showing walk_in option on button click", async () => {
    const { user } = renderButton();
    const button = screen.getByTestId("crear-cita-button");
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByTestId("crear-cita-walk-in")).toBeDefined();
    });
  });

  it("shows all 3 dropdown options after button click", async () => {
    const { user } = renderButton();
    await user.click(screen.getByTestId("crear-cita-button"));

    await waitFor(() => {
      expect(screen.getByTestId("crear-cita-walk-in")).toBeDefined();
      expect(screen.getByTestId("crear-cita-telefono")).toBeDefined();
      expect(screen.getByTestId("crear-cita-existing")).toBeDefined();
    });
  });

  it("dropdown shows 'Paciente walk-in (nuevo)' label", async () => {
    const { user } = renderButton();
    await user.click(screen.getByTestId("crear-cita-button"));

    await waitFor(() => {
      expect(screen.getByText("Paciente walk-in (nuevo)")).toBeDefined();
    });
  });

  it("dropdown shows 'Reserva telefónica (nuevo)' label", async () => {
    const { user } = renderButton();
    await user.click(screen.getByTestId("crear-cita-button"));

    await waitFor(() => {
      expect(screen.getByText("Reserva telefónica (nuevo)")).toBeDefined();
    });
  });

  it("dropdown shows 'Desde paciente existente' label", async () => {
    const { user } = renderButton();
    await user.click(screen.getByTestId("crear-cita-button"));

    await waitFor(() => {
      expect(screen.getByText("Desde paciente existente")).toBeDefined();
    });
  });

  it("clicking walk_in opens dialog with form variant walk_in", async () => {
    const { user } = renderButton();
    await user.click(screen.getByTestId("crear-cita-button"));

    await waitFor(() => {
      expect(screen.getByTestId("crear-cita-walk-in")).toBeDefined();
    });

    await user.click(screen.getByTestId("crear-cita-walk-in"));

    await waitFor(() => {
      const form = screen.getByTestId("crear-cita-form");
      expect(form.getAttribute("data-origin")).toBe("walk_in");
    });
  });

  it("clicking telefono opens dialog with form variant telefono", async () => {
    const { user } = renderButton();
    await user.click(screen.getByTestId("crear-cita-button"));

    await waitFor(() => {
      expect(screen.getByTestId("crear-cita-telefono")).toBeDefined();
    });

    await user.click(screen.getByTestId("crear-cita-telefono"));

    await waitFor(() => {
      const form = screen.getByTestId("crear-cita-form");
      expect(form.getAttribute("data-origin")).toBe("telefono");
    });
  });

  it("clicking existing_patient opens dialog with form variant existing_patient", async () => {
    const { user } = renderButton();
    await user.click(screen.getByTestId("crear-cita-button"));

    await waitFor(() => {
      expect(screen.getByTestId("crear-cita-existing")).toBeDefined();
    });

    await user.click(screen.getByTestId("crear-cita-existing"));

    await waitFor(() => {
      const form = screen.getByTestId("crear-cita-form");
      expect(form.getAttribute("data-origin")).toBe("existing_patient");
    });
  });

  it("dialog closes when form cancel is clicked", async () => {
    const { user } = renderButton();
    await user.click(screen.getByTestId("crear-cita-button"));

    await waitFor(() => {
      expect(screen.getByTestId("crear-cita-walk-in")).toBeDefined();
    });

    await user.click(screen.getByTestId("crear-cita-walk-in"));

    await waitFor(() => {
      expect(screen.getByTestId("crear-cita-form")).toBeDefined();
    });

    await user.click(screen.getByTestId("form-cancel"));

    await waitFor(() => {
      expect(screen.queryByTestId("crear-cita-form")).toBeNull();
    });
  });
});

// ── FAB variant tests (A4) ────────────────────────────────────────────────────

describe("CrearCitaButton — FAB variant render (A4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders FAB button instead of text button", () => {
    renderButton({ variant: "fab" });
    expect(screen.getByTestId("crear-cita-fab")).toBeDefined();
    expect(screen.queryByTestId("crear-cita-button")).toBeNull();
  });

  it("FAB has aria-label='Nueva cita'", () => {
    renderButton({ variant: "fab" });
    const fab = screen.getByTestId("crear-cita-fab");
    expect(fab.getAttribute("aria-label")).toBe("Nueva cita");
  });

  it("FAB has 'fixed' class for fixed positioning (A4 bottom-right)", () => {
    renderButton({ variant: "fab" });
    const fab = screen.getByTestId("crear-cita-fab");
    expect(fab.className).toContain("fixed");
  });

  it("FAB has 'bottom-4' and 'right-4' positioning classes (A4)", () => {
    renderButton({ variant: "fab" });
    const fab = screen.getByTestId("crear-cita-fab");
    expect(fab.className).toContain("bottom-4");
    expect(fab.className).toContain("right-4");
  });

  it("FAB opens dropdown on click showing 3 options", async () => {
    const { user } = renderButton({ variant: "fab" });
    await user.click(screen.getByTestId("crear-cita-fab"));

    await waitFor(() => {
      expect(screen.getByTestId("crear-cita-walk-in")).toBeDefined();
      expect(screen.getByTestId("crear-cita-telefono")).toBeDefined();
      expect(screen.getByTestId("crear-cita-existing")).toBeDefined();
    });
  });
});
