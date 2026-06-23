// cap: scheduling.mateo-agenda
/**
 * NuevaCitaView.tsx — "Nueva cita" leaf sheet (client root). INTEGRATED.
 * T-FE-4 vitalia-fase2-mateo-nueva-cita
 *
 * FULL-PAGE SHEET (AC-9 — no modal/drawer).
 * Integration ticket: replaces T-FE-1 placeholder selects/inputs
 * with real pickers from T-FE-2 and availability components from T-FE-3.
 *
 * Form sections (integrated):
 *   1. Servicio → ServicePicker → drives default duration + endTime
 *   2. Canal    → CanalPicker (walk_in | telefono)
 *   3. Fecha/hora inicio (SmartDateTimePicker, UTC to BE)
 *   4. Duración → drives endTime (editable, default 30 when service.dur=null)
 *   5. Hora fin (computed from start + duration, editable)
 *   6. Médico   → DoctorPicker → AvailabilityChip + DayAvailabilityStrip + FreeDoctorsList
 *   7. Paciente → PatientPickerWithCreate (typeahead + inline create)
 *   8. Notas internas (optional)
 *
 * Validation: RHF + Zod (CreateAppointmentRequestSchema).
 * Submit blocked until form valid AND availabilityStatus === "available" (RN-10).
 * availabilityStatus sourced from Zustand store (set by AvailabilityChip).
 *
 * Named exports only — NO default exports (FSD-Lite boundary enforcement).
 * downstream-regression-na: brand-local FE component; no cross-brand consumers
 * spec_anchor: 03-arch-fe.md § F3 + 06-tickets.yaml T-FE-4
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
// useAuth removed — T-FE-4: token no longer resolved here; hooks call getToken() per-request
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { useTenantLocale } from "@/hooks/useTenantLocale";
import {
  FormPageScaffold,
  PageHeader,
  SmartDateTimePicker,
} from "@luana/ui-kit";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useNuevaCitaServices,
  useNuevaCitaFreeDoctors,
  useNuevaCitaCreate,
} from "../../hooks/use-nueva-cita";
import type { CreateAppointmentPayload } from "../../hooks/use-nueva-cita";
import { useNuevaCitaStore } from "../../store/nueva-cita-store";
import { CreateAppointmentRequestSchema } from "../../types/agenda-schema";
import type { CreateAppointmentRequestDTO } from "../../types/agenda-schema";

// T-FE-2 pickers
import { ServicePicker } from "./ServicePicker";
import { DoctorPicker } from "./DoctorPicker";
import { PatientPickerWithCreate } from "./PatientPickerWithCreate";
import { CanalPicker } from "./CanalPicker";

// T-FE-3 availability
import { AvailabilityChip } from "./AvailabilityChip";
import { DayAvailabilityStrip } from "./DayAvailabilityStrip";
import { FreeDoctorsList } from "./FreeDoctorsList";

// T-FE-4 actions bar
import { NuevaCitaActions } from "./NuevaCitaActions";

// ── Constants ──────────────────────────────────────────────────────────────────

const DEFAULT_DURATION_MINUTES = 30;

// ── Props ──────────────────────────────────────────────────────────────────────

export interface NuevaCitaViewProps {
  tenantId: string;
  /** Prefilled from URL ?date= (YYYY-MM-DD). PHI-free scheduling data. */
  prefillDate?: string;
  /** Prefilled from URL ?time= (HH:mm). PHI-free scheduling data. */
  prefillTime?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Build UTC ISO string from date + time strings (local wall clock). */
function buildIsoFromDateAndTime(
  date: string | undefined,
  time: string | undefined,
  _timezone: string, // reserved for SmartDateTimePicker DST normalization
): string | undefined {
  if (!date || !time) return undefined;
  try {
    // ponytail: simple UTC construct for prefill; SmartDateTimePicker handles full DST
    const d = new Date(`${date}T${time}:00Z`);
    return d.toISOString();
  } catch {
    return undefined;
  }
}

/** Add durationMinutes to an ISO string and return new ISO string. */
function addMinutesToIso(isoStart: string, minutes: number): string {
  const d = new Date(isoStart);
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
}

// ── Component ──────────────────────────────────────────────────────────────────

/**
 * NuevaCitaView — full-page appointment creation sheet (INTEGRATED T-FE-4).
 *
 * AC-9: This is NOT a modal/drawer — it is a dedicated route page.
 * Back-pill navigates to /mateo/agenda.
 *
 * Submit blocked: !isValid || availabilityStatus !== "available" (RN-10).
 * availabilityStatus sourced from Zustand store (set by AvailabilityChip).
 */
