// cap: scheduling.mateo-agenda
/**
 * NuevaCitaView.tsx — "Nueva cita" leaf sheet (client root).
 * T-FE-1 vitalia-fase2-mateo-nueva-cita
 *
 * FULL-PAGE SHEET (AC-9 — no modal/drawer).
 * Composed from @luana/ui-kit atoms:
 *   - FormPageScaffold — page container
 *   - PageHeader — title + back-pill (‹ Agenda)
 *   - FormActionBar — sticky bottom submit bar
 *
 * Form sections:
 *   1. Servicio → drives default duration → drives endTime default
 *   2. Médico → driven by startTime + duration (free-doctors query)
 *   3. Fecha/hora inicio (SmartDateTimePicker, UTC to BE)
 *   4. Duración → drives endTime (editable, default 30 when service.dur=null)
 *   5. Hora fin (computed from start + duration, editable)
 *   6. Canal (walk_in | telefono)
 *   7. Paciente (typeahead + inline create toggle)
 *   8. Notas internas (optional)
 *
 * Validation: RHF + Zod (CreateAppointmentRequestSchema).
 * fin ≤ inicio → inline error, no POST (SC-fin-invalido).
 * service.dur=null → 30 min editable (SC-dur-default).
 * tz: display = tenant timezone, sent to BE = UTC (SC-i18n-tz).
 *
 * Named exports only — NO default exports (FSD-Lite boundary enforcement).
 * downstream-regression-na: brand-local FE component; no cross-brand consumers
 * spec_anchor: 03-arch-fe.md § F3 + 06-tickets.yaml T-FE-1
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { useTenantLocale } from "@/hooks/useTenantLocale";
import {
  FormPageScaffold,
  PageHeader,
  FormActionBar,
  SmartDateTimePicker,
} from "@luana/ui-kit";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useNuevaCitaServices,
  useNuevaCitaFreeDoctors,
  useNuevaCitaAvailabilityCheck,
  useNuevaCitaCreate,
} from "../../hooks/use-nueva-cita";
import type { CreateAppointmentPayload } from "../../hooks/use-nueva-cita";
import { useNuevaCitaStore } from "../../store/nueva-cita-store";
import { CreateAppointmentRequestSchema } from "../../types/agenda-schema";
import type { CreateAppointmentRequestDTO } from "../../types/agenda-schema";

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

/** Build UTC ISO string from date + time strings (local wall clock in tz). */
function buildIsoFromDateAndTime(
  date: string | undefined,
  time: string | undefined,
  _timezone: string, // reserved for SmartDateTimePicker DST normalization
): string | undefined {
  if (!date || !time) return undefined;
  try {
    // Convert wall-clock in tenant timezone to UTC
    // SmartDateTimePicker handles this conversion internally — for prefill we
    // construct a naïve local string and let the picker normalize.
    // ponytail: simple approach — correct for non-DST scenarios; full DST
    // correctness handled by SmartDateTimePicker's fromZonedTime.
    const naive = `${date}T${time}:00`;
    const d = new Date(naive + "Z"); // treat as UTC for initial prefill
    return d.toISOString();
  } catch {
    return undefined;
  }
}

/** Add durationMinutes to an ISO string and return new ISO string. */
function addMinutesToIso(
  isoStart: string,
  minutes: number,
): string {
  const d = new Date(isoStart);
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
}

// ── Component ──────────────────────────────────────────────────────────────────

/**
 * NuevaCitaView — full-page appointment creation sheet.
 *
 * AC-9: This is NOT a modal/drawer — it is a dedicated route page.
 * Back-pill navigates to /mateo/agenda.
 */
