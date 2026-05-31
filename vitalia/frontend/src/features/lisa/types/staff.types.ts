// cap: clinics.lisa.doctores
// story-origin: vitalia-fase2-lisa-doctores
/**
 * staff.types.ts — TypeScript types for Lisa Staff sub-tab.
 *
 * Mirrors Pydantic DTOs from clinics API (camelCase, ISO 8601 datetimes as string).
 * PHI fields masked in list responses (maskedDni, maskedEmail, maskedPhone).
 *
 * Per ADR-vitalia-004 § 3: RQ + Zustand split.
 * Per vitalia/.claude/rules/hipaa-lite.md: PHI dual-filter tenant+clinic.
 *
 * F1 follow-through (audit fix): field names mirror real BE camelCase contract.
 * BE DoctorListItemDTO uses maskedDni (not dniMasked) per alias_generator=to_camel.
 *
 * T-FE-1 vitalia-fase2-lisa-doctores
 * spec_anchor: 03-arch-fe.md § TypeScript Types + 03-arch-be.md § DTOs
 * downstream-regression-na: brand-local vitalia FE types; no cross-brand consumers
 */

// ── List item (PHI masked for listing) ────────────────────────────────────────

export interface DoctorListItem {
  id: string;
  /** camelCase from BE alias_generator=to_camel */
  tenantId?: string;
  clinicId?: string;
  firstName: string;
  lastName: string;
  displayName?: string | null;
  specialty?: string | null;
  active: boolean;
  visibleEnLanding?: boolean;
  yearsExperience?: number | null;
  languages?: string[];
  /** Avatar storage key — no direct URL in list item */
  avatarKey?: string | null;
  /** Patient count — anonymous aggregate, no PHI */
  patientsCount?: number | null;
  /** NPS score — anonymous aggregate, no PHI */
  npsScore?: number | null;
  /**
   * Masked DNI — e.g. "***567".
   * F1 fix: BE returns maskedDni (to_camel of masked_dni), not dniMasked.
   */
  maskedDni?: string | null;
  maskedEmail?: string | null;
  maskedPhone?: string | null;
  createdAt?: string;
  /** avatarUrl is not in list response — only avatarKey. Derived client-side if needed. */
  avatarUrl?: string | null;
}

// ── Doctor detail (full profile, PHI fields shown only to admin_clinic role) ──

export interface DoctorDetail {
  id: string;
  firstName: string;
  lastName: string;
  /** Encrypted at rest — decrypted only for authorized roles */
  dni: string;
  email: string;
  phone?: string | null;
  specialty?: string | null;
  /** Credential code — e.g. CMP number for PE */
  credential: string;
  credentialCountry: CredentialCountry;
  yearsExperience?: number | null;
  languages: string[];
  bioInputsNotes?: string | null;
  bioLinks: string[];
  bioPublic?: BioPublic | null;
  avatarKey?: string | null;
  avatarUrl?: string | null;
  visibleEnLanding: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Bio public sections ────────────────────────────────────────────────────────

export interface BioPublic {
  resumen?: string | null;
  formacion?: string | null;
  enfoque?: string | null;
}

// ── Credential validation (country-specific per business rule) ─────────────────

export type CredentialCountry = "PE" | "AR" | "MX" | "CL";

export const CREDENTIAL_LABELS: Record<CredentialCountry, string> = {
  PE: "CMP",
  AR: "Matrícula nacional",
  MX: "Cédula profesional",
  CL: "Registro nacional",
};

// ── Availability blocks (discriminated union by kind) ──────────────────────────

export type EndConditionKind = "end_date" | "occurrences" | "open_ended";
export type RecurrenceFreq = "weekly" | "biweekly";

export interface RecurrentBlock {
  id: string;
  kind: "recurrent";
  dayOfWeek: number; // 0=Monday..6=Sunday
  startTime: string; // HH:mm 24h
  endTime: string;
  freq: RecurrenceFreq;
  endConditionKind: EndConditionKind;
  endDate?: string | null; // ISO 8601 date
  occurrences?: number | null;
}

export interface OneOffBlock {
  id: string;
  kind: "one_off";
  specificDate: string; // ISO 8601 date
  startTime: string;
  endTime: string;
}

export type AvailabilityBlock = RecurrentBlock | OneOffBlock;

// ── Asset upload response ──────────────────────────────────────────────────────

export interface AssetUploadResponse {
  key: string;
  url: string;
}

// ── API pagination ─────────────────────────────────────────────────────────────

export interface PaginatedDoctors {
  items: DoctorListItem[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Staff filters (URL searchParams) ──────────────────────────────────────────

export interface StaffFilters {
  q?: string;
  specialty?: string;
  active?: "true" | "false" | "";
  page?: number;
}
