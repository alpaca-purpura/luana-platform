// cap: shell-organism.shell-vitalia
// story-origin: vitalia-fase1-s10-TBD
/**
 * SubTabContent — dispatcher organismo.
 * F1-S10 vitalia-fase1-empty-states — T-9 (PLACEHOLDER_MAP fully populated)
 * F2-S1 vitalia-fase2-valeria-agenda — 07-merge.md W3 cleanup
 *
 * Maps {agent}.{subtab} combos NOT shipped como static route → placeholder
 * component or EmptyState fallback. Static routes (ver SHIPPED_STATIC_SUBTABS
 * en agent-catalog.ts) shadowean al dispatcher dinámico, así que sus keys quedan
 * fuera del mapa para evitar dead-code drift.
 *
 * Consumes RIBBON_SUBTABS SSoT (READ-ONLY) for metadata lookup.
 * Imports placeholder components via each feature's public API (index.ts) per FSD-Lite.
 *
 * Architecture invariants (arch tests T-9 + W3):
 *   - PLACEHOLDER_MAP keys must be a subset of RIBBON_SUBTABS keys (no orphans)
 *   - PLACEHOLDER_MAP === RIBBON_SUBTABS minus SHIPPED_STATIC_SUBTABS (no overlap/missing)
 *   - No hardcoded sub-tab key strings outside this file (arch test enforces)
 *   - No PHI real data in placeholder mock data (hipaa-lite arch test enforces)
 *
 * Server Component default — no "use client" (dispatcher is pure Server).
 * Placeholders that need client state ("use client") mark themselves.
 * Named export (NO default) per FSD-Lite enforce.
 *
 * spec_anchor: 03-arch.md § 4 + archive/.../vitalia-fase2-valeria-agenda/07-merge.md W3
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import type { ComponentType } from "react";
import type { RibbonTabSlug } from "@/lib/agent-catalog";
import { RIBBON_SUBTABS } from "@/lib/agent-catalog";
import { SubTabHeader } from "./SubTabHeader";
import { EmptyState } from "./EmptyState";

// ── Lisa placeholders — via public API (T-2 generic + T-3 special) ───────────────
// lisa.marca is EXCLUDED: shipped as N3-static route (F2-S7 T-4) — see SHIPPED_STATIC_SUBTABS.
import {
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

// ── Valeria placeholders — via public API (T-2 generic) ─────────────────────────
// valeria.agenda no figura: ya tiene ruta estática shipped (F2-S1) — ver SHIPPED_STATIC_SUBTABS.
import { PacientesPlaceholder } from "@/features/valeria";

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

// ── PLACEHOLDER_MAP — 20 keys (RIBBON_SUBTABS - SHIPPED_STATIC_SUBTABS) ──────────
// Architecture test verifies this map === RIBBON_SUBTABS minus SHIPPED_STATIC_SUBTABS.
// Keys: 'lisa.doctores' | ... (no 'mateo.*', no 'valeria.agenda' shipped, no 'lisa.marca' shipped)
// DO NOT hardcode these keys elsewhere — arch test enforces this file as SSoT.
const PLACEHOLDER_MAP = {
  // lisa (3) — T-2 generic + T-3 servicios special (lisa.marca shipped N3-static F2-S7 T-4)
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
  // valeria (1) — T-2 generic (agenda shipped static F2-S1 — ver SHIPPED_STATIC_SUBTABS, lisa.marca shipped F2-S7)
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
