// cap: scheduling.mateo-agenda
/**
 * PatientPickerWithCreate.tsx — Patient typeahead with inline create.
 * T-FE-2 vitalia-fase2-mateo-nueva-cita
 *
 * AC-10: Creates patient WITHOUT leaving the nueva-cita form.
 * RN-9: BE is_duplicate=true → prompts "¿Usar existente?" before resolving.
 *
 * States:
 *   "picker"   — EntityPicker typeahead (default)
 *   "create"   — Inline mini-form (name + phone)
 *   "duplicate"— Duplicate-phone confirmation prompt (RN-9)
 *
 * Controlled: value/onChange → parent stores patientId in RHF/Zustand.
 *
 * Named exports only — NO default exports (FSD-Lite boundary enforcement).
 * downstream-regression-na: brand-local FE; no cross-brand consumers
 * spec_anchor: 03-arch-fe.md § F4 + 06-tickets.yaml T-FE-2
 */

"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { EntityPicker } from "@luana/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";
import { useSearchPatients, useCreatePatientInline } from "../../hooks/use-patients";
import type { PatientPickerItem, PatientInlineCreateResult } from "../../hooks/use-patients";

// ── Inline create schema (minimal — name required, phone optional per BE contract) ──
// Bug #5 fix: phone defaults to "" from RHF defaultValues. An empty string is NOT
// null/undefined, so z.string().min(6)... fails even when the field is blank.
// Fix: accept "" as valid (empty = absent) and transform to null before BE payload.
//
// RHF + Zod transform typing note:
//  - z.input<> = form field values (RHF sees: phone = string | "" | null | undefined)
//  - z.output<> = submitted data after transform (phone = string | null)
//  - useForm<InlineCreateFormInput> to avoid TFieldValues mismatch
//  - handleInlineSubmit receives InlineCreateFormOutput (post-transform)
const InlineCreateSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(120),
  phone: z
    .union([
      z.string().min(6, "Ingresa un teléfono válido").max(20),
      z.literal(""),
    ])
    .nullable()
    .optional()
    .transform((v): string | null => (v === "" || v == null ? null : v)),
});

// Input type = what RHF manages in DOM fields (before transform)
type InlineCreateFormInput = z.input<typeof InlineCreateSchema>;
// Output type = what handleInlineSubmit receives (after transform)
type InlineCreateFormOutput = z.output<typeof InlineCreateSchema>;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PatientPickerWithCreateProps {
  /** Resolved patientId — null until selected/created */
  value: string | null;
  /** Called with patientId when resolved (picker or inline create) */
  onChange: (patientId: string) => void;
  tenantId: string;
  // token removed — hooks call getToken() fresh per-request (T-FE-4)
  /** UI channel context — drives channel mapping for inline create */
  uiChannel?: "walk_in" | "telefono";
  disabled?: boolean;
  className?: string;
}

type Mode = "picker" | "create" | "duplicate";

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * PatientPickerWithCreate
 *
 * Mode "picker": EntityPicker typeahead.
 *   - createAction fires when user types and clicks "+ Crear paciente «{q}»"
 *   - Selecting an existing patient calls onChange immediately
 *
 * Mode "create": Inline mini-form (name + phone).
 *   - Submit → useCreatePatientInline mutation
 *   - On success + !isDuplicate → onChange(patientId), back to picker
 *   - On success + isDuplicate → mode "duplicate" (RN-9)
 *
 * Mode "duplicate": Shows "Ya existe {nameMasked} · ¿usar ese?" prompt.
 *   - "Usar existente" → onChange(patientId), back to picker
 *   - "Crear de todas formas" → (future scope, not in T-FE-2; returns to picker)
 */
