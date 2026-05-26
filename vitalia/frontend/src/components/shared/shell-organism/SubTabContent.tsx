/**
 * SubTabContent — dispatcher organismo.
 * F1-S10 vitalia-fase1-empty-states — T-9 (PLACEHOLDER_MAP fully populated)
 *
 * Maps 22 {agent}.{subtab} combos → placeholder component or EmptyState fallback.
 * Consumes RIBBON_SUBTABS SSoT (READ-ONLY) for metadata lookup.
 * Imports placeholder components via each feature's public API (index.ts) per FSD-Lite.
 *
 * Architecture invariants (arch tests T-9):
 *   - PLACEHOLDER_MAP keys must be a subset of RIBBON_SUBTABS keys (no orphans)
 *   - PLACEHOLDER_MAP contains exactly 22 keys (all sub-tabs covered)
 *   - No hardcoded sub-tab key strings outside this file (arch test enforces)
 *   - No PHI real data in placeholder mock data (hipaa-lite arch test enforces)
 *
 * Server Component default — no "use client" (dispatcher is pure Server).
 * Placeholders that need client state ("use client") mark themselves.
 * Named export (NO default) per FSD-Lite enforce.
 *
 * spec_anchor: 03-arch.md § 4
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import type { ComponentType } from "react";
import type { RibbonTabSlug } from "@/lib/agent-catalog";
import { RIBBON_SUBTABS } from "@/lib/agent-catalog";
import { SubTabHeader } from "./SubTabHeader";
import { EmptyState } from "./EmptyState";

// ── Lisa placeholders — via public API (T-2 generic + T-3 special) ───────────────
import {
  MarcaPlaceholder,
  DoctoresPlaceholder,
  ServiciosPlaceholder,
  CompliancePlaceholder,
} from "@/features/lisa";

// ── Lucas placeholders — via public API (T-2 generic) ────────────────────────────
import {
  LanzarPlaceholder,
  EnvueloPlaceholder,
  RecursosPlaceholder,
  ResultadosPlaceholder,
  MercadoPlaceholder,
} from "@/features/lucas";

// ── Adrián placeholders — via public API (T-2 generic + T-4 + T-6 special) ───────
import {
  InboxPlaceholder,
  EmbudoPlaceholder,
  OutboundPlaceholder,
  PropuestasPlaceholder,
} from "@/features/adrian";

// ── Valeria placeholders — via public API (T-2 generic + T-7 special) ────────────
import { AgendaPlaceholder, PacientesPlaceholder } from "@/features/valeria";

// ── Camila placeholders — via public API (T-2 generic + T-8 special) ─────────────
import {
  VozPlaceholder,
  ReactivarPlaceholder,
  MultiplicarPlaceholder,
  ReputacionPlaceholder,
} from "@/features/camila";

// ── Config placeholders — via public API (T-2 generic + T-3 special) ─────────────
import {
  CuentaPlaceholder,
  ConexionesPlaceholder,
  AvanzadoPlaceholder,
} from "@/features/config";

// ── Type helpers ─────────────────────────────────────────────────────────────────
type PlaceholderComponent = ComponentType;
type SubTabKey = `${RibbonTabSlug}.${string}`;

// ── PLACEHOLDER_MAP — 22 keys (T-9 fully populated) ─────────────────────────────
// Architecture test verifies this map contains exactly 22 keys from RIBBON_SUBTABS.
// Keys: 'lisa.marca' | 'lisa.doctores' | ... (22 total, no 'mateo.*')
// DO NOT hardcode these keys elsewhere — arch test enforces this file as SSoT.
const PLACEHOLDER_MAP = {
  // lisa (4) — T-2 generic + T-3 servicios special
  "lisa.marca": MarcaPlaceholder,
  "lisa.doctores": DoctoresPlaceholder,
  "lisa.servicios": ServiciosPlaceholder,
  "lisa.compliance": CompliancePlaceholder,
  // lucas (5) — T-2 generic
  "lucas.lanzar": LanzarPlaceholder,
  "lucas.envuelo": EnvueloPlaceholder,
  "lucas.recursos": RecursosPlaceholder,
  "lucas.resultados": ResultadosPlaceholder,
  "lucas.mercado": MercadoPlaceholder,
  // adrian (4) — T-2 generic + T-4 embudo + T-6 inbox
  "adrian.inbox": InboxPlaceholder,
  "adrian.embudo": EmbudoPlaceholder,
  "adrian.outbound": OutboundPlaceholder,
  "adrian.propuestas": PropuestasPlaceholder,
  // valeria (2) — T-2 generic + T-7 agenda
  "valeria.agenda": AgendaPlaceholder,
  "valeria.pacientes": PacientesPlaceholder,
  // camila (4) — T-2 generic + T-8 voz
  "camila.voz": VozPlaceholder,
  "camila.reactivar": ReactivarPlaceholder,
  "camila.multiplicar": MultiplicarPlaceholder,
  "camila.reputacion": ReputacionPlaceholder,
  // config (3) — T-2 generic + T-3 conexiones special
  "config.cuenta": CuentaPlaceholder,
  "config.conexiones": ConexionesPlaceholder,
  "config.avanzado": AvanzadoPlaceholder,
} as const satisfies Record<SubTabKey, PlaceholderComponent>;

// ── Component Props ─────────────────────────────────────────────────────────────
export interface SubTabContentProps {
  agent: RibbonTabSlug;
  subtab: string;
}

/**
 * SubTabContent — dispatches to the correct placeholder for each agent.subtab combo.
 * Server Component (no "use client" — placeholders that need state mark themselves).
 */
export function SubTabContent({ agent, subtab }: SubTabContentProps) {
  const subtabMeta = RIBBON_SUBTABS[agent]?.find((s) => s.id === subtab);
  const key = `${agent}.${subtab}` as SubTabKey;
  const Placeholder = (
    PLACEHOLDER_MAP as Record<string, PlaceholderComponent | undefined>
  )[key];

  return (
    <div className="p-7" data-testid={`subtab-content-${agent}-${subtab}`}>
      <SubTabHeader agent={agent} subtab={subtab} meta={subtabMeta} />
      {Placeholder ? (
        <Placeholder />
      ) : (
        <EmptyState
          icon={subtabMeta?.icon ?? "📄"}
          title={`${subtabMeta?.label ?? subtab} — próximamente`}
          description="Esta vista vive acá. El contenido real se cablea en Fase 2."
        />
      )}
    </div>
  );
}
