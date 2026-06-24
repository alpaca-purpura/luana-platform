// cap: scheduling.mateo-agenda
/**
 * NuevaCitaView.tsx — "Nueva cita" leaf sheet (client root). INTEGRATED.
 * T-FE-4 vitalia-fase2-mateo-nueva-cita
 *
 * FULL-PAGE SHEET (AC-9 — no modal/drawer).
 * Layout: 2-column on lg+. Left = form fields; Right = availability panel.
 * On narrow screens collapses to 1-column stacked.
 *
 * Form sections (left column, MOCKUP ORDER):
 *   1. Canal    → CanalPicker (walk_in | telefono)
 *   2. Paciente → PatientPickerWithCreate (typeahead + inline create)
 *   3. Servicio → ServicePicker → drives default duration + endTime
 *   4+5. Fecha/hora inicio + Duración (2-col row)
 *   6. Hora fin → computed read-only display with "editar" link revealing SmartDateTimePicker
 *   7. Médico   → DoctorPicker
 *   8. Notas internas (optional)
 *
 * Right column:
 *   - AvailabilityChip (doctor + slot selected)
 *   - DayAvailabilityStrip (full strip)
 *   - FreeDoctorsList
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

/** Format ISO string to HH:mm wall-clock display. */
function isoToHHMM(isoString: string): string {
  try {
    const d = new Date(isoString);
    const h = d.getUTCHours().toString().padStart(2, "0");
    const m = d.getUTCMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  } catch {
    return "";
  }
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

  // ── Hora de fin: "editar" toggle (mockup diff #4) ─────────────────────────
  // Default: computed display ("09:30 · ⚙ autocalculado"); "editar" reveals picker
  const [endTimeEditMode, setEndTimeEditMode] = React.useState(false);

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
  // shouldValidate sólo cuando hay un valor REAL: en el mount estos efectos corren
  // con selectedDoctorId/patientId = null → setValue("", {shouldValidate:true})
  // disparaba "ID de médico/paciente inválido" sobre un form PRISTINO (parece roto).
  // Validar sólo en selección real; el form vacío valida recién al submit.
  React.useEffect(() => {
    setValue("doctorId", selectedDoctorId ?? "", { shouldValidate: !!selectedDoctorId });
  }, [selectedDoctorId, setValue]);

  // ── Sync patient to form ──────────────────────────────────────────────────
  React.useEffect(() => {
    setValue("patientId", patientId ?? "", { shouldValidate: !!patientId });
  }, [patientId, setValue]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleBack = React.useCallback(() => {
    reset();
    router.back();
  }, [reset, router]);

  const onSubmit = React.useCallback(
    (data: CreateAppointmentRequestDTO) => {
      // offerId (real FK, NOT NULL in BE) comes from the selected service in the
      // store, not from the RHF form (which carries serviceLabel for display).
      const payload = {
        ...data,
        offerId: selectedServiceId ?? "",
      } as CreateAppointmentPayload;
      createMutation.mutate(payload, {
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
    [createMutation, reset, router, selectedServiceId],
  );

  // ── Submit block: fail-closed RN-10 ──────────────────────────────────────
  // Block submit when:
  //   - form invalid (required fields missing, fin <= inicio, etc.)
  //   - availability not confirmed AVAILABLE (fail-closed — null = unknown = block)
  const isAvailabilityBlocked =
    availabilityStatus !== "available";

  const submitDisabled = !isValid || isAvailabilityBlocked;

  // ── Date-only string for DayAvailabilityStrip ─────────────────────────────
  const dateLocal = startTime ? startTime.slice(0, 10) : "";

  // ── Loading gate ──────────────────────────────────────────────────────────
  const isLoading = servicesLoading && !servicesData;

  // ── Computed fin display ──────────────────────────────────────────────────
  const endTimeDisplay = endTime ? isoToHHMM(endTime) : null;

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
        {/* ── 2-col grid: Left = form fields · Right = availability ──────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">

          {/* ── LEFT COLUMN: Datos de la cita ──────────────────────────────── */}
          <div className="flex flex-col gap-5" data-testid="nc-col-form">
            <h2 className="text-base font-semibold text-foreground">Datos de la cita</h2>

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

            {/* ── Secciones: Fecha/hora inicio + Duración (2-col row) ─────── */}
            <div className="grid grid-cols-2 gap-4" data-testid="nc-row-2">
              {/* Fecha y hora de inicio */}
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
                        // Exit manual edit mode — computed value re-syncs
                        setEndTimeEditMode(false);
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

              {/* Duración */}
              <section aria-labelledby="nc-duracion-label" data-testid="nc-section-duracion">
                <Label
                  id="nc-duracion-label"
                  htmlFor="nc-duracion"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Duración (min)
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
                      setEndTimeEditMode(false);
                    }
                  }}
                />
              </section>
            </div>

            {/* ── Sección: Hora de fin ──────────────────────────────────────── */}
            <section aria-labelledby="nc-fin-label" data-testid="nc-section-fin">
              <Label
                id="nc-fin-label"
                className="mb-1.5 block text-sm font-medium"
              >
                Hora de fin
              </Label>
              {endTimeEditMode ? (
                /* Manual edit mode — full SmartDateTimePicker */
                <div className="flex flex-col gap-1">
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
                  <button
                    type="button"
                    className="self-start text-xs text-muted-foreground underline hover:text-foreground"
                    onClick={() => setEndTimeEditMode(false)}
                  >
                    volver a autocalculado
                  </button>
                </div>
              ) : (
                /* Computed display (default) */
                <div className="flex items-center gap-2 rounded-md border border-input bg-muted/50 px-3 py-2 text-sm">
                  {endTimeDisplay ? (
                    <>
                      <span className="font-medium tabular-nums">{endTimeDisplay}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <svg
                          aria-hidden="true"
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.764-.384.93-.781.165-.397.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z"
                          />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                        autocalculado
                      </span>
                      <button
                        type="button"
                        className="ml-auto text-xs text-primary underline hover:opacity-80"
                        onClick={() => setEndTimeEditMode(true)}
                        data-testid="nc-fin-editar"
                      >
                        editar
                      </button>
                    </>
                  ) : (
                    <span className="text-muted-foreground">
                      Se calculará al seleccionar inicio y duración
                    </span>
                  )}
                </div>
              )}
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
          </div>

          {/* ── RIGHT COLUMN: Disponibilidad del médico ────────────────────── */}
          <div className="flex flex-col gap-4" data-testid="nc-col-avail">
            <h2 className="text-base font-semibold text-foreground">Disponibilidad del médico</h2>

            {/* AvailabilityChip: shows when doctor + slot selected (T-FE-3) */}
            {selectedDoctorId && startTime ? (
              <div data-testid="nc-availability-chip-container">
                <AvailabilityChip
                  tenantId={tenantId}
                  doctorId={selectedDoctorId}
                  startIso={startTime}
                  durationMinutes={durationMinutes}
                />
              </div>
            ) : null}

            {/* DayAvailabilityStrip: AC-8 mini-vista (T-FE-3) */}
            {startTime ? (
              <div data-testid="nc-day-strip-container">
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
            <div data-testid="nc-free-doctors-container">
              <FreeDoctorsList
                tenantId={tenantId}
                startIso={startTime ?? ""}
                durationMinutes={durationMinutes}
                doctors={freeDoctorsData?.doctors ?? []}
                isPending={doctorsLoading}
              />
            </div>
          </div>
        </div>
      </FormPageScaffold>

      {/* ── NuevaCitaActions — sticky bottom (T-FE-4) ─────────────────────── */}
      <NuevaCitaActions
        onCancel={handleBack}
        onSubmit={handleSubmit(onSubmit)}
        submitting={createMutation.isPending}
        submitDisabled={submitDisabled}
        hint="Sin guardar todavía · los datos no se pierden si navegas dentro de la hoja."
      />
    </form>
  );
}
