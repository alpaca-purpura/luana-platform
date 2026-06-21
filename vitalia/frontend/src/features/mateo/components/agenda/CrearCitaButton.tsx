// cap: scheduling.mateo-agenda
// story-origin: vitalia-fase2-s1-TBD
"use client";

/**
 * CrearCitaButton.tsx — Dropdown trigger for appointment creation.
 * T-16 vitalia-fase2-valeria-agenda
 *
 * Desktop variant: Button "Nueva cita" with DropdownMenu containing 3 opciones.
 * Mobile/FAB variant: fixed button bottom-right with DropdownMenu side="top" (UP direction).
 *
 * Each dropdown item opens a Dialog wrapping CrearCitaForm with the matching origin variant.
 *
 * Opciones (spec 01-spec.md § 4 microcopy):
 *   1. 👤 Paciente walk-in (nuevo)       → origin="walk_in"
 *   2. 📞 Reserva telefónica (nuevo)     → origin="telefono"
 *   3. 🔍 Desde paciente existente       → origin="existing_patient"
 *
 * Acceptance criteria:
 *   A2: DropdownMenu 3 opciones rendered + correct form variant opens
 *   A4: FAB fixed bottom-right on mobile + dropdown opens UP (side="top")
 *
 * Named exports only — NO default exports (FSD-Lite boundary enforcement).
 * downstream-regression-na: brand-local FE component; no cross-brand consumers
 * spec_anchor: 01-spec.md SC-2 + 03-arch.md § 6.9 + 06-tickets.yaml T-16
 */

import * as React from "react";
import { Plus, User, Phone, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CrearCitaForm, type CrearCitaOrigin } from "./CrearCitaForm";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CrearCitaButtonProps {
  /** Tenant ID passed down to CrearCitaForm. */
  tenantId: string;
  /** Clinic ID for HIPAA dual-filter, passed to CrearCitaForm. */
  clinicId: string;
  /** "button" (default, desktop) | "fab" (mobile fixed bottom-right). */
  variant?: "button" | "fab";
  /** Additional className for the outer wrapper. */
  className?: string;
}

// ── Dropdown option definitions ───────────────────────────────────────────────

interface CreateOption {
  origin: CrearCitaOrigin;
  label: string;
  description: string;
  icon: React.ElementType;
  testId: string;
}

const CREATE_OPTIONS: CreateOption[] = [
  {
    origin: "walk_in",
    label: "Paciente walk-in (nuevo)",
    description: "Paciente que llega sin cita previa",
    icon: User,
    testId: "crear-cita-walk-in",
  },
  {
    origin: "telefono",
    label: "Reserva telefónica (nuevo)",
    description: "Cita agendada por teléfono, paciente nuevo",
    icon: Phone,
    testId: "crear-cita-telefono",
  },
  {
    origin: "existing_patient",
    label: "Desde paciente existente",
    description: "Buscar paciente ya registrado en el sistema",
    icon: Search,
    testId: "crear-cita-existing",
  },
];

const ORIGIN_DIALOG_TITLE: Record<CrearCitaOrigin, string> = {
  walk_in: "Nueva cita — Paciente walk-in",
  telefono: "Nueva cita — Reserva telefónica",
  existing_patient: "Nueva cita — Paciente existente",
};

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * CrearCitaButton — DropdownMenu with 3 appointment creation modes.
 *
 * Usage in MateoAgendaView:
 * ```tsx
 * {/* Desktop - shown inline in toolbar *\/}
 * <CrearCitaButton variant="button" tenantId={tenantId} clinicId={clinicId} className="hidden md:flex" />
 * {/* Mobile FAB - fixed bottom-right *\/}
 * <CrearCitaButton variant="fab" tenantId={tenantId} clinicId={clinicId} className="md:hidden" />
 * ```
 */
export function CrearCitaButton({
  tenantId,
  clinicId,
  variant = "button",
  className,
}: CrearCitaButtonProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedOrigin, setSelectedOrigin] =
    React.useState<CrearCitaOrigin>("walk_in");

  const handleOptionSelect = React.useCallback((origin: CrearCitaOrigin) => {
    setSelectedOrigin(origin);
    setDialogOpen(true);
  }, []);

  const handleFormSuccess = React.useCallback(() => {
    setDialogOpen(false);
  }, []);

  const isFab = variant === "fab";

  return (
    <>
      {/* ── Dropdown trigger ─────────────────────────────────────────── */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {isFab ? (
            /* Mobile FAB — fixed bottom-right */
            <button
              type="button"
              aria-label="Nueva cita"
              data-testid="crear-cita-fab"
              className={cn(
                "fixed bottom-4 right-4 z-40",
                "flex items-center justify-center",
                "w-14 h-14 rounded-full",
                "bg-agent-valeria text-white",
                "shadow-lg hover:shadow-xl",
                "transition-all duration-150 hover:scale-105 active:scale-95",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                className,
              )}
            >
              <Plus className="w-6 h-6" aria-hidden="true" />
            </button>
          ) : (
            /* Desktop button */
            <Button
              type="button"
              data-testid="crear-cita-button"
              aria-label="Crear nueva cita"
              className={cn(
                "gap-2",
                className,
              )}
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Nueva cita
            </Button>
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent
          /* Mobile: open UP (side=top); Desktop: open DOWN (side=bottom) */
          side={isFab ? "top" : "bottom"}
          align={isFab ? "end" : "start"}
          className="w-64"
          data-testid="crear-cita-dropdown"
        >
          {CREATE_OPTIONS.map(({ origin, label, description, icon: Icon, testId }) => (
            <DropdownMenuItem
              key={origin}
              data-testid={testId}
              onClick={() => handleOptionSelect(origin)}
              className="flex items-start gap-3 py-2.5 cursor-pointer"
            >
              <div
                className="flex-shrink-0 w-7 h-7 rounded-md bg-muted flex items-center justify-center mt-0.5"
                aria-hidden="true"
              >
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs text-muted-foreground">
                  {description}
                </span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ── Form dialog ───────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="sm:max-w-md max-h-[90vh] overflow-y-auto p-0"
          aria-describedby="crear-cita-dialog-description"
        >
          <DialogHeader className="px-4 pt-4 pb-0">
            <DialogTitle>
              {ORIGIN_DIALOG_TITLE[selectedOrigin]}
            </DialogTitle>
            <DialogDescription id="crear-cita-dialog-description">
              Completa los datos para registrar la nueva cita en el sistema.
            </DialogDescription>
          </DialogHeader>

          <CrearCitaForm
            origin={selectedOrigin}
            tenantId={tenantId}
            clinicId={clinicId}
            onSuccess={handleFormSuccess}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
