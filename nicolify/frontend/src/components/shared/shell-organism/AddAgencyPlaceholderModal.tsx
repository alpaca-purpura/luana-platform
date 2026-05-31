// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-2
"use client";

/**
 * AddAgencyPlaceholderModal — "Agregar agencia" placeholder dialog.
 * nicolify-r0-shell T-2 — port from vitalia AddClinicPlaceholderModal, re-themed to Nicolify.
 *
 * Client Component ("use client") — uses useState for open/close.
 *
 * Microcopy verbatim (Spanish neutro, no voseo):
 * - Trigger: "Agregar agencia"
 * - Title: "Próximamente"
 * - Body: "Próximamente: agregar nueva agencia desde Configurar → Mi cuenta"
 * - Close CTA: "Entendido"
 *
 * This is a placeholder — full agency onboarding flow is deferred.
 *
 * Named export (no default export) per FSD-Lite enforce.
 * downstream-regression-na: brand-local shell-organism component; no cross-brand consumers
 */

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export interface AddAgencyPlaceholderModalProps {
  /** Children rendered as trigger element (receives onClick handler) */
  children: React.ReactNode;
}

/**
 * AddAgencyPlaceholderModal — controlled dialog wrapper.
 * Renders children as trigger; opens Dialog on click.
 * Client Component.
 */
export function AddAgencyPlaceholderModal({ children }: AddAgencyPlaceholderModalProps) {
  const [open, setOpen] = useState(false);

  function handleOpen() {
    setOpen(true);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  return (
    <>
      {/* Trigger — wrap children with click handler */}
      <span
        role="button"
        tabIndex={0}
        onClick={handleOpen}
        onKeyDown={handleKeyDown}
        className="contents"
      >
        {children}
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Próximamente</DialogTitle>
            <DialogDescription>
              Próximamente: agregar nueva agencia desde Configurar → Mi cuenta
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="default" onClick={handleClose} data-testid="add-agency-modal-close">
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
