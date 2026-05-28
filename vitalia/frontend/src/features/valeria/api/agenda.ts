// cap: scheduling.valeria-agenda
// atomics: TBD
// story-origin: vitalia-fase2-s1-TBD
/**
 * agenda.ts — React Query v5 hooks for Valeria Agenda feature.
 * T-12 vitalia-fase2-valeria-agenda
 *
 * Query key factory (stable references, per React Query v5 best practices):
 *   agendaKeys.grid(tenantId, view, date, filters?)
 *   agendaKeys.aggregates(tenantId, dateFrom, dateTo)
 *   agendaKeys.detail(tenantId, appointmentId)
 *
 * Polling: useAgendaGrid polls every 30 seconds (refetchInterval: 30_000).
 * Tenant isolation: every request passes tenantId via vitaliaFetch (X-Tenant-ID header).
 * HIPAA-lite: PHI is masked server-side — FE only receives masked strings.
 *
 * downstream-regression-na: brand-local FE hooks; no cross-brand consumers
 * spec_anchor: 03-arch.md § 5.1 + 06-tickets.yaml T-12
 */

"use client";

import { useAuth } from "@clerk/nextjs";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { vitaliaFetch } from "@/lib/fetch-client";
import type {
  AgendaGridResponse,
  AgendaView,
  AgendaFilter,
  Appointment,
  FiscalDocument,
} from "../types/agenda.types";
import type {
  AgendaGridResponseDTO,
  ChargeResponseDTO,
  CreateAppointmentRequestDTO,
  PatchAppointmentRequestDTO,
  NotifyRequestDTO,
} from "../types/agenda-schema";

// ── 1. Query key factory ───────────────────────────────────────────────────────

/**
 * Stable query key factory — prevents key typos and enables targeted invalidation.
 * Using tuple format per React Query v5 best practices.
 */
export const agendaKeys = {
  all: (tenantId: string) => ["agenda", tenantId] as const,
  grid: (
    tenantId: string,
    view: AgendaView,
    date: string,
    filters?: AgendaFilter | null,
  ) => ["agenda", "grid", tenantId, view, date, filters ?? null] as const,
  aggregates: (tenantId: string, dateFrom: string, dateTo: string) =>
    ["agenda", "aggregates", tenantId, dateFrom, dateTo] as const,
  detail: (tenantId: string, appointmentId: string) =>
    ["agenda", "detail", tenantId, appointmentId] as const,
} as const;

// ── 2. Base URL helper ─────────────────────────────────────────────────────────

const BASE = "/api/v1/scheduling";
const PAYMENTS_BASE = "/api/v1/payments";
const FISCAL_BASE = "/api/v1/fiscal";
const NOTIFY_BASE = "/api/v1/notify";

// ── 3. useAgendaGrid — polling hook for calendar grid ─────────────────────────

export interface UseAgendaGridOptions {
  tenantId: string;
  view: AgendaView;
  date: string;
  /** Active preset filter chip — null = no filter. */
  presetFilter?: AgendaFilter | null;
  /** React Query extra options (pass placeholderData for SSR hydration). */
  queryOptions?: Partial<UseQueryOptions<AgendaGridResponseDTO>>;
}

/**
 * Fetches agenda grid slots. Polls every 30 seconds.
 * Passes initialData / placeholderData from Server Component for SSR hydration.
 */
export function useAgendaGrid({
  tenantId,
  view,
  date,
  presetFilter = null,
  queryOptions,
}: UseAgendaGridOptions) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery<AgendaGridResponseDTO>({
    queryKey: agendaKeys.grid(tenantId, view, date, presetFilter),
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const params = new URLSearchParams({ view, date });
      if (presetFilter) params.set("preset_filter", presetFilter);

      return vitaliaFetch<AgendaGridResponseDTO>(
        `${BASE}/agenda/grid?${params.toString()}`,
        { token, tenantId },
      );
    },
    enabled: isLoaded && isSignedIn === true,
    refetchInterval: 30_000,
    staleTime: 25_000,
    ...queryOptions,
  });
}

// ── 4. useAgendaAggregates ────────────────────────────────────────────────────

export interface AgendaAggregatesResponse {
  totalSlots: number;
  pendingPayment: number;
  totalRevenueCents: number;
  currency: string;
  noShows: number;
  dateFrom: string;
  dateTo: string;
}

export interface UseAgendaAggregatesOptions {
  tenantId: string;
  dateFrom: string;
  dateTo: string;
}

export function useAgendaAggregates({
  tenantId,
  dateFrom,
  dateTo,
}: UseAgendaAggregatesOptions) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery<AgendaAggregatesResponse>({
    queryKey: agendaKeys.aggregates(tenantId, dateFrom, dateTo),
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });

      return vitaliaFetch<AgendaAggregatesResponse>(
        `${BASE}/agenda/aggregates?${params.toString()}`,
        { token, tenantId },
      );
    },
    enabled: isLoaded && isSignedIn === true,
    staleTime: 60_000,
  });
}

