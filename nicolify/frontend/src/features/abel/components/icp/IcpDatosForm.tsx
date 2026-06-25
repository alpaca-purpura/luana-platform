// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-4
"use client";
/**
 * IcpDatosForm.tsx — ICP "Datos" leaf form with grouped fields + WhatForChip per group.
 *
 * Groups (from 01-spec.md § 4.1 + mockup G1):
 *   1. Identidad         → label, description, vertical, companySize, geo, businessModel
 *   2. Firmográficos     → avgTicket, avgTicketCurrency, salesCycle
 *   3. Dolor & ángulo    → mainPain, salesAngle
 *   4. Señales           → signals[]
 *   5. Anti-patrón       → antiPattern
 *
 * Each group header has a WhatForChip showing the consuming agent(s) (RN-4).
 * Autosave on-change debounced 600ms via useAutosave<IcpPatchPayload> (RN-8 — never blocks).
 * AutosaveBadge renders status in form header — NO "Guardar" button.
 *
 * "Marcar listo" button: on 422 renders the missing[] inline next to the
 * offending groups — NO completeness bar (spec RN-8 / 03-arch-fe.md §9 D2 note).
 *
 * Currency RN-11: avgTicketCurrency is user-provided (ISO 4217).
 * NO hardcoded 'USD'.
 *
 * Named export (NO default) per FSD-Lite enforce.
 * spec_anchor: 03-arch-fe.md §3 Forms + RN-4 + RN-8 + RN-11
 * validators_gate: RN-8 (mark-ready missing[] inline) + RN-11 (no USD hardcode)
 */

import { zodResolver } from "@hookform/resolvers/zod";
import {
  FloatingAutosaveIndicator,
  Grid,
  Group,
  GroupHeader,
  PageSection,
  Stack,
  Textarea,
} from "@luana/ui-kit";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { WhatForChip } from "@/components/shared/WhatForChip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAutosave } from "@/hooks/use-autosave";
import { cn } from "@/lib/utils";

import { usePatchIcp, useMarkReadyIcp } from "../../hooks/use-icp-mutations";
import { icpFormSchema, type IcpFormValues } from "../../types/icp-schema";

import type { BuyerListItem } from "../../types/buyer";
import type { Icp, IcpPatchPayload } from "../../types/icp";

// ── Types ─────────────────────────────────────────────────────────────────────

interface IcpDatosFormProps {
  icpId: string;
  icp: Icp;
  /** Buyers list — used for mark-ready validation display (RN-8) */
  buyers: BuyerListItem[];
}

// ── 422 missing fields type ───────────────────────────────────────────────────

interface MarkReadyError {
  missing: string[];
}

function isMarkReadyError(body: unknown): body is MarkReadyError {
  return (
    typeof body === "object" &&
    body !== null &&
    "missing" in body &&
    Array.isArray((body as Record<string, unknown>).missing)
  );
}

// ── FieldRow wrapper ──────────────────────────────────────────────────────────

function FieldRow({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <Stack gap={1}>
      <label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-xs text-destructive" aria-live="polite">
          {error}
        </p>
      )}
    </Stack>
  );
}

// ── IcpGroupHeader helper — wraps kit GroupHeader + local WhatForChip in trailing ──
// Renders missing-fields alert with original data-testid for regression-test compat.

interface IcpGroupHeaderProps {
  title: string;
  consumers: React.ComponentProps<typeof WhatForChip>["consumers"];
  missingInGroup?: string[];
}

function IcpGroupHeader({ title, consumers, missingInGroup }: IcpGroupHeaderProps) {
  const hasMissing = (missingInGroup?.length ?? 0) > 0;
  return (
    <>
      <GroupHeader
        title={title}
        trailing={<WhatForChip consumers={consumers} fieldLabel={title} />}
      />
      {hasMissing && (
        <p
          role="alert"
          aria-live="polite"
          className="text-xs text-destructive font-medium -mt-2 mb-2"
          data-testid={`group-missing-${title.toLowerCase().replace(/\s+/g, "-")}`}
        >
          Falta: {(missingInGroup ?? []).join(", ")}
        </p>
      )}
    </>
  );
}

