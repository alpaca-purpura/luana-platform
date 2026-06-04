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
 * Autosave on-change debounced 600ms via usePatchIcp (RN-8 — never blocks).
 * Toast "Guardado." on success.
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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { WhatForChip } from "@/components/shared/WhatForChip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { usePatchIcp, useMarkReadyIcp } from "../../hooks/use-icp-mutations";
import { icpFormSchema, type IcpFormValues } from "../../types/icp-schema";
import type { Icp } from "../../types/icp";
import type { BuyerListItem } from "../../types/buyer";

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

// ── Textarea helper ────────────────────────────────────────────────────────────

function Textarea({
  className,
  rows = 3,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { rows?: number }) {
  return (
    <textarea
      rows={rows}
      className={cn(
        "flex w-full rounded-md border border-input bg-background px-3 py-2",
        "text-sm ring-offset-background placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50 resize-none",
        className,
      )}
      {...props}
    />
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
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-xs text-destructive" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}

// ── Group header helper ────────────────────────────────────────────────────────

interface GroupHeaderProps {
  title: string;
  consumers: React.ComponentProps<typeof WhatForChip>["consumers"];
  missingInGroup?: string[];
}

function GroupHeader({ title, consumers, missingInGroup }: GroupHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <WhatForChip consumers={consumers} fieldLabel={title} />
      </div>
      {missingInGroup && missingInGroup.length > 0 && (
        <p
          role="alert"
          aria-live="polite"
          className="text-xs text-destructive font-medium"
          data-testid={`group-missing-${title.toLowerCase().replace(/\s+/g, "-")}`}
        >
          Falta: {missingInGroup.join(", ")}
        </p>
      )}
    </div>
  );
}

// ── Group container ────────────────────────────────────────────────────────────

function Group({ children, hasMissing }: { children: React.ReactNode; hasMissing?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 mb-3 transition-colors",
        hasMissing ? "border-destructive/40" : "border-border/60",
      )}
    >
      {children}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

/**
 * IcpDatosForm — full ICP editing form with grouped fields.
 *
 * Five groups with WhatForChip (RN-4).
 * Autosave 600ms. Mark-ready 422 → missing[] inline per group (no bar, RN-8).
 */
export function IcpDatosForm({ icpId, icp, buyers }: IcpDatosFormProps) {
  const patchIcp = usePatchIcp(icpId);
  const markReady = useMarkReadyIcp(icpId);

  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [markReadyAttempted, setMarkReadyAttempted] = useState(false);
  const [signalInput, setSignalInput] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    register,
    watch,
    setValue,
    formState: { errors, isDirty },
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

  // Autosave on change (debounce 600ms)
  const scheduleAutosave = useCallback(
    (values: IcpFormValues) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        patchIcp.mutate(values, {
          onSuccess: () => {
            toast.success("Guardado.", { duration: 1800 });
          },
          onError: () => {
            toast.error("Error al guardar. Intenta de nuevo.");
          },
        });
      }, 600);
    },
    [patchIcp],
  );

  useEffect(() => {
    const subscription = watch((values) => {
      if (isDirty) {
        scheduleAutosave(values as IcpFormValues);
      }
    });
    return () => {
      subscription.unsubscribe();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [watch, isDirty, scheduleAutosave]);

  // Mark-ready handler
  const handleMarkReady = useCallback(async () => {
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
  }, [markReady]);

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
      <Group hasMissing={missingForIdentidad.length > 0}>
        <GroupHeader
          title="Identidad"
          consumers={["abel", "christian"]}
          missingInGroup={missingForIdentidad}
        />
        <div className="flex flex-col gap-3">
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
            />
          </FieldRow>
          <div className="grid grid-cols-2 gap-3">
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
          </div>
          <div className="grid grid-cols-2 gap-3">
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
          </div>
        </div>
      </Group>

      {/* ── Grupo 2: Firmográficos ───────────────────────────────────────────── */}
      <Group hasMissing={missingForFirmograficos.length > 0}>
        <GroupHeader
          title="Firmográficos"
          consumers={["brenda", "norvil"]}
          missingInGroup={missingForFirmograficos}
        />
        <div className="flex flex-col gap-3">
          {/* avgTicket + avgTicketCurrency — RN-11: preserve currency, no 'USD' hardcode */}
          <div className="grid grid-cols-3 gap-3">
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
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Código ISO 4217 (ej. MXN, COP, USD, PEN)
              </p>
            </FieldRow>
          </div>
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
        </div>
      </Group>

      {/* ── Grupo 3: Dolor & ángulo ───────────────────────────────────────────── */}
      <Group hasMissing={missingForDolor.length > 0}>
        <GroupHeader
          title="Dolor & ángulo"
          consumers={["christian", "abel"]}
          missingInGroup={missingForDolor}
        />
        <div className="flex flex-col gap-3">
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
            />
          </FieldRow>
        </div>
      </Group>

      {/* ── Grupo 4: Señales ─────────────────────────────────────────────────── */}
      <Group hasMissing={missingForSenales.length > 0}>
        <GroupHeader
          title="Señales de compra"
          consumers={["brenda", "christian"]}
          missingInGroup={missingForSenales}
        />
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1.5 min-h-[28px]" data-testid="icp-signals-container">
            {currentSignals.map((signal) => (
              <span
                key={signal}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-xs border border-border/60"
                data-testid={`signal-pill-${signal}`}
              >
                {signal}
                <button
                  type="button"
                  onClick={() => removeSignal(signal)}
                  aria-label={`Eliminar señal: ${signal}`}
                  className="text-muted-foreground hover:text-destructive transition-colors ml-0.5"
                  data-testid={`signal-remove-${signal}`}
                >
                  ×
                </button>
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
        </div>
      </Group>

      {/* ── Grupo 5: Anti-patrón ─────────────────────────────────────────────── */}
      <Group hasMissing={missingForAntipatron.length > 0}>
        <GroupHeader
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
          />
        </FieldRow>
      </Group>

      {/* ── Mark-ready ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-border/40">
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
      </div>
    </form>
  );
}
