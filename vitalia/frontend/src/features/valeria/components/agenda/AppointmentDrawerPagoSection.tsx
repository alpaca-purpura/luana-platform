"use client";

/**
 * AppointmentDrawerPagoSection.tsx — "Pago" accordion section for AppointmentDrawer.
 * T-14 vitalia-fase2-valeria-agenda
 *
 * Renders:
 *   - Payment status badge (pagado / con depósito / sin pago)
 *   - Balance due / paid display (via formatTenantMoney)
 *   - <CobrarSaldoSubform /> placeholder slot (T-15 ships the real form)
 *   - Historical payments list (if any)
 *
 * Slot pattern: CobrarSaldoSubform is feature T-15. Here we render a placeholder
 * stub that T-15 builder will replace in-place. The stub renders a disabled
 * "Cobrar saldo" trigger area + tooltip "Disponible en T-15".
 *
 * HIPAA-lite: amounts use bucketed cents (no PHI). Currency from appointment data.
 * Master-data: formatTenantMoney() from lib/tenant-locale — NEVER hardcode 'USD'.
 *
 * Named exports only — NO default exports (FSD-Lite boundary enforcement).
 * downstream-regression-na: brand-local FE component; no cross-brand consumers
 * spec_anchor: 03-arch.md § 6.6 + § 6.7 + 06-tickets.yaml T-14
 */

import { CreditCard, Receipt, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Appointment, AppointmentPayment } from "../../types/agenda.types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AppointmentDrawerPagoSectionProps {
  /** Full appointment detail from useAppointmentDetail. */
  appointment: Appointment;
  /** Tenant currency fallback (from useTenantLocale). */
  tenantCurrency: string;
  /** Tenant locale string for Intl.NumberFormat (e.g., "es-PE"). */
  tenantLocale: string;
}

// ── Status badge config ───────────────────────────────────────────────────────

type PaymentBadgeConfig = {
  label: string;
  className: string;
};