// ── IcpFormValues → IcpPatchPayload mapper ─────────────────────────────────────

/**
 * Maps a partial IcpFormValues object (single changed field) to an IcpPatchPayload.
 * IcpPatchPayload uses the SAME camelCase keys as IcpFormValues because
 * icpApi.patch calls toSnakePayload internally before the HTTP request.
 * Returns a partial payload containing only the changed field — minimal PATCH.
 */
function mapFieldToPatch(
  fieldName: keyof IcpFormValues,
  values: Partial<IcpFormValues>,
): IcpPatchPayload {
  // IcpPatchPayload = Partial<IcpCreatePayload> — all keys are camelCase.
  // The snake_case conversion happens in icpApi.patch (toSnakePayload).
  // Map: form field name → IcpPatchPayload key (1:1 since they share the same camelCase shape).
  const value = values[fieldName];
  return { [fieldName]: value };
}

// ── Main Component ─────────────────────────────────────────────────────────────

/**
 * IcpDatosForm — full ICP editing form with grouped fields.
 *
 * Five groups with WhatForChip (RN-4).
 * Autosave 600ms via useAutosave (ref-based, no stale closure). Mark-ready 422 → missing[] inline per group (no bar, RN-8).
 */
export function IcpDatosForm({ icpId, icp, buyers }: IcpDatosFormProps) {
  const patchIcp = usePatchIcp(icpId);
  const markReady = useMarkReadyIcp(icpId);

  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [markReadyAttempted, setMarkReadyAttempted] = useState(false);
  const [signalInput, setSignalInput] = useState("");

  // ── Autosave via canonical useAutosave hook (ref-based, no stale closure) ────
  const {
    schedule,
    flush,
    status: autosaveStatus,
  } = useAutosave<IcpPatchPayload>({
    saveFn: (payload) => patchIcp.mutateAsync(payload),
  });

  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useForm<IcpFormValues>({
    resolver: zodResolver(icpFormSchema),
    defaultValues: {
      label: icp.label ?? "",
      description: icp.description ?? "",
      vertical: icp.vertical ?? "",
      companySize: icp.companySize ?? "",
      geo: icp.geo ?? "",
      businessModel: icp.businessModel ?? "",
      avgTicket: icp.avgTicket ?? "",
      avgTicketCurrency: icp.avgTicketCurrency ?? "",
      salesCycle: icp.salesCycle ?? "",
      mainPain: icp.mainPain ?? "",
      salesAngle: icp.salesAngle ?? "",
      signals: icp.signals ?? [],
      antiPattern: icp.antiPattern ?? "",
    },
  });

  // ── Wire RHF watch → useAutosave (no stale closure) ──────────────────────────
  // The `name` arg from watch() tells us which field changed — we send a minimal
  // PATCH containing only that field (payload coalescing in useAutosave merges
  // multiple rapid changes into one PATCH).
  useEffect(() => {
    const subscription = watch((values, { name }) => {
      if (name) {
        // name is a specific field key — build a minimal patch for it
        const patch = mapFieldToPatch(name as keyof IcpFormValues, values);
        schedule(patch);
      }
    });
    return () => {
      subscription.unsubscribe();
      // Flush any pending save on unmount
      void flush();
    };
    // flush and schedule are stable refs from useAutosave (useCallback)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch]);

  // Mark-ready handler
  const handleMarkReady = useCallback(async () => {
    // Flush pending autosave before marking ready to ensure latest data is persisted
    await flush();
    setMarkReadyAttempted(true);
    setMissingFields([]);
    try {
      await markReady.mutateAsync();
      toast.success("ICP marcado como listo.");
      setMissingFields([]);
      setMarkReadyAttempted(false);
    } catch (err: unknown) {
      const isApiErr =
        err instanceof Error &&
        "body" in (err as Error & { body?: unknown }) &&
        "status" in (err as Error & { status?: unknown });
      if (isApiErr) {
        const apiErr = err as Error & { body?: unknown; status?: number };
        if (apiErr.status === 422 && isMarkReadyError(apiErr.body)) {
          setMissingFields(apiErr.body.missing);
          toast.error(`Para marcarlo listo falta: ${apiErr.body.missing.join(", ")}`);
          return;
        }
      }
      toast.error("No se pudo marcar como listo.");
    }
  }, [flush, markReady]);

  // Signal helpers — use getValues() to avoid stale closure + useMemo stabilisation
  const currentSignals = useMemo(
    () => watch("signals") ?? [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [watch("signals")],
  );

  const addSignal = useCallback(() => {
    const trimmed = signalInput.trim();
    const existing = watch("signals") ?? [];
    if (!trimmed || existing.includes(trimmed)) return;
    setValue("signals", [...existing, trimmed], { shouldDirty: true });
    setSignalInput("");
  }, [signalInput, watch, setValue]);

  const removeSignal = useCallback(
    (signal: string) => {
      const existing = watch("signals") ?? [];
      setValue(
        "signals",
        existing.filter((s) => s !== signal),
        { shouldDirty: true },
      );
    },
    [watch, setValue],
  );

  // Group-level missing fields (for inline display — RN-8)
  const missingForIdentidad = markReadyAttempted
    ? missingFields.filter((f) =>
        ["label", "description", "vertical", "company_size", "geo", "business_model"].includes(f),
      )
    : [];
  const missingForFirmograficos = markReadyAttempted
    ? missingFields.filter((f) => ["avg_ticket", "avg_ticket_currency", "sales_cycle"].includes(f))
    : [];
  const missingForDolor = markReadyAttempted
    ? missingFields.filter((f) => ["main_pain", "sales_angle"].includes(f))
    : [];
  const missingForSenales = markReadyAttempted ? missingFields.filter((f) => f === "signals") : [];
  const missingForAntipatron = markReadyAttempted
    ? missingFields.filter((f) => f === "anti_pattern")
    : [];

  const hasAtLeastOneBuyerWithRole = buyers.some((b) => b.role !== null && b.role !== "");
  const buyersMissing =
    markReadyAttempted && !hasAtLeastOneBuyerWithRole ? ["al menos un buyer con rol"] : [];

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="flex flex-col gap-0 p-6"
      data-testid="icp-datos-form"
      aria-label="Datos del perfil de cliente ideal"
    >
      {/* ── Grupo 1: Identidad ───────────────────────────────────────────────── */}
      <Group hasError={missingForIdentidad.length > 0} className="mb-3">
        <IcpGroupHeader
          title="Identidad"
          consumers={["abel", "christian"]}
          missingInGroup={missingForIdentidad}
        />
        <PageSection>
          <FieldRow label="Nombre del ICP *" htmlFor="icp-label" error={errors.label?.message}>
            <Input
              id="icp-label"
              {...register("label")}
              placeholder="ej. Agencia de marketing mediana — LATAM"
              data-testid="icp-field-label"
              className="text-sm"
            />
          </FieldRow>
          <FieldRow
            label="Descripción"
            htmlFor="icp-description"
            error={errors.description?.message}
          >
            <Textarea
              id="icp-description"
              {...register("description")}
              placeholder="Describe quién es este cliente ideal y por qué encaja contigo."
              data-testid="icp-field-description"
              className="resize-none text-sm"
            />
          </FieldRow>
          <Grid cols={2} gap={3}>
            <FieldRow
              label="Vertical / industria"
              htmlFor="icp-vertical"
              error={errors.vertical?.message}
            >
              <Input
                id="icp-vertical"
                {...register("vertical")}
                placeholder="ej. Marketing digital"
                data-testid="icp-field-vertical"
                className="text-sm"
              />
            </FieldRow>
            <FieldRow
              label="Tamaño de empresa"
              htmlFor="icp-company-size"
              error={errors.companySize?.message}
            >
              <Input
                id="icp-company-size"
                {...register("companySize")}
                placeholder="ej. 10-50 personas"
                data-testid="icp-field-company-size"
                className="text-sm"
              />
            </FieldRow>
          </Grid>
          <Grid cols={2} gap={3}>
            <FieldRow label="Geografía" htmlFor="icp-geo" error={errors.geo?.message}>
              <Input
                id="icp-geo"
                {...register("geo")}
                placeholder="ej. México, Colombia"
                data-testid="icp-field-geo"
                className="text-sm"
              />
            </FieldRow>
            <FieldRow
              label="Modelo de negocio"
              htmlFor="icp-business-model"
              error={errors.businessModel?.message}
            >
              <Input
                id="icp-business-model"
                {...register("businessModel")}
                placeholder="ej. Retainer mensual"
                data-testid="icp-field-business-model"
                className="text-sm"
              />
            </FieldRow>
          </Grid>
        </PageSection>
      </Group>

      {/* ── Grupo 2: Firmográficos ───────────────────────────────────────────── */}
      <Group hasError={missingForFirmograficos.length > 0} className="mb-3">
        <IcpGroupHeader
          title="Firmográficos"
          consumers={["brenda", "norvil"]}
          missingInGroup={missingForFirmograficos}
        />
        <PageSection>
          {/* avgTicket + avgTicketCurrency — RN-11: preserve currency, no 'USD' hardcode */}
          <Grid cols={3} gap={3}>
            <div className="col-span-2">
              <FieldRow
                label="Ticket promedio"
                htmlFor="icp-avg-ticket"
                error={errors.avgTicket?.message}
              >
                <Input
                  id="icp-avg-ticket"
                  {...register("avgTicket")}
                  placeholder="ej. 5000"
                  inputMode="decimal"
                  data-testid="icp-field-avg-ticket"
                  className="text-sm"
                />
              </FieldRow>
            </div>
            <FieldRow
              label="Moneda"
              htmlFor="icp-avg-ticket-currency"
              error={errors.avgTicketCurrency?.message}
            >
              {/* ISO 4217 — user provides (RN-11 preserve currency) */}
              <Input
                id="icp-avg-ticket-currency"
                {...register("avgTicketCurrency")}
                placeholder="MXN"
                maxLength={3}
                data-testid="icp-field-avg-ticket-currency"
                className="text-sm uppercase"
              />
              <p className="text-xs text-muted-foreground mt-0.5">
                Código ISO 4217 (ej. MXN, COP, USD, PEN)
              </p>
            </FieldRow>
          </Grid>
          <FieldRow
            label="Ciclo de venta"
            htmlFor="icp-sales-cycle"
            error={errors.salesCycle?.message}
          >
            <Input
              id="icp-sales-cycle"
              {...register("salesCycle")}
              placeholder="ej. 2-4 semanas"
              data-testid="icp-field-sales-cycle"
              className="text-sm"
            />
          </FieldRow>
        </PageSection>
      </Group>

      {/* ── Grupo 3: Dolor & ángulo ───────────────────────────────────────────── */}
      <Group hasError={missingForDolor.length > 0} className="mb-3">
        <IcpGroupHeader
          title="Dolor & ángulo"
          consumers={["christian", "abel"]}
          missingInGroup={missingForDolor}
        />
        <PageSection>
          <FieldRow
            label="Dolor principal"
            htmlFor="icp-main-pain"
            error={errors.mainPain?.message}
          >
            <Textarea
              id="icp-main-pain"
              {...register("mainPain")}
              placeholder="¿Qué problema crítico sufre este cliente y que tu servicio resuelve?"
              data-testid="icp-field-main-pain"
              rows={2}
              className="resize-none text-sm"
            />
          </FieldRow>
          <FieldRow
            label="Ángulo de venta"
            htmlFor="icp-sales-angle"
            error={errors.salesAngle?.message}
          >
            <Textarea
              id="icp-sales-angle"
              {...register("salesAngle")}
              placeholder="¿Cómo conectas el dolor con tu propuesta de valor única?"
              data-testid="icp-field-sales-angle"
              rows={2}
              className="resize-none text-sm"
            />
          </FieldRow>
        </PageSection>
      </Group>

      {/* ── Grupo 4: Señales ─────────────────────────────────────────────────── */}
      <Group hasError={missingForSenales.length > 0} className="mb-3">
        <IcpGroupHeader
          title="Señales de compra"
          consumers={["brenda", "christian"]}
          missingInGroup={missingForSenales}
        />
        <Stack gap={2}>
          <div className="flex flex-wrap gap-1.5 min-h-7" data-testid="icp-signals-container">
            {currentSignals.map((signal) => (
              <span
                key={signal}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-xs border border-border/60"
                data-testid={`signal-pill-${signal}`}
              >
                {signal}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSignal(signal)}
                  aria-label={`Eliminar señal: ${signal}`}
                  className="h-4 w-4 text-muted-foreground hover:text-destructive hover:bg-transparent p-0 ml-0.5"
                  data-testid={`signal-remove-${signal}`}
                >
                  ×
                </Button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={signalInput}
              onChange={(e) => setSignalInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSignal();
                }
              }}
              placeholder="Escribe una señal y presiona Enter"
              className="text-sm flex-1"
              data-testid="icp-signal-input"
              aria-label="Nueva señal de compra"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSignal}
              data-testid="icp-signal-add-btn"
              disabled={!signalInput.trim()}
            >
              Agregar
            </Button>
          </div>
        </Stack>
      </Group>

      {/* ── Grupo 5: Anti-patrón ─────────────────────────────────────────────── */}
      <Group hasError={missingForAntipatron.length > 0} className="mb-3">
        <IcpGroupHeader
          title="Anti-patrón"
          consumers={["abel"]}
          missingInGroup={missingForAntipatron}
        />
        <FieldRow
          label="Anti-patrón del ICP"
          htmlFor="icp-anti-pattern"
          error={errors.antiPattern?.message}
        >
          <Textarea
            id="icp-anti-pattern"
            {...register("antiPattern")}
            placeholder="¿Qué tipo de cliente NO quieres atender? Describe el perfil que debes evitar."
            data-testid="icp-field-anti-pattern"
            rows={2}
            className="resize-none text-sm"
          />
        </FieldRow>
      </Group>

      {/* ── Mark-ready ───────────────────────────────────────────────────────── */}
      <Stack gap={2} className="mt-2 pt-4 border-t border-border/40">
        {buyersMissing.length > 0 && (
          <p
            role="alert"
            aria-live="polite"
            className="text-xs text-destructive"
            data-testid="mark-ready-buyers-missing"
          >
            Para marcarlo listo falta: {buyersMissing.join(", ")}
          </p>
        )}
        {markReadyAttempted && missingFields.length > 0 && (
          <p
            aria-live="polite"
            className="text-xs text-muted-foreground"
            data-testid="mark-ready-missing-summary"
          >
            Completa los campos marcados en rojo antes de continuar.
          </p>
        )}
        <div className="flex items-center justify-end">
          <Button
            type="button"
            onClick={() => {
              void handleMarkReady();
            }}
            disabled={markReady.isPending || icp.status === "listo"}
            aria-busy={markReady.isPending}
            data-testid="icp-mark-ready-btn"
            className={cn(
              "text-sm",
              icp.status === "listo"
                ? "bg-agent-brenda text-white hover:bg-agent-brenda/90"
                : "bg-agent-abel text-white hover:bg-agent-abel/90",
            )}
          >
            {icp.status === "listo"
              ? "✓ Listo"
              : markReady.isPending
                ? "Guardando…"
                : "Marcar listo"}
          </Button>
        </div>
      </Stack>

      {/* ── Autosave indicator — canon §2.6: UNA por página, sticky bottom-center ── */}
      <FloatingAutosaveIndicator status={autosaveStatus} />
    </form>
  );
}
