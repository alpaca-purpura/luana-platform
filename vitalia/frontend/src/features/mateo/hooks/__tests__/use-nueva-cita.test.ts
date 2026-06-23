// cap: scheduling.mateo-agenda
/**
 * use-nueva-cita.test.ts — TDD RED first (T-FE-1).
 *
 * Tests for hooks: useNuevaCitaServices, useNuevaCitaFreeDoctors,
 * useNuevaCitaAvailabilityCheck, useNuevaCitaCreate.
 *
 * React Query key convention: ["mateo","nueva-cita",action,...stableFilters]
 * BE returns snake_case — hooks normalize to camelCase.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Mock Clerk
vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({
    getToken: vi.fn().mockResolvedValue("test-token"),
    isLoaded: true,
    isSignedIn: true,
  }),
}));

// Mock hooks used for headers
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

// Mock fetch-client
vi.mock("@/lib/fetch-client", () => ({
  vitaliaFetch: vi.fn(),
}));

import { vitaliaFetch } from "@/lib/fetch-client";
import {
  useNuevaCitaServices,
  useNuevaCitaFreeDoctors,
  useNuevaCitaAvailabilityCheck,
  useNuevaCitaCreate,
} from "../use-nueva-cita";

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe("useNuevaCitaServices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (vitaliaFetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [
        {
          offer_id: "svc-uuid-1",
          public_name: "Limpieza dental",
          modality: "presencial",
          is_active: true,
          status: "active",
          initial_appt_duration_minutes: 45,
          price: null,
          currency: "PEN",
        },
      ],
      next_cursor: null,
    });
  });

  it("returns services list normalized to camelCase", async () => {
    const { result } = renderHook(
      () => useNuevaCitaServices({ tenantId: "t1", token: "tok" }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const items = result.current.data?.items;
    expect(items?.[0].offerId).toBe("svc-uuid-1");
    expect(items?.[0].publicName).toBe("Limpieza dental");
    expect(items?.[0].initialApptDurationMinutes).toBe(45);
  });

  it("uses key ['mateo','nueva-cita','services',tenantId]", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    (vitaliaFetch as ReturnType<typeof vi.fn>).mockResolvedValue({ items: [], next_cursor: null });
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);
    const { result } = renderHook(
      () => useNuevaCitaServices({ tenantId: "t1", token: "tok" }),
      { wrapper },
    );
    await waitFor(() => !result.current.isPending);
    const cache = qc.getQueryCache().findAll({
      queryKey: ["mateo", "nueva-cita", "services", "t1"],
    });
    expect(cache.length).toBeGreaterThan(0);
  });
});

describe("useNuevaCitaFreeDoctors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (vitaliaFetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      doctors: [{ doctor_id: "doc-1", doctor_label: "Dr. García" }],
      count: 1,
    });
  });

  it("returns doctors normalized to camelCase", async () => {
    const { result } = renderHook(
      () =>
        useNuevaCitaFreeDoctors({
          tenantId: "t1",
          token: "tok",
          startIso: "2026-07-01T10:00:00Z",
          durationMinutes: 30,
        }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.doctors[0].doctorId).toBe("doc-1");
    expect(result.current.data?.doctors[0].doctorLabel).toBe("Dr. García");
  });

  it("is disabled when startIso is empty string", () => {
    const { result } = renderHook(
      () =>
        useNuevaCitaFreeDoctors({
          tenantId: "t1",
          token: "tok",
          startIso: "",
          durationMinutes: 30,
        }),
      { wrapper: makeWrapper() },
    );
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useNuevaCitaAvailabilityCheck", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (vitaliaFetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "available",
      conflict_label: null,
      conflict_start: null,
    });
  });

  it("returns availability normalized to camelCase", async () => {
    const { result } = renderHook(
      () =>
        useNuevaCitaAvailabilityCheck({
          tenantId: "t1",
          token: "tok",
          doctorId: "doc-1",
          startIso: "2026-07-01T10:00:00Z",
          durationMinutes: 30,
        }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.status).toBe("available");
    expect(result.current.data?.conflictLabel).toBeNull();
  });

  it("is disabled when doctorId is null", () => {
    const { result } = renderHook(
      () =>
        useNuevaCitaAvailabilityCheck({
          tenantId: "t1",
          token: "tok",
          doctorId: null,
          startIso: "2026-07-01T10:00:00Z",
          durationMinutes: 30,
        }),
      { wrapper: makeWrapper() },
    );
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useNuevaCitaCreate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (vitaliaFetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      appointment_id: "appt-uuid-1",
      patient_id: "p-1",
      doctor_id: "doc-1",
      start_time: "2026-07-01T10:00:00Z",
      end_time: "2026-07-01T10:30:00Z",
    });
  });

  it("mutates and returns created appointment normalized", async () => {
    const { result } = renderHook(
      () => useNuevaCitaCreate({ tenantId: "t1", token: "tok" }),
      { wrapper: makeWrapper() },
    );
    result.current.mutate({
      origin: "walk_in",
      patientId: "p-1",
      doctorId: "doc-1",
      serviceLabel: "Limpieza dental",
      startTime: "2026-07-01T10:00:00Z",
      endTime: "2026-07-01T10:30:00Z",
      notesInternal: null,
      currencyOverride: null,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.appointmentId).toBe("appt-uuid-1");
  });
});