const PAYMENT_STATUS_BADGE: Record<string, PaymentBadgeConfig> = {
  paid: {
    label: "Pagado",
    className: "border-green-500 text-green-700 bg-green-50 dark:bg-green-950/20 dark:text-green-400",
  },
  deposit: {
    label: "Con depósito",
    className: "border-yellow-500 text-yellow-700 bg-yellow-50 dark:bg-yellow-950/20 dark:text-yellow-400",
  },
  unpaid: {
    label: "Sin pago",
    className: "border-destructive text-destructive bg-destructive/5",
  },
  no_show: {
    label: "No asistió",
    className: "border-muted-foreground text-muted-foreground bg-muted/20",
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Formats cents to display currency string.
 * Uses Intl.NumberFormat with locale and currency from tenant.
 * NEVER hardcodes 'USD' — fallback chain from appointment data → tenantCurrency.
 */
function formatMoney(
  amountCents: number | null,
  currency: string,
  locale: string,
): string {
  if (amountCents === null) return "—";
  const amount = amountCents / 100;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Formats ISO 8601 to short date-time (e.g., "27/05/2026 14:30").
 */
function formatShortDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString("es-419", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Efectivo",
  efectivo: "Efectivo",
  card: "Tarjeta",
  tarjeta: "Tarjeta",
  transfer: "Transferencia",
  transferencia: "Transferencia",
  mercadopago: "MercadoPago",
  mercado_pago: "MercadoPago",
  other: "Otro",
  otro: "Otro",
};

// ── Subcomponents ─────────────────────────────────────────────────────────────

interface PaymentRowProps {
  payment: AppointmentPayment;
  currency: string;
  locale: string;
}

function PaymentRow({ payment, currency, locale }: PaymentRowProps) {
  const effectiveCurrency = payment.currency ?? currency;
  const methodLabel = PAYMENT_METHOD_LABELS[payment.method] ?? payment.method;

  return (
    <div
      className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 text-sm"
      data-testid="payment-row"
    >
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="font-medium">
          {formatMoney(payment.amountCents, effectiveCurrency, locale)}
        </span>
        <span className="text-xs text-muted-foreground">
          {methodLabel} · {formatShortDateTime(payment.createdAt)}
        </span>
        {payment.createdByLabel && (
          <span className="text-xs text-muted-foreground truncate">
            {payment.createdByLabel}
          </span>
        )}
      </div>
      {payment.fiscalDocUrl ? (
        <a
          href={payment.fiscalDocUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs text-primary underline-offset-2 hover:underline flex items-center gap-1"
          aria-label="Ver comprobante fiscal"
        >
          <FileText className="h-3.5 w-3.5" aria-hidden="true" />
          {payment.fiscalDocType ?? "Comprobante"}
        </a>
      ) : (
        <span className="shrink-0 text-xs text-muted-foreground flex items-center gap-1">
          <Receipt className="h-3.5 w-3.5" aria-hidden="true" />
          Sin comprobante
        </span>
      )}
    </div>
  );
}

// ── CobrarSaldoSubform placeholder (T-15 slot) ────────────────────────────────

/**
 * Placeholder slot for CobrarSaldoSubform (T-15).
 * T-15 builder will replace this component in-place.
 * The disabled state + tooltip communicates to staff that cobro is coming.
 *
 * Slot ID: "cobrar-saldo-subform-slot" — T-15 targets this for replacement.
 */
function CobrarSaldoSubformPlaceholder({ hasDueBalance }: { hasDueBalance: boolean }) {
  if (!hasDueBalance) return null;

  return (
    <div
      id="cobrar-saldo-subform-slot"
      data-testid="cobrar-saldo-placeholder"
      className="rounded-md border border-dashed border-primary/40 bg-primary/5 p-4"
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="flex items-center gap-2 cursor-not-allowed"
            aria-disabled="true"
            role="group"
            aria-label="Cobrar saldo (próximamente)"
          >
            <CreditCard
              className="h-4 w-4 text-primary/60 shrink-0"
              aria-hidden="true"
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-primary/70">
                Cobrar saldo
              </span>
              <span className="text-xs text-muted-foreground">
                Formulario de cobro — disponible en T-15
              </span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          Cobro de saldo — disponible próximamente en la siguiente iteración
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

/**
 * Pago section — balance summary + cobrar subform placeholder + payment history.
 */
export function AppointmentDrawerPagoSection({
  appointment,
  tenantCurrency,
  tenantLocale,
}: AppointmentDrawerPagoSectionProps) {
  // Currency: per-appointment override takes precedence over tenant default
  const effectiveCurrency = appointment.currencyOverride ?? appointment.currency ?? tenantCurrency;
  const statusConfig = PAYMENT_STATUS_BADGE[appointment.paymentStatus] ??
    PAYMENT_STATUS_BADGE.unpaid;

  const hasDueBalance =
    appointment.balanceDueCents !== null &&
    appointment.balanceDueCents > 0 &&
    appointment.appointmentStatus !== "CANCELLED" &&
    appointment.appointmentStatus !== "NO_SHOW";

  return (
    <div
      className="flex flex-col gap-4"
      data-testid="pago-section"
    >
      {/* Payment status + balance summary */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Estado de pago:</span>
          <Badge
            variant="outline"
            className={cn("text-xs", statusConfig.className)}
          >
            {statusConfig.label}
          </Badge>
        </div>

        {/* Balance display */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {appointment.balancePaidCents !== null && (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Pagado</span>
              <span className="font-medium text-green-700 dark:text-green-400">
                {formatMoney(appointment.balancePaidCents, effectiveCurrency, tenantLocale)}
              </span>
            </div>
          )}
          {appointment.balanceDueCents !== null && (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Saldo pendiente</span>
              <span
                className={cn(
                  "font-medium",
                  appointment.balanceDueCents > 0
                    ? "text-destructive"
                    : "text-green-700 dark:text-green-400",
                )}
              >
                {formatMoney(appointment.balanceDueCents, effectiveCurrency, tenantLocale)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* CobrarSaldoSubform placeholder slot (T-15 will replace this) */}
      <CobrarSaldoSubformPlaceholder hasDueBalance={hasDueBalance} />

      {/* Payment history */}
      {appointment.payments.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Historial de pagos
          </span>
          <div
            className="rounded-md border bg-card/50"
            role="list"
            aria-label="Historial de pagos"
          >
            {appointment.payments.map((payment) => (
              <div key={payment.paymentId} role="listitem">
                <PaymentRow
                  payment={payment}
                  currency={effectiveCurrency}
                  locale={tenantLocale}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {appointment.payments.length === 0 && !hasDueBalance && (
        <p className="text-sm text-muted-foreground text-center py-2">
          Sin registros de pago
        </p>
      )}
    </div>
  );
}
