// cap: lisa.servicios
// story-origin: vitalia-fase2-lisa-servicios T-7
"use client";
/**
 * PlanPagoView.tsx — Leaf 4: Plan de pago (3 cobros separados).
 *
 * spec §Workspace Pestaña 4 · 01-spec.md §Workspace Pestaña 4:
 *   1. Precio del tratamiento: precio + moneda + precio publicable
 *   2. Reserva de la cita (seña): monto fijo o % + flag pide/no-pide
 *   3. Anticipo para iniciar: % o monto + flag ofrece/no
 *   4. Financiamiento: ofrece cuotas + N cuotas + interés/MSI + ≈ por mes
 *
 * Price stored on ServiceDetail.price (core PATCH). Other payment fields
 * are brand-level (not wired to BE in Sub-phase A scope — rendered as
 * display-only structure with TODO markers for Sub-phase B).
 */

import { useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Group, GroupHeader, FloatingAutosaveIndicator, Switch } from "@luana/ui-kit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAutosave } from "@/hooks/use-autosave";
import {
  useServicioDetail,
  usePatchField,
} from "../../../api/servicios";
import type { ServicePatchRequest } from "../../../types/servicios.types";
import { NumberWithUnit } from "@/components/shared/NumberWithUnit";
import { useTenantLocale } from "@/hooks/useTenantLocale";

// ── Schema (price only in Sub-phase A) ───────────────────────────────────────
const planPagoSchema = z.object({
  price: z.number().min(0, "El precio no puede ser negativo"),
});
type PlanPagoFormValues = z.infer<typeof planPagoSchema>;

interface PlanPagoViewProps {
  offerId: string;
}

export function PlanPagoView({ offerId }: PlanPagoViewProps) {
  const { data: servicio } = useServicioDetail({ offerId });
  const locale = useTenantLocale();
  const { mutateAsync: patchAsync } = usePatchField(offerId);

  const saveFn = useCallback(
    (patch: ServicePatchRequest) => patchAsync(patch),
    [patchAsync],
  );
  const { schedule, status } = useAutosave<ServicePatchRequest>({ saveFn });

  const form = useForm<PlanPagoFormValues>({
    resolver: zodResolver(planPagoSchema),
    defaultValues: { price: servicio?.price ?? 0 },
  });

  if (!servicio) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-muted rounded-md animate-pulse" />
        ))}
      </div>
    );
  }

  const currency = servicio.currency ?? locale.currency;

  return (
    <div className="p-5 md:p-6 space-y-6 pb-24">
      {/* ── 1. Precio del tratamiento ──────────────────────────────────────── */}
      <Group accentVar="--agent-lisa">
        <GroupHeader title="Precio del tratamiento" />

        <div className="flex items-end gap-3">
          <div className="space-y-2 flex-1">
            <Label htmlFor="price">Precio</Label>
            <Controller
              control={form.control}
              name="price"
              render={({ field, fieldState }) => (
                <>
                  <NumberWithUnit
                    value={field.value}
                    onChange={(v) => {
                      field.onChange(v);
                      schedule({ price: v });
                    }}
                    unit={currency}
                    min={0}
                    step={50}
                  />
                  {fieldState.error && (
                    <p className="text-sm text-destructive">{fieldState.error.message}</p>
                  )}
                </>
              )}
            />
          </div>
          <Badge variant="outline" className="mb-2">
            {currency}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <Switch id="price_public" defaultChecked />
          <Label htmlFor="price_public" className="cursor-pointer">
            Precio publicable (Adrián lo menciona en chat)
          </Label>
        </div>
      </Group>

      {/* ── 2. Reserva de la cita (seña) ─────────────────────────────────── */}
      <Group>
        <GroupHeader title="Reserva de la cita" />
        <p className="text-sm text-muted-foreground">
          Monto chico para apartar el turno. Se descuenta del total.
        </p>

        <div className="flex items-center gap-3">
          <Switch id="pide_reserva" />
          <Label htmlFor="pide_reserva" className="cursor-pointer">
            Solicitar reserva (seña)
          </Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reserva_monto">Monto de la reserva</Label>
          <NumberWithUnit
            value={0}
            onChange={() => {/* Sub-phase B */}}
            unit={currency}
            min={0}
            step={50}
            disabled
          />
          <p className="text-xs text-muted-foreground">
            (Disponible próximamente — Sub-phase B)
          </p>
        </div>
      </Group>

      {/* ── 3. Anticipo para iniciar ─────────────────────────────────────── */}
      <Group>
        <GroupHeader title="Anticipo para iniciar" />
        <p className="text-sm text-muted-foreground">
          Pago inicial sobre el costo del tratamiento. Aparte de la reserva.
        </p>

        <div className="flex items-center gap-3">
          <Switch id="ofrece_anticipo" />
          <Label htmlFor="ofrece_anticipo" className="cursor-pointer">
            Solicitar anticipo
          </Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="anticipo_monto">Anticipo (%)</Label>
          <Input
            id="anticipo_monto"
            type="number"
            min={0}
            max={100}
            placeholder="30"
            disabled
          />
          <p className="text-xs text-muted-foreground">
            (Disponible próximamente — Sub-phase B)
          </p>
        </div>
      </Group>

      {/* ── 4. Financiamiento del saldo ──────────────────────────────────── */}
      <Group>
        <GroupHeader title="Financiamiento" />
        <p className="text-sm text-muted-foreground">
          Opciones de pago en cuotas para el saldo restante.
        </p>

        <div className="flex items-center gap-3">
          <Switch id="ofrece_cuotas" />
          <Label htmlFor="ofrece_cuotas" className="cursor-pointer">
            Ofrece cuotas
          </Label>
        </div>

        <div className="flex gap-3 [&>div]:flex-1">
          <div className="space-y-2">
            <Label htmlFor="n_cuotas">Número de cuotas</Label>
            <Input id="n_cuotas" type="number" min={2} placeholder="12" disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="interes">Interés / MSI</Label>
            <Input id="interes" placeholder="Sin interés (MSI)" disabled />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          (Disponible próximamente — Sub-phase B)
        </p>
      </Group>

      {/* Autosave indicator — ONE per page (canon §2.6) */}
      <FloatingAutosaveIndicator status={status} />
    </div>
  );
}