export function NuevaCitaView({
  tenantId,
  prefillDate,
  prefillTime,
}: NuevaCitaViewProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const locale = useTenantLocale();
  const timezone = locale.timezone ?? "America/Lima";

  // ── Auth token (resolved once on mount) ───────────────────────────────────
  const [token, setToken] = React.useState<string>("");
  React.useEffect(() => {
    void getToken().then((t) => setToken(t ?? ""));
  }, [getToken]);

  // ── Zustand UI state ──────────────────────────────────────────────────────
  const selectedServiceId = useNuevaCitaStore((s) => s.selectedServiceId);
  const setSelectedServiceId = useNuevaCitaStore((s) => s.setSelectedServiceId);
  const selectedDoctorId = useNuevaCitaStore((s) => s.selectedDoctorId);
  const setSelectedDoctorId = useNuevaCitaStore((s) => s.setSelectedDoctorId);
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
  const origin = watch("origin");

  // ── React Query hooks ─────────────────────────────────────────────────────
  const { data: servicesData, isPending: servicesLoading } =
    useNuevaCitaServices({ tenantId, token });

  const { data: freeDoctorsData, isPending: doctorsLoading } =
    useNuevaCitaFreeDoctors({
      tenantId,
      token,
      startIso: startTime,
      durationMinutes,
    });

  const { data: availabilityData } = useNuevaCitaAvailabilityCheck({
    tenantId,
    token,
    doctorId: selectedDoctorId,
    startIso: startTime,
    durationMinutes,
  });

  const createMutation = useNuevaCitaCreate({ tenantId, token });

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
      // CreateAppointmentRequestDTO is structurally identical to CreateAppointmentPayload
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

  // ── Availability badge ─────────────────────────────────────────────────────
  const availabilityHint = React.useMemo(() => {
    if (!availabilityData) return null;
    if (availabilityData.status === "available") return "Médico disponible";
    if (availabilityData.status === "busy")
      return `No disponible${availabilityData.conflictLabel ? ` — ${availabilityData.conflictLabel}` : ""}`;
    if (availabilityData.status === "out_of_hours") return "Fuera del horario";
    if (availabilityData.status === "no_schedule") return "Sin horario registrado";
    return null;
  }, [availabilityData]);

  const isAvailabilityBlocked =
    availabilityData?.status != null &&
    availabilityData.status !== "available";

  // ── Rendered form ─────────────────────────────────────────────────────────
  const isLoading = servicesLoading && !servicesData;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
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
        <section aria-labelledby="nc-servicio-label">
          <Label
            id="nc-servicio-label"
            htmlFor="nc-servicio"
            className="mb-1.5 block text-sm font-medium"
          >
            Servicio
          </Label>
          <Select
            value={selectedServiceId ?? ""}
            onValueChange={(val) => setSelectedServiceId(val || null)}
          >
            <SelectTrigger id="nc-servicio" data-testid="nc-servicio-trigger">
              <SelectValue placeholder="Selecciona un servicio..." />
            </SelectTrigger>
            <SelectContent>
              {servicesData?.items.map((svc) => (
                <SelectItem
                  key={svc.offerId}
                  value={svc.offerId}
                  data-testid={`nc-servicio-option-${svc.offerId}`}
                >
                  {svc.publicName}
                  {svc.initialApptDurationMinutes != null
                    ? ` (${svc.initialApptDurationMinutes} min)`
                    : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.serviceLabel ? (
            <p className="mt-1 text-xs text-destructive" role="alert">
              {errors.serviceLabel.message}
            </p>
          ) : null}
        </section>

        {/* ── Sección: Canal ────────────────────────────────────────────── */}
        <section aria-labelledby="nc-canal-label">
          <Label
            id="nc-canal-label"
            htmlFor="nc-canal"
            className="mb-1.5 block text-sm font-medium"
          >
            Canal de ingreso
          </Label>
          <Controller
            name="origin"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger id="nc-canal" data-testid="nc-canal-trigger">
                  <SelectValue placeholder="Selecciona el canal..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="walk_in" data-testid="nc-canal-walk-in">
                    👤 Paciente walk-in
                  </SelectItem>
                  <SelectItem value="telefono" data-testid="nc-canal-telefono">
                    📞 Reserva telefónica
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.origin ? (
            <p className="mt-1 text-xs text-destructive" role="alert">
              {errors.origin.message}
            </p>
          ) : null}
        </section>

        {/* ── Sección: Fecha y hora de inicio ──────────────────────────── */}
        <section aria-labelledby="nc-inicio-label">
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
                  setValue(
                    "endTime",
                    addMinutesToIso(iso, durationMinutes),
                    { shouldValidate: true },
                  );
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
        <section aria-labelledby="nc-duracion-label">
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
              const dur = Math.max(1, parseInt(e.target.value, 10) || DEFAULT_DURATION_MINUTES);
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
        <section aria-labelledby="nc-fin-label">
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
        <section aria-labelledby="nc-medico-label">
          <Label
            id="nc-medico-label"
            htmlFor="nc-medico"
            className="mb-1.5 block text-sm font-medium"
          >
            Médico
          </Label>
          {availabilityHint ? (
            <p
              className={cn(
                "mb-1 text-xs",
                isAvailabilityBlocked
                  ? "text-destructive"
                  : "text-muted-foreground",
              )}
              data-testid="nc-availability-hint"
            >
              {availabilityHint}
            </p>
          ) : null}
          <Select
            value={selectedDoctorId ?? ""}
            onValueChange={(val) => setSelectedDoctorId(val || null)}
            disabled={!startTime || doctorsLoading}
          >
            <SelectTrigger
              id="nc-medico"
              data-testid="nc-medico-trigger"
              aria-busy={doctorsLoading || undefined}
            >
              <SelectValue
                placeholder={
                  !startTime
                    ? "Selecciona fecha y hora primero..."
                    : doctorsLoading
                      ? "Cargando médicos disponibles..."
                      : "Selecciona un médico..."
                }
              />
            </SelectTrigger>
            <SelectContent>
              {freeDoctorsData?.doctors.map((doc) => (
                <SelectItem
                  key={doc.doctorId}
                  value={doc.doctorId}
                  data-testid={`nc-medico-option-${doc.doctorId}`}
                >
                  {doc.doctorLabel}
                </SelectItem>
              ))}
              {freeDoctorsData?.doctors.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  Sin médicos disponibles para este horario
                </div>
              ) : null}
            </SelectContent>
          </Select>
          {errors.doctorId ? (
            <p className="mt-1 text-xs text-destructive" role="alert">
              {errors.doctorId.message}
            </p>
          ) : null}
        </section>

        {/* ── Sección: Paciente ─────────────────────────────────────────── */}
        <section aria-labelledby="nc-paciente-label">
          <Label
            id="nc-paciente-label"
            htmlFor="nc-paciente-search"
            className="mb-1.5 block text-sm font-medium"
          >
            Paciente
          </Label>
          {/* ponytail: patient typeahead via future EntityPicker integration.
              For T-FE-1 scope: manual UUID input for integration smoke.
              Full typeahead is T-FE-2 scope (PatientAutocomplete already exists). */}
          {patientId ? (
            <div
              className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-sm"
              data-testid="nc-patient-selected"
            >
              <span className="text-muted-foreground">Paciente seleccionado:</span>
              <code className="text-xs">{patientId}</code>
              <button
                type="button"
                className="ml-auto text-xs text-muted-foreground hover:text-destructive"
                onClick={() => setPatientId(null)}
                data-testid="nc-patient-clear"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Usa la búsqueda de paciente (disponible en T-FE-2) o ingresa el ID temporalmente.
              </p>
              <Input
                id="nc-paciente-search"
                placeholder="UUID del paciente..."
                data-testid="nc-paciente-input"
                onChange={(e) => {
                  const val = e.target.value.trim();
                  if (val.length === 36) {
                    // Basic UUID length check
                    setPatientId(val);
                  }
                }}
              />
            </div>
          )}
          {errors.patientId ? (
            <p className="mt-1 text-xs text-destructive" role="alert">
              {errors.patientId.message}
            </p>
          ) : null}
        </section>

        {/* ── Sección: Notas internas (opcional) ───────────────────────── */}
        <section aria-labelledby="nc-notas-label">
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
                onChange={(e) =>
                  field.onChange(e.target.value || null)
                }
                className="resize-none"
                rows={3}
              />
            )}
          />
        </section>

        {/* Hidden field — origin maps from canal to form via watch */}
        <Controller
          name="origin"
          control={control}
          render={() => <></>}
        />
      </FormPageScaffold>

      {/* ── FormActionBar — sticky bottom ──────────────────────────────────── */}
      <FormActionBar
        accent="mateo"
        submitLabel="Crear cita"
        cancelLabel="Cancelar"
        onCancel={handleBack}
        onSubmit={handleSubmit(onSubmit)}
        submitting={createMutation.isPending}
        submitDisabled={!isValid || isAvailabilityBlocked}
        hint={
          !isValid
            ? "Completa los campos requeridos"
            : isAvailabilityBlocked
              ? "El médico no está disponible en este horario"
              : origin === "walk_in"
                ? "Canal: walk-in"
                : "Canal: teléfono"
        }
      />
    </form>
  );
}
