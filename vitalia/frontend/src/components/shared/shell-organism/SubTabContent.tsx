/**
 * SubTabContent — dispatcher organismo.
 * F1-S10 vitalia-fase1-empty-states — T-1
 *
 * Maps 22 {agent}.{subtab} combos → placeholder component or EmptyState fallback.
 * Consumes RIBBON_SUBTABS SSoT (READ-ONLY) for metadata lookup.
 * PLACEHOLDER_MAP populated in T-2..T-8; stubs use EmptyState until each ticket lands.
 *
 * Architecture invariant (test_subtab_content_uses_ribbon_subtabs_ssot.test.ts):
 *   - SubTabContent imports RIBBON_SUBTABS
 *   - PLACEHOLDER_MAP contains exactly the 22 keys from RIBBON_SUBTABS
 *   - No 'mateo.*' keys (RIBBON_SUBTABS.mateo === [])
 *
 * Server Component default — no "use client" (dispatcher is pure Server).
 * Named export (NO default) per FSD-Lite enforce.
 *
 * NOTE: T-1 delivers this file with EmptyState stubs for all 22 keys.
 * T-2..T-8 will replace stubs with real placeholder components.
 * Architecture test (T-9) enforces the full PLACEHOLDER_MAP population.
 *
 * spec_anchor: 03-arch.md § 4
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import type { ComponentType } from "react";
import type { RibbonTabSlug } from "@/lib/agent-catalog";
import { RIBBON_SUBTABS } from "@/lib/agent-catalog";
import { SubTabHeader } from "./SubTabHeader";
import { EmptyState } from "./EmptyState";

// ── Placeholder stubs (T-1 — replaced by real components in T-2..T-8) ──────────
// Each stub is an EmptyState with the subtab's icon + label.
// This file's PLACEHOLDER_MAP structure is the SSoT for arch fitness test.

type PlaceholderComponent = ComponentType;

// ── Type-safe key derivation ────────────────────────────────────────────────────
type SubTabKey = `${RibbonTabSlug}.${string}`;

// ── Placeholder stubs factory ───────────────────────────────────────────────────
// Inline stubs until T-2..T-8 land real placeholder components.
// Naming matches the agent slice import alias pattern from 03-arch.md § 4.1.

function makeStub(icon: string, label: string): PlaceholderComponent {
  function Stub() {
    return (
      <EmptyState
        icon={icon}
        title={`${label} — próximamente`}
        description="Esta vista vive acá. El contenido real se cablea en Fase 2."
      />
    );
  }
  Stub.displayName = `${label}Stub`;
  return Stub;
}

// ── Stubs for all 22 keys (T-1) ─────────────────────────────────────────────────
// lisa (4)
const LisaMarcaPlaceholder = makeStub("🏥", "Marca");
const LisaDoctoresPlaceholder = makeStub("👨‍⚕️", "Doctores");
const LisaServiciosPlaceholder = makeStub("🩺", "Servicios");
const LisaCompliancePlaceholder = makeStub("🛡️", "Compliance");

// lucas (5)
const LucasLanzarPlaceholder = makeStub("🚀", "Lanzar");
const LucasEnvueloPlaceholder = makeStub("📡", "En vuelo");
const LucasRecursosPlaceholder = makeStub("📚", "Recursos");
const LucasResultadosPlaceholder = makeStub("📈", "Resultados");
const LucasMercadoPlaceholder = makeStub("🌍", "Mercado");

// adrian (4)
const AdrianInboxPlaceholder = makeStub("💬", "Inbox");
const AdrianEmbudoPlaceholder = makeStub("🎯", "Embudo");
const AdrianOutboundPlaceholder = makeStub("📣", "Outbound");
const AdrianPropuestasPlaceholder = makeStub("💼", "Propuestas");

// valeria (2)
const ValeriaAgendaPlaceholder = makeStub("📆", "Agenda");
const ValeriaPacientesPlaceholder = makeStub("👥", "Pacientes");

// camila (4)
const CamilaVozPlaceholder = makeStub("🎤", "Voz del paciente");
const CamilaReactivarPlaceholder = makeStub("🪃", "Reactivar");
const CamilaMultiplicarPlaceholder = makeStub("🤝", "Multiplicar");
const CamilaReputacionPlaceholder = makeStub("📊", "Reputación");

// config (3)
const ConfigCuentaPlaceholder = makeStub("🏢", "Mi cuenta");
const ConfigConexionesPlaceholder = makeStub("🔌", "Conexiones");
const ConfigAvanzadoPlaceholder = makeStub("🔬", "Avanzado");

// ── PLACEHOLDER_MAP — 22 keys, type-safe ─────────────────────────────────────────
// Architecture test verifies this map contains exactly 22 keys from RIBBON_SUBTABS.
// Keys: 'lisa.marca' | 'lisa.doctores' | ... (22 total, no 'mateo.*')
const PLACEHOLDER_MAP = {
  "lisa.marca": LisaMarcaPlaceholder,
  "lisa.doctores": LisaDoctoresPlaceholder,
  "lisa.servicios": LisaServiciosPlaceholder,
  "lisa.compliance": LisaCompliancePlaceholder,
  "lucas.lanzar": LucasLanzarPlaceholder,
  "lucas.envuelo": LucasEnvueloPlaceholder,
  "lucas.recursos": LucasRecursosPlaceholder,
  "lucas.resultados": LucasResultadosPlaceholder,
  "lucas.mercado": LucasMercadoPlaceholder,
  "adrian.inbox": AdrianInboxPlaceholder,
  "adrian.embudo": AdrianEmbudoPlaceholder,
  "adrian.outbound": AdrianOutboundPlaceholder,
  "adrian.propuestas": AdrianPropuestasPlaceholder,
  "valeria.agenda": ValeriaAgendaPlaceholder,
  "valeria.pacientes": ValeriaPacientesPlaceholder,
  "camila.voz": CamilaVozPlaceholder,
  "camila.reactivar": CamilaReactivarPlaceholder,
  "camila.multiplicar": CamilaMultiplicarPlaceholder,
  "camila.reputacion": CamilaReputacionPlaceholder,
  "config.cuenta": ConfigCuentaPlaceholder,
  "config.conexiones": ConfigConexionesPlaceholder,
  "config.avanzado": ConfigAvanzadoPlaceholder,
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
