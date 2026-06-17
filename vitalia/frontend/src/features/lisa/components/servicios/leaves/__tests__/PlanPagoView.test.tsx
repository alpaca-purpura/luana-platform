// cap: lisa.servicios
// story-origin: vitalia-fase2-lisa-servicios T-8
/**
 * PlanPagoView.test.tsx — Leaf 4 unit tests.
 *
 * Covers:
 *   - Loading skeleton while data loads
 *   - 3 cobros (Reserva, Anticipo, Financiamiento) render as read-only in Sub-phase A
 *   - Precio del tratamiento group renders with correct currency
 *   - Sub-phase B fields disabled with "Próximamente" text
 *   - FloatingAutosaveIndicator present once
 *
 * spec_anchor: 01-spec.md §Workspace Pestaña 4 · 03-arch-fe.md §8 Tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ServiceDetail } from "../../../../types/servicios.types";

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: vi.fn(), isLoaded: true, isSignedIn: true }),
}));

vi.mock("@/hooks/useTenantId", () => ({
  useTenantId: () => "tenant-abc",
}));

vi.mock("@/hooks/useTenantLocale", () => ({
  useTenantLocale: () => ({ currency: "MXN", locale: "es-MX" }),
}));

vi.mock("@/hooks/use-autosave", () => ({
  useAutosave: () => ({ schedule: vi.fn(), status: "idle", flush: vi.fn() }),
}));

const mockUseServicioDetail = vi.fn();
vi.mock("../../../../api/servicios", () => ({
  useServicioDetail: () => mockUseServicioDetail(),
  usePatchField: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock("@luana/ui-kit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@luana/ui-kit")>();
  return {
    ...actual,
    FloatingAutosaveIndicator: ({ status }: { status: string }) => (
      <div data-testid="floating-autosave" data-status={status} />
    ),
  };
});

import { PlanPagoView } from "../PlanPagoView";

function makeServiceDetail(over: Partial<ServiceDetail> = {}): ServiceDetail {
  return {
    offer_id: "offer-123",
    public_name: "Botox",
    category: "Medicina estética",
    modality: "unica",
    status: "active",
    value_level: "transformacion",
    canonical_service_ref: null,
    price: 2500,
    currency: "MXN",
    is_active: true,
    sales_brief: null,
    specialists: [],
    cases: [],
    testimonials: [],
    ...over,
  };
}

describe("PlanPagoView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading skeleton when servicio is undefined", () => {
    mockUseServicioDetail.mockReturnValue({ data: undefined });
    const { container } = render(<PlanPagoView offerId="offer-123" />);
    const pulses = container.querySelectorAll(".animate-pulse");
    expect(pulses.length).toBeGreaterThanOrEqual(3);
  });

  it("renders all 4 payment group headers", () => {
    mockUseServicioDetail.mockReturnValue({ data: makeServiceDetail() });
    render(<PlanPagoView offerId="offer-123" />);
    expect(screen.getByText("Precio del tratamiento")).toBeInTheDocument();
    expect(screen.getByText("Reserva de la cita")).toBeInTheDocument();
    expect(screen.getByText("Anticipo para iniciar")).toBeInTheDocument();
    expect(screen.getByText("Financiamiento")).toBeInTheDocument();
  });

  it("shows currency badge from servicio.currency", () => {
    mockUseServicioDetail.mockReturnValue({ data: makeServiceDetail({ currency: "COP" }) });
    render(<PlanPagoView offerId="offer-123" />);
    // Badge shows currency (may appear in multiple places — check at least one)
    expect(screen.getAllByText("COP").length).toBeGreaterThanOrEqual(1);
  });

  it("falls back to locale.currency when servicio.currency is null", () => {
    mockUseServicioDetail.mockReturnValue({
      data: makeServiceDetail({ currency: undefined }),
    });
    render(<PlanPagoView offerId="offer-123" />);
    // useTenantLocale is mocked to return MXN — appears in Badge + NumberWithUnit unit
    expect(screen.getAllByText("MXN").length).toBeGreaterThanOrEqual(1);
  });

  it("Reserva / Anticipo / Financiamiento fields are disabled (Sub-phase B — read-only)", () => {
    mockUseServicioDetail.mockReturnValue({ data: makeServiceDetail() });
    render(<PlanPagoView offerId="offer-123" />);
    // Anticipo input disabled
    const anticipoInput = screen.getByPlaceholderText("30");
    expect(anticipoInput).toBeDisabled();
    // n_cuotas disabled
    const nCuotasInput = screen.getByPlaceholderText("12");
    expect(nCuotasInput).toBeDisabled();
    // interés disabled
    const interesInput = screen.getByPlaceholderText("Sin interés (MSI)");
    expect(interesInput).toBeDisabled();
  });

  it("shows 'Próximamente' / Sub-phase B hint text on locked fields", () => {
    mockUseServicioDetail.mockReturnValue({ data: makeServiceDetail() });
    render(<PlanPagoView offerId="offer-123" />);
    const hints = screen.getAllByText("(Disponible próximamente — Sub-phase B)");
    // At least 2 hints: reserva monto + anticipo + financiamiento
    expect(hints.length).toBeGreaterThanOrEqual(2);
  });

  it("renders FloatingAutosaveIndicator once (canon §2.6)", () => {
    mockUseServicioDetail.mockReturnValue({ data: makeServiceDetail() });
    render(<PlanPagoView offerId="offer-123" />);
    const indicators = screen.getAllByTestId("floating-autosave");
    expect(indicators).toHaveLength(1);
  });
});
