// voseo-allowed: test fixture uses voseo regex patterns as negative assertions (no voseo in rendered DOM)
/**
 * PresenciaView.test.tsx — Unit tests for PresenciaView client root.
 *
 * TDD per tdd-mandatory.md.
 * Tests: renders heading, error state, contact data hydration,
 * sub-components present, AutosaveBadge present, Spanish neutro.
 *
 * T-7 vitalia-fase2-lisa-marca
 * spec_anchor: 06-tickets.yaml T-7 + ADR-vitalia-004 § 3
 */

import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock Clerk ─────────────────────────────────────────────────────────────────
vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({
    getToken: vi.fn().mockResolvedValue("mock-token"),
    isLoaded: true,
    isSignedIn: true,
  }),
}));

// ── Mock API ───────────────────────────────────────────────────────────────────
vi.mock("../../../../api/marca-presence-api", () => ({
  getContact: vi.fn().mockResolvedValue({
    tenantId: "tenant-abc",
    publicLandingUrl: "https://landing.example.com",
    websiteUrl: "https://example.com",
    instagramHandle: "@clinicaejemplo",
    tiktokHandle: null,
    facebookPage: null,
    googleBusinessUrl: null,
    updatedAt: "2026-05-27T10:00:00Z",
  }),
  getTrustSignals: vi.fn().mockResolvedValue({ items: [] }),
  getTrustCatalog: vi.fn().mockResolvedValue({ country: "PE", items: [] }),
  getLocations: vi.fn().mockResolvedValue({ items: [] }),
  createTrustSignal: vi.fn(),
  deleteTrustSignal: vi.fn(),
  updateContact: vi.fn(),
}));

vi.mock("../../../../api/marca", () => ({
  marcaKeys: {
    all: ["lisa", "marca"],
    contact: (tenantId: string) => ["lisa", "marca", "contact", tenantId],
    trustSignals: (tenantId: string) => ["lisa", "marca", "trustSignals", tenantId],
    trustCatalog: (tenantId: string, cc: string) => ["lisa", "marca", "trustCatalog", tenantId, cc],
    locations: (tenantId: string) => ["lisa", "marca", "locations", tenantId],
  },
}));

vi.mock("../../../../hooks/useContactAutosave", () => ({
  useContactAutosave: () => ({
    autosaveStatus: "idle" as const,
    savedAt: null,
    scheduleAutosave: vi.fn(),
    cancelAutosave: vi.fn(),
  }),
}));

async function renderPresenciaView(tenantId = "tenant-abc") {
  const { PresenciaView } = await import("../PresenciaView");
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <PresenciaView tenantId={tenantId} />
    </QueryClientProvider>,
  );
}

describe("PresenciaView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders section heading 'Presencia'", async () => {
    await renderPresenciaView();
    expect(screen.getByRole("heading", { name: "Presencia" })).toBeDefined();
  });

  it("renders AutosaveBadge status element", async () => {
    await renderPresenciaView();
    const badge = screen.getByRole("status");
    expect(badge).toBeDefined();
  });

  it("renders card sub-sections after data loads", async () => {
    await renderPresenciaView();
    await waitFor(() => {
      expect(screen.getByText("Sitio web")).toBeDefined();
      expect(screen.getByText("Redes sociales")).toBeDefined();
    });
  });

  it("renders trust signals section heading", async () => {
    await renderPresenciaView();
    await waitFor(() => {
      expect(screen.getByText("Señales de autoridad")).toBeDefined();
    });
  });

  it("renders locations section heading", async () => {
    await renderPresenciaView();
    await waitFor(() => {
      expect(screen.getByText("Ubicaciones")).toBeDefined();
    });
  });

  it("renders landing info banner when publicLandingUrl present", async () => {
    await renderPresenciaView();
    await waitFor(() => {
      expect(screen.getByRole("note")).toBeDefined();
    });
  });

  it("heading uses Spanish neutro — no voseo", async () => {
    await renderPresenciaView();
    const heading = screen.getByRole("heading", { name: "Presencia" });
    expect(heading.textContent).not.toMatch(/configurá|ingresá|guardá/);
  });
});