export function PatientPickerWithCreate({
  value: _value, // ponytail: controlled prop for parent; internal display via selectedPatient state
  onChange,
  tenantId,
  uiChannel = "walk_in",
  disabled = false,
  className,
}: PatientPickerWithCreateProps) {
  const [mode, setMode] = React.useState<Mode>("picker");
  const [pendingDuplicate, setPendingDuplicate] =
    React.useState<PatientInlineCreateResult | null>(null);
  const [selectedPatient, setSelectedPatient] =
    React.useState<PatientPickerItem | null>(null);

  const { searchFn } = useSearchPatients({ tenantId });
  const createMutation = useCreatePatientInline({ tenantId });

  const form = useForm<InlineCreateFormInput, unknown, InlineCreateFormOutput>({
    resolver: zodResolver(InlineCreateSchema),
    defaultValues: { name: "", phone: "" },
    mode: "onSubmit",
  });

  // ── EntityPicker: user selects existing patient ──────────────────────────
  const handlePickerChange = (item: PatientPickerItem) => {
    setSelectedPatient(item);
    onChange(item.id);
  };

  // ── createAction: user clicks "+ Crear…" in the dropdown ─────────────────
  const handleCreateOpen = (_query: string) => {
    // Prefill name from the typed query
    form.reset({ name: _query, phone: "" });
    setMode("create");
  };

  // ── Inline form submit ────────────────────────────────────────────────────
  const handleInlineSubmit = async (data: InlineCreateFormOutput) => {
    try {
      const result = await createMutation.mutateAsync({
        name: data.name,
        phone: data.phone,
        email: null,
        uiChannel,
        note: null,
      });

      if (result.isDuplicate) {
        setPendingDuplicate(result);
        setMode("duplicate");
      } else {
        // Cosmético: reflejar el paciente recién creado en el trigger del picker
        // (sin esto el trigger volvía a "— Buscar paciente…" aunque el form sí
        // tenía el patientId). El EntityPicker pinta value.name.
        setSelectedPatient({
          id: result.patientId,
          name: result.nameMasked,
          phoneMasked: null,
          channelFirst: null,
        });
        setMode("picker");
        onChange(result.patientId);
      }
    } catch {
      // Error shown via createMutation.error — form stays open
    }
  };

  // ── RN-9: user accepts existing patient ───────────────────────────────────
  const handleUseExisting = () => {
    if (pendingDuplicate) {
      onChange(pendingDuplicate.patientId);
    }
    setMode("picker");
    setPendingDuplicate(null);
  };

  // ── Back to picker ────────────────────────────────────────────────────────
  const handleCancel = () => {
    setMode("picker");
    setPendingDuplicate(null);
    form.reset({ name: "", phone: "" });
  };

  // ── Render: Duplicate prompt (RN-9) ──────────────────────────────────────
  if (mode === "duplicate" && pendingDuplicate) {
    return (
      <div
        data-testid="patient-duplicate-prompt"
        className={cn(
          "rounded-md border border-yellow-400 bg-yellow-50 p-4 text-sm",
          className,
        )}
      >
        <p className="mb-3 font-medium text-yellow-800">
          Ya existe un paciente con ese teléfono:{" "}
          <strong>{pendingDuplicate.nameMasked}</strong>
        </p>
        <p className="mb-4 text-yellow-700">¿Usar ese paciente existente?</p>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            data-testid="patient-duplicate-use-existing"
            onClick={handleUseExisting}
          >
            Usar existente
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            data-testid="patient-duplicate-cancel"
            onClick={handleCancel}
          >
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  // ── Render: Inline create form ────────────────────────────────────────────
  if (mode === "create") {
    return (
      <div
        data-testid="patient-inline-form"
        className={cn("rounded-md border bg-card p-4", className)}
      >
        <p className="mb-3 text-sm font-medium">Nuevo paciente</p>
        {/* ponytail: minimal create — name + phone only per T-FE-2 scope.
            NOT a <form>: this picker mounts inside NuevaCitaView's outer <form>,
            and nested <form>s are invalid HTML → hydration error swallows the
            submit (no POST fires). Use a div + button onClick; Enter on a field
            triggers the same handler. (bugfix: nested-form found in live-verify) */}
        <div
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void form.handleSubmit(handleInlineSubmit)();
            }
          }}
        >
          <div className="mb-3">
            <Label htmlFor="patient-inline-name-field" className="mb-1 block text-xs">
              Nombre <span aria-hidden="true" className="text-destructive">*</span>
            </Label>
            <Input
              id="patient-inline-name-field"
              data-testid="patient-inline-name"
              {...form.register("name")}
              placeholder="Nombre completo"
              autoFocus
              aria-invalid={!!form.formState.errors.name}
            />
            {form.formState.errors.name && (
              <p
                data-testid="patient-inline-name-error"
                className="mt-1 text-xs text-destructive"
                role="alert"
              >
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="mb-4">
            <Label htmlFor="patient-inline-phone-field" className="mb-1 block text-xs">
              Teléfono
            </Label>
            <Input
              id="patient-inline-phone-field"
              data-testid="patient-inline-phone"
              {...form.register("phone")}
              placeholder="+54 9 11 1234 5678"
              type="tel"
            />
            {form.formState.errors.phone && (
              <p
                data-testid="patient-inline-phone-error"
                className="mt-1 text-xs text-destructive"
                role="alert"
              >
                {form.formState.errors.phone.message}
              </p>
            )}
          </div>

          {createMutation.error && (
            <p
              data-testid="patient-inline-create-error"
              className="mb-3 text-xs text-destructive"
              role="alert"
            >
              Error al crear el paciente. Intenta nuevamente.
            </p>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              data-testid="patient-inline-submit"
              disabled={createMutation.isPending}
              onClick={() => void form.handleSubmit(handleInlineSubmit)()}
            >
              {createMutation.isPending ? "Guardando…" : "Crear paciente"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              data-testid="patient-inline-cancel"
              onClick={handleCancel}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: EntityPicker (default) ────────────────────────────────────────
  return (
    <EntityPicker<PatientPickerItem>
      className={className}
      disabled={disabled}
      placeholder="Buscar paciente…"
      searchPlaceholder="Nombre o teléfono…"
      emptyLabel="Sin pacientes. Escribe para crear uno nuevo."
      testId="patient-picker"
      value={selectedPatient}
      onChange={handlePickerChange}
      searchFn={searchFn}
      createAction={{
        label: (q) => `Crear paciente «${q}»`,
        onCreate: handleCreateOpen,
      }}
    />
  );
}
