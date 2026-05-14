/**
 * Core Comunify types — mirror Pydantic response DTOs.
 * All datetimes as ISO 8601 strings. All IDs as strings (UUID).
 */

export type CreatorNiche =
  | "business_coaching"
  | "health_creator"
  | "course_creator"
  | "content_creator"
  | "expert_author"
  | "consultant";

export type Country =
  | "AR" | "CL" | "MX" | "CO" | "PE" | "BR" | "UY" | "US" | "ES";

export type MainLanguage =
  | "es-neutral" | "es-AR" | "es-CL" | "es-MX";

export interface CreatorProfile {
  id: string;
  tenant_id: string;
  creator_name: string;
  creator_handle: string;
  niche: CreatorNiche | null;
  country: Country;
  city: string;
  main_language: MainLanguage;
  bio: string | null;
  avatar_url: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface HandleCheckResult {
  handle: string;
  available: boolean;
  suggestion?: string;
}

export interface BrandStudioSection {
  section_id: string;
  label: string;
  is_complete: boolean;
  has_voice_distilled?: boolean;
}

export interface CompiledVoice {
  identidad: string;
  dialecto: string;
  vocabulario: string[];
  registro: string;
  asi_no: string[];
  anclajes: string[];
  confidence_score: number;
}
