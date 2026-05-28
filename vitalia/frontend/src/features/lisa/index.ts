// cap: brand_studio.lisa-marca
// story-origin: vitalia-fase1-s10-TBD
/**
 * lisa/index.ts — Feature public API (FSD-Lite boundary matrix).
 * F1-S10 vitalia-fase1-empty-states
 *
 * Exposes placeholder components created in T-2.
 * Special placeholders (T-3: ServiciosPlaceholder) will be re-exported here by T-3.
 *
 * downstream-regression-na: brand-local FE barrel; no cross-brand consumers
 */

// ── Placeholder components (T-2 generic EmptyState wrappers) ──────────────────
export { MarcaPlaceholder } from "./components/placeholders/MarcaPlaceholder";
export { DoctoresPlaceholder } from "./components/placeholders/DoctoresPlaceholder";
export { CompliancePlaceholder } from "./components/placeholders/CompliancePlaceholder";

// ── Special placeholders (T-3) ─────────────────────────────────────────────────
export { ServiciosPlaceholder } from "./components/placeholders/ServiciosPlaceholder";

// ── Identidad sub-sub-tab (T-5) ────────────────────────────────────────────────
export { IdentidadView } from "./components/marca/identidad/IdentidadView";
export type { IdentidadViewProps } from "./components/marca/identidad/IdentidadView";

// ── Shared components (T-5 / T-6 / T-7) ──────────────────────────────────────
export { AutosaveBadge } from "@/components/marca/shared/AutosaveBadge";
export type { AutosaveStatus, AutosaveBadgeProps } from "@/components/marca/shared/AutosaveBadge";

// ── Voz y tono sub-sub-tab (T-6) ──────────────────────────────────────────────
export { VozTonoView } from "./components/marca/voz-y-tono/VozTonoView";
export type { VozTonoViewProps } from "./components/marca/voz-y-tono/VozTonoView";

export { ArchetypeSelector } from "./components/marca/voz-y-tono/ArchetypeSelector";
export { BrandVoicePreview } from "./components/marca/voz-y-tono/BrandVoicePreview";
export { VoiceTextareaWithWarning } from "./components/marca/voz-y-tono/VoiceTextareaWithWarning";

// ── Presencia sub-sub-tab (T-7) ───────────────────────────────────────────────
export { PresenciaView } from "./components/marca/presencia/PresenciaView";
export type { PresenciaViewProps } from "./components/marca/presencia/PresenciaView";

// ── API (T-5 / T-6 / T-7) ──────────────────────────────────────────────────────
export { marcaKeys } from "./api/marca";
export type { IdentityResponse, VisualsResponse, LogoUploadResponse } from "./api/marca";
export type {
  BrandContactResponse,
  TrustSignalItem,
  TrustSignalsResponse,
  TrustCatalogItem,
  TrustCatalogResponse,
  LocationItem,
  LocationsResponse,
} from "./api/marca-presence-api";