export function NuevaCitaView({
  tenantId,
  prefillDate,
  prefillTime,
}: NuevaCitaViewProps) {
  const router = useRouter();
  // T-FE-4: token state + useEffect REMOVED. Each hook now calls getToken()
  // fresh inside its own queryFn/mutationFn so Clerk can transparently refresh
  // expired JWTs. Cached token caused 307→/sign-in on POST after ~60s.
  const locale = useTenantLocale();
  const timezone = locale.timezone ?? "America/Lima";

  // ── Zustand UI state ──────────────────────────────────────────────────────
  const selectedServiceId = useNuevaCitaStore((s) => s.selectedServiceId);
  const setSelectedServiceId = useNuevaCitaStore((s) => s.setSelectedServiceId);
  const selectedDoctorId = useNuevaCitaStore((s) => s.selectedDoctorId);
  const setSelectedDoctorId = useNuevaCitaStore((s) => s.setSelectedDoctorId);
  const availabilityStatus = useNuevaCitaStore((s) => s.availabilityStatus);
  const patientId = useNuevaCitaStore((s) => s.patientId);
  const setPatientId = useNuevaCitaStore((s) => s.setPatientId);
  const reset = useNuevaCitaStore((s) => s.reset);

  // ── Duration state (driven by selected service, editable by user) ─────────
  const [durationMinutes, setDurationMinutes] = React.useState<number>(
    DEFAULT_DURATION_MINUTES,
  );

  // ── RHF form ──────────────────────────────────────────────────────────────
  const prefillStartIso = React.useMemo(
    () => buildIsoFromDateAndTime(prefillDate, prefillTime, timezone),
    [prefillDate, prefillTime, timezone],
  );

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<CreateAppointmentRequestDTO>({
    resolver: zodResolver(CreateAppointmentRequestSchema),
    defaultValues: {
      origin: "walk_in",
      patientId: "",
      doctorId: "",
      serviceLabel: "",
      startTime: prefillStartIso ?? "",
      endTime: prefillStartIso
        ? addMinutesToIso(prefillStartIso, DEFAULT_DURATION_MINUTES)
        : "",
      notesInternal: null,
      currencyOverride: null,
    },
    mode: "onChange",
  });

  const startTime = watch("startTime");
  const endTime = watch("endTime");
  const origin = watch("origin");

  // ── React Query hooks ─────────────────────────────────────────────────────
  const { data: servicesData, isPending: servicesLoading } =
    useNuevaCitaServices({ tenantId });

  const { data: freeDoctorsData, isPending: doctorsLoading } =
    useNuevaCitaFreeDoctors({
      tenantId,
      startIso: startTime,
      durationMinutes,
    });

  const createMutation = useNuevaCitaCreate({ tenantId });

  // ── Sync selected service → duration default ──────────────────────────────
  React.useEffect(() => {
    if (!selectedServiceId || !servicesData) return;
    const svc = servicesData.items.find((s) => s.offerId === selectedServiceId);
    if (!svc) return;
    const dur = svc.initialApptDurationMinutes ?? DEFAULT_DURATION_MINUTES;
    setDurationMinutes(dur);
    if (startTime) {
      setValue("endTime", addMinutesToIso(startTime, dur), {
        shouldValidate: true,
      });
    }
    setValue("serviceLabel", svc.publicName, { shouldValidate: true });
  }, [selectedServiceId, servicesData, startTime, setValue]);

  // ── Sync selected doctor to form ──────────────────────────────────────────
  React.useEffect(() => {
    setValue("doctorId", selectedDoctorId ?? "", { shouldValidate: true });
  }, [selectedDoctorId, setValue]);

  // ── Sync patient to form ──────────────────────────────────────────────────
  React.useEffect(() => {
    setValue("patientId", patientId ?? "", { shouldValidate: true });
  }, [patientId, setValue]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleBack = React.useCallback(() => {
    reset();
    router.back();
  }, [reset, router]);

  const onSubmit = React.useCallback(
    (data: CreateAppointmentRequestDTO) => {
      createMutation.mutate(data as CreateAppointmentPayload, {
        onSuccess: () => {
          toast.success("Cita creada con éxito");
          reset();
          router.back();
        },
        onError: (err) => {
          const message =
            err instanceof Error
              ? err.message
              : "Error al crear la cita. Intenta de nuevo.";
          toast.error(message);
        },
      });
    },
    [createMutation, reset, router],
  );

  // ── Submit block: fail-closed RN-10 ──────────────────────────────────────
  // Block submit when:
  //   - form invalid (required fields missing, fin <= inicio, etc.)
  //   - availability not confirmed AVAILABLE (fail-closed — null = unknown = block)
  const isAvailabilityBlocked =
    availabilityStatus !== "available";

  const submitDisabled = !isValid || isAvailabilityBlocked;

  // ── Hint text for action bar ──────────────────────────────────────────────
  const actionHint = React.useMemo((): string | null => {
    if (!isValid) return "Completa los campos requeridos";
    if (!selectedDoctorId) return "Selecciona un médico";
    if (!startTime) return "Selecciona fecha y hora";
    if (availabilityStatus === null) return "Verificando disponibilidad…";
    if (availabilityStatus === "busy") return "El médico tiene un conflicto en este horario";
    if (availabilityStatus === "out_of_hours") return "El médico está fuera de su horario";
    if (availabilityStatus === "no_schedule") return "El médico no tiene horario registrado";
    // available
    return cn(
      "Canal:",
      origin === "walk_in" ? "presencial" : "teléfono",
    );
  }, [isValid, selectedDoctorId, startTime, availabilityStatus, origin]);

  // ── Date-only string for DayAvailabilityStrip ─────────────────────────────
  const dateLocal = startTime ? startTime.slice(0, 10) : "";

  // ── Loading gate ──────────────────────────────────────────────────────────
  const isLoading = servicesLoading && !servicesData;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      data-testid="nueva-cita-form"
    >
      <FormPageScaffold
        isLoading={isLoading}
        header={
          <PageHeader
            title="Nueva cita"
            backLabel="Agenda"
            onBack={handleBack}
          />
        }
      >
        {/* ── Sección: Servicio ─────────────────────────────────────────── */}
        <section aria-labelledby="nc-servicio-label" data-testid="nc-section-servicio">
          <Label
            id="nc-servicio-label"
            className="mb-1.5 block text-sm font-medium"
          >
            Servicio
          </Label>
          <ServicePicker
            services={servicesData?.items ?? []}
            value={selectedServiceId}
            loading={servicesLoading}
            onChange={({ offerId, durationMinutes: dur }) => {
              setSelectedServiceId(offerId);
              if (dur != null) {
                setDurationMinutes(dur);
                if (startTime) {
                  setValue("endTime", addMinutesToIso(startTime, dur), {
                    shouldValidate: true,
                  });
                }
              }
            }}
          />
          {errors.serviceLabel ? (
            <p className="mt-1 text-xs text-destructive" role="alert">
              {errors.serviceLabel.message}
            </p>
          ) : null}
        </section>

        {/* ── Sección: Canal ────────────────────────────────────────────── */}
        <section aria-labelledby="nc-canal-label" data-testid="nc-section-canal">
          <Label
            id="nc-canal-label"
            className="mb-1.5 block text-sm font-medium"
          >
            Canal de ingreso
          </Label>
          <Controller
            name="origin"
            control={control}
            render={({ field }) => (
              <CanalPicker
                value={field.value as "walk_in" | "telefono"}
                onChange={(canal) => field.onChange(canal)}
              />
            )}
          />
          {errors.origin ? (
            <p className="mt-1 text-xs text-destructive" role="alert">
              {errors.origin.message}
            </p>
          ) : null}
        </section>

        {/* ── Sección: Fecha y hora de inicio ──────────────────────────── */}
        <section aria-labelledby="nc-inicio-label" data-testid="nc-section-inicio">
          <Label
            id="nc-inicio-label"
            className="mb-1.5 block text-sm font-medium"
          >
            Fecha y hora de inicio
          </Label>
          <Controller
            name="startTime"
            control={control}
            render={({ field }) => (
              <SmartDateTimePicker
                value={field.value}
                onChange={(iso) => {
                  field.onChange(iso);
                  // Auto-update endTime when startTime changes
                  setValue("endTime", addMinutesToIso(iso, durationMinutes), {
                    shouldValidate: true,
                  });
                }}
                timezone={timezone}
                placeholder="Selecciona fecha y hora..."
              />
            )}
          />
          {errors.startTime ? (
            <p className="mt-1 text-xs text-destructive" role="alert">
              {errors.startTime.message}
            </p>
          ) : null}
        </section>

        {/* ── Sección: Duración ─────────────────────────────────────────── */}
        <section aria-labelledby="nc-duracion-label" data-testid="nc-section-duracion">
          <Label
            id="nc-duracion-label"
            htmlFor="nc-duracion"
            className="mb-1.5 block text-sm font-medium"
          >
            Duración (minutos)
          </Label>
          <Input
            id="nc-duracion"
            type="number"
            min={1}
            max={480}
            value={durationMinutes}
            data-testid="nc-duracion-input"
            onChange={(e) => {
              const dur = Math.max(
                1,
                parseInt(e.target.value, 10) || DEFAULT_DURATION_MINUTES,
              );
              setDurationMinutes(dur);
              if (startTime) {
                setValue("endTime", addMinutesToIso(startTime, dur), {
                  shouldValidate: true,
                });
              }
            }}
            className="w-32"
          />
        </section>

        {/* ── Sección: Hora de fin ──────────────────────────────────────── */}
        <section aria-labelledby="nc-fin-label" data-testid="nc-section-fin">
          <Label
            id="nc-fin-label"
            className="mb-1.5 block text-sm font-medium"
          >
            Fecha y hora de fin
          </Label>
          <Controller
            name="endTime"
            control={control}
            render={({ field }) => (
              <SmartDateTimePicker
                value={field.value}
                onChange={field.onChange}
                timezone={timezone}
                placeholder="Fin del turno..."
              />
            )}
          />
          {/* fin ≤ inicio error (SC-fin-invalido) */}
          {errors.endTime ? (
            <p
              className="mt-1 text-xs text-destructive"
              role="alert"
              data-testid="nc-end-time-error"
            >
              {errors.endTime.message}
            </p>
          ) : null}
        </section>

        {/* ── Sección: Médico ───────────────────────────────────────────── */}
        <section aria-labelledby="nc-medico-label" data-testid="nc-section-medico">
          <Label
            id="nc-medico-label"
            className="mb-1.5 block text-sm font-medium"
          >
            Médico
          </Label>

          {/* AvailabilityChip: shows when doctor + slot selected (T-FE-3) */}
          {selectedDoctorId && startTime ? (
            <div className="mb-2" data-testid="nc-availability-chip-container">
              <AvailabilityChip
                tenantId={tenantId}
                doctorId={selectedDoctorId}
                startIso={startTime}
                durationMinutes={durationMinutes}
              />
            </div>
          ) : null}

          <DoctorPicker
            doctors={freeDoctorsData?.doctors ?? []}
            value={selectedDoctorId}
            loading={doctorsLoading && !!startTime}
            disabled={!startTime}
            disabledReason="Selecciona fecha y hora primero"
            onChange={(doctorId) => setSelectedDoctorId(doctorId)}
          />
          {errors.doctorId ? (
            <p className="mt-1 text-xs text-destructive" role="alert">
              {errors.doctorId.message}
            </p>
          ) : null}

          {/* DayAvailabilityStrip: AC-8 mini-vista (T-FE-3) */}
          {startTime ? (
            <div className="mt-2" data-testid="nc-day-strip-container">
              <DayAvailabilityStrip
                tenantId={tenantId}
                doctorId={selectedDoctorId}
                dateLocal={dateLocal}
                selectedStartIso={startTime || null}
                selectedEndIso={endTime || null}
              />
            </div>
          ) : null}

          {/* FreeDoctorsList: reassign 1-click (T-FE-3) */}
          <div className="mt-3" data-testid="nc-free-doctors-container">
            <FreeDoctorsList
              tenantId={tenantId}
              startIso={startTime ?? ""}
              durationMinutes={durationMinutes}
              doctors={freeDoctorsData?.doctors ?? []}
              isPending={doctorsLoading}
            />
          </div>
        </section>

        {/* ── Sección: Paciente ─────────────────────────────────────────── */}
        <section aria-labelledby="nc-paciente-label" data-testid="nc-section-paciente">
          <Label
            id="nc-paciente-label"
            className="mb-1.5 block text-sm font-medium"
          >
            Paciente
          </Label>
          <PatientPickerWithCreate
            value={patientId}
            tenantId={tenantId}
            uiChannel={origin === "walk_in" ? "walk_in" : "telefono"}
            onChange={(resolvedPatientId) => {
              setPatientId(resolvedPatientId);
              setValue("patientId", resolvedPatientId, { shouldValidate: true });
            }}
          />
          {errors.patientId ? (
            <p className="mt-1 text-xs text-destructive" role="alert">
              {errors.patientId.message}
            </p>
          ) : null}
        </section>

        {/* ── Sección: Notas internas (opcional) ───────────────────────── */}
        <section aria-labelledby="nc-notas-label" data-testid="nc-section-notas">
          <Label
            id="nc-notas-label"
            htmlFor="nc-notas"
            className="mb-1.5 block text-sm font-medium"
          >
            Notas internas{" "}
            <span className="text-xs font-normal text-muted-foreground">
              (opcional)
            </span>
          </Label>
          <Controller
            name="notesInternal"
            control={control}
            render={({ field }) => (
              <Textarea
                id="nc-notas"
                placeholder="Notas visibles solo para el equipo..."
                maxLength={500}
                data-testid="nc-notas-textarea"
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value || null)}
                className="resize-none"
                rows={3}
              />
            )}
          />
        </section>
      </FormPageScaffold>

      {/* ── NuevaCitaActions — sticky bottom (T-FE-4) ─────────────────────── */}
      <NuevaCitaActions
        onCancel={handleBack}
        onSubmit={handleSubmit(onSubmit)}
        submitting={createMutation.isPending}
        submitDisabled={submitDisabled}
        hint={actionHint}
      />
    </form>
  );
}