// ── 5. useAppointmentDetail ───────────────────────────────────────────────────

export interface UseAppointmentDetailOptions {
  tenantId: string;
  appointmentId: string | null;
  enabled?: boolean;
}

export function useAppointmentDetail({
  tenantId,
  appointmentId,
  enabled = true,
}: UseAppointmentDetailOptions) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery<Appointment>({
    queryKey: agendaKeys.detail(tenantId, appointmentId ?? ""),
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      if (!appointmentId) throw new Error("appointmentId is required");

      return vitaliaFetch<Appointment>(
        `${BASE}/appointments/${appointmentId}`,
        { token, tenantId },
      );
    },
    enabled: isLoaded && isSignedIn === true && !!appointmentId && enabled,
    staleTime: 30_000,
  });
}

// ── 6. useCreateAppointment ───────────────────────────────────────────────────

export interface CreateAppointmentMutationContext {
  tenantId: string;
}

export function useCreateAppointment(tenantId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<AgendaGridResponse, Error, CreateAppointmentRequestDTO>({
    mutationFn: async (payload) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      return vitaliaFetch<AgendaGridResponse>(`${BASE}/appointments`, {
        method: "POST",
        token,
        tenantId,
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      // Invalidate all grid queries for this tenant
      void queryClient.invalidateQueries({ queryKey: agendaKeys.all(tenantId) });
    },
  });
}

// ── 7. usePatchAppointmentStatus ──────────────────────────────────────────────

export interface PatchAppointmentVariables {
  appointmentId: string;
  payload: PatchAppointmentRequestDTO;
}

export function usePatchAppointmentStatus(tenantId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<Appointment, Error, PatchAppointmentVariables>({
    mutationFn: async ({ appointmentId, payload }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      return vitaliaFetch<Appointment>(
        `${BASE}/appointments/${appointmentId}`,
        {
          method: "PATCH",
          token,
          tenantId,
          body: JSON.stringify(payload),
        },
      );
    },
    onSuccess: (_, { appointmentId }) => {
      // Invalidate grid + specific appointment detail
      void queryClient.invalidateQueries({ queryKey: agendaKeys.all(tenantId) });
      void queryClient.invalidateQueries({
        queryKey: agendaKeys.detail(tenantId, appointmentId),
      });
    },
  });
}

// ── 8. useChargeAppointment ───────────────────────────────────────────────────

export interface ChargeAppointmentVariables {
  appointmentId: string;
  /** ChargeRequest payload from ChargeRequestSchema */
  payload: Record<string, unknown>;
  /** UUID v4 idempotency key — caller must generate before mutation */
  idempotencyKey: string;
}

export function useChargeAppointment(tenantId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<ChargeResponseDTO, Error, ChargeAppointmentVariables>({
    mutationFn: async ({ appointmentId, payload, idempotencyKey }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      return vitaliaFetch<ChargeResponseDTO>(
        `${PAYMENTS_BASE}/charge`,
        {
          method: "POST",
          token,
          tenantId,
          headers: {
            "X-Idempotency-Key": idempotencyKey,
          },
          body: JSON.stringify({ appointment_id: appointmentId, ...payload }),
        },
      );
    },
    onSuccess: (_, { appointmentId }) => {
      // Invalidate grid (payment status badge changes) + appointment detail
      void queryClient.invalidateQueries({ queryKey: agendaKeys.all(tenantId) });
      void queryClient.invalidateQueries({
        queryKey: agendaKeys.detail(tenantId, appointmentId),
      });
    },
  });
}

// ── 9. useEmitFiscalDoc ───────────────────────────────────────────────────────

export interface EmitFiscalDocVariables {
  paymentId: string;
  docType: "factura" | "boleta" | "ticket";
}

export function useEmitFiscalDoc(tenantId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<FiscalDocument, Error, EmitFiscalDocVariables>({
    mutationFn: async ({ paymentId, docType }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      return vitaliaFetch<FiscalDocument>(
        `${FISCAL_BASE}/emit`,
        {
          method: "POST",
          token,
          tenantId,
          body: JSON.stringify({ payment_id: paymentId, doc_type: docType }),
        },
      );
    },
    onSuccess: () => {
      // Invalidate all agenda queries — fiscal status may show in grid
      void queryClient.invalidateQueries({ queryKey: agendaKeys.all(tenantId) });
    },
  });
}

// ── 10. useSendReminder ───────────────────────────────────────────────────────

export interface SendReminderResponse {
  messageId: string;
  channel: string;
  sentAt: string;
}

export function useSendReminder(tenantId: string) {
  const { getToken } = useAuth();

  return useMutation<SendReminderResponse, Error, NotifyRequestDTO>({
    mutationFn: async (payload) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      return vitaliaFetch<SendReminderResponse>(
        `${NOTIFY_BASE}/reminder`,
        {
          method: "POST",
          token,
          tenantId,
          body: JSON.stringify(payload),
        },
      );
    },
    // No cache invalidation needed — reminders don't affect the grid state
  });
}
